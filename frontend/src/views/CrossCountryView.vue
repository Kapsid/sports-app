<template>
  <div class="sport-page cross-country">
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
            <i class="fa-solid fa-person-skiing-nordic"></i>
            Cross-Country
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
              <i class="fa-solid fa-users"></i>
              Cross-Country Skiers
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
                {{ generating ? 'Generating...' : 'Generate 60 Skiers' }}
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
              <i class="fa-solid fa-person-skiing-nordic"></i>
            </div>
            <h3>No Skiers Yet</h3>
            <p>Generate a roster of cross-country skiers or add them manually.</p>
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
                  <th class="col-skill">CLA</th>
                  <th class="col-skill">SKA</th>
                  <th class="col-skill">SPR</th>
                  <th class="col-skill">DST</th>
                  <th class="col-skill">END</th>
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
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_classic)">{{ skier.skill_classic }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_skating)">{{ skier.skill_skating }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_sprint)">{{ skier.skill_sprint }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_distance)">{{ skier.skill_distance }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skier.skill_endurance)">{{ skier.skill_endurance }}</span></td>
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
            <p>Start a new Cross-Country World Cup season to begin competing.</p>
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
                <h2><i class="fa-solid fa-trophy xc-icon"></i> Cross-Country World Cup {{ currentSeason.name }}</h2>
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
                      <span class="race-technique">{{ getTechniqueName(event.technique) }}</span>
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
                :class="['standings-switch distance', { active: standingsView === 'distance', disabled: disciplineStandings.distance.length === 0 }]"
                @click="disciplineStandings.distance.length > 0 && (standingsView = 'distance')"
                :disabled="disciplineStandings.distance.length === 0"
              >
                <i class="fa-solid fa-route"></i>
                <span>Distance</span>
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
              <span class="race-type-label" :class="selectedEvent?.race_type">
                <i :class="getRaceTypeIcon(selectedEvent?.race_type)"></i>
                {{ getRaceTypeName(selectedEvent?.race_type) }} - {{ selectedEvent?.distance }}km {{ getTechniqueName(selectedEvent?.technique) }}
              </span>
            </div>
          </div>
          <button @click="closeRaceModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body race-modal-body">
          <!-- Not started - Show start button -->
          <div v-if="!isRaceInProgress && displayResults.length === 0" class="race-start-panel">
            <div class="race-preview">
              <div class="race-preview-icon">
                <i :class="getRaceTypeIcon(selectedEvent?.race_type)"></i>
              </div>
              <p class="race-preview-count"><strong>{{ skiers.length }}</strong> skiers ready to compete</p>
              <p class="race-preview-details">
                <span><i class="fa-solid fa-route"></i> {{ selectedEvent?.distance }}km</span>
                <span><i class="fa-solid fa-skiing-nordic"></i> {{ getTechniqueName(selectedEvent?.technique) }}</span>
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
                <div v-if="isIntervalMode && totalSkiersToRace > 0" class="interval-progress">
                  <div class="interval-progress-bar">
                    <div class="interval-progress-fill" :style="{ width: (currentSkierIndex / totalSkiersToRace * 100) + '%' }"></div>
                  </div>
                  <span class="interval-count">{{ currentSkierIndex }}/{{ totalSkiersToRace }}</span>
                </div>
              </div>
              <button @click="isIntervalMode ? skipRemainingRacers() : skipAnimation()" class="btn btn-ghost btn-sm">
                <i class="fa-solid fa-forward-fast"></i> Skip to Results
              </button>
            </div>

            <!-- Main Animation Area - New Layout: Track on top, panels below -->
            <div class="race-animation-content">
              <!-- SVG Track Animation - Full Width -->
              <div class="race-track-container">
                <svg viewBox="0 0 800 220" class="xc-track-svg">
                  <defs>
                    <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#f0f9ff" />
                      <stop offset="100%" style="stop-color:#e0f2fe" />
                    </linearGradient>
                  </defs>

                  <!-- Background -->
                  <rect x="0" y="0" width="800" height="220" fill="url(#snowGradient)" />

                  <!-- Mountain silhouette background -->
                  <path d="M 0 200 L 100 140 L 200 170 L 350 100 L 450 130 L 550 90 L 650 110 L 750 100 L 800 130 L 800 220 L 0 220 Z"
                    fill="#94a3b8" opacity="0.15" />

                  <!-- Track - centered vertically -->
                  <path d="M 30 110 Q 200 95, 400 110 T 770 110"
                    fill="none" stroke="#cbd5e1" stroke-width="18" stroke-linecap="round" />
                  <path d="M 30 110 Q 200 95, 400 110 T 770 110"
                    fill="none" stroke="white" stroke-width="14" stroke-linecap="round" />
                  <path d="M 30 110 Q 200 95, 400 110 T 770 110"
                    fill="none" stroke="#e0f2fe" stroke-width="6" stroke-linecap="round" stroke-dasharray="6,4" opacity="0.6" />

                  <!-- Checkpoint markers -->
                  <g v-for="marker in checkpointMarkers" :key="'cp-'+marker.km">
                    <line :x1="marker.x" y1="80" :x2="marker.x" y2="140"
                      :stroke="marker.passed ? '#10b981' : '#94a3b8'"
                      :stroke-width="marker.major ? 2 : 1"
                      :stroke-dasharray="marker.major ? '0' : '3,3'" />
                    <text :x="marker.x" y="72" text-anchor="middle"
                      :fill="marker.passed ? '#059669' : '#64748b'"
                      :font-size="marker.major ? 11 : 9"
                      :font-weight="marker.major ? 'bold' : 'normal'">
                      {{ marker.label }}
                    </text>
                    <!-- Checkpoint time comparison -->
                    <g v-if="marker.passed && marker.diff !== null">
                      <rect :x="marker.x - 20" y="148" width="40" height="16" rx="3"
                        :fill="marker.diff < 0 ? '#dcfce7' : '#fee2e2'" />
                      <text :x="marker.x" y="160" text-anchor="middle"
                        :fill="marker.diff < 0 ? '#059669' : '#dc2626'" font-size="10" font-weight="bold">
                        {{ marker.diff < 0 ? '' : '+' }}{{ marker.diff.toFixed(1) }}
                      </text>
                    </g>
                  </g>

                  <!-- Start line -->
                  <line x1="40" y1="75" x2="40" y2="145" stroke="#22c55e" stroke-width="3" />
                  <text x="40" y="67" text-anchor="middle" fill="#22c55e" font-size="9" font-weight="bold">START</text>

                  <!-- Finish line -->
                  <line x1="750" y1="75" x2="750" y2="145" stroke="#ef4444" stroke-width="3" />
                  <text x="760" y="67" fill="#ef4444" font-size="9" font-weight="bold">FINISH</text>

                  <!-- Animated Skiers -->
                  <g v-for="(skier, idx) in visibleSkiers" :key="skier.id" class="skier-group">
                    <template v-if="!skier.finished">
                      <!-- Ski trails -->
                      <line :x1="skier.x - 15" :y1="skier.y + 2" :x2="skier.x - 3" :y2="skier.y + 2"
                        :stroke="getSkierColor(idx)" stroke-width="2" opacity="0.4" />
                      <line :x1="skier.x - 15" :y1="skier.y - 2" :x2="skier.x - 3" :y2="skier.y - 2"
                        :stroke="getSkierColor(idx)" stroke-width="2" opacity="0.4" />
                      <!-- Skier body -->
                      <circle :cx="skier.x" :cy="skier.y" r="8" :fill="getSkierColor(idx)"
                        stroke="white" stroke-width="2" />
                      <!-- Name label above skier -->
                      <rect :x="skier.x - 30" :y="skier.y - 30" width="60" height="16" rx="3"
                        fill="white" stroke="#e5e7eb" stroke-width="1" />
                      <text :x="skier.x" :y="skier.y - 18"
                        text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">
                        {{ skier.lastName }}
                      </text>
                    </template>
                    <!-- Finished skier marker -->
                    <template v-else>
                      <circle cx="765" :cy="90 + idx * 12" r="5"
                        :fill="idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : '#64748b'" />
                    </template>
                  </g>
                </svg>
              </div>

              <!-- Bottom Panels: Standings (left) and Current Athlete (right) -->
              <div class="race-bottom-panels">
                <!-- Live Leaderboard -->
                <div class="live-leaderboard">
                  <div class="leaderboard-title">
                    <i class="fa-solid fa-ranking-star"></i>
                    {{ isIntervalMode ? 'Standings' : 'Live Standings' }}
                  </div>
                  <div class="leaderboard-entries">
                    <template v-if="isIntervalMode">
                      <div v-for="(entry, idx) in liveStandings.slice(0, 10)" :key="entry.skierId"
                        :class="['leaderboard-entry', { 'leader': idx === 0, 'my-team': entry.team_id }]">
                        <span class="entry-rank" :class="{ 'gold': idx === 0, 'silver': idx === 1, 'bronze': idx === 2 }">{{ idx + 1 }}</span>
                        <img :src="`/flags/${entry.country}.png`" class="entry-flag" />
                        <span class="entry-name">{{ entry.lastName }}</span>
                        <span v-if="getSkierWCRank(entry.skierId) && getSkierWCRank(entry.skierId) <= 10" class="entry-wc-badge" :class="{ 'top-3': getSkierWCRank(entry.skierId) <= 3 }">
                          #{{ getSkierWCRank(entry.skierId) }}
                        </span>
                        <span v-if="entry.team_id" class="entry-team-badge"><i class="fa-solid fa-star"></i></span>
                        <span class="entry-time" v-if="idx === 0">{{ formatRaceTime(entry.time) }}</span>
                        <span class="entry-time entry-behind" v-else>+{{ formatRaceTime(entry.timeBehind || 0) }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div v-for="entry in liveStandings.slice(0, 10)" :key="entry.skierId"
                        :class="['leaderboard-entry', { 'leader': entry.isWinner, 'finished': entry.finished, 'my-team': entry.team_id }]">
                        <span class="entry-rank" :class="{ 'gold': entry.position === 1, 'silver': entry.position === 2, 'bronze': entry.position === 3 }">
                          {{ entry.position }}
                        </span>
                        <img :src="`/flags/${entry.country}.png`" class="entry-flag" />
                        <span class="entry-name">{{ entry.lastName }}</span>
                        <span v-if="entry.team_id" class="entry-team-badge"><i class="fa-solid fa-star"></i></span>
                        <span v-if="entry.gap !== null && entry.gap > 0" class="entry-gap">
                          +{{ entry.gap.toFixed(1) }}s
                        </span>
                        <span v-if="entry.finished" class="entry-status finished-badge">
                          <i class="fa-solid fa-flag-checkered"></i>
                        </span>
                      </div>
                    </template>
                    <div v-if="liveStandings.length === 0" class="no-standings-yet">
                      <i class="fa-solid fa-hourglass-start"></i>
                      <span>Waiting for finishers...</span>
                    </div>
                  </div>
                </div>

                <!-- Current Athlete Focus Card (for interval mode) -->
                <div v-if="isIntervalMode && currentIntervalSkier" class="current-athlete-card">
                  <!-- Action buttons at top -->
                  <div class="athlete-actions-top">
                    <template v-if="waitingForNextRacer">
                      <button @click="advanceToNextRacer" class="btn-action-primary" v-if="currentSkierIndex < totalSkiersToRace - 1">
                        <i class="fa-solid fa-forward-step"></i> Next ({{ currentSkierIndex + 2 }}/{{ totalSkiersToRace }})
                      </button>
                      <button @click="skipRemainingRacers" class="btn-action-secondary" v-if="currentSkierIndex < totalSkiersToRace - 1">
                        <i class="fa-solid fa-forward-fast"></i> Skip All
                      </button>
                      <button @click="finishIntervalRace" class="btn-action-primary" v-if="currentSkierIndex >= totalSkiersToRace - 1">
                        <i class="fa-solid fa-flag-checkered"></i> View Results
                      </button>
                    </template>
                    <span v-else class="racing-indicator"><i class="fa-solid fa-circle"></i> Racing</span>
                  </div>

                  <!-- Compact athlete row -->
                  <div class="athlete-row">
                    <span class="bib">#{{ currentSkierIndex + 1 }}</span>
                    <span v-if="currentSkierWCRank" class="wc-rank-badge" :class="{ 'top-3': currentSkierWCRank <= 3, 'top-10': currentSkierWCRank > 3 && currentSkierWCRank <= 10 }">
                      WC #{{ currentSkierWCRank }}
                    </span>
                    <img :src="`/flags/${currentIntervalSkier.country}.png`" class="athlete-flag-sm" />
                    <span class="athlete-name-main">{{ currentIntervalSkier.lastName }}</span>
                    <span class="athlete-firstname-sm">{{ currentIntervalSkier.firstName }}</span>
                  </div>

                  <!-- Stats row - horizontal -->
                  <div class="stats-row">
                    <div class="stat-compact">
                      <span class="stat-val time">{{ formatRaceTime(raceTimer) }}</span>
                      <span class="stat-lbl">Time</span>
                    </div>
                    <div class="stat-compact" v-if="currentCheckpoint">
                      <span class="stat-val" :class="currentCheckpoint.diff < 0 ? 'ahead' : 'behind'">
                        {{ currentCheckpoint.diff < 0 ? '' : '+' }}{{ currentCheckpoint.diff.toFixed(1) }}s
                      </span>
                      <span class="stat-lbl">{{ currentCheckpoint.km }}km</span>
                    </div>
                    <div class="stat-compact">
                      <span class="stat-val pos">{{ currentVirtualPosition }}</span>
                      <span class="stat-lbl">Pos</span>
                    </div>
                    <div class="stat-compact" v-if="currentSkierFinished && liveStandings.length > 0">
                      <span class="stat-val" :class="getTimeDiffClass()">{{ getTimeDiffDisplay() }}</span>
                      <span class="stat-lbl">Final</span>
                    </div>
                  </div>

                  <!-- Leader reference (if not finished) -->
                  <div v-if="liveStandings.length > 0 && !currentSkierFinished" class="leader-ref">
                    <i class="fa-solid fa-trophy"></i>
                    <span>{{ liveStandings[0].lastName }}</span>
                    <span class="leader-time">{{ formatRaceTime(liveStandings[0].time) }}</span>
                  </div>
                </div>

                <!-- Placeholder for mass start mode -->
                <div v-else class="mass-start-info">
                  <div class="mass-info-title">
                    <i class="fa-solid fa-users"></i>
                    Mass Start Race
                  </div>
                  <p>All skiers racing together</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Final Results -->
          <div v-else-if="displayResults.length > 0" class="race-results">
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in displayResults" :key="result.skierId" :class="{ 'podium': result.position <= 3, 'podium-gold': result.position === 1, 'podium-silver': result.position === 2, 'podium-bronze': result.position === 3, 'yellow-jersey': result.position === 1 }">
                    <td class="col-rank">
                      <span v-if="result.position === 1" class="medal gold">1</span>
                      <span v-else-if="result.position === 2" class="medal silver">2</span>
                      <span v-else-if="result.position === 3" class="medal bronze">3</span>
                      <span v-else>{{ result.position }}</span>
                    </td>
                    <td class="col-country"><img :src="`/flags/${result.country}.png`" class="result-flag" /></td>
                    <td class="col-name">{{ result.lastName }} {{ result.firstName }}</td>
                    <td class="col-time">{{ formatTimeDisplay(result.totalTime || result.time) }}</td>
                    <td class="col-behind">{{ result.timeBehind ? `+${formatTimeDisplay(result.timeBehind)}` : '-' }}</td>
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
          <button @click="closeSkierModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
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
              <label>Classic <span class="skill-value">{{ skierForm.skill_classic }}</span></label>
              <input v-model.number="skierForm.skill_classic" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Skating <span class="skill-value">{{ skierForm.skill_skating }}</span></label>
              <input v-model.number="skierForm.skill_skating" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Sprint <span class="skill-value">{{ skierForm.skill_sprint }}</span></label>
              <input v-model.number="skierForm.skill_sprint" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="form-row skills-row">
            <div class="form-group">
              <label>Distance <span class="skill-value">{{ skierForm.skill_distance }}</span></label>
              <input v-model.number="skierForm.skill_distance" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Endurance <span class="skill-value">{{ skierForm.skill_endurance }}</span></label>
              <input v-model.number="skierForm.skill_endurance" type="range" min="50" max="99" />
            </div>
            <div class="form-group">
              <label>Consistency <span class="skill-value">{{ skierForm.consistency }}</span></label>
              <input v-model.number="skierForm.consistency" type="range" min="50" max="99" />
            </div>
          </div>
          <div class="form-row skills-row">
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorldsStore } from '../stores/worlds'
import { useCrossCountryStore } from '../stores/crosscountry'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const worldsStore = useWorldsStore()
const xcStore = useCrossCountryStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)
const world = computed(() => worldsStore.currentWorld)
const skiers = computed(() => xcStore.skiers)
const countryNames = computed(() => xcStore.countryNames)
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
  const code = skierForm.value.country
  if (!code || !countryNames.value) return ''
  return countryNames.value[code] || code
})
function selectCountry(code) {
  skierForm.value.country = code
  countrySearch.value = ''
  showCountryDropdown.value = false
}
function hideCountryDropdown() {
  setTimeout(() => {
    showCountryDropdown.value = false
  }, 200)
}

