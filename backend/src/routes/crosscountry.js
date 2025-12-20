const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateXCCalendar, worldCupPoints, getRandomXCName, xcRaceTypes } = require('../data/crossCountryCalendar');
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

// Simulate skiing time for a race
function simulateRaceTime(skier, raceType, technique, distance) {
  // Get relevant skills based on technique
  let techniqueSkill;
  if (technique === 'classic') {
    techniqueSkill = skier.skill_classic || 70;
  } else if (technique === 'freestyle') {
    techniqueSkill = skier.skill_skating || 70;
  } else {
    // Combined (skiathlon) - average of both
    techniqueSkill = ((skier.skill_classic || 70) + (skier.skill_skating || 70)) / 2;
  }

  const endurance = skier.skill_endurance || 70;
  const consistency = skier.consistency || 70;
  const form = skier.form || 70;

  // Get sprint/distance skill based on race category
  const raceInfo = xcRaceTypes[raceType];
  const categorySkill = raceInfo?.category === 'sprint'
    ? (skier.skill_sprint || 70)
    : (skier.skill_distance || 70);

  // Base time per km (in seconds) - elite is around 2:30-3:00 per km
  let baseTimePerKm;
  if (raceInfo?.category === 'sprint') {
    baseTimePerKm = 140; // Faster pace for sprints
  } else if (distance >= 50) {
    baseTimePerKm = 190; // Slower pace for ultra-distance
  } else if (distance >= 30) {
    baseTimePerKm = 175; // Medium-long
  } else {
    baseTimePerKm = 160; // Standard distance
  }

  // Skill effects
  const techniqueEffect = (70 - techniqueSkill) * 0.6;
  const categoryEffect = (70 - categorySkill) * 0.5;
  const enduranceEffect = (70 - endurance) * (distance >= 30 ? 0.4 : 0.2);
  const formEffect = (70 - form) * 0.3;

  // Random variation based on consistency
  const consistencyMultiplier = 1.5 - (consistency / 100);
  const randomVariation = randomNormal(0, 3 * consistencyMultiplier);

  const timePerKm = baseTimePerKm + techniqueEffect + categoryEffect + enduranceEffect + formEffect + randomVariation;

  return Math.max(120, timePerKm * distance); // minimum 2:00/km pace
}

// Simulate a sprint heat (qualification, quarterfinal, semifinal, final)
function simulateSprintHeat(skiers, technique) {
  const results = skiers.map(skier => {
    const time = simulateRaceTime(skier, technique === 'classic' ? 'sprint_classic' : 'sprint_free', technique, 1.5);
    return {
      skierId: skier.id,
      firstName: skier.first_name,
      lastName: skier.last_name,
      country: skier.country,
      time: Math.round(time * 100) / 100,
      qualified: false
    };
  });

  results.sort((a, b) => a.time - b.time);
  return results;
}

