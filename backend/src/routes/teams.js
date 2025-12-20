const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Sport-specific table and ID field mappings
const sportConfig = {
  skijumping: { table: 'jumpers', idField: 'jumperId', seasonTable: 'seasons', sportId: 'ski-jumping' },
  biathlon: { table: 'biathletes', idField: 'athleteId', seasonTable: 'biathlon_seasons', sportId: null },
  alpine: { table: 'alpine_skiers', idField: 'skierId', seasonTable: 'alpine_seasons', sportId: null },
  crosscountry: { table: 'xcskiers', idField: 'skierId', seasonTable: 'xc_seasons', sportId: null },
  nordiccombined: { table: 'nc_athletes', idField: 'athleteId', seasonTable: 'nc_seasons', sportId: null }
};

function getSportConfig(sport) {
  return sportConfig[sport] || sportConfig.skijumping;
}

// Get all teams for a world (global - all sports)
router.get('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Get all teams for this world (no sport filtering)
    const teams = all('SELECT * FROM teams WHERE world_id = ? ORDER BY name', [worldId]);

    // Get athlete count from ALL sport tables for each team
    const teamsWithCounts = teams.map(team => {
      const jumpersCount = get('SELECT COUNT(*) as count FROM jumpers WHERE team_id = ?', [team.id])?.count || 0;
      const biathletesCount = get('SELECT COUNT(*) as count FROM biathletes WHERE team_id = ?', [team.id])?.count || 0;
      const alpineCount = get('SELECT COUNT(*) as count FROM alpine_skiers WHERE team_id = ?', [team.id])?.count || 0;
      const xcCount = get('SELECT COUNT(*) as count FROM xcskiers WHERE team_id = ?', [team.id])?.count || 0;
      const ncCount = get('SELECT COUNT(*) as count FROM nc_athletes WHERE team_id = ?', [team.id])?.count || 0;
      const speedCount = get('SELECT COUNT(*) as count FROM speed_skaters WHERE team_id = ?', [team.id])?.count || 0;
      const lugeCount = get('SELECT COUNT(*) as count FROM luge_athletes WHERE team_id = ?', [team.id])?.count || 0;
      const skeletonCount = get('SELECT COUNT(*) as count FROM skeleton_athletes WHERE team_id = ?', [team.id])?.count || 0;

      const totalCount = jumpersCount + biathletesCount + alpineCount + xcCount + ncCount + speedCount + lugeCount + skeletonCount;

      return {
        ...team,
        athleteCount: totalCount,
        jumperCount: jumpersCount, // Keep for backwards compatibility
        athletesByport: {
          skijumping: jumpersCount,
          biathlon: biathletesCount,
          alpine: alpineCount,
          crosscountry: xcCount,
          nordiccombined: ncCount,
          speedskating: speedCount,
          luge: lugeCount,
          skeleton: skeletonCount
        }
      };
    });

    res.json(teamsWithCounts);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get a single team with its athletes from all sports
router.get('/:teamId', authMiddleware, (req, res) => {
  try {
    const { teamId } = req.params;

    const team = get(`
      SELECT t.*, w.user_id
      FROM teams t
      INNER JOIN worlds w ON t.world_id = w.id
      WHERE t.id = ? AND w.user_id = ?
    `, [teamId, req.user.id]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get athletes from all sports
    const jumpers = all('SELECT *, "skijumping" as sport FROM jumpers WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const biathletes = all('SELECT *, "biathlon" as sport FROM biathletes WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const alpineSkiers = all('SELECT *, "alpine" as sport FROM alpine_skiers WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const xcSkiers = all('SELECT *, "crosscountry" as sport FROM xcskiers WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const ncAthletes = all('SELECT *, "nordiccombined" as sport FROM nc_athletes WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const speedSkaters = all('SELECT *, "speedskating" as sport FROM speed_skaters WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const lugeAthletes = all('SELECT *, "luge" as sport FROM luge_athletes WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);
    const skeletonAthletes = all('SELECT *, "skeleton" as sport FROM skeleton_athletes WHERE team_id = ? ORDER BY last_name, first_name', [teamId]);

    const allAthletes = [
      ...jumpers,
      ...biathletes,
      ...alpineSkiers,
      ...xcSkiers,
      ...ncAthletes,
      ...speedSkaters,
      ...lugeAthletes,
      ...skeletonAthletes
    ];

    res.json({
      ...team,
      athletes: allAthletes,
      jumpers, // Keep for backwards compatibility
      athletesBySport: {
        skijumping: jumpers,
        biathlon: biathletes,
        alpine: alpineSkiers,
        crosscountry: xcSkiers,
        nordiccombined: ncAthletes,
        speedskating: speedSkaters,
        luge: lugeAthletes,
        skeleton: skeletonAthletes
      }
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Create a new team (global - no sport association)
router.post('/world/:worldId', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { name, shortName, logoUrl, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    const teamId = uuidv4();
    run(`
      INSERT INTO teams (id, world_id, name, short_name, logo_url, color, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [teamId, worldId, name, shortName || null, logoUrl || null, color || '#3b82f6', description || null]);

    const team = get('SELECT * FROM teams WHERE id = ?', [teamId]);
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update a team
router.put('/:teamId', authMiddleware, (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, shortName, logoUrl, color, description } = req.body;

    const team = get(`
      SELECT t.*, w.user_id
      FROM teams t
      INNER JOIN worlds w ON t.world_id = w.id
      WHERE t.id = ? AND w.user_id = ?
    `, [teamId, req.user.id]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    run(`
      UPDATE teams
      SET name = ?, short_name = ?, logo_url = ?, color = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || team.name,
      shortName !== undefined ? shortName : team.short_name,
      logoUrl !== undefined ? logoUrl : team.logo_url,
      color || team.color,
      description !== undefined ? description : team.description,
      teamId
    ]);

    const updatedTeam = get('SELECT * FROM teams WHERE id = ?', [teamId]);
    res.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete a team
router.delete('/:teamId', authMiddleware, (req, res) => {
  try {
    const { teamId } = req.params;

    const team = get(`
      SELECT t.*, w.user_id
      FROM teams t
      INNER JOIN worlds w ON t.world_id = w.id
      WHERE t.id = ? AND w.user_id = ?
    `, [teamId, req.user.id]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Remove team assignment from all athlete tables
    run('UPDATE jumpers SET team_id = NULL WHERE team_id = ?', [teamId]);
    run('UPDATE biathletes SET team_id = NULL WHERE team_id = ?', [teamId]);
    run('UPDATE alpine_skiers SET team_id = NULL WHERE team_id = ?', [teamId]);
    run('UPDATE xcskiers SET team_id = NULL WHERE team_id = ?', [teamId]);
    run('UPDATE nc_athletes SET team_id = NULL WHERE team_id = ?', [teamId]);

    // Delete the team
    run('DELETE FROM teams WHERE id = ?', [teamId]);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Assign an athlete to a team
router.post('/:teamId/assign/:athleteId', authMiddleware, (req, res) => {
  try {
    const { teamId, athleteId } = req.params;
    const { sport } = req.query;
    const config = getSportConfig(sport);

    const team = get(`
      SELECT t.*, w.user_id
      FROM teams t
      INNER JOIN worlds w ON t.world_id = w.id
      WHERE t.id = ? AND w.user_id = ?
    `, [teamId, req.user.id]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const athlete = get(`SELECT * FROM ${config.table} WHERE id = ? AND world_id = ?`, [athleteId, team.world_id]);
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run(`UPDATE ${config.table} SET team_id = ? WHERE id = ?`, [teamId, athleteId]);

    res.json({ message: 'Athlete assigned to team successfully' });
  } catch (error) {
    console.error('Error assigning athlete to team:', error);
    res.status(500).json({ error: 'Failed to assign athlete to team' });
  }
});

// Remove an athlete from their team
router.post('/unassign/:athleteId', authMiddleware, (req, res) => {
  try {
    const { athleteId } = req.params;
    const { sport } = req.query;
    const config = getSportConfig(sport);

    const athlete = get(`
      SELECT a.*, w.user_id
      FROM ${config.table} a
      INNER JOIN worlds w ON a.world_id = w.id
      WHERE a.id = ? AND w.user_id = ?
    `, [athleteId, req.user.id]);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    run(`UPDATE ${config.table} SET team_id = NULL WHERE id = ?`, [athleteId]);

    res.json({ message: 'Athlete removed from team successfully' });
  } catch (error) {
    console.error('Error removing athlete from team:', error);
    res.status(500).json({ error: 'Failed to remove athlete from team' });
  }
});

// Get team standings for a season
router.get('/world/:worldId/standings', authMiddleware, (req, res) => {
  try {
    const { worldId } = req.params;
    const { sport } = req.query;
    const config = getSportConfig(sport);

    const world = get('SELECT * FROM worlds WHERE id = ? AND user_id = ?', [worldId, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Get current season standings from sport-specific season table
    let season;
    if (config.sportId) {
      // Ski jumping uses the general seasons table with sport_id
      season = get(`
        SELECT standings FROM seasons
        WHERE world_id = ? AND sport_id = ? AND status != 'completed'
        ORDER BY year_start DESC
        LIMIT 1
      `, [worldId, config.sportId]);
    } else {
      // Other sports have dedicated season tables
      season = get(`
        SELECT standings FROM ${config.seasonTable}
        WHERE world_id = ? AND status != 'completed'
        ORDER BY year_start DESC
        LIMIT 1
      `, [worldId]);
    }

    if (!season) {
      return res.json([]);
    }

    let standings = [];
    try {
      standings = JSON.parse(season.standings || '[]');
    } catch (e) {
      standings = [];
    }

    // Get all teams for this world (teams are global, not sport-specific)
    const teams = all('SELECT * FROM teams WHERE world_id = ?', [worldId]);

    // Get all athletes with team assignments from sport-specific table
    const athletes = all(`SELECT id, team_id FROM ${config.table} WHERE world_id = ? AND team_id IS NOT NULL`, [worldId]);
    const athleteTeamMap = new Map();
    for (const a of athletes) {
      athleteTeamMap.set(a.id, a.team_id);
    }

    // Calculate team points
    const teamPointsMap = new Map();
    for (const team of teams) {
      teamPointsMap.set(team.id, {
        teamId: team.id,
        name: team.name,
        shortName: team.short_name,
        color: team.color,
        logoUrl: team.logo_url,
        points: 0,
        athleteCount: 0,
        wins: 0,
        podiums: 0
      });
    }

    // Sum up points for each team - support different ID field names
    for (const s of standings) {
      const athleteId = s[config.idField] || s.athleteId || s.jumperId || s.skierId;
      const teamId = athleteTeamMap.get(athleteId);
      if (teamId && teamPointsMap.has(teamId)) {
        const teamData = teamPointsMap.get(teamId);
        teamData.points += s.points || 0;
        teamData.athleteCount++;
        teamData.wins += s.wins || 0;
        teamData.podiums += s.podiums || 0;
      }
    }

    // Sort by points descending
    const teamStandings = Array.from(teamPointsMap.values())
      .filter(t => t.athleteCount > 0)
      .sort((a, b) => b.points - a.points);

    res.json(teamStandings);
  } catch (error) {
    console.error('Error fetching team standings:', error);
    res.status(500).json({ error: 'Failed to fetch team standings' });
  }
});

module.exports = router;
