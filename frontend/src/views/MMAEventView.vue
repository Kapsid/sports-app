<template>
  <div class="mma-event-view">
    <header class="dashboard-header" :style="{ background: headerGradient }">
      <div class="container header-content">
        <div class="brand">
          <button @click="goBack" class="back-btn" title="Back to Organization">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <i class="fa-solid fa-hand-fist"></i>
          <span>{{ event?.name || 'Event' }}</span>
        </div>
        <div class="event-meta" v-if="event">
          <span class="location">
            <i class="fa-solid fa-location-dot"></i>
            {{ event.city }}, {{ event.country }}
          </span>
        </div>
      </div>
    </header>

    <main class="event-main">
      <div class="container">
        <div v-if="loading && !event" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading event...
        </div>

        <template v-else-if="event">
          <!-- Event Banner -->
          <section class="event-banner fade-in" :style="{ borderColor: event.theme_color }">
            <div class="banner-content">
              <div class="event-number" :style="{ background: event.theme_color }">
                {{ event.event_number }}
              </div>
              <div class="event-info">
                <h1>{{ event.name }}</h1>
                <p class="venue">{{ event.venue }}</p>
                <p class="location">{{ event.city }}, {{ event.country }}</p>
              </div>
              <div class="event-actions" v-if="event.status !== 'completed'">
                <button
                  @click="simulateAll"
                  class="btn btn-primary mma-btn"
                  :disabled="simulating"
                  :style="{ background: event.theme_color }"
                >
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward"></i>
                  {{ simulating ? 'Simulating...' : 'Simulate All' }}
                </button>
              </div>
              <div class="event-status" v-else>
                <span class="completed-badge">
                  <i class="fa-solid fa-check-circle"></i>
                  Completed
                </span>
              </div>
            </div>
          </section>

          <!-- Fight Card -->
          <section class="fight-card-section">
            <!-- Prelims (first) -->
            <div class="card-section prelims">
              <h2 class="card-title">
                <i class="fa-solid fa-list"></i>
                Preliminary Card
              </h2>
              <div class="fights-list">
                <div
                  v-for="fight in prelimFights"
                  :key="fight.id"
                  :class="['fight-card', 'prelim', { completed: fight.status === 'completed' }]"
                >
                  <div class="weight-class">{{ fight.weight_class_name }}</div>

                  <div class="fighters-container compact">
                    <!-- Fighter 1 -->
                    <div :class="['fighter', { winner: fight.winner_id === fight.fighter1_id }]">
                      <img
                        :src="`/flags/${fight.f1_country}.png`"
                        :alt="fight.f1_country"
                        class="country-flag small"
                        @error="handleFlagError"
                      />
                      <span class="fighter-name">{{ fight.f1_first }} {{ fight.f1_last }}</span>
                      <span class="record">({{ fight.f1_wins }}-{{ fight.f1_losses }})</span>
                    </div>

                    <!-- VS / Result -->
                    <div class="vs-compact">
                      <span v-if="fight.status === 'completed'" class="result-compact">
                        {{ fight.method }} R{{ fight.round }}
                      </span>
                      <span v-else>vs</span>
                    </div>

                    <!-- Fighter 2 -->
                    <div :class="['fighter', 'right', { winner: fight.winner_id === fight.fighter2_id }]">
                      <span class="record">({{ fight.f2_wins }}-{{ fight.f2_losses }})</span>
                      <span class="fighter-name">{{ fight.f2_first }} {{ fight.f2_last }}</span>
                      <img
                        :src="`/flags/${fight.f2_country}.png`"
                        :alt="fight.f2_country"
                        class="country-flag small"
                        @error="handleFlagError"
                      />
                    </div>
                  </div>

                  <!-- Fight Actions -->
                  <div class="fight-actions" v-if="fight.status !== 'completed'">
                    <button
                      @click="simulateFight(fight.id, false)"
                      class="btn btn-sm btn-action"
                      :disabled="simulatingFight === fight.id"
                    >
                      <i v-if="simulatingFight === fight.id" class="fa-solid fa-spinner fa-spin"></i>
                      <i v-else class="fa-solid fa-bolt"></i>
                    </button>
                    <button
                      @click="simulateFight(fight.id, true)"
                      class="btn btn-sm btn-action btn-detailed"
                      :disabled="simulatingFight === fight.id"
                    >
                      <i class="fa-solid fa-list"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Card (second) -->
            <div class="card-section">
              <h2 class="card-title">
                <i class="fa-solid fa-star"></i>
                Main Card
              </h2>
              <div class="fights-list">
                <div
                  v-for="fight in mainCardFights"
                  :key="fight.id"
                  :class="['fight-card', { completed: fight.status === 'completed', 'title-fight': fight.is_title_fight }]"
                >
                  <div v-if="fight.is_title_fight" class="title-badge" :style="{ background: event.theme_color }">
                    <i class="fa-solid fa-trophy"></i>
                    {{ (fight.f1_champion || fight.f2_champion) ? 'Title Fight' : 'Vacant Title' }}
                  </div>
                  <div class="weight-class">{{ fight.weight_class_name }}</div>

                  <div class="fighters-container">
                    <!-- Fighter 1 -->
                    <div :class="['fighter', { winner: fight.winner_id === fight.fighter1_id }]">
                      <img
                        :src="`/flags/${fight.f1_country}.png`"
                        :alt="fight.f1_country"
                        class="country-flag"
                        @error="handleFlagError"
                      />
                      <div class="fighter-info">
                        <span class="fighter-name">{{ fight.f1_first }} {{ fight.f1_last }}</span>
                        <span v-if="fight.f1_nickname" class="nickname">"{{ fight.f1_nickname }}"</span>
                        <span class="record">{{ fight.f1_wins }}-{{ fight.f1_losses }}-{{ fight.f1_draws }}</span>
                      </div>
                      <div class="ranking">
                        <span v-if="fight.f1_champion" class="champion"><i class="fa-solid fa-medal"></i></span>
                        <span v-else>#{{ fight.f1_ranking }}</span>
                      </div>
                    </div>

                    <!-- VS -->
                    <div class="vs-container">
                      <span class="vs">VS</span>
                      <div v-if="fight.status === 'completed'" class="result">
                        <span class="method">{{ fight.method }}</span>
                        <span class="round-time">R{{ fight.round }} {{ fight.time }}</span>
                      </div>
                    </div>

                    <!-- Fighter 2 -->
                    <div :class="['fighter', 'right', { winner: fight.winner_id === fight.fighter2_id }]">
                      <div class="ranking">
                        <span v-if="fight.f2_champion" class="champion"><i class="fa-solid fa-medal"></i></span>
                        <span v-else>#{{ fight.f2_ranking }}</span>
                      </div>
                      <div class="fighter-info">
                        <span class="fighter-name">{{ fight.f2_first }} {{ fight.f2_last }}</span>
                        <span v-if="fight.f2_nickname" class="nickname">"{{ fight.f2_nickname }}"</span>
                        <span class="record">{{ fight.f2_wins }}-{{ fight.f2_losses }}-{{ fight.f2_draws }}</span>
                      </div>
                      <img
                        :src="`/flags/${fight.f2_country}.png`"
                        :alt="fight.f2_country"
                        class="country-flag"
                        @error="handleFlagError"
                      />
                    </div>
                  </div>

                  <!-- Fight Actions -->
                  <div class="fight-actions" v-if="fight.status !== 'completed'">
                    <button
                      @click="simulateFight(fight.id, false)"
                      class="btn btn-sm btn-action"
                      :disabled="simulatingFight === fight.id"
                    >
                      <i v-if="simulatingFight === fight.id" class="fa-solid fa-spinner fa-spin"></i>
                      <i v-else class="fa-solid fa-bolt"></i>
                      Fast
                    </button>
                    <button
                      @click="simulateFight(fight.id, true)"
                      class="btn btn-sm btn-action btn-detailed"
                      :disabled="simulatingFight === fight.id"
                    >
                      <i class="fa-solid fa-list"></i>
                      Detailed
                    </button>
                  </div>

                  <!-- Fight Stats (if completed with detailed) -->
                  <div v-if="fight.status === 'completed' && fight.fight_stats" class="fight-stats">
                    <div class="stat-row">
                      <span>{{ fight.fight_stats.fighter1?.sigStrikes || 0 }}</span>
                      <span class="stat-label">Sig. Strikes</span>
                      <span>{{ fight.fight_stats.fighter2?.sigStrikes || 0 }}</span>
                    </div>
                    <div class="stat-row">
                      <span>{{ fight.fight_stats.fighter1?.takedowns || 0 }}</span>
                      <span class="stat-label">Takedowns</span>
                      <span>{{ fight.fight_stats.fighter2?.takedowns || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </main>

    <!-- Detailed Fight Modal -->
    <div v-if="showDetailedModal" class="modal-overlay" @click.self="showDetailedModal = false">
      <div class="modal detailed-modal fade-in">
        <div class="modal-header" :style="{ background: event?.theme_color }">
          <h2>Fight Result</h2>
          <button @click="showDetailedModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body" v-if="detailedResult">
          <!-- Fighter names header -->
          <div v-if="currentFight" class="fighters-header">
            <span class="fighter-label left">{{ currentFight.f1_last }}</span>
            <span class="vs-label">vs</span>
            <span class="fighter-label right">{{ currentFight.f2_last }}</span>
          </div>

          <!-- Show waiting state before first round -->
          <div v-if="isSimulatingDetailed && visibleRounds === 0" class="simulation-waiting">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Starting fight...</span>
          </div>

          <!-- Round by Round (progressive reveal) -->
          <div v-if="detailedResult.rounds && visibleRounds > 0" class="rounds-breakdown">
            <h3>
              <i class="fa-solid fa-list-ol"></i>
              Round by Round
              <span v-if="isSimulatingDetailed" class="live-badge">LIVE</span>
            </h3>
            <div
              v-for="(round, index) in detailedResult.rounds.slice(0, visibleRounds)"
              :key="round.roundNum"
              :class="['round-card', { 'new-round': index === visibleRounds - 1 && isSimulatingDetailed }]"
            >
              <div class="round-header">
                <span class="round-num">Round {{ round.roundNum }}</span>
                <div v-if="!isSimulatingDetailed || visibleEvents[index] >= (round.events?.length || 0)" class="round-score-container">
                  <span :class="['score', { winner: round.f1Score > round.f2Score }]">{{ round.f1Score }}</span>
                  <span class="score-dash">-</span>
                  <span :class="['score', { winner: round.f2Score > round.f1Score }]">{{ round.f2Score }}</span>
                  <span class="round-winner">
                    ({{ round.f1Score > round.f2Score ? currentFight?.f1_last : currentFight?.f2_last }})
                  </span>
                </div>
              </div>
              <div v-if="!isSimulatingDetailed || visibleEvents[index] >= (round.events?.length || 0)" class="round-stats">
                <div class="stat-line">
                  <span class="stat-value">{{ round.f1SigStrikes }}</span>
                  <span class="label">Sig Strikes</span>
                  <span class="stat-value">{{ round.f2SigStrikes }}</span>
                </div>
                <div class="stat-line">
                  <span class="stat-value">{{ round.f1Takedowns }}</span>
                  <span class="label">Takedowns</span>
                  <span class="stat-value">{{ round.f2Takedowns }}</span>
                </div>
              </div>
              <div v-if="round.events && round.events.length" class="round-events">
                <p
                  v-for="(evt, idx) in round.events.slice(0, visibleEvents[index] ?? round.events.length)"
                  :key="idx"
                  :class="{ 'new-event': isSimulatingDetailed && idx === (visibleEvents[index] || 0) - 1 }"
                >{{ evt }}</p>
              </div>
              <div v-if="round.finish && (!isSimulatingDetailed || visibleEvents[index] >= (round.events?.length || 0))" class="finish-alert">
                <i class="fa-solid fa-star"></i>
                FINISH!
              </div>
            </div>

            <!-- Next round indicator -->
            <div v-if="isSimulatingDetailed && !detailedResult.rounds[visibleRounds - 1]?.finish && visibleRounds < detailedResult.rounds.length" class="next-round-indicator">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <span>Round {{ visibleRounds + 1 }} starting...</span>
            </div>
          </div>

          <!-- Final Result (only shown when simulation complete) -->
          <div v-if="!isSimulatingDetailed" class="result-header fade-in">
            <div class="winner-info">
              <span class="winner-label">Winner</span>
              <span class="winner-name">{{ getWinnerName(detailedResult) }}</span>
            </div>
            <div class="method-info">
              <span class="method">{{ detailedResult.method }}</span>
              <span class="round-time">Round {{ detailedResult.round }} - {{ detailedResult.time }}</span>
            </div>
          </div>

          <!-- Total Stats (only shown when simulation complete) -->
          <div class="total-stats" v-if="!isSimulatingDetailed && detailedResult.stats">
            <h3>Fight Statistics</h3>
            <div class="stats-grid">
              <div class="stat-row">
                <span>{{ detailedResult.stats.fighter1?.strikes }}</span>
                <span class="label">Total Strikes</span>
                <span>{{ detailedResult.stats.fighter2?.strikes }}</span>
              </div>
              <div class="stat-row">
                <span>{{ detailedResult.stats.fighter1?.sigStrikes }}</span>
                <span class="label">Sig. Strikes</span>
                <span>{{ detailedResult.stats.fighter2?.sigStrikes }}</span>
              </div>
              <div class="stat-row">
                <span>{{ detailedResult.stats.fighter1?.takedowns }}</span>
                <span class="label">Takedowns</span>
                <span>{{ detailedResult.stats.fighter2?.takedowns }}</span>
              </div>
              <div class="stat-row">
                <span>{{ detailedResult.stats.fighter1?.subAttempts }}</span>
                <span class="label">Sub Attempts</span>
                <span>{{ detailedResult.stats.fighter2?.subAttempts }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showDetailedModal = false" class="btn btn-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMMAStore } from '../stores/mma'

const router = useRouter()
const route = useRoute()
const mmaStore = useMMAStore()

const event = computed(() => mmaStore.currentEvent)
const fights = computed(() => mmaStore.fights)
const loading = computed(() => mmaStore.loading)

const simulating = ref(false)
const simulatingFight = ref(null)
const showDetailedModal = ref(false)
const detailedResult = ref(null)
const currentFight = ref(null)
const visibleRounds = ref(0)
const visibleEvents = ref({}) // Track visible events per round
const isSimulatingDetailed = ref(false)

const headerGradient = computed(() => {
  const color = event.value?.theme_color || '#dc2626'
  return `linear-gradient(135deg, ${color}22 0%, #1a1a2e 100%)`
})

const mainCardFights = computed(() => {
  return fights.value
    .filter(f => f.card_position === 'main')
    .sort((a, b) => a.fight_order - b.fight_order) // Higher order = last = main event
})

const prelimFights = computed(() => {
  return fights.value
    .filter(f => f.card_position === 'prelim')
    .sort((a, b) => b.fight_order - a.fight_order)
})

onMounted(async () => {
  await mmaStore.fetchEvent(route.params.eventId)
})

function goBack() {
  router.push(`/mma/org/${route.params.orgId}`)
}

function getWinnerName(result) {
  const fight = currentFight.value
  if (!fight || !result) return ''
  if (result.winnerId === fight.fighter1_id) {
    return `${fight.f1_first} ${fight.f1_last}`
  }
  return `${fight.f2_first} ${fight.f2_last}`
}

async function simulateFight(fightId, detailed) {
  simulatingFight.value = fightId
  currentFight.value = fights.value.find(f => f.id === fightId)
  try {
    const result = await mmaStore.simulateFight(fightId, detailed)
    if (detailed && result.result.rounds) {
      detailedResult.value = result.result
      visibleRounds.value = 0
      visibleEvents.value = {}
      isSimulatingDetailed.value = true
      showDetailedModal.value = true
      // Progressive round reveal
      await revealRoundsProgressively(result.result.rounds)
    }
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to simulate fight')
  } finally {
    simulatingFight.value = null
  }
}

async function revealRoundsProgressively(rounds) {
  for (let i = 0; i < rounds.length; i++) {
    // Delay before showing round
    await new Promise(resolve => setTimeout(resolve, 2500))
    visibleRounds.value = i + 1
    visibleEvents.value[i] = 0

    // Reveal events one by one within this round
    const roundEvents = rounds[i].events || []
    for (let j = 0; j < roundEvents.length; j++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      visibleEvents.value[i] = j + 1
    }

    // If this round has a finish, stop revealing and show final result
    if (rounds[i].finish) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      break
    }
  }
  // Small delay before showing final stats
  await new Promise(resolve => setTimeout(resolve, 1800))
  isSimulatingDetailed.value = false
}

async function simulateAll() {
  simulating.value = true
  try {
    await mmaStore.simulateAllFights(route.params.eventId)
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to simulate event')
  } finally {
    simulating.value = false
  }
}

function handleFlagError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.mma-event-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

/* Header */
.dashboard-header {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.3s;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-state {
  text-align: center;
  padding: 4rem;
  color: rgba(255, 255, 255, 0.6);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #dc2626;
}

/* Buttons */
.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.btn-ghost:hover {
  color: #fff;
}

.event-meta {
  color: rgba(255, 255, 255, 0.7);
}

.event-meta .location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-main {
  padding: 2rem 0;
}

.event-banner {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border-left: 4px solid;
  margin-bottom: 2rem;
  overflow: hidden;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

.event-number {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.event-info {
  flex: 1;
}

.event-info h1 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.event-info .venue {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.event-info .location {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}

.completed-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #22c55e;
  font-weight: 500;
}

.mma-btn {
  border: none;
}

.mma-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

/* Fight Card Sections */
.fight-card-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
}

.card-section.prelims {
  opacity: 0.9;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
}

.card-title i {
  color: #fbbf24;
}

.fights-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Fight Card */
.fight-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1rem;
  position: relative;
  transition: all 0.2s;
}

.fight-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.fight-card.title-fight {
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.fight-card.completed {
  opacity: 0.8;
}

.title-badge {
  position: absolute;
  top: 0;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0 0 0.5rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.weight-class {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.75rem;
}

.fighters-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.fighters-container.compact {
  gap: 0.5rem;
}

.fighter {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.fighter.right {
  flex-direction: row-reverse;
  text-align: right;
}

.fighter.right .fighter-info {
  align-items: flex-end;
}

.fighter.winner {
  background: rgba(34, 197, 94, 0.15);
}

.country-flag {
  width: 32px;
  height: 22px;
  object-fit: cover;
  border-radius: 2px;
}

.country-flag.small {
  width: 24px;
  height: 16px;
}

.fighter-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.fighter-name {
  font-weight: 600;
}

.nickname {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.record {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.ranking {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.ranking .champion {
  color: #fbbf24;
}

.vs-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 100px;
}

.vs {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.result {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result .method {
  font-size: 0.7rem;
  font-weight: 600;
  color: #22c55e;
  text-transform: uppercase;
}

.result .round-time {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
}

.vs-compact {
  min-width: 80px;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.result-compact {
  font-size: 0.7rem;
  color: #22c55e;
  font-weight: 500;
}

.fight-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-action {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.btn-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-detailed {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.btn-detailed:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.3);
}

.fight-stats {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 0.25rem 0;
}

.stat-row .stat-label,
.stat-row .label {
  color: rgba(255, 255, 255, 0.5);
}

/* Prelim Fights */
.fight-card.prelim {
  padding: 0.75rem;
}

.fight-card.prelim .weight-class {
  margin-bottom: 0.5rem;
}

/* Detailed Modal */
.detailed-modal {
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.result-header {
  text-align: center;
  padding: 1.5rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.winner-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.winner-name {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #22c55e;
  margin: 0.25rem 0;
}

.method-info .method {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
}

.method-info .round-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.rounds-breakdown h3,
.total-stats h3 {
  font-size: 0.9rem;
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.simulation-waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
}

.simulation-waiting i {
  font-size: 2rem;
  color: #3b82f6;
}

.rounds-breakdown h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-badge {
  background: #dc2626;
  color: white;
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 700;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.round-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.round-card.new-round {
  animation: slideIn 0.4s ease;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.next-round-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.next-round-indicator i {
  color: #3b82f6;
}

.fighters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.fighter-label {
  font-weight: 700;
  font-size: 1.1rem;
  flex: 1;
}

.fighter-label.left {
  text-align: left;
  color: #60a5fa;
}

.fighter-label.right {
  text-align: right;
  color: #f87171;
}

.vs-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  padding: 0 1rem;
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.round-num {
  font-weight: 600;
}

.round-score-container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.round-score-container .score {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

.round-score-container .score.winner {
  color: #22c55e;
}

.round-score-container .score-dash {
  color: rgba(255, 255, 255, 0.4);
}

.round-winner {
  font-size: 0.75rem;
  color: #22c55e;
  margin-left: 0.5rem;
}

.round-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.stat-line .label {
  color: rgba(255, 255, 255, 0.5);
}

.round-events {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.round-events p {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.round-events p.new-event {
  animation: eventAppear 0.4s ease;
  color: #fbbf24;
  font-weight: 500;
}

@keyframes eventAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.finish-alert {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
  text-align: center;
  font-weight: 700;
  border-radius: 0.25rem;
}

.total-stats {
  margin-top: 1.5rem;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #1e293b;
  border-radius: 1rem;
  width: 100%;
  max-width: 480px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem 1rem 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
