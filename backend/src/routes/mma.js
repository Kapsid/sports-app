const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const {
  WEIGHT_CLASSES,
  getWeightClassName,
  getWeightClasses,
  getRandomCity,
  getRandomTheme,
  generateVenueName,
  simulateFight,
  createFightCard,
  calculateRankings,
  calculateP4PRankings,
  generateRoster
} = require('../data/mmaSimulation');

const router = express.Router();

// Helper function to count previous fights between two fighters
function getPreviousFightCount(fighter1Id, fighter2Id) {
  const result = get(`
    SELECT COUNT(*) as count FROM mma_fights
    WHERE status = 'completed'
    AND ((fighter1_id = ? AND fighter2_id = ?) OR (fighter1_id = ? AND fighter2_id = ?))
  `, [fighter1Id, fighter2Id, fighter2Id, fighter1Id]);
  return result ? result.count : 0;
}

// ==================== ORGANIZATIONS ====================

// Get all organizations for current user
router.get('/organizations', authMiddleware, (req, res) => {
  try {
    const orgs = all(`
      SELECT o.*,
        (SELECT COUNT(*) FROM mma_fighters WHERE org_id = o.id) as fighter_count,
        (SELECT COUNT(*) FROM mma_events WHERE org_id = o.id) as event_count_actual
      FROM mma_organizations o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json({ organizations: orgs });
  } catch (error) {
    console.error('Error fetching MMA organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Get organization by ID
router.get('/organizations/:id', authMiddleware, (req, res) => {
  try {
    const org = get(
      'SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get fighter count
    const fighterCount = get('SELECT COUNT(*) as count FROM mma_fighters WHERE org_id = ?', [req.params.id]);

    // Get latest event
    const latestEvent = get(`
      SELECT * FROM mma_events
      WHERE org_id = ?
      ORDER BY event_number DESC
      LIMIT 1
    `, [req.params.id]);

    res.json({
      organization: {
        ...org,
        fighter_count: fighterCount.count,
        latest_event: latestEvent
      }
    });
  } catch (error) {
    console.error('Error fetching MMA organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// Create new organization
router.post('/organizations', authMiddleware, (req, res) => {
  try {
    const { name, short_name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const orgId = uuidv4();
    run(
      'INSERT INTO mma_organizations (id, user_id, name, short_name, description) VALUES (?, ?, ?, ?, ?)',
      [orgId, req.user.id, name, short_name || name.substring(0, 10), description || '']
    );

    const org = get('SELECT * FROM mma_organizations WHERE id = ?', [orgId]);
    res.status(201).json({ organization: org });
  } catch (error) {
    console.error('Error creating MMA organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Delete organization
router.delete('/organizations/:id', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete all related data
    const events = all('SELECT id FROM mma_events WHERE org_id = ?', [req.params.id]);
    for (const event of events) {
      run('DELETE FROM mma_fights WHERE event_id = ?', [event.id]);
    }
    run('DELETE FROM mma_events WHERE org_id = ?', [req.params.id]);
    run('DELETE FROM mma_fighters WHERE org_id = ?', [req.params.id]);
    run('DELETE FROM mma_organizations WHERE id = ?', [req.params.id]);

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting MMA organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// Generate random fighters for an organization
router.post('/organizations/:id/generate-fighters', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { fightersPerDivision = 10 } = req.body;
    const roster = generateRoster(fightersPerDivision);
    const insertedFighters = [];

    for (const fighter of roster) {
      const fighterId = uuidv4();
      run(`
        INSERT INTO mma_fighters (
          id, org_id, first_name, last_name, nickname, gender, weight_class,
          country_code, striking, grappling, wrestling, cardio, chin, power,
          status, ranking
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 999)
      `, [
        fighterId, req.params.id, fighter.first_name, fighter.last_name,
        fighter.nickname, fighter.gender, fighter.weight_class, fighter.country_code,
        fighter.striking, fighter.grappling, fighter.wrestling,
        fighter.cardio, fighter.chin, fighter.power
      ]);

      insertedFighters.push({
        id: fighterId,
        ...fighter,
        org_id: req.params.id,
        status: 'active',
        ranking: 999,
        wins: 0, losses: 0, draws: 0,
        ko_wins: 0, sub_wins: 0, dec_wins: 0,
        weight_class_name: getWeightClassName(fighter.weight_class, fighter.gender)
      });
    }

    res.status(201).json({
      message: `Generated ${insertedFighters.length} fighters`,
      count: insertedFighters.length,
      fighters: insertedFighters
    });
  } catch (error) {
    console.error('Error generating fighters:', error);
    res.status(500).json({ error: 'Failed to generate fighters' });
  }
});

// ==================== FIGHTERS ====================

// Get all fighters for an organization
router.get('/organizations/:id/fighters', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const fighters = all(`
      SELECT * FROM mma_fighters
      WHERE org_id = ?
      ORDER BY gender, weight_class, ranking, wins DESC
    `, [req.params.id]);

    // Add weight class name to each fighter
    const enrichedFighters = fighters.map(f => ({
      ...f,
      weight_class_name: getWeightClassName(f.weight_class, f.gender)
    }));

    res.json({ fighters: enrichedFighters });
  } catch (error) {
    console.error('Error fetching fighters:', error);
    res.status(500).json({ error: 'Failed to fetch fighters' });
  }
});

// Get single fighter
router.get('/fighters/:id', authMiddleware, (req, res) => {
  try {
    const fighter = get(`
      SELECT f.*, o.name as org_name, o.user_id
      FROM mma_fighters f
      JOIN mma_organizations o ON f.org_id = o.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!fighter || fighter.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Fighter not found' });
    }

    // Get fight history
    const fights = all(`
      SELECT f.*, e.name as event_name, e.event_number,
        f1.first_name as f1_first, f1.last_name as f1_last,
        f2.first_name as f2_first, f2.last_name as f2_last
      FROM mma_fights f
      JOIN mma_events e ON f.event_id = e.id
      JOIN mma_fighters f1 ON f.fighter1_id = f1.id
      JOIN mma_fighters f2 ON f.fighter2_id = f2.id
      WHERE (f.fighter1_id = ? OR f.fighter2_id = ?) AND f.status = 'completed'
      ORDER BY e.event_number DESC
    `, [req.params.id, req.params.id]);

    res.json({
      fighter: {
        ...fighter,
        weight_class_name: getWeightClassName(fighter.weight_class, fighter.gender)
      },
      fights
    });
  } catch (error) {
    console.error('Error fetching fighter:', error);
    res.status(500).json({ error: 'Failed to fetch fighter' });
  }
});

