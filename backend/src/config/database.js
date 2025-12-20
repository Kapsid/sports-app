const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

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

  saveDatabase();
  console.log('Database initialized successfully');
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

function get(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
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
      results.push(stmt.getAsObject());
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
