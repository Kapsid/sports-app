require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const sportsRoutes = require('./routes/sports');
const worldsRoutes = require('./routes/worlds');
const jumpersRoutes = require('./routes/jumpers');
const seasonsRoutes = require('./routes/seasons');
const teamsRoutes = require('./routes/teams');
const biathlonRoutes = require('./routes/biathlon');
const crossCountryRoutes = require('./routes/crosscountry');
const alpineRoutes = require('./routes/alpine');
const nordicCombinedRoutes = require('./routes/nordic-combined');
const bobsleighRoutes = require('./routes/bobsleigh');
const speedSkatingRoutes = require('./routes/speed-skating');
const lugeRoutes = require('./routes/luge');
const skeletonRoutes = require('./routes/skeleton');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (works before database init)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WinterSim API is running' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Routes (after database is ready)
    app.use('/api/auth', authRoutes);
    app.use('/api/sports', sportsRoutes);
    app.use('/api/worlds', worldsRoutes);
    app.use('/api/jumpers', jumpersRoutes);
    app.use('/api/seasons', seasonsRoutes);
    app.use('/api/teams', teamsRoutes);
    app.use('/api/biathlon', biathlonRoutes);
    app.use('/api/crosscountry', crossCountryRoutes);
    app.use('/api/alpine', alpineRoutes);
    app.use('/api/nordic-combined', nordicCombinedRoutes);
    app.use('/api/bobsleigh', bobsleighRoutes);
    app.use('/api/speed-skating', speedSkatingRoutes);
    app.use('/api/luge', lugeRoutes);
    app.use('/api/skeleton', skeletonRoutes);

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../frontend/dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
      });
    }

    app.listen(PORT, () => {
      console.log(`WinterSim API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
