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
              <!-- Phase Banner -->
              <div class="phase-banner" :class="season.phase">
                <i :class="season.phase === 'group' ? 'fa-solid fa-layer-group' : 'fa-solid fa-trophy'"></i>
                <span v-if="season.phase === 'group'">Group Stage</span>
                <span v-else>Playoff Stage</span>
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
                                <div class="team-cell">
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
                                <div class="team-cell">
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
                  <!-- Round Slider -->
                  <div class="round-slider-container">
                    <label class="round-label">Round {{ selectedRound }} of {{ totalRounds }}</label>
                    <div class="round-slider-wrapper">
                      <button @click="selectedRound = Math.max(1, selectedRound - 1)" class="round-btn" :disabled="selectedRound <= 1">
                        <i class="fa-solid fa-chevron-left"></i>
                      </button>
                      <input
                        type="range"
                        v-model.number="selectedRound"
                        :min="1"
                        :max="totalRounds"
                        class="round-slider"
                      />
                      <button @click="selectedRound = Math.min(totalRounds, selectedRound + 1)" class="round-btn" :disabled="selectedRound >= totalRounds">
                        <i class="fa-solid fa-chevron-right"></i>
                      </button>
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
                          :class="{ completed: match.status === 'completed' }"
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
                          :class="{ completed: match.status === 'completed' }"
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

                <!-- Simulate All / Start Playoffs -->
                <div class="actions-bar">
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
                <div class="bracket-section">
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
                          :class="{ completed: match.status === 'completed' }"
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
                          :class="{ completed: match.status === 'completed' }"
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
                          :class="{ completed: playoffMatches.bronze[0].status === 'completed' }"
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
                          :class="{ completed: playoffMatches.final[0].status === 'completed' }"
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
                <div v-if="season.status === 'completed'" class="championship-complete">
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

          <!-- History Tab -->
          <template v-if="activeTab === 'history'">
            <div class="history-panel fade-in">
              <div class="panel-header">
                <h2>
                  <i class="fa-solid fa-trophy"></i>
                  Championship History
                </h2>
              </div>
              <div v-if="seasonHistory.length === 0" class="empty-history">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>No championships completed yet</p>
              </div>
              <div v-else class="history-list">
                <div v-for="item in seasonHistory" :key="item.id" class="history-item">
                  <div class="history-year">{{ item.year }}</div>
                  <div class="history-medals">
                    <div class="medal gold">
                      <i class="fa-solid fa-medal"></i>
                      <span>{{ item.gold_team_name }}</span>
                    </div>
                    <div class="medal silver">
                      <i class="fa-solid fa-medal"></i>
                      <span>{{ item.silver_team_name }}</span>
                    </div>
                    <div class="medal bronze">
                      <i class="fa-solid fa-medal"></i>
                      <span>{{ item.bronze_team_name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

const loading = ref(true)
const activeTab = ref('tournament')
const showDiv2 = ref(false)
const creatingSeason = ref(false)
const simulating = ref(false)
const startingPlayoffs = ref(false)
const showResetModal = ref(false)
const resetting = ref(false)

// Detailed simulation modal state
const showDetailedModal = ref(false)
const detailedMatch = ref(null)
const detailedEvents = ref([])
const currentHomeScore = ref(0)
const currentAwayScore = ref(0)
const currentPeriod = ref(1)
const isSimulationRunning = ref(false)
const simulationComplete = ref(false)
const finalResult = ref(null)

// Sub-tabs and round slider state
const groupTab = ref('standings')
const selectedRound = ref(1)

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

    // Setup detailed simulation
    detailedMatch.value = match
    detailedEvents.value = []
    currentHomeScore.value = 0
    currentAwayScore.value = 0
    currentPeriod.value = 1
    simulationComplete.value = false
    finalResult.value = null
    showDetailedModal.value = true
    isSimulationRunning.value = true

    // Run animated simulation
    await runDetailedSimulation(matchId)
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

async function runDetailedSimulation(matchId, isPlayoff = false) {
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

    // Generate random events for this period (2-5 events)
    const eventCount = 2 + Math.floor(Math.random() * 4)
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

      const event = generateRandomEvent(homeTeam, awayTeam, minute)
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
        } else {
          currentAwayScore.value++
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
    if (otWinner === 'home') {
      currentHomeScore.value++
    } else {
      currentAwayScore.value++
    }

    const otMinute = 60 + 1 + Math.floor(Math.random() * 4)
    addEvent({
      type: 'goal',
      team: otWinner,
      minute: `${otMinute}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      message: `GOAL! ${scoringTeam} scores the overtime winner!`,
      icon: 'fa-solid fa-hockey-puck',
      className: 'goal-event'
    })
    await delay(800)
  }

  // Final result
  finalResult.value = {
    homeScore: currentHomeScore.value,
    awayScore: currentAwayScore.value,
    overtime: currentPeriod.value === 'OT'
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

function generateRandomEvent(homeTeam, awayTeam, minute) {
  const rand = Math.random()
  const isHome = Math.random() < 0.5
  const team = isHome ? homeTeam : awayTeam
  const teamSide = isHome ? 'home' : 'away'
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  const timeStr = `${minute}:${seconds}`

  if (rand < 0.25) {
    // Goal
    return {
      type: 'goal',
      team: teamSide,
      minute: timeStr,
      message: `GOAL! ${team} scores!`,
      icon: 'fa-solid fa-hockey-puck',
      className: 'goal-event'
    }
  } else if (rand < 0.45) {
    // Save
    return {
      type: 'save',
      minute: timeStr,
      message: `Great save by ${team}'s goaltender!`,
      icon: 'fa-solid fa-shield',
      className: 'save-event'
    }
  } else if (rand < 0.60) {
    // Shot
    return {
      type: 'shot',
      minute: timeStr,
      message: `${team} with a shot on goal`,
      icon: 'fa-solid fa-crosshairs',
      className: 'shot-event'
    }
  } else if (rand < 0.75) {
    // Penalty
    return {
      type: 'penalty',
      minute: timeStr,
      message: `Penalty called on ${team}`,
      icon: 'fa-solid fa-gavel',
      className: 'penalty-event'
    }
  } else if (rand < 0.85) {
    // Power play
    return {
      type: 'powerplay',
      minute: timeStr,
      message: `${team} on the power play`,
      icon: 'fa-solid fa-bolt',
      className: 'powerplay-event'
    }
  } else {
    // Hit
    return {
      type: 'hit',
      minute: timeStr,
      message: `Big hit by ${team}!`,
      icon: 'fa-solid fa-burst',
      className: 'hit-event'
    }
  }
}

function addEvent(event) {
  detailedEvents.value.push({
    ...event,
    id: Date.now() + Math.random()
  })
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
        events: detailedEvents.value
      })
      // Check playoff advancement if this is a playoff match
      if (isPlayoffMatch && season.value) {
        await hockeyStore.checkPlayoffAdvance(season.value.id)
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

    // Setup detailed simulation
    detailedMatch.value = match
    detailedEvents.value = []
    currentHomeScore.value = 0
    currentAwayScore.value = 0
    currentPeriod.value = 1
    simulationComplete.value = false
    finalResult.value = null
    showDetailedModal.value = true
    isSimulationRunning.value = true

    // Run animated simulation (playoff = true for OT rules)
    await runDetailedSimulation(matchId, true)
  } else {
    // Fast simulation
    simulating.value = true
    try {
      await hockeyStore.simulateMatch(matchId, false)
      await hockeyStore.checkPlayoffAdvance(season.value.id)
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

function confirmReset() {
  showResetModal.value = true
}

async function handleReset() {
  resetting.value = true
  try {
    await hockeyStore.resetWorld(worldId.value)
    await hockeyStore.fetchWorld(worldId.value)
  } catch (err) {
    console.error('Failed to reset world:', err)
  } finally {
    resetting.value = false
    showResetModal.value = false
  }
}

onMounted(async () => {
  try {
    await hockeyStore.fetchWorld(worldId.value)
    await hockeyStore.fetchSeason(worldId.value)
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
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: white;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
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

/* Round Slider */
.round-slider-container {
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

.round-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.round-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  outline: none;
}

.round-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.4);
  transition: transform 0.2s;
}

.round-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.round-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.4);
}

.round-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--gray-100);
  color: var(--gray-600);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.round-btn:hover:not(:disabled) {
  background: #0ea5e9;
  color: white;
}

.round-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}

.history-year {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
  min-width: 80px;
}

.history-medals {
  display: flex;
  gap: 1.5rem;
}

.medal {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.medal.gold i {
  color: #fbbf24;
}

.medal.silver i {
  color: #94a3b8;
}

.medal.bronze i {
  color: #cd7f32;
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
</style>
