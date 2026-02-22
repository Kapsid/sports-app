// Ice Hockey World Championship Teams
// Real IIHF national teams with power ratings

// Top Division (16 teams - 2 groups of 8)
const topDivisionTeams = [
  // Tier 1 (Power: 90-95)
  { name: 'Canada', shortName: 'CAN', countryCode: 'CAN', flag: 'CAN.png', power: 95, offense: 96, defense: 94, goaltending: 95 },
  { name: 'Finland', shortName: 'FIN', countryCode: 'FIN', flag: 'FIN.png', power: 94, offense: 93, defense: 95, goaltending: 94 },
  { name: 'Sweden', shortName: 'SWE', countryCode: 'SWE', flag: 'SWE.png', power: 93, offense: 92, defense: 94, goaltending: 93 },
  { name: 'USA', shortName: 'USA', countryCode: 'USA', flag: 'USA.png', power: 92, offense: 93, defense: 91, goaltending: 92 },
  { name: 'Czechia', shortName: 'CZE', countryCode: 'CZE', flag: 'CZE.png', power: 91, offense: 90, defense: 92, goaltending: 91 },
  { name: 'Switzerland', shortName: 'SUI', countryCode: 'SUI', flag: 'SUI.png', power: 90, offense: 89, defense: 91, goaltending: 90 },

  // Tier 2 (Power: 82-88)
  { name: 'Germany', shortName: 'GER', countryCode: 'GER', flag: 'GER.png', power: 88, offense: 87, defense: 88, goaltending: 89 },
  { name: 'Slovakia', shortName: 'SVK', countryCode: 'SVK', flag: 'SVK.png', power: 86, offense: 85, defense: 86, goaltending: 87 },
  { name: 'Latvia', shortName: 'LAT', countryCode: 'LAT', flag: 'LAT.png', power: 84, offense: 83, defense: 85, goaltending: 84 },
  { name: 'Denmark', shortName: 'DEN', countryCode: 'DEN', flag: 'DEN.png', power: 83, offense: 82, defense: 83, goaltending: 84 },
  { name: 'Norway', shortName: 'NOR', countryCode: 'NOR', flag: 'NOR.png', power: 82, offense: 81, defense: 82, goaltending: 83 },

  // Tier 3 (Power: 75-80)
  { name: 'France', shortName: 'FRA', countryCode: 'FRA', flag: 'FRA.png', power: 80, offense: 79, defense: 80, goaltending: 81 },
  { name: 'Austria', shortName: 'AUT', countryCode: 'AUT', flag: 'AUT.png', power: 78, offense: 77, defense: 78, goaltending: 79 },
  { name: 'Kazakhstan', shortName: 'KAZ', countryCode: 'KAZ', flag: 'KAZ.png', power: 77, offense: 76, defense: 77, goaltending: 78 },
  { name: 'Slovenia', shortName: 'SLO', countryCode: 'SLO', flag: 'SLO.png', power: 76, offense: 75, defense: 76, goaltending: 77 },
  { name: 'Great Britain', shortName: 'GBR', countryCode: 'GBR', flag: 'GBR.png', power: 75, offense: 74, defense: 75, goaltending: 76 }
];

// Division II (8 teams - single group)
const division2Teams = [
  { name: 'Hungary', shortName: 'HUN', countryCode: 'HUN', flag: 'HUN.png', power: 72, offense: 71, defense: 72, goaltending: 73 },
  { name: 'Italy', shortName: 'ITA', countryCode: 'ITA', flag: 'ITA.png', power: 71, offense: 70, defense: 71, goaltending: 72 },
  { name: 'Poland', shortName: 'POL', countryCode: 'POL', flag: 'POL.png', power: 70, offense: 69, defense: 70, goaltending: 71 },
  { name: 'South Korea', shortName: 'KOR', countryCode: 'KOR', flag: 'KOR.png', power: 68, offense: 67, defense: 68, goaltending: 69 },
  { name: 'Japan', shortName: 'JPN', countryCode: 'JPN', flag: 'JPN.png', power: 67, offense: 66, defense: 67, goaltending: 68 },
  { name: 'Lithuania', shortName: 'LTU', countryCode: 'LTU', flag: 'LTU.png', power: 65, offense: 64, defense: 65, goaltending: 66 },
  { name: 'Romania', shortName: 'ROU', countryCode: 'ROU', flag: 'ROU.png', power: 63, offense: 62, defense: 63, goaltending: 64 },
  { name: 'Ukraine', shortName: 'UKR', countryCode: 'UKR', flag: 'UKR.png', power: 62, offense: 61, defense: 62, goaltending: 63 }
];