// Simulate complete sprint race
function simulateSprintRace(skiers, technique) {
  // Qualification round - all skiers, top 30 advance
  const qualResults = skiers.map(skier => {
    const time = simulateRaceTime(skier, technique === 'classic' ? 'sprint_classic' : 'sprint_free', technique, 1.5);
    return {
      skierId: skier.id,
      firstName: skier.first_name,
      lastName: skier.last_name,
      country: skier.country,
      qualTime: Math.round(time * 100) / 100
    };
  });
  qualResults.sort((a, b) => a.qualTime - b.qualTime);

  // Top 30 advance to quarterfinals
  const qualified = qualResults.slice(0, 30);

  // Quarterfinals - 5 heats of 6 skiers
  const quarterHeats = [];
  for (let i = 0; i < 5; i++) {
    const heatSkiers = [];
    // Snake draft seeding
    for (let j = 0; j < 6; j++) {
      const idx = (j % 2 === 0) ? (i + j * 5) : ((4 - i) + j * 5);
      if (idx < qualified.length) {
        const q = qualified[idx];
        heatSkiers.push(skiers.find(s => s.id === q.skierId));
      }
    }
    const heatResults = simulateSprintHeat(heatSkiers.filter(Boolean), technique);
    // Top 2 advance + 2 lucky losers
    heatResults.forEach((r, idx) => r.qualified = idx < 2);
    quarterHeats.push(heatResults);
  }

  // Get qualifiers for semifinals (10 direct + 2 lucky losers)
  const directQualifiers = quarterHeats.flatMap(h => h.filter(r => r.qualified));
  const luckyLosers = quarterHeats.flatMap(h => h.filter(r => !r.qualified))
    .sort((a, b) => a.time - b.time)
    .slice(0, 2);
  const semifinalists = [...directQualifiers, ...luckyLosers];

  // Semifinals - 2 heats of 6 skiers
  const semiHeats = [];
  for (let i = 0; i < 2; i++) {
    const heatSkiers = [];
    for (let j = 0; j < 6; j++) {
      const idx = i + j * 2;
      if (idx < semifinalists.length) {
        const sf = semifinalists[idx];
        heatSkiers.push(skiers.find(s => s.id === sf.skierId));
      }
    }
    const heatResults = simulateSprintHeat(heatSkiers.filter(Boolean), technique);
    heatResults.forEach((r, idx) => r.qualified = idx < 3);
    semiHeats.push(heatResults);
  }

  // Final - top 6
  const finalists = semiHeats.flatMap(h => h.filter(r => r.qualified));
  const finalSkiers = finalists.map(f => skiers.find(s => s.id === f.skierId)).filter(Boolean);
  const finalResults = simulateSprintHeat(finalSkiers, technique);

  // Combine all results for final standings
  const allResults = [];

  // Top 6 from final
  finalResults.forEach((r, idx) => {
    allResults.push({
      ...r,
      position: idx + 1,
      round: 'final'
    });
  });

  // 7-12 from semifinal non-qualifiers (sorted by time)
  const semiNonQualifiers = semiHeats.flatMap(h => h.filter(r => !r.qualified))
    .sort((a, b) => a.time - b.time);
  semiNonQualifiers.forEach((r, idx) => {
    allResults.push({
      ...r,
      position: 7 + idx,
      round: 'semifinal'
    });
  });

  // 13-30 from quarterfinal non-qualifiers (sorted by time)
  const quarterNonQualifiers = quarterHeats.flatMap(h => h.filter(r => !r.qualified))
    .filter(r => !luckyLosers.includes(r))
    .sort((a, b) => a.time - b.time);
  quarterNonQualifiers.forEach((r, idx) => {
    allResults.push({
      ...r,
      position: 13 + idx,
      round: 'quarterfinal'
    });
  });

  // 31+ from qualification (sorted by qual time)
  qualResults.slice(30).forEach((r, idx) => {
    allResults.push({
      skierId: r.skierId,
      firstName: r.firstName,
      lastName: r.lastName,
      country: r.country,
      time: r.qualTime,
      position: 31 + idx,
      round: 'qualification'
    });
  });

  return {
    qualification: qualResults,
    quarterHeats,
    semiHeats,
    final: finalResults,
    standings: allResults
  };
}

// Simulate interval start race
function simulateIntervalRace(skiers, raceType, technique, distance) {
  const results = skiers.map(skier => {
    const time = simulateRaceTime(skier, raceType, technique, distance);
    return {
      skierId: skier.id,
      firstName: skier.first_name,
      lastName: skier.last_name,
      country: skier.country,
      totalTime: Math.round(time * 10) / 10
    };
  });

  results.sort((a, b) => a.totalTime - b.totalTime);

  const leaderTime = results[0]?.totalTime || 0;
  results.forEach((r, idx) => {
    r.position = idx + 1;
    r.timeBehind = idx === 0 ? 0 : Math.round((r.totalTime - leaderTime) * 10) / 10;
  });

  return results;
}

// Simulate mass start race
function simulateMassStartRace(skiers, raceType, technique, distance) {
  // Similar to interval but with pack dynamics
  const results = skiers.map(skier => {
    let time = simulateRaceTime(skier, raceType, technique, distance);
    // Pack bonus/penalty based on random positioning
    const packEffect = randomNormal(0, 5);
    time += packEffect;
    return {
      skierId: skier.id,
      firstName: skier.first_name,
      lastName: skier.last_name,
      country: skier.country,
      totalTime: Math.round(Math.max(time, distance * 120) * 10) / 10
    };
  });

  results.sort((a, b) => a.totalTime - b.totalTime);

  const leaderTime = results[0]?.totalTime || 0;
  results.forEach((r, idx) => {
    r.position = idx + 1;
    r.timeBehind = idx === 0 ? 0 : Math.round((r.totalTime - leaderTime) * 10) / 10;
  });

  return results;
}

