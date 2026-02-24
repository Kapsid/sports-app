<template>
  <div v-if="modelValue" class="name-picker-overlay" @click.self="close">
    <div class="name-picker-modal fade-in">
      <div class="modal-header">
        <h2>Pick from Name Database</h2>
        <button @click="close" class="btn btn-ghost">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="picker-filters">
        <div class="search-group">
          <i class="fa-solid fa-search"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search names..."
            class="input-field"
            @input="debouncedFetch"
            ref="searchInput"
          />
        </div>
        <div class="country-filter-group">
          <div class="country-select-wrapper">
            <input
              type="text"
              v-model="countrySearch"
              @focus="showCountryDropdown = true"
              @input="showCountryDropdown = true"
              @blur="hideCountryDropdown"
              :placeholder="country ? `${getCountryName(country)} (${country})` : 'Filter country...'"
              class="country-input"
              autocomplete="off"
            />
            <button v-if="country" type="button" class="country-clear-btn" @mousedown.prevent="clearCountry">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <div v-if="showCountryDropdown" class="country-dropdown" @mousedown.prevent>
              <div
                v-for="c in filteredCountryList"
                :key="c.code"
                class="country-item"
                :class="{ selected: country === c.code }"
                @click="selectCountry(c.code)"
              >
                {{ c.name }} ({{ c.code }})
              </div>
              <div v-if="filteredCountryList.length === 0" class="country-item no-results">
                No countries found
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="picker-loading">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading...
      </div>

      <div v-else-if="sportsmen.length === 0" class="picker-empty">
        <i class="fa-solid fa-address-book"></i>
        <p>No names found.</p>
        <router-link to="/name-database" class="btn btn-secondary btn-sm" @click="close">
          <i class="fa-solid fa-plus"></i> Go to Name Database
        </router-link>
      </div>

      <div v-else class="picker-list">
        <table class="picker-table">
          <thead>
            <tr>
              <th></th>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Country</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="person in sportsmen"
              :key="person.id"
              @click="selectPerson(person)"
              class="picker-row"
            >
              <td>
                <img v-if="person.country_code" :src="`/flags/${person.country_code}.png`" :alt="person.country_code" class="flag" />
              </td>
              <td><strong>{{ person.last_name || '—' }}</strong></td>
              <td>{{ person.first_name || '—' }}</td>
              <td class="country-cell">{{ person.country_code || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useSportsmenStore } from '../stores/sportsmen'
import { getCountryName, getAllCountries } from '../utils/flags'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const store = useSportsmenStore()
const search = ref('')
const country = ref('')
const searchInput = ref(null)
const countrySearch = ref('')
const showCountryDropdown = ref(false)

const sportsmen = computed(() => store.sportsmen)
const loading = computed(() => store.loading)
const sortedCountries = computed(() => getAllCountries())
const filteredCountryList = computed(() => {
  const s = countrySearch.value.toLowerCase().trim()
  if (!s) return sortedCountries.value.slice(0, 15)
  return sortedCountries.value.filter(c =>
    c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s)
  ).slice(0, 15)
})

function selectCountry(code) {
  country.value = code
  countrySearch.value = ''
  showCountryDropdown.value = false
  fetchData()
}
function clearCountry() {
  country.value = ''
  countrySearch.value = ''
  fetchData()
}
function hideCountryDropdown() {
  setTimeout(() => { showCountryDropdown.value = false }, 200)
}

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchData(), 300)
}

function fetchData() {
  store.fetchSportsmen(search.value, country.value)
}

function selectPerson(person) {
  emit('select', {
    first_name: person.first_name || '',
    last_name: person.last_name || '',
    country_code: person.country_code || ''
  })
  close()
}

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  if (val) {
    search.value = ''
    country.value = ''
    fetchData()
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>

<style scoped>
.name-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.name-picker-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.picker-filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-group {
  position: relative;
  flex: 1;
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

/* Country search dropdown */
.country-filter-group { position: relative; min-width: 180px; }
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

.picker-loading {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500, #6b7280);
}

.picker-empty {
  text-align: center;
  padding: 2rem;
}

.picker-empty i {
  font-size: 2rem;
  color: var(--gray-300, #d1d5db);
  margin-bottom: 0.5rem;
}

.picker-empty p {
  color: var(--gray-500, #6b7280);
  margin-bottom: 1rem;
}

.picker-list {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.picker-table {
  width: 100%;
  border-collapse: collapse;
}

.picker-table th {
  background: var(--gray-50, #f9fafb);
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-500, #6b7280);
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
  position: sticky;
  top: 0;
}

.picker-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
  font-size: 0.9rem;
}

.picker-row {
  cursor: pointer;
  transition: background 0.15s;
}

.picker-row:hover {
  background: var(--primary-50, #eff6ff);
}

.flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 2px rgba(0,0,0,0.15);
}

.country-cell {
  color: var(--gray-500, #6b7280);
  font-size: 0.825rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