const currentSeason = computed(() => xcStore.currentSeason)
const seasonEvents = computed(() => xcStore.events)
const seasonStandings = computed(() => xcStore.standings)
const disciplineStandings = computed(() => xcStore.disciplineStandings)
const currentEvent = computed(() => xcStore.currentEvent)
const raceResults = computed(() => currentEvent.value?.results)
const displayResults = computed(() => {
  if (!raceResults.value) return []
  // Use standings for sprint races (full results), or final for other race types
  return raceResults.value.standings || raceResults.value.final || []
})

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

// Get current race leader
const getCurrentLeader = computed(() => {
  const racing = visibleSkiers.value.filter(s => !s.finished)
  if (racing.length === 0) return null
  return racing.reduce((leader, s) => (!leader || s.x > leader.x) ? s : leader, null)
})

// Checkpoint markers for the track with time comparisons
const checkpointMarkers = ref([])
const currentCheckpoint = ref(null)
const currentVirtualPosition = ref('-')
const passedCheckpoints = ref([])

// Current skier's WC overall rank
const currentSkierWCRank = computed(() => {
  const skierId = currentIntervalSkier.value?.skierId || currentIntervalSkier.value?.id
  if (!skierId) return null
  const index = seasonStandings.value.findIndex(s => s.skierId === skierId)
  return index >= 0 ? index + 1 : null
})

