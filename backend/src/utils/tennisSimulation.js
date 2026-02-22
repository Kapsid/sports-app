// Tennis Match Simulation Engine
// Simulates realistic tennis matches based on player skills

const { TOURNAMENT_TYPES, TOURNAMENT_POINTS } = require('../data/tennisCalendar');

// Calculate player's overall strength for a match
function calculatePlayerStrength(player, surface) {
  const baseSkills = (
    player.skill_serve * 1.2 +
    player.skill_forehand * 1.1 +
    player.skill_backhand * 1.0 +
    player.skill_volley * 0.8 +
    player.skill_movement * 1.0 +
    player.skill_mental * 1.1
  ) / 6.2;

  // Surface bonus
  let surfaceBonus = 0;
  if (player.specialty === surface) {
    surfaceBonus = 5;
  } else if (player.specialty === 'all-round') {
    surfaceBonus = 2;
  }

  // Form factor (-10 to +10)
  const formFactor = (player.form - 70) / 3;

  // Consistency affects variance, not direct strength
  const strength = baseSkills + surfaceBonus + formFactor;

  return {
    strength,
    consistency: player.consistency,
    serveStrength: player.skill_serve,
    returnStrength: (player.skill_forehand + player.skill_backhand + player.skill_movement) / 3,
    mentalStrength: player.skill_mental
  };
}

// Simulate a single point
function simulatePoint(serverStats, returnerStats, isBreakPoint = false, isTiebreak = false) {
  // Base probability from serve strength vs return strength
  let serverWinProb = 0.5 + (serverStats.serveStrength - returnerStats.returnStrength) / 200;

  // Mental factor on big points
  if (isBreakPoint) {
    const mentalDiff = (serverStats.mentalStrength - returnerStats.mentalStrength) / 100;
    serverWinProb += mentalDiff * 0.05;
  }

  // Tiebreak pressure
  if (isTiebreak) {
    const mentalDiff = (serverStats.mentalStrength - returnerStats.mentalStrength) / 100;
    serverWinProb += mentalDiff * 0.03;
  }

  // Add randomness based on consistency (lower consistency = more variance)
  const avgConsistency = (serverStats.consistency + returnerStats.consistency) / 2;
  const variance = (100 - avgConsistency) / 100 * 0.15;
  serverWinProb += (Math.random() - 0.5) * variance;

  // Clamp probability
  serverWinProb = Math.max(0.25, Math.min(0.85, serverWinProb));

  return Math.random() < serverWinProb;
}

// Simulate a game (returns winner: 1 or 2)
function simulateGame(player1Stats, player2Stats, server, isTiebreak = false) {
  const serverStats = server === 1 ? player1Stats : player2Stats;
  const returnerStats = server === 1 ? player2Stats : player1Stats;

  if (isTiebreak) {
    return simulateTiebreak(player1Stats, player2Stats);
  }

  let serverPoints = 0;
  let returnerPoints = 0;
  const gamePoints = [];

  while (true) {
    const isBreakPoint = returnerPoints >= 3 && returnerPoints > serverPoints;
    const serverWins = simulatePoint(serverStats, returnerStats, isBreakPoint, false);

    if (serverWins) {
      serverPoints++;
    } else {
      returnerPoints++;
    }

    // Record point for live simulation
    gamePoints.push({
      server: server,
      serverPoints,
      returnerPoints,
      point: getPointDisplay(serverPoints, returnerPoints)
    });

    // Check for game winner
    if (serverPoints >= 4 && serverPoints - returnerPoints >= 2) {
      return { winner: server, points: gamePoints };
    }
    if (returnerPoints >= 4 && returnerPoints - serverPoints >= 2) {
      return { winner: server === 1 ? 2 : 1, points: gamePoints };
    }
  }
}

// Get tennis point display (0, 15, 30, 40, AD)
function getPointDisplay(serverPoints, returnerPoints) {
  const pointNames = ['0', '15', '30', '40'];

  if (serverPoints < 4 && returnerPoints < 4) {
    return `${pointNames[serverPoints]}-${pointNames[returnerPoints]}`;
  }

  if (serverPoints === returnerPoints) {
    return 'Deuce';
  }

  if (serverPoints > returnerPoints) {
    return 'AD-40';
  }
  return '40-AD';
}

// Simulate a tiebreak
function simulateTiebreak(player1Stats, player2Stats) {
  let p1Points = 0;
  let p2Points = 0;
  let server = 1; // First server
  let pointsPlayed = 0;
  const points = [];

  while (true) {
    const serverStats = server === 1 ? player1Stats : player2Stats;
    const returnerStats = server === 1 ? player2Stats : player1Stats;

    const serverWins = simulatePoint(serverStats, returnerStats, false, true);

    if (serverWins) {
      if (server === 1) p1Points++;
      else p2Points++;
    } else {
      if (server === 1) p2Points++;
      else p1Points++;
    }

    pointsPlayed++;
    points.push({
      p1Points,
      p2Points,
      server,
      display: `${p1Points}-${p2Points}`
    });

    // Check for tiebreak winner
    if ((p1Points >= 7 || p2Points >= 7) && Math.abs(p1Points - p2Points) >= 2) {
      return {
        winner: p1Points > p2Points ? 1 : 2,
        score: `${p1Points}-${p2Points}`,
        points
      };
    }

    // Switch server: first point then every 2 points
    if (pointsPlayed === 1 || (pointsPlayed > 1 && (pointsPlayed - 1) % 2 === 0)) {
      server = server === 1 ? 2 : 1;
    }
  }
}

