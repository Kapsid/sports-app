<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="container header-content">
        <div class="brand">
          <button @click="goToModules" class="back-btn" title="Back to Modules">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <i class="fa-solid fa-hockey-puck"></i>
          <span>Ice Hockey</span>
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
        <section class="welcome-section fade-in">
          <h1>IIHF World Championship</h1>
          <p>Simulate the Ice Hockey World Championship with real national teams and divisions</p>
        </section>

        <section class="worlds-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fa-solid fa-globe"></i>
              My Championships
            </h2>
            <button @click="showCreateModal = true" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i>
              New Championship
            </button>
          </div>

          <div v-if="loading" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading championships...
          </div>

          <div v-else-if="worlds.length === 0" class="empty-state fade-in">
            <div class="empty-icon">
              <i class="fa-solid fa-hockey-puck"></i>
            </div>
            <h2>No Championships Yet</h2>
            <p>Create your first Ice Hockey World Championship simulation to get started!</p>
            <button @click="showCreateModal = true" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i>
              Create Championship
            </button>
          </div>

          <div v-else class="worlds-grid">
            <div
              v-for="world in worlds"
              :key="world.id"
              class="world-card fade-in"
              @click="enterWorld(world.id)"
            >
              <div class="world-card-header">
                <div class="world-icon">
                  <i class="fa-solid fa-hockey-puck"></i>
                </div>
                <button
                  @click.stop="confirmDeleteWorld(world)"
                  class="btn btn-ghost btn-sm delete-btn"
                  title="Delete Championship"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
              <h3>{{ world.name }}</h3>
              <p class="world-description">{{ world.description || 'IIHF World Championship simulation' }}</p>
              <div class="world-stats">
                <div class="stat">
                  <i class="fa-solid fa-flag"></i>
                  <span>16 Nations</span>
                </div>
                <div class="stat">
                  <i class="fa-solid fa-trophy"></i>
                  <span>Top Division</span>
                </div>
              </div>
              <div class="world-action">
                <span>Enter Championship</span>
                <i class="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Create World Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>New Championship</h2>
          <button @click="showCreateModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form @submit.prevent="handleCreateWorld">
          <div class="form-group">
            <label class="form-label" for="worldName">Championship Name</label>
            <input
              id="worldName"
              v-model="newWorld.name"
              type="text"
              class="input-field"
              placeholder="e.g., My IIHF World Championship"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="worldDescription">Description (optional)</label>
            <textarea
              id="worldDescription"
              v-model="newWorld.description"
              class="input-field textarea"
              placeholder="Describe your championship..."
              rows="3"
            ></textarea>
          </div>
          <div v-if="createError" class="error-message">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ createError }}
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              <i v-if="creating" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-plus"></i>
              {{ creating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="worldToDelete" class="modal-overlay" @click.self="worldToDelete = null">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete Championship</h2>
          <button @click="worldToDelete = null" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p class="delete-warning">
          Are you sure you want to delete <strong>{{ worldToDelete.name }}</strong>?
          This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button type="button" @click="worldToDelete = null" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="handleDeleteWorld" class="btn btn-danger" :disabled="deleting">
            <i v-if="deleting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-trash"></i>
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHockeyStore } from '../stores/hockey'

const router = useRouter()
const authStore = useAuthStore()
const hockeyStore = useHockeyStore()

const user = computed(() => authStore.user)
const worlds = computed(() => hockeyStore.worlds)
const loading = ref(true)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref(null)
const newWorld = ref({ name: '', description: '' })

const worldToDelete = ref(null)
const deleting = ref(false)

function enterWorld(worldId) {
  router.push(`/hockey/world/${worldId}`)
}

function goToModules() {
  router.push('/modules')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function handleCreateWorld() {
  creating.value = true
  createError.value = null

  try {
    const world = await hockeyStore.createWorld(newWorld.value.name, newWorld.value.description)
    showCreateModal.value = false
    newWorld.value = { name: '', description: '' }
    router.push(`/hockey/world/${world.id}`)
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create championship'
  } finally {
    creating.value = false
  }
}

function confirmDeleteWorld(world) {
  worldToDelete.value = world
}

async function handleDeleteWorld() {
  if (!worldToDelete.value) return

  deleting.value = true
  try {
    await hockeyStore.deleteWorld(worldToDelete.value.id)
    worldToDelete.value = null
  } catch (err) {
    console.error('Failed to delete championship:', err)
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    await hockeyStore.fetchWorlds()
  } catch (error) {
    console.error('Failed to load championships:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
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

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0ea5e9;
}

.brand i {
  font-size: 1.75rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--gray-100);
  border-radius: 0.5rem;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
}

.back-btn i {
  font-size: 1rem;
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.section-title i {
  color: #0ea5e9;
}

.worlds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.world-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.world-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.world-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.world-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.world-icon i {
  font-size: 1.5rem;
  color: white;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.world-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--error);
}

.world-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.world-description {
  color: var(--gray-500);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.world-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--gray-100);
  border-bottom: 1px solid var(--gray-100);
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.stat i {
  color: #0ea5e9;
}

.world-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0ea5e9;
  font-weight: 500;
  font-size: 0.875rem;
}

.world-action i {
  transition: transform 0.2s;
}

.world-card:hover .world-action i {
  transform: translateX(4px);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-state i {
  font-size: 2rem;
  color: #0ea5e9;
  display: block;
  margin-bottom: 1rem;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-icon i {
  font-size: 2.5rem;
  color: #0ea5e9;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--gray-500);
  margin-bottom: 1.5rem;
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

.textarea {
  resize: vertical;
  min-height: 80px;
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

.delete-warning {
  color: var(--gray-600);
  line-height: 1.6;
}

.delete-warning strong {
  color: var(--gray-900);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.btn-sm {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .worlds-grid {
    grid-template-columns: 1fr;
  }
}
</style>