// Helper function to get WC rank for any skier
function getSkierWCRank(skierId) {
  if (!skierId) return null
  const index = seasonStandings.value.findIndex(s => s.skierId === skierId)
  return index >= 0 ? index + 1 : null
}

// Generate checkpoint markers based on race distance
function generateCheckpointMarkers(distance) {
  const markers = []
  let interval
  if (distance <= 1.5) {
    // Sprint - every 0.5km
    interval = 0.5
  } else if (distance <= 10) {
    // Short distance - every 2km
    interval = 2
  } else if (distance <= 20) {
    // Medium distance - every 5km
    interval = 5
  } else {
    // Long distance - every 10km
    interval = 10
  }

  for (let km = interval; km < distance; km += interval) {
    markers.push({
      km,
      label: km < 1 ? `${km * 1000}m` : `${km}km`,
      x: 40 + (km / distance) * 710,
      major: km % (interval * 2) === 0 || km === interval,
      passed: false,
      diff: null,
      leaderTime: null
    })
  }
  return markers
}

// Generate realistic split times for a skier (with variation in pace)
function generateSkierSplits(finalTime, distance, checkpoints) {
  const splits = {}
  // Each skier has a random pace profile:
  // - Some start fast and fade
  // - Some start slow and speed up
  // - Some are consistent
  const paceProfile = Math.random()

  for (const cp of checkpoints) {
    const progress = cp.km / distance
    let timeAtCheckpoint

    if (paceProfile < 0.33) {
      // Fast starter, fades at end (convex curve)
      const adjustedProgress = Math.pow(progress, 0.85)
      timeAtCheckpoint = adjustedProgress * finalTime
    } else if (paceProfile < 0.66) {
      // Slow starter, speeds up (concave curve)
      const adjustedProgress = Math.pow(progress, 1.15)
      timeAtCheckpoint = adjustedProgress * finalTime
    } else {
      // Consistent pace with small random variation
      const variation = 1 + (Math.random() - 0.5) * 0.05
      timeAtCheckpoint = progress * finalTime * variation
    }

    // Add small random noise (up to ±2% of split time)
    const noise = 1 + (Math.random() - 0.5) * 0.04
    splits[cp.km] = timeAtCheckpoint * noise
  }

  // Add final split at full distance
  splits[distance] = finalTime

  return splits
}

