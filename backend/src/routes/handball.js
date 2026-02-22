const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const {
  czechExtraligaTeams,
  czechSecondLeagueTeams,
  generateLeagueSchedule,
  simulateMatch,
  calculateStandings
} = require('../data/handballTeams');

const router = express.Router();

// ==================== WORLDS ====================

// Get all handball worlds for current user
router.get('/worlds', authMiddleware, (req, res) => {
  try {
    const worlds = all(`
      SELECT * FROM handball_worlds
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json({ worlds });
  } catch (error) {
    console.error('Error fetching handball worlds:', error);
    res.status(500).json({ error: 'Failed to fetch worlds' });
  }
});

// Get world by ID
router.get('/worlds/:id', authMiddleware, (req, res) => {
  try {
    const world = get(
      'SELECT * FROM handball_worlds WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Get current season
    const currentSeason = get(`
      SELECT * FROM handball_seasons
      WHERE world_id = ?
      ORDER BY year_start DESC LIMIT 1
    `, [req.params.id]);

    // If no active season or season is completed, clean up teams
    if (!currentSeason || currentSeason.status === 'completed') {
      // Delete any League 2 teams
      run('DELETE FROM handball_teams WHERE world_id = ? AND league = ?', [req.params.id, 'league2']);

      // Check for duplicates and wrong team count
      let allTeams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [req.params.id, 'extraliga']);

      // Remove duplicates
      const seenNames = new Set();
      const duplicateIds = [];
      for (const team of allTeams) {
        if (seenNames.has(team.short_name)) {
          duplicateIds.push(team.id);
        } else {
          seenNames.add(team.short_name);
        }
      }
      if (duplicateIds.length > 0) {
        run(`DELETE FROM handball_teams WHERE id IN (${duplicateIds.map(() => '?').join(',')})`, duplicateIds);
      }

      // If wrong number of teams, reset them
      const teamCount = all('SELECT COUNT(*) as count FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [req.params.id, 'extraliga'])[0].count;
      if (teamCount !== 12) {
        console.log(`World ${req.params.id}: Found ${teamCount} teams, resetting to 12`);
        run('DELETE FROM handball_teams WHERE world_id = ?', [req.params.id]);
        for (const team of czechExtraligaTeams) {
          const teamId = uuidv4();
          run(`
            INSERT INTO handball_teams (id, world_id, name, short_name, city, logo, power, attack, defense, goalkeeper, league)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'extraliga')
          `, [teamId, req.params.id, team.name, team.shortName, team.city, team.logo, team.power, team.attack, team.defense, team.goalkeeper]);
        }
      }
    }

    // Get teams for this world
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL) ORDER BY power DESC', [req.params.id, 'extraliga']);

    res.json({ world: { ...world, teams, currentSeason } });
  } catch (error) {
    console.error('Error fetching handball world:', error);
    res.status(500).json({ error: 'Failed to fetch world' });
  }
});

// Create new world with teams
router.post('/worlds', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'World name is required' });
    }

    const worldId = uuidv4();
    run(
      'INSERT INTO handball_worlds (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [worldId, req.user.id, name, description || '']
    );

    // Create teams from Czech Extraliga
    for (const team of czechExtraligaTeams) {
      const teamId = uuidv4();
      run(`
        INSERT INTO handball_teams (id, world_id, name, short_name, city, logo, power, attack, defense, goalkeeper, form)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [teamId, worldId, team.name, team.shortName, team.city, team.logo, team.power, team.attack, team.defense, team.goalkeeper, 70]);
    }

    const world = get('SELECT * FROM handball_worlds WHERE id = ?', [worldId]);
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ?', [worldId]);

    res.status(201).json({ world: { ...world, teams } });
  } catch (error) {
    console.error('Error creating handball world:', error);
    res.status(500).json({ error: 'Failed to create world' });
  }
});

// Delete world
router.delete('/worlds/:id', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM handball_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Delete all related data first (matches, seasons, teams)
    const seasons = all('SELECT id FROM handball_seasons WHERE world_id = ?', [req.params.id]);
    for (const season of seasons) {
      run('DELETE FROM handball_matches WHERE season_id = ?', [season.id]);
    }
    run('DELETE FROM handball_seasons WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM handball_teams WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM handball_worlds WHERE id = ?', [req.params.id]);

    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting handball world:', error);
    res.status(500).json({ error: 'Failed to delete world' });
  }
});

