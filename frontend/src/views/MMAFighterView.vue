<template>
  <div class="mma-fighter-view">
    <header class="dashboard-header">
      <div class="container header-content">
        <div class="brand">
          <button @click="goBack" class="back-btn" title="Back to Organization">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <i class="fa-solid fa-hand-fist mma-icon"></i>
          <span>Fighter Profile</span>
        </div>
      </div>
    </header>

    <main class="fighter-main">
      <div class="container">
        <div v-if="loading && !fighter" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading fighter...
        </div>

        <template v-else-if="fighter">
          <!-- Fighter Header -->
          <section class="fighter-header fade-in">
            <div class="fighter-avatar">
              <img
                :src="`/flags/${fighter.country_code}.png`"
                :alt="fighter.country_code"
                class="country-flag"
                @error="handleFlagError"
              />
            </div>

            <div class="fighter-info">
              <div class="name-row">
                <h1>{{ fighter.first_name }} {{ fighter.last_name }}</h1>
                <span v-if="fighter.is_champion" class="champion-badge">
                  <i class="fa-solid fa-crown"></i>
                  Champion
                </span>
              </div>
              <p v-if="fighter.nickname" class="nickname">"{{ fighter.nickname }}"</p>

              <div class="fighter-meta">
                <span :class="['weight-badge', fighter.gender]">
                  {{ fighter.gender === 'men' ? 'Men' : 'Women' }} - {{ fighter.weight_class_name }}
                </span>
                <span class="ranking" v-if="!fighter.is_champion">
                  Ranked #{{ fighter.ranking }}
                </span>
                <span class="title-defenses" v-if="fighter.is_champion && fighter.title_defenses">
                  {{ fighter.title_defenses }} Title Defense{{ fighter.title_defenses > 1 ? 's' : '' }}
                </span>
                <span v-if="fighter.title_reigns" class="title-reigns">
                  <i class="fa-solid fa-medal"></i>
                  {{ fighter.title_reigns }}x Champion
                </span>
              </div>

              <!-- Current Form -->
              <div class="fighter-form">
                <span v-if="fighter.win_streak > 0" class="streak-badge win">
                  <i class="fa-solid fa-fire"></i>
                  {{ fighter.win_streak }} Win Streak
                </span>
                <span v-else-if="fighter.loss_streak > 0" class="streak-badge loss">
                  <i class="fa-solid fa-arrow-down"></i>
                  {{ fighter.loss_streak }} Loss Streak
                </span>
                <span v-else class="streak-badge neutral">
                  No active streak
                </span>
              </div>
            </div>

            <div class="fighter-record">
              <div class="record-main">
                <span class="wins">{{ fighter.wins }}</span>
                <span class="separator">-</span>
                <span class="losses">{{ fighter.losses }}</span>
                <span class="separator">-</span>
                <span class="draws">{{ fighter.draws }}</span>
              </div>
              <div class="record-breakdown">
                <span>{{ fighter.ko_wins }} KO</span>
                <span>{{ fighter.sub_wins }} SUB</span>
                <span>{{ fighter.dec_wins }} DEC</span>
              </div>
            </div>
          </section>

          <!-- Fighter Stats -->
          <section class="fighter-stats fade-in">
            <h2>Attributes</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Striking</div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ width: `${fighter.striking}%` }"></div>
                </div>
                <div class="stat-value">{{ fighter.striking }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Grappling</div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ width: `${fighter.grappling}%` }"></div>
                </div>
                <div class="stat-value">{{ fighter.grappling }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Wrestling</div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ width: `${fighter.wrestling}%` }"></div>
                </div>
                <div class="stat-value">{{ fighter.wrestling }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Cardio</div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ width: `${fighter.cardio}%` }"></div>
                </div>
                <div class="stat-value">{{ fighter.cardio }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Chin</div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ width: `${fighter.chin}%` }"></div>
                </div>
                <div class="stat-value">{{ fighter.chin }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Power</div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ width: `${fighter.power}%` }"></div>
                </div>
                <div class="stat-value">{{ fighter.power }}</div>
              </div>
            </div>
            <div class="overall-rating">
              <span class="label">Overall Rating</span>
              <span class="value">{{ overallRating }}</span>
            </div>
          </section>

          <!-- Fight History -->
          <section class="fight-history fade-in">
            <h2>Fight History</h2>

            <div v-if="fightHistory.length === 0" class="empty-state">
              <p>No fight history yet</p>
            </div>

            <div v-else class="history-list">
              <div
                v-for="fight in fightHistory"
                :key="fight.id"
                :class="['history-item', getResultClass(fight)]"
              >
                <div class="result-indicator">
                  <span v-if="isWin(fight)">W</span>
                  <span v-else-if="isLoss(fight)">L</span>
                  <span v-else>D</span>
                </div>

                <div class="fight-details">
                  <div class="opponent">
                    <span class="vs">vs</span>
                    <span class="opponent-name">{{ getOpponentName(fight) }}</span>
                  </div>
                  <div class="fight-meta">
                    <span class="method">{{ fight.method }}</span>
                    <span class="separator">-</span>
                    <span class="round">R{{ fight.round }}</span>
                  </div>
                </div>

                <div class="event-info">
                  <span class="event-name">{{ fight.event_name }}</span>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMMAStore } from '../stores/mma'

