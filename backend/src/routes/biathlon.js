const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateBiathlonCalendar, worldCupPoints, getRandomBiathlonName, raceTypes } = require('../data/biathlonCalendar');
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

// Simulate skiing time for a segment
function simulateSkiingTime(athlete, distanceKm, isUphill = false) {
  const skiingSkill = athlete.skill_skiing || 70;
  const endurance = athlete.skill_endurance || 70;
  const consistency = athlete.consistency || 70;
  const form = athlete.form || 70;

  // Base time per km (in seconds) - elite is around 2:30-3:00 per km
  const baseTimePerKm = 170; // seconds

  // Skill effect: better skiers are faster
  const skillEffect = (70 - skiingSkill) * 0.8; // seconds per km

  // Endurance effect: important for longer races
  const enduranceEffect = (70 - endurance) * 0.3;

  // Form effect
  const formEffect = (70 - form) * 0.2;

  // Random variation based on consistency
  const consistencyMultiplier = 1.5 - (consistency / 100);
  const randomVariation = randomNormal(0, 3 * consistencyMultiplier);

  // Uphill penalty
  const uphillFactor = isUphill ? 1.15 : 1.0;

  const timePerKm = (baseTimePerKm + skillEffect + enduranceEffect + formEffect + randomVariation) * uphillFactor;

  return Math.max(140, timePerKm * distanceKm); // minimum 2:20/km pace
}

// Simulate a shooting stage
function simulateShooting(athlete, position, targets = 5) {
  const shootingSkill = position === 'prone'
    ? (athlete.skill_shooting_prone || 70)
    : (athlete.skill_shooting_standing || 70);
  const consistency = athlete.consistency || 70;
  const form = athlete.form || 70;

  // Standing is harder than prone
  const positionDifficulty = position === 'standing' ? 0.85 : 1.0;

  // Calculate hit probability per shot
  const baseHitRate = 0.70; // 70% base
  const skillBonus = (shootingSkill - 70) * 0.008; // +0.8% per skill point above 70
  const formBonus = (form - 70) * 0.003;
  const hitProbability = Math.min(0.98, (baseHitRate + skillBonus + formBonus) * positionDifficulty);

  // Simulate each shot
  const shots = [];
  let hits = 0;
  let misses = 0;

  for (let i = 0; i < targets; i++) {
    // Add some consistency-based variation per shot
    const shotVariation = (Math.random() - 0.5) * (1 - consistency / 100) * 0.15;
    const adjustedProbability = Math.max(0.3, Math.min(0.98, hitProbability + shotVariation));

    const isHit = Math.random() < adjustedProbability;
    shots.push(isHit ? 1 : 0);
    if (isHit) hits++;
    else misses++;
  }

  // Shooting time (faster shooters spend less time)
  const baseShootingTime = position === 'prone' ? 25 : 30; // seconds
  const shootingTimeSkillBonus = (shootingSkill - 70) * 0.15;
  const shootingTime = Math.max(15, baseShootingTime - shootingTimeSkillBonus + randomNormal(0, 2));

  return {
    position,
    shots,
    hits,
    misses,
    shootingTime: Math.round(shootingTime * 10) / 10
  };
}

