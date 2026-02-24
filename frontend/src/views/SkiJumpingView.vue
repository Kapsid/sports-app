<template>
  <div class="sport-page ski-jumping">
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
            <i class="fa-solid fa-person-ski-jumping"></i>
            Ski Jumping
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
            :class="['nav-tab', { active: activeTab === 'jumpers' }]"
            @click="activeTab = 'jumpers'"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">Jumpers</span>
              <span class="nav-tab-count" v-if="jumpers.length">{{ jumpers.length }}</span>
            </div>
          </button>
          <button
            :class="['nav-tab', { active: activeTab === 'history' }]"
            @click="activeTab = 'history'; loadHistory()"
          >
            <div class="nav-tab-icon">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div class="nav-tab-content">
              <span class="nav-tab-label">History</span>
            </div>
          </button>
        </div>
      </div>
    </nav>

    <main class="page-main">
      <div class="container">

        <!-- Jumpers Tab -->
        <div v-if="activeTab === 'jumpers'" class="tab-content fade-in">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fa-solid fa-users"></i>
              Competitors
              <span class="count" v-if="jumpers.length">({{ jumpers.length }})</span>
            </h2>
            <div class="actions">
              <button
                v-if="jumpers.length === 0"
                @click="handleGenerateJumpers"
                class="btn btn-secondary"
                :disabled="generating"
              >
                <i v-if="generating" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
                {{ generating ? 'Generating...' : 'Generate 80 Jumpers' }}
              </button>
              <button
                @click="openAddJumperModal"
                class="btn btn-primary"
              >
                <i class="fa-solid fa-plus"></i>
                Add Jumper
              </button>
              <button
                v-if="jumpers.length > 0"
                @click="showDeleteAllJumpersConfirm = true"
                class="btn btn-ghost btn-sm text-danger"
              >
                <i class="fa-solid fa-trash"></i>
                Delete All
              </button>
            </div>
          </div>

          <div v-if="loadingJumpers" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading jumpers...
          </div>

          <div v-else-if="jumpers.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <h3>No Jumpers Yet</h3>
            <p>Generate a roster of 80 ski jumpers to start your World Cup simulation.</p>
          </div>

          <div v-else class="jumpers-table-container">
            <table class="jumpers-table">
              <thead>
                <tr>
                  <th class="col-country">Country</th>
                  <th class="col-name">Name</th>
                  <th class="col-team">Team</th>
                  <th class="col-skill">JMP</th>
                  <th class="col-skill">FLT</th>
                  <th class="col-skill">LND</th>
                  <th class="col-skill">CON</th>
                  <th class="col-skill">OVR</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="jumper in jumpers" :key="jumper.id" @click="openEditJumperModal(jumper)">
                  <td class="col-country">
                    <img :src="`/flags/${jumper.country}.png`" :alt="jumperCountryNames[jumper.country]" class="flag" />
                    <span class="country-code">{{ jumper.country }}</span>
                  </td>
                  <td class="col-name">{{ jumper.last_name }} {{ jumper.first_name }}</td>
                  <td class="col-team">
                    <span v-if="getJumperTeam(jumper)" class="team-badge" :style="{ backgroundColor: getJumperTeam(jumper).color }">
                      {{ getJumperTeam(jumper).short_name || getJumperTeam(jumper).name.substring(0, 3).toUpperCase() }}
                    </span>
                    <span v-else class="no-team">-</span>
                  </td>
                  <td class="col-skill"><span :class="getSkillClass(jumper.skill_jumping)">{{ jumper.skill_jumping }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(jumper.skill_flight)">{{ jumper.skill_flight }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(jumper.skill_landing)">{{ jumper.skill_landing }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(jumper.consistency)">{{ jumper.consistency }}</span></td>
                  <td class="col-skill"><span :class="getSkillClass(getOverall(jumper))" class="overall">{{ getOverall(jumper) }}</span></td>
                  <td class="col-actions" @click.stop>
                    <button @click="openEditJumperModal(jumper)" class="btn btn-ghost btn-sm" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button @click="confirmDeleteJumper(jumper)" class="btn btn-ghost btn-sm delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
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
            <p>Start a new World Cup season to begin competing.</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason || jumpers.length === 0">
              <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingSeason ? 'Creating...' : 'Start New Season' }}
            </button>
            <p v-if="jumpers.length === 0" class="warning-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Generate jumpers first before starting a season.
            </p>
          </div>

          <div v-else class="season-content">
            <div class="season-header-card">
              <div class="season-info">
                <h2><i class="fa-solid fa-trophy"></i> World Cup {{ currentSeason.name }}</h2>
                <div class="season-progress">
                  <span class="progress-text">{{ completedEventsCount }} / {{ seasonEvents.length }} races completed</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                  </div>
                </div>
              </div>
              <div class="season-actions" v-if="isSeasonComplete && currentSeason.status !== 'completed'">
                <button @click="handleCompleteSeason" class="btn btn-success" :disabled="completingSeason">
                  <i v-if="completingSeason" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-flag-checkered"></i>
                  {{ completingSeason ? 'Completing...' : 'Complete Season' }}
                </button>
              </div>
              <div class="season-actions" v-if="currentSeason && currentSeason.status !== 'completed'">
                <button @click="showResetConfirm = true" class="btn btn-ghost btn-sm text-danger">
                  <i class="fa-solid fa-rotate-left"></i>
                  Reset Season
                </button>
              </div>
              <div class="season-actions" v-if="currentSeason.status === 'completed'">
                <button @click="handleCreateSeason" class="btn btn-primary" :disabled="creatingSeason">
                  <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward"></i>
                  {{ creatingSeason ? 'Creating...' : 'Start Next Season' }}
                </button>
              </div>
            </div>

            <div class="calendar-full">
              <div class="calendar-grid">
                <div
                  v-for="(event, index) in seasonEvents"
                  :key="event.id"
                  :class="['calendar-event', event.status, { 'is-tournament': event.tournament, 'is-skiflying': event.hill_size === 'FH', 'is-locked': weekStatusStore.isEventLocked(event.date) }]"
                  @click="handleEventClick(event)"
                >
                  <div v-if="weekStatusStore.isEventLocked(event.date)" class="lock-overlay">
                    <i class="fa-solid fa-lock"></i>
                    <span>Week Locked</span>
                  </div>
                  <div class="calendar-event-header">
                    <span class="event-number-badge">{{ index + 1 }}</span>
                    <span v-if="event.tournament" class="tournament-badge">
                      <i class="fa-solid fa-mountain"></i> {{ event.tournament }}
                    </span>
                    <span v-else-if="event.hill_size === 'FH'" class="skiflying-badge">
                      <i class="fa-solid fa-jet-fighter-up"></i> Ski Flying
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
                        <span class="location-country">{{ getCountryName(event.country) }}</span>
                      </div>
                    </div>
                    <div class="event-hill-info">
                      <span class="hill-size">{{ event.hill_size === 'FH' ? 'Flying Hill' : 'Large Hill' }}</span>
                      <span class="hill-kpoint">K{{ event.k_point }}</span>
                    </div>
                    <div class="event-date-display">
                      <i class="fa-solid fa-calendar-day"></i>
                      {{ formatDate(event.date) }}
                    </div>
                  </div>
                  <div v-if="event.status === 'completed' && getEventPodium(event).length > 0" class="calendar-event-podium">
                    <div v-for="(podium, pIndex) in getEventPodium(event)" :key="podium.jumperId" class="podium-item">
                      <span :class="['podium-pos', pIndex === 0 ? 'gold' : pIndex === 1 ? 'silver' : 'bronze']">
                        {{ pIndex + 1 }}
                      </span>
                      <img :src="`/flags/${podium.country}.png`" class="podium-flag-sm" />
                      <span class="podium-jumper">{{ podium.lastName }}</span>
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
                :class="['standings-switch four-hills', { active: standingsView === 'fourhills', disabled: fourHillsStandings.length === 0 }]"
                @click="fourHillsStandings.length > 0 && (standingsView = 'fourhills')"
                :disabled="fourHillsStandings.length === 0"
              >
                <i class="fa-solid fa-mountain"></i>
                <span>Four Hills</span>
                <span class="switch-count">{{ completedFourHillsEvents }}/4</span>
              </button>
              <button
                :class="['standings-switch flying', { active: standingsView === 'flying', disabled: flyingCupStandings.length === 0 }]"
                @click="flyingCupStandings.length > 0 && (standingsView = 'flying')"
                :disabled="flyingCupStandings.length === 0"
              >
                <i class="fa-solid fa-jet-fighter-up"></i>
                <span>Flying Cup</span>
                <span class="switch-count">{{ completedFlyingEvents }}/{{ totalFlyingEvents }}</span>
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
                  :key="standing.jumperId"
                  :class="['standing-row', { 'top-3': index < 3 }]"
                  @click="openCompetitorModal(standing)"
                >
                  <div class="standing-rank">
                    <span v-if="index === 0" class="medal gold">1</span>
                    <span v-else-if="index === 1" class="medal silver">2</span>
                    <span v-else-if="index === 2" class="medal bronze">3</span>
                    <span v-else class="rank-num">{{ index + 1 }}</span>
                  </div>
                  <span v-if="standing.positionChange !== null"
                    :class="['position-change',
                      standing.positionChange === 'new' ? 'new' :
                      standing.positionChange > 0 ? 'up' :
                      standing.positionChange < 0 ? 'down' : 'same']">
                    <template v-if="standing.positionChange === 'new'">
                      <i class="fa-solid fa-star"></i>
                    </template>
                    <template v-else-if="standing.positionChange > 0">
                      <i class="fa-solid fa-caret-up"></i>{{ standing.positionChange }}
                    </template>
                    <template v-else-if="standing.positionChange < 0">
                      <i class="fa-solid fa-caret-down"></i>{{ Math.abs(standing.positionChange) }}
                    </template>
                    <template v-else>
                      <span class="same-dash">-</span>
                    </template>
                  </span>
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

            <!-- Four Hills Standings -->
            <div v-if="standingsView === 'fourhills'" class="standings-panel four-hills-panel">
              <div class="standings-list-compact">
                <div
                  v-for="(standing, index) in fourHillsStandings"
                  :key="standing.jumperId"
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
                    <span class="standing-name-compact">{{ standing.lastName }}</span>
                    <span class="standing-firstname">{{ standing.firstName }}</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts four-hills-pts">{{ standing.totalPoints }}</span>
                    <span class="standing-events-sm">{{ standing.events }}e</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Flying Cup Standings -->
            <div v-if="standingsView === 'flying'" class="standings-panel flying-panel">
              <div class="standings-list-compact">
                <div
                  v-for="(standing, index) in flyingCupStandings"
                  :key="standing.jumperId"
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
                    <span class="standing-name-compact">{{ standing.lastName }}</span>
                    <span class="standing-firstname">{{ standing.firstName }}</span>
                  </div>
                  <div class="standing-data">
                    <span class="standing-pts flying-pts">{{ standing.totalPoints }}</span>
                    <span class="standing-events-sm">{{ standing.events }}e</span>
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

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="tab-content fade-in">
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> Season History</h2>
          </div>
          <div v-if="loadingHistory" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading history...
          </div>
          <div v-else-if="seasonHistory.length === 0" class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <h3>No History Yet</h3>
            <p>Complete a season to see it in history.</p>
          </div>
          <div v-else class="history-list">
            <div v-for="season in seasonHistory" :key="season.id" class="history-card">
              <div class="history-header">
                <h3><i class="fa-solid fa-trophy"></i> World Cup {{ season.season_name }}</h3>
                <span class="history-races">{{ season.total_races }} races</span>
              </div>
              <div class="history-top10">
                <div v-for="entry in season.top_10" :key="entry.jumperId" :class="['history-entry', { 'top-3': entry.position <= 3 }]">
                  <div class="history-position">
                    <span v-if="entry.position === 1" class="medal gold">1</span>
                    <span v-else-if="entry.position === 2" class="medal silver">2</span>
                    <span v-else-if="entry.position === 3" class="medal bronze">3</span>
                    <span v-else class="position">{{ entry.position }}</span>
                  </div>
                  <img :src="`/flags/${entry.country}.png`" class="history-flag" />
                  <div class="history-name">{{ entry.lastName }} {{ entry.firstName }}</div>
                  <div class="history-points">{{ entry.points }} pts</div>
                  <div class="history-stats">
                    <span title="Wins"><i class="fa-solid fa-trophy"></i> {{ entry.wins }}</span>
                    <span title="Podiums"><i class="fa-solid fa-medal"></i> {{ entry.podiums }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Jumper Modal -->
    <div v-if="showJumperModal" class="modal-overlay" @click.self="closeJumperModal">
      <div class="modal jumper-modal fade-in">
        <div class="modal-header">
          <h2>{{ editingJumper ? 'Edit Jumper' : 'Add New Jumper' }}</h2>
          <div class="modal-header-actions">
            <button type="button" @click="showNamePicker = true" class="btn btn-ghost btn-sm" title="Pick from Name Database">
              <i class="fa-solid fa-address-book"></i> Pick Name
            </button>
            <button @click="closeJumperModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <form @submit.prevent="handleSaveJumper">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">First Name</label>
              <input id="firstName" v-model="jumperForm.first_name" type="text" class="input-field" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="lastName">Last Name</label>
              <input id="lastName" v-model="jumperForm.last_name" type="text" class="input-field" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="country">Country</label>
              <select id="country" v-model="jumperForm.country" class="input-field" required>
                <option value="">Select country...</option>
                <option v-for="country in sortedCountries" :key="country.code" :value="country.code">{{ country.name }} ({{ country.code }})</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="jumperTeam">Team</label>
              <select id="jumperTeam" v-model="jumperForm.team_id" class="input-field">
                <option value="">No team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
            </div>
          </div>
          <div class="skills-section">
            <div class="skills-header">
              <h3>Skills</h3>
              <div class="randomize-buttons">
                <button type="button" @click="randomizeSkills('strong')" class="btn btn-ghost btn-xs skill-btn-strong">
                  <i class="fa-solid fa-dice"></i> Strong
                </button>
                <button type="button" @click="randomizeSkills('average')" class="btn btn-ghost btn-xs skill-btn-average">
                  <i class="fa-solid fa-dice"></i> Average
                </button>
                <button type="button" @click="randomizeSkills('low')" class="btn btn-ghost btn-xs skill-btn-low">
                  <i class="fa-solid fa-dice"></i> Low
                </button>
                <button type="button" @click="randomizeSkills('random')" class="btn btn-ghost btn-xs skill-btn-random">
                  <i class="fa-solid fa-dice"></i> Random
                </button>
              </div>
            </div>
            <div class="skills-grid">
              <div class="skill-input"><label>Jumping (JMP)</label><input type="number" v-model.number="jumperForm.skill_jumping" min="1" max="99" class="input-field" /></div>
              <div class="skill-input"><label>Flight (FLT)</label><input type="number" v-model.number="jumperForm.skill_flight" min="1" max="99" class="input-field" /></div>
              <div class="skill-input"><label>Landing (LND)</label><input type="number" v-model.number="jumperForm.skill_landing" min="1" max="99" class="input-field" /></div>
              <div class="skill-input"><label>Consistency (CON)</label><input type="number" v-model.number="jumperForm.consistency" min="1" max="99" class="input-field" /></div>
            </div>
          </div>
          <div v-if="formError" class="error-message"><i class="fa-solid fa-circle-exclamation"></i> {{ formError }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeJumperModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-check"></i>
              {{ saving ? 'Saving...' : 'Save Jumper' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="jumperToDelete" class="modal-overlay" @click.self="jumperToDelete = null">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete Jumper</h2>
          <button @click="jumperToDelete = null" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="delete-warning">Are you sure you want to delete <strong>{{ jumperToDelete.first_name }} {{ jumperToDelete.last_name }}</strong>?</p>
        <div class="modal-actions">
          <button type="button" @click="jumperToDelete = null" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteJumper" class="btn btn-danger" :disabled="deleting">
            <i v-if="deleting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Delete All Jumpers Confirmation Modal -->
    <div v-if="showDeleteAllJumpersConfirm" class="modal-overlay" @click.self="showDeleteAllJumpersConfirm = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Delete All Jumpers</h2>
          <button @click="showDeleteAllJumpersConfirm = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="delete-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Are you sure you want to delete <strong>all {{ jumpers.length }} jumpers</strong>? This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button type="button" @click="showDeleteAllJumpersConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteAllJumpers" class="btn btn-danger" :disabled="deletingAllJumpers">
            <i v-if="deletingAllJumpers" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-trash"></i>
            Delete All Jumpers
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Season Confirmation Modal -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Reset Season</h2>
          <button @click="showResetConfirm = false" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="delete-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Are you sure you want to reset the season? This will clear all race results and standings. This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button type="button" @click="showResetConfirm = false" class="btn btn-secondary">Cancel</button>
          <button @click="handleResetSeason" class="btn btn-danger" :disabled="resettingSeason">
            <i v-if="resettingSeason" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-rotate-left"></i>
            Reset Season
          </button>
        </div>
      </div>
    </div>

    <!-- Race Simulation Modal -->
    <div v-if="showRaceModal" class="modal-overlay" @click.self="closeRaceModal">
      <div class="modal race-modal fade-in">
        <div v-if="!selectedEvent" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading event...
        </div>
        <template v-else>
        <div class="modal-header">
          <div>
            <h2>{{ selectedEvent.name }}</h2>
            <div class="race-meta">
              <img :src="`/flags/${selectedEvent.country}.png`" class="race-flag" />
              <span>{{ selectedEvent.hill_size }} {{ selectedEvent.k_point }}m</span>
              <span>{{ formatDate(selectedEvent.date) }}</span>
            </div>
          </div>
          <button @click="closeRaceModal" class="btn btn-ghost"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Race Tabs -->
        <div class="race-tabs">
          <button
            :class="['race-tab', { active: raceTab === 'qualifying', disabled: !canAccessQualifying }]"
            @click="raceTab = 'qualifying'"
            :disabled="!canAccessQualifying"
          >
            <i class="fa-solid fa-filter"></i>
            Qualifying
            <span v-if="isQualifyingComplete" class="tab-check"><i class="fa-solid fa-check"></i></span>
          </button>
          <button
            :class="['race-tab', { active: raceTab === 'round1', disabled: !canAccessRound1 }]"
            @click="raceTab = 'round1'"
            :disabled="!canAccessRound1"
          >
            <i class="fa-solid fa-1"></i>
            1st Round
            <span v-if="isRound1Complete" class="tab-check"><i class="fa-solid fa-check"></i></span>
          </button>
          <button
            :class="['race-tab', { active: raceTab === 'round2', disabled: !canAccessRound2 }]"
            @click="raceTab = 'round2'"
            :disabled="!canAccessRound2"
          >
            <i class="fa-solid fa-2"></i>
            2nd Round
            <span v-if="isRound2Complete" class="tab-check"><i class="fa-solid fa-check"></i></span>
          </button>
        </div>

        <!-- Qualifying Tab -->
        <div v-if="raceTab === 'qualifying'" class="race-tab-content">
          <div v-if="raceResults.status === 'not_started'" class="race-start-section">
            <div class="start-icon"><i class="fa-solid fa-flag"></i></div>
            <h3>Start Qualifying</h3>
            <p>{{ eventJumpers.length }} jumpers will compete for 50 spots in Round 1.</p>
            <button
              type="button"
              class="btn btn-primary btn-lg"
              :disabled="simulating || eventJumpers.length === 0"
              @click.prevent="handleStartQualifying"
            >
              <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              Start Qualifying
            </button>
            <p v-if="eventJumpers.length === 0" class="warning-text">
              <i class="fa-solid fa-spinner fa-spin"></i> Loading jumpers...
            </p>
          </div>

          <div v-if="raceResults.qualifying && raceResults.qualifying.length > 0" class="race-dual-view">
            <!-- Start List (jumpers waiting to jump) -->
            <div v-if="pendingQualifying.length > 0 && raceResults.status === 'qualifying'" class="start-list-section">
              <div class="section-label">
                <i class="fa-solid fa-list-ol"></i>
                Start List ({{ pendingQualifying.length }} remaining)
              </div>
              <div class="simulate-buttons">
                <button @click="handleSimulateNext" class="btn btn-primary" :disabled="simulating">
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-step"></i>
                  {{ simulating ? 'Simulating...' : 'Simulate Next' }}
                </button>
                <button @click="handleSimulateQualifying" class="btn btn-secondary" :disabled="simulating">
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-fast"></i>
                  Simulate All
                </button>
              </div>
              <div class="start-list-container">
                <div
                  v-for="entry in pendingQualifying"
                  :key="entry.jumperId"
                  :class="['start-list-item', { 'next-jumper': isNextJumper(entry, 'qualifying') }]"
                >
                  <span class="start-bib">{{ entry.bibNumber }}</span>
                  <img :src="`/flags/${entry.country}.png`" class="start-flag" />
                  <span class="start-name">{{ entry.lastName }} {{ entry.firstName }}</span>
                  <div class="start-actions">
                    <button
                      @click="startJumpAnimation(entry, 'qualifying')"
                      class="btn btn-xs btn-icon"
                      :disabled="simulating || animating"
                      title="Watch jump animation"
                    >
                      <i class="fa-solid fa-video"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Proceed button when complete -->
            <div v-if="isQualifyingComplete && raceResults.status === 'qualifying'" class="proceed-section">
              <button @click="handleStartRound1" class="btn btn-success btn-lg" :disabled="simulating">
                <i class="fa-solid fa-arrow-right"></i> Proceed to Round 1
              </button>
            </div>

            <!-- Live Ranking (jumpers who have jumped) -->
            <div v-if="completedQualifying.length > 0" class="ranking-section">
              <div class="section-label">
                <i class="fa-solid fa-ranking-star"></i>
                Live Ranking ({{ completedQualifying.length }} jumped)
              </div>
              <div class="results-table-container">
                <table class="results-table">
                  <thead>
                    <tr>
                      <th class="col-rank">Rank</th>
                      <th class="col-country">Country</th>
                      <th class="col-name">Name</th>
                      <th class="col-distance">Distance</th>
                      <th class="col-points">Points</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in completedQualifying" :key="entry.jumperId" :class="{ 'qualified': entry.liveRank <= 50, 'not-qualified': entry.liveRank > 50, 'yellow-jersey': entry.liveRank === 1 }">
                      <td class="col-rank">
                        <span :class="{ 'rank-qualified': entry.liveRank <= 50 }">{{ entry.liveRank }}</span>
                      </td>
                      <td class="col-country"><img :src="`/flags/${entry.country}.png`" class="result-flag" /></td>
                      <td class="col-name">{{ entry.lastName }} {{ entry.firstName }}</td>
                      <td class="col-distance">{{ entry.jump.distance }}m</td>
                      <td class="col-points">{{ entry.jump.totalPoints }}</td>
                      <td class="col-status">
                        <span v-if="entry.liveRank <= 50" class="status-badge qualified">Q</span>
                        <span v-else class="status-badge not-qualified">DNQ</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Round 1 Tab -->
        <div v-if="raceTab === 'round1'" class="race-tab-content">
          <div v-if="raceResults.round1 && raceResults.round1.length > 0" class="race-dual-view">
            <!-- Start List (jumpers waiting to jump) -->
            <div v-if="pendingRound1.length > 0 && raceResults.status === 'round1'" class="start-list-section">
              <div class="section-label">
                <i class="fa-solid fa-list-ol"></i>
                Start List ({{ pendingRound1.length }} remaining)
                <span class="round-note">Top 30 advance to Round 2</span>
              </div>
              <div class="simulate-buttons">
                <button @click="handleSimulateNext" class="btn btn-primary" :disabled="simulating">
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-step"></i>
                  {{ simulating ? 'Simulating...' : 'Simulate Next' }}
                </button>
                <button @click="handleSimulateRound1" class="btn btn-secondary" :disabled="simulating">
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-fast"></i>
                  Simulate All
                </button>
              </div>
              <div class="start-list-container">
                <div
                  v-for="entry in pendingRound1"
                  :key="entry.jumperId"
                  :class="['start-list-item', { 'next-jumper': isNextJumper(entry, 'round1') }]"
                >
                  <span class="start-bib">{{ entry.bibNumber }}</span>
                  <img :src="`/flags/${entry.country}.png`" class="start-flag" />
                  <span class="start-name">{{ entry.lastName }} {{ entry.firstName }}</span>
                  <div class="start-actions">
                    <button
                      @click="startJumpAnimation(entry, 'round1')"
                      class="btn btn-xs btn-icon"
                      :disabled="simulating || animating"
                      title="Watch jump animation"
                    >
                      <i class="fa-solid fa-video"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Proceed button when complete -->
            <div v-if="isRound1Complete && raceResults.status === 'round1'" class="proceed-section">
              <button @click="handleStartRound2" class="btn btn-success btn-lg" :disabled="simulating">
                <i class="fa-solid fa-arrow-right"></i> Proceed to Round 2
              </button>
            </div>

            <!-- Live Ranking (jumpers who have jumped) -->
            <div v-if="completedRound1.length > 0" class="ranking-section">
              <div class="section-label">
                <i class="fa-solid fa-ranking-star"></i>
                Live Ranking ({{ completedRound1.length }} jumped)
              </div>
              <div class="results-table-container">
                <table class="results-table">
                  <thead>
                    <tr>
                      <th class="col-rank">Rank</th>
                      <th class="col-country">Country</th>
                      <th class="col-name">Name</th>
                      <th class="col-distance">Distance</th>
                      <th class="col-points">Points</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in completedRound1" :key="entry.jumperId" :class="{ 'qualified': entry.liveRank <= 30, 'not-qualified': entry.liveRank > 30, 'yellow-jersey': entry.liveRank === 1 }">
                      <td class="col-rank">
                        <span :class="{ 'rank-qualified': entry.liveRank <= 30 }">{{ entry.liveRank }}</span>
                      </td>
                      <td class="col-country"><img :src="`/flags/${entry.country}.png`" class="result-flag" /></td>
                      <td class="col-name">{{ entry.lastName }} {{ entry.firstName }}</td>
                      <td class="col-distance">{{ entry.jump.distance }}m</td>
                      <td class="col-points">{{ entry.totalPoints }}</td>
                      <td class="col-status">
                        <span v-if="entry.liveRank <= 30" class="status-badge qualified">Q</span>
                        <span v-else class="status-badge not-qualified">OUT</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Round 2 Tab -->
        <div v-if="raceTab === 'round2'" class="race-tab-content">
          <!-- Final Results (after race complete) -->
          <div v-if="raceResults.status === 'completed' && raceResults.final" class="results-table-container">
            <div class="results-header completed">
              <span><i class="fa-solid fa-flag-checkered"></i> Race Complete!</span>
            </div>
            <table class="results-table final-results">
              <thead>
                <tr>
                  <th class="col-rank">Pos</th>
                  <th class="col-country">Country</th>
                  <th class="col-name">Name</th>
                  <th class="col-distance">Jump 1</th>
                  <th class="col-distance">Jump 2</th>
                  <th class="col-points">Total</th>
                  <th class="col-wc">WC Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in raceResults.final" :key="entry.jumperId" :class="{ 'podium': entry.position <= 3, 'points': entry.wcPoints > 0, 'yellow-jersey': entry.position === 1 }">
                  <td class="col-rank">
                    <span v-if="entry.position === 1" class="medal gold">1</span>
                    <span v-else-if="entry.position === 2" class="medal silver">2</span>
                    <span v-else-if="entry.position === 3" class="medal bronze">3</span>
                    <span v-else>{{ entry.position }}</span>
                  </td>
                  <td class="col-country"><img :src="`/flags/${entry.country}.png`" class="result-flag" /></td>
                  <td class="col-name">{{ entry.lastName }} {{ entry.firstName }}</td>
                  <td class="col-distance">{{ entry.jump1 ? entry.jump1.distance + 'm' : '-' }}</td>
                  <td class="col-distance">{{ entry.jump2 ? entry.jump2.distance + 'm' : '-' }}</td>
                  <td class="col-points total">{{ entry.totalPoints }}</td>
                  <td class="col-wc">
                    <span v-if="entry.wcPoints > 0" class="wc-points">+{{ entry.wcPoints }}</span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- In-progress Round 2 -->
          <div v-else-if="raceResults.round2 && raceResults.round2.length > 0" class="race-dual-view">
            <!-- Start List (jumpers waiting to jump) -->
            <div v-if="pendingRound2.length > 0 && raceResults.status === 'round2'" class="start-list-section">
              <div class="section-label">
                <i class="fa-solid fa-list-ol"></i>
                Start List ({{ pendingRound2.length }} remaining)
                <span class="round-note">Final round for World Cup points!</span>
              </div>
              <div class="simulate-buttons">
                <button @click="handleSimulateNext" class="btn btn-primary" :disabled="simulating">
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-step"></i>
                  {{ simulating ? 'Simulating...' : 'Simulate Next' }}
                </button>
                <button @click="handleSimulateRound2" class="btn btn-secondary" :disabled="simulating">
                  <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-forward-fast"></i>
                  Simulate All
                </button>
              </div>
              <div class="start-list-container">
                <div
                  v-for="entry in pendingRound2"
                  :key="entry.jumperId"
                  :class="['start-list-item', { 'next-jumper': isNextJumper(entry, 'round2') }]"
                >
                  <span class="start-bib">{{ entry.bibNumber }}</span>
                  <img :src="`/flags/${entry.country}.png`" class="start-flag" />
                  <span class="start-name">{{ entry.lastName }} {{ entry.firstName }}</span>
                  <span class="start-r1-pts">R1: {{ entry.round1Points }}pts</span>
                  <div class="start-actions">
                    <button
                      @click="startJumpAnimation(entry, 'round2')"
                      class="btn btn-xs btn-icon"
                      :disabled="simulating || animating"
                      title="Watch jump animation"
                    >
                      <i class="fa-solid fa-video"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Finish Race button when all jumps done -->
            <div v-if="pendingRound2.length === 0 && completedRound2.length > 0 && raceResults.status === 'round2'" class="proceed-section">
              <button @click="handleFinishRace" class="btn btn-success btn-lg" :disabled="simulating">
                <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-flag-checkered"></i>
                {{ simulating ? 'Finishing...' : 'Finish Race & Award Points' }}
              </button>
            </div>

            <!-- Live Ranking (jumpers who have jumped in round 2) -->
            <div v-if="completedRound2.length > 0" class="ranking-section">
              <div class="section-label">
                <i class="fa-solid fa-ranking-star"></i>
                Live Ranking ({{ completedRound2.length }} jumped)
              </div>
              <div class="results-table-container">
                <table class="results-table">
                  <thead>
                    <tr>
                      <th class="col-rank">Rank</th>
                      <th class="col-country">Country</th>
                      <th class="col-name">Name</th>
                      <th class="col-distance">R1 Pts</th>
                      <th class="col-distance">Jump 2</th>
                      <th class="col-points">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in completedRound2" :key="entry.jumperId" :class="{ 'podium': entry.liveRank <= 3, 'yellow-jersey': entry.liveRank === 1 }">
                      <td class="col-rank">
                        <span v-if="entry.liveRank === 1" class="medal gold">1</span>
                        <span v-else-if="entry.liveRank === 2" class="medal silver">2</span>
                        <span v-else-if="entry.liveRank === 3" class="medal bronze">3</span>
                        <span v-else>{{ entry.liveRank }}</span>
                      </td>
                      <td class="col-country"><img :src="`/flags/${entry.country}.png`" class="result-flag" /></td>
                      <td class="col-name">{{ entry.lastName }} {{ entry.firstName }}</td>
                      <td class="col-distance">{{ entry.round1Points }}</td>
                      <td class="col-distance">{{ entry.jump.distance }}m</td>
                      <td class="col-points">{{ entry.totalPoints }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        </template>
      </div>
    </div>

    <!-- Jump Animation Modal -->
    <div v-if="showJumpAnimation" class="jump-animation-overlay" @click.self="closeAnimation">
      <div class="jump-animation-modal">
        <!-- Header with jumper info and close button -->
        <div class="animation-header">
          <div class="jumper-info">
            <span v-if="animatingJumperOverallRank" class="jumper-wc-badge" :class="{ 'top-3': animatingJumperOverallRank <= 3 }">
              #{{ animatingJumperOverallRank }}
            </span>
            <span v-if="animatingJumperFourHillsRank" class="jumper-special-badge four-hills" :class="{ 'top-3': animatingJumperFourHillsRank <= 3 }">
              <i class="fa-solid fa-mountain"></i>{{ animatingJumperFourHillsRank }}
            </span>
            <span v-if="animatingJumperFlyingRank" class="jumper-special-badge flying" :class="{ 'top-3': animatingJumperFlyingRank <= 3 }">
              <i class="fa-solid fa-jet-fighter-up"></i>{{ animatingJumperFlyingRank }}
            </span>
            <img v-if="animatingJumper" :src="`/flags/${animatingJumper.country}.png`" class="jumper-flag" />
            <span class="jumper-name">{{ animatingJumper?.lastName }} {{ animatingJumper?.firstName }}</span>
          </div>
          <button @click="closeAnimation" class="close-animation-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Main content: SVG on left, results on right -->
        <div class="animation-content">
          <!-- SVG Animation -->
          <div class="animation-svg-wrapper">
            <div class="animation-svg-container">
              <svg viewBox="0 0 600 280" class="ski-jump-svg">
                <defs>
                  <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#87CEEB" />
                    <stop offset="100%" style="stop-color:#E0F4FF" />
                  </linearGradient>
                </defs>

                <!-- Sky background -->
                <rect x="0" y="0" width="600" height="280" fill="url(#skyGradient)" />

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
              <span class="dist-pts">{{ animationResult?.totalPoints }} pts</span>
            </div>
          </div>

          <!-- Results panel -->
          <div class="results-panel" :class="{ 'visible': nearbyRankings.length > 0 || animationRank }">
            <div class="panel-title">
              Standings
              <span v-if="remainingJumpersCount > 0" class="remaining-count">{{ remainingJumpersCount }} remaining</span>
            </div>
            <div class="leaderboard-list" ref="leaderboardListRef">
              <div
                v-for="entry in nearbyRankings"
                :key="entry.jumperId"
                class="leaderboard-row"
                :class="{
                  'current-jumper': entry.jumperId === animatingJumper?.jumperId,
                  'podium': entry.liveRank <= 3
                }"
                :ref="el => { if (entry.jumperId === animatingJumper?.jumperId) currentJumperRowRef = el }"
              >
                <span class="lb-rank" :class="getRankClass(entry.liveRank)">{{ entry.liveRank }}</span>
                <img :src="`/flags/${entry.country}.png`" class="lb-flag" />
                <span class="lb-name">{{ entry.lastName }}</span>
                <span class="lb-points">{{ entry.totalPoints || entry.jump?.totalPoints }}</span>
              </div>
            </div>

            <!-- Action buttons inside panel -->
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
              :class="['result-row', { 'podium': result.position <= 3, 'dnf': !result.position }]"
            >
              <div class="result-event">
                <span class="result-location">{{ result.location }}</span>
                <span class="result-hill">{{ result.hillSize }}</span>
              </div>
              <div class="result-position">
                <span v-if="result.position === 1" class="medal gold">1</span>
                <span v-else-if="result.position === 2" class="medal silver">2</span>
                <span v-else-if="result.position === 3" class="medal bronze">3</span>
                <span v-else-if="result.stage === 'qualifying'" class="position quali">{{ result.position }}</span>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorldsStore } from '../stores/worlds'
import { useJumpersStore } from '../stores/jumpers'
import { useSeasonsStore } from '../stores/seasons'
import { useTeamsStore } from '../stores/teams'
import { useWeekStatusStore } from '../stores/weekStatus'
import '../assets/sport-view.css'
import NamePicker from '../components/NamePicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const worldsStore = useWorldsStore()
const jumpersStore = useJumpersStore()
const seasonsStore = useSeasonsStore()
const teamsStore = useTeamsStore()
const weekStatusStore = useWeekStatusStore()

const worldId = computed(() => route.params.worldId)
const world = computed(() => worldsStore.currentWorld)
const jumpers = computed(() => jumpersStore.jumpers)
const jumperCountryNames = computed(() => jumpersStore.countryNames)
const sortedCountries = computed(() => {
  const countries = jumperCountryNames.value
  if (!countries) return []
  return Object.entries(countries)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const currentSeason = computed(() => seasonsStore.currentSeason)
const seasonEvents = computed(() => seasonsStore.events)
const seasonStandingsRaw = computed(() => seasonsStore.standings)
const previousStandingsRaw = computed(() => seasonsStore.previousStandings)
const fourHillsStandings = computed(() => seasonsStore.fourHillsStandings)
const flyingCupStandings = computed(() => seasonsStore.flyingCupStandings)

// Compute position changes for standings (cached)
const positionChanges = computed(() => {
  const changes = new Map()
  if (previousStandingsRaw.value.length === 0) return changes

  // Build map of previous positions
  const prevPositions = new Map()
  previousStandingsRaw.value.forEach((s, idx) => {
    prevPositions.set(s.jumperId, idx + 1)
  })

  // Calculate change for each current standing
  seasonStandingsRaw.value.forEach((s, idx) => {
    const currentPos = idx + 1
    const prevPos = prevPositions.get(s.jumperId)
    if (prevPos === undefined) {
      changes.set(s.jumperId, 'new')
    } else if (prevPos === currentPos) {
      changes.set(s.jumperId, 0)
    } else {
      changes.set(s.jumperId, prevPos - currentPos) // Positive = up, negative = down
    }
  })

  return changes
})

function getPositionChange(jumperId) {
  return positionChanges.value.get(jumperId) ?? null
}

// Count completed Four Hills events
const completedFourHillsEvents = computed(() => {
  return seasonEvents.value.filter(e => e.tournament === 'Four Hills' && e.status === 'completed').length
})

// Count completed Ski Flying events
const completedFlyingEvents = computed(() => {
  return seasonEvents.value.filter(e => e.hill_size === 'FH' && e.status === 'completed').length
})

// Total number of Ski Flying events in the season
const totalFlyingEvents = computed(() => {
  return seasonEvents.value.filter(e => e.hill_size === 'FH').length
})

// Full standings including all jumpers (even those with 0 points)
const seasonStandings = computed(() => {
  const standingsMap = new Map()

  // Add all jumpers from the official standings first
  for (const s of seasonStandingsRaw.value) {
    standingsMap.set(s.jumperId, { ...s })
  }

  // Add all other jumpers with 0 points
  for (const jumper of jumpers.value) {
    if (!standingsMap.has(jumper.id)) {
      standingsMap.set(jumper.id, {
        jumperId: jumper.id,
        firstName: jumper.first_name,
        lastName: jumper.last_name,
        country: jumper.country,
        points: 0,
        races: 0,
        wins: 0,
        podiums: 0
      })
    }
  }

  // Sort by points descending, then by last name
  const sorted = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return a.lastName.localeCompare(b.lastName)
  })

  // Add position change to each standing
  return sorted.map(s => ({
    ...s,
    positionChange: getPositionChange(s.jumperId)
  }))
})
const seasonHistory = computed(() => seasonsStore.history)
const completedEventsCount = computed(() => seasonEvents.value.filter(e => e.status === 'completed').length)
const nextEvent = computed(() => seasonEvents.value.find(e => e.status !== 'completed'))
const progressPercent = computed(() => {
  if (seasonEvents.value.length === 0) return 0
  return Math.round((completedEventsCount.value / seasonEvents.value.length) * 100)
})
const isSeasonComplete = computed(() => seasonEvents.value.length > 0 && seasonEvents.value.every(e => e.status === 'completed'))

const activeTab = ref('season')
const standingsView = ref('overall')
const loadingJumpers = ref(true)
const loadingSeason = ref(false)
const loadingHistory = ref(false)
const generating = ref(false)

// Teams state (for athlete form dropdown and standings)
const teams = computed(() => teamsStore.teams)
const teamStandings = computed(() => teamsStore.teamStandings)

const creatingSeason = ref(false)
const completingSeason = ref(false)
const resettingSeason = ref(false)
const showResetConfirm = ref(false)
const simulating = ref(false)

const showJumperModal = ref(false)
const showNamePicker = ref(false)
const editingJumper = ref(null)
const saving = ref(false)
const formError = ref(null)
const jumperToDelete = ref(null)
const deleting = ref(false)
const showDeleteAllJumpersConfirm = ref(false)
const deletingAllJumpers = ref(false)

const jumperForm = ref({
  first_name: '', last_name: '', country: '', team_id: '',
  skill_jumping: 70, skill_flight: 70, skill_landing: 70, consistency: 70
})

// Race modal state
const selectedEvent = computed(() => seasonsStore.currentEvent)
const raceTab = ref('qualifying')
const eventJumpers = computed(() => seasonsStore.eventJumpers)
const raceResults = computed(() => {
  const results = selectedEvent.value?.results
  if (!results || !results.status) {
    return { status: 'not_started', qualifying: [], round1: [], round2: [], final: [] }
  }
  return results
})
const showRaceModal = ref(false)

// Jump animation state
const showJumpAnimation = ref(false)
const animatingJumper = ref(null)
const animatingRound = ref(null)
const animationPhase = ref('waiting') // 'waiting', 'inrun', 'takeoff', 'flight', 'landing', 'landed'
const animationResult = ref(null)
const animationRank = ref(null)
const animating = ref(false)
const jumperPosition = ref({ x: 65, y: 85 })
const leaderboardListRef = ref(null)
let currentJumperRowRef = null

// Animating jumper's overall WC rank
const animatingJumperOverallRank = computed(() => {
  if (!animatingJumper.value) return null
  const index = seasonStandings.value.findIndex(s => s.jumperId === animatingJumper.value.jumperId)
  return index >= 0 ? index + 1 : null
})

// Check if current event is Four Hills or Ski Flying
const isCurrentEventFourHills = computed(() => selectedEvent.value?.tournament === 'Four Hills')
const isCurrentEventSkiFlying = computed(() => selectedEvent.value?.hill_size === 'FH')

// Animating jumper's Four Hills rank
const animatingJumperFourHillsRank = computed(() => {
  if (!animatingJumper.value || !isCurrentEventFourHills.value) return null
  if (fourHillsStandings.value.length === 0) return null
  const index = fourHillsStandings.value.findIndex(s => s.jumperId === animatingJumper.value.jumperId)
  return index >= 0 ? index + 1 : null
})

// Animating jumper's Ski Flying Cup rank
const animatingJumperFlyingRank = computed(() => {
  if (!animatingJumper.value || !isCurrentEventSkiFlying.value) return null
  if (flyingCupStandings.value.length === 0) return null
  const index = flyingCupStandings.value.findIndex(s => s.jumperId === animatingJumper.value.jumperId)
  return index >= 0 ? index + 1 : null
})

// Competitor modal state
const showCompetitorModal = ref(false)
const selectedCompetitor = ref(null)

const selectedCompetitorRank = computed(() => {
  if (!selectedCompetitor.value) return 0
  const index = seasonStandings.value.findIndex(s => s.jumperId === selectedCompetitor.value.jumperId)
  return index >= 0 ? index + 1 : 0
})

// World Cup points table (top 30)
const wcPointsTable = [100, 80, 60, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

const competitorSeasonResults = computed(() => {
  if (!selectedCompetitor.value || !seasonEvents.value) return []

  const results = []
  const jumperId = selectedCompetitor.value.jumperId

  for (const event of seasonEvents.value) {
    if (event.status !== 'completed') continue

    const eventResults = event.results
    if (!eventResults) continue

    // First check if they're in the final results (made it to round 1)
    const finalEntry = eventResults.final?.find(e => e.jumperId === jumperId)

    if (finalEntry) {
      results.push({
        eventId: event.id,
        location: event.location,
        hillSize: event.hill_size,
        position: finalEntry.position,
        totalPoints: finalEntry.totalPoints,
        wcPoints: finalEntry.wcPoints || 0,
        stage: 'final'
      })
    } else {
      // Check if they were eliminated in qualifying
      const qualifyingEntry = eventResults.qualifying?.find(e => e.jumperId === jumperId)

      if (qualifyingEntry && qualifyingEntry.jump) {
        results.push({
          eventId: event.id,
          location: event.location,
          hillSize: event.hill_size,
          position: qualifyingEntry.rank ? `Q${qualifyingEntry.rank}` : 'DNQ',
          totalPoints: qualifyingEntry.jump?.totalPoints || null,
          wcPoints: 0,
          stage: 'qualifying'
        })
      }
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

// Animation computed values - adjusted for 600x280 SVG
const kPointX = computed(() => {
  return 300 // K-point position on the smaller SVG
})

const distanceMarkers = computed(() => {
  if (!selectedEvent.value) return []
  const kPoint = selectedEvent.value.k_point || 120
  const markers = []
  // Create markers every 10m from K-point - 10m to K-point + 30m
  for (let d = kPoint - 10; d <= kPoint + 30; d += 10) {
    const distFromK = d - kPoint
    const x = kPointX.value + distFromK * 4 // 4 pixels per meter
    const y = 210 + distFromK * 1.2 // slight downward slope
    markers.push({ distance: d, x, y })
  }
  return markers
})

// Calculate landing position based on distance - adjusted for smaller SVG
function getLandingPosition(distance) {
  if (!selectedEvent.value) return { x: 300, y: 220 }
  const kPoint = selectedEvent.value.k_point || 120
  const distFromK = distance - kPoint
  const x = kPointX.value + distFromK * 4
  const y = 210 + distFromK * 1.2
  return { x, y }
}

// Helper functions for rank display
function getRankClass(rank) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  if (rank <= 30) return 'qualified'
  return 'not-qualified'
}

function getRankLabel(rank) {
  if (rank === 1) return 'Leader!'
  if (rank === 2) return '2nd place'
  if (rank === 3) return '3rd place'
  if (rank <= 10) return `${rank}th place`
  return `${rank}th`
}

// Check if there's a next jumper to animate
const hasNextJumper = computed(() => {
  if (!animatingRound.value) return false

  if (animatingRound.value === 'qualifying') {
    return pendingQualifying.value.length > 0
  } else if (animatingRound.value === 'round1') {
    return pendingRound1.value.length > 0
  } else if (animatingRound.value === 'round2') {
    return pendingRound2.value.length > 0
  }
  return false
})

// Count of remaining jumpers in current round
const remainingJumpersCount = computed(() => {
  if (!animatingRound.value) return 0

  if (animatingRound.value === 'qualifying') {
    return pendingQualifying.value.length
  } else if (animatingRound.value === 'round1') {
    return pendingRound1.value.length
  } else if (animatingRound.value === 'round2') {
    return pendingRound2.value.length
  }
  return 0
})

// Get the next jumper in line (following start order)
function getNextJumper() {
  if (!animatingRound.value || !animatingJumper.value) return null

  let pending = []
  if (animatingRound.value === 'qualifying') {
    pending = pendingQualifying.value
  } else if (animatingRound.value === 'round1') {
    pending = pendingRound1.value
  } else if (animatingRound.value === 'round2') {
    pending = pendingRound2.value
  }

  if (pending.length === 0) return null

  const currentBib = animatingJumper.value.bibNumber

  // Round 2: leader (highest bib) jumps first, so next is lower bib
  // Qualifying/Round 1: lowest bib jumps first, so next is higher bib
  if (animatingRound.value === 'round2') {
    // Find jumper with next lower bib number
    const nextLowerBib = pending
      .filter(j => j.bibNumber < currentBib)
      .sort((a, b) => b.bibNumber - a.bibNumber)[0]
    // If found, return it; otherwise wrap to highest bib
    return nextLowerBib || pending[0]
  } else {
    // Find jumper with next higher bib number
    const nextHigherBib = pending
      .filter(j => j.bibNumber > currentBib)
      .sort((a, b) => a.bibNumber - b.bibNumber)[0]
    // If found, return it; otherwise wrap to lowest bib
    return nextHigherBib || pending[pending.length - 1]
  }
}

// Animate the next jumper
async function animateNextJumper() {
  const nextJumper = getNextJumper()
  if (nextJumper && animatingRound.value) {
    await startJumpAnimation(nextJumper, animatingRound.value)
  }
}

// Get full standings for leaderboard (all completed jumpers)
const nearbyRankings = computed(() => {
  if (!animatingRound.value) return []

  let completedJumpers = []
  if (animatingRound.value === 'qualifying') {
    completedJumpers = completedQualifying.value
  } else if (animatingRound.value === 'round1') {
    completedJumpers = completedRound1.value
  } else if (animatingRound.value === 'round2') {
    completedJumpers = completedRound2.value
  }

  // Return all completed jumpers sorted by rank
  return completedJumpers
})

// Race tab access
const canAccessQualifying = computed(() => true)
const canAccessRound1 = computed(() => ['round1', 'round2', 'completed'].includes(raceResults.value.status))
const canAccessRound2 = computed(() => ['round2', 'completed'].includes(raceResults.value.status))

// Round completion checks
const isQualifyingComplete = computed(() => raceResults.value.qualifying?.length > 0 && raceResults.value.qualifying.every(e => e.jump !== null))
const isRound1Complete = computed(() => raceResults.value.round1?.length > 0 && raceResults.value.round1.every(e => e.jump !== null))
const isRound2Complete = computed(() => raceResults.value.status === 'completed')

// Sorted results
const sortedQualifying = computed(() => {
  if (!raceResults.value.qualifying) return []
  return [...raceResults.value.qualifying].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank
    if (a.rank) return -1
    if (b.rank) return 1
    return a.bibNumber - b.bibNumber
  })
})
const sortedRound1 = computed(() => {
  if (!raceResults.value.round1) return []
  return [...raceResults.value.round1].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank
    if (a.rank) return -1
    if (b.rank) return 1
    return a.bibNumber - b.bibNumber
  })
})
const sortedRound2 = computed(() => {
  if (!raceResults.value.round2) return []
  return [...raceResults.value.round2].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank
    if (a.rank) return -1
    if (b.rank) return 1
    return a.bibNumber - b.bibNumber
  })
})

// Sorted by bib number for jump-by-jump display
const sortedByBibQualifying = computed(() => {
  if (!raceResults.value.qualifying) return []
  // Show in jump order: bib 1 at top (jumps first), highest bib at bottom (jumps last)
  return [...raceResults.value.qualifying].sort((a, b) => a.bibNumber - b.bibNumber)
})

const sortedByBibRound1 = computed(() => {
  if (!raceResults.value.round1) return []
  // Show in jump order: bib 1 at top (jumps first), highest bib at bottom (jumps last)
  return [...raceResults.value.round1].sort((a, b) => a.bibNumber - b.bibNumber)
})

const sortedByBibRound2 = computed(() => {
  if (!raceResults.value.round2) return []
  // Round 2 jumps in reverse order of round 1 standings (leader jumps last)
  return [...raceResults.value.round2].sort((a, b) => b.bibNumber - a.bibNumber)
})

// Pending (not jumped yet) and completed (already jumped) lists for each round
const pendingQualifying = computed(() => {
  return sortedByBibQualifying.value.filter(e => !e.jump)
})

const completedQualifying = computed(() => {
  if (!raceResults.value.qualifying) return []
  // Sort by jump totalPoints (highest first)
  const jumped = [...raceResults.value.qualifying].filter(e => e.jump)
  jumped.sort((a, b) => (b.jump?.totalPoints || 0) - (a.jump?.totalPoints || 0))
  // Assign live ranks
  jumped.forEach((entry, index) => { entry.liveRank = index + 1 })
  return jumped
})

const pendingRound1 = computed(() => {
  return sortedByBibRound1.value.filter(e => !e.jump)
})

const completedRound1 = computed(() => {
  if (!raceResults.value.round1) return []
  // Sort by totalPoints (highest first)
  const jumped = [...raceResults.value.round1].filter(e => e.jump)
  jumped.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
  // Assign live ranks
  jumped.forEach((entry, index) => { entry.liveRank = index + 1 })
  return jumped
})

const pendingRound2 = computed(() => {
  // Round 2 start order: reverse of round 1 standings (leader jumps last)
  // Backend assigns: Bib 1 = was 30th in R1, Bib 30 = was 1st in R1
  // Display in jumping order: bib 1 first (jumps first), bib 30 last (R1 winner, jumps last)
  if (!raceResults.value.round2) return []
  return [...raceResults.value.round2]
    .filter(e => !e.jump)
    .sort((a, b) => a.bibNumber - b.bibNumber)
})

const completedRound2 = computed(() => {
  if (!raceResults.value.round2) return []
  // Sort by combined totalPoints (R1 + R2), highest first
  const jumped = [...raceResults.value.round2].filter(e => e.jump)
  jumped.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
  // Assign live ranks
  jumped.forEach((entry, index) => { entry.liveRank = index + 1 })
  return jumped
})

// Check if a jumper is next in line to jump
function isNextJumper(entry, round) {
  // For all rounds, the next jumper is the one with the lowest bib number (bib 1 jumps first)
  let roundData = null
  if (round === 'qualifying') roundData = raceResults.value.qualifying
  else if (round === 'round1') roundData = raceResults.value.round1
  else if (round === 'round2') roundData = raceResults.value.round2

  if (!roundData) return false
  const pending = roundData.filter(e => !e.jump)
  if (pending.length === 0) return false

  // Next jumper is the one with the lowest bib number
  const nextJumper = pending.reduce((min, e) => e.bibNumber < min.bibNumber ? e : min, pending[0])
  return nextJumper.jumperId === entry.jumperId
}

function getOverall(jumper) {
  return Math.round((jumper.skill_jumping + jumper.skill_flight + jumper.skill_landing + jumper.consistency) / 4)
}

function getSkillClass(value) {
  if (value >= 90) return 'skill skill-elite'
  if (value >= 80) return 'skill skill-high'
  if (value >= 70) return 'skill skill-good'
  if (value >= 60) return 'skill skill-average'
  return 'skill skill-low'
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getCountryName(code) {
  return jumperCountryNames.value?.[code] || code
}

function getEventPodium(event) {
  if (!event.results?.final) return []
  return event.results.final
    .filter(e => e.position <= 3)
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
}

function getJumperTeam(jumper) {
  if (!jumper.team_id) return null
  return teams.value.find(t => t.id === jumper.team_id)
}

function goBack() { router.push(`/world/${worldId.value}`) }
function handleLogout() { authStore.logout(); router.push('/login') }

// Jumpers functions
async function handleGenerateJumpers() {
  generating.value = true
  try { await jumpersStore.generateJumpers(worldId.value) }
  catch (error) { console.error('Failed to generate jumpers:', error) }
  finally { generating.value = false }
}

async function openAddJumperModal() {
  // Load teams and countries to ensure they're available
  await Promise.all([
    teamsStore.fetchTeams(worldId.value),
    Object.keys(jumperCountryNames.value).length === 0 ? jumpersStore.fetchCountries() : Promise.resolve()
  ])
  editingJumper.value = null
  jumperForm.value = { first_name: '', last_name: '', country: '', team_id: '', skill_jumping: 70, skill_flight: 70, skill_landing: 70, consistency: 70 }
  formError.value = null
  showJumperModal.value = true
}

async function openEditJumperModal(jumper) {
  // Load teams and countries to ensure they're available
  await Promise.all([
    teamsStore.fetchTeams(worldId.value),
    Object.keys(jumperCountryNames.value).length === 0 ? jumpersStore.fetchCountries() : Promise.resolve()
  ])
  editingJumper.value = jumper
  jumperForm.value = { first_name: jumper.first_name, last_name: jumper.last_name, country: jumper.country, team_id: jumper.team_id || '', skill_jumping: jumper.skill_jumping, skill_flight: jumper.skill_flight, skill_landing: jumper.skill_landing, consistency: jumper.consistency }
  formError.value = null
  showJumperModal.value = true
}

function handleNamePicked(data) {
  jumperForm.value.first_name = data.first_name
  jumperForm.value.last_name = data.last_name
  if (data.country_code) jumperForm.value.country = data.country_code
}

function closeJumperModal() { showJumperModal.value = false; editingJumper.value = null }

function randomizeSkills(level) {
  if (level === 'random') {
    // Completely random: 40-99
    const randomSkill = () => 40 + Math.floor(Math.random() * 60)
    jumperForm.value.skill_jumping = randomSkill()
    jumperForm.value.skill_flight = randomSkill()
    jumperForm.value.skill_landing = randomSkill()
    jumperForm.value.consistency = randomSkill()
    return
  }

  const configs = {
    strong: { base: 85, variance: 10 },   // Range: 75-95
    average: { base: 70, variance: 15 },  // Range: 55-85
    low: { base: 55, variance: 15 }       // Range: 40-70
  }
  const config = configs[level]
  if (!config) return

  const randomSkill = () => Math.max(1, Math.min(99, config.base + Math.floor((Math.random() - 0.5) * 2 * config.variance)))

  jumperForm.value.skill_jumping = randomSkill()
  jumperForm.value.skill_flight = randomSkill()
  jumperForm.value.skill_landing = randomSkill()
  jumperForm.value.consistency = randomSkill()
}

async function handleSaveJumper() {
  saving.value = true
  formError.value = null
  try {
    if (editingJumper.value) await jumpersStore.updateJumper(editingJumper.value.id, jumperForm.value)
    else await jumpersStore.createJumper(worldId.value, jumperForm.value)
    closeJumperModal()
  } catch (error) { formError.value = error.response?.data?.error || 'Failed to save jumper' }
  finally { saving.value = false }
}

function confirmDeleteJumper(jumper) { jumperToDelete.value = jumper }

async function handleDeleteJumper() {
  if (!jumperToDelete.value) return
  deleting.value = true
  try { await jumpersStore.deleteJumper(jumperToDelete.value.id); jumperToDelete.value = null }
  catch (error) { console.error('Failed to delete jumper:', error) }
  finally { deleting.value = false }
}

async function handleDeleteAllJumpers() {
  deletingAllJumpers.value = true
  try {
    await jumpersStore.deleteAllJumpers(worldId.value)
    showDeleteAllJumpersConfirm.value = false
  } catch (error) { console.error('Failed to delete all jumpers:', error) }
  finally { deletingAllJumpers.value = false }
}

// Season functions
async function loadSeason() {
  if (loadingSeason.value) return
  loadingSeason.value = true
  try { await seasonsStore.fetchCurrentSeason(worldId.value) }
  catch (error) { console.error('Failed to load season:', error) }
  finally { loadingSeason.value = false }
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try { await seasonsStore.createSeason(worldId.value) }
  catch (error) { console.error('Failed to create season:', error) }
  finally { creatingSeason.value = false }
}

async function handleCompleteSeason() {
  if (!currentSeason.value) return
  completingSeason.value = true
  try {
    await seasonsStore.completeSeason(currentSeason.value.id)
    await seasonsStore.fetchCurrentSeason(worldId.value)
  } catch (error) { console.error('Failed to complete season:', error) }
  finally { completingSeason.value = false }
}

async function handleResetSeason() {
  if (!currentSeason.value) return
  resettingSeason.value = true
  try {
    await seasonsStore.resetSeason(currentSeason.value.id)
    showResetConfirm.value = false
  } catch (error) { console.error('Failed to reset season:', error) }
  finally { resettingSeason.value = false }
}

async function handleEventClick(event) {
  // Check if event is locked
  if (weekStatusStore.isEventLocked(event.date)) {
    alert(`This event is locked. Complete all events in ${weekStatusStore.formattedWeek} first.`)
    return
  }
  raceTab.value = 'qualifying'
  showRaceModal.value = true
  try { await seasonsStore.fetchEvent(event.id) }
  catch (error) { console.error('Failed to load event:', error) }
}

function closeRaceModal() {
  showRaceModal.value = false
  seasonsStore.clearCurrentEvent()
  // Refresh season data to get updated standings
  loadSeason()
}

// Race simulation functions
async function handleStartQualifying() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.startQualifying(selectedEvent.value.id)
  } catch (error) {
    console.error('Failed to start qualifying:', error)
  }
  finally { simulating.value = false }
}

