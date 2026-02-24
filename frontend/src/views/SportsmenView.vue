<template>
  <div class="sportsmen-page">
    <header class="page-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="$router.push('/modules')" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="header-title">
            <i class="fa-solid fa-address-book"></i>
            <h1>Name Database</h1>
          </div>
        </div>
        <div class="header-actions">
          <button @click="showBulkModal = true" class="btn btn-secondary">
            <i class="fa-solid fa-list"></i>
            Add Multiple
          </button>
          <button @click="openAddModal" class="btn btn-primary">
            <i class="fa-solid fa-plus"></i>
            Add Name
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div class="container">
        <!-- Filters -->
        <div class="filters-bar">
          <div class="search-group">
            <i class="fa-solid fa-search"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search names..."
              class="input-field"
              @input="debouncedFetch"
            />
          </div>
          <div class="filter-group country-select-group">
            <div class="country-select-wrapper">
              <input
                type="text"
                v-model="filterCountrySearch"
                @focus="showFilterCountryDropdown = true"
                @input="showFilterCountryDropdown = true"
                @blur="hideFilterCountryDropdown"
                :placeholder="countryFilter ? `${getCountryName(countryFilter)} (${countryFilter})` : 'Filter by country...'"
                class="country-input"
                autocomplete="off"
              />
              <button v-if="countryFilter" type="button" class="country-clear-btn" @mousedown.prevent="clearCountryFilter">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div v-if="showFilterCountryDropdown" class="country-dropdown" @mousedown.prevent>
                <div
                  v-for="c in filteredFilterCountries"
                  :key="c.code"
                  class="country-item"
                  :class="{ selected: countryFilter === c.code }"
                  @click="selectFilterCountry(c.code)"
                >
                  {{ c.name }} ({{ c.code }})
                </div>
                <div v-if="filteredFilterCountries.length === 0" class="country-item no-results">
                  No countries found
                </div>
              </div>
            </div>
          </div>
          <div class="results-count" v-if="sportsmen.length > 0">
            {{ sportsmen.length }} name{{ sportsmen.length !== 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Pagination top -->
        <div v-if="totalPages > 1" class="pagination">
          <button @click="currentPage = 1" class="btn btn-ghost btn-sm" :disabled="currentPage === 1">
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button @click="currentPage--" class="btn btn-ghost btn-sm" :disabled="currentPage === 1">
            <i class="fa-solid fa-angle-left"></i>
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="currentPage++" class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages">
            <i class="fa-solid fa-angle-right"></i>
          </button>
          <button @click="currentPage = totalPages" class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages">
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>

        <!-- Table -->
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading...
        </div>

        <div v-else-if="sportsmen.length === 0" class="empty-state">
          <i class="fa-solid fa-address-book"></i>
          <h3>No names yet</h3>
          <p>Add athlete names to your personal database. You can then quickly pick them when creating athletes in any sport.</p>
          <div class="empty-actions">
            <button @click="openAddModal" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i>
              Add First Name
            </button>
            <button @click="showBulkModal = true" class="btn btn-secondary">
              <i class="fa-solid fa-list"></i>
              Add Multiple
            </button>
          </div>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-flag"></th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Country</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="person in paginatedSportsmen" :key="person.id">
                <td class="col-flag">
                  <img v-if="person.country_code" :src="`/flags/${person.country_code}.png`" :alt="person.country_code" class="flag" />
                </td>
                <td class="name-cell"><strong>{{ person.last_name || '—' }}</strong></td>
                <td class="name-cell">{{ person.first_name || '—' }}</td>
                <td>{{ person.country_code ? `${getCountryName(person.country_code)} (${person.country_code})` : '—' }}</td>
                <td class="col-actions">
                  <button @click="openEditModal(person)" class="btn btn-ghost btn-sm" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button @click="confirmDelete(person)" class="btn btn-ghost btn-sm btn-danger" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination bottom -->
        <div v-if="totalPages > 1" class="pagination">
          <button @click="currentPage = 1" class="btn btn-ghost btn-sm" :disabled="currentPage === 1">
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button @click="currentPage--" class="btn btn-ghost btn-sm" :disabled="currentPage === 1">
            <i class="fa-solid fa-angle-left"></i>
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="currentPage++" class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages">
            <i class="fa-solid fa-angle-right"></i>
          </button>
          <button @click="currentPage = totalPages" class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages">
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>{{ editingPerson ? 'Edit Name' : 'Add Name' }}</h2>
          <button @click="closeFormModal" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input v-model="formData.first_name" type="text" class="input-field" placeholder="First name" />
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input v-model="formData.last_name" type="text" class="input-field" placeholder="Last name" />
          </div>
          <div class="form-group country-select-group">
            <label class="form-label">Country</label>
            <div class="country-select-wrapper">
              <input
                type="text"
                v-model="formCountrySearch"
                @focus="showFormCountryDropdown = true"
                @input="showFormCountryDropdown = true"
                @blur="hideFormCountryDropdown"
                :placeholder="formData.country_code ? `${getCountryName(formData.country_code)} (${formData.country_code})` : 'Type to search...'"
                class="country-input"
                autocomplete="off"
              />
              <div v-if="showFormCountryDropdown" class="country-dropdown" @mousedown.prevent>
                <div
                  v-for="c in filteredFormCountries"
                  :key="c.code"
                  class="country-item"
                  :class="{ selected: formData.country_code === c.code }"
                  @click="selectFormCountry(c.code)"
                >
                  {{ c.name }} ({{ c.code }})
                </div>
                <div v-if="filteredFormCountries.length === 0" class="country-item no-results">
                  No countries found
                </div>
              </div>
            </div>
          </div>
          <div v-if="formError" class="error-message">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ formError }}
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeFormModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving || (!formData.first_name && !formData.last_name)">
              <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
              {{ editingPerson ? 'Save' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk Add Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click.self="closeBulkModal">
      <div class="modal modal-lg fade-in">
        <div class="modal-header">
          <h2>Add Multiple Names</h2>
          <button @click="closeBulkModal" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="bulk-info">
          <p>Paste one name per line. Format: <code>FirstName LastName CountryCode</code></p>
          <p class="hint">Country code is optional. Example: <code>Jan Novak CZE</code></p>
        </div>
        <form @submit.prevent="handleBulkAdd">
          <div class="form-group">
            <textarea
              v-model="bulkText"
              class="input-field bulk-textarea"
              rows="10"
              placeholder="Jan Novak CZE&#10;Peter Müller AUT&#10;Matti Virtanen FIN"
            ></textarea>
          </div>
          <div v-if="bulkPreview.length > 0" class="bulk-preview">
            <strong>Preview: {{ bulkPreview.length }} name{{ bulkPreview.length !== 1 ? 's' : '' }}</strong>
          </div>
          <div v-if="bulkError" class="error-message">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ bulkError }}
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeBulkModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="bulkSaving || bulkPreview.length === 0">
              <i v-if="bulkSaving" class="fa-solid fa-spinner fa-spin"></i>
              Add {{ bulkPreview.length }} Name{{ bulkPreview.length !== 1 ? 's' : '' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete Name</h2>
          <button @click="showDeleteModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p>Are you sure you want to delete <strong>{{ deletingPerson?.first_name }} {{ deletingPerson?.last_name }}</strong>?</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleDelete" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSportsmenStore } from '../stores/sportsmen'
import { getCountryName, getAllCountries } from '../utils/flags'

const store = useSportsmenStore()

const searchQuery = ref('')
const countryFilter = ref('')
const showFormModal = ref(false)
const showBulkModal = ref(false)
const showDeleteModal = ref(false)
const editingPerson = ref(null)
const deletingPerson = ref(null)
const bulkText = ref('')
const formData = ref({ first_name: '', last_name: '', country_code: '' })
const formError = ref(null)
const bulkError = ref(null)
const saving = ref(false)
const bulkSaving = ref(false)

const sportsmen = computed(() => store.sportsmen)
const loading = computed(() => store.loading)
const sortedCountries = computed(() => getAllCountries())

// Pagination
const PAGE_SIZE = 15
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(sportsmen.value.length / PAGE_SIZE)))
const paginatedSportsmen = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sportsmen.value.slice(start, start + PAGE_SIZE)
})
watch(sportsmen, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

// --- Country search for filter bar ---
const filterCountrySearch = ref('')
const showFilterCountryDropdown = ref(false)
const filteredFilterCountries = computed(() => {
  const search = filterCountrySearch.value.toLowerCase().trim()
  if (!search) return sortedCountries.value.slice(0, 15)
  return sortedCountries.value.filter(c =>
    c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
  ).slice(0, 15)
})
function selectFilterCountry(code) {
  countryFilter.value = code
  filterCountrySearch.value = ''
  showFilterCountryDropdown.value = false
  fetchData()
}
function clearCountryFilter() {
  countryFilter.value = ''
  filterCountrySearch.value = ''
  fetchData()
}
function hideFilterCountryDropdown() {
  setTimeout(() => { showFilterCountryDropdown.value = false }, 200)
}

// --- Country search for form modal ---
const formCountrySearch = ref('')
const showFormCountryDropdown = ref(false)
const filteredFormCountries = computed(() => {
  const search = formCountrySearch.value.toLowerCase().trim()
  if (!search) return sortedCountries.value.slice(0, 15)
  return sortedCountries.value.filter(c =>
    c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
  ).slice(0, 15)
})
function selectFormCountry(code) {
  formData.value.country_code = code
  formCountrySearch.value = ''
  showFormCountryDropdown.value = false
}
function hideFormCountryDropdown() {
  setTimeout(() => { showFormCountryDropdown.value = false }, 200)
}

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchData(), 300)
}