// Simulate a complete biathlon race for one athlete
function simulateRace(athlete, raceType, raceConfig) {
  const config = raceTypes[raceType];
  const totalDistance = config.distance;
  const shootingSequence = config.shootingSequence;
  const penaltyType = config.penaltyType;

  // Split race into segments between shootings
  const numSegments = shootingSequence.length + 1;
  const segmentDistance = totalDistance / numSegments;

  let totalTime = 0;
  let totalPenaltyTime = 0;
  let totalMisses = 0;
  const shootingResults = [];
  const segmentTimes = [];

  // Simulate each segment and shooting
  for (let i = 0; i < numSegments; i++) {
    // Skiing segment
    const isLaterSegment = i > numSegments / 2;
    const fatigueEffect = isLaterSegment ? 1.03 : 1.0; // slight fatigue in later segments
    const skiTime = simulateSkiingTime(athlete, segmentDistance) * fatigueEffect;
    segmentTimes.push(Math.round(skiTime * 10) / 10);
    totalTime += skiTime;

    // Shooting (if not the last segment)
    if (i < shootingSequence.length) {
      const shootingResult = simulateShooting(athlete, shootingSequence[i]);
      shootingResults.push(shootingResult);
      totalTime += shootingResult.shootingTime;
      totalMisses += shootingResult.misses;

      // Apply penalty
      if (penaltyType === 'loop') {
        // 150m penalty loop, roughly 23-25 seconds per loop
        const penaltyPerMiss = 23 + randomNormal(0, 1);
        totalPenaltyTime += shootingResult.misses * penaltyPerMiss;
      } else if (penaltyType === 'time') {
        // 1 minute per miss (Individual race)
        totalPenaltyTime += shootingResult.misses * 60;
      }
    }
  }

  totalTime += totalPenaltyTime;

  // Calculate total hits
  const totalShots = shootingResults.reduce((sum, s) => sum + s.shots.length, 0);
  const totalHits = shootingResults.reduce((sum, s) => sum + s.hits, 0);

  return {
    athleteId: athlete.id,
    firstName: athlete.first_name,
    lastName: athlete.last_name,
    country: athlete.country,
    totalTime: Math.round(totalTime * 10) / 10,
    skiingTime: Math.round((totalTime - totalPenaltyTime - shootingResults.reduce((s, r) => s + r.shootingTime, 0)) * 10) / 10,
    penaltyTime: Math.round(totalPenaltyTime * 10) / 10,
    shootingResults,
    totalShots,
    totalHits,
    totalMisses,
    shootingPercentage: Math.round((totalHits / totalShots) * 1000) / 10,
    segmentTimes
  };
}

// Format time as MM:SS.t
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

// Update discipline standings after a race
function updateDisciplineStandings(seasonId, raceType, results) {
  const disciplineColumn = `${raceType}_standings`;

  // Get current standings
  const season = get('SELECT * FROM biathlon_seasons WHERE id = ?', [seasonId]);
  if (!season) return;

  let currentStandings = [];
  try {
    currentStandings = JSON.parse(season[disciplineColumn] || '[]');
  } catch (e) {
    currentStandings = [];
  }

  // Create standings map
  const standingsMap = new Map();
  for (const s of currentStandings) {
    standingsMap.set(s.athleteId, { ...s });
  }

  // Add points from this race
  for (const result of results) {
    if (result.position <= 40) {
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

  // Sort and save
  const standings = Array.from(standingsMap.values())
    .sort((a, b) => b.points - a.points);

  run(`UPDATE biathlon_seasons SET ${disciplineColumn} = ? WHERE id = ?`, [JSON.stringify(standings), seasonId]);

  return standings;
}

// ==================== ROUTES ====================

// Get all biathletes for a world
router.get('/world/:worldId/athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const athletes = all('SELECT * FROM biathletes WHERE world_id = ? ORDER BY last_name, first_name', [worldId]);

    res.json({ athletes, countryNames: allCountries });
  } catch (error) {
    console.error('Error fetching biathletes:', error);
    res.status(500).json({ error: 'Failed to fetch athletes' });
  }
});

