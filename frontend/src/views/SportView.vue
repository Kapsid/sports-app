<template>
  <div class="sport-page">
    <header class="page-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-snowflake"></i>
            <span>WinterSim</span>
          </div>
        </div>
        <div class="breadcrumb" v-if="world">
          <span class="world-name">
            <i class="fa-solid fa-earth-americas"></i>
            {{ world.name }}
          </span>
          <i class="fa-solid fa-chevron-right separator"></i>
          <span class="sport-name">{{ sportName }}</span>
        </div>
        <div class="user-menu">
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="sport-main">
      <div class="container">
        <div class="sport-hero fade-in">
          <div class="sport-icon" :style="{ background: getGradient(sportId) }">
            <i :class="getIcon(sportId)"></i>
          </div>
          <div class="sport-info">
            <h1>{{ sportName }}</h1>
            <p>{{ sportDescription }}</p>
          </div>
        </div>

        <div class="coming-soon-card fade-in">
          <div class="coming-soon-icon">
            <i class="fa-solid fa-hammer"></i>
          </div>
          <h2>Coming Soon</h2>
          <p>This sport simulation is currently under development.</p>
          <p class="subtext">Stay tuned for exciting features including:</p>
          <ul class="features-list">
            <li><i class="fa-solid fa-check"></i> Athlete management</li>
            <li><i class="fa-solid fa-check"></i> Competition simulation</li>
            <li><i class="fa-solid fa-check"></i> Season tracking</li>
            <li><i class="fa-solid fa-check"></i> Statistics & rankings</li>
          </ul>
          <button @click="goBack" class="btn btn-primary">
            <i class="fa-solid fa-arrow-left"></i>
            Back to World
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorldsStore } from '../stores/worlds'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const worldsStore = useWorldsStore()

const worldId = computed(() => route.params.worldId)
const sportId = computed(() => route.params.sportId)
const world = computed(() => worldsStore.currentWorld)

const sportData = {
  'ski-jumping': {
    name: 'Ski Jumping',
    description: 'Experience the thrill of flying through the air in world-class ski jumping competitions.',
    icon: 'fa-solid fa-person-ski-jumping',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
  },
  'biathlon': {
    name: 'Biathlon',
    description: 'Combine precision shooting with cross-country skiing in this demanding winter sport.',
    icon: 'fa-solid fa-bullseye',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)'
  },
  'cross-country': {
    name: 'Cross Country Skiing',
    description: 'Test your endurance in long-distance cross-country skiing races.',
    icon: 'fa-solid fa-person-skiing-nordic',
    gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
  },
  'bobsleigh': {
    name: 'Bobsleigh',
    description: 'Race down icy tracks at incredible speeds in bobsled competitions.',
    icon: 'fa-solid fa-shuttle-space fa-rotate-270',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)'
  },
  'skeleton': {
    name: 'Skeleton',
    description: 'Navigate the ice track head-first in this extreme sliding sport.',
    icon: 'fa-solid fa-person-arrow-down-to-line',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)'
  },
  'speed-skating': {
    name: 'Speed Skating',
    description: 'Compete for glory in fast-paced ice speed skating events.',
    icon: 'fa-solid fa-person-skating',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)'
  }
}

const sportName = computed(() => sportData[sportId.value]?.name || 'Unknown Sport')
const sportDescription = computed(() => sportData[sportId.value]?.description || '')

function getIcon(id) {
  return sportData[id]?.icon || 'fa-solid fa-medal'
}

function getGradient(id) {
  return sportData[id]?.gradient || 'linear-gradient(135deg, #60a5fa, #3b82f6)'
}

function goBack() {
  router.push(`/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  // Load world if not already loaded
  if (!world.value || world.value.id !== worldId.value) {
    try {
      await worldsStore.fetchWorld(worldId.value)
    } catch (error) {
      console.error('Failed to load world:', error)
    }
  }
})
</script>

<style scoped>
.sport-page {
  min-height: 100vh;
}

.page-header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  color: var(--primary-600);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.world-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gray-600);
}

.world-name i {
  color: var(--primary-500);
}

.separator {
  color: var(--gray-300);
  font-size: 0.75rem;
}

.sport-name {
  color: var(--gray-800);
  font-weight: 600;
}

.user-menu {
  display: flex;
  align-items: center;
}

.sport-main {
  padding: 2rem 0;
}

.sport-hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.sport-icon {
  width: 100px;
  height: 100px;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sport-icon i {
  font-size: 2.5rem;
  color: white;
}

.sport-info h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.sport-info p {
  color: var(--gray-600);
  font-size: 1.125rem;
}

.coming-soon-card {
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.coming-soon-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.coming-soon-icon i {
  font-size: 2rem;
  color: var(--primary-600);
}

.coming-soon-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.coming-soon-card p {
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.subtext {
  color: var(--gray-500);
  font-size: 0.875rem;
  margin-top: 1.5rem;
}

.features-list {
  list-style: none;
  display: inline-block;
  text-align: left;
  margin: 1rem 0 2rem;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: var(--gray-700);
}

.features-list i {
  color: var(--success);
}

@media (max-width: 768px) {
  .sport-hero {
    flex-direction: column;
    text-align: center;
  }

  .sport-icon {
    width: 80px;
    height: 80px;
  }

  .sport-icon i {
    font-size: 2rem;
  }

  .breadcrumb {
    display: none;
  }
}
</style>
