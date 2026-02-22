const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateCalendarForYear, TOURNAMENT_POINTS, TOURNAMENT_TYPES } = require('../data/tennisCalendar');
const { generatePlayers, getCountryFlag, getCountryName } = require('../data/tennisNames');
const {
  generateBracket,
  simulateMatchFast,
  simulateMatch,
  getBestOf,
  getPointsForRound,
  getGrandSlamCode,
  formatRoundResult
} = require('../utils/tennisSimulation');

const router = express.Router();

// ==================== WORLDS ====================

// Get all tennis worlds for current user
router.get('/worlds', authMiddleware, (req, res) => {
  try {
    const worlds = all(`
      SELECT w.*,
        (SELECT COUNT(*) FROM tennis_players WHERE world_id = w.id) as players_count,
        (SELECT COUNT(*) FROM tennis_seasons WHERE world_id = w.id) as seasons_count
      FROM tennis_worlds w
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json({ worlds });
  } catch (error) {
    console.error('Error fetching tennis worlds:', error);
    res.status(500).json({ error: 'Failed to fetch tennis worlds' });
  }
});

// Get tennis world by ID
router.get('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const world = get(
      'SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?',
      [req.params.worldId, req.user.id]
    );

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    res.json({ world });
  } catch (error) {
    console.error('Error fetching tennis world:', error);
    res.status(500).json({ error: 'Failed to fetch tennis world' });
  }
});

// Create new tennis world
router.post('/worlds', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'World name is required' });
    }

    const worldId = uuidv4();
    run(
      'INSERT INTO tennis_worlds (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [worldId, req.user.id, name, description || '']
    );

    const world = get('SELECT * FROM tennis_worlds WHERE id = ?', [worldId]);
    res.status(201).json({ world });
  } catch (error) {
    console.error('Error creating tennis world:', error);
    res.status(500).json({ error: 'Failed to create tennis world' });
  }
});

// Update tennis world
router.put('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run(
      'UPDATE tennis_worlds SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || world.name, description !== undefined ? description : world.description, req.params.worldId]
    );

    const updatedWorld = get('SELECT * FROM tennis_worlds WHERE id = ?', [req.params.worldId]);
    res.json({ world: updatedWorld });
  } catch (error) {
    console.error('Error updating tennis world:', error);
    res.status(500).json({ error: 'Failed to update tennis world' });
  }
});

// Delete tennis world
router.delete('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM tennis_worlds WHERE id = ?', [req.params.worldId]);
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting tennis world:', error);
    res.status(500).json({ error: 'Failed to delete tennis world' });
  }
});

// ==================== PLAYERS ====================

// Get all players for a world
router.get('/world/:worldId/players', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const players = all(`
      SELECT * FROM tennis_players
      WHERE world_id = ?
      ORDER BY ranking_points DESC, last_name ASC
    `, [req.params.worldId]);

    // Add rank based on points
    const rankedPlayers = players.map((player, index) => ({
      ...player,
      rank: index + 1
    }));

    res.json({ players: rankedPlayers });
  } catch (error) {
    console.error('Error fetching tennis players:', error);
    res.status(500).json({ error: 'Failed to fetch tennis players' });
  }
});

// Generate players for a world
router.post('/world/:worldId/generate-players', authMiddleware, (req, res) => {
  try {
    const { count = 100 } = req.body;

    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Generate players
    const players = generatePlayers(req.params.worldId, count);

    // Insert players into database
    for (const player of players) {
      const playerId = uuidv4();
      run(`
        INSERT INTO tennis_players (
          id, world_id, first_name, last_name, country,
          skill_serve, skill_forehand, skill_backhand,
          skill_volley, skill_movement, skill_mental,
          consistency, form, specialty, ranking_points
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        playerId, player.world_id, player.first_name, player.last_name, player.country,
        player.skill_serve, player.skill_forehand, player.skill_backhand,
        player.skill_volley, player.skill_movement, player.skill_mental,
        player.consistency, player.form, player.specialty, player.ranking_points
      ]);
    }

    res.json({ message: `Generated ${count} players`, count: players.length });
  } catch (error) {
    console.error('Error generating tennis players:', error);
    res.status(500).json({ error: 'Failed to generate tennis players' });
  }
});

