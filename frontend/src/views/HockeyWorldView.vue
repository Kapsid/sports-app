<template>
  <div class="hockey-view">
    <header class="hockey-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-hockey-puck"></i>
            <span>{{ world?.name || 'World Championship' }}</span>
          </div>
        </div>
        <div class="header-tabs">
          <button
            @click="activeTab = 'tournament'"
            class="tab-btn"
            :class="{ active: activeTab === 'tournament' }"
          >
            <i class="fa-solid fa-calendar"></i>
            <span v-if="season">{{ season.year }}</span>
            <span v-else>Tournament</span>
          </button>
          <button
            @click="activeTab = 'rankings'"
            class="tab-btn"
            :class="{ active: activeTab === 'rankings' }"
          >
            <i class="fa-solid fa-ranking-star"></i>
            Rankings
          </button>
          <button
            @click="activeTab = 'history'; loadHistory()"
            class="tab-btn"
            :class="{ active: activeTab === 'history' }"
          >
            <i class="fa-solid fa-trophy"></i>
            History
          </button>
          <button
            @click="confirmReset"
            class="tab-btn reset-btn"
            title="Reset world"
          >
            <i class="fa-solid fa-rotate-left"></i>
            Reset
          </button>
        </div>
        <div class="user-menu">
          <button @click="handleLogout" class="btn btn-ghost">
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="hockey-main">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading...
        </div>

        <template v-else>
          <!-- Tournament Tab -->
          <template v-if="activeTab === 'tournament'">
            <!-- No Season - Create Season -->
            <div v-if="!season" class="no-season fade-in">
              <div class="empty-icon">
                <i class="fa-solid fa-calendar-plus"></i>
              </div>
              <h2>Start World Championship</h2>
              <p>Create a new IIHF World Championship to begin simulating matches</p>
              <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason">
                <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-play"></i>
                {{ creatingSeason ? 'Creating...' : `Start ${nextYear} Championship` }}
              </button>
            </div>

            <!-- Tournament Active -->
            <template v-else>
              <!-- Historic viewing banner -->
              <div v-if="viewingHistoric" class="historic-banner">
                <i class="fa-solid fa-clock-rotate-left"></i>
                Viewing {{ historicYear }} Championship
                <button @click="backToCurrent" class="btn btn-sm btn-secondary historic-back-btn">
                  <i class="fa-solid fa-arrow-left"></i>
                  Back to current
                </button>
              </div>

              <!-- Phase Banner -->
              <div class="phase-banner" :class="season.phase">
                <div class="phase-main">
                  <i :class="season.phase === 'group' ? 'fa-solid fa-layer-group' : 'fa-solid fa-trophy'"></i>
                  <span v-if="season.phase === 'group'">Group Stage</span>
                  <span v-else>Playoff Stage</span>
                </div>
                <div v-if="season.hostCountry" class="phase-host">
                  <i class="fa-solid fa-location-dot"></i>
                  <img v-if="season.hostCountryCode" :src="getFlag(season.hostCountryCode)" class="host-flag" />
                  {{ season.hostCities ? season.hostCities.join(', ') : '' }} ({{ season.hostCountry }})
                </div>
              </div>

              <!-- Group Stage -->
              <div v-if="season.phase === 'group'" class="groups-container">
                <!-- Sub-tabs for Standings / Matches / Division II -->
                <div class="sub-tabs">
                  <button
                    @click="groupTab = 'standings'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'standings' }"
                  >
                    <i class="fa-solid fa-table"></i>
                    Standings
                  </button>
                  <button
                    @click="groupTab = 'matches'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'matches' }"
                  >
                    <i class="fa-solid fa-hockey-puck"></i>
                    Matches
                  </button>
                  <button
                    @click="groupTab = 'scorers'; loadStats()"
                    class="sub-tab"
                    :class="{ active: groupTab === 'scorers' }"
                  >
                    <i class="fa-solid fa-chart-bar"></i>
                    Scorers
                  </button>
                  <button
                    @click="groupTab = 'rosters'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'rosters' }"
                  >
                    <i class="fa-solid fa-users"></i>
                    Rosters
                  </button>
                  <button
                    @click="groupTab = 'allstars'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'allstars' }"
                  >
                    <i class="fa-solid fa-star"></i>
                    All-Stars
                  </button>
                  <button
                    @click="groupTab = 'division2'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'division2' }"
                  >
                    <i class="fa-solid fa-layer-group"></i>
                    Division II
                  </button>
                </div>

                <!-- Standings Tab -->
                <div v-if="groupTab === 'standings'" class="tab-content">
                  <div class="groups-grid">
                    <!-- Group A -->
                    <div class="group-panel fade-in">
                      <div class="panel-header">
                        <h2>
                          <i class="fa-solid fa-flag"></i>
                          Group A
                        </h2>
                      </div>
                      <div class="standings-table-wrapper">
                        <table class="standings-table">
                          <thead>
                            <tr>
                              <th class="pos">#</th>
                              <th class="team">Team</th>
                              <th>GP</th>
                              <th>W</th>
                              <th>OTW</th>
                              <th>OTL</th>
                              <th>L</th>
                              <th>GF</th>
                              <th>GA</th>
                              <th class="pts">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(team, index) in groupAStandings"
                              :key="team.teamId"
                              :class="getGroupPositionClass(index)"
                            >
                              <td class="pos">{{ index + 1 }}</td>
                              <td class="team">
                                <div class="team-cell team-link" @click.stop="openTeamRoster(team.teamId)">
                                  <img :src="getFlag(team.flag || team.countryCode)" :alt="team.teamName" class="team-flag" />
                                  <span>{{ team.teamName }}</span>
                                </div>
                              </td>
                              <td>{{ team.played }}</td>
                              <td>{{ team.won }}</td>
                              <td>{{ team.wonOT }}</td>
                              <td>{{ team.lostOT }}</td>
                              <td>{{ team.lost }}</td>
                              <td>{{ team.goalsFor }}</td>
                              <td>{{ team.goalsAgainst }}</td>
                              <td class="pts">{{ team.points }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- Group B -->
                    <div class="group-panel fade-in">
                      <div class="panel-header">
                        <h2>
                          <i class="fa-solid fa-flag"></i>
                          Group B
                        </h2>
                      </div>
                      <div class="standings-table-wrapper">
                        <table class="standings-table">
                          <thead>
                            <tr>
                              <th class="pos">#</th>
                              <th class="team">Team</th>
                              <th>GP</th>
                              <th>W</th>
                              <th>OTW</th>
                              <th>OTL</th>
                              <th>L</th>
                              <th>GF</th>
                              <th>GA</th>
                              <th class="pts">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(team, index) in groupBStandings"
                              :key="team.teamId"
                              :class="getGroupPositionClass(index)"
                            >
                              <td class="pos">{{ index + 1 }}</td>
                              <td class="team">
                                <div class="team-cell team-link" @click.stop="openTeamRoster(team.teamId)">
                                  <img :src="getFlag(team.flag || team.countryCode)" :alt="team.teamName" class="team-flag" />
                                  <span>{{ team.teamName }}</span>
                                </div>
                              </td>
                              <td>{{ team.played }}</td>
                              <td>{{ team.won }}</td>
                              <td>{{ team.wonOT }}</td>
                              <td>{{ team.lostOT }}</td>
                              <td>{{ team.lost }}</td>
                              <td>{{ team.goalsFor }}</td>
                              <td>{{ team.goalsAgainst }}</td>
                              <td class="pts">{{ team.points }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div class="legend">
                    <div class="legend-item playoff">
                      <span class="dot"></span> Playoff Qualification (1-4)
                    </div>
                    <div class="legend-item relegated">
                      <span class="dot"></span> Relegated to Division II (8)
                    </div>
                  </div>
                </div>

                <!-- Matches Tab -->
                <div v-if="groupTab === 'matches'" class="tab-content">
                  <!-- Matchday Selector -->
                  <div class="round-selector-container">
                    <label class="round-label">Matchday {{ selectedRound }} of {{ totalRounds }}</label>
                    <div class="round-buttons">
                      <button
                        v-for="round in totalRounds"
                        :key="round"
                        @click="selectedRound = round"
                        class="round-dot"
                        :class="{
                          active: selectedRound === round,
                          completed: isRoundCompleted(round),
                          current: round === activeRound
                        }"
                        :title="'Matchday ' + round + (isRoundCompleted(round) ? ' (completed)' : round === activeRound ? ' (active)' : '')"
                      >
                        <span class="round-number">{{ round }}</span>
                        <i v-if="isRoundCompleted(round) && selectedRound !== round" class="fa-solid fa-check round-check"></i>
                      </button>
                    </div>
                    <div class="round-progress-bar">
                      <div class="round-progress-fill" :style="{ width: groupProgress + '%' }"></div>
                    </div>
                  </div>

                  <div class="matches-grid">
                    <!-- Group A Matches for selected round -->
                    <div class="matches-panel">
                      <div class="panel-header">
                        <h3><i class="fa-solid fa-flag"></i> Group A</h3>
                      </div>
                      <div class="matches-list">
                        <div
                          v-for="match in currentRoundGroupAMatches"
                          :key="match.id"
                          class="match-card"
                          :class="{ completed: match.status === 'completed', clickable: match.status === 'completed' }"
                          @click="match.status === 'completed' && openMatchDetail(match.id)"
                        >
                          <div class="team home">
                            <img :src="getFlag(match.home_team_flag)" :alt="match.home_team_short" class="match-flag" />
                            <span class="team-name">{{ match.home_team_short }}</span>
                          </div>
                          <div class="score-box">
                            <template v-if="match.status === 'completed'">
                              <span class="score">{{ match.home_score }} : {{ match.away_score }}</span>
                              <span v-if="match.overtime" class="overtime-badge">OT</span>
                              <span v-if="match.shootout" class="shootout-badge">SO</span>
                            </template>
                            <template v-else>
                              <span class="vs">vs</span>
                            </template>
                          </div>
                          <div class="team away">
                            <span class="team-name">{{ match.away_team_short }}</span>
                            <img :src="getFlag(match.away_team_flag)" :alt="match.away_team_short" class="match-flag" />
                          </div>
                          <div class="match-actions" v-if="match.status !== 'completed'">
                            <button
                              @click="simulateSingleMatch(match.id, false)"
                              class="btn btn-sm btn-secondary"
                              :disabled="simulating"
                              title="Fast simulation"
                            >
                              <i class="fa-solid fa-forward"></i>
                            </button>
                            <button
                              @click="simulateSingleMatch(match.id, true)"
                              class="btn btn-sm btn-primary"
                              :disabled="simulating"
                              title="Detailed simulation"
                            >
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Group B Matches for selected round -->
                    <div class="matches-panel">
                      <div class="panel-header">
                        <h3><i class="fa-solid fa-flag"></i> Group B</h3>
                      </div>
                      <div class="matches-list">
                        <div
                          v-for="match in currentRoundGroupBMatches"
                          :key="match.id"
                          class="match-card"
                          :class="{ completed: match.status === 'completed', clickable: match.status === 'completed' }"
                          @click="match.status === 'completed' && openMatchDetail(match.id)"
                        >
                          <div class="team home">
                            <img :src="getFlag(match.home_team_flag)" :alt="match.home_team_short" class="match-flag" />
                            <span class="team-name">{{ match.home_team_short }}</span>
                          </div>
                          <div class="score-box">
                            <template v-if="match.status === 'completed'">
                              <span class="score">{{ match.home_score }} : {{ match.away_score }}</span>
                              <span v-if="match.overtime" class="overtime-badge">OT</span>
                              <span v-if="match.shootout" class="shootout-badge">SO</span>
                            </template>
                            <template v-else>
                              <span class="vs">vs</span>
                            </template>
                          </div>
                          <div class="team away">
                            <span class="team-name">{{ match.away_team_short }}</span>
                            <img :src="getFlag(match.away_team_flag)" :alt="match.away_team_short" class="match-flag" />
                          </div>
                          <div class="match-actions" v-if="match.status !== 'completed'">
                            <button
                              @click="simulateSingleMatch(match.id, false)"
                              class="btn btn-sm btn-secondary"
                              :disabled="simulating"
                              title="Fast simulation"
                            >
                              <i class="fa-solid fa-forward"></i>
                            </button>
                            <button
                              @click="simulateSingleMatch(match.id, true)"
                              class="btn btn-sm btn-primary"
                              :disabled="simulating"
                              title="Detailed simulation"
                            >
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Division II Tab -->
                <div v-if="groupTab === 'division2'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-layer-group"></i>
                        Division II Standings
                      </h2>
                    </div>
                    <div v-if="div2Standings.length > 0" class="standings-table-wrapper">
                      <table class="standings-table">
                        <thead>
                          <tr>
                            <th class="pos">#</th>
                            <th class="team">Team</th>
                            <th>GP</th>
                            <th>W</th>
                            <th>OTW</th>
                            <th>OTL</th>
                            <th>L</th>
                            <th>GF</th>
                            <th>GA</th>
                            <th class="pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(team, index) in div2Standings"
                            :key="team.teamName"
                            :class="{ promoted: index < 2, relegated: index === div2Standings.length - 1 }"
                          >
                            <td class="pos">{{ index + 1 }}</td>
                            <td class="team">
                              <div class="team-cell">
                                <img :src="getFlag(team.countryCode)" :alt="team.teamName" class="team-flag" />
                                <span>{{ team.teamName }}</span>
                              </div>
                            </td>
                            <td>{{ team.played }}</td>
                            <td>{{ team.won }}</td>
                            <td>{{ team.wonOT }}</td>
                            <td>{{ team.lostOT }}</td>
                            <td>{{ team.lost }}</td>
                            <td>{{ team.goalsFor }}</td>
                            <td>{{ team.goalsAgainst }}</td>
                            <td class="pts">{{ team.points }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-else class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>Division II standings will be calculated during the championship</p>
                    </div>
                    <div class="legend">
                      <div class="legend-item promoted">
                        <span class="dot"></span> Promoted to Top Division (1-2)
                      </div>
                      <div class="legend-item relegated">
                        <span class="dot"></span> Relegated to Division III (8)
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Scorers Tab -->
                <div v-if="groupTab === 'scorers'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-chart-bar"></i>
                        {{ season ? season.year + ' ' : '' }}Scoring Leaders
                      </h2>
                    </div>
                    <div v-if="tournamentStats.length > 0" class="standings-table-wrapper">
                      <table class="standings-table">
                        <thead>
                          <tr>
                            <th class="pos">#</th>
                            <th class="team">Player</th>
                            <th>Team</th>
                            <th>Pos</th>
                            <th>G</th>
                            <th>A</th>
                            <th class="pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(stat, index) in tournamentStats.slice(0, 30)" :key="stat.playerId">
                            <td class="pos">{{ index + 1 }}</td>
                            <td class="team">
                              <div class="team-cell team-link" @click="openPlayerDetail(stat.playerId)">
                                <span class="jersey-num">#{{ stat.jerseyNumber }}</span>
                                <span>{{ stat.playerName }}</span>
                              </div>
                            </td>
                            <td>
                              <div class="team-cell team-link" @click="openTeamRoster(stat.teamId)">
                                <img :src="getFlag(stat.countryCode || stat.teamName)" :alt="stat.teamName" class="team-flag" />
                                <span>{{ stat.teamName }}</span>
                              </div>
                            </td>
                            <td>{{ stat.position || '-' }}</td>
                            <td>{{ stat.goals }}</td>
                            <td>{{ stat.assists }}</td>
                            <td class="pts">{{ stat.points }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-else class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>No matches have been played yet. Simulate some matches to see scoring stats.</p>
                    </div>
                  </div>
                </div>

                <!-- Rosters Tab -->
                <div v-if="groupTab === 'rosters'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-users"></i>
                        Team Rosters
                      </h2>
                    </div>
                    <div class="roster-selector">
                      <select v-model="selectedRosterTeamId" @change="loadTeamRoster" class="roster-dropdown">
                        <option value="">Select a team...</option>
                        <option v-for="team in allTeams" :key="team.id" :value="team.id">
                          {{ team.name }} ({{ team.short_name }})
                        </option>
                      </select>
                    </div>
                    <div v-if="teamRoster && teamRoster.players && teamRoster.players.length > 0">
                      <div class="roster-section">
                        <h4 class="roster-position-header">Goalkeepers</h4>
                        <table class="standings-table roster-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th class="team">Name</th>
                              <th>SHO</th>
                              <th>SKA</th>
                              <th>PAS</th>
                              <th>DEF</th>
                              <th>PHY</th>
                              <th>G</th>
                              <th>A</th>
                              <th class="pts">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="p in rosterGoalies" :key="p.id">
                              <td class="jersey">{{ p.jersey_number }}</td>
                              <td class="team"><span class="team-link" @click="openPlayerDetail(p.id)">{{ p.first_name }} {{ p.last_name }}</span></td>
                              <td>{{ p.shooting }}</td>
                              <td>{{ p.skating }}</td>
                              <td>{{ p.passing }}</td>
                              <td>{{ p.defense_skill }}</td>
                              <td>{{ p.physical }}</td>
                              <td>{{ playerStat(p.id, 'goals') }}</td>
                              <td>{{ playerStat(p.id, 'assists') }}</td>
                              <td class="pts">{{ playerStat(p.id, 'points') }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="roster-section">
                        <h4 class="roster-position-header">Defensemen</h4>
                        <table class="standings-table roster-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th class="team">Name</th>
                              <th>SHO</th>
                              <th>SKA</th>
                              <th>PAS</th>
                              <th>DEF</th>
                              <th>PHY</th>
                              <th>G</th>
                              <th>A</th>
                              <th class="pts">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="p in rosterDefensemen" :key="p.id">
                              <td class="jersey">{{ p.jersey_number }}</td>
                              <td class="team"><span class="team-link" @click="openPlayerDetail(p.id)">{{ p.first_name }} {{ p.last_name }}</span></td>
                              <td>{{ p.shooting }}</td>
                              <td>{{ p.skating }}</td>
                              <td>{{ p.passing }}</td>
                              <td>{{ p.defense_skill }}</td>
                              <td>{{ p.physical }}</td>
                              <td>{{ playerStat(p.id, 'goals') }}</td>
                              <td>{{ playerStat(p.id, 'assists') }}</td>
                              <td class="pts">{{ playerStat(p.id, 'points') }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="roster-section">
                        <h4 class="roster-position-header">Forwards</h4>
                        <table class="standings-table roster-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th class="team">Name</th>
                              <th>SHO</th>
                              <th>SKA</th>
                              <th>PAS</th>
                              <th>DEF</th>
                              <th>PHY</th>
                              <th>G</th>
                              <th>A</th>
                              <th class="pts">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="p in rosterForwards" :key="p.id">
                              <td class="jersey">{{ p.jersey_number }}</td>
                              <td class="team"><span class="team-link" @click="openPlayerDetail(p.id)">{{ p.first_name }} {{ p.last_name }}</span></td>
                              <td>{{ p.shooting }}</td>
                              <td>{{ p.skating }}</td>
                              <td>{{ p.passing }}</td>
                              <td>{{ p.defense_skill }}</td>
                              <td>{{ p.physical }}</td>
                              <td>{{ playerStat(p.id, 'goals') }}</td>
                              <td>{{ playerStat(p.id, 'assists') }}</td>
                              <td class="pts">{{ playerStat(p.id, 'points') }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div v-else-if="selectedRosterTeamId && (!teamRoster || teamRoster.players?.length === 0)" class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>No players found. Try resetting the world to generate player rosters.</p>
                    </div>
                  </div>
                </div>

                <!-- All-Stars Tab -->
                <div v-if="groupTab === 'allstars'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-star"></i>
                        {{ season ? season.year + ' ' : '' }}Tournament All-Stars
                      </h2>
                    </div>
                    <div v-if="allStars" class="allstars-grid">
                      <div v-if="allStars.mvpForward" class="allstar-card">
                        <div class="allstar-label">Best Forward</div>
                        <div class="allstar-name">#{{ allStars.mvpForward.jerseyNumber }} {{ allStars.mvpForward.playerName }}</div>
                        <div class="allstar-team">
                          <img :src="getFlag(allStars.mvpForward.countryCode || allStars.mvpForward.teamName)" class="team-flag" />
                          {{ allStars.mvpForward.teamName }}
                        </div>
                        <div class="allstar-stats">{{ allStars.mvpForward.goals }}G {{ allStars.mvpForward.assists }}A - {{ allStars.mvpForward.points }}Pts</div>
                      </div>
                      <div v-if="allStars.mvpDefenseman" class="allstar-card">
                        <div class="allstar-label">Best Defenseman</div>
                        <div class="allstar-name">#{{ allStars.mvpDefenseman.jerseyNumber }} {{ allStars.mvpDefenseman.playerName }}</div>
                        <div class="allstar-team">
                          <img :src="getFlag(allStars.mvpDefenseman.countryCode || allStars.mvpDefenseman.teamName)" class="team-flag" />
                          {{ allStars.mvpDefenseman.teamName }}
                        </div>
                        <div class="allstar-stats">{{ allStars.mvpDefenseman.goals }}G {{ allStars.mvpDefenseman.assists }}A - {{ allStars.mvpDefenseman.points }}Pts</div>
                      </div>
                      <div v-if="allStars.mvpGoalie" class="allstar-card">
                        <div class="allstar-label">Best Goaltender</div>
                        <div class="allstar-name">#{{ allStars.mvpGoalie.jerseyNumber }} {{ allStars.mvpGoalie.playerName }}</div>
                        <div class="allstar-team">
                          <img :src="getFlag(allStars.mvpGoalie.countryCode || allStars.mvpGoalie.teamName)" class="team-flag" />
                          {{ allStars.mvpGoalie.teamName }}
                        </div>
                      </div>
                      <div v-if="allStars.topScorer" class="allstar-card gold-card">
                        <div class="allstar-label">Top Scorer</div>
                        <div class="allstar-name">#{{ allStars.topScorer.jerseyNumber }} {{ allStars.topScorer.playerName }}</div>
                        <div class="allstar-team">
                          <img :src="getFlag(allStars.topScorer.countryCode || allStars.topScorer.teamName)" class="team-flag" />
                          {{ allStars.topScorer.teamName }}
                        </div>
                        <div class="allstar-stats">{{ allStars.topScorer.goals }}G {{ allStars.topScorer.assists }}A - {{ allStars.topScorer.points }}Pts</div>
                      </div>
                    </div>
                    <div v-else class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>All-Stars are selected after the championship is completed.</p>
                    </div>
                  </div>
                </div>

                <!-- Simulate All / Start Playoffs -->
                <div class="actions-bar" v-if="!viewingHistoric && (groupTab === 'standings' || groupTab === 'matches' || groupTab === 'division2')">
                  <button
                    @click="simulateAllGroups"
                    class="btn btn-secondary btn-lg"
                    :disabled="simulating || allGroupMatchesComplete"
                  >
                    <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-forward-fast"></i>
                    {{ simulating ? 'Simulating...' : 'Simulate All Remaining' }}
                  </button>
                  <button
                    v-if="allGroupMatchesComplete"
                    @click="handleStartPlayoffs"
                    class="btn btn-primary btn-lg"
                    :disabled="startingPlayoffs"
                  >
                    <i v-if="startingPlayoffs" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-trophy"></i>
                    {{ startingPlayoffs ? 'Starting...' : 'Start Playoffs' }}
                  </button>
                </div>
              </div>

              <!-- Playoff Stage -->
              <div v-else class="playoffs-container">
                <div class="sub-tabs">
                  <button
                    @click="groupTab = 'bracket'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'bracket' }"
                  >
                    <i class="fa-solid fa-sitemap"></i>
                    Bracket
                  </button>
                  <button
                    @click="groupTab = 'scorers'; loadStats()"
                    class="sub-tab"
                    :class="{ active: groupTab === 'scorers' }"
                  >
                    <i class="fa-solid fa-chart-bar"></i>
                    Scorers
                  </button>
                  <button
                    @click="groupTab = 'rosters'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'rosters' }"
                  >
                    <i class="fa-solid fa-users"></i>
                    Rosters
                  </button>
                  <button
                    @click="groupTab = 'allstars'"
                    class="sub-tab"
                    :class="{ active: groupTab === 'allstars' }"
                  >
                    <i class="fa-solid fa-star"></i>
                    All-Stars
                  </button>
                </div>

                <!-- Scorers Tab (Playoff) -->
                <div v-if="groupTab === 'scorers'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-chart-bar"></i>
                        {{ season ? season.year + ' ' : '' }}Scoring Leaders
                      </h2>
                    </div>
                    <div v-if="tournamentStats.length > 0" class="standings-table-wrapper">
                      <table class="standings-table">
                        <thead>
                          <tr>
                            <th class="pos">#</th>
                            <th class="team">Player</th>
                            <th>Team</th>
                            <th>Pos</th>
                            <th>G</th>
                            <th>A</th>
                            <th class="pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(stat, index) in tournamentStats.slice(0, 30)" :key="stat.playerId">
                            <td class="pos">{{ index + 1 }}</td>
                            <td class="team">
                              <div class="team-cell team-link" @click="openPlayerDetail(stat.playerId)">
                                <span class="jersey-num">#{{ stat.jerseyNumber }}</span>
                                <span>{{ stat.playerName }}</span>
                              </div>
                            </td>
                            <td>
                              <div class="team-cell team-link" @click="openTeamRoster(stat.teamId)">
                                <img :src="getFlag(stat.countryCode || stat.teamName)" :alt="stat.teamName" class="team-flag" />
                                <span>{{ stat.teamName }}</span>
                              </div>
                            </td>
                            <td>{{ stat.position || '-' }}</td>
                            <td>{{ stat.goals }}</td>
                            <td>{{ stat.assists }}</td>
                            <td class="pts">{{ stat.points }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-else class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>No matches have been played yet.</p>
                    </div>
                  </div>
                </div>

                <!-- Rosters Tab (Playoff) -->
                <div v-if="groupTab === 'rosters'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-users"></i>
                        Team Rosters
                      </h2>
                    </div>
                    <div class="roster-selector">
                      <select v-model="selectedRosterTeamId" @change="loadTeamRoster" class="roster-dropdown">
                        <option value="">Select a team...</option>
                        <option v-for="team in allTeams" :key="team.id" :value="team.id">
                          {{ team.name }} ({{ team.short_name }})
                        </option>
                      </select>
                    </div>
                    <div v-if="teamRoster && teamRoster.players && teamRoster.players.length > 0">
                      <div class="roster-section">
                        <h4 class="roster-position-header">Goalkeepers</h4>
                        <table class="standings-table roster-table">
                          <thead><tr><th>#</th><th class="team">Name</th><th>SHO</th><th>SKA</th><th>PAS</th><th>DEF</th><th>PHY</th><th>G</th><th>A</th><th class="pts">Pts</th></tr></thead>
                          <tbody>
                            <tr v-for="p in rosterGoalies" :key="p.id">
                              <td class="jersey">{{ p.jersey_number }}</td><td class="team"><span class="team-link" @click="openPlayerDetail(p.id)">{{ p.first_name }} {{ p.last_name }}</span></td>
                              <td>{{ p.shooting }}</td><td>{{ p.skating }}</td><td>{{ p.passing }}</td><td>{{ p.defense_skill }}</td><td>{{ p.physical }}</td>
                              <td>{{ playerStat(p.id, 'goals') }}</td><td>{{ playerStat(p.id, 'assists') }}</td><td class="pts">{{ playerStat(p.id, 'points') }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="roster-section">
                        <h4 class="roster-position-header">Defensemen</h4>
                        <table class="standings-table roster-table">
                          <thead><tr><th>#</th><th class="team">Name</th><th>SHO</th><th>SKA</th><th>PAS</th><th>DEF</th><th>PHY</th><th>G</th><th>A</th><th class="pts">Pts</th></tr></thead>
                          <tbody>
                            <tr v-for="p in rosterDefensemen" :key="p.id">
                              <td class="jersey">{{ p.jersey_number }}</td><td class="team"><span class="team-link" @click="openPlayerDetail(p.id)">{{ p.first_name }} {{ p.last_name }}</span></td>
                              <td>{{ p.shooting }}</td><td>{{ p.skating }}</td><td>{{ p.passing }}</td><td>{{ p.defense_skill }}</td><td>{{ p.physical }}</td>
                              <td>{{ playerStat(p.id, 'goals') }}</td><td>{{ playerStat(p.id, 'assists') }}</td><td class="pts">{{ playerStat(p.id, 'points') }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="roster-section">
                        <h4 class="roster-position-header">Forwards</h4>
                        <table class="standings-table roster-table">
                          <thead><tr><th>#</th><th class="team">Name</th><th>SHO</th><th>SKA</th><th>PAS</th><th>DEF</th><th>PHY</th><th>G</th><th>A</th><th class="pts">Pts</th></tr></thead>
                          <tbody>
                            <tr v-for="p in rosterForwards" :key="p.id">
                              <td class="jersey">{{ p.jersey_number }}</td><td class="team"><span class="team-link" @click="openPlayerDetail(p.id)">{{ p.first_name }} {{ p.last_name }}</span></td>
                              <td>{{ p.shooting }}</td><td>{{ p.skating }}</td><td>{{ p.passing }}</td><td>{{ p.defense_skill }}</td><td>{{ p.physical }}</td>
                              <td>{{ playerStat(p.id, 'goals') }}</td><td>{{ playerStat(p.id, 'assists') }}</td><td class="pts">{{ playerStat(p.id, 'points') }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div v-else-if="selectedRosterTeamId && (!teamRoster || teamRoster.players?.length === 0)" class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>No players found. Try resetting the world to generate player rosters.</p>
                    </div>
                  </div>
                </div>

                <!-- All-Stars Tab (Playoff) -->
                <div v-if="groupTab === 'allstars'" class="tab-content">
                  <div class="group-panel fade-in">
                    <div class="panel-header">
                      <h2>
                        <i class="fa-solid fa-star"></i>
                        {{ season ? season.year + ' ' : '' }}Tournament All-Stars
                      </h2>
                    </div>
                    <div v-if="allStars" class="allstars-grid">
                      <div v-if="allStars.mvpForward" class="allstar-card">
                        <div class="allstar-label">Best Forward</div>
                        <div class="allstar-name">#{{ allStars.mvpForward.jerseyNumber }} {{ allStars.mvpForward.playerName }}</div>
                        <div class="allstar-team"><img :src="getFlag(allStars.mvpForward.countryCode || allStars.mvpForward.teamName)" class="team-flag" /> {{ allStars.mvpForward.teamName }}</div>
                        <div class="allstar-stats">{{ allStars.mvpForward.goals }}G {{ allStars.mvpForward.assists }}A - {{ allStars.mvpForward.points }}Pts</div>
                      </div>
                      <div v-if="allStars.mvpDefenseman" class="allstar-card">
                        <div class="allstar-label">Best Defenseman</div>
                        <div class="allstar-name">#{{ allStars.mvpDefenseman.jerseyNumber }} {{ allStars.mvpDefenseman.playerName }}</div>
                        <div class="allstar-team"><img :src="getFlag(allStars.mvpDefenseman.countryCode || allStars.mvpDefenseman.teamName)" class="team-flag" /> {{ allStars.mvpDefenseman.teamName }}</div>
                        <div class="allstar-stats">{{ allStars.mvpDefenseman.goals }}G {{ allStars.mvpDefenseman.assists }}A - {{ allStars.mvpDefenseman.points }}Pts</div>
                      </div>
                      <div v-if="allStars.mvpGoalie" class="allstar-card">
                        <div class="allstar-label">Best Goaltender</div>
                        <div class="allstar-name">#{{ allStars.mvpGoalie.jerseyNumber }} {{ allStars.mvpGoalie.playerName }}</div>
                        <div class="allstar-team"><img :src="getFlag(allStars.mvpGoalie.countryCode || allStars.mvpGoalie.teamName)" class="team-flag" /> {{ allStars.mvpGoalie.teamName }}</div>
                      </div>
                      <div v-if="allStars.topScorer" class="allstar-card gold-card">
                        <div class="allstar-label">Top Scorer</div>
                        <div class="allstar-name">#{{ allStars.topScorer.jerseyNumber }} {{ allStars.topScorer.playerName }}</div>
                        <div class="allstar-team"><img :src="getFlag(allStars.topScorer.countryCode || allStars.topScorer.teamName)" class="team-flag" /> {{ allStars.topScorer.teamName }}</div>
                        <div class="allstar-stats">{{ allStars.topScorer.goals }}G {{ allStars.topScorer.assists }}A - {{ allStars.topScorer.points }}Pts</div>
                      </div>
                    </div>
                    <div v-else class="empty-div2">
                      <i class="fa-solid fa-circle-info"></i>
                      <p>All-Stars are selected after the championship is completed.</p>
                    </div>
                  </div>
                </div>

                <div v-if="groupTab === 'bracket'" class="bracket-section">
                  <h3>Playoff Bracket</h3>
                  <div class="bracket">
                    <!-- Quarterfinals -->
                    <div class="bracket-round">
                      <h4>Quarterfinals</h4>
                      <div class="matches-column">
                        <div
                          v-for="(match, idx) in playoffMatches.quarterfinal"
                          :key="'qf-' + idx"
                          class="bracket-match"
                          :class="{ completed: match.status === 'completed', clickable: match.status === 'completed' }"
                          @click="match.status === 'completed' && openMatchDetail(match.id)"
                        >
                          <div class="bracket-team" :class="{ winner: match.status === 'completed' && match.home_score > match.away_score }">
                            <img :src="getFlag(match.home_team_flag)" class="bracket-flag" />
                            <span>{{ match.home_team_short }}</span>
                            <span v-if="match.status === 'completed'" class="bracket-score">{{ match.home_score }}</span>
                          </div>
                          <div class="bracket-team" :class="{ winner: match.status === 'completed' && match.away_score > match.home_score }">
                            <img :src="getFlag(match.away_team_flag)" class="bracket-flag" />
                            <span>{{ match.away_team_short }}</span>
                            <span v-if="match.status === 'completed'" class="bracket-score">{{ match.away_score }}</span>
                          </div>
                          <div v-if="match.status !== 'completed'" class="bracket-actions">
                            <button
                              @click="simulatePlayoffMatch(match.id, false)"
                              class="btn btn-sm btn-secondary"
                              :disabled="simulating"
                              title="Fast simulation"
                            >
                              <i class="fa-solid fa-forward"></i>
                            </button>
                            <button
                              @click="simulatePlayoffMatch(match.id, true)"
                              class="btn btn-sm btn-primary"
                              :disabled="simulating"
                              title="Detailed simulation"
                            >
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Semifinals -->
                    <div class="bracket-round">
                      <h4>Semifinals</h4>
                      <div class="matches-column">
                        <div
                          v-for="(match, idx) in playoffMatches.semifinal"
                          :key="'sf-' + idx"
                          class="bracket-match"
                          :class="{ completed: match.status === 'completed', clickable: match.status === 'completed' }"
                          @click="match.status === 'completed' && openMatchDetail(match.id)"
                        >
                          <div class="bracket-team" :class="{ winner: match.status === 'completed' && match.home_score > match.away_score }">
                            <img :src="getFlag(match.home_team_flag)" class="bracket-flag" />
                            <span>{{ match.home_team_short }}</span>
                            <span v-if="match.status === 'completed'" class="bracket-score">{{ match.home_score }}</span>
                          </div>
                          <div class="bracket-team" :class="{ winner: match.status === 'completed' && match.away_score > match.home_score }">
                            <img :src="getFlag(match.away_team_flag)" class="bracket-flag" />
                            <span>{{ match.away_team_short }}</span>
                            <span v-if="match.status === 'completed'" class="bracket-score">{{ match.away_score }}</span>
                          </div>
                          <div v-if="match.status !== 'completed'" class="bracket-actions">
                            <button
                              @click="simulatePlayoffMatch(match.id, false)"
                              class="btn btn-sm btn-secondary"
                              :disabled="simulating"
                              title="Fast simulation"
                            >
                              <i class="fa-solid fa-forward"></i>
                            </button>
                            <button
                              @click="simulatePlayoffMatch(match.id, true)"
                              class="btn btn-sm btn-primary"
                              :disabled="simulating"
                              title="Detailed simulation"
                            >
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Finals -->
                    <div class="bracket-round finals">
                      <h4>Medal Matches</h4>
                      <div class="matches-column">
                        <!-- Bronze Match -->
                        <div
                          v-if="playoffMatches.bronze.length > 0"
                          class="bracket-match bronze"
                          :class="{ completed: playoffMatches.bronze[0].status === 'completed', clickable: playoffMatches.bronze[0].status === 'completed' }"
                          @click="playoffMatches.bronze[0].status === 'completed' && openMatchDetail(playoffMatches.bronze[0].id)"
                        >
                          <div class="match-label">Bronze</div>
                          <div class="bracket-team" :class="{ winner: playoffMatches.bronze[0].status === 'completed' && playoffMatches.bronze[0].home_score > playoffMatches.bronze[0].away_score }">
                            <img :src="getFlag(playoffMatches.bronze[0].home_team_flag)" class="bracket-flag" />
                            <span>{{ playoffMatches.bronze[0].home_team_short }}</span>
                            <span v-if="playoffMatches.bronze[0].status === 'completed'" class="bracket-score">{{ playoffMatches.bronze[0].home_score }}</span>
                          </div>
                          <div class="bracket-team" :class="{ winner: playoffMatches.bronze[0].status === 'completed' && playoffMatches.bronze[0].away_score > playoffMatches.bronze[0].home_score }">
                            <img :src="getFlag(playoffMatches.bronze[0].away_team_flag)" class="bracket-flag" />
                            <span>{{ playoffMatches.bronze[0].away_team_short }}</span>
                            <span v-if="playoffMatches.bronze[0].status === 'completed'" class="bracket-score">{{ playoffMatches.bronze[0].away_score }}</span>
                          </div>
                          <div v-if="playoffMatches.bronze[0].status !== 'completed'" class="bracket-actions">
                            <button
                              @click="simulatePlayoffMatch(playoffMatches.bronze[0].id, false)"
                              class="btn btn-sm btn-secondary"
                              :disabled="simulating"
                              title="Fast simulation"
                            >
                              <i class="fa-solid fa-forward"></i>
                            </button>
                            <button
                              @click="simulatePlayoffMatch(playoffMatches.bronze[0].id, true)"
                              class="btn btn-sm btn-primary"
                              :disabled="simulating"
                              title="Detailed simulation"
                            >
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>

                        <!-- Final -->
                        <div
                          v-if="playoffMatches.final.length > 0"
                          class="bracket-match final"
                          :class="{ completed: playoffMatches.final[0].status === 'completed', clickable: playoffMatches.final[0].status === 'completed' }"
                          @click="playoffMatches.final[0].status === 'completed' && openMatchDetail(playoffMatches.final[0].id)"
                        >
                          <div class="match-label gold">Final</div>
                          <div class="bracket-team" :class="{ winner: playoffMatches.final[0].status === 'completed' && playoffMatches.final[0].home_score > playoffMatches.final[0].away_score }">
                            <img :src="getFlag(playoffMatches.final[0].home_team_flag)" class="bracket-flag" />
                            <span>{{ playoffMatches.final[0].home_team_short }}</span>
                            <span v-if="playoffMatches.final[0].status === 'completed'" class="bracket-score">{{ playoffMatches.final[0].home_score }}</span>
                          </div>
                          <div class="bracket-team" :class="{ winner: playoffMatches.final[0].status === 'completed' && playoffMatches.final[0].away_score > playoffMatches.final[0].home_score }">
                            <img :src="getFlag(playoffMatches.final[0].away_team_flag)" class="bracket-flag" />
                            <span>{{ playoffMatches.final[0].away_team_short }}</span>
                            <span v-if="playoffMatches.final[0].status === 'completed'" class="bracket-score">{{ playoffMatches.final[0].away_score }}</span>
                          </div>
                          <div v-if="playoffMatches.final[0].status !== 'completed'" class="bracket-actions">
                            <button
                              @click="simulatePlayoffMatch(playoffMatches.final[0].id, false)"
                              class="btn btn-sm btn-secondary"
                              :disabled="simulating"
                              title="Fast simulation"
                            >
                              <i class="fa-solid fa-forward"></i>
                            </button>
                            <button
                              @click="simulatePlayoffMatch(playoffMatches.final[0].id, true)"
                              class="btn btn-sm btn-primary"
                              :disabled="simulating"
                              title="Detailed simulation"
                            >
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                  <!-- Relegation Info -->
                  <div v-if="playoffBracket && playoffBracket.relegatedTeams" class="relegation-section">
                    <h3>Relegation</h3>
                    <div class="relegation-info">
                      <div class="relegated-teams">
                        <span class="label">Relegated to Division II:</span>
                        <div class="team-badges">
                          <span v-for="team in playoffBracket.relegatedTeams" :key="team.teamId" class="team-badge relegated">
                            {{ team.teamName }}
                          </span>
                        </div>
                      </div>
                      <div v-if="playoffBracket.promotedTeams" class="promoted-teams">
                        <span class="label">Promoted from Division II:</span>
                        <div class="team-badges">
                          <span v-for="team in playoffBracket.promotedTeams" :key="team.teamName" class="team-badge promoted">
                            {{ team.teamName }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Championship Complete -->
                  <div v-if="season.status === 'completed' && !viewingHistoric" class="championship-complete">
                    <h2><i class="fa-solid fa-trophy gold"></i> Championship Complete!</h2>
                    <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingSeason">
                      <i v-if="creatingSeason" class="fa-solid fa-spinner fa-spin"></i>
                      <i v-else class="fa-solid fa-forward"></i>
                      {{ creatingSeason ? 'Creating...' : 'Start Next Championship' }}
                    </button>
                  </div>
              </div>

            </template>
          </template>

          <!-- Rankings Tab (Top-Level) -->
          <template v-if="activeTab === 'rankings'">
            <div class="group-panel fade-in">
              <div class="panel-header">
                <h2>
                  <i class="fa-solid fa-ranking-star"></i>
                  World Rankings
                </h2>
              </div>
              <div v-if="rankedTeams.length > 0" class="standings-table-wrapper">
                <table class="standings-table">
                  <thead>
                    <tr>
                      <th class="pos">#</th>
                      <th class="team">Team</th>
                      <th>PWR</th>
                      <th>Group</th>
                      <th>Division</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="team in rankedTeams" :key="team.id" :class="{ 'relegated': team.division === 'div2' }">
                      <td class="pos">{{ team.world_ranking }}</td>
                      <td class="team">
                        <img :src="getFlag(team.flag || team.country_code)" :alt="team.short_name" class="team-flag" />
                        {{ team.name }}
                      </td>
                      <td>{{ team.power }}</td>
                      <td>{{ team.group_name || '-' }}</td>
                      <td>
                        <span :class="['division-badge', team.division === 'top' ? 'div-top' : 'div-2']">
                          {{ team.division === 'top' ? 'Top' : 'Div II' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-div2">
                <i class="fa-solid fa-circle-info"></i>
                <p>No ranking data available.</p>
              </div>
            </div>
          </template>

          <!-- History Tab -->
          <template v-if="activeTab === 'history'">
            <div v-if="seasonHistory.length === 0" class="history-panel fade-in">
              <div class="panel-header">
                <h2>
                  <i class="fa-solid fa-trophy"></i>
                  Championship History
                </h2>
              </div>
              <div class="empty-history">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>No championships completed yet</p>
              </div>
            </div>

            <template v-else>
              <div class="history-panel fade-in">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-trophy"></i>
                    Championship History
                  </h2>
                </div>
                <div class="history-table-wrap">
                  <table class="standings-table history-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Host</th>
                        <th class="gold-col">Gold</th>
                        <th class="silver-col">Silver</th>
                        <th class="bronze-col">Bronze</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in seasonHistory" :key="item.id">
                        <td class="history-year-cell">
                          <span class="team-link" @click="viewOldTournament(item)">{{ item.year }}</span>
                        </td>
                        <td class="history-host-cell">
                          <div class="team-cell">
                            <img v-if="item.host_country_code" :src="getFlag(item.host_country_code)" :alt="item.host_country" class="team-flag" />
                            <span>{{ item.host_country || '' }}</span>
                          </div>
                        </td>
                        <td class="gold-col">
                          <div class="team-cell">
                            <img v-if="item.gold_country_code" :src="getFlag(item.gold_country_code)" :alt="item.gold_team_name" class="team-flag" />
                            <span>{{ item.gold_team_name }}</span>
                          </div>
                        </td>
                        <td class="silver-col">
                          <div class="team-cell">
                            <img v-if="item.silver_country_code" :src="getFlag(item.silver_country_code)" :alt="item.silver_team_name" class="team-flag" />
                            <span>{{ item.silver_team_name }}</span>
                          </div>
                        </td>
                        <td class="bronze-col">
                          <div class="team-cell">
                            <img v-if="item.bronze_country_code" :src="getFlag(item.bronze_country_code)" :alt="item.bronze_team_name" class="team-flag" />
                            <span>{{ item.bronze_team_name }}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Medal Summary Table -->
              <div class="history-panel fade-in" style="margin-top: 1.5rem;">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-medal"></i>
                    All-Time Medal Table
                  </h2>
                </div>
                <div class="history-table-wrap">
                  <table class="standings-table medal-table">
                    <thead>
                      <tr>
                        <th class="pos">#</th>
                        <th class="team">Country</th>
                        <th class="gold-col">Gold</th>
                        <th class="silver-col">Silver</th>
                        <th class="bronze-col">Bronze</th>
                        <th class="pts">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, index) in medalTable" :key="row.country">
                        <td class="pos">{{ index + 1 }}</td>
                        <td class="team">
                          <div class="team-cell">
                            <img v-if="row.countryCode" :src="getFlag(row.countryCode)" :alt="row.country" class="team-flag" />
                            <span>{{ row.country }}</span>
                          </div>
                        </td>
                        <td class="gold-col">{{ row.gold || '' }}</td>
                        <td class="silver-col">{{ row.silver || '' }}</td>
                        <td class="bronze-col">{{ row.bronze || '' }}</td>
                        <td class="pts">{{ row.total }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>
    </main>

    <!-- Reset Confirmation Modal -->
    <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
      <div class="modal fade-in">
        <div class="modal-header">
          <h2>Reset World</h2>
          <button @click="showResetModal = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p class="delete-warning">
          Are you sure you want to reset this world? This will delete all seasons, matches, and history.
        </p>
        <div class="modal-actions">
          <button type="button" @click="showResetModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="handleReset" class="btn btn-danger" :disabled="resetting">
            <i v-if="resetting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-rotate-left"></i>
            {{ resetting ? 'Resetting...' : 'Reset World' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Match Detail Modal (for completed matches) -->
    <div v-if="showMatchDetail" class="modal-overlay" @click.self="showMatchDetail = false">
      <div class="modal simulation-modal fade-in">
        <div class="modal-header">
          <h2>
            <i class="fa-solid fa-hockey-puck"></i>
            Match Detail
          </h2>
          <button @click="showMatchDetail = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="simulation-header" v-if="matchDetailData">
          <div class="sim-team home">
            <img :src="getFlag(matchDetailData.home_team_flag)" :alt="matchDetailData.home_team_short" class="sim-flag" />
            <span class="sim-team-name">{{ matchDetailData.home_team_short }}</span>
          </div>
          <div class="sim-score-box">
            <span class="sim-score">{{ matchDetailData.home_score }}</span>
            <span class="sim-separator">:</span>
            <span class="sim-score">{{ matchDetailData.away_score }}</span>
            <div class="sim-period" v-if="matchDetailData.overtime || matchDetailData.shootout">
              <span class="overtime">{{ matchDetailData.shootout ? 'SO' : 'OT' }}</span>
            </div>
            <div class="period-scores-row" v-if="matchDetailPeriodScores.length > 0">
              <span v-for="(ps, i) in matchDetailPeriodScores" :key="i" class="period-score-item">
                {{ ps.label }}: {{ ps.home }}-{{ ps.away }}
              </span>
            </div>
          </div>
          <div class="sim-team away">
            <span class="sim-team-name">{{ matchDetailData.away_team_short }}</span>
            <img :src="getFlag(matchDetailData.away_team_flag)" :alt="matchDetailData.away_team_short" class="sim-flag" />
          </div>
        </div>

        <div class="events-list" v-if="matchDetailEvents.length > 0">
          <div
            v-for="(event, idx) in matchDetailEvents"
            :key="idx"
            class="event-item"
            :class="event.type === 'goal' ? 'goal-event' : 'period-event'"
          >
            <span v-if="event.minute" class="event-minute">{{ event.minute }}'</span>
            <i :class="event.type === 'goal' ? 'fa-solid fa-hockey-puck' : 'fa-solid fa-circle-info'"></i>
            <span v-if="event.type === 'goal'">
              <strong>GOAL</strong> {{ event.teamName }} -
              <span v-if="event.scorerName" class="team-link" @click="event.scorerId && openPlayerDetail(event.scorerId)">#{{ event.scorerNumber }} {{ event.scorerName }}</span>
              <span v-else>Goal</span>
              <span v-if="event.scorerGoalNum" class="goal-count">({{ event.scorerGoalNum }})</span>
              <span v-if="event.assists && event.assists.length > 0" class="assist-text">
                (<span v-for="(a, ai) in event.assists" :key="ai"><span v-if="ai > 0">, </span><span class="team-link" @click="a.playerId && openPlayerDetail(a.playerId)">#{{ a.jerseyNumber }} {{ a.playerName }}</span></span>)
              </span>
            </span>
            <span v-else>{{ event.message || event.type }}</span>
          </div>
        </div>
        <div v-else class="empty-div2" style="padding: 2rem;">
          <i class="fa-solid fa-circle-info"></i>
          <p>No detailed events recorded for this match.</p>
        </div>

        <div class="modal-actions">
          <button @click="showMatchDetail = false" class="btn btn-primary">
            <i class="fa-solid fa-check"></i>
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Detailed Simulation Modal -->
    <div v-if="showDetailedModal" class="modal-overlay" @click.self="!isSimulationRunning && closeDetailedModal()">
      <div class="modal simulation-modal fade-in">
        <div class="modal-header">
          <h2>
            <i class="fa-solid fa-hockey-puck"></i>
            Match Simulation
          </h2>
          <button
            v-if="!isSimulationRunning"
            @click="closeDetailedModal"
            class="btn btn-ghost"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Teams & Score Display -->
        <div class="simulation-header" v-if="detailedMatch">
          <div class="sim-team home">
            <img :src="getFlag(detailedMatch.home_team_flag)" :alt="detailedMatch.home_team_short" class="sim-flag" />
            <span class="sim-team-name">{{ detailedMatch.home_team_short }}</span>
          </div>
          <div class="sim-score-box">
            <span class="sim-score">{{ currentHomeScore }}</span>
            <span class="sim-separator">:</span>
            <span class="sim-score">{{ currentAwayScore }}</span>
            <div class="sim-period">
              <span v-if="typeof currentPeriod === 'number'">Period {{ currentPeriod }}</span>
              <span v-else class="overtime">{{ currentPeriod }}</span>
            </div>
            <div class="period-scores-row" v-if="simPeriodScores.length > 0 && (currentPeriod > 1 || simPeriodScores[0].home + simPeriodScores[0].away > 0)">
              <span v-for="(ps, i) in simPeriodScores" :key="i" class="period-score-item" :class="{ 'period-active': typeof currentPeriod === 'number' && currentPeriod === i + 1 }">
                {{ i < 3 ? 'P' + (i + 1) : 'OT' }}: {{ ps.home }}-{{ ps.away }}
              </span>
            </div>
          </div>
          <div class="sim-team away">
            <span class="sim-team-name">{{ detailedMatch.away_team_short }}</span>
            <img :src="getFlag(detailedMatch.away_team_flag)" :alt="detailedMatch.away_team_short" class="sim-flag" />
          </div>
        </div>

        <!-- Events List -->
        <div class="events-list">
          <div
            v-for="event in detailedEvents"
            :key="event.id"
            class="event-item"
            :class="event.className"
          >
            <span v-if="event.minute" class="event-minute">{{ event.minute }}</span>
            <i :class="event.icon"></i>
            <span>{{ event.message }}</span>
          </div>
          <div v-if="isSimulationRunning" class="event-item running">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Simulating...</span>
          </div>
        </div>

        <!-- Close Button -->
        <div v-if="simulationComplete" class="modal-actions">
          <button @click="closeDetailedModal" class="btn btn-primary" :disabled="simulating">
            <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-check"></i>
            {{ simulating ? 'Saving...' : 'Close' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Player Career Modal -->
    <div v-if="showPlayerDetail" class="modal-overlay" @click.self="showPlayerDetail = false">
      <div class="modal simulation-modal fade-in">
        <div class="modal-header">
          <h2>
            <i class="fa-solid fa-user"></i>
            Player Career
          </h2>
          <button @click="showPlayerDetail = false" class="btn btn-ghost">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div v-if="playerDetailData" class="player-career-content">
          <div class="player-career-header">
            <img :src="getFlag(playerDetailData.player.country_code)" class="sim-flag" />
            <div class="player-career-info">
              <div class="player-career-name">
                #{{ playerDetailData.player.jersey_number }} {{ playerDetailData.player.first_name }} {{ playerDetailData.player.last_name }}
              </div>
              <div class="player-career-pos">
                <span class="position-badge" :class="'pos-' + playerDetailData.player.position">
                  {{ playerDetailData.player.position === 'F' ? 'Forward' : playerDetailData.player.position === 'D' ? 'Defenseman' : 'Goaltender' }}
                </span>
              </div>
            </div>
          </div>

          <div class="player-skills-row">
            <div class="skill-item"><span class="skill-label">SHO</span><span class="skill-value">{{ playerDetailData.player.shooting }}</span></div>
            <div class="skill-item"><span class="skill-label">SKA</span><span class="skill-value">{{ playerDetailData.player.skating }}</span></div>
            <div class="skill-item"><span class="skill-label">PAS</span><span class="skill-value">{{ playerDetailData.player.passing }}</span></div>
            <div class="skill-item"><span class="skill-label">DEF</span><span class="skill-value">{{ playerDetailData.player.defense_skill }}</span></div>
            <div class="skill-item"><span class="skill-label">PHY</span><span class="skill-value">{{ playerDetailData.player.physical }}</span></div>
          </div>

          <div v-if="playerDetailData.seasons.length > 0" class="standings-table-wrapper">
            <table class="standings-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>GP</th>
                  <th>G</th>
                  <th>A</th>
                  <th class="pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in playerDetailData.seasons" :key="s.seasonId">
                  <td>{{ s.year }}</td>
                  <td>{{ s.gamesPlayed }}</td>
                  <td>{{ s.goals }}</td>
                  <td>{{ s.assists }}</td>
                  <td class="pts">{{ s.points }}</td>
                </tr>
                <tr class="career-totals-row">
                  <td><strong>Career</strong></td>
                  <td><strong>{{ playerDetailData.career.gamesPlayed }}</strong></td>
                  <td><strong>{{ playerDetailData.career.goals }}</strong></td>
                  <td><strong>{{ playerDetailData.career.assists }}</strong></td>
                  <td class="pts"><strong>{{ playerDetailData.career.points }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-div2" style="padding: 1rem;">
            <i class="fa-solid fa-circle-info"></i>
            <p>No tournament stats recorded yet.</p>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="showPlayerDetail = false" class="btn btn-primary">
            <i class="fa-solid fa-check"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHockeyStore } from '../stores/hockey'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const hockeyStore = useHockeyStore()

const worldId = computed(() => route.params.id)
const world = computed(() => hockeyStore.currentWorld)
const season = computed(() => hockeyStore.currentSeason)
const groupAStandings = computed(() => hockeyStore.groupAStandings)
const groupBStandings = computed(() => hockeyStore.groupBStandings)
const div2Standings = computed(() => hockeyStore.div2Standings)
const playoffBracket = computed(() => hockeyStore.playoffBracket)
const seasonHistory = computed(() => hockeyStore.seasonHistory)
const teamRoster = computed(() => hockeyStore.teamRoster)
const tournamentStats = computed(() => hockeyStore.tournamentStats)
const allStars = computed(() => hockeyStore.allStars)
const viewingHistoric = computed(() => hockeyStore.viewingHistoric)

const loading = ref(true)
const activeTab = ref('tournament')
const historicYear = ref(null)
const showDiv2 = ref(false)
const creatingSeason = ref(false)
const simulating = ref(false)
const startingPlayoffs = ref(false)
const showResetModal = ref(false)
const resetting = ref(false)

// Detailed simulation modal state
const simGoalCounts = ref({})
const showDetailedModal = ref(false)
const detailedMatch = ref(null)
const detailedEvents = ref([])
const currentHomeScore = ref(0)
const currentAwayScore = ref(0)
const currentPeriod = ref(1)
const isSimulationRunning = ref(false)
const simulationComplete = ref(false)
const finalResult = ref(null)
const simPeriodScores = ref([])

// Sub-tabs and round slider state
const groupTab = ref('standings')
const selectedRound = ref(1)
const statsTab = ref('scorers')
const selectedRosterTeamId = ref('')

// Match detail modal state
const showMatchDetail = ref(false)
const matchDetailData = ref(null)
const matchDetailEvents = ref([])

// Player detail modal state
const showPlayerDetail = ref(false)
const playerDetailData = ref(null)

// Period scores for match detail modal
const matchDetailPeriodScores = computed(() => {
  if (!matchDetailData.value) return []
  // Try stored period_scores first
  let stored = []
  try {
    stored = JSON.parse(matchDetailData.value.period_scores || '[]')
  } catch (e) { stored = [] }
  if (stored.length > 0) {
    return stored.map((ps, i) => {
      if (typeof ps === 'string') {
        const [h, a] = ps.split(':').map(Number)
        return { label: i < 3 ? 'P' + (i + 1) : 'OT', home: h || 0, away: a || 0 }
      }
      return { label: i < 3 ? 'P' + (i + 1) : 'OT', home: ps.home || 0, away: ps.away || 0 }
    })
  }
  // Fallback: compute from events
  const events = matchDetailData.value.events || []
  const goals = events.filter(e => e.type === 'goal' && e.minute)
  if (goals.length === 0) return []
  const periods = [{ label: 'P1', home: 0, away: 0 }, { label: 'P2', home: 0, away: 0 }, { label: 'P3', home: 0, away: 0 }]
  let hasOT = false
  const otPeriod = { label: 'OT', home: 0, away: 0 }
  const homeId = matchDetailData.value.home_team_id
  for (const g of goals) {
    const minute = parseInt(g.minute)
    const isHome = g.teamId === homeId || g.team === 'home' ||
      (matchDetailData.value.home_team_short && g.teamName === matchDetailData.value.home_team_short)
    const side = isHome ? 'home' : 'away'
    if (minute <= 20) periods[0][side]++
    else if (minute <= 40) periods[1][side]++
    else if (minute <= 60) periods[2][side]++
    else { otPeriod[side]++; hasOT = true }
  }
  if (hasOT) periods.push(otPeriod)
  return periods
})

const nextYear = computed(() => {
  if (seasonHistory.value.length > 0) {
    return Math.max(...seasonHistory.value.map(h => h.year)) + 1
  }
  return new Date().getFullYear()
})

const allGroupMatchesComplete = computed(() => {
  if (!season.value?.matches) return false
  const groupMatches = season.value.matches.filter(m => m.stage === 'group')
  return groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed')
})

const rankedTeams = computed(() => {
  if (!world.value?.teams) return []
  return [...world.value.teams].sort((a, b) => (a.world_ranking || 99) - (b.world_ranking || 99))
})

const playoffMatches = computed(() => {
  if (!season.value?.matches) return { quarterfinal: [], semifinal: [], bronze: [], final: [] }
  const matches = season.value.matches.filter(m => m.stage === 'playoff')
  return {
    quarterfinal: matches.filter(m => m.playoff_round === 'quarterfinal'),
    semifinal: matches.filter(m => m.playoff_round === 'semifinal'),
    bronze: matches.filter(m => m.playoff_round === 'bronze'),
    final: matches.filter(m => m.playoff_round === 'final')
  }
})

const groupAMatches = computed(() => {
  if (!season.value?.matches) return []
  return season.value.matches.filter(m => m.stage === 'group' && m.group_name === 'A')
})

const groupBMatches = computed(() => {
  if (!season.value?.matches) return []
  return season.value.matches.filter(m => m.stage === 'group' && m.group_name === 'B')
})

const groupAMatchesByRound = computed(() => {
  const matches = groupAMatches.value
  const byRound = {}
  for (const match of matches) {
    const round = match.round_number || 1
    if (!byRound[round]) byRound[round] = []
    byRound[round].push(match)
  }
  return byRound
})

const groupBMatchesByRound = computed(() => {
  const matches = groupBMatches.value
  const byRound = {}
  for (const match of matches) {
    const round = match.round_number || 1
    if (!byRound[round]) byRound[round] = []
    byRound[round].push(match)
  }
  return byRound
})

const totalRounds = computed(() => {
  const rounds = Object.keys(groupAMatchesByRound.value).length
  return rounds || 7 // Default to 7 rounds for 8 teams round-robin
})

const currentRoundGroupAMatches = computed(() => {
  return groupAMatchesByRound.value[selectedRound.value] || []
})

const currentRoundGroupBMatches = computed(() => {
  return groupBMatchesByRound.value[selectedRound.value] || []
})

// Find the first round with unplayed matches (the "active" matchday)
const activeRound = computed(() => {
  for (let r = 1; r <= totalRounds.value; r++) {
    const aMatches = groupAMatchesByRound.value[r] || []
    const bMatches = groupBMatchesByRound.value[r] || []
    const allMatches = [...aMatches, ...bMatches]
    if (allMatches.some(m => m.status !== 'completed')) {
      return r
    }
  }
  return totalRounds.value
})

// Check if a given round is fully completed
function isRoundCompleted(round) {
  const aMatches = groupAMatchesByRound.value[round] || []
  const bMatches = groupBMatchesByRound.value[round] || []
  const allMatches = [...aMatches, ...bMatches]
  return allMatches.length > 0 && allMatches.every(m => m.status === 'completed')
}

// Group stage progress percentage
const groupProgress = computed(() => {
  if (!season.value?.matches) return 0
  const groupMatches = season.value.matches.filter(m => m.stage === 'group')
  if (groupMatches.length === 0) return 0
  const completed = groupMatches.filter(m => m.status === 'completed').length
  return Math.round((completed / groupMatches.length) * 100)
})


// All teams (for roster dropdown)
const allTeams = computed(() => {
  if (!world.value?.teams) return []
  return [...world.value.teams].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

// Medal table computed from seasonHistory
const medalTable = computed(() => {
  const map = {}
  for (const h of seasonHistory.value) {
    // Gold
    const goldKey = h.gold_team_name
    if (goldKey) {
      if (!map[goldKey]) map[goldKey] = { country: goldKey, countryCode: h.gold_country_code, gold: 0, silver: 0, bronze: 0, total: 0 }
      map[goldKey].gold++
      map[goldKey].total++
      if (h.gold_country_code) map[goldKey].countryCode = h.gold_country_code
    }
    // Silver
    const silverKey = h.silver_team_name
    if (silverKey) {
      if (!map[silverKey]) map[silverKey] = { country: silverKey, countryCode: h.silver_country_code, gold: 0, silver: 0, bronze: 0, total: 0 }
      map[silverKey].silver++
      map[silverKey].total++
      if (h.silver_country_code) map[silverKey].countryCode = h.silver_country_code
    }
    // Bronze
    const bronzeKey = h.bronze_team_name
    if (bronzeKey) {
      if (!map[bronzeKey]) map[bronzeKey] = { country: bronzeKey, countryCode: h.bronze_country_code, gold: 0, silver: 0, bronze: 0, total: 0 }
      map[bronzeKey].bronze++
      map[bronzeKey].total++
      if (h.bronze_country_code) map[bronzeKey].countryCode = h.bronze_country_code
    }
  }
  return Object.values(map).sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold
    if (b.silver !== a.silver) return b.silver - a.silver
    return b.bronze - a.bronze
  })
})

// Roster position filters
const rosterGoalies = computed(() => {
  if (!teamRoster.value?.players) return []
  return teamRoster.value.players.filter(p => p.position === 'G')
})

const rosterDefensemen = computed(() => {
  if (!teamRoster.value?.players) return []
  return teamRoster.value.players.filter(p => p.position === 'D')
})

const rosterForwards = computed(() => {
  if (!teamRoster.value?.players) return []
  return teamRoster.value.players.filter(p => p.position === 'F')
})

async function openMatchDetail(matchId) {
  try {
    const match = await hockeyStore.fetchMatchDetails(matchId)
    matchDetailData.value = match
    // Load tournament stats so we can show overall goal counts
    await loadStats()
    const events = match.events || []
    matchDetailEvents.value = events.filter(e => e.type === 'goal').map(e => {
      const totalGoals = e.scorerId ? (playerStatsMap.value[e.scorerId]?.goals || null) : null
      return { ...e, scorerGoalNum: totalGoals }
    })
    showMatchDetail.value = true
  } catch (err) {
    console.error('Failed to load match details:', err)
  }
}

function openTeamRoster(teamId) {
  if (!teamId) return
  activeTab.value = 'tournament'
  groupTab.value = 'rosters'
  selectedRosterTeamId.value = teamId
  loadTeamRoster()
}

async function loadStats() {
  if (season.value) {
    try {
      await hockeyStore.fetchTournamentStats(season.value.id)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }
}

async function loadTeamRoster() {
  if (selectedRosterTeamId.value) {
    try {
      await hockeyStore.fetchTeamRoster(selectedRosterTeamId.value)
      // Also load stats so we can show per-player stats on roster
      if (season.value) {
        await hockeyStore.fetchTournamentStats(season.value.id)
      }
    } catch (err) {
      console.error('Failed to load roster:', err)
    }
  }
}

// Map player ID to tournament stats
const playerStatsMap = computed(() => {
  const map = {}
  for (const stat of tournamentStats.value) {
    if (stat.playerId) {
      map[stat.playerId] = stat
    }
  }
  return map
})

function playerStat(playerId, field) {
  const s = playerStatsMap.value[playerId]
  return s ? (s[field] || 0) : 0
}

function getFlag(flagOrCode) {
  if (!flagOrCode) return '/flags/UNK.png'
  if (flagOrCode.endsWith('.png')) return `/flags/${flagOrCode}`
  return `/flags/${flagOrCode}.png`
}

function getGroupPositionClass(index) {
  if (index < 4) return 'playoff'
  if (index === 7) return 'relegated'
  return ''
}

function goBack() {
  router.push('/hockey')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function handleCreateSeason() {
  creatingSeason.value = true
  try {
    // Fetch history first to ensure nextYear is calculated correctly
    await hockeyStore.fetchHistory(worldId.value)

    // Calculate the correct next year
    let yearToUse = nextYear.value
    // Also check if current season is completed and use its year + 1
    if (season.value && season.value.status === 'completed') {
      yearToUse = Math.max(yearToUse, season.value.year + 1)
    }

    console.log('Creating season for year:', yearToUse)
    await hockeyStore.createSeason(worldId.value, yearToUse)
    await hockeyStore.fetchWorld(worldId.value)
    await hockeyStore.fetchSeason(worldId.value)
  } catch (err) {
    console.error('Failed to create season:', err)
    alert('Failed to create season: ' + (err.response?.data?.error || err.message))
  } finally {
    creatingSeason.value = false
  }
}

async function simulateAllGroups() {
  simulating.value = true
  try {
    await hockeyStore.simulateAllGroupMatches(season.value.id)
    await hockeyStore.fetchSeason(worldId.value)
  } catch (err) {
    console.error('Failed to simulate groups:', err)
  } finally {
    simulating.value = false
  }
}

async function simulateSingleMatch(matchId, detailed) {
  if (detailed) {
    // Find the match
    const match = season.value.matches.find(m => m.id === matchId)
    if (!match) return

    // Load rosters and current stats in parallel
    let homeRoster = [], awayRoster = []
    try {
      const rosterPromise = Promise.all([
        hockeyStore.fetchTeamRoster(match.home_team_id),
        hockeyStore.fetchTeamRoster(match.away_team_id)
      ])
      const statsPromise = season.value ? hockeyStore.fetchTournamentStats(season.value.id) : Promise.resolve()
      const [rosterResults] = await Promise.all([rosterPromise, statsPromise])
      homeRoster = (rosterResults[0]?.players || []).filter(p => p.position !== 'G')
      awayRoster = (rosterResults[1]?.players || []).filter(p => p.position !== 'G')
    } catch (err) {
      console.error('Failed to load rosters for simulation:', err)
    }

    // Setup detailed simulation
    detailedMatch.value = match
    detailedEvents.value = []
    // Seed goal counts from tournament stats so live sim shows tournament totals
    simGoalCounts.value = seedGoalCountsFromStats()
    simPeriodScores.value = [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }]
    currentHomeScore.value = 0
    currentAwayScore.value = 0
    currentPeriod.value = 1
    simulationComplete.value = false
    finalResult.value = null
    showDetailedModal.value = true
    isSimulationRunning.value = true

    // Run animated simulation with rosters
    await runDetailedSimulation(matchId, false, homeRoster, awayRoster)
  } else {
    // Fast simulation
    simulating.value = true
    try {
      await hockeyStore.simulateMatch(matchId, false)
      await hockeyStore.fetchSeason(worldId.value)
    } catch (err) {
      console.error('Failed to simulate match:', err)
    } finally {
      simulating.value = false
    }
  }
}

async function runDetailedSimulation(matchId, isPlayoff = false, homeRoster = [], awayRoster = []) {
  const homeTeam = detailedMatch.value.home_team_short
  const awayTeam = detailedMatch.value.away_team_short

  // Simulate 3 periods with events
  for (let period = 1; period <= 3; period++) {
    currentPeriod.value = period

    // Add period start event
    addEvent({
      type: 'period_start',
      minute: `${(period - 1) * 20}:00`,
      message: `Period ${period} starts`,
      icon: 'fa-solid fa-play',
      className: 'period-event'
    })
    await delay(800)

    // Generate random events for this period (4-8 events)
    const eventCount = 4 + Math.floor(Math.random() * 5)
    const periodStartMinute = (period - 1) * 20
    const usedMinutes = new Set()
    const periodEvents = []

    // Generate all events first
    for (let i = 0; i < eventCount; i++) {
      // Generate a random minute within the period (not duplicating)
      let minute
      do {
        minute = periodStartMinute + 1 + Math.floor(Math.random() * 19)
      } while (usedMinutes.has(minute))
      usedMinutes.add(minute)

      const event = generateRandomEvent(homeTeam, awayTeam, minute, homeRoster, awayRoster)
      periodEvents.push(event)
    }

    // Sort events by minute
    periodEvents.sort((a, b) => {
      const getMinuteValue = (timeStr) => {
        const [min, sec] = timeStr.split(':').map(Number)
        return min * 60 + sec
      }
      return getMinuteValue(a.minute) - getMinuteValue(b.minute)
    })

    // Display events in sorted order
    for (const event of periodEvents) {
      if (event.type === 'goal') {
        if (event.team === 'home') {
          currentHomeScore.value++
          simPeriodScores.value[period - 1].home++
        } else {
          currentAwayScore.value++
          simPeriodScores.value[period - 1].away++
        }
      }
      addEvent(event)
      await delay(600)
    }

    // Add period end event
    addEvent({
      type: 'period_end',
      minute: `${period * 20}:00`,
      message: `End of Period ${period}`,
      icon: 'fa-solid fa-pause',
      className: 'period-event'
    })
    await delay(600)
  }

  // Check for overtime if tied
  if (currentHomeScore.value === currentAwayScore.value) {
    currentPeriod.value = 'OT'
    addEvent({
      type: 'overtime_start',
      minute: '60:00',
      message: 'Overtime!',
      icon: 'fa-solid fa-clock',
      className: 'overtime-event'
    })
    await delay(800)

    // Generate overtime winner
    const otWinner = Math.random() < 0.5 ? 'home' : 'away'
    const scoringTeam = otWinner === 'home' ? homeTeam : awayTeam
    const otRoster = otWinner === 'home' ? homeRoster : awayRoster
    simPeriodScores.value.push({ home: 0, away: 0 })
    if (otWinner === 'home') {
      currentHomeScore.value++
      simPeriodScores.value[3].home++
    } else {
      currentAwayScore.value++
      simPeriodScores.value[3].away++
    }

    const otMinute = 60 + 1 + Math.floor(Math.random() * 4)
    const otScorer = pickWeightedPlayer(otRoster, 'shooting')
    const otAssists = pickAssists(otRoster, otScorer)
    const otScorerText = otScorer ? `#${otScorer.jersey_number} ${otScorer.first_name} ${otScorer.last_name}` : ''
    const otAssistNames = otAssists.map(a => `${a.first_name} ${a.last_name}`).join(', ')
    const otAssistText = otAssistNames ? `, ast. ${otAssistNames}` : ''
    addEvent({
      type: 'goal',
      team: otWinner,
      minute: `${otMinute}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      message: `GOAL! ${scoringTeam}${otScorerText ? ' - ' + otScorerText : ' scores the overtime winner!'}${otAssistText}`,
      icon: 'fa-solid fa-hockey-puck',
      className: 'goal-event',
      teamName: scoringTeam,
      scorerId: otScorer?.id || null,
      scorerName: otScorer ? `${otScorer.first_name} ${otScorer.last_name}` : null,
      scorerNumber: otScorer?.jersey_number,
      assists: otAssists.map(a => ({ playerId: a.id, playerName: `${a.first_name} ${a.last_name}`, jerseyNumber: a.jersey_number }))
    })
    await delay(800)
  }

  // Final result
  finalResult.value = {
    homeScore: currentHomeScore.value,
    awayScore: currentAwayScore.value,
    overtime: currentPeriod.value === 'OT',
    periodScores: simPeriodScores.value.map(p => `${p.home}:${p.away}`)
  }

  addEvent({
    type: 'final',
    minute: '',
    message: `Final Score: ${homeTeam} ${currentHomeScore.value} - ${currentAwayScore.value} ${awayTeam}`,
    icon: 'fa-solid fa-flag-checkered',
    className: 'final-event'
  })

  isSimulationRunning.value = false
  simulationComplete.value = true
}

function pickWeightedPlayer(roster, skill) {
  if (!roster || roster.length === 0) return null
  const weights = roster.map(p => Math.max(1, p[skill] || 50))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < roster.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return roster[i]
  }
  return roster[roster.length - 1]
}

function pickAssists(roster, scorer) {
  if (!roster || roster.length < 2) return []
  const available = roster.filter(p => p.id !== scorer?.id)
  if (available.length === 0) return []
  const roll = Math.random()
  if (roll < 0.15) return [] // unassisted
  const a1 = pickWeightedPlayer(available, 'passing')
  if (roll < 0.55 || available.length < 2) return a1 ? [a1] : [] // one assist
  const remaining = available.filter(p => p.id !== a1?.id)
  const a2 = pickWeightedPlayer(remaining, 'passing')
  return [a1, a2].filter(Boolean) // two assists
}

function generateRandomEvent(homeTeam, awayTeam, minute, homeRoster, awayRoster) {
  const rand = Math.random()
  const isHome = Math.random() < 0.5
  const team = isHome ? homeTeam : awayTeam
  const teamSide = isHome ? 'home' : 'away'
  const roster = isHome ? homeRoster : awayRoster
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  const timeStr = `${minute}:${seconds}`

  if (rand < 0.33) {
    // Goal with scorer and assists
    const scorer = pickWeightedPlayer(roster, 'shooting')
    const assists = pickAssists(roster, scorer)
    const scorerText = scorer ? `#${scorer.jersey_number} ${scorer.first_name} ${scorer.last_name}` : ''
    const assistNames = assists.map(a => `${a.first_name} ${a.last_name}`).join(', ')
    const assistText = assistNames ? `, ast. ${assistNames}` : ''
    return {
      type: 'goal',
      team: teamSide,
      minute: timeStr,
      message: `GOAL! ${team}${scorerText ? ' - ' + scorerText : ' scores!'}${assistText}`,
      icon: 'fa-solid fa-hockey-puck',
      className: 'goal-event',
      teamName: team,
      scorerId: scorer?.id || null,
      scorerName: scorer ? `${scorer.first_name} ${scorer.last_name}` : null,
      scorerNumber: scorer?.jersey_number,
      assists: assists.map(a => ({ playerId: a.id, playerName: `${a.first_name} ${a.last_name}`, jerseyNumber: a.jersey_number }))
    }
  } else if (rand < 0.50) {
    return {
      type: 'save',
      minute: timeStr,
      message: `Great save by ${team}'s goaltender!`,
      icon: 'fa-solid fa-shield',
      className: 'save-event'
    }
  } else if (rand < 0.65) {
    const shooter = pickWeightedPlayer(roster, 'shooting')
    const shooterText = shooter ? `#${shooter.jersey_number} ${shooter.first_name} ${shooter.last_name}` : team
    return {
      type: 'shot',
      minute: timeStr,
      message: `${shooterText} with a shot on goal`,
      icon: 'fa-solid fa-crosshairs',
      className: 'shot-event'
    }
  } else if (rand < 0.78) {
    const penalized = pickWeightedPlayer(roster, 'physical')
    const penaltyText = penalized ? `#${penalized.jersey_number} ${penalized.first_name} ${penalized.last_name} (${team})` : team
    return {
      type: 'penalty',
      minute: timeStr,
      message: `Penalty called on ${penaltyText}`,
      icon: 'fa-solid fa-gavel',
      className: 'penalty-event'
    }
  } else if (rand < 0.88) {
    return {
      type: 'powerplay',
      minute: timeStr,
      message: `${team} on the power play`,
      icon: 'fa-solid fa-bolt',
      className: 'powerplay-event'
    }
  } else {
    const hitter = pickWeightedPlayer(roster, 'physical')
    const hitterText = hitter ? `#${hitter.jersey_number} ${hitter.last_name}` : team
    return {
      type: 'hit',
      minute: timeStr,
      message: `Big hit by ${hitterText}!`,
      icon: 'fa-solid fa-burst',
      className: 'hit-event'
    }
  }
}

// Build initial goal counts from current tournament stats so live sim shows tournament totals
function seedGoalCountsFromStats() {
  const counts = {}
  for (const stat of tournamentStats.value) {
    if (stat.goals > 0 && stat.jerseyNumber && stat.playerName) {
      const key = stat.jerseyNumber + ':' + stat.playerName
      counts[key] = stat.goals
    }
  }
  return counts
}

function addEvent(event) {
  let enriched = { ...event, id: Date.now() + Math.random() }
  // Track running goal count per scorer
  if (event.type === 'goal' && event.scorerName) {
    const key = event.scorerNumber + ':' + event.scorerName
    simGoalCounts.value[key] = (simGoalCounts.value[key] || 0) + 1
    const count = simGoalCounts.value[key]
    // Insert goal count after scorer name in message
    const scorerFull = `#${event.scorerNumber} ${event.scorerName}`
    enriched.message = event.message.replace(scorerFull, `${scorerFull} [${count}]`)
  }
  detailedEvents.value.push(enriched)
  // Auto-scroll to bottom
  setTimeout(() => {
    const container = document.querySelector('.events-list')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, 50)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function closeDetailedModal() {
  if (simulationComplete.value && detailedMatch.value && finalResult.value) {
    // Save the actual result from the live simulation
    simulating.value = true
    const isPlayoffMatch = detailedMatch.value.stage !== 'group'
    try {
      await hockeyStore.simulateMatch(detailedMatch.value.id, false, {
        homeScore: finalResult.value.homeScore,
        awayScore: finalResult.value.awayScore,
        overtime: finalResult.value.overtime || false,
        shootout: finalResult.value.shootout || false,
        events: detailedEvents.value,
        periodScores: finalResult.value.periodScores || []
      })
      // Check playoff advancement if this is a playoff match
      if (isPlayoffMatch && season.value) {
        await hockeyStore.checkPlayoffAdvance(season.value.id)
        await hockeyStore.fetchWorld(worldId.value)
      }
      await hockeyStore.fetchSeason(worldId.value)
    } catch (err) {
      console.error('Failed to save match result:', err)
    } finally {
      simulating.value = false
    }
  }

  showDetailedModal.value = false
  detailedMatch.value = null
  detailedEvents.value = []
  isSimulationRunning.value = false
  simulationComplete.value = false
  finalResult.value = null
}

async function handleStartPlayoffs() {
  startingPlayoffs.value = true
  try {
    await hockeyStore.startPlayoffs(season.value.id)
    await hockeyStore.fetchSeason(worldId.value)
    groupTab.value = 'bracket'
  } catch (err) {
    console.error('Failed to start playoffs:', err)
  } finally {
    startingPlayoffs.value = false
  }
}

async function simulatePlayoffMatch(matchId, detailed = false) {
  if (detailed) {
    // Find the match
    const match = season.value.matches.find(m => m.id === matchId)
    if (!match) return

    // Load rosters and current stats in parallel
    let homeRoster = [], awayRoster = []
    try {
      const rosterPromise = Promise.all([
        hockeyStore.fetchTeamRoster(match.home_team_id),
        hockeyStore.fetchTeamRoster(match.away_team_id)
      ])
      const statsPromise = season.value ? hockeyStore.fetchTournamentStats(season.value.id) : Promise.resolve()
      const [rosterResults] = await Promise.all([rosterPromise, statsPromise])
      homeRoster = (rosterResults[0]?.players || []).filter(p => p.position !== 'G')
      awayRoster = (rosterResults[1]?.players || []).filter(p => p.position !== 'G')
    } catch (err) {
      console.error('Failed to load rosters for simulation:', err)
    }

    // Setup detailed simulation
    detailedMatch.value = match
    detailedEvents.value = []
    // Seed goal counts from tournament stats so live sim shows tournament totals
    simGoalCounts.value = seedGoalCountsFromStats()
    simPeriodScores.value = [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }]
    currentHomeScore.value = 0
    currentAwayScore.value = 0
    currentPeriod.value = 1
    simulationComplete.value = false
    finalResult.value = null
    showDetailedModal.value = true
    isSimulationRunning.value = true

    // Run animated simulation (playoff = true for OT rules)
    await runDetailedSimulation(matchId, true, homeRoster, awayRoster)
  } else {
    // Fast simulation
    simulating.value = true
    try {
      await hockeyStore.simulateMatch(matchId, false)
      await hockeyStore.checkPlayoffAdvance(season.value.id)
      await hockeyStore.fetchWorld(worldId.value)
      await hockeyStore.fetchSeason(worldId.value)
    } catch (err) {
      console.error('Failed to simulate match:', err)
    } finally {
      simulating.value = false
    }
  }
}

async function loadHistory() {
  try {
    await hockeyStore.fetchHistory(worldId.value)
  } catch (err) {
    console.error('Failed to load history:', err)
  }
}

async function viewOldTournament(item) {
  if (!item.season_id) return
  try {
    await hockeyStore.fetchSeasonById(item.season_id)
    hockeyStore.viewingHistoric = true
    historicYear.value = item.year
    activeTab.value = 'tournament'
    // Default to bracket tab if playoffs, otherwise standings
    if (hockeyStore.currentSeason?.phase === 'playoff') {
      groupTab.value = 'bracket'
    } else {
      groupTab.value = 'standings'
    }
  } catch (err) {
    console.error('Failed to load old tournament:', err)
  }
}

async function backToCurrent() {
  try {
    await hockeyStore.fetchSeason(worldId.value)
    hockeyStore.viewingHistoric = false
    historicYear.value = null
    if (hockeyStore.currentSeason?.phase === 'playoff') {
      groupTab.value = 'bracket'
    } else {
      groupTab.value = 'standings'
    }
  } catch (err) {
    console.error('Failed to load current season:', err)
  }
}

async function openPlayerDetail(playerId) {
  try {
    const data = await hockeyStore.fetchPlayerCareer(playerId)
    playerDetailData.value = data
    showPlayerDetail.value = true
  } catch (err) {
    console.error('Failed to load player career:', err)
  }
}

function confirmReset() {
  showResetModal.value = true
}

async function handleReset() {
  resetting.value = true
  try {
    await hockeyStore.resetWorld(worldId.value)
    await hockeyStore.fetchWorld(worldId.value)
    hockeyStore.viewingHistoric = false
    historicYear.value = null
  } catch (err) {
    console.error('Failed to reset world:', err)
  } finally {
    resetting.value = false
    showResetModal.value = false
  }
}

// Auto-select the active (first unplayed) round when season loads
watch(activeRound, (newRound) => {
  if (newRound && selectedRound.value === 1) {
    selectedRound.value = newRound
  }
})

onMounted(async () => {
  try {
    await hockeyStore.fetchWorld(worldId.value)
    await hockeyStore.fetchSeason(worldId.value)
    // Set selected round to the active round after data loads
    if (activeRound.value) {
      selectedRound.value = activeRound.value
    }
    // Default to bracket tab during playoffs
    if (season.value?.phase === 'playoff') {
      groupTab.value = 'bracket'
    }
  } catch (error) {
    console.error('Failed to load world:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import '../assets/sport-view.css';

.hockey-view {
  min-height: 100vh;
  background: var(--gray-50);
}

.hockey-header {
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
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0ea5e9;
}

.header-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--gray-200);
}

.tab-btn.active {
  background: #0ea5e9;
  color: white;
}

.reset-btn {
  color: var(--gray-500);
}

.reset-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}

.hockey-main {
  padding: 2rem 0;
}

.loading-state {
  text-align: center;
  padding: 4rem;
  color: var(--gray-500);
}

.loading-state i {
  font-size: 2rem;
  display: block;
  margin-bottom: 1rem;
  color: #0ea5e9;
}

.no-season {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #bae6fd, #7dd3fc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-icon i {
  font-size: 2.5rem;
  color: #0ea5e9;
}

.phase-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 1rem;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: white;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.phase-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.phase-host {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 400;
  opacity: 0.9;
}

.phase-banner.playoff {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

/* Sub-tabs */
.sub-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--gray-100);
  padding: 0.375rem;
  border-radius: 0.75rem;
}

.sub-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--gray-600);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.sub-tab:hover {
  background: var(--gray-200);
  color: var(--gray-800);
}

.sub-tab.active {
  background: white;
  color: #0ea5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sub-tab i {
  font-size: 0.875rem;
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Round Selector */
.round-selector-container {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.round-label {
  display: block;
  text-align: center;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.round-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.round-dot {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--gray-200);
  background: white;
  color: var(--gray-500);
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  position: relative;
}

.round-dot:hover {
  border-color: #0ea5e9;
  color: #0ea5e9;
}

.round-dot.completed {
  background: #dcfce7;
  border-color: #22c55e;
  color: #22c55e;
}

.round-dot.completed .round-number {
  display: none;
}

.round-dot.completed .round-check {
  font-size: 0.75rem;
}

.round-dot.current:not(.active) {
  border-color: #0ea5e9;
  color: #0ea5e9;
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(14, 165, 233, 0); }
}

.round-dot.active {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border-color: #0ea5e9;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
}

.round-dot.active .round-check {
  display: none;
}

.round-dot.active .round-number {
  display: inline;
}

.round-progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.round-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* Empty Division II */
.empty-div2 {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--gray-400);
}

.empty-div2 i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-div2 p {
  font-size: 0.875rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.group-panel {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.panel-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
}

.panel-header h2 i {
  color: #0ea5e9;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.standings-table th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid var(--gray-200);
  color: var(--gray-500);
  font-weight: 500;
}

.standings-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--gray-100);
}

.standings-table .pos {
  width: 30px;
  font-weight: 600;
  color: var(--gray-500);
}

.standings-table .team {
  min-width: 120px;
}

.standings-table .pts {
  font-weight: 700;
  color: var(--gray-900);
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.standings-table tr.playoff {
  background: #f0fdf4;
}

.standings-table tr.playoff .pos {
  color: #22c55e;
}

.standings-table tr.relegated {
  background: #fef2f2;
}

.standings-table tr.relegated .pos {
  color: #ef4444;
}

.standings-table tr.promoted {
  background: #f0fdf4;
}

.legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.legend-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-item.playoff .dot {
  background: #22c55e;
}

.legend-item.relegated .dot {
  background: #ef4444;
}

.legend-item.promoted .dot {
  background: #22c55e;
}

.actions-bar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
}

/* Playoffs */
.playoffs-container {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.bracket-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--gray-800);
}

.bracket {
  display: flex;
  justify-content: space-around;
  gap: 2rem;
  overflow-x: auto;
  padding: 1rem 0;
}

.bracket-round {
  min-width: 200px;
}

.bracket-round h4 {
  text-align: center;
  color: var(--gray-500);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.matches-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bracket-match {
  background: var(--gray-50);
  border-radius: 0.5rem;
  padding: 0.75rem;
  position: relative;
}

.bracket-match.completed {
  background: white;
  border: 2px solid #22c55e;
}

.bracket-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.bracket-team.winner {
  font-weight: 600;
  color: #22c55e;
}

.bracket-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
}

.bracket-score {
  margin-left: auto;
  font-weight: 600;
}

.simulate-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem 0.5rem;
}

.bracket-actions {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 0.25rem;
}

.bracket-actions .btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.match-label {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #cd7f32;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.match-label.gold {
  background: #fbbf24;
  color: #78350f;
}

.bracket-match.final {
  border: 2px solid #fbbf24;
}

.bracket-match.bronze {
  border: 2px solid #cd7f32;
}

/* Relegation Section */
.relegation-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--gray-200);
}

.relegation-section h3 {
  font-size: 1rem;
  color: var(--gray-700);
  margin-bottom: 1rem;
}

.relegation-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.relegated-teams,
.promoted-teams {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.team-badges {
  display: flex;
  gap: 0.5rem;
}

.team-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.team-badge.relegated {
  background: #fef2f2;
  color: #ef4444;
}

.team-badge.promoted {
  background: #f0fdf4;
  color: #22c55e;
}

.division-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.division-badge.div-top {
  background: #eff6ff;
  color: #3b82f6;
}

.division-badge.div-2 {
  background: #fefce8;
  color: #ca8a04;
}

.championship-complete {
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
  border-top: 1px solid var(--gray-200);
}

.championship-complete h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.championship-complete .gold {
  color: #fbbf24;
}

/* Division II Section */
.division2-section {
  margin-top: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.div2-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
  cursor: pointer;
  text-align: left;
}

.div2-toggle:hover {
  background: var(--gray-50);
}

.div2-content {
  padding: 0 1.5rem 1.5rem;
}

.div2-table {
  font-size: 0.8rem;
}

/* History */
.history-panel {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.empty-history {
  text-align: center;
  padding: 3rem;
  color: var(--gray-400);
}

.empty-history i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.history-table-wrap {
  overflow-x: auto;
}

.history-table {
  margin-top: 0;
}

.history-year-cell {
  font-weight: 700;
  font-size: 1rem;
}

.history-host-cell {
  color: var(--gray-500);
  font-size: 0.85rem;
}

.host-country {
  opacity: 0.8;
}

.gold-col {
  color: #b8860b;
  font-weight: 600;
}

.silver-col {
  color: #6b7280;
  font-weight: 600;
}

.bronze-col {
  color: #cd7f32;
  font-weight: 600;
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
  max-width: 400px;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.delete-warning {
  color: var(--gray-600);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

@media (max-width: 1024px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }

  .bracket {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
  }

  .header-tabs {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}

/* Match Cards */
.matches-section {
  margin-top: 2rem;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.matches-panel {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.matches-panel .panel-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 1rem;
}

.matches-panel .panel-header h3 i {
  color: #0ea5e9;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 500px;
  overflow-y: auto;
}

.round-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 0.5rem 0.25rem;
  margin-top: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.round-header:first-child {
  margin-top: 0;
}

.match-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.match-card.completed {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.match-card.clickable,
.bracket-match.clickable {
  cursor: pointer;
}

.match-card.clickable:hover,
.bracket-match.clickable:hover {
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
  border-color: #7dd3fc;
}

.team-link {
  cursor: pointer;
  transition: color 0.15s;
}

.team-link:hover {
  color: #0ea5e9;
}

.team-link:hover span {
  text-decoration: underline;
}

.assist-text {
  color: var(--gray-500);
  font-size: 0.85em;
}

.goal-count {
  font-weight: 700;
  color: #0ea5e9;
  font-size: 0.85em;
}

.match-card .team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.match-card .team.home {
  justify-content: flex-end;
  text-align: right;
}

.match-card .team.away {
  justify-content: flex-start;
}

.match-card .match-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
}

.match-card .team-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.match-card .score-box {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 70px;
  justify-content: center;
}

.match-card .score {
  font-weight: 700;
  font-size: 1rem;
  color: var(--gray-900);
}

.match-card .vs {
  color: var(--gray-400);
  font-size: 0.75rem;
}

.match-card .overtime-badge,
.match-card .shootout-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  margin-left: 0.25rem;
}

.match-card .overtime-badge {
  background: #fef3c7;
  color: #d97706;
}

.match-card .shootout-badge {
  background: #dbeafe;
  color: #2563eb;
}

.match-card .match-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.match-card .match-actions .btn-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

/* Simulation Modal */
.simulation-modal {
  max-width: 500px;
}

.simulation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.sim-team {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.sim-team.home {
  justify-content: flex-start;
}

.sim-team.away {
  justify-content: flex-end;
}

.sim-flag {
  width: 40px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sim-team-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
}

.sim-score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.sim-score {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.sim-separator {
  font-size: 2rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0.25rem;
}

.sim-score-box {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}

.sim-period {
  width: 100%;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.25rem;
}

.sim-period .overtime {
  color: #fbbf24;
  font-weight: 600;
}

.events-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.event-item i {
  width: 20px;
  text-align: center;
}

.event-minute {
  min-width: 45px;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.75rem;
  color: inherit;
  opacity: 0.8;
}

.event-item.period-event {
  background: var(--gray-200);
  color: var(--gray-700);
  font-weight: 600;
}

.event-item.goal-event {
  background: #dcfce7;
  color: #16a34a;
  font-weight: 600;
}

.event-item.save-event {
  background: #dbeafe;
  color: #2563eb;
}

.event-item.shot-event {
  background: white;
  color: var(--gray-600);
}

.event-item.penalty-event {
  background: #fef3c7;
  color: #d97706;
}

.event-item.powerplay-event {
  background: #fef9c3;
  color: #ca8a04;
}

.event-item.hit-event {
  background: #fce7f3;
  color: #db2777;
}

.event-item.overtime-event {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  font-weight: 600;
}

.event-item.final-event {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.event-item.running {
  color: var(--gray-500);
  font-style: italic;
}

@media (max-width: 1024px) {
  .matches-grid {
    grid-template-columns: 1fr;
  }
}

/* Stats Tab */
.stats-container {
  max-width: 900px;
  margin: 0 auto;
}

.jersey-num {
  font-family: monospace;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--gray-500);
  min-width: 30px;
}

.roster-selector {
  margin-bottom: 1.5rem;
}

.roster-dropdown {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: var(--gray-800);
  cursor: pointer;
  appearance: auto;
}

.roster-dropdown:focus {
  outline: none;
  border-color: #0ea5e9;
}

.roster-section {
  margin-bottom: 1.5rem;
}

.roster-position-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0ea5e9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid #0ea5e9;
}

.roster-table .jersey {
  font-family: monospace;
  font-weight: 600;
  color: var(--gray-500);
  width: 40px;
}

.allstars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.allstar-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
  border: 2px solid var(--gray-200);
}

.allstar-card.gold-card {
  background: #fffbeb;
  border-color: #fbbf24;
}

.allstar-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0ea5e9;
  margin-bottom: 0.5rem;
}

.gold-card .allstar-label {
  color: #d97706;
}

.allstar-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.375rem;
}

.allstar-team {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.25rem;
}

.allstar-stats {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
}

@media (max-width: 640px) {
  .allstars-grid {
    grid-template-columns: 1fr;
  }
}

/* Historic viewing banner */
.historic-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.historic-back-btn {
  margin-left: 1rem;
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.historic-back-btn:hover {
  background: rgba(255, 255, 255, 0.35) !important;
}

/* Host flag in phase banner */
.host-flag {
  width: 20px;
  height: 14px;
  object-fit: cover;
  border-radius: 2px;
  vertical-align: middle;
}

/* Medal table */
.medal-table .gold-col {
  font-weight: 600;
}

/* Player career modal */
.player-career-content {
  padding: 0 1.5rem;
}

.player-career-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: 1rem;
}

.player-career-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
}

.player-career-pos {
  margin-top: 0.25rem;
}

.position-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pos-F {
  background: #dbeafe;
  color: #1d4ed8;
}

.pos-D {
  background: #dcfce7;
  color: #15803d;
}

.pos-G {
  background: #fef3c7;
  color: #b45309;
}

.player-skills-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.skill-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  min-width: 50px;
}

.skill-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-500);
}

.skill-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-900);
}

.career-totals-row {
  background: var(--gray-50);
  border-top: 2px solid var(--gray-300);
}

/* Period scores row */
.period-scores-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  width: 100%;
  margin-top: 0.25rem;
}

.period-score-item {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.125rem 0.4rem;
  border-radius: 0.25rem;
}

.period-score-item.period-active {
  color: white;
  background: rgba(255, 255, 255, 0.25);
  font-weight: 700;
}
</style>
