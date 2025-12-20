const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateAlpineCalendar, worldCupPoints, getRandomAlpineName, alpineCountryDistribution, disciplineTypes } = require('../data/alpineCalendar');
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

// Simulate a single run for an alpine skier
function simulateRun(skier, discipline, isRun2 = false, run1Time = null) {
  const disciplineInfo = disciplineTypes[discipline];
  if (!disciplineInfo) {
    throw new Error(`Unknown discipline: ${discipline}`);
  }

  const skillSpeed = skier.skill_speed || 70;
  const skillTechnical = skier.skill_technical || 70;
  const skillGliding = skier.skill_gliding || 70;
  const skillTurns = skier.skill_turns || 70;
  const consistency = skier.consistency || 70;
  const form = skier.form || 70;

  // Check for DNF
  const baseDNFRate = disciplineInfo.dnfRate;
  // Lower consistency and form slightly increase DNF chance (max +30%)
  const dnfModifier = (100 - consistency) / 100 * 0.2 + (100 - form) / 100 * 0.1;
  const dnfChance = baseDNFRate * (1 + dnfModifier);

  if (Math.random() < dnfChance) {
    // DNF - determine at which gate
    const gateCount = disciplineInfo.gates || 30;
    const dnfGate = Math.floor(Math.random() * gateCount * 0.8) + Math.floor(gateCount * 0.1);
    return {
      dnf: true,
      dnfGate,
      time: null,
      timeFormatted: 'DNF'
    };
  }

  // Calculate time based on discipline
  const baseTime = disciplineInfo.baseTime;
  let skillEffect = 0;

  if (disciplineInfo.speedFocus) {
    // Downhill, Super-G: speed and gliding matter most
    skillEffect = (70 - skillSpeed) * 0.06 + (70 - skillGliding) * 0.04 + (70 - skillTurns) * 0.02;
  } else {
    // Slalom, GS: technical and turns matter most
    skillEffect = (70 - skillTechnical) * 0.06 + (70 - skillTurns) * 0.05 + (70 - skillGliding) * 0.02;
  }

  // Form effect (daily condition)
  const formEffect = (70 - form) * 0.03;

  // Random variation based on consistency - more variation for less consistent skiers
  const consistencyMultiplier = 1.8 - (consistency / 100);
  const randomVariation = randomNormal(0, 1.0 * consistencyMultiplier);

  // Individual "day factor" - unique per skier per run (captures equipment, nerves, wax, etc.)
  const dayFactor = randomNormal(0, 0.6);

  // Gate-by-gate micro variations (accumulate small differences)
  const gateCount = disciplineInfo.gates || 30;
  let gateVariation = 0;
  for (let i = 0; i < gateCount; i++) {
    gateVariation += randomNormal(0, 0.02); // ~0.02s variation per gate
  }

  // Additional unique per-run randomness (each run is different!)
  const runVariation = randomNormal(0, 0.5);

  // Run 2 has slightly different conditions (course gets rougher)
  const run2Modifier = isRun2 ? randomNormal(0.5, 0.8) : 0;

  // Calculate final time
  let time = baseTime + skillEffect + formEffect + randomVariation + dayFactor + gateVariation + runVariation + run2Modifier;

  // Small mistakes can add time
  const mistakeChance = (100 - consistency) / 100 * 0.25;
  if (Math.random() < mistakeChance) {
    time += randomNormal(0.5, 0.3); // Minor mistake: 0.2-0.8 seconds
  }

  // Ensure reasonable time - use skill-adjusted minimum, not raw base time
  // Elite skiers (skill ~95) can go ~6% faster, worst skiers (skill ~50) can go ~12% slower
  const avgSkill = (skillSpeed + skillTechnical + skillGliding + skillTurns) / 4;
  const skillBasedMin = baseTime * (0.88 + (100 - avgSkill) * 0.001); // 0.88 for 100 skill, 0.93 for 50 skill
  const skillBasedMax = baseTime * (1.02 + (100 - avgSkill) * 0.002); // 1.02 for 100 skill, 1.12 for 50 skill
  time = Math.max(skillBasedMin, Math.min(skillBasedMax, time));

  return {
    dnf: false,
    time: Math.round(time * 100) / 100,
    timeFormatted: formatTime(time)
  };
}

// Simulate combined event (1 DH run + 1 SL run)
function simulateCombinedRun(skier, runType) {
  if (runType === 'downhill') {
    return simulateRun(skier, 'downhill', false);
  } else {
    return simulateRun(skier, 'slalom', true);
  }
}

// Format time as MM:SS.cc
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