// Fix team swap - manually swap a relegated team with a promoted team
router.post('/worlds/:id/fix-swap', authMiddleware, (req, res) => {
  try {
    const { relegatedTeam, promotedTeam } = req.body;
    const world = get('SELECT * FROM handball_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Find the relegated team
    const teamToRemove = get('SELECT * FROM handball_teams WHERE world_id = ? AND short_name = ?', [req.params.id, relegatedTeam]);
    if (!teamToRemove) {
      return res.status(404).json({ error: `Team ${relegatedTeam} not found` });
    }

    // Find the promoted team data from czechSecondLeagueTeams
    const promotedData = czechSecondLeagueTeams.find(t => t.shortName === promotedTeam);
    if (!promotedData) {
      return res.status(404).json({ error: `Team ${promotedTeam} not found in League 2 data` });
    }

    const oldTeamId = teamToRemove.id;

    // Add the promoted team first (so we have the new ID)
    const newTeamId = uuidv4();
    run(`
      INSERT INTO handball_teams (id, world_id, name, short_name, city, logo, power, attack, defense, goalkeeper, league)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'extraliga')
    `, [
      newTeamId,
      req.params.id,
      promotedData.name,
      promotedData.shortName,
      promotedData.shortName,
      'league2-promoted.svg',
      promotedData.power,
      promotedData.attack || promotedData.power + 1,
      promotedData.defense || promotedData.power - 1,
      promotedData.goalkeeper || promotedData.power
    ]);

    // Update all matches that reference the old team to use the new team
    // This handles both scheduled and completed matches in current/future seasons
    const seasonsInWorld = all('SELECT id FROM handball_seasons WHERE world_id = ?', [req.params.id]);
    for (const season of seasonsInWorld) {
      // Update home team references
      run('UPDATE handball_matches SET home_team_id = ? WHERE season_id = ? AND home_team_id = ?',
        [newTeamId, season.id, oldTeamId]);
      // Update away team references
      run('UPDATE handball_matches SET away_team_id = ? WHERE season_id = ? AND away_team_id = ?',
        [newTeamId, season.id, oldTeamId]);
    }

    // Move the relegated team to League 2 (don't delete - they go to League 2 pool)
    run('UPDATE handball_teams SET league = ? WHERE id = ?', ['league2', oldTeamId]);

    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND league = ? ORDER BY power DESC', [req.params.id, 'extraliga']);
    res.json({
      message: `Swapped ${relegatedTeam} with ${promotedTeam}. Updated all match references.`,
      teams
    });
  } catch (error) {
    console.error('Error fixing team swap:', error);
    res.status(500).json({ error: 'Failed to fix team swap' });
  }
});

// Reset world - clears current season and resets teams to original 12
router.post('/worlds/:id/reset', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM handball_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Delete all matches, seasons, and history
    const seasons = all('SELECT id FROM handball_seasons WHERE world_id = ?', [req.params.id]);
    for (const season of seasons) {
      run('DELETE FROM handball_matches WHERE season_id = ?', [season.id]);
    }
    run('DELETE FROM handball_seasons WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM handball_season_history WHERE world_id = ?', [req.params.id]);

    // Delete all teams and re-create original 12
    run('DELETE FROM handball_teams WHERE world_id = ?', [req.params.id]);
    for (const team of czechExtraligaTeams) {
      const teamId = uuidv4();
      run(`
        INSERT INTO handball_teams (id, world_id, name, short_name, city, logo, power, attack, defense, goalkeeper, league)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'extraliga')
      `, [teamId, req.params.id, team.name, team.shortName, team.city, team.logo, team.power, team.attack, team.defense, team.goalkeeper]);
    }

    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? ORDER BY power DESC', [req.params.id]);
    res.json({ message: 'World reset successfully', teams });
  } catch (error) {
    console.error('Error resetting handball world:', error);
    res.status(500).json({ error: 'Failed to reset world' });
  }
});

// ==================== TEAMS ====================