// Generate biathletes for a world
router.post('/world/:worldId/generate-athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check if athletes already exist
    const existingAthletes = get('SELECT COUNT(*) as count FROM biathletes WHERE world_id = ?', [worldId]);
    if (existingAthletes.count > 0) {
      return res.status(400).json({ error: 'Athletes already exist for this world' });
    }

    // Generate athletes from top biathlon nations
    const nations = [
      { country: 'NOR', count: 8 },
      { country: 'FRA', count: 7 },
      { country: 'GER', count: 6 },
      { country: 'SWE', count: 5 },
      { country: 'ITA', count: 4 },
      { country: 'AUT', count: 4 },
      { country: 'SLO', count: 3 },
      { country: 'CZE', count: 3 },
      { country: 'SUI', count: 3 },
      { country: 'FIN', count: 3 },
      { country: 'USA', count: 3 },
      { country: 'CAN', count: 2 },
      { country: 'UKR', count: 3 },
      { country: 'BLR', count: 2 },
      { country: 'POL', count: 2 },
      { country: 'EST', count: 2 },
      { country: 'BUL', count: 2 },
    ];

    const athletes = [];

    for (const nation of nations) {
      for (let i = 0; i < nation.count; i++) {
        const { firstName, lastName } = getRandomBiathlonName(nation.country);

        // Generate random skills with some correlation
        const baseSkill = 60 + Math.floor(Math.random() * 30); // 60-90
        const variance = () => Math.floor((Math.random() - 0.5) * 20);

        const athlete = {
          id: uuidv4(),
          world_id: worldId,
          first_name: firstName,
          last_name: lastName,
          country: nation.country,
          skill_skiing: Math.min(99, Math.max(50, baseSkill + variance())),
          skill_shooting_prone: Math.min(99, Math.max(50, baseSkill + variance())),
          skill_shooting_standing: Math.min(99, Math.max(50, baseSkill + variance() - 5)), // Standing is harder
          skill_endurance: Math.min(99, Math.max(50, baseSkill + variance())),
          consistency: Math.min(99, Math.max(50, 65 + Math.floor(Math.random() * 25))),
          form: Math.min(99, Math.max(50, 60 + Math.floor(Math.random() * 30)))
        };

        run(`
          INSERT INTO biathletes (id, world_id, first_name, last_name, country, skill_skiing, skill_shooting_prone, skill_shooting_standing, skill_endurance, consistency, form)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [athlete.id, athlete.world_id, athlete.first_name, athlete.last_name, athlete.country,
            athlete.skill_skiing, athlete.skill_shooting_prone, athlete.skill_shooting_standing,
            athlete.skill_endurance, athlete.consistency, athlete.form]);

        athletes.push(athlete);
      }
    }

    res.json({ message: 'Athletes generated', athletes, countryNames: allCountries });
  } catch (error) {
    console.error('Error generating biathletes:', error);
    res.status(500).json({ error: 'Failed to generate athletes' });
  }
});

// Create a new athlete
router.post('/world/:worldId/athlete', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { first_name, last_name, country, skill_skiing, skill_shooting_prone, skill_shooting_standing, skill_endurance, consistency, form, team_id } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const id = uuidv4();
    run(`
      INSERT INTO biathletes (id, world_id, first_name, last_name, country, skill_skiing, skill_shooting_prone, skill_shooting_standing, skill_endurance, consistency, form, team_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, worldId, first_name, last_name, country, skill_skiing || 70, skill_shooting_prone || 70, skill_shooting_standing || 70, skill_endurance || 70, consistency || 70, form || 70, team_id || null]);

    const athlete = get('SELECT * FROM biathletes WHERE id = ?', [id]);
    res.json({ athlete, countryNames: allCountries });
  } catch (error) {
    console.error('Error creating athlete:', error);
    res.status(500).json({ error: 'Failed to create athlete' });
  }
});