// Create a single player
router.post('/world/:worldId/player', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const {
      first_name, last_name, country,
      skill_serve = 70, skill_forehand = 70, skill_backhand = 70,
      skill_volley = 70, skill_movement = 70, skill_mental = 70,
      consistency = 70, form = 70, specialty = 'all-round'
    } = req.body;

    if (!first_name || !last_name || !country) {
      return res.status(400).json({ error: 'First name, last name, and country are required' });
    }

    const playerId = uuidv4();
    run(`
      INSERT INTO tennis_players (
        id, world_id, first_name, last_name, country,
        skill_serve, skill_forehand, skill_backhand,
        skill_volley, skill_movement, skill_mental,
        consistency, form, specialty, ranking_points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      playerId, req.params.worldId, first_name, last_name, country,
      skill_serve, skill_forehand, skill_backhand,
      skill_volley, skill_movement, skill_mental,
      consistency, form, specialty
    ]);

    const player = get('SELECT * FROM tennis_players WHERE id = ?', [playerId]);
    res.status(201).json({ player });
  } catch (error) {
    console.error('Error creating tennis player:', error);
    res.status(500).json({ error: 'Failed to create tennis player' });
  }
});

// Update a player
router.put('/player/:playerId', authMiddleware, (req, res) => {
  try {
    const player = get('SELECT p.*, w.user_id FROM tennis_players p JOIN tennis_worlds w ON p.world_id = w.id WHERE p.id = ?', [req.params.playerId]);
    if (!player || player.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const {
      first_name, last_name, country,
      skill_serve, skill_forehand, skill_backhand,
      skill_volley, skill_movement, skill_mental,
      consistency, form, specialty
    } = req.body;

    run(`
      UPDATE tennis_players SET
        first_name = ?, last_name = ?, country = ?,
        skill_serve = ?, skill_forehand = ?, skill_backhand = ?,
        skill_volley = ?, skill_movement = ?, skill_mental = ?,
        consistency = ?, form = ?, specialty = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      first_name || player.first_name,
      last_name || player.last_name,
      country || player.country,
      skill_serve !== undefined ? skill_serve : player.skill_serve,
      skill_forehand !== undefined ? skill_forehand : player.skill_forehand,
      skill_backhand !== undefined ? skill_backhand : player.skill_backhand,
      skill_volley !== undefined ? skill_volley : player.skill_volley,
      skill_movement !== undefined ? skill_movement : player.skill_movement,
      skill_mental !== undefined ? skill_mental : player.skill_mental,
      consistency !== undefined ? consistency : player.consistency,
      form !== undefined ? form : player.form,
      specialty || player.specialty,
      req.params.playerId
    ]);

    const updatedPlayer = get('SELECT * FROM tennis_players WHERE id = ?', [req.params.playerId]);
    res.json({ player: updatedPlayer });
  } catch (error) {
    console.error('Error updating tennis player:', error);
    res.status(500).json({ error: 'Failed to update tennis player' });
  }
});

// Delete a player
router.delete('/player/:playerId', authMiddleware, (req, res) => {
  try {
    const player = get('SELECT p.*, w.user_id FROM tennis_players p JOIN tennis_worlds w ON p.world_id = w.id WHERE p.id = ?', [req.params.playerId]);
    if (!player || player.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    run('DELETE FROM tennis_players WHERE id = ?', [req.params.playerId]);
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting tennis player:', error);
    res.status(500).json({ error: 'Failed to delete tennis player' });
  }
});

// Delete all players in a world
router.delete('/world/:worldId/all-players', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM tennis_players WHERE world_id = ?', [req.params.worldId]);
    res.json({ message: 'All players deleted successfully' });
  } catch (error) {
    console.error('Error deleting all tennis players:', error);
    res.status(500).json({ error: 'Failed to delete all tennis players' });
  }
});

// ==================== SEASONS ====================