// Update discipline standings after a race
function updateDisciplineStandings(seasonId, discipline, results) {
  const columnName = `${discipline}_standings`;

  // Get current standings
  const season = get('SELECT * FROM alpine_seasons WHERE id = ?', [seasonId]);
  if (!season) return [];

  let currentStandings = [];
  try {
    currentStandings = JSON.parse(season[columnName] || '[]');
  } catch (e) {
    currentStandings = [];
  }

  // Create standings map
  const standingsMap = new Map();
  for (const s of currentStandings) {
    standingsMap.set(s.skierId, { ...s });
  }

  // Add points from this race (only non-DNF finishers)
  const finishers = results.filter(r => !r.dnf);
  for (const result of finishers) {
    if (result.position <= 30) {
      const points = worldCupPoints[result.position - 1] || 0;
      const current = standingsMap.get(result.skierId) || {
        skierId: result.skierId,
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

      standingsMap.set(result.skierId, current);
    }
  }

  // Sort and save
  const standings = Array.from(standingsMap.values())
    .sort((a, b) => b.points - a.points);

  run(`UPDATE alpine_seasons SET ${columnName} = ? WHERE id = ?`, [JSON.stringify(standings), seasonId]);

  return standings;
}

// ==================== ROUTES ====================

// Get all alpine skiers for a world
router.get('/world/:worldId/skiers', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const skiers = all('SELECT * FROM alpine_skiers WHERE world_id = ? ORDER BY last_name, first_name', [worldId]);

    res.json({ skiers, countryNames: allCountries });
  } catch (error) {
    console.error('Error fetching alpine skiers:', error);
    res.status(500).json({ error: 'Failed to fetch skiers' });
  }
});

// Generate alpine skiers for a world
router.post('/world/:worldId/generate-skiers', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check if skiers already exist
    const existingSkiers = get('SELECT COUNT(*) as count FROM alpine_skiers WHERE world_id = ?', [worldId]);
    if (existingSkiers.count > 0) {
      return res.status(400).json({ error: 'Skiers already exist for this world' });
    }

    const skiers = [];

    // Generate skiers based on country distribution
    for (const [country, count] of Object.entries(alpineCountryDistribution)) {
      for (let i = 0; i < count; i++) {
        const { firstName, lastName } = getRandomAlpineName(country);

        // Generate random skills with some correlation
        const baseSkill = 60 + Math.floor(Math.random() * 30); // 60-90
        const variance = () => Math.floor((Math.random() - 0.5) * 20);

        // Some skiers are specialists (speed vs technical)
        const isSpeedSpecialist = Math.random() < 0.4;
        const isTechSpecialist = Math.random() < 0.4;

        let skillSpeed = baseSkill + variance();
        let skillTechnical = baseSkill + variance();
        let skillGliding = baseSkill + variance();
        let skillTurns = baseSkill + variance();

        if (isSpeedSpecialist) {
          skillSpeed += 10;
          skillGliding += 5;
          skillTechnical -= 5;
        } else if (isTechSpecialist) {
          skillTechnical += 10;
          skillTurns += 5;
          skillSpeed -= 5;
        }

        const skier = {
          id: uuidv4(),
          world_id: worldId,
          first_name: firstName,
          last_name: lastName,
          country: country,
          skill_speed: Math.min(99, Math.max(50, skillSpeed)),
          skill_technical: Math.min(99, Math.max(50, skillTechnical)),
          skill_gliding: Math.min(99, Math.max(50, skillGliding)),
          skill_turns: Math.min(99, Math.max(50, skillTurns)),
          consistency: Math.min(99, Math.max(50, 65 + Math.floor(Math.random() * 25))),
          form: Math.min(99, Math.max(50, 60 + Math.floor(Math.random() * 30)))
        };

        run(`
          INSERT INTO alpine_skiers (id, world_id, first_name, last_name, country, skill_speed, skill_technical, skill_gliding, skill_turns, consistency, form)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [skier.id, skier.world_id, skier.first_name, skier.last_name, skier.country,
            skier.skill_speed, skier.skill_technical, skier.skill_gliding, skier.skill_turns,
            skier.consistency, skier.form]);

        skiers.push(skier);
      }
    }

    res.json({ message: 'Skiers generated', skiers, countryNames: allCountries });
  } catch (error) {
    console.error('Error generating alpine skiers:', error);
    res.status(500).json({ error: 'Failed to generate skiers' });
  }
});

// Create a new skier
router.post('/world/:worldId/skier', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { first_name, last_name, country, skill_speed, skill_technical, skill_gliding, skill_turns, consistency, form, team_id } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const id = uuidv4();
    run(`
      INSERT INTO alpine_skiers (id, world_id, first_name, last_name, country, skill_speed, skill_technical, skill_gliding, skill_turns, consistency, form, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, worldId, first_name, last_name, country, skill_speed || 70, skill_technical || 70, skill_gliding || 70, skill_turns || 70, consistency || 70, form || 70, team_id || null]);

    const skier = get('SELECT * FROM alpine_skiers WHERE id = ?', [id]);
    res.json({ skier, countryNames: allCountries });
  } catch (error) {
    console.error('Error creating skier:', error);
    res.status(500).json({ error: 'Failed to create skier' });
  }
});

