const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { nationalNames, countryDistribution, countryNames } = require('../data/skiJumpingNames');

const router = express.Router();

// Helper function to generate random skill value
function randomSkill(min = 50, max = 95) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate a random jumper for a country
function generateJumper(countryCode, worldId) {
  const names = nationalNames[countryCode];
  if (!names) {
    throw new Error(`No names data for country: ${countryCode}`);
  }

  const firstName = names.firstNames[Math.floor(Math.random() * names.firstNames.length)];
  const lastName = names.lastNames[Math.floor(Math.random() * names.lastNames.length)];

  // Generate skills with some variance
  // Better nations tend to have higher base skills
  const topNations = ['NOR', 'AUT', 'GER', 'POL', 'JPN', 'SLO'];
  const midNations = ['SUI', 'FIN', 'CZE'];

  let skillBase, skillVariance;
  if (topNations.includes(countryCode)) {
    skillBase = 70;
    skillVariance = 25;
  } else if (midNations.includes(countryCode)) {
    skillBase = 60;
    skillVariance = 30;
  } else {
    skillBase = 50;
    skillVariance = 35;
  }

  return {
    id: uuidv4(),
    world_id: worldId,
    first_name: firstName,
    last_name: lastName,
    country: countryCode,
    skill_jumping: Math.min(99, skillBase + Math.floor(Math.random() * skillVariance)),
    skill_flight: Math.min(99, skillBase + Math.floor(Math.random() * skillVariance)),
    skill_landing: Math.min(99, skillBase + Math.floor(Math.random() * skillVariance)),
    consistency: Math.min(99, skillBase + Math.floor(Math.random() * skillVariance)),
    form: Math.min(99, 60 + Math.floor(Math.random() * 35))
  };
}

// Get all jumpers for a world
router.get('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    // Verify world belongs to user
    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const jumpers = all(
      'SELECT * FROM jumpers WHERE world_id = ? ORDER BY country, last_name, first_name',
      [worldId]
    );

    res.json({ jumpers, countryNames });
  } catch (error) {
    console.error('Error fetching jumpers:', error);
    res.status(500).json({ error: 'Failed to fetch jumpers' });
  }
});

// Generate initial jumpers for a world (80 jumpers)
router.post('/world/:worldId/generate', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    // Verify world belongs to user
    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Check if jumpers already exist
    const existingJumpers = all('SELECT id FROM jumpers WHERE world_id = ?', [worldId]);
    if (existingJumpers.length > 0) {
      return res.status(400).json({ error: 'Jumpers already generated for this world' });
    }

    // Generate jumpers based on country distribution
    const generatedJumpers = [];
    const usedNames = new Set();

    for (const [countryCode, count] of Object.entries(countryDistribution)) {
      for (let i = 0; i < count; i++) {
        let jumper;
        let attempts = 0;

        // Avoid duplicate names
        do {
          jumper = generateJumper(countryCode, worldId);
          const fullName = `${jumper.first_name} ${jumper.last_name}`;
          if (!usedNames.has(fullName)) {
            usedNames.add(fullName);
            break;
          }
          attempts++;
        } while (attempts < 10);

        // Insert into database
        run(
          `INSERT INTO jumpers (id, world_id, first_name, last_name, country, skill_jumping, skill_flight, skill_landing, consistency, form)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [jumper.id, jumper.world_id, jumper.first_name, jumper.last_name, jumper.country,
           jumper.skill_jumping, jumper.skill_flight, jumper.skill_landing, jumper.consistency, jumper.form]
        );

        generatedJumpers.push(jumper);
      }
    }

    res.status(201).json({
      message: `Generated ${generatedJumpers.length} jumpers`,
      jumpers: generatedJumpers,
      countryNames
    });
  } catch (error) {
    console.error('Error generating jumpers:', error);
    res.status(500).json({ error: 'Failed to generate jumpers' });
  }
});

// Get single jumper
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const jumper = get(`
      SELECT j.* FROM jumpers j
      INNER JOIN worlds w ON j.world_id = w.id
      WHERE j.id = ? AND w.user_id = ?
    `, [req.params.id, req.user.id]);

    if (!jumper) {
      return res.status(404).json({ error: 'Jumper not found' });
    }

    res.json({ jumper, countryNames });
  } catch (error) {
    console.error('Error fetching jumper:', error);
    res.status(500).json({ error: 'Failed to fetch jumper' });
  }
});

// Create new jumper
router.post('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { first_name, last_name, country } = req.body;

    // Verify world belongs to user
    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    if (!first_name || !last_name || !country) {
      return res.status(400).json({ error: 'First name, last name, and country are required' });
    }

    // Validate country code
    if (!countryNames[country]) {
      return res.status(400).json({ error: 'Invalid country code' });
    }

    const id = uuidv4();
    const skills = {
      skill_jumping: req.body.skill_jumping || 70,
      skill_flight: req.body.skill_flight || 70,
      skill_landing: req.body.skill_landing || 70,
      consistency: req.body.consistency || 70,
      form: req.body.form || 70
    };
    const team_id = req.body.team_id || null;

    run(
      `INSERT INTO jumpers (id, world_id, first_name, last_name, country, skill_jumping, skill_flight, skill_landing, consistency, form, team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, worldId, first_name, last_name, country, skills.skill_jumping, skills.skill_flight,
       skills.skill_landing, skills.consistency, skills.form, team_id]
    );

    const jumper = get('SELECT * FROM jumpers WHERE id = ?', [id]);
    res.status(201).json({ jumper });
  } catch (error) {
    console.error('Error creating jumper:', error);
    res.status(500).json({ error: 'Failed to create jumper' });
  }
});