// Get all teams for a world
router.get('/worlds/:worldId/teams', authMiddleware, (req, res) => {
  try {
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL) ORDER BY power DESC', [req.params.worldId, 'extraliga']);
    res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// ==================== SEASONS ====================

// Get current season
router.get('/worlds/:worldId/season', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT * FROM handball_seasons
      WHERE world_id = ?
      ORDER BY year_start DESC LIMIT 1
    `, [req.params.worldId]);

    if (!season) {
      return res.json({ season: null });
    }

    // Get matches for this season
    const matches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.round, m.id
    `, [season.id]);

    // Get teams (only extraliga, not league2)
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [req.params.worldId, 'extraliga']);

    // Use frozen standings during playoffs (stored in standings column), otherwise calculate from matches
    let standings;
    if (season.phase === 'playoff' && season.standings) {
      // During playoffs, use the frozen standings saved when playoffs started
      standings = JSON.parse(season.standings);
    } else {
      // During regular season, calculate from matches
      const regularMatches = matches.filter(m => m.phase === 'regular');
      standings = calculateStandings(teams, regularMatches);
    }

    res.json({
      season: {
        ...season,
        matches,
        standings
      }
    });
  } catch (error) {
    console.error('Error fetching season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new season
router.post('/worlds/:worldId/season', authMiddleware, (req, res) => {
  try {
    const { yearStart, yearEnd } = req.body;
    const worldId = req.params.worldId;

    // Check if world exists
    const world = get('SELECT * FROM handball_worlds WHERE id = ?', [worldId]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Clean up any League 2 teams from previous seasons
    run('DELETE FROM handball_teams WHERE world_id = ? AND league = ?', [worldId, 'league2']);

    // Get teams (only extraliga teams)
    let teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [worldId, 'extraliga']);

    // Check for and remove duplicates (keep first occurrence by id)
    const seenNames = new Set();
    const duplicateIds = [];
    for (const team of teams) {
      if (seenNames.has(team.short_name)) {
        duplicateIds.push(team.id);
      } else {
        seenNames.add(team.short_name);
      }
    }
    if (duplicateIds.length > 0) {
      run(`DELETE FROM handball_teams WHERE id IN (${duplicateIds.map(() => '?').join(',')})`, duplicateIds);
      teams = teams.filter(t => !duplicateIds.includes(t.id));
    }

    // If we don't have exactly 12 teams, something is wrong - reset to original teams
    if (teams.length !== 12) {
      console.log(`Warning: Found ${teams.length} teams instead of 12, resetting teams for world ${worldId}`);
      // Delete all teams for this world
      run('DELETE FROM handball_teams WHERE world_id = ?', [worldId]);
      // Re-create original teams
      const { czechExtraligaTeams } = require('../data/handballTeams');
      for (const team of czechExtraligaTeams) {
        const teamId = uuidv4();
        run(`
          INSERT INTO handball_teams (id, world_id, name, short_name, city, logo, power, attack, defense, goalkeeper, league)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'extraliga')
        `, [teamId, worldId, team.name, team.shortName, team.city, team.logo, team.power, team.attack, team.defense, team.goalkeeper]);
      }
      teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND league = ?', [worldId, 'extraliga']);
    }

    if (teams.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 teams to create a season' });
    }

    // Create season
    const seasonId = uuidv4();
    const seasonName = `${yearStart}/${yearEnd}`;
    run(`
      INSERT INTO handball_seasons (id, world_id, name, year_start, year_end, status, phase, current_round)
      VALUES (?, ?, ?, ?, ?, 'in_progress', 'regular', 1)
    `, [seasonId, worldId, seasonName, yearStart, yearEnd]);

    // Generate schedule
    const schedule = generateLeagueSchedule(teams);

    // Create matches
    let matchIndex = 0;
    for (const roundMatches of schedule) {
      for (const match of roundMatches) {
        const matchId = uuidv4();
        run(`
          INSERT INTO handball_matches (id, season_id, round, phase, home_team_id, away_team_id, status)
          VALUES (?, ?, ?, 'regular', ?, ?, 'scheduled')
        `, [matchId, seasonId, match.round, teams[match.homeTeamIndex].id, teams[match.awayTeamIndex].id]);
        matchIndex++;
      }
    }

    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [seasonId]);
    const matches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short,
        at.name as away_team_name, at.short_name as away_team_short
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.round, m.id
    `, [seasonId]);

    res.status(201).json({ season: { ...season, matches } });
  } catch (error) {
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// ==================== MATCHES ====================

// Get matches for a round
router.get('/seasons/:seasonId/round/:round', authMiddleware, (req, res) => {
  try {
    const matches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo, ht.power as home_team_power,
        at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo, at.power as away_team_power
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.round = ?
      ORDER BY m.id
    `, [req.params.seasonId, req.params.round]);

    res.json({ matches });
  } catch (error) {
    console.error('Error fetching round matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Simulate a single match
router.post('/matches/:matchId/simulate', authMiddleware, (req, res) => {
  try {
    const { detailed } = req.body;
    const matchId = req.params.matchId;

    // Get match with team info
    const match = get(`
      SELECT m.*,
        ht.id as home_id, ht.name as home_team_name, ht.short_name as home_team_short,
        ht.power as home_power, ht.attack as home_attack, ht.defense as home_defense, ht.goalkeeper as home_goalkeeper,
        at.id as away_id, at.name as away_team_name, at.short_name as away_team_short,
        at.power as away_power, at.attack as away_attack, at.defense as away_defense, at.goalkeeper as away_goalkeeper
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.id = ?
    `, [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match already completed' });
    }

    // Simulate the match
    const homeTeam = {
      id: match.home_id,
      shortName: match.home_team_short,
      power: match.home_power,
      attack: match.home_attack,
      defense: match.home_defense,
      goalkeeper: match.home_goalkeeper
    };

    const awayTeam = {
      id: match.away_id,
      shortName: match.away_team_short,
      power: match.away_power,
      attack: match.away_attack,
      defense: match.away_defense,
      goalkeeper: match.away_goalkeeper
    };

    const isPlayoff = match.phase === 'playoff';
    const result = simulateMatch(homeTeam, awayTeam, detailed, isPlayoff);

    // Update match in database
    run(`
      UPDATE handball_matches
      SET home_score = ?, away_score = ?, home_halftime = ?, away_halftime = ?,
          status = 'completed', match_events = ?
      WHERE id = ?
    `, [result.homeScore, result.awayScore, result.homeHalftime, result.awayHalftime,
        JSON.stringify(result.events), matchId]);

    // Get updated match
    const updatedMatch = get(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.id = ?
    `, [matchId]);

    res.json({ match: updatedMatch, events: result.events });
  } catch (error) {
    console.error('Error simulating match:', error);
    res.status(500).json({ error: 'Failed to simulate match' });
  }
});

// Simulate entire round (fast simulation)
router.post('/seasons/:seasonId/round/:round/simulate', authMiddleware, (req, res) => {
  try {
    const { seasonId, round } = req.params;

    // Get all unplayed matches in this round
    const matches = all(`
      SELECT m.*,
        ht.id as home_id, ht.short_name as home_team_short,
        ht.power as home_power, ht.attack as home_attack, ht.defense as home_defense, ht.goalkeeper as home_goalkeeper,
        at.id as away_id, at.short_name as away_team_short,
        at.power as away_power, at.attack as away_attack, at.defense as away_defense, at.goalkeeper as away_goalkeeper
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.round = ? AND m.status = 'scheduled'
    `, [seasonId, round]);

    const results = [];

    for (const match of matches) {
      const homeTeam = {
        id: match.home_id,
        shortName: match.home_team_short,
        power: match.home_power,
        attack: match.home_attack,
        defense: match.home_defense,
        goalkeeper: match.home_goalkeeper
      };

      const awayTeam = {
        id: match.away_id,
        shortName: match.away_team_short,
        power: match.away_power,
        attack: match.away_attack,
        defense: match.away_defense,
        goalkeeper: match.away_goalkeeper
      };

      const isPlayoff = match.phase === 'playoff';
      const result = simulateMatch(homeTeam, awayTeam, false, isPlayoff);

      run(`
        UPDATE handball_matches
        SET home_score = ?, away_score = ?, home_halftime = ?, away_halftime = ?, status = 'completed'
        WHERE id = ?
      `, [result.homeScore, result.awayScore, result.homeHalftime, result.awayHalftime, match.id]);

      results.push({
        matchId: match.id,
        homeTeam: match.home_team_short,
        awayTeam: match.away_team_short,
        homeScore: result.homeScore,
        awayScore: result.awayScore
      });
    }

    // Update current round in season
    run('UPDATE handball_seasons SET current_round = ? WHERE id = ?', [parseInt(round) + 1, seasonId]);

    // Get updated standings
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [seasonId]);
    const allMatches = all('SELECT * FROM handball_matches WHERE season_id = ?', [seasonId]);
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [season.world_id, 'extraliga']);
    const standings = calculateStandings(teams, allMatches);

    // Save standings
    run('UPDATE handball_seasons SET standings = ? WHERE id = ?', [JSON.stringify(standings), seasonId]);

    res.json({ results, standings });
  } catch (error) {
    console.error('Error simulating round:', error);
    res.status(500).json({ error: 'Failed to simulate round' });
  }
});

// Get standings
router.get('/seasons/:seasonId/standings', authMiddleware, (req, res) => {
  try {
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [req.params.seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // During playoffs, return frozen standings
    if (season.phase === 'playoff' && season.standings) {
      return res.json({ standings: JSON.parse(season.standings) });
    }

    // During regular season, calculate from regular matches only
    const matches = all('SELECT * FROM handball_matches WHERE season_id = ? AND phase = ?', [req.params.seasonId, 'regular']);
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [season.world_id, 'extraliga']);
    const standings = calculateStandings(teams, matches);

    res.json({ standings });
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// ==================== PLAYOFFS ====================

// Helper to get series results for a playoff round
function getSeriesResults(seasonId, playoffRound) {
  const matches = all(`
    SELECT m.*,
      ht.short_name as home_team_short, ht.id as home_team_id,
      at.short_name as away_team_short, at.id as away_team_id
    FROM handball_matches m
    JOIN handball_teams ht ON m.home_team_id = ht.id
    JOIN handball_teams at ON m.away_team_id = at.id
    WHERE m.season_id = ? AND m.playoff_round = ?
    ORDER BY m.id
  `, [seasonId, playoffRound]);

  // Group by team pairs
  const seriesMap = new Map();
  for (const match of matches) {
    const teams = [match.home_team_id, match.away_team_id].sort().join('-');
    if (!seriesMap.has(teams)) {
      seriesMap.set(teams, {
        team1Id: match.home_team_id,
        team2Id: match.away_team_id,
        team1Name: match.home_team_short,
        team2Name: match.away_team_short,
        team1Wins: 0,
        team2Wins: 0,
        winner: null,
        winnerId: null
      });
    }
    const series = seriesMap.get(teams);

    if (match.status === 'completed') {
      const homeWon = match.home_score > match.away_score;
      const winnerId = homeWon ? match.home_team_id : match.away_team_id;
      if (winnerId === series.team1Id) series.team1Wins++;
      else series.team2Wins++;
    }
  }

  // Determine winners (first to 3 wins in BO5)
  for (const series of seriesMap.values()) {
    if (series.team1Wins >= 3) {
      series.winner = series.team1Name;
      series.winnerId = series.team1Id;
    } else if (series.team2Wins >= 3) {
      series.winner = series.team2Name;
      series.winnerId = series.team2Id;
    }
  }

  return Array.from(seriesMap.values());
}

// Helper to check if a playoff round is complete
function isPlayoffRoundComplete(seasonId, playoffRound) {
  const series = getSeriesResults(seasonId, playoffRound);
  if (series.length === 0) return false;
  return series.every(s => s.winner !== null);
}

// Helper to create BO5 series matches
function createBO5Series(seasonId, team1Id, team2Id, playoffRound) {
  // Best of 5: Games 1,2 at higher seed, Games 3,4 at lower seed, Game 5 at higher seed
  // team1 is higher seed, team2 is lower seed
  const games = [
    { round: 1, home: team1Id, away: team2Id },  // Game 1 - higher seed home
    { round: 2, home: team1Id, away: team2Id },  // Game 2 - higher seed home
    { round: 3, home: team2Id, away: team1Id },  // Game 3 - lower seed home
    { round: 4, home: team2Id, away: team1Id },  // Game 4 - lower seed home
    { round: 5, home: team1Id, away: team2Id }   // Game 5 - higher seed home
  ];

  for (const game of games) {
    run(`
      INSERT INTO handball_matches (id, season_id, round, phase, home_team_id, away_team_id, status, playoff_round)
      VALUES (?, ?, ?, 'playoff', ?, ?, 'scheduled', ?)
    `, [uuidv4(), seasonId, game.round, game.home, game.away, playoffRound]);
  }
}

// Simulate League 2 season and return standings
function simulateLeague2Season(worldId) {
  // Get any relegated teams from the database (teams that were relegated from Extraliga)
  const relegatedTeams = worldId ? all('SELECT * FROM handball_teams WHERE world_id = ? AND league = ?', [worldId, 'league2']) : [];
  const relegatedNames = new Set(relegatedTeams.map(t => t.short_name));

  // Clone the static league 2 teams, excluding any that match a relegated team (to avoid duplicates)
  const staticLeague2Teams = czechSecondLeagueTeams
    .filter(team => !relegatedNames.has(team.shortName))
    .map((team, idx) => ({
      id: `l2-${idx}`,
      short_name: team.shortName,
      name: team.name,
      power: team.power,
      attack: team.power + 2,
      defense: team.power - 2,
      goalkeeper: team.power
    }));

  // Add relegated teams (they keep their original stats)
  const relegatedLeague2Teams = relegatedTeams.map(team => ({
    id: team.id,
    short_name: team.short_name,
    name: team.name,
    power: team.power,
    attack: team.attack,
    defense: team.defense,
    goalkeeper: team.goalkeeper,
    isRelegated: true // Mark so we can identify them
  }));

  // Combine all league 2 teams
  const league2Teams = [...staticLeague2Teams, ...relegatedLeague2Teams];

  // Simulate round-robin with home and away
  const standings = league2Teams.map(team => ({
    teamId: team.id,
    teamName: team.short_name,
    fullName: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    power: team.power,
    attack: team.attack,
    defense: team.defense,
    goalkeeper: team.goalkeeper,
    isRelegated: team.isRelegated || false
  }));

  const standingsMap = {};
  standings.forEach(s => standingsMap[s.teamId] = s);

  // Each team plays every other team twice (home and away)
  for (let i = 0; i < league2Teams.length; i++) {
    for (let j = 0; j < league2Teams.length; j++) {
      if (i === j) continue;

      const homeTeam = league2Teams[i];
      const awayTeam = league2Teams[j];

      // Simulate match
      const result = simulateMatch(
        { power: homeTeam.power, attack: homeTeam.attack, defense: homeTeam.defense, goalkeeper: homeTeam.goalkeeper },
        { power: awayTeam.power, attack: awayTeam.attack, defense: awayTeam.defense, goalkeeper: awayTeam.goalkeeper },
        false, false
      );

      const home = standingsMap[homeTeam.id];
      const away = standingsMap[awayTeam.id];

      home.played++;
      away.played++;
      home.goalsFor += result.homeScore;
      home.goalsAgainst += result.awayScore;
      away.goalsFor += result.awayScore;
      away.goalsAgainst += result.homeScore;

      if (result.homeScore > result.awayScore) {
        home.won++;
        home.points += 2;
        away.lost++;
      } else if (result.homeScore < result.awayScore) {
        away.won++;
        away.points += 2;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }
    }
  }

  // Calculate goal difference and sort
  standings.forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

// Start playoffs (after regular season)
router.post('/seasons/:seasonId/start-playoffs', authMiddleware, (req, res) => {
  try {
    const seasonId = req.params.seasonId;
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [seasonId]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // Get final standings from regular season (only extraliga teams)
    const matches = all('SELECT * FROM handball_matches WHERE season_id = ? AND phase = ?', [seasonId, 'regular']);
    const teams = all('SELECT * FROM handball_teams WHERE world_id = ? AND (league = ? OR league IS NULL)', [season.world_id, 'extraliga']);
    const finalStandings = calculateStandings(teams, matches);

    // Add original positions to all teams
    const teamsWithPositions = finalStandings.map((team, idx) => ({
      ...team,
      originalPosition: idx + 1
    }));

    // Top 8 go to playoffs, bottom 4 go to playout
    const playoffTeams = teamsWithPositions.slice(0, 8);
    const playoutTeams = teamsWithPositions.slice(8, 12); // 9th, 10th, 11th, 12th place

    // Create playoff bracket (quarterfinals): 1v8, 2v7, 3v6, 4v5
    const playoffPairs = [
      [playoffTeams[0], playoffTeams[7]],
      [playoffTeams[1], playoffTeams[6]],
      [playoffTeams[2], playoffTeams[5]],
      [playoffTeams[3], playoffTeams[4]]
    ];

    // Create BO5 quarterfinal series
    for (let i = 0; i < playoffPairs.length; i++) {
      const [higher, lower] = playoffPairs[i];
      createBO5Series(seasonId, higher.teamId, lower.teamId, 'quarterfinal');
    }

    // Create playout mini-league: all 4 bottom teams play each other twice (home and away)
    // Total: 12 matches (each team plays 6 matches)
    let playoutRound = 1;
    for (let i = 0; i < playoutTeams.length; i++) {
      for (let j = 0; j < playoutTeams.length; j++) {
        if (i !== j) {
          run(`
            INSERT INTO handball_matches (id, season_id, round, phase, home_team_id, away_team_id, status, playoff_round)
            VALUES (?, ?, ?, 'playout', ?, ?, 'scheduled', 'playout_league')
          `, [uuidv4(), seasonId, playoutRound++, playoutTeams[i].teamId, playoutTeams[j].teamId]);
        }
      }
    }

    // Simulate League 2 season (includes any relegated teams from this world)
    const league2Standings = simulateLeague2Season(season.world_id);

    // Save playout data with team info including original positions
    const playoutData = {
      playoutTeams: playoutTeams.map(t => ({
        teamId: t.teamId,
        teamName: t.teamName,
        originalPosition: t.originalPosition
      })),
      league2Winner: league2Standings[0],
      relegationPlayoffStarted: false,
      playoutStandings: [] // Will be calculated as matches are played
    };

    // Save final regular season standings (with positions) and update phase
    run('UPDATE handball_seasons SET phase = ?, standings = ?, playoff_bracket = ?, league2_standings = ?, playout_data = ? WHERE id = ?',
      ['playoff', JSON.stringify(teamsWithPositions), JSON.stringify(playoffPairs.map(p => ({ team1: p[0], team2: p[1], winner: null }))), JSON.stringify(league2Standings), JSON.stringify(playoutData), seasonId]);

    res.json({
      message: 'Playoffs started',
      playoffTeams: playoffPairs,
      playoutTeams,
      league2Standings,
      finalStandings: teamsWithPositions
    });
  } catch (error) {
    console.error('Error starting playoffs:', error);
    res.status(500).json({ error: 'Failed to start playoffs' });
  }
});

// Get playoff bracket
router.get('/seasons/:seasonId/playoffs', authMiddleware, (req, res) => {
  try {
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [req.params.seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const playoffMatches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.phase = 'playoff'
      ORDER BY m.playoff_round, m.round
    `, [req.params.seasonId]);

    // Get playout matches
    const playoutMatches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.phase = 'playout'
      ORDER BY m.playoff_round, m.round
    `, [req.params.seasonId]);

    res.json({
      bracket: JSON.parse(season.playoff_bracket || '[]'),
      matches: playoffMatches,
      playoutMatches,
      league2Standings: JSON.parse(season.league2_standings || '[]'),
      playoutData: JSON.parse(season.playout_data || '{}')
    });
  } catch (error) {
    console.error('Error fetching playoffs:', error);
    res.status(500).json({ error: 'Failed to fetch playoffs' });
  }
});

// Get playout data
router.get('/seasons/:seasonId/playout', authMiddleware, (req, res) => {
  try {
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [req.params.seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const playoutMatches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.phase = 'playout'
      ORDER BY m.playoff_round, m.round
    `, [req.params.seasonId]);

    res.json({
      playoutMatches,
      league2Standings: JSON.parse(season.league2_standings || '[]'),
      playoutData: JSON.parse(season.playout_data || '{}')
    });
  } catch (error) {
    console.error('Error fetching playout:', error);
    res.status(500).json({ error: 'Failed to fetch playout' });
  }
});

// Calculate playout standings from playout league matches
function calculatePlayoutStandings(seasonId, playoutTeamIds) {
  const playoutMatches = all(`
    SELECT * FROM handball_matches
    WHERE season_id = ? AND playoff_round = 'playout_league' AND status = 'completed'
  `, [seasonId]);

  const teams = all(`
    SELECT id, short_name, power, attack, defense, goalkeeper FROM handball_teams
    WHERE id IN (${playoutTeamIds.map(() => '?').join(',')})
  `, playoutTeamIds);

  const standings = teams.map(team => ({
    teamId: team.id,
    teamName: team.short_name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));

  const standingsMap = {};
  standings.forEach(s => standingsMap[s.teamId] = s);

  for (const match of playoutMatches) {
    const home = standingsMap[match.home_team_id];
    const away = standingsMap[match.away_team_id];

    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;
    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.won++;
      home.points += 2;
      away.lost++;
    } else if (match.home_score < match.away_score) {
      away.won++;
      away.points += 2;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  standings.forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

// Check if playout league is complete and start relegation playoff
router.post('/seasons/:seasonId/check-playout-advance', authMiddleware, (req, res) => {
  try {
    const seasonId = req.params.seasonId;
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [seasonId]);

    if (!season) {
      return res.json({ advanced: false, message: 'Season not found' });
    }

    const playoutData = JSON.parse(season.playout_data || '{}');

    // Get playout league matches
    const playoutLeagueMatches = all(`
      SELECT m.*,
        ht.short_name as home_team_short,
        at.short_name as away_team_short
      FROM handball_matches m
      JOIN handball_teams ht ON m.home_team_id = ht.id
      JOIN handball_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.playoff_round = 'playout_league'
    `, [seasonId]);

    // Check if all 12 playout league matches are complete
    const allCompleted = playoutLeagueMatches.length === 12 && playoutLeagueMatches.every(m => m.status === 'completed');

    // Calculate and save playout standings regardless of completion
    if (playoutData.playoutTeams && playoutData.playoutTeams.length > 0) {
      const playoutTeamIds = playoutData.playoutTeams.map(t => t.teamId);
      const playoutStandings = calculatePlayoutStandings(seasonId, playoutTeamIds);

      // Add original positions to standings
      playoutStandings.forEach(s => {
        const originalTeam = playoutData.playoutTeams.find(t => t.teamId === s.teamId);
        if (originalTeam) {
          s.originalPosition = originalTeam.originalPosition;
        }
      });

      playoutData.playoutStandings = playoutStandings;
      run('UPDATE handball_seasons SET playout_data = ? WHERE id = ?', [JSON.stringify(playoutData), seasonId]);
    }

    if (!allCompleted) {
      return res.json({
        advanced: false,
        message: 'Playout league not complete',
        playoutStandings: playoutData.playoutStandings || []
      });
    }

    // Check if relegation playoff already exists
    const relegationExists = all('SELECT id FROM handball_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'relegation_playoff']).length > 0;

    if (relegationExists) {
      return res.json({
        advanced: false,
        message: 'Relegation playoff already created',
        playoutStandings: playoutData.playoutStandings || []
      });
    }

    // Get the last place team from playout standings (will play relegation)
    const playoutStandings = playoutData.playoutStandings || [];
    if (playoutStandings.length < 4) {
      return res.json({ advanced: false, message: 'Invalid playout standings' });
    }

    const lastPlaceTeam = playoutStandings[playoutStandings.length - 1]; // 12th in playout
    const playoutLoserId = lastPlaceTeam.teamId;
    const playoutLoserName = lastPlaceTeam.teamName;

    // Get League 2 winner data
    const league2Winner = playoutData.league2Winner;

    // Create a temporary team entry for League 2 winner
    const league2TeamId = uuidv4();
    run(`
      INSERT INTO handball_teams (id, world_id, name, short_name, city, logo, power, attack, defense, goalkeeper, league)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'league2')
    `, [
      league2TeamId,
      season.world_id,
      league2Winner.fullName,
      league2Winner.teamName,
      league2Winner.teamName,
      'league2-winner.svg',
      league2Winner.power,
      league2Winner.attack,
      league2Winner.defense,
      league2Winner.goalkeeper
    ]);

    // Create relegation playoff BO5 series (Extraliga team is higher seed - home games first)
    createBO5Series(seasonId, playoutLoserId, league2TeamId, 'relegation_playoff');

    // Update playout data
    playoutData.relegationPlayoffStarted = true;
    playoutData.playoutLoser = { teamId: playoutLoserId, teamName: playoutLoserName };
    playoutData.league2TeamId = league2TeamId;

    run('UPDATE handball_seasons SET playout_data = ? WHERE id = ?', [JSON.stringify(playoutData), seasonId]);

    // Update match phase to playout for relegation matches
    run('UPDATE handball_matches SET phase = ? WHERE season_id = ? AND playoff_round = ?', ['playout', seasonId, 'relegation_playoff']);

    return res.json({
      advanced: true,
      message: 'Relegation playoff started',
      playoutLoser: playoutLoserName,
      league2Winner: league2Winner.teamName,
      playoutStandings: playoutData.playoutStandings
    });
  } catch (error) {
    console.error('Error checking playout advance:', error);
    res.status(500).json({ error: 'Failed to check playout advance' });
  }
});

// Check and advance to next playoff round if current round is complete
router.post('/seasons/:seasonId/check-playoff-advance', authMiddleware, (req, res) => {
  try {
    const seasonId = req.params.seasonId;
    const season = get('SELECT * FROM handball_seasons WHERE id = ?', [seasonId]);

    if (!season || season.phase !== 'playoff') {
      return res.json({ advanced: false, message: 'Not in playoff phase' });
    }

    // Check quarterfinals
    const qfComplete = isPlayoffRoundComplete(seasonId, 'quarterfinal');
    const sfExists = all('SELECT id FROM handball_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'semifinal']).length > 0;

    if (qfComplete && !sfExists) {
      // Create semifinals from quarterfinal winners
      const qfSeries = getSeriesResults(seasonId, 'quarterfinal');
      const winners = qfSeries.map(s => s.winnerId);

      if (winners.length === 4) {
        // Semifinal matchups: QF1 winner vs QF4 winner, QF2 winner vs QF3 winner
        createBO5Series(seasonId, winners[0], winners[3], 'semifinal');
        createBO5Series(seasonId, winners[1], winners[2], 'semifinal');

        return res.json({
          advanced: true,
          newRound: 'semifinal',
          message: 'Semifinals created'
        });
      }
    }

    // Check semifinals
    const sfComplete = isPlayoffRoundComplete(seasonId, 'semifinal');
    const finalsExist = all('SELECT id FROM handball_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'final']).length > 0;

    if (sfComplete && !finalsExist) {
      // Create finals AND 3rd place match from semifinal results
      const sfSeries = getSeriesResults(seasonId, 'semifinal');
      const winners = sfSeries.map(s => s.winnerId);
      const losers = sfSeries.map(s => s.winnerId === s.team1Id ? s.team2Id : s.team1Id);

      if (winners.length === 2 && losers.length === 2) {
        // Create finals (BO5)
        createBO5Series(seasonId, winners[0], winners[1], 'final');

        // Create 3rd place match (single match, not BO5)
        run(`
          INSERT INTO handball_matches (id, season_id, round, phase, home_team_id, away_team_id, status, playoff_round)
          VALUES (?, ?, 1, 'playoff', ?, ?, 'scheduled', 'third_place')
        `, [uuidv4(), seasonId, losers[0], losers[1]]);

        return res.json({
          advanced: true,
          newRound: 'final',
          message: 'Finals and 3rd place match created'
        });
      }
    }

    // Check if finals AND 3rd place match are complete
    const finalsComplete = isPlayoffRoundComplete(seasonId, 'final');
    const thirdPlaceMatch = get('SELECT * FROM handball_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'third_place']);
    const thirdPlaceComplete = thirdPlaceMatch && thirdPlaceMatch.status === 'completed';

    // Check if relegation playoff exists and is complete
    const relegationMatches = all('SELECT * FROM handball_matches WHERE season_id = ? AND playoff_round = ? AND status = ?', [seasonId, 'relegation_playoff', 'completed']);
    const relegationExists = all('SELECT id FROM handball_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'relegation_playoff']).length > 0;
    const relegationComplete = relegationExists ? isPlayoffRoundComplete(seasonId, 'relegation_playoff') : true; // If no relegation, consider it complete

    if (finalsComplete && thirdPlaceComplete && relegationComplete) {
      const finalSeries = getSeriesResults(seasonId, 'final');
      if (finalSeries.length > 0) {
        // Determine champion and runner-up
        const championId = finalSeries[0].winnerId;
        const championName = finalSeries[0].winner;
        const runnerUpId = finalSeries[0].winnerId === finalSeries[0].team1Id ? finalSeries[0].team2Id : finalSeries[0].team1Id;
        const runnerUpName = finalSeries[0].winnerId === finalSeries[0].team1Id ? finalSeries[0].team2Name : finalSeries[0].team1Name;

        // Determine 3rd place winner
        const thirdPlaceWinnerId = thirdPlaceMatch.home_score > thirdPlaceMatch.away_score ? thirdPlaceMatch.home_team_id : thirdPlaceMatch.away_team_id;
        const thirdPlaceTeam = get('SELECT short_name FROM handball_teams WHERE id = ?', [thirdPlaceWinnerId]);
        const thirdPlaceName = thirdPlaceTeam?.short_name || 'Unknown';

        // Handle relegation playoff result - swap teams between leagues
        if (relegationExists) {
          const relegationSeries = getSeriesResults(seasonId, 'relegation_playoff');
          if (relegationSeries.length > 0) {
            const playoutData = JSON.parse(season.playout_data || '{}');
            const league2TeamId = playoutData.league2TeamId;
            const extraligaTeamId = playoutData.playoutLoser?.teamId;
            const relegationWinnerId = relegationSeries[0].winnerId;

            // If League 2 team won, swap the teams
            if (relegationWinnerId === league2TeamId && extraligaTeamId) {
              // Promote League 2 team to Extraliga
              run('UPDATE handball_teams SET league = ? WHERE id = ?', ['extraliga', league2TeamId]);
              // Relegate Extraliga team to League 2 (don't delete - they go to League 2 pool)
              run('UPDATE handball_teams SET league = ? WHERE id = ?', ['league2', extraligaTeamId]);
              console.log(`Relegation: ${playoutData.playoutLoser?.teamName} relegated to League 2, ${playoutData.league2Winner?.teamName} promoted to Extraliga`);
            } else {
              // Extraliga team won - delete the temporary League 2 team entry (they stay in static pool)
              run('DELETE FROM handball_teams WHERE id = ?', [league2TeamId]);
              console.log(`Relegation: ${playoutData.playoutLoser?.teamName} stays in Extraliga`);
            }
          }
        }

        // Save to history
        run(`
          INSERT INTO handball_season_history (id, world_id, season_name, year_start, year_end, champion_id, champion_name, runner_up_id, runner_up_name, third_place_id, third_place_name, final_standings)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(),
          season.world_id,
          season.name,
          season.year_start,
          season.year_end,
          championId,
          championName,
          runnerUpId,
          runnerUpName,
          thirdPlaceWinnerId,
          thirdPlaceName,
          season.standings || '[]'
        ]);

        run('UPDATE handball_seasons SET status = ? WHERE id = ?', ['completed', seasonId]);

        return res.json({
          advanced: false,
          champion: championName,
          runnerUp: runnerUpName,
          thirdPlace: thirdPlaceName,
          message: 'Season complete - Champion crowned!'
        });
      }
    }

    res.json({ advanced: false, message: 'No advancement needed' });
  } catch (error) {
    console.error('Error checking playoff advance:', error);
    res.status(500).json({ error: 'Failed to check playoff advance' });
  }
});

// Get season history for a world
router.get('/worlds/:worldId/history', authMiddleware, (req, res) => {
  try {
    const history = all(`
      SELECT * FROM handball_season_history
      WHERE world_id = ?
      ORDER BY year_end DESC, year_start DESC
    `, [req.params.worldId]);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
