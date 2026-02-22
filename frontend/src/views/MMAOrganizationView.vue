<template>
  <div class="mma-org-view">
    <header class="dashboard-header">
      <div class="container header-content">
        <div class="brand">
          <button @click="goBack" class="back-btn" title="Back to Dashboard">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <i class="fa-solid fa-hand-fist mma-icon"></i>
          <span>{{ org?.short_name || org?.name || 'MMA' }}</span>
        </div>
        <div class="user-menu">
          <span class="username">
            <i class="fa-solid fa-user-circle"></i>
            {{ user?.username }}
          </span>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="container">
        <div v-if="loading && !org" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading organization...
        </div>

        <template v-else-if="org">
          <!-- Organization Header -->
          <section class="org-header fade-in">
            <div class="org-info">
              <h1>{{ org.name }}</h1>
              <p v-if="org.description">{{ org.description }}</p>
            </div>
            <div class="org-stats-bar">
              <div class="stat-item">
                <i class="fa-solid fa-user"></i>
                <span>{{ fighters.length }} Fighters</span>
              </div>
              <div class="stat-item">
                <i class="fa-solid fa-calendar"></i>
                <span>{{ events.length }} Events</span>
              </div>
            </div>
          </section>

          <!-- Tabs -->
          <div class="tabs-container">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <i :class="tab.icon"></i>
              {{ tab.label }}
            </button>
          </div>

          <!-- Fighters Tab -->
          <section v-if="activeTab === 'fighters'" class="tab-content fade-in">
            <div class="section-header">
              <h2>Fighters</h2>
              <button @click="showAddFighterModal = true" class="btn btn-primary mma-btn">
                <i class="fa-solid fa-plus"></i>
                Add Fighter
              </button>
            </div>

            <div v-if="fighters.length === 0" class="empty-state">
              <i class="fa-solid fa-user-plus"></i>
              <p>No fighters yet. Add at least 20 fighters to generate events.</p>
            </div>

            <div v-else class="fighters-list">
              <div class="fighter-filters">
                <select v-model="fighterFilter.gender" class="input-field filter-select">
                  <option value="">All Genders</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
                <select v-model="fighterFilter.weightClass" class="input-field filter-select">
                  <option value="">All Weight Classes</option>
                  <option v-for="wc in availableWeightClasses" :key="wc.weight" :value="wc.weight">
                    {{ wc.name }} ({{ wc.weight }} kg)
                  </option>
                </select>
              </div>

              <table class="fighters-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Weight Class</th>
                    <th>Record</th>
                    <th>Country</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="fighter in paginatedFighters"
                    :key="fighter.id"
                    @click="viewFighter(fighter.id)"
                    class="fighter-row"
                  >
                    <td>
                      <span v-if="fighter.is_champion" class="champion-badge" title="Champion">
                        <i class="fa-solid fa-crown"></i>
                      </span>
                      <span v-else>{{ fighter.ranking }}</span>
                    </td>
                    <td class="fighter-name">
                      <span class="name">{{ fighter.first_name }} {{ fighter.last_name }}</span>
                      <span v-if="fighter.nickname" class="nickname">"{{ fighter.nickname }}"</span>
                    </td>
                    <td>
                      <span :class="['weight-badge', fighter.gender]">
                        {{ fighter.weight_class_name }}
                      </span>
                    </td>
                    <td class="record">
                      {{ fighter.wins }}-{{ fighter.losses }}-{{ fighter.draws }}
                    </td>
                    <td>
                      <img
                        :src="`/flags/${fighter.country_code}.png`"
                        :alt="fighter.country_code"
                        class="country-flag"
                        @error="handleFlagError"
                      />
                    </td>
                    <td>
                      <button
                        @click.stop="editFighter(fighter)"
                        class="btn btn-ghost btn-sm"
                        title="Edit"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        @click.stop="confirmDeleteFighter(fighter)"
                        class="btn btn-ghost btn-sm"
                        title="Delete"
                        :disabled="fighter.wins > 0 || fighter.losses > 0"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div v-if="totalPages > 1" class="pagination">
                <button
                  class="btn btn-sm btn-pagination"
                  :disabled="currentPage === 1"
                  @click="currentPage = 1"
                >
                  <i class="fa-solid fa-angles-left"></i>
                </button>
                <button
                  class="btn btn-sm btn-pagination"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  <i class="fa-solid fa-angle-left"></i>
                </button>
                <span class="page-info">
                  Page {{ currentPage }} of {{ totalPages }}
                  <span class="total-count">({{ filteredFighters.length }} fighters)</span>
                </span>
                <button
                  class="btn btn-sm btn-pagination"
                  :disabled="currentPage === totalPages"
                  @click="currentPage++"
                >
                  <i class="fa-solid fa-angle-right"></i>
                </button>
                <button
                  class="btn btn-sm btn-pagination"
                  :disabled="currentPage === totalPages"
                  @click="currentPage = totalPages"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </div>
          </section>

          <!-- Events Tab -->
          <section v-if="activeTab === 'events'" class="tab-content fade-in">
            <div class="section-header">
              <h2>Events</h2>
              <button
                @click="handleGenerateEvent"
                class="btn btn-primary mma-btn"
                :disabled="fighters.length < 20 || generatingEvent || hasScheduledEvent"
              >
                <i v-if="generatingEvent" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-plus"></i>
                {{ generatingEvent ? 'Generating...' : 'Generate Event' }}
              </button>
            </div>

            <div v-if="fighters.length < 20" class="info-banner">
              <i class="fa-solid fa-info-circle"></i>
              You need at least 20 fighters to generate events. Currently: {{ fighters.length }}
            </div>

            <div v-if="hasScheduledEvent" class="info-banner warning">
              <i class="fa-solid fa-exclamation-triangle"></i>
              Complete the current event before generating a new one.
            </div>

            <div v-if="events.length === 0" class="empty-state">
              <i class="fa-solid fa-calendar-plus"></i>
              <p>No events yet. Generate your first event once you have at least 20 fighters.</p>
            </div>

            <div v-else class="events-list">
              <div
                v-for="event in events"
                :key="event.id"
                class="event-card"
                :style="{ borderColor: event.theme_color }"
                @click="viewEvent(event.id)"
              >
                <div class="event-number" :style="{ background: event.theme_color }">
                  {{ event.event_number }}
                </div>
                <div class="event-info">
                  <h3>{{ event.name }}</h3>
                  <p v-if="event.theme_name" class="event-theme">
                    <i class="fa-solid fa-fire"></i>
                    {{ event.theme_name }}
                  </p>
                  <p class="event-location">
                    <i class="fa-solid fa-location-dot"></i>
                    {{ event.city }}, {{ event.country }}
                  </p>
                  <p class="event-venue">{{ event.venue }}</p>
                </div>
                <div class="event-status">
                  <span :class="['status-badge', event.status]">
                    {{ event.status === 'completed' ? 'Completed' : 'Scheduled' }}
                  </span>
                  <span class="fight-count">{{ event.fight_count }} fights</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Rankings Tab -->
          <section v-if="activeTab === 'rankings'" class="tab-content fade-in">
            <div class="section-header">
              <h2>Rankings</h2>
            </div>

            <div v-if="rankings.length === 0 && p4pRankings.length === 0" class="empty-state">
              <i class="fa-solid fa-trophy"></i>
              <p>No rankings available. Run some events to establish rankings.</p>
            </div>

            <!-- Rankings Sub-tabs -->
            <div v-if="rankings.length > 0 || p4pRankings.length > 0" class="rankings-subtabs">
              <button
                :class="['subtab-btn', { active: rankingsSubTab === 'divisions' }]"
                @click="rankingsSubTab = 'divisions'"
              >
                <i class="fa-solid fa-weight-scale"></i>
                Weight Classes
              </button>
              <button
                :class="['subtab-btn', { active: rankingsSubTab === 'p4p' }]"
                @click="rankingsSubTab = 'p4p'"
              >
                <i class="fa-solid fa-medal"></i>
                Pound-for-Pound
              </button>
            </div>

            <!-- P4P Rankings Section -->
            <div v-if="rankingsSubTab === 'p4p' && p4pRankings.length > 0" class="p4p-section">
              <div class="p4p-list">
                <div
                  v-for="fighter in p4pRankings"
                  :key="fighter.id"
                  :class="['p4p-row', { champion: fighter.is_champion }]"
                  @click="viewFighter(fighter.id)"
                >
                  <span class="p4p-rank">#{{ fighter.p4pRanking }}</span>
                  <img
                    :src="`/flags/${fighter.country_code}.png`"
                    :alt="fighter.country_code"
                    class="country-flag small"
                    @error="handleFlagError"
                  />
                  <span class="p4p-name">
                    {{ fighter.first_name }} {{ fighter.last_name }}
                    <i v-if="fighter.is_champion" class="fa-solid fa-medal champion-icon"></i>
                  </span>
                  <span class="p4p-division">{{ fighter.weight_class_name }}</span>
                  <span class="p4p-record">{{ fighter.wins }}-{{ fighter.losses }}</span>
                  <span v-if="fighter.win_streak > 0" class="streak-badge win">
                    <i class="fa-solid fa-fire"></i> {{ fighter.win_streak }}W
                  </span>
                  <span class="p4p-stats">
                    <span class="stat-badge">{{ fighter.winPct }}% Win</span>
                    <span class="stat-badge">{{ fighter.finishRate }}% Finish</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-if="rankingsSubTab === 'p4p' && p4pRankings.length === 0" class="empty-state">
              <i class="fa-solid fa-medal"></i>
              <p>No P4P rankings yet. Complete more events to generate rankings.</p>
            </div>

            <!-- Division Rankings -->
            <div v-if="rankingsSubTab === 'divisions' && rankings.length > 0" class="rankings-container">
              <div v-for="division in rankings" :key="`${division.gender}_${division.weight_class}`" class="division-card">
                <div class="division-header">
                  <span :class="['gender-badge', division.gender]">{{ division.gender === 'men' ? 'Men' : 'Women' }}</span>
                  <h3>{{ division.weight_class_name }}</h3>
                </div>
                <div class="division-rankings">
                  <div
                    v-for="fighter in division.fighters.slice(0, 15)"
                    :key="fighter.id"
                    :class="['ranking-row', { champion: fighter.is_champion }]"
                    @click="viewFighter(fighter.id)"
                  >
                    <span class="rank">
                      <i v-if="fighter.is_champion" class="fa-solid fa-medal"></i>
                      <span v-else>{{ fighter.ranking }}</span>
                    </span>
                    <img
                      :src="`/flags/${fighter.country_code}.png`"
                      :alt="fighter.country_code"
                      class="country-flag small"
                      @error="handleFlagError"
                    />
                    <span class="name">{{ fighter.first_name }} {{ fighter.last_name }}</span>
                    <span class="record">{{ fighter.wins }}-{{ fighter.losses }}</span>
                    <span v-if="fighter.win_streak > 0" class="streak-badge win small">
                      <i class="fa-solid fa-fire"></i> {{ fighter.win_streak }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </main>

    <!-- Add/Edit Fighter Modal -->
    <div v-if="showAddFighterModal || showEditFighterModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal fighter-modal fade-in">
        <div class="modal-header">
          <h2>{{ showEditFighterModal ? 'Edit Fighter' : 'Add Fighter' }}</h2>
          <button @click="closeModals" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form @submit.prevent="showEditFighterModal ? handleUpdateFighter() : handleAddFighter()">
          <div class="form-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input v-model="fighterForm.first_name" type="text" class="input-field" required />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input v-model="fighterForm.last_name" type="text" class="input-field" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Nickname</label>
              <input v-model="fighterForm.nickname" type="text" class="input-field" placeholder="Optional" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select v-model="fighterForm.gender" class="input-field" @change="onGenderChange">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Weight Class</label>
                <select v-model="fighterForm.weight_class" class="input-field" required>
                  <option v-for="wc in genderWeightClasses" :key="wc.weight" :value="wc.weight">
                    {{ wc.name }} ({{ wc.weight }} kg)
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Country</label>
              <div class="country-select-wrapper">
                <input
                  v-model="countrySearch"
                  type="text"
                  class="input-field"
                  placeholder="Search country..."
                  @focus="openCountryDropdown"
                  @input="filterCountries"
                />
                <div v-if="fighterForm.country_code && !showCountryDropdown" class="selected-country">
                  <img
                    :src="`/flags/${fighterForm.country_code}.png`"
                    class="flag-xs"
                    @error="handleFlagError"
                  />
                  {{ getCountryName(fighterForm.country_code) }} ({{ fighterForm.country_code }})
                </div>
                <div v-if="showCountryDropdown" class="country-dropdown">
                  <div
                    v-for="country in filteredCountries"
                    :key="country.code"
                    class="country-option"
                    @click="selectCountry(country)"
                  >
                    <span class="country-name">
                      <img
                        :src="`/flags/${country.code}.png`"
                        class="flag-xs"
                        @error="handleFlagError"
                      />
                      {{ country.name }}
                    </span>
                    <span class="country-code">{{ country.code }}</span>
                  </div>
                  <div v-if="filteredCountries.length === 0" class="no-results">
                    No countries found
                  </div>
                </div>
              </div>
            </div>
            <div class="skills-section">
              <div class="skills-header">
                <h3>Skills (1-100)</h3>
                <div class="randomize-buttons">
                  <button type="button" @click="randomizeSkills('strong')" class="btn btn-xs skill-btn-strong">
                    <i class="fa-solid fa-dice"></i> Strong
                  </button>
                  <button type="button" @click="randomizeSkills('average')" class="btn btn-xs skill-btn-average">
                    <i class="fa-solid fa-dice"></i> Average
                  </button>
                  <button type="button" @click="randomizeSkills('low')" class="btn btn-xs skill-btn-low">
                    <i class="fa-solid fa-dice"></i> Low
                  </button>
                  <button type="button" @click="randomizeSkills('random')" class="btn btn-xs skill-btn-random">
                    <i class="fa-solid fa-dice"></i> Random
                  </button>
                </div>
              </div>
              <div class="skills-grid">
                <div class="skill-input">
                  <label>Striking</label>
                  <input v-model.number="fighterForm.striking" type="number" min="1" max="100" class="input-field" />
                </div>
                <div class="skill-input">
                  <label>Grappling</label>
                  <input v-model.number="fighterForm.grappling" type="number" min="1" max="100" class="input-field" />
                </div>
                <div class="skill-input">
                  <label>Wrestling</label>
                  <input v-model.number="fighterForm.wrestling" type="number" min="1" max="100" class="input-field" />
                </div>
                <div class="skill-input">
                  <label>Cardio</label>
                  <input v-model.number="fighterForm.cardio" type="number" min="1" max="100" class="input-field" />
                </div>
                <div class="skill-input">
                  <label>Chin</label>
                  <input v-model.number="fighterForm.chin" type="number" min="1" max="100" class="input-field" />
                </div>
                <div class="skill-input">
                  <label>Power</label>
                  <input v-model.number="fighterForm.power" type="number" min="1" max="100" class="input-field" />
                </div>
              </div>
            </div>
            <div v-if="fighterError" class="error-message">
              <i class="fa-solid fa-circle-exclamation"></i>
              {{ fighterError }}
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary mma-btn" :disabled="savingFighter">
              <i v-if="savingFighter" class="fa-solid fa-spinner fa-spin"></i>
              {{ savingFighter ? 'Saving...' : (showEditFighterModal ? 'Update' : 'Add Fighter') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Fighter Modal -->
    <div v-if="showDeleteFighterModal" class="modal-overlay" @click.self="showDeleteFighterModal = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete Fighter</h2>
          <button @click="showDeleteFighterModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ fighterToDelete?.first_name }} {{ fighterToDelete?.last_name }}</strong>?</p>
        </div>
        <div class="modal-actions">
          <button type="button" @click="showDeleteFighterModal = false" class="btn btn-secondary">Cancel</button>
          <button type="button" @click="handleDeleteFighter" class="btn btn-danger" :disabled="deletingFighter">
            <i v-if="deletingFighter" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-trash"></i>
            {{ deletingFighter ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMMAStore } from '../stores/mma'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const mmaStore = useMMAStore()

const user = computed(() => authStore.user)
const org = computed(() => mmaStore.currentOrganization)
const fighters = computed(() => mmaStore.fighters)
const events = computed(() => mmaStore.events)
const rankings = computed(() => mmaStore.rankings)
const p4pRankings = computed(() => mmaStore.p4pRankings)
const loading = computed(() => mmaStore.loading)
const weightClasses = computed(() => mmaStore.weightClasses)

// Countries - static data accessed directly from store
const allCountries = mmaStore.countries || []

const activeTab = ref('fighters')
const rankingsSubTab = ref('divisions')
const tabs = [
  { id: 'fighters', label: 'Fighters', icon: 'fa-solid fa-user' },
  { id: 'events', label: 'Events', icon: 'fa-solid fa-calendar' },
  { id: 'rankings', label: 'Rankings', icon: 'fa-solid fa-trophy' }
]

const fighterFilter = ref({ gender: '', weightClass: '' })
const currentPage = ref(1)
const itemsPerPage = 15

// Country search
const countrySearch = ref('')
const showCountryDropdown = ref(false)
const filteredCountries = ref([])

const showAddFighterModal = ref(false)
const showEditFighterModal = ref(false)
const showDeleteFighterModal = ref(false)
const savingFighter = ref(false)
const deletingFighter = ref(false)
const generatingEvent = ref(false)
const fighterError = ref(null)
const fighterToDelete = ref(null)
const editingFighter = ref(null)

const fighterForm = ref({
  first_name: '',
  last_name: '',
  nickname: '',
  gender: 'men',
  weight_class: 70,
  country_code: '',
  striking: 70,
  grappling: 70,
  wrestling: 70,
  cardio: 70,
  chin: 70,
  power: 70
})

const availableWeightClasses = computed(() => {
  const gender = fighterFilter.value.gender || 'men'
  return weightClasses.value[gender] || []
})

const genderWeightClasses = computed(() => {
  return weightClasses.value[fighterForm.value.gender] || []
})

const filteredFighters = computed(() => {
  return fighters.value.filter(f => {
    if (fighterFilter.value.gender && f.gender !== fighterFilter.value.gender) return false
    if (fighterFilter.value.weightClass && f.weight_class !== parseInt(fighterFilter.value.weightClass)) return false
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredFighters.value.length / itemsPerPage))

const paginatedFighters = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredFighters.value.slice(start, end)
})

const hasScheduledEvent = computed(() => {
  return events.value.some(e => e.status === 'scheduled')
})

// Reset page when filters change
watch(fighterFilter, () => {
  currentPage.value = 1
}, { deep: true })

onMounted(async () => {
  const orgId = route.params.id
  await mmaStore.fetchWeightClasses()
  await Promise.all([
    mmaStore.fetchOrganization(orgId),
    mmaStore.fetchFighters(orgId),
    mmaStore.fetchEvents(orgId),
    mmaStore.fetchRankings(orgId)
  ])
})

function goBack() {
  router.push('/mma')
}

function viewFighter(id) {
  router.push(`/mma/org/${route.params.id}/fighter/${id}`)
}

function viewEvent(id) {
  router.push(`/mma/org/${route.params.id}/event/${id}`)
}

function onGenderChange() {
  const classes = genderWeightClasses.value
  if (classes.length && !classes.find(c => c.weight === fighterForm.value.weight_class)) {
    fighterForm.value.weight_class = classes[0].weight
  }
}

function closeModals() {
  showAddFighterModal.value = false
  showEditFighterModal.value = false
  fighterError.value = null
  editingFighter.value = null
  resetFighterForm()
}

function resetFighterForm() {
  fighterForm.value = {
    first_name: '',
    last_name: '',
    nickname: '',
    gender: 'men',
    weight_class: 70,
    country_code: '',
    striking: 70,
    grappling: 70,
    wrestling: 70,
    cardio: 70,
    chin: 70,
    power: 70
  }
  countrySearch.value = ''
  showCountryDropdown.value = false
  filteredCountries.value = []
}

function editFighter(fighter) {
  editingFighter.value = fighter
  fighterForm.value = {
    first_name: fighter.first_name,
    last_name: fighter.last_name,
    nickname: fighter.nickname || '',
    gender: fighter.gender,
    weight_class: fighter.weight_class,
    country_code: fighter.country_code,
    striking: fighter.striking,
    grappling: fighter.grappling,
    wrestling: fighter.wrestling,
    cardio: fighter.cardio,
    chin: fighter.chin,
    power: fighter.power
  }
  showEditFighterModal.value = true
}

async function handleAddFighter() {
  savingFighter.value = true
  fighterError.value = null
  try {
    await mmaStore.createFighter(route.params.id, fighterForm.value)
    closeModals()
  } catch (err) {
    fighterError.value = err.response?.data?.error || 'Failed to add fighter'
  } finally {
    savingFighter.value = false
  }
}

async function handleUpdateFighter() {
  if (!editingFighter.value) return
  savingFighter.value = true
  fighterError.value = null
  try {
    await mmaStore.updateFighter(editingFighter.value.id, fighterForm.value)
    await mmaStore.fetchFighters(route.params.id)
    closeModals()
  } catch (err) {
    fighterError.value = err.response?.data?.error || 'Failed to update fighter'
  } finally {
    savingFighter.value = false
  }
}

function confirmDeleteFighter(fighter) {
  fighterToDelete.value = fighter
  showDeleteFighterModal.value = true
}

async function handleDeleteFighter() {
  if (!fighterToDelete.value) return
  deletingFighter.value = true
  try {
    await mmaStore.deleteFighter(fighterToDelete.value.id)
    showDeleteFighterModal.value = false
    fighterToDelete.value = null
  } catch (err) {
    console.error('Failed to delete fighter:', err)
  } finally {
    deletingFighter.value = false
  }
}

async function handleGenerateEvent() {
  generatingEvent.value = true
  try {
    const result = await mmaStore.generateEvent(route.params.id)
    // Navigate to the new event
    if (result.event) {
      viewEvent(result.event.id)
    }
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to generate event')
  } finally {
    generatingEvent.value = false
  }
}

function handleFlagError(e) {
  e.target.style.display = 'none'
}

function filterCountries() {
  const search = countrySearch.value.toLowerCase()
  if (!search) {
    filteredCountries.value = [...allCountries]
  } else {
    filteredCountries.value = allCountries.filter(c =>
      c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
    )
  }
}

function openCountryDropdown() {
  filteredCountries.value = [...allCountries]
  showCountryDropdown.value = true
}

function selectCountry(country) {
  fighterForm.value.country_code = country.code
  countrySearch.value = ''
  showCountryDropdown.value = false
}

function getCountryName(code) {
  const country = allCountries.find(c => c.code === code)
  return country ? country.name : code
}

function randomizeSkills(level) {
  const randomInRange = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

  let min, max
  if (level === 'strong') {
    min = 80; max = 99
  } else if (level === 'average') {
    min = 60; max = 79
  } else if (level === 'low') {
    min = 40; max = 59
  } else {
    // random - completely random 40-99
    min = 40; max = 99
  }

  fighterForm.value.striking = randomInRange(min, max)
  fighterForm.value.grappling = randomInRange(min, max)
  fighterForm.value.wrestling = randomInRange(min, max)
  fighterForm.value.cardio = randomInRange(min, max)
  fighterForm.value.chin = randomInRange(min, max)
  fighterForm.value.power = randomInRange(min, max)
}
</script>

<style scoped>
.mma-org-view {
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

/* Main */
.dashboard-main {
  padding: 2rem 0;
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

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
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

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.mma-btn {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
}

.mma-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.mma-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.org-header {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  margin-bottom: 1.5rem;
}

.org-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.org-stats-bar {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.stat-item i {
  color: #dc2626;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  border-radius: 0.75rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  background: #dc2626;
  color: white;
}

.tab-content {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #dc2626;
}

.info-banner {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #60a5fa;
}

.info-banner.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

/* Fighters Table */
.fighter-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-select {
  max-width: 200px;
}

.fighters-table {
  width: 100%;
  border-collapse: collapse;
}

.fighters-table th,
.fighters-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fighters-table th {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.fighter-row {
  cursor: pointer;
  transition: background 0.2s;
}

.fighter-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.champion-badge {
  color: #fbbf24;
}

.fighter-name .name {
  font-weight: 500;
}

.fighter-name .nickname {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.weight-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
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

.record {
  font-family: monospace;
  font-weight: 600;
}

.country-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.country-flag.small {
  width: 20px;
  height: 14px;
}

/* Events List */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.75rem;
  border-left: 4px solid;
  cursor: pointer;
  transition: all 0.2s;
}

.event-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
}

.event-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
}

.event-theme {
  margin: 0 0 0.25rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.event-theme i {
  font-size: 0.7rem;
}

.event-info {
  flex: 1;
}

.event-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.event-location {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.event-venue {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.event-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.scheduled {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.fight-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Rankings Subtabs */
.rankings-subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.375rem;
  border-radius: 0.5rem;
}

.subtab-btn {
  flex: 1;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.subtab-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.subtab-btn.active {
  background: #dc2626;
  color: white;
}

/* Streak Badge */
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.streak-badge.win {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.streak-badge.win.small {
  padding: 0.15rem 0.375rem;
  font-size: 0.65rem;
}

.streak-badge i {
  font-size: 0.6rem;
}

/* P4P Rankings */
.p4p-section {
  background: rgba(251, 191, 36, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.p4p-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1rem;
  color: #fbbf24;
  font-size: 1.1rem;
}

.p4p-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.p4p-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.p4p-row:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.p4p-row.champion {
  background: rgba(251, 191, 36, 0.1);
  border-left: 3px solid #fbbf24;
}

.p4p-rank {
  font-weight: 700;
  font-size: 1rem;
  color: #fbbf24;
  min-width: 32px;
}

.p4p-name {
  flex: 1;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.champion-icon {
  color: #fbbf24;
  font-size: 0.8rem;
}

.p4p-division {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  min-width: 100px;
}

.p4p-record {
  font-family: monospace;
  font-weight: 600;
  min-width: 50px;
}

.p4p-stats {
  display: flex;
  gap: 0.5rem;
}

.stat-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Rankings */
.rankings-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.division-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.75rem;
  overflow: hidden;
}

.division-header {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gender-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.gender-badge.men {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.gender-badge.women {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.division-header h3 {
  margin: 0;
  font-size: 1rem;
}

.division-rankings {
  padding: 0.5rem;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.ranking-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.ranking-row.champion {
  background: rgba(251, 191, 36, 0.1);
}

.ranking-row .rank {
  width: 24px;
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.ranking-row.champion .rank {
  color: #fbbf24;
}

.ranking-row .name {
  flex: 1;
  font-size: 0.9rem;
}

.ranking-row .record {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Fighter Modal */
.fighter-modal {
  max-width: 560px;
}

.form-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Country Select */
.country-select-wrapper {
  position: relative;
}

.selected-country {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #22c55e;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.country-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  margin-top: 0.25rem;
}

.country-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.country-option:hover {
  background: rgba(220, 38, 38, 0.2);
}

.country-name {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.country-code {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.flag-xs {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

/* Skills Section */
.skills-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.skills-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skills-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.randomize-buttons {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  border-radius: 0.25rem;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-btn-strong {
  color: #22c55e;
  border-color: #22c55e;
}

.skill-btn-strong:hover {
  background: #22c55e;
  color: white;
}

.skill-btn-average {
  color: #3b82f6;
  border-color: #3b82f6;
}

.skill-btn-average:hover {
  background: #3b82f6;
  color: white;
}

.skill-btn-low {
  color: #94a3b8;
  border-color: #64748b;
}

.skill-btn-low:hover {
  background: #64748b;
  color: white;
}

.skill-btn-random {
  color: #f59e0b;
  border-color: #f59e0b;
}

.skill-btn-random:hover {
  background: #f59e0b;
  color: white;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.skill-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skill-input label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.skill-input input {
  padding: 0.5rem;
  text-align: center;
}

.btn-danger {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
}

.modal-body {
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
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
  color: #fff;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Form */
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

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(220, 38, 38, 0.1);
  color: #f87171;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-pagination {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 0.75rem;
}

.btn-pagination:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-pagination:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  padding: 0 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.page-info .total-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  margin-left: 0.5rem;
}
</style>
