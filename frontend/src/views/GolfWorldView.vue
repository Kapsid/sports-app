<template>
  <div class="golf-world">
    <header class="page-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-golf-ball-tee"></i>
            <span>Golf</span>
          </div>
        </div>
        <div class="breadcrumb" v-if="world">
          <span class="world-name">
            <i class="fa-solid fa-earth-americas"></i>
            {{ world.name }}
          </span>
        </div>
        <div class="user-menu">
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="world-main">
      <div class="container">
        <!-- Loading state -->
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Loading world data...</span>
        </div>

        <template v-else>
          <!-- Tab Navigation -->
          <div class="tabs-container fade-in">
            <div class="tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="tab-btn"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                <i :class="tab.icon"></i>
                {{ tab.name }}
              </button>
            </div>
          </div>

          <!-- Calendar Tab -->
          <div v-if="activeTab === 'calendar'" class="tab-content fade-in">
            <div class="section-header">
              <h2>
                <i class="fa-solid fa-calendar"></i>
                Tournament Calendar
              </h2>
              <div class="header-actions">
                <button
                  v-if="!currentSeason"
                  @click="handleCreateSeason"
                  class="btn btn-primary golf-btn"
                  :disabled="creatingOrResetting"
                >
                  <i v-if="creatingOrResetting" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-plus"></i>
                  Create {{ new Date().getFullYear() }} Season
                </button>
                <button
                  v-else
                  @click="showResetConfirm = true"
                  class="btn btn-secondary"
                  :disabled="creatingOrResetting"
                >
                  <i class="fa-solid fa-rotate"></i>
                  Reset Season
                </button>
              </div>
            </div>

            <div v-if="!currentSeason" class="empty-state">
              <div class="empty-icon">
                <i class="fa-solid fa-calendar-plus"></i>
              </div>
              <h3>No Season Created</h3>
              <p>Create a season to generate the tournament calendar with Majors and PGA Tour events.</p>
            </div>

            <div v-else class="calendar-grid">
              <div
                v-for="event in events"
                :key="event.id"
                class="tournament-card clickable"
                :class="[getTournamentTypeClass(event.tournament_type), getStatusClass(event.status)]"
                @click="goToEvent(event)"
              >
                <div class="tournament-header">
                  <span class="tournament-badge" :style="getBadgeStyle(event.tournament_type)">
                    {{ getTournamentLabel(event.tournament_type) }}
                  </span>
                  <span class="tournament-status" :class="event.status">
                    {{ formatStatus(event.status) }}
                  </span>
                </div>
                <h3 class="tournament-name">{{ event.name }}</h3>
                <div class="tournament-details">
                  <div class="detail">
                    <img :src="`/flags/${event.country}.png`" class="event-flag" />
                    <span>{{ event.location }}</span>
                  </div>
                  <div class="detail">
                    <i class="fa-solid fa-calendar"></i>
                    <span>{{ formatDate(event.date) }}</span>
                  </div>
                  <div v-if="event.course_name" class="detail">
                    <i class="fa-solid fa-flag"></i>
                    <span>{{ event.course_name }}</span>
                  </div>
                  <div v-if="event.course_par" class="detail">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>Par {{ event.course_par }}</span>
                  </div>
                </div>
                <div v-if="event.winner" class="tournament-winner">
                  <i class="fa-solid fa-crown"></i>
                  <img :src="`/flags/${event.winner.country}.png`" class="event-flag" />
                  <span>{{ event.winner.firstName }} {{ event.winner.lastName }}</span>
                </div>
                <div class="tournament-action">
                  <span class="action-text">View Tournament</span>
                  <i class="fa-solid fa-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Standings Tab -->
          <div v-if="activeTab === 'standings'" class="tab-content fade-in">
            <div class="section-header">
              <h2>
                <i class="fa-solid fa-ranking-star"></i>
                FedExCup Rankings
              </h2>
            </div>

            <div v-if="standings.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <h3>No Rankings Yet</h3>
              <p>Generate golfers and simulate tournaments to see FedExCup rankings.</p>
            </div>

            <div v-else class="standings-table">
              <table>
                <thead>
                  <tr>
                    <th class="rank-col">Rank</th>
                    <th class="player-col">Player</th>
                    <th class="points-col">Points</th>
                    <th class="wins-col">Wins</th>
                    <th class="top10-col">Top 10s</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in paginatedStandings" :key="player.playerId">
                    <td class="rank-col">
                      <span class="rank-badge" :class="getRankClass(player.displayRank)">{{ player.displayRank }}</span>
                    </td>
                    <td class="player-col">
                      <div class="player-info">
                        <img :src="`/flags/${player.country}.png`" class="standings-flag" />
                        <span class="player-name">
                          {{ player.firstName }} {{ player.lastName }}
                        </span>
                      </div>
                    </td>
                    <td class="points-col">
                      <span class="points">{{ player.points.toLocaleString() }}</span>
                    </td>
                    <td class="wins-col">
                      <span class="wins-value">{{ player.wins || 0 }}</span>
                    </td>
                    <td class="top10-col">
                      <span class="top10-value">{{ player.top10s || 0 }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div v-if="totalStandingsPages > 1" class="pagination">
                <button
                  class="pagination-btn"
                  :disabled="currentStandingsPage === 1"
                  @click="currentStandingsPage = 1"
                >
                  <i class="fa-solid fa-angles-left"></i>
                </button>
                <button
                  class="pagination-btn"
                  :disabled="currentStandingsPage === 1"
                  @click="currentStandingsPage--"
                >
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <span class="pagination-info">
                  Page {{ currentStandingsPage }} of {{ totalStandingsPages }}
                </span>
                <button
                  class="pagination-btn"
                  :disabled="currentStandingsPage === totalStandingsPages"
                  @click="currentStandingsPage++"
                >
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button
                  class="pagination-btn"
                  :disabled="currentStandingsPage === totalStandingsPages"
                  @click="currentStandingsPage = totalStandingsPages"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Golfers Tab -->
          <div v-if="activeTab === 'golfers'" class="tab-content fade-in">
            <div class="section-header">
              <h2>
                <i class="fa-solid fa-users"></i>
                Golfers ({{ players.length }})
              </h2>
              <div class="header-actions">
                <button
                  v-if="players.length === 0"
                  @click="handleGeneratePlayers"
                  class="btn btn-secondary"
                  :disabled="generatingPlayers"
                >
                  <i v-if="generatingPlayers" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                  Generate 120 Golfers
                </button>
                <button @click="showAddPlayer = true" class="btn btn-primary golf-btn">
                  <i class="fa-solid fa-plus"></i>
                  Add Player
                </button>
                <button
                  v-if="players.length > 0"
                  @click="showDeleteAllConfirm = true"
                  class="btn btn-danger"
                >
                  <i class="fa-solid fa-trash"></i>
                  Delete All
                </button>
              </div>
            </div>

            <div v-if="players.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="fa-solid fa-user-plus"></i>
              </div>
              <h3>No Golfers Yet</h3>
              <p>Generate golfers to populate your golf world with PGA Tour competitors.</p>
            </div>

            <div v-else class="players-table">
              <table>
                <thead>
                  <tr>
                    <th class="col-rank">#</th>
                    <th class="col-name">Player</th>
                    <th class="col-country">Country</th>
                    <th class="col-points">Points</th>
                    <th class="col-skill">DRV</th>
                    <th class="col-skill">IRN</th>
                    <th class="col-skill">SHG</th>
                    <th class="col-skill">PUT</th>
                    <th class="col-skill">MNT</th>
                    <th class="col-skill">CON</th>
                    <th class="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in paginatedPlayers" :key="player.id">
                    <td class="col-rank">
                      <span class="rank-num">{{ player.rank }}</span>
                    </td>
                    <td class="col-name">
                      <span class="player-name-cell">
                        {{ player.first_name }} {{ player.last_name }}
                      </span>
                    </td>
                    <td class="col-country">
                      <img :src="`/flags/${player.country}.png`" class="standings-flag" />
                    </td>
                    <td class="col-points">
                      <span class="points-value">{{ player.ranking_points.toLocaleString() }}</span>
                    </td>
                    <td class="col-skill">
                      <span class="skill-cell" :class="getSkillClass(player.skill_driving)">{{ player.skill_driving }}</span>
                    </td>
                    <td class="col-skill">
                      <span class="skill-cell" :class="getSkillClass(player.skill_iron_play)">{{ player.skill_iron_play }}</span>
                    </td>
                    <td class="col-skill">
                      <span class="skill-cell" :class="getSkillClass(player.skill_short_game)">{{ player.skill_short_game }}</span>
                    </td>
                    <td class="col-skill">
                      <span class="skill-cell" :class="getSkillClass(player.skill_putting)">{{ player.skill_putting }}</span>
                    </td>
                    <td class="col-skill">
                      <span class="skill-cell" :class="getSkillClass(player.skill_mental)">{{ player.skill_mental }}</span>
                    </td>
                    <td class="col-skill">
                      <span class="skill-cell" :class="getSkillClass(player.skill_consistency)">{{ player.skill_consistency }}</span>
                    </td>
                    <td class="col-actions">
                      <button
                        @click="deletePlayer(player)"
                        class="btn-delete"
                        title="Delete Player"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div v-if="totalPlayerPages > 1" class="pagination">
                <button
                  class="pagination-btn"
                  :disabled="currentPlayerPage === 1"
                  @click="currentPlayerPage = 1"
                >
                  <i class="fa-solid fa-angles-left"></i>
                </button>
                <button
                  class="pagination-btn"
                  :disabled="currentPlayerPage === 1"
                  @click="currentPlayerPage--"
                >
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <span class="pagination-info">
                  Page {{ currentPlayerPage }} of {{ totalPlayerPages }}
                </span>
                <button
                  class="pagination-btn"
                  :disabled="currentPlayerPage === totalPlayerPages"
                  @click="currentPlayerPage++"
                >
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button
                  class="pagination-btn"
                  :disabled="currentPlayerPage === totalPlayerPages"
                  @click="currentPlayerPage = totalPlayerPages"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- Reset Season Confirmation Modal -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Reset Season</h2>
          <button @click="showResetConfirm = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p class="warning-text">
          Are you sure you want to reset the season? All tournament results and player points will be cleared.
        </p>
        <div class="modal-actions">
          <button @click="showResetConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleResetSeason" class="btn btn-danger" :disabled="creatingOrResetting">
            <i v-if="creatingOrResetting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-rotate"></i>
            Reset Season
          </button>
        </div>
      </div>
    </div>

    <!-- Delete All Players Confirmation Modal -->
    <div v-if="showDeleteAllConfirm" class="modal-overlay" @click.self="showDeleteAllConfirm = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete All Golfers</h2>
          <button @click="showDeleteAllConfirm = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p class="warning-text">
          Are you sure you want to delete all {{ players.length }} golfers? This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button @click="showDeleteAllConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteAllPlayers" class="btn btn-danger" :disabled="deletingAll">
            <i v-if="deletingAll" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-trash"></i>
            Delete All
          </button>
        </div>
      </div>
    </div>

    <!-- Add Player Modal -->
    <div v-if="showAddPlayer" class="modal-overlay" @click.self="closeAddPlayerModal">
      <div class="modal fade-in modal-large">
        <div class="modal-header">
          <h2>Add New Golfer</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeAddPlayerModal" class="btn btn-ghost">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        <form @submit.prevent="handleAddPlayer">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input v-model="newPlayer.first_name" type="text" class="input-field" required />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input v-model="newPlayer.last_name" type="text" class="input-field" required />
            </div>
            <div class="form-group">
              <label class="form-label">Country</label>
              <div class="country-select-wrapper">
                <input
                  v-model="countrySearch"
                  type="text"
                  class="input-field"
                  placeholder="Search country..."
                  @focus="showCountryDropdown = true"
                  @input="filterCountries"
                />
                <div v-if="newPlayer.country && !showCountryDropdown" class="selected-country">
                  <img :src="`/flags/${newPlayer.country}.png`" class="flag-xs" />
                  {{ getCountryName(newPlayer.country) }} ({{ newPlayer.country }})
                </div>
                <div v-if="showCountryDropdown" class="country-dropdown">
                  <div
                    v-for="country in filteredCountries"
                    :key="country.code"
                    class="country-option"
                    @click="selectCountry(country)"
                  >
                    <span class="country-name">
                      <img :src="`/flags/${country.code}.png`" class="flag-xs" />
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
          </div>

          <div class="skills-section">
            <div class="skills-header">
              <label class="form-label">Skills</label>
              <button type="button" @click="randomizeAllSkills" class="btn btn-sm btn-secondary">
                <i class="fa-solid fa-dice"></i>
                Randomize All
              </button>
            </div>
            <div class="form-row">
              <div class="form-group">
                <div class="skill-input-row">
                  <label class="form-label">Driving</label>
                  <button type="button" @click="randomizeSkill('skill_driving')" class="btn-icon" title="Randomize">
                    <i class="fa-solid fa-shuffle"></i>
                  </button>
                </div>
                <input v-model.number="newPlayer.skill_driving" type="number" class="input-field" min="0" max="99" />
              </div>
              <div class="form-group">
                <div class="skill-input-row">
                  <label class="form-label">Iron Play</label>
                  <button type="button" @click="randomizeSkill('skill_iron_play')" class="btn-icon" title="Randomize">
                    <i class="fa-solid fa-shuffle"></i>
                  </button>
                </div>
                <input v-model.number="newPlayer.skill_iron_play" type="number" class="input-field" min="0" max="99" />
              </div>
              <div class="form-group">
                <div class="skill-input-row">
                  <label class="form-label">Short Game</label>
                  <button type="button" @click="randomizeSkill('skill_short_game')" class="btn-icon" title="Randomize">
                    <i class="fa-solid fa-shuffle"></i>
                  </button>
                </div>
                <input v-model.number="newPlayer.skill_short_game" type="number" class="input-field" min="0" max="99" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <div class="skill-input-row">
                  <label class="form-label">Putting</label>
                  <button type="button" @click="randomizeSkill('skill_putting')" class="btn-icon" title="Randomize">
                    <i class="fa-solid fa-shuffle"></i>
                  </button>
                </div>
                <input v-model.number="newPlayer.skill_putting" type="number" class="input-field" min="0" max="99" />
              </div>
              <div class="form-group">
                <div class="skill-input-row">
                  <label class="form-label">Mental</label>
                  <button type="button" @click="randomizeSkill('skill_mental')" class="btn-icon" title="Randomize">
                    <i class="fa-solid fa-shuffle"></i>
                  </button>
                </div>
                <input v-model.number="newPlayer.skill_mental" type="number" class="input-field" min="0" max="99" />
              </div>
              <div class="form-group">
                <div class="skill-input-row">
                  <label class="form-label">Consistency</label>
                  <button type="button" @click="randomizeSkill('skill_consistency')" class="btn-icon" title="Randomize">
                    <i class="fa-solid fa-shuffle"></i>
                  </button>
                </div>
                <input v-model.number="newPlayer.skill_consistency" type="number" class="input-field" min="0" max="99" />
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeAddPlayerModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary golf-btn" :disabled="addingPlayer || !newPlayer.country">
              <i v-if="addingPlayer" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-plus"></i>
              Add Golfer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
    <NamePicker v-model="showNamePicker" @select="handleNamePicked" />
  </template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGolfStore } from '../stores/golf'