// Get current season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM tennis_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year DESC LIMIT 1
    `, [req.params.worldId]);

    if (!season) {
      return res.json({ season: null, events: [] });
    }

    const events = all(`
      SELECT * FROM tennis_events
      WHERE season_id = ?
      ORDER BY event_index ASC
    `, [season.id]);

    // Add winner info for completed events
    const eventsWithWinners = events.map(event => {
      if (event.status === 'completed' && event.results) {
        try {
          const results = JSON.parse(event.results);
          if (results && results.winner) {
            const winner = get(`
              SELECT id, first_name, last_name, country FROM tennis_players WHERE id = ?
            `, [results.winner]);
            if (winner) {
              return {
                ...event,
                winner: {
                  id: winner.id,
                  firstName: winner.first_name,
                  lastName: winner.last_name,
                  country: winner.country
                }
              };
            }
          }
        } catch (e) {}
      }
      return event;
    });

    // Parse standings if they exist
    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {}

    res.json({
      season: { ...season, standings },
      events: eventsWithWinners
    });
  } catch (error) {
    console.error('Error fetching tennis season:', error);
    res.status(500).json({ error: 'Failed to fetch tennis season' });
  }
});

// Create a new season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.body;

    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check if an active season already exists
    const existingSeason = get(`
      SELECT * FROM tennis_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [req.params.worldId]);

    if (existingSeason) {
      return res.status(400).json({ error: 'An active season already exists. Complete or reset it first.' });
    }

    // Create season
    const seasonId = uuidv4();
    const seasonName = `ATP Tour ${year}`;

    run(`
      INSERT INTO tennis_seasons (id, world_id, name, year, status, current_event_index, standings)
      VALUES (?, ?, ?, ?, 'not_started', 0, '[]')
    `, [seasonId, req.params.worldId, seasonName, year]);

    // Generate calendar events
    const calendar = generateCalendarForYear(year);

    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO tennis_events (
          id, season_id, event_index, name, location, country, surface,
          tournament_type, points, draw_size, date, end_date, status, results, rounds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', NULL, NULL)
      `, [
        eventId, seasonId, event.event_index, event.name, event.location, event.country, event.surface,
        event.tournament_type, event.points, event.draw_size, event.date, event.end_date
      ]);
    }

    const season = get('SELECT * FROM tennis_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM tennis_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.status(201).json({
      message: `Created ${seasonName} with ${events.length} tournaments`,
      season,
      events
    });
  } catch (error) {
    console.error('Error creating tennis season:', error);
    res.status(500).json({ error: 'Failed to create tennis season' });
  }
});

// Reset a season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT s.*, w.user_id FROM tennis_seasons s
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE s.id = ?
    `, [req.params.seasonId]);

    if (!season || season.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // Delete existing events
    run('DELETE FROM tennis_events WHERE season_id = ?', [req.params.seasonId]);

    // Reset season
    run(`
      UPDATE tennis_seasons
      SET status = 'not_started', current_event_index = 0, standings = '[]'
      WHERE id = ?
    `, [req.params.seasonId]);

    // Regenerate calendar events
    const calendar = generateCalendarForYear(season.year);

    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO tennis_events (
          id, season_id, event_index, name, location, country, surface,
          tournament_type, points, draw_size, date, end_date, status, results, rounds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', NULL, NULL)
      `, [
        eventId, req.params.seasonId, event.event_index, event.name, event.location, event.country, event.surface,
        event.tournament_type, event.points, event.draw_size, event.date, event.end_date
      ]);
    }

    // Reset player stats
    run(`
      UPDATE tennis_players
      SET ranking_points = 0, matches_won = 0, matches_lost = 0
      WHERE world_id = ?
    `, [season.world_id]);

    res.json({ message: 'Season reset successfully' });
  } catch (error) {
    console.error('Error resetting tennis season:', error);
    res.status(500).json({ error: 'Failed to reset tennis season' });
  }
});

// Delete a season
router.delete('/season/:seasonId', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT s.*, w.user_id FROM tennis_seasons s
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE s.id = ?
    `, [req.params.seasonId]);

    if (!season || season.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Season not found' });
    }

    run('DELETE FROM tennis_events WHERE season_id = ?', [req.params.seasonId]);
    run('DELETE FROM tennis_seasons WHERE id = ?', [req.params.seasonId]);

    res.json({ message: 'Season deleted successfully' });
  } catch (error) {
    console.error('Error deleting tennis season:', error);
    res.status(500).json({ error: 'Failed to delete tennis season' });
  }
});

// ==================== EVENTS ====================

// Get event by ID
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, w.user_id
      FROM tennis_events e
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Parse results if they exist
    let results = null;
    try {
      results = JSON.parse(event.results || 'null');
    } catch (e) {}

    let rounds = null;
    try {
      rounds = JSON.parse(event.rounds || 'null');
    } catch (e) {}

    res.json({
      event: {
        ...event,
        results,
        rounds
      }
    });
  } catch (error) {
    console.error('Error fetching tennis event:', error);
    res.status(500).json({ error: 'Failed to fetch tennis event' });
  }
});

// Get standings for a world (based on ranking points)
router.get('/world/:worldId/standings', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM tennis_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const players = all(`
      SELECT id, first_name, last_name, country, ranking_points,
        skill_serve, skill_forehand, skill_backhand, skill_volley, skill_movement, skill_mental
      FROM tennis_players
      WHERE world_id = ?
      ORDER BY ranking_points DESC, last_name ASC
    `, [req.params.worldId]);

    const standings = players.map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      country: player.country,
      points: player.ranking_points,
      avgSkill: Math.round((player.skill_serve + player.skill_forehand + player.skill_backhand +
                           player.skill_volley + player.skill_movement + player.skill_mental) / 6)
    }));

    res.json({ standings });
  } catch (error) {
    console.error('Error fetching tennis standings:', error);
    res.status(500).json({ error: 'Failed to fetch tennis standings' });
  }
});

// ==================== TOURNAMENT SIMULATION ====================