function fetchData() {
  currentPage.value = 1
  store.fetchSportsmen(searchQuery.value, countryFilter.value)
}

function openAddModal() {
  editingPerson.value = null
  formData.value = { first_name: '', last_name: '', country_code: '' }
  formCountrySearch.value = ''
  formError.value = null
  showFormModal.value = true
}

function openEditModal(person) {
  editingPerson.value = person
  formData.value = {
    first_name: person.first_name || '',
    last_name: person.last_name || '',
    country_code: person.country_code || ''
  }
  formCountrySearch.value = ''
  formError.value = null
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingPerson.value = null
  formError.value = null
}

function closeBulkModal() {
  showBulkModal.value = false
  bulkText.value = ''
  bulkError.value = null
}

const bulkPreview = computed(() => {
  if (!bulkText.value.trim()) return []
  return bulkText.value.trim().split('\n').filter(line => line.trim()).map(line => {
    const parts = line.trim().split(/\s+/)
    if (parts.length >= 3) {
      const code = parts[parts.length - 1].toUpperCase()
      if (code.length === 3) {
        return { first_name: parts[0], last_name: parts.slice(1, -1).join(' '), country_code: code }
      }
    }
    if (parts.length === 2) {
      return { first_name: parts[0], last_name: parts[1], country_code: '' }
    }
    if (parts.length === 1) {
      return { first_name: '', last_name: parts[0], country_code: '' }
    }
    return { first_name: parts[0], last_name: parts.slice(1).join(' '), country_code: '' }
  })
})

