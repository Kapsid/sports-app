<template>
  <div class="mma-dashboard">
    <header class="dashboard-header">
      <div class="container header-content">
        <div class="brand">
          <button @click="goToModules" class="back-btn" title="Back to Modules">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <i class="fa-solid fa-hand-fist mma-icon"></i>
          <span>MMA</span>
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
          <h1>MMA Simulation</h1>
          <p>Create your own MMA organization, manage fighters, and simulate events</p>
        </section>

        <section class="orgs-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fa-solid fa-building"></i>
              My Organizations
            </h2>
            <button @click="showCreateModal = true" class="btn btn-primary mma-btn">
              <i class="fa-solid fa-plus"></i>
              Create Organization
            </button>
          </div>

          <div v-if="loading" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading organizations...
          </div>

          <div v-else-if="organizations.length === 0" class="empty-state fade-in">
            <div class="empty-icon">
              <i class="fa-solid fa-hand-fist"></i>
            </div>
            <h2>No Organizations Yet</h2>
            <p>Create your first MMA organization to start building your roster!</p>
            <button @click="showCreateModal = true" class="btn btn-primary mma-btn">
              <i class="fa-solid fa-plus"></i>
              Create Your First Organization
            </button>
          </div>

          <div v-else class="orgs-grid">
            <div
              v-for="org in organizations"
              :key="org.id"
              class="org-card fade-in"
              @click="enterOrg(org.id)"
            >
              <div class="org-card-header">
                <div class="org-icon mma-gradient">
                  <i class="fa-solid fa-hand-fist"></i>
                </div>
                <button
                  @click.stop="confirmDeleteOrg(org)"
                  class="btn btn-ghost btn-sm delete-btn"
                  title="Delete Organization"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
              <h3>{{ org.name }}</h3>
              <p class="org-short-name">{{ org.short_name }}</p>
              <p class="org-description">{{ org.description || 'No description' }}</p>
              <div class="org-stats">
                <div class="stat">
                  <i class="fa-solid fa-user"></i>
                  <span>{{ org.fighter_count || 0 }} fighters</span>
                </div>
                <div class="stat">
                  <i class="fa-solid fa-calendar"></i>
                  <span>{{ org.event_count || 0 }} events</span>
                </div>
              </div>
              <div class="org-action mma-action">
                <span>Enter Organization</span>
                <i class="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Create Organization Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Create MMA Organization</h2>
          <button @click="showCreateModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form @submit.prevent="handleCreateOrg">
          <div class="form-group">
            <label class="form-label" for="orgName">Organization Name</label>
            <input
              id="orgName"
              v-model="newOrg.name"
              type="text"
              class="input-field"
              placeholder="e.g., Thunder Fighting Championship"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="orgShortName">Short Name</label>
            <input
              id="orgShortName"
              v-model="newOrg.shortName"
              type="text"
              class="input-field"
              placeholder="e.g., TFC"
              maxlength="10"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="orgDescription">Description (optional)</label>
            <textarea
              id="orgDescription"
              v-model="newOrg.description"
              class="input-field textarea"
              placeholder="Describe your organization..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="newOrg.autoGenerateFighters"
              />
              <span class="checkmark"></span>
              Auto-generate roster with random fighters
            </label>
          </div>
          <div v-if="newOrg.autoGenerateFighters" class="form-group slider-group">
            <label class="form-label">
              Fighters per division: <strong>{{ newOrg.fightersPerDivision }}</strong>
            </label>
            <input
              type="range"
              v-model.number="newOrg.fightersPerDivision"
              min="4"
              max="20"
              step="1"
              class="slider"
            />
            <div class="slider-labels">
              <span>4</span>
              <span>20</span>
            </div>
            <p class="hint-text">
              ~{{ Math.round(newOrg.fightersPerDivision * 9 + newOrg.fightersPerDivision * 0.6 * 4) }} total fighters (9 men's + 4 women's divisions)
            </p>
          </div>
          <div v-if="createError" class="error-message">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ createError }}
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary mma-btn" :disabled="creating">
              <i v-if="creating" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-plus"></i>
              {{ creating ? (newOrg.autoGenerateFighters ? 'Generating roster...' : 'Creating...') : 'Create Organization' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete Organization</h2>
          <button @click="showDeleteModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ orgToDelete?.name }}</strong>?</p>
          <p class="warning-text">This will permanently delete all fighters and events in this organization.</p>
        </div>
        <div class="modal-actions">
          <button type="button" @click="showDeleteModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button type="button" @click="handleDeleteOrg" class="btn btn-danger" :disabled="deleting">
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
import { useMMAStore } from '../stores/mma'

const router = useRouter()
const authStore = useAuthStore()
const mmaStore = useMMAStore()

const user = computed(() => authStore.user)
const organizations = computed(() => mmaStore.organizations)
const loading = computed(() => mmaStore.loading)

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const creating = ref(false)
const deleting = ref(false)
const createError = ref(null)
const orgToDelete = ref(null)

const newOrg = ref({
  name: '',
  shortName: '',
  description: '',
  autoGenerateFighters: true,
  fightersPerDivision: 10
})

onMounted(async () => {
  await mmaStore.fetchOrganizations()
})

function goToModules() {
  router.push('/modules')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function enterOrg(id) {
  router.push(`/mma/org/${id}`)
}

async function handleCreateOrg() {
  creating.value = true
  createError.value = null
  let org = null
  try {
    org = await mmaStore.createOrganization(
      newOrg.value.name,
      newOrg.value.shortName,
      newOrg.value.description
    )
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create organization'
    creating.value = false
    return
  }

  // Auto-generate fighters if enabled
  const debugInfo = `autoGenerate: ${newOrg.value.autoGenerateFighters}, orgId: ${org?.id}, org: ${JSON.stringify(org)}`
  console.log('Generate fighters check:', debugInfo)
  alert(debugInfo)
  if (newOrg.value.autoGenerateFighters && org?.id) {
    try {
      console.log('Calling generateFighters...')
      await mmaStore.generateFighters(org.id, newOrg.value.fightersPerDivision)
      console.log('Fighters generated successfully')
    } catch (err) {
      console.error('Failed to generate fighters:', err)
      // Continue anyway - org was created, just fighters failed
    }
  }

  showCreateModal.value = false
  newOrg.value = { name: '', shortName: '', description: '', autoGenerateFighters: true, fightersPerDivision: 10 }

  // Refresh organizations to get updated fighter count
  await mmaStore.fetchOrganizations()
  creating.value = false
}

function confirmDeleteOrg(org) {
  orgToDelete.value = org
  showDeleteModal.value = true
}

async function handleDeleteOrg() {
  if (!orgToDelete.value) return
  deleting.value = true
  try {
    await mmaStore.deleteOrganization(orgToDelete.value.id)
    showDeleteModal.value = false
    orgToDelete.value = null
  } catch (err) {
    console.error('Failed to delete organization:', err)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.mma-dashboard {
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

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.btn-ghost {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Main Content */
.dashboard-main {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-section h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}

.welcome-section p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  margin: 0;
}

.section-title i {
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

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mma-btn {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.mma-btn:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
}

.loading-state i {
  font-size: 2rem;
  color: #dc2626;
  margin-bottom: 1rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(220, 38, 38, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-icon i {
  font-size: 2rem;
  color: #dc2626;
}

.empty-state h2 {
  margin: 0 0 0.5rem;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

/* Organizations Grid */
.orgs-section {
  margin-top: 2rem;
}

.orgs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.org-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.org-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(220, 38, 38, 0.5);
}

.org-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.org-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.mma-gradient {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

.org-card h3 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  color: #fff;
}

.org-short-name {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #dc2626;
  font-weight: 600;
}

.org-description {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.org-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.org-stats .stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.org-stats .stat i {
  color: #dc2626;
}

.org-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  margin-top: 1rem;
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.delete-btn:hover {
  color: #dc2626;
}

.org-card:hover .delete-btn {
  opacity: 1;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Forms */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
}

.input-field:focus {
  outline: none;
  border-color: #dc2626;
  background: rgba(255, 255, 255, 0.08);
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(220, 38, 38, 0.1);
  color: #f87171;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.warning-text {
  color: #fbbf24;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.btn-danger {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

/* Checkbox styles */
.checkbox-group {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #dc2626;
  cursor: pointer;
}

/* Slider styles */
.slider-group {
  margin-top: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  margin: 0.75rem 0 0.5rem;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #dc2626;
  cursor: pointer;
  transition: transform 0.1s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #dc2626;
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.hint-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.75rem 0 0;
  text-align: center;
}
</style>
