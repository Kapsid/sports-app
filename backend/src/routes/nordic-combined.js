const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateNordicCombinedCalendar, worldCupPoints, getRandomNordicCombinedName } = require('../data/nordicCombinedCalendar');
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

// Simulate a single ski jump
function simulateJump(athlete, kPoint) {
  const hsRatio = 1.10;
  const hillSize = Math.round(kPoint * hsRatio);

  const jumpingSkill = athlete.skill_jumping || 70;
  const flightSkill = athlete.skill_flight || 70;
  const landingSkill = athlete.skill_landing || 70;
  const consistency = athlete.consistency || 70;
  const form = athlete.form || 70;

  const avgSkill = (jumpingSkill + flightSkill) / 2;
  const skillEffect = (avgSkill - 70) * 0.25;
  const formEffect = (form - 70) * 0.15;
  const windEffect = (Math.random() - 0.5) * 6;

  const baseVariance = 8;
  const consistencyMultiplier = 1.5 - (consistency / 100);
  const jumpVariance = baseVariance * consistencyMultiplier;
  const randomFactor = randomNormal(0, jumpVariance);

  let exceptionalFactor = 0;
  const exceptionalRoll = Math.random();
  if (exceptionalRoll < 0.05) {
    exceptionalFactor = 3 + Math.random() * 5;
  } else if (exceptionalRoll < 0.10) {
    exceptionalFactor = 2 + Math.random() * 2;
  } else if (exceptionalRoll > 0.95) {
    exceptionalFactor = -(5 + Math.random() * 7);
  } else if (exceptionalRoll > 0.90) {
    exceptionalFactor = -(2 + Math.random() * 3);
  }

  const baseDistance = kPoint - 2;
  let distance = baseDistance + skillEffect + formEffect + windEffect + randomFactor + exceptionalFactor;

  const minDistance = kPoint * 0.82;
  const maxDistance = hillSize + 8;
  distance = Math.max(minDistance, Math.min(maxDistance, distance));
  distance = Math.round(distance * 2) / 2;

  const pointsPerMeter = 1.8;
  const distancePoints = 60 + (distance - kPoint) * pointsPerMeter;

  const distancePenalty = Math.max(0, (distance - kPoint) * 0.05);
  const styleBase = (landingSkill + consistency) / 2 - distancePenalty;

  const fallChance = Math.max(0, (distance - hillSize) * 0.02) + (0.02 * (100 - landingSkill) / 100);
  const hasFall = Math.random() < fallChance;

  const styleScores = [];
  for (let i = 0; i < 5; i++) {
    let score = 17 + (styleBase - 70) / 15 + randomNormal(0, 0.8);
    if (hasFall) {
      score -= 5 + Math.random() * 2;
    } else if (exceptionalFactor < -3) {
      score -= 1 + Math.random() * 1.5;
    }
    score = Math.max(10, Math.min(20, score));
    styleScores.push(Math.round(score * 10) / 10);
  }
  styleScores.sort((a, b) => a - b);
  const stylePoints = styleScores[1] + styleScores[2] + styleScores[3];

  const totalPoints = Math.round((distancePoints + stylePoints) * 10) / 10;

  return {
    distance,
    distancePoints: Math.round(distancePoints * 10) / 10,
    styleScores,
    stylePoints: Math.round(stylePoints * 10) / 10,
    totalPoints,
    hillSize,
    hasFall
  };
}

// Simulate cross-country skiing time
function simulateSkiingTime(athlete, distanceKm, startGap = 0) {
  const skiingSkill = athlete.skill_skiing || 70;
  const endurance = athlete.skill_endurance || 70;
  const consistency = athlete.consistency || 70;
  const form = athlete.form || 70;

  // Base time per km (in seconds) - elite is around 2:40-3:00 per km for 10km
  const baseTimePerKm = 165; // seconds

  const skillEffect = (70 - skiingSkill) * 0.7;
  const enduranceEffect = (70 - endurance) * 0.3;
  const formEffect = (70 - form) * 0.2;

  const consistencyMultiplier = 1.5 - (consistency / 100);
  const randomVariation = randomNormal(0, 3 * consistencyMultiplier);

  const timePerKm = baseTimePerKm + skillEffect + enduranceEffect + formEffect + randomVariation;
  const skiingTime = Math.max(150, timePerKm) * distanceKm;

  return Math.round(skiingTime * 10) / 10;
}

// Convert jumping points to time gap (Gundersen method)
// In Nordic Combined: 1 point = typically 4 seconds (can vary)
function pointsToTimeGap(pointsDifference, pointsPerSecond = 4) {
  return pointsDifference / pointsPerSecond;
}

