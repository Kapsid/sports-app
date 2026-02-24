const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateCalendarForYear, getPointsForPosition, TOURNAMENT_TYPES } = require('../data/golfCalendar');
const { generatePlayers } = require('../data/golfNames');
const { generateCourseHoles, simulateRound, applyCut, calculatePositions } = require('../data/golfSimulation');

const router = express.Router();

// ==================== WORLDS ====================

// Get all golf worlds for current user
router.get('/worlds', authMiddleware, (req, res) => {
  try {
    const worlds = all(`
      SELECT w.*,
        (SELECT COUNT(*) FROM golf_players WHERE world_id = w.id) as players_count,
        (SELECT COUNT(*) FROM golf_seasons WHERE world_id = w.id) as seasons_count
      FROM golf_worlds w
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json({ worlds });
  } catch (error) {
    console.error('Error fetching golf worlds:', error);
    res.status(500).json({ error: 'Failed to fetch golf worlds' });
  }
});

// Get golf world by ID
router.get('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const world = get(
      'SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?',
      [req.params.worldId, req.user.id]
    );

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    res.json({ world });
  } catch (error) {
    console.error('Error fetching golf world:', error);
    res.status(500).json({ error: 'Failed to fetch golf world' });
  }
});

// Create new golf world
router.post('/worlds', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'World name is required' });
    }

    const worldId = uuidv4();
    run(
      'INSERT INTO golf_worlds (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [worldId, req.user.id, name, description || '']
    );

    const world = get('SELECT * FROM golf_worlds WHERE id = ?', [worldId]);
    res.status(201).json({ world });
  } catch (error) {
    console.error('Error creating golf world:', error);
    res.status(500).json({ error: 'Failed to create golf world' });
  }
});

// Delete golf world
router.delete('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM golf_worlds WHERE id = ?', [req.params.worldId]);
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting golf world:', error);
    res.status(500).json({ error: 'Failed to delete golf world' });
  }
});

// ==================== PLAYERS ====================

// Get all golfers for a world
router.get('/world/:worldId/players', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const players = all(`
      SELECT * FROM golf_players
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
    console.error('Error fetching golf players:', error);
    res.status(500).json({ error: 'Failed to fetch golf players' });
  }
});

// Generate golfers for a world
router.post('/world/:worldId/generate-players', authMiddleware, (req, res) => {
  try {
    const { count = 120 } = req.body;

    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Generate players
    const players = generatePlayers(req.params.worldId, count);

    // Insert players into database
    for (const player of players) {
      const playerId = uuidv4();
      run(`
        INSERT INTO golf_players (
          id, world_id, first_name, last_name, country,
          skill_driving, skill_iron_play, skill_short_game,
          skill_putting, skill_mental, consistency, form,
          ranking_points
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        playerId, player.world_id, player.first_name, player.last_name, player.country,
        player.skill_driving, player.skill_iron_play, player.skill_short_game,
        player.skill_putting, player.skill_mental, player.consistency, player.form,
        player.ranking_points
      ]);
    }

    res.json({ message: `Generated ${count} golfers`, count: players.length });
  } catch (error) {
    console.error('Error generating golf players:', error);
    res.status(500).json({ error: 'Failed to generate golf players' });
  }
});

// Create a single golfer
router.post('/world/:worldId/player', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const {
      first_name, last_name, country,
      skill_driving = 70, skill_iron_play = 70, skill_short_game = 70,
      skill_putting = 70, skill_mental = 70,
      consistency = 70, form = 70
    } = req.body;

    if (!first_name || !last_name || !country) {
      return res.status(400).json({ error: 'First name, last name, and country are required' });
    }

    const playerId = uuidv4();
    run(`
      INSERT INTO golf_players (
        id, world_id, first_name, last_name, country,
        skill_driving, skill_iron_play, skill_short_game,
        skill_putting, skill_mental, consistency, form,
        ranking_points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      playerId, req.params.worldId, first_name, last_name, country,
      skill_driving, skill_iron_play, skill_short_game,
      skill_putting, skill_mental, consistency, form
    ]);

    const player = get('SELECT * FROM golf_players WHERE id = ?', [playerId]);
    res.status(201).json({ player });
  } catch (error) {
    console.error('Error creating golf player:', error);
    res.status(500).json({ error: 'Failed to create golf player' });
  }
});

// Update a golfer
router.put('/player/:id', authMiddleware, (req, res) => {
  try {
    const player = get('SELECT p.*, w.user_id FROM golf_players p JOIN golf_worlds w ON p.world_id = w.id WHERE p.id = ?', [req.params.id]);
    if (!player || player.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const {
      first_name, last_name, country,
      skill_driving, skill_iron_play, skill_short_game,
      skill_putting, skill_mental,
      consistency, form
    } = req.body;

    run(`
      UPDATE golf_players SET
        first_name = ?, last_name = ?, country = ?,
        skill_driving = ?, skill_iron_play = ?, skill_short_game = ?,
        skill_putting = ?, skill_mental = ?,
        consistency = ?, form = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      first_name || player.first_name,
      last_name || player.last_name,
      country || player.country,
      skill_driving !== undefined ? skill_driving : player.skill_driving,
      skill_iron_play !== undefined ? skill_iron_play : player.skill_iron_play,
      skill_short_game !== undefined ? skill_short_game : player.skill_short_game,
      skill_putting !== undefined ? skill_putting : player.skill_putting,
      skill_mental !== undefined ? skill_mental : player.skill_mental,
      consistency !== undefined ? consistency : player.consistency,
      form !== undefined ? form : player.form,
      req.params.id
    ]);

    const updatedPlayer = get('SELECT * FROM golf_players WHERE id = ?', [req.params.id]);
    res.json({ player: updatedPlayer });
  } catch (error) {
    console.error('Error updating golf player:', error);
    res.status(500).json({ error: 'Failed to update golf player' });
  }
});

// Delete a golfer
router.delete('/player/:id', authMiddleware, (req, res) => {
  try {
    const player = get('SELECT p.*, w.user_id FROM golf_players p JOIN golf_worlds w ON p.world_id = w.id WHERE p.id = ?', [req.params.id]);
    if (!player || player.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    run('DELETE FROM golf_players WHERE id = ?', [req.params.id]);
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting golf player:', error);
    res.status(500).json({ error: 'Failed to delete golf player' });
  }
});

// Delete all golfers in a world
router.delete('/world/:worldId/all-players', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM golf_players WHERE world_id = ?', [req.params.worldId]);
    res.json({ message: 'All players deleted successfully' });
  } catch (error) {
    console.error('Error deleting all golf players:', error);
    res.status(500).json({ error: 'Failed to delete all golf players' });
  }
});

// ==================== SEASONS ====================

// Create a new season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.body;

    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check if an active season already exists
    const existingSeason = get(`
      SELECT * FROM golf_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [req.params.worldId]);

    if (existingSeason) {
      return res.status(400).json({ error: 'An active season already exists. Complete or reset it first.' });
    }

    // Create season
    const seasonId = uuidv4();
    const seasonName = `PGA Tour ${year}`;

    run(`
      INSERT INTO golf_seasons (id, world_id, name, year, status, current_event_index, standings)
      VALUES (?, ?, ?, ?, 'not_started', 0, '[]')
    `, [seasonId, req.params.worldId, seasonName, year]);

    // Generate calendar events
    const calendar = generateCalendarForYear(year);

    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO golf_events (
          id, season_id, event_index, name, location, country,
          course_name, course_par, tournament_type, field_size,
          date, status, current_round,
          round1_results, round2_results, round3_results, round4_results,
          cut_line, results
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 0, NULL, NULL, NULL, NULL, NULL, NULL)
      `, [
        eventId, seasonId, event.event_index, event.name, event.location, event.country,
        event.course_name, event.course_par, event.tournament_type, event.field_size,
        event.date
      ]);
    }

    const season = get('SELECT * FROM golf_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM golf_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.status(201).json({
      message: `Created ${seasonName} with ${events.length} tournaments`,
      season,
      events
    });
  } catch (error) {
    console.error('Error creating golf season:', error);
    res.status(500).json({ error: 'Failed to create golf season' });
  }
});

// Get current season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM golf_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year DESC LIMIT 1
    `, [req.params.worldId]);

    if (!season) {
      return res.json({ season: null, events: [] });
    }

    const events = all(`
      SELECT * FROM golf_events
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
              SELECT id, first_name, last_name, country FROM golf_players WHERE id = ?
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
    console.error('Error fetching golf season:', error);
    res.status(500).json({ error: 'Failed to fetch golf season' });
  }
});

// Reset a season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT s.*, w.user_id FROM golf_seasons s
      JOIN golf_worlds w ON s.world_id = w.id
      WHERE s.id = ?
    `, [req.params.seasonId]);

    if (!season || season.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // Delete existing events
    run('DELETE FROM golf_events WHERE season_id = ?', [req.params.seasonId]);

    // Reset season
    run(`
      UPDATE golf_seasons
      SET status = 'not_started', current_event_index = 0, standings = '[]'
      WHERE id = ?
    `, [req.params.seasonId]);

    // Regenerate calendar events
    const calendar = generateCalendarForYear(season.year);

    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO golf_events (
          id, season_id, event_index, name, location, country,
          course_name, course_par, tournament_type, field_size,
          date, status, current_round,
          round1_results, round2_results, round3_results, round4_results,
          cut_line, results
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 0, NULL, NULL, NULL, NULL, NULL, NULL)
      `, [
        eventId, req.params.seasonId, event.event_index, event.name, event.location, event.country,
        event.course_name, event.course_par, event.tournament_type, event.field_size,
        event.date
      ]);
    }

    // Reset player stats
    run(`
      UPDATE golf_players
      SET ranking_points = 0, career_wins = 0, career_major_wins = 0,
          career_top10s = 0, tournaments_played = 0, best_finish = NULL
      WHERE world_id = ?
    `, [season.world_id]);

    res.json({ message: 'Season reset successfully' });
  } catch (error) {
    console.error('Error resetting golf season:', error);
    res.status(500).json({ error: 'Failed to reset golf season' });
  }
});

// Delete a season
router.delete('/season/:seasonId', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT s.*, w.user_id FROM golf_seasons s
      JOIN golf_worlds w ON s.world_id = w.id
      WHERE s.id = ?
    `, [req.params.seasonId]);

    if (!season || season.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Season not found' });
    }

    run('DELETE FROM golf_events WHERE season_id = ?', [req.params.seasonId]);
    run('DELETE FROM golf_seasons WHERE id = ?', [req.params.seasonId]);

    res.json({ message: 'Season deleted successfully' });
  } catch (error) {
    console.error('Error deleting golf season:', error);
    res.status(500).json({ error: 'Failed to delete golf season' });
  }
});

// ==================== EVENTS ====================

// Get event by ID
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, w.user_id
      FROM golf_events e
      JOIN golf_seasons s ON e.season_id = s.id
      JOIN golf_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Parse round results if they exist
    let round1_results = null;
    let round2_results = null;
    let round3_results = null;
    let round4_results = null;
    let results = null;

    try { round1_results = JSON.parse(event.round1_results || 'null'); } catch (e) {}
    try { round2_results = JSON.parse(event.round2_results || 'null'); } catch (e) {}
    try { round3_results = JSON.parse(event.round3_results || 'null'); } catch (e) {}
    try { round4_results = JSON.parse(event.round4_results || 'null'); } catch (e) {}
    try { results = JSON.parse(event.results || 'null'); } catch (e) {}

    res.json({
      event: {
        ...event,
        round1_results,
        round2_results,
        round3_results,
        round4_results,
        results
      }
    });
  } catch (error) {
    console.error('Error fetching golf event:', error);
    res.status(500).json({ error: 'Failed to fetch golf event' });
  }
});

