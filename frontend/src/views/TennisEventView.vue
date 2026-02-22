<template>
  <div class="tennis-event">
    <header class="page-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-baseball"></i>
            <span>Tennis</span>
          </div>
        </div>
        <div class="breadcrumb" v-if="event">
          <span class="event-badge" :style="getBadgeStyle(event.tournamentType)">
            {{ getTournamentLabel(event.tournamentType) }}
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
                  {{ event.location }}, {{ event.country }}
                </span>
                <span class="meta-item surface-tag" :class="event.surface">
                  {{ formatSurface(event.surface) }}
                </span>
                <span class="meta-item">
                  <i class="fa-solid fa-trophy"></i>
                  {{ event.points }} pts
                </span>
                <span class="meta-item">
                  <i class="fa-solid fa-users"></i>
                  Draw: {{ event.drawSize }}
                </span>
              </div>
            </div>
            <div class="event-info-right">
              <span class="event-status" :class="event.status">
                {{ formatStatus(event.status) }}
              </span>
              <div class="event-actions">
                <button
                  v-if="event.status === 'upcoming'"
                  @click="startTournament"
                  class="btn btn-primary tennis-btn"
                  :disabled="startingTournament"
                >
                  <i v-if="startingTournament" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-play"></i>
                  Start Tournament
                </button>
                <button
                  v-if="event.status === 'in_progress' && canSimulateRound"
                  @click="simulateCurrentRound"
                  class="btn btn-secondary"
                  :disabled="simulatingRound"
                >
                  <i v-if="simulatingRound" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-fast"></i>
                  Simulate {{ currentRoundName }}
                </button>
                <button
                  v-if="event.status === 'in_progress' && isFinalComplete"
                  @click="completeTournament"
                  class="btn btn-primary tennis-btn"
                  :disabled="completingTournament"
                >
                  <i v-if="completingTournament" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-flag-checkered"></i>
                  Complete Tournament
                </button>
              </div>
            </div>
          </div>

          <!-- Two-Sided Bracket Display -->
          <div v-if="bracket.length > 0" class="bracket-container fade-in">
            <div class="bracket-scroll">
              <div class="bracket-two-sided">
                <!-- Left Side (Top Half) -->
                <div class="bracket-side bracket-left">
                  <div
                    v-for="(round, roundIndex) in leftBracket"
                    :key="'left-' + roundIndex"
                    class="bracket-round"
                  >
                    <h3 class="round-title">{{ round.name }}</h3>
                    <div class="round-matches">
                      <div
                        v-for="match in round.matches"
                        :key="match.id"
                        class="bracket-match"
                        :class="{
                          completed: match.status === 'completed',
                          waiting: match.status === 'waiting',
                          ready: match.status === 'scheduled' && match.player1 && match.player2
                        }"
                      >
                        <div
                          class="match-player"
                          :class="{
                            winner: match.winnerId && match.player1?.id === match.winnerId,
                            loser: match.winnerId && match.player1?.id !== match.winnerId && match.player1
                          }"
                        >
                          <template v-if="match.player1">
                            <span class="player-rank" :class="{ seeded: match.player1.seed }">[{{ match.player1.seed || match.player1.rank }}]</span>
                            <img :src="`/flags/${match.player1.country}.png`" class="flag-xs" />
                            <span class="player-name">{{ match.player1.lastName }}</span>
                          </template>
                          <span v-else class="tbd">TBD</span>
                          <span v-if="match.status === 'completed'" class="player-score">
                            {{ getPlayerScore(match, 1) }}
                          </span>
                        </div>
                        <div
                          class="match-player"
                          :class="{
                            winner: match.winnerId && match.player2?.id === match.winnerId,
                            loser: match.winnerId && match.player2?.id !== match.winnerId && match.player2
                          }"
                        >
                          <template v-if="match.player2">
                            <span class="player-rank" :class="{ seeded: match.player2.seed }">[{{ match.player2.seed || match.player2.rank }}]</span>
                            <img :src="`/flags/${match.player2.country}.png`" class="flag-xs" />
                            <span class="player-name">{{ match.player2.lastName }}</span>
                          </template>
                          <span v-else class="tbd">TBD</span>
                          <span v-if="match.status === 'completed'" class="player-score">
                            {{ getPlayerScore(match, 2) }}
                          </span>
                        </div>
                        <div v-if="match.status === 'scheduled' && match.player1 && match.player2" class="match-actions">
                          <button
                            @click="simulateMatch(match, 'fast')"
                            class="btn btn-sm btn-action"
                            title="Fast Simulate"
                            :disabled="simulatingMatchId === match.id"
                          >
                            <i v-if="simulatingMatchId === match.id" class="fa-solid fa-spinner fa-spin"></i>
                            <i v-else class="fa-solid fa-forward"></i>
                          </button>
                          <button
                            @click="simulateMatch(match, 'live')"
                            class="btn btn-sm btn-action btn-live"
                            title="Live Simulate"
                            :disabled="simulatingMatchId === match.id"
                          >
                            <i class="fa-solid fa-play"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Center Final -->
                <div class="bracket-center" v-if="finalMatch">
                  <div class="final-trophy">
                    <i class="fa-solid fa-trophy"></i>
                  </div>
                  <h3 class="round-title final-title">Final</h3>
                  <div
                    class="bracket-match final-match"
                    :class="{
                      completed: finalMatch.status === 'completed',
                      waiting: finalMatch.status === 'waiting',
                      ready: finalMatch.status === 'scheduled' && finalMatch.player1 && finalMatch.player2
                    }"
                  >
                    <div
                      class="match-player"
                      :class="{
                        winner: finalMatch.winnerId && finalMatch.player1?.id === finalMatch.winnerId,
                        loser: finalMatch.winnerId && finalMatch.player1?.id !== finalMatch.winnerId && finalMatch.player1
                      }"
                    >
                      <template v-if="finalMatch.player1">
                        <span class="player-rank" :class="{ seeded: finalMatch.player1.seed }">[{{ finalMatch.player1.seed || finalMatch.player1.rank }}]</span>
                        <img :src="`/flags/${finalMatch.player1.country}.png`" class="flag-xs" />
                        <span class="player-name">{{ finalMatch.player1.lastName }}</span>
                      </template>
                      <span v-else class="tbd">TBD</span>
                      <span v-if="finalMatch.status === 'completed'" class="player-score">
                        {{ getPlayerScore(finalMatch, 1) }}
                      </span>
                    </div>
                    <div
                      class="match-player"
                      :class="{
                        winner: finalMatch.winnerId && finalMatch.player2?.id === finalMatch.winnerId,
                        loser: finalMatch.winnerId && finalMatch.player2?.id !== finalMatch.winnerId && finalMatch.player2
                      }"
                    >
                      <template v-if="finalMatch.player2">
                        <span class="player-rank" :class="{ seeded: finalMatch.player2.seed }">[{{ finalMatch.player2.seed || finalMatch.player2.rank }}]</span>
                        <img :src="`/flags/${finalMatch.player2.country}.png`" class="flag-xs" />
                        <span class="player-name">{{ finalMatch.player2.lastName }}</span>
                      </template>
                      <span v-else class="tbd">TBD</span>
                      <span v-if="finalMatch.status === 'completed'" class="player-score">
                        {{ getPlayerScore(finalMatch, 2) }}
                      </span>
                    </div>
                    <div v-if="finalMatch.status === 'scheduled' && finalMatch.player1 && finalMatch.player2" class="match-actions">
                      <button
                        @click="simulateMatch(finalMatch, 'fast')"
                        class="btn btn-sm btn-action"
                        title="Fast Simulate"
                        :disabled="simulatingMatchId === finalMatch.id"
                      >
                        <i v-if="simulatingMatchId === finalMatch.id" class="fa-solid fa-spinner fa-spin"></i>
                        <i v-else class="fa-solid fa-forward"></i>
                      </button>
                      <button
                        @click="simulateMatch(finalMatch, 'live')"
                        class="btn btn-sm btn-action btn-live"
                        title="Live Simulate"
                        :disabled="simulatingMatchId === finalMatch.id"
                      >
                        <i class="fa-solid fa-play"></i>
                      </button>
                    </div>
                  </div>
                  <!-- Champion Display -->
                  <div v-if="finalMatch.status === 'completed' && finalMatch.winnerId" class="champion-display">
                    <div class="champion-label">Champion</div>
                    <div class="champion-name">
                      <img :src="`/flags/${finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1.country : finalMatch.player2.country}.png`" class="flag-sm" />
                      {{ finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1.lastName : finalMatch.player2.lastName }}
                    </div>
                  </div>
                </div>

                <!-- Right Side (Bottom Half) -->
                <div class="bracket-side bracket-right">
                  <div
                    v-for="(round, roundIndex) in rightBracket"
                    :key="'right-' + roundIndex"
                    class="bracket-round"
                  >
                    <h3 class="round-title">{{ round.name }}</h3>
                    <div class="round-matches">
                      <div
                        v-for="match in round.matches"
                        :key="match.id"
                        class="bracket-match"
                        :class="{
                          completed: match.status === 'completed',
                          waiting: match.status === 'waiting',
                          ready: match.status === 'scheduled' && match.player1 && match.player2
                        }"
                      >
                        <div
                          class="match-player"
                          :class="{
                            winner: match.winnerId && match.player1?.id === match.winnerId,
                            loser: match.winnerId && match.player1?.id !== match.winnerId && match.player1
                          }"
                        >
                          <template v-if="match.player1">
                            <span class="player-rank" :class="{ seeded: match.player1.seed }">[{{ match.player1.seed || match.player1.rank }}]</span>
                            <img :src="`/flags/${match.player1.country}.png`" class="flag-xs" />
                            <span class="player-name">{{ match.player1.lastName }}</span>
                          </template>
                          <span v-else class="tbd">TBD</span>
                          <span v-if="match.status === 'completed'" class="player-score">
                            {{ getPlayerScore(match, 1) }}
                          </span>
                        </div>
                        <div
                          class="match-player"
                          :class="{
                            winner: match.winnerId && match.player2?.id === match.winnerId,
                            loser: match.winnerId && match.player2?.id !== match.winnerId && match.player2
                          }"
                        >
                          <template v-if="match.player2">
                            <span class="player-rank" :class="{ seeded: match.player2.seed }">[{{ match.player2.seed || match.player2.rank }}]</span>
                            <img :src="`/flags/${match.player2.country}.png`" class="flag-xs" />
                            <span class="player-name">{{ match.player2.lastName }}</span>
                          </template>
                          <span v-else class="tbd">TBD</span>
                          <span v-if="match.status === 'completed'" class="player-score">
                            {{ getPlayerScore(match, 2) }}
                          </span>
                        </div>
                        <div v-if="match.status === 'scheduled' && match.player1 && match.player2" class="match-actions">
                          <button
                            @click="simulateMatch(match, 'fast')"
                            class="btn btn-sm btn-action"
                            title="Fast Simulate"
                            :disabled="simulatingMatchId === match.id"
                          >
                            <i v-if="simulatingMatchId === match.id" class="fa-solid fa-spinner fa-spin"></i>
                            <i v-else class="fa-solid fa-forward"></i>
                          </button>
                          <button
                            @click="simulateMatch(match, 'live')"
                            class="btn btn-sm btn-action btn-live"
                            title="Live Simulate"
                            :disabled="simulatingMatchId === match.id"
                          >
                            <i class="fa-solid fa-play"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="event.status === 'upcoming'" class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-sitemap"></i>
            </div>
            <h3>Tournament Not Started</h3>
            <p>Start the tournament to generate the bracket and begin match simulation.</p>
          </div>
        </template>
      </div>
    </main>

    <!-- Live Match Modal -->
    <div v-if="showLiveMatch" class="live-match-overlay">
      <div class="live-match-fullscreen" :class="getSurfaceClass(event?.surface)">
        <!-- Header with close button -->
        <div class="live-header">
          <div class="live-tournament-info">
            <span class="live-round">{{ liveMatch?.round }}</span>
            <span class="live-event-name">{{ event?.name }}</span>
          </div>
          <button @click="closeLiveMatch" class="btn-close-live" :disabled="isLiveSimulating">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Main scoreboard -->
        <div class="live-scoreboard-main">
          <!-- Player 1 -->
          <div class="live-player-row" :class="{ serving: currentServer === 1, winner: matchFinished && liveResult?.winnerId === liveMatch?.player1?.id, 'game-won': lastPointWinner === 1 }">
            <div class="player-info-live">
              <span class="rank-live" :class="{ seeded: liveMatch?.player1?.seed }">[{{ liveMatch?.player1?.seed || liveMatch?.player1?.rank }}]</span>
              <img v-if="liveMatch?.player1?.country" :src="`/flags/${liveMatch.player1.country}.png`" class="flag-live" />
              <span class="player-name-live">{{ liveMatch?.player1?.firstName }} {{ liveMatch?.player1?.lastName }}</span>
              <span v-if="currentServer === 1" class="serve-indicator">●</span>
            </div>
            <div class="sets-score">
              <span
                v-for="(set, idx) in displaySets"
                :key="idx"
                class="set-score"
                :class="{ 'set-won': set.p1 > set.p2, 'current-set': idx === currentSetIndex, 'game-highlight': lastPointWinner === 1 && idx === currentSetIndex }"
              >
                {{ set.p1 }}
              </span>
            </div>
          </div>

          <!-- Player 2 -->
          <div class="live-player-row" :class="{ serving: currentServer === 2, winner: matchFinished && liveResult?.winnerId === liveMatch?.player2?.id, 'game-won': lastPointWinner === 2 }">
            <div class="player-info-live">
              <span class="rank-live" :class="{ seeded: liveMatch?.player2?.seed }">[{{ liveMatch?.player2?.seed || liveMatch?.player2?.rank }}]</span>
              <img v-if="liveMatch?.player2?.country" :src="`/flags/${liveMatch.player2.country}.png`" class="flag-live" />
              <span class="player-name-live">{{ liveMatch?.player2?.firstName }} {{ liveMatch?.player2?.lastName }}</span>
              <span v-if="currentServer === 2" class="serve-indicator">●</span>
            </div>
            <div class="sets-score">
              <span
                v-for="(set, idx) in displaySets"
                :key="idx"
                class="set-score"
                :class="{ 'set-won': set.p2 > set.p1, 'current-set': idx === currentSetIndex, 'game-highlight': lastPointWinner === 2 && idx === currentSetIndex }"
              >
                {{ set.p2 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tennis Court Visualization -->
        <div class="court-container">
          <svg class="tennis-court" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
            <!-- Court surface -->
            <rect x="0" y="0" width="400" height="200" :fill="getCourtColor()" />

            <!-- Outer lines -->
            <rect x="10" y="10" width="380" height="180" fill="none" stroke="white" stroke-width="2" />

            <!-- Service boxes -->
            <line x1="10" y1="100" x2="390" y2="100" stroke="white" stroke-width="2" />
            <line x1="120" y1="40" x2="120" y2="160" stroke="white" stroke-width="1.5" />
            <line x1="280" y1="40" x2="280" y2="160" stroke="white" stroke-width="1.5" />
            <line x1="120" y1="40" x2="280" y2="40" stroke="white" stroke-width="1.5" />
            <line x1="120" y1="160" x2="280" y2="160" stroke="white" stroke-width="1.5" />

            <!-- Center service line -->
            <line x1="200" y1="40" x2="200" y2="160" stroke="white" stroke-width="1.5" />

            <!-- Center mark -->
            <line x1="10" y1="100" x2="20" y2="100" stroke="white" stroke-width="2" />
            <line x1="380" y1="100" x2="390" y2="100" stroke="white" stroke-width="2" />

            <!-- Net -->
            <line x1="200" y1="5" x2="200" y2="195" stroke="#333" stroke-width="3" />
            <line x1="200" y1="5" x2="200" y2="195" stroke="white" stroke-width="1" stroke-dasharray="4,4" />

            <!-- Player 1 figure (left side) -->
            <g class="player-figure" :class="{ active: currentServer === 1 || lastPointWinner === 1 }">
              <circle cx="60" cy="100" r="12" fill="#2563eb" stroke="white" stroke-width="2" />
              <text x="60" y="105" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
                {{ liveMatch?.player1?.lastName?.charAt(0) }}
              </text>
            </g>

            <!-- Player 2 figure (right side) -->
            <g class="player-figure" :class="{ active: currentServer === 2 || lastPointWinner === 2 }">
              <circle cx="340" cy="100" r="12" fill="#dc2626" stroke="white" stroke-width="2" />
              <text x="340" y="105" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
                {{ liveMatch?.player2?.lastName?.charAt(0) }}
              </text>
            </g>

            <!-- Ball animation -->
            <circle
              v-if="showBall"
              class="tennis-ball"
              :class="{ 'ball-animate': ballAnimating }"
              cx="200"
              cy="100"
              r="5"
              fill="#ccff00"
              stroke="#9acd32"
              stroke-width="1"
            />
          </svg>
        </div>

        <!-- Match status / Commentary -->
        <div class="match-commentary">
          <div v-if="!matchFinished" class="commentary-text">
            <span v-if="currentServer">{{ currentServer === 1 ? liveMatch?.player1?.lastName : liveMatch?.player2?.lastName }} serving</span>
            <span v-if="lastPointWinner" class="point-flash">
              {{ lastPointWinner === 1 ? liveMatch?.player1?.lastName : liveMatch?.player2?.lastName }} wins the point!
            </span>
            <button @click="skipToEnd" class="btn-skip">
              <i class="fa-solid fa-forward-fast"></i>
              Skip to End
            </button>
          </div>
          <div v-else class="match-finished">
            <div class="winner-announcement">
              <i class="fa-solid fa-trophy trophy-icon"></i>
              <span class="winner-name">{{ getWinnerName() }}</span>
              <span class="wins-text">WINS!</span>
            </div>
            <div class="final-score">{{ liveResult?.score }}</div>
            <button @click="closeLiveMatch" class="btn btn-primary btn-continue">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTennisStore } from '../stores/tennis'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tennisStore = useTennisStore()

const eventId = computed(() => route.params.eventId)
const event = ref(null)
const bracket = ref([])

const loading = ref(true)
const startingTournament = ref(false)
const simulatingRound = ref(false)
const completingTournament = ref(false)
const simulatingMatchId = ref(null)

// Live match state
const showLiveMatch = ref(false)
const liveMatch = ref(null)
const liveResult = ref(null)
const isLiveSimulating = ref(false)
const displaySets = ref([])

// Live animation state
const currentServer = ref(0)
const currentSetIndex = ref(0)
const lastPointWinner = ref(0)
const showBall = ref(false)
const ballAnimating = ref(false)
const matchFinished = ref(false)
const skipAnimation = ref(false)

const currentRoundName = computed(() => {
  if (!bracket.value.length) return ''
  for (const round of bracket.value) {
    const hasScheduled = round.matches.some(m => m.status === 'scheduled' && m.player1 && m.player2)
    if (hasScheduled) return round.name
  }
  return ''
})

const canSimulateRound = computed(() => {
  return currentRoundName.value !== ''
})

const isFinalComplete = computed(() => {
  if (!bracket.value.length) return false
  const finalRound = bracket.value.find(r => r.name === 'Final')
  if (!finalRound || !finalRound.matches.length) return false
  return finalRound.matches[0].status === 'completed'
})

// Split bracket into left and right sides for two-sided display
const leftBracket = computed(() => {
  if (!bracket.value.length) return []
  // All rounds except final, with only top half of matches
  return bracket.value
    .filter(r => r.name !== 'Final')
    .map(round => ({
      ...round,
      matches: round.matches.slice(0, Math.ceil(round.matches.length / 2))
    }))
})

const rightBracket = computed(() => {
  if (!bracket.value.length) return []
  // All rounds except final, with only bottom half of matches (reversed order for display)
  return bracket.value
    .filter(r => r.name !== 'Final')
    .map(round => ({
      ...round,
      matches: round.matches.slice(Math.ceil(round.matches.length / 2))
    }))
    .reverse() // Reverse so rounds flow right-to-left toward center
})

const finalMatch = computed(() => {
  if (!bracket.value.length) return null
  const finalRound = bracket.value.find(r => r.name === 'Final')
  return finalRound ? finalRound.matches[0] : null
})

function goBack() {
  router.push(`/tennis/world/${route.params.worldId}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function fetchBracket() {
  try {
    const response = await fetch(`/api/tennis/event/${eventId.value}/bracket`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    if (data.event) {
      event.value = data.event
    }
    if (data.bracket) {
      bracket.value = data.bracket
    }
  } catch (error) {
    console.error('Failed to fetch bracket:', error)
  }
}

async function startTournament() {
  startingTournament.value = true
  try {
    const response = await fetch(`/api/tennis/event/${eventId.value}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (response.ok) {
      await fetchBracket()
    } else {
      alert(data.error || 'Failed to start tournament')
    }
  } catch (error) {
    console.error('Failed to start tournament:', error)
    alert('Failed to start tournament: ' + error.message)
  } finally {
    startingTournament.value = false
  }
}

// Skip to end function
function skipToEnd() {
  skipAnimation.value = true
}

// Court color based on surface
function getCourtColor() {
  switch (event.value?.surface) {
    case 'clay': return '#D2691E'
    case 'grass': return '#228B22'
    case 'hard':
    default: return '#4169E1'
  }
}

// Surface class for background
function getSurfaceClass(surface) {
  return `surface-${surface || 'hard'}`
}

async function simulateMatch(match, mode) {
  simulatingMatchId.value = match.id

  if (mode === 'live') {
    // Reset all live state
    showLiveMatch.value = true
    liveMatch.value = {
      ...match,
      round: bracket.value.find(r => r.matches.some(m => m.id === match.id))?.name
    }
    liveResult.value = null
    displaySets.value = []
    currentServer.value = 0
    currentSetIndex.value = 0
    lastPointWinner.value = 0
    showBall.value = false
    ballAnimating.value = false
    matchFinished.value = false
    skipAnimation.value = false
    isLiveSimulating.value = true

    try {
      const response = await fetch(`/api/tennis/match/${match.id}/simulate-live`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.sets) {
        liveResult.value = {
          winnerId: data.match.winnerId,
          score: data.match.score,
          p1Sets: data.p1Sets,
          p2Sets: data.p2Sets,
          sets: data.sets
        }

        // Animate game-by-game
        await animateMatchGameByGame(data.sets)

        matchFinished.value = true
      }

      await fetchBracket()
    } catch (error) {
      console.error('Failed to simulate match:', error)
    } finally {
      isLiveSimulating.value = false
      simulatingMatchId.value = null
    }
  } else {
    try {
      const response = await fetch(`/api/tennis/match/${match.id}/simulate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        await fetchBracket()
      }
    } catch (error) {
      console.error('Failed to simulate match:', error)
    } finally {
      simulatingMatchId.value = null
    }
  }
}

async function animateMatchGameByGame(sets) {
  const GAME_DELAY = 300
  const SET_DELAY = 600

  // Helper to check if we should skip
  const shouldContinue = () => !skipAnimation.value

  for (let setIdx = 0; setIdx < sets.length; setIdx++) {
    // Check for skip - if skipped, show final scores immediately
    if (!shouldContinue()) {
      showFinalScores(sets)
      return
    }

    const setData = sets[setIdx]
    currentSetIndex.value = setIdx

    // Add new set to display
    displaySets.value.push({ p1: 0, p2: 0 })

    // Animate each game in the set
    if (setData.games && shouldContinue()) {
      for (const game of setData.games) {
        if (!shouldContinue()) {
          showFinalScores(sets)
          return
        }

        currentServer.value = game.server

        // Ball animation for this game
        showBall.value = true
        ballAnimating.value = true
        await new Promise(r => setTimeout(r, 150))
        ballAnimating.value = false

        // Show who won the game
        lastPointWinner.value = game.winner

        // Update set score
        if (game.winner === 1) {
          displaySets.value[setIdx].p1++
        } else {
          displaySets.value[setIdx].p2++
        }

        // Pause between games
        if (shouldContinue()) {
          await new Promise(r => setTimeout(r, GAME_DELAY))
        }
        lastPointWinner.value = 0
      }
    } else {
      // Fallback if no games data - just show final set score
      const p1Games = parseInt(setData.score.split('-')[0])
      const p2Games = parseInt(setData.score.split('-')[1])
      displaySets.value[setIdx] = { p1: p1Games, p2: p2Games }
    }

    showBall.value = false

    // Pause between sets
    if (setIdx < sets.length - 1 && shouldContinue()) {
      await new Promise(r => setTimeout(r, SET_DELAY))
    }
  }
}

// Show final scores immediately (when skipping)
function showFinalScores(sets) {
  displaySets.value = sets.map(setData => {
    const p1Games = parseInt(setData.score.split('-')[0])
    const p2Games = parseInt(setData.score.split('-')[1])
    return { p1: p1Games, p2: p2Games }
  })
  showBall.value = false
  lastPointWinner.value = 0
}

async function simulateCurrentRound() {
  if (!currentRoundName.value) return
  simulatingRound.value = true

  try {
    const response = await fetch(`/api/tennis/event/${eventId.value}/simulate-round`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ round: currentRoundName.value })
    })
    if (response.ok) {
      await fetchBracket()
    }
  } catch (error) {
    console.error('Failed to simulate round:', error)
  } finally {
    simulatingRound.value = false
  }
}

async function completeTournament() {
  completingTournament.value = true
  try {
    const response = await fetch(`/api/tennis/event/${eventId.value}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    if (response.ok) {
      await fetchBracket()
    }
  } catch (error) {
    console.error('Failed to complete tournament:', error)
  } finally {
    completingTournament.value = false
  }
}

function closeLiveMatch() {
  if (isLiveSimulating.value) return
  showLiveMatch.value = false
  liveMatch.value = null
  liveResult.value = null
  displaySets.value = []
  currentServer.value = 0
  currentSetIndex.value = 0
  lastPointWinner.value = 0
  showBall.value = false
  ballAnimating.value = false
  matchFinished.value = false
  skipAnimation.value = false
}

function getWinnerName() {
  if (!liveResult.value || !liveMatch.value) return ''
  const winner = liveResult.value.winnerId === liveMatch.value.player1?.id
    ? liveMatch.value.player1
    : liveMatch.value.player2
  return `${winner?.firstName} ${winner?.lastName}`
}

function getPlayerScore(match, playerNum) {
  if (!match.score) return ''
  const scores = match.score.split(' ')
  return scores.map(s => {
    const parts = s.split('-')
    return playerNum === 1 ? parts[0] : parts[1]
  }).join(' ')
}

function formatStatus(status) {
  const labels = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

function formatSurface(surface) {
  const labels = {
    hard: 'Hard Court',
    clay: 'Clay',
    grass: 'Grass'
  }
  return labels[surface] || surface
}

function getTournamentLabel(type) {
  const labels = {
    grand_slam: 'Grand Slam',
    masters_1000: 'Masters 1000',
    atp_500: 'ATP 500',
    atp_250: 'ATP 250'
  }
  return labels[type] || type
}

function getBadgeStyle(type) {
  const styles = {
    grand_slam: { background: '#fef3c7', color: '#b45309' },
    masters_1000: { background: '#ede9fe', color: '#7c3aed' },
    atp_500: { background: '#dbeafe', color: '#2563eb' },
    atp_250: { background: '#f3f4f6', color: '#4b5563' }
  }
  return styles[type] || { background: '#f3f4f6', color: '#4b5563' }
}

onMounted(async () => {
  try {
    await fetchBracket()
  } catch (error) {
    console.error('Failed to load event:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tennis-event {
  min-height: 100vh;
  background: #f8fafc;
}

/* Flag styles */
.flag-xs {
  width: 1rem;
  height: 0.75rem;
  object-fit: cover;
  border-radius: 2px;
}

.flag-lg {
  width: 2.5rem;
  height: 1.875rem;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

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
  margin-bottom: 2rem;
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

.surface-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.surface-tag.hard {
  background: #dbeafe;
  color: #2563eb;
}

.surface-tag.clay {
  background: #ffedd5;
  color: #c2410c;
}

.surface-tag.grass {
  background: #dcfce7;
  color: #16a34a;
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

.event-actions {
  display: flex;
  gap: 0.75rem;
}

.tennis-btn {
  background: linear-gradient(135deg, #34d399, #10b981);
}

.tennis-btn:hover {
  background: linear-gradient(135deg, #10b981, #059669);
}

/* Bracket Styles */
.bracket-container {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.bracket-scroll {
  overflow-x: auto;
  padding-bottom: 1rem;
}

.bracket-two-sided {
  display: flex;
  gap: 1rem;
  min-width: max-content;
  align-items: flex-start;
}

.bracket-side {
  display: flex;
  gap: 0.75rem;
}

.bracket-left {
  flex-direction: row;
}

.bracket-right {
  flex-direction: row;
}

.bracket-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
  padding: 0 1rem;
  align-self: center;
}

.final-trophy {
  font-size: 2rem;
  color: #f59e0b;
  margin-bottom: 0.5rem;
}

.final-title {
  background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
  color: #92400e !important;
}

.final-match {
  min-width: 180px;
}

.champion-display {
  margin-top: 1rem;
  text-align: center;
}

.champion-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #f59e0b;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.champion-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-800);
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 0.5rem;
}

.bracket-round {
  min-width: 180px;
}

.round-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-700);
  text-align: center;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.round-matches {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.bracket-match {
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid var(--gray-200);
  overflow: hidden;
  transition: all 0.2s;
}

.bracket-match.ready {
  border-color: #10b981;
  background: #f0fdf4;
}

.bracket-match.completed {
  background: white;
}

.bracket-match.waiting {
  opacity: 0.6;
}

.match-player {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}

.match-player:last-of-type {
  border-bottom: none;
}

.match-player.winner {
  background: #dcfce7;
  font-weight: 600;
}

.match-player.loser {
  color: var(--gray-400);
}

.player-rank {
  font-size: 0.65rem;
  color: var(--gray-400);
  font-weight: 500;
}

.player-rank.seeded {
  color: #b45309;
  font-weight: 600;
}

.player-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-score {
  font-size: 0.65rem;
  color: var(--gray-600);
  font-weight: 500;
  margin-left: auto;
}

.tbd {
  color: var(--gray-400);
  font-style: italic;
  font-size: 0.7rem;
}

.flag-sm {
  width: 1.25rem;
  height: 0.9rem;
  object-fit: cover;
  border-radius: 2px;
}

.match-actions {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #f0fdf4;
  border-top: 1px solid #dcfce7;
  justify-content: center;
}

.btn-action {
  width: 32px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.25rem;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.btn-action.btn-live {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #2563eb;
}

.btn-action.btn-live:hover {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
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

/* Live Match Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  padding: 1.5rem;
}

.modal-live {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: white;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-live .btn-ghost {
  color: #94a3b8;
}

.modal-live .btn-ghost:hover {
  color: white;
}

.live-match-container {
  text-align: center;
}

.live-players {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.live-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  transition: all 0.3s;
}

.live-player.winner {
  background: rgba(16, 185, 129, 0.2);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

.live-player-name {
  font-weight: 600;
  font-size: 1rem;
}

.vs {
  font-size: 1.5rem;
  font-weight: 700;
  color: #64748b;
}

.live-scoreboard {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.scoreboard-row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.scoreboard-row.header {
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.scoreboard-row.winner {
  color: #10b981;
  font-weight: 600;
}

.player-cell {
  flex: 1;
  text-align: left;
  padding-left: 0.5rem;
}

.set-cell {
  width: 50px;
  text-align: center;
  font-size: 1.1rem;
  padding: 0.25rem;
}

.set-cell.won {
  color: #10b981;
  font-weight: 700;
}

.total-cell {
  width: 60px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

.live-progress {
  padding: 2rem;
}

.progress-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #94a3b8;
  font-size: 1rem;
}

.live-result {
  padding: 1.5rem;
}

.result-winner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 0.5rem;
}

.result-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .event-info-card {
    flex-direction: column;
    gap: 1rem;
  }

  .event-info-right {
    align-items: flex-start;
    width: 100%;
  }

  .event-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .breadcrumb {
    display: none;
  }

  .bracket-round {
    min-width: 180px;
  }
}

/* ========== LIVE MATCH FULLSCREEN ========== */
.live-match-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.9);
}

.live-match-fullscreen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.live-match-fullscreen.surface-hard {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%);
}

.live-match-fullscreen.surface-clay {
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #A0522D 100%);
}

.live-match-fullscreen.surface-grass {
  background: linear-gradient(135deg, #14532d 0%, #22c55e 50%, #166534 100%);
}

.live-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  color: white;
}

.live-tournament-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.live-round {
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.live-event-name {
  font-size: 0.875rem;
  opacity: 0.8;
}

.btn-close-live {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-close-live:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-close-live:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scoreboard */
.live-scoreboard-main {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem auto;
  max-width: 600px;
  width: 100%;
}

.live-player-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.live-player-row:first-child {
  margin-bottom: 0.5rem;
}

.live-player-row.serving {
  background: rgba(255, 255, 255, 0.1);
}

.live-player-row.winner {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.3) 0%, transparent 100%);
}

.player-info-live {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.flag-live {
  width: 2rem;
  height: 1.5rem;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.player-name-live {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

.rank-live {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
}

.rank-live.seeded {
  color: #fbbf24;
  font-weight: 600;
}

.serve-indicator {
  color: #fbbf24;
  font-size: 0.75rem;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sets-score {
  display: flex;
  gap: 0.5rem;
}

.set-score {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 1.125rem;
  font-weight: 600;
  transition: all 0.3s;
}

.set-score.set-won {
  background: #22c55e;
  color: white;
}

.set-score.current-set {
  border: 2px solid #fbbf24;
}

.set-score.game-highlight {
  background: #22c55e;
  transform: scale(1.15);
}

.live-player-row.game-won {
  background: rgba(34, 197, 94, 0.2);
}

.game-score {
  background: #1e293b;
  color: white;
  min-width: 3rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

.game-score.highlight {
  background: #22c55e;
  transform: scale(1.1);
}

/* Tennis Court */
.court-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  max-height: 300px;
}

.tennis-court {
  width: 100%;
  max-width: 500px;
  height: auto;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
  border-radius: 8px;
  overflow: hidden;
}

.player-figure {
  transition: all 0.3s;
}

.player-figure.active circle {
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
  transform-origin: center;
  animation: playerGlow 0.5s ease-out;
}

@keyframes playerGlow {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.tennis-ball {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  transition: all 0.1s;
}

.tennis-ball.ball-animate {
  animation: ballBounce 0.2s ease-out;
}

@keyframes ballBounce {
  0% { transform: translateX(-80px); opacity: 0; }
  50% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(80px); opacity: 0; }
}

/* Commentary */
.match-commentary {
  text-align: center;
  padding: 1rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.commentary-text {
  color: white;
  font-size: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.point-flash {
  color: #fbbf24;
  font-weight: 600;
  animation: flashIn 0.3s ease-out;
}

.btn-skip {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-skip:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

@keyframes flashIn {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.match-finished {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: winnerReveal 0.5s ease-out;
}

@keyframes winnerReveal {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.winner-announcement {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
}

.trophy-icon {
  color: #fbbf24;
  font-size: 2rem;
  animation: trophyBounce 0.5s ease-out;
}

@keyframes trophyBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.winner-name {
  font-size: 1.5rem;
  font-weight: 700;
}

.wins-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #22c55e;
}

.final-score {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.25rem;
  font-family: 'Courier New', monospace;
}

.btn-continue {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  background: #22c55e;
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-continue:hover {
  background: #16a34a;
  transform: scale(1.05);
}

@media (max-width: 640px) {
  .live-scoreboard-main {
    padding: 0.75rem;
  }

  .player-name-live {
    font-size: 1rem;
  }

  .set-score {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.875rem;
  }

  .game-score {
    min-width: 2.5rem;
    height: 2rem;
    font-size: 1rem;
  }

  .court-container {
    max-height: 200px;
  }
}
</style>
