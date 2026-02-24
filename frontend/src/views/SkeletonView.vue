<template>
  <div class="sport-page skeleton">
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
            <i class="fa-solid fa-skull"></i>
            Skeleton
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
              <i class="fa-solid fa-skull"></i>
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
              <i class="fa-solid fa-skull"></i>
              Skeleton Athletes
              <span class="count" v-if="athletes.length">({{ athletes.length }})</span>
            </h2>
            <div class="actions">
              <button @click="openAddAthleteModal" class="btn btn-primary">
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
              <i class="fa-solid fa-skull"></i>
            </div>
            <h3>No Athletes Yet</h3>
            <p>Create your first skeleton athlete to get started.</p>
            <button @click="openAddAthleteModal" class="btn btn-primary" style="margin-top: 0.5rem;">
              <i class="fa-solid fa-plus"></i> Create Athlete
            </button>
          </div>

          <div v-else class="athletes-grid">
            <div
              v-for="athlete in athletes"
              :key="athlete.id"
              class="athlete-card"
              @click="openEditAthleteModal(athlete)"
            >
              <div class="athlete-card-header">
                <img :src="`/flags/${athlete.country}.png`" class="athlete-flag" />
                <div class="athlete-info">
                  <h3 class="athlete-name">{{ athlete.last_name }}</h3>
                  <span class="athlete-firstname">{{ athlete.first_name }}</span>
                </div>
              </div>
              <div class="athlete-skills">
                <div class="skill">
                  <span class="skill-label">Start</span>
                  <span :class="getSkillClass(athlete.skill_start)">{{ athlete.skill_start }}</span>
                </div>
                <div class="skill">
                  <span class="skill-label">Steering</span>
                  <span :class="getSkillClass(athlete.skill_steering)">{{ athlete.skill_steering }}</span>
                </div>
                <div class="skill">
                  <span class="skill-label">Lines</span>
                  <span :class="getSkillClass(athlete.skill_lines)">{{ athlete.skill_lines }}</span>
                </div>
                <div class="skill">
                  <span class="skill-label">CON</span>
                  <span :class="getSkillClass(athlete.consistency)">{{ athlete.consistency }}</span>
                </div>
              </div>
              <div class="athlete-card-actions" @click.stop>
                <button @click="openEditAthleteModal(athlete)" class="btn btn-ghost btn-sm" title="Edit">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button @click="confirmDeleteAthlete(athlete)" class="btn btn-ghost btn-sm delete-btn" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
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
            <p>Start a new Skeleton World Cup season to begin competing.</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason || athletes.length === 0">
              <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingSeason ? 'Creating...' : 'Start New Season' }}
            </button>
            <p v-if="athletes.length === 0" class="warning-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Create athletes first before starting a season.
            </p>
          </div>

          <div v-else class="season-content">
            <div class="season-header-card">
              <div class="season-info">
                <h2><i class="fa-solid fa-trophy"></i> Skeleton World Cup {{ currentSeason.name }}</h2>
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
                  Next Race
                </button>
                <button @click="showResetSeasonConfirm = true" class="btn btn-ghost text-danger">
                  <i class="fa-solid fa-rotate-left"></i>
                  Reset
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
                  <span class="event-type-badge" :class="event.runs === 4 ? 'championship' : 'standard'">
                    <i class="fa-solid fa-skull"></i>
                    {{ event.runs === 4 ? '4 Runs' : '2 Runs' }}
                  </span>
                  <span class="event-status-badge" :class="event.status">
                    <i v-if="event.status === 'completed'" class="fa-solid fa-check"></i>
                    <i v-else-if="event.status === 'in_progress' || event.status.includes('run')" class="fa-solid fa-play"></i>
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
                    <span class="track-length">{{ event.track_length }}m</span>
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

        <!-- Standings Tab -->
        <div v-if="activeTab === 'standings'" class="tab-content fade-in">
          <div class="standings-compact">
            <!-- Standings View Switcher -->
            <div class="standings-switcher">
              <button
                :class="['standings-switch', { active: standingsView === 'individual' }]"
                @click="standingsView = 'individual'"
              >
                <i class="fa-solid fa-user"></i>
                <span>Individual</span>
              </button>
              <button
                :class="['standings-switch teams', { active: standingsView === 'teams' }]"
                @click="standingsView = 'teams'; loadTeamStandings()"
              >
                <i class="fa-solid fa-people-group"></i>
                <span>Teams</span>
              </button>
            </div>

            <!-- Individual Standings -->
            <div v-if="standingsView === 'individual'" class="standings-panel">
              <div v-if="seasonStandings.length === 0" class="no-standings">
                <i class="fa-solid fa-trophy"></i>
                <p>No standings yet. Complete some events first!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(standing, index) in seasonStandings"
                  :key="standing.athleteId"
                  :class="['standing-row', { 'top-3': index < 3 }]"
                >
                  <div class="standing-rank">
                    <span v-if="index < 3" :class="['medal', index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze']">
                      {{ index + 1 }}
                    </span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <img :src="`/flags/${standing.country}.png`" class="standing-flag-sm" />
                  <div class="standing-info">
                    <span class="standing-name-compact">{{ standing.lastName }}</span>
                    <span class="standing-firstname">{{ standing.firstName }}</span>
                  </div>
                  <div class="standing-stats">
                    <span class="standing-points">{{ standing.points }} pts</span>
                    <span class="standing-races">{{ standing.races }} races</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Standings -->
            <div v-if="standingsView === 'teams'" class="standings-panel teams-panel">
              <div v-if="teamStandings.length === 0" class="no-standings">
                <i class="fa-solid fa-people-group"></i>
                <p>No team standings yet. Complete some events first!</p>
              </div>
              <div v-else class="standings-list-compact">
                <div
                  v-for="(team, index) in teamStandings"
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
                    <span class="standing-firstname">{{ team.athleteCount }} athletes</span>
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

      </div>
    </main>

    <!-- Race Modal -->
    <div v-if="showRaceModal" class="modal-overlay" @click.self="closeRaceModal">
      <div class="modal race-modal fade-in">
        <div class="modal-header">
          <div class="race-header-info">
            <img :src="`/flags/${selectedEvent?.country}.png`" class="event-flag" />
            <div>
              <h2>{{ selectedEvent?.location }}</h2>
              <span class="event-subtitle">{{ selectedEvent?.name }}</span>
            </div>
          </div>
          <button @click="closeRaceModal" class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="race-modal-content">
          <!-- Left: Animation Area -->
          <div class="animation-section">
            <!-- Track SVG - Skeleton style (compact) -->
            <div class="track-container">
              <svg viewBox="0 0 400 140" class="track-svg">
                <defs>
                  <linearGradient id="skeletonIceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#fef9c3" />
                    <stop offset="100%" style="stop-color:#fef08a" />
                  </linearGradient>
                  <filter id="skeletonGlow">
                    <feGaussianBlur stdDeviation="1.5" result="glow" />
                    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <rect x="0" y="0" width="400" height="140" fill="url(#skeletonIceGradient)" />
                <!-- Compact track path -->
                <path d="M 15 25 Q 50 35, 80 55 Q 120 80, 160 75 Q 200 70, 240 90 Q 290 115, 340 105 Q 370 98, 390 115" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round" />
                <path d="M 15 25 Q 50 35, 80 55 Q 120 80, 160 75 Q 200 70, 240 90 Q 290 115, 340 105 Q 370 98, 390 115" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,2" />
                <!-- Start/Finish markers -->
                <rect x="8" y="18" width="18" height="6" fill="#22c55e" rx="2" />
                <text x="17" y="14" text-anchor="middle" fill="#22c55e" font-size="6" font-weight="bold">START</text>
                <line x1="385" y1="108" x2="395" y2="122" stroke="#ef4444" stroke-width="2" />
                <text x="390" y="132" text-anchor="middle" fill="#ef4444" font-size="6" font-weight="bold">FINISH</text>
                <!-- Animated Skeleton Sled (head first) -->
                <g class="skeleton-sled" :transform="`translate(${sledPosition.x * 0.8}, ${sledPosition.y * 0.47}) rotate(${sledRotation})`">
                  <rect x="-6" y="-1.5" width="12" height="3" rx="1.5" fill="#ca8a04" filter="url(#skeletonGlow)" />
                  <ellipse cx="-1" cy="0" rx="4" ry="2" fill="#eab308" />
                  <circle cx="-5" cy="-0.5" r="1.5" fill="#fef3c7" />
                  <rect v-if="animating" x="8" y="-1" width="5" height="2" rx="1" fill="#ca8a04" opacity="0.4" />
                </g>
              </svg>
            </div>

            <!-- Compact Timing Display -->
            <div class="timing-display">
              <div class="timing-row">
                <div class="current-athlete" v-if="currentAthlete">
                  <img :src="`/flags/${currentAthlete.country}.png`" class="athlete-flag-sm" />
                  <span class="athlete-name-sm">{{ currentAthlete.last_name }}</span>
                  <span class="bib-number">{{ currentBib }}</span>
                </div>
                <div class="live-time" :class="{ running: animating, finished: currentResult }">
                  <span class="time-value">{{ displayTime }}</span>
                </div>
                <div class="result-info" v-if="currentResult && !animating">
                  <span class="position-badge" :class="getPosClass(currentResult.position)" v-if="!currentResult.dnf">{{ currentResult.position }}</span>
                  <span class="dnf-badge" v-else>DNF</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Right: Final Results (completed race) -->
          <div v-if="selectedEvent?.status === 'completed' && !raceStarted" class="standings-section">
            <div class="final-results-panel">
              <h3><i class="fa-solid fa-trophy"></i> Final Results</h3>
              <div class="final-results-list">
                <div
                  v-for="(result, idx) in completedRaceResults"
                  :key="result.athleteId"
                  :class="['standing-item', { 'podium': idx < 3 }]"
                >
                  <span class="standing-pos" :class="getPosClass(idx + 1)">{{ idx + 1 }}</span>
                  <img :src="`/flags/${result.country}.png`" class="standing-flag" />
                  <div class="standing-info">
                    <span class="standing-name">{{ result.lastName }}</span>
                    <span class="standing-wc-rank" v-if="getAthleteWCPosition(result.athleteId)">
                      WC #{{ getAthleteWCPosition(result.athleteId) }}
                    </span>
                  </div>
                  <div class="standing-times">
                    <span class="standing-time-main">{{ formatTime(result.total_time || result.time) }}</span>
                    <span class="standing-runs" v-if="result.run1_time">
                      R1: {{ formatTime(result.run1_time) }}
                      <template v-if="result.run2_time"> | R2: {{ formatTime(result.run2_time) }}</template>
                    </span>
                  </div>
                  <span :class="['standing-diff', getDiffClass(getCompletedTimeBehind(result, idx))]" v-if="idx > 0 && !result.dnf">
                    +{{ getCompletedTimeBehind(result, idx) }}
                  </span>
                  <span class="standing-leader" v-else-if="idx === 0 && !result.dnf"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Standings & Start List (during race) -->
          <div v-if="!(selectedEvent?.status === 'completed' && !raceStarted)" class="standings-section">
            <!-- Start List (before race starts) -->
            <div v-if="!raceStarted" class="start-list-panel">
              <h3><i class="fa-solid fa-list-ol"></i> Start Order</h3>
              <div class="start-list">
                <div v-for="(athlete, idx) in startOrder" :key="athlete.id" class="start-item">
                  <span class="start-bib">{{ idx + 1 }}</span>
                  <img :src="`/flags/${athlete.country}.png`" class="start-flag" />
                  <span class="start-name">{{ athlete.last_name }}</span>
                </div>
              </div>
            </div>

            <!-- Live Standings (during race) -->
            <div v-else class="live-standings-panel">
              <h3>
                <i class="fa-solid fa-ranking-star"></i>
                {{ currentRun === 1 ? 'Run 1' : `After Run ${currentRun}` }}
              </h3>
              <div class="live-standings">
                <div
                  v-for="(result, idx) in liveStandings"
                  :key="result.athleteId"
                  :class="['standing-item', { 'current': result.athleteId === currentAthlete?.id, 'just-finished': result.athleteId === lastFinishedAthleteId }]"
                >
                  <span class="standing-pos" :class="getPosClass(idx + 1)">{{ idx + 1 }}</span>
                  <img :src="`/flags/${result.country}.png`" class="standing-flag" />
                  <div class="standing-info">
                    <span class="standing-name">{{ result.lastName }}</span>
                    <span class="standing-wc-rank" v-if="getAthleteWCPosition(result.athleteId)">
                      WC #{{ getAthleteWCPosition(result.athleteId) }}
                    </span>
                  </div>
                  <div class="standing-times">
                    <span class="standing-time-main">{{ currentRun >= 2 && result.totalTime ? formatTime(result.totalTime) : result.timeFormatted }}</span>
                    <span class="standing-time-r1" v-if="currentRun >= 2 && result.run1Time">(R1: {{ formatTime(result.run1Time) }})</span>
                  </div>
                  <span :class="['standing-diff', getDiffClass(getTimeBehindLeader(result, idx))]" v-if="idx > 0 && !result.dnf">+{{ getTimeBehindLeader(result, idx) }}</span>
                  <span class="standing-leader" v-else-if="idx === 0 && !result.dnf"><i class="fa-solid fa-crown"></i></span>
                </div>
              </div>

              <!-- Remaining athletes -->
              <div class="remaining-panel" v-if="athletesYetToRun.length > 0">
                <h4>Yet to run ({{ athletesYetToRun.length }})</h4>
                <div class="remaining-list">
                  <div v-for="athlete in athletesYetToRun.slice(0, 3)" :key="athlete.id" :class="['remaining-item', { 'next-up': athlete.id === nextAthlete?.id }]">
                    <img :src="`/flags/${athlete.country}.png`" class="remaining-flag" />
                    <span>{{ athlete.last_name }}</span>
                  </div>
                  <div v-if="athletesYetToRun.length > 3" class="more-athletes">+{{ athletesYetToRun.length - 3 }} more</div>
                </div>
              </div>
            </div>

            <!-- Action Buttons - Always visible when needed -->
            <div class="action-buttons">
              <button v-if="raceStarted && !animating && hasNextAthlete" @click="goToNextAthlete" class="btn btn-next">
                <i class="fa-solid fa-forward"></i> Next ({{ remainingAthletes }})
              </button>
              <button v-if="raceStarted && !hasNextAthlete && !animating && !runFinished" @click="finishRun" class="btn btn-finish">
                <i class="fa-solid fa-check"></i> {{ isLastRun ? 'Complete Race' : `Finish Run ${currentRun}` }}
              </button>
              <button v-if="!raceStarted && selectedEvent?.status === 'scheduled'" @click="startRace(1)" class="btn btn-start" :disabled="athletes.length === 0">
                <i class="fa-solid fa-flag-checkered"></i> Start Run 1
              </button>
              <button v-if="!raceStarted && selectedEvent?.status === 'run1_completed'" @click="startRace(2)" class="btn btn-start">
                <i class="fa-solid fa-flag-checkered"></i> Start Run 2
              </button>
              <button v-if="!raceStarted && selectedEvent?.status === 'run2_completed'" @click="startRace(3)" class="btn btn-start">
                <i class="fa-solid fa-flag-checkered"></i> Start Run 3
              </button>
              <button v-if="!raceStarted && selectedEvent?.status === 'run3_completed'" @click="startRace(4)" class="btn btn-start">
                <i class="fa-solid fa-flag-checkered"></i> Start Run 4
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Athlete Modal (Create/Edit) -->
    <div v-if="showAthleteModal" class="modal-overlay" @click.self="closeAthleteModal">
      <div class="modal athlete-modal fade-in">
        <div class="modal-header">
          <h2>{{ editingAthlete ? 'Edit Athlete' : 'Create New Athlete' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeAthleteModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSaveAthlete">
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" v-model="athleteForm.first_name" required placeholder="First name" />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" v-model="athleteForm.last_name" required placeholder="Last name" />
              </div>
              <div class="form-group">
                <label>Country</label>
                <select v-model="athleteForm.country" required>
                  <option value="">Select...</option>
                  <option v-for="(name, code) in countryNames" :key="code" :value="code">
                    {{ name }} ({{ code }})
                  </option>
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
                  <label>Start ({{ athleteForm.skill_start }})</label>
                  <input type="range" v-model.number="athleteForm.skill_start" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Steering ({{ athleteForm.skill_steering }})</label>
                  <input type="range" v-model.number="athleteForm.skill_steering" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Racing Lines ({{ athleteForm.skill_lines }})</label>
                  <input type="range" v-model.number="athleteForm.skill_lines" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Consistency ({{ athleteForm.consistency }})</label>
                  <input type="range" v-model.number="athleteForm.consistency" min="50" max="99" />
                </div>
                <div class="form-group">
                  <label>Form ({{ athleteForm.form }})</label>
                  <input type="range" v-model.number="athleteForm.form" min="50" max="99" />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeAthleteModal" class="btn btn-ghost">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="savingAthlete">
                <i v-if="savingAthlete" class="fa-solid fa-spinner fa-spin"></i>
                {{ editingAthlete ? 'Save Changes' : 'Create Athlete' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Athlete Confirm -->
    <div v-if="showDeleteAthleteConfirm" class="modal-overlay" @click.self="showDeleteAthleteConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2>Delete Athlete</h2>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ athleteToDelete?.first_name }} {{ athleteToDelete?.last_name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAthleteConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleDeleteAthlete" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Delete All Athletes Confirm -->
    <div v-if="showDeleteAllAthletesConfirm" class="modal-overlay" @click.self="showDeleteAllAthletesConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2>Delete All Athletes</h2>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>all {{ athletes.length }} athletes</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteAllAthletesConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleDeleteAllAthletes" class="btn btn-danger">Delete All</button>
        </div>
      </div>
    </div>

    <!-- Reset Season Confirm -->
    <div v-if="showResetSeasonConfirm" class="modal-overlay" @click.self="showResetSeasonConfirm = false">
      <div class="modal confirm-modal fade-in">
        <div class="modal-header">
          <h2>Reset Season</h2>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to reset the current season?</p>
          <p class="warning-text">All race results and standings will be cleared.</p>
        </div>
        <div class="modal-footer">
          <button @click="showResetSeasonConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleResetSeason" class="btn btn-danger">Reset Season</button>
        </div>
      </div>
    </div>

  </div>
    <NamePicker v-model="showNamePicker" @select="handleNamePicked" />
  </template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, api } from '../stores/auth'
import { useSkeletonStore } from '../stores/skeleton'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'
import NamePicker from '../components/NamePicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const skeletonStore = useSkeletonStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)

// State
const world = ref(null)
const activeTab = ref('season')
const loadingAthletes = ref(false)
const loadingSeason = ref(false)
const creatingSeason = ref(false)

// Athletes
const showAthleteModal = ref(false)
const showNamePicker = ref(false)
const editingAthlete = ref(null)
const savingAthlete = ref(false)
const showDeleteAthleteConfirm = ref(false)
const showDeleteAllAthletesConfirm = ref(false)
const athleteToDelete = ref(null)
const athleteForm = ref({
  first_name: '',
  last_name: '',
  country: '',
  skill_start: 70,
  skill_steering: 70,
  skill_lines: 70,
  consistency: 70,
  form: 70
})

// Season
const showResetSeasonConfirm = ref(false)

// Race
const showRaceModal = ref(false)
const selectedEvent = ref(null)
const raceStarted = ref(false)
const animating = ref(false)
const currentRun = ref(1)
const runFinished = ref(false)

// Animation
const sledPosition = ref({ x: 30, y: 30 })
const sledRotation = ref(0)
const displayTime = ref('0.000')
const splitTimes = ref([])
const leaderSplits = ref([])

// Race data
const startOrder = ref([])
const currentAthleteIndex = ref(0)
const liveResults = ref([])
const currentResult = ref(null)
const lastFinishedAthleteId = ref(null)

// Computed
const athletes = computed(() => skeletonStore.athletes)
const currentSeason = computed(() => skeletonStore.currentSeason)
const seasonEvents = computed(() => skeletonStore.events)
const seasonStandings = computed(() => skeletonStore.standings)
const countryNames = computed(() => skeletonStore.countryNames)
const teams = computed(() => teamsStore.teams)
const teamStandings = computed(() => teamsStore.teamStandings)
const standingsView = ref('individual')

const completedEventsCount = computed(() =>
  seasonEvents.value.filter(e => e.status === 'completed').length
)

const nextEvent = computed(() =>
  seasonEvents.value.find(e => e.status !== 'completed')
)

const currentAthlete = computed(() => startOrder.value[currentAthleteIndex.value])
const currentBib = computed(() => currentAthleteIndex.value + 1)
const nextAthlete = computed(() => startOrder.value[currentAthleteIndex.value + 1])
const hasNextAthlete = computed(() => currentAthleteIndex.value < startOrder.value.length - 1)
const remainingAthletes = computed(() => startOrder.value.length - currentAthleteIndex.value - 1)

const athletesYetToRun = computed(() => {
  const finishedIds = new Set(liveResults.value.map(r => r.athleteId))
  return startOrder.value.filter(a => !finishedIds.has(a.id))
})

const liveStandings = computed(() => {
  return [...liveResults.value].sort((a, b) => {
    if (currentRun.value >= 2) {
      // Sort by combined time for runs 2+
      if (a.totalTime === null && b.totalTime === null) return 0
      if (a.totalTime === null) return 1
      if (b.totalTime === null) return -1
      return a.totalTime - b.totalTime
    } else {
      // Sort by run 1 time
      if (a.dnf && b.dnf) return 0
      if (a.dnf) return 1
      if (b.dnf) return -1
      return a.time - b.time
    }
  })
})

const completedRaceResults = computed(() => {
  if (!selectedEvent.value?.results) return []
  // Results should already be sorted by position/time from backend
  return [...selectedEvent.value.results].sort((a, b) => {
    const aTime = a.total_time || a.time
    const bTime = b.total_time || b.time
    if (a.dnf && b.dnf) return 0
    if (a.dnf) return 1
    if (b.dnf) return -1
    return aTime - bTime
  })
})

const isLastRun = computed(() => {
  const totalRuns = selectedEvent.value?.runs || 2
  return currentRun.value >= totalRuns
})

// Methods
function goBack() {
  router.push(`/world/${worldId.value}`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function loadWorld() {
  if (!worldId.value) {
    router.push('/dashboard')
    return
  }
  try {
    const response = await api.get(`/worlds/${worldId.value}`)
    world.value = response.data.world
  } catch (error) {
    console.error('Failed to load world:', error)
    router.push('/dashboard')
  }
}

async function loadAthletes() {
  if (!worldId.value) return
  loadingAthletes.value = true
  try {
    await skeletonStore.fetchAthletes(worldId.value)
  } catch (error) {
    console.error('Failed to load athletes:', error)
  } finally {
    loadingAthletes.value = false
  }
}

async function loadSeason() {
  if (!worldId.value) return
  loadingSeason.value = true
  try {
    await skeletonStore.fetchCurrentSeason(worldId.value)
  } catch (error) {
    console.error('Failed to load season:', error)
  } finally {
    loadingSeason.value = false
  }
}

async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'skeleton')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    await skeletonStore.createSeason(worldId.value)
  } catch (error) {
    console.error('Failed to create season:', error)
  } finally {
    creatingSeason.value = false
  }
}

async function handleResetSeason() {
  try {
    await skeletonStore.resetSeason(currentSeason.value.id)
    showResetSeasonConfirm.value = false
  } catch (error) {
    console.error('Failed to reset season:', error)
  }
}

// Athlete CRUD
function openAddAthleteModal() {
  editingAthlete.value = null
  athleteForm.value = {
    first_name: '',
    last_name: '',
    country: '',
    skill_start: 70,
    skill_steering: 70,
    skill_lines: 70,
    consistency: 70,
    form: 70
  }
  showAthleteModal.value = true
}

function openEditAthleteModal(athlete) {
  editingAthlete.value = athlete
  athleteForm.value = { ...athlete }
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
      await skeletonStore.updateAthlete(editingAthlete.value.id, athleteForm.value)
    } else {
      await skeletonStore.createAthlete(worldId.value, athleteForm.value)
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
  showDeleteAthleteConfirm.value = true
}

async function handleDeleteAthlete() {
  try {
    await skeletonStore.deleteAthlete(athleteToDelete.value.id)
    showDeleteAthleteConfirm.value = false
    athleteToDelete.value = null
  } catch (error) {
    console.error('Failed to delete athlete:', error)
  }
}

async function handleDeleteAllAthletes() {
  try {
    await skeletonStore.deleteAllAthletes(worldId.value)
    showDeleteAllAthletesConfirm.value = false
  } catch (error) {
    console.error('Failed to delete all athletes:', error)
  }
}

function randomizeSkills(type) {
  const ranges = {
    random: [50, 99],
    strong: [85, 99],
    average: [65, 80],
    weak: [50, 65]
  }
  const [min, max] = ranges[type]
  const rand = () => Math.floor(Math.random() * (max - min + 1)) + min
  athleteForm.value.skill_start = rand()
  athleteForm.value.skill_steering = rand()
  athleteForm.value.skill_lines = rand()
  athleteForm.value.consistency = rand()
  athleteForm.value.form = rand()
}

// Race functions
function openRaceModal(event) {
  // Check if event is locked
  if (weekStatusStore.isEventLocked(event.date)) {
    alert(`This event is locked. Complete all events in ${weekStatusStore.formattedWeek} first.`)
    return
  }
  selectedEvent.value = event
  showRaceModal.value = true
  resetRaceState()

  if (event.status === 'completed') {
    liveResults.value = event.results || []
  }
}

function closeRaceModal() {
  showRaceModal.value = false
  selectedEvent.value = null
  resetRaceState()
}

function resetRaceState() {
  raceStarted.value = false
  animating.value = false
  runFinished.value = false
  currentAthleteIndex.value = 0
  liveResults.value = []
  currentResult.value = null
  splitTimes.value = []
  leaderSplits.value = []
  startOrder.value = []
  sledPosition.value = { x: 30, y: 30 }
  sledRotation.value = 0
  displayTime.value = '0.000'
}

function startRace(runNumber) {
  currentRun.value = runNumber
  raceStarted.value = true
  runFinished.value = false
  currentAthleteIndex.value = 0
  currentResult.value = null
  liveResults.value = []
  splitTimes.value = []
  leaderSplits.value = []

  // Set start order
  if (runNumber === 1) {
    startOrder.value = [...athletes.value].sort(() => Math.random() - 0.5)
  } else {
    // Reverse order based on previous run standings (last place goes first)
    const prevResults = selectedEvent.value[`run${runNumber - 1}_results`] || []
    // Sort by time (fastest first), then reverse so slowest goes first
    const sortedByTime = [...prevResults]
      .filter(r => !r.dnf)
      .sort((a, b) => {
        // For run 2+, use total_time if available, otherwise use time
        const aTime = a.total_time || a.time
        const bTime = b.total_time || b.time
        return aTime - bTime
      })
    // Reverse: slowest (last place) runs first
    const reversedOrder = sortedByTime.reverse()
    startOrder.value = reversedOrder.map(r =>
      athletes.value.find(a => a.id === r.athleteId)
    ).filter(Boolean)
  }

  runNextAthlete()
}

async function runNextAthlete() {
  if (!currentAthlete.value) return

  animating.value = true
  currentResult.value = null
  splitTimes.value = []

  const result = await simulateAthleteRun(currentAthlete.value)

  // Add to results
  liveResults.value.push(result)
  currentResult.value = result
  lastFinishedAthleteId.value = result.athleteId
  animating.value = false
}

function goToNextAthlete() {
  currentAthleteIndex.value++
  runNextAthlete()
}

async function simulateAthleteRun(athlete) {
  const trackLength = selectedEvent.value?.track_length || 1400
  const baseTime = trackLength / 26

  // Simulate based on skills
  const skillStart = athlete.skill_start || 70
  const skillSteering = athlete.skill_steering || 70
  const skillLines = athlete.skill_lines || 70
  const consistency = athlete.consistency || 70
  const form = athlete.form || 70

  // Check for DNF (slightly higher for skeleton - head first)
  const dnfChance = 0.018 * (1 + (100 - consistency) / 100 * 0.28 + (100 - skillSteering) / 100 * 0.22)
  const isDNF = Math.random() < dnfChance

  // Calculate time
  let time = baseTime
  time += (70 - skillStart) * 0.014
  time += (70 - skillSteering) * 0.018
  time += (70 - skillLines) * 0.016
  time += (70 - form) * 0.009
  time += (Math.random() - 0.5) * 0.35 * (1.5 - consistency / 100)

  // Clamp time
  const avgSkill = (skillStart + skillSteering + skillLines) / 3
  const minTime = baseTime * (0.95 + (100 - avgSkill) * 0.0004)
  const maxTime = baseTime * (1.008 + (100 - avgSkill) * 0.0008)
  time = Math.max(minTime, Math.min(maxTime, time))

  // Animate - pass actual time for display
  const duration = isDNF ? 2500 : 4500
  await animateSled(duration, isDNF, time)

  const result = {
    athleteId: athlete.id,
    firstName: athlete.first_name,
    lastName: athlete.last_name,
    country: athlete.country,
    bib: currentBib.value,
    dnf: isDNF,
    time: isDNF ? null : Math.round(time * 1000) / 1000,
    timeFormatted: isDNF ? 'DNF' : time.toFixed(3)
  }

  // Calculate position and time behind
  if (!isDNF) {
    const finishedResults = [...liveResults.value, result].filter(r => !r.dnf)
    finishedResults.sort((a, b) => a.time - b.time)
    result.position = finishedResults.findIndex(r => r.athleteId === athlete.id) + 1
    result.timeBehind = result.position === 1 ? 0 :
      Math.round((result.time - finishedResults[0].time) * 1000) / 1000
  } else {
    result.position = liveResults.value.length + 1
  }

  // For run 2+, calculate combined time from all previous runs
  if (currentRun.value >= 2 && !isDNF) {
    let combinedPrevious = 0

    // Get run 1 time
    const run1Results = selectedEvent.value.run1_results || []
    const run1Result = run1Results.find(r => r.athleteId === athlete.id)
    if (run1Result && run1Result.time) {
      result.run1Time = run1Result.time
      combinedPrevious += run1Result.time
    }

    // Get run 2 time if we're on run 3 or 4
    if (currentRun.value >= 3) {
      const run2Results = selectedEvent.value.run2_results || []
      const run2Result = run2Results.find(r => r.athleteId === athlete.id)
      if (run2Result && run2Result.time) {
        result.run2Time = run2Result.time
        combinedPrevious += run2Result.time
      }
    }

    // Get run 3 time if we're on run 4
    if (currentRun.value >= 4) {
      const run3Results = selectedEvent.value.run3_results || []
      const run3Result = run3Results.find(r => r.athleteId === athlete.id)
      if (run3Result && run3Result.time) {
        result.run3Time = run3Result.time
        combinedPrevious += run3Result.time
      }
    }

    result.totalTime = Math.round((combinedPrevious + result.time) * 1000) / 1000
    result.totalFormatted = result.totalTime.toFixed(3)
  }

  return result
}

function animateSled(duration, isDNF, actualTime) {
  return new Promise(resolve => {
    const startTime = Date.now()
    const trackPoints = generateTrackPoints()

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Update position
      const pointIndex = Math.floor(progress * (trackPoints.length - 1))
      const point = trackPoints[pointIndex]
      sledPosition.value = { x: point.x, y: point.y }
      sledRotation.value = point.rotation

      // Update display time - scale from 0 to actual time
      const currentTime = progress * actualTime
      displayTime.value = currentTime.toFixed(3)

      // Check for split times - scaled to actual time
      const splitIndices = [0.15, 0.32, 0.50, 0.68, 0.85]
      splitIndices.forEach((splitProgress, idx) => {
        if (progress >= splitProgress && splitTimes.value.length === idx) {
          const splitTime = splitProgress * actualTime
          const diff = leaderSplits.value[idx] ? splitTime - leaderSplits.value[idx] : null
          if (!leaderSplits.value[idx] || splitTime < leaderSplits.value[idx]) {
            leaderSplits.value[idx] = splitTime
          }
          splitTimes.value.push({
            section: idx + 1,
            time: splitTime.toFixed(3),
            diff
          })
        }
      })

      if (progress < 1 && !isDNF) {
        requestAnimationFrame(animate)
      } else if (isDNF && progress >= 0.6) {
        // Crash animation
        sledRotation.value += 30
        displayTime.value = 'DNF'
        resolve()
      } else if (progress >= 1) {
        // Ensure final time matches actual time exactly
        displayTime.value = actualTime.toFixed(3)
        resolve()
      } else {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  })
}

function generateTrackPoints() {
  const points = []
  const controlPoints = [
    { x: 30, y: 30 },
    { x: 65, y: 45 },
    { x: 90, y: 85 },
    { x: 120, y: 135 },
    { x: 155, y: 140 },
    { x: 195, y: 145 },
    { x: 235, y: 175 },
    { x: 280, y: 210 },
    { x: 325, y: 200 },
    { x: 375, y: 185 },
    { x: 410, y: 225 },
    { x: 450, y: 270 },
    { x: 485, y: 260 }
  ]

  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = controlPoints[Math.max(0, i - 1)]
    const p1 = controlPoints[i]
    const p2 = controlPoints[i + 1]
    const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)]

    for (let t = 0; t < 1; t += 0.1) {
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t)
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t)

      const nextT = t + 0.01
      const nextX = 0.5 * (2 * p1.x + (-p0.x + p2.x) * nextT + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * nextT * nextT + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * nextT * nextT * nextT)
      const nextY = 0.5 * (2 * p1.y + (-p0.y + p2.y) * nextT + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * nextT * nextT + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * nextT * nextT * nextT)

      const rotation = Math.atan2(nextY - y, nextX - x) * 180 / Math.PI

      points.push({ x, y, rotation })
    }
  }

  return points
}

