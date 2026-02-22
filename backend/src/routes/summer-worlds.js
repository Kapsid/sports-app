const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all summer sports worlds for current user
router.get('/', authMiddleware, (req, res) => {
  try {
    const worlds = all(`
      SELECT *
      FROM summer_worlds
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json({ worlds });
  } catch (error) {
    console.error('Error fetching summer worlds:', error);
    res.status(500).json({ error: 'Failed to fetch worlds' });
  }
});

// Get world by ID
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const world = get(
      'SELECT * FROM summer_worlds WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    res.json({ world });
  } catch (error) {
    console.error('Error fetching summer world:', error);
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
      'INSERT INTO summer_worlds (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [worldId, req.user.id, name, description || '']
    );

    const world = get('SELECT * FROM summer_worlds WHERE id = ?', [worldId]);
    res.status(201).json({ world });
  } catch (error) {
    console.error('Error creating summer world:', error);
    res.status(500).json({ error: 'Failed to create world' });
  }
});

// Update world
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    const world = get('SELECT * FROM summer_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run(
      'UPDATE summer_worlds SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || world.name, description !== undefined ? description : world.description, req.params.id]
    );

    const updatedWorld = get('SELECT * FROM summer_worlds WHERE id = ?', [req.params.id]);
    res.json({ world: updatedWorld });
  } catch (error) {
    console.error('Error updating summer world:', error);
    res.status(500).json({ error: 'Failed to update world' });
  }
});

// Delete world
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM summer_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    run('DELETE FROM summer_worlds WHERE id = ?', [req.params.id]);
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting summer world:', error);
    res.status(500).json({ error: 'Failed to delete world' });
  }
});

module.exports = router;