async function handleSimulateQualifying() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.simulateQualifying(selectedEvent.value.id)
  } catch (error) { console.error('Failed to simulate qualifying:', error) }
  finally { simulating.value = false }
}

async function handleStartRound1() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.startRound1(selectedEvent.value.id)
    raceTab.value = 'round1'
  } catch (error) { console.error('Failed to start round 1:', error) }
  finally { simulating.value = false }
}

async function handleSimulateRound1() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.simulateRound1(selectedEvent.value.id)
  } catch (error) { console.error('Failed to simulate round 1:', error) }
  finally { simulating.value = false }
}

async function handleStartRound2() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.startRound2(selectedEvent.value.id)
    raceTab.value = 'round2'
  } catch (error) { console.error('Failed to start round 2:', error) }
  finally { simulating.value = false }
}

async function handleSimulateRound2() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.simulateRound2(selectedEvent.value.id)
  } catch (error) { console.error('Failed to simulate round 2:', error) }
  finally { simulating.value = false }
}

async function handleFinishRace() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    // Call simulate-round2 which will finalize since all jumps are done
    await seasonsStore.simulateRound2(selectedEvent.value.id)
  } catch (error) { console.error('Failed to finish race:', error) }
  finally { simulating.value = false }
}

// Single jump simulation handlers
async function handleSimulateNext() {
  if (!selectedEvent.value) return
  simulating.value = true
  try {
    await seasonsStore.simulateNextJump(selectedEvent.value.id)
  } catch (error) { console.error('Failed to simulate next jump:', error) }
  finally { simulating.value = false }
}