async function finishRun() {
  runFinished.value = true
  const wasLastRun = isLastRun.value

  // Prepare results for backend - use liveStandings (sorted by time) not liveResults (run order)
  const results = liveStandings.value.map((r, idx) => ({
    ...r,
    position: idx + 1
  }))

  try {
    if (currentRun.value === 1) {
      await skeletonStore.simulateRace(selectedEvent.value.id, results)
    } else if (currentRun.value === 2) {
      await skeletonStore.simulateRun2(selectedEvent.value.id, results)
    } else if (currentRun.value === 3) {
      await skeletonStore.simulateRun3(selectedEvent.value.id, results)
    } else if (currentRun.value === 4) {
      await skeletonStore.simulateRun4(selectedEvent.value.id, results)
    }

    // Update selected event status
    const eventIndex = seasonEvents.value.findIndex(e => e.id === selectedEvent.value.id)
    if (eventIndex !== -1) {
      selectedEvent.value = seasonEvents.value[eventIndex]
    }

    raceStarted.value = false

    // Close modal if race is complete
    if (wasLastRun) {
      showRaceModal.value = false
    }
  } catch (error) {
    console.error('Failed to save run results:', error)
  }
}

// Utility functions
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return 'DNF'
  return seconds.toFixed(3)
}

function getSkillClass(value) {
  if (value >= 90) return 'skill-value elite'
  if (value >= 80) return 'skill-value high'
  if (value >= 70) return 'skill-value medium'
  return 'skill-value low'
}