// Update jumper
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { first_name, last_name, country, skill_jumping, skill_flight, skill_landing, consistency, form, team_id } = req.body;

    // Verify jumper belongs to user's world
    const jumper = get(`
      SELECT j.* FROM jumpers j
      INNER JOIN worlds w ON j.world_id = w.id
      WHERE j.id = ? AND w.user_id = ?
    `, [req.params.id, req.user.id]);

    if (!jumper) {
      return res.status(404).json({ error: 'Jumper not found' });
    }

    // Validate country if provided
    if (country && !countryNames[country]) {
      return res.status(400).json({ error: 'Invalid country code' });
    }

    run(
      `UPDATE jumpers SET
        first_name = ?,
        last_name = ?,
        country = ?,
        skill_jumping = ?,
        skill_flight = ?,
        skill_landing = ?,
        consistency = ?,
        form = ?,
        team_id = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        first_name || jumper.first_name,
        last_name || jumper.last_name,
        country || jumper.country,
        skill_jumping !== undefined ? skill_jumping : jumper.skill_jumping,
        skill_flight !== undefined ? skill_flight : jumper.skill_flight,
        skill_landing !== undefined ? skill_landing : jumper.skill_landing,
        consistency !== undefined ? consistency : jumper.consistency,
        form !== undefined ? form : jumper.form,
        team_id !== undefined ? (team_id || null) : jumper.team_id,
        req.params.id
      ]
    );

    const updatedJumper = get('SELECT * FROM jumpers WHERE id = ?', [req.params.id]);
    res.json({ jumper: updatedJumper });
  } catch (error) {
    console.error('Error updating jumper:', error);
    res.status(500).json({ error: 'Failed to update jumper' });
  }
});

// Delete jumper
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    // Verify jumper belongs to user's world
    const jumper = get(`
      SELECT j.* FROM jumpers j
      INNER JOIN worlds w ON j.world_id = w.id
      WHERE j.id = ? AND w.user_id = ?
    `, [req.params.id, req.user.id]);

    if (!jumper) {
      return res.status(404).json({ error: 'Jumper not found' });
    }

    run('DELETE FROM jumpers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Jumper deleted successfully' });
  } catch (error) {
    console.error('Error deleting jumper:', error);
    res.status(500).json({ error: 'Failed to delete jumper' });
  }
});

// Get available countries
router.get('/data/countries', authMiddleware, (req, res) => {
  res.json({ countries: countryNames });
});

// Delete all jumpers for a world
router.delete('/world/:worldId/all', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    // Verify world belongs to user
    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Delete all jumpers for this world
    run('DELETE FROM jumpers WHERE world_id = ?', [worldId]);

    res.json({ message: 'All jumpers deleted successfully' });
  } catch (error) {
    console.error('Error deleting all jumpers:', error);
    res.status(500).json({ error: 'Failed to delete jumpers' });
  }
});

module.exports = router;