// Create new fighter
router.post('/organizations/:id/fighters', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const {
      first_name, last_name, nickname, gender, weight_class, country_code,
      striking, grappling, wrestling, cardio, chin, power
    } = req.body;

    if (!first_name || !last_name || !weight_class || !country_code) {
      return res.status(400).json({ error: 'First name, last name, weight class, and country are required' });
    }

    // Validate weight class
    const validWeights = getWeightClasses(gender || 'men').map(w => w.weight);
    if (!validWeights.includes(weight_class)) {
      return res.status(400).json({ error: 'Invalid weight class for gender' });
    }

    // Get current ranking (new fighters start at bottom)
    const currentCount = get(
      'SELECT COUNT(*) as count FROM mma_fighters WHERE org_id = ? AND gender = ? AND weight_class = ?',
      [req.params.id, gender || 'men', weight_class]
    );

    const fighterId = uuidv4();
    run(`
      INSERT INTO mma_fighters (
        id, org_id, first_name, last_name, nickname, gender, weight_class, country_code,
        striking, grappling, wrestling, cardio, chin, power, ranking
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      fighterId, req.params.id, first_name, last_name, nickname || null,
      gender || 'men', weight_class, country_code.toUpperCase(),
      striking || 70, grappling || 70, wrestling || 70,
      cardio || 70, chin || 70, power || 70,
      currentCount.count + 1
    ]);

    const fighter = get('SELECT * FROM mma_fighters WHERE id = ?', [fighterId]);
    res.status(201).json({
      fighter: {
        ...fighter,
        weight_class_name: getWeightClassName(fighter.weight_class, fighter.gender)
      }
    });
  } catch (error) {
    console.error('Error creating fighter:', error);
    res.status(500).json({ error: 'Failed to create fighter' });
  }
});

// Update fighter
router.put('/fighters/:id', authMiddleware, (req, res) => {
  try {
    const fighter = get(`
      SELECT f.*, o.user_id
      FROM mma_fighters f
      JOIN mma_organizations o ON f.org_id = o.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!fighter || fighter.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Fighter not found' });
    }

    const {
      first_name, last_name, nickname, gender, weight_class, country_code,
      striking, grappling, wrestling, cardio, chin, power, status
    } = req.body;

    run(`
      UPDATE mma_fighters SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        nickname = ?,
        gender = COALESCE(?, gender),
        weight_class = COALESCE(?, weight_class),
        country_code = COALESCE(?, country_code),
        striking = COALESCE(?, striking),
        grappling = COALESCE(?, grappling),
        wrestling = COALESCE(?, wrestling),
        cardio = COALESCE(?, cardio),
        chin = COALESCE(?, chin),
        power = COALESCE(?, power),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      first_name, last_name, nickname, gender, weight_class,
      country_code ? country_code.toUpperCase() : null,
      striking, grappling, wrestling, cardio, chin, power, status,
      req.params.id
    ]);

    const updatedFighter = get('SELECT * FROM mma_fighters WHERE id = ?', [req.params.id]);
    res.json({
      fighter: {
        ...updatedFighter,
        weight_class_name: getWeightClassName(updatedFighter.weight_class, updatedFighter.gender)
      }
    });
  } catch (error) {
    console.error('Error updating fighter:', error);
    res.status(500).json({ error: 'Failed to update fighter' });
  }
});

// Delete fighter
router.delete('/fighters/:id', authMiddleware, (req, res) => {
  try {
    const fighter = get(`
      SELECT f.*, o.user_id
      FROM mma_fighters f
      JOIN mma_organizations o ON f.org_id = o.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!fighter || fighter.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Fighter not found' });
    }

    // Check if fighter has any fights
    const fightCount = get(
      'SELECT COUNT(*) as count FROM mma_fights WHERE fighter1_id = ? OR fighter2_id = ?',
      [req.params.id, req.params.id]
    );

    if (fightCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete fighter with fight history' });
    }

    run('DELETE FROM mma_fighters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fighter deleted successfully' });
  } catch (error) {
    console.error('Error deleting fighter:', error);
    res.status(500).json({ error: 'Failed to delete fighter' });
  }
});