function getPosClass(pos) {
  if (pos === 1) return 'pos-gold'
  if (pos === 2) return 'pos-silver'
  if (pos === 3) return 'pos-bronze'
  return ''
}

function getSplitClass(diff) {
  if (diff === null) return 'first'
  if (diff < 0) return 'faster'
  return 'slower'
}

function formatSplitDiff(diff) {
  if (diff === null) return ''
  return diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)
}

function getTimeBehindLeader(result, idx) {
  if (idx === 0 || !liveStandings.value[0]) return '0.000'
  const leaderTime = currentRun.value >= 2 && liveStandings.value[0].totalTime
    ? liveStandings.value[0].totalTime
    : liveStandings.value[0].time
  const myTime = currentRun.value >= 2 && result.totalTime ? result.totalTime : result.time
  return (myTime - leaderTime).toFixed(3)
}

function getCompletedTimeBehind(result, idx) {
  if (idx === 0 || !completedRaceResults.value[0]) return '0.000'
  const leaderTime = completedRaceResults.value[0].total_time || completedRaceResults.value[0].time
  const myTime = result.total_time || result.time
  return (myTime - leaderTime).toFixed(3)
}

function getDiffClass(diffStr) {
  const diff = parseFloat(diffStr)
  if (diff < 0.3) return 'diff-close'
  if (diff < 0.8) return 'diff-medium'
  return 'diff-far'
}

