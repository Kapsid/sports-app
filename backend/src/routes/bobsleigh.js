const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateBobsleighCalendar, worldCupPoints, bobsleighCountryNames } = require('../data/bobsleighCalendar');
const { allCountries } = require('../data/countries');

const router = express.Router();

// ==================== SIMULATION LOGIC ====================

// Generate a random number with approximate normal distribution (Box-Muller)
function randomNormal(mean = 0, stdDev = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Simulate a single run for a bobsleigh team
function simulateRun(team, trackLength, isRun2 = false) {
  const skillPush = team.skill_push || 70;
  const skillPilot = team.skill_pilot || 70;
  const skillCrew = team.skill_crew || 70;
  const consistency = team.consistency || 70;
  const form = team.form || 70;

  // Base time depends on track length (roughly 1 second per 25 meters)
  const baseTime = trackLength / 25;

  // Check for DNF (crash)
  const baseDNFRate = 0.02; // 2% base DNF rate
  const dnfModifier = (100 - consistency) / 100 * 0.3 + (100 - skillPilot) / 100 * 0.2;
  const dnfChance = baseDNFRate * (1 + dnfModifier);

  if (Math.random() < dnfChance) {
    return {
      dnf: true,
      time: null,
      timeFormatted: 'DNF'
    };
  }

  // Calculate time components

  // Push start effect (skill_push affects first ~5 seconds)
  // Better push = faster start time
  const pushEffect = (70 - skillPush) * 0.015;

  // Pilot effect (steering through the track)
  const pilotEffect = (70 - skillPilot) * 0.025;

  // Crew effect (weight distribution and smoothness)
  const crewEffect = (70 - skillCrew) * 0.015;

  // Form effect (daily condition)
  const formEffect = (70 - form) * 0.01;

  // Random variation based on consistency
  const consistencyMultiplier = 1.5 - (consistency / 100);
  const randomVariation = randomNormal(0, 0.3 * consistencyMultiplier);

  // Day factor (ice conditions, equipment, etc.)
  const dayFactor = randomNormal(0, 0.15);

  // Track section variations (each curve adds tiny variations)
  const trackSections = Math.floor(trackLength / 100);
  let sectionVariation = 0;
  for (let i = 0; i < trackSections; i++) {
    sectionVariation += randomNormal(0, 0.01);
  }

  // Run 2 has slightly different ice conditions
  const run2Modifier = isRun2 ? randomNormal(0.1, 0.2) : 0;

  // Calculate final time
  let time = baseTime + pushEffect + pilotEffect + crewEffect + formEffect +
             randomVariation + dayFactor + sectionVariation + run2Modifier;

  // Small mistakes can add time
  const mistakeChance = (100 - consistency) / 100 * 0.2;
  if (Math.random() < mistakeChance) {
    time += randomNormal(0.2, 0.1); // Minor mistake: 0.1-0.3 seconds
  }

  // Ensure reasonable time range
  const avgSkill = (skillPush + skillPilot + skillCrew) / 3;
  const skillBasedMin = baseTime * (0.94 + (100 - avgSkill) * 0.0005);
  const skillBasedMax = baseTime * (1.01 + (100 - avgSkill) * 0.001);
  time = Math.max(skillBasedMin, Math.min(skillBasedMax, time));

  return {
    dnf: false,
    time: Math.round(time * 100) / 100,
    timeFormatted: formatTime(time)
  };
}

// Format time as MM:SS.cc or SS.cc
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return 'DNF';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  }
  return secs.toFixed(2);
}

// Format time difference
function formatTimeDiff(diff) {
  if (diff === null || diff === undefined || diff === 0) return '';
  return `+${diff.toFixed(2)}`;
}

// ==================== TEAM ROUTES ====================

