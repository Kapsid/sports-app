<template>
  <div class="golf-event">
    <header class="page-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-golf-ball-tee"></i>
            <span>Golf</span>
          </div>
        </div>
        <div class="breadcrumb" v-if="event">
          <span class="event-badge" :style="getTournamentBadgeStyle(event.tournament_type)">
            {{ getTournamentLabel(event.tournament_type) }}
          </span>
          <span class="event-name">{{ event.name }}</span>
        </div>
        <div class="user-menu">
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="event-main">
      <div class="container">
        <!-- Loading state -->
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Loading tournament...</span>
        </div>

        <template v-else-if="event">
          <!-- Event Info Card -->
          <div class="event-info-card fade-in">
            <div class="event-info-left">
              <h1 class="event-title">{{ event.name }}</h1>
              <div class="event-meta">
                <span class="meta-item">
                  <i class="fa-solid fa-location-dot"></i>
                  {{ event.location }}
                </span>
                <span v-if="event.country" class="meta-item">
                  <img :src="`/flags/${event.country}.png`" class="flag-sm" />
                  {{ event.country }}
                </span>
                <span v-if="event.course_name" class="meta-item">
                  <i class="fa-solid fa-flag"></i>
                  {{ event.course_name }}
                </span>
                <span v-if="event.par || event.course_par" class="meta-item">
                  <i class="fa-solid fa-bullseye"></i>
                  Par {{ event.par || event.course_par }}
                </span>
                <span v-if="event.field_size" class="meta-item">
                  <i class="fa-solid fa-users"></i>
                  Field: {{ event.field_size }}
                </span>
                <span class="meta-item">
                  <span class="type-badge" :style="getTournamentBadgeStyle(event.tournament_type)">
                    {{ getTournamentLabel(event.tournament_type) }}
                  </span>
                </span>
              </div>
            </div>
            <div class="event-info-right">
              <span class="event-status" :class="event.status">
                {{ formatStatus(event.status) }}
              </span>
            </div>
          </div>

          <!-- Round Controls -->
          <div class="round-controls fade-in">
            <div class="rounds-row">
              <button
                v-for="roundNum in 4"
                :key="roundNum"
                class="round-btn"
                :class="{
                  completed: isRoundCompleted(roundNum),
                  active: roundNum === nextRoundToPlay && !animating && !manualMode,
                  current: (animating || manualMode) && roundNum === currentAnimatingRound
                }"
                @click="scrollToRound(roundNum)"
              >
                <span class="round-label">Round {{ roundNum }}</span>
                <i v-if="isRoundCompleted(roundNum)" class="fa-solid fa-circle-check round-check"></i>
              </button>
            </div>

            <!-- Animation / Hole-by-hole indicator -->
            <div v-if="animating || manualMode" class="animation-indicator">
              <div class="hole-progress">
                <i class="fa-solid fa-golf-ball-tee" :class="{ 'spin-slow': animating }"></i>
                <span>Hole {{ displayedHole }} of 18</span>
              </div>
              <div class="hole-controls">
                <template v-if="manualMode">
                  <button v-if="displayedHole < 18" @click="advanceOneHole" class="btn btn-primary golf-btn btn-sm">
                    <i class="fa-solid fa-forward-step"></i>
                    Next Hole
                  </button>
                  <button v-else @click="finishManualMode" class="btn btn-primary golf-btn btn-sm">
                    <i class="fa-solid fa-flag-checkered"></i>
                    Finish Round
                  </button>
                  <button @click="autoPlayRemaining" class="btn btn-secondary btn-sm" title="Auto-play remaining holes">
                    <i class="fa-solid fa-forward-fast"></i>
                    Auto
                  </button>
                </template>
                <template v-else>
                  <button @click="switchToManual" class="btn btn-secondary btn-sm" title="Switch to manual hole-by-hole">
                    <i class="fa-solid fa-hand-pointer"></i>
                    Manual
                  </button>
                  <button @click="handleSkipAnimation" class="btn btn-secondary btn-sm">
                    <i class="fa-solid fa-forward-fast"></i>
                    Skip
                  </button>
                </template>
              </div>
            </div>

            <!-- Cut info after round 2 -->
            <div v-if="cutLine !== null && completedRounds >= 2" class="cut-info">
              <i class="fa-solid fa-scissors"></i>
              <span>Cut at {{ formatScore(cutLine) }} &mdash; {{ playersAfterCut }} players made the cut</span>
            </div>

            <!-- Action buttons -->
            <div class="action-row" v-if="!animating && !manualMode">
              <template v-if="event.status !== 'completed' && nextRoundToPlay && nextRoundToPlay <= 4">
                <button
                  @click="handleSimulateRound"
                  class="btn btn-primary golf-btn"
                  :disabled="simulatingRound"
                >
                  <i v-if="simulatingRound" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-play"></i>
                  {{ simulatingRound ? 'Simulating...' : `Simulate Round ${nextRoundToPlay}` }}
                </button>
                <button
                  @click="handleSimulateRoundManual"
                  class="btn btn-secondary"
                  :disabled="simulatingRound"
                >
                  <i v-if="simulatingRound" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-step"></i>
                  Hole by Hole
                </button>
              </template>
              <button
                v-if="event.status !== 'completed' && completedRounds >= 4"
                @click="handleCompleteEvent"
                class="btn btn-primary golf-btn"
                :disabled="completingEvent"
              >
                <i v-if="completingEvent" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-flag-checkered"></i>
                {{ completingEvent ? 'Completing...' : 'Complete Tournament' }}
              </button>
              <div v-if="event.status === 'completed'" class="completed-badge">
                <i class="fa-solid fa-trophy"></i>
                Tournament Complete
              </div>
            </div>
          </div>

          <!-- Winner display -->
          <div v-if="event.status === 'completed' && leaderboard.length > 0" class="winner-card fade-in">
            <div class="winner-trophy">
              <i class="fa-solid fa-trophy"></i>
            </div>
            <div class="winner-info">
              <div class="winner-label">Champion</div>
              <div class="winner-name">
                <img :src="`/flags/${leaderboard[0].country}.png`" class="flag-md" />
                {{ leaderboard[0].firstName }} {{ leaderboard[0].lastName }}
              </div>
              <div class="winner-score">
                {{ formatScore(leaderboard[0].totalScore) }} ({{ leaderboard[0].totalStrokes }})
              </div>
            </div>
          </div>

          <!-- Leaderboard Table -->
          <div v-if="leaderboard.length > 0" class="leaderboard-card fade-in">
            <h2 class="leaderboard-title">
              <i class="fa-solid fa-ranking-star"></i>
              Leaderboard
            </h2>
            <div class="leaderboard-table-wrapper">
              <table class="leaderboard-table">
                <thead>
                  <tr>
                    <th class="col-pos">Pos</th>
                    <th class="col-flag"></th>
                    <th class="col-player">Player</th>
                    <th v-for="rn in completedRoundsForDisplay" :key="rn" class="col-round">R{{ rn }}</th>
                    <th class="col-total">Total</th>
                    <th class="col-score">Score</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(entry, index) in leaderboard" :key="entry.playerId">
                    <!-- Cut line separator -->
                    <tr
                      v-if="showCutLineBefore(index)"
                      class="cut-line-row"
                    >
                      <td :colspan="3 + completedRoundsForDisplay.length + 2">
                        <div class="cut-line-divider">
                          <span class="cut-line-text">
                            <i class="fa-solid fa-scissors"></i>
                            Projected Cut
                          </span>
                        </div>
                      </td>
                    </tr>
                    <!-- Player row -->
                    <tr
                      class="player-row"
                      :class="{
                        'missed-cut': entry.missedCut,
                        'top-3': !entry.missedCut && entry.numericPos <= 3
                      }"
                      @click="openScorecardModal(entry)"
                    >
                      <td class="col-pos">
                        <span class="pos-text" :class="{ 'pos-mc': entry.missedCut }">
                          {{ formatPosition(entry.position, entry.tied, entry.missedCut) }}
                        </span>
                      </td>
                      <td class="col-flag">
                        <img :src="`/flags/${entry.country}.png`" class="flag-xs" />
                      </td>
                      <td class="col-player">
                        <span class="player-name">{{ entry.firstName }} {{ entry.lastName }}</span>
                        <span v-if="entry.worldRanking" class="world-rank">({{ entry.worldRanking }})</span>
                      </td>
                      <td v-for="rn in completedRoundsForDisplay" :key="rn" class="col-round">
                        <span v-if="entry.rounds[rn]" class="round-score">{{ entry.rounds[rn].strokes }}</span>
                        <span v-else class="round-score no-score">-</span>
                      </td>
                      <td class="col-total">
                        <span class="total-strokes">{{ entry.totalStrokes }}</span>
                      </td>
                      <td class="col-score">
                        <span class="score-value" :class="getScoreClass(entry.totalScore)">
                          {{ formatScore(entry.totalScore) }}
                        </span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty state when no rounds yet -->
          <div v-else-if="event.status === 'upcoming'" class="empty-state fade-in">
            <div class="empty-icon">
              <i class="fa-solid fa-golf-ball-tee"></i>
            </div>
            <h3>Tournament Not Started</h3>
            <p>Simulate the first round to begin the tournament and populate the leaderboard.</p>
          </div>
        </template>
      </div>
    </main>

    <!-- Scorecard Modal -->
    <div v-if="scorecardPlayer" class="modal-overlay" @click.self="scorecardPlayer = null">
      <div class="scorecard-modal fade-in">
        <!-- Modal Header -->
        <div class="scorecard-modal-header">
          <div class="scorecard-player-info">
            <div class="scorecard-player-pos" :class="getScoreClass(scorecardPlayer.totalScore)">
              {{ formatPosition(scorecardPlayer.position, scorecardPlayer.tied, scorecardPlayer.missedCut) }}
            </div>
            <img :src="`/flags/${scorecardPlayer.country}.png`" class="flag-md" />
            <div>
              <div class="scorecard-player-name">
                {{ scorecardPlayer.firstName }} {{ scorecardPlayer.lastName }}
                <span v-if="scorecardPlayer.worldRanking" class="scorecard-world-rank">({{ scorecardPlayer.worldRanking }})</span>
              </div>
              <div class="scorecard-player-score">
                <span :class="getScoreClass(scorecardPlayer.totalScore)">{{ formatScore(scorecardPlayer.totalScore) }}</span>
                <span class="scorecard-player-strokes">({{ scorecardPlayer.totalStrokes }} strokes)</span>
              </div>
            </div>
          </div>
          <button @click="scorecardPlayer = null" class="btn btn-ghost scorecard-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Round Tabs -->
        <div class="scorecard-tabs" v-if="scorecardRounds.length > 1">
          <button
            v-for="rn in scorecardRounds"
            :key="rn"
            class="scorecard-tab"
            :class="{ active: scorecardActiveRound === rn }"
            @click="scorecardActiveRound = rn"
          >
            Round {{ rn }}
            <span v-if="scorecardPlayer.rounds[rn]" class="tab-score" :class="getScoreClass(scorecardPlayer.rounds[rn].score)">
              {{ formatScore(scorecardPlayer.rounds[rn].score) }}
            </span>
          </button>
        </div>

        <!-- Scorecard Content -->
        <div class="scorecard-body" v-if="scorecardPlayer.rounds[scorecardActiveRound]">
          <div class="scorecard-round-header">
            <span class="scorecard-round-label">Round {{ scorecardActiveRound }}</span>
            <span class="scorecard-round-result" :class="getScoreClass(scorecardPlayer.rounds[scorecardActiveRound].score)">
              {{ scorecardPlayer.rounds[scorecardActiveRound].strokes }}
              ({{ formatScore(scorecardPlayer.rounds[scorecardActiveRound].score) }})
            </span>
          </div>

          <!-- Front 9 -->
          <div class="scorecard-nine">
            <table class="holes-table">
              <thead>
                <tr>
                  <th class="hole-label">Hole</th>
                  <th v-for="h in 9" :key="h" class="hole-num">{{ h }}</th>
                  <th class="hole-out">Out</th>
                </tr>
                <tr class="par-row">
                  <td class="hole-label">Par</td>
                  <td v-for="h in 9" :key="h" class="hole-num">
                    {{ getHolePar(scorecardPlayer.rounds[scorecardActiveRound], h) }}
                  </td>
                  <td class="hole-out">{{ getFrontNinePar(scorecardPlayer.rounds[scorecardActiveRound]) }}</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="hole-label">Score</td>
                  <td
                    v-for="h in 9"
                    :key="h"
                    class="hole-num"
                    :class="getHoleScoreClass(scorecardPlayer.rounds[scorecardActiveRound].holeResults[h - 1])"
                  >
                    {{ getHoleStrokes(scorecardPlayer.rounds[scorecardActiveRound].holeResults[h - 1]) }}
                  </td>
                  <td class="hole-out">{{ getFrontNineTotal(scorecardPlayer.rounds[scorecardActiveRound]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Back 9 -->
          <div class="scorecard-nine">
            <table class="holes-table">
              <thead>
                <tr>
                  <th class="hole-label">Hole</th>
                  <th v-for="h in 9" :key="h + 9" class="hole-num">{{ h + 9 }}</th>
                  <th class="hole-out">In</th>
                  <th class="hole-out total-col">Tot</th>
                </tr>
                <tr class="par-row">
                  <td class="hole-label">Par</td>
                  <td v-for="h in 9" :key="h + 9" class="hole-num">
                    {{ getHolePar(scorecardPlayer.rounds[scorecardActiveRound], h + 9) }}
                  </td>
                  <td class="hole-out">{{ getBackNinePar(scorecardPlayer.rounds[scorecardActiveRound]) }}</td>
                  <td class="hole-out total-col">{{ getRoundPar(scorecardPlayer.rounds[scorecardActiveRound]) }}</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="hole-label">Score</td>
                  <td
                    v-for="h in 9"
                    :key="h + 9"
                    class="hole-num"
                    :class="getHoleScoreClass(scorecardPlayer.rounds[scorecardActiveRound].holeResults[h + 8])"
                  >
                    {{ getHoleStrokes(scorecardPlayer.rounds[scorecardActiveRound].holeResults[h + 8]) }}
                  </td>
                  <td class="hole-out">{{ getBackNineTotal(scorecardPlayer.rounds[scorecardActiveRound]) }}</td>
                  <td class="hole-out total-col">{{ scorecardPlayer.rounds[scorecardActiveRound].strokes }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Score Legend -->
          <div class="scorecard-legend">
            <span class="legend-item"><span class="legend-dot eagle-dot"></span> Eagle</span>
            <span class="legend-item"><span class="legend-dot birdie-dot"></span> Birdie</span>
            <span class="legend-item"><span class="legend-dot par-dot"></span> Par</span>
            <span class="legend-item"><span class="legend-dot bogey-dot"></span> Bogey</span>
            <span class="legend-item"><span class="legend-dot double-dot"></span> Double+</span>
          </div>
        </div>

        <!-- Round Summary -->
        <div v-if="scorecardRounds.length > 0" class="scorecard-summary">
          <table class="summary-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Strokes</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rn in scorecardRounds" :key="'sum-' + rn">
                <td>R{{ rn }}</td>
                <td class="summary-strokes">{{ scorecardPlayer.rounds[rn]?.strokes || '-' }}</td>
                <td>
                  <span :class="getScoreClass(scorecardPlayer.rounds[rn]?.score)">
                    {{ scorecardPlayer.rounds[rn] ? formatScore(scorecardPlayer.rounds[rn].score) : '-' }}
                  </span>
                </td>
              </tr>
              <tr class="summary-total-row">
                <td>Total</td>
                <td class="summary-strokes">{{ scorecardPlayer.totalStrokes }}</td>
                <td>
                  <span class="score-value" :class="getScoreClass(scorecardPlayer.totalScore)">
                    {{ formatScore(scorecardPlayer.totalScore) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGolfStore } from '../stores/golf'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const golfStore = useGolfStore()

const worldId = computed(() => route.params.worldId)
const eventId = computed(() => route.params.eventId)
const event = ref(null)
const loading = ref(true)
const simulatingRound = ref(false)
const completingEvent = ref(false)

// Animation state
const animating = ref(false)
const manualMode = ref(false)
const skipAnimation = ref(false)
const displayedHole = ref(0)
const animatedResults = ref([])
const roundData = ref(null)
const currentAnimatingRound = ref(null)

// Scorecard modal
const scorecardPlayer = ref(null)
const scorecardActiveRound = ref(1)

// Compute the number of completed rounds from the event data
const completedRounds = computed(() => {
  if (!event.value || !event.value.rounds) return 0
  return event.value.rounds.length
})

const completedRoundsForDisplay = computed(() => {
  const count = (animating.value || manualMode.value)
    ? Math.max(completedRounds.value, currentAnimatingRound.value || 0)
    : completedRounds.value
  const rounds = []
  for (let i = 1; i <= count; i++) {
    rounds.push(i)
  }
  return rounds
})

const nextRoundToPlay = computed(() => {
  const next = completedRounds.value + 1
  return next <= 4 ? next : null
})

// Build the leaderboard from event round results
const leaderboard = computed(() => {
  // During animation or manual mode, use animatedResults if available
  if ((animating.value || manualMode.value) && animatedResults.value.length > 0) {
    return animatedResults.value
  }

  if (!event.value || !event.value.rounds || event.value.rounds.length === 0) {
    return []
  }

  return buildLeaderboard(event.value.rounds, event.value.par)
})

const cutLine = computed(() => {
  if (!event.value || completedRounds.value < 2) return null
  // Find the cut score from the event data if available
  if (event.value.cut_score !== undefined && event.value.cut_score !== null) {
    return event.value.cut_score
  }
  // Otherwise derive from leaderboard - look for first MC player
  const mcPlayer = leaderboard.value.find(p => p.missedCut)
  if (mcPlayer) {
    return mcPlayer.totalScore
  }
  return null
})

const playersAfterCut = computed(() => {
  return leaderboard.value.filter(p => !p.missedCut).length
})

function buildLeaderboard(rounds, par) {
  if (!rounds || rounds.length === 0) return []

  const coursePar = par || 72
  const playerMap = {}

  rounds.forEach((round) => {
    const roundNumber = round.round_number || round.roundNumber
    const results = round.results || round.playerResults || []

    results.forEach((result) => {
      const pid = result.playerId || result.player_id
      if (!playerMap[pid]) {
        playerMap[pid] = {
          playerId: pid,
          firstName: result.firstName || result.first_name || '',
          lastName: result.lastName || result.last_name || '',
          country: result.country || '',
          worldRanking: result.worldRanking || null,
          rounds: {},
          totalStrokes: 0,
          totalScore: 0,
          missedCut: false
        }
      }
      // Keep the latest worldRanking if available
      if (result.worldRanking) {
        playerMap[pid].worldRanking = result.worldRanking
      }
      const strokes = result.strokes || result.total || 0
      const score = result.score !== undefined ? result.score : (strokes - coursePar)

      playerMap[pid].rounds[roundNumber] = {
        strokes: strokes,
        score: score,
        holeResults: result.holeResults || result.hole_results || null,
        courseHoles: result.courseHoles || result.course_holes || null
      }
      playerMap[pid].totalStrokes += strokes
      playerMap[pid].totalScore += score

      if (result.missedCut || result.missed_cut) {
        playerMap[pid].missedCut = true
      }
    })
  })

  const entries = Object.values(playerMap)

  // Sort: non-MC first by total score ascending, then MC players
  entries.sort((a, b) => {
    if (a.missedCut !== b.missedCut) return a.missedCut ? 1 : -1
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore
    // Tiebreaker: last round score
    const maxRound = Math.max(...Object.keys(a.rounds).map(Number))
    const aLastRound = a.rounds[maxRound]?.score || 0
    const bLastRound = b.rounds[maxRound]?.score || 0
    return aLastRound - bLastRound
  })

  // Assign positions with ties
  let currentPos = 1
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].missedCut) {
      entries[i].position = entries[i].totalScore
      entries[i].numericPos = 999
      entries[i].tied = false
      continue
    }

    if (i > 0 && !entries[i - 1].missedCut && entries[i].totalScore === entries[i - 1].totalScore) {
      entries[i].position = entries[i - 1].position
      entries[i].numericPos = entries[i - 1].numericPos
      entries[i].tied = true
      // Also mark the previous one as tied
      entries[i - 1].tied = true
    } else {
      entries[i].position = currentPos
      entries[i].numericPos = currentPos
      entries[i].tied = false
    }
    currentPos = i + 2 // next position is index + 2
  }

  return entries
}

function buildAnimatedLeaderboard(serverRounds, currentRoundData, throughHole, par) {
  const coursePar = par || 72
  const playerMap = {}

  // First, add all data from previously completed rounds
  if (serverRounds && serverRounds.length > 0) {
    serverRounds.forEach((round) => {
      const roundNumber = round.round_number || round.roundNumber
      const results = round.results || round.playerResults || []

      results.forEach((result) => {
        const pid = result.playerId || result.player_id
        if (!playerMap[pid]) {
          playerMap[pid] = {
            playerId: pid,
            firstName: result.firstName || result.first_name || '',
            lastName: result.lastName || result.last_name || '',
            country: result.country || '',
            worldRanking: result.worldRanking || null,
            rounds: {},
            totalStrokes: 0,
            totalScore: 0,
            missedCut: false
          }
          if (result.missedCut || result.missed_cut) {
            playerMap[pid].missedCut = true
          }
        }
        if (result.worldRanking) playerMap[pid].worldRanking = result.worldRanking
        const strokes = result.strokes || result.total || 0
        const score = result.score !== undefined ? result.score : (strokes - coursePar)

        playerMap[pid].rounds[roundNumber] = {
          strokes: strokes,
          score: score,
          holeResults: result.holeResults || result.hole_results || null,
          courseHoles: result.courseHoles || result.course_holes || null
        }
        playerMap[pid].totalStrokes += strokes
        playerMap[pid].totalScore += score
      })
    })
  }

  // Now add the animated current round data through the given hole
  if (currentRoundData) {
    const roundNum = currentRoundData.roundNumber || currentRoundData.round_number
    const courseHoles = currentRoundData.courseHoles || currentRoundData.course_holes || []
    const results = currentRoundData.results || currentRoundData.playerResults || []

    results.forEach((result) => {
      const pid = result.playerId || result.player_id
      if (!playerMap[pid]) {
        playerMap[pid] = {
          playerId: pid,
          firstName: result.firstName || result.first_name || '',
          lastName: result.lastName || result.last_name || '',
          country: result.country || '',
          worldRanking: result.worldRanking || null,
          rounds: {},
          totalStrokes: 0,
          totalScore: 0,
          missedCut: false
        }
      }
      if (result.worldRanking) playerMap[pid].worldRanking = result.worldRanking

      const holeResults = result.holeResults || result.hole_results || []
      let currentStrokes = 0
      let currentScore = 0
      const partialHoleResults = []

      for (let h = 0; h < throughHole && h < holeResults.length; h++) {
        const hr = holeResults[h]
        const holePar = hr.par || (courseHoles[h] ? courseHoles[h].par : 4)
        const strokes = hr.strokes || (holePar + (hr.score || 0))
        currentStrokes += strokes
        currentScore += (strokes - holePar)
        partialHoleResults.push(hr)
      }

      playerMap[pid].rounds[roundNum] = {
        strokes: currentStrokes,
        score: currentScore,
        holeResults: partialHoleResults,
        courseHoles: courseHoles
      }
      playerMap[pid].totalStrokes += currentStrokes
      playerMap[pid].totalScore += currentScore

      if (result.missedCut || result.missed_cut) {
        playerMap[pid].missedCut = true
      }
    })
  }

  const entries = Object.values(playerMap)

  entries.sort((a, b) => {
    if (a.missedCut !== b.missedCut) return a.missedCut ? 1 : -1
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore
    return 0
  })

  let currentPos = 1
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].missedCut) {
      entries[i].position = entries[i].totalScore
      entries[i].numericPos = 999
      entries[i].tied = false
      continue
    }
    if (i > 0 && !entries[i - 1].missedCut && entries[i].totalScore === entries[i - 1].totalScore) {
      entries[i].position = entries[i - 1].position
      entries[i].numericPos = entries[i - 1].numericPos
      entries[i].tied = true
      entries[i - 1].tied = true
    } else {
      entries[i].position = currentPos
      entries[i].numericPos = currentPos
      entries[i].tied = false
    }
    currentPos = i + 2
  }

  return entries
}