// Division III teams (for promotion to Division II)
const division3Teams = [
  { name: 'China', shortName: 'CHN', countryCode: 'CHN', flag: 'CHN.png', power: 58, offense: 57, defense: 58, goaltending: 59 },
  { name: 'Serbia', shortName: 'SRB', countryCode: 'SRB', flag: 'SRB.png', power: 56, offense: 55, defense: 56, goaltending: 57 },
  { name: 'Netherlands', shortName: 'NED', countryCode: 'NED', flag: 'NED.png', power: 54, offense: 53, defense: 54, goaltending: 55 },
  { name: 'Croatia', shortName: 'CRO', countryCode: 'CRO', flag: 'CRO.png', power: 52, offense: 51, defense: 52, goaltending: 53 },
  { name: 'Spain', shortName: 'ESP', countryCode: 'ESP', flag: 'ESP.png', power: 50, offense: 49, defense: 50, goaltending: 51 },
  { name: 'Belgium', shortName: 'BEL', countryCode: 'BEL', flag: 'BEL.png', power: 48, offense: 47, defense: 48, goaltending: 49 },
  { name: 'Estonia', shortName: 'EST', countryCode: 'EST', flag: 'EST.png', power: 46, offense: 45, defense: 46, goaltending: 47 },
  { name: 'Iceland', shortName: 'ISL', countryCode: 'ISL', flag: 'ISL.png', power: 44, offense: 43, defense: 44, goaltending: 45 }
];

// Simulate a hockey match
function simulateHockeyMatch(homeTeam, awayTeam, isPlayoff = false, detailed = false) {
  // Hockey scoring: typically 2-5 goals per team
  const baseGoals = 2.8;

  // Calculate expected goals based on team attributes
  const homeOffense = (homeTeam.offense + homeTeam.power) / 2;
  const awayOffense = (awayTeam.offense + awayTeam.power) / 2;
  const homeDefense = (homeTeam.defense + homeTeam.goaltending) / 2;
  const awayDefense = (awayTeam.defense + awayTeam.goaltending) / 2;

  // Home advantage (less than in handball - neutral venue for WC)
  const homeAdvantage = 0.15;

  // Skill influence - balanced between predictable and random
  // Divide by 20 for moderate skill impact
  const powerDiff = (homeTeam.power - awayTeam.power) / 50;
  const homeExpected = baseGoals + (homeOffense - awayDefense) / 20 + homeAdvantage + powerDiff;
  const awayExpected = baseGoals + (awayOffense - homeDefense) / 20 - powerDiff;

  // Moderate randomness - variance of ±1.5 goals
  // Favorites should win more often but upsets still happen
  let homeScore = Math.max(0, Math.round(homeExpected + (Math.random() - 0.5) * 3));
  let awayScore = Math.max(0, Math.round(awayExpected + (Math.random() - 0.5) * 3));

  let overtime = false;
  let shootout = false;

  // Playoff matches cannot end in a draw - need OT + possible shootout
  if (isPlayoff && homeScore === awayScore) {
    overtime = true;
    // 70% chance OT decides it, 30% goes to shootout
    if (Math.random() < 0.7) {
      // OT goal
      const homeChance = homeOffense / (homeOffense + awayOffense);
      if (Math.random() < homeChance) {
        homeScore++;
      } else {
        awayScore++;
      }
    } else {
      // Shootout
      shootout = true;
      const homeChance = (homeOffense + homeTeam.goaltending) / (homeOffense + homeTeam.goaltending + awayOffense + awayTeam.goaltending);
      if (Math.random() < homeChance) {
        homeScore++;
      } else {
        awayScore++;
      }
    }
  }

  // Group stage: draws are allowed but rare - use OT for bonus points
  if (!isPlayoff && homeScore === awayScore && Math.random() < 0.6) {
    overtime = true;
    const homeChance = homeOffense / (homeOffense + awayOffense);
    if (Math.random() < homeChance) {
      homeScore++;
    } else {
      awayScore++;
    }
    // Could go to shootout
    if (homeScore === awayScore && Math.random() < 0.3) {
      shootout = true;
      if (Math.random() < homeChance) {
        homeScore++;
      } else {
        awayScore++;
      }
    }
  }

  // Generate period scores (3 periods)
  const periodScores = generatePeriodScores(homeScore, awayScore, overtime);

  const result = {
    homeScore,
    awayScore,
    overtime,
    shootout,
    periodScores,
    events: []
  };

  // Generate detailed events if requested
  if (detailed) {
    result.events = generateMatchEvents(homeTeam, awayTeam, homeScore, awayScore, overtime);
  }

  return result;
}