// Get a skier's time at a specific distance using their stored splits
function getSkierTimeAtDistance(skierResult, targetKm, totalDistance) {
  if (!skierResult.splits) {
    // Fallback to linear interpolation if no splits stored
    return (targetKm / totalDistance) * skierResult.time
  }

  // Find the closest checkpoints to interpolate between
  const splitKms = Object.keys(skierResult.splits).map(Number).sort((a, b) => a - b)

  // If exact match, return it
  if (skierResult.splits[targetKm] !== undefined) {
    return skierResult.splits[targetKm]
  }

  // Find surrounding checkpoints
  let lowerKm = 0
  let lowerTime = 0
  let upperKm = totalDistance
  let upperTime = skierResult.time

  for (let i = 0; i < splitKms.length; i++) {
    if (splitKms[i] <= targetKm) {
      lowerKm = splitKms[i]
      lowerTime = skierResult.splits[splitKms[i]]
    }
    if (splitKms[i] >= targetKm) {
      upperKm = splitKms[i]
      upperTime = skierResult.splits[splitKms[i]]
      break
    }
  }

  // Linear interpolation between the two closest checkpoints
  if (upperKm === lowerKm) return lowerTime
  const ratio = (targetKm - lowerKm) / (upperKm - lowerKm)
  return lowerTime + ratio * (upperTime - lowerTime)
}

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
  skill_classic: 70,
  skill_skating: 70,
  skill_sprint: 70,
  skill_distance: 70,
  skill_endurance: 70,
  consistency: 70,
  form: 70
})

// Animation state
const isRaceInProgress = ref(false)
const raceTimer = ref(0)
const currentRacePhase = ref('')
const animationInterval = ref(null)
const visibleSkiers = ref([])
const liveStandings = ref([])

// Interval start mode
const isIntervalMode = ref(false)
const currentSkierIndex = ref(0)
const totalSkiersToRace = ref(0)
const allRaceResults = ref([])
const currentIntervalSkier = ref(null)
const backendRaceResults = ref([])
const finishOrder = ref([])
const waitingForNextRacer = ref(false)
const currentSkierFinished = ref(false)

// Skier colors for visualization
const skierColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#14b8a6']

function getSkierColor(idx) {
  return skierColors[idx % skierColors.length]
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
    skier.skill_classic,
    skier.skill_skating,
    skier.skill_sprint,
    skier.skill_distance,
    skier.skill_endurance
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
  skierForm.value.skill_classic = randomInRange()
  skierForm.value.skill_skating = randomInRange()
  skierForm.value.skill_sprint = randomInRange()
  skierForm.value.skill_distance = randomInRange()
  skierForm.value.skill_endurance = randomInRange()
  skierForm.value.consistency = randomInRange()
  skierForm.value.form = randomInRange()
}

function getRaceTypeName(type) {
  if (!type) return ''
  const names = {
    sprint_free: 'Sprint F',
    sprint_classic: 'Sprint C',
    interval_10_classic: '10km C',
    interval_10_free: '10km F',
    interval_15_classic: '15km C',
    interval_15_free: '15km F',
    interval_20_classic: '20km C',
    mass_start_30_classic: '30km Mass C',
    mass_start_30_free: '30km Mass F',
    mass_start_50_classic: '50km Mass C',
    mass_start_50_free: '50km Mass F',
    skiathlon: 'Skiathlon',
    pursuit: 'Pursuit',
    relay: 'Relay'
  }
  return names[type] || type
}

function getRaceTypeIcon(type) {
  if (!type) return 'fa-solid fa-circle'
  if (type.includes('sprint')) return 'fa-solid fa-bolt'
  if (type.includes('mass') || type === 'skiathlon') return 'fa-solid fa-users'
  if (type === 'pursuit') return 'fa-solid fa-person-running'
  if (type === 'relay') return 'fa-solid fa-people-group'
  return 'fa-solid fa-person-skiing-nordic'
}

function getRaceTypeClass(type) {
  if (!type) return ''
  if (type.includes('sprint')) return 'race-type-sprint'
  if (type.includes('mass') || type === 'skiathlon') return 'race-type-mass'
  if (type === 'pursuit') return 'race-type-pursuit'
  return 'race-type-interval'
}

function getTechniqueName(technique) {
  const names = {
    classic: 'Classic',
    freestyle: 'Freestyle',
    combined: 'Combined'
  }
  return names[technique] || technique
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRaceTime(seconds) {
  if (!seconds && seconds !== 0) return '0:00.0'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`
}

function formatTimeDisplay(seconds) {
  if (!seconds && seconds !== 0) return '-'
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${hours}:${String(mins).padStart(2, '0')}:${secs.padStart(4, '0')}`
  }
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(1)
  return `${mins}:${secs.padStart(4, '0')}`
}

function getEventPodium(event) {
  if (!event.results) return []
  // Use standings for sprint races, or final for other race types
  const results = event.results.standings || event.results.final
  if (!results) return []
  return results.slice(0, 3)
}

function getPositionClass(pos) {
  const p = parseInt(pos)
  if (p === 1) return 'gold'
  if (p === 2) return 'silver'
  if (p === 3) return 'bronze'
  if (p <= 10) return 'top-10'
  return ''
}

function getPositionSuffix(pos) {
  const p = parseInt(pos)
  if (p === 1) return 'st'
  if (p === 2) return 'nd'
  if (p === 3) return 'rd'
  return 'th'
}

function getTimeDiffClass() {
  if (liveStandings.value.length === 0) return ''
  const leaderTime = liveStandings.value[0].time
  const diff = raceTimer.value - leaderTime
  return diff <= 0 ? 'ahead' : 'behind'
}

function getTimeDiffDisplay() {
  if (liveStandings.value.length === 0) return ''
  const leaderTime = liveStandings.value[0].time
  const diff = raceTimer.value - leaderTime
  if (Math.abs(diff) < 0.1) return 'NEW LEADER!'
  const sign = diff < 0 ? '-' : '+'
  return `${sign}${formatRaceTime(Math.abs(diff))}`
}