// Update a skier
router.put('/skier/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, country, skill_speed, skill_technical, skill_gliding, skill_turns, consistency, form, team_id } = req.body;

    // Verify skier belongs to user's world
    const skier = get(`
      SELECT s.* FROM alpine_skiers s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!skier) {
      return res.status(404).json({ error: 'Skier not found' });
    }

    run(`
      UPDATE alpine_skiers SET
        first_name = ?, last_name = ?, country = ?,
        skill_speed = ?, skill_technical = ?, skill_gliding = ?,
        skill_turns = ?, consistency = ?, form = ?,
        team_id = ?
      WHERE id = ?
    `, [first_name, last_name, country, skill_speed, skill_technical, skill_gliding, skill_turns, consistency, form, team_id !== undefined ? (team_id || null) : skier.team_id, id]);

    const updatedSkier = get('SELECT * FROM alpine_skiers WHERE id = ?', [id]);
    res.json({ skier: updatedSkier, countryNames: allCountries });
  } catch (error) {
    console.error('Error updating skier:', error);
    res.status(500).json({ error: 'Failed to update skier' });
  }
});

// Delete a skier
router.delete('/skier/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Verify skier belongs to user's world
    const skier = get(`
      SELECT s.* FROM alpine_skiers s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!skier) {
      return res.status(404).json({ error: 'Skier not found' });
    }

    run('DELETE FROM alpine_skiers WHERE id = ?', [id]);
    res.json({ message: 'Skier deleted' });
  } catch (error) {
    console.error('Error deleting skier:', error);
    res.status(500).json({ error: 'Failed to delete skier' });
  }
});

// Delete all skiers for a world
router.delete('/world/:worldId/all-skiers', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM alpine_skiers WHERE world_id = ?', [worldId]);
    res.json({ message: 'All skiers deleted' });
  } catch (error) {
    console.error('Error deleting all skiers:', error);
    res.status(500).json({ error: 'Failed to delete skiers' });
  }
});