// Generate period-by-period scores
function generatePeriodScores(totalHome, totalAway, overtime) {
  const periods = [];
  let homeRemaining = totalHome;
  let awayRemaining = totalAway;

  // Distribute goals across 3 periods (or 4 with OT)
  const numPeriods = overtime ? 4 : 3;

  for (let i = 0; i < numPeriods - 1; i++) {
    const homeThisPeriod = Math.floor(Math.random() * (homeRemaining + 1) * 0.5);
    const awayThisPeriod = Math.floor(Math.random() * (awayRemaining + 1) * 0.5);

    periods.push({
      period: i + 1,
      home: homeThisPeriod,
      away: awayThisPeriod
    });

    homeRemaining -= homeThisPeriod;
    awayRemaining -= awayThisPeriod;
  }

  // Last period gets the rest
  periods.push({
    period: numPeriods,
    home: homeRemaining,
    away: awayRemaining
  });

  return periods;
}

// Generate detailed match events
function generateMatchEvents(homeTeam, awayTeam, finalHomeScore, finalAwayScore, overtime) {
  const events = [];
  let homeScore = 0;
  let awayScore = 0;

  // Total match time: 60 minutes (+ 20 for OT)
  const totalMinutes = overtime ? 65 : 60; // OT is 5 min sudden death
  const totalGoals = finalHomeScore + finalAwayScore;

  // Generate goal minutes
  const goalMinutes = [];
  for (let i = 0; i < totalGoals; i++) {
    goalMinutes.push(Math.floor(Math.random() * totalMinutes) + 1);
  }
  goalMinutes.sort((a, b) => a - b);

  // Assign goals to teams
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
        teamName: homeTeam.short_name || homeTeam.shortName,
        score: `${homeScore}:${awayScore}`,
        period: minute <= 20 ? 1 : minute <= 40 ? 2 : minute <= 60 ? 3 : 'OT'
      });
    } else if (awayGoalsRemaining > 0) {
      awayScore++;
      awayGoalsRemaining--;
      events.push({
        minute,
        type: 'goal',
        team: 'away',
        teamName: awayTeam.short_name || awayTeam.shortName,
        score: `${homeScore}:${awayScore}`,
        period: minute <= 20 ? 1 : minute <= 40 ? 2 : minute <= 60 ? 3 : 'OT'
      });
    }
  }

  // Add period break markers
  events.push({ minute: 20, type: 'period_end', period: 1 });
  events.push({ minute: 40, type: 'period_end', period: 2 });
  if (overtime) {
    events.push({ minute: 60, type: 'period_end', period: 3 });
  }

  // Sort by minute
  events.sort((a, b) => a.minute - b.minute);

  return events;
}

// Generate group stage schedule for 8 teams (round-robin)
function generateGroupSchedule(teams) {
  const rounds = [];
  const numTeams = teams.length;
  const teamIndices = teams.map((_, i) => i);

  // Each team plays each other once (7 rounds for 8 teams)
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

  return rounds;
}

