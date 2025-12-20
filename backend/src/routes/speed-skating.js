const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const {
  venues,
  distances,
  worldCupPoints,
  countryNames,
  countryDistribution,
  generateSpeedSkatingCalendar,
  getRandomSkaterName,
  getSpecialty
} = require('../data/speedSkatingCalendar');

const router = express.Router();

// Helper: Random normal distribution (Box-Muller)
function randomNormal(mean = 0, stdDev = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Helper: Format time as MM:SS.00
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  }
  return secs.toFixed(2);
}

// Helper: Simulate a skater's time for a given distance
function simulateSkaterTime(skater, distance, altitude = 0) {
  const distanceInfo = distances[distance];
  if (!distanceInfo) return null;

  const baseTime = distanceInfo.baseTime;
  const category = distanceInfo.category;

  // Skill effects - different importance based on distance category
  let skillEffect = 0;

  if (category === 'sprint') {
    // Sprint: acceleration most important, then cornering
    skillEffect += (70 - skater.skill_acceleration) * 0.08;
    skillEffect += (70 - skater.skill_cornering) * 0.05;
    skillEffect += (70 - skater.skill_pace_control) * 0.02;
    skillEffect += (70 - skater.skill_endurance) * 0.01;
  } else if (category === 'middle') {
    // Middle: pace control most important, balanced
    skillEffect += (70 - skater.skill_pace_control) * 0.06;
    skillEffect += (70 - skater.skill_acceleration) * 0.04;
    skillEffect += (70 - skater.skill_cornering) * 0.04;
    skillEffect += (70 - skater.skill_endurance) * 0.03;
  } else {
    // Long: endurance most important
    skillEffect += (70 - skater.skill_endurance) * 0.08;
    skillEffect += (70 - skater.skill_pace_control) * 0.05;
    skillEffect += (70 - skater.skill_cornering) * 0.02;
    skillEffect += (70 - skater.skill_acceleration) * 0.01;
  }

  // Form effect
  const formEffect = (70 - skater.form) * 0.03;

  // Altitude effect (high altitude = faster, up to 2% at 1500m)
  const altitudeEffect = -(altitude / 1500) * baseTime * 0.02;

  // Random variance based on consistency
  const consistencyMultiplier = (100 - skater.consistency) / 100;
  const randomVariance = randomNormal(0, baseTime * 0.01 * consistencyMultiplier);

  // Scale effects by distance (longer distances = larger absolute effects)
  const distanceScale = baseTime / 35; // Normalize to 500m base

  const finalTime = baseTime + (skillEffect * distanceScale) + (formEffect * distanceScale) + altitudeEffect + randomVariance;

  return Math.max(baseTime * 0.95, finalTime); // Can't be unrealistically fast
}

// ============ SKATERS ENDPOINTS ============

// Get all skaters for a world
router.get('/world/:worldId/skaters', authMiddleware, (req, res) => {
  try {
    const skaters = all(`
      SELECT s.*, t.name as team_name, t.color as team_color
      FROM speed_skaters s
      LEFT JOIN teams t ON s.team_id = t.id
      WHERE s.world_id = ?
      ORDER BY s.last_name, s.first_name
    `, [req.params.worldId]);

    res.json({ skaters, countryNames });
  } catch (error) {
    console.error('Error fetching skaters:', error);
    res.status(500).json({ error: 'Failed to fetch skaters' });
  }
});