// Get all bobsleigh teams for a world
router.get('/world/:worldId/teams', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const teams = all('SELECT * FROM bobsleigh_teams WHERE world_id = ? ORDER BY name', [worldId]);

    res.json({ teams, countryNames: allCountries });
  } catch (error) {
    console.error('Error fetching bobsleigh teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a new bobsleigh team
router.post('/world/:worldId/team', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const {
      name, country,
      runner1_name, runner2_name, runner3_name, runner4_name,
      skill_push, skill_pilot, skill_crew, consistency, form
    } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    if (!name || !country || !runner1_name || !runner2_name || !runner3_name || !runner4_name) {
      return res.status(400).json({ error: 'Team name, country, and all 4 runner names are required' });
    }

    const id = uuidv4();
    run(`
      INSERT INTO bobsleigh_teams (id, world_id, name, country, runner1_name, runner2_name, runner3_name, runner4_name, skill_push, skill_pilot, skill_crew, consistency, form)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, worldId, name, country, runner1_name, runner2_name, runner3_name, runner4_name,
        skill_push || 70, skill_pilot || 70, skill_crew || 70, consistency || 70, form || 70]);

    const team = get('SELECT * FROM bobsleigh_teams WHERE id = ?', [id]);
    res.json({ team, countryNames: allCountries });
  } catch (error) {
    console.error('Error creating bobsleigh team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update a bobsleigh team
router.put('/team/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, country,
      runner1_name, runner2_name, runner3_name, runner4_name,
      skill_push, skill_pilot, skill_crew, consistency, form
    } = req.body;

    // Verify team belongs to user's world
    const team = get(`
      SELECT t.* FROM bobsleigh_teams t
      INNER JOIN worlds w ON t.world_id = w.id
      WHERE t.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    run(`
      UPDATE bobsleigh_teams SET
        name = ?, country = ?,
        runner1_name = ?, runner2_name = ?, runner3_name = ?, runner4_name = ?,
        skill_push = ?, skill_pilot = ?, skill_crew = ?, consistency = ?, form = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, country, runner1_name, runner2_name, runner3_name, runner4_name,
        skill_push, skill_pilot, skill_crew, consistency, form, id]);

    const updatedTeam = get('SELECT * FROM bobsleigh_teams WHERE id = ?', [id]);
    res.json({ team: updatedTeam, countryNames: allCountries });
  } catch (error) {
    console.error('Error updating bobsleigh team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete a bobsleigh team
router.delete('/team/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Verify team belongs to user's world
    const team = get(`
      SELECT t.* FROM bobsleigh_teams t
      INNER JOIN worlds w ON t.world_id = w.id
      WHERE t.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    run('DELETE FROM bobsleigh_teams WHERE id = ?', [id]);
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Error deleting bobsleigh team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Delete all bobsleigh teams for a world
router.delete('/world/:worldId/all-teams', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM bobsleigh_teams WHERE world_id = ?', [worldId]);
    res.json({ message: 'All teams deleted' });
  } catch (error) {
    console.error('Error deleting all bobsleigh teams:', error);
    res.status(500).json({ error: 'Failed to delete teams' });
  }
});

// ==================== SEASON ROUTES ====================

// Get current bobsleigh season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM bobsleigh_seasons
      WHERE world_id = ?
      ORDER BY
        CASE status
          WHEN 'in_progress' THEN 0
          WHEN 'not_started' THEN 1
          WHEN 'completed' THEN 2
        END,
        year_start DESC
      LIMIT 1
    `, [worldId]);

    if (!season) {
      return res.json({ season: null, events: [], standings: [], countryNames: allCountries });
    }

    const events = all(
      'SELECT * FROM bobsleigh_events WHERE season_id = ? ORDER BY event_index',
      [season.id]
    );

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    const eventsWithResults = events.map(event => ({
      ...event,
      results: JSON.parse(event.results || '[]'),
      run1_results: JSON.parse(event.run1_results || '[]'),
      run2_results: JSON.parse(event.run2_results || '[]'),
      run3_results: JSON.parse(event.run3_results || '[]'),
      run4_results: JSON.parse(event.run4_results || '[]')
    }));

    res.json({
      season,
      events: eventsWithResults,
      standings,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching bobsleigh season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new bobsleigh season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check for active season
    const activeSeason = get(`
      SELECT * FROM bobsleigh_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [worldId]);

    if (activeSeason) {
      return res.status(400).json({ error: 'An active season already exists' });
    }

    // Get last completed season to determine next year
    const lastSeason = get(`
      SELECT * FROM bobsleigh_seasons
      WHERE world_id = ?
      ORDER BY year_end DESC
      LIMIT 1
    `, [worldId]);

    const startYear = lastSeason ? lastSeason.year_end : 2024;
    const endYear = startYear + 1;

    // Create season
    const seasonId = uuidv4();
    const seasonName = `${startYear}/${endYear}`;

    run(`
      INSERT INTO bobsleigh_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'not_started')
    `, [seasonId, worldId, seasonName, startYear, endYear]);

    // Generate calendar
    const calendar = generateBobsleighCalendar(startYear);

    // Insert events
    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO bobsleigh_events (id, season_id, event_index, name, location, country, track_length, date, status, runs, championship)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country,
          event.trackLength, event.date, event.runs || 2, event.championship ? 1 : 0]);
    }

    const season = get('SELECT * FROM bobsleigh_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM bobsleigh_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season created',
      season,
      events: events.map(e => ({ ...e, results: [], run1_results: [], run2_results: [], run3_results: [], run4_results: [] })),
      standings: []
    });
  } catch (error) {
    console.error('Error creating bobsleigh season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM bobsleigh_events e
      INNER JOIN bobsleigh_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const teams = all('SELECT * FROM bobsleigh_teams WHERE world_id = ? ORDER BY name', [event.world_id]);

    res.json({
      event: {
        ...event,
        results: JSON.parse(event.results || '[]'),
        run1_results: JSON.parse(event.run1_results || '[]'),
        run2_results: JSON.parse(event.run2_results || '[]'),
        run3_results: JSON.parse(event.run3_results || '[]'),
        run4_results: JSON.parse(event.run4_results || '[]')
      },
      teams,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching bobsleigh event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Save Run 1 results (accepts results from frontend animation)
router.post('/event/:eventId/simulate', authMiddleware, validateWeekLock('bobsleigh_events', 'bobsleigh_seasons'), (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM bobsleigh_events e
      INNER JOIN bobsleigh_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Race already completed' });
    }

    if (event.status === 'run1_completed') {
      return res.status(400).json({ error: 'Run 1 already completed. Simulate Run 2 instead.' });
    }

    if (event.status === 'run2_completed') {
      return res.status(400).json({ error: 'Run 2 already completed. Simulate Run 3 instead.' });
    }

    if (event.status === 'run3_completed') {
      return res.status(400).json({ error: 'Run 3 already completed. Simulate Run 4 instead.' });
    }

    let runResults;

    // If frontend sent results (from animation), use those
    if (frontendResults && frontendResults.length > 0) {
      runResults = frontendResults;
    } else {
      // Otherwise simulate on backend (fallback)
      const teams = all('SELECT * FROM bobsleigh_teams WHERE world_id = ?', [event.world_id]);

      if (teams.length === 0) {
        return res.status(400).json({ error: 'No teams available' });
      }

      const trackLength = event.track_length || 1400;
      const startOrder = [...teams].sort(() => Math.random() - 0.5);

      runResults = startOrder.map((team, index) => {
        const result = simulateRun(team, trackLength, false);
        return {
          teamId: team.id,
          teamName: team.name,
          country: team.country,
          runner1: team.runner1_name,
          runner2: team.runner2_name,
          runner3: team.runner3_name,
          runner4: team.runner4_name,
          bib: index + 1,
          ...result
        };
      });

      // Sort by time (DNFs at end)
      runResults.sort((a, b) => {
        if (a.dnf && b.dnf) return 0;
        if (a.dnf) return 1;
        if (b.dnf) return -1;
        return a.time - b.time;
      });

      // Assign positions and time behind
      const leaderTime = runResults.find(r => !r.dnf)?.time || 0;
      runResults.forEach((result, index) => {
        result.position = index + 1;
        if (!result.dnf) {
          result.timeBehind = index === 0 || result.time === leaderTime ? 0 : Math.round((result.time - leaderTime) * 100) / 100;
          result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
        }
      });
    }

    // Save Run 1 results
    run('UPDATE bobsleigh_events SET status = ?, run1_results = ? WHERE id = ?',
      ['run1_completed', JSON.stringify(runResults), eventId]);

    const totalRuns = event.runs || 2;

    res.json({
      message: 'Run 1 completed',
      run: 1,
      results: runResults,
      status: 'run1_completed',
      needsRun2: true,
      totalRuns
    });
  } catch (error) {
    console.error('Error simulating bobsleigh run 1:', error);
    res.status(500).json({ error: 'Failed to simulate race' });
  }
});

// Save Run 2 results (accepts results from frontend animation)
router.post('/event/:eventId/simulate-run2', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM bobsleigh_events e
      INNER JOIN bobsleigh_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'run1_completed') {
      return res.status(400).json({ error: 'Run 1 must be completed first' });
    }

    const run1Results = JSON.parse(event.run1_results || '[]');
    let run2Results;
    let finalResults;

    // If frontend sent results (from animation), use those
    if (frontendResults && frontendResults.length > 0) {
      // Frontend results already have combined times calculated
      finalResults = frontendResults.map((r, idx) => ({
        ...r,
        position: idx + 1
      }));

      // Extract run2-specific results for storage
      run2Results = frontendResults.filter(r => r.run2Time !== undefined || r.time !== undefined).map(r => ({
        teamId: r.teamId,
        teamName: r.teamName,
        country: r.country,
        runner1: r.runner1,
        runner2: r.runner2,
        runner3: r.runner3,
        runner4: r.runner4,
        time: r.run2Time || r.time,
        timeFormatted: r.run2Formatted || r.timeFormatted,
        dnf: r.dnf || false,
        run1Time: r.run1Time,
        run1Formatted: r.run1Formatted
      }));

      // Add Run 1 DNFs to final results
      const run1DNFs = run1Results.filter(r => r.dnf).map(r => ({
        ...r,
        run2Time: null,
        run2Formatted: '-',
        totalTime: null,
        totalFormatted: 'DNF (Run 1)'
      }));

      let position = finalResults.length + 1;
      for (const dnf of run1DNFs) {
        finalResults.push({
          ...dnf,
          position: position++
        });
      }
    } else {
      // Fallback: simulate on backend
      const trackLength = event.track_length || 1400;
      const qualifiedTeams = run1Results.filter(r => !r.dnf).reverse();

      const teams = all('SELECT * FROM bobsleigh_teams WHERE world_id = ?', [event.world_id]);
      const teamsMap = new Map();
      teams.forEach(t => teamsMap.set(t.id, t));

      run2Results = qualifiedTeams.map((run1Result, index) => {
        const team = teamsMap.get(run1Result.teamId);
        if (!team) return null;

        const result = simulateRun(team, trackLength, true);
        return {
          teamId: team.id,
          teamName: team.name,
          country: team.country,
          runner1: team.runner1_name,
          runner2: team.runner2_name,
          runner3: team.runner3_name,
          runner4: team.runner4_name,
          startPosition: index + 1,
          run1Time: run1Result.time,
          run1Formatted: run1Result.timeFormatted,
          ...result
        };
      }).filter(r => r !== null);

      finalResults = run2Results.map(r => {
        if (r.dnf) {
          return { ...r, totalTime: null, totalFormatted: 'DNF (Run 2)' };
        }
        const totalTime = Math.round((r.run1Time + r.time) * 100) / 100;
        return {
          ...r,
          run2Time: r.time,
          run2Formatted: r.timeFormatted,
          totalTime,
          totalFormatted: formatTime(totalTime)
        };
      });

      const run1DNFs = run1Results.filter(r => r.dnf).map(r => ({
        ...r,
        run2Time: null,
        run2Formatted: '-',
        totalTime: null,
        totalFormatted: 'DNF (Run 1)'
      }));

      finalResults.sort((a, b) => {
        if (a.totalTime === null && b.totalTime === null) return 0;
        if (a.totalTime === null) return 1;
        if (b.totalTime === null) return -1;
        return a.totalTime - b.totalTime;
      });

      const leaderTime = finalResults.find(r => r.totalTime !== null)?.totalTime || 0;
      finalResults.forEach((result, index) => {
        result.position = index + 1;
        if (result.totalTime !== null) {
          result.timeBehind = index === 0 || result.totalTime === leaderTime ? 0 : Math.round((result.totalTime - leaderTime) * 100) / 100;
          result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
        }
      });

      let position = finalResults.length + 1;
      for (const dnf of run1DNFs) {
        finalResults.push({ ...dnf, position: position++ });
      }
    }

    // Check if this is a 4-run event
    const totalRuns = event.runs || 2;
    const isFourRunEvent = totalRuns === 4;

    if (isFourRunEvent) {
      // For 4-run events, save results but don't complete the race yet
      run('UPDATE bobsleigh_events SET status = ?, run2_results = ? WHERE id = ?',
        ['run2_completed', JSON.stringify(run2Results), eventId]);

      res.json({
        message: 'Run 2 completed',
        run: 2,
        run2Results,
        finalResults, // Intermediate standings after 2 runs
        status: 'run2_completed',
        needsRun3: true,
        totalRuns: 4
      });
    } else {
      // For 2-run events, save final results and update standings
      run('UPDATE bobsleigh_events SET status = ?, run2_results = ?, results = ? WHERE id = ?',
        ['completed', JSON.stringify(run2Results), JSON.stringify(finalResults), eventId]);

      // Update standings
      const standings = updateStandingsAfterRace(event.season_id, finalResults);

      res.json({
        message: 'Race completed',
        run: 2,
        run2Results,
        finalResults,
        status: 'completed',
        standings
      });
    }
  } catch (error) {
    console.error('Error simulating bobsleigh run 2:', error);
    res.status(500).json({ error: 'Failed to simulate run 2' });
  }
});

