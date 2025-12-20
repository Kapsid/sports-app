<template>
  <div class="sport-page bobsleigh">
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
          <span class="sport-name">
            <i class="fa-solid fa-sled"></i>
            Bobsleigh
          </span>
        </div>
        <div class="user-menu">
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Navigation -->
    <nav class="main-nav">
      <div class="container">
        <div class="nav-tabs">
          <button
            :class="['nav-tab', { active: activeTab === 'season' }]"
            @click="activeTab = 'season'; loadSeason()"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-calendar-days"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Calendar</span>
              <span class="nav-tab-badge" v-if="nextEvent">
                <i class="fa-solid fa-circle"></i> {{ completedEventsCount }}/{{ seasonEvents.length }}
              </span>
            </div>
          </button>
          <button
            :class="['nav-tab', { active: activeTab === 'standings' }]"
            @click="activeTab = 'standings'; loadSeason()"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-ranking-star"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Standings</span>
              <span class="nav-tab-leader" v-if="seasonStandings.length > 0">
                <img :src="`/flags/${seasonStandings[0].country}.png`" class="leader-flag" />
                {{ seasonStandings[0].teamName }}
              </span>
            </div>
          </button>
          <button
            :class="['nav-tab', { active: activeTab === 'teams' }]"
            @click="activeTab = 'teams'"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-people-group"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Teams</span>
              <span class="nav-tab-badge" v-if="teams.length > 0">
                {{ teams.length }} sleds
              </span>
            </div>
          </button>
        </div>
      </div>
    </nav>

    <main class="page-main">
      <div class="container">

        <!-- Season Tab -->
        <div v-if="activeTab === 'season'" class="tab-content fade-in">
          <div v-if="loadingSeason" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading season...
          </div>

          <div v-else-if="!currentSeason" class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-trophy"></i></div>
            <h3>No Active Season</h3>
            <p>Start a new Bobsleigh World Cup season to begin competing.</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason || teams.length === 0">
              <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingSeason ? 'Creating...' : 'Start New Season' }}
            </button>
            <p v-if="teams.length === 0" class="warning-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Create teams first before starting a season.
            </p>
          </div>

          <div v-else class="season-content">
            <div class="season-header-card">
              <div class="season-info">
                <h2><i class="fa-solid fa-sled bobsleigh-icon"></i> Bobsleigh World Cup {{ currentSeason.name }}</h2>
                <div class="season-progress">
                  <span class="progress-text">{{ completedEventsCount }} / {{ seasonEvents.length }} races completed</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                  </div>
                </div>
              </div>
              <div class="season-actions" v-if="currentSeason">
                <button @click="showResetConfirm = true" class="btn btn-ghost btn-sm text-danger">
                  <i class="fa-solid fa-rotate-left"></i>
                  Reset Season
                </button>
              </div>
            </div>

            <div class="calendar-full">
              <div class="calendar-grid">
                <div
                  v-for="(event, index) in seasonEvents"
                  :key="event.id"
                  :class="['calendar-event', event.status, { 'is-locked': weekStatusStore.isEventLocked(event.date) }]"
                  @click="handleEventClick(event)"
                >
                  <div v-if="weekStatusStore.isEventLocked(event.date)" class="lock-overlay">
                    <i class="fa-solid fa-lock"></i>
                    <span>Week Locked</span>
                  </div>
                  <div class="calendar-event-header">
                    <span class="event-number-badge">{{ index + 1 }}</span>
                    <span class="event-type-badge">
                      <i class="fa-solid fa-sled"></i> 4-Man
                    </span>
                    <span class="event-status-badge" :class="event.status">
                      <i v-if="event.status === 'completed'" class="fa-solid fa-check"></i>
                      <i v-else-if="event.status === 'run1_completed'" class="fa-solid fa-pause"></i>
                      <i v-else-if="event.status === 'in_progress'" class="fa-solid fa-play"></i>
                      <i v-else class="fa-solid fa-clock"></i>
                    </span>
                  </div>
                  <div class="calendar-event-body">
                    <div class="event-location">
                      <img :src="`/flags/${event.country}.png`" class="event-flag-large" />
                      <div class="location-details">
                        <span class="location-name">{{ event.location }}</span>
                        <span class="location-country">{{ countryNames[event.country] || event.country }}</span>
                      </div>
                    </div>
                    <div class="event-track-info">
                      <span class="track-length">{{ event.track_length }}m track</span>
                    </div>
                    <div class="event-date-display">
                      <i class="fa-solid fa-calendar-day"></i>
                      {{ formatDate(event.date) }}
                    </div>
                  </div>
                  <div v-if="event.status === 'completed' && getEventPodium(event).length > 0" class="calendar-event-podium">
                    <div v-for="(podium, pIndex) in getEventPodium(event)" :key="podium.teamId" class="podium-item">
                      <span :class="['podium-pos', pIndex === 0 ? 'gold' : pIndex === 1 ? 'silver' : 'bronze']">
                        {{ pIndex + 1 }}
                      </span>
                      <img :src="`/flags/${podium.country}.png`" class="podium-flag-sm" />
                      <span class="podium-name">{{ podium.teamName }}</span>
                    </div>
                  </div>
                  <div class="calendar-event-footer">
                    <button class="btn btn-sm" :class="getEventButtonClass(event)">
                      <i :class="getEventButtonIcon(event)"></i>
                      {{ getEventButtonText(event) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Standings Tab -->
        <div v-if="activeTab === 'standings'" class="tab-content fade-in">
          <div class="standings-compact">
            <div class="standings-header">
              <h2><i class="fa-solid fa-trophy"></i> World Cup Standings</h2>
              <span class="races-info" v-if="seasonStandings.length">{{ completedEventsCount }} races</span>
            </div>

            <!-- Standings View Switcher -->
            <div class="standings-switcher">
              <button
                :class="['standings-switch', { active: standingsView === 'sleds' }]"
                @click="standingsView = 'sleds'"
              >
                <i class="fa-solid fa-sled"></i>
                <span>Sleds</span>
              </button>
              <button
                :class="['standings-switch teams', { active: standingsView === 'teams' }]"
                @click="standingsView = 'teams'; loadGlobalTeamStandings()"
              >
                <i class="fa-solid fa-people-group"></i>
                <span>Teams</span>
              </button>
            </div>

            <!-- Sled Standings -->
            <div v-if="standingsView === 'sleds'" class="standings-panel">
              <div v-if="seasonStandings.length === 0" class="no-standings">
                <i class="fa-solid fa-trophy"></i>
                <p>No standings yet. Simulate your first race!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(standing, index) in seasonStandings"
                  :key="standing.teamId"
                  :class="['standing-row', { 'top-3': index < 3 }]"
                >
                  <div class="standing-rank">
                    <span v-if="index === 0" class="medal gold">1</span>
                    <span v-else-if="index === 1" class="medal silver">2</span>
                    <span v-else-if="index === 2" class="medal bronze">3</span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <img :src="`/flags/${standing.country}.png`" class="standing-flag-sm" />
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ standing.teamName }}</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts">{{ standing.points }}</span>
                    <span class="standing-races-sm">{{ standing.races || 0 }}r</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Global Team Standings -->
            <div v-if="standingsView === 'teams'" class="standings-panel teams-panel">
              <div v-if="globalTeamStandings.length === 0" class="no-standings">
                <i class="fa-solid fa-people-group"></i>
                <p>No team standings yet. Complete some events first!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(team, index) in globalTeamStandings"
                  :key="team.teamId"
                  :class="['standing-row', { 'top-3': index < 3 }]"
                >
                  <div class="standing-rank">
                    <span v-if="index < 3" :class="['medal', index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze']">
                      {{ index + 1 }}
                    </span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <div class="team-logo-sm" :style="{ backgroundColor: team.color }">
                    {{ team.abbreviation }}
                  </div>
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ team.teamName }}</span>
                    <span class="standing-firstname">{{ team.athleteCount }} sleds</span>
                  </div>
                  <div class="standing-stats">
                    <span class="standing-points">{{ team.totalPoints }} pts</span>
                    <span class="standing-races">{{ team.wins }}W {{ team.podiums }}P</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Teams Tab -->
        <div v-if="activeTab === 'teams'" class="tab-content fade-in">
          <div class="teams-section">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fa-solid fa-people-group"></i>
                Bobsleigh Teams
              </h2>
              <button @click="openCreateTeamModal" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i>
                Add Team
              </button>
            </div>

            <div v-if="teams.length === 0" class="empty-teams">
              <div class="empty-icon">
                <i class="fa-solid fa-sled"></i>
              </div>
              <h3>No Bobsleigh Teams Yet</h3>
              <p>Create your first bobsleigh team to start competing.</p>
              <button @click="openCreateTeamModal" class="btn btn-primary btn-lg">
                <i class="fa-solid fa-plus"></i>
                Create First Team
              </button>
            </div>

            <div v-else class="teams-grid">
              <div
                v-for="team in teams"
                :key="team.id"
                class="team-card"
              >
                <div class="team-header">
                  <img :src="`/flags/${team.country}.png`" class="team-flag" />
                  <div class="team-info">
                    <h3>{{ team.name }}</h3>
                    <span class="team-country">{{ getCountryName(team.country) }}</span>
                  </div>
                </div>
                <div class="team-crew">
                  <div class="crew-member">
                    <span class="crew-role">Pilot</span>
                    <span class="crew-name">{{ team.runner1_name }}</span>
                  </div>
                  <div class="crew-member">
                    <span class="crew-role">Brakeman</span>
                    <span class="crew-name">{{ team.runner2_name }}</span>
                  </div>
                  <div class="crew-member">
                    <span class="crew-role">Pusher 1</span>
                    <span class="crew-name">{{ team.runner3_name }}</span>
                  </div>
                  <div class="crew-member">
                    <span class="crew-role">Pusher 2</span>
                    <span class="crew-name">{{ team.runner4_name }}</span>
                  </div>
                </div>
                <div class="team-stats">
                  <div class="stat">
                    <span class="stat-label">Push</span>
                    <span class="stat-value">{{ team.skill_push }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Pilot</span>
                    <span class="stat-value">{{ team.skill_pilot }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Crew</span>
                    <span class="stat-value">{{ team.skill_crew }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Cons.</span>
                    <span class="stat-value">{{ team.consistency }}</span>
                  </div>
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
          <div class="form-row">
            <div class="form-group flex-2">
              <label>Team Name *</label>
              <input v-model="teamForm.name" type="text" placeholder="e.g., Germany 1" required />
            </div>
            <div class="form-group flex-1">
              <label>Country *</label>
              <select v-model="teamForm.country" required>
                <option value="">Select...</option>
                <option v-for="(name, code) in countryNames" :key="code" :value="code">{{ name }}</option>
              </select>
            </div>
          </div>
          <div class="form-section">
            <h4><i class="fa-solid fa-users"></i> Crew Members</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Pilot *</label>
                <input v-model="teamForm.runner1_name" type="text" placeholder="Pilot name" required />
              </div>
              <div class="form-group">
                <label>Brakeman *</label>
                <input v-model="teamForm.runner2_name" type="text" placeholder="Brakeman name" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Pusher 1 *</label>
                <input v-model="teamForm.runner3_name" type="text" placeholder="Pusher 1 name" required />
              </div>
              <div class="form-group">
                <label>Pusher 2 *</label>
                <input v-model="teamForm.runner4_name" type="text" placeholder="Pusher 2 name" required />
              </div>
            </div>
          </div>
          <div class="form-section">
            <h4><i class="fa-solid fa-chart-line"></i> Skills (1-100)</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Push Start</label>
                <input v-model.number="teamForm.skill_push" type="number" min="1" max="100" />
              </div>
              <div class="form-group">
                <label>Piloting</label>
                <input v-model.number="teamForm.skill_pilot" type="number" min="1" max="100" />
              </div>
              <div class="form-group">
                <label>Crew Work</label>
                <input v-model.number="teamForm.skill_crew" type="number" min="1" max="100" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Consistency</label>
                <input v-model.number="teamForm.consistency" type="number" min="1" max="100" />
              </div>
              <div class="form-group">
                <label>Form</label>
                <input v-model.number="teamForm.form" type="number" min="1" max="100" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeTeamModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveTeam" class="btn btn-primary" :disabled="savingTeam || !isTeamFormValid">
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
          <p class="text-muted">This cannot be undone.</p>
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

    <!-- Race Animation Modal -->
    <div v-if="showRaceModal" class="race-animation-overlay" @click.self="closeRaceModal">
      <div class="race-animation-modal">
        <!-- Header -->
        <div class="race-header">
          <div class="race-venue">
            <img :src="`/flags/${selectedEvent?.country}.png`" class="venue-flag" />
            <div class="venue-info">
              <h2>{{ selectedEvent?.location }}</h2>
              <span class="venue-details">
                <i class="fa-solid fa-sled"></i> 4-Man Bobsled
                <span class="track-length">{{ selectedEvent?.track_length }}m</span>
              </span>
            </div>
          </div>
          <div class="run-indicator">
            <span :class="['run-badge', { active: currentRun === 1 }]">Run 1</span>
            <span :class="['run-badge', { active: currentRun === 2 }]">Run 2</span>
            <template v-if="isFourRunEvent">
              <span :class="['run-badge', { active: currentRun === 3 }]">Run 3</span>
              <span :class="['run-badge', { active: currentRun === 4 }]">Run 4</span>
            </template>
          </div>
          <button @click="closeRaceModal" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Main Content -->
        <div class="race-content">
          <!-- Run Finished or Completed Race: Show Combined Results -->
          <div v-if="runFinished || (selectedEvent?.status === 'completed' && !raceStarted)" class="run-results-section">
            <div class="run-results-header">
              <h3>
                <i class="fa-solid fa-flag-checkered"></i>
                {{ selectedEvent?.status === 'completed' ? 'Race Results' : (isLastRun ? 'Final Results' : `Run ${currentRun} Complete`) }}
              </h3>
              <button
                v-if="runFinished"
                @click="finishRun"
                class="btn btn-finish"
                :disabled="simulating"
              >
                <i class="fa-solid fa-check"></i>
                {{ isLastRun ? 'Save Results' : `Continue to Run ${currentRun + 1}` }}
              </button>
            </div>
            <div class="run-results-table" :class="{ 'four-run': isFourRunEvent }">
              <div class="results-table-header" :class="{ 'with-total': showTotalColumn, 'four-run': isFourRunEvent }">
                <span class="col-pos">Pos</span>
                <span class="col-team">Team</span>
                <!-- For single run display (Run 1 just finished), show just Time -->
                <span class="col-run" v-if="!showTotalColumn">Time</span>
                <!-- For multi-run display, show individual run columns -->
                <template v-if="showTotalColumn">
                  <span class="col-run">Run 1</span>
                  <span class="col-run" v-if="currentRun >= 2 || selectedEvent?.status === 'completed'">Run 2</span>
                  <span class="col-run" v-if="isFourRunEvent && (currentRun >= 3 || selectedEvent?.status === 'completed')">Run 3</span>
                  <span class="col-run" v-if="isFourRunEvent && (currentRun >= 4 || selectedEvent?.status === 'completed')">Run 4</span>
                  <span class="col-total">Total</span>
                </template>
                <span class="col-diff">Diff</span>
              </div>
              <div
                v-for="(result, idx) in displayResults"
                :key="result.teamId"
                :class="['results-table-row', { 'podium': idx < 3, 'with-total': showTotalColumn, 'four-run': isFourRunEvent }]"
              >
                <span class="col-pos" :class="getPosClass(idx + 1)">{{ idx + 1 }}</span>
                <div class="col-team">
                  <img :src="`/flags/${result.country}.png`" class="result-flag" />
                  <span class="result-name">{{ result.teamName }}</span>
                </div>
                <!-- Single run time (Run 1 just finished) -->
                <span class="col-run" v-if="!showTotalColumn">{{ result.timeFormatted || formatTime(result.time) || '-' }}</span>
                <!-- Multi-run columns -->
                <template v-if="showTotalColumn">
                  <span class="col-run">{{ result.run1Formatted || formatTime(result.run1Time) || formatTime(result.time) || '-' }}</span>
                  <span class="col-run" v-if="currentRun >= 2 || selectedEvent?.status === 'completed'">{{ result.run2Formatted || formatTime(result.run2Time) || '-' }}</span>
                  <span class="col-run" v-if="isFourRunEvent && (currentRun >= 3 || selectedEvent?.status === 'completed')">{{ result.run3Formatted || formatTime(result.run3Time) || '-' }}</span>
                  <span class="col-run" v-if="isFourRunEvent && (currentRun >= 4 || selectedEvent?.status === 'completed')">{{ result.run4Formatted || formatTime(result.run4Time) || '-' }}</span>
                  <span class="col-total">{{ result.totalFormatted || formatTime(result.totalTime) }}</span>
                </template>
                <span class="col-diff" :class="{ 'leader': idx === 0 }">
                  {{ idx === 0 ? '-' : '+' + getDiffFromLeader(result, displayResults[0]) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Left: Track Animation (hidden when run finished) -->
          <div v-else class="track-section">
            <!-- SVG Bobsleigh Track -->
            <div class="track-container">
              <svg viewBox="0 0 500 300" class="bobsleigh-track-svg">
                <defs>
                  <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#e0f2fe" />
                    <stop offset="50%" style="stop-color:#bae6fd" />
                    <stop offset="100%" style="stop-color:#7dd3fc" />
                  </linearGradient>
                  <linearGradient id="trackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#334155" />
                    <stop offset="100%" style="stop-color:#1e293b" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <!-- Background -->
                <rect x="0" y="0" width="500" height="300" fill="url(#iceGradient)" />

                <!-- Track walls (outer) -->
                <path
                  d="M 30 40
                     Q 60 50, 80 80
                     Q 120 140, 160 130
                     Q 200 120, 230 160
                     Q 270 210, 320 190
                     Q 370 170, 400 210
                     Q 440 260, 480 250"
                  fill="none"
                  stroke="#475569"
                  stroke-width="28"
                  stroke-linecap="round"
                />

                <!-- Track ice surface -->
                <path
                  d="M 30 40
                     Q 60 50, 80 80
                     Q 120 140, 160 130
                     Q 200 120, 230 160
                     Q 270 210, 320 190
                     Q 370 170, 400 210
                     Q 440 260, 480 250"
                  fill="none"
                  stroke="#e2e8f0"
                  stroke-width="20"
                  stroke-linecap="round"
                  class="track-ice"
                />

                <!-- Track center line -->
                <path
                  d="M 30 40
                     Q 60 50, 80 80
                     Q 120 140, 160 130
                     Q 200 120, 230 160
                     Q 270 210, 320 190
                     Q 370 170, 400 210
                     Q 440 260, 480 250"
                  fill="none"
                  stroke="#94a3b8"
                  stroke-width="1"
                  stroke-dasharray="8,4"
                />

                <!-- Section markers -->
                <g class="section-markers">
                  <circle cx="80" cy="80" r="3" fill="#64748b" />
                  <text x="80" y="65" text-anchor="middle" fill="#64748b" font-size="8">S1</text>

                  <circle cx="160" cy="130" r="3" fill="#64748b" />
                  <text x="160" y="115" text-anchor="middle" fill="#64748b" font-size="8">S2</text>

                  <circle cx="230" cy="160" r="3" fill="#64748b" />
                  <text x="230" y="145" text-anchor="middle" fill="#64748b" font-size="8">S3</text>

                  <circle cx="320" cy="190" r="3" fill="#64748b" />
                  <text x="320" y="175" text-anchor="middle" fill="#64748b" font-size="8">S4</text>

                  <circle cx="400" cy="210" r="3" fill="#64748b" />
                  <text x="400" y="195" text-anchor="middle" fill="#64748b" font-size="8">S5</text>
                </g>

                <!-- Start gate -->
                <rect x="20" y="30" width="25" height="8" fill="#22c55e" rx="2" />
                <text x="32" y="26" text-anchor="middle" fill="#22c55e" font-size="8" font-weight="bold">START</text>

                <!-- Finish line -->
                <line x1="475" y1="240" x2="485" y2="260" stroke="#ef4444" stroke-width="3" />
                <text x="480" y="275" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="bold">FINISH</text>

                <!-- Animated Bobsled -->
                <g class="bobsled" :transform="`translate(${sledPosition.x}, ${sledPosition.y}) rotate(${sledRotation})`">
                  <ellipse cx="0" cy="0" rx="12" ry="6" fill="#3b82f6" filter="url(#glow)" />
                  <ellipse cx="0" cy="0" rx="8" ry="4" fill="#60a5fa" />
                  <!-- Speed trail -->
                  <ellipse v-if="animating" cx="-15" cy="0" rx="6" ry="3" fill="#3b82f6" opacity="0.4" />
                  <ellipse v-if="animating" cx="-22" cy="0" rx="4" ry="2" fill="#3b82f6" opacity="0.2" />
                </g>
              </svg>
            </div>

            <!-- Live Timing Display -->
            <div class="timing-display">
              <div class="current-team" v-if="currentTeam">
                <img :src="`/flags/${currentTeam.country}.png`" class="team-flag-lg" />
                <div class="team-details">
                  <span class="team-name-lg">{{ currentTeam.name }}</span>
                  <span class="bib-number">BIB {{ currentBib }}</span>
                </div>
              </div>

              <div class="live-time" :class="{ running: animating, finished: currentResult }">
                <div class="time-value">{{ displayTime }}</div>
                <div class="split-times" v-if="splitTimes.length > 0">
                  <span v-for="(split, idx) in splitTimes" :key="idx" class="split" :class="getSplitClass(split.diff)">
                    S{{ idx + 1 }}: {{ split.time }}
                    <span v-if="split.diff !== null" class="split-diff">{{ formatSplitDiff(split.diff) }}</span>
                  </span>
                </div>
              </div>

              <div class="result-display" v-if="currentResult && !animating">
                <div class="final-time">
                  <span class="time-label">Run {{ currentRun }} Time</span>
                  <span class="time-big" :class="{ dnf: currentResult.dnf }">{{ currentResult.timeFormatted }}</span>
                </div>
                <div class="position-display" v-if="!currentResult.dnf">
                  <span class="position-label">Current Position</span>
                  <span class="position-big" :class="getPosClass(currentResult.position)">{{ currentResult.position }}</span>
                </div>
                <div class="diff-display" v-if="currentResult.timeBehind > 0">
                  <span class="diff-value">+{{ currentResult.timeBehind.toFixed(2) }}</span>
                  <span class="diff-label">behind leader</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button
                v-if="!raceStarted && selectedEvent?.status === 'scheduled'"
                @click="startRace(1)"
                class="btn btn-start"
                :disabled="teams.length === 0"
              >
                <i class="fa-solid fa-flag-checkered"></i>
                Start Run 1
              </button>

              <button
                v-if="!raceStarted && selectedEvent?.status === 'run1_completed'"
                @click="startRace(2)"
                class="btn btn-start"
              >
                <i class="fa-solid fa-flag-checkered"></i>
                Start Run 2
              </button>

              <button
                v-if="!raceStarted && selectedEvent?.status === 'run2_completed'"
                @click="startRace(3)"
                class="btn btn-start"
              >
                <i class="fa-solid fa-flag-checkered"></i>
                Start Run 3
              </button>

              <button
                v-if="!raceStarted && selectedEvent?.status === 'run3_completed'"
                @click="startRace(4)"
                class="btn btn-start"
              >
                <i class="fa-solid fa-flag-checkered"></i>
                Start Run 4
              </button>

              <button
                v-if="raceStarted && !animating && hasNextTeam"
                @click="runNextTeam"
                class="btn btn-next"
              >
                <i class="fa-solid fa-forward"></i>
                Next Team ({{ remainingTeams }})
              </button>

              <button
                v-if="raceStarted && !hasNextTeam && !animating"
                @click="finishRun"
                class="btn btn-finish"
              >
                <i class="fa-solid fa-check"></i>
                {{ isLastRun ? 'Complete Race' : `Complete Run ${currentRun}` }}
              </button>
            </div>
          </div>

          <!-- Right: Standings & Start List (hidden when run finished or completed) -->
          <div v-if="!runFinished && !(selectedEvent?.status === 'completed' && !raceStarted)" class="standings-section">
            <!-- Start List (before race starts) -->
            <div v-if="!raceStarted" class="start-list-panel">
              <h3><i class="fa-solid fa-list-ol"></i> Start Order</h3>
              <div class="start-list">
                <div
                  v-for="(team, idx) in startOrder"
                  :key="team.id"
                  class="start-item"
                >
                  <span class="start-bib">{{ idx + 1 }}</span>
                  <img :src="`/flags/${team.country}.png`" class="start-flag" />
                  <span class="start-name">{{ team.name }}</span>
                </div>
              </div>
            </div>

            <!-- Live Standings (during race) -->
            <div v-else class="live-standings-panel">
              <h3>
                <i class="fa-solid fa-ranking-star"></i>
                {{ currentRun === 1 ? 'Run 1' : `Combined (${currentRun} runs)` }} Standings
              </h3>
              <div class="live-standings">
                <div
                  v-for="(result, idx) in liveStandings"
                  :key="result.teamId"
                  :class="['standing-item', {
                    'current': result.teamId === currentTeam?.id,
                    'just-finished': result.teamId === lastFinishedTeamId
                  }]"
                >
                  <span class="standing-pos" :class="getPosClass(idx + 1)">{{ idx + 1 }}</span>
                  <img :src="`/flags/${result.country}.png`" class="standing-flag" />
                  <span class="standing-name">{{ result.teamName }}</span>
                  <span class="standing-time">{{ currentRun >= 2 && result.totalTime ? formatTime(result.totalTime) : result.timeFormatted }}</span>
                  <span class="standing-diff" v-if="idx > 0">
                    +{{ currentRun >= 2 && result.totalTime
                      ? (result.totalTime - liveStandings[0].totalTime).toFixed(2)
                      : result.timeBehind?.toFixed(2) || '' }}
                  </span>
                </div>
              </div>

              <!-- Remaining teams -->
              <div class="remaining-panel" v-if="teamsYetToRun.length > 0">
                <h4>Yet to run ({{ teamsYetToRun.length }})</h4>
                <div class="remaining-list">
                  <div
                    v-for="team in teamsYetToRun.slice(0, 5)"
                    :key="team.id"
                    :class="['remaining-item', { 'next-up': team.id === nextTeam?.id }]"
                  >
                    <img :src="`/flags/${team.country}.png`" class="remaining-flag" />
                    <span>{{ team.name }}</span>
                  </div>
                  <div v-if="teamsYetToRun.length > 5" class="more-teams">
                    +{{ teamsYetToRun.length - 5 }} more
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Reset Season Confirm -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2>Reset Season</h2>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to reset the current season?</p>
          <p class="warning-text">All race results and standings will be cleared.</p>
        </div>
        <div class="modal-footer">
          <button @click="showResetConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleResetSeason" class="btn btn-danger">Reset Season</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useBobsleighStore } from '../stores/bobsleigh'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const bobsleighStore = useBobsleighStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)
const world = ref(null)
const activeTab = ref('season')

const teams = computed(() => bobsleighStore.teams)
const countryNames = computed(() => bobsleighStore.countryNames)

// Team management
const showTeamModal = ref(false)
const editingTeam = ref(null)
const teamForm = ref({
  name: '',
  country: '',
  runner1_name: '',
  runner2_name: '',
  runner3_name: '',
  runner4_name: '',
  skill_push: 70,
  skill_pilot: 70,
  skill_crew: 70,
  consistency: 70,
  form: 70
})
const savingTeam = ref(false)
const showDeleteTeamModal = ref(false)
const teamToDelete = ref(null)
const deletingTeam = ref(false)

const isTeamFormValid = computed(() => {
  return teamForm.value.name && teamForm.value.country &&
         teamForm.value.runner1_name && teamForm.value.runner2_name &&
         teamForm.value.runner3_name && teamForm.value.runner4_name
})

function getCountryName(code) {
  return countryNames.value[code] || code
}

function openCreateTeamModal() {
  editingTeam.value = null
  teamForm.value = {
    name: '',
    country: '',
    runner1_name: '',
    runner2_name: '',
    runner3_name: '',
    runner4_name: '',
    skill_push: 70,
    skill_pilot: 70,
    skill_crew: 70,
    consistency: 70,
    form: 70
  }
  showTeamModal.value = true
}

function openEditTeamModal(team) {
  editingTeam.value = team
  teamForm.value = {
    name: team.name,
    country: team.country,
    runner1_name: team.runner1_name,
    runner2_name: team.runner2_name,
    runner3_name: team.runner3_name,
    runner4_name: team.runner4_name,
    skill_push: team.skill_push,
    skill_pilot: team.skill_pilot,
    skill_crew: team.skill_crew,
    consistency: team.consistency,
    form: team.form
  }
  showTeamModal.value = true
}

function closeTeamModal() {
  showTeamModal.value = false
  editingTeam.value = null
}

async function saveTeam() {
  if (!isTeamFormValid.value) return

  savingTeam.value = true
  try {
    if (editingTeam.value) {
      await bobsleighStore.updateTeam(editingTeam.value.id, teamForm.value)
    } else {
      await bobsleighStore.createTeam(worldId.value, teamForm.value)
    }
    closeTeamModal()
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
    await bobsleighStore.deleteTeam(teamToDelete.value.id)
    showDeleteTeamModal.value = false
    teamToDelete.value = null
  } catch (error) {
    console.error('Failed to delete team:', error)
  } finally {
    deletingTeam.value = false
  }
}

// Season
const loadingSeason = ref(false)
const creatingSeason = ref(false)
const currentSeason = computed(() => bobsleighStore.currentSeason)
const seasonEvents = computed(() => bobsleighStore.events)
const seasonStandings = computed(() => bobsleighStore.standings)
const globalTeamStandings = computed(() => teamsStore.teamStandings)
const standingsView = ref('sleds')

// Race modal
const showRaceModal = ref(false)
const selectedEvent = ref(null)
const simulating = ref(false)
const run1Results = computed(() => selectedEvent.value?.run1_results || [])
const finalResults = computed(() => selectedEvent.value?.results || [])

// Animation state
const raceStarted = ref(false)
const currentRun = ref(1)
const animating = ref(false)
const startOrder = ref([])
const currentTeamIndex = ref(-1)
const currentTeam = ref(null)
const currentBib = ref(0)
const currentResult = ref(null)
const liveResults = ref([])
const lastFinishedTeamId = ref(null)
const sledPosition = ref({ x: 30, y: 40 })
const sledRotation = ref(0)
const displayTime = ref('0.00')
const splitTimes = ref([])
const leaderSplits = ref([])
const animationTimer = ref(null)

// Confirm modals
const showResetConfirm = ref(false)

// Computed
const completedEventsCount = computed(() => {
  return seasonEvents.value.filter(e => e.status === 'completed').length
})

const progressPercent = computed(() => {
  if (seasonEvents.value.length === 0) return 0
  return Math.round((completedEventsCount.value / seasonEvents.value.length) * 100)
})

const nextEvent = computed(() => {
  // Find the first event that is not completed
  return seasonEvents.value.find(e => e.status !== 'completed')
})

// Animation computed
const hasNextTeam = computed(() => {
  return currentTeamIndex.value < startOrder.value.length - 1
})

const remainingTeams = computed(() => {
  return startOrder.value.length - currentTeamIndex.value - 1
})

const nextTeam = computed(() => {
  if (currentTeamIndex.value < startOrder.value.length - 1) {
    return startOrder.value[currentTeamIndex.value + 1]
  }
  return null
})

const teamsYetToRun = computed(() => {
  return startOrder.value.slice(currentTeamIndex.value + 1)
})

const liveStandings = computed(() => {
  const results = [...liveResults.value]
  if (currentRun.value === 1) {
    // Sort by run 1 time
    return results.sort((a, b) => {
      if (a.dnf && b.dnf) return 0
      if (a.dnf) return 1
      if (b.dnf) return -1
      return a.time - b.time
    })
  } else {
    // Sort by combined time for runs 2, 3, 4
    return results.sort((a, b) => {
      if (a.totalTime === null && b.totalTime === null) return 0
      if (a.totalTime === null) return 1
      if (b.totalTime === null) return -1
      return a.totalTime - b.totalTime
    })
  }
})

const runFinished = computed(() => {
  return raceStarted.value && !hasNextTeam.value && !animating.value && liveResults.value.length > 0
})

// 4-run event support
const totalRuns = computed(() => selectedEvent.value?.runs || 2)
const isFourRunEvent = computed(() => totalRuns.value === 4)
const isLastRun = computed(() => currentRun.value === totalRuns.value)
const showTotalColumn = computed(() => {
  // Show total column when race is completed or when viewing results after run 2+
  return selectedEvent.value?.status === 'completed' || currentRun.value >= 2
})

const displayResults = computed(() => {
  // For completed races, use finalResults from the event
  if (selectedEvent.value?.status === 'completed' && !raceStarted.value) {
    return finalResults.value || []
  }
  // For active races, use liveStandings
  return liveStandings.value
})

// Methods
function getDiffFromLeader(result, leader) {
  if (!leader) return ''

  // For completed races or runs 2-4, use total time
  if (selectedEvent.value?.status === 'completed' || currentRun.value >= 2) {
    const resultTotal = result.totalTime
    const leaderTotal = leader.totalTime
    if (resultTotal && leaderTotal) {
      return (resultTotal - leaderTotal).toFixed(2)
    }
  }

  // For run 1, use time behind
  if (result.timeBehind !== undefined) {
    return result.timeBehind.toFixed(2)
  }

  // Fallback
  if (result.time && leader.time) {
    return (result.time - leader.time).toFixed(2)
  }

  return ''
}

function goBack() {
  router.push(`/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function loadSeason() {
  loadingSeason.value = true
  try {
    await bobsleighStore.fetchCurrentSeason(worldId.value)
  } catch (err) {
    console.error('Failed to load season:', err)
  } finally {
    loadingSeason.value = false
  }
}

async function loadGlobalTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'bobsleigh')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    await bobsleighStore.createSeason(worldId.value)
  } catch (err) {
    console.error('Failed to create season:', err)
  } finally {
    creatingSeason.value = false
  }
}

async function handleResetSeason() {
  if (!currentSeason.value) return
  try {
    await bobsleighStore.resetSeason(currentSeason.value.id)
  } catch (err) {
    console.error('Failed to reset season:', err)
  } finally {
    showResetConfirm.value = false
  }
}

function handleEventClick(event) {
  // Check if event is locked
  if (weekStatusStore.isEventLocked(event.date)) {
    alert(`This event is locked. Complete all events in ${weekStatusStore.formattedWeek} first.`)
    return
  }
  selectedEvent.value = { ...event }
  // Initialize start order based on event status
  if (event.status === 'scheduled') {
    // Shuffle for run 1
    startOrder.value = shuffleArray([...teams.value])
    currentRun.value = 1
  } else if (event.status === 'run1_completed') {
    // Reverse order for run 2 (last place goes first)
    const run1 = event.run1_results || []
    const nonDnf = run1.filter(r => !r.dnf).reverse()
    const dnf = run1.filter(r => r.dnf)
    startOrder.value = [...nonDnf, ...dnf].map(r => teams.value.find(t => t.id === r.teamId)).filter(Boolean)
    currentRun.value = 2
  }
  showRaceModal.value = true
}

function closeRaceModal() {
  showRaceModal.value = false
  selectedEvent.value = null
  resetAnimationState()
}

function resetAnimationState() {
  raceStarted.value = false
  animating.value = false
  currentTeamIndex.value = -1
  currentTeam.value = null
  currentBib.value = 0
  currentResult.value = null
  liveResults.value = []
  lastFinishedTeamId.value = null
  sledPosition.value = { x: 30, y: 40 }
  sledRotation.value = 0
  displayTime.value = '0.00'
  splitTimes.value = []
  leaderSplits.value = []
  if (animationTimer.value) {
    clearInterval(animationTimer.value)
    animationTimer.value = null
  }
}

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function startRace(run) {
  currentRun.value = run
  raceStarted.value = true
  currentTeamIndex.value = -1
  liveResults.value = []
  leaderSplits.value = []

  if (run === 2) {
    // Load run 1 results for combined times
    const run1 = selectedEvent.value?.run1_results || []
    liveResults.value = run1.map(r => ({
      ...r,
      run1Time: r.time,
      run1Formatted: r.timeFormatted,
      totalTime: null,
      totalFormatted: null
    }))
  } else if (run === 3) {
    // Load run 1 and run 2 results for combined times
    const run1 = selectedEvent.value?.run1_results || []
    const run2 = selectedEvent.value?.run2_results || []
    const run1Map = new Map()
    run1.forEach(r => run1Map.set(r.teamId, r))

    liveResults.value = run2.filter(r => !r.dnf).map(r2 => {
      const r1 = run1Map.get(r2.teamId)
      return {
        ...r2,
        run1Time: r1?.time || r2.run1Time,
        run1Formatted: r1?.timeFormatted || r2.run1Formatted,
        run2Time: r2.time,
        run2Formatted: r2.timeFormatted,
        combinedAfter2: (r1?.time || 0) + r2.time,
        totalTime: null,
        totalFormatted: null
      }
    })
  } else if (run === 4) {
    // Load run 1, 2, 3 results for combined times
    const run3 = selectedEvent.value?.run3_results || []
    liveResults.value = run3.filter(r => !r.dnf).map(r3 => ({
      ...r3,
      run3Time: r3.time,
      run3Formatted: r3.timeFormatted,
      combinedAfter3: r3.combinedAfter2 + r3.time,
      totalTime: null,
      totalFormatted: null
    }))
  }

  // Auto-start first team after a short delay
  setTimeout(() => {
    runNextTeam()
  }, 500)
}

function runNextTeam() {
  if (animating.value || !hasNextTeam.value) return

  currentTeamIndex.value++
  const team = startOrder.value[currentTeamIndex.value]
  currentTeam.value = team
  currentBib.value = currentTeamIndex.value + 1
  currentResult.value = null
  splitTimes.value = []
  displayTime.value = '0.00'

  // Reset sled position
  sledPosition.value = { x: 30, y: 40 }
  sledRotation.value = 0

  // Simulate the run and animate
  const result = simulateTeamRun(team)
  animateRun(result)
}

function simulateTeamRun(team) {
  const trackLength = selectedEvent.value?.track_length || 1400
  const baseTime = trackLength / 25

  const skillPush = team.skill_push || 70
  const skillPilot = team.skill_pilot || 70
  const skillCrew = team.skill_crew || 70
  const consistency = team.consistency || 70
  const form = team.form || 70

  // Check for DNF
  const baseDNFRate = 0.02
  const dnfModifier = (100 - consistency) / 100 * 0.3 + (100 - skillPilot) / 100 * 0.2
  const dnfChance = baseDNFRate * (1 + dnfModifier)

  if (Math.random() < dnfChance) {
    return {
      teamId: team.id,
      teamName: team.name,
      country: team.country,
      dnf: true,
      time: null,
      timeFormatted: 'DNF',
      splits: []
    }
  }

  // Calculate time
  const pushEffect = (70 - skillPush) * 0.015
  const pilotEffect = (70 - skillPilot) * 0.025
  const crewEffect = (70 - skillCrew) * 0.015
  const formEffect = (70 - form) * 0.01
  const consistencyMultiplier = 1.5 - (consistency / 100)
  const randomVariation = randomNormal(0, 0.3 * consistencyMultiplier)
  const run2Modifier = currentRun.value === 2 ? randomNormal(0.1, 0.2) : 0

  let time = baseTime + pushEffect + pilotEffect + crewEffect + formEffect + randomVariation + run2Modifier

  // Mistakes
  if (Math.random() < (100 - consistency) / 100 * 0.2) {
    time += randomNormal(0.2, 0.1)
  }

  // Clamp time
  const avgSkill = (skillPush + skillPilot + skillCrew) / 3
  const skillBasedMin = baseTime * (0.94 + (100 - avgSkill) * 0.0005)
  const skillBasedMax = baseTime * (1.01 + (100 - avgSkill) * 0.001)
  time = Math.max(skillBasedMin, Math.min(skillBasedMax, time))
  time = Math.round(time * 100) / 100

  // Generate split times (5 sections)
  const splits = []
  let cumulative = 0
  for (let i = 0; i < 5; i++) {
    const sectionTime = (time / 5) + randomNormal(0, 0.05)
    cumulative += sectionTime
    splits.push(Math.round(cumulative * 100) / 100)
  }
  // Ensure last split matches total time
  splits[4] = time

  return {
    teamId: team.id,
    teamName: team.name,
    country: team.country,
    dnf: false,
    time,
    timeFormatted: formatTime(time),
    splits
  }
}

function randomNormal(mean = 0, stdDev = 1) {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stdDev
}

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  if (mins > 0) {
    return `${mins}:${secs.padStart(5, '0')}`
  }
  return secs
}

async function animateRun(result) {
  animating.value = true

  // Dense waypoints for smooth curve following
  const trackPoints = generateTrackPoints()
  const sectionMarkers = [0, 0.15, 0.35, 0.55, 0.75, 0.95] // Progress points for splits

  const animDuration = result.dnf ? 2500 : 4500
  const dnfProgress = result.dnf ? 0.2 + Math.random() * 0.5 : 1

  const startTime = Date.now()
  let lastSectionTriggered = -1

  return new Promise(resolve => {
    function animate() {
      const elapsed = Date.now() - startTime
      let progress = Math.min(elapsed / animDuration, 1)

      // Stop at DNF point
      if (result.dnf && progress >= dnfProgress) {
        progress = dnfProgress
        animateCrashEffect()
        displayTime.value = 'DNF'
        animating.value = false
        updateLiveResults(result)
        resolve()
        return
      }

      // Get position along track
      const pointIndex = Math.floor(progress * (trackPoints.length - 1))
      const nextIndex = Math.min(pointIndex + 1, trackPoints.length - 1)
      const localProgress = (progress * (trackPoints.length - 1)) - pointIndex

      const current = trackPoints[pointIndex]
      const next = trackPoints[nextIndex]

      // Smooth interpolation
      sledPosition.value = {
        x: current.x + (next.x - current.x) * localProgress,
        y: current.y + (next.y - current.y) * localProgress
      }
      sledRotation.value = current.rotation + (next.rotation - current.rotation) * localProgress

      // Update time display
      const simulatedTime = progress * result.time
      displayTime.value = simulatedTime.toFixed(2)

      // Trigger splits at section markers
      for (let i = 0; i < sectionMarkers.length; i++) {
        if (progress >= sectionMarkers[i] && lastSectionTriggered < i && result.splits[i]) {
          lastSectionTriggered = i
          const splitTime = result.splits[i]
          const leaderSplit = leaderSplits.value[i] || null
          const diff = leaderSplit ? splitTime - leaderSplit : null

          splitTimes.value.push({
            section: i + 1,
            time: splitTime.toFixed(2),
            diff
          })

          if (!leaderSplit || splitTime < leaderSplit) {
            leaderSplits.value[i] = splitTime
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Finished
        displayTime.value = result.timeFormatted
        animating.value = false
        updateLiveResults(result)
        resolve()
      }
    }

    requestAnimationFrame(animate)
  })
}

function generateTrackPoints() {
  // Generate dense points along the bezier curve path
  const points = []
  const numPoints = 100

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const point = getTrackPointAt(t)
    points.push(point)
  }

  return points
}

function getTrackPointAt(t) {
  // Bezier curve control points matching the SVG path
  const controlPoints = [
    { x: 30, y: 40 },
    { x: 60, y: 50 },
    { x: 80, y: 80 },
    { x: 120, y: 140 },
    { x: 160, y: 130 },
    { x: 200, y: 120 },
    { x: 230, y: 160 },
    { x: 270, y: 210 },
    { x: 320, y: 190 },
    { x: 370, y: 170 },
    { x: 400, y: 210 },
    { x: 440, y: 260 },
    { x: 480, y: 250 }
  ]

  // Catmull-Rom spline interpolation for smooth curve
  const totalSegments = controlPoints.length - 1
  const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1)
  const localT = (t * totalSegments) - segment

  const p0 = controlPoints[Math.max(0, segment - 1)]
  const p1 = controlPoints[segment]
  const p2 = controlPoints[Math.min(controlPoints.length - 1, segment + 1)]
  const p3 = controlPoints[Math.min(controlPoints.length - 1, segment + 2)]

  // Catmull-Rom formula
  const t2 = localT * localT
  const t3 = t2 * localT

  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * localT +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
  )

  const y = 0.5 * (
    (2 * p1.y) +
    (-p0.y + p2.y) * localT +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  )

  // Calculate rotation based on direction
  const nextT = Math.min(t + 0.01, 1)
  const nextSegment = Math.min(Math.floor(nextT * totalSegments), totalSegments - 1)
  const nextLocalT = (nextT * totalSegments) - nextSegment

  const np0 = controlPoints[Math.max(0, nextSegment - 1)]
  const np1 = controlPoints[nextSegment]
  const np2 = controlPoints[Math.min(controlPoints.length - 1, nextSegment + 1)]
  const np3 = controlPoints[Math.min(controlPoints.length - 1, nextSegment + 2)]

  const nt2 = nextLocalT * nextLocalT
  const nt3 = nt2 * nextLocalT

  const nx = 0.5 * (
    (2 * np1.x) +
    (-np0.x + np2.x) * nextLocalT +
    (2 * np0.x - 5 * np1.x + 4 * np2.x - np3.x) * nt2 +
    (-np0.x + 3 * np1.x - 3 * np2.x + np3.x) * nt3
  )

  const ny = 0.5 * (
    (2 * np1.y) +
    (-np0.y + np2.y) * nextLocalT +
    (2 * np0.y - 5 * np1.y + 4 * np2.y - np3.y) * nt2 +
    (-np0.y + 3 * np1.y - 3 * np2.y + np3.y) * nt3
  )

  const rotation = Math.atan2(ny - y, nx - x) * (180 / Math.PI)

  return { x, y, rotation }
}

function animateCrashEffect() {
  // Quick shake effect
  const basePos = { ...sledPosition.value }
  let shakeCount = 0
  const shake = () => {
    if (shakeCount < 8) {
      sledPosition.value = {
        x: basePos.x + (Math.random() - 0.5) * 15,
        y: basePos.y + (Math.random() - 0.5) * 15
      }
      sledRotation.value += 30
      shakeCount++
      setTimeout(shake, 50)
    }
  }
  shake()
}

async function animateCrash() {
  // Shake animation
  const basePos = { ...sledPosition.value }
  for (let i = 0; i < 5; i++) {
    sledPosition.value = {
      x: basePos.x + (Math.random() - 0.5) * 20,
      y: basePos.y + (Math.random() - 0.5) * 20
    }
    sledRotation.value += 45
    await new Promise(r => setTimeout(r, 100))
  }
  displayTime.value = 'DNF'
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function updateLiveResults(result) {
  lastFinishedTeamId.value = result.teamId

  if (currentRun.value === 1) {
    // Add to live results
    liveResults.value.push(result)

    // Calculate positions
    const sorted = [...liveResults.value].sort((a, b) => {
      if (a.dnf && b.dnf) return 0
      if (a.dnf) return 1
      if (b.dnf) return -1
      return a.time - b.time
    })

    const leaderTime = sorted.find(r => !r.dnf)?.time || 0

    sorted.forEach((r, idx) => {
      r.position = idx + 1
      if (!r.dnf) {
        r.timeBehind = r.time === leaderTime ? 0 : Math.round((r.time - leaderTime) * 100) / 100
        r.timeBehindFormatted = r.timeBehind > 0 ? `+${r.timeBehind.toFixed(2)}` : ''
      }
    })

    // Update current result
    currentResult.value = sorted.find(r => r.teamId === result.teamId)

  } else if (currentRun.value === 2) {
    // Run 2 - update existing result with run 2 time
    const existing = liveResults.value.find(r => r.teamId === result.teamId)
    if (existing) {
      if (result.dnf) {
        existing.run2Time = null
        existing.run2Formatted = 'DNF'
        existing.totalTime = null
        existing.totalFormatted = 'DNF (Run 2)'
      } else {
        existing.run2Time = result.time
        existing.run2Formatted = result.timeFormatted
        if (existing.run1Time) {
          existing.totalTime = Math.round((existing.run1Time + result.time) * 100) / 100
          existing.totalFormatted = formatTime(existing.totalTime)
        }
      }

      recalculateCombinedPositions()
      currentResult.value = existing
    }
  } else if (currentRun.value === 3) {
    // Run 3 - update existing result with run 3 time
    const existing = liveResults.value.find(r => r.teamId === result.teamId)
    if (existing) {
      if (result.dnf) {
        existing.run3Time = null
        existing.run3Formatted = 'DNF'
        existing.totalTime = null
        existing.totalFormatted = 'DNF (Run 3)'
      } else {
        existing.run3Time = result.time
        existing.run3Formatted = result.timeFormatted
        if (existing.combinedAfter2) {
          existing.totalTime = Math.round((existing.combinedAfter2 + result.time) * 100) / 100
          existing.totalFormatted = formatTime(existing.totalTime)
        }
      }

      recalculateCombinedPositions()
      currentResult.value = existing
    }
  } else if (currentRun.value === 4) {
    // Run 4 - update existing result with run 4 time
    const existing = liveResults.value.find(r => r.teamId === result.teamId)
    if (existing) {
      if (result.dnf) {
        existing.run4Time = null
        existing.run4Formatted = 'DNF'
        existing.totalTime = null
        existing.totalFormatted = 'DNF (Run 4)'
      } else {
        existing.run4Time = result.time
        existing.run4Formatted = result.timeFormatted
        if (existing.combinedAfter3) {
          existing.totalTime = Math.round((existing.combinedAfter3 + result.time) * 100) / 100
          existing.totalFormatted = formatTime(existing.totalTime)
        }
      }

      recalculateCombinedPositions()
      currentResult.value = existing
    }
  }
}

function recalculateCombinedPositions() {
  const sorted = [...liveResults.value].sort((a, b) => {
    if (a.totalTime === null && b.totalTime === null) return 0
    if (a.totalTime === null) return 1
    if (b.totalTime === null) return -1
    return a.totalTime - b.totalTime
  })

  const leaderTotal = sorted.find(r => r.totalTime !== null)?.totalTime || 0

  sorted.forEach((r, idx) => {
    r.position = idx + 1
    if (r.totalTime !== null) {
      r.timeBehind = r.totalTime === leaderTotal ? 0 : Math.round((r.totalTime - leaderTotal) * 100) / 100
      r.timeBehindFormatted = r.timeBehind > 0 ? `+${r.timeBehind.toFixed(2)}` : ''
    }
  })
}

async function finishRun() {
  simulating.value = true
  try {
    if (currentRun.value === 1) {
      // Save run 1 results to server (send the frontend animated results)
      const resultsToSave = liveStandings.value.map((r, idx) => ({
        ...r,
        position: idx + 1
      }))
      await bobsleighStore.simulateRace(selectedEvent.value.id, resultsToSave)

      // Refresh from store
      const idx = bobsleighStore.events.findIndex(e => e.id === selectedEvent.value.id)
      if (idx !== -1) {
        selectedEvent.value = { ...bobsleighStore.events[idx] }
      }

      // Prepare for run 2 (reverse order of run 1 standings)
      const run1 = selectedEvent.value.run1_results || []
      const nonDnf = run1.filter(r => !r.dnf).reverse()
      const dnf = run1.filter(r => r.dnf)
      startOrder.value = [...nonDnf, ...dnf].map(r => teams.value.find(t => t.id === r.teamId)).filter(Boolean)

      resetAnimationState()
      currentRun.value = 2

    } else if (currentRun.value === 2) {
      // Save run 2 results (send the frontend animated results)
      const resultsToSave = liveStandings.value.map((r, idx) => ({
        ...r,
        position: idx + 1
      }))
      const response = await bobsleighStore.simulateRun2(selectedEvent.value.id, resultsToSave)

      // Refresh from store
      const idx = bobsleighStore.events.findIndex(e => e.id === selectedEvent.value.id)
      if (idx !== -1) {
        selectedEvent.value = { ...bobsleighStore.events[idx] }
      }

      // For 4-run events, prepare for run 3
      if (response.needsRun3) {
        // Use the frontend results to set start order (top 20 qualify, reverse order)
        const qualifiedTeams = resultsToSave.filter(r => r.totalTime !== null).slice(0, 20).reverse()
        startOrder.value = qualifiedTeams.map(r => teams.value.find(t => t.id === r.teamId)).filter(Boolean)

        resetAnimationState()
        currentRun.value = 3
      } else {
        resetAnimationState()
      }

    } else if (currentRun.value === 3) {
      // Save run 3 results (send the frontend animated results)
      const resultsToSave = liveStandings.value.map((r, idx) => ({
        ...r,
        position: idx + 1
      }))
      const response = await bobsleighStore.simulateRun3(selectedEvent.value.id, resultsToSave)

      // Refresh from store
      const idx = bobsleighStore.events.findIndex(e => e.id === selectedEvent.value.id)
      if (idx !== -1) {
        selectedEvent.value = { ...bobsleighStore.events[idx] }
      }

      // Prepare for run 4 (all teams that finished run 3, reverse order)
      const qualifiedTeams = resultsToSave.filter(r => r.totalTime !== null).reverse()
      startOrder.value = qualifiedTeams.map(r => teams.value.find(t => t.id === r.teamId)).filter(Boolean)

      resetAnimationState()
      currentRun.value = 4

    } else if (currentRun.value === 4) {
      // Save run 4 / final results (send the frontend animated results)
      const resultsToSave = liveStandings.value.map((r, idx) => ({
        ...r,
        position: idx + 1
      }))
      await bobsleighStore.simulateRun4(selectedEvent.value.id, resultsToSave)

      // Refresh from store
      const idx = bobsleighStore.events.findIndex(e => e.id === selectedEvent.value.id)
      if (idx !== -1) {
        selectedEvent.value = { ...bobsleighStore.events[idx] }
      }

      resetAnimationState()
    }
  } catch (err) {
    console.error(`Failed to save run ${currentRun.value}:`, err)
  } finally {
    simulating.value = false
  }
}

function getSplitClass(diff) {
  if (diff === null) return 'neutral'
  if (diff < 0) return 'faster'
  if (diff > 0) return 'slower'
  return 'neutral'
}

function formatSplitDiff(diff) {
  if (diff === null) return ''
  if (diff < 0) return diff.toFixed(2)
  return '+' + diff.toFixed(2)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getEventPodium(event) {
  const results = event.results || []
  return results.slice(0, 3)
}

function getEventButtonClass(event) {
  if (event.status === 'completed') return 'btn-secondary'
  if (event.status === 'run1_completed' || event.status === 'run2_completed' || event.status === 'run3_completed') return 'btn-warning'
  return 'btn-primary'
}

function getEventButtonIcon(event) {
  if (event.status === 'completed') return 'fa-solid fa-eye'
  if (event.status === 'run1_completed' || event.status === 'run2_completed' || event.status === 'run3_completed') return 'fa-solid fa-forward'
  return 'fa-solid fa-play'
}

function getEventButtonText(event) {
  if (event.status === 'completed') return 'View Results'
  if (event.status === 'run1_completed') return 'Run 2'
  if (event.status === 'run2_completed') return 'Run 3'
  if (event.status === 'run3_completed') return 'Run 4'
  return 'Start Race'
}

function getSkillClass(value) {
  if (value >= 90) return 'skill-elite'
  if (value >= 80) return 'skill-high'
  if (value >= 70) return 'skill-good'
  if (value >= 60) return 'skill-average'
  return 'skill-low'
}

function getPosClass(pos) {
  if (pos === 1) return 'pos-gold'
  if (pos === 2) return 'pos-silver'
  if (pos === 3) return 'pos-bronze'
  return ''
}

function getDiffClass(diff) {
  if (!diff) return ''
  if (diff < 0.3) return 'diff-close'
  if (diff < 1) return 'diff-medium'
  return 'diff-far'
}

function getRun1TimeForTeam(teamId) {
  const run1Results = selectedEvent.value?.run1_results || []
  const result = run1Results.find(r => r.teamId === teamId)
  return result ? result.timeFormatted : '-'
}

// Load data on mount
onMounted(async () => {
  // Get world info
  try {
    const response = await fetch(`/api/worlds/${worldId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      world.value = data.world
    }
  } catch (err) {
    console.error('Failed to load world:', err)
  }

  await Promise.all([
    bobsleighStore.fetchTeams(worldId.value),
    weekStatusStore.fetchWeekStatus(worldId.value)
  ])
  await loadSeason()
})
</script>

