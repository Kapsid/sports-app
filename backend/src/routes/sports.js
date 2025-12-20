const express = require('express');
const { get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all available sports
router.get('/', authMiddleware, (req, res) => {
  try {
    const sports = all('SELECT * FROM sports ORDER BY name');
    res.json({ sports });
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ error: 'Failed to fetch sports' });
  }
});

// Get sport by ID
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const sport = get('SELECT * FROM sports WHERE id = ?', [req.params.id]);
    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }
    res.json({ sport });
  } catch (error) {
    console.error('Error fetching sport:', error);
    res.status(500).json({ error: 'Failed to fetch sport' });
  }
});

module.exports = router;