async function handleSave() {
  formError.value = null
  saving.value = true
  try {
    if (editingPerson.value) {
      await store.updateSportsman(editingPerson.value.id, formData.value)
    } else {
      await store.createSportsman(formData.value)
    }
    closeFormModal()
    fetchData()
  } catch (e) {
    formError.value = e.response?.data?.error || e.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function handleBulkAdd() {
  if (bulkPreview.value.length === 0) return
  bulkError.value = null
  bulkSaving.value = true
  try {
    await store.bulkCreateSportsmen(bulkPreview.value)
    closeBulkModal()
    fetchData()
  } catch (e) {
    bulkError.value = e.response?.data?.error || e.message || 'Failed to add names'
  } finally {
    bulkSaving.value = false
  }
}

function confirmDelete(person) {
  deletingPerson.value = person
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deletingPerson.value) return
  try {
    await store.deleteSportsman(deletingPerson.value.id)
    showDeleteModal.value = false
    deletingPerson.value = null
  } catch (e) {
    // keep modal open
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.sportsmen-page {
  min-height: 100vh;
  background: var(--gray-50, #f9fafb);
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
  font-size: 1.25rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title i {
  font-size: 1.5rem;
  color: #7c3aed;
}

.header-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900, #111827);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.page-main {
  padding: 1.5rem 0;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-group {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-group i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400, #9ca3af);
}

.search-group input {
  padding-left: 2.25rem;
}

.results-count {
  color: var(--gray-500, #6b7280);
  font-size: 0.875rem;
  white-space: nowrap;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray-500, #6b7280);
  font-size: 1.125rem;
}

.loading-state i {
  margin-right: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  color: var(--gray-300, #d1d5db);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--gray-700, #374151);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--gray-500, #6b7280);
  max-width: 400px;
  margin: 0 auto 1.5rem;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.table-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: var(--gray-50, #f9fafb);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-500, #6b7280);
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
  font-size: 0.95rem;
}

.data-table tbody tr:hover {
  background: var(--gray-50, #f9fafb);
}

.col-flag {
  width: 40px;
}

.col-actions {
  width: 100px;
  text-align: right;
}

.flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 2px rgba(0,0,0,0.15);
}

.name-cell {
  white-space: nowrap;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-danger {
  color: #dc2626;
}

.btn-danger:hover {
  background: #fef2f2;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
}

.page-info {
  font-size: 0.875rem;
  color: var(--gray-600, #4b5563);
  padding: 0 0.5rem;
}

/* Country search dropdown */
.country-select-group { position: relative; }
.country-select-wrapper { position: relative; overflow: visible; }
.country-input { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid var(--gray-300, #d1d5db); border-radius: 0.375rem; font-size: 0.875rem; background: white; }
.country-input:focus { outline: none; border-color: var(--primary-500, #3b82f6); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.country-clear-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--gray-400, #9ca3af); cursor: pointer; padding: 0.25rem; font-size: 0.75rem; }
.country-clear-btn:hover { color: var(--gray-600, #4b5563); }
.country-dropdown { position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; margin-top: 4px; }
.country-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.875rem; transition: background-color 0.15s; }
.country-item:hover { background: var(--primary-100, #dbeafe); }
.country-item.selected { background: var(--primary-50, #eff6ff); font-weight: 500; }
.country-item.no-results { color: var(--gray-500, #6b7280); font-style: italic; cursor: default; }
.country-item.no-results:hover { background: transparent; }
.filter-group .country-input { min-width: 200px; }

/* Error message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Modals */
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

.modal-lg {
  max-width: 600px;
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
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.bulk-info {
  margin-bottom: 1rem;
}

.bulk-info p {
  color: var(--gray-600, #4b5563);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.bulk-info .hint {
  color: var(--gray-400, #9ca3af);
  font-size: 0.825rem;
}

.bulk-info code {
  background: var(--gray-100, #f3f4f6);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.825rem;
}

.bulk-textarea {
  font-family: monospace;
  resize: vertical;
}

.bulk-preview {
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--gray-600, #4b5563);
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filters-bar {
    flex-direction: column;
  }

  .search-group, .filter-group .country-input {
    width: 100%;
    min-width: 0;
  }
}
</style>
