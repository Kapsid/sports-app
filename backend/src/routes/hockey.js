const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const {
  topDivisionTeams,
  division2Teams,
  division3Teams,
  simulateHockeyMatch,
  generateGroupSchedule,
  calculateStandings,
  assignTeamsToGroups,
  simulateDiv2Season,
  simulateDiv3Season
} = require('../data/hockeyTeams');

const router = express.Router();

// ==================== WORLDS ====================

// Get all hockey worlds for current user
router.get('/worlds', authMiddleware, (req, res) => {
  try {
    const worlds = all(`
      SELECT * FROM hockey_worlds
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json({ worlds });
  } catch (error) {
    console.error('Error fetching hockey worlds:', error);
    res.status(500).json({ error: 'Failed to fetch worlds' });
  }
});

// Get world by ID
router.get('/worlds/:id', authMiddleware, (req, res) => {
  try {
    const world = get(
      'SELECT * FROM hockey_worlds WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Get current season
    const currentSeason = get(`
      SELECT * FROM hockey_seasons
      WHERE world_id = ?
      ORDER BY year DESC LIMIT 1
    `, [req.params.id]);

    // Get teams for this world
    const teams = all('SELECT * FROM hockey_teams WHERE world_id = ? ORDER BY division, power DESC', [req.params.id]);

    res.json({ world: { ...world, teams, currentSeason } });
  } catch (error) {
    console.error('Error fetching hockey world:', error);
    res.status(500).json({ error: 'Failed to fetch world' });
  }
});

// Create new world with teams
router.post('/worlds', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'World name is required' });
    }

    const worldId = uuidv4();
    run(
      'INSERT INTO hockey_worlds (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [worldId, req.user.id, name, description || '']
    );

    // Create Top Division teams (16 teams)
    const { groupA, groupB } = assignTeamsToGroups(topDivisionTeams);

    for (const team of groupA) {
      const teamId = uuidv4();
      run(`
        INSERT INTO hockey_teams (id, world_id, name, short_name, country_code, flag, power, offense, defense, goaltending, division, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'top', 'A')
      `, [teamId, worldId, team.name, team.shortName, team.countryCode, team.flag, team.power, team.offense, team.defense, team.goaltending]);
    }

    for (const team of groupB) {
      const teamId = uuidv4();
      run(`
        INSERT INTO hockey_teams (id, world_id, name, short_name, country_code, flag, power, offense, defense, goaltending, division, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'top', 'B')
      `, [teamId, worldId, team.name, team.shortName, team.countryCode, team.flag, team.power, team.offense, team.defense, team.goaltending]);
    }

    // Create Division II teams (8 teams)
    for (const team of division2Teams) {
      const teamId = uuidv4();
      run(`
        INSERT INTO hockey_teams (id, world_id, name, short_name, country_code, flag, power, offense, defense, goaltending, division, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'div2', NULL)
      `, [teamId, worldId, team.name, team.shortName, team.countryCode, team.flag, team.power, team.offense, team.defense, team.goaltending]);
    }

    const world = get('SELECT * FROM hockey_worlds WHERE id = ?', [worldId]);
    const teams = all('SELECT * FROM hockey_teams WHERE world_id = ?', [worldId]);

    res.status(201).json({ world: { ...world, teams } });
  } catch (error) {
    console.error('Error creating hockey world:', error);
    res.status(500).json({ error: 'Failed to create world' });
  }
});

// Delete world
router.delete('/worlds/:id', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM hockey_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Delete all related data
    const seasons = all('SELECT id FROM hockey_seasons WHERE world_id = ?', [req.params.id]);
    for (const season of seasons) {
      run('DELETE FROM hockey_matches WHERE season_id = ?', [season.id]);
    }
    run('DELETE FROM hockey_seasons WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM hockey_teams WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM hockey_season_history WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM hockey_worlds WHERE id = ?', [req.params.id]);

    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting hockey world:', error);
    res.status(500).json({ error: 'Failed to delete world' });
  }
});

// Reset world
router.post('/worlds/:id/reset', authMiddleware, (req, res) => {
  try {
    const world = get('SELECT * FROM hockey_worlds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Delete all matches, seasons, and history
    const seasons = all('SELECT id FROM hockey_seasons WHERE world_id = ?', [req.params.id]);
    for (const season of seasons) {
      run('DELETE FROM hockey_matches WHERE season_id = ?', [season.id]);
    }
    run('DELETE FROM hockey_seasons WHERE world_id = ?', [req.params.id]);
    run('DELETE FROM hockey_season_history WHERE world_id = ?', [req.params.id]);

    // Delete all teams and recreate
    run('DELETE FROM hockey_teams WHERE world_id = ?', [req.params.id]);

    // Recreate Top Division teams
    const { groupA, groupB } = assignTeamsToGroups(topDivisionTeams);

    for (const team of groupA) {
      const teamId = uuidv4();
      run(`
        INSERT INTO hockey_teams (id, world_id, name, short_name, country_code, flag, power, offense, defense, goaltending, division, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'top', 'A')
      `, [teamId, req.params.id, team.name, team.shortName, team.countryCode, team.flag, team.power, team.offense, team.defense, team.goaltending]);
    }

    for (const team of groupB) {
      const teamId = uuidv4();
      run(`
        INSERT INTO hockey_teams (id, world_id, name, short_name, country_code, flag, power, offense, defense, goaltending, division, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'top', 'B')
      `, [teamId, req.params.id, team.name, team.shortName, team.countryCode, team.flag, team.power, team.offense, team.defense, team.goaltending]);
    }

    // Recreate Division II teams
    for (const team of division2Teams) {
      const teamId = uuidv4();
      run(`
        INSERT INTO hockey_teams (id, world_id, name, short_name, country_code, flag, power, offense, defense, goaltending, division, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'div2', NULL)
      `, [teamId, req.params.id, team.name, team.shortName, team.countryCode, team.flag, team.power, team.offense, team.defense, team.goaltending]);
    }

    const teams = all('SELECT * FROM hockey_teams WHERE world_id = ? ORDER BY division, power DESC', [req.params.id]);
    res.json({ message: 'World reset successfully', teams });
  } catch (error) {
    console.error('Error resetting hockey world:', error);
    res.status(500).json({ error: 'Failed to reset world' });
  }
});

// ==================== SEASONS ====================

// Get current season
router.get('/worlds/:worldId/season', authMiddleware, (req, res) => {
  try {
    const season = get(`
      SELECT * FROM hockey_seasons
      WHERE world_id = ?
      ORDER BY year DESC LIMIT 1
    `, [req.params.worldId]);

    if (!season) {
      return res.json({ season: null });
    }

    // Get matches for this season
    const matches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.flag as home_team_flag, ht.country_code as home_country_code,
        at.name as away_team_name, at.short_name as away_team_short, at.flag as away_team_flag, at.country_code as away_country_code
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.stage, m.group_name, m.round_number, m.id
    `, [season.id]);

    // Get teams by group
    const groupATeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [req.params.worldId, 'top', 'A']);
    const groupBTeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [req.params.worldId, 'top', 'B']);
    const div2Teams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ?', [req.params.worldId, 'div2']);

    // Calculate standings from matches
    const groupAMatches = matches.filter(m => m.stage === 'group' && m.group_name === 'A');
    const groupBMatches = matches.filter(m => m.stage === 'group' && m.group_name === 'B');

    const groupAStandings = calculateStandings(groupATeams, groupAMatches);
    const groupBStandings = calculateStandings(groupBTeams, groupBMatches);

    res.json({
      season: {
        ...season,
        matches,
        groupAStandings,
        groupBStandings,
        div2Standings: JSON.parse(season.div2_standings || '[]'),
        playoffBracket: JSON.parse(season.playoff_bracket || '[]')
      }
    });
  } catch (error) {
    console.error('Error fetching season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// Create new season (championship)
router.post('/worlds/:worldId/season', authMiddleware, (req, res) => {
  try {
    const { year } = req.body;
    const worldId = req.params.worldId;
    console.log('Creating season for world:', worldId, 'year:', year);

    // Check if world exists
    const world = get('SELECT * FROM hockey_worlds WHERE id = ?', [worldId]);
    if (!world) {
      console.log('World not found:', worldId);
      return res.status(404).json({ error: 'World not found' });
    }

    // Get Top Division teams by group
    const groupATeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [worldId, 'top', 'A']);
    const groupBTeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [worldId, 'top', 'B']);
    const div2Teams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ?', [worldId, 'div2']);
    console.log('Team counts - Group A:', groupATeams.length, 'Group B:', groupBTeams.length, 'Div2:', div2Teams.length);

    if (groupATeams.length !== 8 || groupBTeams.length !== 8) {
      console.log('ERROR: Wrong team count - Group A:', groupATeams.length, 'Group B:', groupBTeams.length);
      return res.status(400).json({ error: `Need exactly 8 teams per group. Got A:${groupATeams.length}, B:${groupBTeams.length}` });
    }

    // Create season
    const seasonId = uuidv4();
    run(`
      INSERT INTO hockey_seasons (id, world_id, year, status, phase)
      VALUES (?, ?, ?, 'in_progress', 'group')
    `, [seasonId, worldId, year]);

    // Generate group schedules (round-robin within each group)
    const groupASchedule = generateGroupSchedule(groupATeams);
    const groupBSchedule = generateGroupSchedule(groupBTeams);

    // Create Group A matches with round numbers
    for (let roundIndex = 0; roundIndex < groupASchedule.length; roundIndex++) {
      for (const match of groupASchedule[roundIndex]) {
        const matchId = uuidv4();
        run(`
          INSERT INTO hockey_matches (id, season_id, stage, group_name, round_number, home_team_id, away_team_id, status)
          VALUES (?, ?, 'group', 'A', ?, ?, ?, 'scheduled')
        `, [matchId, seasonId, roundIndex + 1, groupATeams[match.homeTeamIndex].id, groupATeams[match.awayTeamIndex].id]);
      }
    }

    // Create Group B matches with round numbers
    for (let roundIndex = 0; roundIndex < groupBSchedule.length; roundIndex++) {
      for (const match of groupBSchedule[roundIndex]) {
        const matchId = uuidv4();
        run(`
          INSERT INTO hockey_matches (id, season_id, stage, group_name, round_number, home_team_id, away_team_id, status)
          VALUES (?, ?, 'group', 'B', ?, ?, ?, 'scheduled')
        `, [matchId, seasonId, roundIndex + 1, groupBTeams[match.homeTeamIndex].id, groupBTeams[match.awayTeamIndex].id]);
      }
    }

    // Simulate Division II season in background
    const div2Standings = simulateDiv2Season(div2Teams.map(t => ({
      ...t,
      shortName: t.short_name,
      countryCode: t.country_code
    })));

    // Save Division II standings
    run('UPDATE hockey_seasons SET div2_standings = ? WHERE id = ?', [JSON.stringify(div2Standings), seasonId]);

    const season = get('SELECT * FROM hockey_seasons WHERE id = ?', [seasonId]);
    const matches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.flag as home_team_flag,
        at.name as away_team_name, at.short_name as away_team_short, at.flag as away_team_flag
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ?
      ORDER BY m.stage, m.group_name, m.id
    `, [seasonId]);

    res.status(201).json({
      season: {
        ...season,
        matches,
        div2Standings
      }
    });
  } catch (error) {
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  }
});

// ==================== MATCHES ====================

// Get matches for a group
router.get('/seasons/:seasonId/group/:group', authMiddleware, (req, res) => {
  try {
    const matches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.flag as home_team_flag, ht.country_code as home_country_code,
        at.name as away_team_name, at.short_name as away_team_short, at.flag as away_team_flag, at.country_code as away_country_code
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.group_name = ?
      ORDER BY m.id
    `, [req.params.seasonId, req.params.group]);

    res.json({ matches });
  } catch (error) {
    console.error('Error fetching group matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Simulate a single match
router.post('/matches/:matchId/simulate', authMiddleware, (req, res) => {
  try {
    const { detailed, homeScore, awayScore, overtime, shootout, events } = req.body;
    const matchId = req.params.matchId;

    // Get match with team info
    const match = get(`
      SELECT m.*,
        ht.id as home_id, ht.name as home_team_name, ht.short_name as home_team_short,
        ht.power as home_power, ht.offense as home_offense, ht.defense as home_defense, ht.goaltending as home_goaltending,
        at.id as away_id, at.name as away_team_name, at.short_name as away_team_short,
        at.power as away_power, at.offense as away_offense, at.defense as away_defense, at.goaltending as away_goaltending
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.id = ?
    `, [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match already completed' });
    }

    let result;

    // If specific scores provided (from client-side detailed simulation), use them
    if (typeof homeScore === 'number' && typeof awayScore === 'number') {
      result = {
        homeScore,
        awayScore,
        overtime: overtime || false,
        shootout: shootout || false,
        periodScores: [], // Not tracked for client-provided results
        events: events || []
      };
    } else {
      // Generate result server-side
      const homeTeam = {
        id: match.home_id,
        short_name: match.home_team_short,
        power: match.home_power,
        offense: match.home_offense,
        defense: match.home_defense,
        goaltending: match.home_goaltending
      };

      const awayTeam = {
        id: match.away_id,
        short_name: match.away_team_short,
        power: match.away_power,
        offense: match.away_offense,
        defense: match.away_defense,
        goaltending: match.away_goaltending
      };

      const isPlayoff = match.stage !== 'group';
      result = simulateHockeyMatch(homeTeam, awayTeam, isPlayoff, detailed);
    }

    // Update match in database
    run(`
      UPDATE hockey_matches
      SET home_score = ?, away_score = ?, overtime = ?, shootout = ?,
          period_scores = ?, status = 'completed', match_events = ?
      WHERE id = ?
    `, [result.homeScore, result.awayScore, result.overtime ? 1 : 0, result.shootout ? 1 : 0,
        JSON.stringify(result.periodScores), JSON.stringify(result.events || []), matchId]);

    // Get updated match
    const updatedMatch = get(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.flag as home_team_flag,
        at.name as away_team_name, at.short_name as away_team_short, at.flag as away_team_flag
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.id = ?
    `, [matchId]);

    res.json({ match: updatedMatch, events: result.events });
  } catch (error) {
    console.error('Error simulating match:', error);
    res.status(500).json({ error: 'Failed to simulate match' });
  }
});

// Simulate all group matches (fast simulation)
router.post('/seasons/:seasonId/simulate-group', authMiddleware, (req, res) => {
  try {
    const seasonId = req.params.seasonId;

    // Get all unplayed group matches
    const matches = all(`
      SELECT m.*,
        ht.id as home_id, ht.short_name as home_team_short,
        ht.power as home_power, ht.offense as home_offense, ht.defense as home_defense, ht.goaltending as home_goaltending,
        at.id as away_id, at.short_name as away_team_short,
        at.power as away_power, at.offense as away_offense, at.defense as away_defense, at.goaltending as away_goaltending
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.stage = 'group' AND m.status = 'scheduled'
    `, [seasonId]);

    const results = [];

    for (const match of matches) {
      const homeTeam = {
        id: match.home_id,
        short_name: match.home_team_short,
        power: match.home_power,
        offense: match.home_offense,
        defense: match.home_defense,
        goaltending: match.home_goaltending
      };

      const awayTeam = {
        id: match.away_id,
        short_name: match.away_team_short,
        power: match.away_power,
        offense: match.away_offense,
        defense: match.away_defense,
        goaltending: match.away_goaltending
      };

      const result = simulateHockeyMatch(homeTeam, awayTeam, false, false);

      run(`
        UPDATE hockey_matches
        SET home_score = ?, away_score = ?, overtime = ?, shootout = ?,
            period_scores = ?, status = 'completed'
        WHERE id = ?
      `, [result.homeScore, result.awayScore, result.overtime ? 1 : 0, result.shootout ? 1 : 0,
          JSON.stringify(result.periodScores), match.id]);

      results.push({
        matchId: match.id,
        group: match.group_name,
        homeTeam: match.home_team_short,
        awayTeam: match.away_team_short,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        overtime: result.overtime,
        shootout: result.shootout
      });
    }

    // Get updated standings
    const season = get('SELECT * FROM hockey_seasons WHERE id = ?', [seasonId]);
    const allMatches = all('SELECT * FROM hockey_matches WHERE season_id = ? AND stage = ?', [seasonId, 'group']);
    const groupATeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'A']);
    const groupBTeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'B']);

    const groupAMatches = allMatches.filter(m => m.group_name === 'A');
    const groupBMatches = allMatches.filter(m => m.group_name === 'B');

    const groupAStandings = calculateStandings(groupATeams, groupAMatches);
    const groupBStandings = calculateStandings(groupBTeams, groupBMatches);

    // Save standings
    run('UPDATE hockey_seasons SET group_a_standings = ?, group_b_standings = ? WHERE id = ?',
      [JSON.stringify(groupAStandings), JSON.stringify(groupBStandings), seasonId]);

    res.json({ results, groupAStandings, groupBStandings });
  } catch (error) {
    console.error('Error simulating group:', error);
    res.status(500).json({ error: 'Failed to simulate group' });
  }
});

// ==================== PLAYOFFS ====================

// Start playoffs
router.post('/seasons/:seasonId/start-playoffs', authMiddleware, (req, res) => {
  try {
    const seasonId = req.params.seasonId;
    const season = get('SELECT * FROM hockey_seasons WHERE id = ?', [seasonId]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // Check if all group matches are complete
    const unplayedMatches = all('SELECT id FROM hockey_matches WHERE season_id = ? AND stage = ? AND status = ?', [seasonId, 'group', 'scheduled']);
    if (unplayedMatches.length > 0) {
      return res.status(400).json({ error: 'Not all group matches completed' });
    }

    // Get final standings from both groups
    const allMatches = all('SELECT * FROM hockey_matches WHERE season_id = ? AND stage = ?', [seasonId, 'group']);
    const groupATeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'A']);
    const groupBTeams = all('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'B']);

    const groupAMatches = allMatches.filter(m => m.group_name === 'A');
    const groupBMatches = allMatches.filter(m => m.group_name === 'B');

    const groupAStandings = calculateStandings(groupATeams, groupAMatches);
    const groupBStandings = calculateStandings(groupBTeams, groupBMatches);

    // Top 4 from each group advance to playoffs
    const playoffTeamsA = groupAStandings.slice(0, 4);
    const playoffTeamsB = groupBStandings.slice(0, 4);

    // Bottom team from each group is relegated
    const relegatedA = groupAStandings[7];
    const relegatedB = groupBStandings[7];

    // Create quarterfinal matches (single elimination)
    // 1A vs 4B, 2A vs 3B, 1B vs 4A, 2B vs 3A
    const quarterfinals = [
      { home: playoffTeamsA[0], away: playoffTeamsB[3], matchup: '1A vs 4B' },
      { home: playoffTeamsA[1], away: playoffTeamsB[2], matchup: '2A vs 3B' },
      { home: playoffTeamsB[0], away: playoffTeamsA[3], matchup: '1B vs 4A' },
      { home: playoffTeamsB[1], away: playoffTeamsA[2], matchup: '2B vs 3A' }
    ];

    for (const qf of quarterfinals) {
      const matchId = uuidv4();
      run(`
        INSERT INTO hockey_matches (id, season_id, stage, playoff_round, home_team_id, away_team_id, status)
        VALUES (?, ?, 'playoff', 'quarterfinal', ?, ?, 'scheduled')
      `, [matchId, seasonId, qf.home.teamId, qf.away.teamId]);
    }

    // Get Division II standings and handle relegation/promotion
    const div2Standings = JSON.parse(season.div2_standings || '[]');

    // Save playoff bracket and update phase
    const playoffBracket = {
      quarterfinals: quarterfinals.map(qf => ({
        homeTeam: qf.home.teamName,
        homeTeamId: qf.home.teamId,
        awayTeam: qf.away.teamName,
        awayTeamId: qf.away.teamId,
        matchup: qf.matchup,
        winner: null
      })),
      semifinals: [],
      bronzeMatch: null,
      final: null,
      relegatedTeams: [
        { teamId: relegatedA.teamId, teamName: relegatedA.teamName, group: 'A' },
        { teamId: relegatedB.teamId, teamName: relegatedB.teamName, group: 'B' }
      ],
      promotedTeams: div2Standings.slice(0, 2).map(t => ({
        teamName: t.teamName,
        countryCode: t.countryCode
      }))
    };

    run('UPDATE hockey_seasons SET phase = ?, group_a_standings = ?, group_b_standings = ?, playoff_bracket = ? WHERE id = ?',
      ['playoff', JSON.stringify(groupAStandings), JSON.stringify(groupBStandings), JSON.stringify(playoffBracket), seasonId]);

    res.json({
      message: 'Playoffs started',
      playoffBracket,
      groupAStandings,
      groupBStandings
    });
  } catch (error) {
    console.error('Error starting playoffs:', error);
    res.status(500).json({ error: 'Failed to start playoffs' });
  }
});

// Get playoff bracket
router.get('/seasons/:seasonId/playoffs', authMiddleware, (req, res) => {
  try {
    const season = get('SELECT * FROM hockey_seasons WHERE id = ?', [req.params.seasonId]);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const playoffMatches = all(`
      SELECT m.*,
        ht.name as home_team_name, ht.short_name as home_team_short, ht.flag as home_team_flag,
        at.name as away_team_name, at.short_name as away_team_short, at.flag as away_team_flag
      FROM hockey_matches m
      JOIN hockey_teams ht ON m.home_team_id = ht.id
      JOIN hockey_teams at ON m.away_team_id = at.id
      WHERE m.season_id = ? AND m.stage = 'playoff'
      ORDER BY m.playoff_round, m.id
    `, [req.params.seasonId]);

    res.json({
      bracket: JSON.parse(season.playoff_bracket || '[]'),
      matches: playoffMatches,
      groupAStandings: JSON.parse(season.group_a_standings || '[]'),
      groupBStandings: JSON.parse(season.group_b_standings || '[]'),
      div2Standings: JSON.parse(season.div2_standings || '[]')
    });
  } catch (error) {
    console.error('Error fetching playoffs:', error);
    res.status(500).json({ error: 'Failed to fetch playoffs' });
  }
});

// Check and advance to next playoff round
router.post('/seasons/:seasonId/check-advance', authMiddleware, (req, res) => {
  try {
    const seasonId = req.params.seasonId;
    const season = get('SELECT * FROM hockey_seasons WHERE id = ?', [seasonId]);

    if (!season || season.phase !== 'playoff') {
      return res.json({ advanced: false, message: 'Not in playoff phase' });
    }

    const playoffBracket = JSON.parse(season.playoff_bracket || '{}');

    // Check quarterfinals
    const qfMatches = all('SELECT * FROM hockey_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'quarterfinal']);
    const qfComplete = qfMatches.length === 4 && qfMatches.every(m => m.status === 'completed');
    const sfExists = all('SELECT id FROM hockey_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'semifinal']).length > 0;

    if (qfComplete && !sfExists) {
      // Get QF winners
      const qfWinners = qfMatches.map(m => {
        const winnerId = m.home_score > m.away_score ? m.home_team_id : m.away_team_id;
        const winnerTeam = get('SELECT * FROM hockey_teams WHERE id = ?', [winnerId]);
        return { teamId: winnerId, teamName: winnerTeam?.short_name };
      });

      // Create semifinals: QF1 winner vs QF2 winner, QF3 winner vs QF4 winner
      run(`
        INSERT INTO hockey_matches (id, season_id, stage, playoff_round, home_team_id, away_team_id, status)
        VALUES (?, ?, 'playoff', 'semifinal', ?, ?, 'scheduled')
      `, [uuidv4(), seasonId, qfWinners[0].teamId, qfWinners[1].teamId]);

      run(`
        INSERT INTO hockey_matches (id, season_id, stage, playoff_round, home_team_id, away_team_id, status)
        VALUES (?, ?, 'playoff', 'semifinal', ?, ?, 'scheduled')
      `, [uuidv4(), seasonId, qfWinners[2].teamId, qfWinners[3].teamId]);

      // Update bracket
      playoffBracket.quarterfinals = playoffBracket.quarterfinals.map((qf, idx) => ({
        ...qf,
        winner: qfWinners[idx].teamName,
        winnerId: qfWinners[idx].teamId
      }));
      playoffBracket.semifinals = [
        { homeTeam: qfWinners[0].teamName, awayTeam: qfWinners[1].teamName, winner: null },
        { homeTeam: qfWinners[2].teamName, awayTeam: qfWinners[3].teamName, winner: null }
      ];

      run('UPDATE hockey_seasons SET playoff_bracket = ? WHERE id = ?', [JSON.stringify(playoffBracket), seasonId]);

      return res.json({ advanced: true, newRound: 'semifinal', message: 'Semifinals created' });
    }

    // Check semifinals
    const sfMatches = all('SELECT * FROM hockey_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'semifinal']);
    const sfComplete = sfMatches.length === 2 && sfMatches.every(m => m.status === 'completed');
    const finalExists = all('SELECT id FROM hockey_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'final']).length > 0;

    if (sfComplete && !finalExists) {
      // Get SF winners and losers
      const sfResults = sfMatches.map(m => {
        const winnerId = m.home_score > m.away_score ? m.home_team_id : m.away_team_id;
        const loserId = m.home_score > m.away_score ? m.away_team_id : m.home_team_id;
        const winnerTeam = get('SELECT * FROM hockey_teams WHERE id = ?', [winnerId]);
        const loserTeam = get('SELECT * FROM hockey_teams WHERE id = ?', [loserId]);
        return {
          winnerId, loserId,
          winnerName: winnerTeam?.short_name,
          loserName: loserTeam?.short_name
        };
      });

      // Create final
      run(`
        INSERT INTO hockey_matches (id, season_id, stage, playoff_round, home_team_id, away_team_id, status)
        VALUES (?, ?, 'playoff', 'final', ?, ?, 'scheduled')
      `, [uuidv4(), seasonId, sfResults[0].winnerId, sfResults[1].winnerId]);

      // Create bronze match
      run(`
        INSERT INTO hockey_matches (id, season_id, stage, playoff_round, home_team_id, away_team_id, status)
        VALUES (?, ?, 'playoff', 'bronze', ?, ?, 'scheduled')
      `, [uuidv4(), seasonId, sfResults[0].loserId, sfResults[1].loserId]);

      // Update bracket
      playoffBracket.semifinals = playoffBracket.semifinals.map((sf, idx) => ({
        ...sf,
        winner: sfResults[idx].winnerName,
        winnerId: sfResults[idx].winnerId
      }));
      playoffBracket.final = {
        homeTeam: sfResults[0].winnerName,
        awayTeam: sfResults[1].winnerName,
        winner: null
      };
      playoffBracket.bronzeMatch = {
        homeTeam: sfResults[0].loserName,
        awayTeam: sfResults[1].loserName,
        winner: null
      };

      run('UPDATE hockey_seasons SET playoff_bracket = ? WHERE id = ?', [JSON.stringify(playoffBracket), seasonId]);

      return res.json({ advanced: true, newRound: 'final', message: 'Final and bronze match created' });
    }

    // Check if final and bronze are complete
    const finalMatch = get('SELECT * FROM hockey_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'final']);
    const bronzeMatch = get('SELECT * FROM hockey_matches WHERE season_id = ? AND playoff_round = ?', [seasonId, 'bronze']);
    const allComplete = finalMatch?.status === 'completed' && bronzeMatch?.status === 'completed';

    if (allComplete) {
      // Get medal winners
      const goldTeamId = finalMatch.home_score > finalMatch.away_score ? finalMatch.home_team_id : finalMatch.away_team_id;
      const silverTeamId = finalMatch.home_score > finalMatch.away_score ? finalMatch.away_team_id : finalMatch.home_team_id;
      const bronzeTeamId = bronzeMatch.home_score > bronzeMatch.away_score ? bronzeMatch.home_team_id : bronzeMatch.away_team_id;

      const goldTeam = get('SELECT * FROM hockey_teams WHERE id = ?', [goldTeamId]);
      const silverTeam = get('SELECT * FROM hockey_teams WHERE id = ?', [silverTeamId]);
      const bronzeTeam = get('SELECT * FROM hockey_teams WHERE id = ?', [bronzeTeamId]);

      // Handle relegation/promotion
      const relegatedTeams = playoffBracket.relegatedTeams || [];
      const promotedTeams = playoffBracket.promotedTeams || [];
      console.log('Relegation/Promotion - Relegated:', relegatedTeams, 'Promoted:', promotedTeams);

      // Update team divisions for relegated teams (move to div2)
      for (const team of relegatedTeams) {
        console.log('Relegating team:', team.teamId, team.teamName);
        run('UPDATE hockey_teams SET division = ?, group_name = NULL WHERE id = ?', ['div2', team.teamId]);
      }

      // For promoted teams, move them to top division
      for (const team of promotedTeams) {
        console.log('Promoting team, searching for name:', team.teamName);
        // Find div2 team with matching name and update to top
        const div2Team = get('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND name = ?',
          [season.world_id, 'div2', team.teamName]);
        console.log('Found div2 team:', div2Team ? div2Team.name : 'NOT FOUND');

        if (div2Team) {
          // Assign to group with fewer teams, or randomly
          const groupACnt = all('SELECT COUNT(*) as cnt FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'A'])[0].cnt;
          const groupBCnt = all('SELECT COUNT(*) as cnt FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'B'])[0].cnt;
          const assignGroup = groupACnt <= groupBCnt ? 'A' : 'B';
          console.log('Assigning to group:', assignGroup, '(A:', groupACnt, 'B:', groupBCnt, ')');
          run('UPDATE hockey_teams SET division = ?, group_name = ? WHERE id = ?', ['top', assignGroup, div2Team.id]);
        } else {
          // Try to find by short_name as fallback
          const div2TeamByShort = get('SELECT * FROM hockey_teams WHERE world_id = ? AND division = ? AND short_name = ?',
            [season.world_id, 'div2', team.teamName]);
          console.log('Fallback search by short_name:', div2TeamByShort ? div2TeamByShort.name : 'NOT FOUND');
          if (div2TeamByShort) {
            const groupACnt = all('SELECT COUNT(*) as cnt FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'A'])[0].cnt;
            const groupBCnt = all('SELECT COUNT(*) as cnt FROM hockey_teams WHERE world_id = ? AND division = ? AND group_name = ?', [season.world_id, 'top', 'B'])[0].cnt;
            const assignGroup = groupACnt <= groupBCnt ? 'A' : 'B';
            run('UPDATE hockey_teams SET division = ?, group_name = ? WHERE id = ?', ['top', assignGroup, div2TeamByShort.id]);
          }
        }
      }

      // Update bracket with final results
      playoffBracket.final.winner = goldTeam?.short_name;
      playoffBracket.bronzeMatch.winner = bronzeTeam?.short_name;

      // Save to history (use full team names for readability)
      run(`
        INSERT INTO hockey_season_history (id, world_id, year, gold_team_id, gold_team_name, silver_team_id, silver_team_name, bronze_team_id, bronze_team_name, promoted_teams, relegated_teams, final_standings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        season.world_id,
        season.year,
        goldTeamId,
        goldTeam?.name,
        silverTeamId,
        silverTeam?.name,
        bronzeTeamId,
        bronzeTeam?.name,
        JSON.stringify(promotedTeams),
        JSON.stringify(relegatedTeams),
        season.group_a_standings
      ]);

      run('UPDATE hockey_seasons SET status = ?, playoff_bracket = ? WHERE id = ?', ['completed', JSON.stringify(playoffBracket), seasonId]);

      return res.json({
        advanced: false,
        gold: goldTeam?.short_name,
        silver: silverTeam?.short_name,
        bronze: bronzeTeam?.short_name,
        message: 'Championship complete!'
      });
    }

    res.json({ advanced: false, message: 'No advancement needed' });
  } catch (error) {
    console.error('Error checking playoff advance:', error);
    res.status(500).json({ error: 'Failed to check playoff advance' });
  }
});

// Get season history
router.get('/worlds/:worldId/history', authMiddleware, (req, res) => {
  try {
    const history = all(`
      SELECT * FROM hockey_season_history
      WHERE world_id = ?
      ORDER BY year DESC
    `, [req.params.worldId]);

    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