// ==================== TOURNAMENT SIMULATION ====================

// Simulate a round
router.post('/event/:eventId/simulate-round', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, w.user_id
      FROM golf_events e
      JOIN golf_seasons s ON e.season_id = s.id
      JOIN golf_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Determine which round to simulate
    const currentRound = event.current_round || 0;
    const roundNumber = currentRound + 1;

    if (roundNumber > 4) {
      return res.status(400).json({ error: 'All rounds have been played' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Event is already completed' });
    }

    // Get the field for this round
    let field = [];

    if (roundNumber === 1) {
      // Round 1: get top N players by ranking_points
      field = all(`
        SELECT * FROM golf_players
        WHERE world_id = ?
        ORDER BY ranking_points DESC
        LIMIT ?
      `, [event.world_id, event.field_size]);

      if (field.length < 2) {
        return res.status(400).json({ error: 'Not enough players to simulate a round' });
      }

      // Update event status
      if (event.status === 'upcoming') {
        run(`UPDATE golf_events SET status = 'in_progress' WHERE id = ?`, [req.params.eventId]);
      }
    } else {
      // Rounds 2-4: get players from previous round results
      const prevRoundColumn = `round${roundNumber - 1}_results`;
      const prevRoundData = event[prevRoundColumn];

      if (!prevRoundData) {
        return res.status(400).json({ error: `Previous round (${roundNumber - 1}) has not been played yet` });
      }

      let prevResults;
      try {
        prevResults = JSON.parse(prevRoundData);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse previous round results' });
      }

      // Get active players (those who haven't missed the cut)
      const activePlayerIds = prevResults
        .filter(r => !r.missedCut)
        .map(r => r.playerId);

      if (activePlayerIds.length === 0) {
        return res.status(400).json({ error: 'No active players remaining' });
      }

      // Fetch full player data for active players
      const placeholders = activePlayerIds.map(() => '?').join(',');
      field = all(`
        SELECT * FROM golf_players
        WHERE id IN (${placeholders})
      `, activePlayerIds);
    }

    // Generate course holes
    const courseHoles = generateCourseHoles(event.course_par);

    // Get previous round totals for running score calculation
    let previousTotals = {};
    if (roundNumber > 1) {
      for (let r = 1; r < roundNumber; r++) {
        const roundCol = `round${r}_results`;
        const roundData = event[roundCol];
        if (roundData) {
          let parsed;
          try {
            parsed = JSON.parse(roundData);
          } catch (e) {
            continue;
          }
          for (const result of parsed) {
            if (!previousTotals[result.playerId]) {
              previousTotals[result.playerId] = { totalScore: 0, totalStrokes: 0 };
            }
            previousTotals[result.playerId].totalScore = result.totalScore;
            previousTotals[result.playerId].totalStrokes = result.totalStrokes;
          }
        }
      }
    }

    // Compute world rankings for all players in this world
    const allPlayers = all(`
      SELECT id FROM golf_players
      WHERE world_id = ?
      ORDER BY ranking_points DESC
    `, [event.world_id]);
    const worldRankMap = {};
    allPlayers.forEach((p, i) => { worldRankMap[p.id] = i + 1; });

    // Simulate each player's round
    const roundResults = [];

    for (const player of field) {
      const roundData = simulateRound(player, courseHoles);

      // Calculate running totals
      const prev = previousTotals[player.id] || { totalScore: 0, totalStrokes: 0 };
      const totalScore = prev.totalScore + roundData.roundScore;
      const totalStrokes = prev.totalStrokes + roundData.roundStrokes;

      roundResults.push({
        playerId: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        country: player.country,
        worldRanking: worldRankMap[player.id] || null,
        holeResults: roundData.holeResults,
        roundScore: roundData.roundScore,
        roundStrokes: roundData.roundStrokes,
        totalScore,
        totalStrokes,
        missedCut: false
      });
    }

    // Apply cut after round 2 (top 65 + ties)
    let cutApplied = false;
    let cutLine = null;

    if (roundNumber === 2) {
      const cutResult = applyCut(roundResults, 65);
      cutApplied = true;
      cutLine = cutResult.cutLine;

      // Mark players who missed the cut
      const missedIds = new Set(cutResult.missedTheCut.map(r => r.playerId));
      for (const result of roundResults) {
        if (missedIds.has(result.playerId)) {
          result.missedCut = true;
        }
      }

      // Store cut line on the event
      run(`UPDATE golf_events SET cut_line = ? WHERE id = ?`, [cutLine, req.params.eventId]);
    }

    // Calculate positions (only for active players)
    const activeResults = roundResults.filter(r => !r.missedCut);
    const positioned = calculatePositions(activeResults);

    // Build a lookup map from the positioned array
    const positionsMap = {};
    for (const r of positioned) {
      positionsMap[r.playerId] = { position: r.position, tied: r.tied };
    }

    for (const result of roundResults) {
      if (!result.missedCut && positionsMap[result.playerId]) {
        result.position = positionsMap[result.playerId].position;
        result.tied = positionsMap[result.playerId].tied;
      } else if (result.missedCut) {
        result.position = null;
        result.tied = false;
      }
    }

    // Sort results: active players by position first, then missed cut players
    roundResults.sort((a, b) => {
      if (a.missedCut && !b.missedCut) return 1;
      if (!a.missedCut && b.missedCut) return -1;
      if (a.missedCut && b.missedCut) return a.totalStrokes - b.totalStrokes;
      return a.totalScore - b.totalScore;
    });

    // Store results in the corresponding round column
    const roundColumn = `round${roundNumber}_results`;
    run(`UPDATE golf_events SET ${roundColumn} = ?, current_round = ? WHERE id = ?`, [
      JSON.stringify(roundResults),
      roundNumber,
      req.params.eventId
    ]);

    // Update season status if this is the first event action
    const season = get(`SELECT * FROM golf_seasons WHERE id = ?`, [event.season_id]);
    if (season && season.status === 'not_started') {
      run(`UPDATE golf_seasons SET status = 'in_progress' WHERE id = ?`, [event.season_id]);
    }

    res.json({
      roundNumber,
      coursePar: event.course_par,
      courseHoles,
      results: roundResults,
      cutApplied,
      cutLine
    });
  } catch (error) {
    console.error('Error simulating golf round:', error);
    res.status(500).json({ error: 'Failed to simulate golf round' });
  }
});