// Get current alpine season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM alpine_seasons
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
      return res.json({ season: null, events: [], standings: [], disciplineStandings: {}, countryNames: allCountries });
    }

    const events = all(
      'SELECT * FROM alpine_events WHERE season_id = ? ORDER BY event_index',
      [season.id]
    );

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    // Parse discipline standings
    const disciplineStandings = {
      downhill: JSON.parse(season.downhill_standings || '[]'),
      super_g: JSON.parse(season.super_g_standings || '[]'),
      giant_slalom: JSON.parse(season.giant_slalom_standings || '[]'),
      slalom: JSON.parse(season.slalom_standings || '[]')
    };

    const eventsWithResults = events.map(event => ({
      ...event,
      results: JSON.parse(event.results || '[]'),
      run1_results: JSON.parse(event.run1_results || '[]'),
      run2_results: JSON.parse(event.run2_results || '[]')
    }));

    res.json({
      season,
      events: eventsWithResults,
      standings,
      disciplineStandings,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching alpine season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new alpine season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check for active season
    const activeSeason = get(`
      SELECT * FROM alpine_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [worldId]);

    if (activeSeason) {
      return res.status(400).json({ error: 'An active season already exists' });
    }

    // Get last completed season to determine next year
    const lastSeason = get(`
      SELECT * FROM alpine_seasons
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
      INSERT INTO alpine_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'not_started')
    `, [seasonId, worldId, seasonName, startYear, endYear]);

    // Generate calendar
    const calendar = generateAlpineCalendar(startYear);

    // Insert events
    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO alpine_events (id, season_id, event_index, name, location, country, discipline, runs, date, status, championship)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country,
          event.discipline, event.runs, event.date, event.championship ? 1 : 0]);
    }

    const season = get('SELECT * FROM alpine_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM alpine_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season created',
      season,
      events: events.map(e => ({ ...e, results: [], run1_results: [], run2_results: [] })),
      standings: [],
      disciplineStandings: { downhill: [], super_g: [], giant_slalom: [], slalom: [] }
    });
  } catch (error) {
    console.error('Error creating alpine season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM alpine_events e
      INNER JOIN alpine_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const skiers = all('SELECT * FROM alpine_skiers WHERE world_id = ? ORDER BY last_name', [event.world_id]);

    res.json({
      event: {
        ...event,
        results: JSON.parse(event.results || '[]'),
        run1_results: JSON.parse(event.run1_results || '[]'),
        run2_results: JSON.parse(event.run2_results || '[]')
      },
      skiers,
      countryNames: allCountries,
      disciplineInfo: disciplineTypes[event.discipline]
    });
  } catch (error) {
    console.error('Error fetching alpine event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Simulate a race (Run 1 for 2-run races, or full race for 1-run races)
router.post('/event/:eventId/simulate', authMiddleware, validateWeekLock('alpine_events', 'alpine_seasons'), (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM alpine_events e
      INNER JOIN alpine_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Race already completed' });
    }

    // Get all skiers
    const skiers = all('SELECT * FROM alpine_skiers WHERE world_id = ?', [event.world_id]);

    if (skiers.length === 0) {
      return res.status(400).json({ error: 'No skiers available' });
    }

    const discipline = event.discipline;
    const runs = event.runs;
    const isTwoRunRace = runs === 2;

    // Shuffle start order
    const startOrder = [...skiers].sort(() => Math.random() - 0.5);

    // Simulate run
    const runResults = startOrder.map((skier, index) => {
      const result = simulateRun(skier, discipline, false);
      return {
        skierId: skier.id,
        firstName: skier.first_name,
        lastName: skier.last_name,
        country: skier.country,
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

    if (isTwoRunRace) {
      // Two-run race: save run 1 results, set status to run1_completed
      run('UPDATE alpine_events SET status = ?, run1_results = ? WHERE id = ?',
        ['run1_completed', JSON.stringify(runResults), eventId]);

      res.json({
        message: 'Run 1 completed',
        run: 1,
        results: runResults,
        status: 'run1_completed',
        needsRun2: true
      });
    } else {
      // Single-run race: complete the race
      run('UPDATE alpine_events SET status = ?, results = ? WHERE id = ?',
        ['completed', JSON.stringify(runResults), eventId]);

      // Update standings
      const { overallStandings, disciplineStandings } = updateStandingsAfterRace(event.season_id, discipline, runResults);

      res.json({
        message: 'Race completed',
        run: 1,
        results: runResults,
        status: 'completed',
        needsRun2: false,
        standings: overallStandings,
        disciplineStandings
      });
    }
  } catch (error) {
    console.error('Error simulating alpine race:', error);
    res.status(500).json({ error: 'Failed to simulate race' });
  }
});

// Simulate Run 2 for 2-run races
router.post('/event/:eventId/simulate-run2', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM alpine_events e
      INNER JOIN alpine_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'run1_completed') {
      return res.status(400).json({ error: 'Run 1 must be completed first' });
    }

    const discipline = event.discipline;
    const run1Results = JSON.parse(event.run1_results || '[]');

    // Top 30 from Run 1 qualify for Run 2, start in reverse order
    const qualifiedSkiers = run1Results
      .filter(r => !r.dnf)
      .slice(0, 30)
      .reverse(); // 30th place starts first

    // Get full skier data
    const skierIds = qualifiedSkiers.map(r => r.skierId);
    const skiersMap = new Map();
    const skiers = all('SELECT * FROM alpine_skiers WHERE world_id = ?', [event.world_id]);
    skiers.forEach(s => skiersMap.set(s.id, s));

    // Simulate run 2 for qualified skiers
    const run2Results = qualifiedSkiers.map((run1Result, index) => {
      const skier = skiersMap.get(run1Result.skierId);
      if (!skier) return null;

      const result = simulateRun(skier, discipline, true, run1Result.time);
      return {
        skierId: skier.id,
        firstName: skier.first_name,
        lastName: skier.last_name,
        country: skier.country,
        startPosition: index + 1,
        run1Time: run1Result.time,
        run1Formatted: run1Result.timeFormatted,
        ...result
      };
    }).filter(r => r !== null);

    // Calculate combined times and final results
    const finalResults = run2Results.map(r => {
      if (r.dnf) {
        return {
          ...r,
          totalTime: null,
          totalFormatted: 'DNF (Run 2)'
        };
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

    // Add DNFs from Run 1 (positions 31+) and Run 1 DNFs
    const run1DNFs = run1Results.filter(r => r.dnf);
    const didNotQualify = run1Results.filter(r => !r.dnf).slice(30);

    // Sort final results by total time
    finalResults.sort((a, b) => {
      if (a.totalTime === null && b.totalTime === null) return 0;
      if (a.totalTime === null) return 1;
      if (b.totalTime === null) return -1;
      return a.totalTime - b.totalTime;
    });

    // Assign positions
    const leaderTime = finalResults.find(r => r.totalTime !== null)?.totalTime || 0;
    finalResults.forEach((result, index) => {
      result.position = index + 1;
      if (result.totalTime !== null) {
        result.timeBehind = index === 0 || result.totalTime === leaderTime ? 0 : Math.round((result.totalTime - leaderTime) * 100) / 100;
        result.timeBehindFormatted = formatTimeDiff(result.timeBehind);
      }
    });

    // Add non-qualified skiers to end of results
    let position = finalResults.length + 1;
    for (const skier of didNotQualify) {
      finalResults.push({
        ...skier,
        position: position++,
        run2Time: null,
        run2Formatted: '-',
        totalTime: skier.time, // Only Run 1 time
        totalFormatted: skier.timeFormatted + ' (R1 only)',
        didNotQualifyForRun2: true
      });
    }

    // Add Run 1 DNFs
    for (const skier of run1DNFs) {
      finalResults.push({
        ...skier,
        position: position++,
        run2Time: null,
        run2Formatted: '-',
        totalTime: null,
        totalFormatted: 'DNF (Run 1)'
      });
    }

    // Save results
    run('UPDATE alpine_events SET status = ?, run2_results = ?, results = ? WHERE id = ?',
      ['completed', JSON.stringify(run2Results), JSON.stringify(finalResults), eventId]);

    // Update standings
    const { overallStandings, disciplineStandings } = updateStandingsAfterRace(event.season_id, discipline, finalResults);

    res.json({
      message: 'Race completed',
      run: 2,
      run2Results,
      finalResults,
      status: 'completed',
      standings: overallStandings,
      disciplineStandings
    });
  } catch (error) {
    console.error('Error simulating alpine run 2:', error);
    res.status(500).json({ error: 'Failed to simulate run 2' });
  }
});

// Helper function to update standings after a race
function updateStandingsAfterRace(seasonId, discipline, results) {
  const season = get('SELECT * FROM alpine_seasons WHERE id = ?', [seasonId]);
  if (!season) return { overallStandings: [], disciplineStandings: null };

  let overallStandings = [];
  try {
    overallStandings = JSON.parse(season.standings || '[]');
  } catch (e) {
    overallStandings = [];
  }

  const standingsMap = new Map();
  for (const s of overallStandings) {
    standingsMap.set(s.skierId, { ...s });
  }

  // Add WC points (only for finishers)
  const finishers = results.filter(r => !r.dnf && r.totalTime !== null && !r.didNotQualifyForRun2);
  for (const result of finishers) {
    if (result.position <= 30) {
      const points = worldCupPoints[result.position - 1] || 0;
      const current = standingsMap.get(result.skierId) || {
        skierId: result.skierId,
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

      standingsMap.set(result.skierId, current);
    }
  }

  overallStandings = Array.from(standingsMap.values())
    .sort((a, b) => b.points - a.points);

  run('UPDATE alpine_seasons SET standings = ?, status = ? WHERE id = ?',
    [JSON.stringify(overallStandings), 'in_progress', seasonId]);

  // Update discipline standings
  const disciplineStandings = updateDisciplineStandings(seasonId, discipline, results);

  return { overallStandings, disciplineStandings: { [discipline]: disciplineStandings } };
}

// Reset season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM alpine_seasons s
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
      UPDATE alpine_seasons
      SET standings = '[]', downhill_standings = '[]', super_g_standings = '[]',
          giant_slalom_standings = '[]', slalom_standings = '[]', status = 'not_started'
      WHERE id = ?
    `, [seasonId]);

    // Reset all events
    run('UPDATE alpine_events SET status = ?, results = ?, run1_results = ?, run2_results = ? WHERE season_id = ?',
      ['scheduled', '[]', '[]', '[]', seasonId]);

    const updatedSeason = get('SELECT * FROM alpine_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM alpine_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season reset successfully',
      season: updatedSeason,
      events: events.map(e => ({ ...e, results: [], run1_results: [], run2_results: [] })),
      standings: [],
      disciplineStandings: { downhill: [], super_g: [], giant_slalom: [], slalom: [] }
    });
  } catch (error) {
    console.error('Error resetting alpine season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

module.exports = router;