function goBack() {
  router.push(`/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// Data loading functions
async function loadSkiers() {
  loadingSkiers.value = true
  try {
    await xcStore.fetchSkiers(worldId.value)
  } catch (error) {
    console.error('Failed to load skiers:', error)
  } finally {
    loadingSkiers.value = false
  }
}

async function loadSeason() {
  if (!worldId.value) return
  loadingSeason.value = true
  try {
    await xcStore.fetchCurrentSeason(worldId.value)
  } catch (error) {
    console.error('Failed to load season:', error)
  } finally {
    loadingSeason.value = false
  }
}

async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'crosscountry')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleGenerateSkiers() {
  generating.value = true
  try {
    await xcStore.generateSkiers(worldId.value)
  } catch (error) {
    console.error('Failed to generate skiers:', error)
  } finally {
    generating.value = false
  }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    await xcStore.createSeason(worldId.value)
  } catch (error) {
    console.error('Failed to create season:', error)
  } finally {
    creatingSeason.value = false
  }
}

async function handleResetSeason() {
  resettingSeason.value = true
  try {
    await xcStore.resetSeason(currentSeason.value.id)
    showResetConfirm.value = false
  } catch (error) {
    console.error('Failed to reset season:', error)
  } finally {
    resettingSeason.value = false
  }
}

// Skier CRUD
function openAddSkierModal() {
  editingSkier.value = null
  skierForm.value = {
    first_name: '',
    last_name: '',
    country: '',
    team_id: '',
    skill_classic: 70,
    skill_skating: 70,
    skill_sprint: 70,
    skill_distance: 70,
    skill_endurance: 70,
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
    skill_classic: skier.skill_classic,
    skill_skating: skier.skill_skating,
    skill_sprint: skier.skill_sprint,
    skill_distance: skier.skill_distance,
    skill_endurance: skier.skill_endurance,
    consistency: skier.consistency,
    form: skier.form
  }
  showSkierModal.value = true
}

function closeSkierModal() {
  showSkierModal.value = false
  editingSkier.value = null
}

async function handleSaveSkier() {
  savingSkier.value = true
  try {
    if (editingSkier.value) {
      await xcStore.updateSkier(editingSkier.value.id, skierForm.value)
    } else {
      await xcStore.createSkier(worldId.value, skierForm.value)
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
    await xcStore.deleteSkier(skierToDelete.value.id)
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
    await xcStore.deleteAllSkiers(worldId.value)
    showDeleteAllSkiersConfirm.value = false
  } catch (error) {
    console.error('Failed to delete all skiers:', error)
  } finally {
    deletingAllSkiers.value = false
  }
}

// Event handling
async function handleEventClick(event) {
  // Check if event is locked
  if (weekStatusStore.isEventLocked(event.date)) {
    alert(`This event is locked. Complete all events in ${weekStatusStore.formattedWeek} first.`)
    return
  }
  selectedEvent.value = event
  showRaceModal.value = true
  await xcStore.fetchEvent(event.id)
}

function closeRaceModal() {
  showRaceModal.value = false
  selectedEvent.value = null
  stopAnimation()
}

// Animation functions
async function startRaceAnimation() {
  // First, simulate the race on the backend
  try {
    const response = await xcStore.simulateRace(selectedEvent.value.id)
    // Use standings for sprint races (which have detailed heat info in 'final'),
    // or final for other race types
    const results = response.results.standings || response.results.final || []
    // Ensure we have valid results
    if (!results || results.length === 0) {
      console.error('No race results received')
      return
    }
    backendRaceResults.value = results
  } catch (error) {
    console.error('Failed to simulate race:', error)
    return
  }

  isRaceInProgress.value = true
  raceTimer.value = 0
  finishOrder.value = []
  passedCheckpoints.value = []
  currentCheckpoint.value = null
  currentVirtualPosition.value = '-'

  // Generate checkpoint markers based on race distance
  const distance = selectedEvent.value?.distance || 10
  checkpointMarkers.value = generateCheckpointMarkers(distance)

  // Determine race mode
  const raceType = selectedEvent.value.race_type
  isIntervalMode.value = raceType.includes('interval') || raceType.includes('sprint')

  if (isIntervalMode.value) {
    startIntervalRace()
  } else {
    startMassRace()
  }
}

function startIntervalRace() {
  currentRacePhase.value = 'Interval Start Race'

  // Shuffle the start order (in real races, start order is based on bib numbers, not final results)
  const shuffled = [...backendRaceResults.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  backendRaceResults.value = shuffled

  totalSkiersToRace.value = backendRaceResults.value.length
  currentSkierIndex.value = 0
  allRaceResults.value = []
  liveStandings.value = []

  // Animate one skier at a time
  animateNextIntervalSkier()
}

function animateNextIntervalSkier() {
  if (currentSkierIndex.value >= backendRaceResults.value.length) {
    finishIntervalRace()
    return
  }

  const result = backendRaceResults.value[currentSkierIndex.value]
  if (!result) {
    console.error('No result at index', currentSkierIndex.value)
    finishIntervalRace()
    return
  }

  currentIntervalSkier.value = result

  // Reset checkpoints for this skier
  checkpointMarkers.value.forEach(cp => {
    cp.passed = false
    cp.diff = null
  })
  currentCheckpoint.value = null
  passedCheckpoints.value = []

  // Get the skier's final time (handle both interval and sprint result formats)
  const skierTime = result.totalTime || result.time || 180
  const distance = selectedEvent.value?.distance || 10

  // Generate splits for this skier (how their time is distributed across checkpoints)
  const currentSkierSplits = generateSkierSplits(skierTime, distance, checkpointMarkers.value)

  // Calculate virtual position based on current time vs finished skiers
  updateVirtualPosition(0)

  // Create animated skier
  const skier = {
    id: result.skierId,
    firstName: result.firstName,
    lastName: result.lastName,
    country: result.country,
    x: 40,
    y: 110,
    speed: 0,
    finished: false,
    targetTime: skierTime,
    splits: currentSkierSplits
  }

  visibleSkiers.value = [skier]
  raceTimer.value = 0

  // Calculate speed to finish in target time (scaled animation)
  const trackLength = 710

  // Fixed animation duration for all skiers - 4 seconds
  const animationDuration = 4000
  const frameRate = 60
  const totalFrames = (animationDuration / 1000) * frameRate
  skier.speed = trackLength / totalFrames
  const timePerFrame = skierTime / totalFrames

  animationInterval.value = setInterval(() => {
    raceTimer.value += timePerFrame
    skier.x += skier.speed

    // Check checkpoint crossings and recalculate diffs
    const currentProgress = (skier.x - 40) / trackLength
    const currentKm = currentProgress * distance

    // Recalculate time difference at current position using actual splits
    if (liveStandings.value.length > 0) {
      const leader = liveStandings.value[0]
      // Get leader's actual time at this distance from their stored splits
      const leaderTimeAtCurrentKm = getSkierTimeAtDistance(leader, currentKm, distance)
      // Current skier's actual time at this point
      const currentTimeDiff = raceTimer.value - leaderTimeAtCurrentKm

      // Update current checkpoint display with recalculated diff
      if (currentKm > 0) {
        currentCheckpoint.value = {
          km: Math.floor(currentKm * 10) / 10,
          diff: currentTimeDiff
        }
      }
    }

    // Mark checkpoints as passed
    checkpointMarkers.value.forEach((cp, idx) => {
      if (!cp.passed && currentKm >= cp.km) {
        cp.passed = true
        // Calculate time at this checkpoint
        const checkpointTime = raceTimer.value

        // Compare with leader's actual time at same checkpoint using their splits
        if (liveStandings.value.length > 0) {
          const leader = liveStandings.value[0]
          const leaderCheckpointTime = getSkierTimeAtDistance(leader, cp.km, distance)
          cp.diff = checkpointTime - leaderCheckpointTime
          cp.leaderTime = leaderCheckpointTime
        } else {
          cp.diff = 0
          cp.leaderTime = checkpointTime
        }

        passedCheckpoints.value.push({ ...cp })
      }
    })

    // Update virtual position based on current time at current distance
    updateVirtualPositionAtDistance(raceTimer.value, currentKm, distance)

    if (skier.x >= 750) {
      skier.finished = true
      clearInterval(animationInterval.value)

      // Add to results with splits stored for future comparisons
      // Look up team_id from original skier data
      const originalSkier = skiers.value.find(s => s.id === result.skierId)
      allRaceResults.value.push({
        skierId: result.skierId,
        firstName: result.firstName,
        lastName: result.lastName,
        country: result.country,
        time: skierTime,
        splits: currentSkierSplits,
        finished: true,
        team_id: originalSkier?.team_id || null
      })

      // Update live standings (keep splits data)
      liveStandings.value = [...allRaceResults.value].sort((a, b) => a.time - b.time)
      liveStandings.value.forEach((s, idx) => {
        s.timeBehind = idx === 0 ? 0 : s.time - liveStandings.value[0].time
      })

      // Update virtual position to final position
      const finalPos = liveStandings.value.findIndex(s => s.skierId === result.skierId) + 1
      currentVirtualPosition.value = finalPos || '-'

      // Mark as finished and wait for manual click to advance
      currentSkierFinished.value = true
      waitingForNextRacer.value = true
    }
  }, 1000 / 60)
}

// Called when user clicks "Next Racer" button
function advanceToNextRacer() {
  if (!waitingForNextRacer.value) return

  waitingForNextRacer.value = false
  currentSkierFinished.value = false
  currentSkierIndex.value++

  animateNextIntervalSkier()
}

// Skip remaining racers and show final results
function skipRemainingRacers() {
  // Stop any ongoing animation
  if (animationInterval.value) {
    clearInterval(animationInterval.value)
    animationInterval.value = null
  }

  const distance = selectedEvent.value?.distance || 10

  // Determine starting index - if currently animating and not finished, include current skier
  const startIdx = currentSkierFinished.value ? currentSkierIndex.value + 1 : currentSkierIndex.value

  // Add all remaining skiers to results
  for (let i = startIdx; i < backendRaceResults.value.length; i++) {
    const result = backendRaceResults.value[i]
    if (!result) continue

    // Check if already in results
    if (allRaceResults.value.some(r => r.skierId === result.skierId)) continue

    const skierTime = result.totalTime || result.time || 180
    // Generate splits for skipped skiers too
    const splits = generateSkierSplits(skierTime, distance, checkpointMarkers.value)
    allRaceResults.value.push({
      skierId: result.skierId,
      firstName: result.firstName,
      lastName: result.lastName,
      country: result.country,
      time: skierTime,
      splits: splits,
      finished: true
    })
  }

  // Update live standings with all results (keep splits data)
  liveStandings.value = [...allRaceResults.value].sort((a, b) => a.time - b.time)
  liveStandings.value.forEach((s, idx) => {
    s.timeBehind = idx === 0 ? 0 : s.time - liveStandings.value[0].time
  })

  finishIntervalRace()
}

function updateVirtualPosition(currentTime) {
  if (liveStandings.value.length === 0) {
    currentVirtualPosition.value = '1'
    return
  }

  // Find where current time would place among finished skiers
  let position = 1
  for (const standing of liveStandings.value) {
    if (currentTime > standing.time) {
      position++
    } else {
      break
    }
  }
  currentVirtualPosition.value = position.toString()
}

function updateVirtualPositionAtDistance(currentTime, currentKm, totalDistance) {
  if (liveStandings.value.length === 0) {
    currentVirtualPosition.value = '1'
    return
  }

  if (currentKm <= 0) {
    currentVirtualPosition.value = '1'
    return
  }

  // Calculate what time each finished skier had at the current distance
  // using their actual stored splits (not linear interpolation)
  let position = 1
  for (const standing of liveStandings.value) {
    // Get actual time this skier had at currentKm using their splits
    const skierTimeAtCurrentKm = getSkierTimeAtDistance(standing, currentKm, totalDistance)
    if (currentTime > skierTimeAtCurrentKm) {
      position++
    }
  }
  currentVirtualPosition.value = position.toString()
}

function finishIntervalRace() {
  isRaceInProgress.value = false
  currentIntervalSkier.value = null
  visibleSkiers.value = []
}

function startMassRace() {
  currentRacePhase.value = 'Mass Start Race'

  // Initialize all skiers at the start
  visibleSkiers.value = backendRaceResults.value.slice(0, 30).map((result, idx) => {
    // Look up team_id from original skier data
    const originalSkier = skiers.value.find(s => s.id === result.skierId)
    return {
      id: result.skierId,
      firstName: result.firstName,
      lastName: result.lastName,
      country: result.country,
      x: 40 + (idx % 5) * 3,
      y: 105 + (idx % 4) * 4,
      speed: 0,
      finished: false,
      targetTime: result.totalTime || result.time || 1800,
      position: idx + 1,
      team_id: originalSkier?.team_id || null
    }
  })

  // Calculate speeds based on backend results
  const fastestTime = backendRaceResults.value[0]?.totalTime || backendRaceResults.value[0]?.time || 1000
  const trackLength = 710
  const baseDuration = 8000 // Base animation duration in ms

  visibleSkiers.value.forEach(skier => {
    const timeRatio = fastestTime / skier.targetTime
    skier.speed = (trackLength / baseDuration) * 60 * timeRatio
  })

  raceTimer.value = 0
  finishOrder.value = []
  let finishPosition = 1

  animationInterval.value = setInterval(() => {
    raceTimer.value += 0.5

    // Update skier positions
    visibleSkiers.value.forEach(skier => {
      if (!skier.finished) {
        skier.x += skier.speed + (Math.random() - 0.5) * 0.5

        // Check for finish
        if (skier.x >= 750) {
          skier.finished = true
          skier.finishPosition = finishPosition++
          finishOrder.value.push(skier)
        }
      }
    })

    // Update live standings
    updateMassLiveStandings()

    // Check if all finished
    if (visibleSkiers.value.every(s => s.finished)) {
      clearInterval(animationInterval.value)
      setTimeout(() => {
        isRaceInProgress.value = false
      }, 1000)
    }
  }, 1000 / 60)
}

function updateMassLiveStandings() {
  const sorted = [...visibleSkiers.value]
    .sort((a, b) => {
      if (a.finished && !b.finished) return -1
      if (!a.finished && b.finished) return 1
      if (a.finished && b.finished) return a.finishPosition - b.finishPosition
      return b.x - a.x
    })

  const leader = sorted[0]
  liveStandings.value = sorted.slice(0, 15).map((s, idx) => {
    const gap = leader ? (leader.x - s.x) * 0.1 : 0
    return {
      skierId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      country: s.country,
      position: idx + 1,
      finished: s.finished,
      isWinner: s.finished && s.finishPosition === 1,
      gap: s.finished ? null : Math.max(0, gap),
      team_id: s.team_id
    }
  })
}

function skipAnimation() {
  stopAnimation()
  isRaceInProgress.value = false
}

function stopAnimation() {
  if (animationInterval.value) {
    clearInterval(animationInterval.value)
    animationInterval.value = null
  }
  visibleSkiers.value = []
  liveStandings.value = []
  currentIntervalSkier.value = null
  checkpointMarkers.value = []
  currentCheckpoint.value = null
  currentVirtualPosition.value = '-'
  passedCheckpoints.value = []
  waitingForNextRacer.value = false
  currentSkierFinished.value = false
}

// Lifecycle
onMounted(async () => {
  if (worldId.value) {
    await worldsStore.fetchWorld(worldId.value)
    await Promise.all([
      loadSkiers(),
      teamsStore.fetchTeams(worldId.value, 'crosscountry'),
      weekStatusStore.fetchWeekStatus(worldId.value)
    ])
    // Load season since Calendar is the default tab
    loadSeason()
  }
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
/* Page Layout - Light Theme */
.crosscountry-page {
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
  color: #10b981;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #64748b;
}

.world-name, .sport-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.separator {
  color: #475569;
  font-size: 0.7rem;
}

.sport-name {
  color: #10b981;
  font-weight: 500;
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
  padding: 0.75rem 1.25rem;
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
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
  font-weight: 500;
}

.nav-tab-count, .nav-tab-badge {
  font-size: 0.75rem;
  opacity: 0.8;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
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
  gap: 0.5rem;
  font-size: 1.25rem;
  color: #1e293b;
}

.section-title i {
  color: #10b981;
}

.count {
  color: #94a3b8;
  font-weight: 400;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #10b981;
  opacity: 0.5;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.warning-text {
  color: var(--warning);
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Athletes Table */
.athletes-table-container {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.athletes-table {
  width: 100%;
  border-collapse: collapse;
}

.athletes-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  border-bottom: 1px solid #e2e8f0;
}

.athletes-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}

.clickable-row:hover {
  background: #f1f5f9;
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
}

.country-code {
  font-size: 0.75rem;
  color: #94a3b8;
}

.col-skill {
  text-align: center;
  width: 50px;
}

.col-skill span {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.skill-elite { background: #fef3c7; color: #92400e; }
.skill-high { background: #d1fae5; color: #065f46; }
.skill-good { background: #dbeafe; color: #1e40af; }
.skill-average { background: #e2e8f0; color: #94a3b8; }
.skill-low { background: #fee2e2; color: #991b1b; }

.overall {
  font-weight: 700;
}

.col-actions {
  width: 100px;
}

.delete-btn:hover {
  color: #ef4444;
}

/* Season Content */
.season-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.season-header-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.season-info h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.xc-icon {
  color: #10b981;
}

.season-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-text {
  font-size: 0.875rem;
  color: #94a3b8;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  width: 300px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 3px;
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
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.calendar-event:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.calendar-event.completed {
  border-color: #10b981;
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
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.event-number-badge {
  background: #e2e8f0;
  color: #94a3b8;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.race-type-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: #d1fae5;
  color: #065f46;
}

.race-type-badge.sprint_free, .race-type-badge.sprint_classic {
  background: #fef3c7;
  color: #92400e;
}

.event-status-badge {
  margin-left: auto;
  font-size: 0.75rem;
}

.event-status-badge.completed {
  color: #10b981;
}

.event-status-badge.scheduled {
  color: #64748b;
}

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
  width: 32px;
  height: 24px;
  object-fit: cover;
  border-radius: 3px;
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
  color: #64748b;
}

.event-race-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.event-date-display {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #64748b;
}

.calendar-event-podium {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.podium-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.podium-pos {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.podium-pos.gold { background: #fbbf24; color: white; }
.podium-pos.silver { background: #94a3b8; color: white; }
.podium-pos.bronze { background: #d97706; color: white; }

.podium-flag-sm {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

.calendar-event-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Standings */
.standings-compact {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.standings-switcher {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.standings-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #94a3b8;
  transition: all 0.2s;
  white-space: nowrap;
}

.standings-switch:hover:not(:disabled) {
  background: #f1f5f9;
}

.standings-switch.active {
  background: #059669;
  color: white;
}

.standings-switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.standings-panel {
  padding: 1rem;
}

.no-standings {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.no-standings i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.standings-list-compact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.standing-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.standing-row:hover {
  background: #f8fafc;
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
  color: #64748b;
  font-size: 0.875rem;
}

.standing-flag-sm {
  width: 20px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
}

.standing-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.standing-name-compact {
  font-weight: 600;
  color: #1e293b;
}

.standing-firstname {
  color: #64748b;
  font-size: 0.875rem;
}

.standing-data {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.standing-pts {
  font-weight: 700;
  color: #059669;
  min-width: 40px;
  text-align: right;
}

.standing-races-sm {
  font-size: 0.75rem;
  color: #64748b;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
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
  max-width: 500px;
  max-height: 90vh;
  overflow: visible;
}

.modal.modal-lg {
  max-width: 700px;
}

.modal.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
}

.modal-body {
  padding: 1.5rem;
  overflow: visible;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Race Modal */
.race-modal {
  max-width: 900px;
}

.race-modal-header {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-bottom: none;
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
}

.race-details h2 {
  margin-bottom: 0.25rem;
}

.race-type-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  opacity: 0.9;
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
  padding: 3rem;
  text-align: center;
}

.race-preview {
  margin-bottom: 2rem;
}

.race-preview-icon {
  font-size: 3rem;
  color: #059669;
  margin-bottom: 1rem;
}

.race-preview-count {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.race-preview-details {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  color: #94a3b8;
}

/* Race Animation */
.race-animation-container {
  display: flex;
  flex-direction: column;
}

.race-animation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--gray-900);
  color: white;
}

.race-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-value {
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: 700;
}

.race-status-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-label {
  font-weight: 500;
}

.interval-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.interval-progress-bar {
  width: 100px;
  height: 4px;
  background: var(--gray-700);
  border-radius: 2px;
  overflow: hidden;
}

.interval-progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s;
}

.interval-count {
  font-size: 0.75rem;
  color: #64748b;
}

.race-animation-content {
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
}

.race-bottom-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 140px;
}

/* Current Athlete Card - Compact Display */
.current-athlete-card {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.athlete-actions-top {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.btn-action-primary {
  background: white;
  color: #059669;
  border: none;
  padding: 0.375rem 0.625rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.15s;
}

.btn-action-primary:hover {
  background: #f0fdf4;
}

.btn-action-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  font-size: 0.6875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.15s;
}

.btn-action-secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}

.racing-indicator {
  font-size: 0.6875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.9;
}

.racing-indicator i {
  color: #fbbf24;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.athlete-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.15);
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
}

.bib {
  font-weight: 700;
  font-size: 0.875rem;
  opacity: 0.8;
}

.wc-rank-badge {
  background: #e2e8f0;
  color: #475569;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.wc-rank-badge.top-3 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.wc-rank-badge.top-10 {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: white;
}

.athlete-flag-sm {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
}

.athlete-name-main {
  font-weight: 700;
  font-size: 0.9375rem;
}

.athlete-firstname-sm {
  font-size: 0.75rem;
  opacity: 0.8;
}

.stats-row {
  display: flex;
  gap: 0.375rem;
}

.stat-compact {
  flex: 1;
  background: rgba(0, 0, 0, 0.15);
  padding: 0.25rem 0.375rem;
  border-radius: 0.25rem;
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
}

.stat-val.time { color: #fef3c7; }
.stat-val.ahead { color: #6ee7b7; }
.stat-val.behind { color: #fca5a5; }
.stat-val.pos { color: #fef3c7; }

.stat-lbl {
  display: block;
  font-size: 0.5rem;
  text-transform: uppercase;
  opacity: 0.6;
}

.leader-ref {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  opacity: 0.85;
}

.leader-ref i {
  color: #fbbf24;
}

.leader-time {
  margin-left: auto;
  font-weight: 600;
  color: #fef3c7;
}

.race-track-container {
  padding: 0.5rem;
  background: white;
}

.xc-track-svg {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  background: white;
}

/* Live Leaderboard */
.live-leaderboard {
  background: white;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  overflow-y: auto;
  max-height: 200px;
}

.no-standings-yet {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
  gap: 0.5rem;
}

.no-standings-yet i {
  font-size: 1.5rem;
}

/* Mass Start Info Panel */
.mass-start-info {
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

.mass-info-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.125rem;
  color: #475569;
  margin-bottom: 0.5rem;
}

.mass-info-title i {
  color: #10b981;
}

.leaderboard-title {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
}

.leaderboard-entries {
  padding: 0.5rem;
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.15s;
}

.leaderboard-entry:hover {
  background: #f8fafc;
}

.leaderboard-entry.leader {
  background: #fef3c7;
}

.leaderboard-entry.my-team {
  background: linear-gradient(90deg, #dbeafe 0%, #bfdbfe 50%, #dbeafe 100%);
  border-left: 3px solid #3b82f6;
}

.leaderboard-entry.my-team.leader {
  background: linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%);
  border-left: 3px solid #3b82f6;
}

.entry-team-badge {
  color: #3b82f6;
  font-size: 0.625rem;
  margin-left: -0.25rem;
}

.entry-wc-badge {
  background: #e2e8f0;
  color: #64748b;
  padding: 0 0.25rem;
  border-radius: 0.125rem;
  font-size: 0.5rem;
  font-weight: 600;
  margin-left: 0.125rem;
}

.entry-wc-badge.top-3 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.leaderboard-entry.finished {
  opacity: 0.7;
}

.leaderboard-entry.finished.my-team {
  opacity: 1;
}

.entry-rank {
  width: 22px;
  text-align: center;
  font-weight: 600;
  font-size: 0.8125rem;
}

.entry-rank.gold { color: #f59e0b; }
.entry-rank.silver { color: #6b7280; }
.entry-rank.bronze { color: #d97706; }

.entry-flag {
  width: 18px;
  height: 13px;
  object-fit: cover;
  border-radius: 2px;
}

.entry-name {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-time {
  font-family: monospace;
  font-size: 0.6875rem;
  color: #94a3b8;
}

.entry-behind {
  color: #64748b;
}

.entry-gap {
  font-size: 0.75rem;
  color: #64748b;
}

.entry-status {
  font-size: 0.75rem;
}

.finished-badge {
  color: #10b981;
}

/* Results Table */
.race-results {
  padding: 1.5rem;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
}

.results-header.completed {
  background: #d1fae5;
  color: #065f46;
  font-weight: 600;
}

.results-table-container {
  max-height: 400px;
  overflow-y: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  position: sticky;
  top: 0;
}

.results-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.results-table tr.podium {
  background: #fef3c7;
}

.results-table tr.podium-gold {
  background: linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%);
}

.results-table tr.podium-silver {
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
}

.results-table tr.podium-bronze {
  background: linear-gradient(90deg, #ffedd5 0%, #fed7aa 50%, #ffedd5 100%);
}

.results-table tr.yellow-jersey td:first-child {
  border-left: 3px solid #fbbf24;
}

.result-flag {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
}

/* Form */
.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #475569;
}

.form-group input[type="text"],
.form-group select {
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input[type="text"]:focus,
.form-group select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  border: 1px solid var(--border-color);
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
  border: 1px solid var(--border-color);
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
  background: rgba(16, 185, 129, 0.1);
}
.country-item.selected {
  background: rgba(16, 185, 129, 0.05);
  font-weight: 500;
}
.country-item.no-results {
  color: var(--text-secondary);
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
  color: #475569;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
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
  color: #059669;
}

.btn-strong:hover {
  background: #d1fae5;
  color: #047857;
}

.btn-average {
  color: #d97706;
}

.btn-average:hover {
  background: #fef3c7;
  color: #b45309;
}

.btn-weak {
  color: #dc2626;
}

.btn-weak:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.skills-row .form-group {
  align-items: stretch;
}

.skill-value {
  font-weight: 600;
  color: #059669;
}

.form-group input[type="range"] {
  width: 100%;
  margin-top: 0.25rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: #059669;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-ghost {
  background: transparent;
  color: #94a3b8;
}

.btn-ghost:hover {
  background: #f1f5f9;
}

.btn-danger {
  background: var(--danger-600);
  color: white;
}

.btn-danger:hover {
  background: var(--danger-700);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-lg {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
}

.text-danger {
  color: var(--danger-600);
}

/* Animation */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
  color: #475569;
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
  background: #f8fafc;
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
  color: #64748b;
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
  color: #64748b;
}

.standing-row.clickable {
  cursor: pointer;
}

/* Teams Tab Styles */
.teams-content { display: flex; flex-direction: column; gap: 2rem; }
.team-standings-section { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.team-standings-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.team-standing-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid; }
.team-standing-clickable { cursor: pointer; transition: all 0.2s; }
.team-standing-clickable:hover { background: #f1f5f9; transform: translateX(4px); }
.team-standing-position { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.team-standing-position .position { font-weight: 600; color: #94a3b8; font-size: 0.875rem; }
.team-standing-logo { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-standing-logo img { width: 100%; height: 100%; object-fit: contain; }
.team-standing-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.team-standing-name { font-weight: 600; color: #1e293b; }
.team-standing-skiers { font-size: 0.75rem; color: #64748b; }
.team-standing-points { font-weight: 700; font-size: 1.125rem; color: var(--primary-600); }

.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.team-card { background: white; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border-top: 4px solid; cursor: pointer; transition: all 0.2s; }
.team-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
.team-card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
.team-logo { width: 48px; height: 48px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.875rem; }
.team-logo img { width: 100%; height: 100%; object-fit: contain; }
.team-info h4 { font-weight: 600; color: #1e293b; margin: 0; }
.team-skier-count { font-size: 0.75rem; color: #64748b; }
.team-description { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1rem; }
.team-card-actions { display: flex; gap: 0.5rem; }

.team-modal { max-width: 480px; }
.team-modal .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.color-picker-wrapper { display: flex; align-items: center; gap: 0.5rem; }
.color-picker { width: 40px; height: 40px; padding: 0; border: none; cursor: pointer; }
.color-preview { width: 24px; height: 24px; border-radius: 0.25rem; border: 1px solid #e2e8f0; }

.team-standing-detail-modal { max-width: 500px; }
.team-modal-header-info { display: flex; align-items: center; gap: 1rem; }
.team-logo-small { width: 40px; height: 40px; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; }
.team-total-points { font-size: 0.875rem; color: #64748b; }
.team-skiers-list { max-height: 400px; overflow-y: auto; }
.empty-team-skiers { text-align: center; padding: 2rem; color: #64748b; }
.team-skier-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
.team-skier-item:last-child { border-bottom: none; }
.skier-wc-rank { width: 36px; text-align: center; font-weight: 600; color: #64748b; }
.skier-wc-rank .rank-leader { color: var(--success-600); }
.skier-wc-rank .rank-none { color: #475569; }
.skier-flag-small { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; }
.skier-name-full { flex: 1; font-weight: 500; }
.skier-wc-points { font-weight: 600; color: var(--primary-600); }

.section-subtitle { font-size: 1rem; font-weight: 600; color: #475569; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.section-subtitle i { color: var(--primary-500); }

/* Responsive */
@media (max-width: 768px) {
  .race-bottom-panels {
    grid-template-columns: 1fr;
  }

  .live-leaderboard {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .current-athlete-card {
    order: -1;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .calendar-grid {
    grid-template-columns: 1fr;
  }

  .nav-tabs {
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
