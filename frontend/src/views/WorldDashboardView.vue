<template>
  <div class="world-dashboard">
    <header class="dashboard-header">
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

          <!-- Tab Navigation -->
          <nav class="dashboard-tabs">
            <button
              :class="['tab-btn', { active: activeTab === 'this-week' }]"
              @click="activeTab = 'this-week'"
            >
              <i class="fa-solid fa-calendar-week"></i>
              <span>This Week</span>
              <span v-if="weekStatusStore.totalInWeek" class="tab-badge">
                {{ weekStatusStore.completedInWeek }}/{{ weekStatusStore.totalInWeek }}
              </span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'all-sports' }]"
              @click="activeTab = 'all-sports'"
            >
              <i class="fa-solid fa-medal"></i>
              <span>All Sports</span>
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'teams' }]"
              @click="activeTab = 'teams'"
            >
              <i class="fa-solid fa-people-group"></i>
              <span>Teams</span>
              <span v-if="teams.length" class="tab-badge">{{ teams.length }}</span>
            </button>
          </nav>

          <!-- This Week Tab -->
          <section v-if="activeTab === 'this-week'" class="tab-content this-week-tab fade-in">
            <div class="week-header">
              <div class="week-title-row">
                <div class="week-title">
                  <i class="fa-solid fa-calendar-week"></i>
                  <h2>{{ weekStatusStore.formattedWeek || 'Current Week' }}</h2>
                </div>
                <button @click="confirmResetSeasons" class="btn btn-ghost btn-sm reset-btn" title="Reset all seasons">
                  <i class="fa-solid fa-rotate-left"></i>
                  Reset Seasons
                </button>
              </div>
              <div class="week-progress" v-if="weekStatusStore.totalInWeek">
                <div class="progress-info">
                  <span class="progress-text">{{ weekStatusStore.completedInWeek }}/{{ weekStatusStore.totalInWeek }} events completed</span>
                  <span class="progress-percent">{{ weekStatusStore.weekProgress }}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" :style="{ width: weekStatusStore.weekProgress + '%' }"></div>
                </div>
              </div>
            </div>

            <!-- Week Calendar Grid -->
            <div v-if="weekStatusStore.currentWeekEvents.length > 0" class="week-calendar">
              <div
                v-for="(events, date) in weekStatusStore.eventsByDate"
                :key="date"
                :class="['day-column', { 'has-events': events.length > 0 }]"
              >
                <div class="day-header">
                  <span class="day-name">{{ getDayName(date) }}</span>
                  <span class="day-date">{{ formatDate(date) }}</span>
                </div>
                <div class="day-events">
                  <div
                    v-for="event in events"
                    :key="event.id"
                    :class="['week-event-card', event.status]"
                    @click="navigateToSport(event.sport)"
                  >
                    <div class="event-sport-icon" :style="{ background: getSportGradient(event.sport) }">
                      <i :class="getSportIcon(event.sport)"></i>
                    </div>
                    <div class="event-info">
                      <span class="event-sport-name">{{ event.sportDisplayName }}</span>
                      <span class="event-name">{{ event.name }}</span>
                      <div class="event-location">
                        <img :src="`/flags/${event.country}.png`" class="event-flag" />
                        {{ event.location }}
                      </div>
                    </div>
                    <div class="event-status-indicator">
                      <i v-if="event.status === 'completed'" class="fa-solid fa-check-circle completed"></i>
                      <i v-else-if="event.status === 'in_progress'" class="fa-solid fa-play-circle in-progress"></i>
                      <i v-else class="fa-solid fa-circle scheduled"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-events-message">
              <i class="fa-solid fa-calendar-xmark"></i>
              <p>No events scheduled for this week</p>
              <p class="text-muted">Generate seasons for all sports to see events here</p>
              <button @click="generateAllSeasons" class="btn btn-primary btn-lg" :disabled="generatingSeasoning">
                <i v-if="generatingSeasoning" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                {{ generatingSeasoning ? 'Generating...' : 'Generate All Seasons' }}
              </button>
            </div>

            <!-- Week Complete Message -->
            <div v-if="weekStatusStore.isWeekComplete && weekStatusStore.totalInWeek > 0" class="week-complete-banner">
              <i class="fa-solid fa-check-circle"></i>
              <span>Week complete! All {{ weekStatusStore.totalInWeek }} events finished.</span>
            </div>
          </section>

          <!-- All Sports Tab -->
          <section v-if="activeTab === 'all-sports'" class="tab-content all-sports-tab fade-in">
          <!-- Next Events Section -->
          <section class="next-events-section fade-in">
            <h2 class="section-title">
              <i class="fa-solid fa-calendar-day"></i>
              Upcoming Events
            </h2>
            <div class="next-events-grid">
              <div
                v-if="dashboardSummary?.skiJumping?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('ski-jumping', dashboardSummary.skiJumping.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #60a5fa, #3b82f6)">
                  <i class="fa-solid fa-person-skiing ski-jump-icon"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Ski Jumping</span>
                  <span class="event-name">{{ dashboardSummary.skiJumping.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.skiJumping.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.skiJumping.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.biathlon?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('biathlon', dashboardSummary.biathlon.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #34d399, #10b981)">
                  <i class="fa-solid fa-bullseye"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Biathlon</span>
                  <span class="event-name">{{ dashboardSummary.biathlon.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.biathlon.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.biathlon.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.crossCountry?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('cross-country', dashboardSummary.crossCountry.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #a78bfa, #8b5cf6)">
                  <i class="fa-solid fa-person-skiing-nordic"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Cross-Country</span>
                  <span class="event-name">{{ dashboardSummary.crossCountry.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.crossCountry.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.crossCountry.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.alpine?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('alpine-skiing', dashboardSummary.alpine.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #2dd4bf, #14b8a6)">
                  <i class="fa-solid fa-person-skiing"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Alpine Skiing</span>
                  <span class="event-name">{{ dashboardSummary.alpine.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.alpine.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.alpine.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.bobsleigh?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('bobsleigh', dashboardSummary.bobsleigh.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #f472b6, #ec4899)">
                  <i class="fa-solid fa-shuttle-space fa-rotate-270"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Bobsleigh</span>
                  <span class="event-name">{{ dashboardSummary.bobsleigh.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.bobsleigh.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.bobsleigh.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.nordicCombined?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('nordic-combined', dashboardSummary.nordicCombined.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #fbbf24, #f59e0b)">
                  <i class="fa-solid fa-medal"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Nordic Combined</span>
                  <span class="event-name">{{ dashboardSummary.nordicCombined.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.nordicCombined.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.nordicCombined.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.speedSkating?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('speed-skating', dashboardSummary.speedSkating.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #38bdf8, #0ea5e9)">
                  <i class="fa-solid fa-person-skating"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Speed Skating</span>
                  <span class="event-name">{{ dashboardSummary.speedSkating.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.speedSkating.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.speedSkating.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.luge?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('luge', dashboardSummary.luge.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #f87171, #ef4444)">
                  <i class="fa-solid fa-sled"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Luge</span>
                  <span class="event-name">{{ dashboardSummary.luge.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.luge.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.luge.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>

              <div
                v-if="dashboardSummary?.skeleton?.nextEvent"
                class="next-event-card"
                @click="navigateToEvent('skeleton', dashboardSummary.skeleton.nextEvent.id)"
              >
                <div class="event-sport-badge" style="background: linear-gradient(135deg, #fb923c, #f97316)">
                  <i class="fa-solid fa-person-arrow-down-to-line"></i>
                </div>
                <div class="event-details">
                  <span class="event-sport-label">Skeleton</span>
                  <span class="event-name">{{ dashboardSummary.skeleton.nextEvent.name }}</span>
                  <span class="event-location">
                    <img :src="`/flags/${dashboardSummary.skeleton.nextEvent.country}.png`" class="event-flag" />
                    {{ dashboardSummary.skeleton.nextEvent.location }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-right event-arrow"></i>
              </div>
            </div>
          </section>

          <section class="sports-section">
            <h2 class="section-title">
              <i class="fa-solid fa-medal"></i>
              Sports
            </h2>

            <div class="sports-grid">
              <div
                v-for="sport in sports"
                :key="sport.id"
                class="sport-card fade-in"
                @click="navigateToSport(sport.id)"
              >
                <div class="sport-icon" :style="{ background: getGradient(sport.id) }">
                  <i :class="[getIcon(sport.id), { 'ski-jump-icon': sport.id === 'ski-jumping' }]"></i>
                </div>
                <h3>{{ sport.name }}</h3>
                <p>{{ sport.description }}</p>

                <!-- Season Progress -->
                <div v-if="getRaceProgress(sport.id)" class="season-progress">
                  <div class="progress-header">
                    <i class="fa-solid fa-calendar-check"></i>
                    <span>Season Progress</span>
                    <span class="progress-count">{{ getRaceProgress(sport.id).completed }}/{{ getRaceProgress(sport.id).total }}</span>
                  </div>
                  <div class="progress-bar-container">
                    <div
                      class="progress-bar-fill"
                      :style="{ width: (getRaceProgress(sport.id).completed / getRaceProgress(sport.id).total * 100) + '%' }"
                    ></div>
                  </div>
                  <div class="progress-text">
                    {{ getRaceProgress(sport.id).remaining }} {{ getRaceProgress(sport.id).remaining === 1 ? 'race' : 'races' }} remaining
                  </div>
                </div>

                <!-- Top 3 Standings -->
                <div v-if="getTop3(sport.id).length > 0" class="sport-standings">
                  <div class="standings-header">
                    <i class="fa-solid fa-ranking-star"></i>
                    <span>Current Standings</span>
                  </div>
                  <div class="standings-list">
                    <div v-for="athlete in getTop3(sport.id)" :key="athlete.position" class="standings-item">
                      <span class="standings-position" :class="'pos-' + athlete.position">{{ athlete.position }}</span>
                      <img :src="`/flags/${athlete.country}.png`" class="standings-flag" />
                      <span class="standings-name">{{ athlete.lastName }}</span>
                      <span class="standings-points">{{ athlete.points }} pts</span>
                    </div>
                  </div>
                </div>

                <div class="sport-action">
                  <span>Enter</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </div>
              </div>
            </div>
          </section>
          </section>

          <!-- Teams Tab -->
          <section v-if="activeTab === 'teams'" class="tab-content teams-tab fade-in">
          <section class="teams-section">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fa-solid fa-people-group"></i>
                Teams
              </h2>
              <button @click="openCreateTeamModal" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i>
                Create Team
              </button>
            </div>

            <div v-if="loadingTeams" class="loading-state-small">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Loading teams...
            </div>

            <div v-else-if="teams.length === 0" class="empty-teams">
              <div class="empty-icon">
                <i class="fa-solid fa-people-group"></i>
              </div>
              <p>No teams yet. Create a team to organize athletes across all sports.</p>
            </div>

            <div v-else class="teams-grid">
              <div
                v-for="team in teams"
                :key="team.id"
                class="team-card fade-in"
              >
                <div class="team-color-bar" :style="{ background: team.color }"></div>
                <div class="team-content">
                  <div class="team-header">
                    <h3>{{ team.name }}</h3>
                    <span v-if="team.short_name" class="team-short">{{ team.short_name }}</span>
                  </div>
                  <p v-if="team.description" class="team-description">{{ team.description }}</p>
                  <div class="team-stats">
                    <span class="team-stat">
                      <i class="fa-solid fa-users"></i>
                      {{ team.athleteCount }} athletes
                    </span>
                  </div>
                  <div v-if="team.athleteCount > 0" class="team-sports-breakdown">
                    <span v-if="team.athletesByport?.skijumping" class="sport-count"><i class="fa-solid fa-person-skiing"></i> {{ team.athletesByport.skijumping }}</span>
                    <span v-if="team.athletesByport?.biathlon" class="sport-count"><i class="fa-solid fa-bullseye"></i> {{ team.athletesByport.biathlon }}</span>
                    <span v-if="team.athletesByport?.crosscountry" class="sport-count"><i class="fa-solid fa-person-skiing-nordic"></i> {{ team.athletesByport.crosscountry }}</span>
                    <span v-if="team.athletesByport?.alpine" class="sport-count"><i class="fa-solid fa-mountain"></i> {{ team.athletesByport.alpine }}</span>
                    <span v-if="team.athletesByport?.nordiccombined" class="sport-count"><i class="fa-solid fa-ranking-star"></i> {{ team.athletesByport.nordiccombined }}</span>
                    <span v-if="team.athletesByport?.speedskating" class="sport-count"><i class="fa-solid fa-person-skating"></i> {{ team.athletesByport.speedskating }}</span>
                    <span v-if="team.athletesByport?.luge" class="sport-count"><i class="fa-solid fa-person-falling"></i> {{ team.athletesByport.luge }}</span>
                    <span v-if="team.athletesByport?.skeleton" class="sport-count"><i class="fa-solid fa-skull"></i> {{ team.athletesByport.skeleton }}</span>
                  </div>
                  <div class="team-actions">
                    <button @click="openEditTeamModal(team)" class="btn btn-sm btn-ghost">
                      <i class="fa-solid fa-pencil"></i> Edit
                    </button>
                    <button @click="confirmDeleteTeam(team)" class="btn btn-sm btn-ghost text-danger">
                      <i class="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
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

    <!-- Create/Edit Team Modal -->
    <div v-if="showTeamModal" class="modal-overlay" @click.self="closeTeamModal">
      <div class="modal team-modal fade-in">
        <div class="modal-header">
          <h2>{{ editingTeam ? 'Edit Team' : 'Create Team' }}</h2>
          <button @click="closeTeamModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Team Name *</label>
            <input v-model="teamForm.name" type="text" placeholder="e.g., Red Bull Racing" required />
          </div>
          <div class="form-group">
            <label>Short Name</label>
            <input v-model="teamForm.shortName" type="text" placeholder="e.g., RBR" maxlength="5" />
          </div>
          <div class="form-group">
            <label>Team Color</label>
            <div class="color-picker-row">
              <input v-model="teamForm.color" type="color" class="color-picker" />
              <span class="color-preview" :style="{ background: teamForm.color }"></span>
              <input v-model="teamForm.color" type="text" class="color-hex" placeholder="#3b82f6" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="teamForm.description" placeholder="Optional team description..." rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeTeamModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveTeam" class="btn btn-primary" :disabled="savingTeam || !teamForm.name">
            <i v-if="savingTeam" class="fa-solid fa-spinner fa-spin"></i>
            {{ savingTeam ? 'Saving...' : (editingTeam ? 'Save Changes' : 'Create Team') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Team Confirmation Modal -->
    <div v-if="showDeleteTeamModal" class="modal-overlay" @click.self="showDeleteTeamModal = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Delete Team?</h2>
          <button @click="showDeleteTeamModal = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ teamToDelete?.name }}</strong>?</p>
          <p class="text-muted">Athletes assigned to this team will be unassigned but not deleted.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteTeamModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="deleteTeam" class="btn btn-danger" :disabled="deletingTeam">
            <i v-if="deletingTeam" class="fa-solid fa-spinner fa-spin"></i>
            {{ deletingTeam ? 'Deleting...' : 'Delete Team' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Seasons Confirmation Modal -->
    <div v-if="showResetSeasonsModal" class="modal-overlay" @click.self="showResetSeasonsModal = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Reset All Seasons?</h2>
          <button @click="showResetSeasonsModal = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to reset all seasons?</p>
          <p class="text-muted">This will delete all current season data and create fresh 2024/2025 seasons for all 9 sports.</p>
        </div>
        <div class="modal-footer">
          <button @click="showResetSeasonsModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="resetAllSeasons" class="btn btn-danger" :disabled="resettingSeasons">
            <i v-if="resettingSeasons" class="fa-solid fa-spinner fa-spin"></i>
            {{ resettingSeasons ? 'Resetting...' : 'Reset All Seasons' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorldsStore } from '../stores/worlds'
import { useSportsStore } from '../stores/sports'
import { useWeekStatusStore } from '../stores/weekStatus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const worldsStore = useWorldsStore()
const sportsStore = useSportsStore()
const weekStatusStore = useWeekStatusStore()

// Tab state
const activeTab = ref('this-week')

const user = computed(() => authStore.user)
const world = computed(() => worldsStore.currentWorld)
const sports = computed(() => sportsStore.sports)
const dashboardSummary = computed(() => worldsStore.dashboardSummary)
const loading = ref(true)

// Teams state
const teams = ref([])
const loadingTeams = ref(false)
const showTeamModal = ref(false)
const editingTeam = ref(null)
const teamForm = ref({
  name: '',
  shortName: '',
  color: '#3b82f6',
  description: ''
})
const savingTeam = ref(false)
const showDeleteTeamModal = ref(false)
const teamToDelete = ref(null)
const deletingTeam = ref(false)

// Season generation state
const generatingSeasoning = ref(false)
const showResetSeasonsModal = ref(false)
const resettingSeasons = ref(false)


const hasAnyNextEvent = computed(() => {
  if (!dashboardSummary.value) return false
  return dashboardSummary.value.skiJumping?.nextEvent ||
         dashboardSummary.value.biathlon?.nextEvent ||
         dashboardSummary.value.crossCountry?.nextEvent ||
         dashboardSummary.value.alpine?.nextEvent ||
         dashboardSummary.value.bobsleigh?.nextEvent ||
         dashboardSummary.value.nordicCombined?.nextEvent ||
         dashboardSummary.value.speedSkating?.nextEvent ||
         dashboardSummary.value.luge?.nextEvent ||
         dashboardSummary.value.skeleton?.nextEvent
})

const sportIcons = {
  'ski-jumping': 'fa-solid fa-person-skiing',
  'biathlon': 'fa-solid fa-bullseye',
  'cross-country': 'fa-solid fa-person-skiing-nordic',
  'bobsleigh': 'fa-solid fa-shuttle-space fa-rotate-270',
  'skeleton': 'fa-solid fa-person-arrow-down-to-line',
  'speed-skating': 'fa-solid fa-person-skating',
  'nordic-combined': 'fa-solid fa-medal',
  'luge': 'fa-solid fa-person-falling',
  'alpine-skiing': 'fa-solid fa-person-skiing'
}

const sportGradients = {
  'ski-jumping': 'linear-gradient(135deg, #60a5fa, #3b82f6)',
  'biathlon': 'linear-gradient(135deg, #34d399, #10b981)',
  'cross-country': 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
  'bobsleigh': 'linear-gradient(135deg, #f472b6, #ec4899)',
  'skeleton': 'linear-gradient(135deg, #fb923c, #f97316)',
  'speed-skating': 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
  'nordic-combined': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  'luge': 'linear-gradient(135deg, #f87171, #ef4444)',
  'alpine-skiing': 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
}

function getIcon(sportId) {
  return sportIcons[sportId] || 'fa-solid fa-medal'
}

function getGradient(sportId) {
  return sportGradients[sportId] || 'linear-gradient(135deg, #60a5fa, #3b82f6)'
}

function getTop3(sportId) {
  if (!dashboardSummary.value) return []
  const sportKeyMap = {
    'ski-jumping': 'skiJumping',
    'biathlon': 'biathlon',
    'cross-country': 'crossCountry',
    'alpine-skiing': 'alpine',
    'bobsleigh': 'bobsleigh',
    'nordic-combined': 'nordicCombined',
    'speed-skating': 'speedSkating',
    'luge': 'luge',
    'skeleton': 'skeleton'
  }
  const key = sportKeyMap[sportId]
  return key ? (dashboardSummary.value[key]?.top3 || []) : []
}

function getRaceProgress(sportId) {
  if (!dashboardSummary.value) return null
  const sportKeyMap = {
    'ski-jumping': 'skiJumping',
    'biathlon': 'biathlon',
    'cross-country': 'crossCountry',
    'alpine-skiing': 'alpine',
    'bobsleigh': 'bobsleigh',
    'nordic-combined': 'nordicCombined',
    'speed-skating': 'speedSkating',
    'luge': 'luge',
    'skeleton': 'skeleton'
  }
  const key = sportKeyMap[sportId]
  if (!key) return null
  const data = dashboardSummary.value[key]
  if (data?.racesTotal > 0) {
    return {
      completed: data.racesCompleted || 0,
      total: data.racesTotal,
      remaining: data.racesTotal - (data.racesCompleted || 0)
    }
  }
  return null
}

function navigateToSport(sportId) {
  router.push(`/world/${route.params.id}/sport/${sportId}`)
}

function navigateToEvent(sportId, eventId) {
  router.push(`/world/${route.params.id}/sport/${sportId}`)
}

// Week calendar helper functions
function getDayName(dateString) {
  const date = new Date(dateString + 'T00:00:00Z')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getUTCDay()]
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00Z')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`
}

function getSportIcon(sportId) {
  return sportIcons[sportId] || 'fa-solid fa-medal'
}

function getSportGradient(sportId) {
  return sportGradients[sportId] || 'linear-gradient(135deg, #60a5fa, #3b82f6)'
}

function goBack() {
  router.push('/dashboard')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// Teams functions
async function loadTeams() {
  loadingTeams.value = true
  try {
    const response = await fetch(`/api/teams/world/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      teams.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load teams:', error)
  } finally {
    loadingTeams.value = false
  }
}

function openCreateTeamModal() {
  editingTeam.value = null
  teamForm.value = {
    name: '',
    shortName: '',
    color: '#3b82f6',
    description: ''
  }
  showTeamModal.value = true
}

function openEditTeamModal(team) {
  editingTeam.value = team
  teamForm.value = {
    name: team.name,
    shortName: team.short_name || '',
    color: team.color || '#3b82f6',
    description: team.description || ''
  }
  showTeamModal.value = true
}

function closeTeamModal() {
  showTeamModal.value = false
  editingTeam.value = null
}

async function saveTeam() {
  if (!teamForm.value.name) return

  savingTeam.value = true
  try {
    const url = editingTeam.value
      ? `/api/teams/${editingTeam.value.id}`
      : `/api/teams/world/${route.params.id}`

    const response = await fetch(url, {
      method: editingTeam.value ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(teamForm.value)
    })

    if (response.ok) {
      await loadTeams()
      closeTeamModal()
    }
  } catch (error) {
    console.error('Failed to save team:', error)
  } finally {
    savingTeam.value = false
  }
}

function confirmDeleteTeam(team) {
  teamToDelete.value = team
  showDeleteTeamModal.value = true
}

async function deleteTeam() {
  if (!teamToDelete.value) return

  deletingTeam.value = true
  try {
    const response = await fetch(`/api/teams/${teamToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      await loadTeams()
      showDeleteTeamModal.value = false
      teamToDelete.value = null
    }
  } catch (error) {
    console.error('Failed to delete team:', error)
  } finally {
    deletingTeam.value = false
  }
}

// Season generation functions
async function generateAllSeasons() {
  generatingSeasoning.value = true
  try {
    const response = await fetch(`/api/worlds/${route.params.id}/generate-all-seasons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Seasons generated:', result)
      // Refresh data
      await Promise.all([
        worldsStore.fetchDashboardSummary(route.params.id),
        weekStatusStore.fetchWeekStatus(route.params.id)
      ])
    } else {
      const error = await response.json()
      console.error('Failed to generate seasons:', error)
    }
  } catch (error) {
    console.error('Failed to generate seasons:', error)
  } finally {
    generatingSeasoning.value = false
  }
}

function confirmResetSeasons() {
  showResetSeasonsModal.value = true
}

async function resetAllSeasons() {
  resettingSeasons.value = true
  try {
    const response = await fetch(`/api/worlds/${route.params.id}/reset-all-seasons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Seasons reset:', result)
      showResetSeasonsModal.value = false
      // Refresh data
      await Promise.all([
        worldsStore.fetchDashboardSummary(route.params.id),
        weekStatusStore.fetchWeekStatus(route.params.id)
      ])
    } else {
      const error = await response.json()
      console.error('Failed to reset seasons:', error)
    }
  } catch (error) {
    console.error('Failed to reset seasons:', error)
  } finally {
    resettingSeasons.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      worldsStore.fetchWorld(route.params.id),
      sportsStore.fetchSports(),
      worldsStore.fetchDashboardSummary(route.params.id),
      weekStatusStore.fetchWeekStatus(route.params.id),
      loadTeams()
    ])
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
  color: var(--primary-600);
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
  background: var(--primary-50);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.world-name i {
  color: var(--primary-500);
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

/* Next Events Section */
.next-events-section {
  margin-bottom: 2.5rem;
}

.next-events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.next-event-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--gray-100);
}

.next-event-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-200);
}

.event-sport-badge {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.event-sport-badge i {
  font-size: 1.25rem;
  color: white;
}

.event-sport-badge i.ski-jump-icon {
  transform: rotate(-30deg);
}

.event-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.event-sport-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-400);
}

.event-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--gray-800);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--gray-500);
}

.event-flag {
  width: 1rem;
  height: 0.75rem;
  object-fit: cover;
  border-radius: 2px;
}

.event-arrow {
  color: var(--gray-300);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.next-event-card:hover .event-arrow {
  color: var(--primary-500);
  transform: translateX(2px);
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
  color: var(--primary-500);
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
  cursor: pointer;
  transition: all 0.3s;
}

.sport-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

.sport-icon i.ski-jump-icon {
  transform: rotate(-30deg);
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
  margin-bottom: 0.75rem;
}

/* Season Progress */
.season-progress {
  background: var(--primary-50);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.5rem;
}

.progress-header i {
  color: var(--primary-500);
  font-size: 0.875rem;
}

.progress-count {
  margin-left: auto;
  color: var(--primary-600);
  font-weight: 700;
}

.progress-bar-container {
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.375rem;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-align: right;
}

/* Sport Standings */
.sport-standings {
  background: var(--gray-50);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.standings-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.5rem;
}

.standings-header i {
  color: var(--primary-500);
  font-size: 0.875rem;
}

.standings-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.standings-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.standings-position {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.6875rem;
  color: white;
  background: var(--gray-400);
}

.standings-position.pos-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.standings-position.pos-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.standings-position.pos-3 {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.standings-flag {
  width: 1rem;
  height: 0.75rem;
  object-fit: cover;
  border-radius: 2px;
}

.standings-name {
  flex: 1;
  font-weight: 500;
  color: var(--gray-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standings-points {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: 500;
}

.sport-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-600);
  font-weight: 500;
  font-size: 0.875rem;
}

.sport-action i {
  transition: transform 0.2s;
}

.sport-card:hover .sport-action i {
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
  color: var(--primary-500);
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

/* Teams Section */
.teams-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--gray-200);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-header .section-title {
  margin-bottom: 0;
}

.loading-state-small {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

.loading-state-small i {
  margin-right: 0.5rem;
  color: var(--primary-500);
}

.empty-teams {
  text-align: center;
  padding: 3rem;
  background: var(--gray-50);
  border-radius: 1rem;
  border: 2px dashed var(--gray-200);
}

.empty-icon {
  font-size: 3rem;
  color: var(--gray-300);
  margin-bottom: 1rem;
}

.empty-teams p {
  color: var(--gray-500);
  max-width: 400px;
  margin: 0 auto;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.team-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.team-color-bar {
  height: 6px;
}

.team-content {
  padding: 1.25rem;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.team-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.team-short {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.team-description {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.team-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.team-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.team-stat i {
  color: var(--primary-500);
}

.team-sports-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-100);
}

.sport-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--gray-500);
  background: var(--gray-50);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.sport-count i {
  font-size: 0.7rem;
}

.team-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-100);
}

.team-actions .btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.text-danger {
  color: var(--error) !important;
}

.text-danger:hover {
  background: #fee2e2 !important;
}

/* Team Modal */
.team-modal {
  max-width: 480px;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 48px;
  height: 40px;
  padding: 0;
  border: 2px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  border: 1px solid var(--gray-200);
}

.color-hex {
  flex: 1;
  font-family: monospace;
}

/* Confirm Modal */
.confirm-modal {
  max-width: 400px;
}

.confirm-modal .modal-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--error);
}

.confirm-modal .modal-body p {
  margin-bottom: 0.5rem;
}

.text-muted {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.btn-danger {
  background: var(--error);
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-danger:disabled {
  background: #fca5a5;
}

/* Dashboard Tabs */
.dashboard-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 0.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  color: var(--gray-500);
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.tab-btn.active {
  background: var(--primary-500);
  color: white;
}

.tab-btn i {
  font-size: 1rem;
}

.tab-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-btn:not(.active) .tab-badge {
  background: var(--gray-100);
  color: var(--gray-600);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

/* This Week Tab */
.this-week-tab {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.week-header {
  margin-bottom: 1.5rem;
}

.week-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.week-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.week-title i {
  font-size: 1.5rem;
  color: var(--primary-500);
}

.week-title h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.week-progress {
  background: var(--primary-50);
  border-radius: 0.75rem;
  padding: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 500;
}

.progress-percent {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-600);
}

/* Week Calendar Grid */
.week-calendar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.day-column {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
  min-height: 120px;
}

.day-column.has-events {
  background: var(--primary-50);
}

.day-header {
  text-align: center;
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-200);
}

.day-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
}

.day-date {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.day-column.has-events .day-header {
  border-color: var(--primary-200);
}

.day-column.has-events .day-name {
  color: var(--primary-700);
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.week-event-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--gray-100);
}

.week-event-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-200);
}

.week-event-card.completed {
  opacity: 0.7;
}

.event-sport-icon {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.event-sport-icon i {
  font-size: 0.875rem;
  color: white;
}

.week-event-card .event-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.event-sport-name {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--gray-400);
}

.week-event-card .event-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--gray-800);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.week-event-card .event-location {
  font-size: 0.75rem;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.event-status-indicator {
  flex-shrink: 0;
}

.event-status-indicator i {
  font-size: 1rem;
}

.event-status-indicator .completed {
  color: var(--success);
}

.event-status-indicator .in-progress {
  color: var(--warning);
}

.event-status-indicator .scheduled {
  color: var(--gray-300);
}

.no-events-message {
  text-align: center;
  padding: 3rem;
  color: var(--gray-500);
}

.no-events-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--gray-300);
  display: block;
}

.no-events-message p {
  margin: 0.25rem 0;
}

.no-events-message .btn {
  margin-top: 1.5rem;
}

.btn-lg {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
}

.reset-btn {
  color: var(--gray-500);
  font-size: 0.8125rem;
}

.reset-btn:hover {
  color: var(--error);
  background: #fee2e2;
}

.week-complete-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
}

.week-complete-banner i {
  font-size: 1.25rem;
}

/* All Sports Tab adjustments */
.all-sports-tab .next-events-section,
.all-sports-tab .sports-section {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

/* Teams Tab adjustments */
.teams-tab .teams-section {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

@media (max-width: 768px) {
  .dashboard-tabs {
    flex-direction: column;
  }

  .tab-btn {
    justify-content: center;
  }

  .week-calendar {
    grid-template-columns: 1fr;
  }
}
</style>