// Simulate a set
function simulateSet(player1Stats, player2Stats, startingServer = 1) {
  let p1Games = 0;
  let p2Games = 0;
  let server = startingServer;
  const games = [];

  while (true) {
    // Check if tiebreak
    if (p1Games === 6 && p2Games === 6) {
      const tiebreak = simulateTiebreak(player1Stats, player2Stats);
      games.push({
        type: 'tiebreak',
        server,
        ...tiebreak
      });

      if (tiebreak.winner === 1) {
        p1Games = 7;
      } else {
        p2Games = 7;
      }

      return {
        winner: tiebreak.winner,
        score: `${p1Games}-${p2Games}`,
        games,
        finalServer: server
      };
    }

    // Regular game
    const game = simulateGame(player1Stats, player2Stats, server);
    games.push({
      type: 'game',
      server,
      winner: game.winner,
      points: game.points
    });

    if (game.winner === 1) {
      p1Games++;
    } else {
      p2Games++;
    }

    // Check for set winner
    if ((p1Games >= 6 || p2Games >= 6) && Math.abs(p1Games - p2Games) >= 2) {
      return {
        winner: p1Games > p2Games ? 1 : 2,
        score: `${p1Games}-${p2Games}`,
        games,
        finalServer: server
      };
    }

    // Switch server
    server = server === 1 ? 2 : 1;
  }
}

// Simulate a full match
function simulateMatch(player1, player2, surface, bestOf = 3) {
  const player1Stats = calculatePlayerStrength(player1, surface);
  const player2Stats = calculatePlayerStrength(player2, surface);

  const setsToWin = Math.ceil(bestOf / 2);
  let p1Sets = 0;
  let p2Sets = 0;
  let server = Math.random() < 0.5 ? 1 : 2; // Random first server
  const sets = [];

  while (p1Sets < setsToWin && p2Sets < setsToWin) {
    const set = simulateSet(player1Stats, player2Stats, server);
    sets.push(set);

    if (set.winner === 1) {
      p1Sets++;
    } else {
      p2Sets++;
    }

    // Winner of set serves first in next set
    server = set.finalServer === 1 ? 2 : 1;
  }

  const winner = p1Sets > p2Sets ? 1 : 2;
  const score = sets.map(s => s.score).join(' ');

  return {
    winner,
    winnerId: winner === 1 ? player1.id : player2.id,
    loserId: winner === 1 ? player2.id : player1.id,
    score,
    sets,
    p1Sets,
    p2Sets,
    player1Stats,
    player2Stats
  };
}

// Fast simulation - just returns winner and score without detailed points
function simulateMatchFast(player1, player2, surface, bestOf = 3) {
  const result = simulateMatch(player1, player2, surface, bestOf);

  return {
    winner: result.winner,
    winnerId: result.winnerId,
    loserId: result.loserId,
    score: result.score,
    p1Sets: result.p1Sets,
    p2Sets: result.p2Sets
  };
}

// Generate tournament bracket with seeding
function generateBracket(players, drawSize, tournamentType) {
  // Sort players by ranking points (descending) and assign ranks
  const sortedPlayers = [...players]
    .sort((a, b) => b.ranking_points - a.ranking_points)
    .map((player, index) => ({ ...player, rank: index + 1 }));

  // Determine number of seeds based on tournament type
  let numSeeds;
  switch (tournamentType) {
    case 'grand_slam':
      numSeeds = 32;
      break;
    case 'masters_1000':
      numSeeds = 16;
      break;
    case 'atp_500':
      numSeeds = 8;
      break;
    default:
      numSeeds = 8;
  }

  // Take top players as seeds
  const seeds = sortedPlayers.slice(0, Math.min(numSeeds, sortedPlayers.length));
  const unseeded = sortedPlayers.slice(numSeeds);

  // Shuffle unseeded players
  for (let i = unseeded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]];
  }

  // Create draw array
  const draw = new Array(drawSize).fill(null);

  // Place seeds according to ATP seeding positions
  const seedPositions = getSeedPositions(drawSize, numSeeds);
  seeds.forEach((player, index) => {
    if (index < seedPositions.length) {
      draw[seedPositions[index]] = { ...player, seed: index + 1 };
    }
  });

  // Fill remaining spots with unseeded players
  let unseededIndex = 0;
  for (let i = 0; i < draw.length && unseededIndex < unseeded.length; i++) {
    if (draw[i] === null) {
      draw[i] = unseeded[unseededIndex++];
    }
  }

  // Generate rounds structure
  const rounds = [];
  let currentRound = [];
  let roundSize = drawSize / 2;
  let roundNumber = 1;

  // First round matches
  for (let i = 0; i < drawSize; i += 2) {
    currentRound.push({
      matchNumber: i / 2 + 1,
      player1: draw[i],
      player2: draw[i + 1],
      winner: null,
      score: null,
      status: 'scheduled'
    });
  }

  rounds.push({
    name: getRoundName(drawSize, roundNumber),
    matches: currentRound
  });

  // Generate subsequent round placeholders
  while (roundSize > 1) {
    roundNumber++;
    const nextRound = [];
    const numMatches = roundSize / 2;

    for (let i = 0; i < numMatches; i++) {
      nextRound.push({
        matchNumber: i + 1,
        player1: null,
        player2: null,
        winner: null,
        score: null,
        status: 'waiting'
      });
    }

    rounds.push({
      name: getRoundName(drawSize, roundNumber),
      matches: nextRound
    });

    roundSize = numMatches;
  }

  return {
    drawSize,
    players: draw,
    rounds,
    currentRound: 0
  };
}