// Simulate complete Nordic Combined event (jump + XC)
function simulateEvent(athletes, kPoint, xcDistance, eventType) {
  // Phase 1: Ski Jumping
  const jumpResults = athletes.map(athlete => {
    const jump = simulateJump(athlete, kPoint);
    return {
      athleteId: athlete.id,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      country: athlete.country,
      jump
    };
  });

  // Sort by jump points (highest first)
  jumpResults.sort((a, b) => b.jump.totalPoints - a.jump.totalPoints);

  // Calculate time gaps based on jump points
  const leaderJumpPoints = jumpResults[0].jump.totalPoints;
  const jumpResultsWithGap = jumpResults.map((result, idx) => {
    const pointsDiff = leaderJumpPoints - result.jump.totalPoints;
    const timeGap = pointsToTimeGap(pointsDiff);
    return {
      ...result,
      jumpPosition: idx + 1,
      pointsBehind: Math.round(pointsDiff * 10) / 10,
      startGap: Math.round(timeGap * 10) / 10
    };
  });

  // Phase 2: Cross-Country Skiing
  // Each athlete's XC time is their actual skiing time
  // Final time = startGap + skiingTime
  const xcResults = jumpResultsWithGap.map(result => {
    const athlete = athletes.find(a => a.id === result.athleteId);
    const skiingTime = simulateSkiingTime(athlete, xcDistance, result.startGap);

    return {
      ...result,
      skiingTime,
      // For mass start, everyone starts together, jumping determines final bonus
      totalTime: eventType === 'mass_start'
        ? skiingTime - (result.jump.totalPoints - 100) * 0.5 // Bonus/penalty based on jump
        : result.startGap + skiingTime // Gundersen: start gap + skiing time
    };
  });

  // Sort by final time (lowest first for Gundersen, adjusted for mass start)
  xcResults.sort((a, b) => a.totalTime - b.totalTime);

  // Calculate final results with positions
  const leaderTime = xcResults[0].totalTime;
  const finalResults = xcResults.map((result, idx) => ({
    ...result,
    position: idx + 1,
    timeBehind: Math.round((result.totalTime - leaderTime) * 10) / 10,
    wcPoints: idx < 40 ? worldCupPoints[idx] : 0
  }));

  return {
    jumpResults: jumpResultsWithGap,
    xcResults: finalResults,
    finalResults
  };
}

// Format time as MM:SS.t
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

// ==================== ATHLETE ROUTES ====================

// Get all athletes for a world
router.get('/world/:worldId/athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const athletes = all('SELECT * FROM nc_athletes WHERE world_id = ? ORDER BY last_name, first_name', [worldId]);
    res.json(athletes);
  } catch (error) {
    console.error('Error fetching NC athletes:', error);
    res.status(500).json({ error: 'Failed to fetch athletes' });
  }
});