// ==================== EVENTS ====================

// Get all events for an organization
router.get('/organizations/:id/events', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const events = all(`
      SELECT e.*,
        (SELECT COUNT(*) FROM mma_fights WHERE event_id = e.id) as fight_count
      FROM mma_events e
      WHERE e.org_id = ?
      ORDER BY e.event_number DESC
    `, [req.params.id]);

    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by ID
router.get('/events/:id', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, o.name as org_name, o.short_name as org_short, o.user_id
      FROM mma_events e
      JOIN mma_organizations o ON e.org_id = o.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get fights with fighter details
    const fights = all(`
      SELECT f.*,
        f1.first_name as f1_first, f1.last_name as f1_last, f1.nickname as f1_nickname,
        f1.country_code as f1_country, f1.ranking as f1_ranking, f1.is_champion as f1_champion,
        f1.wins as f1_wins, f1.losses as f1_losses, f1.draws as f1_draws,
        f1.striking as f1_striking, f1.grappling as f1_grappling, f1.wrestling as f1_wrestling,
        f1.cardio as f1_cardio, f1.chin as f1_chin, f1.power as f1_power,
        f2.first_name as f2_first, f2.last_name as f2_last, f2.nickname as f2_nickname,
        f2.country_code as f2_country, f2.ranking as f2_ranking, f2.is_champion as f2_champion,
        f2.wins as f2_wins, f2.losses as f2_losses, f2.draws as f2_draws,
        f2.striking as f2_striking, f2.grappling as f2_grappling, f2.wrestling as f2_wrestling,
        f2.cardio as f2_cardio, f2.chin as f2_chin, f2.power as f2_power
      FROM mma_fights f
      JOIN mma_fighters f1 ON f.fighter1_id = f1.id
      JOIN mma_fighters f2 ON f.fighter2_id = f2.id
      WHERE f.event_id = ?
      ORDER BY f.card_position DESC, f.fight_order DESC
    `, [req.params.id]);

    // Enrich fights with weight class names
    const enrichedFights = fights.map(f => ({
      ...f,
      weight_class_name: getWeightClassName(f.weight_class, 'men'),
      fight_stats: f.fight_stats ? JSON.parse(f.fight_stats) : null
    }));

    res.json({ event, fights: enrichedFights });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Generate new event
router.post('/organizations/:id/events', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get all active fighters
    const fighters = all('SELECT * FROM mma_fighters WHERE org_id = ? AND status = ?', [req.params.id, 'active']);

    if (fighters.length < 20) {
      return res.status(400).json({
        error: `Need at least 20 active fighters to generate an event. You have ${fighters.length}.`
      });
    }

    // Check for unfinished events
    const unfinishedEvent = get(
      'SELECT * FROM mma_events WHERE org_id = ? AND status != ?',
      [req.params.id, 'completed']
    );
    if (unfinishedEvent) {
      return res.status(400).json({
        error: 'Complete the current event before creating a new one'
      });
    }

    // Get event count
    const eventCount = org.event_count || 0;
    const newEventNumber = eventCount + 1;

    // Generate location and theme
    const location = getRandomCity();
    const theme = getRandomTheme();
    const venue = generateVenueName(location.city);

    // Create fight card first to get main event for naming
    const { fights: fightCard, mainEvent } = createFightCard(fighters, eventCount);

    if (fightCard.length === 0) {
      return res.status(400).json({
        error: 'Could not create fight card. Need more fighters in different weight classes.'
      });
    }

    // Generate event name with main event fighters
    let eventName = `${org.short_name || org.name} ${newEventNumber}`;
    if (mainEvent) {
      const f1Last = mainEvent.fighter1.last_name;
      const f2Last = mainEvent.fighter2.last_name;

      // Check for rematch - count previous fights between these two fighters
      const previousFights = getPreviousFightCount(mainEvent.fighter1.id, mainEvent.fighter2.id);
      const fightNumber = previousFights + 1; // Current fight will be the next in the series

      if (fightNumber > 1) {
        eventName = `${org.short_name || org.name} ${newEventNumber}: ${f1Last} vs ${f2Last} ${fightNumber}`;
      } else {
        eventName = `${org.short_name || org.name} ${newEventNumber}: ${f1Last} vs ${f2Last}`;
      }
    }

    // Create event
    const eventId = uuidv4();

    run(`
      INSERT INTO mma_events (id, org_id, event_number, name, city, country, venue, theme_color, theme_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [eventId, req.params.id, newEventNumber, eventName, location.city, location.country, venue, theme.color, theme.name]);

    // Insert fights
    for (const fight of fightCard) {
      const fightId = uuidv4();
      run(`
        INSERT INTO mma_fights (
          id, event_id, fighter1_id, fighter2_id, card_position, fight_order,
          is_title_fight, weight_class, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      `, [
        fightId, eventId, fight.fighter1.id, fight.fighter2.id,
        fight.cardPosition, fight.fightOrder, fight.isTitle ? 1 : 0, fight.weightClass
      ]);
    }

    // Update organization event count
    run('UPDATE mma_organizations SET event_count = ?, updated_at = datetime("now") WHERE id = ?',
      [newEventNumber, req.params.id]);

    const event = get('SELECT * FROM mma_events WHERE id = ?', [eventId]);
    res.status(201).json({ event, fight_count: fightCard.length });
  } catch (error) {
    console.error('Error generating event:', error);
    res.status(500).json({ error: 'Failed to generate event' });
  }
});

// ==================== FIGHTS ====================

// Simulate single fight
router.post('/fights/:id/simulate', authMiddleware, (req, res) => {
  try {
    const fight = get(`
      SELECT f.*, e.org_id, o.user_id
      FROM mma_fights f
      JOIN mma_events e ON f.event_id = e.id
      JOIN mma_organizations o ON e.org_id = o.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!fight || fight.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Fight not found' });
    }

    if (fight.status === 'completed') {
      return res.status(400).json({ error: 'Fight already completed' });
    }

    const { detailed } = req.body;

    // Get fighters
    const fighter1 = get('SELECT * FROM mma_fighters WHERE id = ?', [fight.fighter1_id]);
    const fighter2 = get('SELECT * FROM mma_fighters WHERE id = ?', [fight.fighter2_id]);

    // Simulate fight
    const result = simulateFight(fighter1, fighter2, fight.is_title_fight, detailed);

    // Update fight result
    run(`
      UPDATE mma_fights SET
        winner_id = ?,
        method = ?,
        round = ?,
        time = ?,
        fight_stats = ?,
        status = 'completed'
      WHERE id = ?
    `, [result.winnerId, result.method, result.round, result.time, JSON.stringify(result.stats), req.params.id]);

    // Update fighter records
    const isKO = result.method.includes('KO') || result.method.includes('TKO');
    const isSub = result.method.includes('Choke') || result.method.includes('bar') || result.method.includes('Crank') || result.method.includes('Hook') || result.method.includes('Triangle') || result.method.includes('Kimura') || result.method.includes('Americana');
    const isDec = result.method.includes('Decision');

    if (result.winnerId === fighter1.id) {
      // Winner: increment wins, win_streak, reset loss_streak
      run(`UPDATE mma_fighters SET wins = wins + 1, ko_wins = ko_wins + ?, sub_wins = sub_wins + ?, dec_wins = dec_wins + ?, win_streak = win_streak + 1, loss_streak = 0 WHERE id = ?`,
        [isKO ? 1 : 0, isSub ? 1 : 0, isDec ? 1 : 0, fighter1.id]);
      // Loser: increment losses, loss_streak, reset win_streak
      run('UPDATE mma_fighters SET losses = losses + 1, loss_streak = loss_streak + 1, win_streak = 0 WHERE id = ?', [fighter2.id]);

      // Title change
      if (fight.is_title_fight) {
        if (fighter2.is_champion) {
          // Title changes hands
          run('UPDATE mma_fighters SET is_champion = 0 WHERE id = ?', [fighter2.id]);
          run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter1.id]);
        } else if (fighter1.is_champion) {
          // Successful title defense
          run('UPDATE mma_fighters SET title_defenses = title_defenses + 1 WHERE id = ?', [fighter1.id]);
        } else {
          // Vacant title fight - winner becomes champion
          run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter1.id]);
        }
      }
    } else {
      // Winner: increment wins, win_streak, reset loss_streak
      run(`UPDATE mma_fighters SET wins = wins + 1, ko_wins = ko_wins + ?, sub_wins = sub_wins + ?, dec_wins = dec_wins + ?, win_streak = win_streak + 1, loss_streak = 0 WHERE id = ?`,
        [isKO ? 1 : 0, isSub ? 1 : 0, isDec ? 1 : 0, fighter2.id]);
      // Loser: increment losses, loss_streak, reset win_streak
      run('UPDATE mma_fighters SET losses = losses + 1, loss_streak = loss_streak + 1, win_streak = 0 WHERE id = ?', [fighter1.id]);

      // Title change
      if (fight.is_title_fight) {
        if (fighter1.is_champion) {
          // Title changes hands
          run('UPDATE mma_fighters SET is_champion = 0 WHERE id = ?', [fighter1.id]);
          run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter2.id]);
        } else if (fighter2.is_champion) {
          // Successful title defense
          run('UPDATE mma_fighters SET title_defenses = title_defenses + 1 WHERE id = ?', [fighter2.id]);
        } else {
          // Vacant title fight - winner becomes champion
          run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter2.id]);
        }
      }
    }

    // Check if event is complete
    const remainingFights = get(
      'SELECT COUNT(*) as count FROM mma_fights WHERE event_id = ? AND status != ?',
      [fight.event_id, 'completed']
    );

    if (remainingFights.count === 0) {
      run('UPDATE mma_events SET status = ? WHERE id = ?', ['completed', fight.event_id]);

      // Update rankings
      const allFighters = all('SELECT * FROM mma_fighters WHERE org_id = ?', [fight.org_id]);
      const rankingUpdates = calculateRankings(allFighters);
      for (const update of rankingUpdates) {
        run('UPDATE mma_fighters SET ranking = ? WHERE id = ?', [update.ranking, update.id]);
      }
    }

    res.json({ result, eventComplete: remainingFights.count === 0 });
  } catch (error) {
    console.error('Error simulating fight:', error);
    res.status(500).json({ error: 'Failed to simulate fight' });
  }
});