<style scoped>
/* Base styles */
.bobsleigh-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.page-header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.separator {
  font-size: 0.75rem;
  opacity: 0.5;
}

.sport-name {
  color: #60a5fa;
}

/* Navigation */
.main-nav {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 0;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-tab.active {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
}

.nav-tab-icon {
  font-size: 1.25rem;
}

.nav-tab-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.nav-tab-label {
  font-weight: 500;
}

.nav-tab-badge, .nav-tab-count, .nav-tab-leader {
  font-size: 0.75rem;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.leader-flag {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

/* Main content */
.page-main {
  padding: 1.5rem 0;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Section header */
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
  font-size: 1.5rem;
  font-weight: 600;
}

.section-title .count {
  font-size: 1rem;
  opacity: 0.6;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

/* Teams grid */
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.team-card {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.team-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.team-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.team-flag {
  width: 40px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.team-country {
  font-size: 0.8rem;
  color: #94a3b8;
}

.team-runners {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.runner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.runner-pos {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: #60a5fa;
}

.runner-name {
  color: #1e293b;
}

.team-skills {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.skill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.skill-label {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.skill-elite { color: #a855f7; font-weight: 600; }
.skill-high { color: #22c55e; font-weight: 600; }
.skill-good { color: #60a5fa; }
.skill-average { color: #94a3b8; }
.skill-low { color: #f87171; }

.team-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

/* Season content */
.season-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.season-info h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.bobsleigh-icon {
  color: #60a5fa;
}

.season-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-text {
  font-size: 0.875rem;
  color: #94a3b8;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.calendar-event {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.calendar-event:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.calendar-event.completed {
  border-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.calendar-event.run1_completed {
  border-color: #eab308;
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
}

.calendar-event.is-locked { opacity: 0.6; cursor: not-allowed; position: relative; }
.calendar-event.is-locked:hover { transform: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.lock-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(100, 116, 139, 0.85); border-radius: 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; z-index: 10; color: white; }
.lock-overlay i { font-size: 1.5rem; }
.lock-overlay span { font-size: 0.875rem; font-weight: 600; }

.calendar-event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.event-number-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.event-type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #dbeafe;
  border-radius: 4px;
  color: #1e40af;
}

.event-status-badge {
  margin-left: auto;
  font-size: 0.75rem;
}

.event-status-badge.completed { color: #22c55e; }
.event-status-badge.run1_completed { color: #eab308; }
.event-status-badge.scheduled { color: #94a3b8; }

.calendar-event-body {
  margin-bottom: 0.75rem;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.event-flag-large {
  width: 36px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
}

.location-details {
  display: flex;
  flex-direction: column;
}

.location-name {
  font-weight: 600;
  font-size: 1rem;
}

.location-country {
  font-size: 0.8rem;
  color: #94a3b8;
}

.event-track-info {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.event-date-display {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-event-podium {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.podium-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.podium-pos {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 600;
}

.podium-pos.gold { background: #fbbf24; color: #000; }
.podium-pos.silver { background: #94a3b8; color: #000; }
.podium-pos.bronze { background: #d97706; color: #fff; }

.podium-flag-sm {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.podium-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-event-footer {
  display: flex;
  justify-content: center;
}

/* Standings */
.standings-compact {
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.standings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.standings-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  margin: 0;
}

.races-info {
  font-size: 0.875rem;
  color: #94a3b8;
}

.no-standings {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.no-standings i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.standings-list-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.standing-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.standing-row.top-3 {
  background: #dbeafe;
}

.standing-rank {
  width: 32px;
  text-align: center;
}

.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
}

.medal.gold { background: #fbbf24; color: #000; }
.medal.silver { background: #94a3b8; color: #000; }
.medal.bronze { background: #d97706; color: #fff; }

.rank-num {
  color: #94a3b8;
  font-weight: 500;
}

.standing-flag-sm {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 3px;
}

.standing-info {
  flex: 1;
}

.standing-name-compact {
  font-weight: 500;
}

.standing-data {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.standing-pts {
  font-weight: 600;
  color: #60a5fa;
}

.standing-races-sm {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-warning {
  background: #eab308;
  color: #000;
}

.btn-warning:hover:not(:disabled) {
  background: #ca8a04;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
}

.btn-ghost:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-danger {
  color: #f87171 !important;
}

.delete-btn:hover {
  color: #ef4444 !important;
}

/* Empty & Loading states */
.empty-state, .loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.warning-text {
  color: #fbbf24;
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 0.75rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.race-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.race-modal-header {
  background: #f8fafc;
}

.race-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.race-flag {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.race-details h2 {
  margin: 0;
  font-size: 1.25rem;
}

.event-label {
  font-size: 0.875rem;
  color: #60a5fa;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.track-info {
  color: #94a3b8;
  font-size: 0.8rem;
}

.modal-body {
  padding: 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Race modal content */
.pre-race {
  text-align: center;
  padding: 2rem;
}

.pre-race-info {
  margin-bottom: 2rem;
}

.pre-race-info h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.race-date {
  color: #94a3b8;
  margin-top: 1rem;
}

.run-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.run-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.run-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border-radius: 1rem;
}

.run-status.completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.results-table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.results-table th {
  font-weight: 500;
  color: #475569;
  font-size: 0.8rem;
  text-transform: uppercase;
  background: #f8fafc;
}

.col-pos { width: 50px; text-align: center; }
.col-team { min-width: 180px; }
.col-time { width: 80px; text-align: right; }
.col-diff { width: 70px; text-align: right; color: #94a3b8; }

.results-table .col-pos { text-align: center; }
.results-table .col-time { text-align: right; }
.results-table .col-diff { text-align: right; }

.result-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.result-name {
  vertical-align: middle;
}

.pos-gold { color: #fbbf24; font-weight: 600; }
.pos-silver { color: #94a3b8; font-weight: 600; }
.pos-bronze { color: #d97706; font-weight: 600; }

.results-table tr.dnf {
  opacity: 0.6;
}

.col-time.total {
  font-weight: 600;
  color: #60a5fa;
}

/* Podium display */
.podium-display {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
}

.podium-display .podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.podium-display .podium-flag {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.podium-display .podium-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.podium-display .podium-time {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.podium-block {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 4px 4px 0 0;
}

.podium-block.gold {
  background: linear-gradient(180deg, #fbbf24, #d97706);
  color: #000;
  height: 100px;
}

.podium-block.silver {
  background: linear-gradient(180deg, #94a3b8, #64748b);
  color: #000;
  height: 75px;
}

.podium-block.bronze {
  background: linear-gradient(180deg, #d97706, #92400e);
  color: #fff;
  height: 60px;
}

.podium-display .first {
  order: 2;
}

.podium-display .second {
  order: 1;
}

.podium-display .third {
  order: 3;
}

/* Team modal form */
.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
}

.form-group input[type="text"],
.form-group select {
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.5rem;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.form-group input[type="text"]:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group input[type="range"] {
  width: 100%;
  accent-color: #3b82f6;
}

.form-section {
  margin: 1.5rem 0;
}

.form-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin: 0;
}

.form-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.randomize-buttons {
  display: flex;
  gap: 0.25rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
}

.btn-strong {
  color: #22c55e;
}

.btn-strong:hover {
  background: rgba(34, 197, 94, 0.2);
  color: #16a34a;
}

.btn-average {
  color: #eab308;
}

.btn-average:hover {
  background: rgba(234, 179, 8, 0.2);
  color: #ca8a04;
}

.btn-weak {
  color: #ef4444;
}

.btn-weak:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.crew-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

/* Confirm modal */
.confirm-modal {
  max-width: 400px;
}

.confirm-modal .modal-body {
  text-align: center;
}

.confirm-modal .modal-body p {
  margin: 0.5rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-tabs {
    overflow-x: auto;
  }

  .nav-tab-content {
    display: none;
  }

  .teams-grid {
    grid-template-columns: 1fr;
  }

  .calendar-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
  }

  .crew-grid,
  .skills-grid {
    grid-template-columns: 1fr;
  }

  .podium-display {
    flex-wrap: wrap;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

/* Race Animation Modal */
.race-animation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.race-animation-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
  width: 100%;
  max-width: 1200px;
  max-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.race-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.race-venue {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.venue-flag {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.venue-info h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #f8fafc;
}

.venue-details {
  font-size: 0.875rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.track-length {
  color: #60a5fa;
}

.run-indicator {
  display: flex;
  gap: 0.5rem;
}

.run-badge {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
  transition: all 0.3s;
}

.run-badge.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.race-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Run Results Section (when run finished) */
.run-results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  overflow: hidden;
}

.run-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.run-results-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.5rem;
  color: #f8fafc;
}

.run-results-header h3 i {
  color: #22c55e;
}

.run-results-header .btn-finish {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.run-results-table {
  flex: 1;
  overflow-y: auto;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.results-table-header {
  display: grid;
  grid-template-columns: 50px 1fr 80px 80px;
  gap: 1rem;
  padding: 1rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.5);
  position: sticky;
  top: 0;
}

.results-table-header.with-total {
  grid-template-columns: 50px 1fr 80px 80px 90px 80px;
}

.results-table-row {
  display: grid;
  grid-template-columns: 50px 1fr 80px 80px;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
  transition: background 0.2s;
}

.results-table-row.with-total {
  grid-template-columns: 50px 1fr 80px 80px 90px 80px;
}

.results-table-row:hover {
  background: rgba(59, 130, 246, 0.05);
}

.results-table-row.podium {
  background: rgba(251, 191, 36, 0.05);
}

.results-table-row.podium:nth-child(2) {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05));
}

.results-table-row .col-pos {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.results-table-row .col-team {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.results-table-row .result-flag {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.results-table-row .result-name {
  font-size: 0.95rem;
  color: #e2e8f0;
  font-weight: 500;
}

.results-table-row .col-run,
.results-table-row .col-total {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: right;
}

.results-table-row .col-total {
  color: #60a5fa;
  font-weight: 600;
}

.results-table-row .col-diff {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #ef4444;
  text-align: right;
}

.results-table-row .col-diff.leader {
  color: #22c55e;
}

/* Track Section */
.track-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
}

.track-container {
  background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.bobsleigh-track-svg {
  width: 100%;
  height: auto;
}

.track-ice {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.bobsled {
  /* No transition - animation handled by requestAnimationFrame */
}

/* Timing Display */
.timing-display {
  margin-top: 1.5rem;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.75rem;
  padding: 1rem;
}

.current-team {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.team-flag-lg {
  width: 56px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.team-details {
  display: flex;
  flex-direction: column;
}

.team-name-lg {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
}

.bib-number {
  font-size: 0.875rem;
  color: #60a5fa;
  font-weight: 600;
}

.live-time {
  text-align: center;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #f8fafc;
  text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.live-time.running .time-value {
  color: #fbbf24;
  animation: pulse 0.5s ease-in-out infinite;
}

.live-time.finished .time-value {
  color: #22c55e;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.split-times {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.split {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 0.25rem;
  color: #94a3b8;
}

.split.faster {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.split.slower {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.split-diff {
  font-weight: 600;
  margin-left: 0.25rem;
}

.result-display {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.final-time, .position-display, .diff-display {
  text-align: center;
}

.time-label, .position-label, .diff-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.time-big {
  font-size: 1.5rem;
  font-weight: 700;
  color: #22c55e;
  font-family: 'Courier New', monospace;
}

.time-big.dnf {
  color: #ef4444;
}

.position-big {
  font-size: 2rem;
  font-weight: 800;
}

.position-big.pos-gold { color: #fbbf24; }
.position-big.pos-silver { color: #94a3b8; }
.position-big.pos-bronze { color: #d97706; }

.diff-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ef4444;
  font-family: 'Courier New', monospace;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-start {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
}

.btn-next {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.btn-finish {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-finish:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
}

/* Standings Section */
.standings-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  max-width: 350px;
  overflow: hidden;
}

.start-list-panel, .live-standings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.start-list-panel h3, .live-standings-panel h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #94a3b8;
}

.start-list, .live-standings {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.start-item, .standing-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.start-bib {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 600;
  color: #60a5fa;
}

.start-flag, .standing-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.start-name, .standing-name {
  flex: 1;
  font-size: 0.875rem;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standing-item.current {
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.5);
  animation: pulse-border 1s ease-in-out infinite;
}

.standing-item.just-finished {
  animation: highlight-flash 0.5s ease;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgba(59, 130, 246, 0.5); }
  50% { border-color: rgba(59, 130, 246, 0.8); }
}

@keyframes highlight-flash {
  0% { background: rgba(34, 197, 94, 0.5); }
  100% { background: rgba(30, 41, 59, 0.5); }
}

.standing-pos {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.standing-pos.pos-gold {
  background: linear-gradient(135deg, #fbbf24, #d97706);
  color: #000;
}

.standing-pos.pos-silver {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  color: #000;
}

.standing-pos.pos-bronze {
  background: linear-gradient(135deg, #d97706, #92400e);
  color: #fff;
}

.standing-time {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #60a5fa;
}

.standing-diff {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #ef4444;
}

/* Remaining Panel */
.remaining-panel {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.remaining-panel h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: #64748b;
}

.remaining-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.remaining-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  border-radius: 0.25rem;
}

.remaining-item.next-up {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.remaining-flag {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

.more-teams {
  font-size: 0.75rem;
  color: #64748b;
  padding: 0.25rem 0.5rem;
}

/* Current Runner Card */
.current-runner-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
}

.runner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.on-track-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #22c55e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.on-track-badge .pulse {
  animation: pulse-dot 1s ease-in-out infinite;
  font-size: 0.5rem;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.bib-display {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
}

.runner-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.runner-flag {
  width: 40px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.runner-details {
  display: flex;
  flex-direction: column;
}

.runner-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f8fafc;
}

.runner-country {
  font-size: 0.75rem;
  color: #64748b;
}

.live-time-display {
  text-align: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
}

.time-label {
  display: block;
  font-size: 0.65rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
}

.time-big {
  font-family: 'Courier New', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.run1-reference {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.ref-label {
  color: #64748b;
}

.ref-time {
  font-family: 'Courier New', monospace;
  color: #94a3b8;
}

/* Results Header */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  margin-bottom: 0.75rem;
}

.results-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.9rem;
  color: #94a3b8;
}

.results-count {
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(148, 163, 184, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

/* Results Table */
.results-table {
  flex: 1;
  overflow-y: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 60px 60px;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.results-table .table-header:first-child {
  grid-template-columns: 40px 1fr 55px 55px 65px;
}

.result-row {
  display: grid;
  grid-template-columns: 40px 1fr 60px 60px;
  gap: 0.5rem;
  padding: 0.5rem;
  align-items: center;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.result-row:nth-child(odd) {
  background: rgba(30, 41, 59, 0.3);
}

.result-row.just-finished {
  animation: row-highlight 0.8s ease;
}

@keyframes row-highlight {
  0% { background: rgba(34, 197, 94, 0.4); transform: scale(1.02); }
  100% { background: transparent; transform: scale(1); }
}

.result-row.podium {
  background: rgba(251, 191, 36, 0.05);
}

/* Run 2 grid columns */
.results-table:has(.col-run1) .table-header,
.results-table .result-row:has(.col-run1) {
  grid-template-columns: 40px 1fr 55px 55px 65px;
}

.col-pos {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.col-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.result-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
}

.result-name {
  font-size: 0.8rem;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-run1, .col-run2, .col-time, .col-total {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: right;
}

.col-time.leader, .col-total.leader {
  color: #22c55e;
  font-weight: 600;
}

.col-diff {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  text-align: right;
}

.col-diff.diff-close {
  color: #22c55e;
}

.col-diff.diff-medium {
  color: #fbbf24;
}

.col-diff.diff-far {
  color: #ef4444;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
  gap: 0.5rem;
}

.no-results i {
  font-size: 1.5rem;
  opacity: 0.5;
}

/* Up Next Section */
.up-next-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.up-next-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #fbbf24;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.next-team {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 0.5rem;
}

.next-flag {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 3px;
}

.next-name {
  flex: 1;
  font-size: 0.9rem;
  color: #f8fafc;
  font-weight: 500;
}

.next-bib {
  font-size: 0.75rem;
  color: #fbbf24;
  font-weight: 600;
}

.remaining-count {
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
}

/* Final Results Section */
.final-results-section {
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.5);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.podium-celebration {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1.5rem;
}

.podium-celebration .podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.podium-celebration .podium-flag {
  width: 56px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.podium-celebration .podium-name {
  font-weight: 700;
  font-size: 1rem;
  color: #f8fafc;
  margin-bottom: 0.25rem;
}

.podium-celebration .podium-time {
  font-size: 0.875rem;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  margin-bottom: 0.5rem;
}

.podium-celebration .podium-block {
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  border-radius: 0.5rem 0.5rem 0 0;
}

.podium-celebration .podium-block.gold {
  background: linear-gradient(180deg, #fbbf24, #d97706);
  color: #000;
  height: 100px;
}

.podium-celebration .podium-block.silver {
  background: linear-gradient(180deg, #94a3b8, #64748b);
  color: #000;
  height: 75px;
}

.podium-celebration .podium-block.bronze {
  background: linear-gradient(180deg, #d97706, #92400e);
  color: #fff;
  height: 60px;
}

.podium-celebration .first { order: 2; }
.podium-celebration .second { order: 1; }
.podium-celebration .third { order: 3; }

/* Responsive */
@media (max-width: 900px) {
  .race-content {
    flex-direction: column;
  }

  .track-section {
    border-right: none;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  .standings-section {
    max-width: none;
    max-height: 300px;
  }
}

/* Team Standings */
.standings-panel.teams-panel {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.standings-switch.teams.active {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.team-logo-sm {
  width: 28px;
  height: 28px;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
}

.standing-firstname {
  font-size: 0.75rem;
  color: #64748b;
}

.standing-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.standing-points {
  font-weight: 600;
  color: #0f172a;
}

.standing-races {
  font-size: 0.75rem;
  color: #64748b;
}

/* Teams Tab Styles */
.teams-section {
  padding: 1rem 0;
}

.empty-teams {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.empty-teams .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-teams h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-teams p {
  margin-bottom: 1.5rem;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.team-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.team-crew {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.crew-member {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.crew-role {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
}

.crew-name {
  font-size: 0.85rem;
  color: #1e293b;
}

.team-stats {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.team-stats .stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #dbeafe;
  border-radius: 0.5rem;
  min-width: 60px;
}

.team-stats .stat-label {
  font-size: 0.65rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
}

.team-stats .stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #3b82f6;
}

.team-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

/* Team Modal Form - Light Theme */
.team-modal {
  max-width: 600px;
}

.team-modal .modal-body {
  background: white;
}

.team-modal .form-group input[type="text"],
.team-modal .form-group input[type="number"],
.team-modal .form-group select {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #1e293b;
  font-size: 0.9rem;
  width: 100%;
  box-sizing: border-box;
}

.team-modal .form-group input:focus,
.team-modal .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.team-modal .form-group label {
  color: #475569;
}

.team-modal .form-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: #1e293b;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.team-modal .form-section h4 i {
  color: #60a5fa;
}

.text-muted {
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
