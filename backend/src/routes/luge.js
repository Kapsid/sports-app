const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateLugeCalendar, worldCupPoints, lugeCountryNames } = require('../data/lugeCalendar');
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

// Simulate a single run for a luge athlete
function simulateRun(athlete, trackLength, isRun2 = false) {
  const skillStart = athlete.skill_start || 70;
  const skillSteering = athlete.skill_steering || 70;
  const skillLines = athlete.skill_lines || 70;
  const consistency = athlete.consistency || 70;
  const form = athlete.form || 70;

  // Base time depends on track length (luge is slightly faster than bobsleigh)
  const baseTime = trackLength / 27;

  // Check for DNF (crash)
  const baseDNFRate = 0.015; // 1.5% base DNF rate (slightly lower than bobsleigh)
  const dnfModifier = (100 - consistency) / 100 * 0.25 + (100 - skillSteering) / 100 * 0.2;
  const dnfChance = baseDNFRate * (1 + dnfModifier);

  if (Math.random() < dnfChance) {
    return {
      dnf: true,
      time: null,
      timeFormatted: 'DNF'
    };
  }

  // Calculate time components

  // Start effect (skill_start affects first ~3 seconds)
  const startEffect = (70 - skillStart) * 0.012;

  // Steering effect (navigating through curves)
  const steeringEffect = (70 - skillSteering) * 0.02;

  // Lines effect (choosing optimal racing lines)
  const linesEffect = (70 - skillLines) * 0.015;

  // Form effect (daily condition)
  const formEffect = (70 - form) * 0.008;

  // Random variation based on consistency
  const consistencyMultiplier = 1.5 - (consistency / 100);
  const randomVariation = randomNormal(0, 0.25 * consistencyMultiplier);

  // Day factor (ice conditions, equipment, etc.)
  const dayFactor = randomNormal(0, 0.12);

  // Track section variations
  const trackSections = Math.floor(trackLength / 100);
  let sectionVariation = 0;
  for (let i = 0; i < trackSections; i++) {
    sectionVariation += randomNormal(0, 0.008);
  }

  // Run 2+ has slightly different ice conditions
  const run2Modifier = isRun2 ? randomNormal(0.08, 0.15) : 0;

  // Calculate final time
  let time = baseTime + startEffect + steeringEffect + linesEffect + formEffect +
             randomVariation + dayFactor + sectionVariation + run2Modifier;

  // Small mistakes can add time
  const mistakeChance = (100 - consistency) / 100 * 0.15;
  if (Math.random() < mistakeChance) {
    time += randomNormal(0.15, 0.08);
  }

  // Ensure reasonable time range
  const avgSkill = (skillStart + skillSteering + skillLines) / 3;
  const skillBasedMin = baseTime * (0.95 + (100 - avgSkill) * 0.0004);
  const skillBasedMax = baseTime * (1.008 + (100 - avgSkill) * 0.0008);
  time = Math.max(skillBasedMin, Math.min(skillBasedMax, time));

  return {
    dnf: false,
    time: Math.round(time * 1000) / 1000,
    timeFormatted: formatTime(time)
  };
}

// Format time as SS.ccc (milliseconds precision for luge)
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return 'DNF';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }
  return secs.toFixed(3);
}

// Format time difference
function formatTimeDiff(diff) {
  if (diff === null || diff === undefined || diff === 0) return '';
  return `+${diff.toFixed(3)}`;
}

// ==================== ATHLETE ROUTES ====================

// Get all luge athletes for a world
router.get('/world/:worldId/athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const athletes = all('SELECT * FROM luge_athletes WHERE world_id = ? ORDER BY last_name, first_name', [worldId]);

    res.json({ athletes, countryNames: allCountries });
  } catch (error) {
    console.error('Error fetching luge athletes:', error);
    res.status(500).json({ error: 'Failed to fetch athletes' });
  }
});

