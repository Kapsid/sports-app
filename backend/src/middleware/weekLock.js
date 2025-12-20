/**
 * Week Lock Middleware
 * Validates that an event can be simulated based on global week locking rules.
 * Events in Week N+1 cannot be simulated until ALL events in Week N are completed across ALL sports.
 */

const { get, all } = require('../config/database');
const { getWeekKey } = require('../utils/weekUtils');

// Sport configurations for querying events
const sportConfigs = [
  { name: 'ski-jumping', eventTable: 'season_events', seasonTable: 'seasons', sportIdField: 'sport_id', sportIdValue: 'ski-jumping' },
  { name: 'biathlon', eventTable: 'biathlon_events', seasonTable: 'biathlon_seasons' },
  { name: 'cross-country', eventTable: 'xc_events', seasonTable: 'xc_seasons' },
  { name: 'alpine', eventTable: 'alpine_events', seasonTable: 'alpine_seasons' },
  { name: 'nordic-combined', eventTable: 'nc_events', seasonTable: 'nc_seasons' },
  { name: 'bobsleigh', eventTable: 'bobsleigh_events', seasonTable: 'bobsleigh_seasons' },
  { name: 'luge', eventTable: 'luge_events', seasonTable: 'luge_seasons' },
  { name: 'skeleton', eventTable: 'skeleton_events', seasonTable: 'skeleton_seasons' },
  { name: 'speed-skating', eventTable: 'speed_skating_events', seasonTable: 'speed_skating_seasons' }
];

/**
 * Get the current unlocked week for a world
 * @param {string} worldId
 * @returns {{ currentUnlockedWeek: string|null, remainingEvents: Array }}
 */
function getCurrentUnlockedWeek(worldId) {
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
            name: e.name,
            location: e.location,
            country: e.country,
            date: e.date,
            status: e.status,
            weekKey: getWeekKey(e.date)
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
  let remainingEvents = [];

  for (const weekKey of weekKeys) {
    const weekEvents = eventsByWeek[weekKey];
    const incompleteEvents = weekEvents.filter(e => e.status !== 'completed');

    if (incompleteEvents.length > 0) {
      currentUnlockedWeek = weekKey;
      remainingEvents = incompleteEvents.map(e => ({
        id: e.id,
        sport: e.sport,
        name: e.name,
        location: e.location
      }));
      break;
    }
  }

  // If no incomplete weeks but have events, all are done
  if (!currentUnlockedWeek && weekKeys.length > 0) {
    currentUnlockedWeek = weekKeys[weekKeys.length - 1];
  }

  return { currentUnlockedWeek, remainingEvents };
}

/**
 * Creates middleware to validate week locking before simulation
 * @param {string} eventTable - The event table name (e.g., 'season_events', 'biathlon_events')
 * @param {string} seasonTable - The season table name (e.g., 'seasons', 'biathlon_seasons')
 * @returns {Function} Express middleware
 */
function validateWeekLock(eventTable, seasonTable) {
  return (req, res, next) => {
    try {
      const { eventId } = req.params;

      // Get event with its date and world_id
      const event = get(`
        SELECT e.*, s.world_id
        FROM ${eventTable} e
        INNER JOIN ${seasonTable} s ON e.season_id = s.id
        WHERE e.id = ?
      `, [eventId]);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (!event.date) {
        // If no date, allow (shouldn't happen)
        req.event = event;
        return next();
      }

      const eventWeekKey = getWeekKey(event.date);
      const worldId = event.world_id;

      // Get current unlocked week for the world
      const { currentUnlockedWeek, remainingEvents } = getCurrentUnlockedWeek(worldId);

      // If no current week (no events), allow
      if (!currentUnlockedWeek) {
        req.event = event;
        req.weekStatus = { currentUnlockedWeek: null, remainingEvents: [] };
        return next();
      }

      // Check if event's week is AFTER the current unlocked week (locked)
      if (eventWeekKey > currentUnlockedWeek) {
        return res.status(403).json({
          error: 'Week locked',
          message: `Complete all events in ${currentUnlockedWeek} before simulating ${eventWeekKey}`,
          currentUnlockedWeek,
          eventWeek: eventWeekKey,
          remainingEvents: remainingEvents.slice(0, 5) // Limit to 5 for brevity
        });
      }

      // Event is in current or past week - allow
      req.event = event;
      req.weekStatus = { currentUnlockedWeek, remainingEvents };
      next();
    } catch (error) {
      console.error('Week lock validation error:', error);
      res.status(500).json({ error: 'Failed to validate week lock' });
    }
  };
}

module.exports = {
  validateWeekLock,
  getCurrentUnlockedWeek
};
