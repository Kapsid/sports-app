<template>
  <div class="modules-page">
    <header class="modules-header">
      <div class="container header-content">
        <div class="brand">
          <i class="fa-solid fa-trophy"></i>
          <span>SportsHub</span>
        </div>
        <div class="user-menu">
          <span class="username">
            <i class="fa-solid fa-user-circle"></i>
            {{ user?.username }}
          </span>
          <button @click="showPasswordModal = true" class="btn btn-ghost" title="Change Password">
            <i class="fa-solid fa-key"></i>
          </button>
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="modules-main">
      <div class="container">
        <section class="welcome-section fade-in">
          <h1>Welcome back, {{ user?.username }}!</h1>
          <p>Choose your simulation module</p>
        </section>

        <section class="modules-grid fade-in">
          <div
            v-for="module in modules"
            :key="module.id"
            class="module-card"
            :class="{ disabled: !module.enabled }"
            @click="enterModule(module)"
          >
            <div class="module-icon" :style="{ background: module.gradient }">
              <i :class="module.icon"></i>
            </div>
            <h3>{{ module.name }}</h3>
            <p class="module-description">{{ module.description }}</p>
            <div v-if="!module.enabled" class="coming-soon-badge">
              <i class="fa-solid fa-clock"></i>
              Coming Soon
            </div>
            <div v-else class="module-action">
              <span>Enter</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Change Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Change Password</h2>
          <button @click="closePasswordModal" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label" for="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              class="input-field"
              placeholder="Enter current password"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="newPassword">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              class="input-field"
              placeholder="Enter new password (min 6 characters)"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="input-field"
              placeholder="Confirm new password"
              required
            />
          </div>
          <div v-if="passwordError" class="error-message">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ passwordError }}
          </div>
          <div v-if="passwordSuccess" class="success-message">
            <i class="fa-solid fa-circle-check"></i>
            {{ passwordSuccess }}
          </div>
          <div class="modal-actions">
            <button type="button" @click="closePasswordModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="changingPassword">
              <i v-if="changingPassword" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-key"></i>
              {{ changingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const modules = ref([
  {
    id: 'winter-sports',
    name: 'Winter Sports',
    description: 'Ski jumping, biathlon, alpine skiing, and more winter disciplines',
    icon: 'fa-solid fa-snowflake',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    enabled: true,
    route: '/winter-sports'
  },
  {
    id: 'summer-sports',
    name: 'Summer Sports',
    description: 'Swimming and aquatic events',
    icon: 'fa-solid fa-sun',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    enabled: true,
    route: '/summer-sports'
  },
  {
    id: 'handball',
    name: 'Handball',
    description: 'Czech Extraliga, league matches, playoffs, and relegation battles',
    icon: 'fa-solid fa-hand',
    gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
    enabled: true,
    route: '/handball'
  },
  {
    id: 'basketball',
    name: 'Basketball',
    description: 'NBA, EuroLeague, and international basketball competitions',
    icon: 'fa-solid fa-basketball',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
    enabled: false,
    route: '/basketball'
  },
  {
    id: 'golf',
    name: 'Golf',
    description: 'PGA Tour, majors, and professional golf tournaments',
    icon: 'fa-solid fa-golf-ball-tee',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    enabled: true,
    route: '/golf'
  },
  {
    id: 'tennis',
    name: 'Tennis',
    description: 'Grand Slams, ATP/WTA tours, and tennis championships',
    icon: 'fa-solid fa-baseball',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    enabled: true,
    route: '/tennis'
  },
  {
    id: 'formula1',
    name: 'Formula 1',
    description: 'F1 racing, team management, and championship seasons',
    icon: 'fa-solid fa-flag-checkered',
    gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
    enabled: false,
    route: '/formula1'
  },
  {
    id: 'mma',
    name: 'MMA',
    description: 'Create organizations, manage fighters, simulate events with realistic fight cards',
    icon: 'fa-solid fa-hand-fist',
    gradient: 'linear-gradient(135deg, #dc2626, #991b1b)',
    enabled: true,
    route: '/mma'
  },
  {
    id: 'ice-hockey',
    name: 'Ice Hockey',
    description: 'IIHF World Championship with real national teams and divisions',
    icon: 'fa-solid fa-hockey-puck',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    enabled: true,
    route: '/hockey'
  },
  {
    id: 'name-database',
    name: 'Name Database',
    description: 'Manage a personal database of athlete names reusable across all sports',
    icon: 'fa-solid fa-address-book',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    enabled: true,
    route: '/name-database'
  }
])

// Password change state
const showPasswordModal = ref(false)
const changingPassword = ref(false)
const passwordError = ref(null)
const passwordSuccess = ref(null)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function enterModule(module) {
  if (module.enabled) {
    router.push(module.route)
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function closePasswordModal() {
  showPasswordModal.value = false
  passwordError.value = null
  passwordSuccess.value = null
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

async function handleChangePassword() {
  passwordError.value = null
  passwordSuccess.value = null

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }

  changingPassword.value = true
  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    )
    passwordSuccess.value = 'Password changed successfully!'
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    setTimeout(() => {
      closePasswordModal()
    }, 2000)
  } catch (err) {
    passwordError.value = err.response?.data?.error || 'Failed to change password'
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.modules-page {
  min-height: 100vh;
}

.modules-header {
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

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-600);
}

.brand i {
  font-size: 1.75rem;
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

.modules-main {
  padding: 2rem 0;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h1 {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.welcome-section p {
  font-size: 1.125rem;
  color: var(--gray-500);
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.module-card {
  background: white;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.module-card:not(.disabled):hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
}

.module-card.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.module-card.disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.module-icon {
  width: 72px;
  height: 72px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.module-icon i {
  font-size: 2rem;
  color: white;
}

.module-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.module-description {
  color: var(--gray-500);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
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

.module-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-600);
  font-weight: 600;
  font-size: 1rem;
}

.module-action i {
  transition: transform 0.2s;
}

.module-card:not(.disabled):hover .module-action i {
  transform: translateX(4px);
}

/* Modal */
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
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 480px;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  color: var(--error);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .modules-grid {
    grid-template-columns: 1fr;
  }

  .welcome-section h1 {
    font-size: 1.75rem;
  }
}
</style>