// Generate random skaters
router.post('/world/:worldId/generate-skaters', authMiddleware, (req, res) => {
  try {
    const worldId = req.params.worldId;
    const count = req.body.count || 50;

    // Distribute skaters by country
    const skatersList = [];
    for (const [country, countryCount] of Object.entries(countryDistribution)) {
      for (let i = 0; i < countryCount; i++) {
        const { firstName, lastName } = getRandomSkaterName(country);

        // Generate skills with some variance
        const baseSkill = 65 + Math.floor(Math.random() * 25);
        const acceleration = Math.max(50, Math.min(99, baseSkill + Math.floor(randomNormal(0, 10))));
        const cornering = Math.max(50, Math.min(99, baseSkill + Math.floor(randomNormal(0, 8))));
        const endurance = Math.max(50, Math.min(99, baseSkill + Math.floor(randomNormal(0, 10))));
        const paceControl = Math.max(50, Math.min(99, baseSkill + Math.floor(randomNormal(0, 8))));
        const consistency = Math.max(50, Math.min(99, 70 + Math.floor(randomNormal(0, 12))));
        const form = Math.max(50, Math.min(99, 70 + Math.floor(randomNormal(0, 10))));

        const specialty = getSpecialty(acceleration, endurance);

        const skaterId = uuidv4();
        run(`
          INSERT INTO speed_skaters (id, world_id, first_name, last_name, country,
            skill_acceleration, skill_cornering, skill_endurance, skill_pace_control,
            consistency, form, specialty)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [skaterId, worldId, firstName, lastName, country,
            acceleration, cornering, endurance, paceControl, consistency, form, specialty]);

        skatersList.push({
          id: skaterId,
          first_name: firstName,
          last_name: lastName,
          country,
          skill_acceleration: acceleration,
          skill_cornering: cornering,
          skill_endurance: endurance,
          skill_pace_control: paceControl,
          consistency,
          form,
          specialty
        });
      }
    }

    res.json({ skaters: skatersList, countryNames });
  } catch (error) {
    console.error('Error generating skaters:', error);
    res.status(500).json({ error: 'Failed to generate skaters' });
  }
});

// Create single skater
router.post('/world/:worldId/skater', authMiddleware, (req, res) => {
  try {
    // Support both camelCase and snake_case from frontend
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const country = req.body.country;
    const teamId = req.body.teamId || req.body.team_id;
    const skillAcceleration = req.body.skillAcceleration || req.body.skill_acceleration;
    const skillCornering = req.body.skillCornering || req.body.skill_cornering;
    const skillEndurance = req.body.skillEndurance || req.body.skill_endurance;
    const skillPaceControl = req.body.skillPaceControl || req.body.skill_pace_control;
    const consistency = req.body.consistency;
    const form = req.body.form;
    const specialty = req.body.specialty;

    const skaterId = uuidv4();
    run(`
      INSERT INTO speed_skaters (id, world_id, first_name, last_name, country, team_id,
        skill_acceleration, skill_cornering, skill_endurance, skill_pace_control,
        consistency, form, specialty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [skaterId, req.params.worldId, firstName, lastName, country, teamId || null,
        skillAcceleration || 70, skillCornering || 70, skillEndurance || 70,
        skillPaceControl || 70, consistency || 70, form || 70, specialty || 'all-round']);

    const skater = get('SELECT * FROM speed_skaters WHERE id = ?', [skaterId]);
    res.status(201).json({ skater });
  } catch (error) {
    console.error('Error creating skater:', error);
    res.status(500).json({ error: 'Failed to create skater' });
  }
});

// Update skater
router.put('/skater/:id', authMiddleware, (req, res) => {
  try {
    // Support both camelCase and snake_case from frontend
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const country = req.body.country;
    const teamId = req.body.teamId || req.body.team_id;
    const skillAcceleration = req.body.skillAcceleration || req.body.skill_acceleration;
    const skillCornering = req.body.skillCornering || req.body.skill_cornering;
    const skillEndurance = req.body.skillEndurance || req.body.skill_endurance;
    const skillPaceControl = req.body.skillPaceControl || req.body.skill_pace_control;
    const consistency = req.body.consistency;
    const form = req.body.form;
    const specialty = req.body.specialty;

    run(`
      UPDATE speed_skaters SET
        first_name = ?, last_name = ?, country = ?, team_id = ?,
        skill_acceleration = ?, skill_cornering = ?, skill_endurance = ?, skill_pace_control = ?,
        consistency = ?, form = ?, specialty = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [firstName, lastName, country, teamId || null, skillAcceleration, skillCornering,
        skillEndurance, skillPaceControl, consistency, form, specialty, req.params.id]);

    const skater = get('SELECT * FROM speed_skaters WHERE id = ?', [req.params.id]);
    res.json({ skater });
  } catch (error) {
    console.error('Error updating skater:', error);
    res.status(500).json({ error: 'Failed to update skater' });
  }
});

// Delete skater
router.delete('/skater/:id', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM speed_skaters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Skater deleted successfully' });
  } catch (error) {
    console.error('Error deleting skater:', error);
    res.status(500).json({ error: 'Failed to delete skater' });
  }
});

// Delete all skaters for a world
router.delete('/world/:worldId/all-skaters', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM speed_skaters WHERE world_id = ?', [req.params.worldId]);
    res.json({ message: 'All skaters deleted successfully' });
  } catch (error) {
    console.error('Error deleting skaters:', error);
    res.status(500).json({ error: 'Failed to delete skaters' });
  }
});

// ============ SEASON ENDPOINTS ============

// Get current season
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT * FROM speed_skating_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [req.params.worldId]);

    if (!season) {
      return res.json({ season: null, events: [], standings: [], disciplineStandings: {} });
    }

    const events = all(`
      SELECT * FROM speed_skating_events
      WHERE season_id = ?
      ORDER BY event_index
    `, [season.id]);

    let standings = [];
    let disciplineStandings = {};
    try {
      standings = JSON.parse(season.standings || '[]');
      disciplineStandings = JSON.parse(season.discipline_standings || '{}');
    } catch (e) {}

    res.json({ season, events, standings, disciplineStandings, countryNames });
  } catch (error) {
    console.error('Error fetching season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const worldId = req.params.worldId;
    const yearStart = req.body.yearStart || new Date().getFullYear();
    const yearEnd = yearStart + 1;

    const seasonId = uuidv4();
    run(`
      INSERT INTO speed_skating_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'in_progress')
    `, [seasonId, worldId, `Speed Skating World Cup ${yearStart}/${yearEnd}`, yearStart, yearEnd]);

    // Generate calendar and create events
    const calendar = generateSpeedSkatingCalendar(yearStart);
    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO speed_skating_events (id, season_id, event_index, name, location, country,
          altitude, distance, date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country,
          event.altitude, event.distance, event.date]);
    }

    const season = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM speed_skating_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.status(201).json({ season, events, standings: [], disciplineStandings: {} });
  } catch (error) {
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Reset season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    run(`
      UPDATE speed_skating_seasons SET
        standings = '[]', discipline_standings = '{}', current_event_index = 0
      WHERE id = ?
    `, [req.params.seasonId]);

    run(`
      UPDATE speed_skating_events SET
        status = 'scheduled', heats = '[]', results = '[]'
      WHERE season_id = ?
    `, [req.params.seasonId]);

    const season = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [req.params.seasonId]);
    const events = all('SELECT * FROM speed_skating_events WHERE season_id = ? ORDER BY event_index', [req.params.seasonId]);

    res.json({ season, events, standings: [], disciplineStandings: {} });
  } catch (error) {
    console.error('Error resetting season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

// ============ EVENT ENDPOINTS ============

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const event = get('SELECT * FROM speed_skating_events WHERE id = ?', [req.params.eventId]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const season = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [event.season_id]);
    const skaters = all('SELECT * FROM speed_skaters WHERE world_id = ?', [season.world_id]);

    let heats = [];
    let results = [];
    try {
      heats = JSON.parse(event.heats || '[]');
      results = JSON.parse(event.results || '[]');
    } catch (e) {}

    // If no heats generated yet and event not completed, create heats
    if (heats.length === 0 && event.status !== 'completed') {
      heats = createHeats(skaters, season);
    }

    res.json({ event, heats, results, skaters, countryNames });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create heats for a race (helper function)
function createHeats(skaters, season) {
  const standings = JSON.parse(season.standings || '[]');

  // Sort skaters by standings or randomly for first events
  let sortedSkaters = [...skaters];
  if (standings.length > 0) {
    // Sort by WC points (best last)
    sortedSkaters.sort((a, b) => {
      const aPoints = standings.find(s => s.skaterId === a.id)?.points || 0;
      const bPoints = standings.find(s => s.skaterId === b.id)?.points || 0;
      return aPoints - bPoints;
    });
  } else {
    // Random shuffle for first events
    for (let i = sortedSkaters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sortedSkaters[i], sortedSkaters[j]] = [sortedSkaters[j], sortedSkaters[i]];
    }
  }

  // Create pairs (heats)
  const heats = [];
  for (let i = 0; i < sortedSkaters.length; i += 2) {
    const heat = {
      heatNumber: Math.floor(i / 2) + 1,
      skaters: []
    };

    // Inner lane (randomly assigned)
    const innerFirst = Math.random() < 0.5;

    if (sortedSkaters[i]) {
      heat.skaters.push({
        skaterId: sortedSkaters[i].id,
        firstName: sortedSkaters[i].first_name,
        lastName: sortedSkaters[i].last_name,
        country: sortedSkaters[i].country,
        lane: innerFirst ? 'inner' : 'outer',
        time: null,
        status: 'pending'
      });
    }

    if (sortedSkaters[i + 1]) {
      heat.skaters.push({
        skaterId: sortedSkaters[i + 1].id,
        firstName: sortedSkaters[i + 1].first_name,
        lastName: sortedSkaters[i + 1].last_name,
        country: sortedSkaters[i + 1].country,
        lane: innerFirst ? 'outer' : 'inner',
        time: null,
        status: 'pending'
      });
    }

    heats.push(heat);
  }

  return heats;
}

// Simulate a single heat
router.post('/event/:eventId/simulate-heat', authMiddleware, validateWeekLock('speed_skating_events', 'speed_skating_seasons'), (req, res) => {
  try {
    const { heatNumber, frontendResults } = req.body;
    const event = get('SELECT * FROM speed_skating_events WHERE id = ?', [req.params.eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const season = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [event.season_id]);
    let heats = JSON.parse(event.heats || '[]');

    // If no heats yet, create them
    if (heats.length === 0) {
      const skaters = all('SELECT * FROM speed_skaters WHERE world_id = ?', [season.world_id]);
      heats = createHeats(skaters, season);
    }

    const heatIndex = heatNumber - 1;
    if (heatIndex < 0 || heatIndex >= heats.length) {
      return res.status(400).json({ error: 'Invalid heat number' });
    }

    const heat = heats[heatIndex];

    // Use frontend results if provided, otherwise simulate
    if (frontendResults) {
      for (const skaterResult of frontendResults) {
        const skaterInHeat = heat.skaters.find(s => s.skaterId === skaterResult.skaterId);
        if (skaterInHeat) {
          skaterInHeat.time = skaterResult.time;
          skaterInHeat.status = 'finished';
        }
      }
    } else {
      // Simulate times for each skater in heat
      for (const skaterEntry of heat.skaters) {
        const skater = get('SELECT * FROM speed_skaters WHERE id = ?', [skaterEntry.skaterId]);
        if (skater) {
          const time = simulateSkaterTime(skater, event.distance, event.altitude);
          skaterEntry.time = Math.round(time * 100) / 100;
          skaterEntry.status = 'finished';
        }
      }
    }

    // Update event with heats
    run('UPDATE speed_skating_events SET heats = ? WHERE id = ?', [JSON.stringify(heats), event.id]);

    // Check if all heats completed
    const allCompleted = heats.every(h => h.skaters.every(s => s.status === 'finished'));

    if (allCompleted) {
      // Calculate final results
      const allResults = [];
      for (const h of heats) {
        for (const s of h.skaters) {
          if (s.time) {
            allResults.push({
              skaterId: s.skaterId,
              firstName: s.firstName,
              lastName: s.lastName,
              country: s.country,
              time: s.time,
              timeFormatted: formatTime(s.time)
            });
          }
        }
      }

      // Sort by time
      allResults.sort((a, b) => a.time - b.time);

      // Add positions and time behind
      const winnerTime = allResults[0]?.time || 0;
      allResults.forEach((result, idx) => {
        result.position = idx + 1;
        result.timeBehind = Math.round((result.time - winnerTime) * 100) / 100;
        result.timeBehindFormatted = result.timeBehind > 0 ? `+${formatTime(result.timeBehind)}` : '';
        result.wcPoints = idx < worldCupPoints.length ? worldCupPoints[idx] : 0;
      });

      // Update event as completed
      run(`
        UPDATE speed_skating_events SET
          status = 'completed', results = ?
        WHERE id = ?
      `, [JSON.stringify(allResults), event.id]);

      // Update standings
      updateStandings(season.id, event.distance, allResults);

      return res.json({ heat, heats, results: allResults, completed: true });
    }

    res.json({ heat, heats, completed: false });
  } catch (error) {
    console.error('Error simulating heat:', error);
    res.status(500).json({ error: 'Failed to simulate heat' });
  }
});

// Simulate entire event
router.post('/event/:eventId/simulate-all', authMiddleware, (req, res) => {
  try {
    const event = get('SELECT * FROM speed_skating_events WHERE id = ?', [req.params.eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const season = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [event.season_id]);
    const skaters = all('SELECT * FROM speed_skaters WHERE world_id = ?', [season.world_id]);

    // Create heats if needed
    let heats = JSON.parse(event.heats || '[]');
    if (heats.length === 0) {
      heats = createHeats(skaters, season);
    }

    // Simulate all heats
    for (const heat of heats) {
      for (const skaterEntry of heat.skaters) {
        if (skaterEntry.status === 'pending') {
          const skater = skaters.find(s => s.id === skaterEntry.skaterId);
          if (skater) {
            const time = simulateSkaterTime(skater, event.distance, event.altitude);
            skaterEntry.time = Math.round(time * 100) / 100;
            skaterEntry.status = 'finished';
          }
        }
      }
    }

    // Calculate final results
    const allResults = [];
    for (const h of heats) {
      for (const s of h.skaters) {
        if (s.time) {
          allResults.push({
            skaterId: s.skaterId,
            firstName: s.firstName,
            lastName: s.lastName,
            country: s.country,
            time: s.time,
            timeFormatted: formatTime(s.time)
          });
        }
      }
    }

    // Sort by time
    allResults.sort((a, b) => a.time - b.time);

    // Add positions and time behind
    const winnerTime = allResults[0]?.time || 0;
    allResults.forEach((result, idx) => {
      result.position = idx + 1;
      result.timeBehind = Math.round((result.time - winnerTime) * 100) / 100;
      result.timeBehindFormatted = result.timeBehind > 0 ? `+${formatTime(result.timeBehind)}` : '';
      result.wcPoints = idx < worldCupPoints.length ? worldCupPoints[idx] : 0;
    });

    // Update event
    run(`
      UPDATE speed_skating_events SET
        status = 'completed', heats = ?, results = ?
      WHERE id = ?
    `, [JSON.stringify(heats), JSON.stringify(allResults), event.id]);

    // Update standings
    updateStandings(season.id, event.distance, allResults);

    const updatedSeason = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [season.id]);
    const standings = JSON.parse(updatedSeason.standings || '[]');
    const disciplineStandings = JSON.parse(updatedSeason.discipline_standings || '{}');

    res.json({ heats, results: allResults, standings, disciplineStandings });
  } catch (error) {
    console.error('Error simulating event:', error);
    res.status(500).json({ error: 'Failed to simulate event' });
  }
});

// Update standings (helper function)
function updateStandings(seasonId, distance, results) {
  const season = get('SELECT * FROM speed_skating_seasons WHERE id = ?', [seasonId]);
  let standings = JSON.parse(season.standings || '[]');
  let disciplineStandings = JSON.parse(season.discipline_standings || '{}');

  // Initialize discipline standings if needed
  const distanceInfo = distances[distance];
  const category = distanceInfo?.category || 'all';

  if (!disciplineStandings[distance]) {
    disciplineStandings[distance] = [];
  }

  // Update overall standings
  for (const result of results) {
    // Overall standings
    let skaterStanding = standings.find(s => s.skaterId === result.skaterId);
    if (!skaterStanding) {
      skaterStanding = {
        skaterId: result.skaterId,
        firstName: result.firstName,
        lastName: result.lastName,
        country: result.country,
        points: 0,
        races: 0,
        wins: 0,
        podiums: 0
      };
      standings.push(skaterStanding);
    }
    skaterStanding.points += result.wcPoints;
    skaterStanding.races += 1;
    if (result.position === 1) skaterStanding.wins += 1;
    if (result.position <= 3) skaterStanding.podiums += 1;

    // Distance-specific standings
    let distanceStanding = disciplineStandings[distance].find(s => s.skaterId === result.skaterId);
    if (!distanceStanding) {
      distanceStanding = {
        skaterId: result.skaterId,
        firstName: result.firstName,
        lastName: result.lastName,
        country: result.country,
        points: 0,
        races: 0,
        wins: 0,
        bestTime: null
      };
      disciplineStandings[distance].push(distanceStanding);
    }
    distanceStanding.points += result.wcPoints;
    distanceStanding.races += 1;
    if (result.position === 1) distanceStanding.wins += 1;
    if (!distanceStanding.bestTime || result.time < distanceStanding.bestTime) {
      distanceStanding.bestTime = result.time;
    }
  }

  // Sort standings by points
  standings.sort((a, b) => b.points - a.points);
  disciplineStandings[distance].sort((a, b) => b.points - a.points);

  // Save
  run(`
    UPDATE speed_skating_seasons SET
      standings = ?, discipline_standings = ?
    WHERE id = ?
  `, [JSON.stringify(standings), JSON.stringify(disciplineStandings), seasonId]);
}

module.exports = router;