// ==================== Format helpers ====================

function formatScore(score) {
  if (score === 0 || score === null || score === undefined) return 'E'
  if (score > 0) return `+${score}`
  return `${score}`
}

function getScoreClass(score) {
  if (score === null || score === undefined) return ''
  if (score < 0) return 'score-under'
  if (score === 0) return 'score-even'
  return 'score-over'
}

function formatPosition(pos, tied, missedCut) {
  if (missedCut) return 'MC'
  if (tied) return `T${pos}`
  return `${pos}`
}

function isRoundCompleted(roundNum) {
  if (!event.value || !event.value.rounds) return false
  return event.value.rounds.some(r => (r.round_number || r.roundNumber) === roundNum)
}

function formatStatus(status) {
  const labels = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

function getTournamentLabel(type) {
  const labels = {
    major: 'Major',
    wgc: 'WGC',
    invitational: 'Invitational',
    open: 'Open',
    pga_tour: 'PGA Tour',
    signature: 'Signature',
    regular: 'Regular',
    players: 'The Players'
  }
  return labels[type] || type || 'Tournament'
}

function getTournamentBadgeStyle(type) {
  const styles = {
    major: { background: '#fef3c7', color: '#b45309' },
    wgc: { background: '#ede9fe', color: '#7c3aed' },
    invitational: { background: '#dbeafe', color: '#2563eb' },
    open: { background: '#d1fae5', color: '#065f46' },
    pga_tour: { background: '#f3f4f6', color: '#4b5563' },
    signature: { background: '#fce7f3', color: '#be185d' },
    regular: { background: '#f3f4f6', color: '#4b5563' },
    players: { background: '#fef3c7', color: '#b45309' }
  }
  return styles[type] || { background: '#d1fae5', color: '#065f46' }
}

// ==================== Scorecard helpers ====================

function getHolePar(roundData, holeNum) {
  if (!roundData) return ''
  const holes = roundData.courseHoles || []
  if (holes.length >= holeNum) {
    return holes[holeNum - 1]?.par || ''
  }
  const hr = roundData.holeResults
  if (hr && hr.length >= holeNum && hr[holeNum - 1]) {
    return hr[holeNum - 1].par || ''
  }
  return ''
}

function getHoleStrokes(holeResult) {
  if (!holeResult) return '-'
  return holeResult.strokes || '-'
}

function getHoleScoreClass(holeResult) {
  if (!holeResult) return ''
  const par = holeResult.par
  if (!par) return ''
  // Use the score field (relative to par) directly if available
  const diff = holeResult.score !== undefined ? holeResult.score : (holeResult.strokes ? holeResult.strokes - par : 0)
  if (diff <= -2) return 'hole-eagle'
  if (diff === -1) return 'hole-birdie'
  if (diff === 0) return 'hole-par'
  if (diff === 1) return 'hole-bogey'
  return 'hole-double'
}

function getFrontNineTotal(roundData) {
  if (!roundData || !roundData.holeResults) return '-'
  let total = 0
  for (let i = 0; i < 9 && i < roundData.holeResults.length; i++) {
    total += (roundData.holeResults[i]?.strokes || 0)
  }
  return total || '-'
}

function getBackNineTotal(roundData) {
  if (!roundData || !roundData.holeResults) return '-'
  let total = 0
  for (let i = 9; i < 18 && i < roundData.holeResults.length; i++) {
    total += (roundData.holeResults[i]?.strokes || 0)
  }
  return total || '-'
}

function getFrontNinePar(roundData) {
  if (!roundData) return ''
  const holes = roundData.courseHoles || []
  if (holes.length >= 9) {
    let total = 0
    for (let i = 0; i < 9; i++) {
      total += (holes[i]?.par || 0)
    }
    return total || ''
  }
  const hr = roundData.holeResults
  if (hr && hr.length >= 9) {
    let total = 0
    for (let i = 0; i < 9; i++) {
      total += (hr[i]?.par || 0)
    }
    return total || ''
  }
  return ''
}

function getBackNinePar(roundData) {
  if (!roundData) return ''
  const holes = roundData.courseHoles || []
  if (holes.length >= 18) {
    let total = 0
    for (let i = 9; i < 18; i++) {
      total += (holes[i]?.par || 0)
    }
    return total || ''
  }
  const hr = roundData.holeResults
  if (hr && hr.length >= 18) {
    let total = 0
    for (let i = 9; i < 18; i++) {
      total += (hr[i]?.par || 0)
    }
    return total || ''
  }
  return ''
}

function getRoundPar(roundData) {
  if (!roundData) return ''
  const front = getFrontNinePar(roundData)
  const back = getBackNinePar(roundData)
  if (front && back) return front + back
  return event.value?.par || ''
}

function showCutLineBefore(index) {
  if (completedRounds.value < 2) return false
  if (index === 0) return false
  const current = leaderboard.value[index]
  const prev = leaderboard.value[index - 1]
  return current && prev && current.missedCut && !prev.missedCut
}

// ==================== Actions ====================

function goBack() {
  router.push(`/golf/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

const scorecardRounds = computed(() => {
  if (!scorecardPlayer.value) return []
  return Object.keys(scorecardPlayer.value.rounds)
    .map(Number)
    .filter(rn => scorecardPlayer.value.rounds[rn]?.holeResults)
    .sort((a, b) => a - b)
})

function openScorecardModal(entry) {
  scorecardPlayer.value = entry
  // Default to the latest round
  const availableRounds = Object.keys(entry.rounds)
    .map(Number)
    .filter(rn => entry.rounds[rn]?.holeResults)
    .sort((a, b) => a - b)
  scorecardActiveRound.value = availableRounds.length > 0 ? availableRounds[availableRounds.length - 1] : 1
}

function scrollToRound(roundNum) {
  // Just a visual indicator for now
}

async function loadEvent() {
  try {
    const data = await golfStore.fetchEvent(eventId.value)

    // Transform backend format into what the frontend expects
    const rounds = []
    for (let r = 1; r <= 4; r++) {
      const roundResults = data[`round${r}_results`]
      if (roundResults && Array.isArray(roundResults) && roundResults.length > 0) {
        rounds.push({
          roundNumber: r,
          results: roundResults.map(result => ({
            ...result,
            strokes: result.roundStrokes,
            score: result.roundScore
          }))
        })
      }
    }

    event.value = {
      ...data,
      par: data.course_par,
      rounds,
      cut_score: data.cut_line
    }
  } catch (err) {
    console.error('Failed to load event:', err)
  }
}

async function fetchRoundData() {
  simulatingRound.value = true
  try {
    const data = await golfStore.simulateRound(eventId.value)
    roundData.value = data
    // Map result field names for compatibility with buildAnimatedLeaderboard
    if (data.results) {
      data.results = data.results.map(r => ({
        ...r,
        strokes: r.roundStrokes,
        score: r.roundScore
      }))
    }
    return data
  } catch (err) {
    console.error('Failed to simulate round:', err)
    return null
  } finally {
    simulatingRound.value = false
  }
}

// Auto-play: simulate full round with animation
async function handleSimulateRound() {
  const data = await fetchRoundData()
  if (!data) return
  await animateRound(data)
}

// Manual: simulate round, then let user click through holes
async function handleSimulateRoundManual() {
  const data = await fetchRoundData()
  if (!data) return
  startManualMode(data)
}

function startManualMode(data) {
  manualMode.value = true
  animating.value = false
  skipAnimation.value = false
  displayedHole.value = 1
  currentAnimatingRound.value = data.roundNumber || data.round_number || (completedRounds.value + 1)

  const existingRounds = event.value?.rounds || []
  animatedResults.value = buildAnimatedLeaderboard(
    existingRounds,
    data,
    1,
    event.value?.par
  )
}

function advanceOneHole() {
  if (!roundData.value || displayedHole.value >= 18) return

  displayedHole.value++
  const existingRounds = event.value?.rounds || []
  animatedResults.value = buildAnimatedLeaderboard(
    existingRounds,
    roundData.value,
    displayedHole.value,
    event.value?.par
  )
}

async function finishManualMode() {
  manualMode.value = false
  currentAnimatingRound.value = null
  animatedResults.value = []
  await loadEvent()
}

async function autoPlayRemaining() {
  // Switch from manual to auto for remaining holes
  manualMode.value = false
  animating.value = true
  skipAnimation.value = false

  const existingRounds = event.value?.rounds || []
  const startHole = displayedHole.value + 1

  for (let hole = startHole; hole <= 18; hole++) {
    if (skipAnimation.value) {
      showFinalResults(roundData.value)
      return
    }

    displayedHole.value = hole
    animatedResults.value = buildAnimatedLeaderboard(
      existingRounds,
      roundData.value,
      hole,
      event.value?.par
    )

    await new Promise(r => setTimeout(r, 500))
  }

  animating.value = false
  currentAnimatingRound.value = null
  animatedResults.value = []
  await loadEvent()
}

function switchToManual() {
  // Switch from auto animation to manual mid-round
  skipAnimation.value = true
  animating.value = false
  manualMode.value = true
}

async function animateRound(data) {
  animating.value = true
  manualMode.value = false
  skipAnimation.value = false
  displayedHole.value = 0
  currentAnimatingRound.value = data.roundNumber || data.round_number || (completedRounds.value + 1)

  const existingRounds = event.value?.rounds || []

  for (let hole = 1; hole <= 18; hole++) {
    if (skipAnimation.value) {
      if (manualMode.value) return // switched to manual
      showFinalResults(data)
      return
    }

    displayedHole.value = hole

    animatedResults.value = buildAnimatedLeaderboard(
      existingRounds,
      data,
      hole,
      event.value?.par
    )

    await new Promise(r => setTimeout(r, 500))
  }

  animating.value = false
  currentAnimatingRound.value = null
  animatedResults.value = []
  await loadEvent()
}

function showFinalResults(data) {
  const existingRounds = event.value?.rounds || []
  animatedResults.value = buildAnimatedLeaderboard(
    existingRounds,
    data,
    18,
    event.value?.par
  )

  setTimeout(async () => {
    animating.value = false
    currentAnimatingRound.value = null
    animatedResults.value = []
    await loadEvent()
  }, 300)
}

function handleSkipAnimation() {
  skipAnimation.value = true
}

async function handleCompleteEvent() {
  completingEvent.value = true
  try {
    await golfStore.completeEvent(eventId.value)
    await loadEvent()
  } catch (err) {
    console.error('Failed to complete event:', err)
  } finally {
    completingEvent.value = false
  }
}

onMounted(async () => {
  try {
    await loadEvent()
  } catch (err) {
    console.error('Failed to load event:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.golf-event {
  min-height: 100vh;
  background: #f8fafc;
}

/* Flag styles */
.flag-xs {
  width: 1.25rem;
  height: 0.9rem;
  object-fit: cover;
  border-radius: 2px;
}

.flag-sm {
  width: 1.5rem;
  height: 1.1rem;
  object-fit: cover;
  border-radius: 2px;
}

.flag-md {
  width: 2rem;
  height: 1.5rem;
  object-fit: cover;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Header */
.page-header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  padding: 0.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.event-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.event-name {
  font-weight: 600;
  color: var(--gray-800);
}

.event-main {
  padding: 2rem 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: #10b981;
}

.loading-state i {
  font-size: 2rem;
}

/* Event Info Card */
.event-info-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.event-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.75rem;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.meta-item i {
  color: var(--gray-400);
}

.type-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.event-info-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.event-status {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.event-status.upcoming {
  background: #dbeafe;
  color: #2563eb;
}

.event-status.in_progress {
  background: #fef3c7;
  color: #b45309;
}

.event-status.completed {
  background: #dcfce7;
  color: #16a34a;
}

/* Round Controls */
.round-controls {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rounds-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.round-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 2px solid var(--gray-200);
  background: white;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.round-btn:hover {
  border-color: var(--gray-300);
}

.round-btn.completed {
  border-color: #10b981;
  background: #f0fdf4;
  color: #059669;
}

.round-btn.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.round-btn.current {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #b45309;
  animation: pulseGlow 1.5s infinite;
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 12px 4px rgba(245, 158, 11, 0.2); }
}

.round-check {
  color: #10b981;
  font-size: 0.875rem;
}

.round-btn.active .round-check {
  color: white;
}

.animation-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #a7f3d0;
}

.hole-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #065f46;
  font-size: 0.95rem;
}

.hole-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spin-slow {
  color: #10b981;
  animation: spinSlow 2s linear infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cut-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #fef3c7;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #92400e;
  font-weight: 500;
}

.cut-info i {
  color: #f59e0b;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.golf-btn {
  background: linear-gradient(135deg, #34d399, #10b981);
}

.golf-btn:hover {
  background: linear-gradient(135deg, #10b981, #059669);
}

.completed-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 0.75rem;
  font-weight: 600;
  color: #92400e;
}

.completed-badge i {
  color: #f59e0b;
}

/* Winner Card */
.winner-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.winner-trophy {
  font-size: 2.5rem;
  color: #f59e0b;
}

.winner-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.winner-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #92400e;
}

.winner-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #78350f;
}

.winner-score {
  font-size: 1rem;
  font-weight: 600;
  color: #b45309;
}

/* Leaderboard */
.leaderboard-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.leaderboard-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
}

.leaderboard-title i {
  color: #10b981;
}

.leaderboard-table-wrapper {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.leaderboard-table th {
  padding: 0.75rem 0.625rem;
  background: var(--gray-50);
  font-weight: 600;
  color: var(--gray-600);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  text-align: left;
  white-space: nowrap;
  border-bottom: 2px solid var(--gray-200);
}

.leaderboard-table td {
  padding: 0.625rem;
  border-bottom: 1px solid var(--gray-100);
}

.col-pos {
  width: 50px;
  text-align: center !important;
}

.col-flag {
  width: 36px;
  text-align: center !important;
}

.col-player {
  min-width: 160px;
}

.col-round {
  width: 48px;
  text-align: center !important;
}

.col-total {
  width: 60px;
  text-align: center !important;
  font-weight: 600;
}

.col-score {
  width: 60px;
  text-align: center !important;
}

/* Player rows */
.player-row {
  cursor: pointer;
  transition: background 0.15s;
}

.player-row:hover {
  background: #f0fdf4;
}

.player-row.missed-cut {
  opacity: 0.6;
}

.player-row.missed-cut:hover {
  opacity: 0.8;
  background: #fef2f2;
}

.player-row.top-3 .pos-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.8rem;
}

.player-row.top-3:nth-child(1) .pos-text,
.player-row.top-3:first-of-type .pos-text {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  color: white;
}

.pos-text {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.8rem;
}

.pos-mc {
  color: #ef4444;
  font-weight: 700;
}

.player-name {
  font-weight: 500;
  color: var(--gray-900);
}

.world-rank {
  font-size: 0.75rem;
  color: var(--gray-400);
  font-weight: 400;
  margin-left: 0.25rem;
}

.round-score {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  text-align: center;
  display: block;
}

.round-score.no-score {
  color: var(--gray-400);
}

.total-strokes {
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: var(--gray-900);
}

.score-value {
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
}

.score-under {
  color: #059669;
  background: #ecfdf5;
}

.score-even {
  color: var(--gray-600);
  background: var(--gray-100);
}

.score-over {
  color: #dc2626;
  background: #fef2f2;
}

/* Cut line */
.cut-line-row td {
  padding: 0 !important;
  border-bottom: none !important;
}

.cut-line-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0;
  position: relative;
}

.cut-line-divider::before,
.cut-line-divider::after {
  content: '';
  flex: 1;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #ef4444 0,
    #ef4444 4px,
    transparent 4px,
    transparent 8px
  );
}

.cut-line-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #ef4444;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.cut-line-text i {
  font-size: 0.65rem;
}

/* Scorecard Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.scorecard-modal {
  background: white;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.scorecard-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--gray-100);
}

.scorecard-player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.scorecard-player-pos {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
}

.scorecard-player-pos.score-under {
  background: #dcfce7;
  color: #059669;
}

.scorecard-player-pos.score-even {
  background: var(--gray-100);
  color: var(--gray-600);
}

.scorecard-player-pos.score-over {
  background: #fef2f2;
  color: #dc2626;
}

.scorecard-player-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-900);
}

.scorecard-world-rank {
  font-size: 0.85rem;
  color: var(--gray-400);
  font-weight: 400;
}

.scorecard-player-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.scorecard-player-strokes {
  color: var(--gray-400);
  font-weight: 400;
}

.scorecard-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.scorecard-close:hover {
  background: var(--gray-100);
}

/* Round Tabs */
.scorecard-tabs {
  display: flex;
  gap: 0;
  padding: 0 1.5rem;
  border-bottom: 2px solid var(--gray-100);
}

.scorecard-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--gray-500);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.scorecard-tab:hover {
  color: var(--gray-700);
}

.scorecard-tab.active {
  color: #059669;
  border-bottom-color: #10b981;
}

.tab-score {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
  font-weight: 700;
}

/* Scorecard Body */
.scorecard-body {
  padding: 1.25rem 1.5rem;
}

.scorecard-round-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.scorecard-round-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-500);
}

.scorecard-round-result {
  font-size: 1rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
}

.scorecard-round-result.score-under {
  background: #dcfce7;
  color: #059669;
}

.scorecard-round-result.score-even {
  background: var(--gray-100);
  color: var(--gray-600);
}

.scorecard-round-result.score-over {
  background: #fef2f2;
  color: #dc2626;
}

.scorecard-nine {
  margin-bottom: 0.75rem;
  overflow-x: auto;
}

/* Legend */
.scorecard-legend {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
  margin-top: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  color: var(--gray-500);
  font-weight: 500;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.eagle-dot { background: #fef3c7; border: 1px solid #fcd34d; }
.birdie-dot { background: #dcfce7; border: 1px solid #86efac; }
.par-dot { background: white; border: 1px solid #e5e7eb; }
.bogey-dot { background: #fef2f2; border: 1px solid #fecaca; }
.double-dot { background: #fee2e2; border: 1px solid #fca5a5; }

/* Round Summary Table */
.scorecard-summary {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--gray-100);
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.summary-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-500);
  border-bottom: 2px solid var(--gray-200);
}

.summary-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}

.summary-strokes {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.summary-total-row {
  font-weight: 700;
}

.summary-total-row td {
  border-bottom: none;
  border-top: 2px solid var(--gray-200);
  padding-top: 0.75rem;
}

.holes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  min-width: 500px;
}

.holes-table th,
.holes-table td {
  padding: 0.375rem 0.25rem;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.holes-table th {
  background: #f9fafb;
  font-weight: 600;
  color: var(--gray-600);
}

.hole-label {
  text-align: left !important;
  padding-left: 0.5rem !important;
  width: 50px;
  font-weight: 600;
}

.hole-num {
  width: 36px;
  min-width: 36px;
}

.hole-out {
  width: 42px;
  min-width: 42px;
  font-weight: 700 !important;
  background: #f3f4f6;
}

.total-col {
  background: #e5e7eb !important;
  font-weight: 700 !important;
}

.par-row td {
  color: var(--gray-500);
  font-weight: 500;
  background: #fafafa;
}

/* Hole score coloring */
.hole-eagle {
  background: #fef3c7 !important;
  color: #b45309;
  font-weight: 700;
}

.hole-birdie {
  background: #dcfce7 !important;
  color: #16a34a;
  font-weight: 600;
}

.hole-par {
  background: white;
  color: var(--gray-700);
}

.hole-bogey {
  background: #fef2f2 !important;
  color: #ef4444;
  font-weight: 600;
}

.hole-double {
  background: #fee2e2 !important;
  color: #b91c1c;
  font-weight: 700;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-icon i {
  font-size: 2rem;
  color: #10b981;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--gray-500);
}

/* Animations */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .event-info-card {
    flex-direction: column;
    gap: 1rem;
  }

  .event-info-right {
    align-items: flex-start;
    width: 100%;
  }

  .breadcrumb {
    display: none;
  }

  .rounds-row {
    flex-wrap: wrap;
  }

  .round-btn {
    flex: 1 1 calc(50% - 0.375rem);
  }

  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .winner-card {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .winner-info {
    align-items: center;
  }
}

@media (max-width: 480px) {
  .holes-table {
    font-size: 0.65rem;
  }

  .hole-num {
    width: 28px;
    min-width: 28px;
  }

  .col-player {
    min-width: 120px;
  }
}
</style>