// Format time as MM:SS.t or HH:MM:SS.t
function formatTime(seconds) {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

// Update discipline standings after a race
function updateDisciplineStandings(seasonId, category, results) {
  const columnName = `${category}_standings`;

  const season = get('SELECT * FROM xc_seasons WHERE id = ?', [seasonId]);
  if (!season) return [];

  let currentStandings = [];
  try {
    currentStandings = JSON.parse(season[columnName] || '[]');
  } catch (e) {
    currentStandings = [];
  }

  const standingsMap = new Map();
  for (const s of currentStandings) {
    standingsMap.set(s.skierId, { ...s });
  }

  for (const result of results) {
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

  const standings = Array.from(standingsMap.values())
    .sort((a, b) => b.points - a.points);

  run(`UPDATE xc_seasons SET ${columnName} = ? WHERE id = ?`, [JSON.stringify(standings), seasonId]);

  return standings;
}

// ==================== ROUTES ====================

// Get all skiers for a world
router.get('/world/:worldId/skiers', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const skiers = all('SELECT * FROM xcskiers WHERE world_id = ? ORDER BY last_name, first_name', [worldId]);

    res.json({ skiers, countryNames: allCountries });
  } catch (error) {
    console.error('Error fetching skiers:', error);
    res.status(500).json({ error: 'Failed to fetch skiers' });
  }
});

// Generate skiers for a world
router.post('/world/:worldId/generate-skiers', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const existingSkiers = get('SELECT COUNT(*) as count FROM xcskiers WHERE world_id = ?', [worldId]);
    if (existingSkiers.count > 0) {
      return res.status(400).json({ error: 'Skiers already exist for this world' });
    }

    // Generate skiers from top XC nations
    const nations = [
      { country: 'NOR', count: 10 },
      { country: 'SWE', count: 6 },
      { country: 'FIN', count: 5 },
      { country: 'RUS', count: 6 },
      { country: 'GER', count: 4 },
      { country: 'ITA', count: 4 },
      { country: 'SUI', count: 4 },
      { country: 'FRA', count: 4 },
      { country: 'AUT', count: 3 },
      { country: 'USA', count: 3 },
      { country: 'CAN', count: 2 },
      { country: 'CZE', count: 2 },
      { country: 'POL', count: 2 },
      { country: 'SLO', count: 2 },
      { country: 'EST', count: 2 },
    ];

    const skiers = [];

    for (const nation of nations) {
      for (let i = 0; i < nation.count; i++) {
        const { firstName, lastName } = getRandomXCName(nation.country);

        const baseSkill = 60 + Math.floor(Math.random() * 30);
        const variance = () => Math.floor((Math.random() - 0.5) * 20);

        // Determine if skier is sprint or distance specialist
        const isSprintSpecialist = Math.random() < 0.3;

        const skier = {
          id: uuidv4(),
          world_id: worldId,
          first_name: firstName,
          last_name: lastName,
          country: nation.country,
          skill_classic: Math.min(99, Math.max(50, baseSkill + variance())),
          skill_skating: Math.min(99, Math.max(50, baseSkill + variance())),
          skill_sprint: Math.min(99, Math.max(50, isSprintSpecialist ? baseSkill + 10 + variance() : baseSkill - 5 + variance())),
          skill_distance: Math.min(99, Math.max(50, isSprintSpecialist ? baseSkill - 5 + variance() : baseSkill + 5 + variance())),
          skill_endurance: Math.min(99, Math.max(50, baseSkill + variance())),
          consistency: Math.min(99, Math.max(50, 65 + Math.floor(Math.random() * 25))),
          form: Math.min(99, Math.max(50, 60 + Math.floor(Math.random() * 30)))
        };

        run(`
          INSERT INTO xcskiers (id, world_id, first_name, last_name, country, skill_classic, skill_skating, skill_sprint, skill_distance, skill_endurance, consistency, form)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [skier.id, skier.world_id, skier.first_name, skier.last_name, skier.country,
            skier.skill_classic, skier.skill_skating, skier.skill_sprint, skier.skill_distance,
            skier.skill_endurance, skier.consistency, skier.form]);

        skiers.push(skier);
      }
    }

    res.json({ message: 'Skiers generated', skiers, countryNames: allCountries });
  } catch (error) {
    console.error('Error generating skiers:', error);
    res.status(500).json({ error: 'Failed to generate skiers' });
  }
});

// Create a new skier
router.post('/world/:worldId/skier', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { first_name, last_name, country, skill_classic, skill_skating, skill_sprint, skill_distance, skill_endurance, consistency, form, team_id } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const id = uuidv4();
    run(`
      INSERT INTO xcskiers (id, world_id, first_name, last_name, country, skill_classic, skill_skating, skill_sprint, skill_distance, skill_endurance, consistency, form, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, worldId, first_name, last_name, country, skill_classic || 70, skill_skating || 70, skill_sprint || 70, skill_distance || 70, skill_endurance || 70, consistency || 70, form || 70, team_id || null]);

    const skier = get('SELECT * FROM xcskiers WHERE id = ?', [id]);
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
    const { first_name, last_name, country, skill_classic, skill_skating, skill_sprint, skill_distance, skill_endurance, consistency, form, team_id } = req.body;

    const skier = get(`
      SELECT s.* FROM xcskiers s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!skier) {
      return res.status(404).json({ error: 'Skier not found' });
    }

    run(`
      UPDATE xcskiers SET
        first_name = ?, last_name = ?, country = ?,
        skill_classic = ?, skill_skating = ?, skill_sprint = ?,
        skill_distance = ?, skill_endurance = ?, consistency = ?, form = ?,
        team_id = ?
      WHERE id = ?
    `, [first_name, last_name, country, skill_classic, skill_skating, skill_sprint, skill_distance, skill_endurance, consistency, form, team_id !== undefined ? (team_id || null) : skier.team_id, id]);

    const updatedSkier = get('SELECT * FROM xcskiers WHERE id = ?', [id]);
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

    const skier = get(`
      SELECT s.* FROM xcskiers s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!skier) {
      return res.status(404).json({ error: 'Skier not found' });
    }

    run('DELETE FROM xcskiers WHERE id = ?', [id]);
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

    run('DELETE FROM xcskiers WHERE world_id = ?', [worldId]);
    res.json({ message: 'All skiers deleted' });
  } catch (error) {
    console.error('Error deleting all skiers:', error);
    res.status(500).json({ error: 'Failed to delete skiers' });
  }
});