// Create a new luge athlete
router.post('/world/:worldId/athlete', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const {
      first_name, last_name, country,
      skill_start, skill_steering, skill_lines, consistency, form
    } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    if (!first_name || !last_name || !country) {
      return res.status(400).json({ error: 'First name, last name, and country are required' });
    }

    const id = uuidv4();
    run(`
      INSERT INTO luge_athletes (id, world_id, first_name, last_name, country, skill_start, skill_steering, skill_lines, consistency, form)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, worldId, first_name, last_name, country,
        skill_start || 70, skill_steering || 70, skill_lines || 70, consistency || 70, form || 70]);

    const athlete = get('SELECT * FROM luge_athletes WHERE id = ?', [id]);
    res.json({ athlete, countryNames: allCountries });
  } catch (error) {
    console.error('Error creating luge athlete:', error);
    res.status(500).json({ error: 'Failed to create athlete' });
  }
});

// Update a luge athlete
router.put('/athlete/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, country,
      skill_start, skill_steering, skill_lines, consistency, form
    } = req.body;

    // Verify athlete belongs to user's world
    const athlete = get(`
      SELECT a.* FROM luge_athletes a
      INNER JOIN worlds w ON a.world_id = w.id
      WHERE a.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run(`
      UPDATE luge_athletes SET
        first_name = ?, last_name = ?, country = ?,
        skill_start = ?, skill_steering = ?, skill_lines = ?, consistency = ?, form = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [first_name, last_name, country,
        skill_start, skill_steering, skill_lines, consistency, form, id]);

    const updatedAthlete = get('SELECT * FROM luge_athletes WHERE id = ?', [id]);
    res.json({ athlete: updatedAthlete, countryNames: allCountries });
  } catch (error) {
    console.error('Error updating luge athlete:', error);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

// Delete a luge athlete
router.delete('/athlete/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Verify athlete belongs to user's world
    const athlete = get(`
      SELECT a.* FROM luge_athletes a
      INNER JOIN worlds w ON a.world_id = w.id
      WHERE a.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run('DELETE FROM luge_athletes WHERE id = ?', [id]);
    res.json({ message: 'Athlete deleted' });
  } catch (error) {
    console.error('Error deleting luge athlete:', error);
    res.status(500).json({ error: 'Failed to delete athlete' });
  }
});

// Delete all luge athletes for a world
router.delete('/world/:worldId/all-athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM luge_athletes WHERE world_id = ?', [worldId]);
    res.json({ message: 'All athletes deleted' });
  } catch (error) {
    console.error('Error deleting all luge athletes:', error);
    res.status(500).json({ error: 'Failed to delete athletes' });
  }
});

// ==================== SEASON ROUTES ====================

