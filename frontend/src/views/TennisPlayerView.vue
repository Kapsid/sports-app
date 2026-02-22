<template>
  <div class="tennis-player">
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
        <div class="breadcrumb" v-if="profile">
          <span class="player-breadcrumb">
            <img :src="`/flags/${profile.country}.png`" class="flag-sm" />
            {{ profile.firstName }} {{ profile.lastName }}
          </span>
        </div>
        <div class="user-menu">
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="player-main">
      <div class="container">
        <!-- Loading state -->
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Loading player profile...</span>
        </div>

        <template v-else-if="profile">
          <!-- Player Header Card -->
          <div class="player-header-card fade-in">
            <div class="player-avatar">
              <img :src="`/flags/${profile.country}.png`" class="flag-xl" />
            </div>
            <div class="player-info">
              <h1 class="player-name">{{ profile.firstName }} {{ profile.lastName }}</h1>
              <div class="player-meta">
                <span class="meta-item country">
                  <img :src="`/flags/${profile.country}.png`" class="flag-sm" />
                  {{ getCountryName(profile.country) }}
                </span>
                <span class="meta-item specialty" :class="profile.specialty">
                  {{ formatSpecialty(profile.specialty) }}
                </span>
              </div>
            </div>
            <div class="player-rank-card">
              <div class="rank-label">World Ranking</div>
              <div class="rank-value" :class="getRankClass(profile.currentRank)">
                #{{ profile.currentRank || 'N/A' }}
              </div>
              <div class="rank-points">{{ profile.rankingPoints.toLocaleString() }} pts</div>
            </div>
          </div>

          <div class="profile-grid fade-in">
            <!-- Career Stats -->
            <div class="profile-card">
              <h2 class="card-title">
                <i class="fa-solid fa-chart-line"></i>
                Career Statistics
              </h2>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value highlight">{{ profile.career.highestRanking || '-' }}</div>
                  <div class="stat-label">Career High</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profile.career.titles }}</div>
                  <div class="stat-label">Titles</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value gold">{{ profile.career.grandSlamTitles }}</div>
                  <div class="stat-label">Grand Slams</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profile.career.matchesWon }}</div>
                  <div class="stat-label">Wins</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profile.career.matchesLost }}</div>
                  <div class="stat-label">Losses</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profile.career.winPercentage }}%</div>
                  <div class="stat-label">Win Rate</div>
                </div>
              </div>
            </div>

            <!-- Grand Slam Results -->
            <div class="profile-card">
              <h2 class="card-title">
                <i class="fa-solid fa-trophy"></i>
                Grand Slam Bests
              </h2>
              <div class="gs-grid">
                <div class="gs-item aus">
                  <div class="gs-icon">
                    <i class="fa-solid fa-sun"></i>
                  </div>
                  <div class="gs-name">Australian Open</div>
                  <div class="gs-result" :class="getGsResultClass(profile.grandSlams.australianOpen)">
                    {{ formatGsResult(profile.grandSlams.australianOpen) }}
                  </div>
                </div>
                <div class="gs-item fra">
                  <div class="gs-icon">
                    <i class="fa-solid fa-tower-observation"></i>
                  </div>
                  <div class="gs-name">French Open</div>
                  <div class="gs-result" :class="getGsResultClass(profile.grandSlams.frenchOpen)">
                    {{ formatGsResult(profile.grandSlams.frenchOpen) }}
                  </div>
                </div>
                <div class="gs-item wim">
                  <div class="gs-icon">
                    <i class="fa-solid fa-crown"></i>
                  </div>
                  <div class="gs-name">Wimbledon</div>
                  <div class="gs-result" :class="getGsResultClass(profile.grandSlams.wimbledon)">
                    {{ formatGsResult(profile.grandSlams.wimbledon) }}
                  </div>
                </div>
                <div class="gs-item uso">
                  <div class="gs-icon">
                    <i class="fa-solid fa-flag-usa"></i>
                  </div>
                  <div class="gs-name">US Open</div>
                  <div class="gs-result" :class="getGsResultClass(profile.grandSlams.usOpen)">
                    {{ formatGsResult(profile.grandSlams.usOpen) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Skills -->
            <div class="profile-card">
              <h2 class="card-title">
                <i class="fa-solid fa-dumbbell"></i>
                Skills
              </h2>
              <div class="skills-list">
                <div class="skill-row">
                  <span class="skill-name">Serve</span>
                  <div class="skill-bar">
                    <div class="skill-fill" :style="{ width: profile.skills.serve + '%' }" :class="getSkillClass(profile.skills.serve)"></div>
                  </div>
                  <span class="skill-value" :class="getSkillClass(profile.skills.serve)">{{ profile.skills.serve }}</span>
                </div>
                <div class="skill-row">
                  <span class="skill-name">Forehand</span>
                  <div class="skill-bar">
                    <div class="skill-fill" :style="{ width: profile.skills.forehand + '%' }" :class="getSkillClass(profile.skills.forehand)"></div>
                  </div>
                  <span class="skill-value" :class="getSkillClass(profile.skills.forehand)">{{ profile.skills.forehand }}</span>
                </div>
                <div class="skill-row">
                  <span class="skill-name">Backhand</span>
                  <div class="skill-bar">
                    <div class="skill-fill" :style="{ width: profile.skills.backhand + '%' }" :class="getSkillClass(profile.skills.backhand)"></div>
                  </div>
                  <span class="skill-value" :class="getSkillClass(profile.skills.backhand)">{{ profile.skills.backhand }}</span>
                </div>
                <div class="skill-row">
                  <span class="skill-name">Volley</span>
                  <div class="skill-bar">
                    <div class="skill-fill" :style="{ width: profile.skills.volley + '%' }" :class="getSkillClass(profile.skills.volley)"></div>
                  </div>
                  <span class="skill-value" :class="getSkillClass(profile.skills.volley)">{{ profile.skills.volley }}</span>
                </div>
                <div class="skill-row">
                  <span class="skill-name">Movement</span>
                  <div class="skill-bar">
                    <div class="skill-fill" :style="{ width: profile.skills.movement + '%' }" :class="getSkillClass(profile.skills.movement)"></div>
                  </div>
                  <span class="skill-value" :class="getSkillClass(profile.skills.movement)">{{ profile.skills.movement }}</span>
                </div>
                <div class="skill-row">
                  <span class="skill-name">Mental</span>
                  <div class="skill-bar">
                    <div class="skill-fill" :style="{ width: profile.skills.mental + '%' }" :class="getSkillClass(profile.skills.mental)"></div>
                  </div>
                  <span class="skill-value" :class="getSkillClass(profile.skills.mental)">{{ profile.skills.mental }}</span>
                </div>
              </div>
              <div class="skill-extras">
                <div class="skill-extra">
                  <span class="extra-label">Consistency</span>
                  <span class="extra-value">{{ profile.consistency }}</span>
                </div>
                <div class="skill-extra">
                  <span class="extra-label">Form</span>
                  <span class="extra-value" :class="getFormClass(profile.form)">{{ profile.form }}</span>
                </div>
              </div>
            </div>

            <!-- Season Calendar -->
            <div class="profile-card full-width">
              <h2 class="card-title">
                <i class="fa-solid fa-calendar"></i>
                {{ seasonCalendar.seasonName || 'Season' }} Results
              </h2>
              <div v-if="seasonCalendar.calendar.length === 0" class="no-matches">
                No season calendar available
              </div>
              <div v-else class="season-calendar">
                <div
                  v-for="event in seasonCalendar.calendar"
                  :key="event.eventId"
                  class="calendar-event"
                  :class="[`surface-${event.surface}`, getEventStatusClass(event)]"
                >
                  <div class="event-badge" :class="event.tournamentType">
                    {{ getTournamentShort(event.tournamentType) }}
                  </div>
                  <div class="event-details">
                    <div class="event-name">{{ event.name }}</div>
                    <div class="event-meta">
                      <img :src="`/flags/${event.country}.png`" class="flag-xs" />
                      <span class="surface-tag" :class="event.surface">{{ formatSurface(event.surface) }}</span>
                    </div>
                    <div v-if="event.winner" class="event-winner">
                      <i class="fa-solid fa-trophy"></i>
                      <img :src="`/flags/${event.winner.country}.png`" class="flag-xs" />
                      <span>{{ event.winner.firstName }} {{ event.winner.lastName }}</span>
                    </div>
                  </div>
                  <div class="event-result">
                    <span v-if="event.status === 'upcoming'" class="result-badge upcoming">-</span>
                    <span v-else-if="event.result === 'active'" class="result-badge active">
                      <i class="fa-solid fa-play"></i>
                    </span>
                    <span v-else-if="event.result === 'W'" class="result-badge winner">W</span>
                    <span v-else-if="event.result === 'F'" class="result-badge finalist">F</span>
                    <span v-else-if="event.result" class="result-badge" :class="getResultClass(event.result)">
                      {{ event.result }}
                    </span>
                    <span v-else class="result-badge none">-</span>
                  </div>
                  <div class="event-points" v-if="event.pointsEarned > 0">
                    +{{ event.pointsEarned }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Matches -->
            <div class="profile-card full-width">
              <h2 class="card-title">
                <i class="fa-solid fa-clock-rotate-left"></i>
                Recent Matches
              </h2>
              <div v-if="profile.recentMatches.length === 0" class="no-matches">
                No matches played yet
              </div>
              <div v-else class="matches-list">
                <div
                  v-for="match in profile.recentMatches"
                  :key="match.id"
                  class="match-item"
                  :class="{ won: match.won, lost: !match.won }"
                >
                  <div class="match-result-badge" :class="{ won: match.won }">
                    {{ match.won ? 'W' : 'L' }}
                  </div>
                  <div class="match-info">
                    <div class="match-event">{{ match.event }}</div>
                    <div class="match-round">{{ match.round }}</div>
                  </div>
                  <div class="match-opponent">
                    <span class="vs">vs</span>
                    <img :src="`/flags/${match.opponent.country}.png`" class="flag-xs" />
                    <span class="opponent-name">{{ match.opponent.firstName }} {{ match.opponent.lastName }}</span>
                  </div>
                  <div class="match-score">{{ match.score }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getCountryName } from '../utils/flags'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const playerId = computed(() => route.params.playerId)
const profile = ref(null)
const seasonCalendar = ref({ calendar: [], seasonName: null })
const loading = ref(true)

function goBack() {
  router.push(`/tennis/world/${route.params.worldId}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function fetchProfile() {
  try {
    const response = await fetch(`/api/tennis/player/${playerId.value}/profile`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    if (data.profile) {
      profile.value = data.profile
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error)
  }
}

async function fetchSeasonCalendar() {
  try {
    const response = await fetch(`/api/tennis/player/${playerId.value}/season-calendar`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    seasonCalendar.value = {
      calendar: data.calendar || [],
      seasonName: data.seasonName || null
    }
  } catch (error) {
    console.error('Failed to fetch season calendar:', error)
  }
}

function formatSpecialty(specialty) {
  const labels = {
    'all-round': 'All-Round',
    hardcourt: 'Hard Court Specialist',
    clay: 'Clay Court Specialist',
    grass: 'Grass Court Specialist'
  }
  return labels[specialty] || specialty
}

function formatGsResult(result) {
  if (!result) return '-'
  const labels = {
    'W': 'Winner',
    'F': 'Finalist',
    'SF': 'Semifinal',
    'QF': 'Quarterfinal',
    'R16': 'Round of 16',
    'R32': 'Round of 32',
    'R64': 'Round of 64',
    'R128': 'Round of 128'
  }
  return labels[result] || result
}

function getGsResultClass(result) {
  if (!result) return ''
  if (result === 'W') return 'winner'
  if (result === 'F') return 'finalist'
  if (result === 'SF' || result === 'QF') return 'deep'
  return ''
}

function getRankClass(rank) {
  if (rank === 1) return 'gold'
  if (rank <= 3) return 'top3'
  if (rank <= 10) return 'top10'
  return ''
}

function getSkillClass(skill) {
  if (skill >= 85) return 'excellent'
  if (skill >= 75) return 'good'
  if (skill >= 65) return 'average'
  return 'below'
}

function getFormClass(form) {
  if (form >= 80) return 'hot'
  if (form >= 60) return 'normal'
  return 'cold'
}

function getTournamentShort(type) {
  const labels = {
    grand_slam: 'GS',
    masters_1000: 'M1000',
    atp_500: '500',
    atp_250: '250'
  }
  return labels[type] || type
}

function formatSurface(surface) {
  const labels = {
    hard: 'Hard',
    clay: 'Clay',
    grass: 'Grass'
  }
  return labels[surface] || surface
}

function getEventStatusClass(event) {
  if (event.status === 'upcoming') return 'event-upcoming'
  if (event.status === 'in_progress') return 'event-active'
  if (event.status === 'completed') return 'event-completed'
  return ''
}

function getResultClass(result) {
  if (result === 'SF' || result === 'QF') return 'deep'
  if (result === 'R16' || result === 'R32') return 'early'
  return 'first'
}

onMounted(async () => {
  try {
    await Promise.all([
      fetchProfile(),
      fetchSeasonCalendar()
    ])
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tennis-player {
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

.flag-sm {
  width: 1.25rem;
  height: 0.9rem;
  object-fit: cover;
  border-radius: 2px;
}

.flag-xl {
  width: 4rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 6px;
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

.player-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--gray-800);
}

.player-main {
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

/* Player Header Card */
.player-header-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
}

.player-avatar {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.player-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  font-size: 0.875rem;
}

.meta-item.specialty {
  background: rgba(0, 0, 0, 0.2);
}

.player-rank-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  padding: 1.25rem 2rem;
  text-align: center;
}

.rank-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.rank-value {
  font-size: 2.5rem;
  font-weight: 800;
}

.rank-value.gold {
  color: #fcd34d;
}

.rank-value.top3 {
  color: #fde68a;
}

.rank-value.top10 {
  color: #a7f3d0;
}

.rank-points {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Profile Grid */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.profile-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.profile-card.full-width {
  grid-column: 1 / -1;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1.25rem;
}

.card-title i {
  color: #10b981;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
}

.stat-value.highlight {
  color: #10b981;
}

.stat-value.gold {
  color: #f59e0b;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

/* Grand Slam Grid */
.gs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.gs-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--gray-50);
}

.gs-item.aus {
  background: #dbeafe;
}

.gs-item.fra {
  background: #ffedd5;
}

.gs-item.wim {
  background: #dcfce7;
}

.gs-item.uso {
  background: #ede9fe;
}

.gs-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
}

.gs-item.aus .gs-icon {
  color: #2563eb;
}

.gs-item.fra .gs-icon {
  color: #c2410c;
}

.gs-item.wim .gs-icon {
  color: #16a34a;
}

.gs-item.uso .gs-icon {
  color: #7c3aed;
}

.gs-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--gray-700);
}

.gs-result {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
}

.gs-result.winner {
  color: #f59e0b;
}

.gs-result.finalist {
  color: #6b7280;
}

.gs-result.deep {
  color: #10b981;
}

/* Skills */
.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skill-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.skill-name {
  width: 80px;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.skill-bar {
  flex: 1;
  height: 8px;
  background: var(--gray-100);
  border-radius: 4px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.skill-fill.excellent {
  background: linear-gradient(90deg, #10b981, #059669);
}

.skill-fill.good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.skill-fill.average {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.skill-fill.below {
  background: linear-gradient(90deg, #9ca3af, #6b7280);
}

.skill-value {
  width: 30px;
  text-align: right;
  font-size: 0.8rem;
  font-weight: 600;
}

.skill-value.excellent {
  color: #10b981;
}

.skill-value.good {
  color: #3b82f6;
}

.skill-value.average {
  color: #f59e0b;
}

.skill-value.below {
  color: #6b7280;
}

.skill-extras {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
}

.skill-extra {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.extra-label {
  font-size: 0.8rem;
  color: var(--gray-500);
}

.extra-value {
  font-weight: 600;
  color: var(--gray-700);
}

.extra-value.hot {
  color: #ef4444;
}

.extra-value.normal {
  color: var(--gray-600);
}

.extra-value.cold {
  color: #3b82f6;
}

/* Matches List */
.no-matches {
  text-align: center;
  padding: 2rem;
  color: var(--gray-400);
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  border-left: 3px solid var(--gray-300);
}

.match-item.won {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.match-item.lost {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.match-result-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  background: #fee2e2;
  color: #ef4444;
}

.match-result-badge.won {
  background: #dcfce7;
  color: #16a34a;
}

.match-info {
  min-width: 200px;
}

.match-event {
  font-weight: 500;
  color: var(--gray-800);
  font-size: 0.875rem;
}

.match-round {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.match-opponent {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.vs {
  color: var(--gray-400);
  font-size: 0.75rem;
}

.opponent-name {
  color: var(--gray-700);
}

.match-score {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--gray-700);
}

/* Season Calendar */
.season-calendar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.calendar-event {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  border-left: 3px solid var(--gray-300);
}

.calendar-event.surface-hard {
  border-left-color: #3b82f6;
}

.calendar-event.surface-clay {
  border-left-color: #f97316;
}

.calendar-event.surface-grass {
  border-left-color: #22c55e;
}

.calendar-event.event-upcoming {
  opacity: 0.6;
}

.calendar-event.event-active {
  background: #fef3c7;
}

.calendar-event.event-completed {
  background: #f0fdf4;
}

.event-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background: var(--gray-200);
  color: var(--gray-600);
}

.event-badge.grand_slam {
  background: #fef3c7;
  color: #b45309;
}

.event-badge.masters_1000 {
  background: #ede9fe;
  color: #7c3aed;
}

.event-badge.atp_500 {
  background: #dbeafe;
  color: #2563eb;
}

.event-badge.atp_250 {
  background: var(--gray-100);
  color: var(--gray-600);
}

.event-details {
  flex: 1;
  min-width: 0;
}

.event-name {
  font-weight: 500;
  color: var(--gray-800);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.event-winner {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: #b45309;
}

.event-winner i {
  font-size: 0.6rem;
  color: #f59e0b;
}

.surface-tag {
  font-size: 0.65rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
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

.event-result {
  display: flex;
  align-items: center;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--gray-100);
  color: var(--gray-500);
}

.result-badge.upcoming {
  background: var(--gray-100);
  color: var(--gray-400);
}

.result-badge.active {
  background: #fef3c7;
  color: #f59e0b;
}

.result-badge.winner {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  color: white;
}

.result-badge.finalist {
  background: linear-gradient(135deg, #e5e7eb, #9ca3af);
  color: white;
}

.result-badge.deep {
  background: #dcfce7;
  color: #16a34a;
}

.result-badge.early {
  background: #dbeafe;
  color: #2563eb;
}

.result-badge.first {
  background: var(--gray-100);
  color: var(--gray-600);
}

.result-badge.none {
  background: transparent;
  color: var(--gray-300);
}

.event-points {
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  min-width: 40px;
  text-align: right;
}

@media (max-width: 1024px) {
  .profile-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .player-header-card {
    flex-direction: column;
    text-align: center;
  }

  .player-meta {
    justify-content: center;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .gs-grid {
    grid-template-columns: 1fr;
  }

  .match-item {
    flex-wrap: wrap;
  }

  .match-info {
    min-width: auto;
    flex: 1;
  }

  .match-opponent {
    width: 100%;
    order: 3;
    padding-left: 38px;
  }
}
</style>
