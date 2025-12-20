<template>
  <div class="sport-page nordic-combined">
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
            <i class="fa-solid fa-medal nc-icon"></i>
            Nordic Combined
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
                <img :src="`/flags/${seasonStandings[0].country}.png`" class="leader-flag" onerror="this.style.display='none'" />
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
              Nordic Combined Athletes
              <span class="count" v-if="athletes.length">({{ athletes.length }})</span>
            </h2>
            <div class="actions">
              <button
                @click="handleGenerateAthletes"
                class="btn btn-primary"
                :disabled="generating"
              >
                <i v-if="generating" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                {{ generating ? 'Generating...' : 'Generate 30 Athletes' }}
              </button>
              <button
                @click="openAddAthleteModal"
                class="btn btn-secondary"
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
              <i class="fa-solid fa-medal"></i>
            </div>
            <h3>No Athletes Yet</h3>
            <p>Generate a roster of Nordic Combined athletes or add them manually.</p>
            <div class="empty-state-actions">
              <button @click="handleGenerateAthletes" class="btn btn-primary" :disabled="generating">
                <i v-if="generating" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                {{ generating ? 'Generating...' : 'Generate 30 Athletes' }}
              </button>
              <button @click="openAddAthleteModal" class="btn btn-secondary">
                <i class="fa-solid fa-plus"></i> Add Manually
              </button>
            </div>
          </div>

          <div v-else class="athletes-table-container">
            <table class="athletes-table">
              <thead>
                <tr>
                  <th class="col-flag">Nation</th>
                  <th class="col-name">Name</th>
                  <th class="col-skill">Jumping</th>
                  <th class="col-skill">Flight</th>
                  <th class="col-skill">Landing</th>
                  <th class="col-skill">Skiing</th>
                  <th class="col-skill">Endurance</th>
                  <th class="col-skill">Form</th>
                  <th class="col-skill overall">Overall</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="athlete in athletes" :key="athlete.id">
                  <td class="col-flag">
                    <img :src="`/flags/${athlete.country}.png`" class="athlete-flag" onerror="this.style.display='none'" />
                  </td>
                  <td class="col-name">
                    <span class="athlete-name">{{ athlete.last_name }}</span>
                    <span class="athlete-firstname">{{ athlete.first_name }}</span>
                  </td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_jumping)">{{ athlete.skill_jumping }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_flight)">{{ athlete.skill_flight }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_landing)">{{ athlete.skill_landing }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_skiing)">{{ athlete.skill_skiing }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.skill_endurance)">{{ athlete.skill_endurance }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(athlete.form)">{{ athlete.form }}</span></td>
                  <td class="col-skill overall"><span :class="getSkillClass(getOverall(athlete))">{{ getOverall(athlete) }}</span></td>
                  <td class="col-actions">
                    <button @click="editAthlete(athlete)" class="btn btn-ghost btn-sm"><i class="fa-solid fa-pen"></i></button>
                    <button @click="confirmDeleteAthlete(athlete)" class="btn btn-ghost btn-sm text-danger"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Season Tab -->
        <div v-if="activeTab === 'season'" class="tab-content fade-in">
          <div v-if="!currentSeason" class="no-season-panel">
            <div class="no-season-content">
              <i class="fa-solid fa-calendar-plus"></i>
              <h3>Start a New Season</h3>
              <p>Create a World Cup season calendar to begin competing.</p>
              <div class="season-form">
                <div class="year-inputs">
                  <input v-model.number="newSeasonYearStart" type="number" placeholder="Start Year" min="2020" max="2099" />
                  <span>/</span>
                  <input v-model.number="newSeasonYearEnd" type="number" placeholder="End Year" min="2021" max="2100" />
                </div>
                <button @click="createSeason" class="btn btn-primary" :disabled="creatingSeasonLoading">
                  <i v-if="creatingSeasonLoading" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-plus"></i>
                  {{ creatingSeasonLoading ? 'Creating...' : 'Create Season' }}
                </button>
              </div>
            </div>
          </div>

          <div v-else>
            <!-- Season Header -->
            <div class="season-header-card">
              <div class="season-info">
                <h2>
                  <i class="fa-solid fa-medal nc-icon"></i>
                  {{ currentSeason.name }}
                </h2>
                <div class="season-progress">
                  <span class="progress-text">{{ completedEventsCount }} of {{ seasonEvents.length }} events completed</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${(completedEventsCount / seasonEvents.length) * 100}%` }"></div>
                  </div>
                </div>
              </div>
              <div class="season-actions">
                <button v-if="nextEvent" @click="openRaceModal(nextEvent)" class="btn btn-primary">
                  <i class="fa-solid fa-play"></i>
                  Next Event
                </button>
                <button @click="showDeleteSeasonConfirm = true" class="btn btn-ghost text-danger">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-grid">
              <div
                v-for="event in seasonEvents"
                :key="event.id"
                :class="['calendar-event', event.status, { 'is-locked': weekStatusStore.isEventLocked(event.date) }]"
                @click="openRaceModal(event)"
              >
                <div v-if="weekStatusStore.isEventLocked(event.date)" class="lock-overlay">
                  <i class="fa-solid fa-lock"></i>
                  <span>Week Locked</span>
                </div>
                <div class="calendar-event-header">
                  <span class="event-number-badge">{{ event.event_index + 1 }}</span>
                  <span :class="['event-type-badge', event.hill_size]">
                    <i class="fa-solid fa-mountain"></i>
                    {{ event.hill_size === 'large' ? 'LH' : 'NH' }}
                  </span>
                  <span v-if="event.status === 'completed'" class="event-status-badge completed">
                    <i class="fa-solid fa-check"></i>
                  </span>
                  <span v-else class="event-status-badge scheduled">
                    <i class="fa-solid fa-clock"></i>
                  </span>
                </div>
                <div class="calendar-event-body">
                  <div class="event-location">
                    <img :src="`/flags/${event.country}.png`" class="event-flag-large" onerror="this.style.display='none'" />
                    <div class="location-details">
                      <span class="location-name">{{ event.location }}</span>
                      <span class="location-country">K{{ event.k_point }} / {{ event.xc_distance }}km</span>
                    </div>
                  </div>
                  <div class="event-date-display">
                    <i class="fa-solid fa-calendar"></i>
                    {{ formatDate(event.date) }}
                  </div>
                </div>
                <div v-if="event.status === 'completed' && getEventPodium(event).length > 0" class="calendar-event-podium">
                  <div v-for="(p, idx) in getEventPodium(event)" :key="idx" class="podium-item">
                    <span :class="['podium-pos', ['gold', 'silver', 'bronze'][idx]]">{{ idx + 1 }}</span>
                    <img :src="`/flags/${p.country}.png`" class="podium-flag-sm" onerror="this.style.display='none'" />
                    <span class="podium-name">{{ p.lastName }}</span>
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
                <p>No standings yet. Complete some events first!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(standing, index) in seasonStandings"
                  :key="standing.athleteId"
                  :class="['standing-row', { 'top-3': index < 3 }, 'clickable']"
                  @click="openCompetitorModal(standing)"
                >
                  <div class="standing-rank">
                    <span v-if="index === 0" class="medal gold">1</span>
                    <span v-else-if="index === 1" class="medal silver">2</span>
                    <span v-else-if="index === 2" class="medal bronze">3</span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <img :src="`/flags/${standing.country}.png`" class="standing-flag-sm" onerror="this.style.display='none'" />
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ standing.lastName }}</span>
                    <span class="standing-firstname">{{ standing.firstName }}</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts">{{ standing.points }} pts</span>
                    <span class="standing-races-sm">{{ standing.races }} races</span>
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
      <div class="modal race-modal">
        <div class="modal-header race-modal-header">
          <div class="race-info">
            <img :src="`/flags/${selectedEvent?.country}.png`" class="race-flag" onerror="this.style.display='none'" />
            <div class="race-details">
              <h2>{{ selectedEvent?.location }}</h2>
              <span :class="['event-type-label', selectedEvent?.hill_size]">
                <i class="fa-solid fa-mountain"></i>
                {{ selectedEvent?.hill_size === 'large' ? 'Large Hill' : 'Normal Hill' }} K{{ selectedEvent?.k_point }} + {{ selectedEvent?.xc_distance }}km XC
              </span>
            </div>
          </div>
          <button @click="closeRaceModal" class="btn btn-ghost"><i class="fa-solid fa-times"></i></button>
        </div>

        <!-- Race Phase Tabs -->
        <div class="race-tabs" v-if="selectedEvent?.status !== 'completed' || raceInProgress">
          <button
            :class="['race-tab', { active: currentPhase === 'jumping' }]"
            @click="currentPhase = 'jumping'"
          >
            <i class="fa-solid fa-person-skiing"></i>
            Ski Jumping
            <span v-if="isJumpingComplete" class="tab-check"><i class="fa-solid fa-check"></i></span>
          </button>
          <button
            :class="['race-tab', { active: currentPhase === 'xc', disabled: !isJumpingComplete }]"
            @click="isJumpingComplete && (currentPhase = 'xc')"
            :disabled="!isJumpingComplete"
          >
            <i class="fa-solid fa-person-skiing-nordic"></i>
            Cross-Country
            <span v-if="isXCComplete" class="tab-check"><i class="fa-solid fa-check"></i></span>
          </button>
        </div>

        <div class="modal-body race-modal-body">
          <!-- Jumping Phase -->
          <div v-if="currentPhase === 'jumping' && selectedEvent?.status !== 'completed'" class="race-phase-content">
            <!-- Start Jumping -->
            <div v-if="!jumpingStarted" class="race-start-section">
              <div class="start-icon"><i class="fa-solid fa-mountain"></i></div>
              <h3>Ski Jumping Round</h3>
              <p>{{ athletes.length }} athletes will compete on the K{{ selectedEvent?.k_point }} hill.</p>
              <p class="start-note">Athletes jump in reverse order (lowest ranked first).</p>
              <button @click="startJumpingPhase" class="btn btn-primary btn-lg" :disabled="simulating || athletes.length === 0">
                <i class="fa-solid fa-play"></i>
                Start Jumping
              </button>
            </div>

            <!-- Jumping In Progress -->
            <div v-else class="race-dual-view">
              <!-- Start List (pending jumpers) -->
              <div v-if="pendingJumpers.length > 0" class="start-list-section">
                <div class="section-label">
                  <i class="fa-solid fa-list-ol"></i>
                  Start List ({{ pendingJumpers.length }} remaining)
                </div>
                <div class="simulate-buttons">
                  <button @click="simulateNextJumper" class="btn btn-primary" :disabled="simulating || animating">
                    <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-forward-step"></i>
                    {{ simulating ? 'Jumping...' : 'Next Jumper' }}
                  </button>
                  <button @click="simulateAllJumpers" class="btn btn-secondary" :disabled="simulating || animating">
                    <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-forward-fast"></i>
                    Simulate All
                  </button>
                </div>
                <div class="start-list-container">
                  <div
                    v-for="(entry, idx) in pendingJumpers.slice(0, 10)"
                    :key="entry.athleteId"
                    :class="['start-list-item', { 'next-jumper': idx === 0 }]"
                  >
                    <span class="start-bib">{{ entry.bibNumber }}</span>
                    <img :src="`/flags/${entry.country}.png`" class="start-flag" onerror="this.style.display='none'" />
                    <span class="start-name">{{ entry.lastName }} {{ entry.firstName }}</span>
                    <span class="start-wc-rank" :class="{ 'top-10': entry.wcRank <= 10, 'unranked': entry.wcRank >= 999 }">
                      <template v-if="entry.wcRank < 999">WC #{{ entry.wcRank }}</template>
                      <template v-else>-</template>
                    </span>
                  </div>
                  <div v-if="pendingJumpers.length > 10" class="more-jumpers">
                    +{{ pendingJumpers.length - 10 }} more
                  </div>
                </div>
              </div>

              <!-- Proceed to XC -->
              <div v-if="isJumpingComplete && !isXCComplete" class="proceed-section">
                <button @click="startXCPhase" class="btn btn-success btn-lg">
                  <i class="fa-solid fa-arrow-right"></i> Proceed to Cross-Country
                </button>
              </div>

              <!-- Live Ranking -->
              <div v-if="completedJumpers.length > 0" class="ranking-section">
                <div class="section-label">
                  <i class="fa-solid fa-ranking-star"></i>
                  Jump Standings ({{ completedJumpers.length }} jumped)
                </div>
                <div class="results-table-container">
                  <table class="results-table">
                    <thead>
                      <tr>
                        <th class="col-rank">Rank</th>
                        <th class="col-country"></th>
                        <th class="col-name">Name</th>
                        <th class="col-distance">Distance</th>
                        <th class="col-points">Points</th>
                        <th class="col-gap">Start Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(entry, idx) in completedJumpers" :key="entry.athleteId" :class="{ 'highlight-row': entry.justJumped }">
                        <td class="col-rank">
                          <span :class="{ 'rank-gold': idx === 0, 'rank-silver': idx === 1, 'rank-bronze': idx === 2 }">{{ idx + 1 }}</span>
                        </td>
                        <td class="col-country">
                          <img :src="`/flags/${entry.country}.png`" class="result-flag" onerror="this.style.display='none'" />
                        </td>
                        <td class="col-name">{{ entry.lastName }}</td>
                        <td class="col-distance">{{ entry.jump?.distance }}m</td>
                        <td class="col-points">{{ entry.jump?.totalPoints?.toFixed(1) }}</td>
                        <td class="col-gap">{{ idx === 0 ? '0.0s' : '+' + entry.startGap?.toFixed(1) + 's' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- XC Phase -->
          <div v-else-if="currentPhase === 'xc' && selectedEvent?.status !== 'completed'" class="race-phase-content">
            <div v-if="!xcStarted" class="xc-start-view">
              <div class="xc-start-header">
                <div class="start-icon"><i class="fa-solid fa-person-skiing-nordic"></i></div>
                <h3>Cross-Country Race</h3>
                <p>{{ selectedEvent?.xc_distance }}km pursuit race with Gundersen start</p>
                <button @click="startXCRace" class="btn btn-primary btn-lg" :disabled="simulating">
                  <i class="fa-solid fa-play"></i>
                  Start Race
                </button>
              </div>
              <div class="pursuit-start-list">
                <div class="pursuit-header">
                  <i class="fa-solid fa-flag-checkered"></i>
                  Pursuit Start Order
                </div>
                <div class="pursuit-entries">
                  <div
                    v-for="(athlete, idx) in pursuitStartOrder"
                    :key="athlete.athleteId"
                    :class="['pursuit-entry', { 'leader': idx === 0, 'podium': idx < 3 }]"
                  >
                    <span class="pursuit-pos" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">{{ idx + 1 }}</span>
                    <img :src="`/flags/${athlete.country}.png`" class="pursuit-flag" onerror="this.style.display='none'" />
                    <span class="pursuit-name">{{ athlete.lastName }}</span>
                    <span class="pursuit-jump-pts">{{ athlete.jump?.totalPoints?.toFixed(1) }} pts</span>
                    <span class="pursuit-gap" :class="{ 'first': idx === 0 }">
                      {{ idx === 0 ? '0:00' : '+' + formatStartGap(athlete.startGap) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="xc-animation">
              <div class="xc-track-container">
                <div class="xc-race-info">
                  <span class="xc-distance"><i class="fa-solid fa-route"></i> {{ selectedEvent?.xc_distance }}km</span>
                  <span class="xc-format"><i class="fa-solid fa-clock"></i> Gundersen Pursuit</span>
                </div>
                <svg viewBox="0 0 800 220" class="xc-track-svg">
                  <defs>
                    <linearGradient id="snowGradientXC" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#f0f9ff" />
                      <stop offset="100%" style="stop-color:#e0f2fe" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="800" height="220" fill="url(#snowGradientXC)" />
                  <path d="M 0 140 L 80 80 L 150 120 L 220 60 L 300 100 L 380 50 L 450 90 L 520 70 L 600 100 L 680 60 L 750 90 L 800 70 L 800 220 L 0 220 Z" fill="#cbd5e1" opacity="0.3" />
                  <path d="M 30 160 Q 150 140, 300 160 Q 450 180, 600 155 Q 700 140, 770 160" fill="none" stroke="#94a3b8" stroke-width="20" stroke-linecap="round" />
                  <path d="M 30 160 Q 150 140, 300 160 Q 450 180, 600 155 Q 700 140, 770 160" fill="none" stroke="white" stroke-width="14" stroke-linecap="round" />
                  <rect x="25" y="130" width="15" height="60" fill="#22c55e" rx="2" />
                  <text x="32" y="125" text-anchor="middle" fill="#22c55e" font-size="10" font-weight="bold">START</text>
                  <rect x="760" y="130" width="15" height="60" fill="#ef4444" rx="2" />
                  <text x="767" y="125" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="bold">FINISH</text>
                  <g v-for="(athlete, idx) in xcAnimatedAthletes.filter(a => a.started).slice(0, 20)" :key="athlete.athleteId">
                    <circle :cx="athlete.x" :cy="getTrackY(athlete.x) - 8" r="7" :fill="athlete.finished ? '#10b981' : getAthleteColor(idx)" stroke="white" stroke-width="2" />
                    <text v-if="idx < 5" :x="athlete.x" :y="getTrackY(athlete.x) - 20" text-anchor="middle" font-size="8" font-weight="bold" fill="#1e293b">{{ athlete.lastName?.substring(0, 6) }}</text>
                  </g>
                </svg>
              </div>
              <div class="xc-leaderboard">
                <div class="leaderboard-header">
                  <div class="leaderboard-title"><i class="fa-solid fa-ranking-star"></i> Live Standings</div>
                  <div class="race-timer">
                    <i class="fa-solid fa-stopwatch"></i>
                    {{ formatRaceTime(raceTimer) }}
                  </div>
                </div>
                <div class="leaderboard-entries">
                  <div v-for="(entry, idx) in xcLiveStandings.slice(0, 15)" :key="entry.athleteId" :class="['leaderboard-entry', { 'leader': idx === 0 && entry.started, 'finished': entry.finished, 'not-started': !entry.started }]">
                    <span class="entry-rank" :class="{ 'gold': idx === 0 && entry.started, 'silver': idx === 1 && entry.started, 'bronze': idx === 2 && entry.started }">{{ entry.started ? idx + 1 : '-' }}</span>
                    <img :src="`/flags/${entry.country}.png`" class="entry-flag" onerror="this.style.display='none'" />
                    <span class="entry-name">{{ entry.lastName }}</span>
                    <div class="entry-status">
                      <span v-if="entry.finished" class="entry-time finished">
                        <i class="fa-solid fa-flag-checkered"></i>
                        {{ formatRaceTime(entry.totalTime) }}
                        <span v-if="entry.interval > 0" class="interval-gap">+{{ entry.interval.toFixed(1) }}s</span>
                      </span>
                      <span v-else-if="!entry.started" class="entry-gap waiting">
                        <i class="fa-solid fa-hourglass-start"></i>
                        Starts +{{ formatStartGap(entry.startGap) }}
                      </span>
                      <span v-else-if="idx === 0" class="entry-gap leader-tag">
                        <i class="fa-solid fa-crown"></i> Leader
                      </span>
                      <span v-else class="entry-gap racing">
                        <span class="interval-live">+{{ entry.interval?.toFixed(1) || '?' }}s</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div v-else-if="selectedEvent?.status === 'completed'" class="race-results">
            <div class="results-header completed">
              <i class="fa-solid fa-flag-checkered"></i> Competition Complete
            </div>
            <div class="results-table-container">
              <table class="results-table">
                <thead>
                  <tr>
                    <th class="col-rank">Pos</th>
                    <th>Athlete</th>
                    <th>Jump</th>
                    <th>Start Gap</th>
                    <th>XC Time</th>
                    <th>Total</th>
                    <th>WC Pts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(result, idx) in eventFinalResults" :key="result.athleteId" :class="{ podium: idx < 3 }">
                    <td class="col-rank">
                      <span v-if="idx === 0" class="medal gold">1</span>
                      <span v-else-if="idx === 1" class="medal silver">2</span>
                      <span v-else-if="idx === 2" class="medal bronze">3</span>
                      <span v-else>{{ idx + 1 }}</span>
                    </td>
                    <td>
                      <div class="result-athlete">
                        <img :src="`/flags/${result.country}.png`" class="result-flag" onerror="this.style.display='none'" />
                        <span>{{ result.lastName }}</span>
                      </div>
                    </td>
                    <td>{{ result.jump?.distance }}m ({{ result.jump?.totalPoints }} pts)</td>
                    <td>{{ result.startGap > 0 ? '+' + result.startGap.toFixed(1) + 's' : '0.0s' }}</td>
                    <td class="col-time">{{ formatRaceTime(result.skiingTime) }}</td>
                    <td class="col-time">{{ formatRaceTime(result.totalTime) }}</td>
                    <td class="col-pts">{{ result.wcPoints }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jump Animation Modal -->
    <div v-if="showJumpAnimation" class="jump-animation-overlay" @click.self="closeAnimation">
      <div class="jump-animation-modal">
        <!-- Header with jumper info -->
        <div class="animation-header">
          <div class="jumper-info">
            <img v-if="animatingJumper" :src="`/flags/${animatingJumper.country}.png`" class="jumper-flag" onerror="this.style.display='none'" />
            <span class="jumper-name">{{ animatingJumper?.lastName }} {{ animatingJumper?.firstName }}</span>
            <span v-if="currentJumperWCRank" class="jumper-wc-rank" :class="{ 'top-3': currentJumperWCRank <= 3, 'top-10': currentJumperWCRank > 3 && currentJumperWCRank <= 10 }">
              WC #{{ currentJumperWCRank }}
            </span>
            <span v-if="animationRank" class="jumper-rank" :class="{ 'top-3': animationRank <= 3 }">
              Jump #{{ animationRank }}
            </span>
          </div>
          <button @click="closeAnimation" class="close-animation-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Animation content -->
        <div class="animation-content">
          <!-- SVG Animation -->
          <div class="animation-svg-wrapper">
            <div class="animation-svg-container">
              <svg viewBox="0 0 600 280" class="ski-jump-svg">
                <defs>
                  <linearGradient id="skyGradientNC" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#87CEEB" />
                    <stop offset="100%" style="stop-color:#E0F4FF" />
                  </linearGradient>
                </defs>

                <!-- Sky background -->
                <rect x="0" y="0" width="600" height="280" fill="url(#skyGradientNC)" />

                <!-- Tower structure -->
                <rect x="30" y="30" width="30" height="25" fill="#718096" />
                <path d="M 35 55 L 85 140 L 105 175" fill="none" stroke="#4a5568" stroke-width="3" />

                <!-- In-run track (snow) -->
                <path d="M 38 55 L 88 140 L 108 175" fill="none" stroke="#fff" stroke-width="10" />

                <!-- Take-off table -->
                <path d="M 105 175 L 125 168 L 128 172" fill="#4a5568" />

                <!-- Landing hill -->
                <path d="M 128 172 Q 250 200 380 245 Q 500 270 600 278"
                      fill="none" stroke="#E8E8E8" stroke-width="30" />
                <path d="M 128 172 Q 250 200 380 245 Q 500 270 600 278"
                      fill="none" stroke="#FFFFFF" stroke-width="26" />

                <!-- K-point line -->
                <line :x1="kPointX" y1="160" :x2="kPointX" y2="265" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" />
                <text :x="kPointX" y="155" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="bold">K{{ selectedEvent?.k_point }}</text>

                <!-- Distance markers -->
                <g v-for="marker in distanceMarkers" :key="marker.distance">
                  <line :x1="marker.x" :y1="marker.y - 3" :x2="marker.x" :y2="marker.y + 3" stroke="#666" stroke-width="1" />
                  <text :x="marker.x" :y="marker.y - 8" text-anchor="middle" fill="#666" font-size="8">{{ marker.distance }}</text>
                </g>

                <!-- Animated jumper dot -->
                <circle
                  class="jumper-dot"
                  :class="{ 'landed': animationPhase === 'landed' }"
                  :cx="jumperPosition.x"
                  :cy="jumperPosition.y"
                  r="6"
                  fill="#3b82f6"
                />

                <!-- Trail effect -->
                <circle
                  v-if="animationPhase === 'flight' || animationPhase === 'landing'"
                  :cx="jumperPosition.x - 12"
                  :cy="jumperPosition.y - 4"
                  r="3"
                  fill="#3b82f6"
                  opacity="0.3"
                />
              </svg>
            </div>

            <!-- Distance display below SVG -->
            <div class="distance-bar" :class="{ 'visible': animationResult }">
              <span class="dist-num">{{ animationResult?.distance || '---' }}<span class="dist-unit">m</span></span>
              <span class="dist-pts">{{ animationResult?.totalPoints?.toFixed(1) }} pts</span>
            </div>
          </div>

          <!-- Results panel -->
          <div class="results-panel" :class="{ 'visible': nearbyRankings.length > 0 || animationRank }">
            <div class="panel-title">
              Standings
              <span v-if="remainingJumpersCount > 0" class="remaining-count">{{ remainingJumpersCount }} remaining</span>
            </div>
            <div class="leaderboard-list">
              <div
                v-for="entry in nearbyRankings"
                :key="entry.athleteId"
                class="leaderboard-row"
                :class="{
                  'current-jumper': entry.athleteId === animatingJumper?.athleteId,
                  'podium': entry.liveRank <= 3
                }"
              >
                <span class="lb-rank" :class="getRankClass(entry.liveRank)">{{ entry.liveRank }}</span>
                <img :src="`/flags/${entry.country}.png`" class="lb-flag" onerror="this.style.display='none'" />
                <span class="lb-name">{{ entry.lastName }}</span>
                <span class="lb-points">{{ entry.totalPoints?.toFixed(1) }}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="panel-actions" :class="{ 'visible': animationPhase === 'landed' }">
              <button
                v-if="hasNextJumper"
                @click="animateNextJumper"
                class="btn btn-next-jumper"
                :disabled="animating"
              >
                <i class="fa-solid fa-forward"></i>
                Next
              </button>
              <button @click="closeAnimation" class="btn btn-close-animation">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Athlete Modal -->
    <div v-if="showAthleteModal" class="modal-overlay" @click.self="closeAthleteModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Add Athlete' }}</h2>
          <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>First Name</label>
            <input v-model="athleteForm.firstName" type="text" placeholder="First name" />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input v-model="athleteForm.lastName" type="text" placeholder="Last name" />
          </div>
          <div class="form-group">
            <label>Country</label>
            <select v-model="athleteForm.country">
              <option value="">Select country</option>
              <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Team</label>
            <select v-model="athleteForm.teamId">
              <option value="">No Team</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
            </select>
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
              <label>Jumping <span class="skill-value">{{ athleteForm.skillJumping }}</span></label>
              <input v-model.number="athleteForm.skillJumping" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Flight <span class="skill-value">{{ athleteForm.skillFlight }}</span></label>
              <input v-model.number="athleteForm.skillFlight" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Landing <span class="skill-value">{{ athleteForm.skillLanding }}</span></label>
              <input v-model.number="athleteForm.skillLanding" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="form-row skills-row">
            <div class="form-group">
              <label>Skiing <span class="skill-value">{{ athleteForm.skillSkiing }}</span></label>
              <input v-model.number="athleteForm.skillSkiing" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Endurance <span class="skill-value">{{ athleteForm.skillEndurance }}</span></label>
              <input v-model.number="athleteForm.skillEndurance" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Form <span class="skill-value">{{ athleteForm.form }}</span></label>
              <input v-model.number="athleteForm.form" type="range" min="50" max="99" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAthleteModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveAthlete" class="btn btn-primary" :disabled="savingAthlete">
            {{ savingAthlete ? 'Saving...' : (editingAthlete ? 'Save Changes' : 'Add Athlete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Competitor Modal -->
    <div v-if="showCompetitorModal" class="competitor-modal-overlay" @click.self="showCompetitorModal = false">
      <div class="competitor-modal">
        <div class="competitor-modal-header">
          <div class="competitor-info">
            <img :src="`/flags/${selectedCompetitor?.country}.png`" class="competitor-flag" onerror="this.style.display='none'" />
            <div class="competitor-details">
              <h3>{{ selectedCompetitor?.lastName }} {{ selectedCompetitor?.firstName }}</h3>
              <span class="competitor-standing">{{ selectedCompetitor?.points }} pts - {{ selectedCompetitor?.races }} races</span>
            </div>
          </div>
          <button @click="showCompetitorModal = false" class="close-modal-btn"><i class="fa-solid fa-times"></i></button>
        </div>
        <div class="competitor-modal-content">
          <h4 class="results-title">Season Results</h4>
          <div class="competitor-results-list">
            <div v-for="result in competitorSeasonResults" :key="result.eventId" :class="['result-row', { podium: result.position <= 3 }]">
              <div class="result-event">
                <span class="result-location">{{ result.location }}</span>
                <span class="result-type">{{ result.hillSize === 'large' ? 'LH' : 'NH' }}</span>
              </div>
              <div class="result-position">
                <span v-if="result.position === 1" class="medal gold">1</span>
                <span v-else-if="result.position === 2" class="medal silver">2</span>
                <span v-else-if="result.position === 3" class="medal bronze">3</span>
                <span v-else class="position">{{ result.position }}</span>
              </div>
              <div class="result-points">{{ result.wcPoints }} pts</div>
            </div>
            <div v-if="competitorSeasonResults.length === 0" class="no-results">
              No results yet this season
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmations -->
    <div v-if="showDeleteAthleteConfirm" class="modal-overlay" @click.self="showDeleteAthleteConfirm = false">
      <div class="modal modal-sm">
        <div class="modal-header"><h2>Delete Athlete</h2></div>
        <div class="modal-body">
          <p class="delete-warning">Are you sure you want to delete {{ athleteToDelete?.first_name }} {{ athleteToDelete?.last_name }}?</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAthleteConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="deleteAthlete" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteAllAthletesConfirm" class="modal-overlay" @click.self="showDeleteAllAthletesConfirm = false">
      <div class="modal modal-sm">
        <div class="modal-header"><h2>Delete All Athletes</h2></div>
        <div class="modal-body">
          <p class="delete-warning">Are you sure you want to delete all {{ athletes.length }} athletes? This cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAllAthletesConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="deleteAllAthletes" class="btn btn-danger">Delete All</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteSeasonConfirm" class="modal-overlay" @click.self="showDeleteSeasonConfirm = false">
      <div class="modal modal-sm">
        <div class="modal-header"><h2>Delete Season</h2></div>
        <div class="modal-body">
          <p class="delete-warning">Are you sure you want to delete this season? All events and results will be lost.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteSeasonConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="deleteSeason" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, api } from '../stores/auth'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)
const world = ref(null)
const activeTab = ref('season')
const standingsView = ref('overall')
const teams = computed(() => teamsStore.teams)
const teamStandings = computed(() => teamsStore.teamStandings)

// Athletes
const athletes = ref([])
const loadingAthletes = ref(false)
const generating = ref(false)
const showAthleteModal = ref(false)
const editingAthlete = ref(null)
const savingAthlete = ref(false)
const showDeleteAthleteConfirm = ref(false)
const athleteToDelete = ref(null)
const showDeleteAllAthletesConfirm = ref(false)

const athleteForm = ref({
  firstName: '',
  lastName: '',
  country: '',
  teamId: '',
  skillJumping: 70,
  skillFlight: 70,
  skillLanding: 70,
  skillSkiing: 70,
  skillEndurance: 70,
  form: 70
})

// Season
const currentSeason = ref(null)
const seasonEvents = ref([])
const seasonStandings = ref([])
const newSeasonYearStart = ref(new Date().getFullYear())
const newSeasonYearEnd = ref(new Date().getFullYear() + 1)
const creatingSeasonLoading = ref(false)
const showDeleteSeasonConfirm = ref(false)

// Race Modal
const showRaceModal = ref(false)
const selectedEvent = ref(null)
const simulating = ref(false)
const animating = ref(false)
const raceInProgress = ref(false)
const currentPhase = ref('jumping') // 'jumping' or 'xc'
const currentRaceStatus = ref('')
const raceTimer = ref(0)

// Jump phase state
const jumpingStarted = ref(false)
const pendingJumpers = ref([])
const completedJumpers = ref([])
const allJumpResults = ref([])

// Jump animation
const currentJumperIndex = ref(0)
const currentJumper = ref(null)
const currentJumpResult = ref(null)
const jumpStandingsPreview = ref([])
const jumperPosition = ref({ x: 45, y: 55 })

// Jump animation modal
const showJumpAnimation = ref(false)
const animatingJumper = ref(null)
const animationPhase = ref('waiting')
const animationResult = ref(null)
const animationRank = ref(null)

// Current jumper's WC ranking
const currentJumperWCRank = computed(() => {
  if (!animatingJumper.value) return null
  const athleteId = animatingJumper.value.athleteId
  const index = seasonStandings.value.findIndex(s => s.athleteId === athleteId)
  return index >= 0 ? index + 1 : null
})

// XC phase state
const xcStarted = ref(false)

// Computed for phase completion
const isJumpingComplete = computed(() => jumpingStarted.value && pendingJumpers.value.length === 0)
const isXCComplete = computed(() => xcStarted.value && xcAnimatedAthletes.value.every(a => a.finished))

// Pursuit start order (sorted by start gap - leader first)
const pursuitStartOrder = computed(() => {
  return [...allJumpResults.value].sort((a, b) => a.startGap - b.startGap)
})

// XC animation
const xcAnimatedAthletes = ref([])
const xcLiveStandings = ref([])
const animationInterval = ref(null)

// Results
const eventFinalResults = ref([])

// Competitor Modal
const showCompetitorModal = ref(false)
const selectedCompetitor = ref(null)

// Countries list (IOC codes)
const countries = [
  { code: 'NOR', name: 'Norway' },
  { code: 'GER', name: 'Germany' },
  { code: 'AUT', name: 'Austria' },
  { code: 'JPN', name: 'Japan' },
  { code: 'FIN', name: 'Finland' },
  { code: 'FRA', name: 'France' },
  { code: 'USA', name: 'United States' },
  { code: 'EST', name: 'Estonia' },
  { code: 'ITA', name: 'Italy' },
  { code: 'POL', name: 'Poland' },
  { code: 'CZE', name: 'Czech Republic' },
  { code: 'SLO', name: 'Slovenia' },
  { code: 'SUI', name: 'Switzerland' }
]

const completedEventsCount = computed(() => seasonEvents.value.filter(e => e.status === 'completed').length)
const nextEvent = computed(() => seasonEvents.value.find(e => e.status !== 'completed'))

const competitorSeasonResults = computed(() => {
  if (!selectedCompetitor.value) return []
  const athleteId = selectedCompetitor.value.athleteId
  const results = []
  for (const event of seasonEvents.value) {
    if (event.status !== 'completed') continue
    let finalResults = []
    try { finalResults = JSON.parse(event.final_results || '[]') } catch (e) {}
    const entry = finalResults.find(r => r.athleteId === athleteId)
    if (entry) {
      results.push({
        eventId: event.id,
        location: event.location,
        hillSize: event.hill_size,
        date: event.date,
        position: entry.position,
        wcPoints: entry.wcPoints || 0
      })
    }
  }
  return results
})

onMounted(async () => {
  await loadWorld()
  await Promise.all([
    loadAthletes(),
    loadSeason(),
    weekStatusStore.fetchWeekStatus(worldId.value)
  ])
  try {
    const res = await api.get(`/teams/world/${worldId.value}?sport=nordiccombined`)
    teams.value = res.data
  } catch (error) {
    console.error('Error loading teams:', error)
  }
})

async function loadWorld() {
  try {
    const res = await api.get(`/worlds/${worldId.value}`)
    world.value = res.data
  } catch (error) {
    console.error('Error loading world:', error)
    router.push('/dashboard')
  }
}

async function loadAthletes() {
  loadingAthletes.value = true
  try {
    const res = await api.get(`/nordic-combined/world/${worldId.value}/athletes`)
    athletes.value = res.data
  } catch (error) {
    console.error('Error loading athletes:', error)
  } finally {
    loadingAthletes.value = false
  }
}

async function loadSeason() {
  try {
    const res = await api.get(`/nordic-combined/world/${worldId.value}/current-season`)
    if (res.data) {
      currentSeason.value = res.data
      seasonEvents.value = res.data.events || []
      seasonStandings.value = res.data.standings || []
    } else {
      currentSeason.value = null
      seasonEvents.value = []
      seasonStandings.value = []
    }
  } catch (error) {
    console.error('Error loading season:', error)
  }
}

async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'nordiccombined')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleGenerateAthletes() {
  generating.value = true
  try {
    await api.post(`/nordic-combined/world/${worldId.value}/generate-athletes`, { count: 30 })
    await loadAthletes()
  } catch (error) {
    console.error('Error generating athletes:', error)
  } finally {
    generating.value = false
  }
}

function openAddAthleteModal() {
  editingAthlete.value = null
  athleteForm.value = { firstName: '', lastName: '', country: '', teamId: '', skillJumping: 70, skillFlight: 70, skillLanding: 70, skillSkiing: 70, skillEndurance: 70, form: 70 }
  showAthleteModal.value = true
}

function editAthlete(athlete) {
  editingAthlete.value = athlete
  athleteForm.value = {
    firstName: athlete.first_name,
    lastName: athlete.last_name,
    country: athlete.country,
    teamId: athlete.team_id || '',
    skillJumping: athlete.skill_jumping,
    skillFlight: athlete.skill_flight,
    skillLanding: athlete.skill_landing,
    skillSkiing: athlete.skill_skiing,
    skillEndurance: athlete.skill_endurance,
    form: athlete.form
  }
  showAthleteModal.value = true
}

function closeAthleteModal() {
  showAthleteModal.value = false
  editingAthlete.value = null
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
  athleteForm.value.skillJumping = randomInRange()
  athleteForm.value.skillFlight = randomInRange()
  athleteForm.value.skillLanding = randomInRange()
  athleteForm.value.skillSkiing = randomInRange()
  athleteForm.value.skillEndurance = randomInRange()
  athleteForm.value.form = randomInRange()
}

async function saveAthlete() {
  savingAthlete.value = true
  try {
    if (editingAthlete.value) {
      await api.put(`/nordic-combined/athletes/${editingAthlete.value.id}`, athleteForm.value)
    } else {
      await api.post(`/nordic-combined/world/${worldId.value}/athletes`, athleteForm.value)
    }
    await loadAthletes()
    closeAthleteModal()
  } catch (error) {
    console.error('Error saving athlete:', error)
  } finally {
    savingAthlete.value = false
  }
}

function confirmDeleteAthlete(athlete) {
  athleteToDelete.value = athlete
  showDeleteAthleteConfirm.value = true
}

async function deleteAthlete() {
  try {
    await api.delete(`/nordic-combined/athletes/${athleteToDelete.value.id}`)
    await loadAthletes()
    showDeleteAthleteConfirm.value = false
    athleteToDelete.value = null
  } catch (error) {
    console.error('Error deleting athlete:', error)
  }
}

async function deleteAllAthletes() {
  try {
    for (const athlete of athletes.value) {
      await api.delete(`/nordic-combined/athletes/${athlete.id}`)
    }
    await loadAthletes()
    showDeleteAllAthletesConfirm.value = false
  } catch (error) {
    console.error('Error deleting athletes:', error)
  }
}

async function createSeason() {
  creatingSeasonLoading.value = true
  try {
    await api.post(`/nordic-combined/world/${worldId.value}/seasons`, {
      yearStart: newSeasonYearStart.value,
      yearEnd: newSeasonYearEnd.value
    })
    await loadSeason()
  } catch (error) {
    console.error('Error creating season:', error)
  } finally {
    creatingSeasonLoading.value = false
  }
}

async function deleteSeason() {
  try {
    await api.delete(`/nordic-combined/seasons/${currentSeason.value.id}`)
    await loadSeason()
    showDeleteSeasonConfirm.value = false
  } catch (error) {
    console.error('Error deleting season:', error)
  }
}

function openRaceModal(event) {
  // Check if event is locked
  if (weekStatusStore.isEventLocked(event.date)) {
    alert(`This event is locked. Complete all events in ${weekStatusStore.formattedWeek} first.`)
    return
  }
  selectedEvent.value = event
  raceInProgress.value = false
  currentPhase.value = 'jumping'
  eventFinalResults.value = []
  jumpingStarted.value = false
  pendingJumpers.value = []
  completedJumpers.value = []
  allJumpResults.value = []
  xcStarted.value = false
  xcAnimatedAthletes.value = []
  xcLiveStandings.value = []

  if (event.status === 'completed') {
    try { eventFinalResults.value = JSON.parse(event.final_results || '[]') } catch (e) {}
  }
  showRaceModal.value = true
}

function closeRaceModal() {
  showRaceModal.value = false
  if (animationInterval.value) {
    clearInterval(animationInterval.value)
    animationInterval.value = null
  }
  raceInProgress.value = false
  jumpingStarted.value = false
  xcStarted.value = false
  loadSeason()
}

// Start jumping phase - prepare start list
function startJumpingPhase() {
  jumpingStarted.value = true
  raceInProgress.value = true

  // Create standings map for WC ranking lookup
  const standingsMap = new Map()
  seasonStandings.value.forEach((s, idx) => {
    standingsMap.set(s.athleteId, { rank: idx + 1, points: s.totalPoints || 0 })
  })

  // Create start list with WC ranking
  const athleteList = [...athletes.value].map(a => {
    const standing = standingsMap.get(a.id)
    return {
      athleteId: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      country: a.country,
      wcRank: standing?.rank || 999, // Unranked athletes get 999
      wcPoints: standing?.points || 0,
      ...a
    }
  })

  // Sort by WC ranking - REVERSE ORDER (worst/unranked first, best last)
  // In real Nordic Combined, the leader jumps last
  athleteList.sort((a, b) => b.wcRank - a.wcRank)

  // Assign bib numbers based on start order
  athleteList.forEach((a, idx) => a.bibNumber = idx + 1)

  pendingJumpers.value = athleteList
  completedJumpers.value = []
}

// Simulate next jumper with animation
async function simulateNextJumper() {
  if (pendingJumpers.value.length === 0) return

  simulating.value = true
  const jumper = pendingJumpers.value.shift()

  try {
    await startJumpAnimation(jumper)
  } catch (error) {
    console.error('Error simulating jumper:', error)
  } finally {
    simulating.value = false
  }
}

// Simulate all remaining jumpers (without animation for speed)
async function simulateAllJumpers() {
  simulating.value = true

  const kPoint = selectedEvent.value?.k_point || 98

  while (pendingJumpers.value.length > 0) {
    const jumper = pendingJumpers.value.shift()
    const jumpResult = simulateJumpLocal(jumper, kPoint)

    const completedEntry = {
      ...jumper,
      jump: jumpResult,
      justJumped: false
    }

    completedJumpers.value.push(completedEntry)
  }

  // Sort by points
  completedJumpers.value.sort((a, b) => b.jump.totalPoints - a.jump.totalPoints)

  // Calculate start gaps
  const leaderPoints = completedJumpers.value[0].jump.totalPoints
  completedJumpers.value.forEach((entry, idx) => {
    const pointsDiff = leaderPoints - entry.jump.totalPoints
    entry.startGap = pointsDiff / 4 // 1 point = 4 seconds
  })

  // Store for XC phase
  allJumpResults.value = [...completedJumpers.value]

  simulating.value = false
}

// Local jump simulation (matches backend logic)
function simulateJumpLocal(athlete, kPoint) {
  const jumping = athlete.skill_jumping || 70
  const flight = athlete.skill_flight || 70
  const landing = athlete.skill_landing || 70
  const consistency = athlete.consistency || 70
  const form = athlete.form || 70

  // Base distance calculation
  const baseDistance = kPoint - 5
  const skillEffect = ((jumping - 70) / 100) * 15
  const flightEffect = ((flight - 70) / 100) * 10
  const formEffect = ((form - 70) / 100) * 5
  const consistencyMultiplier = 1.5 - (consistency / 100)
  const randomVariation = (Math.random() - 0.5) * 20 * consistencyMultiplier

  const distance = Math.round((baseDistance + skillEffect + flightEffect + formEffect + randomVariation) * 10) / 10

  // Style points (5 judges, drop highest and lowest)
  const judgeScores = []
  for (let i = 0; i < 5; i++) {
    const baseScore = 17 + ((landing - 70) / 100) * 2
    const variation = (Math.random() - 0.5) * 2
    judgeScores.push(Math.max(10, Math.min(20, baseScore + variation)))
  }
  judgeScores.sort((a, b) => a - b)
  const stylePoints = judgeScores[1] + judgeScores[2] + judgeScores[3]

  // Distance points
  const distancePoints = 60 + (distance - kPoint) * 1.8

  const totalPoints = Math.round((distancePoints + stylePoints) * 10) / 10

  return {
    distance,
    stylePoints: Math.round(stylePoints * 10) / 10,
    distancePoints: Math.round(distancePoints * 10) / 10,
    totalPoints
  }
}

// Start XC phase
function startXCPhase() {
  currentPhase.value = 'xc'
}

// Start XC race animation
async function startXCRace() {
  xcStarted.value = true
  simulating.value = true

  // Initialize athletes with their start gaps
  xcAnimatedAthletes.value = allJumpResults.value.map(result => ({
    ...result,
    x: 30,
    started: false,
    finished: false,
    skiingTime: simulateSkiingTimeLocal(result, selectedEvent.value?.xc_distance || 10),
    totalTime: 0
  }))

  xcLiveStandings.value = [...xcAnimatedAthletes.value].sort((a, b) => a.startGap - b.startGap)

  // Animate XC race
  await animateXCRace()

  // Update live standings to final sorted order before saving
  const sortedFinal = [...xcAnimatedAthletes.value]
    .filter(a => a.finished)
    .sort((a, b) => a.totalTime - b.totalTime)
  xcLiveStandings.value = sortedFinal

  // Save results to backend
  await saveEventResults()

  simulating.value = false
}

function simulateSkiingTimeLocal(athlete, distanceKm) {
  const skiing = athlete.skill_skiing || 70
  const endurance = athlete.skill_endurance || 70
  const consistency = athlete.consistency || 70
  const form = athlete.form || 70

  const baseTimePerKm = 165
  const skillEffect = (70 - skiing) * 0.7
  const enduranceEffect = (70 - endurance) * 0.3
  const formEffect = (70 - form) * 0.2
  const consistencyMultiplier = 1.5 - (consistency / 100)
  const randomVariation = (Math.random() - 0.5) * 6 * consistencyMultiplier

  const timePerKm = baseTimePerKm + skillEffect + enduranceEffect + formEffect + randomVariation
  return Math.round(Math.max(150, timePerKm) * distanceKm * 10) / 10
}

async function animateXCRace() {
  const startX = 30
  const finishX = 770
  const totalTrackLength = finishX - startX
  const frameRate = 30
  let frame = 0

  const maxGap = Math.max(...xcAnimatedAthletes.value.map(a => a.startGap))
  const maxSkiTime = Math.max(...xcAnimatedAthletes.value.map(a => a.skiingTime))
  const totalRaceTime = maxGap + maxSkiTime

  // Animation timing: make starts visible by scaling
  // First 3 seconds of animation = all starts (covers maxGap)
  // Next 12 seconds = race progress
  const startPhaseDuration = Math.min(3000, maxGap > 0 ? 3000 : 500) // 3s for starts
  const racePhaseDuration = 12000 // 12s for race
  const animationDuration = startPhaseDuration + racePhaseDuration
  const totalFrames = (animationDuration / 1000) * frameRate

  await new Promise(resolve => {
    animationInterval.value = setInterval(() => {
      frame++
      const animProgress = frame / totalFrames
      const animTime = animProgress * animationDuration

      // Map animation time to race time
      let raceTime
      if (animTime <= startPhaseDuration) {
        // Start phase: map to 0 -> maxGap+30 (see all starts plus a bit of race)
        raceTime = (animTime / startPhaseDuration) * (maxGap + 30)
      } else {
        // Race phase: map remaining animation to rest of race
        const racePhaseProgress = (animTime - startPhaseDuration) / racePhaseDuration
        raceTime = (maxGap + 30) + racePhaseProgress * (totalRaceTime - maxGap - 30)
      }
      raceTimer.value = raceTime

      xcAnimatedAthletes.value.forEach(athlete => {
        const effectiveRaceTime = raceTime - athlete.startGap

        if (effectiveRaceTime >= 0 && !athlete.started) {
          athlete.started = true
        }

        if (athlete.started && !athlete.finished) {
          const skiProgress = effectiveRaceTime / athlete.skiingTime
          athlete.x = startX + (totalTrackLength * Math.min(skiProgress, 1))

          if (skiProgress >= 1) {
            athlete.finished = true
            athlete.x = finishX
            athlete.totalTime = athlete.startGap + athlete.skiingTime
          }
        }
      })

      // Update live standings - show started athletes first (sorted by position), then waiting athletes
      const startedAthletes = xcAnimatedAthletes.value
        .filter(a => a.started)
        .sort((a, b) => {
          if (a.finished && b.finished) return a.totalTime - b.totalTime
          if (a.finished) return -1
          if (b.finished) return 1
          return b.x - a.x
        })

      // Calculate intervals (gap to leader) for all athletes
      const leader = startedAthletes[0]
      const leaderX = leader?.x || 0
      const leaderFinishTime = leader?.finished ? leader.totalTime : null

      startedAthletes.forEach((a, idx) => {
        if (idx === 0) {
          a.interval = 0
        } else if (a.finished && leaderFinishTime) {
          // Both finished - show time difference
          a.interval = a.totalTime - leaderFinishTime
        } else if (!a.finished && leader) {
          // Racing athlete - calculate position-based gap
          const distanceBehind = leaderX - a.x
          const avgSpeed = totalTrackLength / a.skiingTime
          a.interval = Math.max(0, distanceBehind / avgSpeed)
        } else {
          a.interval = 0
        }
      })

      const waitingAthletes = xcAnimatedAthletes.value
        .filter(a => !a.started)
        .sort((a, b) => a.startGap - b.startGap)
      xcLiveStandings.value = [...startedAthletes, ...waitingAthletes]

      if (frame >= totalFrames || xcAnimatedAthletes.value.every(a => a.finished)) {
        clearInterval(animationInterval.value)
        animationInterval.value = null
        resolve()
      }
    }, 1000 / frameRate)
  })
}

async function saveEventResults() {
  try {
    // Prepare final results
    const finalResults = xcAnimatedAthletes.value
      .filter(a => a.finished)
      .sort((a, b) => a.totalTime - b.totalTime)
      .map((a, idx) => ({
        ...a,
        position: idx + 1,
        wcPoints: idx < 40 ? [100, 80, 60, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1][idx] || 0 : 0
      }))

    // Send to backend to save
    await api.post(`/nordic-combined/event/${selectedEvent.value.id}/simulate`, {
      jumpResults: allJumpResults.value,
      finalResults
    })

    eventFinalResults.value = finalResults
    selectedEvent.value.status = 'completed'

    await loadSeason()
    await loadTeamStandings()
  } catch (error) {
    console.error('Error saving results:', error)
  }
}

async function animateJumpingPhase(jumpResults) {
  for (let i = 0; i < jumpResults.length; i++) {
    currentJumperIndex.value = i
    currentJumper.value = jumpResults[i]
    currentJumpResult.value = null
    currentRaceStatus.value = `Jumper ${i + 1}/${jumpResults.length}`

    // Reset jumper position to start
    jumperPosition.value = { x: 50, y: 50, rotation: 45, phase: 'inrun' }

    // Animate the jump
    await animateJump(jumpResults[i].jump.distance)

    // Show result
    currentJumpResult.value = jumpResults[i].jump
    jumpStandingsPreview.value = [...jumpResults.slice(0, i + 1)].sort((a, b) => b.jump.totalPoints - a.jump.totalPoints)

    await delay(800)
  }
  await delay(500)
}

async function animateJump(distance) {
  const kPoint = selectedEvent.value?.k_point || 98
  const distanceRatio = distance / kPoint

  // Phase 1: In-run (slide down the ramp)
  const inrunFrames = 20
  for (let f = 0; f < inrunFrames; f++) {
    const progress = f / inrunFrames
    jumperPosition.value = {
      x: 50 + progress * 135,
      y: 50 + progress * 147,
      rotation: 45,
      phase: 'inrun'
    }
    await delay(30)
  }

  // Phase 2: Take-off
  jumperPosition.value = { x: 195, y: 205, rotation: 25, phase: 'takeoff' }
  await delay(100)

  // Phase 3: Flight
  const flightFrames = 30
  for (let f = 0; f < flightFrames; f++) {
    const progress = f / flightFrames
    // Calculate landing position based on distance
    const landingX = 205 + (distanceRatio * 200 * progress)
    const landingY = 210 + (progress * progress * 80) // Parabolic arc
    const rotation = 25 - (progress * 40) // Rotate forward during flight

    jumperPosition.value = {
      x: landingX,
      y: landingY,
      rotation: rotation,
      phase: 'flight'
    }
    await delay(40)
  }

  // Phase 4: Landing
  const finalX = 205 + (distanceRatio * 200)
  const finalY = 210 + 80
  jumperPosition.value = { x: finalX, y: finalY, rotation: -15, phase: 'landing' }
  await delay(200)
}

async function animateXCPhase(finalResults) {
  // Initialize athletes at their start positions based on time gaps
  const maxGap = Math.max(...finalResults.map(r => r.startGap || 0))
  xcAnimatedAthletes.value = finalResults.map(result => ({
    ...result,
    x: 50, // Start position
    currentTime: 0,
    started: result.startGap === 0,
    finished: false
  }))

  xcLiveStandings.value = [...xcAnimatedAthletes.value].sort((a, b) => a.startGap - b.startGap)

  const startX = 50
  const finishX = 760
  const totalTrackLength = finishX - startX
  const animationDuration = 8000 // 8 seconds animation
  const frameRate = 30
  const totalFrames = (animationDuration / 1000) * frameRate
  let frame = 0

  await new Promise(resolve => {
    animationInterval.value = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      raceTimer.value = progress * (maxGap + 1800) // Simulated race time

      xcAnimatedAthletes.value.forEach((athlete, idx) => {
        // Start athletes based on their gap
        const effectiveProgress = Math.max(0, (progress * (maxGap + 1800) - athlete.startGap) / 1800)

        if (effectiveProgress > 0 && !athlete.started) {
          athlete.started = true
        }

        if (athlete.started && !athlete.finished) {
          // Calculate position - faster finishers should be ahead
          const speedFactor = 1 - (athlete.position - 1) * 0.01 // Slightly faster for better positions
          athlete.x = startX + (totalTrackLength * Math.min(effectiveProgress * speedFactor, 1))

          if (effectiveProgress >= 1 / speedFactor) {
            athlete.finished = true
            athlete.x = finishX
          }
        }
      })

      // Update live standings - show started athletes first, then waiting athletes
      const startedAth = xcAnimatedAthletes.value
        .filter(a => a.started)
        .sort((a, b) => {
          if (a.finished && b.finished) return a.totalTime - b.totalTime
          if (a.finished) return -1
          if (b.finished) return 1
          return b.x - a.x // Who's ahead on track
        })
      const waitingAth = xcAnimatedAthletes.value
        .filter(a => !a.started)
        .sort((a, b) => a.startGap - b.startGap)
      xcLiveStandings.value = [...startedAth, ...waitingAth]

      if (frame >= totalFrames) {
        clearInterval(animationInterval.value)
        animationInterval.value = null
        resolve()
      }
    }, 1000 / frameRate)
  })
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Jump animation functions
async function startJumpAnimation(jumper) {
  animatingJumper.value = jumper
  animationPhase.value = 'waiting'
  animationResult.value = null
  animationRank.value = null
  animating.value = true
  showJumpAnimation.value = true

  // Reset position to start
  jumperPosition.value = { x: 45, y: 55 }

  await delay(500)

  // Phase 1: In-run - skier accelerating down the ramp
  animationPhase.value = 'inrun'
  await animateToPosition({ x: 105, y: 175 }, 1200)

  // Phase 2: Take-off - moment of leaving the ramp
  animationPhase.value = 'takeoff'
  await animateToPosition({ x: 128, y: 160 }, 400)

  // Phase 3: Flight - simulate the jump
  animationPhase.value = 'flight'
  const kPoint = selectedEvent.value?.k_point || 98
  const jumpResult = simulateJumpLocal(jumper, kPoint)

  animationResult.value = jumpResult

  // Animate to landing position - longer flight time for realism
  const landingPos = getLandingPosition(jumpResult.distance)
  await animateToPosition(landingPos, 1800)

  // Phase 4: Landing - showing the telemark
  animationPhase.value = 'landing'
  await delay(600)

  // Phase 5: Landed - update results
  animationPhase.value = 'landed'

  // Add to completed jumpers
  const completedEntry = {
    ...jumper,
    jump: jumpResult,
    justJumped: true
  }

  // Clear previous highlight
  completedJumpers.value.forEach(j => j.justJumped = false)

  // Add and sort by points
  completedJumpers.value.push(completedEntry)
  completedJumpers.value.sort((a, b) => b.jump.totalPoints - a.jump.totalPoints)

  // Calculate start gaps
  const leaderPoints = completedJumpers.value[0].jump.totalPoints
  completedJumpers.value.forEach((entry, idx) => {
    const pointsDiff = leaderPoints - entry.jump.totalPoints
    entry.startGap = pointsDiff / 4 // 1 point = 4 seconds
  })

  // Set animation rank
  animationRank.value = completedJumpers.value.findIndex(j => j.athleteId === jumper.athleteId) + 1

  // Store for XC phase
  allJumpResults.value = [...completedJumpers.value]

  animating.value = false
}

function getLandingPosition(distance) {
  const kPoint = selectedEvent.value?.k_point || 98
  const baseX = 128
  const baseY = 160
  const distanceRatio = distance / kPoint
  const x = baseX + (distanceRatio * 350)
  const y = baseY + (distanceRatio * 80) + 20
  return { x: Math.min(x, 550), y: Math.min(y, 260) }
}

async function animateToPosition(target, duration) {
  const start = { ...jumperPosition.value }
  const startTime = Date.now()

  return new Promise(resolve => {
    function step() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      jumperPosition.value = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased
      }

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(step)
  })
}

function closeAnimation() {
  showJumpAnimation.value = false
  animatingJumper.value = null
  animationPhase.value = 'waiting'
  animationResult.value = null
  animationRank.value = null
  animating.value = false
}

async function animateNextJumper() {
  if (pendingJumpers.value.length === 0) {
    closeAnimation()
    return
  }

  const jumper = pendingJumpers.value.shift()
  await startJumpAnimation(jumper)
}

// Computed for animation
const kPointX = computed(() => {
  const kPoint = selectedEvent.value?.k_point || 98
  return 128 + (1.0 * 350) // x position of K-point line
})

const distanceMarkers = computed(() => {
  const kPoint = selectedEvent.value?.k_point || 98
  const markers = []
  for (let d = kPoint - 20; d <= kPoint + 30; d += 10) {
    const pos = getLandingPosition(d)
    markers.push({ distance: d, x: pos.x, y: pos.y })
  }
  return markers
})

const nearbyRankings = computed(() => {
  if (!animatingJumper.value || completedJumpers.value.length === 0) return []
  // Show all completed jumpers sorted by points
  return completedJumpers.value.slice(0, 15).map((j, idx) => ({
    ...j,
    liveRank: idx + 1,
    totalPoints: j.jump?.totalPoints
  }))
})

const hasNextJumper = computed(() => pendingJumpers.value.length > 0)

const remainingJumpersCount = computed(() => pendingJumpers.value.length)

function getRankClass(rank) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

// Team functions
function openCompetitorModal(standing) {
  selectedCompetitor.value = standing
  showCompetitorModal.value = true
}

// Helpers
function getSkillClass(value) {
  if (value >= 90) return 'skill-elite'
  if (value >= 80) return 'skill-high'
  if (value >= 70) return 'skill-good'
  if (value >= 60) return 'skill-average'
  return 'skill-low'
}

function getOverall(athlete) {
  const skills = [athlete.skill_jumping, athlete.skill_flight, athlete.skill_landing, athlete.skill_skiing, athlete.skill_endurance]
  return Math.round(skills.reduce((a, b) => a + b, 0) / skills.length)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRaceTime(seconds) {
  if (!seconds) return '0:00.0'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`
}