// Save Run 3 results (accepts results from frontend animation)
router.post('/event/:eventId/simulate-run3', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM bobsleigh_events e
      INNER JOIN bobsleigh_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.runs !== 4) {
      return res.status(400).json({ error: 'This event only has 2 runs' });
    }

    if (event.status !== 'run2_completed') {
      return res.status(400).json({ error: 'Run 2 must be completed first' });
    }

    let run3Results;
    let combinedAfter3;

    // If frontend sent results (from animation), use those
    if (frontendResults && frontendResults.length > 0) {
      // Frontend results already have combined times calculated
      combinedAfter3 = frontendResults.map((r, idx) => ({
        ...r,
        position: idx + 1
      }));

      // Extract run3-specific results for storage
      run3Results = frontendResults.map(r => ({
        teamId: r.teamId,
        teamName: r.teamName,
        country: r.country,
        runner1: r.runner1,
        runner2: r.runner2,
        runner3: r.runner3,
        runner4: r.runner4,
        time: r.run3Time || r.time,
        timeFormatted: r.run3Formatted || r.timeFormatted,
        dnf: r.dnf || false,
        run1Time: r.run1Time,
        run2Time: r.run2Time,
        combinedAfter2: r.combinedAfter2
      }));
    } else {
      // Fallback: simulate on backend
      const trackLength = event.track_length || 1400;
      const run1Results = JSON.parse(event.run1_results || '[]');
      const run2Results = JSON.parse(event.run2_results || '[]');

      const combinedAfter2List = run1Results
        .filter(r => !r.dnf)
        .map(r1 => {
          const r2 = run2Results.find(r => r.teamId === r1.teamId);
          if (!r2 || r2.dnf) {
            return { ...r1, totalTime: null, dnfRun: r2 ? 2 : 1 };
          }
          return { ...r1, run2Time: r2.time, totalTime: r1.time + r2.time };
        })
        .filter(r => r.totalTime !== null)
        .sort((a, b) => a.totalTime - b.totalTime);

      const qualifiedTeams = combinedAfter2List.slice(0, 20).reverse();

      const teams = all('SELECT * FROM bobsleigh_teams WHERE world_id = ?', [event.world_id]);
      const teamsMap = new Map();
      teams.forEach(t => teamsMap.set(t.id, t));

      run3Results = qualifiedTeams.map((combined, index) => {
        const team = teamsMap.get(combined.teamId);
        if (!team) return null;

        const result = simulateRun(team, trackLength, true);
        return {
          teamId: team.id,
          teamName: team.name,
          country: team.country,
          runner1: team.runner1_name,
          runner2: team.runner2_name,
          runner3: team.runner3_name,
          runner4: team.runner4_name,
          startPosition: index + 1,
          run1Time: combined.time,
          run2Time: combined.run2Time,
          combinedAfter2: combined.totalTime,
          ...result
        };
      }).filter(r => r !== null);

      combinedAfter3 = run3Results.map(r => {
        if (r.dnf) {
          return { ...r, totalTime: null, totalFormatted: 'DNF (Run 3)' };
        }
        const totalTime = Math.round((r.combinedAfter2 + r.time) * 100) / 100;
        return {
          ...r,
          run3Time: r.time,
          run3Formatted: r.timeFormatted,
          totalTime,
          totalFormatted: formatTime(totalTime)
        };
      });
    }

    // Sort by total time
    combinedAfter3.sort((a, b) => {
      if (a.totalTime === null && b.totalTime === null) return 0;
      if (a.totalTime === null) return 1;
      if (b.totalTime === null) return -1;
      return a.totalTime - b.totalTime;
    });

    // Assign intermediate positions
    const leaderTime = combinedAfter3.find(r => r.totalTime !== null)?.totalTime || 0;
    combinedAfter3.forEach((result, index) => {
      result.position = index + 1;
      if (result.totalTime !== null) {
        result.timeBehind = index === 0 ? 0 : Math.round((result.totalTime - leaderTime) * 100) / 100;
        result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
      }
    });

    // Save Run 3 results
    run('UPDATE bobsleigh_events SET status = ?, run3_results = ? WHERE id = ?',
      ['run3_completed', JSON.stringify(run3Results), eventId]);

    res.json({
      message: 'Run 3 completed',
      run: 3,
      run3Results,
      intermediateResults: combinedAfter3,
      status: 'run3_completed',
      needsRun4: true,
      totalRuns: 4
    });
  } catch (error) {
    console.error('Error simulating bobsleigh run 3:', error);
    res.status(500).json({ error: 'Failed to simulate run 3' });
  }
});

