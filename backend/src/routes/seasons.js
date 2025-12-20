const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validateWeekLock } = require('../middleware/weekLock');
const { generateSeasonCalendar, worldCupPoints } = require('../data/skiJumpingCalendar');
const { countryNames } = require('../data/skiJumpingNames');

const router = express.Router();

// ==================== SIMULATION LOGIC ====================

// Generate a random number with approximate normal distribution (Box-Muller)
function randomNormal(mean = 0, stdDev = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Simulate a single jump for a jumper
function simulateJump(jumper, kPoint, isSkiFlying = false) {
  // Calculate Hill Size (HS) - typically K-point + 10% for large hills
  const hsRatio = isSkiFlying ? 1.08 : 1.10;
  const hillSize = Math.round(kPoint * hsRatio);

  // Skill factors (0-100 scale, 70 is average)
  const jumpingSkill = jumper.skill_jumping || 70;
  const flightSkill = jumper.skill_flight || 70;
  const landingSkill = jumper.skill_landing || 70;
  const consistency = jumper.consistency || 70;
  const form = jumper.form || 70;

  // Average skill determines base performance
  const avgSkill = (jumpingSkill + flightSkill) / 2;

  // Skill effect: top jumpers (skill 90+) jump ~5-8m beyond K, average at K, weak below
  const skillEffect = (avgSkill - 70) * 0.25;

  // Form effect: current form affects performance (-5 to +5 meters)
  const formEffect = (form - 70) * 0.15;

  // Wind/conditions - random factor for this jump (-3 to +3 meters effect)
  const windEffect = (Math.random() - 0.5) * 6;

  // Main randomness - normal distribution with consistency affecting spread
  // Low consistency = more variance, high consistency = more predictable
  const baseVariance = isSkiFlying ? 12 : 8;
  const consistencyMultiplier = 1.5 - (consistency / 100);  // 0.5 to 1.5
  const jumpVariance = baseVariance * consistencyMultiplier;
  const randomFactor = randomNormal(0, jumpVariance);

  // Occasional exceptional or poor jumps (10% chance each)
  let exceptionalFactor = 0;
  const exceptionalRoll = Math.random();
  if (exceptionalRoll < 0.05) {
    // Excellent jump - extra 3-8 meters
    exceptionalFactor = 3 + Math.random() * 5;
  } else if (exceptionalRoll < 0.10) {
    // Great jump - extra 2-4 meters
    exceptionalFactor = 2 + Math.random() * 2;
  } else if (exceptionalRoll > 0.95) {
    // Poor jump - lose 5-12 meters
    exceptionalFactor = -(5 + Math.random() * 7);
  } else if (exceptionalRoll > 0.90) {
    // Below average jump - lose 2-5 meters
    exceptionalFactor = -(2 + Math.random() * 3);
  }

  // Base distance starts slightly below K-point, world class jumpers reach HS
  const baseDistance = kPoint - 2;

  // Calculate final distance
  let distance = baseDistance + skillEffect + formEffect + windEffect + randomFactor + exceptionalFactor;

  // Ensure reasonable bounds - can't go too far beyond HS or too short
  const minDistance = kPoint * 0.82;  // ~98m on K120
  const maxDistance = hillSize + 8;    // Can exceed HS by up to 8m (rare hill records)
  distance = Math.max(minDistance, Math.min(maxDistance, distance));
  distance = Math.round(distance * 2) / 2;  // Round to 0.5m

  // Calculate distance points (FIS rules: 60 points at K-point)
  const pointsPerMeter = isSkiFlying ? 1.2 : 1.8;
  const distancePoints = 60 + (distance - kPoint) * pointsPerMeter;

  // Style points (5 judges, each gives 0-20, drop highest and lowest)
  // Landing skill and distance affect style - longer jumps are harder to land
  const distancePenalty = Math.max(0, (distance - kPoint) * 0.05);  // Harder to land far jumps
  const styleBase = (landingSkill + consistency) / 2 - distancePenalty;

  // Check for fall (rare, more likely on long jumps or low landing skill)
  const fallChance = Math.max(0, (distance - hillSize) * 0.02) + (0.02 * (100 - landingSkill) / 100);
  const hasFall = Math.random() < fallChance;

  const styleScores = [];
  for (let i = 0; i < 5; i++) {
    // Base style around 17-18 for good jumpers
    let score = 17 + (styleBase - 70) / 15 + randomNormal(0, 0.8);

    // Deductions for falls or telemark issues
    if (hasFall) {
      score -= 5 + Math.random() * 2;
    } else if (exceptionalFactor < -3) {
      // Poor jump often means poor landing too
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

// Update Four Hills Tournament standings after a Four Hills event completes
function updateFourHillsStandings(seasonId, eventResults) {
  // Get all completed Four Hills events for this season
  const fourHillsEvents = all(`
    SELECT id, results FROM season_events
    WHERE season_id = ? AND tournament = 'Four Hills' AND status = 'completed'
  `, [seasonId]);

  if (fourHillsEvents.length === 0) return [];

  // Aggregate total jump points for each jumper across all Four Hills events
  const jumperTotals = new Map();

  for (const event of fourHillsEvents) {
    let results;
    try {
      results = JSON.parse(event.results || '{}');
    } catch (e) {
      continue;
    }

    // Sum points from round 1
    if (results.round1) {
      for (const entry of results.round1) {
        if (!entry.jump) continue;
        const current = jumperTotals.get(entry.jumperId) || {
          jumperId: entry.jumperId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          country: entry.country,
          totalPoints: 0,
          events: 0,
          jumps: []
        };
        current.totalPoints += entry.totalPoints || 0;
        current.jumps.push({ event: event.id, round: 1, points: entry.totalPoints || 0 });
        jumperTotals.set(entry.jumperId, current);
      }
    }

    // Sum points from round 2
    if (results.round2) {
      for (const entry of results.round2) {
        if (!entry.jump) continue;
        const current = jumperTotals.get(entry.jumperId) || {
          jumperId: entry.jumperId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          country: entry.country,
          totalPoints: 0,
          events: 0,
          jumps: []
        };
        // For round 2, totalPoints includes round 1 points, so we add only the round 2 jump points
        const round2JumpPoints = entry.jump?.totalPoints || 0;
        current.totalPoints += round2JumpPoints;
        current.jumps.push({ event: event.id, round: 2, points: round2JumpPoints });
        jumperTotals.set(entry.jumperId, current);
      }
    }
  }

  // Count events per jumper
  for (const [jumperId, data] of jumperTotals) {
    const eventIds = new Set(data.jumps.map(j => j.event));
    data.events = eventIds.size;
  }

  // Sort by total points descending
  const standings = Array.from(jumperTotals.values())
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({
      rank: index + 1,
      jumperId: entry.jumperId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      country: entry.country,
      totalPoints: Math.round(entry.totalPoints * 10) / 10,
      events: entry.events
    }));

  // Save to database
  run('UPDATE seasons SET four_hills_standings = ? WHERE id = ?', [JSON.stringify(standings), seasonId]);

  return standings;
}

// Update Flying Cup standings after a ski flying event completes
function updateFlyingCupStandings(seasonId) {
  // Get all completed ski flying events for this season (hill_size = 'FH')
  const flyingEvents = all(`
    SELECT id, results FROM season_events
    WHERE season_id = ? AND hill_size = 'FH' AND status = 'completed'
  `, [seasonId]);

  if (flyingEvents.length === 0) return [];

  // Aggregate total jump points for each jumper across all Flying events
  const jumperTotals = new Map();

  for (const event of flyingEvents) {
    let results;
    try {
      results = JSON.parse(event.results || '{}');
    } catch (e) {
      continue;
    }

    // Sum points from round 1
    if (results.round1) {
      for (const entry of results.round1) {
        if (!entry.jump) continue;
        const current = jumperTotals.get(entry.jumperId) || {
          jumperId: entry.jumperId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          country: entry.country,
          totalPoints: 0,
          events: 0,
          jumps: []
        };
        current.totalPoints += entry.totalPoints || 0;
        current.jumps.push({ event: event.id, round: 1, points: entry.totalPoints || 0 });
        jumperTotals.set(entry.jumperId, current);
      }
    }

    // Sum points from round 2
    if (results.round2) {
      for (const entry of results.round2) {
        if (!entry.jump) continue;
        const current = jumperTotals.get(entry.jumperId) || {
          jumperId: entry.jumperId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          country: entry.country,
          totalPoints: 0,
          events: 0,
          jumps: []
        };
        // For round 2, add only the round 2 jump points
        const round2JumpPoints = entry.jump?.totalPoints || 0;
        current.totalPoints += round2JumpPoints;
        current.jumps.push({ event: event.id, round: 2, points: round2JumpPoints });
        jumperTotals.set(entry.jumperId, current);
      }
    }
  }

  // Count events per jumper
  for (const [jumperId, data] of jumperTotals) {
    const eventIds = new Set(data.jumps.map(j => j.event));
    data.events = eventIds.size;
  }

  // Sort by total points descending
  const standings = Array.from(jumperTotals.values())
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({
      rank: index + 1,
      jumperId: entry.jumperId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      country: entry.country,
      totalPoints: Math.round(entry.totalPoints * 10) / 10,
      events: entry.events
    }));

  // Save to database
  run('UPDATE seasons SET flying_cup_standings = ? WHERE id = ?', [JSON.stringify(standings), seasonId]);

  return standings;
}

// ==================== ROUTES ====================

// Get current/active season for a world
router.get('/world/:worldId/current', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const season = get(`
      SELECT * FROM seasons
      WHERE world_id = ? AND sport_id = 'ski-jumping'
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
      return res.json({ season: null, events: [], standings: [] });
    }

    const events = all(
      'SELECT * FROM season_events WHERE season_id = ? ORDER BY event_index',
      [season.id]
    );

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    let fourHillsStandings = [];
    try {
      fourHillsStandings = JSON.parse(season.four_hills_standings || '[]');
    } catch (e) {
      fourHillsStandings = [];
    }

    let flyingCupStandings = [];
    try {
      flyingCupStandings = JSON.parse(season.flying_cup_standings || '[]');
    } catch (e) {
      flyingCupStandings = [];
    }

    const eventsWithResults = events.map(event => ({
      ...event,
      results: JSON.parse(event.results || '{}')
    }));

    res.json({
      season,
      events: eventsWithResults,
      standings,
      fourHillsStandings,
      flyingCupStandings,
      countryNames
    });
  } catch (error) {
    console.error('Error fetching current season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new season
router.post('/world/:worldId/create', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const activeSeason = get(`
      SELECT * FROM seasons
      WHERE world_id = ? AND sport_id = 'ski-jumping' AND status != 'completed'
    `, [worldId]);

    if (activeSeason) {
      return res.status(400).json({ error: 'An active season already exists. Complete it first.' });
    }

    const lastSeason = get(`
      SELECT year_start, year_end FROM seasons
      WHERE world_id = ? AND sport_id = 'ski-jumping'
      ORDER BY year_end DESC
      LIMIT 1
    `, [worldId]);

    let yearStart, yearEnd;
    if (lastSeason) {
      yearStart = lastSeason.year_end;
      yearEnd = lastSeason.year_end + 1;
    } else {
      yearStart = 2024;
      yearEnd = 2025;
    }

    const seasonId = uuidv4();
    const seasonName = `${yearStart}/${yearEnd}`;

    run(`
      INSERT INTO seasons (id, world_id, sport_id, name, year_start, year_end, status, standings)
      VALUES (?, ?, 'ski-jumping', ?, ?, ?, 'not_started', '[]')
    `, [seasonId, worldId, seasonName, yearStart, yearEnd]);

    const calendar = generateSeasonCalendar(yearStart, yearEnd);

    for (const event of calendar) {
      const eventId = uuidv4();
      // Initialize results structure for step-by-step simulation
      const initialResults = JSON.stringify({
        status: 'not_started', // not_started, qualifying, round1, round2, completed
        qualifying: [],
        round1: [],
        round2: [],
        final: []
      });
      run(`
        INSERT INTO season_events (id, season_id, event_index, name, location, country, hill_size, k_point, date, status, results, tournament)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
      `, [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.hillSize, event.kPoint, event.date, initialResults, event.tournament || null]);
    }

    const season = get('SELECT * FROM seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM season_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.status(201).json({
      message: 'Season created successfully',
      season,
      events: events.map(e => ({ ...e, results: JSON.parse(e.results) })),
      standings: []
    });
  } catch (error) {
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// Get event details with full race state
router.get('/event/:eventId', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.name as season_name
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = { status: 'not_started', qualifying: [], round1: [], round2: [], final: [] };
    try {
      const parsed = JSON.parse(event.results || '{}');
      // Make sure we have a proper object with status, not an empty array
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.status) {
        results = parsed;
      }
    } catch (e) {
      console.error('Error parsing event results:', e);
    }

    // Get all jumpers for this world
    const jumpers = all('SELECT * FROM jumpers WHERE world_id = ?', [event.world_id]);

    res.json({
      event: { ...event, results },
      jumpers,
      countryNames
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Start qualifying round - initialize all jumpers
router.post('/event/:eventId/start-qualifying', authMiddleware, validateWeekLock('season_events', 'seasons'), (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = { status: 'not_started', qualifying: [], round1: [], round2: [], final: [] };
    try {
      const parsed = JSON.parse(event.results || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.status) {
        results = parsed;
      }
    } catch (e) {
      // Use default
    }

    // Allow restart if not completed - reset to qualifying phase
    if (results.status === 'completed') {
      return res.status(400).json({ error: 'Event already completed' });
    }

    // Get all jumpers
    const jumpers = all('SELECT * FROM jumpers WHERE world_id = ?', [event.world_id]);

    if (jumpers.length < 10) {
      return res.status(400).json({ error: 'Not enough jumpers' });
    }

    // Get current season standings to order by standings ranking
    const season = get('SELECT standings FROM seasons WHERE id = (SELECT season_id FROM season_events WHERE id = ?)', [eventId]);
    let standings = [];
    try {
      standings = JSON.parse(season?.standings || '[]');
    } catch (e) {
      standings = [];
    }

    // Create a map of jumperId -> standings rank (1 = leader, higher = worse)
    const standingsRankMap = new Map();
    standings.forEach((s, index) => {
      standingsRankMap.set(s.jumperId, index + 1);
    });

    // Sort jumpers by standings ranking: last in standings (worst rank) jumps first, leader (rank 1) jumps last
    // Jumpers not in standings yet jump first (sorted by name for consistency)
    const sortedJumpers = [...jumpers].sort((a, b) => {
      const rankA = standingsRankMap.get(a.id);
      const rankB = standingsRankMap.get(b.id);

      // Jumpers not in standings jump first
      if (!rankA && !rankB) {
        return a.last_name.localeCompare(b.last_name);
      }
      if (!rankA) return -1; // A not in standings, jumps first
      if (!rankB) return 1;  // B not in standings, jumps first

      // Higher rank number (worse) jumps first, lower rank number (leader) jumps last
      return rankB - rankA;
    });

    // Initialize qualifying with jumpers ordered by WC standings (leader jumps last)
    results.status = 'qualifying';
    results.qualifying = sortedJumpers.map((jumper, index) => ({
      jumperId: jumper.id,
      firstName: jumper.first_name,
      lastName: jumper.last_name,
      country: jumper.country,
      bibNumber: index + 1,
      jump: null,
      rank: null
    }));

    run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);

    res.json({ message: 'Qualifying started', results });
  } catch (error) {
    console.error('Error starting qualifying:', error);
    res.status(500).json({ error: 'Failed to start qualifying' });
  }
});

// Simulate all jumps in qualifying
router.post('/event/:eventId/simulate-qualifying', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');
    if (results.status !== 'qualifying') {
      return res.status(400).json({ error: 'Not in qualifying phase' });
    }

    const jumpers = all('SELECT * FROM jumpers WHERE world_id = ?', [event.world_id]);
    const jumperMap = new Map(jumpers.map(j => [j.id, j]));
    const isSkiFlying = event.hill_size === 'FH';

    // Simulate all qualifying jumps
    for (const entry of results.qualifying) {
      if (!entry.jump) {
        const jumper = jumperMap.get(entry.jumperId);
        if (jumper) {
          entry.jump = simulateJump(jumper, event.k_point, isSkiFlying);
        }
      }
    }

    // Sort by points and assign ranks
    results.qualifying.sort((a, b) => (b.jump?.totalPoints || 0) - (a.jump?.totalPoints || 0));
    results.qualifying.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);

    res.json({ message: 'Qualifying simulated', results });
  } catch (error) {
    console.error('Error simulating qualifying:', error);
    res.status(500).json({ error: 'Failed to simulate qualifying' });
  }
});

// Simulate a single jump in qualifying
router.post('/event/:eventId/simulate-jump/:jumperId', authMiddleware, (req, res) => {
  try {
    const { eventId, jumperId } = req.params;
    const { round } = req.body; // 'qualifying', 'round1', or 'round2'

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');
    const roundName = round || results.status;

    if (!['qualifying', 'round1', 'round2'].includes(roundName)) {
      return res.status(400).json({ error: 'Invalid round' });
    }

    if (results.status !== roundName) {
      return res.status(400).json({ error: `Not in ${roundName} phase` });
    }

    const jumper = get('SELECT * FROM jumpers WHERE id = ? AND world_id = ?', [jumperId, event.world_id]);
    if (!jumper) {
      return res.status(404).json({ error: 'Jumper not found' });
    }

    const isSkiFlying = event.hill_size === 'FH';
    const roundData = results[roundName];
    const entryIndex = roundData.findIndex(e => e.jumperId === jumperId);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Jumper not in this round' });
    }

    if (roundData[entryIndex].jump) {
      return res.status(400).json({ error: 'Jump already simulated' });
    }

    // Simulate the jump
    const jumpResult = simulateJump(jumper, event.k_point, isSkiFlying);
    roundData[entryIndex].jump = jumpResult;

    // For round1 and round2, also update totalPoints
    if (roundName === 'round1') {
      roundData[entryIndex].totalPoints = jumpResult.totalPoints;
    } else if (roundName === 'round2') {
      roundData[entryIndex].totalPoints = Math.round((roundData[entryIndex].round1Points + jumpResult.totalPoints) * 10) / 10;
    }

    // Re-sort and assign ranks for all entries that have jumped
    const jumped = roundData.filter(e => e.jump !== null);
    const notJumped = roundData.filter(e => e.jump === null);

    if (roundName === 'qualifying') {
      jumped.sort((a, b) => (b.jump?.totalPoints || 0) - (a.jump?.totalPoints || 0));
    } else {
      jumped.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    }

    jumped.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    notJumped.forEach(entry => {
      entry.rank = null;
    });

    // Rebuild the array maintaining bib order for display
    results[roundName] = [...roundData].sort((a, b) => a.bibNumber - b.bibNumber);

    // Check if Round 2 is now complete and finalize the race
    let standings = null;
    if (roundName === 'round2') {
      const allRound2Done = results.round2.every(e => e.jump !== null);
      if (allRound2Done) {
        // Finalize the race
        results.final = [];

        // Add round 2 finishers (positions 1-30)
        const sortedRound2 = [...results.round2].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        sortedRound2.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        for (const entry of sortedRound2) {
          const r1Entry = results.round1.find(r => r.jumperId === entry.jumperId);
          results.final.push({
            jumperId: entry.jumperId,
            firstName: entry.firstName,
            lastName: entry.lastName,
            country: entry.country,
            jump1: r1Entry?.jump || null,
            jump2: entry.jump,
            totalPoints: entry.totalPoints,
            position: entry.rank,
            wcPoints: worldCupPoints[entry.rank] || 0
          });
        }

        // Add round 1 non-qualifiers (positions 31-50)
        const round2JumperIds = new Set(results.round2.map(r => r.jumperId));
        let position = 31;
        for (const entry of results.round1) {
          if (!round2JumperIds.has(entry.jumperId)) {
            results.final.push({
              jumperId: entry.jumperId,
              firstName: entry.firstName,
              lastName: entry.lastName,
              country: entry.country,
              jump1: entry.jump,
              jump2: null,
              totalPoints: entry.totalPoints,
              position: position,
              wcPoints: 0
            });
            position++;
          }
        }

        results.status = 'completed';

        // Update event status
        run('UPDATE season_events SET status = ?, results = ? WHERE id = ?', ['completed', JSON.stringify(results), eventId]);

        // Update season standings
        const seasonData = get('SELECT id, standings FROM seasons WHERE id = (SELECT season_id FROM season_events WHERE id = ?)', [eventId]);
        standings = [];
        try {
          standings = JSON.parse(seasonData.standings || '[]');
        } catch (e) {
          standings = [];
        }

        const standingsMap = new Map();
        for (const s of standings) {
          standingsMap.set(s.jumperId, s);
        }

        for (const result of results.final) {
          if (result.wcPoints > 0) {
            if (standingsMap.has(result.jumperId)) {
              const existing = standingsMap.get(result.jumperId);
              existing.points += result.wcPoints;
              existing.races += 1;
              if (result.position === 1) existing.wins += 1;
              if (result.position <= 3) existing.podiums += 1;
            } else {
              standingsMap.set(result.jumperId, {
                jumperId: result.jumperId,
                firstName: result.firstName,
                lastName: result.lastName,
                country: result.country,
                points: result.wcPoints,
                races: 1,
                wins: result.position === 1 ? 1 : 0,
                podiums: result.position <= 3 ? 1 : 0
              });
            }
          }
        }

        standings = Array.from(standingsMap.values());
        standings.sort((a, b) => b.points - a.points);

        run('UPDATE seasons SET standings = ?, status = ? WHERE id = ?', [JSON.stringify(standings), 'in_progress', seasonData.id]);

        // Update Four Hills standings if this is a Four Hills event
        if (event.tournament === 'Four Hills') {
          updateFourHillsStandings(seasonData.id, results);
        }

        // Update Flying Cup standings if this is a ski flying event
        if (event.hill_size === 'FH') {
          updateFlyingCupStandings(seasonData.id);
        }
      } else {
        run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);
      }
    } else {
      run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);
    }

    const response = { message: 'Jump simulated', results, jumpResult };
    if (standings) {
      response.standings = standings;
    }

    res.json(response);
  } catch (error) {
    console.error('Error simulating single jump:', error);
    res.status(500).json({ error: 'Failed to simulate jump' });
  }
});

// Simulate next jumper (in bib order)
router.post('/event/:eventId/simulate-next', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');
    const roundName = results.status;

    if (!['qualifying', 'round1', 'round2'].includes(roundName)) {
      return res.status(400).json({ error: 'No active round' });
    }

    const roundData = results[roundName];

    // Find next jumper who hasn't jumped (by bib order)
    const sortedByBib = [...roundData].sort((a, b) => a.bibNumber - b.bibNumber);
    const nextEntry = sortedByBib.find(e => e.jump === null);

    if (!nextEntry) {
      return res.status(400).json({ error: 'All jumps completed in this round' });
    }

    const jumper = get('SELECT * FROM jumpers WHERE id = ? AND world_id = ?', [nextEntry.jumperId, event.world_id]);
    if (!jumper) {
      return res.status(404).json({ error: 'Jumper not found' });
    }

    const isSkiFlying = event.hill_size === 'FH';
    const entryIndex = roundData.findIndex(e => e.jumperId === nextEntry.jumperId);

    // Simulate the jump
    const jumpResult = simulateJump(jumper, event.k_point, isSkiFlying);
    roundData[entryIndex].jump = jumpResult;

    // For round1 and round2, also update totalPoints
    if (roundName === 'round1') {
      roundData[entryIndex].totalPoints = jumpResult.totalPoints;
    } else if (roundName === 'round2') {
      roundData[entryIndex].totalPoints = Math.round((roundData[entryIndex].round1Points + jumpResult.totalPoints) * 10) / 10;
    }

    // Re-sort and assign ranks for all entries that have jumped
    const jumped = roundData.filter(e => e.jump !== null);

    if (roundName === 'qualifying') {
      jumped.sort((a, b) => (b.jump?.totalPoints || 0) - (a.jump?.totalPoints || 0));
    } else {
      jumped.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    }

    jumped.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Check if Round 2 is now complete and finalize the race
    let standings = null;
    if (roundName === 'round2') {
      const allRound2Done = roundData.every(e => e.jump !== null);
      if (allRound2Done) {
        // Finalize the race - same logic as simulate-round2
        results.final = [];

        // Add round 2 finishers (positions 1-30)
        for (const entry of results.round2) {
          const r1Entry = results.round1.find(r => r.jumperId === entry.jumperId);
          results.final.push({
            jumperId: entry.jumperId,
            firstName: entry.firstName,
            lastName: entry.lastName,
            country: entry.country,
            jump1: r1Entry?.jump || null,
            jump2: entry.jump,
            totalPoints: entry.totalPoints,
            position: entry.rank,
            wcPoints: worldCupPoints[entry.rank] || 0
          });
        }

        // Add round 1 non-qualifiers (positions 31-50)
        const round2JumperIds = new Set(results.round2.map(r => r.jumperId));
        let position = 31;
        for (const entry of results.round1) {
          if (!round2JumperIds.has(entry.jumperId)) {
            results.final.push({
              jumperId: entry.jumperId,
              firstName: entry.firstName,
              lastName: entry.lastName,
              country: entry.country,
              jump1: entry.jump,
              jump2: null,
              totalPoints: entry.totalPoints,
              position: position,
              wcPoints: 0
            });
            position++;
          }
        }

        results.status = 'completed';

        // Update event status
        run('UPDATE season_events SET status = ?, results = ? WHERE id = ?', ['completed', JSON.stringify(results), eventId]);

        // Update season standings
        const seasonData = get('SELECT id, standings FROM seasons WHERE id = (SELECT season_id FROM season_events WHERE id = ?)', [eventId]);
        standings = [];
        try {
          standings = JSON.parse(seasonData.standings || '[]');
        } catch (e) {
          standings = [];
        }

        const standingsMap = new Map();
        for (const s of standings) {
          standingsMap.set(s.jumperId, s);
        }

        for (const result of results.final) {
          if (result.wcPoints > 0) {
            if (standingsMap.has(result.jumperId)) {
              const existing = standingsMap.get(result.jumperId);
              existing.points += result.wcPoints;
              existing.races += 1;
              if (result.position === 1) existing.wins += 1;
              if (result.position <= 3) existing.podiums += 1;
            } else {
              standingsMap.set(result.jumperId, {
                jumperId: result.jumperId,
                firstName: result.firstName,
                lastName: result.lastName,
                country: result.country,
                points: result.wcPoints,
                races: 1,
                wins: result.position === 1 ? 1 : 0,
                podiums: result.position <= 3 ? 1 : 0
              });
            }
          }
        }

        standings = Array.from(standingsMap.values());
        standings.sort((a, b) => b.points - a.points);

        run('UPDATE seasons SET standings = ?, status = ? WHERE id = ?', [JSON.stringify(standings), 'in_progress', seasonData.id]);

        // Update Four Hills standings if this is a Four Hills event
        if (event.tournament === 'Four Hills') {
          updateFourHillsStandings(seasonData.id, results);
        }

        // Update Flying Cup standings if this is a ski flying event
        if (event.hill_size === 'FH') {
          updateFlyingCupStandings(seasonData.id);
        }
      } else {
        run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);
      }
    } else {
      run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);
    }

    const response = {
      message: 'Jump simulated',
      results,
      jumpResult,
      jumper: { id: nextEntry.jumperId, firstName: nextEntry.firstName, lastName: nextEntry.lastName }
    };
    if (standings) {
      response.standings = standings;
    }

    res.json(response);
  } catch (error) {
    console.error('Error simulating next jump:', error);
    res.status(500).json({ error: 'Failed to simulate jump' });
  }
});

// Progress to Round 1 - top 50 qualify
router.post('/event/:eventId/start-round1', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');

    // Check all qualifying jumps are done
    const allQualifyingDone = results.qualifying.every(e => e.jump !== null);
    if (!allQualifyingDone) {
      return res.status(400).json({ error: 'Qualifying not complete' });
    }

    // Top 50 go to round 1
    const qualified = results.qualifying.slice(0, 50);

    // Get current season standings to order by WC points (standings ranking)
    const season = get('SELECT standings FROM seasons WHERE id = (SELECT season_id FROM season_events WHERE id = ?)', [eventId]);
    let standings = [];
    try {
      standings = JSON.parse(season?.standings || '[]');
    } catch (e) {
      standings = [];
    }

    // Create a map of jumperId -> standings rank (1 = leader, higher = worse)
    const standingsRankMap = new Map();
    standings.forEach((s, index) => {
      standingsRankMap.set(s.jumperId, index + 1);
    });

    // Sort qualified jumpers by standings ranking: last in standings (worst) jumps first, first (leader) jumps last
    // Unranked jumpers (not in standings) jump first, then worst ranked, then leader last
    const sortedQualified = [...qualified].sort((a, b) => {
      const rankA = standingsRankMap.get(a.jumperId);
      const rankB = standingsRankMap.get(b.jumperId);

      // Unranked jumpers jump first
      if (!rankA && !rankB) return 0;
      if (!rankA) return -1;
      if (!rankB) return 1;

      // Higher rank number (worse) jumps first, lower rank number (leader) jumps last
      return rankB - rankA;
    });

    results.status = 'round1';
    results.round1 = sortedQualified.map((entry, index) => ({
      jumperId: entry.jumperId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      country: entry.country,
      bibNumber: index + 1,
      qualifyingRank: entry.rank,
      jump: null,
      totalPoints: null,
      rank: null
    }));

    run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);

    res.json({ message: 'Round 1 started', results });
  } catch (error) {
    console.error('Error starting round 1:', error);
    res.status(500).json({ error: 'Failed to start round 1' });
  }
});

// Simulate Round 1
router.post('/event/:eventId/simulate-round1', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');
    if (results.status !== 'round1') {
      return res.status(400).json({ error: 'Not in round 1 phase' });
    }

    const jumpers = all('SELECT * FROM jumpers WHERE world_id = ?', [event.world_id]);
    const jumperMap = new Map(jumpers.map(j => [j.id, j]));
    const isSkiFlying = event.hill_size === 'FH';

    // Simulate all round 1 jumps
    for (const entry of results.round1) {
      if (!entry.jump) {
        const jumper = jumperMap.get(entry.jumperId);
        if (jumper) {
          entry.jump = simulateJump(jumper, event.k_point, isSkiFlying);
          entry.totalPoints = entry.jump.totalPoints;
        }
      }
    }

    // Sort by points and assign ranks
    results.round1.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    results.round1.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);

    res.json({ message: 'Round 1 simulated', results });
  } catch (error) {
    console.error('Error simulating round 1:', error);
    res.status(500).json({ error: 'Failed to simulate round 1' });
  }
});

// Progress to Round 2 - top 30 qualify
router.post('/event/:eventId/start-round2', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');

    const allRound1Done = results.round1.every(e => e.jump !== null);
    if (!allRound1Done) {
      return res.status(400).json({ error: 'Round 1 not complete' });
    }

    // Sort round 1 by points descending before selecting top 30
    results.round1.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    results.round1.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Top 30 go to round 2
    const qualified = results.round1.slice(0, 30);

    // In round 2, reverse order of first round: R1 rank 30 jumps first (bib 1), R1 rank 1 jumps last (bib 30)
    results.status = 'round2';
    results.round2 = qualified.map((entry, index) => ({
      jumperId: entry.jumperId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      country: entry.country,
      bibNumber: 30 - index,  // R1 rank 1 gets bib 30, R1 rank 30 gets bib 1
      round1Rank: entry.rank,
      round1Points: entry.totalPoints,
      jump: null,
      totalPoints: null,
      rank: null
    }));

    // Sort by bib number so bib 1 (R1 rank 30) jumps first
    results.round2.sort((a, b) => a.bibNumber - b.bibNumber);

    run('UPDATE season_events SET results = ? WHERE id = ?', [JSON.stringify(results), eventId]);

    res.json({ message: 'Round 2 started', results });
  } catch (error) {
    console.error('Error starting round 2:', error);
    res.status(500).json({ error: 'Failed to start round 2' });
  }
});

// Simulate Round 2 and finalize results
router.post('/event/:eventId/simulate-round2', authMiddleware, (req, res) => {
  try {
    const { eventId } = req.params;

    const event = get(`
      SELECT e.*, s.world_id, s.id as season_id, s.standings as season_standings
      FROM season_events e
      INNER JOIN seasons s ON e.season_id = s.id
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE e.id = ? AND w.user_id = ?
    `, [eventId, req.user.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let results = JSON.parse(event.results || '{}');
    if (results.status !== 'round2') {
      return res.status(400).json({ error: 'Not in round 2 phase' });
    }

    const jumpers = all('SELECT * FROM jumpers WHERE world_id = ?', [event.world_id]);
    const jumperMap = new Map(jumpers.map(j => [j.id, j]));
    const isSkiFlying = event.hill_size === 'FH';

    // Simulate all round 2 jumps
    for (const entry of results.round2) {
      if (!entry.jump) {
        const jumper = jumperMap.get(entry.jumperId);
        if (jumper) {
          entry.jump = simulateJump(jumper, event.k_point, isSkiFlying);
          entry.totalPoints = Math.round((entry.round1Points + entry.jump.totalPoints) * 10) / 10;
        }
      }
    }

    // Sort by total points and assign ranks
    results.round2.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    results.round2.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Build final results - combine round 2 finishers and round 1 non-qualifiers
    results.final = [];

    // Add round 2 finishers (positions 1-30)
    for (const entry of results.round2) {
      const r1Entry = results.round1.find(r => r.jumperId === entry.jumperId);
      results.final.push({
        jumperId: entry.jumperId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        country: entry.country,
        jump1: r1Entry?.jump || null,
        jump2: entry.jump,
        totalPoints: entry.totalPoints,
        position: entry.rank,
        wcPoints: worldCupPoints[entry.rank] || 0
      });
    }

    // Add round 1 non-qualifiers (positions 31-50)
    const round2JumperIds = new Set(results.round2.map(r => r.jumperId));
    let position = 31;
    for (const entry of results.round1) {
      if (!round2JumperIds.has(entry.jumperId)) {
        results.final.push({
          jumperId: entry.jumperId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          country: entry.country,
          jump1: entry.jump,
          jump2: null,
          totalPoints: entry.totalPoints,
          position: position,
          wcPoints: 0
        });
        position++;
      }
    }

    results.status = 'completed';

    // Update event
    run('UPDATE season_events SET status = ?, results = ? WHERE id = ?', ['completed', JSON.stringify(results), eventId]);

    // Update season standings
    let standings = [];
    try {
      standings = JSON.parse(event.season_standings || '[]');
    } catch (e) {
      standings = [];
    }

    const standingsMap = new Map();
    for (const s of standings) {
      standingsMap.set(s.jumperId, s);
    }

    for (const result of results.final) {
      if (result.wcPoints > 0) {
        if (standingsMap.has(result.jumperId)) {
          const existing = standingsMap.get(result.jumperId);
          existing.points += result.wcPoints;
          existing.races += 1;
          if (result.position === 1) existing.wins += 1;
          if (result.position <= 3) existing.podiums += 1;
        } else {
          standingsMap.set(result.jumperId, {
            jumperId: result.jumperId,
            firstName: result.firstName,
            lastName: result.lastName,
            country: result.country,
            points: result.wcPoints,
            races: 1,
            wins: result.position === 1 ? 1 : 0,
            podiums: result.position <= 3 ? 1 : 0
          });
        }
      }
    }

    standings = Array.from(standingsMap.values());
    standings.sort((a, b) => b.points - a.points);

    run('UPDATE seasons SET standings = ?, status = ? WHERE id = ?', [JSON.stringify(standings), 'in_progress', event.season_id]);

    // Update Four Hills standings if this is a Four Hills event
    let fourHillsStandings = null;
    if (event.tournament === 'Four Hills') {
      fourHillsStandings = updateFourHillsStandings(event.season_id, results);
    }

    // Update Flying Cup standings if this is a ski flying event
    let flyingCupStandings = null;
    if (event.hill_size === 'FH') {
      flyingCupStandings = updateFlyingCupStandings(event.season_id);
    }

    const response = {
      message: 'Round 2 simulated, race completed',
      results,
      standings
    };
    if (fourHillsStandings) {
      response.fourHillsStandings = fourHillsStandings;
    }
    if (flyingCupStandings) {
      response.flyingCupStandings = flyingCupStandings;
    }

    res.json(response);
  } catch (error) {
    console.error('Error simulating round 2:', error);
    res.status(500).json({ error: 'Failed to simulate round 2' });
  }
});

// Complete season and save to history
router.post('/season/:seasonId/complete', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM seasons s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [seasonId, req.user.id]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const remainingEvents = get(`
      SELECT COUNT(*) as count FROM season_events
      WHERE season_id = ? AND status != 'completed'
    `, [seasonId]);

    if (remainingEvents.count > 0) {
      return res.status(400).json({ error: 'Not all events are completed yet' });
    }

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    const top10 = standings.slice(0, 10).map((s, index) => ({
      position: index + 1,
      ...s
    }));

    const raceCount = get('SELECT COUNT(*) as count FROM season_events WHERE season_id = ?', [seasonId]);

    const historyId = uuidv4();
    run(`
      INSERT INTO season_history (id, world_id, sport_id, season_name, year_start, year_end, top_10, total_races)
      VALUES (?, ?, 'ski-jumping', ?, ?, ?, ?, ?)
    `, [historyId, season.world_id, season.name, season.year_start, season.year_end, JSON.stringify(top10), raceCount.count]);

    run('UPDATE seasons SET status = ? WHERE id = ?', ['completed', seasonId]);

    res.json({
      message: 'Season completed and saved to history',
      top10,
      totalRaces: raceCount.count
    });
  } catch (error) {
    console.error('Error completing season:', error);
    res.status(500).json({ error: 'Failed to complete season' });
  }
});

// Reset season to original state
router.post('/season/:seasonId/reset', authMiddleware, (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = get(`
      SELECT s.*, w.user_id
      FROM seasons s
      INNER JOIN worlds w ON s.world_id = w.id
      WHERE s.id = ? AND w.user_id = ?
    `, [seasonId, req.user.id]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    if (season.status === 'completed') {
      return res.status(400).json({ error: 'Cannot reset a completed season' });
    }

    // Reset season standings and status (including Four Hills and Flying Cup standings)
    run('UPDATE seasons SET standings = ?, four_hills_standings = ?, flying_cup_standings = ?, status = ? WHERE id = ?', ['[]', '[]', '[]', 'not_started', seasonId]);

    // Reset all events to scheduled with empty results
    const initialResults = JSON.stringify({
      status: 'not_started',
      qualifying: [],
      round1: [],
      round2: [],
      final: []
    });

    run('UPDATE season_events SET status = ?, results = ? WHERE season_id = ?', ['scheduled', initialResults, seasonId]);

    // Fetch updated data
    const updatedSeason = get('SELECT * FROM seasons WHERE id = ?', [seasonId]);
    const events = all('SELECT * FROM season_events WHERE season_id = ? ORDER BY event_index', [seasonId]);

    res.json({
      message: 'Season reset successfully',
      season: updatedSeason,
      events: events.map(e => ({ ...e, results: JSON.parse(e.results) })),
      standings: [],
      fourHillsStandings: [],
      flyingCupStandings: []
    });
  } catch (error) {
    console.error('Error resetting season:', error);
    res.status(500).json({ error: 'Failed to reset season' });
  }
});

// Get season history for a world
router.get('/world/:worldId/history', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const history = all(`
      SELECT * FROM season_history
      WHERE world_id = ? AND sport_id = 'ski-jumping'
      ORDER BY year_end DESC
    `, [worldId]);

    const historyWithTop10 = history.map(h => ({
      ...h,
      top_10: JSON.parse(h.top_10 || '[]')
    }));

    res.json({ history: historyWithTop10, countryNames });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