function getAthleteWCPoints(athleteId) {
  const standing = seasonStandings.value.find(s => s.athleteId === athleteId)
  return standing ? standing.points : 0
}

function getAthleteWCPosition(athleteId) {
  const idx = seasonStandings.value.findIndex(s => s.athleteId === athleteId)
  return idx >= 0 ? idx + 1 : null
}

function getIntervalToAhead(result, idx) {
  if (idx === 0 || !liveStandings.value[idx - 1]) return '0.000'
  const aheadTime = currentRun.value >= 2 && liveStandings.value[idx - 1].totalTime
    ? liveStandings.value[idx - 1].totalTime
    : liveStandings.value[idx - 1].time
  const myTime = currentRun.value >= 2 && result.totalTime ? result.totalTime : result.time
  return (myTime - aheadTime).toFixed(3)
}

function getEventPodium(event) {
  if (!event.results || event.results.length === 0) return []
  return event.results.slice(0, 3).filter(r => !r.dnf)
}

// Lifecycle
onMounted(async () => {
  await loadWorld()
  await Promise.all([
    loadAthletes(),
    loadSeason(),
    weekStatusStore.fetchWeekStatus(worldId.value)
  ])
})
</script>

<style scoped>
/* Skeleton-specific color overrides */
.skeleton {
  --sport-color: #ca8a04;
  --sport-color-dark: #a16207;
}