// Simulate Run 4 (final run for 4-run events)
router.post('/event/:eventId/simulate-run4', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM bobsleigh_events e
      INNER JOIN bobsleigh_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.runs !== 4) {
      return res.status(400).json({ error: 'This event only has 2 runs' });
    }

    if (event.status !== 'run3_completed') {
      return res.status(400).json({ error: 'Run 3 must be completed first' });
    }

    const trackLength = event.track_length || 1400;
    const run1Results = JSON.parse(event.run1_results || '[]');
    const run2Results = JSON.parse(event.run2_results || '[]');
    const run3Results = JSON.parse(event.run3_results || '[]');

    let run4Results;

    // If frontend sent results (from animation), use those
    if (frontendResults && frontendResults.length > 0) {
      run4Results = frontendResults;
    } else {
      // Otherwise simulate on backend (fallback)
      // Get combined times after 3 runs
      const combinedAfter3 = run3Results
        .filter(r => !r.dnf)
        .map(r3 => {
          const totalTime = r3.combinedAfter2 + r3.time;
          return {
            ...r3,
            run3Time: r3.time,
            totalTime
          };
        })
        .sort((a, b) => a.totalTime - b.totalTime);

      // All teams that finished run 3 compete in run 4, reverse order
      const qualifiedTeams = combinedAfter3.reverse();

      // Get full team data
      const teams = all('SELECT * FROM bobsleigh_teams WHERE world_id = ?', [event.world_id]);
      const teamsMap = new Map();
      teams.forEach(t => teamsMap.set(t.id, t));

      // Simulate Run 4
      run4Results = qualifiedTeams.map((combined, index) => {
        const team = teamsMap.get(combined.teamId);
        if (!team) return null;

        const result = simulateRun(team, trackLength, true);
        return {
          teamId: team.id,
          teamName: team.name,
          country: team.country,
          runner1: team.runner1_name,
          runner2: team.runner2_name,
          runner3: team.runner3_name,
          runner4: team.runner4_name,
          startPosition: index + 1,
          run1Time: combined.run1Time,
          run2Time: combined.run2Time,
          run3Time: combined.run3Time,
          combinedAfter3: combined.totalTime,
          ...result
        };
      }).filter(r => r !== null);
    }

    // Calculate final combined times (all 4 runs)
    const finalResults = run4Results.map(r => {
      if (r.dnf) {
        return {
          ...r,
          totalTime: null,
          totalFormatted: 'DNF (Run 4)'
        };
      }
      const totalTime = Math.round((r.combinedAfter3 + r.time) * 100) / 100;
      return {
        ...r,
        run4Time: r.time,
        run4Formatted: r.timeFormatted,
        totalTime,
        totalFormatted: formatTime(totalTime)
      };
    });

    // Add teams that DNF'd in run 3
    const run3DNFs = run3Results.filter(r => r.dnf).map(r => ({
      ...r,
      run4Time: null,
      run4Formatted: '-',
      totalTime: null,
      totalFormatted: 'DNF (Run 3)'
    }));

    // Add teams that didn't qualify for run 3 (finished 21+ after run 2)
    const run1Map = new Map();
    run1Results.forEach(r => run1Map.set(r.teamId, r));
    const run2Map = new Map();
    run2Results.forEach(r => run2Map.set(r.teamId, r));
    const run3TeamIds = new Set(run3Results.map(r => r.teamId));

    const didNotQualifyRun3 = run2Results
      .filter(r => !r.dnf && !run3TeamIds.has(r.teamId))
      .map(r2 => {
        const r1 = run1Map.get(r2.teamId);
        return {
          teamId: r2.teamId,
          teamName: r2.teamName,
          country: r2.country,
          runner1: r2.runner1,
          runner2: r2.runner2,
          runner3: r2.runner3,
          runner4: r2.runner4,
          run1Time: r1?.time,
          run1Formatted: r1?.timeFormatted,
          run2Time: r2.time,
          run2Formatted: r2.timeFormatted,
          run3Time: null,
          run3Formatted: '-',
          run4Time: null,
          run4Formatted: '-',
          totalTime: r1 && r2 ? Math.round((r1.time + r2.time) * 100) / 100 : null,
          totalFormatted: r1 && r2 ? formatTime(r1.time + r2.time) + ' (2 runs)' : 'DNF'
        };
      });

    // Add Run 2 DNFs
    const run2DNFs = run2Results.filter(r => r.dnf).map(r => ({
      ...r,
      run3Time: null,
      run3Formatted: '-',
      run4Time: null,
      run4Formatted: '-',
      totalTime: null,
      totalFormatted: 'DNF (Run 2)'
    }));

    // Add Run 1 DNFs
    const run1DNFs = run1Results.filter(r => r.dnf).map(r => ({
      ...r,
      run2Time: null,
      run2Formatted: '-',
      run3Time: null,
      run3Formatted: '-',
      run4Time: null,
      run4Formatted: '-',
      totalTime: null,
      totalFormatted: 'DNF (Run 1)'
    }));

    // Sort final results by total time
    finalResults.sort((a, b) => {
      if (a.totalTime === null && b.totalTime === null) return 0;
      if (a.totalTime === null) return 1;
      if (b.totalTime === null) return -1;
      return a.totalTime - b.totalTime;
    });

    // Assign final positions
    const leaderTime = finalResults.find(r => r.totalTime !== null)?.totalTime || 0;
    finalResults.forEach((result, index) => {
      result.position = index + 1;
      if (result.totalTime !== null) {
        result.timeBehind = index === 0 ? 0 : Math.round((result.totalTime - leaderTime) * 100) / 100;
        result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
      }
    });

    // Add DNFs and non-qualifiers at the end
    let position = finalResults.length + 1;
    for (const dnf of [...run3DNFs, ...didNotQualifyRun3, ...run2DNFs, ...run1DNFs]) {
      finalResults.push({
        ...dnf,
        position: position++
      });
    }

    // Save final results
    run('UPDATE bobsleigh_events SET status = ?, run4_results = ?, results = ? WHERE id = ?',
      ['completed', JSON.stringify(run4Results), JSON.stringify(finalResults), eventId]);

    // Update standings
    const standings = updateStandingsAfterRace(event.season_id, finalResults);

    res.json({
      message: 'Race completed',
      run: 4,
      run4Results,
      finalResults,
      status: 'completed',
      standings
    });
  } catch (error) {
    console.error('Error simulating bobsleigh run 4:', error);
    res.status(500).json({ error: 'Failed to simulate run 4' });
  }
});

