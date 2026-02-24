<template>
  <div class="sport-page alpine">
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
            <i class="fa-solid fa-person-skiing"></i>
            Alpine Skiing
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
                {{ seasonStandings[0].lastName }}
              </span>
            </div>
          </button>
          <button
            :class="['nav-tab', { active: activeTab === 'skiers' }]"
            @click="activeTab = 'skiers'"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Skiers</span>
              <span class="nav-tab-count" v-if="skiers.length">{{ skiers.length }}</span>
            </div>
          </button>
        </div>
      </div>
    </nav>

    <main class="page-main">
      <div class="container">

        <!-- Skiers Tab -->
        <div v-if="activeTab === 'skiers'" class="tab-content fade-in">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fa-solid fa-person-skiing"></i>
              Alpine Skiers
              <span class="count" v-if="skiers.length">({{ skiers.length }})</span>
            </h2>
            <div class="actions">
              <button
                v-if="skiers.length === 0"
                @click="handleGenerateSkiers"
                class="btn btn-secondary"
                :disabled="generating"
              >
                <i v-if="generating" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                {{ generating ? 'Generating...' : 'Generate 57 Skiers' }}
              </button>
              <button
                v-if="skiers.length > 0"
                @click="openAddSkierModal"
                class="btn btn-primary"
              >
                <i class="fa-solid fa-plus"></i>
                Add Skier
              </button>
              <button
                v-if="skiers.length > 0"
                @click="showDeleteAllSkiersConfirm = true"
                class="btn btn-ghost text-danger"
              >
                <i class="fa-solid fa-trash"></i>
                Delete All
              </button>
            </div>
          </div>

          <div v-if="loadingSkiers" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading skiers...
          </div>

          <div v-else-if="skiers.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-person-skiing"></i>
            </div>
            <h3>No Skiers Yet</h3>
            <p>Generate a roster of alpine skiers or add them manually.</p>
            <button @click="openAddSkierModal" class="btn btn-secondary" style="margin-top: 0.5rem;">
              <i class="fa-solid fa-plus"></i> Add Skier Manually
            </button>
          </div>

          <div v-else class="athletes-table-container">
            <table class="athletes-table">
              <thead>
                <tr>
                  <th class="col-country">Country</th>
                  <th class="col-name">Name</th>
                  <th class="col-skill">SPD</th>
                  <th class="col-skill">TEC</th>
                  <th class="col-skill">GLD</th>
                  <th class="col-skill">TRN</th>
                  <th class="col-skill">CON</th>
                  <th class="col-skill">OVR</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="skier in skiers" :key="skier.id" @click="openEditSkierModal(skier)" class="clickable-row">
                  <td class="col-country">
                    <img :src="`/flags/${skier.country}.png`" :alt="countryNames[skier.country]" class="flag" />
                    <span class="country-code">{{ skier.country }}</span>
                  </td>
                  <td class="col-name">{{ skier.last_name }} {{ skier.first_name }}</td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_speed)">{{ skier.skill_speed }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_technical)">{{ skier.skill_technical }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_gliding)">{{ skier.skill_gliding }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_turns)">{{ skier.skill_turns }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.consistency)">{{ skier.consistency }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(getOverall(skier))" class="overall">{{ getOverall(skier) }}</span></td>
                  <td class="col-actions" @click.stop>
                    <button @click="openEditSkierModal(skier)" class="btn btn-ghost btn-sm" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button @click="confirmDeleteSkier(skier)" class="btn btn-ghost btn-sm delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Season Tab -->
        <div v-if="activeTab === 'season'" class="tab-content fade-in">
          <div v-if="loadingSeason" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading season...
          </div>

          <div v-else-if="!currentSeason" class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-trophy"></i></div>
            <h3>No Active Season</h3>
            <p>Start a new Alpine Skiing World Cup season to begin competing.</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason || skiers.length === 0">
              <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingSeason ? 'Creating...' : 'Start New Season' }}
            </button>
            <p v-if="skiers.length === 0" class="warning-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Generate skiers first before starting a season.
            </p>
          </div>

          <div v-else class="season-content">
            <div class="season-header-card">
              <div class="season-info">
                <h2><i class="fa-solid fa-trophy alpine-icon"></i> Alpine Skiing World Cup {{ currentSeason.name }}</h2>
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
                  :class="['calendar-event', event.status, getDisciplineClass(event.discipline), { 'is-locked': weekStatusStore.isEventLocked(event.date) }]"
                  @click="handleEventClick(event)"
                >
                  <div v-if="weekStatusStore.isEventLocked(event.date)" class="lock-overlay">
                    <i class="fa-solid fa-lock"></i>
                    <span>Week Locked</span>
                  </div>
                  <div class="calendar-event-header">
                    <span class="event-number-badge">{{ index + 1 }}</span>
                    <span class="discipline-badge" :class="event.discipline">
                      <i :class="getDisciplineIcon(event.discipline)"></i> {{ getDisciplineName(event.discipline) }}
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
                    <div class="event-race-info">
                      <span class="race-runs">{{ event.runs }} run{{ event.runs > 1 ? 's' : '' }}</span>
                    </div>
                    <div class="event-date-display">
                      <i class="fa-solid fa-calendar-day"></i>
                      {{ formatDate(event.date) }}
                    </div>
                  </div>
                  <div v-if="event.status === 'completed' && getEventPodium(event).length > 0" class="calendar-event-podium">
                    <div v-for="(podium, pIndex) in getEventPodium(event)" :key="podium.skierId" class="podium-item">
                      <span :class="['podium-pos', pIndex === 0 ? 'gold' : pIndex === 1 ? 'silver' : 'bronze']">
                        {{ pIndex + 1 }}
                      </span>
                      <img :src="`/flags/${podium.country}.png`" class="podium-flag-sm" />
                      <span class="podium-name">{{ podium.lastName }}</span>
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
            <!-- Standings Switcher -->
            <div class="standings-switcher">
              <button
                :class="['standings-switch', { active: standingsView === 'overall' }]"
                @click="standingsView = 'overall'"
              >
                <i class="fa-solid fa-trophy"></i>
                <span>Overall</span>
                <span class="switch-count" v-if="seasonStandings.length">{{ completedEventsCount }} races</span>
              </button>
              <button
                :class="['standings-switch downhill', { active: standingsView === 'downhill', disabled: disciplineStandings.downhill.length === 0 }]"
                @click="disciplineStandings.downhill.length > 0 && (standingsView = 'downhill')"
                :disabled="disciplineStandings.downhill.length === 0"
              >
                <i class="fa-solid fa-mountain"></i>
                <span>Downhill</span>
              </button>
              <button
                :class="['standings-switch super_g', { active: standingsView === 'super_g', disabled: disciplineStandings.super_g.length === 0 }]"
                @click="disciplineStandings.super_g.length > 0 && (standingsView = 'super_g')"
                :disabled="disciplineStandings.super_g.length === 0"
              >
                <i class="fa-solid fa-gauge-high"></i>
                <span>Super-G</span>
              </button>
              <button
                :class="['standings-switch giant_slalom', { active: standingsView === 'giant_slalom', disabled: disciplineStandings.giant_slalom.length === 0 }]"
                @click="disciplineStandings.giant_slalom.length > 0 && (standingsView = 'giant_slalom')"
                :disabled="disciplineStandings.giant_slalom.length === 0"
              >
                <i class="fa-solid fa-flag"></i>
                <span>Giant Slalom</span>
              </button>
              <button
                :class="['standings-switch slalom', { active: standingsView === 'slalom', disabled: disciplineStandings.slalom.length === 0 }]"
                @click="disciplineStandings.slalom.length > 0 && (standingsView = 'slalom')"
                :disabled="disciplineStandings.slalom.length === 0"
              >
                <i class="fa-solid fa-flag-checkered"></i>
                <span>Slalom</span>
              </button>
              <button
                :class="['standings-switch teams', { active: standingsView === 'teams' }]"
                @click="standingsView = 'teams'; loadTeamStandings()"
              >
                <i class="fa-solid fa-people-group"></i>
                <span>Teams</span>
                <span class="switch-count" v-if="teamStandings.length">{{ teamStandings.length }}</span>
              </button>
            </div>

            <!-- Overall Standings -->
            <div v-if="standingsView === 'overall'" class="standings-panel">
              <div v-if="seasonStandings.length === 0" class="no-standings">
                <i class="fa-solid fa-trophy"></i>
                <p>No standings yet. Simulate your first race!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(standing, index) in seasonStandings"
                  :key="standing.skierId"
                  :class="['standing-row', 'clickable', { 'top-3': index < 3 }]"
                  @click="openCompetitorModal(standing)"
                >
                  <div class="standing-rank">
                    <span v-if="index === 0" class="medal gold">1</span>
                    <span v-else-if="index === 1" class="medal silver">2</span>
                    <span v-else-if="index === 2" class="medal bronze">3</span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <img :src="`/flags/${standing.country}.png`" class="standing-flag-sm" />
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ standing.lastName }}</span>
                    <span class="standing-firstname">{{ standing.firstName }}</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts">{{ standing.points }}</span>
                    <span class="standing-races-sm">{{ standing.races || 0 }}r</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Discipline Standings -->
            <div v-if="standingsView !== 'overall' && standingsView !== 'teams'" class="standings-panel discipline-panel" :class="standingsView">
              <div class="standings-list-compact">
                <div
                  v-for="(standing, index) in currentDisciplineStandings"
                  :key="standing.skierId"
                  :class="['standing-row', 'clickable', { 'top-3': index < 3 }]"
                  @click="openCompetitorModal(standing)"
                >
                  <div class="standing-rank">
                    <span v-if="index === 0" class="medal gold">1</span>
                    <span v-else-if="index === 1" class="medal silver">2</span>
                    <span v-else-if="index === 2" class="medal bronze">3</span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <img :src="`/flags/${standing.country}.png`" class="standing-flag-sm" />
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ standing.lastName }}</span>
                    <span class="standing-firstname">{{ standing.firstName }}</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts discipline-pts">{{ standing.points }}</span>
                    <span class="standing-races-sm">{{ standing.races || 0 }}r</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Standings -->
            <div v-if="standingsView === 'teams'" class="standings-panel teams-panel">
              <div v-if="teamStandings.length === 0" class="no-standings">
                <i class="fa-solid fa-people-group"></i>
                <p>No team standings yet. Assign athletes to teams and simulate races!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(team, index) in teamStandings"
                  :key="team.teamId"
                  :class="['standing-row team-standing-row', { 'top-3': index < 3 }]"
                >
                  <div class="standing-rank">
                    <span v-if="index === 0" class="medal gold">1</span>
                    <span v-else-if="index === 1" class="medal silver">2</span>
                    <span v-else-if="index === 2" class="medal bronze">3</span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <div class="team-logo-sm" :style="{ backgroundColor: team.color }">
                    {{ team.shortName || team.name?.substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ team.name }}</span>
                    <span class="standing-firstname">{{ team.athleteCount }} athletes</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts team-pts">{{ team.points }}</span>
                    <span class="standing-stats-sm">
                      <span title="Wins"><i class="fa-solid fa-trophy"></i> {{ team.wins || 0 }}</span>
                      <span title="Podiums"><i class="fa-solid fa-medal"></i> {{ team.podiums || 0 }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Race Modal -->
    <div v-if="showRaceModal" class="modal-overlay" @click.self="closeRaceModal">
      <div class="modal race-modal fade-in">
        <div class="modal-header race-modal-header">
          <div class="race-info">
            <img v-if="selectedEvent" :src="`/flags/${selectedEvent.country}.png`" class="race-flag" />
            <div class="race-details">
              <h2>{{ selectedEvent?.location }}</h2>
              <span class="discipline-label" :class="selectedEvent?.discipline">
                <i :class="getDisciplineIcon(selectedEvent?.discipline)"></i>
                {{ getDisciplineName(selectedEvent?.discipline) }}
                <span v-if="selectedEvent?.runs > 1" class="runs-info">({{ selectedEvent?.runs }} runs)</span>
              </span>
            </div>
          </div>
          <button @click="closeRaceModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body race-modal-body">
          <!-- Not started - Show start button -->
          <div v-if="!isRaceInProgress && !raceResults?.length && selectedEvent?.status === 'scheduled'" class="race-start-panel">
            <div class="race-preview">
              <div class="race-preview-icon">
                <i :class="getDisciplineIcon(selectedEvent?.discipline)"></i>
              </div>
              <p class="race-preview-count"><strong>{{ skiers.length }}</strong> skiers ready to compete</p>
              <p class="race-preview-details">
                <span><i class="fa-solid fa-flag"></i> {{ getDisciplineName(selectedEvent?.discipline) }}</span>
                <span><i class="fa-solid fa-repeat"></i> {{ selectedEvent?.runs }} run{{ selectedEvent?.runs > 1 ? 's' : '' }}</span>
              </p>
            </div>
            <button @click="startRaceAnimation" class="btn btn-primary btn-lg">
              <i class="fa-solid fa-play"></i>
              {{ selectedEvent?.runs > 1 ? 'Start Run 1' : 'Watch Race' }}
            </button>
          </div>

          <!-- Run 1 completed, waiting for Run 2 -->
          <div v-else-if="!isRaceInProgress && selectedEvent?.status === 'run1_completed'" class="race-start-panel">
            <div class="race-preview">
              <div class="run1-results-preview">
                <h3>Run 1 Complete!</h3>
                <div class="run1-top3">
                  <div v-for="(result, idx) in run1TopResults" :key="result.skierId" class="run1-result-item">
                    <span :class="['pos-badge', idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze']">{{ idx + 1 }}</span>
                    <img :src="`/flags/${result.country}.png`" class="mini-flag" />
                    <span class="name">{{ result.lastName }}</span>
                    <span class="time">{{ result.timeFormatted }}</span>
                  </div>
                </div>
                <p class="run2-info">Top 30 will race in reverse order</p>
              </div>
            </div>
            <button @click="startRun2Animation" class="btn btn-primary btn-lg">
              <i class="fa-solid fa-play"></i>
              Start Run 2
            </button>
          </div>

          <!-- Race Animation -->
          <div v-else-if="isRaceInProgress" class="race-animation-container">
            <!-- Race Header with Timer -->
            <div class="race-animation-header">
              <div class="race-timer">
                <i class="fa-solid fa-stopwatch"></i>
                <span class="timer-value">{{ formatRaceTime(raceTimer) }}</span>
              </div>
              <div class="race-status-display">
                <span class="status-label">{{ currentRacePhase }}</span>
                <div class="run-indicator" v-if="selectedEvent?.runs > 1">
                  Run {{ currentRun }}/{{ selectedEvent?.runs }}
                </div>
              </div>
              <button v-if="waitingForNextSkier" @click="goToNextSkier" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-forward"></i> Next ({{ allSkierResults.length - currentSkierIndex - 1 }})
              </button>
              <button @click="skipAnimation" class="btn btn-ghost btn-sm">
                <i class="fa-solid fa-forward-fast"></i> Skip
              </button>
            </div>

            <!-- Main Animation Area -->
            <div class="race-animation-content alpine-animation">
              <!-- SVG Alpine Course Animation -->
              <div class="alpine-course-container">
                <svg viewBox="0 0 400 500" class="alpine-course-svg">
                  <defs>
                    <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#e0f2fe" />
                      <stop offset="100%" style="stop-color:#bae6fd" />
                    </linearGradient>
                    <linearGradient id="snowTrack" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#ffffff" />
                      <stop offset="100%" style="stop-color:#e2e8f0" />
                    </linearGradient>
                  </defs>

                  <!-- Background -->
                  <rect x="0" y="0" width="400" height="500" fill="url(#mountainGradient)" />

                  <!-- Mountain peaks background -->
                  <polygon points="0,100 80,20 160,80 240,10 320,60 400,40 400,150 0,150" fill="#94a3b8" opacity="0.15" />

                  <!-- Course track (vertical top-to-bottom) -->
                  <path :d="getCoursePath()" fill="none" stroke="url(#snowTrack)" stroke-width="35" stroke-linecap="round" />
                  <path :d="getCoursePath()" fill="none" stroke="white" stroke-width="28" stroke-linecap="round" />

                  <!-- Gates based on discipline -->
                  <g class="gates">
                    <g v-for="(gate, idx) in courseGates" :key="'gate-'+idx" class="gate">
                      <!-- Gate poles -->
                      <line
                        :x1="gate.x - gate.width/2" :y1="gate.y - 12"
                        :x2="gate.x - gate.width/2" :y2="gate.y + 8"
                        :stroke="gate.color" stroke-width="3"
                      />
                      <line
                        :x1="gate.x + gate.width/2" :y1="gate.y - 12"
                        :x2="gate.x + gate.width/2" :y2="gate.y + 8"
                        :stroke="gate.color" stroke-width="3"
                      />
                      <!-- Gate panel -->
                      <rect
                        :x="gate.x - gate.width/2" :y="gate.y - 10"
                        :width="gate.width" height="6"
                        :fill="gate.color" opacity="0.7"
                      />
                    </g>
                  </g>

                  <!-- Start gate -->
                  <g class="start-gate">
                    <rect x="175" y="25" width="50" height="8" fill="#22c55e" rx="2" />
                    <text x="200" y="20" text-anchor="middle" fill="#22c55e" font-size="11" font-weight="bold">START</text>
                  </g>

                  <!-- Finish line -->
                  <g class="finish-line">
                    <rect x="175" y="465" width="50" height="10" fill="#ef4444" rx="2" />
                    <text x="200" y="460" text-anchor="middle" fill="#ef4444" font-size="11" font-weight="bold">FINISH</text>
                  </g>

                  <!-- Interval/Split timing marker at 50% -->
                  <g class="interval-marker">
                    <line x1="140" y1="247" x2="260" y2="247" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6,3" />
                    <rect x="165" y="235" width="70" height="16" fill="#f59e0b" rx="3" />
                    <text x="200" y="247" text-anchor="middle" fill="white" font-size="9" font-weight="bold">INTERVAL</text>
                    <!-- Highlight when split is passed -->
                    <circle v-if="splitPassed" cx="200" cy="247" r="8" fill="#22c55e" opacity="0.8">
                      <animate attributeName="r" values="8;15;8" dur="0.5s" repeatCount="1" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="0.5s" repeatCount="1" />
                    </circle>
                  </g>

                  <!-- Animated Skier -->
                  <g v-if="currentSkier" class="skier-group" :transform="`translate(${currentSkier.x}, ${currentSkier.y})`">
                    <!-- Skier body -->
                    <ellipse cx="0" cy="0" rx="6" ry="8" fill="#3b82f6" />
                    <!-- Skier head -->
                    <circle cx="0" cy="-10" r="5" fill="#fbbf24" />
                    <!-- Skis (horizontal across slope) -->
                    <line x1="-10" y1="8" x2="10" y2="8" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
                    <!-- Poles -->
                    <line x1="-6" y1="0" x2="-12" y2="10" stroke="#64748b" stroke-width="1.5" />
                    <line x1="6" y1="0" x2="12" y2="10" stroke="#64748b" stroke-width="1.5" />
                  </g>

                  <!-- DNF marker if crashed -->
                  <g v-if="skierDNF" class="dnf-marker" :transform="`translate(${dnfPosition.x}, ${dnfPosition.y})`">
                    <circle cx="0" cy="0" r="15" fill="#ef4444" opacity="0.3" />
                    <text x="0" y="5" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">DNF</text>
                  </g>
                </svg>
              </div>

              <!-- Live Leaderboard -->
              <div class="live-leaderboard alpine-leaderboard">
                <div class="leaderboard-title">
                  <i class="fa-solid fa-ranking-star"></i>
                  {{ currentRun === 2 ? 'Combined Standings' : 'Run ' + currentRun + ' Results' }}
                </div>
                <!-- Current skier highlight -->
                <div v-if="currentSkier && !currentSkier.finished" class="current-athlete-card">
                  <div class="current-label">NOW RACING</div>
                  <div class="current-athlete-info">
                    <span v-if="currentSkierOverallRank" class="skier-wc-badge" :class="{ 'top-3': currentSkierOverallRank <= 3 }">
                      #{{ currentSkierOverallRank }}
                    </span>
                    <span v-if="currentSkierDisciplineRank" class="skier-discipline-badge" :class="{ 'top-3': currentSkierDisciplineRank <= 3 }">
                      {{ disciplineShortName }} #{{ currentSkierDisciplineRank }}
                    </span>
                    <img :src="`/flags/${currentSkier.country}.png`" class="current-flag" />
                    <span class="current-name">{{ currentSkier.lastName }}</span>
                  </div>
                  <!-- Run 1 info during Run 2 -->
                  <div v-if="currentRun === 2 && currentSkierRun1Info" class="run1-info">
                    <span class="run1-label">Run 1:</span>
                    <span class="run1-rank">#{{ currentSkierRun1Info.rank }}</span>
                    <span class="run1-time">{{ currentSkierRun1Info.timeFormatted }}</span>
                    <span v-if="currentSkierRun1Info.behind" class="run1-behind">+{{ currentSkierRun1Info.behind }}</span>
                  </div>
                  <div class="current-time">{{ formatRaceTime(raceTimer) }}</div>
                  <!-- Split time display -->
                  <div v-if="currentSplit" class="split-time-display">
                    <div class="split-label">
                      <i class="fa-solid fa-clock"></i> Intermediate
                    </div>
                    <div class="split-time">{{ formatRaceTime(currentSplit.time) }}</div>
                    <div v-if="currentSplit.diff !== null" class="split-diff" :class="{ 'ahead': currentSplit.diff < 0, 'behind': currentSplit.diff > 0 }">
                      {{ currentSplit.diff < 0 ? '' : '+' }}{{ currentSplit.diff.toFixed(2) }}s
                    </div>
                    <div v-else class="split-leader-badge">
                      <i class="fa-solid fa-crown"></i> Leader
                    </div>
                  </div>
                </div>
                <div class="leaderboard-entries">
                  <div v-for="(entry, idx) in liveStandings.slice(0, 12)" :key="entry.skierId"
                    :class="['leaderboard-entry', { 'leader': idx === 0, 'dnf': entry.dnf }]">
                    <span class="entry-rank" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">
                      {{ entry.dnf ? '-' : idx + 1 }}
                    </span>
                    <img :src="`/flags/${entry.country}.png`" class="entry-flag" />
                    <span class="entry-name">{{ entry.lastName }}</span>
                    <span v-if="entry.dnf" class="entry-dnf">DNF</span>
                    <span v-else class="entry-time">{{ entry.timeFormatted }}</span>
                    <span v-if="!entry.dnf && idx > 0 && entry.timeBehind" class="entry-behind">
                      +{{ entry.timeBehind.toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Final Results -->
          <div v-else-if="raceResults?.length > 0" class="race-results">
            <div class="results-header completed">
              <span><i class="fa-solid fa-flag-checkered"></i> Race Complete!</span>
            </div>
            <div class="results-table-container">
              <table class="results-table final-results">
                <thead>
                  <tr>
                    <th class="col-rank">Pos</th>
                    <th class="col-country">Country</th>
                    <th class="col-name">Name</th>
                    <th v-if="selectedEvent?.runs > 1" class="col-time">Run 1</th>
                    <th v-if="selectedEvent?.runs > 1" class="col-time">Run 2</th>
                    <th class="col-time">Total</th>
                    <th class="col-behind">Behind</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in raceResults" :key="result.skierId" :class="{ 'podium': result.position <= 3, 'dnf-row': result.dnf }">
                    <td class="col-rank">
                      <span v-if="result.position === 1 && !result.dnf" class="medal gold">1</span>
                      <span v-else-if="result.position === 2 && !result.dnf" class="medal silver">2</span>
                      <span v-else-if="result.position === 3 && !result.dnf" class="medal bronze">3</span>
                      <span v-else>{{ result.position }}</span>
                    </td>
                    <td class="col-country"><img :src="`/flags/${result.country}.png`" class="result-flag" /></td>
                    <td class="col-name">{{ result.lastName }} {{ result.firstName }}</td>
                    <td v-if="selectedEvent?.runs > 1" class="col-time">{{ result.run1Formatted || result.timeFormatted || '-' }}</td>
                    <td v-if="selectedEvent?.runs > 1" class="col-time">{{ result.run2Formatted || '-' }}</td>
                    <td class="col-time">{{ result.totalFormatted || result.timeFormatted || 'DNF' }}</td>
                    <td class="col-behind">{{ result.timeBehindFormatted || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Confirm Modal -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Reset Season?</h2>
          <button @click="showResetConfirm = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>This will reset all race results and standings. This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showResetConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleResetSeason" class="btn btn-danger" :disabled="resettingSeason">
            <i v-if="resettingSeason" class="fa-solid fa-spinner fa-spin"></i>
            {{ resettingSeason ? 'Resetting...' : 'Reset Season' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Skier Modal -->
    <div v-if="showSkierModal" class="modal-overlay" @click.self="closeSkierModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>{{ editingSkier ? 'Edit Skier' : 'Add New Skier' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeSkierModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <form @submit.prevent="handleSaveSkier" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="skierForm.first_name" type="text" required placeholder="First name" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input v-model="skierForm.last_name" type="text" required placeholder="Last name" />
            </div>
            <div class="form-group country-select-group">
              <label>Country</label>
              <div class="country-select-wrapper">
                <input
                  type="text"
                  v-model="countrySearch"
                  @focus="showCountryDropdown = true"
                  @input="showCountryDropdown = true"
                  @blur="hideCountryDropdown"
                  :placeholder="skierForm.country ? `${countryNames[skierForm.country]} (${skierForm.country})` : 'Type to search...'"
                  class="country-input"
                  autocomplete="off"
                />
                <div v-if="showCountryDropdown" class="country-dropdown" @mousedown.prevent>
                  <div
                    v-for="country in filteredCountryList"
                    :key="country.code"
                    class="country-item"
                    :class="{ selected: skierForm.country === country.code }"
                    @click="selectCountry(country.code)"
                  >
                    {{ country.name }} ({{ country.code }})
                  </div>
                  <div v-if="filteredCountryList.length === 0" class="country-item no-results">
                    No countries found
                  </div>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Team</label>
              <select v-model="skierForm.team_id">
                <option value="">No team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-section-title">
            Skills
            <div class="randomize-buttons">
              <button type="button" @click="randomizeSkills('random')" class="btn btn-xs btn-ghost" title="Random values">
                <i class="fa-solid fa-shuffle"></i> Random
              </button>
              <button type="button" @click="randomizeSkills('strong')" class="btn btn-xs btn-ghost btn-strong" title="Strong skier (85-99)">
                <i class="fa-solid fa-star"></i> Strong
              </button>
              <button type="button" @click="randomizeSkills('average')" class="btn btn-xs btn-ghost btn-average" title="Average skier (65-80)">
                <i class="fa-solid fa-minus"></i> Average
              </button>
              <button type="button" @click="randomizeSkills('weak')" class="btn btn-xs btn-ghost btn-weak" title="Weak skier (50-65)">
                <i class="fa-solid fa-circle-down"></i> Weak
              </button>
            </div>
          </div>
          <div class="form-row skills-row">
            <div class="form-group">
              <label>Speed <span class="skill-value">{{ skierForm.skill_speed }}</span></label>
              <input v-model.number="skierForm.skill_speed" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Technical <span class="skill-value">{{ skierForm.skill_technical }}</span></label>
              <input v-model.number="skierForm.skill_technical" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Gliding <span class="skill-value">{{ skierForm.skill_gliding }}</span></label>
              <input v-model.number="skierForm.skill_gliding" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="form-row skills-row">
            <div class="form-group">
              <label>Turns <span class="skill-value">{{ skierForm.skill_turns }}</span></label>
              <input v-model.number="skierForm.skill_turns" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Consistency <span class="skill-value">{{ skierForm.consistency }}</span></label>
              <input v-model.number="skierForm.consistency" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Form <span class="skill-value">{{ skierForm.form }}</span></label>
              <input v-model.number="skierForm.form" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeSkierModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="savingSkier">
              <i v-if="savingSkier" class="fa-solid fa-spinner fa-spin"></i>
              {{ savingSkier ? 'Saving...' : (editingSkier ? 'Save Changes' : 'Add Skier') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Skier Confirmation Modal -->
    <div v-if="skierToDelete" class="modal-overlay" @click.self="skierToDelete = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Delete Skier</h2>
          <button @click="skierToDelete = null" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ skierToDelete.first_name }} {{ skierToDelete.last_name }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button @click="skierToDelete = null" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteSkier" class="btn btn-danger" :disabled="deletingSkier">
            <i v-if="deletingSkier" class="fa-solid fa-spinner fa-spin"></i>
            {{ deletingSkier ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete All Skiers Confirmation Modal -->
    <div v-if="showDeleteAllSkiersConfirm" class="modal-overlay" @click.self="showDeleteAllSkiersConfirm = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Delete All Skiers</h2>
          <button @click="showDeleteAllSkiersConfirm = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>all {{ skiers.length }} skiers</strong>? This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAllSkiersConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteAllSkiers" class="btn btn-danger" :disabled="deletingAllSkiers">
            <i v-if="deletingAllSkiers" class="fa-solid fa-spinner fa-spin"></i>
            {{ deletingAllSkiers ? 'Deleting...' : 'Delete All Skiers' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Competitor Results Modal -->
    <div v-if="showCompetitorModal" class="competitor-modal-overlay" @click.self="closeCompetitorModal">
      <div class="competitor-modal">
        <div class="competitor-modal-header">
          <div class="competitor-info">
            <img v-if="selectedCompetitor" :src="`/flags/${selectedCompetitor.country}.png`" class="competitor-flag" />
            <div class="competitor-details">
              <h3>{{ selectedCompetitor?.firstName }} {{ selectedCompetitor?.lastName }}</h3>
              <span class="competitor-standing">
                Rank #{{ selectedCompetitorRank }} &bull; {{ selectedCompetitor?.points }} pts
              </span>
            </div>
          </div>
          <button @click="closeCompetitorModal" class="close-modal-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="competitor-modal-content">
          <h4 class="results-title">Season Results</h4>
          <div class="competitor-results-list">
            <div
              v-for="result in competitorSeasonResults"
              :key="result.eventId"
              :class="['result-row', { 'podium': result.position <= 3 }]"
            >
              <div class="result-event">
                <span class="result-location">{{ result.location }}</span>
                <span class="result-type">{{ result.discipline }}</span>
              </div>
              <div class="result-position">
                <span v-if="result.position === 1" class="medal gold">1</span>
                <span v-else-if="result.position === 2" class="medal silver">2</span>
                <span v-else-if="result.position === 3" class="medal bronze">3</span>
                <span v-else-if="result.position" class="position">{{ result.position }}</span>
                <span v-else class="position dnf">-</span>
              </div>
              <div class="result-points">
                <span v-if="result.wcPoints">+{{ result.wcPoints }}</span>
                <span v-else>-</span>
              </div>
            </div>
          </div>
          <div v-if="competitorSeasonResults.length === 0" class="no-results">
            No race results yet
          </div>
        </div>
      </div>
    </div>
  </div>
    <NamePicker v-model="showNamePicker" @select="handleNamePicked" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorldsStore } from '../stores/worlds'
import { useAlpineStore } from '../stores/alpine'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'
import NamePicker from '../components/NamePicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const worldsStore = useWorldsStore()
const alpineStore = useAlpineStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const teams = computed(() => teamsStore.teams)
const teamStandings = computed(() => teamsStore.teamStandings)

// Local reactive copy of countryNames
const countryNames = ref({})
watch(() => alpineStore.countryNames, (newVal) => {
  countryNames.value = newVal
}, { immediate: true, deep: true })

const worldId = computed(() => route.params.worldId)
const world = computed(() => worldsStore.currentWorld)
const skiers = computed(() => alpineStore.skiers)

// Country search functionality
const countrySearch = ref('')
const showCountryDropdown = ref(false)
const sortedCountries = computed(() => {
  const countries = countryNames.value
  if (!countries || Object.keys(countries).length === 0) return []
  return Object.entries(countries)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
const filteredCountryList = computed(() => {
  const search = countrySearch.value.toLowerCase().trim()
  if (!search) return sortedCountries.value.slice(0, 15)
  return sortedCountries.value.filter(c =>
    c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
  ).slice(0, 15)
})
function selectCountry(code) {
  skierForm.value.country = code
  countrySearch.value = ''
  showCountryDropdown.value = false
}
const selectedCountryName = computed(() => {
  const code = skierForm.value.country
  if (!code || !countryNames.value) return ''
  return countryNames.value[code] || code
})
function hideCountryDropdown() {
  setTimeout(() => {
    showCountryDropdown.value = false
  }, 200)
}

const currentSeason = computed(() => alpineStore.currentSeason)
const seasonEvents = computed(() => alpineStore.events)
const seasonStandings = computed(() => alpineStore.standings)
const disciplineStandings = computed(() => alpineStore.disciplineStandings)
const currentEvent = computed(() => alpineStore.currentEvent)
const raceResults = computed(() => currentEvent.value?.results || [])
const run1Results = computed(() => currentEvent.value?.run1_results || [])

const completedEventsCount = computed(() => seasonEvents.value.filter(e => e.status === 'completed').length)
const nextEvent = computed(() => seasonEvents.value.find(e => e.status !== 'completed'))
const progressPercent = computed(() => {
  if (seasonEvents.value.length === 0) return 0
  return Math.round((completedEventsCount.value / seasonEvents.value.length) * 100)
})

const currentDisciplineStandings = computed(() => {
  if (standingsView.value === 'overall') return []
  return disciplineStandings.value[standingsView.value] || []
})

// Competitor modal computed properties
const selectedCompetitorRank = computed(() => {
  if (!selectedCompetitor.value) return 0
  const index = seasonStandings.value.findIndex(s => s.skierId === selectedCompetitor.value.skierId)
  return index >= 0 ? index + 1 : 0
})

const competitorSeasonResults = computed(() => {
  if (!selectedCompetitor.value || !seasonEvents.value) return []

  const results = []
  const skierId = selectedCompetitor.value.skierId

  for (const event of seasonEvents.value) {
    if (event.status !== 'completed') continue

    let eventResults = event.results
    if (!eventResults) continue

    // Parse results if stored as JSON string
    if (typeof eventResults === 'string') {
      try {
        eventResults = JSON.parse(eventResults)
      } catch (e) {
        continue
      }
    }

    // Find the skier's result in this event
    const entry = eventResults.find(r => r.skierId === skierId)

    if (entry) {
      results.push({
        eventId: event.id,
        location: event.location,
        discipline: event.discipline,
        position: entry.position,
        totalTime: entry.totalTime,
        wcPoints: entry.wcPoints || 0
      })
    }
  }

  return results
})

function openCompetitorModal(standing) {
  selectedCompetitor.value = standing
  showCompetitorModal.value = true
}

function closeCompetitorModal() {
  showCompetitorModal.value = false
  selectedCompetitor.value = null
}

const run1TopResults = computed(() => {
  return run1Results.value.filter(r => !r.dnf).slice(0, 3)
})

// Current skier's WC overall rank
const currentSkierOverallRank = computed(() => {
  if (!currentSkier.value) return null
  const index = seasonStandings.value.findIndex(s => s.skierId === currentSkier.value.id)
  return index >= 0 ? index + 1 : null
})

// Current skier's discipline WC rank
const currentSkierDisciplineRank = computed(() => {
  if (!currentSkier.value || !selectedEvent.value) return null
  const discipline = selectedEvent.value.discipline
  const standings = disciplineStandings.value[discipline] || []
  const index = standings.findIndex(s => s.skierId === currentSkier.value.id)
  return index >= 0 ? index + 1 : null
})

// Discipline short name for display
const disciplineShortName = computed(() => {
  if (!selectedEvent.value) return ''
  const names = { downhill: 'DH', super_g: 'SG', giant_slalom: 'GS', slalom: 'SL', combined: 'AC' }
  return names[selectedEvent.value.discipline] || ''
})

// Current skier's Run 1 info (for Run 2 display)
const currentSkierRun1Info = computed(() => {
  if (!currentSkier.value || currentRun.value !== 2) return null

  // Find this skier's Run 1 result
  const run1Sorted = [...run1Results.value].filter(r => !r.dnf).sort((a, b) => a.time - b.time)
  const skierResult = run1Results.value.find(r => r.skierId === currentSkier.value.id)

  if (!skierResult || skierResult.dnf) return null

  const rank = run1Sorted.findIndex(r => r.skierId === currentSkier.value.id) + 1
  const leaderTime = run1Sorted[0]?.time || 0
  const behind = rank > 1 ? (skierResult.time - leaderTime).toFixed(2) : null

  return {
    rank,
    time: skierResult.time,
    timeFormatted: skierResult.timeFormatted,
    behind
  }
})

const activeTab = ref('season')
const standingsView = ref('overall')
const loadingSkiers = ref(true)
const loadingSeason = ref(false)
const generating = ref(false)
const creatingSeason = ref(false)
const resettingSeason = ref(false)
const showResetConfirm = ref(false)
const showRaceModal = ref(false)
const selectedEvent = ref(null)

// Competitor modal state
const showCompetitorModal = ref(false)
const selectedCompetitor = ref(null)

// Skier management state
const showSkierModal = ref(false)
const showNamePicker = ref(false)
const editingSkier = ref(null)
const skierToDelete = ref(null)
const showDeleteAllSkiersConfirm = ref(false)
const savingSkier = ref(false)
const deletingSkier = ref(false)
const deletingAllSkiers = ref(false)
const skierForm = ref({
  first_name: '',
  last_name: '',
  country: '',
  team_id: '',
  skill_speed: 70,
  skill_technical: 70,
  skill_gliding: 70,
  skill_turns: 70,
  consistency: 70,
  form: 70
})

// Animation state
const isRaceInProgress = ref(false)
const raceTimer = ref(0)
const currentRacePhase = ref('')
const currentRun = ref(1)
const animationInterval = ref(null)
const currentSkier = ref(null)
const liveStandings = ref([])
const skierDNF = ref(false)
const dnfPosition = ref({ x: 0, y: 0 })
const courseGates = ref([])

// Split/interval timing
const currentSplit = ref(null)  // { time, diff, position }
const leaderSplit = ref(null)   // Best intermediate time so far
const splitPassed = ref(false)  // Has current skier passed the split?

// Backend results
const backendResults = ref([])
const allSkierResults = ref([])
const currentSkierIndex = ref(0)
const waitingForNextSkier = ref(false)

// Discipline configurations for animation (vertical course)
const disciplineConfigs = {
  downhill: { gateCount: 8, gateWidth: 55, oscillation: 70, colors: ['#f97316'], speed: 3.0 },
  super_g: { gateCount: 14, gateWidth: 45, oscillation: 55, colors: ['#f97316'], speed: 2.5 },
  giant_slalom: { gateCount: 20, gateWidth: 40, oscillation: 45, colors: ['#3b82f6', '#ef4444'], speed: 2.0 },
  slalom: { gateCount: 28, gateWidth: 30, oscillation: 35, colors: ['#3b82f6', '#ef4444'], speed: 1.5 }
}

// Backend gate counts (must match alpineCalendar.js disciplineTypes)
const backendGateCounts = {
  downhill: 30,
  super_g: 35,
  giant_slalom: 55,
  slalom: 65,
  combined: 65 // Uses slalom gates for DNF calculation
}

// Course dimensions for vertical layout
const courseStart = { x: 200, y: 45 }
const courseEnd = { x: 200, y: 450 }

// Generate gates for the course (vertical)
function generateCourseGates(discipline) {
  const config = disciplineConfigs[discipline] || disciplineConfigs.slalom
  const gates = []

  for (let i = 0; i < config.gateCount; i++) {
    const progress = (i + 1) / (config.gateCount + 1)
    const baseY = courseStart.y + (courseEnd.y - courseStart.y) * progress

    // Oscillate gates left/right alternating
    const oscillation = (i % 2 === 0 ? -1 : 1) * config.oscillation

    gates.push({
      x: courseStart.x + oscillation,
      y: baseY,
      width: config.gateWidth,
      color: config.colors[i % config.colors.length]
    })
  }
  return gates
}

// Get SVG course path (vertical)
function getCoursePath() {
  const discipline = selectedEvent.value?.discipline || 'slalom'
  const config = disciplineConfigs[discipline] || disciplineConfigs.slalom

  // Create a curved vertical path from start to finish
  let path = `M ${courseStart.x} ${courseStart.y}`
  const points = []
  const numPoints = 25

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints
    const y = courseStart.y + (courseEnd.y - courseStart.y) * progress
    // Oscillate left-right as we go down
    const oscillation = Math.sin(progress * Math.PI * 6) * config.oscillation * 0.7
    points.push({ x: courseStart.x + oscillation, y })
  }

  // Create smooth curve through points
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpX = (prev.x + curr.x) / 2
    const cpY = (prev.y + curr.y) / 2
    path += ` Q ${prev.x} ${prev.y} ${cpX} ${cpY}`
  }
  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`

  return path
}

// Helper functions
function getSkillClass(value) {
  if (value >= 90) return 'skill-elite'
  if (value >= 80) return 'skill-high'
  if (value >= 70) return 'skill-good'
  if (value >= 60) return 'skill-average'
  return 'skill-low'
}

function getOverall(skier) {
  const skills = [
    skier.skill_speed,
    skier.skill_technical,
    skier.skill_gliding,
    skier.skill_turns,
    skier.consistency
  ]
  return Math.round(skills.reduce((a, b) => a + b, 0) / skills.length)
}

function randomizeSkills(level) {
  let min, max
  switch (level) {
    case 'strong':
      min = 85; max = 99
      break
    case 'average':
      min = 65; max = 80
      break
    case 'weak':
      min = 50; max = 65
      break
    default:
      min = 50; max = 99
  }
  const randomInRange = () => Math.floor(Math.random() * (max - min + 1)) + min
  skierForm.value.skill_speed = randomInRange()
  skierForm.value.skill_technical = randomInRange()
  skierForm.value.skill_gliding = randomInRange()
  skierForm.value.skill_turns = randomInRange()
  skierForm.value.consistency = randomInRange()
  skierForm.value.form = randomInRange()
}

function getDisciplineName(discipline) {
  const names = {
    downhill: 'Downhill',
    super_g: 'Super-G',
    giant_slalom: 'Giant Slalom',
    slalom: 'Slalom',
    combined: 'Combined'
  }
  return names[discipline] || discipline
}

function getDisciplineIcon(discipline) {
  const icons = {
    downhill: 'fa-solid fa-mountain',
    super_g: 'fa-solid fa-gauge-high',
    giant_slalom: 'fa-solid fa-flag',
    slalom: 'fa-solid fa-flag-checkered',
    combined: 'fa-solid fa-layer-group'
  }
  return icons[discipline] || 'fa-solid fa-person-skiing'
}

function getDisciplineClass(discipline) {
  return `discipline-${discipline}`
}

function getEventButtonClass(event) {
  if (event.status === 'completed') return 'btn-ghost'
  if (event.status === 'run1_completed') return 'btn-warning'
  return 'btn-primary'
}

function getEventButtonIcon(event) {
  if (event.status === 'completed') return 'fa-solid fa-eye'
  if (event.status === 'run1_completed') return 'fa-solid fa-forward'
  return 'fa-solid fa-play'
}

function getEventButtonText(event) {
  if (event.status === 'completed') return 'View Results'
  if (event.status === 'run1_completed') return 'Continue Run 2'
  return 'Start Race'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRaceTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hundredths = Math.floor((seconds % 1) * 100)
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`
  }
  return `${secs}.${hundredths.toString().padStart(2, '0')}`
}

function getEventPodium(event) {
  if (!event.results?.length) return []
  return event.results.filter(r => !r.dnf).slice(0, 3)
}

function goBack() {
  router.push(`/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// Data loading functions
async function loadSeason() {
  if (loadingSeason.value) return
  loadingSeason.value = true
  try {
    await alpineStore.fetchCurrentSeason(worldId.value)
  } catch (error) {
    console.error('Failed to load season:', error)
  } finally {
    loadingSeason.value = false
  }
}

async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'alpine')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleGenerateSkiers() {
  generating.value = true
  try {
    await alpineStore.generateSkiers(worldId.value)
  } catch (error) {
    console.error('Failed to generate skiers:', error)
  } finally {
    generating.value = false
  }
}

// Skier management functions
function openAddSkierModal() {
  editingSkier.value = null
  skierForm.value = {
    first_name: '',
    last_name: '',
    country: '',
    team_id: '',
    skill_speed: 70,
    skill_technical: 70,
    skill_gliding: 70,
    skill_turns: 70,
    consistency: 70,
    form: 70
  }
  showSkierModal.value = true
}

function openEditSkierModal(skier) {
  editingSkier.value = skier
  skierForm.value = {
    first_name: skier.first_name,
    last_name: skier.last_name,
    country: skier.country,
    team_id: skier.team_id || '',
    skill_speed: skier.skill_speed,
    skill_technical: skier.skill_technical,
    skill_gliding: skier.skill_gliding,
    skill_turns: skier.skill_turns,
    consistency: skier.consistency,
    form: skier.form
  }
  showSkierModal.value = true
}

function handleNamePicked(data) {
  skierForm.value.first_name = data.first_name
  skierForm.value.last_name = data.last_name
  if (data.country_code) skierForm.value.country = data.country_code
}

function closeSkierModal() {
  showSkierModal.value = false
  editingSkier.value = null
}

async function handleSaveSkier() {
  savingSkier.value = true
  try {
    if (editingSkier.value) {
      await alpineStore.updateSkier(editingSkier.value.id, skierForm.value)
    } else {
      await alpineStore.createSkier(worldId.value, skierForm.value)
    }
    closeSkierModal()
  } catch (error) {
    console.error('Failed to save skier:', error)
  } finally {
    savingSkier.value = false
  }
}

function confirmDeleteSkier(skier) {
  skierToDelete.value = skier
}

async function handleDeleteSkier() {
  deletingSkier.value = true
  try {
    await alpineStore.deleteSkier(skierToDelete.value.id)
    skierToDelete.value = null
  } catch (error) {
    console.error('Failed to delete skier:', error)
  } finally {
    deletingSkier.value = false
  }
}

async function handleDeleteAllSkiers() {
  deletingAllSkiers.value = true
  try {
    await alpineStore.deleteAllSkiers(worldId.value)
    showDeleteAllSkiersConfirm.value = false
  } catch (error) {
    console.error('Failed to delete all skiers:', error)
  } finally {
    deletingAllSkiers.value = false
  }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    await alpineStore.createSeason(worldId.value)
  } catch (error) {
    console.error('Failed to create season:', error)
  } finally {
    creatingSeason.value = false
  }
}

async function handleResetSeason() {
  if (!currentSeason.value) return
  resettingSeason.value = true
  try {
    await alpineStore.resetSeason(currentSeason.value.id)
    showResetConfirm.value = false
  } catch (error) {
    console.error('Failed to reset season:', error)
  } finally {
    resettingSeason.value = false
  }
}

async function handleEventClick(event) {
  // Check if event is locked
  if (weekStatusStore.isEventLocked(event.date)) {
    alert(`This event is locked. Complete all events in ${weekStatusStore.formattedWeek} first.`)
    return
  }
  selectedEvent.value = event
  showRaceModal.value = true
  try {
    await alpineStore.fetchEvent(event.id)
  } catch (error) {
    console.error('Failed to load event:', error)
  }
}

function closeRaceModal() {
  stopAnimation()
  showRaceModal.value = false
  selectedEvent.value = null
  alpineStore.clearCurrentEvent()
  loadSeason()
}

function stopAnimation() {
  if (animationInterval.value) {
    clearInterval(animationInterval.value)
    animationInterval.value = null
  }
  isRaceInProgress.value = false
}

// ============ RACE ANIMATION ============

async function startRaceAnimation() {
  isRaceInProgress.value = true
  raceTimer.value = 0
  currentRun.value = 1
  currentRacePhase.value = 'Simulating race...'
  skierDNF.value = false
  liveStandings.value = []
  leaderSplit.value = null
  currentSplit.value = null
  splitPassed.value = false
  waitingForNextSkier.value = false

  // Generate gates for this discipline
  courseGates.value = generateCourseGates(selectedEvent.value?.discipline)

  // Simulate on backend first
  try {
    const response = await alpineStore.simulateRace(selectedEvent.value.id)
    backendResults.value = response.results || []

    if (response.needsRun2) {
      // Two-run race - animate Run 1
      currentRacePhase.value = 'Run 1 Starting...'
    } else {
      currentRacePhase.value = 'Race Starting...'
    }
  } catch (error) {
    console.error('Failed to simulate race:', error)
    isRaceInProgress.value = false
    return
  }

  if (backendResults.value.length === 0) {
    isRaceInProgress.value = false
    await alpineStore.fetchEvent(selectedEvent.value.id)
    return
  }

  // Shuffle order for animation
  allSkierResults.value = [...backendResults.value].sort(() => Math.random() - 0.5)
  currentSkierIndex.value = 0
  animateNextSkier()
}

async function startRun2Animation() {
  isRaceInProgress.value = true
  raceTimer.value = 0
  currentRun.value = 2
  currentRacePhase.value = 'Simulating Run 2...'
  skierDNF.value = false
  liveStandings.value = []
  leaderSplit.value = null
  currentSplit.value = null
  splitPassed.value = false
  waitingForNextSkier.value = false

  // Generate gates
  courseGates.value = generateCourseGates(selectedEvent.value?.discipline)

  // Simulate Run 2 on backend
  try {
    const response = await alpineStore.simulateRun2(selectedEvent.value.id)
    backendResults.value = response.finalResults || []
    currentRacePhase.value = 'Run 2 Starting...'
  } catch (error) {
    console.error('Failed to simulate run 2:', error)
    isRaceInProgress.value = false
    return
  }

  if (backendResults.value.length === 0) {
    isRaceInProgress.value = false
    await alpineStore.fetchEvent(selectedEvent.value.id)
    return
  }

  // For Run 2, only include skiers who actually participated in Run 2
  // They have run1Time (qualified from Run 1) and either run2Time (finished) or totalFormatted contains 'Run 2' (DNF in Run 2)
  const run2Skiers = backendResults.value.filter(r =>
    r.run1Time !== undefined &&
    !r.didNotQualifyForRun2 &&
    (r.run2Time !== undefined || (r.dnf && r.totalFormatted?.includes('Run 2')))
  )
  allSkierResults.value = [...run2Skiers].reverse()
  currentSkierIndex.value = 0
  animateNextSkier()
}

function animateNextSkier() {
  if (currentSkierIndex.value >= allSkierResults.value.length) {
    finishRaceAnimation()
    return
  }

  const skierResult = allSkierResults.value[currentSkierIndex.value]
  currentRacePhase.value = `${skierResult.lastName} - Bib ${currentSkierIndex.value + 1}`
  skierDNF.value = false
  splitPassed.value = false
  currentSplit.value = null

  // Initialize skier position at course start
  // For Run 2: use run2Time for finishers, or time (from simulateRun) for DNFs
  const isRun2Dnf = currentRun.value === 2 && skierResult.dnf && !skierResult.run2Time
  const runTime = currentRun.value === 2
    ? (skierResult.run2Time || skierResult.time || 60) // Use time from simulateRun for Run 2 DNFs
    : skierResult.time

  currentSkier.value = {
    id: skierResult.skierId,
    firstName: skierResult.firstName,
    lastName: skierResult.lastName,
    country: skierResult.country,
    x: courseStart.x,
    y: courseStart.y,
    finished: false,
    dnf: skierResult.dnf || false,
    dnfGate: skierResult.dnfGate || null,
    actualTime: runTime,
    actualTimeFormatted: currentRun.value === 2 ? (skierResult.run2Formatted || skierResult.timeFormatted) : skierResult.timeFormatted
  }

  raceTimer.value = 0

  // Start animation loop
  let lastTime = Date.now()
  let animationProgress = 0
  const config = disciplineConfigs[selectedEvent.value?.discipline] || disciplineConfigs.slalom
  const targetTime = currentSkier.value.actualTime || 60
  // Animation duration is actual time compressed - slower for better viewing
  // e.g., 50s race = 8s animation, 120s race = 12s animation
  // Animation duration - 25% faster than before (multiply by 0.75)
  const animationDuration = Math.max(4.5, Math.min(9, targetTime / 6)) * 0.75

  animationInterval.value = setInterval(() => {
    const now = Date.now()
    const delta = (now - lastTime) / 1000
    lastTime = now

    if (currentSkier.value.finished || skierDNF.value) {
      clearInterval(animationInterval.value)

      // Add to standings
      if (!skierDNF.value) {
        const timeValue = currentRun.value === 2
          ? (skierResult.totalTime || skierResult.run2Time)
          : skierResult.time

        liveStandings.value.push({
          skierId: skierResult.skierId,
          lastName: skierResult.lastName,
          country: skierResult.country,
          time: timeValue,
          timeFormatted: currentRun.value === 2
            ? (skierResult.totalFormatted || skierResult.run2Formatted)
            : skierResult.timeFormatted,
          dnf: false,
          splitTime: currentSplit.value?.time || null
        })

        // Sort by time
        liveStandings.value.sort((a, b) => {
          if (a.dnf && b.dnf) return 0
          if (a.dnf) return 1
          if (b.dnf) return -1
          return a.time - b.time
        })

        // Calculate time behind leader
        const leaderTime = liveStandings.value[0]?.time || 0
        liveStandings.value.forEach((s, idx) => {
          s.timeBehind = idx === 0 ? 0 : s.time - leaderTime
        })
      } else {
        liveStandings.value.push({
          skierId: skierResult.skierId,
          lastName: skierResult.lastName,
          country: skierResult.country,
          time: null,
          timeFormatted: 'DNF',
          dnf: true
        })
        // Sort to ensure DNFs are at the end
        liveStandings.value.sort((a, b) => {
          if (a.dnf && b.dnf) return 0
          if (a.dnf) return 1
          if (b.dnf) return -1
          return a.time - b.time
        })
      }

      // Wait for user click to go to next skier
      waitingForNextSkier.value = true
      return
    }

    // Update animation progress and display timer
    animationProgress += delta
    const timeProgress = Math.min(animationProgress / animationDuration, 1)
    // Display timer shows actual race time progressing proportionally
    raceTimer.value = targetTime * timeProgress

    // Check for split time at 50% (intermediate time)
    if (!splitPassed.value && timeProgress >= 0.5 && !currentSkier.value.dnf) {
      splitPassed.value = true
      const splitTime = targetTime * 0.5 // Approximate split time at halfway

      // Calculate position vs leader split
      let splitDiff = null
      let splitPosition = 1

      if (leaderSplit.value) {
        splitDiff = splitTime - leaderSplit.value.time
        // Count how many have better split times
        splitPosition = liveStandings.value.filter(s => !s.dnf && s.splitTime && s.splitTime < splitTime).length + 1
      }

      // Update leader split if this is the best
      if (!leaderSplit.value || splitTime < leaderSplit.value.time) {
        leaderSplit.value = { time: splitTime, lastName: currentSkier.value.lastName, country: currentSkier.value.country }
      }

      currentSplit.value = {
        time: splitTime,
        diff: splitDiff,
        position: splitPosition,
        isLeader: !splitDiff || splitDiff <= 0
      }
    }

    // Move skier along vertical course (top to bottom)
    const progress = timeProgress
    const discipline = selectedEvent.value?.discipline || 'slalom'

    // Y position moves from top to bottom
    currentSkier.value.y = courseStart.y + (courseEnd.y - courseStart.y) * progress

    // X position oscillates through gates
    const oscillation = Math.sin(progress * Math.PI * 6) * config.oscillation * 0.7
    currentSkier.value.x = courseStart.x + oscillation

    // Check for DNF - use backend gate count for accurate progress calculation
    if (currentSkier.value.dnf && currentSkier.value.dnfGate) {
      const discipline = selectedEvent.value?.discipline || 'slalom'
      const backendGateCount = backendGateCounts[discipline] || 65
      const dnfProgress = currentSkier.value.dnfGate / backendGateCount
      if (progress >= dnfProgress) {
        skierDNF.value = true
        dnfPosition.value = { x: currentSkier.value.x, y: currentSkier.value.y }
        currentRacePhase.value = `${currentSkier.value.lastName} - DNF!`
      }
    }

    // Check finish
    if (progress >= 1) {
      currentSkier.value.finished = true
      currentSkier.value.x = courseEnd.x
      currentSkier.value.y = courseEnd.y
    }
  }, 30)
}

function finishRaceAnimation() {
  stopAnimation()
  currentSkier.value = null
  isRaceInProgress.value = false
  alpineStore.fetchEvent(selectedEvent.value.id)
}

function skipAnimation() {
  stopAnimation()
  currentSkier.value = null
  alpineStore.fetchEvent(selectedEvent.value.id)
}

function goToNextSkier() {
  if (!waitingForNextSkier.value) return
  waitingForNextSkier.value = false
  currentSkierIndex.value++
  animateNextSkier()
}

// Lifecycle
onMounted(async () => {
  if (!worldId.value) {
    router.push('/dashboard')
    return
  }

  if (!world.value || world.value.id !== worldId.value) {
    await worldsStore.fetchWorld(worldId.value)
  }

  try {
    await Promise.all([
      alpineStore.fetchSkiers(worldId.value),
      teamsStore.fetchTeams(worldId.value, 'alpine'),
      weekStatusStore.fetchWeekStatus(worldId.value)
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loadingSkiers.value = false
  }

  loadSeason()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
/* Base styles - Light Theme */
.alpine-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
}

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
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  padding: 0.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: #3b82f6;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #64748b;
}

.separator {
  color: #cbd5e1;
  font-size: 0.7rem;
}

.world-name, .sport-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sport-name {
  color: #3b82f6;
  font-weight: 500;
}

/* Main Navigation */
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
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
}

.nav-tab:hover {
  background: #f8fafc;
}

.nav-tab.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.nav-tab:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-tab-icon {
  font-size: 1.125rem;
}

.nav-tab-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}

.nav-tab-label {
  font-weight: 600;
  font-size: 0.875rem;
}

.nav-tab-badge, .nav-tab-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.nav-tab-badge i {
  font-size: 0.5rem;
  color: var(--success-500);
}

.nav-tab-leader {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.leader-flag {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

/* Main Content */
.page-main {
  padding: 1.5rem 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.section-title .count {
  font-weight: 400;
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

/* Loading and Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--primary-500);
}

.empty-state .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.warning-text {
  color: var(--warning-600);
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Athletes Table */
.athletes-table-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.athletes-table {
  width: 100%;
  border-collapse: collapse;
}

.athletes-table th, .athletes-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.athletes-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
}

.athletes-table tr.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}

.athletes-table tr.clickable-row:hover {
  background: #f8fafc;
}

.col-country {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flag {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.country-code {
  font-size: 0.75rem;
  color: #94a3b8;
}

.col-skill {
  text-align: center;
  width: 50px;
}

.skill-elite { color: var(--success-600); font-weight: 700; }
.skill-high { color: var(--primary-600); font-weight: 600; }
.skill-good { color: #1e293b; }
.skill-average { color: #94a3b8; }
.skill-low { color: var(--danger-500); }

.overall {
  font-weight: 700;
}

.col-actions {
  display: flex;
  gap: 0.25rem;
}

.delete-btn:hover {
  color: var(--danger-500);
}

/* Season Content */
.season-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.season-header-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.season-info h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.alpine-icon {
  color: var(--primary-500);
}

.season-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-text {
  font-size: 0.875rem;
  color: #94a3b8;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: #f8fafc;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-500);
  transition: width 0.3s;
}

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.calendar-event {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-event:hover {
  border-color: var(--primary-300);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.calendar-event.completed {
  opacity: 0.85;
}

.calendar-event.is-locked { opacity: 0.6; cursor: not-allowed; position: relative; }
.calendar-event.is-locked:hover { transform: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.lock-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(100, 116, 139, 0.85); border-radius: 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; z-index: 10; color: white; }
.lock-overlay i { font-size: 1.5rem; }
.lock-overlay span { font-size: 0.875rem; font-weight: 600; }

.calendar-event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.event-number-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--text-secondary);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50%;
}

.discipline-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.discipline-badge.downhill { background: #fef3c7; color: #b45309; }
.discipline-badge.super_g { background: #fee2e2; color: #dc2626; }
.discipline-badge.giant_slalom { background: #dbeafe; color: #2563eb; }
.discipline-badge.slalom { background: #dcfce7; color: #16a34a; }
.discipline-badge.combined { background: #f3e8ff; color: #9333ea; }

.event-status-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.625rem;
}

.event-status-badge.scheduled { background: #f8fafc; color: #94a3b8; }
.event-status-badge.run1_completed { background: #fef3c7; color: #b45309; }
.event-status-badge.completed { background: #dcfce7; color: #16a34a; }

.calendar-event-body {
  padding: 1rem;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.event-flag-large {
  width: 36px;
  height: 27px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.location-details {
  display: flex;
  flex-direction: column;
}

.location-name {
  font-weight: 600;
  color: #1e293b;
}

.location-country {
  font-size: 0.75rem;
  color: #94a3b8;
}

.event-race-info {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.event-date-display {
  font-size: 0.875rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.calendar-event-podium {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-top: 1px solid var(--border-color);
}

.podium-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.podium-pos {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.625rem;
  font-weight: 700;
}

.podium-pos.gold { background: #fbbf24; color: white; }
.podium-pos.silver { background: #94a3b8; color: white; }
.podium-pos.bronze { background: #d97706; color: white; }

.podium-flag-sm {
  width: 18px;
  height: 13px;
  object-fit: cover;
  border-radius: 2px;
}

.calendar-event-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color);
}

/* Standings */
.standings-compact {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.standings-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.standings-switch {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8125rem;
  color: #94a3b8;
  transition: all 0.15s;
}

.standings-switch:hover:not(.disabled) {
  background: var(--primary-50);
}

.standings-switch.active {
  background: var(--primary-500);
  color: white;
}

.standings-switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.standings-switch.downhill.active { background: #f59e0b; }
.standings-switch.super_g.active { background: #ef4444; }
.standings-switch.giant_slalom.active { background: #3b82f6; }
.standings-switch.slalom.active { background: #22c55e; }

.switch-count {
  font-size: 0.625rem;
  opacity: 0.7;
}

.standings-panel {
  padding: 1rem;
}

.no-standings {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
}

.no-standings i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.standings-list-compact {
  display: flex;
  flex-direction: column;
}

.standing-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.standing-row:last-child {
  border-bottom: none;
}

.standing-row.top-3 {
  background: #f8fafc;
}

.standing-rank {
  width: 28px;
  text-align: center;
}

.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.medal.gold { background: #fbbf24; color: white; }
.medal.silver { background: #94a3b8; color: white; }
.medal.bronze { background: #d97706; color: white; }

.rank-num {
  color: #94a3b8;
  font-size: 0.875rem;
}

.standing-flag-sm {
  width: 22px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.standing-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.standing-name-compact {
  font-weight: 600;
  font-size: 0.875rem;
}

.standing-firstname {
  font-size: 0.75rem;
  color: #94a3b8;
}

.standing-data {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.standing-pts {
  font-weight: 700;
  color: var(--primary-600);
}

.standing-races-sm {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: visible;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}

.modal.modal-lg {
  max-width: 700px;
}

.modal.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.modal-header h2 {
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-body {
  padding: 1.25rem;
  overflow: visible;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
}

/* Race Modal */
.race-modal {
  max-width: 1000px;
  max-height: 95vh;
}

.race-modal-header {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.race-modal-header .btn-ghost {
  color: white;
}

.race-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.race-flag {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.race-details h2 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.discipline-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.runs-info {
  opacity: 0.8;
  font-size: 0.75rem;
}

.race-modal-body {
  padding: 0;
  min-height: 400px;
}

/* Race Start Panel */
.race-start-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.race-preview {
  margin-bottom: 2rem;
}

.race-preview-icon {
  font-size: 3rem;
  color: var(--primary-500);
  margin-bottom: 1rem;
}

.race-preview-count {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.race-preview-details {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  color: #94a3b8;
}

.run1-results-preview {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.run1-results-preview h3 {
  margin-bottom: 1rem;
  color: var(--success-600);
}

.run1-top3 {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.run1-result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.pos-badge {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.625rem;
  font-weight: 700;
}

.pos-badge.gold { background: #fbbf24; color: white; }
.pos-badge.silver { background: #94a3b8; color: white; }
.pos-badge.bronze { background: #d97706; color: white; }

.mini-flag {
  width: 20px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
}

.run1-result-item .name {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.run1-result-item .time {
  font-family: monospace;
  color: #94a3b8;
}

.run2-info {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Race Animation */
.race-animation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.race-animation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.race-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  font-family: monospace;
  color: var(--primary-600);
}

.race-status-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-label {
  font-weight: 600;
  color: #1e293b;
}

.run-indicator {
  padding: 0.25rem 0.5rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.race-animation-content {
  display: grid;
  grid-template-columns: 1fr 280px;
  flex: 1;
  min-height: 350px;
}

.alpine-animation {
  background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
}

.alpine-course-container {
  padding: 0.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.alpine-course-svg {
  width: auto;
  height: 100%;
  max-height: 420px;
  max-width: 100%;
}

/* Live Leaderboard */
.live-leaderboard {
  background: white;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.alpine-leaderboard {
  background: rgba(255,255,255,0.95);
}

.leaderboard-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-weight: 600;
  font-size: 0.875rem;
}

.current-athlete-card {
  padding: 0.75rem 1rem;
  background: var(--primary-50);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.current-label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary-600);
  margin-bottom: 0.25rem;
}

.current-athlete-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current-flag {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
}

.current-name {
  font-weight: 600;
}

.current-time {
  font-family: monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-600);
  margin-top: 0.25rem;
}

/* Split time display */
.split-time-display {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 0.375rem;
  border: 1px solid #bae6fd;
}

.split-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.125rem;
}

.split-time {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0369a1;
}

.split-diff {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 700;
  margin-top: 0.125rem;
}

.split-diff.ahead {
  color: #16a34a;
}

.split-diff.behind {
  color: #dc2626;
}

.split-leader-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #f59e0b;
  font-size: 0.75rem;
  font-weight: 600;
}

/* WC Ranking badges */
.skier-wc-badge {
  background: var(--gray-200);
  color: var(--gray-700);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
}
.skier-wc-badge.top-3 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}
.skier-discipline-badge {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
}
.skier-discipline-badge.top-3 {
  background: var(--primary-500);
  color: white;
}

/* Run 1 info during Run 2 */
.run1-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 0.25rem;
}
.run1-label {
  color: var(--gray-500);
  font-weight: 500;
}
.run1-rank {
  font-weight: 700;
  color: var(--primary-600);
}
.run1-time {
  font-family: monospace;
  color: var(--gray-700);
}
.run1-behind {
  color: var(--red-500);
  font-size: 0.7rem;
}

.leaderboard-entries {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.leaderboard-entry.leader {
  background: var(--warning-50);
}

.leaderboard-entry.dnf {
  opacity: 0.6;
}

.entry-rank {
  width: 20px;
  text-align: center;
  font-weight: 600;
}

.entry-rank.gold { color: #f59e0b; }
.entry-rank.silver { color: #64748b; }
.entry-rank.bronze { color: #d97706; }

.entry-flag {
  width: 18px;
  height: 13px;
  object-fit: cover;
  border-radius: 2px;
}

.entry-name {
  flex: 1;
  font-weight: 500;
}

.entry-time {
  font-family: monospace;
  font-size: 0.75rem;
}

.entry-dnf {
  color: var(--danger-500);
  font-weight: 600;
}

.entry-behind {
  font-family: monospace;
  font-size: 0.625rem;
  color: #94a3b8;
}

/* Results */
.race-results {
  padding: 1rem;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.results-header.completed {
  background: var(--success-50);
  color: var(--success-700);
}

.results-table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.results-table th, .results-table td {
  padding: 0.625rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.results-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
}

.results-table tr.podium {
  background: var(--warning-50);
}

.results-table tr.dnf-row {
  opacity: 0.6;
}

.result-flag {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
}

.col-time {
  font-family: monospace;
}

/* Forms */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #94a3b8;
}

.form-group input, .form-group select {
  padding: 0.625rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Country search dropdown */
.country-search-group {
  position: relative;
  overflow: visible;
}
.country-select-group {
  position: relative;
}
.country-select-wrapper {
  position: relative;
  overflow: visible;
}
.country-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.country-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}
.country-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  z-index: 9999;
  margin-top: 4px;
}
.country-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.15s;
}
.country-item:hover {
  background: var(--primary-100);
}
.country-item.selected {
  background: var(--primary-50);
  font-weight: 500;
}
.country-item.no-results {
  color: #94a3b8;
  font-style: italic;
  cursor: default;
}
.country-item.no-results:hover {
  background: transparent;
}

.form-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.randomize-buttons {
  display: flex;
  gap: 0.25rem;
}

.skill-value {
  font-family: monospace;
  color: var(--primary-600);
}

.skills-row input[type="range"] {
  width: 100%;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-600);
}

.btn-secondary {
  background: #f8fafc;
  color: #1e293b;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-ghost {
  background: transparent;
  color: #94a3b8;
}

.btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
}

.btn-danger {
  background: var(--danger-500);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--danger-600);
}

.btn-warning {
  background: var(--warning-500);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: var(--warning-600);
}

.btn-lg {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.text-danger {
  color: var(--danger-500);
}

/* Animations */
.fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Competitor Modal */
.competitor-modal-overlay {
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

.competitor-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.competitor-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.competitor-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.competitor-flag {
  width: 32px;
  height: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.competitor-details h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.competitor-standing {
  font-size: 0.8125rem;
  opacity: 0.9;
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.competitor-modal-content {
  padding: 1rem 1.25rem;
  max-height: 60vh;
  overflow-y: auto;
}

.results-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--gray-700);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.competitor-results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}

.result-row.podium {
  background: var(--primary-50);
}

.result-event {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.result-location {
  font-weight: 600;
  font-size: 0.875rem;
}

.result-type {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
}

.result-position {
  width: 36px;
  text-align: center;
}

.result-position .position {
  font-weight: 600;
  color: var(--gray-600);
}

.result-position .position.dnf {
  color: var(--gray-400);
}

.result-points {
  width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--primary-600);
  font-size: 0.875rem;
}

.competitor-modal .no-results {
  text-align: center;
  padding: 2rem;
  color: var(--gray-400);
}

.standing-row.clickable {
  cursor: pointer;
}

/* Teams Tab Styles */
.teams-content { display: flex; flex-direction: column; gap: 2rem; }
.team-standings-section { background: white; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid var(--gray-200); }
.team-standings-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.team-standing-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--gray-50); border-radius: 0.5rem; border-left: 4px solid; }
.team-standing-clickable { cursor: pointer; transition: all 0.2s; }
.team-standing-clickable:hover { background: var(--gray-100); transform: translateX(4px); }
.team-standing-position { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.team-standing-position .position { font-weight: 600; color: var(--gray-600); font-size: 0.875rem; }
.team-standing-logo { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-standing-logo img { width: 100%; height: 100%; object-fit: contain; }
.team-standing-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.team-standing-name { font-weight: 600; color: var(--gray-800); }
.team-standing-skiers { font-size: 0.75rem; color: var(--gray-500); }
.team-standing-points { font-weight: 700; font-size: 1.125rem; color: var(--primary-600); }

.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.team-card { background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid var(--gray-200); border-top: 4px solid; cursor: pointer; transition: all 0.2s; }
.team-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
.team-card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
.team-logo { width: 48px; height: 48px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.875rem; }
.team-logo img { width: 100%; height: 100%; object-fit: contain; }
.team-info h4 { font-weight: 600; color: var(--gray-800); margin: 0; }
.team-skier-count { font-size: 0.75rem; color: var(--gray-500); }
.team-description { font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1rem; }
.team-card-actions { display: flex; gap: 0.5rem; }

.team-modal { max-width: 480px; }
.team-modal .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.color-picker-wrapper { display: flex; align-items: center; gap: 0.5rem; }
.color-picker { width: 40px; height: 40px; padding: 0; border: none; cursor: pointer; }
.color-preview { width: 24px; height: 24px; border-radius: 0.25rem; border: 1px solid var(--gray-300); }

.team-standing-detail-modal { max-width: 500px; }
.team-modal-header-info { display: flex; align-items: center; gap: 1rem; }
.team-logo-small { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-total-points { font-size: 0.875rem; color: var(--gray-500); }
.team-skiers-list { max-height: 400px; overflow-y: auto; }
.empty-team-skiers { text-align: center; padding: 2rem; color: var(--gray-400); }
.team-skier-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--gray-100); }
.team-skier-item:last-child { border-bottom: none; }
.skier-wc-rank { width: 36px; text-align: center; font-weight: 600; color: var(--gray-500); }
.skier-wc-rank .rank-leader { color: var(--success-600); }
.skier-wc-rank .rank-none { color: var(--gray-300); }
.skier-flag-small { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; }
.skier-name-full { flex: 1; font-weight: 500; }
.skier-wc-points { font-weight: 600; color: var(--primary-600); }

.section-subtitle { font-size: 1rem; font-weight: 600; color: var(--gray-700); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.section-subtitle i { color: var(--primary-500); }

/* Responsive */
@media (max-width: 768px) {
  .race-animation-content {
    grid-template-columns: 1fr;
  }

  .live-leaderboard {
    border-left: none;
    border-top: 1px solid var(--border-color);
    max-height: 200px;
  }

  .nav-tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .standings-switcher {
    overflow-x: auto;
  }
}

/* Team Standings Styles */
.standings-panel.teams-panel {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.standings-switch.teams.active {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border-color: #16a34a;
}

.standings-switch.teams.active i {
  color: white;
}

.standings-switch.teams.active .switch-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.teams-panel .standing-row {
  background: rgba(255, 255, 255, 0.8);
}

.teams-panel .standing-row:hover {
  background: white;
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
  text-transform: uppercase;
  flex-shrink: 0;
}

.standing-pts.team-pts {
  color: #16a34a;
  font-weight: 700;
}

.standing-stats-sm {
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #64748b;
}

.standing-stats-sm span {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.standing-stats-sm i {
  font-size: 0.65rem;
}
</style>
