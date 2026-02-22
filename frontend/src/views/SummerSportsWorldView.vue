<template>
  <div class="world-dashboard">
    <header class="dashboard-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-sun"></i>
            <span>Summer Sports</span>
          </div>
        </div>
        <div class="world-name" v-if="world">
          <i class="fa-solid fa-earth-americas"></i>
          {{ world.name }}
        </div>
        <div class="user-menu">
          <span class="username">
            <i class="fa-solid fa-user-circle"></i>
            {{ user?.username }}
          </span>
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading world...
        </div>

        <template v-else-if="world">
          <section class="world-header-section fade-in">
            <div class="world-info">
              <h1>{{ world.name }}</h1>
              <p v-if="world.description">{{ world.description }}</p>
            </div>
          </section>

          <section class="sports-section fade-in">
            <h2 class="section-title">
              <i class="fa-solid fa-medal"></i>
              Sports
            </h2>

            <div class="sports-grid">
              <div
                v-for="sport in sports"
                :key="sport.id"
                class="sport-card fade-in"
                :class="{ disabled: !sport.enabled }"
              >
                <div class="sport-icon" :style="{ background: sport.gradient }">
                  <i :class="sport.icon"></i>
                </div>
                <h3>{{ sport.name }}</h3>
                <p>{{ sport.description }}</p>
                <div v-if="!sport.enabled" class="coming-soon-badge">
                  <i class="fa-solid fa-clock"></i>
                  Coming Soon
                </div>
                <div v-else class="sport-action">
                  <span>Enter</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </div>
              </div>
            </div>
          </section>
        </template>

        <div v-else class="error-state">
          <i class="fa-solid fa-circle-exclamation"></i>
          <h2>World Not Found</h2>
          <p>The world you're looking for doesn't exist or you don't have access to it.</p>
          <button @click="goBack" class="btn btn-primary">
            <i class="fa-solid fa-arrow-left"></i>
            Back to Worlds
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSummerWorldsStore } from '../stores/summerWorlds'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const summerWorldsStore = useSummerWorldsStore()

const user = computed(() => authStore.user)
const world = computed(() => summerWorldsStore.currentWorld)
const loading = ref(true)

const sports = ref([
  {
    id: 'swimming',
    name: 'Swimming',
    description: 'Olympic swimming, world championships, and aquatic events',
    icon: 'fa-solid fa-person-swimming',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    enabled: false
  }
])

function goBack() {
  router.push('/summer-sports')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    await summerWorldsStore.fetchWorld(route.params.id)
  } catch (error) {
    console.error('Failed to load world:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.world-dashboard {
  min-height: 100vh;
}

.dashboard-header {
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #f59e0b;
}

.brand i {
  font-size: 1.75rem;
}

.world-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--gray-700);
  background: #fef3c7;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.world-name i {
  color: #f59e0b;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gray-700);
  font-weight: 500;
}

.dashboard-main {
  padding: 2rem 0;
}

.world-header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.world-info h1 {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.world-info p {
  font-size: 1.125rem;
  color: var(--gray-500);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1.5rem;
}

.section-title i {
  color: #f59e0b;
}

.sports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.sport-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.sport-card:not(.disabled) {
  cursor: pointer;
}

.sport-card:not(.disabled):hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.sport-card.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.sport-card.disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.sport-icon {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.sport-icon i {
  font-size: 1.75rem;
  color: white;
}

.sport-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.sport-card p {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: 1rem;
}

.coming-soon-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-100);
  color: var(--gray-500);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.sport-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f59e0b;
  font-weight: 500;
  font-size: 0.875rem;
}

.sport-action i {
  transition: transform 0.2s;
}

.sport-card:not(.disabled):hover .sport-action i {
  transform: translateX(4px);
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-500);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
  color: #f59e0b;
}

.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.error-state i {
  font-size: 3rem;
  color: var(--error);
  margin-bottom: 1rem;
}

.error-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.error-state p {
  color: var(--gray-500);
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .world-name {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .sports-grid {
    grid-template-columns: 1fr;
  }
}
</style>
