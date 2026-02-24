<template>
  <div class="sport-page biathlon">
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
            <i class="fa-solid fa-bullseye"></i>
            Biathlon
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
            :class="['nav-tab', { active: activeTab === 'athletes' }]"
            @click="activeTab = 'athletes'"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Athletes</span>
              <span class="nav-tab-count" v-if="athletes.length">{{ athletes.length }}</span>
            </div>
          </button>
        </div>
      </div>
    </nav>

    <main class="page-main">
      <div class="container">

        <!-- Athletes Tab -->
        <div v-if="activeTab === 'athletes'" class="tab-content fade-in">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fa-solid fa-users"></i>
              Biathletes
              <span class="count" v-if="athletes.length">({{ athletes.length }})</span>
            </h2>
            <div class="actions">
              <button
                v-if="athletes.length === 0"
                @click="handleGenerateAthletes"
                class="btn btn-secondary"
                :disabled="generating"
              >
                <i v-if="generating" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                {{ generating ? 'Generating...' : 'Generate 60 Athletes' }}
              </button>
              <button
                v-if="athletes.length > 0"
                @click="openAddAthleteModal"
                class="btn btn-primary"
              >
                <i class="fa-solid fa-plus"></i>
                Add Athlete
              </button>
              <button
                v-if="athletes.length > 0"
                @click="showDeleteAllAthletesConfirm = true"
                class="btn btn-ghost text-danger"
              >
                <i class="fa-solid fa-trash"></i>
                Delete All
              </button>
            </div>
          </div>

          <div v-if="loadingAthletes" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading athletes...
          </div>

          <div v-else-if="athletes.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-bullseye"></i>
            </div>
            <h3>No Athletes Yet</h3>
            <p>Generate a roster of biathletes or add them manually.</p>
            <button @click="openAddAthleteModal" class="btn btn-secondary" style="margin-top: 0.5rem;">
              <i class="fa-solid fa-plus"></i> Add Athlete Manually
            </button>
          </div>

          <div v-else class="athletes-table-container">
            <table class="athletes-table">
              <thead>
                <tr>
                  <th class="col-country">Country</th>
                  <th class="col-name">Name</th>
                  <th class="col-skill">SKI</th>
                  <th class="col-skill">SH-P</th>
                  <th class="col-skill">SH-S</th>
                  <th class="col-skill">END</th>
                  <th class="col-skill">CON</th>
                  <th class="col-skill">OVR</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="athlete in athletes" :key="athlete.id" @click="openEditAthleteModal(athlete)" class="clickable-row">
                  <td class="col-country">
                    <img :src="`/flags/${athlete.country}.png`" :alt="countryNames[athlete.country]" class="flag" />
                    <span class="country-code">{{ athlete.country }}</span>
                  </td>
                  <td class="col-name">{{ athlete.last_name }} {{ athlete.first_name }}</td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_skiing)">{{ athlete.skill_skiing }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_shooting_prone)">{{ athlete.skill_shooting_prone }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_shooting_standing)">{{ athlete.skill_shooting_standing }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_endurance)">{{ athlete.skill_endurance }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.consistency)">{{ athlete.consistency }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(getOverall(athlete))" class="overall">{{ getOverall(athlete) }}</span></td>
                  <td class="col-actions" @click.stop>
                    <button @click="openEditAthleteModal(athlete)" class="btn btn-ghost btn-sm" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button @click="confirmDeleteAthlete(athlete)" class="btn btn-ghost btn-sm delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
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
            <p>Start a new Biathlon World Cup season to begin competing.</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason || athletes.length === 0">
              <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingSeason ? 'Creating...' : 'Start New Season' }}
            </button>
            <p v-if="athletes.length === 0" class="warning-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Generate athletes first before starting a season.
            </p>
          </div>

          <div v-else class="season-content">
            <div class="season-header-card">
              <div class="season-info">
                <h2><i class="fa-solid fa-trophy biathlon-icon"></i> Biathlon World Cup {{ currentSeason.name }}</h2>
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
                  :class="['calendar-event', event.status, getRaceTypeClass(event.race_type), { 'is-locked': weekStatusStore.isEventLocked(event.date) }]"
                  @click="handleEventClick(event)"
                >
                  <div v-if="weekStatusStore.isEventLocked(event.date)" class="lock-overlay">
                    <i class="fa-solid fa-lock"></i>
                    <span>Week Locked</span>
                  </div>
                  <div class="calendar-event-header">
                    <span class="event-number-badge">{{ index + 1 }}</span>
                    <span class="race-type-badge" :class="event.race_type">
                      <i :class="getRaceTypeIcon(event.race_type)"></i> {{ getRaceTypeName(event.race_type) }}
                    </span>
                    <span class="event-status-badge" :class="event.status">
                      <i v-if="event.status === 'completed'" class="fa-solid fa-check"></i>
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
                      <span class="race-distance">{{ event.distance }}km</span>
                      <span class="race-shootings">{{ event.shootings }} shootings</span>
                    </div>
                    <div class="event-date-display">
                      <i class="fa-solid fa-calendar-day"></i>
                      {{ formatDate(event.date) }}
                    </div>
                  </div>
                  <div v-if="event.status === 'completed' && getEventPodium(event).length > 0" class="calendar-event-podium">
                    <div v-for="(podium, pIndex) in getEventPodium(event)" :key="podium.athleteId" class="podium-item">
                      <span :class="['podium-pos', pIndex === 0 ? 'gold' : pIndex === 1 ? 'silver' : 'bronze']">
                        {{ pIndex + 1 }}
                      </span>
                      <img :src="`/flags/${podium.country}.png`" class="podium-flag-sm" />
                      <span class="podium-name">{{ podium.lastName }}</span>
                    </div>
                  </div>
                  <div class="calendar-event-footer">
                    <button class="btn btn-sm" :class="event.status === 'completed' ? 'btn-ghost' : 'btn-primary'">
                      <i :class="event.status === 'completed' ? 'fa-solid fa-eye' : 'fa-solid fa-play'"></i>
                      {{ event.status === 'completed' ? 'View Results' : 'Start Race' }}
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
                :class="['standings-switch sprint', { active: standingsView === 'sprint', disabled: disciplineStandings.sprint.length === 0 }]"
                @click="disciplineStandings.sprint.length > 0 && (standingsView = 'sprint')"
                :disabled="disciplineStandings.sprint.length === 0"
              >
                <i class="fa-solid fa-bolt"></i>
                <span>Sprint</span>
              </button>
              <button
                :class="['standings-switch pursuit', { active: standingsView === 'pursuit', disabled: disciplineStandings.pursuit.length === 0 }]"
                @click="disciplineStandings.pursuit.length > 0 && (standingsView = 'pursuit')"
                :disabled="disciplineStandings.pursuit.length === 0"
              >
                <i class="fa-solid fa-person-running"></i>
                <span>Pursuit</span>
              </button>
              <button
                :class="['standings-switch individual', { active: standingsView === 'individual', disabled: disciplineStandings.individual.length === 0 }]"
                @click="disciplineStandings.individual.length > 0 && (standingsView = 'individual')"
                :disabled="disciplineStandings.individual.length === 0"
              >
                <i class="fa-solid fa-person-skiing-nordic"></i>
                <span>Individual</span>
              </button>
              <button
                :class="['standings-switch mass_start', { active: standingsView === 'mass_start', disabled: disciplineStandings.mass_start.length === 0 }]"
                @click="disciplineStandings.mass_start.length > 0 && (standingsView = 'mass_start')"
                :disabled="disciplineStandings.mass_start.length === 0"
              >
                <i class="fa-solid fa-users"></i>
                <span>Mass Start</span>
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
                  :key="standing.athleteId"
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
                  :key="standing.athleteId"
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
              <span class="race-type-label" :class="selectedEvent?.race_type">
                <i :class="getRaceTypeIcon(selectedEvent?.race_type)"></i>
                {{ getRaceTypeName(selectedEvent?.race_type) }} - {{ selectedEvent?.distance }}km
              </span>
            </div>
          </div>
          <button @click="closeRaceModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body race-modal-body">
          <!-- Not started - Show start button -->
          <div v-if="!isRaceInProgress && !raceResults?.final" class="race-start-panel">
            <div class="race-preview">
              <div class="race-preview-icon">
                <i :class="getRaceTypeIcon(selectedEvent?.race_type)"></i>
              </div>
              <p class="race-preview-count"><strong>{{ athletes.length }}</strong> athletes ready to compete</p>
              <p class="race-preview-details">
                <span><i class="fa-solid fa-route"></i> {{ selectedEvent?.distance }}km</span>
                <span><i class="fa-solid fa-bullseye"></i> {{ selectedEvent?.shootings }} shootings</span>
              </p>
            </div>
            <button @click="startRaceAnimation" class="btn btn-primary btn-lg">
              <i class="fa-solid fa-play"></i>
              Watch Race
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
                <div v-if="isIntervalMode && totalAthletesToRace > 0" class="interval-progress">
                  <div class="interval-progress-bar">
                    <div class="interval-progress-fill" :style="{ width: (currentAthleteIndex / totalAthletesToRace * 100) + '%' }"></div>
                  </div>
                  <span class="interval-count">{{ currentAthleteIndex }}/{{ totalAthletesToRace }}</span>
                </div>
              </div>
              <button @click="skipAnimation" class="btn btn-ghost btn-sm">
                <i class="fa-solid fa-forward-fast"></i> Skip
              </button>
            </div>

            <!-- Main Animation Area - New Layout: Track on top, panels below -->
            <div class="race-animation-content">
              <!-- SVG Track Animation - Full Width -->
              <div class="race-track-container">
                <svg viewBox="0 0 800 220" class="biathlon-track-svg">
                  <defs>
                    <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#f0f9ff" />
                      <stop offset="100%" style="stop-color:#e0f2fe" />
                    </linearGradient>
                  </defs>

                  <!-- Background -->
                  <rect x="0" y="0" width="800" height="220" fill="url(#snowGradient)" />

                  <!-- Mountain silhouette background -->
                  <path d="M 0 200 L 100 140 L 200 160 L 350 100 L 450 130 L 550 90 L 650 110 L 750 100 L 800 130 L 800 220 L 0 220 Z"
                    fill="#94a3b8" opacity="0.15" />

                  <!-- Track - centered vertically -->
                  <path d="M 30 110 Q 200 95, 400 110 T 770 110"
                    fill="none" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round" />
                  <path d="M 30 110 Q 200 95, 400 110 T 770 110"
                    fill="none" stroke="white" stroke-width="14" stroke-linecap="round" />
                  <path d="M 30 110 Q 200 95, 400 110 T 770 110"
                    fill="none" stroke="#e0f2fe" stroke-width="6" stroke-linecap="round" stroke-dasharray="6,4" opacity="0.6" />

                  <!-- Shooting Ranges - varies by race type -->
                  <template v-if="isIntervalMode && !isIndividualRace">
                    <!-- 2 Ranges for Sprint -->
                    <g class="range range-1">
                      <rect x="200" y="55" width="60" height="35" rx="4" fill="#1e293b" opacity="0.85" />
                      <text x="230" y="47" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="bold">PRONE</text>
                      <circle v-for="t in 5" :key="'t1-'+t" :cx="207 + t*10" cy="73" r="5"
                        :fill="getTargetColor(0, t-1)" stroke="white" stroke-width="1" />
                    </g>
                    <g class="range range-2">
                      <rect x="500" y="55" width="60" height="35" rx="4" fill="#1e293b" opacity="0.85" />
                      <text x="530" y="47" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="bold">STAND</text>
                      <circle v-for="t in 5" :key="'t2-'+t" :cx="507 + t*10" cy="73" r="5"
                        :fill="getTargetColor(1, t-1)" stroke="white" stroke-width="1" />
                    </g>
                  </template>
                  <template v-else-if="isIntervalMode && isIndividualRace">
                    <!-- 4 Ranges for Individual -->
                    <g v-for="(range, rIdx) in [{x: 150, label: 'P1'}, {x: 300, label: 'P2'}, {x: 450, label: 'S1'}, {x: 600, label: 'S2'}]"
                       :key="'range-'+rIdx" class="range">
                      <rect :x="range.x" y="55" width="50" height="32" rx="3" fill="#1e293b" opacity="0.85" />
                      <text :x="range.x + 25" y="48" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="bold">{{ range.label }}</text>
                      <circle v-for="t in 5" :key="'t'+rIdx+'-'+t" :cx="range.x + 5 + t*9" cy="72" r="4"
                        :fill="getTargetColor(rIdx, t-1)" stroke="white" stroke-width="1" />
                    </g>
                  </template>
                  <template v-else>
                    <!-- 4 Ranges for Mass/Pursuit - smaller, more compact -->
                    <g v-for="(range, rIdx) in [{x: 165, label: 'P1'}, {x: 305, label: 'P2'}, {x: 445, label: 'S1'}, {x: 585, label: 'S2'}]"
                       :key="'range-'+rIdx" class="range">
                      <rect :x="range.x" y="55" width="45" height="28" rx="3" fill="#1e293b" opacity="0.8" />
                      <text :x="range.x + 22" y="48" text-anchor="middle" fill="#94a3b8" font-size="7">{{ range.label }}</text>
                    </g>
                  </template>

                  <!-- Shooting Range Markers (interval mode) -->
                  <g v-if="isIntervalMode" v-for="marker in shootingRangeMarkers" :key="'marker-'+marker.idx">
                    <!-- Range marker line -->
                    <line :x1="marker.x" y1="75" :x2="marker.x" y2="145"
                      :stroke="marker.passed ? '#10b981' : '#94a3b8'"
                      stroke-width="2"
                      :stroke-dasharray="marker.passed ? '0' : '4,4'" />
                    <!-- Range label -->
                    <text :x="marker.x" y="170" text-anchor="middle"
                      :fill="marker.passed ? '#059669' : '#64748b'"
                      font-size="9" font-weight="bold">
                      {{ marker.shortLabel }}
                    </text>
                    <!-- Shooting result badge (when passed) -->
                    <g v-if="marker.passed">
                      <rect :x="marker.x - 18" y="178" width="36" height="18" rx="3"
                        :fill="marker.misses === 0 ? '#dcfce7' : marker.misses <= 1 ? '#fef9c3' : '#fee2e2'" />
                      <text :x="marker.x" y="191" text-anchor="middle"
                        :fill="marker.misses === 0 ? '#059669' : marker.misses <= 1 ? '#ca8a04' : '#dc2626'"
                        font-size="10" font-weight="bold">
                        {{ marker.hits }}/5
                      </text>
                    </g>
                  </g>

                  <!-- Start line -->
                  <line x1="40" y1="75" x2="40" y2="145" stroke="#22c55e" stroke-width="3" />
                  <text x="40" y="67" text-anchor="middle" fill="#22c55e" font-size="9" font-weight="bold">START</text>

                  <!-- Finish line -->
                  <line x1="750" y1="75" x2="750" y2="145" stroke="#ef4444" stroke-width="3" />
                  <text x="760" y="67" fill="#ef4444" font-size="9" font-weight="bold">FINISH</text>

                  <!-- Animated Athletes -->
                  <g v-for="(athlete, idx) in visibleAthletes" :key="athlete.id" class="athlete-group">
                    <template v-if="!athlete.finished">
                      <!-- Ski trails -->
                      <line :x1="athlete.x - 15" :y1="athlete.y + 2" :x2="athlete.x - 3" :y2="athlete.y + 2"
                        :stroke="getAthleteColor(idx)" stroke-width="2" opacity="0.4" />
                      <line :x1="athlete.x - 15" :y1="athlete.y - 2" :x2="athlete.x - 3" :y2="athlete.y - 2"
                        :stroke="getAthleteColor(idx)" stroke-width="2" opacity="0.4" />
                      <!-- Athlete body -->
                      <circle :cx="athlete.x" :cy="athlete.y" r="8" :fill="getAthleteColor(idx)"
                        :stroke="getCurrentLeader?.id === athlete.id ? '#fbbf24' : 'white'" stroke-width="2" />
                      <!-- Name label above athlete -->
                      <rect :x="athlete.x - 30" :y="athlete.y - 30" width="60" height="16" rx="3"
                        fill="white" stroke="#e5e7eb" stroke-width="1" />
                      <text :x="athlete.x" :y="athlete.y - 18"
                        text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">
                        {{ athlete.lastName }}
                      </text>
                    </template>
                    <!-- Finished athlete marker -->
                    <template v-else>
                      <circle cx="765" :cy="90 + idx * 12" r="5"
                        :fill="idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : '#64748b'" />
                    </template>
                  </g>
                </svg>
              </div>

              <!-- Bottom Panels: Shooting (left) and Standings (right) -->
              <div class="race-bottom-panels">
                <!-- Left Panel: Shooting Display -->
                <div class="shooting-panel">
                  <div class="panel-title">
                    <i class="fa-solid fa-bullseye"></i> Shooting
                  </div>

                  <!-- Interval Mode: Shooting Summary + Current -->
                  <div v-if="isIntervalMode" class="interval-shooting-display">
                    <!-- Shooting Summary - All ranges -->
                    <div class="shooting-summary">
                      <div v-for="marker in shootingRangeMarkers" :key="'sum-'+marker.idx"
                        :class="['summary-range', { 'passed': marker.passed, 'active': currentShootingRangeIdx === marker.idx && currentShootingAthlete }]">
                        <span class="summary-label">{{ marker.shortLabel }}</span>
                        <div class="summary-shots">
                          <span v-for="(shot, sIdx) in (marker.passed ? marker.shots : (currentShootingRangeIdx === marker.idx ? currentShots : [null,null,null,null,null]))"
                            :key="sIdx"
                            :class="['summary-dot', shot === null ? 'pending' : shot ? 'hit' : 'miss']">
                          </span>
                        </div>
                        <span v-if="marker.passed" class="summary-score" :class="{ 'perfect': marker.misses === 0, 'good': marker.misses === 1, 'bad': marker.misses >= 2 }">
                          {{ marker.hits }}/5
                        </span>
                      </div>
                    </div>

                    <!-- Current shooting detail -->
                    <div v-if="currentShootingAthlete" class="current-shooting">
                      <div class="shooting-athlete-row">
                        <span class="shooting-range-badge">
                          {{ isIndividualRace
                            ? ['P1', 'P2', 'S1', 'S2'][currentShootingRangeIdx]
                            : (currentShootingRangeIdx === 0 ? 'PRONE' : 'STAND') }}
                        </span>
                        <div class="shooting-targets-row">
                          <div v-for="(shot, idx) in currentShots" :key="idx"
                            :class="['target-display', shot === null ? 'pending' : shot ? 'hit' : 'miss']">
                            <i v-if="shot === null" class="fa-solid fa-circle"></i>
                            <i v-else-if="shot" class="fa-solid fa-check"></i>
                            <i v-else class="fa-solid fa-xmark"></i>
                          </div>
                        </div>
                      </div>

                    </div>

                    <!-- Total misses -->
                    <div v-if="passedShootingRanges.length > 0" class="shooting-total">
                      <span class="total-label">Total:</span>
                      <span class="total-hits">{{ passedShootingRanges.reduce((sum, r) => sum + r.hits, 0) }}/{{ passedShootingRanges.length * 5 }}</span>
                      <span class="total-misses" :class="{ 'perfect': passedShootingRanges.reduce((sum, r) => sum + r.misses, 0) === 0 }">
                        ({{ passedShootingRanges.reduce((sum, r) => sum + r.misses, 0) }} miss)
                      </span>
                    </div>
                  </div>

                  <!-- Mass Mode: TV-style all ranges -->
                  <div v-else-if="!isIntervalMode" class="mass-shooting-display">
                    <div v-for="rangeIdx in 4" :key="'range-'+rangeIdx" class="range-row">
                      <span class="range-label">{{ rangeIdx <= 2 ? 'P' : 'S' }}{{ rangeIdx <= 2 ? rangeIdx : rangeIdx - 2 }}</span>
                      <div class="range-athletes">
                        <div v-for="shooter in getAthletesAtRange(rangeIdx - 1)" :key="shooter.id" class="range-shooter">
                          <img :src="`/flags/${shooter.country}.png`" class="shooter-flag" />
                          <span class="shooter-name">{{ shooter.lastName }}</span>
                          <div class="shooter-shots">
                            <span v-for="(shot, sIdx) in shooter.shots" :key="sIdx"
                              :class="['shot-dot', shot === null ? 'pending' : shot ? 'hit' : 'miss']">
                            </span>
                          </div>
                        </div>
                        <span v-if="getAthletesAtRange(rangeIdx - 1).length === 0" class="range-empty">—</span>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- Right Panel: Live Standings or Current Athlete -->
                <div class="race-standings-panel">
                  <!-- Interval Mode: Current Athlete Card -->
                  <div v-if="isIntervalMode && currentIntervalAthlete" class="current-athlete-card">
                    <!-- Action buttons at top -->
                    <div class="athlete-actions-top">
                      <template v-if="waitingForNextAthlete">
                        <button @click="advanceToNextAthlete" class="btn-action-primary" v-if="currentAthleteIndex < totalAthletesToRace">
                          <i class="fa-solid fa-forward-step"></i> Next ({{ currentAthleteIndex + 1 }}/{{ totalAthletesToRace }})
                        </button>
                        <button @click="skipRemainingAthletes" class="btn-action-secondary" v-if="currentAthleteIndex < totalAthletesToRace">
                          <i class="fa-solid fa-forward-fast"></i> Skip All
                        </button>
                        <button @click="finishIntervalRace" class="btn-action-primary" v-if="currentAthleteIndex >= totalAthletesToRace">
                          <i class="fa-solid fa-flag-checkered"></i> View Results
                        </button>
                      </template>
                      <span v-else class="racing-indicator"><i class="fa-solid fa-circle"></i> Racing</span>
                    </div>

                    <!-- Compact athlete row -->
                    <div class="athlete-row">
                      <span class="bib">#{{ currentAthleteIndex }}</span>
                      <img :src="`/flags/${currentIntervalAthlete.country}.png`" class="athlete-flag-sm" />
                      <span class="athlete-name-main">{{ currentIntervalAthlete.lastName }}</span>
                    </div>

                    <!-- Stats row -->
                    <div class="stats-row">
                      <div class="stat-compact">
                        <span class="stat-val time">{{ formatRaceTime(raceTimer) }}</span>
                        <span class="stat-lbl">Time</span>
                      </div>
                      <div class="stat-compact" v-if="showCheckpointStandings && checkpointPosition">
                        <span class="stat-val" :class="checkpointTimeBehind <= 0 ? 'ahead' : 'behind'">
                          {{ checkpointTimeBehind <= 0 ? '' : '+' }}{{ formatRaceTime(Math.abs(checkpointTimeBehind)) }}
                        </span>
                        <span class="stat-lbl">{{ currentCheckpointName }}</span>
                      </div>
                      <div class="stat-compact">
                        <span class="stat-val pos">{{ checkpointPosition || '-' }}</span>
                        <span class="stat-lbl">Pos</span>
                      </div>
                      <div class="stat-compact" v-if="liveStandings.length > 0 && !currentAthleteFinished">
                        <span class="stat-val leader">{{ liveStandings[0].lastName }}</span>
                        <span class="stat-lbl">{{ formatRaceTime(liveStandings[0].time) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Live Leaderboard -->
                  <div class="live-leaderboard">
                    <div class="leaderboard-title">
                      <i class="fa-solid fa-ranking-star"></i>
                      {{ isIntervalMode ? 'Standings' : 'Live Standings' }}
                    </div>
                    <div class="leaderboard-entries">
                      <template v-if="isIntervalMode">
                        <div v-for="(entry, idx) in liveStandings.slice(0, 8)" :key="entry.athleteId"
                          :class="['leaderboard-entry', { 'leader': idx === 0 }]">
                          <span class="entry-rank" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">{{ idx + 1 }}</span>
                          <img :src="`/flags/${entry.country}.png`" class="entry-flag" />
                          <span class="entry-name">{{ entry.lastName }}</span>
                          <span class="entry-time" v-if="idx === 0">{{ formatRaceTime(entry.time) }}</span>
                          <span class="entry-time entry-behind" v-else>+{{ formatRaceTime(entry.timeBehind || 0) }}</span>
                          <span v-if="entry.misses > 0" class="entry-misses">({{ entry.misses }})</span>
                        </div>
                      </template>
                      <template v-else>
                        <div v-for="entry in liveStandings.slice(0, 10)" :key="entry.athleteId"
                          :class="['leaderboard-entry', { 'leader': entry.isWinner, 'finished': entry.finished, 'shooting': entry.isShooting }]">
                          <span class="entry-rank" :class="{ 'gold': entry.position === 1, 'silver': entry.position === 2, 'bronze': entry.position === 3 }">
                            {{ entry.position }}
                          </span>
                          <img :src="`/flags/${entry.country}.png`" class="entry-flag" />
                          <span class="entry-name">{{ entry.lastName }}</span>
                          <span v-if="entry.gap !== null && entry.gap > 0" class="entry-gap">+{{ entry.gap.toFixed(1) }}s</span>
                          <span v-if="entry.finished" class="entry-status finished-badge"><i class="fa-solid fa-flag-checkered"></i></span>
                          <span v-else-if="entry.isShooting" class="entry-status shooting-badge"><i class="fa-solid fa-bullseye"></i></span>
                          <span v-if="entry.misses > 0" class="entry-misses">({{ entry.misses }})</span>
                        </div>
                      </template>
                      <div v-if="liveStandings.length === 0" class="no-standings-yet">
                        <i class="fa-solid fa-hourglass-start"></i>
                        <span>Waiting for finishers...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Final Results -->
          <div v-else-if="raceResults?.final" class="race-results">
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
                    <th class="col-time">Time</th>
                    <th class="col-behind">Behind</th>
                    <th class="col-shooting">Shooting</th>
                    <th class="col-misses">Misses</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in raceResults.final" :key="result.athleteId" :class="{ 'podium': result.position <= 3, 'yellow-jersey': result.position === 1 }">
                    <td class="col-rank">
                      <span v-if="result.position === 1" class="medal gold">1</span>
                      <span v-else-if="result.position === 2" class="medal silver">2</span>
                      <span v-else-if="result.position === 3" class="medal bronze">3</span>
                      <span v-else>{{ result.position }}</span>
                    </td>
                    <td class="col-country"><img :src="`/flags/${result.country}.png`" class="result-flag" /></td>
                    <td class="col-name">{{ result.lastName }} {{ result.firstName }}</td>
                    <td class="col-time">{{ result.timeFormatted }}</td>
                    <td class="col-behind">{{ result.timeBehindFormatted || '-' }}</td>
                    <td class="col-shooting">{{ result.shootingPercentage }}%</td>
                    <td class="col-misses">
                      <span :class="getMissesClass(result.totalMisses)">{{ result.totalMisses }}</span>
                    </td>
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

    <!-- Add/Edit Athlete Modal -->
    <div v-if="showAthleteModal" class="modal-overlay" @click.self="closeAthleteModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Add New Athlete' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <form @submit.prevent="handleSaveAthlete" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="athleteForm.first_name" type="text" required placeholder="First name" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input v-model="athleteForm.last_name" type="text" required placeholder="Last name" />
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
                  :placeholder="athleteForm.country ? `${countryNames[athleteForm.country]} (${athleteForm.country})` : 'Type to search...'"
                  class="country-input"
                  autocomplete="off"
                />
                <div v-if="showCountryDropdown" class="country-dropdown" @mousedown.prevent>
                  <div
                    v-for="country in filteredCountryList"
                    :key="country.code"
                    class="country-item"
                    :class="{ selected: athleteForm.country === country.code }"
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
              <select v-model="athleteForm.team_id">
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
              <button type="button" @click="randomizeSkills('strong')" class="btn btn-xs btn-ghost btn-strong" title="Strong athlete (85-99)">
                <i class="fa-solid fa-star"></i> Strong
              </button>
              <button type="button" @click="randomizeSkills('average')" class="btn btn-xs btn-ghost btn-average" title="Average athlete (65-80)">
                <i class="fa-solid fa-minus"></i> Average
              </button>
              <button type="button" @click="randomizeSkills('weak')" class="btn btn-xs btn-ghost btn-weak" title="Weak athlete (50-65)">
                <i class="fa-solid fa-circle-down"></i> Weak
              </button>
            </div>
          </div>
          <div class="form-row skills-row">
            <div class="form-group">
              <label>Skiing <span class="skill-value">{{ athleteForm.skill_skiing }}</span></label>
              <input v-model.number="athleteForm.skill_skiing" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Shooting Prone <span class="skill-value">{{ athleteForm.skill_shooting_prone }}</span></label>
              <input v-model.number="athleteForm.skill_shooting_prone" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Shooting Standing <span class="skill-value">{{ athleteForm.skill_shooting_standing }}</span></label>
              <input v-model.number="athleteForm.skill_shooting_standing" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="form-row skills-row">
            <div class="form-group">
              <label>Endurance <span class="skill-value">{{ athleteForm.skill_endurance }}</span></label>
              <input v-model.number="athleteForm.skill_endurance" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Consistency <span class="skill-value">{{ athleteForm.consistency }}</span></label>
              <input v-model.number="athleteForm.consistency" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Form <span class="skill-value">{{ athleteForm.form }}</span></label>
              <input v-model.number="athleteForm.form" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeAthleteModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="savingAthlete">
              <i v-if="savingAthlete" class="fa-solid fa-spinner fa-spin"></i>
              {{ savingAthlete ? 'Saving...' : (editingAthlete ? 'Save Changes' : 'Add Athlete') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Athlete Confirmation Modal -->
    <div v-if="athleteToDelete" class="modal-overlay" @click.self="athleteToDelete = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Delete Athlete</h2>
          <button @click="athleteToDelete = null" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ athleteToDelete.first_name }} {{ athleteToDelete.last_name }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button @click="athleteToDelete = null" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteAthlete" class="btn btn-danger" :disabled="deletingAthlete">
            <i v-if="deletingAthlete" class="fa-solid fa-spinner fa-spin"></i>
            {{ deletingAthlete ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete All Athletes Confirmation Modal -->
    <div v-if="showDeleteAllAthletesConfirm" class="modal-overlay" @click.self="showDeleteAllAthletesConfirm = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2><i class="fa-solid fa-triangle-exclamation"></i> Delete All Athletes</h2>
          <button @click="showDeleteAllAthletesConfirm = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>all {{ athletes.length }} athletes</strong>? This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAllAthletesConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteAllAthletes" class="btn btn-danger" :disabled="deletingAllAthletes">
            <i v-if="deletingAllAthletes" class="fa-solid fa-spinner fa-spin"></i>
            {{ deletingAllAthletes ? 'Deleting...' : 'Delete All Athletes' }}
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
                <span class="result-type">{{ result.raceType }}</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorldsStore } from '../stores/worlds'
import { useBiathlonStore } from '../stores/biathlon'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'
import NamePicker from '../components/NamePicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const worldsStore = useWorldsStore()
const biathlonStore = useBiathlonStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)
const world = computed(() => worldsStore.currentWorld)
const athletes = computed(() => biathlonStore.athletes)
const countryNames = computed(() => biathlonStore.countryNames)
const teams = computed(() => teamsStore.teams)
const teamStandings = computed(() => teamsStore.teamStandings)

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
const selectedCountryName = computed(() => {
  const code = athleteForm.value.country
  if (!code || !countryNames.value) return ''
  return countryNames.value[code] || code
})
function selectCountry(code) {
  athleteForm.value.country = code
  countrySearch.value = ''
  showCountryDropdown.value = false
}
function hideCountryDropdown() {
  setTimeout(() => {
    showCountryDropdown.value = false
  }, 200)
}

const currentSeason = computed(() => biathlonStore.currentSeason)
const seasonEvents = computed(() => biathlonStore.events)
const seasonStandings = computed(() => biathlonStore.standings)
const disciplineStandings = computed(() => biathlonStore.disciplineStandings)
const currentEvent = computed(() => biathlonStore.currentEvent)
const raceResults = computed(() => currentEvent.value?.results)

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
  const index = seasonStandings.value.findIndex(s => s.athleteId === selectedCompetitor.value.athleteId)
  return index >= 0 ? index + 1 : 0
})

const competitorSeasonResults = computed(() => {
  if (!selectedCompetitor.value || !seasonEvents.value) return []

  const results = []
  const athleteId = selectedCompetitor.value.athleteId

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

    // Find the athlete's result in this event
    const entry = eventResults.find(r => r.athleteId === athleteId)

    if (entry) {
      results.push({
        eventId: event.id,
        location: event.location,
        raceType: event.race_type,
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

// Get current race leader (furthest along who hasn't finished)
const getCurrentLeader = computed(() => {
  const racing = visibleAthletes.value.filter(a => !a.finished)
  if (racing.length === 0) return null
  return racing.reduce((leader, a) => (!leader || a.x > leader.x) ? a : leader, null)
})

const activeTab = ref('season')
const standingsView = ref('overall')
const loadingAthletes = ref(true)
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

// Athlete management state
const showAthleteModal = ref(false)
const showNamePicker = ref(false)
const editingAthlete = ref(null)
const athleteToDelete = ref(null)
const showDeleteAllAthletesConfirm = ref(false)
const savingAthlete = ref(false)
const deletingAthlete = ref(false)
const deletingAllAthletes = ref(false)
const athleteForm = ref({
  first_name: '',
  last_name: '',
  country: '',
  team_id: '',
  skill_skiing: 70,
  skill_shooting_prone: 70,
  skill_shooting_standing: 70,
  skill_endurance: 70,
  consistency: 70,
  form: 70
})

// Animation state
const isRaceInProgress = ref(false)
const raceTimer = ref(0)
const currentRacePhase = ref('')
const animationInterval = ref(null)
const visibleAthletes = ref([])
const liveStandings = ref([])
const currentShootingAthlete = ref(null)
const currentShots = ref([null, null, null, null, null])
const currentHits = ref(0)
const shootingComplete = ref(false)
const targetStates = ref([[null,null,null,null,null], [null,null,null,null,null]])
const currentShootingRangeIdx = ref(0) // Track which range (0-3) is being shot

// Shooting range markers (like checkpoints in cross-country)
const shootingRangeMarkers = ref([])
const passedShootingRanges = ref([])
const currentAthleteShootingSummary = ref([]) // Summary of all shooting for current athlete

// Interval start mode (sprint/individual)
const isIntervalMode = ref(false)
const currentAthleteIndex = ref(0)
const totalAthletesToRace = ref(0)
const allRaceResults = ref([])
const currentIntervalAthlete = ref(null)

// Intermediate standings for individual race (after each shooting)
const intermediateStandings = ref([]) // All athletes' checkpoint data
const showCheckpointStandings = ref(false)
const checkpointPosition = ref(null)
const checkpointTimeBehind = ref(null)
const currentCheckpointName = ref('')

// Manual progression control (like cross country)
const waitingForNextAthlete = ref(false)
const currentAthleteFinished = ref(false)
const pendingAthleteData = ref(null) // Stores {allAthleteData, nextIndex}

// Check if current race is individual (4 shootings) vs sprint (2 shootings)
const isIndividualRace = computed(() => selectedEvent.value?.race_type === 'individual')

// Athlete colors for visualization
const athleteColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function getAthleteColor(idx) {
  return athleteColors[idx % athleteColors.length]
}

// Get athletes at a specific shooting range
function getAthletesAtRange(rangeIdx) {
  return athletesAtRange.value.filter(a => a.rangeIdx === rangeIdx)
}

function getTargetColor(rangeIdx, targetIdx) {
  const state = targetStates.value[rangeIdx]?.[targetIdx]
  if (state === null) return '#475569'
  return state ? '#10b981' : '#ef4444'
}

// Generate shooting range markers based on race type
function generateShootingRangeMarkers(raceType) {
  const isIndividual = raceType === 'individual'
  const isMassOrPursuit = raceType === 'mass_start' || raceType === 'pursuit'
  const numRanges = (isIndividual || isMassOrPursuit) ? 4 : 2

  const markers = []
  const rangeLabels = numRanges === 4
    ? ['Prone 1', 'Prone 2', 'Stand 1', 'Stand 2']
    : ['Prone', 'Standing']
  const rangeXPositions = numRanges === 4
    ? [170, 320, 470, 620]
    : [230, 530]

  for (let i = 0; i < numRanges; i++) {
    markers.push({
      idx: i,
      label: rangeLabels[i],
      shortLabel: numRanges === 4 ? ['P1', 'P2', 'S1', 'S2'][i] : ['P', 'S'][i],
      x: rangeXPositions[i],
      passed: false,
      hits: 0,
      misses: 0,
      shots: [null, null, null, null, null]
    })
  }
  return markers
}

// Update shooting range marker when athlete completes a range
function updateShootingRangeMarker(rangeIdx, shots) {
  if (shootingRangeMarkers.value[rangeIdx]) {
    const marker = shootingRangeMarkers.value[rangeIdx]
    marker.passed = true
    marker.shots = shots
    marker.hits = shots.filter(s => s === true).length
    marker.misses = shots.filter(s => s === false).length
    passedShootingRanges.value.push({ ...marker })

    // Update summary
    currentAthleteShootingSummary.value = [...passedShootingRanges.value]
  }
}

// Helper functions
function getSkillClass(value) {
  if (value >= 90) return 'skill-elite'
  if (value >= 80) return 'skill-high'
  if (value >= 70) return 'skill-good'
  if (value >= 60) return 'skill-average'
  return 'skill-low'
}

function getOverall(athlete) {
  const skills = [
    athlete.skill_skiing,
    athlete.skill_shooting_prone,
    athlete.skill_shooting_standing,
    athlete.skill_endurance,
    athlete.consistency
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
    default: // random
      min = 50; max = 99
  }
  const randomInRange = () => Math.floor(Math.random() * (max - min + 1)) + min
  athleteForm.value.skill_skiing = randomInRange()
  athleteForm.value.skill_shooting_prone = randomInRange()
  athleteForm.value.skill_shooting_standing = randomInRange()
  athleteForm.value.skill_endurance = randomInRange()
  athleteForm.value.consistency = randomInRange()
  athleteForm.value.form = randomInRange()
}

function getRaceTypeName(type) {
  const names = {
    sprint: 'Sprint',
    pursuit: 'Pursuit',
    individual: 'Individual',
    mass_start: 'Mass Start'
  }
  return names[type] || type
}

function getRaceTypeIcon(type) {
  const icons = {
    sprint: 'fa-solid fa-bolt',
    pursuit: 'fa-solid fa-person-running',
    individual: 'fa-solid fa-person-skiing-nordic',
    mass_start: 'fa-solid fa-users'
  }
  return icons[type] || 'fa-solid fa-circle'
}

function getRaceTypeClass(type) {
  return `race-type-${type}`
}

function getMissesClass(misses) {
  if (misses === 0) return 'misses-perfect'
  if (misses <= 2) return 'misses-good'
  if (misses <= 4) return 'misses-average'
  return 'misses-bad'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRaceTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`
}

function getEventPodium(event) {
  if (!event.results?.final) return []
  return event.results.final.slice(0, 3)
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
    await biathlonStore.fetchCurrentSeason(worldId.value)
  } catch (error) {
    console.error('Failed to load season:', error)
  } finally {
    loadingSeason.value = false
  }
}

async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'biathlon')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleGenerateAthletes() {
  generating.value = true
  try {
    await biathlonStore.generateAthletes(worldId.value)
  } catch (error) {
    console.error('Failed to generate athletes:', error)
  } finally {
    generating.value = false
  }
}

// Athlete management functions
function openAddAthleteModal() {
  editingAthlete.value = null
  athleteForm.value = {
    first_name: '',
    last_name: '',
    country: '',
    team_id: '',
    skill_skiing: 70,
    skill_shooting_prone: 70,
    skill_shooting_standing: 70,
    skill_endurance: 70,
    consistency: 70,
    form: 70
  }
  showAthleteModal.value = true
}

function openEditAthleteModal(athlete) {
  editingAthlete.value = athlete
  athleteForm.value = {
    first_name: athlete.first_name,
    last_name: athlete.last_name,
    country: athlete.country,
    team_id: athlete.team_id || '',
    skill_skiing: athlete.skill_skiing,
    skill_shooting_prone: athlete.skill_shooting_prone,
    skill_shooting_standing: athlete.skill_shooting_standing,
    skill_endurance: athlete.skill_endurance,
    consistency: athlete.consistency,
    form: athlete.form
  }
  showAthleteModal.value = true
}

function handleNamePicked(data) {
  athleteForm.value.first_name = data.first_name
  athleteForm.value.last_name = data.last_name
  if (data.country_code) athleteForm.value.country = data.country_code
}

function closeAthleteModal() {
  showAthleteModal.value = false
  editingAthlete.value = null
}

async function handleSaveAthlete() {
  savingAthlete.value = true
  try {
    if (editingAthlete.value) {
      await biathlonStore.updateAthlete(editingAthlete.value.id, athleteForm.value)
    } else {
      await biathlonStore.createAthlete(worldId.value, athleteForm.value)
    }
    closeAthleteModal()
  } catch (error) {
    console.error('Failed to save athlete:', error)
  } finally {
    savingAthlete.value = false
  }
}

function confirmDeleteAthlete(athlete) {
  athleteToDelete.value = athlete
}

async function handleDeleteAthlete() {
  deletingAthlete.value = true
  try {
    await biathlonStore.deleteAthlete(athleteToDelete.value.id)
    athleteToDelete.value = null
  } catch (error) {
    console.error('Failed to delete athlete:', error)
  } finally {
    deletingAthlete.value = false
  }
}

async function handleDeleteAllAthletes() {
  deletingAllAthletes.value = true
  try {
    await biathlonStore.deleteAllAthletes(worldId.value)
    showDeleteAllAthletesConfirm.value = false
  } catch (error) {
    console.error('Failed to delete all athletes:', error)
  } finally {
    deletingAllAthletes.value = false
  }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    await biathlonStore.createSeason(worldId.value)
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
    await biathlonStore.resetSeason(currentSeason.value.id)
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
    await biathlonStore.fetchEvent(event.id)
  } catch (error) {
    console.error('Failed to load event:', error)
  }
}

function closeRaceModal() {
  stopAnimation()
  showRaceModal.value = false
  selectedEvent.value = null
  biathlonStore.clearCurrentEvent()
  loadSeason()
}

// ============ RACE ANIMATION ============

// Store the actual backend results for animation
const backendRaceResults = ref([])

async function startRaceAnimation() {
  isRaceInProgress.value = true
  raceTimer.value = 0
  currentRacePhase.value = 'Simulating race...'
  targetStates.value = [[null,null,null,null,null], [null,null,null,null,null]]

  // First, simulate on backend to get real results
  try {
    const response = await biathlonStore.simulateRace(selectedEvent.value.id)
    backendRaceResults.value = response.results?.final || []
  } catch (error) {
    console.error('Failed to simulate race:', error)
    isRaceInProgress.value = false
    return
  }

  if (backendRaceResults.value.length === 0) {
    isRaceInProgress.value = false
    await biathlonStore.fetchEvent(selectedEvent.value.id)
    return
  }

  currentRacePhase.value = 'Starting...'

  const raceType = selectedEvent.value?.race_type
  const isMassOrPursuit = raceType === 'mass_start' || raceType === 'pursuit'

  // Initialize shooting range markers
  shootingRangeMarkers.value = generateShootingRangeMarkers(raceType)
  passedShootingRanges.value = []
  currentAthleteShootingSummary.value = []

  // Interval mode for sprint/individual (one athlete at a time, faster)
  // Mass mode for mass_start/pursuit (all athletes, slower and dramatic)
  isIntervalMode.value = !isMassOrPursuit

  if (isIntervalMode.value) {
    // INTERVAL START MODE (Sprint/Individual)
    // Animate using real backend results
    startIntervalRace()
  } else {
    // MASS START MODE (Mass Start/Pursuit)
    // Slower, dramatic, all athletes visible
    startMassRace()
  }
}

function startIntervalRace() {
  // Use actual backend results - animate ALL athletes in start order (random)
  const results = backendRaceResults.value

  // Shuffle the order for animation (they start at different times in interval)
  const animationOrder = [...results].sort(() => Math.random() - 0.5)

  totalAthletesToRace.value = animationOrder.length
  currentAthleteIndex.value = 0
  allRaceResults.value = []

  // Reset intermediate standings for individual race
  intermediateStandings.value = []
  showCheckpointStandings.value = false
  checkpointPosition.value = null
  checkpointTimeBehind.value = null
  currentCheckpointName.value = ''

  // Reset manual progression controls
  waitingForNextAthlete.value = false
  currentAthleteFinished.value = false
  pendingAthleteData.value = null

  // Prepare all athletes data from backend results
  const allAthleteData = animationOrder.map((r) => ({
    id: r.athleteId,
    firstName: r.firstName,
    lastName: r.lastName,
    country: r.country,
    totalMissesSoFar: 0, // Track misses for intermediate standings
    // Store the actual result for this athlete
    actualTime: r.totalTime,
    actualMisses: r.totalMisses,
    shootingResults: r.shootingResults || []
  }))

  // Start with first athlete
  currentIntervalAthlete.value = allAthleteData[0]
  runSingleAthleteAnimation(allAthleteData, 0)
}

function runSingleAthleteAnimation(allAthleteData, athleteIndex) {
  if (athleteIndex >= allAthleteData.length) {
    // All athletes finished
    finishRaceAnimation()
    return
  }

  currentAthleteIndex.value = athleteIndex + 1
  const athleteData = allAthleteData[athleteIndex]
  currentIntervalAthlete.value = athleteData
  currentRacePhase.value = `Athlete ${athleteIndex + 1}/${allAthleteData.length}: ${athleteData.lastName}`

  // Reset ALL shooting states for this athlete
  const raceType = selectedEvent.value?.race_type
  const numRanges = raceType === 'individual' ? 4 : 2
  targetStates.value = Array(numRanges).fill(null).map(() => [null, null, null, null, null])

  // Reset shooting range markers for this athlete
  shootingRangeMarkers.value.forEach(m => {
    m.passed = false
    m.hits = 0
    m.misses = 0
    m.shots = [null, null, null, null, null]
  })
  passedShootingRanges.value = []
  currentAthleteShootingSummary.value = []

  // Reset current shooting state
  currentShots.value = [null, null, null, null, null]
  currentHits.value = 0
  shootingComplete.value = false
  currentShootingRangeIdx.value = 0
  currentShootingAthlete.value = null

  // Reset checkpoint display
  showCheckpointStandings.value = false
  checkpointPosition.value = null
  checkpointTimeBehind.value = null
  currentCheckpointName.value = ''

  // Calculate time multiplier based on actual race time
  // We want the animation to take ~15 seconds regardless of actual race time
  const targetAnimationDuration = 15 // seconds
  const actualTime = athleteData.actualTime || 300 // Default 5 min if not available
  const timeMultiplier = actualTime / targetAnimationDuration

  // Create single athlete for animation using ACTUAL backend results
  const athlete = {
    id: athleteData.id,
    firstName: athleteData.firstName,
    lastName: athleteData.lastName,
    country: athleteData.country,
    x: 50,
    y: 110,
    speed: 1.0, // Fixed speed for consistent animation
    phase: 'skiing',
    shootingsDone: 0,
    misses: 0,
    time: 0,
    finished: false,
    // Actual results from backend
    actualTime: athleteData.actualTime,
    actualMisses: athleteData.actualMisses,
    shootingResults: athleteData.shootingResults || [],
    timeMultiplier: timeMultiplier
  }

  visibleAthletes.value = [athlete]
  // Update standings with time behind leader
  const sortedResults = [...allRaceResults.value].sort((a, b) => a.time - b.time)
  const leaderTime = sortedResults[0]?.time || 0
  liveStandings.value = sortedResults.map(r => ({
    ...r,
    timeBehind: r.time - leaderTime
  }))

  // Animation loop for interval mode
  let lastTime = Date.now()
  const intervalLoop = setInterval(() => {
    const now = Date.now()
    const delta = (now - lastTime) / 1000
    lastTime = now

    raceTimer.value = athlete.time

    if (athlete.finished) {
      clearInterval(intervalLoop)
      // Save result using ACTUAL backend time
      allRaceResults.value.push({
        athleteId: athlete.id,
        lastName: athlete.lastName,
        country: athlete.country,
        time: athlete.actualTime, // Use actual backend time
        misses: athlete.actualMisses, // Use actual misses
        finished: true
      })
      // Update standings with time behind leader
      const sortedResults = [...allRaceResults.value].sort((a, b) => a.time - b.time)
      const leaderTime = sortedResults[0]?.time || 0
      liveStandings.value = sortedResults.map(r => ({
        ...r,
        timeBehind: r.time - leaderTime
      }))

      // Calculate final position and time diff
      const finalPos = sortedResults.findIndex(r => r.athleteId === athlete.id) + 1
      checkpointPosition.value = finalPos
      checkpointTimeBehind.value = finalPos === 1 ? 0 : athlete.actualTime - leaderTime
      currentCheckpointName.value = 'FINISH'
      showCheckpointStandings.value = true

      // Mark as finished and wait for user to click next
      currentAthleteFinished.value = true
      waitingForNextAthlete.value = true
      pendingAthleteData.value = { allAthleteData, nextIndex: athleteIndex + 1 }
      return
    }

    updateIntervalAnimation(athlete, delta)
  }, 30)

  animationInterval.value = intervalLoop
}

// Called when user clicks "Next Athlete" button
function advanceToNextAthlete() {
  if (!waitingForNextAthlete.value || !pendingAthleteData.value) return

  waitingForNextAthlete.value = false
  currentAthleteFinished.value = false
  showCheckpointStandings.value = false
  checkpointPosition.value = null
  checkpointTimeBehind.value = null
  currentCheckpointName.value = ''

  const { allAthleteData, nextIndex } = pendingAthleteData.value
  pendingAthleteData.value = null

  if (nextIndex >= allAthleteData.length) {
    finishRaceAnimation()
  } else {
    runSingleAthleteAnimation(allAthleteData, nextIndex)
  }
}

// Skip remaining athletes and show results
function skipRemainingAthletes() {
  if (!pendingAthleteData.value) return

  waitingForNextAthlete.value = false
  currentAthleteFinished.value = false
  showCheckpointStandings.value = false

  const { allAthleteData, nextIndex } = pendingAthleteData.value

  // Add remaining athletes to results without animation
  for (let i = nextIndex; i < allAthleteData.length; i++) {
    const ad = allAthleteData[i]
    allRaceResults.value.push({
      athleteId: ad.id,
      lastName: ad.lastName,
      country: ad.country,
      time: ad.actualTime,
      misses: ad.actualMisses,
      finished: true
    })
  }

  // Update standings
  const sortedResults = [...allRaceResults.value].sort((a, b) => a.time - b.time)
  const leaderTime = sortedResults[0]?.time || 0
  liveStandings.value = sortedResults.map(r => ({
    ...r,
    timeBehind: r.time - leaderTime
  }))

  pendingAthleteData.value = null
  finishRaceAnimation()
}

// Finish and show results (for last athlete)
function finishIntervalRace() {
  waitingForNextAthlete.value = false
  currentAthleteFinished.value = false
  showCheckpointStandings.value = false
  pendingAthleteData.value = null
  finishRaceAnimation()
}

function updateIntervalAnimation(athlete, delta) {
  const raceType = selectedEvent.value?.race_type
  const isIndividual = raceType === 'individual'
  const startX = 50
  const finishX = 740
  const trackLength = finishX - startX // 690 pixels

  // Use athlete's time multiplier for sync with actual time
  const timeMultiplier = athlete.timeMultiplier || 12

  // Shooting ranges: 4 for individual (prone, prone, stand, stand), 2 for sprint
  const shootingRanges = isIndividual
    ? [{ x: 170, rangeIdx: 0 }, { x: 320, rangeIdx: 1 }, { x: 470, rangeIdx: 2 }, { x: 620, rangeIdx: 3 }]
    : [{ x: 220, rangeIdx: 0 }, { x: 520, rangeIdx: 1 }]

  if (athlete.phase === 'shooting') return // Wait for shooting to complete

  // Update time based on actual race time
  athlete.time += delta * timeMultiplier

  // Calculate X position based on progress through actual time
  // This ensures athlete finishes at finishX when time reaches actualTime
  const timeProgress = athlete.actualTime > 0 ? athlete.time / athlete.actualTime : 0
  athlete.x = startX + (trackLength * Math.min(timeProgress, 1))
  athlete.y = 110 + Math.sin(athlete.x * 0.03) * 5

  // Calculate live virtual position during the race
  if (isIndividual && allRaceResults.value.length > 0) {
    // Current progress through the race (0 to 1)
    const currentProgress = Math.min(timeProgress, 1)
    // Estimate current time including any penalties so far
    const currentMisses = athlete.totalMissesSoFar || 0
    const estimatedCurrentTime = athlete.time + (currentMisses * 60)

    // Compare against finished athletes at this same progress point
    const virtualStandings = []
    for (const result of allRaceResults.value) {
      const estimatedTime = result.time * currentProgress
      virtualStandings.push({ ...result, estimatedTime })
    }
    virtualStandings.push({ athleteId: athlete.id, lastName: athlete.lastName, estimatedTime: estimatedCurrentTime, isCurrent: true })
    virtualStandings.sort((a, b) => a.estimatedTime - b.estimatedTime)

    const pos = virtualStandings.findIndex(s => s.athleteId === athlete.id) + 1
    const leaderTime = virtualStandings[0]?.estimatedTime || estimatedCurrentTime
    const diff = estimatedCurrentTime - leaderTime

    checkpointPosition.value = pos
    checkpointTimeBehind.value = diff
    currentCheckpointName.value = `${Math.round(currentProgress * 100)}%`
    showCheckpointStandings.value = true
  }

  // Check shooting ranges
  for (const range of shootingRanges) {
    if (athlete.shootingsDone === range.rangeIdx &&
        athlete.x >= range.x - 5 && athlete.x <= range.x + 10) {
      athlete.phase = 'shooting'
      athlete.x = range.x
      simulateIntervalShooting(athlete, range.rangeIdx)
      return
    }
  }

  // Check finish - when time reaches actual time
  if (athlete.time >= athlete.actualTime) {
    athlete.finished = true
    athlete.x = finishX
    athlete.time = athlete.actualTime // Snap to exact time
  }
}

function simulateIntervalShooting(athlete, rangeIdx) {
  currentShootingAthlete.value = athlete
  currentShots.value = [null, null, null, null, null]
  currentHits.value = 0
  shootingComplete.value = false
  currentShootingRangeIdx.value = rangeIdx

  // Get actual shooting results from backend if available
  const shootingData = athlete.shootingResults?.[rangeIdx]
  // Backend returns 1/0, convert to boolean for consistency
  const actualShots = shootingData?.shots?.map(s => s === 1 || s === true) || [true, true, true, true, true]

  let shotIdx = 0
  const shootInterval = setInterval(() => {
    if (shotIdx >= 5) {
      clearInterval(shootInterval)
      shootingComplete.value = true
      athlete.shootingsDone++
      athlete.phase = 'skiing'

      // Update shooting range marker with results
      updateShootingRangeMarker(rangeIdx, [...currentShots.value])

      // For individual race, calculate and show intermediate standings
      if (isIndividualRace.value) {
        const checkpointNames = ['P1', 'P2', 'S1', 'S2']
        currentCheckpointName.value = checkpointNames[rangeIdx]

        // Calculate misses so far and penalty time (1 min per miss in individual)
        const missesSoFar = currentShots.value.filter(s => s === false).length +
          (athlete.totalMissesSoFar || 0)
        athlete.totalMissesSoFar = missesSoFar

        // Approximate time at this checkpoint based on shooting stage position
        const checkpointFraction = (rangeIdx + 1) / 4
        const estimatedCheckpointTime = athlete.actualTime * checkpointFraction + (missesSoFar * 60)

        // Update intermediate standings for this athlete
        updateIntermediateStandings(athlete.id, athlete.lastName, athlete.country, estimatedCheckpointTime, missesSoFar, rangeIdx)

        // Show standings persistently (cleared when next athlete starts)
        showCheckpointStandings.value = true
        // Brief pause before clearing shooting athlete display
        setTimeout(() => {
          currentShootingAthlete.value = null
        }, 300)
      } else {
        setTimeout(() => {
          currentShootingAthlete.value = null
        }, 300)
      }
      return
    }

    // Use actual result from backend
    const hit = actualShots[shotIdx]
    currentShots.value[shotIdx] = hit
    targetStates.value[rangeIdx][shotIdx] = hit
    if (hit) currentHits.value++
    shotIdx++
  }, 200) // Slightly faster shooting
}

function updateIntermediateStandings(athleteId, lastName, country, time, misses, checkpointIdx) {
  // Calculate checkpoint fraction (P1=25%, P2=50%, S1=75%, S2=100% through the race)
  const checkpointFraction = (checkpointIdx + 1) / 4

  // Build virtual standings including:
  // 1. Already finished athletes (estimate their checkpoint time from their total time)
  // 2. Current athlete's actual checkpoint time
  const virtualStandings = []

  // Add finished athletes with estimated checkpoint times
  for (const result of allRaceResults.value) {
    if (result.athleteId === athleteId) continue // Skip current athlete

    // Estimate time at this checkpoint based on their final time
    // For individual biathlon: time = skiing time + penalty time (1 min per miss)
    // We estimate checkpoint time proportionally
    const estimatedCheckpointTime = result.time * checkpointFraction

    virtualStandings.push({
      athleteId: result.athleteId,
      lastName: result.lastName,
      country: result.country,
      time: estimatedCheckpointTime,
      misses: Math.round(result.misses * checkpointFraction), // Approximate misses at checkpoint
      isFinished: true
    })
  }

  // Add current athlete
  virtualStandings.push({
    athleteId,
    lastName,
    country,
    time,
    misses,
    isFinished: false,
    isCurrent: true
  })

  // Sort by time
  virtualStandings.sort((a, b) => a.time - b.time)

  // Find current athlete's position
  const position = virtualStandings.findIndex(s => s.athleteId === athleteId) + 1
  const leaderTime = virtualStandings[0]?.time || time
  const timeBehind = position === 1 ? 0 : time - leaderTime

  checkpointPosition.value = position
  checkpointTimeBehind.value = timeBehind

  // Update live standings display
  liveStandings.value = virtualStandings.map((s, idx) => ({
    ...s,
    position: idx + 1,
    timeBehind: idx === 0 ? 0 : s.time - leaderTime
  }))
}

// Mass/Pursuit race state - TV-style multi-athlete shooting display
const athletesAtRange = ref([]) // Athletes currently shooting (TV style display)
const finishOrder = ref([]) // Track finish order for position display

function startMassRace() {
  // Use backend results to determine speeds - faster finishers = higher speed
  const results = backendRaceResults.value
  if (results.length === 0) {
    finishRaceAnimation()
    return
  }

  const raceType = selectedEvent.value?.race_type
  const isPursuit = raceType === 'pursuit'

  currentRacePhase.value = isPursuit ? 'Pursuit Start!' : 'Mass Start - All Athletes!'
  athletesAtRange.value = []
  finishOrder.value = []

  // Get time range to calculate relative speeds
  const fastestTime = results[0].totalTime
  const slowestTime = results[results.length - 1].totalTime
  const timeRange = slowestTime - fastestTime

  // For pursuit, calculate start gaps from sprint results (time behind leader)
  // The backend stores timeBehind in seconds
  const maxStartGap = isPursuit ? 100 : 0 // Max X offset for pursuit start

  // Create athletes with speeds based on actual finish order
  visibleAthletes.value = results.map((r, idx) => {
    // Speed based on finish position - faster finishers have higher speed
    const normalizedSpeed = timeRange > 0 ? 1 - ((r.totalTime - fastestTime) / timeRange) : 1
    const baseSpeed = 0.3 + normalizedSpeed * 0.25

    // For pursuit: start position based on time behind from sprint
    let startX = 50
    if (isPursuit && r.timeBehind > 0) {
      // Convert time behind to position offset (smaller gap = closer to leader)
      // Assume leader starts at 50, others start behind based on their sprint time gap
      startX = 50 - Math.min(r.timeBehind * 0.5, maxStartGap)
    }

    return {
      id: r.athleteId,
      firstName: r.firstName,
      lastName: r.lastName,
      country: r.country,
      x: startX + (Math.random() - 0.5) * 5,
      y: 105 + (idx % 6) * 3,
      speed: baseSpeed + (Math.random() - 0.5) * 0.03,
      phase: 'skiing',
      shootingsDone: 0,
      currentShots: [],
      shotIndex: 0,
      misses: 0,
      finished: false,
      finishPosition: null,
      actualPosition: r.position, // Backend's actual finish position
      shootingResults: r.shootingResults || [],
      leavingRange: false // Flag to prevent multiple setTimeout calls
    }
  })

  // Initialize live standings
  liveStandings.value = []

  // Animation loop
  let lastTime = Date.now()
  animationInterval.value = setInterval(() => {
    const now = Date.now()
    const delta = (now - lastTime) / 1000
    lastTime = now

    raceTimer.value += delta * 5
    updateMassRaceAnimation(delta)
  }, 30)
}

function updateMassRaceAnimation(delta) {
  const shootingRange1X = 220
  const shootingRange2X = 520
  const finishX = 740

  let allFinished = true
  let currentLeader = null

  // Process each athlete
  for (const athlete of visibleAthletes.value) {
    if (athlete.finished) continue
    allFinished = false

    // If shooting, process shots
    if (athlete.phase === 'shooting') {
      processAthleteShooting(athlete)
      continue
    }

    // Move athlete
    const speedVariation = 0.97 + Math.random() * 0.06
    athlete.x += athlete.speed * delta * 50 * speedVariation
    athlete.y = 105 + (visibleAthletes.value.indexOf(athlete) % 6) * 3 + Math.sin(athlete.x * 0.015 + athlete.id) * 3

    // Check shooting ranges (4 shootings for mass/pursuit)
    const shootingRanges = [
      { x: 180, rangeIdx: 0 },
      { x: 320, rangeIdx: 1 },
      { x: 460, rangeIdx: 2 },
      { x: 600, rangeIdx: 3 }
    ]

    for (const range of shootingRanges) {
      if (athlete.shootingsDone === range.rangeIdx &&
          athlete.x >= range.x - 5 && athlete.x <= range.x + 20) {
        athlete.phase = 'shooting'
        athlete.x = range.x + 10
        athlete.currentShots = [null, null, null, null, null]
        athlete.shotIndex = 0
        athletesAtRange.value.push({
          id: athlete.id,
          lastName: athlete.lastName,
          country: athlete.country,
          rangeIdx: range.rangeIdx,
          shots: athlete.currentShots
        })
        break
      }
    }

    // Check finish
    if (athlete.x >= finishX) {
      athlete.finished = true
      athlete.phase = 'finished'
      athlete.x = finishX
      finishOrder.value.push(athlete)
      athlete.finishPosition = finishOrder.value.length
    }

    // Track leader
    if (!currentLeader || athlete.x > currentLeader.x) {
      currentLeader = athlete
    }
  }

  // Update phase text
  const finishedCount = finishOrder.value.length
  const shootingCount = athletesAtRange.value.length
  if (finishedCount > 0) {
    const winner = finishOrder.value[0]
    currentRacePhase.value = `${finishedCount} finished - ${winner.lastName} WON!`
  } else if (shootingCount > 0) {
    currentRacePhase.value = `${shootingCount} at shooting range`
  } else if (currentLeader) {
    currentRacePhase.value = `${currentLeader.lastName} leading the pack`
  }

  // Update live standings based on current position
  updateMassLiveStandings()

  if (allFinished) {
    finishRaceAnimation()
  }
}

function processAthleteShooting(athlete) {
  // Prevent multiple setTimeout calls
  if (athlete.leavingRange) return

  // Get actual shooting results from backend
  const shootingData = athlete.shootingResults?.[athlete.shootingsDone]
  const actualShots = shootingData?.shots?.map(s => s === 1 || s === true) ||
    [Math.random() > 0.3, Math.random() > 0.3, Math.random() > 0.3, Math.random() > 0.3, Math.random() > 0.3]

  // Fire next shot - SLOWER animation (reduced chance per frame for slower shooting)
  if (athlete.shotIndex < 5) {
    // Stagger shots - each athlete fires at different rate (slower: ~4% chance per frame)
    if (Math.random() < 0.04) {
      const hit = actualShots[athlete.shotIndex]
      athlete.currentShots[athlete.shotIndex] = hit
      if (!hit) athlete.misses++

      // Update the display
      const rangeEntry = athletesAtRange.value.find(a => a.id === athlete.id)
      if (rangeEntry) {
        rangeEntry.shots = [...athlete.currentShots]
      }

      athlete.shotIndex++
    }
  } else {
    // Mark as leaving to prevent multiple timeouts
    athlete.leavingRange = true

    // Done shooting - leave range after brief delay
    setTimeout(() => {
      athlete.shootingsDone++
      athlete.phase = 'skiing'
      athlete.shotIndex = 0 // Reset for next range
      athlete.currentShots = [null, null, null, null, null]
      athlete.leavingRange = false
      athletesAtRange.value = athletesAtRange.value.filter(a => a.id !== athlete.id)
    }, 600) // Longer delay before leaving
  }
}

function updateMassLiveStandings() {
  // For mass/pursuit: show finish order for finished, position by X for racing
  // Calculate time gaps based on X position difference (approx 0.3 sec per unit of X)
  const TIME_PER_X_UNIT = 0.25

  const finishedAthletes = finishOrder.value.map((a, idx) => ({
    athleteId: a.id,
    lastName: a.lastName,
    country: a.country,
    position: idx + 1,
    misses: a.misses,
    finished: true,
    isWinner: idx === 0,
    gap: null // No gap for finished
  }))

  const racingSorted = visibleAthletes.value
    .filter(a => !a.finished)
    .sort((a, b) => b.x - a.x)

  const leaderX = racingSorted[0]?.x || 0

  const racingAthletes = racingSorted.map((a, idx) => {
    const xDiff = leaderX - a.x
    const timeGap = xDiff * TIME_PER_X_UNIT
    return {
      athleteId: a.id,
      lastName: a.lastName,
      country: a.country,
      position: finishedAthletes.length + idx + 1,
      misses: a.misses,
      finished: false,
      isShooting: a.phase === 'shooting',
      gap: idx === 0 ? null : timeGap // No gap for leader
    }
  })

  liveStandings.value = [...finishedAthletes, ...racingAthletes]
}

async function finishRaceAnimation() {
  stopAnimation()
  currentRacePhase.value = 'Race Complete!'

  // Race was already simulated at start, just fetch to show results
  try {
    await biathlonStore.fetchEvent(selectedEvent.value.id)
  } catch (error) {
    console.error('Failed to fetch event:', error)
  }

  isRaceInProgress.value = false
}

async function skipAnimation() {
  stopAnimation()
  isRaceInProgress.value = false
  currentRacePhase.value = 'Simulating...'

  try {
    await biathlonStore.simulateRace(selectedEvent.value.id)
    await biathlonStore.fetchEvent(selectedEvent.value.id)
  } catch (error) {
    console.error('Failed to simulate race:', error)
  }
}

function stopAnimation() {
  if (animationInterval.value) {
    clearInterval(animationInterval.value)
    animationInterval.value = null
  }
  currentShootingAthlete.value = null
  currentIntervalAthlete.value = null
  isIntervalMode.value = false
  currentAthleteIndex.value = 0
  totalAthletesToRace.value = 0
  allRaceResults.value = []
  athletesAtRange.value = []
  finishOrder.value = []
}

onMounted(async () => {
  try {
    if (!world.value || world.value.id !== worldId.value) {
      await worldsStore.fetchWorld(worldId.value)
    }
    await Promise.all([
      biathlonStore.fetchAthletes(worldId.value),
      teamsStore.fetchTeams(worldId.value, 'biathlon'),
      weekStatusStore.fetchWeekStatus(worldId.value)
    ])
    // Load season since Calendar is the default tab
    loadSeason()
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loadingAthletes.value = false
  }
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
.biathlon-page { min-height: 100vh; background: #f8fafc; color: #1e293b; }
.page-header { background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); padding: 0.75rem 0; position: sticky; top: 0; z-index: 100; }
.header-content { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.back-btn { padding: 0.5rem; }
.brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1.1rem; color: #3b82f6; }
.breadcrumb { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
.world-name, .sport-name { display: flex; align-items: center; gap: 0.5rem; }
.world-name { color: #64748b; }
.world-name i, .sport-name i { color: #3b82f6; }
.separator { color: #cbd5e1; font-size: 0.7rem; }
.sport-name { color: #3b82f6; font-weight: 500; }
.page-main { padding: 2rem 0; }

/* Main Navigation */
.main-nav { background: white; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0; }
.nav-tabs { display: flex; gap: 0.5rem; padding: 0.5rem 1.5rem; }
.nav-tab { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: transparent; border: none; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; color: #64748b; flex: 1; max-width: 180px; }
.nav-tab:hover { background: #f1f5f9; color: #1e293b; }
.nav-tab.active { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
.nav-tab-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border-radius: 0.375rem; color: var(--primary-500); font-size: 1rem; }
.nav-tab.active .nav-tab-icon { background: rgba(255, 255, 255, 0.2); color: white; }
.nav-tab-content { display: flex; flex-direction: column; align-items: flex-start; gap: 0.125rem; }
.nav-tab-label { font-weight: 600; color: #1e293b; font-size: 0.875rem; }
.nav-tab.active .nav-tab-label { color: white; }
.nav-tab-count { font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 0.125rem 0.5rem; border-radius: 0.25rem; }
.nav-tab-badge { font-size: 0.7rem; color: #22c55e; display: flex; align-items: center; gap: 0.25rem; }
.nav-tab-badge i { font-size: 0.5rem; animation: pulse 2s infinite; }
.nav-tab-leader { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #94a3b8; }
.leader-flag { width: 16px; height: 11px; border-radius: 2px; }

/* Tab Content */
.tab-content { animation: fadeIn 0.3s ease; }
.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Section Header */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.section-title { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.section-title i { color: var(--primary-500); }
.section-title .count { font-size: 1rem; color: #64748b; font-weight: 500; }
.actions { display: flex; gap: 0.75rem; }

/* Loading & Empty States */
.loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 4rem; color: #64748b; font-size: 1.125rem; }
.loading-state i { font-size: 1.5rem; }
.empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.empty-icon { width: 80px; height: 80px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary-100), var(--primary-200)); border-radius: 50%; }
.empty-icon i { font-size: 2rem; color: var(--primary-500); }
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
.empty-state p { color: #64748b; margin-bottom: 1.5rem; }
.warning-text { color: var(--warning-600); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }

/* Athletes Table */
.athletes-table-container { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
.athletes-table { width: 100%; border-collapse: collapse; }
.athletes-table th, .athletes-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
.athletes-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.athletes-table tr:hover { background: var(--primary-50); }
.athletes-table tr.clickable-row { cursor: pointer; }
.col-country { display: flex; align-items: center; gap: 0.5rem; }
.flag { width: 24px; height: 16px; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.country-code { font-weight: 600; color: #64748b; font-size: 0.875rem; }
.col-name { font-weight: 500; }
.col-skill { text-align: center; font-weight: 600; font-size: 0.875rem; }
.col-actions { text-align: right; white-space: nowrap; }
.col-actions .btn { padding: 0.25rem 0.5rem; }
.col-actions .delete-btn:hover { color: var(--danger-500); }

/* Modal Form Styles */
.modal-lg { max-width: 600px; }
.modal-sm { max-width: 400px; }
.form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
.form-row.skills-row { margin-bottom: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group label { font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
.form-group input[type="text"], .form-group select { padding: 0.625rem 0.75rem; border: 1px solid var(--gray-300); border-radius: 0.375rem; font-size: 0.875rem; }
.form-group input[type="text"]:focus, .form-group select:focus { outline: none; border-color: var(--primary-500); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.form-group input[type="range"] { width: 100%; cursor: pointer; }
.country-select-group { position: relative; }
.country-select-wrapper { position: relative; overflow: visible; }
.country-input { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid var(--gray-300); border-radius: 0.375rem; font-size: 0.875rem; }
.country-input:focus { outline: none; border-color: var(--primary-500); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.country-dropdown { position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; margin-top: 4px; }
.country-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.875rem; transition: background-color 0.15s; }
.country-item:hover { background: var(--primary-100); }
.country-item.selected { background: var(--primary-50); font-weight: 500; }
.country-item.no-results { color: var(--text-secondary); font-style: italic; cursor: default; }
.country-item.no-results:hover { background: transparent; }
.skill-value { color: var(--primary-600); font-weight: 700; }
.form-section-title { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin: 1rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--gray-200); }
.randomize-buttons { display: flex; gap: 0.25rem; }
.btn-xs { padding: 0.25rem 0.5rem; font-size: 0.7rem; text-transform: none; letter-spacing: 0; }
.btn-strong { color: #059669; }
.btn-strong:hover { background: #d1fae5; color: #047857; }
.btn-average { color: #d97706; }
.btn-average:hover { background: #fef3c7; color: #b45309; }
.btn-weak { color: #dc2626; }
.btn-weak:hover { background: #fee2e2; color: #b91c1c; }
.delete-warning { padding: 1rem 1.5rem; color: #475569; line-height: 1.6; }
.col-skill span { padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
.skill-elite { background: var(--success-100); color: var(--success-700); }
.skill-high { background: var(--primary-100); color: var(--primary-700); }
.skill-good { background: var(--gray-100); color: #475569; }
.skill-average { background: var(--warning-100); color: var(--warning-700); }
.skill-low { background: var(--danger-100); color: var(--danger-700); }
.overall { font-weight: 700; }

/* Season Header */
.season-header-card { display: flex; justify-content: space-between; align-items: center; background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1.5rem; }
.season-info h2 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
.biathlon-icon { color: #dc2626; }
.season-progress { display: flex; flex-direction: column; gap: 0.5rem; }
.progress-text { font-size: 0.875rem; color: #94a3b8; }
.progress-bar { width: 200px; height: 8px; background: var(--gray-200); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary-500), var(--primary-400)); transition: width 0.5s ease; }

/* Calendar */
.calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.calendar-event { background: white; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
.calendar-event:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.calendar-event.completed { border-color: var(--success); background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.calendar-event.is-locked { opacity: 0.6; cursor: not-allowed; position: relative; }
.calendar-event.is-locked:hover { transform: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.lock-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(100, 116, 139, 0.85); border-radius: 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; z-index: 10; color: white; }
.lock-overlay i { font-size: 1.5rem; }
.lock-overlay span { font-size: 0.875rem; font-weight: 600; }
.calendar-event-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.event-number-badge { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--primary-500); color: white; border-radius: 50%; font-size: 0.75rem; font-weight: 700; }
.race-type-badge { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
.race-type-badge.sprint { background: #fef3c7; color: #92400e; }
.race-type-badge.pursuit { background: #dbeafe; color: #1e40af; }
.race-type-badge.individual { background: #f3e8ff; color: #6b21a8; }
.race-type-badge.mass_start { background: #dcfce7; color: #166534; }
.event-status-badge { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; }
.event-status-badge.scheduled { background: var(--gray-200); color: #64748b; }
.event-status-badge.completed { background: var(--success-500); color: white; }
.calendar-event-body { padding: 1rem; }
.event-location { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.event-flag-large { width: 32px; height: 21px; border-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.location-details { display: flex; flex-direction: column; }
.location-name { font-weight: 600; color: #1e293b; }
.location-country { font-size: 0.75rem; color: #64748b; }
.event-race-info { display: flex; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.875rem; color: #94a3b8; }
.event-date-display { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b; }
.calendar-event-podium { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.podium-item { display: flex; align-items: center; gap: 0.375rem; }
.podium-pos { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.625rem; font-weight: 700; color: white; }
.podium-pos.gold { background: #f59e0b; }
.podium-pos.silver { background: #9ca3af; }
.podium-pos.bronze { background: #d97706; }
.podium-flag-sm { width: 16px; height: 11px; border-radius: 2px; }
.podium-name { font-size: 0.75rem; font-weight: 500; color: #475569; }
.calendar-event-footer { padding: 0.75rem 1rem; border-top: 1px solid var(--gray-100); }

/* Standings Switcher */
.standings-compact { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
.standings-switcher { display: flex; gap: 0.25rem; padding: 0.75rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
.standings-switch { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
.standings-switch:hover:not(.disabled) { border-color: var(--primary-300); color: var(--primary-600); }
.standings-switch.active { background: var(--primary-500); border-color: var(--primary-500); color: white; }
.standings-switch.disabled { opacity: 0.5; cursor: not-allowed; }
.standings-switch.sprint.active { background: #f59e0b; border-color: #f59e0b; }
.standings-switch.pursuit.active { background: #3b82f6; border-color: #3b82f6; }
.standings-switch.individual.active { background: #8b5cf6; border-color: #8b5cf6; }
.standings-switch.mass_start.active { background: #10b981; border-color: #10b981; }
.switch-count { font-size: 0.75rem; opacity: 0.8; }

/* Standings Panel */
.standings-panel { padding: 1rem; max-height: 500px; overflow-y: auto; }
.standings-list-compact { display: flex; flex-direction: column; gap: 0.375rem; }
.standing-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.5rem; transition: background 0.2s; }
.standing-row:hover { background: #f8fafc; }
.standing-row.top-3 { background: var(--primary-50); }
.standing-rank { width: 32px; text-align: center; }
.medal { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: white; }
.medal.gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
.medal.silver { background: linear-gradient(135deg, #9ca3af, #6b7280); }
.medal.bronze { background: linear-gradient(135deg, #d97706, #b45309); }
.rank-num { font-weight: 600; color: #64748b; }
.standing-flag-sm { width: 24px; height: 16px; border-radius: 2px; }
.standing-info { flex: 1; display: flex; align-items: baseline; gap: 0.5rem; min-width: 0; }
.standing-name-compact { font-weight: 600; color: #1e293b; }
.standing-firstname { font-size: 0.75rem; color: #64748b; }
.standing-data { display: flex; align-items: center; gap: 0.5rem; }
.standing-pts { font-weight: 700; color: var(--primary-600); font-size: 0.875rem; }
.discipline-pts { color: #475569; }
.standing-races-sm { font-size: 0.75rem; color: var(--gray-400); }
.no-standings { text-align: center; padding: 3rem; color: #64748b; }
.no-standings i { font-size: 2rem; margin-bottom: 1rem; display: block; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal, .modal-content { background: white; border-radius: 1rem; width: 100%; max-width: 500px; max-height: 90vh; overflow: visible; display: flex; flex-direction: column; }
.modal.modal-sm { max-width: 400px; }
.modal.modal-lg { max-width: 600px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-200); }
.modal-header h2 { font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
.modal-body { padding: 1.5rem; overflow: visible; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; background: #f8fafc; }

/* Race Modal */
.race-modal { max-width: 1000px; }
.race-modal-header { background: #f8fafc; }
.race-info { display: flex; align-items: center; gap: 1rem; }
.race-flag { width: 48px; height: 32px; border-radius: 4px; }
.race-details h2 { margin-bottom: 0.25rem; }
.race-type-label { font-size: 0.875rem; color: #94a3b8; display: flex; align-items: center; gap: 0.375rem; }
.race-type-label.sprint { color: #92400e; }
.race-type-label.pursuit { color: #1e40af; }
.race-type-label.individual { color: #6b21a8; }
.race-type-label.mass_start { color: #166534; }
.race-modal-body { padding: 0; }

/* Race Start Panel */
.race-start-panel { padding: 3rem 2rem; text-align: center; }
.race-preview { margin-bottom: 2rem; }
.race-preview-icon { width: 80px; height: 80px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; color: white; font-size: 2rem; }
.race-preview-count { font-size: 1.25rem; color: #475569; margin-bottom: 0.5rem; }
.race-preview-details { display: flex; justify-content: center; gap: 2rem; color: #64748b; }
.race-preview-details span { display: flex; align-items: center; gap: 0.5rem; }

/* Race Animation */
.race-animation-container { min-height: 500px; }
.race-animation-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; }
.race-timer { display: flex; align-items: center; gap: 0.75rem; }
.timer-value { font-family: 'Monaco', monospace; font-size: 1.5rem; font-weight: 700; }
.race-status-display { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.status-label { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
.interval-progress { display: flex; align-items: center; gap: 0.75rem; }
.interval-progress-bar { width: 120px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
.interval-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); transition: width 0.3s ease; }
.interval-count { font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 600; }
/* New Layout: Track on top, panels below */
.race-animation-content { display: flex; flex-direction: column; min-height: 400px; }
.race-track-container { background: linear-gradient(180deg, #e0f2fe, #f0f9ff); padding: 0.5rem; position: relative; overflow: hidden; border-bottom: 2px solid #cbd5e1; }
.biathlon-track-svg { width: 100%; height: auto; max-height: 200px; }

/* Bottom Panels Layout */
.race-bottom-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 0; flex: 1; min-height: 180px; }

/* Shooting Panel (Left) */
.shooting-panel { background: #0f172a; color: white; padding: 0.75rem; border-right: 1px solid #334155; }
.panel-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.8rem; color: #fbbf24; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #334155; text-transform: uppercase; letter-spacing: 0.05em; }
.current-shooting { animation: fadeIn 0.3s ease; }
.shooting-athlete-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.shooting-flag { width: 24px; height: 16px; border-radius: 2px; }
.shooting-name { font-weight: 600; flex: 1; }
.shooting-range-badge { background: #3b82f6; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 700; }
.shooting-targets-row { display: flex; align-items: center; gap: 0.5rem; }
.target-display { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.8rem; transition: all 0.2s; }
.target-display.pending { background: #475569; color: #94a3b8; }
.target-display.hit { background: #10b981; color: white; animation: hitPop 0.3s ease; }
.target-display.miss { background: #ef4444; color: white; animation: missPop 0.3s ease; }
@keyframes hitPop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
@keyframes missPop { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
.shooting-score { font-size: 1.1rem; font-weight: 700; margin-left: 0.5rem; color: #fbbf24; }
.shooting-waiting { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #64748b; padding: 1rem; }
.shooting-waiting i { font-size: 1.5rem; }

/* Mass Shooting Display */
.mass-shooting-display { display: flex; flex-direction: column; gap: 0.375rem; }
.range-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem; background: rgba(255,255,255,0.03); border-radius: 0.25rem; }
.range-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; width: 24px; text-align: center; }
.range-athletes { display: flex; flex-wrap: wrap; gap: 0.375rem; flex: 1; min-height: 24px; }
.range-shooter { display: flex; align-items: center; gap: 0.25rem; background: rgba(251, 191, 36, 0.2); padding: 0.25rem 0.5rem; border-radius: 0.25rem; animation: shooterEnter 0.3s ease; }
@keyframes shooterEnter { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
.shooter-flag { width: 16px; height: 11px; border-radius: 2px; }
.shooter-name { font-size: 0.7rem; font-weight: 600; max-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shooter-shots { display: flex; gap: 2px; }
.shot-dot { width: 8px; height: 8px; border-radius: 50%; transition: all 0.15s; }
.shot-dot.pending { background: #475569; }
.shot-dot.hit { background: #10b981; }
.shot-dot.miss { background: #ef4444; }
.range-empty { color: #475569; font-size: 0.75rem; }

/* Standings Panel (Right) - Race Animation */
.race-standings-panel { background: rgba(15, 23, 42, 0.95); color: white; padding: 0.75rem; display: flex; flex-direction: column; border-radius: 0.5rem; }
.current-athlete-card { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 0.625rem; border-radius: 0.5rem; margin-bottom: 0.5rem; animation: pulseGlow 2s infinite; }
@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 16px rgba(59, 130, 246, 0.8); } }
.athlete-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; }
.bib { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.7); }
.athlete-flag-sm { width: 20px; height: 14px; border-radius: 2px; }
.athlete-name-main { font-weight: 700; font-size: 0.9rem; }
.stats-row { display: flex; gap: 1rem; }
.stat-compact { display: flex; flex-direction: column; }
.stat-val { font-family: 'Monaco', monospace; font-weight: 600; font-size: 0.85rem; }
.stat-val.time { color: #fbbf24; }
.stat-val.pos { color: rgba(255,255,255,0.8); font-size: 0.75rem; }
.stat-lbl { font-size: 0.6rem; color: rgba(255,255,255,0.5); text-transform: uppercase; }
.no-standings-yet { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #64748b; padding: 1rem; font-size: 0.8rem; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Live Leaderboard */
.live-leaderboard { flex: 1; overflow-y: auto; }
.leaderboard-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.8rem; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #334155; }
.current-athlete-card { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.75rem; animation: pulseGlow 2s infinite; }
@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 16px rgba(59, 130, 246, 0.8); } }

/* Action buttons at top of athlete card */
.athlete-actions-top { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.btn-action-primary { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: #10b981; color: white; border: none; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-action-primary:hover { background: #059669; transform: scale(1.02); }
.btn-action-secondary { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-action-secondary:hover { background: rgba(255,255,255,0.3); }
.racing-indicator { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 600; color: #10b981; }
.racing-indicator i { font-size: 0.5rem; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Stats row for checkpoint display */
.stat-val.ahead { color: #10b981; font-weight: 700; }
.stat-val.behind { color: #f87171; font-weight: 700; }
.stat-val.leader { font-size: 0.7rem; color: rgba(255,255,255,0.9); }
.current-label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.7); margin-bottom: 0.375rem; }
.current-athlete-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.current-flag { width: 24px; height: 16px; border-radius: 2px; }
.current-name { font-weight: 700; font-size: 1rem; }
.time-to-beat { display: flex; justify-content: space-between; font-size: 0.75rem; color: rgba(255,255,255,0.8); border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem; margin-top: 0.25rem; }
.ttb-label { opacity: 0.7; }
.ttb-time { font-family: 'Monaco', monospace; font-weight: 600; color: #fbbf24; }
.leaderboard-entries { display: flex; flex-direction: column; gap: 0.25rem; }
.leaderboard-entry { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.375rem; font-size: 0.875rem; transition: background 0.2s; }
.leaderboard-entry.leader { background: rgba(251, 191, 36, 0.2); }
.leaderboard-entry.finished { opacity: 0.7; }
.entry-rank { width: 24px; font-weight: 700; color: #94a3b8; }
.leaderboard-entry.leader .entry-rank { color: #fbbf24; }
.entry-flag { width: 20px; height: 14px; border-radius: 2px; }
.entry-name { flex: 1; font-weight: 500; }
.entry-time { font-family: 'Monaco', monospace; font-size: 0.8rem; color: #94a3b8; min-width: 50px; text-align: right; }
.entry-time.entry-behind { color: #f87171; }
.entry-misses { color: #f87171; font-size: 0.75rem; }
.entry-rank.gold { color: #fbbf24; font-weight: 800; }
.entry-rank.silver { color: #d1d5db; }
.entry-rank.bronze { color: #f59e0b; }
.entry-gap { font-family: 'Monaco', monospace; font-size: 0.7rem; color: #f87171; margin-left: auto; }
.entry-status { font-size: 0.7rem; margin-left: 0.25rem; }
.finished-badge { color: #10b981; }
.shooting-badge { color: #fbbf24; animation: pulse 1s infinite; }
.leaderboard-entry.shooting { background: rgba(251, 191, 36, 0.15); }

/* Results Table */
.results-header { padding: 1rem 1.5rem; background: rgba(15, 23, 42, 0.5); border-bottom: 1px solid var(--gray-200); }
.results-header.completed { background: var(--success-50); color: var(--success-700); font-weight: 600; }
.results-table-container { overflow-x: auto; max-height: 400px; overflow-y: auto; }
.results-table { width: 100%; border-collapse: collapse; }
.results-table th, .results-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--gray-100); }
.results-table th { position: sticky; top: 0; background: rgba(15, 23, 42, 0.5); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
.results-table tr.podium { background: var(--primary-50); }
.results-table tr.yellow-jersey { background: #fef9c3; }
.col-rank { width: 50px; text-align: center; }
.col-time { font-family: monospace; }
.col-behind { font-family: monospace; color: #64748b; }
.col-shooting { text-align: center; }
.col-misses { text-align: center; }
.result-flag { width: 24px; height: 16px; border-radius: 2px; }
.misses-perfect { color: var(--success-600); font-weight: 700; }
.misses-good { color: var(--primary-600); font-weight: 600; }
.misses-average { color: var(--warning-600); }
.misses-bad { color: var(--danger-600); font-weight: 600; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: none; }
.btn-primary { background: var(--primary-500); color: white; }
.btn-primary:hover { background: var(--primary-600); }
.btn-secondary { background: var(--gray-100); color: #cbd5e1; }
.btn-secondary:hover { background: var(--gray-200); }
.btn-ghost { background: transparent; color: #94a3b8; }
.btn-ghost:hover { background: var(--gray-100); }
.btn-danger { background: var(--danger-500); color: white; }
.btn-danger:hover { background: var(--danger-600); }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.btn-lg { padding: 0.875rem 1.5rem; font-size: 1rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.text-danger { color: var(--danger-500) !important; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

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
  background: rgba(30, 41, 59, 0.8);
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
  color: #cbd5e1;
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
  background: rgba(15, 23, 42, 0.5);
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
  color: #64748b;
  text-transform: uppercase;
}

.result-position {
  width: 36px;
  text-align: center;
}

.result-position .position {
  font-weight: 600;
  color: #94a3b8;
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
.team-standings-section { background: rgba(30, 41, 59, 0.8); border-radius: 0.75rem; padding: 1.5rem; border: 1px solid rgba(148, 163, 184, 0.1); }
.team-standings-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.team-standing-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(15, 23, 42, 0.5); border-radius: 0.5rem; border-left: 4px solid; }
.team-standing-clickable { cursor: pointer; transition: all 0.2s; }
.team-standing-clickable:hover { background: var(--gray-100); transform: translateX(4px); }
.team-standing-position { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.team-standing-position .position { font-weight: 600; color: #94a3b8; font-size: 0.875rem; }
.team-standing-logo { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-standing-logo img { width: 100%; height: 100%; object-fit: contain; }
.team-standing-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.team-standing-name { font-weight: 600; color: #e2e8f0; }
.team-standing-athletes { font-size: 0.75rem; color: #64748b; }
.team-standing-points { font-weight: 700; font-size: 1.125rem; color: var(--primary-600); }

.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.team-card { background: rgba(30, 41, 59, 0.8); border-radius: 0.75rem; padding: 1.25rem; border: 1px solid rgba(148, 163, 184, 0.1); border-top: 4px solid; cursor: pointer; transition: all 0.2s; }
.team-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
.team-card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
.team-logo { width: 48px; height: 48px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.875rem; }
.team-logo img { width: 100%; height: 100%; object-fit: contain; }
.team-info h4 { font-weight: 600; color: #e2e8f0; margin: 0; }
.team-athlete-count { font-size: 0.75rem; color: #64748b; }
.team-description { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1rem; }
.team-card-actions { display: flex; gap: 0.5rem; }

.team-modal { max-width: 480px; }
.team-modal .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.color-picker-wrapper { display: flex; align-items: center; gap: 0.5rem; }
.color-picker { width: 40px; height: 40px; padding: 0; border: none; cursor: pointer; }
.color-preview { width: 24px; height: 24px; border-radius: 0.25rem; border: 1px solid var(--gray-300); }

.team-standing-detail-modal { max-width: 500px; }
.team-modal-header-info { display: flex; align-items: center; gap: 1rem; }
.team-logo-small { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-total-points { font-size: 0.875rem; color: #64748b; }
.team-athletes-list { max-height: 400px; overflow-y: auto; }
.empty-team-athletes { text-align: center; padding: 2rem; color: var(--gray-400); }
.team-athlete-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--gray-100); }
.team-athlete-item:last-child { border-bottom: none; }
.athlete-wc-rank { width: 36px; text-align: center; font-weight: 600; color: #64748b; }
.athlete-wc-rank .rank-leader { color: var(--success-600); }
.athlete-wc-rank .rank-none { color: var(--gray-300); }
.athlete-flag-small { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; }
.athlete-name-full { flex: 1; font-weight: 500; }
.athlete-wc-points { font-weight: 600; color: var(--primary-600); }

.section-subtitle { font-size: 1rem; font-weight: 600; color: #cbd5e1; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.section-subtitle i { color: var(--primary-500); }

/* Interval Shooting Display */
.interval-shooting-display { display: flex; flex-direction: column; gap: 0.75rem; }
.shooting-summary { display: flex; flex-direction: column; gap: 0.375rem; }
.summary-range { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.625rem; background: rgba(255,255,255,0.05); border-radius: 0.375rem; border-left: 3px solid #475569; transition: all 0.2s; }
.summary-range.passed { border-left-color: #10b981; background: rgba(16, 185, 129, 0.1); }
.summary-range.active { border-left-color: #fbbf24; background: rgba(251, 191, 36, 0.15); animation: pulseActive 1s infinite; }
@keyframes pulseActive { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.summary-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; width: 24px; text-align: center; }
.summary-range.passed .summary-label { color: #10b981; }
.summary-range.active .summary-label { color: #fbbf24; }
.summary-shots { display: flex; gap: 4px; flex: 1; }
.summary-dot { width: 14px; height: 14px; border-radius: 50%; transition: all 0.2s; }
.summary-dot.pending { background: #475569; }
.summary-dot.hit { background: #10b981; }
.summary-dot.miss { background: #ef4444; }
.summary-score { font-size: 0.8rem; font-weight: 700; min-width: 32px; text-align: right; }
.summary-score.perfect { color: #10b981; }
.summary-score.good { color: #fbbf24; }
.summary-score.bad { color: #ef4444; }
.shooting-total { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem; background: rgba(251, 191, 36, 0.1); border-radius: 0.375rem; margin-top: 0.25rem; }
.total-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; }
.total-hits { font-size: 0.9rem; font-weight: 700; color: #fbbf24; }
.total-misses { font-size: 0.75rem; color: #94a3b8; }
.total-misses.perfect { color: #10b981; font-weight: 600; }

/* Checkpoint Position Result */
.checkpoint-result {
  margin-top: 0.75rem;
  padding: 0.625rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
  border-radius: 0.5rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
  animation: checkpointPop 0.4s ease;
}
@keyframes checkpointPop {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
.checkpoint-header {
  display: flex;
  justify-content: center;
  margin-bottom: 0.375rem;
}
.checkpoint-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.checkpoint-position {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.checkpoint-position .position-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
}
.checkpoint-position.leader .position-number {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}
.checkpoint-position.podium .position-number {
  color: #10b981;
}
.checkpoint-position .position-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}
.checkpoint-position.leader .position-label {
  color: #fbbf24;
}
.checkpoint-position .position-label.time-behind {
  font-family: 'Monaco', monospace;
  font-size: 0.8rem;
  color: #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-tabs { flex-wrap: wrap; }
  .nav-tab { max-width: none; }
  .header-content { padding: 0.75rem 1rem; }
  .breadcrumb { display: none; }
  .standings-switcher { overflow-x: auto; flex-wrap: nowrap; }
  .standings-switch span:not(:first-child) { display: none; }
  .race-bottom-panels { grid-template-columns: 1fr; }
  .shooting-panel { border-right: none; border-bottom: 1px solid #334155; }
  .live-leaderboard { max-height: 200px; overflow-y: auto; }
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