function formatStartGap(seconds) {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getEventPodium(event) {
  try {
    const results = JSON.parse(event.final_results || '[]')
    return results.slice(0, 3)
  } catch (e) {
    return []
  }
}

function getAthleteColor(idx) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  return colors[idx % colors.length]
}

function getTrackY(x) {
  // Calculate Y position along the curved track path
  // Track: M 30 160 Q 150 140, 300 160 Q 450 180, 600 155 Q 700 140, 770 160
  const progress = (x - 30) / 740 // 0 to 1
  if (progress < 0.36) {
    // First curve: dips down then up
    const t = progress / 0.36
    return 160 + Math.sin(t * Math.PI) * -20
  } else if (progress < 0.77) {
    // Second curve: rises then falls
    const t = (progress - 0.36) / 0.41
    return 160 + Math.sin(t * Math.PI) * 20
  } else {
    // Third curve: dips then rises
    const t = (progress - 0.77) / 0.23
    return 155 + Math.sin(t * Math.PI) * -15 + 5
  }
}

function goBack() {
  router.push(`/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* Alias classes for backward compatibility */
.athletes-table-container { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow-x: auto; }
.athletes-table { width: 100%; border-collapse: collapse; }
.athletes-table th, .athletes-table td { padding: 0.875rem 1rem; text-align: left; }
.athletes-table th { background: #f8fafc; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; }
.athletes-table tbody tr { border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s; }
.athletes-table tbody tr:hover { background: var(--primary-50); }
.athletes-table tbody tr:last-child { border-bottom: none; }

/* NC Icon accent */
.nc-icon { color: #3b82f6; }
.breadcrumb { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
.world-name, .sport-name { display: flex; align-items: center; gap: 0.5rem; }
.world-name { color: #64748b; }
.world-name i, .sport-name i { color: #3b82f6; }
.separator { color: #cbd5e1; font-size: 0.7rem; }
.sport-name { color: #3b82f6; font-weight: 500; }
.nc-icon { color: #3b82f6; }

/* Navigation */
.main-nav { background: white; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0; }
.nav-tabs { display: flex; gap: 0.5rem; }
.nav-tab { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: transparent; border: none; border-radius: 0.5rem; color: #64748b; cursor: pointer; transition: all 0.2s; }
.nav-tab:hover { background: #f1f5f9; color: #1e293b; }
.nav-tab.active { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
.nav-tab.active .nav-tab-icon { color: white; background: rgba(255, 255, 255, 0.2); }
.nav-tab.active .nav-tab-label { color: white; }
.nav-tab.active .nav-tab-count, .nav-tab.active .nav-tab-badge { background: rgba(255, 255, 255, 0.2); color: white; }
.nav-tab.active .nav-tab-leader { color: rgba(255, 255, 255, 0.9); }
.nav-tab-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border-radius: 0.5rem; color: #3b82f6; font-size: 1rem; transition: all 0.2s; }
.nav-tab-content { display: flex; flex-direction: column; align-items: flex-start; gap: 0.125rem; }
.nav-tab-label { font-weight: 600; color: #1e293b; font-size: 0.875rem; transition: color 0.2s; }
.nav-tab-count { font-size: 0.7rem; font-weight: 500; color: #64748b; background: #f1f5f9; padding: 0.125rem 0.4rem; border-radius: 1rem; transition: all 0.2s; }
.nav-tab-badge { font-size: 0.7rem; font-weight: 500; color: #22c55e; display: flex; align-items: center; gap: 0.25rem; }
.nav-tab-badge i { font-size: 0.4rem; }
.nav-tab-leader { font-size: 0.7rem; font-weight: 500; color: #94a3b8; display: flex; align-items: center; gap: 0.35rem; }
.leader-flag { width: 16px; height: 11px; object-fit: cover; border-radius: 2px; }

/* Main Content */
.page-main { padding: 2rem 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
.tab-content { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Flag Styles */
.flag { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; }

/* Section Header */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.section-title { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 600; color: #1e293b; margin: 0; }
.section-title i { color: #3b82f6; }
.section-title .count { font-weight: 400; color: #64748b; }
.actions { display: flex; gap: 0.5rem; }

/* Loading / Empty States */
.loading-state, .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.loading-state i { font-size: 2rem; color: var(--primary-500); display: block; margin-bottom: 1rem; }
.empty-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary-100), var(--primary-200)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
.empty-icon i { font-size: 2rem; color: var(--primary-500); }
.empty-state h3 { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
.empty-state p { color: #64748b; margin-bottom: 1.5rem; }
.empty-state-actions { display: flex; gap: 0.75rem; justify-content: center; }

/* Athletes Table */
.athletes-table-container { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow-x: auto; }
.athletes-table { width: 100%; border-collapse: collapse; }
.athletes-table th, .athletes-table td { padding: 0.875rem 1rem; text-align: left; }
.athletes-table th { background: #f8fafc; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; }
.athletes-table tbody tr { border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s; }
.athletes-table tbody tr:hover { background: var(--primary-50); }
.athletes-table tbody tr:last-child { border-bottom: none; }
.athlete-flag { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
.col-name { min-width: 150px; }
.athlete-name { font-weight: 600; color: #1e293b; }
.athlete-firstname { font-size: 0.75rem; color: #64748b; margin-left: 0.5rem; }
.col-skill span { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; }
.skill-elite { background: var(--success-100); color: var(--success-700); }
.skill-high { background: var(--primary-100); color: var(--primary-700); }
.skill-good { background: var(--gray-100); color: #475569; }
.skill-average { background: var(--warning-100); color: var(--warning-700); }
.skill-low { background: var(--danger-100); color: var(--danger-700); }
.overall { font-weight: 700; }

/* Season */
.no-season-panel { background: white; border-radius: 1rem; padding: 3rem; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.no-season-content i { font-size: 3rem; color: var(--primary-500); margin-bottom: 1rem; }
.no-season-content h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
.season-form { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1.5rem; }
.year-inputs { display: flex; align-items: center; gap: 0.5rem; }
.year-inputs input { width: 100px; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 0.375rem; text-align: center; }

.season-header-card { display: flex; justify-content: space-between; align-items: center; background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1.5rem; }
.season-info h2 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; }
.season-info h2 i { color: var(--warning); }
.season-progress { display: flex; flex-direction: column; gap: 0.5rem; }
.progress-text { font-size: 0.875rem; color: #94a3b8; }
.progress-bar { width: 300px; height: 8px; background: var(--gray-200); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary-500), var(--primary-600)); border-radius: 4px; transition: width 0.3s ease; }
.season-actions { display: flex; gap: 0.5rem; }

/* Calendar */
.calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.calendar-event { background: white; border-radius: 1rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent; }
.calendar-event:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
.calendar-event.completed { border-color: var(--success); background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.calendar-event.is-locked { opacity: 0.6; cursor: not-allowed; position: relative; }
.calendar-event.is-locked:hover { transform: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.lock-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(100, 116, 139, 0.85); border-radius: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; z-index: 10; color: white; }
.lock-overlay i { font-size: 1.5rem; }
.lock-overlay span { font-size: 0.875rem; font-weight: 600; }
.calendar-event-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.event-number-badge { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--primary-500); color: white; border-radius: 50%; font-size: 0.75rem; font-weight: 700; }
.event-type-badge { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
.event-type-badge.large { background: #dbeafe; color: #1e40af; }
.event-type-badge.normal { background: #dcfce7; color: #166534; }
.event-status-badge { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; }
.event-status-badge.scheduled { background: var(--gray-200); color: #64748b; }
.event-status-badge.completed { background: var(--success-500); color: white; }
.calendar-event-body { padding: 1rem; }
.event-location { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.event-flag-large { width: 32px; height: 21px; object-fit: cover; border-radius: 3px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
.location-details { display: flex; flex-direction: column; }
.location-name { font-weight: 600; color: #1e293b; }
.location-country { font-size: 0.75rem; color: #64748b; }
.event-date-display { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b; }
.calendar-event-podium { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.podium-item { display: flex; align-items: center; gap: 0.375rem; }
.podium-pos { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.625rem; font-weight: 700; color: white; }
.podium-pos.gold { background: #f59e0b; }
.podium-pos.silver { background: #9ca3af; }
.podium-pos.bronze { background: #d97706; }
.podium-flag-sm { width: 16px; height: 11px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
.podium-name { font-size: 0.75rem; font-weight: 500; }

/* Standings */
.standings-compact { background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
.standings-panel { padding: 1.5rem; max-height: 600px; overflow-y: auto; }
.standings-list-compact { display: flex; flex-direction: column; gap: 0.5rem; }
.standing-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; transition: background 0.2s; cursor: pointer; }
.standing-row:hover { background: #f8fafc; }
.standing-row.top-3 { background: var(--primary-50); }
.standing-rank { width: 32px; text-align: center; }
.medal { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: white; }
.medal.gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
.medal.silver { background: linear-gradient(135deg, #9ca3af, #6b7280); }
.medal.bronze { background: linear-gradient(135deg, #d97706, #b45309); }
.rank-num { font-weight: 600; color: #64748b; }
.standing-flag-sm { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
.standing-info { flex: 1; display: flex; align-items: baseline; gap: 0.5rem; }
.standing-name-compact { font-weight: 600; color: #1e293b; }
.standing-firstname { font-size: 0.75rem; color: #64748b; }
.standing-data { display: flex; align-items: center; gap: 0.5rem; }
.standing-pts { font-weight: 700; color: var(--primary-600); }
.standing-races-sm { font-size: 0.75rem; color: var(--gray-400); }
.no-standings { text-align: center; padding: 3rem; color: #64748b; }
.no-standings i { font-size: 2rem; margin-bottom: 1rem; display: block; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 1rem; width: 100%; max-width: 500px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
.modal.modal-sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
.modal-header h2 { font-size: 1.25rem; font-weight: 700; }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; background: #f8fafc; }

/* Race Modal */
.race-modal { max-width: 900px; }
.race-modal-header { background: #f8fafc; }
.race-info { display: flex; align-items: center; gap: 1rem; }
.race-flag { width: 48px; height: 32px; object-fit: cover; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.race-details h2 { margin-bottom: 0.25rem; }
.event-type-label { font-size: 0.875rem; color: #94a3b8; }
.race-modal-body { padding: 0; min-height: 400px; }

/* Race Animation */
.race-start-panel { padding: 3rem 2rem; text-align: center; }
.race-preview { margin-bottom: 2rem; }
.race-preview-icon { width: 80px; height: 80px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; color: white; font-size: 2rem; }
.race-preview-count { font-size: 1.25rem; color: #475569; margin-bottom: 0.5rem; }
.race-preview-details { display: flex; justify-content: center; gap: 2rem; color: #64748b; }

.race-animation-container { min-height: 400px; }
.race-animation-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; }
.race-phase { }
.phase-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; }
.phase-badge.jumping { background: #3b82f6; }
.phase-badge.xc { background: #3b82f6; }
.race-status-display { flex: 1; text-align: center; }
.status-label { font-size: 0.875rem; opacity: 0.8; }
.race-timer { display: flex; align-items: center; gap: 0.5rem; }
.timer-value { font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 700; }

/* Jump Animation */
.jumping-animation { display: grid; grid-template-columns: 2fr 1fr; min-height: 350px; }
.jump-hill-container { position: relative; background: linear-gradient(180deg, #87CEEB, #E0F4FF); }
.ski-jump-svg { width: 100%; height: 100%; display: block; }
.jump-result-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 1.5rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}
.jump-result-overlay.show { opacity: 1; transform: translateY(0); }
.result-distance, .result-points, .result-style { display: flex; flex-direction: column; align-items: center; }
.distance-label, .points-label, .style-label { font-size: 0.625rem; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 0.25rem; }
.result-distance .distance-value { font-size: 1.75rem; font-weight: 700; color: #3b82f6; }
.result-points .points-value { font-size: 1.5rem; font-weight: 700; color: #10b981; }
.result-style .style-value { font-size: 1.25rem; font-weight: 600; color: #3b82f6; }
.jump-standings-preview { background: #0f172a; padding: 1rem; color: white; overflow-y: auto; }
.standings-title { font-weight: 600; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 0.5rem; }
.standings-list { display: flex; flex-direction: column; gap: 0.375rem; }
.standings-entry { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.8125rem; transition: background 0.2s; }
.standings-entry.highlight { background: rgba(251, 191, 36, 0.2); }
.entry-pos { width: 24px; font-weight: 700; color: #94a3b8; text-align: center; }
.entry-pos.gold { color: #fbbf24; }
.entry-pos.silver { color: #d1d5db; }
.entry-pos.bronze { color: #f59e0b; }
.entry-flag { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
.entry-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entry-distance { color: #94a3b8; font-size: 0.75rem; }
.entry-points { font-weight: 600; color: #10b981; font-size: 0.75rem; }

/* XC Start View - Pursuit Start List */
.xc-start-view {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  padding: 1.5rem;
}

.xc-start-header {
  text-align: center;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.xc-start-header h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.25rem;
  color: #1e293b;
}

.xc-start-header p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.pursuit-start-list {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.pursuit-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.875rem;
  color: #475569;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0.75rem;
}

.pursuit-header i {
  color: #3b82f6;
}

.pursuit-entries {
  overflow-y: auto;
  flex: 1;
}

.pursuit-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  margin-bottom: 0.375rem;
  transition: all 0.2s;
}

.pursuit-entry.leader {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
}

.pursuit-entry.podium:not(.leader) {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.pursuit-pos {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
}

.pursuit-pos.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.pursuit-pos.silver {
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  color: #475569;
}

.pursuit-pos.bronze {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.pursuit-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.pursuit-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pursuit-jump-pts {
  font-size: 0.75rem;
  color: #64748b;
  min-width: 60px;
  text-align: right;
}

.pursuit-gap {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #ef4444;
  min-width: 55px;
  text-align: right;
}

.pursuit-gap.first {
  color: #10b981;
}

/* XC Animation */
.xc-animation { display: grid; grid-template-columns: 2fr 1fr; min-height: 350px; }
.xc-track-container { background: linear-gradient(180deg, #e0f2fe, #f0f9ff); position: relative; }
.xc-race-info {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
}
.xc-distance, .xc-format {
  background: rgba(255, 255, 255, 0.9);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.xc-distance i { color: #3b82f6; }
.xc-format i { color: #3b82f6; }
.xc-track-svg { width: 100%; height: 100%; display: block; }
.xc-leaderboard { background: #0f172a; color: white; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; }
.leaderboard-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #334155; }
.leaderboard-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
.race-timer {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.race-timer i { font-size: 0.75rem; }
.leaderboard-entries { display: flex; flex-direction: column; gap: 0.375rem; overflow-y: auto; flex: 1; }
.leaderboard-entry { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.8125rem; transition: all 0.2s; background: rgba(30, 41, 59, 0.5); }
.leaderboard-entry.leader { background: rgba(251, 191, 36, 0.25); border: 1px solid rgba(251, 191, 36, 0.3); }
.leaderboard-entry.finished { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.3); }
.leaderboard-entry.not-started { opacity: 0.6; background: rgba(15, 23, 42, 0.5); }
.entry-rank { width: 24px; font-weight: 700; color: #94a3b8; text-align: center; }
.entry-rank.gold { color: #fbbf24; text-shadow: 0 0 8px rgba(251, 191, 36, 0.5); }
.entry-rank.silver { color: #e2e8f0; }
.entry-rank.bronze { color: #f59e0b; }
.entry-status { margin-left: auto; display: flex; align-items: center; gap: 0.375rem; }
.entry-time.finished { color: #10b981; font-weight: 600; font-family: 'Monaco', monospace; font-size: 0.75rem; display: flex; align-items: center; gap: 0.375rem; }
.entry-time.finished i { font-size: 0.625rem; }
.entry-gap.waiting { color: #64748b; font-size: 0.75rem; font-family: 'Monaco', monospace; display: flex; align-items: center; gap: 0.375rem; }
.entry-gap.waiting i { font-size: 0.625rem; }
.entry-gap.racing { color: #fbbf24; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.375rem; }
.entry-gap.racing i { font-size: 0.625rem; }
.entry-gap.leader-tag { color: #fbbf24; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.375rem; }
.entry-gap.leader-tag i { font-size: 0.625rem; color: #fbbf24; }
.finished-badge { color: #10b981; margin-left: 0.25rem; }
.interval-gap {
  color: #f87171;
  font-size: 0.6875rem;
  margin-left: 0.375rem;
  font-family: 'Monaco', 'Consolas', monospace;
}
.interval-live {
  color: #fbbf24;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

/* Results Table */
.results-header { padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.results-header.completed { background: var(--success-50); color: var(--success-700); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
.results-table-container { max-height: 400px; overflow-y: auto; }
.results-table { width: 100%; border-collapse: collapse; }
.results-table th, .results-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--gray-100); }
.results-table th { background: #f8fafc; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; position: sticky; top: 0; color: #475569; }
.results-table tr.podium { background: var(--primary-50); }
.col-rank { width: 50px; text-align: center; }
.col-time { font-family: monospace; }
.col-pts { font-weight: 600; color: var(--primary-600); }
.result-athlete { display: flex; align-items: center; gap: 0.5rem; }
.result-flag { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }

/* Teams */
.teams-content { display: flex; flex-direction: column; gap: 2rem; }
.team-standings-section { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.team-standings-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.team-standing-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid; cursor: pointer; transition: all 0.2s; }
.team-standing-item:hover { background: #f1f5f9; }
.team-standing-position { width: 36px; }
.team-standing-logo { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-standing-info { flex: 1; }
.team-standing-name { font-weight: 600; }
.team-standing-athletes { font-size: 0.75rem; color: #64748b; }
.team-standing-points { font-weight: 700; font-size: 1.125rem; color: var(--primary-600); }
.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.team-card { background: white; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-top: 4px solid; cursor: pointer; transition: all 0.2s; }
.team-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.team-card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
.team-logo { width: 48px; height: 48px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; }
.team-info h4 { margin: 0; }
.team-athlete-count { font-size: 0.75rem; color: #64748b; }
.team-description { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1rem; }
.team-card-actions { display: flex; gap: 0.5rem; }
.section-subtitle { font-size: 1rem; font-weight: 600; color: #cbd5e1; display: flex; align-items: center; gap: 0.5rem; }
.section-subtitle i { color: var(--primary-500); }

/* Competitor Modal */
.competitor-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.competitor-modal { background: rgba(30, 41, 59, 0.8); border-radius: 1rem; width: 100%; max-width: 400px; max-height: 80vh; overflow: hidden; }
.competitor-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
.competitor-info { display: flex; align-items: center; gap: 0.75rem; }
.competitor-flag { width: 32px; height: 24px; object-fit: cover; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.competitor-details h3 { margin: 0; font-size: 1rem; }
.competitor-standing { font-size: 0.8125rem; opacity: 0.9; }
.close-modal-btn { background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
.competitor-modal-content { padding: 1rem 1.25rem; max-height: 60vh; overflow-y: auto; }
.results-title { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.75rem; }
.competitor-results-list { display: flex; flex-direction: column; gap: 0.5rem; }
.result-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; background: rgba(15, 23, 42, 0.5); border-radius: 0.5rem; }
.result-row.podium { background: var(--primary-50); }
.result-event { flex: 1; }
.result-location { font-weight: 600; font-size: 0.875rem; }
.result-type { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
.result-position { width: 36px; text-align: center; }
.result-points { font-weight: 600; color: var(--primary-600); }
.no-results { text-align: center; padding: 2rem; color: var(--gray-400); }

/* Forms */
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-weight: 600; margin-bottom: 0.375rem; font-size: 0.875rem; color: #cbd5e1; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.625rem; border: 1px solid var(--gray-300); border-radius: 0.375rem; font-size: 0.875rem; }
.form-group input[type="range"] { padding: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-row.skills-row { grid-template-columns: repeat(3, 1fr); }
.form-section-title { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 0.9rem; color: #e2e8f0; margin: 1rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--gray-200); }
.randomize-buttons { display: flex; gap: 0.5rem; }
.btn-xs { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
.btn-strong { color: #fbbf24; }
.btn-strong:hover { background: rgba(251, 191, 36, 0.1); }
.btn-average { color: #60a5fa; }
.btn-average:hover { background: rgba(96, 165, 250, 0.1); }
.btn-weak { color: #f87171; }
.btn-weak:hover { background: rgba(248, 113, 113, 0.1); }
.skill-value { font-weight: 700; color: var(--primary-500); }
.team-modal { max-width: 480px; }
.color-picker-wrapper { display: flex; align-items: center; gap: 0.5rem; }
.color-picker { width: 40px; height: 40px; padding: 0; border: none; cursor: pointer; }
.color-preview { width: 24px; height: 24px; border-radius: 0.25rem; border: 1px solid var(--gray-300); }
.delete-warning { padding: 1rem 1.5rem; color: #cbd5e1; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: none; }
.btn-primary { background: var(--primary-500); color: white; }
.btn-primary:hover { background: var(--primary-600); }
.btn-secondary { background: rgba(148, 163, 184, 0.1); color: #cbd5e1; }
.btn-secondary:hover { background: var(--gray-200); }
.btn-ghost { background: transparent; color: #94a3b8; }
.btn-ghost:hover { background: rgba(148, 163, 184, 0.1); }
.btn-danger { background: var(--danger-500); color: white; }
.btn-danger:hover { background: var(--danger-600); }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.btn-lg { padding: 0.875rem 1.5rem; font-size: 1rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.text-danger { color: var(--danger-500) !important; }

/* Jump Animation Modal */
.jump-animation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.jump-animation-modal {
  background: #1a1a2e;
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.animation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.animation-header .jumper-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.animation-header .jumper-flag {
  width: 32px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.animation-header .jumper-name {
  font-weight: 700;
  font-size: 1.125rem;
}

.animation-header .jumper-wc-rank {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
}

.animation-header .jumper-wc-rank.top-3 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.animation-header .jumper-wc-rank.top-10 {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.animation-header .jumper-rank {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.animation-header .jumper-rank.top-3 {
  background: rgba(255, 215, 0, 0.3);
}

.close-animation-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-animation-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.animation-content {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 0;
}

.animation-svg-wrapper {
  padding: 1.5rem;
  background: #16213e;
}

.animation-svg-container {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 0.5rem;
  overflow: hidden;
}

.ski-jump-svg {
  width: 100%;
  height: auto;
  display: block;
}

.jumper-dot {
  transition: fill 0.2s;
}

.jumper-dot.landed {
  fill: #10b981;
}

.distance-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
  background: #0f3460;
  border-radius: 0.5rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.distance-bar.visible {
  opacity: 1;
  transform: translateY(0);
}

.dist-num {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
}

.dist-unit {
  font-size: 1.25rem;
  color: #94a3b8;
  margin-left: 0.25rem;
}

.dist-pts {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b82f6;
}

.results-panel {
  background: #0f3460;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.panel-title {
  font-weight: 700;
  color: white;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remaining-count {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 400;
  text-transform: none;
}

.leaderboard-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  transition: background 0.2s;
}

.leaderboard-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.leaderboard-row.current-jumper {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.leaderboard-row.podium {
  background: rgba(255, 215, 0, 0.1);
}

.lb-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
}

.lb-rank.gold {
  background: #f59e0b;
  color: white;
}

.lb-rank.silver {
  background: #9ca3af;
  color: white;
}

.lb-rank.bronze {
  background: #d97706;
  color: white;
}

.lb-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.lb-name {
  flex: 1;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.lb-points {
  color: #94a3b8;
  font-size: 0.8125rem;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.panel-actions.visible {
  opacity: 1;
  transform: translateY(0);
}

.btn-next-jumper {
  flex: 1;
  background: #3b82f6;
  color: white;
  font-weight: 700;
}

.btn-next-jumper:hover {
  background: #2563eb;
}

.btn-close-animation {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-close-animation:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Race Modal Styles */
.race-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.race-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.race-tab:hover:not(.disabled) {
  border-color: var(--primary-300);
  color: var(--primary-600);
}

.race-tab.active {
  background: var(--primary-500);
  border-color: var(--primary-500);
  color: white;
}

.race-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-check {
  color: #10b981;
}

.race-tab.active .tab-check {
  color: white;
}

.race-start-section {
  text-align: center;
  padding: 3rem 2rem;
}

.start-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: white;
}

.start-note {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

.race-dual-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
}

.start-list-section, .ranking-section {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.8125rem;
  text-transform: uppercase;
  color: #475569;
  margin-bottom: 0.75rem;
}

.simulate-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.start-list-container {
  max-height: 300px;
  overflow-y: auto;
}

.start-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
}

.start-list-item.next-jumper {
  background: var(--primary-100);
  border: 1px solid var(--primary-300);
}

.start-bib {
  width: 24px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
}

.start-list-item.next-jumper .start-bib {
  background: var(--primary-500);
  color: white;
}

.start-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.start-name {
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
}

.start-wc-rank {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: auto;
}

.start-wc-rank.top-10 {
  color: #059669;
  background: #d1fae5;
}

.start-wc-rank.unranked {
  color: #94a3b8;
  background: transparent;
}

.more-jumpers {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.proceed-section {
  grid-column: 1 / -1;
  text-align: center;
  padding: 1.5rem;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.results-table-container {
  max-height: 350px;
  overflow-y: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.results-table th {
  text-align: left;
  padding: 0.5rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: #f8fafc;
}

.results-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.results-table .highlight-row {
  background: var(--primary-50);
  animation: highlightFade 2s ease-out;
}

@keyframes highlightFade {
  0% { background: var(--primary-200); }
  100% { background: var(--primary-50); }
}

.result-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.rank-gold { color: #f59e0b; font-weight: 700; }
.rank-silver { color: #9ca3af; font-weight: 700; }
.rank-bronze { color: #d97706; font-weight: 700; }

@media (max-width: 768px) {
  .nav-tabs { flex-wrap: wrap; }
  .jumping-animation { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .race-dual-view { grid-template-columns: 1fr; }
  .animation-content { grid-template-columns: 1fr; }
  .results-panel { max-height: 200px; }
  .jump-animation-modal { max-height: 90vh; overflow-y: auto; }
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