/* Athletes grid */
.athletes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.athlete-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.athlete-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.athlete-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.athlete-flag {
  width: 36px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.athlete-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.athlete-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.athlete-firstname {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.athlete-skills {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.skill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  min-width: 0;
  overflow: hidden;
}

.skill-label {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  white-space: nowrap;
}

.skill-value {
  font-weight: 600;
  font-size: 0.875rem;
}

.skill-value.elite { color: #16a34a; font-weight: 700; }
.skill-value.high { color: #2563eb; font-weight: 600; }
.skill-value.medium { color: #d97706; }
.skill-value.low { color: #dc2626; }

.athlete-card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.athlete-card:hover .athlete-card-actions {
  opacity: 1;
}

/* Race modal athlete display */
.current-athlete {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.athlete-flag-lg {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.athlete-details {
  display: flex;
  flex-direction: column;
}

.athlete-name-lg {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.timing-display .current-athlete {
  background: transparent;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.timing-display .athlete-name-lg {
  color: #f8fafc;
  font-size: 1.25rem;
}

.timing-display .bib-number {
  color: #ca8a04;
}

/* Race Modal - Compact */
.race-modal {
  max-width: 900px;
  width: 95vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.race-modal .modal-header {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
}

.race-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.race-header-info h2 {
  font-size: 1rem;
  margin: 0;
}

.event-flag {
  width: 36px;
  height: 24px;
  object-fit: cover;
  border-radius: 3px;
}

.event-subtitle {
  font-size: 0.75rem;
  color: #64748b;
}

.race-modal-content {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

/* Animation Section */
.animation-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.track-container {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border-radius: 0.75rem;
  padding: 0.5rem;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.track-svg {
  width: 100%;
  height: auto;
  display: block;
}

.skeleton-sled {
  transition: transform 0.05s linear;
}

/* Compact Timing Display */
.timing-display {
  background: #1e293b;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
}

.timing-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timing-display .current-athlete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  padding: 0;
  margin: 0;
  border: none;
}

.athlete-flag-sm {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.athlete-name-sm {
  color: #f8fafc;
  font-size: 0.9rem;
  font-weight: 600;
}

.timing-display .bib-number {
  font-size: 0.75rem;
  color: #ca8a04;
  font-weight: 600;
  background: rgba(202, 138, 4, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.live-time {
  flex: 1;
  text-align: center;
}

.time-value {
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Monaco', 'Consolas', monospace;
  color: #f8fafc;
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

.result-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.position-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 700;
  font-size: 0.9rem;
  background: #475569;
  color: white;
}

.position-badge.pos-gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.position-badge.pos-silver {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.position-badge.pos-bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.dnf-badge {
  padding: 0.25rem 0.5rem;
  background: #ef4444;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  border-radius: 0.25rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.btn-start,
.btn-next,
.btn-finish {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.btn-start {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.btn-start:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-next {
  background: linear-gradient(135deg, #ca8a04, #a16207);
  box-shadow: 0 2px 8px rgba(202, 138, 4, 0.3);
}

.btn-next:hover {
  box-shadow: 0 4px 12px rgba(202, 138, 4, 0.4);
}

.btn-finish {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: all 0.2s;
}

.btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Standings Section */
.standings-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.start-list-panel,
.live-standings-panel {
  background: white;
  border-radius: 0.75rem;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.start-list-panel h3,
.live-standings-panel h3 {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.start-list,
.live-standings {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 220px;
  overflow-y: auto;
}

.start-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.standing-item {
  display: grid;
  grid-template-columns: 22px 20px 1fr auto auto;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.start-item:hover,
.standing-item:hover {
  background: #f1f5f9;
}

.standing-item.current {
  background: #fef9c3;
  border: 1px solid #ca8a04;
}

.standing-item.just-finished {
  animation: highlight 2s ease-out;
  background: #dcfce7;
  border: 2px solid #22c55e;
  transform: scale(1.02);
}

@keyframes highlight {
  0% { background: #bbf7d0; box-shadow: 0 0 12px rgba(34, 197, 94, 0.5); }
  50% { background: #dcfce7; box-shadow: 0 0 8px rgba(34, 197, 94, 0.3); }
  100% { background: #f8fafc; box-shadow: none; }
}

.start-bib,
.standing-pos {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
  border-radius: 0.25rem;
  background: #f1f5f9;
  color: #475569;
}

.standing-pos.pos-gold {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.standing-pos.pos-silver {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  color: white;
}

.standing-pos.pos-bronze {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.start-flag,
.standing-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.start-name,
.standing-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.standing-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standing-wc-rank {
  font-size: 0.65rem;
  color: #3b82f6;
  font-weight: 600;
}

.final-results-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.final-results-panel h3 {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.final-results-panel h3 i {
  color: #ca8a04;
}

.final-results-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.standing-runs {
  font-size: 0.6rem;
  color: #64748b;
  white-space: nowrap;
}

.standing-item.podium {
  background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%);
  border: 1px solid #eab308;
}

.standing-times {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

.standing-time-main {
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Monaco', 'Consolas', monospace;
  color: #475569;
}

.standing-time-r1 {
  font-size: 0.6rem;
  color: #94a3b8;
  font-family: 'Monaco', 'Consolas', monospace;
}

.standing-diff {
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 50px;
  text-align: right;
  padding: 0.15rem 0.3rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Consolas', monospace;
}

.standing-diff.diff-close {
  color: #16a34a;
  background: rgba(34, 197, 94, 0.15);
}

.standing-diff.diff-medium {
  color: #ca8a04;
  background: rgba(234, 179, 8, 0.15);
}

.standing-diff.diff-far {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.15);
}

.standing-leader {
  min-width: 45px;
  text-align: right;
  color: #fbbf24;
  font-size: 0.7rem;
}

/* Remaining Athletes Panel */
.remaining-panel {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.remaining-panel h4 {
  font-size: 0.7rem;
  color: #94a3b8;
  margin: 0 0 0.25rem 0;
}

.remaining-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.remaining-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  color: #64748b;
  border-radius: 0.25rem;
  background: #f1f5f9;
}

.remaining-item.next-up {
  background: #fef9c3;
  color: #ca8a04;
  font-weight: 600;
}

.remaining-flag {
  width: 16px;
  height: 11px;
  object-fit: cover;
  border-radius: 2px;
}

.more-athletes {
  font-size: 0.65rem;
  color: #94a3b8;
  padding: 0.2rem 0.4rem;
}

/* Run Results Section */
.run-results {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.results-table-header {
  display: grid;
  grid-template-columns: 50px 40px 1fr 100px 80px;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.results-table-row {
  display: grid;
  grid-template-columns: 50px 40px 1fr 100px 80px;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  align-items: center;
  transition: all 0.2s;
}

.results-table-row:hover {
  background: #f8fafc;
}

.results-table-row .pos {
  font-weight: 700;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: #f1f5f9;
}

.results-table-row .pos.gold {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.results-table-row .pos.silver {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  color: white;
}

.results-table-row .pos.bronze {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.results-table-row .flag {
  width: 28px;
  height: 18px;
  object-fit: cover;
  border-radius: 3px;
}

.results-table-row .name {
  font-weight: 500;
  color: #1e293b;
}

.results-table-row .time {
  font-family: 'Monaco', 'Consolas', monospace;
  font-weight: 600;
}

.results-table-row .diff {
  color: #64748b;
  font-size: 0.85rem;
}

/* Responsive Design */
@media (max-width: 900px) {
  .race-modal-content {
    grid-template-columns: 1fr;
  }

  .standings-section {
    order: -1;
  }

  .start-list,
  .live-standings {
    max-height: 200px;
  }
}

@media (max-width: 640px) {
  .race-modal {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .race-modal-content {
    padding: 1rem;
    gap: 1rem;
  }

  .time-value {
    font-size: 2rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-start,
  .btn-next,
  .btn-finish {
    width: 100%;
    justify-content: center;
  }
}

/* Standings Compact Layout */
.standings-compact {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.standings-switcher {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.standings-switch {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.standings-switch:hover {
  background: #e2e8f0;
}

.standings-switch.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.standings-panel {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

/* Team Standings */
.standings-panel.teams-panel {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.standings-switch.teams.active {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
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
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.standing-row:hover {
  background: #f1f5f9;
}

.standing-row.top-3 {
  background: linear-gradient(90deg, #fefce8 0%, #fef9c3 50%, #fefce8 100%);
}

.standing-rank {
  width: 28px;
  display: flex;
  justify-content: center;
}

.standing-rank .medal {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.standing-rank .medal.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.standing-rank .medal.silver {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.standing-rank .medal.bronze {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.standing-rank .rank-num {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.standing-flag-sm {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.standing-info {
  flex: 1;
  min-width: 0;
}

.standing-name-compact {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e293b;
}

.standing-firstname {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 0.25rem;
}

.standing-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.standing-points {
  font-weight: 700;
  font-size: 0.875rem;
  color: #3b82f6;
}

.standing-races {
  font-size: 0.625rem;
  color: #94a3b8;
}

.no-standings {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.no-standings i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.no-standings p {
  margin: 0;
  font-size: 0.875rem;
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

</style>