// Jump animation functions
async function startJumpAnimation(entry, round) {
  animatingJumper.value = entry
  animatingRound.value = round
  animationPhase.value = 'waiting'
  animationResult.value = null
  animationRank.value = null
  animating.value = true
  showJumpAnimation.value = true

  // Reset position to start (adjusted for smaller SVG)
  jumperPosition.value = { x: 45, y: 55 }

  // Start animation sequence after a short delay
  await sleep(300)

  // Phase 1: In-run (slide down the ramp)
  animationPhase.value = 'inrun'
  await animateToPosition({ x: 105, y: 175 }, 700)

  // Phase 2: Take-off
  animationPhase.value = 'takeoff'
  await animateToPosition({ x: 128, y: 160 }, 150)

  // Phase 3: Flight - simulate the jump now to get the distance
  animationPhase.value = 'flight'

  // Simulate the actual jump
  try {
    await seasonsStore.simulateSingleJump(selectedEvent.value.id, entry.jumperId)

    // Get the result from the updated race results
    const results = seasonsStore.currentEvent?.results
    let jumpResult = null

    if (round === 'qualifying') {
      jumpResult = results?.qualifying?.find(e => e.jumperId === entry.jumperId)
    } else if (round === 'round1') {
      jumpResult = results?.round1?.find(e => e.jumperId === entry.jumperId)
    } else if (round === 'round2') {
      jumpResult = results?.round2?.find(e => e.jumperId === entry.jumperId)
    }

    if (jumpResult?.jump) {
      animationResult.value = jumpResult.jump
      animationRank.value = jumpResult.rank

      // Animate to landing position
      const landingPos = getLandingPosition(jumpResult.jump.distance)
      await animateToPosition(landingPos, 1000)

      // Phase 4: Landing
      animationPhase.value = 'landing'
      await sleep(200)

      // Phase 5: Landed
      animationPhase.value = 'landed'

      // Scroll to current jumper in standings
      await nextTick()
      scrollToCurrentJumper()
    }
  } catch (error) {
    console.error('Failed to simulate jump:', error)
    closeAnimation()
  }

  animating.value = false
}