// Update an athlete
router.put('/athlete/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, country, skill_skiing, skill_shooting_prone, skill_shooting_standing, skill_endurance, consistency, form, team_id } = req.body;

    // Verify athlete belongs to user's world
    const athlete = get(`
      SELECT b.* FROM biathletes b
      INNER JOIN worlds w ON b.world_id = w.id
      WHERE b.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run(`
      UPDATE biathletes SET
        first_name = ?, last_name = ?, country = ?,
        skill_skiing = ?, skill_shooting_prone = ?, skill_shooting_standing = ?,
        skill_endurance = ?, consistency = ?, form = ?,
        team_id = ?
      WHERE id = ?
    `, [first_name, last_name, country, skill_skiing, skill_shooting_prone, skill_shooting_standing, skill_endurance, consistency, form, team_id !== undefined ? (team_id || null) : athlete.team_id, id]);

    const updatedAthlete = get('SELECT * FROM biathletes WHERE id = ?', [id]);
    res.json({ athlete: updatedAthlete, countryNames: allCountries });
  } catch (error) {
    console.error('Error updating athlete:', error);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

// Delete an athlete
router.delete('/athlete/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Verify athlete belongs to user's world
    const athlete = get(`
      SELECT b.* FROM biathletes b
      INNER JOIN worlds w ON b.world_id = w.id
      WHERE b.id = ? AND w.user_id = ?
    `, [id, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run('DELETE FROM biathletes WHERE id = ?', [id]);
    res.json({ message: 'Athlete deleted' });
  } catch (error) {
    console.error('Error deleting athlete:', error);
    res.status(500).json({ error: 'Failed to delete athlete' });
  }
});

// Delete all athletes for a world
router.delete('/world/:worldId/all-athletes', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM biathletes WHERE world_id = ?', [worldId]);
    res.json({ message: 'All athletes deleted' });
  } catch (error) {
    console.error('Error deleting all athletes:', error);
    res.status(500).json({ error: 'Failed to delete athletes' });
  }
});

// Get current biathlon season for a world
router.get('/world/:worldId/current-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM biathlon_seasons
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
      'SELECT * FROM biathlon_events WHERE season_id = ? ORDER BY event_index',
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
      sprint: JSON.parse(season.sprint_standings || '[]'),
      pursuit: JSON.parse(season.pursuit_standings || '[]'),
      individual: JSON.parse(season.individual_standings || '[]'),
      mass_start: JSON.parse(season.mass_start_standings || '[]')
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
    console.error('Error fetching biathlon season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new biathlon season
router.post('/world/:worldId/create-season', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check for active season
    const activeSeason = get(`
      SELECT * FROM biathlon_seasons
      WHERE world_id = ? AND status != 'completed'
    `, [worldId]);

    if (activeSeason) {
      return res.status(400).json({ error: 'An active season already exists' });
    }

    // Get last completed season to determine next year
    const lastSeason = get(`
      SELECT * FROM biathlon_seasons
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
      INSERT INTO biathlon_seasons (id, world_id, name, year_start, year_end, status)
      VALUES (?, ?, ?, ?, ?, 'not_started')
    `, [seasonId, worldId, seasonName, startYear, endYear]);

    // Generate calendar
    const calendar = generateBiathlonCalendar(startYear);

    // Insert events
    for (const event of calendar) {
      const eventId = uuidv4();
      run(`
        INSERT INTO biathlon_events (id, season_id, event_index, name, location, country, race_type, distance, shootings, date, status, championship)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country,
          event.raceType, event.distance, event.shootings, event.date, event.championship ? 1 : 0]);
    }

    const season = get('SELECT * FROM biathlon_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM biathlon_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season created',
      season,
      events: events.map(e => ({ ...e, results: {} })),
      standings: [],
      disciplineStandings: { sprint: [], pursuit: [], individual: [], mass_start: [] }
    });
  } catch (error) {
    console.error('Error creating biathlon season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Get event details
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM biathlon_events e
      INNER JOIN biathlon_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const athletes = all('SELECT * FROM biathletes WHERE world_id = ? ORDER BY last_name', [event.world_id]);

    res.json({
      event: {
        ...event,
        results: JSON.parse(event.results || '{}')
      },
      athletes,
      countryNames: allCountries
    });
  } catch (error) {
    console.error('Error fetching biathlon event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Simulate a race
router.post('/event/:eventId/simulate', authMiddleware, validateWeekLock('biathlon_events', 'biathlon_seasons'), (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id
      FROM biathlon_events e
      INNER JOIN biathlon_seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Race already completed' });
    }

    // Get all athletes
    const athletes = all('SELECT * FROM biathletes WHERE world_id = ?', [event.world_id]);

    if (athletes.length === 0) {
      return res.status(400).json({ error: 'No athletes available' });
    }

    const raceType = event.race_type;
    const raceConfig = raceTypes[raceType];

    // For pursuit, we need previous sprint results
    let startOrder = athletes;
    if (raceType === 'pursuit') {
      // Get the previous sprint race results from this venue
      const previousSprint = get(`
        SELECT results FROM biathlon_events
        WHERE season_id = ? AND race_type = 'sprint' AND location = ? AND status = 'completed'
        ORDER BY event_index DESC
        LIMIT 1
      `, [event.season_id, event.location]);

      if (previousSprint) {
        const sprintResults = JSON.parse(previousSprint.results || '{}');
        if (sprintResults.final && sprintResults.final.length > 0) {
          // Top 60 from sprint qualify for pursuit
          const qualifiedIds = sprintResults.final.slice(0, 60).map(r => r.athleteId);
          startOrder = athletes.filter(a => qualifiedIds.includes(a.id));
        }
      }
    }

    // For mass start, only top 30 in overall standings
    if (raceType === 'mass_start') {
      const season = get('SELECT standings FROM biathlon_seasons WHERE id = ?', [event.season_id]);
      if (season) {
        const standings = JSON.parse(season.standings || '[]');
        if (standings.length >= 30) {
          const top30Ids = standings.slice(0, 30).map(s => s.athleteId);
          startOrder = athletes.filter(a => top30Ids.includes(a.id));
        }
      }
    }

    // Simulate race for each athlete
    const raceResults = startOrder.map(athlete => simulateRace(athlete, raceType, raceConfig));

    // Sort by total time
    raceResults.sort((a, b) => a.totalTime - b.totalTime);

    // Assign positions and calculate time behind leader
    const leaderTime = raceResults[0]?.totalTime || 0;
    raceResults.forEach((result, index) => {
      result.position = index + 1;
      result.timeBehind = index === 0 ? 0 : Math.round((result.totalTime - leaderTime) * 10) / 10;
      result.timeFormatted = formatTime(result.totalTime);
      result.timeBehindFormatted = index === 0 ? '' : `+${formatTime(result.timeBehind)}`;
    });

    // Save results
    const results = {
      status: 'completed',
      raceType,
      final: raceResults
    };

    run('UPDATE biathlon_events SET status = ?, results = ? WHERE id = ?',
      ['completed', JSON.stringify(results), eventId]);

    // Update overall standings
    const season = get('SELECT * FROM biathlon_seasons WHERE id = ?', [event.season_id]);
    let overallStandings = [];
    try {
      overallStandings = JSON.parse(season.standings || '[]');
    } catch (e) {
      overallStandings = [];
    }

    const standingsMap = new Map();
    for (const s of overallStandings) {
      standingsMap.set(s.athleteId, { ...s });
    }

    // Add WC points
    for (const result of raceResults) {
      if (result.position <= 40) {
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

    overallStandings = Array.from(standingsMap.values())
      .sort((a, b) => b.points - a.points);

    run('UPDATE biathlon_seasons SET standings = ?, status = ? WHERE id = ?',
      [JSON.stringify(overallStandings), 'in_progress', event.season_id]);

    // Update discipline standings
    let disciplineStandings = null;
    if (['sprint', 'pursuit', 'individual', 'mass_start'].includes(raceType)) {
      disciplineStandings = updateDisciplineStandings(event.season_id, raceType, raceResults);
    }

    res.json({
      message: 'Race simulated',
      results,
      standings: overallStandings,
      disciplineStandings: disciplineStandings ? { [raceType]: disciplineStandings } : null
    });
  } catch (error) {
    console.error('Error simulating biathlon race:', error);
    res.status(500).json({ error: 'Failed to simulate race' });
  }
});

// Reset season
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM biathlon_seasons s
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
      UPDATE biathlon_seasons
      SET standings = '[]', sprint_standings = '[]', pursuit_standings = '[]',
          individual_standings = '[]', mass_start_standings = '[]', status = 'not_started'
      WHERE id = ?
    `, [seasonId]);

    // Reset all events
    run('UPDATE biathlon_events SET status = ?, results = ? WHERE season_id = ?',
      ['scheduled', '{}', seasonId]);

    const updatedSeason = get('SELECT * FROM biathlon_seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM biathlon_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season reset successfully',
      season: updatedSeason,
      events: events.map(e => ({ ...e, results: {} })),
      standings: [],
      disciplineStandings: { sprint: [], pursuit: [], individual: [], mass_start: [] }
    });
  } catch (error) {
    console.error('Error resetting biathlon season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

module.exports = router;