// Get current season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM xc_seasons
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
      'SELECT * FROM xc_events WHERE season_id = ? ORDER BY event_index',
      [season.id]
    );

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    const disciplineStandings = {
      sprint: JSON.parse(season.sprint_standings || '[]'),
      distance: JSON.parse(season.distance_standings || '[]'),
      tour: JSON.parse(season.tour_standings || '[]')
    };

    const eventsWithResults = events.map(event => ({
      ...event,
      results: JSON.parse(event.results || '{}')
    }));

    res.json({
      season,
      events: eventsWithResults,
      standings,
      disciplineStandings,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching XC season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const activeSeason = get(`
      SELECT * FROM xc_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [worldId]);

    if (activeSeason) {
      return res.status(400).json({ error: 'An active season already exists' });
    }

    const lastSeason = get(`
      SELECT * FROM xc_seasons
      WHERE world_id = ?
      ORDER BY year_end DESC
      LIMIT 1
    `, [worldId]);

    const startYear = lastSeason ? lastSeason.year_end : 2024;
    const endYear = startYear + 1;

    const seasonId = uuidv4();
    const seasonName = `${startYear}/${endYear}`;

    run(`
      INSERT INTO xc_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'not_started')
    `, [seasonId, worldId, seasonName, startYear, endYear]);

    const calendar = generateXCCalendar(startYear);

    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO xc_events (id, season_id, event_index, name, location, country, race_type, technique, distance, date, status, tour_stage, championship)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country,
          event.raceType, event.technique, event.distance, event.date, event.tourStage || 0, event.championship ? 1 : 0]);
    }

    const season = get('SELECT * FROM xc_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM xc_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season created',
      season,
      events: events.map(e => ({ ...e, results: {} })),
      standings: [],
      disciplineStandings: { sprint: [], distance: [], tour: [] }
    });
  } catch (error) {
    console.error('Error creating XC season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM xc_events e
      INNER JOIN xc_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const skiers = all('SELECT * FROM xcskiers WHERE world_id = ? ORDER BY last_name', [event.world_id]);

    res.json({
      event: {
        ...event,
        results: JSON.parse(event.results || '{}')
      },
      skiers,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching XC event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Simulate a race
router.post('/event/:eventId/simulate', authMiddleware, validateWeekLock('xc_events', 'xc_seasons'), (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM xc_events e
      INNER JOIN xc_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Race already completed' });
    }

    const skiers = all('SELECT * FROM xcskiers WHERE world_id = ?', [event.world_id]);

    if (skiers.length === 0) {
      return res.status(400).json({ error: 'No skiers available' });
    }

    const raceType = event.race_type;
    const technique = event.technique;
    const distance = event.distance;
    const raceInfo = xcRaceTypes[raceType];

    let results;
    let finalStandings;

    if (raceInfo?.startType === 'sprint') {
      // Sprint race with heats
      results = simulateSprintRace(skiers, technique);
      finalStandings = results.standings;
    } else if (raceInfo?.startType === 'mass') {
      // Mass start race
      finalStandings = simulateMassStartRace(skiers, raceType, technique, distance);
      results = { final: finalStandings };
    } else if (raceInfo?.startType === 'pursuit') {
      // Pursuit - based on previous race
      const previousRace = get(`
        SELECT results FROM xc_events
        WHERE season_id = ? AND event_index < ? AND status = 'completed'
        ORDER BY event_index DESC
        LIMIT 1
      `, [event.season_id, event.event_index]);

      if (previousRace) {
        const prevResults = JSON.parse(previousRace.results || '{}');
        if (prevResults.final) {
          // Use previous results for start order with time gaps
          const startOrder = prevResults.final.slice(0, 60);
          const raceResults = startOrder.map(prev => {
            const skier = skiers.find(s => s.id === prev.skierId);
            if (!skier) return null;
            const raceTime = simulateRaceTime(skier, raceType, technique, distance);
            return {
              skierId: skier.id,
              firstName: skier.first_name,
              lastName: skier.last_name,
              country: skier.country,
              startGap: prev.timeBehind || 0,
              raceTime: Math.round(raceTime * 10) / 10,
              totalTime: Math.round((raceTime + (prev.timeBehind || 0)) * 10) / 10
            };
          }).filter(Boolean);

          raceResults.sort((a, b) => a.totalTime - b.totalTime);
          const leaderTime = raceResults[0]?.totalTime || 0;
          raceResults.forEach((r, idx) => {
            r.position = idx + 1;
            r.timeBehind = idx === 0 ? 0 : Math.round((r.totalTime - leaderTime) * 10) / 10;
          });

          finalStandings = raceResults;
          results = { final: finalStandings };
        } else {
          finalStandings = simulateIntervalRace(skiers, raceType, technique, distance);
          results = { final: finalStandings };
        }
      } else {
        finalStandings = simulateIntervalRace(skiers, raceType, technique, distance);
        results = { final: finalStandings };
      }
    } else {
      // Interval start race
      finalStandings = simulateIntervalRace(skiers, raceType, technique, distance);
      results = { final: finalStandings };
    }

    // Save results
    const fullResults = {
      status: 'completed',
      raceType,
      technique,
      distance,
      ...results
    };

    run('UPDATE xc_events SET status = ?, results = ? WHERE id = ?',
      ['completed', JSON.stringify(fullResults), eventId]);

    // Update overall standings
    const season = get('SELECT * FROM xc_seasons WHERE id = ?', [event.season_id]);
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

    for (const result of finalStandings) {
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

    run('UPDATE xc_seasons SET standings = ?, status = ? WHERE id = ?',
      [JSON.stringify(overallStandings), 'in_progress', event.season_id]);

    // Update discipline standings
    const category = raceInfo?.category || 'distance';
    let disciplineStandings = null;
    if (category === 'sprint' || category === 'distance') {
      disciplineStandings = updateDisciplineStandings(event.season_id, category, finalStandings);
    }

    res.json({
      message: 'Race simulated',
      results: fullResults,
      standings: overallStandings,
      disciplineStandings: disciplineStandings ? { [category]: disciplineStandings } : null
    });
  } catch (error) {
    console.error('Error simulating XC race:', error);
    res.status(500).json({ error: 'Failed to simulate race' });
  }
});

// Reset season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM xc_seasons s
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
      UPDATE xc_seasons
      SET standings = '[]', sprint_standings = '[]', distance_standings = '[]',
          tour_standings = '[]', status = 'not_started', current_event_index = 0
      WHERE id = ?
    `, [seasonId]);

    run('UPDATE xc_events SET status = ?, results = ? WHERE season_id = ?',
      ['scheduled', '{}', seasonId]);

    const updatedSeason = get('SELECT * FROM xc_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM xc_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season reset successfully',
      season: updatedSeason,
      events: events.map(e => ({ ...e, results: {} })),
      standings: [],
      disciplineStandings: { sprint: [], distance: [], tour: [] }
    });
  } catch (error) {
    console.error('Error resetting XC season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

module.exports = router;