import NamePicker from '../components/NamePicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const golfStore = useGolfStore()

const worldId = computed(() => route.params.id)
const world = computed(() => golfStore.currentWorld)
const players = computed(() => golfStore.players)
const currentSeason = computed(() => golfStore.currentSeason)
const events = computed(() => golfStore.events)
const standings = computed(() => golfStore.standings)

// Pagination for players
const playersPerPage = 20
const currentPlayerPage = ref(1)

const sortedPlayers = computed(() => {
  return [...players.value].sort((a, b) => {
    const lastNameCompare = a.last_name.localeCompare(b.last_name)
    if (lastNameCompare !== 0) return lastNameCompare
    return a.first_name.localeCompare(b.first_name)
  })
})

const totalPlayerPages = computed(() => Math.ceil(sortedPlayers.value.length / playersPerPage))

const paginatedPlayers = computed(() => {
  const start = (currentPlayerPage.value - 1) * playersPerPage
  return sortedPlayers.value.slice(start, start + playersPerPage)
})

// Pagination for standings
const standingsPerPage = 20
const currentStandingsPage = ref(1)

const totalStandingsPages = computed(() => Math.ceil(standings.value.length / standingsPerPage))

const paginatedStandings = computed(() => {
  const start = (currentStandingsPage.value - 1) * standingsPerPage
  return standings.value.slice(start, start + standingsPerPage).map((player, index) => ({
    ...player,
    displayRank: start + index + 1
  }))
})