function scrollToCurrentJumper() {
  if (currentJumperRowRef && leaderboardListRef.value) {
    currentJumperRowRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function closeAnimation() {
  showJumpAnimation.value = false
  animatingJumper.value = null
  animatingRound.value = null
  animationPhase.value = 'waiting'
  animationResult.value = null
  animationRank.value = null
  animating.value = false
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function animateToPosition(target, duration) {
  const start = { ...jumperPosition.value }
  const startTime = Date.now()

  return new Promise(resolve => {
    function step() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for smooth deceleration
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

// History functions
async function loadHistory() {
  if (loadingHistory.value) return
  loadingHistory.value = true
  try { await seasonsStore.fetchHistory(worldId.value) }
  catch (error) { console.error('Failed to load history:', error) }
  finally { loadingHistory.value = false }
}

// Team standings function
async function loadTeamStandings() {
  try {
    await teamsStore.fetchTeamStandings(worldId.value, 'skijumping')
  } catch (error) {
    console.error('Failed to load team standings:', error)
  }
}

onMounted(async () => {
  try {
    if (!world.value || world.value.id !== worldId.value) await worldsStore.fetchWorld(worldId.value)
    await Promise.all([
      jumpersStore.fetchJumpers(worldId.value),
      teamsStore.fetchTeams(worldId.value),
      weekStatusStore.fetchWeekStatus(worldId.value)
    ])
    // Load season since Calendar is the default tab
    loadSeason()
  } catch (error) { console.error('Failed to load data:', error) }
  finally { loadingJumpers.value = false }
})
</script>

<style scoped>
.ski-jumping-page { min-height: 100vh; background: #f8fafc; color: #1e293b; }
.page-header { background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); padding: 0.75rem 0; position: sticky; top: 0; z-index: 100; }
.header-content { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.back-btn { padding: 0.5rem; }
.brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1.1rem; color: #3b82f6; }
.breadcrumb { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: #64748b; }
.world-name, .sport-name { display: flex; align-items: center; gap: 0.5rem; }
.world-name { color: #64748b; }
.world-name i, .sport-name i { color: #3b82f6; }
.separator { color: #475569; font-size: 0.7rem; }
.sport-name { color: #3b82f6; font-weight: 500; }
.page-main { padding: 2rem 0; }

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
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.nav-tab.active .nav-tab-icon {
  color: white;
}

.nav-tab.active .nav-tab-label {
  color: white;
}

.nav-tab.active .nav-tab-count,
.nav-tab.active .nav-tab-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-tab.active .nav-tab-leader {
  color: rgba(255, 255, 255, 0.9);
}

.nav-tab-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 0.5rem;
  color: var(--primary-500);
  font-size: 1rem;
  transition: all 0.2s;
}

.nav-tab.active .nav-tab-icon {
  background: rgba(255, 255, 255, 0.2);
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
  color: #1e293b;
  transition: color 0.2s;
}

.nav-tab-count {
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.125rem 0.4rem;
  border-radius: 1rem;
  transition: all 0.2s;
}

.nav-tab-badge {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-tab-badge i {
  font-size: 0.4rem;
}

.nav-tab-leader {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.leader-flag {
  width: 16px;
  height: 11px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .nav-tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
    margin: 0 -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .nav-tab {
    flex-shrink: 0;
    padding: 0.5rem 1rem;
  }

  .nav-tab-content {
    display: none;
  }

  .nav-tab-icon {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }
}

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.section-title { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 600; color: #1e293b; margin: 0; }
.section-title i { color: var(--primary-500); }
.section-title .count { font-weight: 400; color: #64748b; }

.jumpers-table-container { background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
.jumpers-table { width: 100%; border-collapse: collapse; }
.jumpers-table th, .jumpers-table td { padding: 0.875rem 1rem; text-align: left; }
.jumpers-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
.jumpers-table tbody tr { border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s; }
.jumpers-table tbody tr:hover { background: var(--primary-50); }
.jumpers-table tbody tr:last-child { border-bottom: none; }
.col-country { width: 100px; display: flex; align-items: center; gap: 0.5rem; }
.flag { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); }
.country-code { font-size: 0.75rem; color: #64748b; font-weight: 500; }
.col-name { font-weight: 500; }
.col-team { width: 80px; text-align: center; }
.team-badge { display: inline-block; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 600; color: white; text-transform: uppercase; }
.no-team { color: #64748b; font-size: 0.75rem; }
.col-skill { width: 60px; text-align: center; }
.col-actions { width: 100px; text-align: right; }
.skill { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; font-weight: 600; }
.skill-elite { background: #dcfce7; color: #166534; }
.skill-high { background: #dbeafe; color: #1e40af; }
.skill-good { background: #e0e7ff; color: #3730a3; }
.skill-average { background: #fef3c7; color: #92400e; }
.skill-low { background: #fee2e2; color: #991b1b; }
.overall { font-weight: 700; }
.delete-btn:hover { color: var(--error) !important; }
.text-danger { color: var(--error) !important; }
.text-danger:hover { color: #b91c1c !important; }

.empty-state, .loading-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.loading-state i { font-size: 2rem; color: var(--primary-500); display: block; margin-bottom: 1rem; }
.empty-icon { width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary-100), var(--primary-200)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
.empty-icon i { font-size: 2rem; color: var(--primary-500); }
.empty-state h3 { font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin-bottom: 0.5rem; }
.empty-state p { color: #64748b; margin-bottom: 1.5rem; }
.warning-text { color: var(--warning); font-size: 0.875rem; margin-top: 1rem; }
.warning-text i { margin-right: 0.5rem; }
.btn-lg { padding: 1rem 2rem; font-size: 1.125rem; }

.season-content { display: flex; flex-direction: column; gap: 1.5rem; }
.season-header-card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: space-between; }
.season-info h2 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 700; color: var(--gray-900); margin: 0 0 1rem; }
.season-info h2 i { color: var(--warning); }
.season-progress { display: flex; flex-direction: column; gap: 0.5rem; }
.progress-text { font-size: 0.875rem; color: #94a3b8; }
.progress-bar { height: 8px; background: var(--gray-200); border-radius: 4px; width: 300px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary-500), var(--primary-600)); border-radius: 4px; transition: width 0.3s ease; }
.btn-success { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
.btn-success:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); }

.season-grid { display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem; }
.season-calendar, .season-standings { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.section-subtitle { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0 0 1rem; }
.section-subtitle i { color: var(--primary-500); }

.events-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 500px; overflow-y: auto; }
.event-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; border: 1px solid var(--gray-100); }
.event-item:hover { background: var(--primary-50); border-color: var(--primary-200); }
.event-item.completed { background: #f8fafc; }
.event-item.completed .event-status-icon { color: var(--success); }
.event-item.scheduled .event-status-icon { color: #64748b; }
.event-number { width: 24px; height: 24px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; color: #94a3b8; }
.event-item.completed .event-number { background: var(--success); color: white; }
.event-status-icon { font-size: 0.75rem; }
.event-info { flex: 1; }
.event-name { font-weight: 500; color: #1e293b; margin-bottom: 0.25rem; }
.event-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #64748b; }
.event-flag { width: 16px; height: 11px; border-radius: 1px; }
.event-date { margin-left: auto; }
.event-action { color: #64748b; }
.event-item.scheduled .event-action { color: var(--primary-500); }

.event-podium { display: flex; gap: 0.75rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--gray-200); }
.podium-entry { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; }
.podium-medal { width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: white; }
.podium-medal.gold { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); }
.podium-medal.silver { background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); }
.podium-medal.bronze { background: linear-gradient(135deg, #d97706 0%, #92400e 100%); }
.podium-flag { width: 14px; height: 10px; object-fit: cover; border-radius: 2px; }
.podium-name { color: #475569; font-weight: 500; }

.no-standings { text-align: center; padding: 2rem; color: #64748b; }
.standings-list { display: flex; flex-direction: column; gap: 0.5rem; }
.standing-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; }
.standing-item.top-3 { background: var(--primary-50); }
.standing-position { width: 28px; text-align: center; }
.medal { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: white; }
.medal.gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
.medal.silver { background: linear-gradient(135deg, #9ca3af, #6b7280); }
.medal.bronze { background: linear-gradient(135deg, #d97706, #b45309); }
.position { font-size: 0.875rem; font-weight: 500; color: #64748b; }

/* Calendar Grid */
.calendar-full {
  width: 100%;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.calendar-event {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.calendar-event:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.calendar-event.completed {
  border-color: var(--success);
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.calendar-event.is-locked {
  opacity: 0.6;
  cursor: not-allowed;
  position: relative;
}

.calendar-event.is-locked:hover {
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(100, 116, 139, 0.85);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
  color: white;
}

.lock-overlay i {
  font-size: 1.5rem;
}

.lock-overlay span {
  font-size: 0.875rem;
  font-weight: 600;
}

.calendar-event.in_progress {
  border-color: var(--primary-500);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.calendar-event.is-tournament {
  border-color: #f59e0b;
}

.calendar-event.is-tournament.scheduled {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.calendar-event.is-skiflying {
  border-color: #8b5cf6;
}

.calendar-event.is-skiflying.scheduled {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

.calendar-event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.event-number-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.tournament-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.skiflying-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.event-status-badge {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.event-status-badge.completed {
  background: var(--success);
  color: white;
}

.event-status-badge.in_progress {
  background: var(--primary-500);
  color: white;
}

.event-status-badge.scheduled {
  background: var(--gray-200);
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
  width: 40px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.location-details {
  display: flex;
  flex-direction: column;
}

.location-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--gray-900);
}

.location-country {
  font-size: 0.8rem;
  color: #64748b;
}

.event-hill-info {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.hill-size {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.hill-kpoint {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-600);
  background: var(--primary-50);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.event-date-display {
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-event-podium {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 0.75rem;
}

.podium-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.podium-pos {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
}

.podium-pos.gold { background: linear-gradient(135deg, #fbbf24, #d97706); }
.podium-pos.silver { background: linear-gradient(135deg, #9ca3af, #6b7280); }
.podium-pos.bronze { background: linear-gradient(135deg, #d97706, #92400e); }

.podium-flag-sm {
  width: 16px;
  height: 11px;
  object-fit: cover;
  border-radius: 2px;
}

.podium-jumper {
  color: #475569;
  font-weight: 500;
}

.calendar-event-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.calendar-event-footer .btn {
  width: 100%;
  justify-content: center;
}

/* Standings Container */
.standings-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .standings-container {
    grid-template-columns: 1fr;
  }
}

/* Compact Standings */
.standings-compact {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.standings-switcher {
  display: flex;
  background: #f1f5f9;
  padding: 0.5rem;
  gap: 0.5rem;
}

.standings-switch {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
}

.standings-switch:hover:not(.disabled) {
  background: white;
  color: #1e293b;
}

.standings-switch.active {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.standings-switch.active i {
  color: var(--primary-500);
}

.standings-switch.four-hills.active i {
  color: #d97706;
}

.standings-switch.flying.active i {
  color: #8b5cf6;
}

.standings-switch.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.standings-switch i {
  font-size: 1.25rem;
  color: #64748b;
  transition: color 0.2s;
}

.standings-switch span {
  font-size: 0.8rem;
  font-weight: 600;
}

.switch-count {
  font-size: 0.7rem !important;
  font-weight: 500 !important;
  color: #64748b;
  background: var(--gray-200);
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
}

.standings-switch.active .switch-count {
  background: var(--primary-100);
  color: var(--primary-600);
}

.standings-switch.four-hills.active .switch-count {
  background: #fef3c7;
  color: #92400e;
}

.standings-switch.flying.active .switch-count {
  background: #ede9fe;
  color: #6d28d9;
}

.standings-panel {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.standings-panel.four-hills-panel {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.standings-panel.flying-panel {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

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

.no-standings {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.no-standings i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--gray-300);
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
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.standing-row:hover {
  background: #f8fafc;
  transform: translateX(2px);
}

.standing-row.top-3 {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
}

.four-hills-panel .standing-row {
  background: rgba(255, 255, 255, 0.8);
}

.four-hills-panel .standing-row:hover {
  background: white;
}

.flying-panel .standing-row {
  background: rgba(255, 255, 255, 0.8);
}

.flying-panel .standing-row:hover {
  background: white;
}

.standing-rank {
  width: 28px;
  text-align: center;
}

.rank-num {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.position-change {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
.position-change.up {
  color: #059669;
  background: #d1fae5;
}
.position-change.down {
  color: #dc2626;
  background: #fee2e2;
}
.position-change.same {
  color: #6b7280;
}
.position-change.new {
  color: #f59e0b;
  background: #fef3c7;
}
.position-change i {
  font-size: 0.65rem;
  margin-right: 1px;
}
.same-dash {
  opacity: 0.5;
}

.standing-flag-sm {
  width: 22px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.standing-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.standing-name-compact {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standing-firstname {
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standing-data {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  text-align: right;
}

.standing-pts {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--primary-600);
}

.four-hills-pts {
  color: #d97706;
}

.flying-pts {
  color: #7c3aed;
}

.standing-races-sm,
.standing-events-sm {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

@media (max-width: 640px) {
  .standings-switcher {
    flex-direction: column;
  }

  .standings-switch {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
  }

  .standing-firstname {
    display: none;
  }
}

/* Yellow Jersey - Race leader highlight */
tr.yellow-jersey {
  background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%) !important;
}
tr.yellow-jersey td {
  border-top: 1px solid #facc15;
  border-bottom: 1px solid #facc15;
}
tr.yellow-jersey td:first-child {
  border-left: 1px solid #facc15;
}
tr.yellow-jersey td:last-child {
  border-right: 1px solid #facc15;
}
.standing-flag { width: 20px; height: 13px; border-radius: 1px; }
.standing-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
.standing-stats { display: flex; align-items: center; gap: 0.75rem; }
.standing-races { font-size: 0.75rem; color: #64748b; }
.standing-points { font-size: 0.875rem; font-weight: 600; color: var(--primary-600); }

.wc-standings-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid var(--primary-300);
}

.wc-standings-card .standings-list {
  background: white;
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.history-list { display: flex; flex-direction: column; gap: 1.5rem; }
.history-card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
.history-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem; font-weight: 600; color: var(--gray-900); margin: 0; }
.history-header h3 i { color: var(--warning); }
.history-races { font-size: 0.875rem; color: #64748b; }
.history-top10 { display: flex; flex-direction: column; gap: 0.5rem; }
.history-entry { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; }
.history-entry.top-3 { background: var(--primary-50); }
.history-position { width: 28px; text-align: center; }
.history-flag { width: 20px; height: 13px; border-radius: 1px; }
.history-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
.history-points { font-size: 0.875rem; font-weight: 600; color: var(--primary-600); min-width: 70px; text-align: right; }
.history-stats { display: flex; gap: 0.75rem; font-size: 0.75rem; color: #64748b; }
.history-stats i { margin-right: 0.25rem; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: white; border-radius: 1rem; width: 100%; max-width: 480px; padding: 1.5rem; max-height: 90vh; overflow-y: auto; }
.jumper-modal { max-width: 560px; }
.race-modal { max-width: 900px; max-height: 85vh; }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
.modal-header h2 { font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin: 0; }
.race-meta { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.875rem; color: #64748b; }
.race-flag { width: 20px; height: 13px; border-radius: 1px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.skills-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200); }
.skills-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.skills-header h3 { font-size: 0.875rem; font-weight: 600; color: #475569; margin: 0; }
.randomize-buttons { display: flex; gap: 0.375rem; }
.skill-btn-strong { color: var(--success) !important; border-color: var(--success) !important; }
.skill-btn-strong:hover { background: var(--success) !important; color: white !important; }
.skill-btn-average { color: var(--primary-500) !important; border-color: var(--primary-500) !important; }
.skill-btn-average:hover { background: var(--primary-500) !important; color: white !important; }
.skill-btn-low { color: var(--gray-500) !important; border-color: var(--gray-400) !important; }
.skill-btn-low:hover { background: var(--gray-500) !important; color: white !important; }
.skill-btn-random { color: var(--warning) !important; border-color: var(--warning) !important; }
.skill-btn-random:hover { background: var(--warning) !important; color: white !important; }
.skills-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.skill-input label { display: block; font-size: 0.75rem; font-weight: 500; color: #94a3b8; margin-bottom: 0.25rem; }
.skill-input input { text-align: center; }
.modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
.error-message { display: flex; align-items: center; gap: 0.5rem; background: #fef2f2; color: var(--error); padding: 0.75rem 1rem; border-radius: 0.5rem; margin-top: 1rem; }
.delete-warning { color: #94a3b8; line-height: 1.6; }
.delete-warning strong { color: var(--gray-900); }
.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
.btn-danger:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.btn-sm { padding: 0.5rem; font-size: 0.875rem; }

/* Race Tabs */
.race-tabs { display: flex; gap: 0.25rem; background: #f1f5f9; padding: 0.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
.race-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border: none; background: transparent; color: #94a3b8; font-weight: 500; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s; }
.race-tab:hover:not(.disabled) { background: white; color: #1e293b; }
.race-tab.active { background: white; color: var(--primary-600); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.race-tab.disabled { opacity: 0.5; cursor: not-allowed; }
.tab-check { color: var(--success); }

.race-tab-content { min-height: 300px; }
.race-start-section, .race-simulate-section { text-align: center; padding: 2rem; }
.start-icon { width: 64px; height: 64px; background: linear-gradient(135deg, var(--primary-100), var(--primary-200)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.start-icon i { font-size: 1.5rem; color: var(--primary-600); }
.race-start-section h3 { font-size: 1.125rem; font-weight: 600; color: var(--gray-900); margin-bottom: 0.5rem; }
.race-start-section p, .round-info { color: #64748b; margin-bottom: 1.5rem; }

.results-table-container { background: #f8fafc; border-radius: 0.5rem; overflow: hidden; }
.results-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; color: #94a3b8; }
.results-header.completed { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; font-weight: 600; }
.results-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.results-table th { background: #f1f5f9; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; color: #475569; font-size: 0.75rem; text-transform: uppercase; }
.results-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
.results-table tbody tr:last-child td { border-bottom: none; }
.results-table .col-rank { width: 50px; text-align: center; }
.results-table .col-bib { width: 50px; text-align: center; }
.results-table .col-country { width: 50px; }
.results-table .col-distance { width: 80px; text-align: right; }
.results-table .col-points { width: 70px; text-align: right; font-weight: 600; }
.results-table .col-status { width: 60px; text-align: center; }
.results-table .col-wc { width: 60px; text-align: center; }
.results-table .col-action { width: 60px; text-align: center; }
.result-flag { width: 20px; height: 13px; border-radius: 1px; }
.rank-qualified { color: var(--success); font-weight: 600; }
.status-badge { display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 700; text-transform: uppercase; }
.status-badge.qualified { background: #dcfce7; color: #166534; }
.status-badge.not-qualified { background: #fee2e2; color: #991b1b; }
.status-badge.pending { background: var(--gray-200); color: #64748b; }
.results-table tr.qualified { background: rgba(34, 197, 94, 0.05); }
.results-table tr.not-qualified { opacity: 0.6; }
.results-table tr.podium { background: rgba(59, 130, 246, 0.05); }
.results-table tr.points { background: rgba(59, 130, 246, 0.02); }
.results-table .total { font-weight: 700; }
.wc-points { color: var(--success); font-weight: 600; }
.final-results .col-name { min-width: 150px; }

/* Jump-by-jump simulation styles */
.simulate-buttons { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1rem; }
.btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
.btn-xs i { font-size: 0.625rem; }
.results-table tr.current-jumper { background: rgba(59, 130, 246, 0.15); animation: pulse-highlight 1.5s ease-in-out infinite; }
@keyframes pulse-highlight {
  0%, 100% { background: rgba(59, 130, 246, 0.1); }
  50% { background: rgba(59, 130, 246, 0.2); }
}

/* Dual view layout (start list + live ranking) */
.race-dual-view { display: flex; flex-direction: column; gap: 1.5rem; }
.section-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.75rem; }
.section-label i { color: var(--primary-500); }
.round-note { margin-left: auto; font-weight: 400; color: #64748b; font-size: 0.75rem; }

.start-list-section { background: white; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }
.start-list-container { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border-radius: 0.5rem; padding: 0.5rem; background: #f8fafc; }
.start-list-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 0.375rem; background: white; transition: all 0.15s; }
.start-list-item:hover { background: var(--primary-50); }
.start-list-item.next-jumper { background: rgba(59, 130, 246, 0.1); border: 1px solid var(--primary-300); animation: pulse-highlight 1.5s ease-in-out infinite; }
.start-bib { width: 32px; height: 24px; background: var(--gray-200); border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
.start-flag { width: 20px; height: 13px; border-radius: 1px; }
.start-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
.start-r1-pts { font-size: 0.75rem; color: #64748b; }

.proceed-section { text-align: center; padding: 1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 0.75rem; }
.proceed-section .btn { color: white; background: rgba(255,255,255,0.2); border: 2px solid white; }
.proceed-section .btn:hover { background: white; color: var(--success); }

.ranking-section { background: white; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }

@media (max-width: 1024px) { .season-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .breadcrumb { display: none; }
  .jumpers-table-container { overflow-x: auto; }
  .form-row { grid-template-columns: 1fr; }
  .skills-grid { grid-template-columns: 1fr; }
  .season-header-card { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .progress-bar { width: 100%; }
  .race-tabs { flex-direction: column; }
}

/* Start list action buttons */
.start-actions { display: flex; gap: 0.375rem; margin-left: auto; }
.btn-icon {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid var(--gray-300);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.15s;
}
.btn-icon:hover {
  background: var(--primary-50);
  color: var(--primary-600);
  border-color: var(--primary-300);
}

/* Jump Animation Overlay */
.jump-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.jump-animation-modal {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border-radius: 0.75rem;
  width: 100%;
  max-width: 850px;
  max-height: 95vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.animation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.jumper-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.jumper-wc-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 0.5rem;
  background: #475569;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
}
.jumper-wc-badge.top-3 {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.jumper-special-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 32px;
  height: 24px;
  padding: 0 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}
.jumper-special-badge i {
  font-size: 0.65rem;
}
.jumper-special-badge.four-hills {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}
.jumper-special-badge.four-hills.top-3 {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}
.jumper-special-badge.flying {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
}
.jumper-special-badge.flying.top-3 {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
}
.jumper-flag {
  width: 24px;
  height: 16px;
  border-radius: 2px;
}
.jumper-name {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.close-animation-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.close-animation-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.animation-content {
  display: flex;
  gap: 0;
}

.animation-svg-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.animation-svg-container {
  position: relative;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F4FF 100%);
}

.distance-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.4s ease-out;
}
.distance-bar.visible {
  opacity: 1;
}
.distance-bar .dist-num {
  font-size: 2rem;
  font-weight: 700;
  color: white;
}
.distance-bar .dist-unit {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 0.125rem;
}
.distance-bar .dist-pts {
  font-size: 1.25rem;
  color: #86efac;
  font-weight: 600;
}

.ski-jump-svg {
  width: 100%;
  height: auto;
  display: block;
}

.jumper-dot {
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
  transition: fill 0.2s;
}
.jumper-dot.landed {
  fill: #3b82f6;
}


/* Results Panel */
.results-panel {
  width: 220px;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  opacity: 0.3;
  transition: opacity 0.4s ease-out;
  max-height: 350px;
}
.results-panel.visible {
  opacity: 1;
}

.panel-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.5rem;
  text-align: center;
  flex-shrink: 0;
}
.panel-title .remaining-count {
  display: block;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.125rem;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.leaderboard-list::-webkit-scrollbar {
  width: 4px;
}
.leaderboard-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}
.leaderboard-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.leaderboard-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}
.leaderboard-row.current-jumper {
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.5);
}
.leaderboard-row.podium:not(.current-jumper) {
  background: rgba(251, 191, 36, 0.1);
}

.lb-rank {
  min-width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
.lb-rank.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1e1e1e;
}
.lb-rank.silver {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  color: #1e1e1e;
}
.lb-rank.bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}
.lb-rank.qualified {
  background: rgba(34, 197, 94, 0.3);
  color: #86efac;
}
.lb-rank.not-qualified {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.lb-flag {
  width: 16px;
  height: 11px;
  border-radius: 1px;
}

.lb-name {
  flex: 1;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.leaderboard-row.current-jumper .lb-name {
  color: white;
  font-weight: 600;
}

.lb-points {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}
.leaderboard-row.current-jumper .lb-points {
  color: #93c5fd;
}

/* Panel Actions */
.panel-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease-out;
}
.panel-actions.visible {
  opacity: 1;
}

.btn-next-jumper {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  transition: all 0.2s;
}
.btn-next-jumper:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}
.btn-next-jumper:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-next-jumper i {
  font-size: 0.65rem;
}

.btn-close-animation {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-close-animation:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

@media (max-width: 640px) {
  .animation-content {
    flex-direction: column;
  }
  .results-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .panel-title {
    width: 100%;
    margin-bottom: 0.25rem;
  }
  .leaderboard-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .leaderboard-row {
    flex: 1;
    min-width: calc(50% - 0.125rem);
  }
  .panel-actions {
    width: 100%;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
  .dist-num {
    font-size: 2rem;
  }
}

/* Full standings list (scrollable) */
.standings-list-full {
  max-height: 400px;
  overflow-y: auto;
}
.standings-list-full::-webkit-scrollbar {
  width: 6px;
}
.standings-list-full::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.standings-list-full::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.standings-list-full::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.standing-item-clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.standing-item-clickable:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateX(4px);
}

/* Competitor Modal */
.competitor-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.competitor-modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.competitor-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  color: white;
}

.competitor-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.competitor-flag {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.competitor-details h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.competitor-standing {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.competitor-modal-content {
  padding: 1rem 1.25rem;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.results-title {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #64748b;
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
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  gap: 1rem;
}
.result-row.podium {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}
.result-row.dnf {
  opacity: 0.6;
}

.result-event {
  flex: 1;
  min-width: 0;
}
.result-location {
  display: block;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}
.result-hill {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.result-position {
  min-width: 36px;
  text-align: center;
}
.result-position .medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.85rem;
}
.result-position .medal.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1e1e1e;
}
.result-position .medal.silver {
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  color: #1e1e1e;
}
.result-position .medal.bronze {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}
.result-position .position {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  font-weight: 600;
  font-size: 0.85rem;
  color: #475569;
}
.result-position .position.dnf {
  background: #f1f5f9;
  color: #94a3b8;
}
.result-position .position.quali {
  background: #fef3c7;
  color: #92400e;
  font-size: 0.7rem;
  width: auto;
  padding: 0 0.5rem;
  border-radius: 0.75rem;
}

.result-points {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.9rem;
}
.result-points span:not(:first-child) {
  color: #94a3b8;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

/* Teams Tab Styles */
.teams-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.team-standings-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 0.75rem;
  padding: 1rem;
}

.team-standings-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-standing-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.team-standing-position {
  min-width: 2rem;
  text-align: center;
}

.team-standing-logo {
  width: 36px;
  height: 36px;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
}
.team-standing-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.375rem;
}

.team-standing-info {
  flex: 1;
  min-width: 0;
}
.team-standing-name {
  display: block;
  font-weight: 600;
  color: #1e293b;
}
.team-standing-jumpers {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.team-standing-points {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.team-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  border-top: 4px solid #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}
.team-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.team-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.team-logo {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.team-info h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}
.team-jumper-count {
  font-size: 0.8rem;
  color: #64748b;
}

.team-description {
  font-size: 0.85rem;
  color: #475569;
  margin: 0 0 0.75rem;
  line-height: 1.4;
}

.team-card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.team-modal {
  max-width: 480px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.color-picker {
  width: 50px;
  height: 36px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
}
.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

/* Team Standing Detail Modal */
.team-standing-detail-modal {
  max-width: 500px;
  width: 100%;
}

.team-modal-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-logo-small {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  flex-shrink: 0;
}

.team-total-points {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.team-jumpers-list {
  max-height: 400px;
  overflow-y: auto;
  margin: 1rem 0;
}

.empty-team-jumpers {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-style: italic;
}

.team-jumper-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  margin-bottom: 0.5rem;
  transition: all 0.15s ease;
}

.team-jumper-item:hover {
  background: #f1f5f9;
}

.team-jumper-item:last-child {
  margin-bottom: 0;
}

.jumper-wc-rank {
  min-width: 2.5rem;
  text-align: center;
  font-weight: 600;
  color: #64748b;
}

.jumper-wc-rank .rank-leader {
  color: #ca8a04;
  font-size: 1.1rem;
}

.jumper-wc-rank .rank-none {
  color: #475569;
}

.jumper-flag-small {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.jumper-name-full {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
}

.jumper-wc-points {
  font-weight: 600;
  color: #3b82f6;
  white-space: nowrap;
}

.text-danger {
  color: #ef4444;
}
.text-danger:hover {
  color: #dc2626;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}
</style>