// Calculate group standings with IIHF point system
// 3 points for regulation win
// 2 points for OT/SO win
// 1 point for OT/SO loss
// 0 points for regulation loss
function calculateStandings(teams, matches) {
  const standings = teams.map(team => ({
    teamId: team.id,
    teamName: team.name || team.short_name || team.shortName,
    countryCode: team.country_code || team.countryCode,
    flag: team.flag,
    played: 0,
    won: 0,
    wonOT: 0,
    lostOT: 0,
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

    const isOT = match.overtime || match.shootout;

    if (match.home_score > match.away_score) {
      if (isOT) {
        // Home OT win
        home.wonOT++;
        home.points += 2;
        away.lostOT++;
        away.points += 1;
      } else {
        // Home regulation win
        home.won++;
        home.points += 3;
        away.lost++;
      }
    } else {
      if (isOT) {
        // Away OT win
        away.wonOT++;
        away.points += 2;
        home.lostOT++;
        home.points += 1;
      } else {
        // Away regulation win
        away.won++;
        away.points += 3;
        home.lost++;
      }
    }
  }

  // Calculate goal difference and sort
  standings.forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  // Sort by: points, then goal difference, then goals for
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

// Assign teams to groups (seeded)
function assignTeamsToGroups(teams) {
  // Sort by power (strongest first)
  const sorted = [...teams].sort((a, b) => b.power - a.power);

  const groupA = [];
  const groupB = [];

  // Serpentine draft to balance groups
  for (let i = 0; i < sorted.length; i++) {
    if (i % 4 < 2) {
      // 0, 1, 4, 5, 8, 9... go to A if even index in pair, B if odd
      if (i % 2 === 0) {
        groupA.push({ ...sorted[i], groupName: 'A' });
      } else {
        groupB.push({ ...sorted[i], groupName: 'B' });
      }
    } else {
      // 2, 3, 6, 7, 10, 11... go to B if even index in pair, A if odd
      if (i % 2 === 0) {
        groupB.push({ ...sorted[i], groupName: 'B' });
      } else {
        groupA.push({ ...sorted[i], groupName: 'A' });
      }
    }
  }

  return { groupA, groupB };
}

// Simulate Division II season (background)
function simulateDiv2Season(teams) {
  // Simple round-robin simulation
  const standings = teams.map(team => ({
    teamName: team.name || team.short_name || team.shortName,
    countryCode: team.countryCode || team.country_code,
    power: team.power,
    played: 0,
    won: 0,
    wonOT: 0,
    lostOT: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));

  // Simulate all matches
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const result = simulateHockeyMatch(teams[i], teams[j], false, false);

      standings[i].played++;
      standings[j].played++;
      standings[i].goalsFor += result.homeScore;
      standings[i].goalsAgainst += result.awayScore;
      standings[j].goalsFor += result.awayScore;
      standings[j].goalsAgainst += result.homeScore;

      const isOT = result.overtime || result.shootout;

      if (result.homeScore > result.awayScore) {
        if (isOT) {
          standings[i].wonOT++;
          standings[i].points += 2;
          standings[j].lostOT++;
          standings[j].points += 1;
        } else {
          standings[i].won++;
          standings[i].points += 3;
          standings[j].lost++;
        }
      } else {
        if (isOT) {
          standings[j].wonOT++;
          standings[j].points += 2;
          standings[i].lostOT++;
          standings[i].points += 1;
        } else {
          standings[j].won++;
          standings[j].points += 3;
          standings[i].lost++;
        }
      }
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

// Simulate Division III season and get promoted team
function simulateDiv3Season() {
  const standings = simulateDiv2Season(division3Teams);
  // Top team promotes to Division II
  return standings[0];
}

module.exports = {
  topDivisionTeams,
  division2Teams,
  division3Teams,
  simulateHockeyMatch,
  generatePeriodScores,
  generateMatchEvents,
  generateGroupSchedule,
  calculateStandings,
  assignTeamsToGroups,
  simulateDiv2Season,
  simulateDiv3Season
};