// Helper function to update standings after a race
function updateStandingsAfterRace(seasonId, results) {
  const season = get('SELECT * FROM bobsleigh_seasons WHERE id = ?', [seasonId]);
  if (!season) return [];

  let standings = [];
  try {
    standings = JSON.parse(season.standings || '[]');
  } catch (e) {
    standings = [];
  }

  const standingsMap = new Map();
  for (const s of standings) {
    standingsMap.set(s.teamId, { ...s });
  }

  // Add WC points (only for finishers)
  const finishers = results.filter(r => r.totalTime !== null);
  for (const result of finishers) {
    if (result.position <= 25) {
      const points = worldCupPoints[result.position - 1] || 0;
      const current = standingsMap.get(result.teamId) || {
        teamId: result.teamId,
        teamName: result.teamName,
        country: result.country,
        points: 0,
        races: 0,
        wins: 0,
        podiums: 0
      };

      current.points += points;
      current.races += 1;
      if (result.position === 1) current.wins += 1;
      if (result.position <= 3) current.podiums += 1;

      standingsMap.set(result.teamId, current);
    }
  }

  standings = Array.from(standingsMap.values())
    .sort((a, b) => b.points - a.points);

  run('UPDATE bobsleigh_seasons SET standings = ?, status = ? WHERE id = ?',
    [JSON.stringify(standings), 'in_progress', seasonId]);

  return standings;
}