// Create a new athlete
router.post('/world/:worldId/athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { firstName, lastName, country, skillJumping, skillFlight, skillLanding, skillSkiing, skillEndurance, consistency, form, teamId } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const athleteId = uuidv4();
    run(`
      INSERT INTO nc_athletes (id, world_id, first_name, last_name, country, skill_jumping, skill_flight, skill_landing, skill_skiing, skill_endurance, consistency, form, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [athleteId, worldId, firstName, lastName, country, skillJumping || 70, skillFlight || 70, skillLanding || 70, skillSkiing || 70, skillEndurance || 70, consistency || 70, form || 70, teamId || null]);

    const athlete = get('SELECT * FROM nc_athletes WHERE id = ?', [athleteId]);
    res.status(201).json(athlete);
  } catch (error) {
    console.error('Error creating NC athlete:', error);
    res.status(500).json({ error: 'Failed to create athlete' });
  }
});

// Update an athlete
router.put('/athletes/:athleteId', authMiddleware, (req, res) => {
  try {
    const { athleteId } = req.params;
    const { firstName, lastName, country, skillJumping, skillFlight, skillLanding, skillSkiing, skillEndurance, consistency, form, teamId } = req.body;

    const athlete = get(`
      SELECT a.*, w.user_id
      FROM nc_athletes a
      INNER JOIN worlds w ON a.world_id = w.id
      WHERE a.id = ? AND w.user_id = ?
    `, [athleteId, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run(`
      UPDATE nc_athletes
      SET first_name = ?, last_name = ?, country = ?, skill_jumping = ?, skill_flight = ?, skill_landing = ?,
          skill_skiing = ?, skill_endurance = ?, consistency = ?, form = ?, team_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      firstName || athlete.first_name,
      lastName || athlete.last_name,
      country || athlete.country,
      skillJumping !== undefined ? skillJumping : athlete.skill_jumping,
      skillFlight !== undefined ? skillFlight : athlete.skill_flight,
      skillLanding !== undefined ? skillLanding : athlete.skill_landing,
      skillSkiing !== undefined ? skillSkiing : athlete.skill_skiing,
      skillEndurance !== undefined ? skillEndurance : athlete.skill_endurance,
      consistency !== undefined ? consistency : athlete.consistency,
      form !== undefined ? form : athlete.form,
      teamId !== undefined ? teamId : athlete.team_id,
      athleteId
    ]);

    const updatedAthlete = get('SELECT * FROM nc_athletes WHERE id = ?', [athleteId]);
    res.json(updatedAthlete);
  } catch (error) {
    console.error('Error updating NC athlete:', error);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

// Delete an athlete
router.delete('/athletes/:athleteId', authMiddleware, (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = get(`
      SELECT a.*, w.user_id
      FROM nc_athletes a
      INNER JOIN worlds w ON a.world_id = w.id
      WHERE a.id = ? AND w.user_id = ?
    `, [athleteId, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run('DELETE FROM nc_athletes WHERE id = ?', [athleteId]);
    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    console.error('Error deleting NC athlete:', error);
    res.status(500).json({ error: 'Failed to delete athlete' });
  }
});

// Generate random athletes
router.post('/world/:worldId/generate-athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { count = 30 } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Countries strong in Nordic Combined (IOC codes)
    const ncCountries = ['NOR', 'GER', 'AUT', 'JPN', 'FIN', 'FRA', 'USA', 'EST', 'ITA', 'POL', 'CZE', 'SLO'];
    const generatedAthletes = [];

    for (let i = 0; i < count; i++) {
      const { firstName, lastName } = getRandomNordicCombinedName();
      const country = ncCountries[Math.floor(Math.random() * ncCountries.length)];

      // Randomize skills with some variation
      const baseSkill = 60 + Math.floor(Math.random() * 30);
      const skillJumping = Math.max(50, Math.min(99, baseSkill + Math.floor(Math.random() * 20) - 10));
      const skillFlight = Math.max(50, Math.min(99, baseSkill + Math.floor(Math.random() * 20) - 10));
      const skillLanding = Math.max(50, Math.min(99, baseSkill + Math.floor(Math.random() * 20) - 10));
      const skillSkiing = Math.max(50, Math.min(99, baseSkill + Math.floor(Math.random() * 20) - 10));
      const skillEndurance = Math.max(50, Math.min(99, baseSkill + Math.floor(Math.random() * 20) - 10));
      const consistency = Math.max(50, Math.min(99, 65 + Math.floor(Math.random() * 25)));
      const form = Math.max(50, Math.min(99, 60 + Math.floor(Math.random() * 30)));

      const athleteId = uuidv4();
      run(`
        INSERT INTO nc_athletes (id, world_id, first_name, last_name, country, skill_jumping, skill_flight, skill_landing, skill_skiing, skill_endurance, consistency, form)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [athleteId, worldId, firstName, lastName, country, skillJumping, skillFlight, skillLanding, skillSkiing, skillEndurance, consistency, form]);

      generatedAthletes.push({
        id: athleteId,
        first_name: firstName,
        last_name: lastName,
        country,
        skill_jumping: skillJumping,
        skill_flight: skillFlight,
        skill_landing: skillLanding,
        skill_skiing: skillSkiing,
        skill_endurance: skillEndurance,
        consistency,
        form
      });
    }

    res.status(201).json({ message: `Generated ${count} athletes`, athletes: generatedAthletes });
  } catch (error) {
    console.error('Error generating NC athletes:', error);
    res.status(500).json({ error: 'Failed to generate athletes' });
  }
});

// ==================== SEASON ROUTES ====================

// Get current season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM nc_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC
      LIMIT 1
    `, [worldId]);

    if (!season) {
      return res.json(null);
    }

    const events = all('SELECT * FROM nc_events WHERE season_id = ? ORDER BY event_index', [season.id]);

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    res.json({
      ...season,
      standings,
      events
    });
  } catch (error) {
    console.error('Error fetching NC season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create a new season
router.post('/world/:worldId/seasons', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { yearStart, yearEnd } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check for existing active season
    const existingSeason = get(`
      SELECT * FROM nc_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [worldId]);

    if (existingSeason) {
      return res.status(400).json({ error: 'An active season already exists. Complete or delete it first.' });
    }

    const seasonId = uuidv4();
    const seasonName = `${yearStart}/${yearEnd} World Cup`;

    run(`
      INSERT INTO nc_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'not_started')
    `, [seasonId, worldId, seasonName, yearStart, yearEnd]);

    // Generate calendar
    const calendar = generateNordicCombinedCalendar(yearStart, yearEnd);

    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO nc_events (id, season_id, event_index, name, location, country, hill_size, k_point, xc_distance, date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      `, [eventId, seasonId, event.event_index, event.name, event.location, event.country, event.hill_size, event.k_point, event.xc_distance, event.date]);
    }

    const season = get('SELECT * FROM nc_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM nc_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.status(201).json({ ...season, events });
  } catch (error) {
    console.error('Error creating NC season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Delete a season
router.delete('/seasons/:seasonId', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM nc_seasons s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [seasonId, req.user.id]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    run('DELETE FROM nc_events WHERE season_id = ?', [seasonId]);
    run('DELETE FROM nc_seasons WHERE id = ?', [seasonId]);

    res.json({ message: 'Season deleted successfully' });
  } catch (error) {
    console.error('Error deleting NC season:', error);
    res.status(500).json({ error: 'Failed to delete season' });
  }
});

// ==================== EVENT ROUTES ====================

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM nc_events e
      INNER JOIN nc_seasons s ON e.season_id = s.id
      WHERE e.id = ?
    `, [eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let jumpResults = [];
    let xcResults = [];
    let finalResults = [];
    try {
      jumpResults = JSON.parse(event.jump_results || '[]');
      xcResults = JSON.parse(event.xc_results || '[]');
      finalResults = JSON.parse(event.final_results || '[]');
    } catch (e) {}

    res.json({
      ...event,
      jumpResults,
      xcResults,
      finalResults
    });
  } catch (error) {
    console.error('Error fetching NC event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Simulate an event
router.post('/event/:eventId/simulate', authMiddleware, validateWeekLock('nc_events', 'nc_seasons'), (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM nc_events e
      INNER JOIN nc_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Event already completed' });
    }

    // Get all athletes
    const athletes = all('SELECT * FROM nc_athletes WHERE world_id = ?', [event.world_id]);

    if (athletes.length < 5) {
      return res.status(400).json({ error: 'Need at least 5 athletes to run an event' });
    }

    // Determine event type from name
    let eventType = 'individual_large';
    if (event.name.includes('Compact')) eventType = 'compact';
    else if (event.name.includes('Mass Start')) eventType = 'mass_start';
    else if (event.name.includes('NH')) eventType = 'individual_normal';

    // Simulate the event
    const results = simulateEvent(athletes, event.k_point, event.xc_distance, eventType);

    // Update event with results
    run(`
      UPDATE nc_events
      SET status = 'completed',
          jump_results = ?,
          xc_results = ?,
          final_results = ?
      WHERE id = ?
    `, [
      JSON.stringify(results.jumpResults),
      JSON.stringify(results.xcResults),
      JSON.stringify(results.finalResults),
      eventId
    ]);

    // Update season standings
    const season = get('SELECT * FROM nc_seasons WHERE id = ?', [event.season_id]);
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

    for (const result of results.finalResults) {
      if (result.position <= 40) {
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

        current.points += result.wcPoints;
        current.races++;
        if (result.position === 1) current.wins++;
        if (result.position <= 3) current.podiums++;

        standingsMap.set(result.athleteId, current);
      }
    }

    const updatedStandings = Array.from(standingsMap.values())
      .sort((a, b) => b.points - a.points);

    // Update season
    run(`
      UPDATE nc_seasons
      SET standings = ?,
          status = 'in_progress',
          current_event_index = current_event_index + 1
      WHERE id = ?
    `, [JSON.stringify(updatedStandings), event.season_id]);

    // Check if season is complete
    const remainingEvents = get(`
      SELECT COUNT(*) as count FROM nc_events
      WHERE season_id = ? AND status = 'scheduled'
    `, [event.season_id]);

    if (remainingEvents.count === 0) {
      run(`UPDATE nc_seasons SET status = 'completed' WHERE id = ?`, [event.season_id]);
    }

    res.json({
      event: {
        ...event,
        status: 'completed'
      },
      results,
      standings: updatedStandings
    });
  } catch (error) {
    console.error('Error simulating NC event:', error);
    res.status(500).json({ error: 'Failed to simulate event' });
  }
});

module.exports = router;