// Get seeding positions for a draw
function getSeedPositions(drawSize, numSeeds) {
  // Standard ATP/WTA seeding positions
  const positions = {
    128: {
      32: [0, 127, 64, 63, 32, 95, 96, 31, 16, 111, 80, 47, 48, 79, 112, 15,
           8, 119, 72, 55, 40, 87, 104, 23, 24, 103, 88, 39, 56, 71, 120, 7]
    },
    96: {
      16: [0, 95, 48, 47, 24, 71, 72, 23, 12, 83, 60, 35, 36, 59, 84, 11]
    },
    64: {
      16: [0, 63, 32, 31, 16, 47, 48, 15, 8, 55, 40, 23, 24, 39, 56, 7]
    },
    48: {
      8: [0, 47, 24, 23, 12, 35, 36, 11]
    },
    32: {
      8: [0, 31, 16, 15, 8, 23, 24, 7]
    }
  };

  if (positions[drawSize] && positions[drawSize][numSeeds]) {
    return positions[drawSize][numSeeds];
  }

  // Fallback: simple placement
  const result = [0];
  if (numSeeds > 1) result.push(drawSize - 1);
  if (numSeeds > 2) result.push(Math.floor(drawSize / 2));
  if (numSeeds > 3) result.push(Math.floor(drawSize / 2) - 1);
  // Add more positions as needed
  return result.slice(0, numSeeds);
}

// Get round name based on draw size and round number
function getRoundName(drawSize, roundNumber) {
  const totalRounds = Math.log2(drawSize);
  const roundsFromEnd = totalRounds - roundNumber;

  switch (roundsFromEnd) {
    case 0:
      return 'Final';
    case 1:
      return 'Semifinals';
    case 2:
      return 'Quarterfinals';
    case 3:
      return 'Round of 16';
    case 4:
      return 'Round of 32';
    case 5:
      return 'Round of 64';
    case 6:
      return 'Round of 128';
    default:
      return `Round ${roundNumber}`;
  }
}

// Get points for reaching a specific round
function getPointsForRound(tournamentType, roundName) {
  const pointsMap = TOURNAMENT_POINTS[tournamentType];
  if (!pointsMap) return 0;

  const roundMapping = {
    'Winner': 'winner',
    'Final': 'finalist',
    'Semifinals': 'semifinal',
    'Quarterfinals': 'quarterfinal',
    'Round of 16': 'round16',
    'Round of 32': 'round32',
    'Round of 64': 'round64',
    'Round of 128': 'round128',
    'Round of 96': 'round96'
  };

  const key = roundMapping[roundName];
  return pointsMap[key] || 0;
}

// Get best of sets based on tournament type
function getBestOf(tournamentType) {
  return tournamentType === 'grand_slam' ? 5 : 3;
}

// Get Grand Slam code for achievements
function getGrandSlamCode(eventName) {
  if (eventName.includes('Australian')) return 'aus';
  if (eventName.includes('French') || eventName.includes('Roland')) return 'fra';
  if (eventName.includes('Wimbledon')) return 'wim';
  if (eventName.includes('US Open')) return 'uso';
  return null;
}

// Format round result for history
function formatRoundResult(roundName) {
  switch (roundName) {
    case 'Final': return 'F';
    case 'Semifinals': return 'SF';
    case 'Quarterfinals': return 'QF';
    case 'Round of 16': return 'R16';
    case 'Round of 32': return 'R32';
    case 'Round of 64': return 'R64';
    case 'Round of 128': return 'R128';
    default: return roundName;
  }
}

module.exports = {
  calculatePlayerStrength,
  simulatePoint,
  simulateGame,
  simulateTiebreak,
  simulateSet,
  simulateMatch,
  simulateMatchFast,
  generateBracket,
  getRoundName,
  getPointsForRound,
  getBestOf,
  getGrandSlamCode,
  formatRoundResult
};