// Start a tournament (generate bracket and matches)
router.post('/event/:eventId/start', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, w.user_id
      FROM tennis_events e
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'upcoming') {
      return res.status(400).json({ error: 'Tournament has already started or completed' });
    }

    // Get top players by ranking points for this draw size
    const players = all(`
      SELECT * FROM tennis_players
      WHERE world_id = ?
      ORDER BY ranking_points DESC
      LIMIT ?
    `, [event.world_id, event.draw_size]);

    if (players.length < event.draw_size) {
      return res.status(400).json({
        error: `Not enough players. Need ${event.draw_size}, have ${players.length}`
      });
    }

    // Generate bracket
    const bracket = generateBracket(players, event.draw_size, event.tournament_type);

    // Save matches to database
    const bestOf = getBestOf(event.tournament_type);

    for (let roundIndex = 0; roundIndex < bracket.rounds.length; roundIndex++) {
      const round = bracket.rounds[roundIndex];
      for (const match of round.matches) {
        const matchId = uuidv4();
        run(`
          INSERT INTO tennis_matches (
            id, event_id, round, match_number,
            player1_id, player2_id, player1_seed, player2_seed,
            player1_rank, player2_rank,
            winner_id, score, sets, status, best_of
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          matchId, req.params.eventId, round.name, match.matchNumber,
          match.player1?.id || null, match.player2?.id || null,
          match.player1?.seed || null, match.player2?.seed || null,
          match.player1?.rank || null, match.player2?.rank || null,
          null, null, null, match.status, bestOf
        ]);
      }
    }

    // Update event status
    run(`
      UPDATE tennis_events
      SET status = 'in_progress', rounds = ?
      WHERE id = ?
    `, [JSON.stringify(bracket.rounds.map(r => r.name)), req.params.eventId]);

    res.json({
      message: 'Tournament started',
      bracket,
      bestOf
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({ error: 'Failed to start tournament' });
  }
});

// Get tournament bracket with matches
router.get('/event/:eventId/bracket', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, w.user_id
      FROM tennis_events e
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all matches for this event
    const matches = all(`
      SELECT m.*,
        p1.first_name as p1_first_name, p1.last_name as p1_last_name, p1.country as p1_country,
        p2.first_name as p2_first_name, p2.last_name as p2_last_name, p2.country as p2_country,
        m.player1_seed as p1_seed, m.player2_seed as p2_seed,
        m.player1_rank as p1_rank, m.player2_rank as p2_rank
      FROM tennis_matches m
      LEFT JOIN tennis_players p1 ON m.player1_id = p1.id
      LEFT JOIN tennis_players p2 ON m.player2_id = p2.id
      WHERE m.event_id = ?
      ORDER BY m.round, m.match_number
    `, [req.params.eventId]);

    // Group matches by round
    const roundsData = {};
    for (const match of matches) {
      if (!roundsData[match.round]) {
        roundsData[match.round] = [];
      }
      roundsData[match.round].push({
        id: match.id,
        matchNumber: match.match_number,
        player1: match.player1_id ? {
          id: match.player1_id,
          firstName: match.p1_first_name,
          lastName: match.p1_last_name,
          country: match.p1_country,
          seed: match.p1_seed,
          rank: match.p1_rank
        } : null,
        player2: match.player2_id ? {
          id: match.player2_id,
          firstName: match.p2_first_name,
          lastName: match.p2_last_name,
          country: match.p2_country,
          seed: match.p2_seed,
          rank: match.p2_rank
        } : null,
        winnerId: match.winner_id,
        score: match.score,
        status: match.status,
        bestOf: match.best_of
      });
    }

    // Parse rounds order
    let roundsOrder = [];
    try {
      roundsOrder = JSON.parse(event.rounds || '[]');
    } catch (e) {}

    // Build bracket structure
    const bracket = roundsOrder.map(roundName => ({
      name: roundName,
      matches: roundsData[roundName] || []
    }));

    res.json({
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        country: event.country,
        surface: event.surface,
        tournamentType: event.tournament_type,
        points: event.points,
        drawSize: event.draw_size,
        status: event.status
      },
      bracket
    });
  } catch (error) {
    console.error('Error fetching bracket:', error);
    res.status(500).json({ error: 'Failed to fetch bracket' });
  }
});

// Simulate a single match (fast mode)
router.post('/match/:matchId/simulate', authMiddleware, (req, res) => {
  try {
    const match = get(`
      SELECT m.*, e.surface, e.tournament_type, e.id as event_id, s.world_id, w.user_id
      FROM tennis_matches m
      JOIN tennis_events e ON m.event_id = e.id
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE m.id = ?
    `, [req.params.matchId]);

    if (!match || match.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match already completed' });
    }

    if (!match.player1_id || !match.player2_id) {
      return res.status(400).json({ error: 'Match players not set yet' });
    }

    // Get player data
    const player1 = get('SELECT * FROM tennis_players WHERE id = ?', [match.player1_id]);
    const player2 = get('SELECT * FROM tennis_players WHERE id = ?', [match.player2_id]);

    if (!player1 || !player2) {
      return res.status(404).json({ error: 'Players not found' });
    }

    // Simulate match
    const bestOf = match.best_of || getBestOf(match.tournament_type);
    const result = simulateMatchFast(player1, player2, match.surface, bestOf);

    // Update match record
    run(`
      UPDATE tennis_matches
      SET winner_id = ?, score = ?, status = 'completed'
      WHERE id = ?
    `, [result.winnerId, result.score, req.params.matchId]);

    // Update player match stats
    run(`
      UPDATE tennis_players SET matches_won = matches_won + 1 WHERE id = ?
    `, [result.winnerId]);
    run(`
      UPDATE tennis_players SET matches_lost = matches_lost + 1 WHERE id = ?
    `, [result.loserId]);

    // Get winner's seed/rank and advance to next round
    const winnerSeed = result.winnerId === match.player1_id ? match.player1_seed : match.player2_seed;
    const winnerRank = result.winnerId === match.player1_id ? match.player1_rank : match.player2_rank;
    advanceWinnerToNextRound(match.event_id, match.round, match.match_number, result.winnerId, winnerSeed, winnerRank);

    res.json({
      match: {
        id: match.id,
        winnerId: result.winnerId,
        loserId: result.loserId,
        score: result.score,
        status: 'completed'
      },
      player1: { id: player1.id, name: `${player1.first_name} ${player1.last_name}` },
      player2: { id: player2.id, name: `${player2.first_name} ${player2.last_name}` }
    });
  } catch (error) {
    console.error('Error simulating match:', error);
    res.status(500).json({ error: 'Failed to simulate match' });
  }
});

// Simulate a match with full details (for live simulation)
router.post('/match/:matchId/simulate-live', authMiddleware, (req, res) => {
  try {
    const match = get(`
      SELECT m.*, e.surface, e.tournament_type, e.id as event_id, s.world_id, w.user_id
      FROM tennis_matches m
      JOIN tennis_events e ON m.event_id = e.id
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE m.id = ?
    `, [req.params.matchId]);

    if (!match || match.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match already completed' });
    }

    if (!match.player1_id || !match.player2_id) {
      return res.status(400).json({ error: 'Match players not set yet' });
    }

    // Get player data
    const player1 = get('SELECT * FROM tennis_players WHERE id = ?', [match.player1_id]);
    const player2 = get('SELECT * FROM tennis_players WHERE id = ?', [match.player2_id]);

    if (!player1 || !player2) {
      return res.status(404).json({ error: 'Players not found' });
    }

    // Simulate match with full details
    const bestOf = match.best_of || getBestOf(match.tournament_type);
    const result = simulateMatch(player1, player2, match.surface, bestOf);

    // Update match record
    run(`
      UPDATE tennis_matches
      SET winner_id = ?, score = ?, sets = ?, status = 'completed'
      WHERE id = ?
    `, [result.winnerId, result.score, JSON.stringify(result.sets), req.params.matchId]);

    // Update player match stats
    run(`
      UPDATE tennis_players SET matches_won = matches_won + 1 WHERE id = ?
    `, [result.winnerId]);
    run(`
      UPDATE tennis_players SET matches_lost = matches_lost + 1 WHERE id = ?
    `, [result.loserId]);

    // Get winner's seed/rank and advance to next round
    const winnerSeed = result.winnerId === match.player1_id ? match.player1_seed : match.player2_seed;
    const winnerRank = result.winnerId === match.player1_id ? match.player1_rank : match.player2_rank;
    advanceWinnerToNextRound(match.event_id, match.round, match.match_number, result.winnerId, winnerSeed, winnerRank);

    res.json({
      match: {
        id: match.id,
        winnerId: result.winnerId,
        loserId: result.loserId,
        score: result.score,
        status: 'completed'
      },
      player1: {
        id: player1.id,
        firstName: player1.first_name,
        lastName: player1.last_name,
        country: player1.country
      },
      player2: {
        id: player2.id,
        firstName: player2.first_name,
        lastName: player2.last_name,
        country: player2.country
      },
      sets: result.sets,
      p1Sets: result.p1Sets,
      p2Sets: result.p2Sets
    });
  } catch (error) {
    console.error('Error simulating match:', error);
    res.status(500).json({ error: 'Failed to simulate match' });
  }
});

// Helper function to advance winner to next round
function advanceWinnerToNextRound(eventId, currentRound, matchNumber, winnerId, winnerSeed, winnerRank) {
  // Get round order for this event
  const event = get('SELECT rounds FROM tennis_events WHERE id = ?', [eventId]);
  if (!event) return;

  let roundsOrder;
  try {
    roundsOrder = JSON.parse(event.rounds || '[]');
  } catch (e) {
    return;
  }

  const currentRoundIndex = roundsOrder.indexOf(currentRound);
  if (currentRoundIndex === -1 || currentRoundIndex >= roundsOrder.length - 1) {
    // Final round or not found, no next round
    return;
  }

  const nextRound = roundsOrder[currentRoundIndex + 1];
  const nextMatchNumber = Math.ceil(matchNumber / 2);
  const isFirstOfPair = matchNumber % 2 === 1;

  // Update the next round match
  const playerField = isFirstOfPair ? 'player1_id' : 'player2_id';
  const seedField = isFirstOfPair ? 'player1_seed' : 'player2_seed';
  const rankField = isFirstOfPair ? 'player1_rank' : 'player2_rank';

  // Check if match exists
  const nextMatch = get(`
    SELECT id FROM tennis_matches
    WHERE event_id = ? AND round = ? AND match_number = ?
  `, [eventId, nextRound, nextMatchNumber]);

  if (nextMatch) {
    // Update the player field, seed and rank
    run(`
      UPDATE tennis_matches
      SET ${playerField} = ?, ${seedField} = ?, ${rankField} = ?
      WHERE id = ?
    `, [winnerId, winnerSeed || null, winnerRank || null, nextMatch.id]);

    // Then check if both players are now set and update status
    const updatedMatch = get(`
      SELECT player1_id, player2_id FROM tennis_matches WHERE id = ?
    `, [nextMatch.id]);

    if (updatedMatch && updatedMatch.player1_id && updatedMatch.player2_id) {
      run(`
        UPDATE tennis_matches SET status = 'scheduled' WHERE id = ?
      `, [nextMatch.id]);
    }
  }
}

// Simulate entire round
router.post('/event/:eventId/simulate-round', authMiddleware, (req, res) => {
  try {
    const { round } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, w.user_id
      FROM tennis_events e
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all scheduled matches in this round
    const matches = all(`
      SELECT * FROM tennis_matches
      WHERE event_id = ? AND round = ? AND status = 'scheduled'
    `, [req.params.eventId, round]);

    if (matches.length === 0) {
      return res.status(400).json({ error: 'No matches to simulate in this round' });
    }

    const results = [];
    const bestOf = getBestOf(event.tournament_type);

    for (const match of matches) {
      if (!match.player1_id || !match.player2_id) continue;

      const player1 = get('SELECT * FROM tennis_players WHERE id = ?', [match.player1_id]);
      const player2 = get('SELECT * FROM tennis_players WHERE id = ?', [match.player2_id]);

      if (!player1 || !player2) continue;

      const result = simulateMatchFast(player1, player2, event.surface, bestOf);

      // Update match
      run(`
        UPDATE tennis_matches
        SET winner_id = ?, score = ?, status = 'completed'
        WHERE id = ?
      `, [result.winnerId, result.score, match.id]);

      // Update player stats
      run(`UPDATE tennis_players SET matches_won = matches_won + 1 WHERE id = ?`, [result.winnerId]);
      run(`UPDATE tennis_players SET matches_lost = matches_lost + 1 WHERE id = ?`, [result.loserId]);

      // Get winner's seed/rank and advance to next round
      const winnerSeed = result.winnerId === match.player1_id ? match.player1_seed : match.player2_seed;
      const winnerRank = result.winnerId === match.player1_id ? match.player1_rank : match.player2_rank;
      advanceWinnerToNextRound(req.params.eventId, round, match.match_number, result.winnerId, winnerSeed, winnerRank);

      results.push({
        matchId: match.id,
        player1: `${player1.first_name} ${player1.last_name}`,
        player2: `${player2.first_name} ${player2.last_name}`,
        winnerId: result.winnerId,
        score: result.score
      });
    }

    res.json({
      round,
      matchesSimulated: results.length,
      results
    });
  } catch (error) {
    console.error('Error simulating round:', error);
    res.status(500).json({ error: 'Failed to simulate round' });
  }
});

// Complete tournament and award points
router.post('/event/:eventId/complete', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id, w.user_id
      FROM tennis_events e
      JOIN tennis_seasons s ON e.season_id = s.id
      JOIN tennis_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get final match to find winner
    const finalMatch = get(`
      SELECT * FROM tennis_matches
      WHERE event_id = ? AND round = 'Final' AND status = 'completed'
    `, [req.params.eventId]);

    if (!finalMatch) {
      return res.status(400).json({ error: 'Tournament not yet completed - final not played' });
    }

    // Get all rounds to determine points
    let roundsOrder;
    try {
      roundsOrder = JSON.parse(event.rounds || '[]');
    } catch (e) {
      roundsOrder = [];
    }

    // Award points to all players based on their exit round
    const matches = all(`
      SELECT m.*,
        CASE WHEN m.winner_id = m.player1_id THEN m.player2_id ELSE m.player1_id END as loser_id
      FROM tennis_matches m
      WHERE m.event_id = ? AND m.status = 'completed'
    `, [req.params.eventId]);

    const playerPoints = {};
    const playerResults = {};

    // Track losers and their exit round
    for (const match of matches) {
      if (match.loser_id) {
        const points = getPointsForRound(event.tournament_type, match.round);
        playerPoints[match.loser_id] = (playerPoints[match.loser_id] || 0) + points;
        playerResults[match.loser_id] = formatRoundResult(match.round);
      }
    }

    // Winner gets winner points
    if (finalMatch.winner_id) {
      const winnerPoints = getPointsForRound(event.tournament_type, 'Winner');
      playerPoints[finalMatch.winner_id] = winnerPoints;
      playerResults[finalMatch.winner_id] = 'W';

      // Update winner's career stats
      const isGrandSlam = event.tournament_type === 'grand_slam';
      run(`
        UPDATE tennis_players
        SET career_titles = career_titles + 1
        ${isGrandSlam ? ', career_gs_titles = career_gs_titles + 1' : ''}
        WHERE id = ?
      `, [finalMatch.winner_id]);

      // Update Grand Slam best if applicable
      const gsCode = getGrandSlamCode(event.name);
      if (gsCode) {
        const gsField = `best_${gsCode}`;
        run(`UPDATE tennis_players SET ${gsField} = 'W' WHERE id = ? AND (${gsField} IS NULL OR ${gsField} != 'W')`, [finalMatch.winner_id]);
      }
    }

    // Apply points to all players
    for (const [playerId, points] of Object.entries(playerPoints)) {
      run(`
        UPDATE tennis_players
        SET ranking_points = ranking_points + ?
        WHERE id = ?
      `, [points, playerId]);
    }

    // Update Grand Slam bests for finalist
    const finalistId = finalMatch.winner_id === finalMatch.player1_id
      ? finalMatch.player2_id : finalMatch.player1_id;
    const gsCode = getGrandSlamCode(event.name);
    if (gsCode && finalistId) {
      const gsField = `best_${gsCode}`;
      const finalist = get(`SELECT ${gsField} FROM tennis_players WHERE id = ?`, [finalistId]);
      if (finalist && !finalist[gsField] || finalist[gsField] === null) {
        run(`UPDATE tennis_players SET ${gsField} = 'F' WHERE id = ?`, [finalistId]);
      }
    }

    // Update all players' career high rankings
    const allPlayers = all(`
      SELECT id, ranking_points FROM tennis_players
      WHERE world_id = ?
      ORDER BY ranking_points DESC
    `, [event.world_id]);

    allPlayers.forEach((player, index) => {
      const rank = index + 1;
      run(`
        UPDATE tennis_players
        SET career_high_ranking = CASE
          WHEN career_high_ranking IS NULL OR ? < career_high_ranking THEN ?
          ELSE career_high_ranking
        END
        WHERE id = ?
      `, [rank, rank, player.id]);
    });

    // Update event status
    run(`
      UPDATE tennis_events
      SET status = 'completed', results = ?
      WHERE id = ?
    `, [JSON.stringify({
      winner: finalMatch.winner_id,
      finalist: finalistId,
      playerResults
    }), req.params.eventId]);

    // Move to next event in season
    run(`
      UPDATE tennis_seasons
      SET current_event_index = current_event_index + 1
      WHERE id = ?
    `, [event.season_id]);

    res.json({
      message: 'Tournament completed',
      winner: finalMatch.winner_id,
      pointsAwarded: playerPoints
    });
  } catch (error) {
    console.error('Error completing tournament:', error);
    res.status(500).json({ error: 'Failed to complete tournament' });
  }
});

// ==================== PLAYER PROFILE ====================

// Get player's season calendar with results for each event
router.get('/player/:playerId/season-calendar', authMiddleware, (req, res) => {
  try {
    const player = get(`
      SELECT p.*, w.user_id, w.id as world_id
      FROM tennis_players p
      JOIN tennis_worlds w ON p.world_id = w.id
      WHERE p.id = ?
    `, [req.params.playerId]);

    if (!player || player.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get current season
    const season = get(`
      SELECT * FROM tennis_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year DESC LIMIT 1
    `, [player.world_id]);

    if (!season) {
      return res.json({ calendar: [], seasonName: null });
    }

    // Get all events for the season
    const events = all(`
      SELECT * FROM tennis_events
      WHERE season_id = ?
      ORDER BY event_index ASC
    `, [season.id]);

    // For each event, find the player's result
    const calendar = events.map(event => {
      let result = null;
      let points = 0;
      let winner = null;

      if (event.status === 'completed') {
        // Parse results to get player's finish
        let results = null;
        try {
          results = JSON.parse(event.results || 'null');
        } catch (e) {}

        if (results) {
          // Get winner info
          if (results.winner) {
            const winnerPlayer = get(`
              SELECT first_name, last_name, country FROM tennis_players WHERE id = ?
            `, [results.winner]);
            if (winnerPlayer) {
              winner = {
                id: results.winner,
                firstName: winnerPlayer.first_name,
                lastName: winnerPlayer.last_name,
                country: winnerPlayer.country
              };
            }
          }

          if (results.playerResults) {
            result = results.playerResults[req.params.playerId] || null;
            if (result) {
              points = getPointsForRound(event.tournament_type, result === 'W' ? 'Winner' : result);
            }
          }
        }
      } else if (event.status === 'in_progress') {
        // Check if player is still in tournament or was eliminated
        const playerMatch = get(`
          SELECT m.*, m.round
          FROM tennis_matches m
          WHERE m.event_id = ?
            AND (m.player1_id = ? OR m.player2_id = ?)
            AND m.status = 'completed'
          ORDER BY m.id DESC
          LIMIT 1
        `, [event.id, req.params.playerId, req.params.playerId]);

        if (playerMatch) {
          if (playerMatch.winner_id === req.params.playerId) {
            result = 'active'; // Still in tournament
          } else {
            result = formatRoundResult(playerMatch.round);
          }
        } else {
          // Check if player has an upcoming match
          const upcomingMatch = get(`
            SELECT id FROM tennis_matches
            WHERE event_id = ?
              AND (player1_id = ? OR player2_id = ?)
              AND status != 'completed'
          `, [event.id, req.params.playerId, req.params.playerId]);

          if (upcomingMatch) {
            result = 'active';
          }
        }
      }

      return {
        eventId: event.id,
        eventIndex: event.event_index,
        name: event.name,
        location: event.location,
        country: event.country,
        surface: event.surface,
        tournamentType: event.tournament_type,
        maxPoints: event.points,
        date: event.date,
        status: event.status,
        result,
        pointsEarned: points,
        winner
      };
    });

    res.json({
      calendar,
      seasonName: season.name,
      seasonYear: season.year
    });
  } catch (error) {
    console.error('Error fetching player season calendar:', error);
    res.status(500).json({ error: 'Failed to fetch player season calendar' });
  }
});

// Get player profile with history
router.get('/player/:playerId/profile', authMiddleware, (req, res) => {
  try {
    const player = get(`
      SELECT p.*, w.user_id, w.id as world_id
      FROM tennis_players p
      JOIN tennis_worlds w ON p.world_id = w.id
      WHERE p.id = ?
    `, [req.params.playerId]);

    if (!player || player.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get current ranking
    const rankResult = get(`
      SELECT COUNT(*) + 1 as rank
      FROM tennis_players
      WHERE world_id = ? AND ranking_points > ?
    `, [player.world_id, player.ranking_points]);

    // Get recent match history
    const recentMatches = all(`
      SELECT m.*, e.name as event_name, e.surface, e.tournament_type,
        p1.first_name as p1_first, p1.last_name as p1_last, p1.country as p1_country,
        p2.first_name as p2_first, p2.last_name as p2_last, p2.country as p2_country
      FROM tennis_matches m
      JOIN tennis_events e ON m.event_id = e.id
      LEFT JOIN tennis_players p1 ON m.player1_id = p1.id
      LEFT JOIN tennis_players p2 ON m.player2_id = p2.id
      WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.status = 'completed'
      ORDER BY m.created_at DESC
      LIMIT 20
    `, [req.params.playerId, req.params.playerId]);

    const profile = {
      id: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      country: player.country,
      currentRank: rankResult?.rank || null,
      rankingPoints: player.ranking_points,
      skills: {
        serve: player.skill_serve,
        forehand: player.skill_forehand,
        backhand: player.skill_backhand,
        volley: player.skill_volley,
        movement: player.skill_movement,
        mental: player.skill_mental
      },
      consistency: player.consistency,
      form: player.form,
      specialty: player.specialty,
      career: {
        highestRanking: player.career_high_ranking,
        titles: player.career_titles,
        grandSlamTitles: player.career_gs_titles,
        matchesWon: player.matches_won,
        matchesLost: player.matches_lost,
        winPercentage: player.matches_won + player.matches_lost > 0
          ? Math.round((player.matches_won / (player.matches_won + player.matches_lost)) * 100)
          : 0
      },
      grandSlams: {
        australianOpen: player.best_aus,
        frenchOpen: player.best_fra,
        wimbledon: player.best_wim,
        usOpen: player.best_uso
      },
      recentMatches: recentMatches.map(m => ({
        id: m.id,
        event: m.event_name,
        surface: m.surface,
        round: m.round,
        opponent: m.player1_id === req.params.playerId
          ? { firstName: m.p2_first, lastName: m.p2_last, country: m.p2_country }
          : { firstName: m.p1_first, lastName: m.p1_last, country: m.p1_country },
        won: m.winner_id === req.params.playerId,
        score: m.score
      }))
    };

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({ error: 'Failed to fetch player profile' });
  }
});

module.exports = router;
