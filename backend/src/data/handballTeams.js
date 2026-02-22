// Czech Handball Extraliga Teams - 2024/2025 Season
// Real teams with power ratings based on current standings

const czechExtraligaTeams = [
  {
    name: 'Talent tým Plzeňského kraje',
    shortName: 'Talent Plzeň',
    city: 'Plzeň',
    logo: 'talent-plzen.svg',
    power: 95,
    attack: 96,
    defense: 93,
    goalkeeper: 94
  },
  {
    name: 'HC Baník Karviná',
    shortName: 'Karviná',
    city: 'Karviná',
    logo: 'karvina.svg',
    power: 90,
    attack: 91,
    defense: 89,
    goalkeeper: 90
  },
  {
    name: 'HC Dukla Praha',
    shortName: 'Dukla Praha',
    city: 'Praha',
    logo: 'dukla-praha.svg',
    power: 88,
    attack: 89,
    defense: 87,
    goalkeeper: 88
  },
  {
    name: 'HC ROBE Zubří',
    shortName: 'Zubří',
    city: 'Zubří',
    logo: 'zubri.svg',
    power: 85,
    attack: 86,
    defense: 84,
    goalkeeper: 85
  },
  {
    name: 'KH ISMM Kopřivnice',
    shortName: 'Kopřivnice',
    city: 'Kopřivnice',
    logo: 'koprivnice.svg',
    power: 82,
    attack: 83,
    defense: 81,
    goalkeeper: 82
  },
  {
    name: 'SKP Frýdek-Místek',
    shortName: 'Frýdek-Místek',
    city: 'Frýdek-Místek',
    logo: 'frydek-mistek.svg',
    power: 79,
    attack: 80,
    defense: 78,
    goalkeeper: 79
  },
  {
    name: 'Lovci Lovosice',
    shortName: 'Lovosice',
    city: 'Lovosice',
    logo: 'lovosice.svg',
    power: 76,
    attack: 77,
    defense: 75,
    goalkeeper: 76
  },
  {
    name: 'TJ Sokol Nové Veselí',
    shortName: 'Nové Veselí',
    city: 'Nové Veselí',
    logo: 'nove-veseli.svg',
    power: 73,
    attack: 74,
    defense: 72,
    goalkeeper: 73
  },
  {
    name: 'HBC Jičín',
    shortName: 'Jičín',
    city: 'Jičín',
    logo: 'jicin.svg',
    power: 70,
    attack: 71,
    defense: 69,
    goalkeeper: 70
  },
  {
    name: 'KP Brno',
    shortName: 'KP Brno',
    city: 'Brno',
    logo: 'kp-brno.svg',
    power: 68,
    attack: 69,
    defense: 67,
    goalkeeper: 68
  },
  {
    name: 'HBC Strakonice',
    shortName: 'Strakonice',
    city: 'Strakonice',
    logo: 'strakonice.svg',
    power: 65,
    attack: 66,
    defense: 64,
    goalkeeper: 65
  },
  {
    name: 'HC Zlín',
    shortName: 'Zlín',
    city: 'Zlín',
    logo: 'zlin.svg',
    power: 62,
    attack: 63,
    defense: 61,
    goalkeeper: 62
  }
];

// Second Czech League teams (for relegation simulation)
const czechSecondLeagueTeams = [
  { name: 'Sokol Písek', shortName: 'Písek', power: 58 },
  { name: 'TJ Cement Hranice', shortName: 'Hranice', power: 56 },
  { name: 'Sokol Přerov', shortName: 'Přerov', power: 54 },
  { name: 'TJ Holice', shortName: 'Holice', power: 52 },
  { name: 'HC Olomouc', shortName: 'Olomouc', power: 50 },
  { name: 'Sokol Vodňany', shortName: 'Vodňany', power: 48 },
  { name: 'HC Rokycany', shortName: 'Rokycany', power: 46 },
  { name: 'TJ Přeštice', shortName: 'Přeštice', power: 44 }
];

// Generate season schedule - each team plays against each other twice (home and away)
function generateLeagueSchedule(teams) {
  const rounds = [];
  const numTeams = teams.length;

  // Create team indices array
  const teamIndices = teams.map((_, i) => i);

  // First half of season (each team plays each other once)
  for (let round = 0; round < numTeams - 1; round++) {
    const roundMatches = [];

    for (let i = 0; i < numTeams / 2; i++) {
      const home = teamIndices[i];
      const away = teamIndices[numTeams - 1 - i];

      roundMatches.push({
        homeTeamIndex: home,
        awayTeamIndex: away,
        round: round + 1
      });
    }

    rounds.push(roundMatches);

    // Rotate teams (keep first team fixed)
    const last = teamIndices.pop();
    teamIndices.splice(1, 0, last);
  }

  // Second half of season (reverse home/away)
  const secondHalf = rounds.map((roundMatches, roundIndex) => {
    return roundMatches.map(match => ({
      homeTeamIndex: match.awayTeamIndex,
      awayTeamIndex: match.homeTeamIndex,
      round: roundIndex + numTeams
    }));
  });

  return [...rounds, ...secondHalf];
}