// Simulate all fights in an event
router.post('/events/:id/simulate-all', authMiddleware, (req, res) => {
  try {
    const event = get(`
      SELECT e.*, o.user_id
      FROM mma_events e
      JOIN mma_organizations o ON e.org_id = o.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (!event || event.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all scheduled fights
    const fights = all(`
      SELECT * FROM mma_fights
      WHERE event_id = ? AND status = 'scheduled'
      ORDER BY card_position, fight_order
    `, [req.params.id]);

    const results = [];

    for (const fight of fights) {
      const fighter1 = get('SELECT * FROM mma_fighters WHERE id = ?', [fight.fighter1_id]);
      const fighter2 = get('SELECT * FROM mma_fighters WHERE id = ?', [fight.fighter2_id]);

      const result = simulateFight(fighter1, fighter2, fight.is_title_fight, false);

      // Update fight
      run(`
        UPDATE mma_fights SET
          winner_id = ?,
          method = ?,
          round = ?,
          time = ?,
          fight_stats = ?,
          status = 'completed'
        WHERE id = ?
      `, [result.winnerId, result.method, result.round, result.time, JSON.stringify(result.stats), fight.id]);

      // Update fighter records
      const isKO = result.method.includes('KO') || result.method.includes('TKO');
      const isSub = result.method.includes('Choke') || result.method.includes('bar') || result.method.includes('Crank') || result.method.includes('Hook') || result.method.includes('Triangle') || result.method.includes('Kimura') || result.method.includes('Americana');
      const isDec = result.method.includes('Decision');

      if (result.winnerId === fighter1.id) {
        // Winner: increment wins, win_streak, reset loss_streak
        run(`UPDATE mma_fighters SET wins = wins + 1, ko_wins = ko_wins + ?, sub_wins = sub_wins + ?, dec_wins = dec_wins + ?, win_streak = win_streak + 1, loss_streak = 0 WHERE id = ?`,
          [isKO ? 1 : 0, isSub ? 1 : 0, isDec ? 1 : 0, fighter1.id]);
        // Loser: increment losses, loss_streak, reset win_streak
        run('UPDATE mma_fighters SET losses = losses + 1, loss_streak = loss_streak + 1, win_streak = 0 WHERE id = ?', [fighter2.id]);

        if (fight.is_title_fight) {
          if (fighter2.is_champion) {
            run('UPDATE mma_fighters SET is_champion = 0 WHERE id = ?', [fighter2.id]);
            run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter1.id]);
          } else if (fighter1.is_champion) {
            run('UPDATE mma_fighters SET title_defenses = title_defenses + 1 WHERE id = ?', [fighter1.id]);
          } else {
            // Vacant title fight
            run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter1.id]);
          }
        }
      } else {
        // Winner: increment wins, win_streak, reset loss_streak
        run(`UPDATE mma_fighters SET wins = wins + 1, ko_wins = ko_wins + ?, sub_wins = sub_wins + ?, dec_wins = dec_wins + ?, win_streak = win_streak + 1, loss_streak = 0 WHERE id = ?`,
          [isKO ? 1 : 0, isSub ? 1 : 0, isDec ? 1 : 0, fighter2.id]);
        // Loser: increment losses, loss_streak, reset win_streak
        run('UPDATE mma_fighters SET losses = losses + 1, loss_streak = loss_streak + 1, win_streak = 0 WHERE id = ?', [fighter1.id]);

        if (fight.is_title_fight) {
          if (fighter1.is_champion) {
            run('UPDATE mma_fighters SET is_champion = 0 WHERE id = ?', [fighter1.id]);
            run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter2.id]);
          } else if (fighter2.is_champion) {
            run('UPDATE mma_fighters SET title_defenses = title_defenses + 1 WHERE id = ?', [fighter2.id]);
          } else {
            // Vacant title fight
            run('UPDATE mma_fighters SET is_champion = 1, title_defenses = 0, title_reigns = title_reigns + 1 WHERE id = ?', [fighter2.id]);
          }
        }
      }

      results.push({
        fightId: fight.id,
        ...result
      });
    }

    // Mark event as complete
    run('UPDATE mma_events SET status = ? WHERE id = ?', ['completed', req.params.id]);

    // Update rankings
    const allFighters = all('SELECT * FROM mma_fighters WHERE org_id = ?', [event.org_id]);
    const rankingUpdates = calculateRankings(allFighters);
    for (const update of rankingUpdates) {
      run('UPDATE mma_fighters SET ranking = ? WHERE id = ?', [update.ranking, update.id]);
    }

    res.json({ results, eventComplete: true });
  } catch (error) {
    console.error('Error simulating event:', error);
    res.status(500).json({ error: 'Failed to simulate event' });
  }
});

// ==================== RANKINGS ====================

// Get rankings for organization
router.get('/organizations/:id/rankings', authMiddleware, (req, res) => {
  try {
    const org = get('SELECT * FROM mma_organizations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const fighters = all(`
      SELECT * FROM mma_fighters
      WHERE org_id = ? AND status = 'active'
      ORDER BY gender, weight_class, ranking
    `, [req.params.id]);

    // Group by division
    const divisions = {};
    for (const fighter of fighters) {
      const key = `${fighter.gender}_${fighter.weight_class}`;
      if (!divisions[key]) {
        divisions[key] = {
          gender: fighter.gender,
          weight_class: fighter.weight_class,
          weight_class_name: getWeightClassName(fighter.weight_class, fighter.gender),
          fighters: []
        };
      }
      divisions[key].fighters.push({
        ...fighter,
        weight_class_name: getWeightClassName(fighter.weight_class, fighter.gender)
      });
    }

    // Calculate P4P rankings
    const p4pRankings = calculateP4PRankings(fighters);

    res.json({
      rankings: Object.values(divisions),
      p4pRankings: p4pRankings.map(f => ({
        ...f,
        weight_class_name: getWeightClassName(f.weight_class, f.gender)
      }))
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// ==================== WEIGHT CLASSES ====================

// Get weight classes
router.get('/weight-classes', (req, res) => {
  res.json({
    men: WEIGHT_CLASSES.men,
    women: WEIGHT_CLASSES.women
  });
});

module.exports = router;
