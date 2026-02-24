// Golf Simulation Engine
// Simulates holes, rounds, and applies cuts for PGA Tour-style tournaments

/**
 * Generate 18 course holes that sum to the given par
 */
function generateCourseHoles(coursePar) {
  const holes = [];
  let remainingPar = coursePar;
  const parOptions = [3, 4, 5];

  // Typical distribution: 4 par-3s, 10 par-4s, 4 par-5s = 72
  // Adjust for different course pars
  for (let i = 0; i < 18; i++) {
    const holesLeft = 18 - i;
    const avgNeeded = remainingPar / holesLeft;

    let par;
    if (holesLeft === 1) {
      par = remainingPar;
    } else if (avgNeeded <= 3.2) {
      par = Math.random() < 0.7 ? 3 : 4;
    } else if (avgNeeded >= 4.8) {
      par = Math.random() < 0.7 ? 5 : 4;
    } else if (avgNeeded <= 3.7) {
      par = Math.random() < 0.4 ? 3 : 4;
    } else if (avgNeeded >= 4.3) {
      par = Math.random() < 0.4 ? 5 : 4;
    } else {
      // Normal distribution around par 4
      const r = Math.random();
      if (r < 0.22) par = 3;
      else if (r < 0.78) par = 4;
      else par = 5;
    }

    // Ensure par is valid
    par = Math.max(3, Math.min(5, par));

    // Ensure remaining holes can still sum to remaining par
    const afterThis = remainingPar - par;
    const minPossible = (holesLeft - 1) * 3;
    const maxPossible = (holesLeft - 1) * 5;
    if (afterThis < minPossible) par = remainingPar - maxPossible;
    if (afterThis > maxPossible) par = remainingPar - minPossible;
    par = Math.max(3, Math.min(5, par));

    holes.push({ hole: i + 1, par });
    remainingPar -= par;
  }

  return holes;
}

/**
 * Get score label from strokes relative to par
 */
function getScoreLabel(relToPar) {
  if (relToPar <= -2) return 'Eagle';
  if (relToPar === -1) return 'Birdie';
  if (relToPar === 0) return 'Par';
  if (relToPar === 1) return 'Bogey';
  if (relToPar === 2) return 'Double Bogey';
  return 'Triple Bogey+';
}

/**
 * Simulate a single hole for a golfer
 */
function simulateHole(golfer, hole, courseDifficulty = 1.0) {
  const par = hole.par;

  // Skill weights vary by hole par
  let weightedSkill;
  if (par === 3) {
    weightedSkill = golfer.skill_short_game * 0.40 + golfer.skill_putting * 0.40 + golfer.skill_mental * 0.20;
  } else if (par === 4) {
    weightedSkill = golfer.skill_driving * 0.25 + golfer.skill_iron_play * 0.25 + golfer.skill_putting * 0.25 + golfer.skill_short_game * 0.15 + golfer.skill_mental * 0.10;
  } else {
    // par 5
    weightedSkill = golfer.skill_driving * 0.30 + golfer.skill_iron_play * 0.25 + golfer.skill_short_game * 0.20 + golfer.skill_putting * 0.15 + golfer.skill_mental * 0.10;
  }

  // Apply consistency and form
  const consistencyFactor = (golfer.consistency - 50) / 200; // -0.25 to +0.225
  const formFactor = (golfer.form - 50) / 300; // smaller effect

  // Base probability adjusted by skill
  const normalizedSkill = (weightedSkill + consistencyFactor * 100 + formFactor * 100) / 100;

  // Random factor with normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Score relative to par
  // Higher skill = more likely to be under par
  // Base: par, then skill shifts it down, randomness adds variance
  const skillShift = -(normalizedSkill - 0.65) * 1.5; // Positive skill = negative score (under par)
  const randomShift = z * (1.1 - consistencyFactor * 0.5) * courseDifficulty;
  let scoreDiff = Math.round(skillShift + randomShift);

  // Clamp outcomes by par
  if (par === 3) {
    scoreDiff = Math.max(-2, Math.min(3, scoreDiff)); // Eagle to Triple
  } else if (par === 4) {
    scoreDiff = Math.max(-2, Math.min(3, scoreDiff)); // Eagle to Triple
  } else {
    scoreDiff = Math.max(-2, Math.min(3, scoreDiff)); // Eagle to Triple
  }

  // Make eagles rarer
  if (scoreDiff <= -2) {
    if (par === 3) {
      // Hole-in-one: very rare
      scoreDiff = Math.random() < 0.02 ? -2 : -1;
    } else if (par === 4) {
      // Eagle on par 4: rare
      scoreDiff = Math.random() < 0.08 ? -2 : -1;
    } else {
      // Eagle on par 5: somewhat common for good players
      scoreDiff = Math.random() < 0.15 + (normalizedSkill - 0.65) * 0.3 ? -2 : -1;
    }
  }

  const strokes = par + scoreDiff;
  const label = getScoreLabel(scoreDiff);

  return {
    hole: hole.hole,
    par,
    score: scoreDiff,
    strokes,
    label
  };
}

/**
 * Simulate a full 18-hole round for a golfer
 */
function simulateRound(golfer, courseHoles, courseDifficulty = 1.0) {
  const holeResults = [];
  let totalScore = 0;
  let totalStrokes = 0;

  for (const hole of courseHoles) {
    const result = simulateHole(golfer, hole, courseDifficulty);
    holeResults.push(result);
    totalScore += result.score;
    totalStrokes += result.strokes;
  }

  return {
    holeResults,
    roundScore: totalScore,
    roundStrokes: totalStrokes
  };
}

/**
 * Apply the cut after round 2. Top 65 + ties make the cut.
 */
function applyCut(results, cutSize = 65) {
  if (results.length <= cutSize) {
    return { cutLine: null, madeTheCut: results, missedTheCut: [] };
  }

  // Sort by total score (ascending - lowest is best)
  const sorted = [...results].sort((a, b) => a.totalScore - b.totalScore);

  // Find the score at position cutSize
  const cutScore = sorted[cutSize - 1].totalScore;

  // Include all ties at the cut line
  const madeTheCut = sorted.filter(r => r.totalScore <= cutScore);
  const missedTheCut = sorted.filter(r => r.totalScore > cutScore);

  return {
    cutLine: cutScore,
    madeTheCut,
    missedTheCut
  };
}

/**
 * Calculate positions with ties (T1, T2, etc.)
 */
function calculatePositions(results) {
  const sorted = [...results].sort((a, b) => a.totalScore - b.totalScore);

  let position = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalScore !== sorted[i - 1].totalScore) {
      position = i + 1;
    }
    sorted[i].position = position;
    sorted[i].tied = false;
  }

  // Mark ties
  for (let i = 0; i < sorted.length; i++) {
    const sameScore = sorted.filter(r => r.totalScore === sorted[i].totalScore);
    if (sameScore.length > 1) {
      sorted[i].tied = true;
    }
  }

  return sorted;
}

module.exports = {
  generateCourseHoles,
  simulateHole,
  simulateRound,
  applyCut,
  calculatePositions,
  getScoreLabel
};