const router = useRouter()
const route = useRoute()
const mmaStore = useMMAStore()

const fighter = computed(() => mmaStore.currentFighter)
const loading = computed(() => mmaStore.loading)

const fightHistory = ref([])

const overallRating = computed(() => {
  if (!fighter.value) return 0
  const f = fighter.value
  return Math.round((f.striking + f.grappling + f.wrestling + f.cardio + f.chin + f.power) / 6)
})

onMounted(async () => {
  const result = await mmaStore.fetchFighter(route.params.fighterId)
  if (result && result.fights) {
    fightHistory.value = result.fights
  }
})

function goBack() {
  router.push(`/mma/org/${route.params.orgId}`)
}

function isWin(fight) {
  return fight.winner_id === fighter.value?.id
}

function isLoss(fight) {
  return fight.winner_id && fight.winner_id !== fighter.value?.id
}

function getResultClass(fight) {
  if (isWin(fight)) return 'win'
  if (isLoss(fight)) return 'loss'
  return 'draw'
}

function getOpponentName(fight) {
  const fighterId = fighter.value?.id
  if (fight.fighter1_id === fighterId) {
    return `${fight.f2_first} ${fight.f2_last}`
  }
  return `${fight.f1_first} ${fight.f1_last}`
}

function handleFlagError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.mma-fighter-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

/* Header */
.dashboard-header {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.mma-icon {
  color: #dc2626;
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

.fighter-main {
  padding: 2rem 0;
}

/* Fighter Header */
.fighter-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  margin-bottom: 1.5rem;
}

.fighter-avatar {
  flex-shrink: 0;
}

.fighter-avatar .country-flag {
  width: 80px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
}

.fighter-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.name-row h1 {
  margin: 0;
  font-size: 2rem;
}

.champion-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.nickname {
  margin: 0.25rem 0 0.75rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.fighter-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.weight-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.weight-badge.men {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.weight-badge.women {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.ranking,
.title-defenses {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.title-reigns {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #fbbf24;
  font-size: 0.9rem;
  font-weight: 500;
}

.title-reigns i {
  font-size: 0.8rem;
}

/* Fighter Form / Streak */
.fighter-form {
  margin-top: 0.75rem;
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.streak-badge.win {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.streak-badge.loss {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}

.streak-badge.neutral {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.streak-badge i {
  font-size: 0.75rem;
}

.fighter-record {
  text-align: center;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
}

.record-main .wins {
  color: #22c55e;
}

.record-main .losses {
  color: #dc2626;
}

.record-main .draws {
  color: #fbbf24;
}

.record-main .separator {
  color: rgba(255, 255, 255, 0.3);
}

.record-breakdown {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Fighter Stats */
.fighter-stats {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.fighter-stats h2 {
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-label {
  min-width: 80px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.stat-bar-container {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #ef4444);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.stat-value {
  min-width: 32px;
  text-align: right;
  font-weight: 600;
  color: #dc2626;
}

.overall-rating {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.overall-rating .label {
  font-size: 1rem;
  font-weight: 500;
}

.overall-rating .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
}

/* Fight History */
.fight-history {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
}

.fight-history h2 {
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  border-left: 3px solid;
}

.history-item.win {
  border-color: #22c55e;
}

.history-item.loss {
  border-color: #dc2626;
}

.history-item.draw {
  border-color: #fbbf24;
}

.result-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.history-item.win .result-indicator {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.history-item.loss .result-indicator {
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
}

.history-item.draw .result-indicator {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.fight-details {
  flex: 1;
}

.opponent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.opponent .vs {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.opponent-name {
  font-weight: 500;
}

.fight-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.event-info {
  text-align: right;
}

.event-name {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}
</style>
