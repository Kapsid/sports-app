const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../data/wintersim.db');
const dataDir = path.dirname(dbPath);

let db = null;

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Initialize database
async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sports table (predefined sports)
  db.run(`
    CREATE TABLE IF NOT EXISTS sports (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User worlds table (each user has their own worlds)
  db.run(`
    CREATE TABLE IF NOT EXISTS worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // World sports configuration (which sports are enabled in a world)
  db.run(`
    CREATE TABLE IF NOT EXISTS world_sports (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
      UNIQUE(world_id, sport_id)
    )
  `);

  // Athletes table (per world)
  db.run(`
    CREATE TABLE IF NOT EXISTS athletes (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      rating INTEGER DEFAULT 50,
      stats TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
    )
  `);

  // Competitions table
  db.run(`
    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      date TEXT,
      status TEXT DEFAULT 'scheduled',
      results TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
    )
  `);

  // Ski Jumping specific tables

  // Jumpers table (per world, for ski-jumping sport only)
  db.run(`
    CREATE TABLE IF NOT EXISTS jumpers (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_jumping INTEGER DEFAULT 70,
      skill_flight INTEGER DEFAULT 70,
      skill_landing INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Seasons table (per world/sport)
  db.run(`
    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
    )
  `);

  // Season events table
  db.run(`
    CREATE TABLE IF NOT EXISTS season_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      hill_size TEXT NOT NULL,
      k_point INTEGER DEFAULT 120,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      results TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
    )
  `);

  // Season history table (stores top 10 from each completed season)
  db.run(`
    CREATE TABLE IF NOT EXISTS season_history (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      sport_id TEXT NOT NULL,
      season_name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      top_10 TEXT NOT NULL,
      total_races INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Teams table (per world)
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT,
      logo_url TEXT,
      color TEXT DEFAULT '#3b82f6',
      description TEXT,
      sport TEXT DEFAULT 'skijumping',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Add team_id column to jumpers if not exists
  try {
    db.run('ALTER TABLE jumpers ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE SET NULL');
  } catch (e) {
    // Column might already exist
  }

  // Add four_hills_standings column to seasons if not exists
  try {
    db.run('ALTER TABLE seasons ADD COLUMN four_hills_standings TEXT DEFAULT \'[]\'');
  } catch (e) {
    // Column might already exist
  }

  // Add flying_cup_standings column to seasons if not exists
  try {
    db.run('ALTER TABLE seasons ADD COLUMN flying_cup_standings TEXT DEFAULT \'[]\'');
  } catch (e) {
    // Column might already exist
  }

  // Add tournament column to season_events if not exists
  try {
    db.run('ALTER TABLE season_events ADD COLUMN tournament TEXT');
  } catch (e) {
    // Column might already exist
  }

  // Add sport column to teams if not exists
  try {
    db.run('ALTER TABLE teams ADD COLUMN sport TEXT DEFAULT \'skijumping\'');
  } catch (e) {
    // Column might already exist
  }

  // Biathlon specific tables

  // Biathletes table (per world, for biathlon sport only)
  db.run(`
    CREATE TABLE IF NOT EXISTS biathletes (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_skiing INTEGER DEFAULT 70,
      skill_shooting_prone INTEGER DEFAULT 70,
      skill_shooting_standing INTEGER DEFAULT 70,
      skill_endurance INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Biathlon seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS biathlon_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      sprint_standings TEXT DEFAULT '[]',
      pursuit_standings TEXT DEFAULT '[]',
      individual_standings TEXT DEFAULT '[]',
      mass_start_standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Biathlon events table
  db.run(`
    CREATE TABLE IF NOT EXISTS biathlon_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      race_type TEXT NOT NULL,
      distance REAL NOT NULL,
      shootings INTEGER DEFAULT 2,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      results TEXT DEFAULT '[]',
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES biathlon_seasons(id) ON DELETE CASCADE
    )
  `);

  // Cross-Country specific tables

  // Cross-country skiers table
  db.run(`
    CREATE TABLE IF NOT EXISTS xcskiers (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_classic INTEGER DEFAULT 70,
      skill_skating INTEGER DEFAULT 70,
      skill_sprint INTEGER DEFAULT 70,
      skill_distance INTEGER DEFAULT 70,
      skill_endurance INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Cross-country seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS xc_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      sprint_standings TEXT DEFAULT '[]',
      distance_standings TEXT DEFAULT '[]',
      tour_standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Cross-country events table
  db.run(`
    CREATE TABLE IF NOT EXISTS xc_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      race_type TEXT NOT NULL,
      technique TEXT NOT NULL,
      distance REAL NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      results TEXT DEFAULT '[]',
      tour_stage INTEGER DEFAULT 0,
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES xc_seasons(id) ON DELETE CASCADE
    )
  `);

  // Alpine Skiing specific tables

  // Alpine skiers table
  db.run(`
    CREATE TABLE IF NOT EXISTS alpine_skiers (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_speed INTEGER DEFAULT 70,
      skill_technical INTEGER DEFAULT 70,
      skill_gliding INTEGER DEFAULT 70,
      skill_turns INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Alpine seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS alpine_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      downhill_standings TEXT DEFAULT '[]',
      super_g_standings TEXT DEFAULT '[]',
      giant_slalom_standings TEXT DEFAULT '[]',
      slalom_standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Alpine events table
  db.run(`
    CREATE TABLE IF NOT EXISTS alpine_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      discipline TEXT NOT NULL,
      runs INTEGER DEFAULT 1,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      results TEXT DEFAULT '[]',
      run1_results TEXT DEFAULT '[]',
      run2_results TEXT DEFAULT '[]',
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES alpine_seasons(id) ON DELETE CASCADE
    )
  `);

  // Nordic Combined specific tables

  // Nordic Combined athletes table
  db.run(`
    CREATE TABLE IF NOT EXISTS nc_athletes (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_jumping INTEGER DEFAULT 70,
      skill_flight INTEGER DEFAULT 70,
      skill_landing INTEGER DEFAULT 70,
      skill_skiing INTEGER DEFAULT 70,
      skill_endurance INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      team_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Nordic Combined seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS nc_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Nordic Combined events table
  db.run(`
    CREATE TABLE IF NOT EXISTS nc_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      hill_size TEXT DEFAULT 'normal',
      k_point INTEGER DEFAULT 98,
      xc_distance REAL DEFAULT 10,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      jump_results TEXT DEFAULT '[]',
      xc_results TEXT DEFAULT '[]',
      final_results TEXT DEFAULT '[]',
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES nc_seasons(id) ON DELETE CASCADE
    )
  `);

  // Bobsleigh specific tables

  // Bobsleigh teams table (4-man bobsled teams)
  db.run(`
    CREATE TABLE IF NOT EXISTS bobsleigh_teams (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      runner1_name TEXT NOT NULL,
      runner2_name TEXT NOT NULL,
      runner3_name TEXT NOT NULL,
      runner4_name TEXT NOT NULL,
      skill_push INTEGER DEFAULT 70,
      skill_pilot INTEGER DEFAULT 70,
      skill_crew INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Bobsleigh seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS bobsleigh_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Bobsleigh events table
  db.run(`
    CREATE TABLE IF NOT EXISTS bobsleigh_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      track_length INTEGER DEFAULT 1400,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      runs INTEGER DEFAULT 2,
      run1_results TEXT DEFAULT '[]',
      run2_results TEXT DEFAULT '[]',
      run3_results TEXT DEFAULT '[]',
      run4_results TEXT DEFAULT '[]',
      results TEXT DEFAULT '[]',
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES bobsleigh_seasons(id) ON DELETE CASCADE
    )
  `);

  // Migrate bobsleigh_events: add missing columns if not exists
  try {
    db.run('ALTER TABLE bobsleigh_events ADD COLUMN runs INTEGER DEFAULT 2');
  } catch (e) {
    // Column might already exist
  }
  try {
    db.run('ALTER TABLE bobsleigh_events ADD COLUMN run3_results TEXT DEFAULT \'[]\'');
  } catch (e) {
    // Column might already exist
  }
  try {
    db.run('ALTER TABLE bobsleigh_events ADD COLUMN run4_results TEXT DEFAULT \'[]\'');
  } catch (e) {
    // Column might already exist
  }

  // Luge specific tables

  // Luge athletes table (individual athletes)
  db.run(`
    CREATE TABLE IF NOT EXISTS luge_athletes (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      team_id TEXT,
      skill_start INTEGER DEFAULT 70,
      skill_steering INTEGER DEFAULT 70,
      skill_lines INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Luge seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS luge_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Luge events table
  db.run(`
    CREATE TABLE IF NOT EXISTS luge_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      track_length INTEGER DEFAULT 1400,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      runs INTEGER DEFAULT 2,
      run1_results TEXT DEFAULT '[]',
      run2_results TEXT DEFAULT '[]',
      run3_results TEXT DEFAULT '[]',
      run4_results TEXT DEFAULT '[]',
      results TEXT DEFAULT '[]',
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES luge_seasons(id) ON DELETE CASCADE
    )
  `);

  // Skeleton specific tables

  // Skeleton athletes table (individual athletes)
  db.run(`
    CREATE TABLE IF NOT EXISTS skeleton_athletes (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      team_id TEXT,
      skill_start INTEGER DEFAULT 70,
      skill_steering INTEGER DEFAULT 70,
      skill_lines INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Skeleton seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS skeleton_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Skeleton events table
  db.run(`
    CREATE TABLE IF NOT EXISTS skeleton_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      track_length INTEGER DEFAULT 1400,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      runs INTEGER DEFAULT 2,
      run1_results TEXT DEFAULT '[]',
      run2_results TEXT DEFAULT '[]',
      run3_results TEXT DEFAULT '[]',
      run4_results TEXT DEFAULT '[]',
      results TEXT DEFAULT '[]',
      championship INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES skeleton_seasons(id) ON DELETE CASCADE
    )
  `);

  // Add team_id column to luge_athletes if not exists
  try {
    db.run('ALTER TABLE luge_athletes ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE SET NULL');
  } catch (e) {
    // Column might already exist
  }

  // Add team_id column to skeleton_athletes if not exists
  try {
    db.run('ALTER TABLE skeleton_athletes ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE SET NULL');
  } catch (e) {
    // Column might already exist
  }

  // Speed Skating specific tables

  // Speed skaters table
  db.run(`
    CREATE TABLE IF NOT EXISTS speed_skaters (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      team_id TEXT,
      skill_acceleration INTEGER DEFAULT 70,
      skill_cornering INTEGER DEFAULT 70,
      skill_endurance INTEGER DEFAULT 70,
      skill_pace_control INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      specialty TEXT DEFAULT 'all-round',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `);

  // Speed skating seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS speed_skating_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      discipline_standings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )
  `);

  // Speed skating events table
  db.run(`
    CREATE TABLE IF NOT EXISTS speed_skating_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      altitude INTEGER DEFAULT 0,
      distance INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      heats TEXT DEFAULT '[]',
      results TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES speed_skating_seasons(id) ON DELETE CASCADE
    )
  `);

  // Handball specific tables

  // Handball worlds table
  db.run(`
    CREATE TABLE IF NOT EXISTS handball_worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Handball teams table
  db.run(`
    CREATE TABLE IF NOT EXISTS handball_teams (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      city TEXT NOT NULL,
      logo TEXT,
      power INTEGER DEFAULT 70,
      attack INTEGER DEFAULT 70,
      defense INTEGER DEFAULT 70,
      goalkeeper INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      is_user_team INTEGER DEFAULT 0,
      league TEXT DEFAULT 'extraliga',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES handball_worlds(id) ON DELETE CASCADE
    )
  `);

  // Handball seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS handball_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      phase TEXT DEFAULT 'regular',
      current_round INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      final_standings TEXT DEFAULT '[]',
      playoff_bracket TEXT DEFAULT '[]',
      playout_bracket TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES handball_worlds(id) ON DELETE CASCADE
    )
  `);

  // Handball matches table
  db.run(`
    CREATE TABLE IF NOT EXISTS handball_matches (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      phase TEXT DEFAULT 'regular',
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      home_halftime INTEGER,
      away_halftime INTEGER,
      status TEXT DEFAULT 'scheduled',
      match_events TEXT DEFAULT '[]',
      date TEXT,
      playoff_round TEXT,
      series_index INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES handball_seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (home_team_id) REFERENCES handball_teams(id),
      FOREIGN KEY (away_team_id) REFERENCES handball_teams(id)
    )
  `);

  // Add league2_standings column to handball_seasons if not exists
  try {
    db.run('ALTER TABLE handball_seasons ADD COLUMN league2_standings TEXT DEFAULT \'[]\'');
  } catch (e) {
    // Column might already exist
  }

  // Add playout_data column to handball_seasons if not exists
  try {
    db.run('ALTER TABLE handball_seasons ADD COLUMN playout_data TEXT DEFAULT \'{}\'');
  } catch (e) {
    // Column might already exist
  }

  // Handball season history table
  db.run(`
    CREATE TABLE IF NOT EXISTS handball_season_history (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      season_name TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER NOT NULL,
      champion_id TEXT NOT NULL,
      champion_name TEXT NOT NULL,
      runner_up_id TEXT NOT NULL,
      runner_up_name TEXT NOT NULL,
      third_place_id TEXT NOT NULL,
      third_place_name TEXT NOT NULL,
      final_standings TEXT DEFAULT '[]',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES handball_worlds(id) ON DELETE CASCADE
    )
  `);

  // Ice Hockey World Championship tables

  // Hockey worlds table
  db.run(`
    CREATE TABLE IF NOT EXISTS hockey_worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Hockey teams table (national teams)
  db.run(`
    CREATE TABLE IF NOT EXISTS hockey_teams (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      country_code TEXT NOT NULL,
      flag TEXT,
      power INTEGER DEFAULT 70,
      offense INTEGER DEFAULT 70,
      defense INTEGER DEFAULT 70,
      goaltending INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      division TEXT DEFAULT 'top',
      group_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES hockey_worlds(id) ON DELETE CASCADE
    )
  `);

  // Hockey seasons table (each championship year)
  db.run(`
    CREATE TABLE IF NOT EXISTS hockey_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      phase TEXT DEFAULT 'group',
      group_a_standings TEXT DEFAULT '[]',
      group_b_standings TEXT DEFAULT '[]',
      div2_standings TEXT DEFAULT '[]',
      playoff_bracket TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES hockey_worlds(id) ON DELETE CASCADE
    )
  `);

  // Hockey matches table
  db.run(`
    CREATE TABLE IF NOT EXISTS hockey_matches (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      stage TEXT DEFAULT 'group',
      group_name TEXT,
      round_number INTEGER DEFAULT 1,
      playoff_round TEXT,
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      overtime INTEGER DEFAULT 0,
      shootout INTEGER DEFAULT 0,
      period_scores TEXT DEFAULT '[]',
      status TEXT DEFAULT 'scheduled',
      match_events TEXT DEFAULT '[]',
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES hockey_seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (home_team_id) REFERENCES hockey_teams(id),
      FOREIGN KEY (away_team_id) REFERENCES hockey_teams(id)
    )
  `);

  // Migration: Add round_number column if it doesn't exist
  try {
    db.run(`ALTER TABLE hockey_matches ADD COLUMN round_number INTEGER DEFAULT 1`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: Add host columns to hockey_seasons
  try { db.run('ALTER TABLE hockey_seasons ADD COLUMN host_country TEXT'); } catch (e) {}
  try { db.run('ALTER TABLE hockey_seasons ADD COLUMN host_cities TEXT'); } catch (e) {}
  try { db.run('ALTER TABLE hockey_seasons ADD COLUMN host_country_code TEXT'); } catch (e) {}

  // Migration: Add world_ranking column to hockey_teams
  try { db.run('ALTER TABLE hockey_teams ADD COLUMN world_ranking INTEGER DEFAULT 99'); } catch (e) {}

  // Backfill world_ranking for existing worlds where all teams are still at default 99
  try {
    const stmt = db.prepare('SELECT DISTINCT world_id FROM hockey_teams WHERE world_ranking = 99');
    const worldIds = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const wid = row.world_id instanceof Uint8Array ? Buffer.from(row.world_id).toString('utf8') : row.world_id;
      worldIds.push(wid);
    }
    stmt.free();
    for (const wid of worldIds) {
      const tStmt = db.prepare('SELECT id FROM hockey_teams WHERE world_id = ? ORDER BY power DESC');
      tStmt.bind([wid]);
      let rank = 1;
      while (tStmt.step()) {
        const tRow = tStmt.getAsObject();
        const tid = tRow.id instanceof Uint8Array ? Buffer.from(tRow.id).toString('utf8') : tRow.id;
        db.run('UPDATE hockey_teams SET world_ranking = ? WHERE id = ?', [rank, tid]);
        rank++;
      }
      tStmt.free();
    }
  } catch (e) {
    console.error('Error backfilling world_ranking:', e);
  }

  // Migration: Add host columns to hockey_season_history
  try { db.run('ALTER TABLE hockey_season_history ADD COLUMN host_country TEXT'); } catch (e) {}
  try { db.run('ALTER TABLE hockey_season_history ADD COLUMN host_cities TEXT'); } catch (e) {}
  try { db.run('ALTER TABLE hockey_season_history ADD COLUMN host_country_code TEXT'); } catch (e) {}
  try { db.run('ALTER TABLE hockey_season_history ADD COLUMN season_id TEXT'); } catch (e) {}

  // Hockey players table (individual players per national team)
  db.run(`
    CREATE TABLE IF NOT EXISTS hockey_players (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country_code TEXT NOT NULL,
      position TEXT NOT NULL,
      jersey_number INTEGER NOT NULL,
      shooting INTEGER DEFAULT 70,
      skating INTEGER DEFAULT 70,
      passing INTEGER DEFAULT 70,
      defense_skill INTEGER DEFAULT 70,
      physical INTEGER DEFAULT 70,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES hockey_worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES hockey_teams(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add all_stars column to hockey_seasons
  try { db.run('ALTER TABLE hockey_seasons ADD COLUMN all_stars TEXT'); } catch (e) {}

  // Hockey season history table
  db.run(`
    CREATE TABLE IF NOT EXISTS hockey_season_history (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      gold_team_id TEXT NOT NULL,
      gold_team_name TEXT NOT NULL,
      silver_team_id TEXT NOT NULL,
      silver_team_name TEXT NOT NULL,
      bronze_team_id TEXT NOT NULL,
      bronze_team_name TEXT NOT NULL,
      promoted_teams TEXT DEFAULT '[]',
      relegated_teams TEXT DEFAULT '[]',
      final_standings TEXT DEFAULT '[]',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES hockey_worlds(id) ON DELETE CASCADE
    )
  `);

  // Summer Sports specific tables

  // Summer Sports worlds table (separate from winter sports worlds)
  db.run(`
    CREATE TABLE IF NOT EXISTS summer_worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tennis specific tables

  // Tennis worlds table (separate from winter sports worlds)
  db.run(`
    CREATE TABLE IF NOT EXISTS tennis_worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tennis players table
  db.run(`
    CREATE TABLE IF NOT EXISTS tennis_players (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_serve INTEGER DEFAULT 70,
      skill_forehand INTEGER DEFAULT 70,
      skill_backhand INTEGER DEFAULT 70,
      skill_volley INTEGER DEFAULT 70,
      skill_movement INTEGER DEFAULT 70,
      skill_mental INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      specialty TEXT DEFAULT 'all-round',
      ranking_points INTEGER DEFAULT 0,
      career_high_ranking INTEGER DEFAULT NULL,
      career_titles INTEGER DEFAULT 0,
      career_gs_titles INTEGER DEFAULT 0,
      best_aus TEXT DEFAULT NULL,
      best_fra TEXT DEFAULT NULL,
      best_wim TEXT DEFAULT NULL,
      best_uso TEXT DEFAULT NULL,
      matches_won INTEGER DEFAULT 0,
      matches_lost INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES tennis_worlds(id) ON DELETE CASCADE
    )
  `);

  // Add new columns to tennis_players if they don't exist (migrations)
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN career_high_ranking INTEGER DEFAULT NULL`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN career_titles INTEGER DEFAULT 0`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN career_gs_titles INTEGER DEFAULT 0`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN best_aus TEXT DEFAULT NULL`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN best_fra TEXT DEFAULT NULL`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN best_wim TEXT DEFAULT NULL`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN best_uso TEXT DEFAULT NULL`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN matches_won INTEGER DEFAULT 0`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_players ADD COLUMN matches_lost INTEGER DEFAULT 0`); } catch (e) {}

  // Tennis matches table for storing match history
  db.run(`
    CREATE TABLE IF NOT EXISTS tennis_matches (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      round TEXT NOT NULL,
      match_number INTEGER NOT NULL,
      player1_id TEXT,
      player2_id TEXT,
      player1_seed INTEGER,
      player2_seed INTEGER,
      winner_id TEXT,
      score TEXT,
      sets TEXT,
      best_of INTEGER DEFAULT 3,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES tennis_events(id) ON DELETE CASCADE,
      FOREIGN KEY (player1_id) REFERENCES tennis_players(id) ON DELETE SET NULL,
      FOREIGN KEY (player2_id) REFERENCES tennis_players(id) ON DELETE SET NULL
    )
  `);

  // Add new columns to tennis_matches if they don't exist (migrations)
  try { db.run(`ALTER TABLE tennis_matches ADD COLUMN player1_seed INTEGER`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_matches ADD COLUMN player2_seed INTEGER`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_matches ADD COLUMN best_of INTEGER DEFAULT 3`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_matches ADD COLUMN player1_rank INTEGER`); } catch (e) {}
  try { db.run(`ALTER TABLE tennis_matches ADD COLUMN player2_rank INTEGER`); } catch (e) {}

  // Tennis seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS tennis_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES tennis_worlds(id) ON DELETE CASCADE
    )
  `);

  // Tennis tournaments/events table
  db.run(`
    CREATE TABLE IF NOT EXISTS tennis_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      surface TEXT NOT NULL,
      tournament_type TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      draw_size INTEGER DEFAULT 32,
      date TEXT NOT NULL,
      end_date TEXT,
      status TEXT DEFAULT 'scheduled',
      results TEXT DEFAULT '[]',
      rounds TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES tennis_seasons(id) ON DELETE CASCADE
    )
  `);

  // Golf specific tables

  // Golf worlds table
  db.run(`
    CREATE TABLE IF NOT EXISTS golf_worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Golf players table
  db.run(`
    CREATE TABLE IF NOT EXISTS golf_players (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      country TEXT NOT NULL,
      skill_driving INTEGER DEFAULT 70,
      skill_iron_play INTEGER DEFAULT 70,
      skill_short_game INTEGER DEFAULT 70,
      skill_putting INTEGER DEFAULT 70,
      skill_mental INTEGER DEFAULT 70,
      consistency INTEGER DEFAULT 70,
      form INTEGER DEFAULT 70,
      ranking_points INTEGER DEFAULT 0,
      career_wins INTEGER DEFAULT 0,
      career_major_wins INTEGER DEFAULT 0,
      career_top10s INTEGER DEFAULT 0,
      tournaments_played INTEGER DEFAULT 0,
      best_finish INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES golf_worlds(id) ON DELETE CASCADE
    )
  `);

  // Golf seasons table
  db.run(`
    CREATE TABLE IF NOT EXISTS golf_seasons (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_event_index INTEGER DEFAULT 0,
      standings TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (world_id) REFERENCES golf_worlds(id) ON DELETE CASCADE
    )
  `);

  // Golf events table
  db.run(`
    CREATE TABLE IF NOT EXISTS golf_events (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      event_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      course_name TEXT NOT NULL,
      course_par INTEGER DEFAULT 72,
      tournament_type TEXT NOT NULL,
      field_size INTEGER DEFAULT 120,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'upcoming',
      round1_results TEXT DEFAULT '[]',
      round2_results TEXT DEFAULT '[]',
      round3_results TEXT DEFAULT '[]',
      round4_results TEXT DEFAULT '[]',
      cut_line INTEGER,
      results TEXT DEFAULT '[]',
      current_round INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES golf_seasons(id) ON DELETE CASCADE
    )
  `);

  // MMA specific tables

  // MMA organizations table
  db.run(`
    CREATE TABLE IF NOT EXISTS mma_organizations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT,
      description TEXT,
      event_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // MMA fighters table
  db.run(`
    CREATE TABLE IF NOT EXISTS mma_fighters (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      nickname TEXT,
      gender TEXT DEFAULT 'men',
      weight_class INTEGER NOT NULL,
      country_code TEXT NOT NULL,
      striking INTEGER DEFAULT 70,
      grappling INTEGER DEFAULT 70,
      wrestling INTEGER DEFAULT 70,
      cardio INTEGER DEFAULT 70,
      chin INTEGER DEFAULT 70,
      power INTEGER DEFAULT 70,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      ko_wins INTEGER DEFAULT 0,
      sub_wins INTEGER DEFAULT 0,
      dec_wins INTEGER DEFAULT 0,
      ranking INTEGER DEFAULT 99,
      is_champion INTEGER DEFAULT 0,
      title_defenses INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES mma_organizations(id) ON DELETE CASCADE
    )
  `);

  // MMA events table
  db.run(`
    CREATE TABLE IF NOT EXISTS mma_events (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      event_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      venue TEXT,
      theme_color TEXT DEFAULT '#dc2626',
      theme_name TEXT,
      theme_icon TEXT,
      status TEXT DEFAULT 'scheduled',
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES mma_organizations(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add theme_name and theme_icon columns to mma_events if not exists
  try {
    db.run('ALTER TABLE mma_events ADD COLUMN theme_name TEXT');
  } catch (e) {
    // Column might already exist
  }
  try {
    db.run('ALTER TABLE mma_events ADD COLUMN theme_icon TEXT');
  } catch (e) {
    // Column might already exist
  }

  // Migration: Add win_streak and loss_streak columns to mma_fighters for form-based rankings
  try {
    db.run('ALTER TABLE mma_fighters ADD COLUMN win_streak INTEGER DEFAULT 0');
  } catch (e) {
    // Column might already exist
  }
  try {
    db.run('ALTER TABLE mma_fighters ADD COLUMN loss_streak INTEGER DEFAULT 0');
  } catch (e) {
    // Column might already exist
  }
  // Migration: Add title_reigns column to track how many times fighter has been champion
  try {
    db.run('ALTER TABLE mma_fighters ADD COLUMN title_reigns INTEGER DEFAULT 0');
  } catch (e) {
    // Column might already exist
  }

  // MMA fights table
  db.run(`
    CREATE TABLE IF NOT EXISTS mma_fights (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      fighter1_id TEXT NOT NULL,
      fighter2_id TEXT NOT NULL,
      card_position TEXT DEFAULT 'prelim',
      fight_order INTEGER NOT NULL,
      is_title_fight INTEGER DEFAULT 0,
      weight_class INTEGER NOT NULL,
      winner_id TEXT,
      method TEXT,
      round INTEGER,
      time TEXT,
      fight_stats TEXT DEFAULT '{}',
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES mma_events(id) ON DELETE CASCADE,
      FOREIGN KEY (fighter1_id) REFERENCES mma_fighters(id),
      FOREIGN KEY (fighter2_id) REFERENCES mma_fighters(id)
    )
  `);

  // Global sportsmen name database (user-scoped, across all worlds/sports)
  db.run(`
    CREATE TABLE IF NOT EXISTS sportsmen (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      country_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed default sports if not exist
  const sports = [
    { id: 'ski-jumping', name: 'Ski Jumping', icon: 'fa-person-skiing', description: 'Compete in ski jumping competitions' },
    { id: 'biathlon', name: 'Biathlon', icon: 'fa-bullseye', description: 'Cross-country skiing with rifle shooting' },
    { id: 'cross-country', name: 'Cross Country Skiing', icon: 'fa-person-skiing-nordic', description: 'Long-distance skiing races' },
    { id: 'nordic-combined', name: 'Nordic Combined', icon: 'fa-medal', description: 'Ski jumping and cross-country skiing combined' },
    { id: 'alpine-skiing', name: 'Alpine Skiing', icon: 'fa-person-skiing', description: 'Downhill and slalom skiing races' },
    { id: 'luge', name: 'Luge', icon: 'fa-sled', description: 'High-speed luge sled racing' },
    { id: 'bobsleigh', name: 'Bobsleigh', icon: 'fa-sled', description: 'High-speed bobsled racing' },
    { id: 'skeleton', name: 'Skeleton', icon: 'fa-person-falling', description: 'Head-first sled racing' },
    { id: 'speed-skating', name: 'Speed Skating', icon: 'fa-person-skating', description: 'Ice speed skating competitions' }
  ];

  for (const sport of sports) {
    // Insert or ignore if already exists
    try {
      db.run(
        'INSERT OR IGNORE INTO sports (id, name, icon, description) VALUES (?, ?, ?, ?)',
        [sport.id, sport.name, sport.icon, sport.description]
      );
    } catch (e) {
      // Sport might already exist
    }
  }

  // Seed default admin user (for production deployment)
  await seedDefaultUser();

  saveDatabase();
  console.log('Database initialized successfully');
}

// Seed default user if not exists or update password
async function seedDefaultUser() {
  const defaultUsers = [
    {
      email: 'urbanczyk.martin@seznam.cz',
      username: 'Kapsid',
      password: 'F2d4CW9s'
    }
  ];

  for (const user of defaultUsers) {
    const existingUser = get('SELECT id FROM users WHERE email = ?', [user.email]);
    const hashedPassword = await bcrypt.hash(user.password, 10);

    if (existingUser) {
      // Update password for existing user
      db.run(
        'UPDATE users SET password = ?, updated_at = datetime("now") WHERE email = ?',
        [hashedPassword, user.email]
      );
      console.log(`Updated password for user: ${user.email}`);
    } else {
      // Create new user
      const id = uuidv4();
      db.run(
        'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
        [id, user.username, user.email, hashedPassword]
      );
      console.log(`Created default user: ${user.email}`);
    }
  }
}

// Helper functions to work with the database
function getDb() {
  return db;
}

function run(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  try {
    db.run(sql, params);
    saveDatabase();
  } catch (error) {
    console.error('Database run error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

// sql.js getAsObject() returns Uint8Array for TEXT columns - decode them to strings
function decodeRow(row) {
  const decoded = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Uint8Array) {
      decoded[key] = Buffer.from(value).toString('utf8');
    } else {
      decoded[key] = value;
    }
  }
  return decoded;
}

function get(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = decodeRow(stmt.getAsObject());
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (error) {
    console.error('Database get error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

function all(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(decodeRow(stmt.getAsObject()));
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Database all error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

module.exports = { initializeDatabase, getDb, run, get, all, saveDatabase };