// Get current luge season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM luge_seasons
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
      'SELECT * FROM luge_events WHERE season_id = ? ORDER BY event_index',
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
    console.error('Error fetching luge season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new luge season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check for active season
    const activeSeason = get(`
      SELECT * FROM luge_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [worldId]);

    if (activeSeason) {
      return res.status(400).json({ error: 'An active season already exists' });
    }

    // Get last completed season to determine next year
    const lastSeason = get(`
      SELECT * FROM luge_seasons
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
      INSERT INTO luge_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'not_started')
    `, [seasonId, worldId, seasonName, startYear, endYear]);

    // Generate calendar
    const calendar = generateLugeCalendar(startYear);

    // Insert events
    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO luge_events (id, season_id, event_index, name, location, country, track_length, date, status, runs, championship)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country,
          event.trackLength, event.date, event.runs || 2, event.championship ? 1 : 0]);
    }

    const season = get('SELECT * FROM luge_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM luge_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season created',
      season,
      events: events.map(e => ({ ...e, results: [], run1_results: [], run2_results: [], run3_results: [], run4_results: [] })),
      standings: []
    });
  } catch (error) {
    console.error('Error creating luge season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM luge_events e
      INNER JOIN luge_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const athletes = all('SELECT * FROM luge_athletes WHERE world_id = ? ORDER BY last_name, first_name', [event.world_id]);

    res.json({
      event: {
        ...event,
        results: JSON.parse(event.results || '[]'),
        run1_results: JSON.parse(event.run1_results || '[]'),
        run2_results: JSON.parse(event.run2_results || '[]'),
        run3_results: JSON.parse(event.run3_results || '[]'),
        run4_results: JSON.parse(event.run4_results || '[]')
      },
      athletes,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching luge event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Save Run 1 results
router.post('/event/:eventId/simulate', authMiddleware, validateWeekLock('luge_events', 'luge_seasons'), (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM luge_events e
      INNER JOIN luge_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Race already completed' });
    }

    if (event.status !== 'scheduled') {
      return res.status(400).json({ error: 'Run 1 already completed' });
    }

    let runResults;

    if (frontendResults && frontendResults.length > 0) {
      runResults = frontendResults;
    } else {
      const athletes = all('SELECT * FROM luge_athletes WHERE world_id = ?', [event.world_id]);

      if (athletes.length === 0) {
        return res.status(400).json({ error: 'No athletes available' });
      }

      const trackLength = event.track_length || 1400;
      const startOrder = [...athletes].sort(() => Math.random() - 0.5);

      runResults = startOrder.map((athlete, index) => {
        const result = simulateRun(athlete, trackLength, false);
        return {
          athleteId: athlete.id,
          firstName: athlete.first_name,
          lastName: athlete.last_name,
          country: athlete.country,
          bib: index + 1,
          ...result
        };
      });

      runResults.sort((a, b) => {
        if (a.dnf && b.dnf) return 0;
        if (a.dnf) return 1;
        if (b.dnf) return -1;
        return a.time - b.time;
      });

      const leaderTime = runResults.find(r => !r.dnf)?.time || 0;
      runResults.forEach((result, index) => {
        result.position = index + 1;
        if (!result.dnf) {
          result.timeBehind = index === 0 || result.time === leaderTime ? 0 : Math.round((result.time - leaderTime) * 1000) / 1000;
          result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
        }
      });
    }

    run('UPDATE luge_events SET status = ?, run1_results = ? WHERE id = ?',
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
    console.error('Error simulating luge run 1:', error);
    res.status(500).json({ error: 'Failed to simulate race' });
  }
});

// Save Run 2 results
router.post('/event/:eventId/simulate-run2', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM luge_events e
      INNER JOIN luge_seasons s ON e.season_id = s.id
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

    if (frontendResults && frontendResults.length > 0) {
      finalResults = frontendResults.map((r, idx) => ({
        ...r,
        position: idx + 1
      }));

      run2Results = frontendResults.filter(r => r.run2Time !== undefined || r.time !== undefined).map(r => ({
        athleteId: r.athleteId,
        firstName: r.firstName,
        lastName: r.lastName,
        country: r.country,
        time: r.run2Time || r.time,
        timeFormatted: r.run2Formatted || r.timeFormatted,
        dnf: r.dnf || false,
        run1Time: r.run1Time,
        run1Formatted: r.run1Formatted
      }));

      const run1DNFs = run1Results.filter(r => r.dnf).map(r => ({
        ...r,
        run2Time: null,
        run2Formatted: '-',
        totalTime: null,
        totalFormatted: 'DNF (Run 1)'
      }));

      let position = finalResults.length + 1;
      for (const dnf of run1DNFs) {
        finalResults.push({ ...dnf, position: position++ });
      }
    } else {
      const trackLength = event.track_length || 1400;
      const qualifiedAthletes = run1Results.filter(r => !r.dnf).reverse();

      const athletes = all('SELECT * FROM luge_athletes WHERE world_id = ?', [event.world_id]);
      const athletesMap = new Map();
      athletes.forEach(a => athletesMap.set(a.id, a));

      run2Results = qualifiedAthletes.map((run1Result, index) => {
        const athlete = athletesMap.get(run1Result.athleteId);
        if (!athlete) return null;

        const result = simulateRun(athlete, trackLength, true);
        return {
          athleteId: athlete.id,
          firstName: athlete.first_name,
          lastName: athlete.last_name,
          country: athlete.country,
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
        const totalTime = Math.round((r.run1Time + r.time) * 1000) / 1000;
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
          result.timeBehind = index === 0 || result.totalTime === leaderTime ? 0 : Math.round((result.totalTime - leaderTime) * 1000) / 1000;
          result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
        }
      });

      let position = finalResults.length + 1;
      for (const dnf of run1DNFs) {
        finalResults.push({ ...dnf, position: position++ });
      }
    }

    const totalRuns = event.runs || 2;
    const isFourRunEvent = totalRuns === 4;

    if (isFourRunEvent) {
      run('UPDATE luge_events SET status = ?, run2_results = ? WHERE id = ?',
        ['run2_completed', JSON.stringify(run2Results), eventId]);

      res.json({
        message: 'Run 2 completed',
        run: 2,
        run2Results,
        finalResults,
        status: 'run2_completed',
        needsRun3: true,
        totalRuns: 4
      });
    } else {
      run('UPDATE luge_events SET status = ?, run2_results = ?, results = ? WHERE id = ?',
        ['completed', JSON.stringify(run2Results), JSON.stringify(finalResults), eventId]);

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
    console.error('Error simulating luge run 2:', error);
    res.status(500).json({ error: 'Failed to simulate run 2' });
  }
});

// Save Run 3 results
router.post('/event/:eventId/simulate-run3', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;
    const { results: frontendResults } = req.body;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM luge_events e
      INNER JOIN luge_seasons s ON e.season_id = s.id
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

    if (frontendResults && frontendResults.length > 0) {
      combinedAfter3 = frontendResults.map((r, idx) => ({ ...r, position: idx + 1 }));

      run3Results = frontendResults.map(r => ({
        athleteId: r.athleteId,
        firstName: r.firstName,
        lastName: r.lastName,
        country: r.country,
        time: r.run3Time || r.time,
        timeFormatted: r.run3Formatted || r.timeFormatted,
        dnf: r.dnf || false,
        run1Time: r.run1Time,
        run2Time: r.run2Time,
        combinedAfter2: r.combinedAfter2
      }));
    } else {
      const trackLength = event.track_length || 1400;
      const run1Results = JSON.parse(event.run1_results || '[]');
      const run2Results = JSON.parse(event.run2_results || '[]');

      const combinedAfter2List = run1Results
        .filter(r => !r.dnf)
        .map(r1 => {
          const r2 = run2Results.find(r => r.athleteId === r1.athleteId);
          if (!r2 || r2.dnf) return { ...r1, totalTime: null };
          return { ...r1, run2Time: r2.time, totalTime: r1.time + r2.time };
        })
        .filter(r => r.totalTime !== null)
        .sort((a, b) => a.totalTime - b.totalTime);

      const qualifiedAthletes = combinedAfter2List.slice(0, 20).reverse();

      const athletes = all('SELECT * FROM luge_athletes WHERE world_id = ?', [event.world_id]);
      const athletesMap = new Map();
      athletes.forEach(a => athletesMap.set(a.id, a));

      run3Results = qualifiedAthletes.map((combined, index) => {
        const athlete = athletesMap.get(combined.athleteId);
        if (!athlete) return null;

        const result = simulateRun(athlete, trackLength, true);
        return {
          athleteId: athlete.id,
          firstName: athlete.first_name,
          lastName: athlete.last_name,
          country: athlete.country,
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
        const totalTime = Math.round((r.combinedAfter2 + r.time) * 1000) / 1000;
        return {
          ...r,
          run3Time: r.time,
          run3Formatted: r.timeFormatted,
          totalTime,
          totalFormatted: formatTime(totalTime)
        };
      });
    }

    combinedAfter3.sort((a, b) => {
      if (a.totalTime === null && b.totalTime === null) return 0;
      if (a.totalTime === null) return 1;
      if (b.totalTime === null) return -1;
      return a.totalTime - b.totalTime;
    });

    const leaderTime = combinedAfter3.find(r => r.totalTime !== null)?.totalTime || 0;
    combinedAfter3.forEach((result, index) => {
      result.position = index + 1;
      if (result.totalTime !== null) {
        result.timeBehind = index === 0 ? 0 : Math.round((result.totalTime - leaderTime) * 1000) / 1000;
        result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
      }
    });

    run('UPDATE luge_events SET status = ?, run3_results = ? WHERE id = ?',
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
    console.error('Error simulating luge run 3:', error);
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
      FROM luge_events e
      INNER JOIN luge_seasons s ON e.season_id = s.id
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

    if (frontendResults && frontendResults.length > 0) {
      run4Results = frontendResults;
    } else {
      const combinedAfter3 = run3Results
        .filter(r => !r.dnf)
        .map(r3 => {
          const totalTime = r3.combinedAfter2 + r3.time;
          return { ...r3, run3Time: r3.time, totalTime };
        })
        .sort((a, b) => a.totalTime - b.totalTime);

      const qualifiedAthletes = combinedAfter3.reverse();

      const athletes = all('SELECT * FROM luge_athletes WHERE world_id = ?', [event.world_id]);
      const athletesMap = new Map();
      athletes.forEach(a => athletesMap.set(a.id, a));

      run4Results = qualifiedAthletes.map((combined, index) => {
        const athlete = athletesMap.get(combined.athleteId);
        if (!athlete) return null;

        const result = simulateRun(athlete, trackLength, true);
        return {
          athleteId: athlete.id,
          firstName: athlete.first_name,
          lastName: athlete.last_name,
          country: athlete.country,
          startPosition: index + 1,
          run1Time: combined.run1Time,
          run2Time: combined.run2Time,
          run3Time: combined.run3Time,
          combinedAfter3: combined.totalTime,
          ...result
        };
      }).filter(r => r !== null);
    }

    const finalResults = run4Results.map(r => {
      if (r.dnf) {
        return { ...r, totalTime: null, totalFormatted: 'DNF (Run 4)' };
      }
      const totalTime = Math.round((r.combinedAfter3 + r.time) * 1000) / 1000;
      return {
        ...r,
        run4Time: r.time,
        run4Formatted: r.timeFormatted,
        totalTime,
        totalFormatted: formatTime(totalTime)
      };
    });

    // Add DNFs from earlier runs
    const run3DNFs = run3Results.filter(r => r.dnf).map(r => ({
      ...r, run4Time: null, run4Formatted: '-', totalTime: null, totalFormatted: 'DNF (Run 3)'
    }));

    const run1Map = new Map();
    run1Results.forEach(r => run1Map.set(r.athleteId, r));
    const run3AthleteIds = new Set(run3Results.map(r => r.athleteId));

    const didNotQualifyRun3 = run2Results
      .filter(r => !r.dnf && !run3AthleteIds.has(r.athleteId))
      .map(r2 => {
        const r1 = run1Map.get(r2.athleteId);
        return {
          athleteId: r2.athleteId,
          firstName: r2.firstName,
          lastName: r2.lastName,
          country: r2.country,
          run1Time: r1?.time,
          run2Time: r2.time,
          run3Time: null,
          run4Time: null,
          totalTime: r1 && r2 ? Math.round((r1.time + r2.time) * 1000) / 1000 : null,
          totalFormatted: r1 && r2 ? formatTime(r1.time + r2.time) + ' (2 runs)' : 'DNF'
        };
      });

    const run2DNFs = run2Results.filter(r => r.dnf).map(r => ({
      ...r, run3Time: null, run4Time: null, totalTime: null, totalFormatted: 'DNF (Run 2)'
    }));

    const run1DNFs = run1Results.filter(r => r.dnf).map(r => ({
      ...r, run2Time: null, run3Time: null, run4Time: null, totalTime: null, totalFormatted: 'DNF (Run 1)'
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
        result.timeBehind = index === 0 ? 0 : Math.round((result.totalTime - leaderTime) * 1000) / 1000;
        result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
      }
    });

    let position = finalResults.length + 1;
    for (const dnf of [...run3DNFs, ...didNotQualifyRun3, ...run2DNFs, ...run1DNFs]) {
      finalResults.push({ ...dnf, position: position++ });
    }

    run('UPDATE luge_events SET status = ?, run4_results = ?, results = ? WHERE id = ?',
      ['completed', JSON.stringify(run4Results), JSON.stringify(finalResults), eventId]);

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
    console.error('Error simulating luge run 4:', error);
    res.status(500).json({ error: 'Failed to simulate run 4' });
  }
});

// Helper function to update standings after a race
function updateStandingsAfterRace(seasonId, results) {
  const season = get('SELECT * FROM luge_seasons WHERE id = ?', [seasonId]);
  if (!season) return [];

  let standings = [];
  try {
    standings = JSON.parse(season.standings || '[]');
  } catch (e) {
    standings = [];
  }

  const standingsMap = new Map();
  for (const s of standings) {
    standingsMap.set(s.athleteId, { ...s });
  }

  const finishers = results.filter(r => r.totalTime !== null);
  for (const result of finishers) {
    if (result.position <= 25) {
      const points = worldCupPoints[result.position - 1] || 0;
      const current = standingsMap.get(result.athleteId) || {
        athleteId: result.athleteId,
        firstName: result.firstName,
        lastName: result.lastName,
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

      standingsMap.set(result.athleteId, current);
    }
  }

  standings = Array.from(standingsMap.values())
    .sort((a, b) => b.points - a.points);

  run('UPDATE luge_seasons SET standings = ?, status = ? WHERE id = ?',
    [JSON.stringify(standings), 'in_progress', seasonId]);

  return standings;
}

// Reset season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM luge_seasons s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [seasonId, req.user.id]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    if (season.status === 'completed') {
      return res.status(400).json({ error: 'Cannot reset a completed season' });
    }

    run(`
      UPDATE luge_seasons
      SET standings = '[]', status = 'not_started'
      WHERE id = ?
    `, [seasonId]);

    run('UPDATE luge_events SET status = ?, results = ?, run1_results = ?, run2_results = ?, run3_results = ?, run4_results = ? WHERE season_id = ?',
      ['scheduled', '[]', '[]', '[]', '[]', '[]', seasonId]);

    const updatedSeason = get('SELECT * FROM luge_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM luge_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season reset successfully',
      season: updatedSeason,
      events: events.map(e => ({ ...e, results: [], run1_results: [], run2_results: [], run3_results: [], run4_results: [] })),
      standings: []
    });
  } catch (error) {
    console.error('Error resetting luge season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

module.exports = router;