// Reset season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM bobsleigh_seasons s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [seasonId, req.user.id]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    if (season.status === 'completed') {
      return res.status(400).json({ error: 'Cannot reset a completed season' });
    }

    // Reset season
    run(`
      UPDATE bobsleigh_seasons
      SET standings = '[]', status = 'not_started'
      WHERE id = ?
    `, [seasonId]);

    // Reset all events - try with all columns first, fall back if columns don't exist
    try {
      run('UPDATE bobsleigh_events SET status = ?, results = ?, run1_results = ?, run2_results = ?, run3_results = ?, run4_results = ? WHERE season_id = ?',
        ['scheduled', '[]', '[]', '[]', '[]', '[]', seasonId]);
    } catch (colError) {
      // Fallback for older databases without run3/run4 columns
      run('UPDATE bobsleigh_events SET status = ?, results = ?, run1_results = ?, run2_results = ? WHERE season_id = ?',
        ['scheduled', '[]', '[]', '[]', seasonId]);
    }

    const updatedSeason = get('SELECT * FROM bobsleigh_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM bobsleigh_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season reset successfully',
      season: updatedSeason,
      events: events.map(e => ({ ...e, results: [], run1_results: [], run2_results: [], run3_results: [], run4_results: [] })),
      standings: []
    });
  } catch (error) {
    console.error('Error resetting bobsleigh season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

module.exports = router;