const loading = ref(true)
const activeTab = ref('calendar')
const tabs = [
  { id: 'calendar', name: 'Calendar', icon: 'fa-solid fa-calendar' },
  { id: 'standings', name: 'Standings', icon: 'fa-solid fa-ranking-star' },
  { id: 'golfers', name: 'Golfers', icon: 'fa-solid fa-users' }
]

const generatingPlayers = ref(false)
const creatingOrResetting = ref(false)
const showResetConfirm = ref(false)
const showDeleteAllConfirm = ref(false)
const deletingAll = ref(false)
const showAddPlayer = ref(false)
const showNamePicker = ref(false)
const addingPlayer = ref(false)

// Country data
const allCountries = [
  { code: 'AFG', name: 'Afghanistan' }, { code: 'ALB', name: 'Albania' }, { code: 'ALG', name: 'Algeria' },
  { code: 'AND', name: 'Andorra' }, { code: 'ANG', name: 'Angola' }, { code: 'ARG', name: 'Argentina' },
  { code: 'ARM', name: 'Armenia' }, { code: 'AUS', name: 'Australia' }, { code: 'AUT', name: 'Austria' },
  { code: 'AZE', name: 'Azerbaijan' }, { code: 'BAH', name: 'Bahamas' }, { code: 'BAN', name: 'Bangladesh' },
  { code: 'BEL', name: 'Belgium' }, { code: 'BLR', name: 'Belarus' }, { code: 'BOL', name: 'Bolivia' },
  { code: 'BIH', name: 'Bosnia and Herzegovina' }, { code: 'BRA', name: 'Brazil' }, { code: 'BUL', name: 'Bulgaria' },
  { code: 'CAN', name: 'Canada' }, { code: 'CHI', name: 'Chile' }, { code: 'CHN', name: 'China' },
  { code: 'COL', name: 'Colombia' }, { code: 'CRC', name: 'Costa Rica' }, { code: 'CRO', name: 'Croatia' },
  { code: 'CUB', name: 'Cuba' }, { code: 'CYP', name: 'Cyprus' }, { code: 'CZE', name: 'Czech Republic' },
  { code: 'DEN', name: 'Denmark' }, { code: 'DOM', name: 'Dominican Republic' }, { code: 'ECU', name: 'Ecuador' },
  { code: 'EGY', name: 'Egypt' }, { code: 'ESP', name: 'Spain' }, { code: 'EST', name: 'Estonia' },
  { code: 'FIN', name: 'Finland' }, { code: 'FRA', name: 'France' }, { code: 'GEO', name: 'Georgia' },
  { code: 'GER', name: 'Germany' }, { code: 'GBR', name: 'Great Britain' }, { code: 'GRE', name: 'Greece' },
  { code: 'GUA', name: 'Guatemala' }, { code: 'HKG', name: 'Hong Kong' }, { code: 'HUN', name: 'Hungary' },
  { code: 'ISL', name: 'Iceland' }, { code: 'IND', name: 'India' }, { code: 'INA', name: 'Indonesia' },
  { code: 'IRI', name: 'Iran' }, { code: 'IRL', name: 'Ireland' }, { code: 'ISR', name: 'Israel' },
  { code: 'ITA', name: 'Italy' }, { code: 'JAM', name: 'Jamaica' }, { code: 'JPN', name: 'Japan' },
  { code: 'KAZ', name: 'Kazakhstan' }, { code: 'KEN', name: 'Kenya' }, { code: 'KOR', name: 'South Korea' },
  { code: 'KUW', name: 'Kuwait' }, { code: 'LAT', name: 'Latvia' }, { code: 'LIB', name: 'Lebanon' },
  { code: 'LTU', name: 'Lithuania' }, { code: 'LUX', name: 'Luxembourg' }, { code: 'MAS', name: 'Malaysia' },
  { code: 'MEX', name: 'Mexico' }, { code: 'MDA', name: 'Moldova' }, { code: 'MON', name: 'Monaco' },
  { code: 'MNE', name: 'Montenegro' }, { code: 'MAR', name: 'Morocco' }, { code: 'NED', name: 'Netherlands' },
  { code: 'NZL', name: 'New Zealand' }, { code: 'NOR', name: 'Norway' }, { code: 'PAK', name: 'Pakistan' },
  { code: 'PAN', name: 'Panama' }, { code: 'PAR', name: 'Paraguay' }, { code: 'PER', name: 'Peru' },
  { code: 'PHI', name: 'Philippines' }, { code: 'POL', name: 'Poland' }, { code: 'POR', name: 'Portugal' },
  { code: 'QAT', name: 'Qatar' }, { code: 'ROU', name: 'Romania' }, { code: 'RUS', name: 'Russia' },
  { code: 'KSA', name: 'Saudi Arabia' }, { code: 'SRB', name: 'Serbia' }, { code: 'SGP', name: 'Singapore' },
  { code: 'SVK', name: 'Slovakia' }, { code: 'SLO', name: 'Slovenia' }, { code: 'RSA', name: 'South Africa' },
  { code: 'SWE', name: 'Sweden' }, { code: 'SUI', name: 'Switzerland' }, { code: 'TPE', name: 'Taiwan' },
  { code: 'THA', name: 'Thailand' }, { code: 'TUN', name: 'Tunisia' }, { code: 'TUR', name: 'Turkey' },
  { code: 'UKR', name: 'Ukraine' }, { code: 'UAE', name: 'United Arab Emirates' }, { code: 'USA', name: 'United States' },
  { code: 'URU', name: 'Uruguay' }, { code: 'UZB', name: 'Uzbekistan' }, { code: 'VEN', name: 'Venezuela' },
  { code: 'VIE', name: 'Vietnam' }, { code: 'ZIM', name: 'Zimbabwe' }
]