// Simulate a single match based on team powers
function simulateMatch(homeTeam, awayTeam, detailed = false, isPlayoff = false) {
  // Base expected goals based on power difference
  const homePower = (homeTeam.attack + homeTeam.power) / 2;
  const awayPower = (awayTeam.attack + awayTeam.power) / 2;
  const homeDefense = (homeTeam.defense + homeTeam.goalkeeper) / 2;
  const awayDefense = (awayTeam.defense + awayTeam.goalkeeper) / 2;

  // Home advantage
  const homeAdvantage = 3;

  // Calculate expected goals (handball typically has 25-35 goals per team)
  const baseGoals = 28;
  const homeExpected = baseGoals + (homePower - awayDefense) / 10 + homeAdvantage;
  const awayExpected = baseGoals + (awayPower - homeDefense) / 10;

  // Add randomness (more variance in handball)
  let homeScore = Math.max(15, Math.round(homeExpected + (Math.random() - 0.5) * 12));
  let awayScore = Math.max(15, Math.round(awayExpected + (Math.random() - 0.5) * 12));

  // Playoff matches cannot end in a draw - simulate overtime if needed
  if (isPlayoff && homeScore === awayScore) {
    // Overtime: add 1-3 goals to one team randomly (weighted by power)
    const homeAdvantageOT = homePower / (homePower + awayPower);
    if (Math.random() < homeAdvantageOT) {
      homeScore += Math.floor(Math.random() * 2) + 1;
    } else {
      awayScore += Math.floor(Math.random() * 2) + 1;
    }
  }

  // Halftime scores (roughly 45-50% of final score)
  const homeHalftime = Math.round(homeScore * (0.45 + Math.random() * 0.1));
  const awayHalftime = Math.round(awayScore * (0.45 + Math.random() * 0.1));

  const result = {
    homeScore,
    awayScore,
    homeHalftime,
    awayHalftime,
    events: []
  };

  // Generate detailed events if requested
  if (detailed) {
    result.events = generateMatchEvents(homeTeam, awayTeam, homeScore, awayScore);
  }

  return result;
}

// Generate minute-by-minute events for detailed simulation
function generateMatchEvents(homeTeam, awayTeam, finalHomeScore, finalAwayScore) {
  const events = [];
  let homeScore = 0;
  let awayScore = 0;

  // Distribute goals across 60 minutes
  const totalGoals = finalHomeScore + finalAwayScore;
  const goalMinutes = [];

  for (let i = 0; i < totalGoals; i++) {
    goalMinutes.push(Math.floor(Math.random() * 60) + 1);
  }
  goalMinutes.sort((a, b) => a - b);

  // Assign goals to teams based on final score ratio
  let homeGoalsRemaining = finalHomeScore;
  let awayGoalsRemaining = finalAwayScore;

  for (const minute of goalMinutes) {
    const isHomeGoal = Math.random() < (homeGoalsRemaining / (homeGoalsRemaining + awayGoalsRemaining));

    if (isHomeGoal && homeGoalsRemaining > 0) {
      homeScore++;
      homeGoalsRemaining--;
      events.push({
        minute,
        type: 'goal',
        team: 'home',
        teamName: homeTeam.shortName,
        score: `${homeScore}:${awayScore}`
      });
    } else if (awayGoalsRemaining > 0) {
      awayScore++;
      awayGoalsRemaining--;
      events.push({
        minute,
        type: 'goal',
        team: 'away',
        teamName: awayTeam.shortName,
        score: `${homeScore}:${awayScore}`
      });
    }
  }

  // Add halftime marker
  const halftimeHomeScore = events.filter(e => e.minute <= 30 && e.team === 'home').length;
  const halftimeAwayScore = events.filter(e => e.minute <= 30 && e.team === 'away').length;

  events.push({
    minute: 30,
    type: 'halftime',
    score: `${halftimeHomeScore}:${halftimeAwayScore}`
  });

  // Sort by minute
  events.sort((a, b) => a.minute - b.minute);

  return events;
}

// Calculate standings from match results
// Note: teams from database use snake_case (short_name), not camelCase
function calculateStandings(teams, matches) {
  const standings = teams.map(team => ({
    teamId: team.id,
    teamName: team.short_name || team.shortName, // Handle both cases
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));

  const standingsMap = {};
  standings.forEach(s => standingsMap[s.teamId] = s);

  for (const match of matches) {
    if (match.status !== 'completed') continue;

    const home = standingsMap[match.home_team_id];
    const away = standingsMap[match.away_team_id];

    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;
    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.won++;
      home.points += 2;
      away.lost++;
    } else if (match.home_score < match.away_score) {
      away.won++;
      away.points += 2;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  // Calculate goal difference and sort
  standings.forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

module.exports = {
  czechExtraligaTeams,
  czechSecondLeagueTeams,
  generateLeagueSchedule,
  simulateMatch,
  generateMatchEvents,
  calculateStandings
};
