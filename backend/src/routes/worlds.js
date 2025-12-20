const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { getWeekKey, getWeekDateRange, getShortDayName } = require('../utils/weekUtils');

// Import calendar generators for all sports
const { generateSeasonCalendar } = require('../data/skiJumpingCalendar');
const { generateBiathlonCalendar } = require('../data/biathlonCalendar');
const { generateXCCalendar } = require('../data/crossCountryCalendar');
const { generateAlpineCalendar } = require('../data/alpineCalendar');
const { generateNordicCombinedCalendar } = require('../data/nordicCombinedCalendar');
const { generateBobsleighCalendar } = require('../data/bobsleighCalendar');
const { generateLugeCalendar } = require('../data/lugeCalendar');
const { generateSkeletonCalendar } = require('../data/skeletonCalendar');
const { generateSpeedSkatingCalendar } = require('../data/speedSkatingCalendar');

const router = express.Router();

// Get all worlds for current user
router.get('/', authMiddleware, (req, res) => {
  try {
    const worlds = all(`
      SELECT w.*,
        (SELECT COUNT(*) FROM world_sports WHERE world_id = w.id) as sports_count,
        (SELECT COUNT(*) FROM athletes WHERE world_id = w.id) as athletes_count
      FROM worlds w
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json({ worlds });
  } catch (error) {
    console.error('Error fetching worlds:', error);
    res.status(500).json({ error: 'Failed to fetch worlds' });
  }
});

// Get world by ID
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const world = get(
      'SELECT * FROM worlds WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Get enabled sports for this world
    const sports = all(`
      SELECT s.*, ws.settings
      FROM sports s
      INNER JOIN world_sports ws ON s.id = ws.sport_id
      WHERE ws.world_id = ?
    `, [req.params.id]);

    res.json({ world: { ...world, sports } });
  } catch (error) {
    console.error('Error fetching world:', error);
    res.status(500).json({ error: 'Failed to fetch world' });
  }
});

// Create new world
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'World name is required' });
    }

    const worldId = uuidv4();
    run(
      'INSERT INTO worlds (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [worldId, req.user.id, name, description || '']
    );

    // Enable all sports by default
    const sports = all('SELECT id FROM sports');
    for (const sport of sports) {
      run(
        'INSERT INTO world_sports (id, world_id, sport_id) VALUES (?, ?, ?)',
        [uuidv4(), worldId, sport.id]
      );
    }

    const world = get('SELECT * FROM worlds WHERE id = ?', [worldId]);
    res.status(201).json({ world });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ error: 'Failed to create world' });
  }
});

// Update world
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run(
      'UPDATE worlds SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || world.name, description !== undefined ? description : world.description, req.params.id]
    );

    const updatedWorld = get('SELECT * FROM worlds WHERE id = ?', [req.params.id]);
    res.json({ world: updatedWorld });
  } catch (error) {
    console.error('Error updating world:', error);
    res.status(500).json({ error: 'Failed to update world' });
  }
});

// Delete world
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM worlds WHERE id = ?', [req.params.id]);
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting world:', error);
    res.status(500).json({ error: 'Failed to delete world' });
  }
});

// Get dashboard summary for a world (next events + top 3 standings per sport)
router.get('/:id/dashboard-summary', authMiddleware, (req, res) => {
  try {
    const { id: worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const summary = {
      skiJumping: { nextEvent: null, top3: [] },
      biathlon: { nextEvent: null, top3: [] },
      crossCountry: { nextEvent: null, top3: [] },
      alpine: { nextEvent: null, top3: [] },
      bobsleigh: { nextEvent: null, top3: [] },
      nordicCombined: { nextEvent: null, top3: [] },
      speedSkating: { nextEvent: null, top3: [] },
      luge: { nextEvent: null, top3: [] },
      skeleton: { nextEvent: null, top3: [] }
    };

    // Ski Jumping - get next event and top 3
    const sjSeason = get(`
      SELECT * FROM seasons
      WHERE world_id = ? AND sport_id = 'ski-jumping' AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (sjSeason) {
      const sjNextEvent = get(`
        SELECT * FROM season_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [sjSeason.id]);

      if (sjNextEvent) {
        summary.skiJumping.nextEvent = {
          id: sjNextEvent.id,
          name: sjNextEvent.name,
          location: sjNextEvent.location,
          country: sjNextEvent.country,
          date: sjNextEvent.date,
          hillSize: sjNextEvent.hill_size
        };
      }

      try {
        const standings = JSON.parse(sjSeason.standings || '[]');
        summary.skiJumping.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const sjTotal = get('SELECT COUNT(*) as count FROM season_events WHERE season_id = ?', [sjSeason.id]);
      const sjCompleted = get("SELECT COUNT(*) as count FROM season_events WHERE season_id = ? AND status = 'completed'", [sjSeason.id]);
      summary.skiJumping.racesCompleted = sjCompleted?.count || 0;
      summary.skiJumping.racesTotal = sjTotal?.count || 0;
    }

    // Biathlon - get next event and top 3
    const biSeason = get(`
      SELECT * FROM biathlon_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (biSeason) {
      const biNextEvent = get(`
        SELECT * FROM biathlon_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [biSeason.id]);

      if (biNextEvent) {
        summary.biathlon.nextEvent = {
          id: biNextEvent.id,
          name: biNextEvent.name,
          location: biNextEvent.location,
          country: biNextEvent.country,
          date: biNextEvent.date,
          raceType: biNextEvent.race_type
        };
      }

      try {
        const standings = JSON.parse(biSeason.standings || '[]');
        summary.biathlon.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const biTotal = get('SELECT COUNT(*) as count FROM biathlon_events WHERE season_id = ?', [biSeason.id]);
      const biCompleted = get("SELECT COUNT(*) as count FROM biathlon_events WHERE season_id = ? AND status = 'completed'", [biSeason.id]);
      summary.biathlon.racesCompleted = biCompleted?.count || 0;
      summary.biathlon.racesTotal = biTotal?.count || 0;
    }

    // Cross-Country - get next event and top 3
    const xcSeason = get(`
      SELECT * FROM xc_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (xcSeason) {
      const xcNextEvent = get(`
        SELECT * FROM xc_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [xcSeason.id]);

      if (xcNextEvent) {
        summary.crossCountry.nextEvent = {
          id: xcNextEvent.id,
          name: xcNextEvent.name,
          location: xcNextEvent.location,
          country: xcNextEvent.country,
          date: xcNextEvent.date,
          raceType: xcNextEvent.race_type,
          technique: xcNextEvent.technique
        };
      }

      try {
        const standings = JSON.parse(xcSeason.standings || '[]');
        summary.crossCountry.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const xcTotal = get('SELECT COUNT(*) as count FROM xc_events WHERE season_id = ?', [xcSeason.id]);
      const xcCompleted = get("SELECT COUNT(*) as count FROM xc_events WHERE season_id = ? AND status = 'completed'", [xcSeason.id]);
      summary.crossCountry.racesCompleted = xcCompleted?.count || 0;
      summary.crossCountry.racesTotal = xcTotal?.count || 0;
    }

    // Alpine Skiing - get next event and top 3
    const alpineSeason = get(`
      SELECT * FROM alpine_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (alpineSeason) {
      const alpineNextEvent = get(`
        SELECT * FROM alpine_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [alpineSeason.id]);

      if (alpineNextEvent) {
        summary.alpine.nextEvent = {
          id: alpineNextEvent.id,
          name: alpineNextEvent.name,
          location: alpineNextEvent.location,
          country: alpineNextEvent.country,
          date: alpineNextEvent.date,
          discipline: alpineNextEvent.discipline
        };
      }

      try {
        const standings = JSON.parse(alpineSeason.standings || '[]');
        summary.alpine.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const alpineTotal = get('SELECT COUNT(*) as count FROM alpine_events WHERE season_id = ?', [alpineSeason.id]);
      const alpineCompleted = get("SELECT COUNT(*) as count FROM alpine_events WHERE season_id = ? AND status = 'completed'", [alpineSeason.id]);
      summary.alpine.racesCompleted = alpineCompleted?.count || 0;
      summary.alpine.racesTotal = alpineTotal?.count || 0;
    }

    // Bobsleigh - get next event and top 3
    const bobSeason = get(`
      SELECT * FROM bobsleigh_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (bobSeason) {
      const bobNextEvent = get(`
        SELECT * FROM bobsleigh_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [bobSeason.id]);

      if (bobNextEvent) {
        summary.bobsleigh.nextEvent = {
          id: bobNextEvent.id,
          name: bobNextEvent.name,
          location: bobNextEvent.location,
          country: bobNextEvent.country,
          date: bobNextEvent.date,
          runs: bobNextEvent.runs
        };
      }

      try {
        const standings = JSON.parse(bobSeason.standings || '[]');
        summary.bobsleigh.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: '',
          lastName: s.teamName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const bobTotal = get('SELECT COUNT(*) as count FROM bobsleigh_events WHERE season_id = ?', [bobSeason.id]);
      const bobCompleted = get("SELECT COUNT(*) as count FROM bobsleigh_events WHERE season_id = ? AND status = 'completed'", [bobSeason.id]);
      summary.bobsleigh.racesCompleted = bobCompleted?.count || 0;
      summary.bobsleigh.racesTotal = bobTotal?.count || 0;
    }

    // Nordic Combined - get next event and top 3
    const ncSeason = get(`
      SELECT * FROM nc_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (ncSeason) {
      const ncNextEvent = get(`
        SELECT * FROM nc_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [ncSeason.id]);

      if (ncNextEvent) {
        summary.nordicCombined.nextEvent = {
          id: ncNextEvent.id,
          name: ncNextEvent.name,
          location: ncNextEvent.location,
          country: ncNextEvent.country,
          date: ncNextEvent.date,
          hillSize: ncNextEvent.hill_size,
          xcDistance: ncNextEvent.xc_distance
        };
      }

      try {
        const standings = JSON.parse(ncSeason.standings || '[]');
        summary.nordicCombined.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const ncTotal = get('SELECT COUNT(*) as count FROM nc_events WHERE season_id = ?', [ncSeason.id]);
      const ncCompleted = get("SELECT COUNT(*) as count FROM nc_events WHERE season_id = ? AND status = 'completed'", [ncSeason.id]);
      summary.nordicCombined.racesCompleted = ncCompleted?.count || 0;
      summary.nordicCombined.racesTotal = ncTotal?.count || 0;
    }

    // Speed Skating - get next event and top 3
    const ssSeason = get(`
      SELECT * FROM speed_skating_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (ssSeason) {
      const ssNextEvent = get(`
        SELECT * FROM speed_skating_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [ssSeason.id]);

      if (ssNextEvent) {
        summary.speedSkating.nextEvent = {
          id: ssNextEvent.id,
          name: ssNextEvent.name,
          location: ssNextEvent.location,
          country: ssNextEvent.country,
          date: ssNextEvent.date,
          distance: ssNextEvent.distance
        };
      }

      try {
        const standings = JSON.parse(ssSeason.standings || '[]');
        summary.speedSkating.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const ssTotal = get('SELECT COUNT(*) as count FROM speed_skating_events WHERE season_id = ?', [ssSeason.id]);
      const ssCompleted = get("SELECT COUNT(*) as count FROM speed_skating_events WHERE season_id = ? AND status = 'completed'", [ssSeason.id]);
      summary.speedSkating.racesCompleted = ssCompleted?.count || 0;
      summary.speedSkating.racesTotal = ssTotal?.count || 0;
    }

    // Luge - get next event and top 3
    const lugeSeason = get(`
      SELECT * FROM luge_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (lugeSeason) {
      const lugeNextEvent = get(`
        SELECT * FROM luge_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [lugeSeason.id]);

      if (lugeNextEvent) {
        summary.luge.nextEvent = {
          id: lugeNextEvent.id,
          name: lugeNextEvent.name,
          location: lugeNextEvent.location,
          country: lugeNextEvent.country,
          date: lugeNextEvent.date,
          runs: lugeNextEvent.runs
        };
      }

      try {
        const standings = JSON.parse(lugeSeason.standings || '[]');
        summary.luge.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const lugeTotal = get('SELECT COUNT(*) as count FROM luge_events WHERE season_id = ?', [lugeSeason.id]);
      const lugeCompleted = get("SELECT COUNT(*) as count FROM luge_events WHERE season_id = ? AND status = 'completed'", [lugeSeason.id]);
      summary.luge.racesCompleted = lugeCompleted?.count || 0;
      summary.luge.racesTotal = lugeTotal?.count || 0;
    }

    // Skeleton - get next event and top 3
    const skeletonSeason = get(`
      SELECT * FROM skeleton_seasons
      WHERE world_id = ? AND status != 'completed'
      ORDER BY year_start DESC LIMIT 1
    `, [worldId]);

    if (skeletonSeason) {
      const skeletonNextEvent = get(`
        SELECT * FROM skeleton_events
        WHERE season_id = ? AND status = 'scheduled'
        ORDER BY event_index LIMIT 1
      `, [skeletonSeason.id]);

      if (skeletonNextEvent) {
        summary.skeleton.nextEvent = {
          id: skeletonNextEvent.id,
          name: skeletonNextEvent.name,
          location: skeletonNextEvent.location,
          country: skeletonNextEvent.country,
          date: skeletonNextEvent.date,
          runs: skeletonNextEvent.runs
        };
      }

      try {
        const standings = JSON.parse(skeletonSeason.standings || '[]');
        summary.skeleton.top3 = standings.slice(0, 3).map((s, i) => ({
          position: i + 1,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: s.points
        }));
      } catch (e) {}

      // Race progress
      const skeletonTotal = get('SELECT COUNT(*) as count FROM skeleton_events WHERE season_id = ?', [skeletonSeason.id]);
      const skeletonCompleted = get("SELECT COUNT(*) as count FROM skeleton_events WHERE season_id = ? AND status = 'completed'", [skeletonSeason.id]);
      summary.skeleton.racesCompleted = skeletonCompleted?.count || 0;
      summary.skeleton.racesTotal = skeletonTotal?.count || 0;
    }

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get current week status for global week locking
router.get('/:id/current-week-status', authMiddleware, (req, res) => {
  try {
    const { id: worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Sport configurations for querying events (name must match router paths)
    const sportConfigs = [
      { name: 'ski-jumping', displayName: 'Ski Jumping', eventTable: 'season_events', seasonTable: 'seasons', sportIdField: 'sport_id', sportIdValue: 'ski-jumping' },
      { name: 'biathlon', displayName: 'Biathlon', eventTable: 'biathlon_events', seasonTable: 'biathlon_seasons' },
      { name: 'cross-country', displayName: 'Cross-Country', eventTable: 'xc_events', seasonTable: 'xc_seasons' },
      { name: 'alpine-skiing', displayName: 'Alpine Skiing', eventTable: 'alpine_events', seasonTable: 'alpine_seasons' },
      { name: 'nordic-combined', displayName: 'Nordic Combined', eventTable: 'nc_events', seasonTable: 'nc_seasons' },
      { name: 'bobsleigh', displayName: 'Bobsleigh', eventTable: 'bobsleigh_events', seasonTable: 'bobsleigh_seasons' },
      { name: 'luge', displayName: 'Luge', eventTable: 'luge_events', seasonTable: 'luge_seasons' },
      { name: 'skeleton', displayName: 'Skeleton', eventTable: 'skeleton_events', seasonTable: 'skeleton_seasons' },
      { name: 'speed-skating', displayName: 'Speed Skating', eventTable: 'speed_skating_events', seasonTable: 'speed_skating_seasons' }
    ];

    const allEvents = [];

    // Query each sport's events
    for (const sport of sportConfigs) {
      let season;
      if (sport.sportIdField) {
        season = get(`
          SELECT id FROM ${sport.seasonTable}
          WHERE world_id = ? AND ${sport.sportIdField} = ? AND status != 'completed'
          ORDER BY year_start DESC LIMIT 1
        `, [worldId, sport.sportIdValue]);
      } else {
        season = get(`
          SELECT id FROM ${sport.seasonTable}
          WHERE world_id = ? AND status != 'completed'
          ORDER BY year_start DESC LIMIT 1
        `, [worldId]);
      }

      if (season) {
        const events = all(`
          SELECT id, date, status, name, location, country
          FROM ${sport.eventTable}
          WHERE season_id = ?
        `, [season.id]);

        events.forEach(e => {
          if (e.date) {
            allEvents.push({
              id: e.id,
              sport: sport.name,
              sportDisplayName: sport.displayName,
              name: e.name,
              location: e.location,
              country: e.country,
              date: e.date,
              status: e.status,
              weekKey: getWeekKey(e.date),
              dayName: getShortDayName(e.date)
            });
          }
        });
      }
    }

    // Group events by week
    const eventsByWeek = {};
    allEvents.forEach(e => {
      if (!eventsByWeek[e.weekKey]) {
        eventsByWeek[e.weekKey] = [];
      }
      eventsByWeek[e.weekKey].push(e);
    });

    // Find current unlocked week (lowest week with incomplete events)
    const weekKeys = Object.keys(eventsByWeek).sort();
    let currentUnlockedWeek = null;

    for (const weekKey of weekKeys) {
      const weekEvents = eventsByWeek[weekKey];
      const hasIncomplete = weekEvents.some(e => e.status !== 'completed');

      if (hasIncomplete) {
        currentUnlockedWeek = weekKey;
        break;
      }
    }

    // If no incomplete weeks but have events, all are done - show last week
    if (!currentUnlockedWeek && weekKeys.length > 0) {
      currentUnlockedWeek = weekKeys[weekKeys.length - 1];
    }

    // Calculate week completion status
    const currentWeekEvents = currentUnlockedWeek ? eventsByWeek[currentUnlockedWeek] || [] : [];
    const completedInWeek = currentWeekEvents.filter(e => e.status === 'completed').length;
    const totalInWeek = currentWeekEvents.length;
    const isWeekComplete = completedInWeek === totalInWeek && totalInWeek > 0;

    // Group current week events by date for calendar display
    const eventsByDate = {};
    if (currentUnlockedWeek) {
      const { dates } = getWeekDateRange(currentUnlockedWeek);
      dates.forEach(date => {
        eventsByDate[date] = currentWeekEvents.filter(e => e.date === date);
      });
    }

    res.json({
      currentUnlockedWeek,
      isWeekComplete,
      completedInWeek,
      totalInWeek,
      currentWeekEvents: currentWeekEvents.map(e => ({
        id: e.id,
        sport: e.sport,
        sportDisplayName: e.sportDisplayName,
        name: e.name,
        location: e.location,
        country: e.country,
        date: e.date,
        dayName: e.dayName,
        status: e.status
      })),
      eventsByDate,
      allWeeks: weekKeys
    });
  } catch (error) {
    console.error('Error fetching week status:', error);
    res.status(500).json({ error: 'Failed to fetch week status' });
  }
});

// Generate seasons for all sports at once
router.post('/:id/generate-all-seasons', authMiddleware, (req, res) => {
  try {
    const { id: worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    const startYear = 2024;
    const endYear = 2025;
    const seasonName = `${startYear}/${endYear}`;

    // 1. Ski Jumping
    try {
      const existingSJ = get(`SELECT id FROM seasons WHERE world_id = ? AND sport_id = 'ski-jumping' AND status != 'completed'`, [worldId]);
      if (existingSJ) {
        results.skipped.push('Ski Jumping (active season exists)');
      } else {
        // Delete old seasons and events
        const oldSeasons = all(`SELECT id FROM seasons WHERE world_id = ? AND sport_id = 'ski-jumping'`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM season_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO seasons (id, world_id, sport_id, name, year_start, year_end, status, standings) VALUES (?, ?, 'ski-jumping', ?, ?, ?, 'not_started', '[]')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateSeasonCalendar(startYear, endYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          const initialResults = JSON.stringify({ status: 'not_started', qualifying: [], round1: [], round2: [], final: [] });
          run(`INSERT INTO season_events (id, season_id, event_index, name, location, country, hill_size, k_point, date, status, results, tournament) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.hillSize, event.kPoint, event.date, initialResults, event.tournament || null]);
        }
        results.created.push('Ski Jumping');
      }
    } catch (e) {
      results.errors.push(`Ski Jumping: ${e.message}`);
    }

    // 2. Biathlon
    try {
      const existingBI = get(`SELECT id FROM biathlon_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingBI) {
        results.skipped.push('Biathlon (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM biathlon_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM biathlon_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM biathlon_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO biathlon_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateBiathlonCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO biathlon_events (id, season_id, event_index, name, location, country, race_type, distance, shootings, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.raceType, event.distance, event.shootings, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Biathlon');
      }
    } catch (e) {
      results.errors.push(`Biathlon: ${e.message}`);
    }

    // 3. Cross-Country
    try {
      const existingXC = get(`SELECT id FROM xc_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingXC) {
        results.skipped.push('Cross-Country (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM xc_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM xc_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM xc_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO xc_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateXCCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO xc_events (id, season_id, event_index, name, location, country, race_type, distance, technique, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.raceType, event.distance, event.technique, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Cross-Country');
      }
    } catch (e) {
      results.errors.push(`Cross-Country: ${e.message}`);
    }

    // 4. Alpine
    try {
      const existingAL = get(`SELECT id FROM alpine_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingAL) {
        results.skipped.push('Alpine (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM alpine_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM alpine_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM alpine_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO alpine_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateAlpineCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO alpine_events (id, season_id, event_index, name, location, country, discipline, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.discipline, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Alpine');
      }
    } catch (e) {
      results.errors.push(`Alpine: ${e.message}`);
    }

    // 5. Nordic Combined
    try {
      const existingNC = get(`SELECT id FROM nc_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingNC) {
        results.skipped.push('Nordic Combined (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM nc_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM nc_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM nc_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO nc_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateNordicCombinedCalendar(startYear, endYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO nc_events (id, season_id, event_index, name, location, country, hill_size, k_point, xc_distance, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.event_index, event.name, event.location, event.country, event.hill_size, event.k_point, event.xc_distance, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Nordic Combined');
      }
    } catch (e) {
      results.errors.push(`Nordic Combined: ${e.message}`);
    }

    // 6. Bobsleigh
    try {
      const existingBOB = get(`SELECT id FROM bobsleigh_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingBOB) {
        results.skipped.push('Bobsleigh (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM bobsleigh_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM bobsleigh_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM bobsleigh_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO bobsleigh_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateBobsleighCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO bobsleigh_events (id, season_id, event_index, name, location, country, track_length, date, status, runs, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.trackLength || 1400, event.date, event.runs || 2, event.championship ? 1 : 0]);
        }
        results.created.push('Bobsleigh');
      }
    } catch (e) {
      results.errors.push(`Bobsleigh: ${e.message}`);
    }

    // 7. Luge
    try {
      const existingLUGE = get(`SELECT id FROM luge_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingLUGE) {
        results.skipped.push('Luge (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM luge_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM luge_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM luge_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO luge_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateLugeCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO luge_events (id, season_id, event_index, name, location, country, track_length, runs, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.trackLength || 1400, event.runs || 2, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Luge');
      }
    } catch (e) {
      results.errors.push(`Luge: ${e.message}`);
    }

    // 8. Skeleton
    try {
      const existingSKE = get(`SELECT id FROM skeleton_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingSKE) {
        results.skipped.push('Skeleton (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM skeleton_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM skeleton_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM skeleton_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO skeleton_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateSkeletonCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO skeleton_events (id, season_id, event_index, name, location, country, track_length, runs, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.trackLength || 1400, event.runs || 2, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Skeleton');
      }
    } catch (e) {
      results.errors.push(`Skeleton: ${e.message}`);
    }

    // 9. Speed Skating
    try {
      const existingSS = get(`SELECT id FROM speed_skating_seasons WHERE world_id = ? AND status != 'completed'`, [worldId]);
      if (existingSS) {
        results.skipped.push('Speed Skating (active season exists)');
      } else {
        const oldSeasons = all(`SELECT id FROM speed_skating_seasons WHERE world_id = ?`, [worldId]);
        for (const s of oldSeasons) {
          run('DELETE FROM speed_skating_events WHERE season_id = ?', [s.id]);
          run('DELETE FROM speed_skating_seasons WHERE id = ?', [s.id]);
        }

        const seasonId = uuidv4();
        run(`INSERT INTO speed_skating_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
          [seasonId, worldId, seasonName, startYear, endYear]);

        const calendar = generateSpeedSkatingCalendar(startYear);
        for (const event of calendar) {
          const eventId = uuidv4();
          run(`INSERT INTO speed_skating_events (id, season_id, event_index, name, location, country, distance, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
            [eventId, seasonId, event.eventIndex, event.name, event.location, event.country, event.distance, event.date, event.championship ? 1 : 0]);
        }
        results.created.push('Speed Skating');
      }
    } catch (e) {
      results.errors.push(`Speed Skating: ${e.message}`);
    }

    res.json({
      message: `Created ${results.created.length} seasons`,
      created: results.created,
      skipped: results.skipped,
      errors: results.errors
    });
  } catch (error) {
    console.error('Error generating all seasons:', error);
    res.status(500).json({ error: 'Failed to generate seasons' });
  }
});

// Reset and regenerate all seasons (deletes existing seasons first)
router.post('/:id/reset-all-seasons', authMiddleware, (req, res) => {
  try {
    const { id: worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Delete all existing seasons and events for all sports
    const sportTables = [
      { season: 'seasons', event: 'season_events', condition: "sport_id = 'ski-jumping'" },
      { season: 'biathlon_seasons', event: 'biathlon_events' },
      { season: 'xc_seasons', event: 'xc_events' },
      { season: 'alpine_seasons', event: 'alpine_events' },
      { season: 'nc_seasons', event: 'nc_events' },
      { season: 'bobsleigh_seasons', event: 'bobsleigh_events' },
      { season: 'luge_seasons', event: 'luge_events' },
      { season: 'skeleton_seasons', event: 'skeleton_events' },
      { season: 'speed_skating_seasons', event: 'speed_skating_events' }
    ];

    for (const sport of sportTables) {
      const condition = sport.condition ? `AND ${sport.condition}` : '';
      const seasons = all(`SELECT id FROM ${sport.season} WHERE world_id = ? ${condition}`, [worldId]);
      for (const s of seasons) {
        run(`DELETE FROM ${sport.event} WHERE season_id = ?`, [s.id]);
        run(`DELETE FROM ${sport.season} WHERE id = ?`, [s.id]);
      }
    }

    // Now generate all new seasons
    const startYear = 2024;
    const endYear = 2025;
    const seasonName = `${startYear}/${endYear}`;
    const created = [];

    // 1. Ski Jumping
    const sjSeasonId = uuidv4();
    run(`INSERT INTO seasons (id, world_id, sport_id, name, year_start, year_end, status, standings) VALUES (?, ?, 'ski-jumping', ?, ?, ?, 'not_started', '[]')`,
      [sjSeasonId, worldId, seasonName, startYear, endYear]);
    const sjCalendar = generateSeasonCalendar(startYear, endYear);
    for (const event of sjCalendar) {
      const eventId = uuidv4();
      const initialResults = JSON.stringify({ status: 'not_started', qualifying: [], round1: [], round2: [], final: [] });
      run(`INSERT INTO season_events (id, season_id, event_index, name, location, country, hill_size, k_point, date, status, results, tournament) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
        [eventId, sjSeasonId, event.eventIndex, event.name, event.location, event.country, event.hillSize, event.kPoint, event.date, initialResults, event.tournament || null]);
    }
    created.push('Ski Jumping');

    // 2. Biathlon
    const biSeasonId = uuidv4();
    run(`INSERT INTO biathlon_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [biSeasonId, worldId, seasonName, startYear, endYear]);
    const biCalendar = generateBiathlonCalendar(startYear);
    for (const event of biCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO biathlon_events (id, season_id, event_index, name, location, country, race_type, distance, shootings, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, biSeasonId, event.eventIndex, event.name, event.location, event.country, event.raceType, event.distance, event.shootings, event.date, event.championship ? 1 : 0]);
    }
    created.push('Biathlon');

    // 3. Cross-Country
    const xcSeasonId = uuidv4();
    run(`INSERT INTO xc_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [xcSeasonId, worldId, seasonName, startYear, endYear]);
    const xcCalendar = generateXCCalendar(startYear);
    for (const event of xcCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO xc_events (id, season_id, event_index, name, location, country, race_type, distance, technique, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, xcSeasonId, event.eventIndex, event.name, event.location, event.country, event.raceType, event.distance, event.technique, event.date, event.championship ? 1 : 0]);
    }
    created.push('Cross-Country');

    // 4. Alpine
    const alSeasonId = uuidv4();
    run(`INSERT INTO alpine_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [alSeasonId, worldId, seasonName, startYear, endYear]);
    const alCalendar = generateAlpineCalendar(startYear);
    for (const event of alCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO alpine_events (id, season_id, event_index, name, location, country, discipline, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, alSeasonId, event.eventIndex, event.name, event.location, event.country, event.discipline, event.date, event.championship ? 1 : 0]);
    }
    created.push('Alpine');

    // 5. Nordic Combined
    const ncSeasonId = uuidv4();
    run(`INSERT INTO nc_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [ncSeasonId, worldId, seasonName, startYear, endYear]);
    const ncCalendar = generateNordicCombinedCalendar(startYear, endYear);
    for (const event of ncCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO nc_events (id, season_id, event_index, name, location, country, hill_size, k_point, xc_distance, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, ncSeasonId, event.event_index, event.name, event.location, event.country, event.hill_size, event.k_point, event.xc_distance, event.date, event.championship ? 1 : 0]);
    }
    created.push('Nordic Combined');

    // 6. Bobsleigh
    const bobSeasonId = uuidv4();
    run(`INSERT INTO bobsleigh_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [bobSeasonId, worldId, seasonName, startYear, endYear]);
    const bobCalendar = generateBobsleighCalendar(startYear);
    for (const event of bobCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO bobsleigh_events (id, season_id, event_index, name, location, country, track_length, date, status, runs, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
        [eventId, bobSeasonId, event.eventIndex, event.name, event.location, event.country, event.trackLength || 1400, event.date, event.runs || 2, event.championship ? 1 : 0]);
    }
    created.push('Bobsleigh');

    // 7. Luge
    const lugeSeasonId = uuidv4();
    run(`INSERT INTO luge_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [lugeSeasonId, worldId, seasonName, startYear, endYear]);
    const lugeCalendar = generateLugeCalendar(startYear);
    for (const event of lugeCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO luge_events (id, season_id, event_index, name, location, country, track_length, runs, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, lugeSeasonId, event.eventIndex, event.name, event.location, event.country, event.trackLength || 1400, event.runs || 2, event.date, event.championship ? 1 : 0]);
    }
    created.push('Luge');

    // 8. Skeleton
    const skeSeasonId = uuidv4();
    run(`INSERT INTO skeleton_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [skeSeasonId, worldId, seasonName, startYear, endYear]);
    const skeCalendar = generateSkeletonCalendar(startYear);
    for (const event of skeCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO skeleton_events (id, season_id, event_index, name, location, country, track_length, runs, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, skeSeasonId, event.eventIndex, event.name, event.location, event.country, event.trackLength || 1400, event.runs || 2, event.date, event.championship ? 1 : 0]);
    }
    created.push('Skeleton');

    // 9. Speed Skating
    const ssSeasonId = uuidv4();
    run(`INSERT INTO speed_skating_seasons (id, world_id, name, year_start, year_end, status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      [ssSeasonId, worldId, seasonName, startYear, endYear]);
    const ssCalendar = generateSpeedSkatingCalendar(startYear);
    for (const event of ssCalendar) {
      const eventId = uuidv4();
      run(`INSERT INTO speed_skating_events (id, season_id, event_index, name, location, country, distance, date, status, championship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
        [eventId, ssSeasonId, event.eventIndex, event.name, event.location, event.country, event.distance, event.date, event.championship ? 1 : 0]);
    }
    created.push('Speed Skating');

    res.json({
      message: `Reset and created ${created.length} seasons`,
      created
    });
  } catch (error) {
    console.error('Error resetting all seasons:', error);
    res.status(500).json({ error: 'Failed to reset seasons' });
  }
});

module.exports = router;
