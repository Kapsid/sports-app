<template>
  <div class="sport-page speed-skating">
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
            <i class="fa-solid fa-person-skating"></i>
            Speed Skating
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
            :class="['nav-tab', { active: activeTab === 'skaters' }]"
            @click="activeTab = 'skaters'"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-person-skating"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Skaters</span>
              <span class="nav-tab-count" v-if="skaters.length">{{ skaters.length }}</span>
            </div>
          </button>
        </div>
      </div>
    </nav>

    <main class="page-main">
      <div class="container">

        <!-- Skaters Tab -->
        <div v-if="activeTab === 'skaters'" class="tab-content fade-in">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fa-solid fa-person-skating"></i>
              Speed Skaters
              <span class="count" v-if="skaters.length">({{ skaters.length }})</span>
            </h2>
            <div class="actions">
              <button
                @click="handleGenerateSkaters"
                class="btn btn-secondary"
                :disabled="generatingSkaters"
              >
                <i v-if="generatingSkaters" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                Generate Skaters
              </button>
              <button
                @click="openAddSkaterModal"
                class="btn btn-primary"
              >
                <i class="fa-solid fa-plus"></i>
                Add Skater
              </button>
              <button
                v-if="skaters.length > 0"
                @click="showDeleteAllSkatersConfirm = true"
                class="btn btn-ghost text-danger"
              >
                <i class="fa-solid fa-trash"></i>
                Delete All
              </button>
            </div>
          </div>

          <div v-if="loadingSkaters" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading skaters...
          </div>

          <div v-else-if="skaters.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-person-skating"></i>
            </div>
            <h3>No Skaters Yet</h3>
            <p>Generate or create skaters to get started.</p>
            <div class="empty-actions">
              <button @click="handleGenerateSkaters" class="btn btn-primary" :disabled="generatingSkaters">
                <i v-if="generatingSkaters" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                Generate 50 Skaters
              </button>
            </div>
          </div>

          <div v-else class="skaters-table-wrapper">
            <table class="skaters-table">
              <thead>
                <tr>
                  <th class="col-name">Name</th>
                  <th class="col-country">Country</th>
                  <th class="col-specialty">Specialty</th>
                  <th class="col-skill">ACC</th>
                  <th class="col-skill">COR</th>
                  <th class="col-skill">END</th>
                  <th class="col-skill">PAC</th>
                  <th class="col-skill">CON</th>
                  <th class="col-skill">FOR</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="skater in skaters"
                  :key="skater.id"
                  @click="openEditSkaterModal(skater)"
                  class="skater-row"
                >
                  <td class="col-name">
                    <span class="skater-name">{{ skater.first_name }} {{ skater.last_name }}</span>
                  </td>
                  <td class="col-country">
                    <img :src="`/flags/${skater.country}.png`" class="skater-flag" onerror="this.style.display='none'" />
                    <span>{{ skater.country }}</span>
                  </td>
                  <td class="col-specialty">
                    <span :class="['specialty-badge', skater.specialty]">{{ skater.specialty }}</span>
                  </td>
                  <td class="col-skill"><span :class="getSkillClass(skater.skill_acceleration)">{{ skater.skill_acceleration }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skater.skill_cornering)">{{ skater.skill_cornering }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skater.skill_endurance)">{{ skater.skill_endurance }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skater.skill_pace_control)">{{ skater.skill_pace_control }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skater.consistency)">{{ skater.consistency }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(skater.form)">{{ skater.form }}</span></td>
                  <td class="col-actions" @click.stop>
                    <button @click="openEditSkaterModal(skater)" class="btn btn-ghost btn-sm" title="Edit">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button @click="confirmDeleteSkater(skater)" class="btn btn-ghost btn-sm delete-btn" title="Delete">
                      <i class="fa-solid fa-trash"></i>
                    </button>
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
            <p>Start a new Speed Skating World Cup season to begin competing.</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason || skaters.length === 0">
              <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingSeason ? 'Creating...' : 'Start New Season' }}
            </button>
            <p v-if="skaters.length === 0" class="warning-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Create skaters first before starting a season.
            </p>
          </div>

          <div v-else class="season-content">
            <div class="season-header-card">
              <div class="season-info">
                <h2><i class="fa-solid fa-person-skating skating-icon"></i> Speed Skating World Cup {{ currentSeason.name }}</h2>
                <div class="season-progress">
                  <span class="progress-text">{{ completedEventsCount }} / {{ seasonEvents.length }} events completed</span>
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
                    <span class="event-type-badge distance-badge">
                      <i class="fa-solid fa-stopwatch"></i> {{ event.distance }}m
                    </span>
                    <span class="event-status-badge" :class="event.status">
                      <i v-if="event.status === 'completed'" class="fa-solid fa-check"></i>
                      <i v-else-if="event.status === 'in_progress'" class="fa-solid fa-play"></i>
                      <i v-else class="fa-solid fa-clock"></i>
                    </span>
                  </div>
                  <div class="calendar-event-body">
                    <div class="event-location">
                      <img :src="`/flags/${event.country}.png`" class="event-flag-large" onerror="this.style.display='none'" />
                      <div class="location-details">
                        <span class="location-name">{{ event.location }}</span>
                        <span class="location-country">{{ countryNames[event.country] || event.country }}</span>
                      </div>
                    </div>
                    <div class="event-track-info">
                      <span class="altitude-info" v-if="event.altitude > 0">
                        <i class="fa-solid fa-mountain"></i> {{ event.altitude }}m altitude
                      </span>
                    </div>
                    <div class="event-date-display">
                      <i class="fa-solid fa-calendar-day"></i>
                      {{ formatDate(event.date) }}
                    </div>
                  </div>
                  <div v-if="event.status === 'completed' && getEventPodium(event).length > 0" class="calendar-event-podium">
                    <div v-for="(podium, pIndex) in getEventPodium(event)" :key="podium.skaterId" class="podium-item">
                      <span :class="['podium-pos', pIndex === 0 ? 'gold' : pIndex === 1 ? 'silver' : 'bronze']">
                        {{ pIndex + 1 }}
                      </span>
                      <img :src="`/flags/${podium.country}.png`" class="podium-flag-sm" onerror="this.style.display='none'" />
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
          <!-- Standings sub-tabs -->
          <div class="standings-tabs">
            <button
              :class="['standings-tab', { active: standingsTab === 'overall' }]"
              @click="standingsTab = 'overall'"
            >
              Overall
            </button>
            <button
              :class="['standings-tab', { active: standingsTab === 'sprint' }]"
              @click="standingsTab = 'sprint'"
            >
              Sprint (500-1000m)
            </button>
            <button
              :class="['standings-tab', { active: standingsTab === 'middle' }]"
              @click="standingsTab = 'middle'"
            >
              Middle (1500m)
            </button>
            <button
              :class="['standings-tab', { active: standingsTab === 'long' }]"
              @click="standingsTab = 'long'"
            >
              Long (3000m+)
            </button>
            <button
              :class="['standings-tab teams', { active: standingsTab === 'teams' }]"
              @click="standingsTab = 'teams'; loadTeamStandings()"
            >
              <i class="fa-solid fa-people-group"></i> Teams
              <span class="switch-count" v-if="teamStandings.length">{{ teamStandings.length }}</span>
            </button>
          </div>

          <div class="standings-compact" v-if="standingsTab !== 'teams'">
            <div class="standings-header">
              <h2><i class="fa-solid fa-trophy"></i> {{ getStandingsTitle() }}</h2>
              <span class="races-info" v-if="currentStandings.length">{{ completedEventsCount }} events</span>
            </div>

            <div v-if="currentStandings.length === 0" class="no-standings">
              <i class="fa-solid fa-trophy"></i>
              <p>No standings yet. Simulate your first race!</p>
            </div>
            <div v-else class="standings-list-compact">
              <div
                v-for="(standing, index) in currentStandings"
                :key="standing.skaterId"
                :class="['standing-row', { 'top-3': index < 3 }]"
              >
                <div class="standing-rank">
                  <span v-if="index === 0" class="medal gold">1</span>
                  <span v-else-if="index === 1" class="medal silver">2</span>
                  <span v-else-if="index === 2" class="medal bronze">3</span>
                  <span v-else class="rank-num">{{ index + 1 }}</span>
                </div>
                <img :src="`/flags/${standing.country}.png`" class="standing-flag-sm" onerror="this.style.display='none'" />
                <div class="standing-info">
                  <span class="standing-name-compact">{{ standing.firstName }} {{ standing.lastName }}</span>
                </div>
                <div class="standing-data">
                  <span class="standing-pts">{{ standing.points }}</span>
                  <span class="standing-races-sm">{{ standing.races || 0 }}r</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Standings -->
          <div class="standings-compact teams-panel" v-if="standingsTab === 'teams'">
            <div class="standings-header">
              <h2><i class="fa-solid fa-people-group"></i> Team Standings</h2>
            </div>
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
    </main>

    <!-- Race Modal -->
    <div v-if="showRaceModal" class="race-animation-overlay" @click.self="closeRaceModal">
      <div class="race-animation-modal">
        <!-- Header -->
        <div class="race-header">
          <div class="race-venue">
            <img :src="`/flags/${selectedEvent?.country}.png`" class="venue-flag" onerror="this.style.display='none'" />
            <div class="venue-info">
              <h2>{{ selectedEvent?.location }}</h2>
              <span class="venue-details">
                <i class="fa-solid fa-stopwatch"></i> {{ selectedEvent?.distance }}m
                <span class="altitude" v-if="selectedEvent?.altitude > 0">
                  <i class="fa-solid fa-mountain"></i> {{ selectedEvent?.altitude }}m
                </span>
              </span>
            </div>
          </div>
          <div class="heat-indicator">
            <span class="heat-badge">Heat {{ currentHeat }} / {{ totalHeats }}</span>
          </div>
          <button @click="closeRaceModal" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Main Content -->
        <div class="race-content">
          <!-- Race Finished: Show Final Results -->
          <div v-if="raceFinished || (selectedEvent?.status === 'completed' && !raceStarted)" class="run-results-section">
            <div class="run-results-header">
              <h3>
                <i class="fa-solid fa-flag-checkered"></i>
                {{ selectedEvent?.status === 'completed' ? 'Final Results' : 'Race Complete' }}
              </h3>
              <button
                v-if="raceFinished && selectedEvent?.status !== 'completed'"
                @click="finishRace"
                class="btn btn-finish"
                :disabled="simulating"
              >
                <i class="fa-solid fa-check"></i>
                Save Results
              </button>
            </div>
            <div class="run-results-table">
              <div class="results-table-header">
                <span class="col-pos">Pos</span>
                <span class="col-skater">Skater</span>
                <span class="col-time">Time</span>
                <span class="col-diff">Diff</span>
              </div>
              <div
                v-for="(result, idx) in displayResults"
                :key="result.skaterId"
                :class="['results-table-row', { 'podium': idx < 3 }]"
              >
                <span class="col-pos" :class="getPosClass(idx + 1)">{{ idx + 1 }}</span>
                <div class="col-skater">
                  <img :src="`/flags/${result.country}.png`" class="result-flag" onerror="this.style.display='none'" />
                  <span class="result-name">{{ result.firstName }} {{ result.lastName }}</span>
                </div>
                <span class="col-time">{{ formatSkatingTime(result.time) }}</span>
                <span class="col-diff" :class="{ 'leader': idx === 0 }">
                  {{ idx === 0 ? '-' : '+' + (result.time - displayResults[0].time).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Track Animation (during race) -->
          <div v-else class="track-section">
            <!-- SVG Oval Track -->
            <div class="track-container">
              <svg viewBox="0 0 500 300" class="skating-track-svg">
                <defs>
                  <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#e0f2fe" />
                    <stop offset="50%" style="stop-color:#bae6fd" />
                    <stop offset="100%" style="stop-color:#7dd3fc" />
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

                <!-- Outer track boundary -->
                <ellipse cx="250" cy="150" rx="220" ry="120" fill="none" stroke="#475569" stroke-width="30" />

                <!-- Ice surface -->
                <ellipse cx="250" cy="150" rx="220" ry="120" fill="none" stroke="#e2e8f0" stroke-width="24" />

                <!-- Lane divider -->
                <ellipse cx="250" cy="150" rx="220" ry="120" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="10,5" />

                <!-- Inner lane -->
                <ellipse cx="250" cy="150" rx="200" ry="100" fill="none" stroke="#cbd5e1" stroke-width="1" />

                <!-- Start/Finish line -->
                <line x1="250" y1="30" x2="250" y2="55" stroke="#22c55e" stroke-width="3" />
                <text x="250" y="22" text-anchor="middle" fill="#22c55e" font-size="10" font-weight="bold">START/FINISH</text>

                <!-- Lane change zone (back straight) -->
                <line x1="250" y1="245" x2="250" y2="270" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,2" />
                <text x="250" y="282" text-anchor="middle" fill="#f59e0b" font-size="8">LANE CHANGE</text>

                <!-- Distance markers -->
                <g class="distance-markers">
                  <circle cx="470" cy="150" r="3" fill="#64748b" />
                  <text x="480" y="154" fill="#64748b" font-size="8">100m</text>

                  <circle cx="250" cy="270" r="3" fill="#64748b" />
                  <text x="250" y="295" text-anchor="middle" fill="#64748b" font-size="8">200m</text>

                  <circle cx="30" cy="150" r="3" fill="#64748b" />
                  <text x="12" y="154" fill="#64748b" font-size="8">300m</text>
                </g>

                <!-- Inner skater (blue) -->
                <g class="skater inner-skater" v-if="currentHeatSkaters[0]" :transform="`translate(${innerSkaterPos.x}, ${innerSkaterPos.y})`">
                  <circle cx="0" cy="0" r="8" fill="#3b82f6" filter="url(#glow)" />
                  <circle cx="0" cy="0" r="5" fill="#60a5fa" />
                  <!-- Leader indicator for inner -->
                  <g v-if="(animating || heatFinished) && leaderLane === 'inner' && hasTwoSkaters" transform="translate(0, -18)">
                    <rect x="-12" y="-8" width="24" height="14" rx="3" fill="#22c55e" />
                    <text x="0" y="2" text-anchor="middle" fill="white" font-size="8" font-weight="bold">1ST</text>
                  </g>
                </g>

                <!-- Outer skater (red) -->
                <g class="skater outer-skater" v-if="currentHeatSkaters[1]" :transform="`translate(${outerSkaterPos.x}, ${outerSkaterPos.y})`">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" filter="url(#glow)" />
                  <circle cx="0" cy="0" r="5" fill="#f87171" />
                  <!-- Leader indicator for outer -->
                  <g v-if="(animating || heatFinished) && leaderLane === 'outer' && hasTwoSkaters" transform="translate(0, -18)">
                    <rect x="-12" y="-8" width="24" height="14" rx="3" fill="#22c55e" />
                    <text x="0" y="2" text-anchor="middle" fill="white" font-size="8" font-weight="bold">1ST</text>
                  </g>
                </g>
              </svg>

              <!-- Race Status Bar (Lap Counter, Gap) -->
              <div class="race-status-bar" v-if="animating || heatFinished">
                <div class="lap-counter">
                  <i class="fa-solid fa-rotate"></i>
                  <span class="lap-text">Lap {{ currentLap }} / {{ totalLapsRef }}</span>
                </div>
                <div v-if="hasTwoSkaters" class="live-gap-indicator" :class="{ 'has-gap': liveGap >= 0.01 }">
                  <i class="fa-solid fa-stopwatch"></i>
                  <span class="gap-text">
                    Gap: <strong>{{ liveGap >= 0.01 ? liveGap.toFixed(2) : '0.00' }}s</strong>
                  </span>
                </div>
                <div v-if="!hasTwoSkaters" class="solo-indicator">
                  <i class="fa-solid fa-user"></i>
                  <span>Solo Run</span>
                </div>
                <div class="distance-info">
                  <i class="fa-solid fa-ruler"></i>
                  <span>{{ selectedEvent?.distance }}m</span>
                </div>
              </div>
            </div>

            <!-- Live Timing Display -->
            <div class="timing-display heat-timing">
              <div class="heat-skaters">
                <div class="heat-skater inner" :class="{ leader: leaderLane === 'inner' && (animating || heatFinished) }" v-if="currentHeatSkaters[0]">
                  <div class="skater-header">
                    <span class="lane-indicator inner">INNER</span>
                    <span v-if="innerOverallPosition && (animating || heatFinished)"
                          :class="['position-badge', innerOverallPosition === 1 ? 'leader' : (innerOverallPosition <= 3 ? 'podium' : 'behind')]">
                      <i v-if="innerOverallPosition === 1" class="fa-solid fa-trophy"></i>
                      {{ innerOverallPosition }}{{ getOrdinalSuffix(innerOverallPosition) }}
                    </span>
                  </div>
                  <img :src="`/flags/${currentHeatSkaters[0].country}.png`" class="skater-flag-lg" onerror="this.style.display='none'" />
                  <div class="skater-details">
                    <span class="skater-name-lg">{{ currentHeatSkaters[0].first_name }} {{ currentHeatSkaters[0].last_name }}</span>
                  </div>
                  <div class="live-time inner" :class="{ running: animating, winner: heatFinished && leaderLane === 'inner' }">
                    {{ innerDisplayTime }}
                  </div>
                  <!-- Show time diff on inner if inner is behind (outer is leader) - only for two skaters -->
                  <div v-if="(animating || heatFinished) && hasTwoSkaters && leaderLane === 'outer' && liveGap >= 0.01" class="time-diff behind">
                    +{{ liveGap.toFixed(2) }}
                  </div>
                </div>

                <!-- Gap indicator in the middle - only show for two skaters -->
                <div class="gap-display" v-if="(animating || heatFinished) && hasTwoSkaters">
                  <div class="gap-value">
                    <i class="fa-solid fa-arrows-left-right"></i>
                    {{ liveGap >= 0.01 ? liveGap.toFixed(2) + 's' : '0.00s' }}
                  </div>
                  <div class="gap-label">GAP</div>
                </div>

                <div class="heat-skater outer" :class="{ leader: leaderLane === 'outer' && (animating || heatFinished) }" v-if="currentHeatSkaters[1]">
                  <div class="skater-header">
                    <span class="lane-indicator outer">OUTER</span>
                    <span v-if="outerOverallPosition && (animating || heatFinished)"
                          :class="['position-badge', outerOverallPosition === 1 ? 'leader' : (outerOverallPosition <= 3 ? 'podium' : 'behind')]">
                      <i v-if="outerOverallPosition === 1" class="fa-solid fa-trophy"></i>
                      {{ outerOverallPosition }}{{ getOrdinalSuffix(outerOverallPosition) }}
                    </span>
                  </div>
                  <img :src="`/flags/${currentHeatSkaters[1].country}.png`" class="skater-flag-lg" onerror="this.style.display='none'" />
                  <div class="skater-details">
                    <span class="skater-name-lg">{{ currentHeatSkaters[1].first_name }} {{ currentHeatSkaters[1].last_name }}</span>
                  </div>
                  <div class="live-time outer" :class="{ running: animating, winner: heatFinished && leaderLane === 'outer' }">
                    {{ outerDisplayTime }}
                  </div>
                  <!-- Show time diff on outer if outer is behind (inner is leader) - only for two skaters -->
                  <div v-if="(animating || heatFinished) && hasTwoSkaters && leaderLane === 'inner' && liveGap >= 0.01" class="time-diff behind">
                    +{{ liveGap.toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button
                v-if="!raceStarted && selectedEvent?.status === 'scheduled'"
                @click="startRace"
                class="btn btn-start"
                :disabled="skaters.length === 0"
              >
                <i class="fa-solid fa-flag-checkered"></i>
                Start Race
              </button>

              <button
                v-if="raceStarted && !animating && hasNextHeat"
                @click="runNextHeat"
                class="btn btn-next"
              >
                <i class="fa-solid fa-forward"></i>
                Next Heat ({{ remainingHeats }})
              </button>

              <button
                v-if="raceStarted && !hasNextHeat && !animating"
                @click="finishRace"
                class="btn btn-finish"
              >
                <i class="fa-solid fa-check"></i>
                Complete Race
              </button>
            </div>
          </div>

          <!-- Right: Standings & Heat List -->
          <div v-if="!raceFinished && !(selectedEvent?.status === 'completed' && !raceStarted)" class="standings-section">
            <!-- Heat List (before race starts) -->
            <div v-if="!raceStarted" class="start-list-panel">
              <h3><i class="fa-solid fa-list-ol"></i> Heats ({{ eventHeats.length }})</h3>
              <div class="heats-list">
                <div
                  v-for="(heat, idx) in eventHeats"
                  :key="idx"
                  :class="['heat-item', { 'current': idx + 1 === currentHeat }]"
                >
                  <span class="heat-number">Heat {{ idx + 1 }}</span>
                  <div class="heat-pairing">
                    <div class="heat-skater-mini inner">
                      <img :src="`/flags/${getInnerSkater(heat)?.country}.png`" class="mini-flag" onerror="this.style.display='none'" />
                      <span>{{ getInnerSkater(heat)?.lastName }}</span>
                    </div>
                    <span class="vs">vs</span>
                    <div class="heat-skater-mini outer">
                      <img :src="`/flags/${getOuterSkater(heat)?.country}.png`" class="mini-flag" onerror="this.style.display='none'" />
                      <span>{{ getOuterSkater(heat)?.lastName }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Live Standings (during race) -->
            <div v-else class="live-standings-panel">
              <h3>
                <i class="fa-solid fa-ranking-star"></i>
                Live Standings
              </h3>
              <div class="live-standings">
                <div
                  v-for="(result, idx) in liveStandings"
                  :key="result.skaterId"
                  :class="['standing-item', {
                    'just-finished': justFinishedSkaterIds.includes(result.skaterId)
                  }]"
                >
                  <span class="standing-pos" :class="getPosClass(idx + 1)">{{ idx + 1 }}</span>
                  <img :src="`/flags/${result.country}.png`" class="standing-flag" onerror="this.style.display='none'" />
                  <span class="standing-name">{{ result.lastName }}</span>
                  <span class="standing-time">{{ formatSkatingTime(result.time) }}</span>
                  <span class="standing-diff" v-if="idx > 0">
                    +{{ (result.time - liveStandings[0].time).toFixed(2) }}
                  </span>
                </div>
              </div>

              <!-- Remaining heats -->
              <div class="remaining-panel" v-if="heatsYetToRun.length > 0">
                <h4>Remaining Heats ({{ heatsYetToRun.length }})</h4>
                <div class="remaining-list">
                  <div
                    v-for="(heat, idx) in heatsYetToRun.slice(0, 3)"
                    :key="idx"
                    :class="['remaining-item', { 'next-up': idx === 0 }]"
                  >
                    <span class="heat-num">H{{ currentHeat + idx + 1 }}</span>
                    <span>{{ getInnerSkater(heat)?.lastName }} vs {{ getOuterSkater(heat)?.lastName }}</span>
                  </div>
                  <div v-if="heatsYetToRun.length > 3" class="more-teams">
                    +{{ heatsYetToRun.length - 3 }} more heats
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skater Modal (Create/Edit) -->
    <div v-if="showSkaterModal" class="modal-overlay" @click.self="closeSkaterModal">
      <div class="modal skater-modal fade-in">
        <div class="modal-header">
          <h2>{{ editingSkater ? 'Edit Skater' : 'Create New Skater' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeSkaterModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSaveSkater">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>First Name</label>
                <input type="text" v-model="skaterForm.first_name" required placeholder="First name" />
              </div>
              <div class="form-group flex-1">
                <label>Last Name</label>
                <input type="text" v-model="skaterForm.last_name" required placeholder="Last name" />
              </div>
              <div class="form-group flex-1">
                <label>Country</label>
                <select v-model="skaterForm.country" required>
                  <option value="">Select...</option>
                  <option v-for="(name, code) in countryNames" :key="code" :value="code">
                    {{ name }} ({{ code }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Specialty</label>
                <select v-model="skaterForm.specialty">
                  <option value="all-round">All-Round</option>
                  <option value="sprinter">Sprinter (500-1000m)</option>
                  <option value="distance">Distance (3000m+)</option>
                </select>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-header">
                <h3><i class="fa-solid fa-chart-line"></i> Skills</h3>
                <div class="randomize-buttons">
                  <button type="button" @click="randomizeSkills('random')" class="btn btn-xs btn-ghost" title="Random values">
                    <i class="fa-solid fa-shuffle"></i> Random
                  </button>
                  <button type="button" @click="randomizeSkills('strong')" class="btn btn-xs btn-ghost btn-strong" title="Strong (85-99)">
                    <i class="fa-solid fa-star"></i> Strong
                  </button>
                  <button type="button" @click="randomizeSkills('average')" class="btn btn-xs btn-ghost btn-average" title="Average (65-80)">
                    <i class="fa-solid fa-minus"></i> Average
                  </button>
                  <button type="button" @click="randomizeSkills('weak')" class="btn btn-xs btn-ghost btn-weak" title="Weak (50-65)">
                    <i class="fa-solid fa-circle-down"></i> Weak
                  </button>
                </div>
              </div>
              <div class="skills-grid">
                <div class="form-group">
                  <label>Acceleration ({{ skaterForm.skill_acceleration }})</label>
                  <input type="range" v-model.number="skaterForm.skill_acceleration" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Cornering ({{ skaterForm.skill_cornering }})</label>
                  <input type="range" v-model.number="skaterForm.skill_cornering" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Endurance ({{ skaterForm.skill_endurance }})</label>
                  <input type="range" v-model.number="skaterForm.skill_endurance" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Pace Control ({{ skaterForm.skill_pace_control }})</label>
                  <input type="range" v-model.number="skaterForm.skill_pace_control" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Consistency ({{ skaterForm.consistency }})</label>
                  <input type="range" v-model.number="skaterForm.consistency" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Form ({{ skaterForm.form }})</label>
                  <input type="range" v-model.number="skaterForm.form" min="50" max="99" />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeSkaterModal" class="btn btn-ghost">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="savingSkater">
                <i v-if="savingSkater" class="fa-solid fa-spinner fa-spin"></i>
                {{ editingSkater ? 'Save Changes' : 'Create Skater' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Skater Confirm -->
    <div v-if="showDeleteSkaterConfirm" class="modal-overlay" @click.self="showDeleteSkaterConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2>Delete Skater</h2>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ skaterToDelete?.first_name }} {{ skaterToDelete?.last_name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteSkaterConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleDeleteSkater" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Delete All Skaters Confirm -->
    <div v-if="showDeleteAllSkatersConfirm" class="modal-overlay" @click.self="showDeleteAllSkatersConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2>Delete All Skaters</h2>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete all {{ skaters.length }} skaters?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAllSkatersConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleDeleteAllSkaters" class="btn btn-danger">Delete All</button>
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
    <NamePicker v-model="showNamePicker" @select="handleNamePicked" />
  </template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSpeedSkatingStore } from '../stores/speedSkating'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'
import NamePicker from '../components/NamePicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const speedSkatingStore = useSpeedSkatingStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)
const world = ref(null)
const activeTab = ref('skaters')
const standingsTab = ref('overall')
const teams = computed(() => teamsStore.teams)
const teamStandings = computed(() => teamsStore.teamStandings)

// Skaters
const loadingSkaters = ref(false)
const generatingSkaters = ref(false)
const skaters = computed(() => speedSkatingStore.skaters)
const countryNames = computed(() => speedSkatingStore.countryNames)

// Season
const loadingSeason = ref(false)
const creatingSeason = ref(false)
const currentSeason = computed(() => speedSkatingStore.currentSeason)
const seasonEvents = computed(() => speedSkatingStore.events)
const seasonStandings = computed(() => speedSkatingStore.standings)
const disciplineStandings = computed(() => speedSkatingStore.disciplineStandings)

// Race modal
const showRaceModal = ref(false)
const selectedEvent = ref(null)
const simulating = ref(false)
const eventHeats = computed(() => speedSkatingStore.eventHeats)
const eventResults = computed(() => speedSkatingStore.eventResults)
const eventSkaters = computed(() => speedSkatingStore.eventSkaters)

// Animation state
const raceStarted = ref(false)
const currentHeat = ref(1)
const animating = ref(false)
const currentHeatSkaters = ref([])
const liveResults = ref([])
const justFinishedSkaterIds = ref([])
const innerSkaterPos = ref({ x: 250, y: 42 })
const outerSkaterPos = ref({ x: 250, y: 50 })
const innerDisplayTime = ref('0.00')
const outerDisplayTime = ref('0.00')
const animationTimer = ref(null)
const liveGap = ref(0) // Time gap between skaters
const leaderLane = ref(null) // 'inner' or 'outer'
const heatFinished = ref(false)
const innerFinalTime = ref(0)
const outerFinalTime = ref(0)
const innerOverallPosition = ref(null) // Projected overall position for inner skater
const outerOverallPosition = ref(null) // Projected overall position for outer skater
const innerLiveTime = ref(0) // Current live time for inner skater
const outerLiveTime = ref(0) // Current live time for outer skater
const currentLap = ref(0) // Current lap number
const totalLapsRef = ref(1) // Total laps for display

// Skater modal
const showSkaterModal = ref(false)
const showNamePicker = ref(false)
const editingSkater = ref(null)
const savingSkater = ref(false)
const skaterForm = ref({
  first_name: '',
  last_name: '',
  country: '',
  specialty: 'all-round',
  skill_acceleration: 70,
  skill_cornering: 70,
  skill_endurance: 70,
  skill_pace_control: 70,
  consistency: 70,
  form: 70
})

// Confirm modals
const showDeleteSkaterConfirm = ref(false)
const skaterToDelete = ref(null)
const showDeleteAllSkatersConfirm = ref(false)
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
  return seasonEvents.value.find(e => e.status !== 'completed')
})

const totalHeats = computed(() => eventHeats.value.length)

const hasNextHeat = computed(() => currentHeat.value < totalHeats.value)

const remainingHeats = computed(() => totalHeats.value - currentHeat.value)

const heatsYetToRun = computed(() => {
  return eventHeats.value.slice(currentHeat.value)
})

const liveStandings = computed(() => {
  return [...liveResults.value].sort((a, b) => a.time - b.time)
})

const raceFinished = computed(() => {
  return raceStarted.value && !hasNextHeat.value && !animating.value && liveResults.value.length > 0
})

const hasTwoSkaters = computed(() => {
  return currentHeatSkaters.value.length === 2 && currentHeatSkaters.value[0] && currentHeatSkaters.value[1]
})

const displayResults = computed(() => {
  if (selectedEvent.value?.status === 'completed' && !raceStarted.value) {
    return eventResults.value || []
  }
  return liveStandings.value
})

const currentStandings = computed(() => {
  if (standingsTab.value === 'overall') {
    return seasonStandings.value
  }

  // Aggregate distance standings into categories
  const ds = disciplineStandings.value || {}

  if (standingsTab.value === 'sprint') {
    // Sprint = 500m + 1000m combined
    return aggregateStandings([ds['500'] || [], ds['1000'] || []])
  } else if (standingsTab.value === 'middle') {
    // Middle = 1500m only
    return ds['1500'] || []
  } else if (standingsTab.value === 'long') {
    // Long = 3000m + 5000m + 10000m combined
    return aggregateStandings([ds['3000'] || [], ds['5000'] || [], ds['10000'] || []])
  }

  return []
})

// Helper to aggregate multiple distance standings into one
function aggregateStandings(standingsArrays) {
  const combined = {}

  for (const standings of standingsArrays) {
    for (const s of standings) {
      if (!combined[s.skaterId]) {
        combined[s.skaterId] = {
          skaterId: s.skaterId,
          firstName: s.firstName,
          lastName: s.lastName,
          country: s.country,
          points: 0,
          races: 0,
          wins: 0
        }
      }
      combined[s.skaterId].points += s.points || 0
      combined[s.skaterId].races += s.races || 0
      combined[s.skaterId].wins += s.wins || 0
    }
  }

  return Object.values(combined).sort((a, b) => b.points - a.points)
}

// Methods
function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function getStandingsTitle() {
  const titles = {
    'overall': 'World Cup Standings',
    'sprint': 'Sprint Standings (500m + 1000m)',
    'middle': 'Middle Distance Standings (1500m)',
    'long': 'Long Distance Standings (3000m+)'
  }
  return titles[standingsTab.value] || 'Standings'
}

function getSkillClass(value) {
  if (value >= 85) return 'skill-value elite'
  if (value >= 75) return 'skill-value good'
  if (value >= 65) return 'skill-value average'
  return 'skill-value weak'
}

function getPosClass(pos) {
  if (pos === 1) return 'gold'
  if (pos === 2) return 'silver'
  if (pos === 3) return 'bronze'
  return ''
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSkatingTime(seconds) {
  if (!seconds && seconds !== 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  if (mins > 0) {
    return `${mins}:${secs.padStart(5, '0')}`
  }
  return secs
}

function getEventPodium(event) {
  if (!event.results) return []
  try {
    const results = typeof event.results === 'string' ? JSON.parse(event.results) : event.results
    return results.slice(0, 3)
  } catch (e) {
    return []
  }
}

// Helper to get inner lane skater from heat
function getInnerSkater(heat) {
  if (!heat?.skaters) return null
  return heat.skaters.find(s => s.lane === 'inner')
}

// Helper to get outer lane skater from heat
function getOuterSkater(heat) {
  if (!heat?.skaters) return null
  return heat.skaters.find(s => s.lane === 'outer')
}

function getEventButtonClass(event) {
  if (event.status === 'completed') return 'btn-ghost'
  if (event.status === 'in_progress') return 'btn-primary'
  return 'btn-secondary'
}

function getEventButtonIcon(event) {
  if (event.status === 'completed') return 'fa-solid fa-eye'
  if (event.status === 'in_progress') return 'fa-solid fa-play'
  return 'fa-solid fa-flag-checkered'
}

function getEventButtonText(event) {
  if (event.status === 'completed') return 'View'
  if (event.status === 'in_progress') return 'Continue'
  return 'Start'
}

// Data loading
async function loadWorld() {
  try {
    const response = await authStore.api.get(`/worlds/${worldId.value}`)
    world.value = response.data.world
  } catch (err) {
    console.error('Error loading world:', err)
  }
}

async function loadSkaters() {
  loadingSkaters.value = true
  try {
    await speedSkatingStore.fetchSkaters(worldId.value)
  } catch (err) {
    console.error('Error loading skaters:', err)
  } finally {
    loadingSkaters.value = false
  }
}

async function loadSeason() {
  loadingSeason.value = true
  try {
    await speedSkatingStore.fetchCurrentSeason(worldId.value)
  } catch (err) {
    console.error('Error loading season:', err)
  } finally {
    loadingSeason.value = false
  }
}

async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'speedskating')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleGenerateSkaters() {
  generatingSkaters.value = true
  try {
    await speedSkatingStore.generateSkaters(worldId.value, 50)
  } catch (err) {
    console.error('Error generating skaters:', err)
  } finally {
    generatingSkaters.value = false
  }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    const currentYear = new Date().getFullYear()
    await speedSkatingStore.createSeason(worldId.value, currentYear)
  } catch (err) {
    console.error('Error creating season:', err)
  } finally {
    creatingSeason.value = false
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

  // Load event details
  try {
    await speedSkatingStore.fetchEvent(event.id)
    selectedEvent.value = speedSkatingStore.currentEvent
  } catch (err) {
    console.error('Error loading event:', err)
  }
}

function closeRaceModal() {
  showRaceModal.value = false
  selectedEvent.value = null
  resetRaceState()
}

function resetRaceState() {
  raceStarted.value = false
  currentHeat.value = 1
  animating.value = false
  currentHeatSkaters.value = []
  liveResults.value = []
  justFinishedSkaterIds.value = []
  innerSkaterPos.value = { x: 250, y: 42 }
  outerSkaterPos.value = { x: 250, y: 50 }
  innerDisplayTime.value = '0.00'
  outerDisplayTime.value = '0.00'
  liveGap.value = 0
  leaderLane.value = null
  heatFinished.value = false
  innerFinalTime.value = 0
  outerFinalTime.value = 0
  innerOverallPosition.value = null
  outerOverallPosition.value = null
  innerLiveTime.value = 0
  outerLiveTime.value = 0
  currentLap.value = 0
  totalLapsRef.value = 1
  if (animationTimer.value) {
    clearInterval(animationTimer.value)
    animationTimer.value = null
  }
}

async function startRace() {
  raceStarted.value = true
  currentHeat.value = 1
  liveResults.value = []

  await runHeat()
}

async function runNextHeat() {
  currentHeat.value++
  await runHeat()
}

async function runHeat() {
  const heat = eventHeats.value[currentHeat.value - 1]
  if (!heat) return

  // Get inner and outer skaters from heat.skaters array
  const innerSkater = heat.skaters?.find(s => s.lane === 'inner')
  const outerSkater = heat.skaters?.find(s => s.lane === 'outer')

  // Create skater objects for display (use eventSkaters from the event fetch)
  // For solo heats, one of these will be null
  const innerFull = innerSkater ? (eventSkaters.value.find(s => s.id === innerSkater.skaterId) || { first_name: innerSkater.firstName, last_name: innerSkater.lastName, country: innerSkater.country }) : null
  const outerFull = outerSkater ? (eventSkaters.value.find(s => s.id === outerSkater.skaterId) || { first_name: outerSkater.firstName, last_name: outerSkater.lastName, country: outerSkater.country }) : null

  currentHeatSkaters.value = [innerFull, outerFull]
  justFinishedSkaterIds.value = []
  animating.value = true

  // Reset positions and gap info
  innerSkaterPos.value = { x: 250, y: 42 }
  outerSkaterPos.value = { x: 250, y: 50 }
  innerDisplayTime.value = '0.00'
  outerDisplayTime.value = '0.00'
  liveGap.value = 0
  leaderLane.value = null
  heatFinished.value = false
  innerOverallPosition.value = null
  outerOverallPosition.value = null
  innerLiveTime.value = 0
  outerLiveTime.value = 0
  currentLap.value = 0
  totalLapsRef.value = 1

  // Simulate the heat on backend
  try {
    const response = await speedSkatingStore.simulateHeat(selectedEvent.value.id, currentHeat.value)

    // Get heat results from the simulated heat's skaters
    const heatResults = response.heat?.skaters || []

    // Animate the race
    await animateRace(heatResults)

    // Add results to live standings
    for (const result of heatResults) {
      if (result.time) {
        liveResults.value.push({
          skaterId: result.skaterId,
          firstName: result.firstName,
          lastName: result.lastName,
          country: result.country,
          time: result.time,
          lane: result.lane
        })
        justFinishedSkaterIds.value.push(result.skaterId)
      }
    }

  } catch (err) {
    console.error('Error simulating heat:', err)
  }

  animating.value = false
}

async function animateRace(heatResults) {
  const innerResult = heatResults.find(r => r.lane === 'inner')
  const outerResult = heatResults.find(r => r.lane === 'outer')

  const innerTime = innerResult?.time || 0
  const outerTime = outerResult?.time || 0

  // Check for solo heat (only one skater)
  const isSoloHeat = !innerTime || !outerTime
  const soloTime = innerTime || outerTime
  const soloLane = innerTime ? 'inner' : 'outer'

  // For two-skater heats
  const minTime = isSoloHeat ? soloTime : Math.min(innerTime, outerTime)
  const maxTime = isSoloHeat ? soloTime : Math.max(innerTime, outerTime)
  const timeDiff = maxTime - minTime

  // Store final times for display
  innerFinalTime.value = innerTime
  outerFinalTime.value = outerTime
  heatFinished.value = false

  // Determine who's faster (leader in heat) - for solo, it's the solo skater
  leaderLane.value = isSoloHeat ? soloLane : (innerTime <= outerTime ? 'inner' : 'outer')

  const distance = selectedEvent.value?.distance || 400
  const totalLaps = distance / 400
  totalLapsRef.value = Math.ceil(totalLaps)

  // Animation duration proportional to distance:
  // 500m: ~5-6s, 1000m: ~7-8s, 1500m: ~9-10s, 5000m+: ~12-15s
  const baseDuration = Math.min(distance / 80, 15) * 1000 // 6.25s for 500m, 12.5s for 1000m, etc.
  const animDuration = Math.max(baseDuration, 5000) // minimum 5 seconds
  const frameInterval = 50
  const totalFrames = animDuration / frameInterval

  // Generate random fluctuation points for race drama (only for two-skater heats)
  const numFluctuations = Math.floor(totalLaps * 2) + 2
  const fluctuations = []
  if (!isSoloHeat) {
    for (let i = 0; i < numFluctuations; i++) {
      fluctuations.push({
        point: (i + 0.5) / numFluctuations, // When in the race (0-1)
        swing: (Math.random() - 0.5) * timeDiff * 3 // How much the gap swings (can exceed real diff temporarily)
      })
    }
  }

  let frame = 0

  // Function to calculate overall position given a time, including both current heat skaters
  function calculateOverallPosition(myTime, otherTime) {
    let position = 1
    // Count existing results that are faster
    for (const result of liveResults.value) {
      if (result.time < myTime) {
        position++
      }
    }
    // Also compare against the other skater in this heat (only if they exist)
    if (otherTime && otherTime < myTime) {
      position++
    }
    return position
  }

  // Function to get fluctuating gap at a given progress point
  function getFluctuatingGap(progress) {
    if (isSoloHeat) return 0

    // Base gap that increases towards final gap
    const baseGap = timeDiff * progress

    // Add fluctuation based on nearby fluctuation points
    let fluctuation = 0
    for (const f of fluctuations) {
      // Gaussian-like influence from each fluctuation point
      const dist = Math.abs(progress - f.point)
      if (dist < 0.15) {
        const influence = Math.exp(-dist * dist * 100) * (1 - progress) // Reduces as we approach finish
        fluctuation += f.swing * influence
      }
    }

    // Combine base gap with fluctuation, but ensure it converges to real gap at the end
    const convergenceFactor = Math.pow(progress, 2) // Stronger convergence near end
    return baseGap + fluctuation * (1 - convergenceFactor)
  }

  return new Promise((resolve) => {
    animationTimer.value = setInterval(() => {
      frame++

      // Progress goes from 0 to 1 over the animation duration
      const animProgress = Math.min(frame / totalFrames, 1)

      // Calculate current lap
      currentLap.value = Math.min(Math.floor(animProgress * totalLaps) + 1, Math.ceil(totalLaps))

      // Handle solo heat differently
      if (isSoloHeat) {
        // Solo heat - just animate the one skater
        const currentTime = soloTime * animProgress

        if (soloLane === 'inner') {
          innerLiveTime.value = currentTime
          innerDisplayTime.value = formatSkatingTime(currentTime)
          innerOverallPosition.value = calculateOverallPosition(currentTime, 0)
          outerLiveTime.value = 0
          outerDisplayTime.value = '-'
          outerOverallPosition.value = null
        } else {
          outerLiveTime.value = currentTime
          outerDisplayTime.value = formatSkatingTime(currentTime)
          outerOverallPosition.value = calculateOverallPosition(currentTime, 0)
          innerLiveTime.value = 0
          innerDisplayTime.value = '-'
          innerOverallPosition.value = null
        }

        liveGap.value = 0

        // Animate solo skater position
        const lapProgress = animProgress * totalLaps
        const angle = lapProgress * Math.PI * 2

        if (soloLane === 'inner') {
          innerSkaterPos.value = {
            x: 250 + Math.sin(angle) * 200,
            y: 150 - Math.cos(angle) * 100
          }
        } else {
          outerSkaterPos.value = {
            x: 250 + Math.sin(angle) * 220,
            y: 150 - Math.cos(angle) * 120
          }
        }
      } else {
        // Two skaters - full animation with gap fluctuation
        const currentGap = getFluctuatingGap(animProgress)

        // Calculate live times with fluctuation
        const fasterTime = minTime * animProgress
        const slowerTime = fasterTime + Math.abs(currentGap)

        // Assign to inner/outer based on who's actually faster
        if (innerTime <= outerTime) {
          innerLiveTime.value = fasterTime
          if (currentGap >= 0) {
            outerLiveTime.value = slowerTime
          } else {
            outerLiveTime.value = fasterTime
            innerLiveTime.value = fasterTime + Math.abs(currentGap)
          }
        } else {
          outerLiveTime.value = fasterTime
          if (currentGap >= 0) {
            innerLiveTime.value = slowerTime
          } else {
            innerLiveTime.value = fasterTime
            outerLiveTime.value = fasterTime + Math.abs(currentGap)
          }
        }

        // Update displayed times
        innerDisplayTime.value = formatSkatingTime(innerLiveTime.value)
        outerDisplayTime.value = formatSkatingTime(outerLiveTime.value)

        // Calculate live gap between the two skaters
        liveGap.value = Math.abs(innerLiveTime.value - outerLiveTime.value)

        // Determine who's leading in this heat (can change during race!)
        leaderLane.value = innerLiveTime.value <= outerLiveTime.value ? 'inner' : 'outer'

        // Calculate overall positions including comparison between heat skaters
        innerOverallPosition.value = calculateOverallPosition(innerLiveTime.value, outerLiveTime.value)
        outerOverallPosition.value = calculateOverallPosition(outerLiveTime.value, innerLiveTime.value)

        // Calculate position on oval based on distance covered
        const avgLapTime = minTime / totalLaps
        const avgSpeed = 400 / avgLapTime
        const gapInMeters = avgSpeed * liveGap.value
        const gapInLaps = gapInMeters / 400

        // Leader's position (full progress)
        const leaderLapProgress = animProgress * totalLaps

        // Calculate each skater's lap progress
        let innerLapProgress, outerLapProgress
        if (leaderLane.value === 'inner') {
          innerLapProgress = leaderLapProgress
          outerLapProgress = leaderLapProgress - gapInLaps
        } else {
          outerLapProgress = leaderLapProgress
          innerLapProgress = leaderLapProgress - gapInLaps
        }

        // Ensure progress doesn't go negative
        innerLapProgress = Math.max(0, innerLapProgress)
        outerLapProgress = Math.max(0, outerLapProgress)

        const innerAngle = innerLapProgress * Math.PI * 2
        const outerAngle = outerLapProgress * Math.PI * 2

        // Inner lane (smaller radius)
        innerSkaterPos.value = {
          x: 250 + Math.sin(innerAngle) * 200,
          y: 150 - Math.cos(innerAngle) * 100
        }

        // Outer lane (larger radius)
        outerSkaterPos.value = {
          x: 250 + Math.sin(outerAngle) * 220,
          y: 150 - Math.cos(outerAngle) * 120
        }
      }

      // Check if animation complete
      if (frame >= totalFrames) {
        clearInterval(animationTimer.value)
        animationTimer.value = null

        // Set final times (exact results)
        if (isSoloHeat) {
          if (soloLane === 'inner') {
            innerDisplayTime.value = formatSkatingTime(innerTime)
            innerLiveTime.value = innerTime
            innerOverallPosition.value = calculateOverallPosition(innerTime, 0)
          } else {
            outerDisplayTime.value = formatSkatingTime(outerTime)
            outerLiveTime.value = outerTime
            outerOverallPosition.value = calculateOverallPosition(outerTime, 0)
          }
          liveGap.value = 0
        } else {
          innerDisplayTime.value = formatSkatingTime(innerTime)
          outerDisplayTime.value = formatSkatingTime(outerTime)
          innerLiveTime.value = innerTime
          outerLiveTime.value = outerTime
          liveGap.value = Math.abs(innerTime - outerTime)
          innerOverallPosition.value = calculateOverallPosition(innerTime, outerTime)
          outerOverallPosition.value = calculateOverallPosition(outerTime, innerTime)
          leaderLane.value = innerTime <= outerTime ? 'inner' : 'outer'
        }

        // Final lap
        currentLap.value = Math.ceil(totalLaps)

        heatFinished.value = true

        resolve()
      }
    }, frameInterval)
  })
}

async function finishRace() {
  simulating.value = true
  try {
    await speedSkatingStore.simulateAllHeats(selectedEvent.value.id)
    await loadSeason()
    closeRaceModal()
  } catch (err) {
    console.error('Error finishing race:', err)
  } finally {
    simulating.value = false
  }
}

// Skater CRUD
function openAddSkaterModal() {
  editingSkater.value = null
  skaterForm.value = {
    first_name: '',
    last_name: '',
    country: '',
    specialty: 'all-round',
    skill_acceleration: 70,
    skill_cornering: 70,
    skill_endurance: 70,
    skill_pace_control: 70,
    consistency: 70,
    form: 70
  }
  showSkaterModal.value = true
}

function openEditSkaterModal(skater) {
  editingSkater.value = skater
  skaterForm.value = {
    first_name: skater.first_name,
    last_name: skater.last_name,
    country: skater.country,
    specialty: skater.specialty || 'all-round',
    skill_acceleration: skater.skill_acceleration,
    skill_cornering: skater.skill_cornering,
    skill_endurance: skater.skill_endurance,
    skill_pace_control: skater.skill_pace_control,
    consistency: skater.consistency,
    form: skater.form
  }
  showSkaterModal.value = true
}

function handleNamePicked(data) {
  skaterForm.value.first_name = data.first_name
  skaterForm.value.last_name = data.last_name
  if (data.country_code) skaterForm.value.country = data.country_code
}

function closeSkaterModal() {
  showSkaterModal.value = false
  editingSkater.value = null
}

async function handleSaveSkater() {
  savingSkater.value = true
  try {
    if (editingSkater.value) {
      await speedSkatingStore.updateSkater(editingSkater.value.id, skaterForm.value)
    } else {
      await speedSkatingStore.createSkater(worldId.value, skaterForm.value)
    }
    closeSkaterModal()
  } catch (err) {
    console.error('Error saving skater:', err)
  } finally {
    savingSkater.value = false
  }
}

function confirmDeleteSkater(skater) {
  skaterToDelete.value = skater
  showDeleteSkaterConfirm.value = true
}

async function handleDeleteSkater() {
  try {
    await speedSkatingStore.deleteSkater(skaterToDelete.value.id)
    showDeleteSkaterConfirm.value = false
    skaterToDelete.value = null
  } catch (err) {
    console.error('Error deleting skater:', err)
  }
}

async function handleDeleteAllSkaters() {
  try {
    await speedSkatingStore.deleteAllSkaters(worldId.value)
    showDeleteAllSkatersConfirm.value = false
  } catch (err) {
    console.error('Error deleting all skaters:', err)
  }
}

async function handleResetSeason() {
  try {
    await speedSkatingStore.resetSeason(currentSeason.value.id)
    showResetConfirm.value = false
  } catch (err) {
    console.error('Error resetting season:', err)
  }
}

function randomizeSkills(type) {
  let min, max
  switch (type) {
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

  const rand = () => Math.floor(Math.random() * (max - min + 1)) + min
  skaterForm.value.skill_acceleration = rand()
  skaterForm.value.skill_cornering = rand()
  skaterForm.value.skill_endurance = rand()
  skaterForm.value.skill_pace_control = rand()
  skaterForm.value.consistency = rand()
  skaterForm.value.form = rand()
}

// Navigation
function goBack() {
  router.push(`/world/${worldId.value}`)
}

async function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// Lifecycle
onMounted(async () => {
  await loadWorld()
  await Promise.all([
    loadSkaters(),
    weekStatusStore.fetchWeekStatus(worldId.value)
  ])
})
</script>

<style scoped>
/* Base styles */
.speed-skating-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
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
  color: #60a5fa;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.world-name, .sport-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.separator {
  color: #cbd5e1;
  font-size: 0.7rem;
}

.sport-name {
  color: #60a5fa;
  font-weight: 500;
}

.world-name {
  color: #64748b;
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
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
}

.nav-tab-icon {
  font-size: 1.1rem;
}

.nav-tab-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.nav-tab-label {
  font-weight: 500;
}

.nav-tab-badge, .nav-tab-count {
  font-size: 0.75rem;
  opacity: 0.7;
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

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Section header */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.section-title .count {
  font-weight: 400;
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
}

.btn-ghost:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.text-danger {
  color: #ef4444;
}

/* Loading & Empty states */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.warning-text {
  color: #f59e0b;
  margin-top: 1rem;
  font-size: 0.875rem;
}

/* Skaters table */
.skaters-table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.skaters-table {
  width: 100%;
  border-collapse: collapse;
}

.skaters-table th,
.skaters-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.skaters-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skater-row {
  cursor: pointer;
  transition: background 0.2s;
}

.skater-row:hover {
  background: #f8fafc;
}

.col-name {
  min-width: 180px;
}

.col-country {
  min-width: 100px;
}

.col-specialty {
  min-width: 100px;
}

.col-skill {
  width: 50px;
  text-align: center;
}

.col-actions {
  width: 80px;
}

.skater-name {
  font-weight: 500;
  color: #1e293b;
}

.skater-flag {
  width: 20px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.specialty-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.specialty-badge.sprinter {
  background: #fee2e2;
  color: #dc2626;
}

.specialty-badge.distance {
  background: #dcfce7;
  color: #16a34a;
}

.specialty-badge.all-round {
  background: #dbeafe;
  color: #2563eb;
}

.skill-value {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.skill-value.elite {
  background: #dcfce7;
  color: #16a34a;
}

.skill-value.good {
  background: #dbeafe;
  color: #2563eb;
}

.skill-value.average {
  background: #fef3c7;
  color: #d97706;
}

.skill-value.weak {
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  color: #ef4444;
}

/* Season content */
.season-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.season-info h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.skating-icon {
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
  transition: width 0.3s;
}

/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.calendar-event {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
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

.calendar-event.is-locked { opacity: 0.6; cursor: not-allowed; position: relative; }
.calendar-event.is-locked:hover { transform: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.lock-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(100, 116, 139, 0.85); border-radius: 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; z-index: 10; color: white; }
.lock-overlay i { font-size: 1.5rem; }
.lock-overlay span { font-size: 0.875rem; font-weight: 600; }

.calendar-event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.event-number-badge {
  background: #3b82f6;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.event-type-badge, .distance-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  background: #dbeafe;
  color: #1e40af;
}

.event-status-badge {
  margin-left: auto;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
}

.event-status-badge.scheduled {
  background: #f1f5f9;
  color: #64748b;
}

.event-status-badge.completed {
  background: #dcfce7;
  color: #16a34a;
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
  border-radius: 4px;
}

.location-name {
  font-weight: 600;
  display: block;
}

.location-country {
  font-size: 0.8rem;
  color: #94a3b8;
}

.event-track-info {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.altitude-info {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.event-date-display {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  padding: 0.25rem 0;
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

.podium-pos.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1e293b;
}

.podium-pos.silver {
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
  color: #1e293b;
}

.podium-pos.bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}

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

/* Standings tabs */
.standings-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.standings-tab {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.standings-tab:hover {
  border-color: #3b82f6;
  color: #1e293b;
}

.standings-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* Standings compact */
.standings-compact {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  font-size: 1rem;
  color: #fbbf24;
}

.races-info {
  font-size: 0.8rem;
  color: #94a3b8;
}

.no-standings {
  text-align: center;
  padding: 2rem;
  color: #64748b;
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
  transition: background 0.2s;
}

.standing-row:hover {
  background: #f8fafc;
}

.standing-row.top-3 {
  background: rgba(251, 191, 36, 0.05);
}

.standing-rank {
  width: 28px;
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

.medal.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1e293b;
}

.medal.silver {
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
  color: #1e293b;
}

.medal.bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}

.rank-num {
  color: #94a3b8;
  font-weight: 500;
}

.standing-flag-sm {
  width: 20px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
}

.standing-info {
  flex: 1;
  min-width: 0;
}

.standing-name-compact {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standing-data {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.standing-pts {
  font-weight: 700;
  color: #fbbf24;
}

.standing-races-sm {
  font-size: 0.75rem;
  color: #64748b;
}

/* Modal overlay */
.modal-overlay, .race-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Race modal */
.race-animation-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.race-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.race-venue {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.venue-flag {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
}

.venue-info h2 {
  margin: 0;
  font-size: 1.25rem;
}

.venue-details {
  font-size: 0.875rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.heat-indicator {
  display: flex;
  gap: 0.5rem;
}

.heat-badge {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.race-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Track section */
.track-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  gap: 1rem;
}

.track-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skating-track-svg {
  width: 100%;
  max-width: 500px;
  height: auto;
}

/* Heat timing display */
.heat-timing {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.heat-skaters {
  display: flex;
  justify-content: space-around;
  gap: 2rem;
}

.heat-skater {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.lane-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.lane-indicator.inner {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.lane-indicator.outer {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.skater-flag-lg {
  width: 32px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
}

.skater-name-lg {
  font-weight: 600;
  font-size: 0.9rem;
}

.live-time {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: monospace;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: #f1f5f9;
}

.live-time.inner {
  color: #60a5fa;
}

.live-time.outer {
  color: #f87171;
}

.live-time.running {
  animation: pulse 1s infinite;
}

.live-time.winner {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Heat skater leader styling */
.heat-skater.leader {
  background: rgba(34, 197, 94, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.skater-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
}

.position-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
}

.position-badge.leader {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.position-badge.podium {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.position-badge.behind {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

/* Race Status Bar */
.race-status-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 0.75rem 1.5rem;
  background: #f1f5f9;
  border-radius: 0.5rem;
  margin-top: 0.75rem;
  border: 1px solid #e2e8f0;
}

.lap-counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #60a5fa;
  font-weight: 600;
  font-size: 1rem;
}

.lap-counter i {
  font-size: 1.1rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.lap-text {
  font-family: monospace;
}

.live-gap-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
}

.live-gap-indicator.has-gap {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.live-gap-indicator strong {
  font-family: monospace;
  font-size: 1.1rem;
}

.solo-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 0.25rem;
}

.solo-indicator i {
  color: #64748b;
}

.distance-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Gap display between skaters */
.gap-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 0.5rem;
  min-width: 80px;
}

.gap-value {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: monospace;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.gap-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Time difference for loser */
.time-diff {
  font-size: 0.9rem;
  font-weight: 600;
  font-family: monospace;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.time-diff.behind {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 0;
}

.btn-start {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.btn-next {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 0.75rem 1.5rem;
}

.btn-finish {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.75rem 1.5rem;
}

/* Standings section */
.standings-section {
  width: 320px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
}

.start-list-panel, .live-standings-panel {
  padding: 1rem;
}

.start-list-panel h3, .live-standings-panel h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.heats-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.heat-item {
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.heat-item.current {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
}

.heat-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  display: block;
  margin-bottom: 0.5rem;
}

.heat-pairing {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.heat-skater-mini {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mini-flag {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

.vs {
  color: #64748b;
  font-size: 0.7rem;
}

.heat-skater-mini.inner {
  color: #60a5fa;
}

.heat-skater-mini.outer {
  color: #f87171;
}

/* Live standings */
.live-standings {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.standing-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.standing-item.just-finished {
  background: rgba(34, 197, 94, 0.1);
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% { background: rgba(34, 197, 94, 0.3); }
  100% { background: rgba(34, 197, 94, 0.1); }
}

.standing-pos {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.2);
}

.standing-pos.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1e293b;
}

.standing-pos.silver {
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
  color: #1e293b;
}

.standing-pos.bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}

.standing-flag {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

.standing-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standing-time {
  font-family: monospace;
  font-weight: 600;
}

.standing-diff {
  font-size: 0.7rem;
  color: #f87171;
}

/* Remaining panel */
.remaining-panel {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.remaining-panel h4 {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.5rem;
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
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 0.25rem;
}

.remaining-item.next-up {
  color: #60a5fa;
  font-weight: 500;
}

.heat-num {
  font-weight: 600;
  width: 24px;
}

.more-teams {
  font-size: 0.75rem;
  color: #64748b;
  padding: 0.25rem;
}

/* Results section */
.run-results-section {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
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
  gap: 0.5rem;
  font-size: 1.1rem;
}

.run-results-table {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.results-table-header {
  display: grid;
  grid-template-columns: 50px 1fr 100px 80px;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
}

.results-table-row {
  display: grid;
  grid-template-columns: 50px 1fr 100px 80px;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
}

.results-table-row:last-child {
  border-bottom: none;
}

.results-table-row.podium {
  background: rgba(251, 191, 36, 0.05);
}

.col-pos {
  font-weight: 700;
  font-size: 0.9rem;
}

.col-pos.gold { color: #fbbf24; }
.col-pos.silver { color: #94a3b8; }
.col-pos.bronze { color: #d97706; }

.col-skater {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-flag {
  width: 20px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
}

.result-name {
  font-weight: 500;
}

.col-time {
  font-family: monospace;
  font-weight: 600;
}

.col-diff {
  font-size: 0.85rem;
  color: #f87171;
}

.col-diff.leader {
  color: #4ade80;
}

/* Modal */
.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Form styles */
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

.form-group.flex-1 {
  flex: 1;
}

.form-group.flex-2 {
  flex: 2;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #94a3b8;
}

.form-group input[type="text"],
.form-group select {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #1e293b;
  font-size: 0.875rem;
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
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.form-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.form-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #94a3b8;
}

.randomize-buttons {
  display: flex;
  gap: 0.25rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Confirm modal */
.confirm-modal {
  max-width: 400px;
}

.confirm-modal p {
  margin-bottom: 0.5rem;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .race-content {
    flex-direction: column;
  }

  .standings-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e2e8f0;
    max-height: 250px;
  }

  .heat-skaters {
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    flex-direction: column;
  }

  .skills-grid {
    grid-template-columns: 1fr;
  }

  .nav-tabs {
    overflow-x: auto;
  }

  .standings-tabs {
    overflow-x: auto;
  }
}

/* Team Standings Styles */
.standings-compact.teams-panel {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.standings-tab.teams.active {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border-color: #16a34a;
}

.standings-tab.teams.active i {
  color: white;
}

.switch-count {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.5rem;
}

.standings-tab.teams.active .switch-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
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

.standing-firstname {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
