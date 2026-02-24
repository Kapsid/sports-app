const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET /api/sportsmen — list all names for current user, with optional search/country filter
router.get('/', authMiddleware, (req, res) => {
  try {
    const { search, country } = req.query;
    let sql = 'SELECT * FROM sportsmen WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND (first_name LIKE ? OR last_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }

    if (country) {
      sql += ' AND country_code = ?';
      params.push(country);
    }

    sql += ' ORDER BY last_name ASC, first_name ASC';

    const sportsmen = all(sql, params);
    res.json({ sportsmen });
  } catch (error) {
    console.error('Error fetching sportsmen:', error);
    res.status(500).json({ error: 'Failed to fetch sportsmen' });
  }
});

// POST /api/sportsmen — create a single name
router.post('/', authMiddleware, (req, res) => {
  try {
    const { first_name, last_name, country_code } = req.body;

    if (!first_name && !last_name) {
      return res.status(400).json({ error: 'At least first name or last name is required' });
    }

    const id = uuidv4();
    run(
      'INSERT INTO sportsmen (id, user_id, first_name, last_name, country_code) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, first_name || null, last_name || null, country_code || null]
    );

    const sportsman = get('SELECT * FROM sportsmen WHERE id = ?', [id]);
    res.status(201).json({ sportsman });
  } catch (error) {
    console.error('Error creating sportsman:', error);
    res.status(500).json({ error: 'Failed to create sportsman' });
  }
});

// POST /api/sportsmen/bulk — create multiple names
router.post('/bulk', authMiddleware, (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Entries array is required' });
    }

    const created = [];
    for (const entry of entries) {
      const { first_name, last_name, country_code } = entry;
      if (!first_name && !last_name) continue;

      const id = uuidv4();
      run(
        'INSERT INTO sportsmen (id, user_id, first_name, last_name, country_code) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, first_name || null, last_name || null, country_code || null]
      );
      created.push({ id, first_name, last_name, country_code });
    }

    res.status(201).json({ created, count: created.length });
  } catch (error) {
    console.error('Error bulk creating sportsmen:', error);
    res.status(500).json({ error: 'Failed to bulk create sportsmen' });
  }
});

// PUT /api/sportsmen/:id — update
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const existing = get('SELECT * FROM sportsmen WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Sportsman not found' });
    }

    const { first_name, last_name, country_code } = req.body;

    run(
      'UPDATE sportsmen SET first_name = ?, last_name = ?, country_code = ? WHERE id = ? AND user_id = ?',
      [
        first_name !== undefined ? first_name : existing.first_name,
        last_name !== undefined ? last_name : existing.last_name,
        country_code !== undefined ? country_code : existing.country_code,
        req.params.id,
        req.user.id
      ]
    );

    const updated = get('SELECT * FROM sportsmen WHERE id = ?', [req.params.id]);
    res.json({ sportsman: updated });
  } catch (error) {
    console.error('Error updating sportsman:', error);
    res.status(500).json({ error: 'Failed to update sportsman' });
  }
});

// DELETE /api/sportsmen/:id — delete
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const existing = get('SELECT * FROM sportsmen WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Sportsman not found' });
    }

    run('DELETE FROM sportsmen WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Sportsman deleted' });
  } catch (error) {
    console.error('Error deleting sportsman:', error);
    res.status(500).json({ error: 'Failed to delete sportsman' });
  }
});

module.exports = router;