const countrySearch = ref('')
const showCountryDropdown = ref(false)
const filteredCountries = ref([...allCountries])

const newPlayer = ref({
  first_name: '',
  last_name: '',
  country: '',
  skill_driving: 70,
  skill_iron_play: 70,
  skill_short_game: 70,
  skill_putting: 70,
  skill_mental: 70,
  skill_consistency: 70
})

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

function selectCountry(country) {
  newPlayer.value.country = country.code
  countrySearch.value = ''
  showCountryDropdown.value = false
}

function getCountryName(code) {
  const country = allCountries.find(c => c.code === code)
  return country ? country.name : code
}

function randomizeSkill(skillName) {
  // Generate skill with normal distribution around 70, between 40-95
  const mean = 70
  const stdDev = 12
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  let value = Math.round(mean + z * stdDev)
  value = Math.max(40, Math.min(95, value))
  newPlayer.value[skillName] = value
}

function randomizeAllSkills() {
  randomizeSkill('skill_driving')
  randomizeSkill('skill_iron_play')
  randomizeSkill('skill_short_game')
  randomizeSkill('skill_putting')
  randomizeSkill('skill_mental')
  randomizeSkill('skill_consistency')
}

function goBack() {
  router.push('/golf')
}

function goToEvent(event) {
  router.push(`/golf/world/${worldId.value}/event/${event.id}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function handleGeneratePlayers() {
  generatingPlayers.value = true
  try {
    await golfStore.generatePlayers(worldId.value, 120)
    await golfStore.fetchStandings(worldId.value)
  } catch (error) {
    console.error('Failed to generate golfers:', error)
  } finally {
    generatingPlayers.value = false
  }
}

async function handleCreateSeason() {
  creatingOrResetting.value = true
  try {
    await golfStore.createSeason(worldId.value, new Date().getFullYear())
  } catch (error) {
    console.error('Failed to create season:', error)
  } finally {
    creatingOrResetting.value = false
  }
}

async function handleResetSeason() {
  if (!currentSeason.value) return
  creatingOrResetting.value = true
  try {
    await golfStore.resetSeason(currentSeason.value.id)
    await golfStore.fetchPlayers(worldId.value)
    await golfStore.fetchStandings(worldId.value)
    showResetConfirm.value = false
  } catch (error) {
    console.error('Failed to reset season:', error)
  } finally {
    creatingOrResetting.value = false
  }
}

async function handleDeleteAllPlayers() {
  deletingAll.value = true
  try {
    await golfStore.deleteAllPlayers(worldId.value)
    await golfStore.fetchStandings(worldId.value)
    showDeleteAllConfirm.value = false
  } catch (error) {
    console.error('Failed to delete all golfers:', error)
  } finally {
    deletingAll.value = false
  }
}

async function deletePlayer(player) {
  try {
    await golfStore.deletePlayer(player.id)
    await golfStore.fetchStandings(worldId.value)
  } catch (error) {
    console.error('Failed to delete golfer:', error)
  }
}

function resetPlayerForm() {
  newPlayer.value = {
    first_name: '',
    last_name: '',
    country: '',
    skill_driving: 70,
    skill_iron_play: 70,
    skill_short_game: 70,
    skill_putting: 70,
    skill_mental: 70,
    skill_consistency: 70
  }
  countrySearch.value = ''
  showCountryDropdown.value = false
  filteredCountries.value = [...allCountries]
}

function handleNamePicked(data) {
  newPlayer.value.first_name = data.first_name
  newPlayer.value.last_name = data.last_name
  if (data.country_code) newPlayer.value.country = data.country_code
}

function closeAddPlayerModal() {
  showAddPlayer.value = false
  resetPlayerForm()
}

async function handleAddPlayer() {
  addingPlayer.value = true
  try {
    await golfStore.createPlayer(worldId.value, newPlayer.value)
    await golfStore.fetchPlayers(worldId.value)
    await golfStore.fetchStandings(worldId.value)
    closeAddPlayerModal()
  } catch (error) {
    console.error('Failed to add golfer:', error)
  } finally {
    addingPlayer.value = false
  }
}

// Formatting helpers
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatStatus(status) {
  const labels = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

function getTournamentLabel(type) {
  const labels = {
    major: 'Major',
    players_championship: 'THE PLAYERS',
    wgc: 'WGC',
    invitational: 'Invitational',
    regular: 'Regular'
  }
  return labels[type] || type
}

function getBadgeStyle(type) {
  const styles = {
    major: { background: '#fef3c7', color: '#b45309' },
    players_championship: { background: '#ede9fe', color: '#7c3aed' },
    wgc: { background: '#ede9fe', color: '#7c3aed' },
    invitational: { background: '#dbeafe', color: '#2563eb' },
    regular: { background: '#f3f4f6', color: '#4b5563' }
  }
  return styles[type] || { background: '#f3f4f6', color: '#4b5563' }
}

function getTournamentTypeClass(type) {
  return `type-${type}`
}

function getStatusClass(status) {
  return `status-${status}`
}

function getRankClass(rank) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

function getSkillClass(skill) {
  if (skill >= 85) return 'excellent'
  if (skill >= 75) return 'good'
  if (skill >= 65) return 'average'
  return 'below'
}

onMounted(async () => {
  try {
    await golfStore.fetchWorld(worldId.value)
    await Promise.all([
      golfStore.fetchPlayers(worldId.value),
      golfStore.fetchCurrentSeason(worldId.value),
      golfStore.fetchStandings(worldId.value)
    ])
  } catch (error) {
    console.error('Failed to load golf world:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.golf-world {
  min-height: 100vh;
}

/* Flag styles */
.event-flag {
  width: 1rem;
  height: 0.7rem;
  object-fit: cover;
  border-radius: 2px;
}

.standings-flag {
  width: 1.25rem;
  height: 0.9rem;
  object-fit: cover;
  border-radius: 2px;
}

.flag-xs {
  width: 1rem;
  height: 0.75rem;
  object-fit: cover;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 0.25rem;
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
  font-size: 0.875rem;
}

.world-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gray-800);
  font-weight: 600;
}

.world-name i {
  color: #10b981;
}

.world-main {
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

/* Tabs */
.tabs-container {
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  border-radius: 0.75rem;
  font-weight: 500;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--gray-100);
}

.tab-btn.active {
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.section-header h2 i {
  color: #10b981;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.golf-btn {
  background: linear-gradient(135deg, #34d399, #10b981);
}

.golf-btn:hover {
  background: linear-gradient(135deg, #10b981, #059669);
}

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.625rem;
}

.tournament-card {
  background: white;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-left: 3px solid var(--gray-300);
  transition: all 0.2s;
}

.tournament-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tournament-card.clickable {
  cursor: pointer;
}

/* Tournament type border colors */
.tournament-card.type-major {
  border-left-color: #f59e0b;
}

.tournament-card.type-players_championship {
  border-left-color: #8b5cf6;
}

.tournament-card.type-wgc {
  border-left-color: #8b5cf6;
}

.tournament-card.type-invitational {
  border-left-color: #3b82f6;
}

.tournament-card.type-regular {
  border-left-color: #6b7280;
}

.tournament-card.status-completed {
  background: #f0fdf4;
}

.tournament-winner {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #92400e;
}

.tournament-winner i {
  color: #f59e0b;
  font-size: 0.65rem;
}

.tournament-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding-top: 0.375rem;
  border-top: 1px solid var(--gray-100);
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 500;
}

.tournament-action i {
  transition: transform 0.2s;
}

.tournament-card:hover .tournament-action i {
  transform: translateX(4px);
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.tournament-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.65rem;
  font-weight: 600;
}

.tournament-status {
  font-size: 0.65rem;
  font-weight: 500;
}

.tournament-status.upcoming {
  color: #3b82f6;
}

.tournament-status.in_progress {
  color: #f59e0b;
}

.tournament-status.completed {
  color: #10b981;
}

.tournament-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tournament-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 0.75rem;
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: var(--gray-600);
}

.detail i {
  width: 12px;
  font-size: 0.6rem;
  color: var(--gray-400);
}

/* Standings Table */
.standings-table {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.standings-table table {
  width: 100%;
  border-collapse: collapse;
}

.standings-table th,
.standings-table td {
  padding: 1rem;
  text-align: left;
}

.standings-table th {
  background: var(--gray-50);
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.standings-table tr:not(:last-child) td {
  border-bottom: 1px solid var(--gray-100);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  background: var(--gray-100);
  color: var(--gray-700);
}

.rank-badge.gold {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  color: white;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #e5e7eb, #9ca3af);
  color: white;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #fbbf24, #b45309);
  color: white;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-name {
  font-weight: 500;
  color: var(--gray-900);
}

.player-name-cell {
  font-weight: 500;
  color: var(--gray-900);
}

.points {
  font-weight: 600;
  color: #10b981;
}

.wins-value,
.top10-value {
  font-weight: 500;
  color: var(--gray-700);
}

.rank-col {
  width: 60px;
}

.player-col {
  min-width: 200px;
}

.points-col {
  width: 100px;
  text-align: right;
}

.wins-col {
  width: 70px;
  text-align: center;
}

.top10-col {
  width: 80px;
  text-align: center;
}

/* Players Table */
.players-table {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.players-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.players-table th,
.players-table td {
  padding: 0.625rem 0.5rem;
  text-align: left;
}

.players-table th {
  background: var(--gray-50);
  font-weight: 600;
  color: var(--gray-600);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.players-table tbody tr {
  border-bottom: 1px solid var(--gray-100);
  transition: background 0.15s;
}

.players-table tbody tr:hover {
  background: #f0fdf4;
}

.players-table tbody tr:last-child {
  border-bottom: none;
}

.col-rank {
  width: 40px;
  text-align: center;
}

.col-name {
  min-width: 160px;
}

.col-country {
  width: 60px;
  text-align: center;
}

.col-points {
  width: 70px;
  text-align: right;
}

.col-skill {
  width: 42px;
  text-align: center;
}

.col-actions {
  width: 40px;
  text-align: center;
}

.rank-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--gray-100);
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--gray-700);
}

.points-value {
  font-weight: 600;
  color: #10b981;
}

.skill-cell {
  display: inline-block;
  min-width: 28px;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
}

.skill-cell.excellent {
  background: #dcfce7;
  color: #16a34a;
}

.skill-cell.good {
  background: #dbeafe;
  color: #2563eb;
}

.skill-cell.average {
  background: #fef3c7;
  color: #b45309;
}

.skill-cell.below {
  background: var(--gray-100);
  color: var(--gray-600);
}

.skill-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.skill-badge.excellent {
  background: #dcfce7;
  color: #16a34a;
}

.skill-badge.good {
  background: #dbeafe;
  color: #2563eb;
}

.skill-badge.average {
  background: #fef3c7;
  color: #b45309;
}

.skill-badge.below {
  background: var(--gray-100);
  color: var(--gray-600);
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  color: var(--gray-400);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.players-table tbody tr:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--gray-100);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.375rem;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f0fdf4;
  border-color: #10b981;
  color: #10b981;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-icon i {
  font-size: 2rem;
  color: #10b981;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--gray-500);
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

.modal-large {
  max-width: 640px;
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

.warning-text {
  color: var(--gray-600);
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Country selector */
.country-select-wrapper {
  position: relative;
}

.selected-country {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #10b981;
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
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background: #f0fdf4;
}

.country-name {
  color: var(--gray-800);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.country-code {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 500;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: var(--gray-500);
  font-size: 0.875rem;
}

/* Skills section */
.skills-section {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.skills-header .form-label {
  margin-bottom: 0;
  font-weight: 600;
}

.skill-input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.skill-input-row .form-label {
  margin-bottom: 0;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--gray-200);
  border-radius: 0.25rem;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: #10b981;
  color: white;
}

.btn-icon i {
  font-size: 0.7rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .breadcrumb {
    display: none;
  }

  .tabs {
    overflow-x: auto;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .calendar-grid,
  .players-grid {
    grid-template-columns: 1fr;
  }
}
</style>