// Complete tournament and award FedExCup points
router.post('/event/:eventId/complete', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id, w.user_id
      FROM golf_events e
      JOIN golf_seasons s ON e.season_id = s.id
      JOIN golf_worlds w ON s.world_id = w.id
      WHERE e.id = ?
    `, [req.params.eventId]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.current_round < 4) {
      return res.status(400).json({ error: 'Not all rounds have been played yet' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Event is already completed' });
    }

    // Parse round 4 results for final standings
    let finalResults;
    try {
      finalResults = JSON.parse(event.round4_results);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse final round results' });
    }

    if (!finalResults || finalResults.length === 0) {
      return res.status(400).json({ error: 'No results found for final round' });
    }

    // Get active players (those who made the cut) sorted by total score
    const activeResults = finalResults
      .filter(r => !r.missedCut)
      .sort((a, b) => a.totalScore - b.totalScore);

    // Award FedExCup points and update player stats
    const pointsAwarded = {};

    for (const result of activeResults) {
      const position = result.position;
      const points = getPointsForPosition(event.tournament_type, position);

      if (points > 0) {
        // Update ranking points
        run(`
          UPDATE golf_players
          SET ranking_points = ranking_points + ?
          WHERE id = ?
        `, [points, result.playerId]);
        pointsAwarded[result.playerId] = points;
      }

      // Update career_wins for position 1
      if (position === 1) {
        run(`
          UPDATE golf_players
          SET career_wins = career_wins + 1
          WHERE id = ?
        `, [result.playerId]);

        // Update career_major_wins if this is a major
        if (event.tournament_type === 'major') {
          run(`
            UPDATE golf_players
            SET career_major_wins = career_major_wins + 1
            WHERE id = ?
          `, [result.playerId]);
        }
      }

      // Update career_top10s for positions 1-10
      if (position >= 1 && position <= 10) {
        run(`
          UPDATE golf_players
          SET career_top10s = career_top10s + 1
          WHERE id = ?
        `, [result.playerId]);
      }

      // Increment tournaments_played
      run(`
        UPDATE golf_players
        SET tournaments_played = tournaments_played + 1
        WHERE id = ?
      `, [result.playerId]);

      // Update best_finish if this finish is better (lower) than existing
      run(`
        UPDATE golf_players
        SET best_finish = CASE
          WHEN best_finish IS NULL OR ? < best_finish THEN ?
          ELSE best_finish
        END
        WHERE id = ?
      `, [position, position, result.playerId]);
    }

    // Also update tournaments_played for players who missed the cut
    const missedCutPlayers = finalResults.filter(r => r.missedCut);
    // Players who missed cut won't be in round4, check round2 results instead
    let round2Results;
    try {
      round2Results = JSON.parse(event.round2_results || 'null');
    } catch (e) {
      round2Results = null;
    }

    if (round2Results) {
      const missedCutFromR2 = round2Results.filter(r => r.missedCut);
      for (const result of missedCutFromR2) {
        run(`
          UPDATE golf_players
          SET tournaments_played = tournaments_played + 1
          WHERE id = ?
        `, [result.playerId]);
      }
    }

    // Store final results JSON on the event
    const winnerId = activeResults.length > 0 ? activeResults[0].playerId : null;
    const finalResultsJson = JSON.stringify({
      winner: winnerId,
      standings: activeResults.map(r => ({
        playerId: r.playerId,
        firstName: r.firstName,
        lastName: r.lastName,
        country: r.country,
        position: r.position,
        tied: r.tied,
        totalScore: r.totalScore,
        totalStrokes: r.totalStrokes,
        pointsAwarded: pointsAwarded[r.playerId] || 0
      }))
    });

    // Set event status to completed
    run(`
      UPDATE golf_events
      SET status = 'completed', results = ?
      WHERE id = ?
    `, [finalResultsJson, req.params.eventId]);

    // Increment season's current_event_index
    run(`
      UPDATE golf_seasons
      SET current_event_index = current_event_index + 1
      WHERE id = ?
    `, [event.season_id]);

    res.json({
      message: 'Tournament completed',
      winner: winnerId,
      pointsAwarded
    });
  } catch (error) {
    console.error('Error completing golf tournament:', error);
    res.status(500).json({ error: 'Failed to complete golf tournament' });
  }
});

// ==================== STANDINGS ====================

// Get FedExCup standings for a world
router.get('/world/:worldId/standings', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM golf_worlds WHERE id = ? AND user_id = ?', [req.params.worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const players = all(`
      SELECT id, first_name, last_name, country, ranking_points,
        career_wins, career_major_wins, career_top10s,
        tournaments_played, best_finish
      FROM golf_players
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
      wins: player.career_wins,
      majorWins: player.career_major_wins,
      top10s: player.career_top10s,
      tournamentsPlayed: player.tournaments_played,
      bestFinish: player.best_finish
    }));

    res.json({ standings });
  } catch (error) {
    console.error('Error fetching golf standings:', error);
    res.status(500).json({ error: 'Failed to fetch golf standings' });
  }
});

module.exports = router;
