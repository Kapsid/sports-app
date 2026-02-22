<template>
  <div class="league-view">
    <header class="league-header">
      <div class="container header-content">
        <div class="header-left">
          <button @click="goBack" class="btn btn-ghost back-btn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="brand">
            <i class="fa-solid fa-hand"></i>
            <span>{{ world?.name || 'Handball' }}</span>
          </div>
        </div>
        <div class="header-tabs">
          <button
            @click="activeTab = 'season'"
            class="tab-btn"
            :class="{ active: activeTab === 'season' }"
          >
            <i class="fa-solid fa-calendar"></i>
            <span v-if="season">{{ season.name }}</span>
            <span v-else>Season</span>
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
            title="Reset world (clears season and resets teams)"
          >
            <i class="fa-solid fa-rotate-left"></i>
            Reset
          </button>
          <button
            @click="fixTeamSwap"
            class="tab-btn reset-btn"
            title="Fix missed relegation - swap teams"
          >
            <i class="fa-solid fa-right-left"></i>
            Swap
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

    <main class="league-main">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Loading...
        </div>

        <template v-else>
          <!-- Season Tab -->
          <template v-if="activeTab === 'season'">
            <!-- No Season - Create Season -->
            <div v-if="!season" class="no-season fade-in">
            <div class="empty-icon">
              <i class="fa-solid fa-calendar-plus"></i>
            </div>
            <h2>Start a New Season</h2>
            <p>Create a new Czech Extraliga season to begin simulating matches</p>
            <button @click="handleCreateSeason" class="btn btn-primary btn-lg" :disabled="creatingseason">
              <i v-if="creatingseason" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              {{ creatingseason ? 'Creating...' : `Start ${nextSeasonLabel} Season` }}
            </button>
          </div>

          <!-- Season Active -->
          <template v-else>
            <div class="league-grid" :class="{ 'playoffs-mode': season.phase === 'playoff' }">
              <!-- Left Column: Standings (hidden during playoffs) -->
              <div v-if="season.phase === 'regular'" class="standings-panel fade-in">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-list-ol"></i>
                    Standings
                  </h2>
                </div>
                <div class="standings-table-wrapper">
                  <table class="standings-table">
                    <thead>
                      <tr>
                        <th class="pos">#</th>
                        <th class="team">Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th class="pts">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(team, index) in standings"
                        :key="team.teamId"
                        :class="getPositionClass(index)"
                      >
                        <td class="pos">{{ index + 1 }}</td>
                        <td class="team">
                          <div class="team-cell">
                            <img :src="getTeamLogo(team.teamName)" :alt="team.teamName" class="team-logo" />
                            <span>{{ team.teamName }}</span>
                          </div>
                        </td>
                        <td>{{ team.played }}</td>
                        <td>{{ team.won }}</td>
                        <td>{{ team.drawn }}</td>
                        <td>{{ team.lost }}</td>
                        <td>{{ team.goalsFor }}</td>
                        <td>{{ team.goalsAgainst }}</td>
                        <td :class="team.goalDifference > 0 ? 'positive' : team.goalDifference < 0 ? 'negative' : ''">
                          {{ team.goalDifference > 0 ? '+' : '' }}{{ team.goalDifference }}
                        </td>
                        <td class="pts">{{ team.points }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="legend">
                  <div class="legend-item playoff">
                    <span class="dot"></span> Playoffs (1-8)
                  </div>
                  <div class="legend-item playout">
                    <span class="dot"></span> Playout (9-12)
                  </div>
                </div>
              </div>

              <!-- Right Column: Regular Season Matches -->
              <div v-if="season.phase === 'regular'" class="matches-panel fade-in">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-futbol"></i>
                    Round {{ currentRound }} of {{ totalRounds }}
                  </h2>
                  <div class="round-nav">
                    <button
                      @click="changeRound(-1)"
                      class="btn btn-ghost btn-sm"
                      :disabled="currentRound <= 1"
                    >
                      <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button
                      @click="changeRound(1)"
                      class="btn btn-ghost btn-sm"
                      :disabled="currentRound >= totalRounds"
                    >
                      <i class="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                <div class="matches-list">
                  <div
                    v-for="match in roundMatches"
                    :key="match.id"
                    class="match-card"
                    :class="{ completed: match.status === 'completed' }"
                  >
                    <div class="team home">
                      <img :src="getTeamLogo(match.home_team_short)" :alt="match.home_team_short" class="match-logo" />
                      <span class="team-name">{{ match.home_team_short }}</span>
                    </div>
                    <div class="score-box">
                      <template v-if="match.status === 'completed'">
                        <span class="score">{{ match.home_score }} : {{ match.away_score }}</span>
                        <span class="halftime">({{ match.home_halftime }}:{{ match.away_halftime }})</span>
                      </template>
                      <template v-else>
                        <span class="vs">vs</span>
                      </template>
                    </div>
                    <div class="team away">
                      <span class="team-name">{{ match.away_team_short }}</span>
                      <img :src="getTeamLogo(match.away_team_short)" :alt="match.away_team_short" class="match-logo" />
                    </div>
                    <div class="match-actions-inline" v-if="match.status !== 'completed'">
                      <button
                        @click="simulateSingleMatch(match.id, false)"
                        class="btn btn-secondary btn-sm"
                        :disabled="simulating"
                        title="Fast simulation"
                      >
                        <i class="fa-solid fa-forward-fast"></i>
                      </button>
                      <button
                        @click="startLiveSimulation(match)"
                        class="btn btn-primary btn-sm"
                        :disabled="simulating"
                        title="Watch live"
                      >
                        <i class="fa-solid fa-tv"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="match-actions">
                  <button
                    v-if="hasUnplayedMatches"
                    @click="simulateCurrentRound"
                    class="btn btn-primary"
                    :disabled="simulating"
                  >
                    <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-forward"></i>
                    {{ simulating ? 'Simulating...' : 'Simulate Round' }}
                  </button>
                  <button
                    v-if="isRegularSeasonComplete && season.phase === 'regular'"
                    @click="handleStartPlayoffs"
                    class="btn btn-success"
                    :disabled="startingPlayoffs"
                  >
                    <i v-if="startingPlayoffs" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-trophy"></i>
                    {{ startingPlayoffs ? 'Starting...' : 'Start Playoffs' }}
                  </button>
                </div>
              </div>

              <!-- Right Column: Playoffs -->
              <div v-else-if="season.phase === 'playoff'" class="playoffs-panel fade-in">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-trophy"></i>
                    Playoffs - {{ playoffRoundLabel }}
                  </h2>
                </div>

                <!-- Tournament Bracket -->
                <div class="tournament-bracket">
                  <!-- Quarterfinals Column -->
                  <div class="bracket-column quarterfinals">
                    <h3 class="column-title">Quarterfinals</h3>
                    <div class="bracket-matchups">
                      <div
                        v-for="(series, idx) in groupedPlayoffSeries('quarterfinal')"
                        :key="'qf-'+idx"
                        class="matchup-card"
                        :class="{ decided: series.winner }"
                      >
                        <div class="matchup-team top" :class="{ winner: series.winner === series.team1 }">
                          <span v-if="series.team1Position" class="matchup-position">({{ series.team1Position }})</span>
                          <img :src="getTeamLogo(series.team1)" class="matchup-logo" />
                          <span class="matchup-name">{{ series.team1 }}</span>
                          <span class="matchup-wins">{{ series.team1Wins }}</span>
                        </div>
                        <div class="matchup-team bottom" :class="{ winner: series.winner === series.team2 }">
                          <span v-if="series.team2Position" class="matchup-position">({{ series.team2Position }})</span>
                          <img :src="getTeamLogo(series.team2)" class="matchup-logo" />
                          <span class="matchup-name">{{ series.team2 }}</span>
                          <span class="matchup-wins">{{ series.team2Wins }}</span>
                        </div>
                        <div class="matchup-games">
                          <div v-for="match in series.matches" :key="match.id" class="mini-game" :class="{ completed: match.status === 'completed' }">
                            <span class="mini-label">{{ match.round }}</span>
                            <template v-if="match.status === 'completed'">
                              <span class="mini-score">{{ match.team1Score }}-{{ match.team2Score }}</span>
                            </template>
                            <button v-else @click="simulateSingleMatch(match.id, false)" class="mini-play" :disabled="simulating">
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                        <div v-if="series.winner" class="matchup-winner-badge">
                          <i class="fa-solid fa-arrow-right"></i>
                        </div>
                      </div>
                      <!-- Placeholder if quarterfinals empty -->
                      <template v-if="!playoffMatches.quarterfinal?.length">
                        <div class="matchup-card placeholder" v-for="i in 4" :key="'qf-ph-'+i">
                          <div class="matchup-team top"><span class="matchup-name">TBD</span></div>
                          <div class="matchup-team bottom"><span class="matchup-name">TBD</span></div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Connector Lines QF → SF -->
                  <div class="bracket-connectors qf-sf">
                    <div class="connector-pair">
                      <div class="connector-line top"></div>
                      <div class="connector-line bottom"></div>
                      <div class="connector-merge"></div>
                    </div>
                    <div class="connector-pair">
                      <div class="connector-line top"></div>
                      <div class="connector-line bottom"></div>
                      <div class="connector-merge"></div>
                    </div>
                  </div>

                  <!-- Semifinals Column -->
                  <div class="bracket-column semifinals">
                    <h3 class="column-title">Semifinals</h3>
                    <div class="bracket-matchups">
                      <div
                        v-for="(series, idx) in groupedPlayoffSeries('semifinal')"
                        :key="'sf-'+idx"
                        class="matchup-card"
                        :class="{ decided: series.winner }"
                      >
                        <div class="matchup-team top" :class="{ winner: series.winner === series.team1 }">
                          <span v-if="series.team1Position" class="matchup-position">({{ series.team1Position }})</span>
                          <img :src="getTeamLogo(series.team1)" class="matchup-logo" />
                          <span class="matchup-name">{{ series.team1 }}</span>
                          <span class="matchup-wins">{{ series.team1Wins }}</span>
                        </div>
                        <div class="matchup-team bottom" :class="{ winner: series.winner === series.team2 }">
                          <span v-if="series.team2Position" class="matchup-position">({{ series.team2Position }})</span>
                          <img :src="getTeamLogo(series.team2)" class="matchup-logo" />
                          <span class="matchup-name">{{ series.team2 }}</span>
                          <span class="matchup-wins">{{ series.team2Wins }}</span>
                        </div>
                        <div class="matchup-games">
                          <div v-for="match in series.matches" :key="match.id" class="mini-game" :class="{ completed: match.status === 'completed' }">
                            <span class="mini-label">{{ match.round }}</span>
                            <template v-if="match.status === 'completed'">
                              <span class="mini-score">{{ match.team1Score }}-{{ match.team2Score }}</span>
                            </template>
                            <button v-else @click="simulateSingleMatch(match.id, false)" class="mini-play" :disabled="simulating">
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                        <div v-if="series.winner" class="matchup-winner-badge">
                          <i class="fa-solid fa-arrow-right"></i>
                        </div>
                      </div>
                      <!-- Placeholder if semifinals don't exist yet -->
                      <template v-if="!playoffMatches.semifinal?.length">
                        <div class="matchup-card placeholder" v-for="i in 2" :key="'sf-ph-'+i">
                          <div class="matchup-team top"><span class="matchup-name">QF Winner</span></div>
                          <div class="matchup-team bottom"><span class="matchup-name">QF Winner</span></div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Connector Lines SF → F -->
                  <div class="bracket-connectors sf-f">
                    <div class="connector-pair single">
                      <div class="connector-line top"></div>
                      <div class="connector-line bottom"></div>
                      <div class="connector-merge"></div>
                    </div>
                  </div>

                  <!-- Finals Column -->
                  <div class="bracket-column finals">
                    <h3 class="column-title">
                      <i class="fa-solid fa-trophy"></i>
                      Finals
                    </h3>
                    <div class="bracket-matchups">
                      <div
                        v-for="(series, idx) in groupedPlayoffSeries('final')"
                        :key="'f-'+idx"
                        class="matchup-card final-card"
                        :class="{ decided: series.winner }"
                      >
                        <div class="matchup-team top" :class="{ winner: series.winner === series.team1, champion: series.winner === series.team1 }">
                          <span v-if="series.team1Position" class="matchup-position">({{ series.team1Position }})</span>
                          <img :src="getTeamLogo(series.team1)" class="matchup-logo" />
                          <span class="matchup-name">{{ series.team1 }}</span>
                          <span class="matchup-wins">{{ series.team1Wins }}</span>
                          <i v-if="series.winner === series.team1" class="fa-solid fa-crown champion-icon"></i>
                        </div>
                        <div class="matchup-team bottom" :class="{ winner: series.winner === series.team2, champion: series.winner === series.team2 }">
                          <span v-if="series.team2Position" class="matchup-position">({{ series.team2Position }})</span>
                          <img :src="getTeamLogo(series.team2)" class="matchup-logo" />
                          <span class="matchup-name">{{ series.team2 }}</span>
                          <span class="matchup-wins">{{ series.team2Wins }}</span>
                          <i v-if="series.winner === series.team2" class="fa-solid fa-crown champion-icon"></i>
                        </div>
                        <div class="matchup-games">
                          <div v-for="match in series.matches" :key="match.id" class="mini-game" :class="{ completed: match.status === 'completed' }">
                            <span class="mini-label">{{ match.round }}</span>
                            <template v-if="match.status === 'completed'">
                              <span class="mini-score">{{ match.team1Score }}-{{ match.team2Score }}</span>
                            </template>
                            <button v-else @click="simulateSingleMatch(match.id, false)" class="mini-play" :disabled="simulating">
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <!-- Placeholder if finals don't exist yet -->
                      <template v-if="!playoffMatches.final?.length">
                        <div class="matchup-card placeholder final-card">
                          <div class="matchup-team top"><span class="matchup-name">SF Winner</span></div>
                          <div class="matchup-team bottom"><span class="matchup-name">SF Winner</span></div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Champion Display -->
                  <div v-if="champion" class="champion-column">
                    <div class="champion-trophy">
                      <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div class="champion-info">
                      <span class="champion-label">Champion</span>
                      <img :src="getTeamLogo(champion)" class="champion-logo" />
                      <span class="champion-name">{{ champion }}</span>
                    </div>
                    <button
                      v-if="isSeasonComplete"
                      @click="handleCreateSeason"
                      class="btn btn-new-season"
                      :disabled="creatingseason"
                    >
                      <i v-if="creatingseason" class="fa-solid fa-spinner fa-spin"></i>
                      <i v-else class="fa-solid fa-forward"></i>
                      {{ creatingseason ? 'Creating...' : `Start ${nextSeasonLabel} Season` }}
                    </button>
                  </div>
                </div>

                <!-- 3rd Place Match -->
                <div v-if="playoffMatches.third_place?.length" class="third-place-section">
                  <h3 class="third-place-title">
                    <i class="fa-solid fa-medal"></i>
                    3rd Place Match
                  </h3>
                  <div class="third-place-match" v-for="match in playoffMatches.third_place" :key="match.id">
                    <div class="tp-team" :class="{ winner: match.status === 'completed' && match.home_score > match.away_score }">
                      <img :src="getTeamLogo(match.home_team_short)" class="tp-logo" />
                      <span class="tp-name">{{ match.home_team_short }}</span>
                      <span v-if="match.status === 'completed'" class="tp-score">{{ match.home_score }}</span>
                    </div>
                    <div class="tp-vs">
                      <template v-if="match.status === 'completed'">:</template>
                      <template v-else>vs</template>
                    </div>
                    <div class="tp-team" :class="{ winner: match.status === 'completed' && match.away_score > match.home_score }">
                      <span v-if="match.status === 'completed'" class="tp-score">{{ match.away_score }}</span>
                      <span class="tp-name">{{ match.away_team_short }}</span>
                      <img :src="getTeamLogo(match.away_team_short)" class="tp-logo" />
                    </div>
                    <button v-if="match.status !== 'completed'" @click="simulateSingleMatch(match.id, false)" class="btn btn-sm btn-primary tp-play" :disabled="simulating">
                      <i class="fa-solid fa-play"></i> Play
                    </button>
                    <span v-else class="tp-medal">
                      <i class="fa-solid fa-medal"></i>
                    </span>
                  </div>
                </div>

                <!-- Playout Section -->
                <div v-if="playoutMatches.league?.length || league2Standings.length" class="playout-section">
                  <h3 class="playout-title">
                    <i class="fa-solid fa-arrow-down-up-across-line"></i>
                    Playout - Relegation Battle (Teams 9-12)
                  </h3>

                  <div class="playout-grid">
                    <!-- Playout League Table -->
                    <div class="playout-league-wrapper">
                      <h4 class="playout-subtitle">
                        <i class="fa-solid fa-list-ol"></i>
                        Playout Standings
                      </h4>
                      <table class="playout-table">
                        <thead>
                          <tr>
                            <th class="pos">#</th>
                            <th class="orig">Orig</th>
                            <th class="team">Team</th>
                            <th>P</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GD</th>
                            <th class="pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(team, index) in playoutStandings" :key="team.teamId" :class="{ 'relegation-zone': index === 3 }">
                            <td class="pos">{{ index + 1 }}</td>
                            <td class="orig">({{ team.originalPosition }})</td>
                            <td class="team">
                              <div class="team-cell">
                                <img :src="getTeamLogo(team.teamName)" class="team-logo-sm" />
                                <span>{{ team.teamName }}</span>
                              </div>
                            </td>
                            <td>{{ team.played }}</td>
                            <td>{{ team.won }}</td>
                            <td>{{ team.drawn }}</td>
                            <td>{{ team.lost }}</td>
                            <td :class="team.goalDifference > 0 ? 'positive' : team.goalDifference < 0 ? 'negative' : ''">
                              {{ team.goalDifference > 0 ? '+' : '' }}{{ team.goalDifference }}
                            </td>
                            <td class="pts">{{ team.points }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div class="playout-legend">
                        <div class="legend-item relegation">
                          <span class="dot"></span> Plays relegation playoff vs 2. Liga winner
                        </div>
                      </div>

                      <!-- Playout Matches -->
                      <div class="playout-matches-section">
                        <h5 class="matches-subtitle">Playout Matches ({{ playoutMatchesCompleted }}/12)</h5>
                        <div class="playout-matches-grid">
                          <div v-for="match in playoutMatches.league" :key="match.id" class="playout-match-mini">
                            <div class="pmm-teams">
                              <span :class="{ winner: match.status === 'completed' && match.home_score > match.away_score }">{{ match.home_team_short }}</span>
                              <span class="pmm-score" v-if="match.status === 'completed'">{{ match.home_score }}-{{ match.away_score }}</span>
                              <span class="pmm-vs" v-else>vs</span>
                              <span :class="{ winner: match.status === 'completed' && match.away_score > match.home_score }">{{ match.away_team_short }}</span>
                            </div>
                            <button v-if="match.status !== 'completed'" @click="simulatePlayoutMatch(match.id)" class="mini-play" :disabled="simulating">
                              <i class="fa-solid fa-play"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- League 2 Table -->
                    <div class="league2-table-wrapper">
                      <h4 class="playout-subtitle">
                        <i class="fa-solid fa-trophy"></i>
                        Czech 2. Liga Final Standings
                      </h4>
                      <table class="league2-table">
                        <thead>
                          <tr>
                            <th class="pos">#</th>
                            <th class="team">Team</th>
                            <th>P</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GD</th>
                            <th class="pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(team, index) in league2Standings" :key="team.teamId" :class="{ 'promotion-zone': index === 0 }">
                            <td class="pos">{{ index + 1 }}</td>
                            <td class="team">{{ team.teamName }}</td>
                            <td>{{ team.played }}</td>
                            <td>{{ team.won }}</td>
                            <td>{{ team.drawn }}</td>
                            <td>{{ team.lost }}</td>
                            <td :class="team.goalDifference > 0 ? 'positive' : team.goalDifference < 0 ? 'negative' : ''">
                              {{ team.goalDifference > 0 ? '+' : '' }}{{ team.goalDifference }}
                            </td>
                            <td class="pts">{{ team.points }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div class="league2-legend">
                        <div class="legend-item promotion">
                          <span class="dot"></span> Plays relegation playoff
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Relegation Playoff (BO5) -->
                  <div v-if="playoutMatches.relegation?.length" class="relegation-playoff">
                    <h4 class="playout-subtitle relegation-title">
                      <i class="fa-solid fa-fire"></i>
                      Relegation Playoff (Best of 5)
                    </h4>
                    <p class="relegation-info" v-if="playoutInfo.playoutLoser">
                      {{ playoutInfo.playoutLoser.teamName }} (12th in Playout) vs {{ playoutInfo.league2Winner?.teamName || 'League 2 Winner' }} (2. Liga Champion)
                    </p>
                    <div v-for="(series, idx) in groupedPlayoutSeries('relegation_playoff')" :key="'rel-'+idx" class="relegation-series">
                      <div class="rel-teams">
                        <div class="rel-team" :class="{ winner: series.winner === series.team1 }">
                          <img :src="getTeamLogo(series.team1)" class="rel-logo" />
                          <span class="rel-name">{{ series.team1 }}</span>
                          <span class="rel-wins">{{ series.team1Wins }}</span>
                        </div>
                        <span class="rel-vs">vs</span>
                        <div class="rel-team" :class="{ winner: series.winner === series.team2 }">
                          <span class="rel-wins">{{ series.team2Wins }}</span>
                          <span class="rel-name">{{ series.team2 }}</span>
                          <span class="rel-logo league2-logo">L2</span>
                        </div>
                      </div>
                      <div class="rel-games">
                        <div v-for="match in series.matches" :key="match.id" class="rel-game" :class="{ completed: match.status === 'completed' }">
                          <span class="rel-game-label">G{{ match.round }}</span>
                          <template v-if="match.status === 'completed'">
                            <span class="rel-game-score">{{ match.team1Score }}-{{ match.team2Score }}</span>
                          </template>
                          <button v-else @click="simulatePlayoutMatch(match.id)" class="mini-play" :disabled="simulating">
                            <i class="fa-solid fa-play"></i>
                          </button>
                        </div>
                      </div>
                      <div v-if="series.winner" class="rel-result">
                        <i class="fa-solid fa-check-circle"></i>
                        <span>{{ series.winner }} stays in/promoted to Extraliga!</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="match-actions" v-if="hasUnplayedPlayoffMatches">
                  <button @click="simulateAllPlayoffMatches" class="btn btn-primary" :disabled="simulating">
                    <i v-if="simulating" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-forward"></i>
                    {{ simulating ? 'Simulating...' : 'Simulate All Matches' }}
                  </button>
                </div>

                <!-- Season Complete Banner -->
                <div v-if="isSeasonComplete && !hasUnplayedPlayoffMatches" class="season-complete-banner">
                  <div class="banner-content">
                    <i class="fa-solid fa-flag-checkered"></i>
                    <span>Season {{ season.name }} Complete!</span>
                  </div>
                  <button
                    @click="handleCreateSeason"
                    class="btn btn-new-season-large"
                    :disabled="creatingseason"
                  >
                    <i v-if="creatingseason" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-forward"></i>
                    {{ creatingseason ? 'Creating...' : `Start ${nextSeasonLabel} Season` }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Live Match Simulation Modal -->
            <div v-if="liveMatch" class="modal-overlay">
              <div class="modal live-modal fade-in">
                <div class="live-header">
                  <div class="live-badge">
                    <i class="fa-solid fa-circle live-dot"></i>
                    LIVE
                  </div>
                  <div class="live-timer">{{ liveMinute }}'</div>
                </div>

                <div class="live-scoreboard">
                  <div class="live-team home">
                    <img :src="getTeamLogo(liveMatch.home_team_short)" :alt="liveMatch.home_team_short" class="live-logo" />
                    <span class="live-team-name">{{ liveMatch.home_team_short }}</span>
                    <span class="live-score" :class="{ 'score-flash': homeScoreFlash }">{{ liveHomeScore }}</span>
                  </div>
                  <div class="live-divider">:</div>
                  <div class="live-team away">
                    <span class="live-score" :class="{ 'score-flash': awayScoreFlash }">{{ liveAwayScore }}</span>
                    <span class="live-team-name">{{ liveMatch.away_team_short }}</span>
                    <img :src="getTeamLogo(liveMatch.away_team_short)" :alt="liveMatch.away_team_short" class="live-logo" />
                  </div>
                </div>

                <div class="live-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (liveMinute / 60 * 100) + '%' }"></div>
                    <div class="halftime-marker"></div>
                  </div>
                  <div class="progress-labels">
                    <span>0'</span>
                    <span>HT</span>
                    <span>60'</span>
                  </div>
                </div>

                <div class="live-events">
                  <div
                    v-for="(event, index) in liveEvents"
                    :key="index"
                    class="live-event"
                    :class="[event.type, event.team, { 'new-event': index === liveEvents.length - 1 }]"
                  >
                    <span class="event-minute">{{ event.minute }}'</span>
                    <div class="event-content">
                      <template v-if="event.type === 'goal'">
                        <i class="fa-solid fa-futbol"></i>
                        <span class="event-team">{{ event.teamName }}</span>
                        <span class="event-score">{{ event.score }}</span>
                      </template>
                      <template v-else-if="event.type === 'halftime'">
                        <i class="fa-solid fa-clock"></i>
                        <span>Halftime - {{ event.score }}</span>
                      </template>
                      <template v-else-if="event.type === 'start'">
                        <i class="fa-solid fa-whistle"></i>
                        <span>Match started!</span>
                      </template>
                      <template v-else-if="event.type === 'end'">
                        <i class="fa-solid fa-flag-checkered"></i>
                        <span>Full time!</span>
                      </template>
                    </div>
                  </div>
                </div>

                <div class="live-actions" v-if="!liveRunning">
                  <button @click="closeLiveSimulation" class="btn btn-primary">
                    <i class="fa-solid fa-check"></i>
                    Continue
                  </button>
                </div>
                <div class="live-actions" v-else>
                  <button @click="skipToEnd" class="btn btn-secondary">
                    <i class="fa-solid fa-forward-fast"></i>
                    Skip to End
                  </button>
                </div>
              </div>
            </div>

            <!-- Match Result Modal (for fast sim) -->
            <div v-if="selectedMatch && !liveMatch" class="modal-overlay" @click.self="selectedMatch = null">
              <div class="modal match-modal fade-in">
                <div class="modal-header">
                  <h2>Match Result</h2>
                  <button @click="selectedMatch = null" class="btn btn-ghost">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div class="match-detail">
                  <div class="match-teams">
                    <div class="team-large home">
                      <span class="team-name">{{ selectedMatch.home_team_short }}</span>
                      <span class="score">{{ selectedMatch.home_score }}</span>
                    </div>
                    <div class="match-divider">:</div>
                    <div class="team-large away">
                      <span class="score">{{ selectedMatch.away_score }}</span>
                      <span class="team-name">{{ selectedMatch.away_team_short }}</span>
                    </div>
                  </div>
                  <div class="halftime-score">
                    Halftime: {{ selectedMatch.home_halftime }} : {{ selectedMatch.away_halftime }}
                  </div>
                </div>
              </div>
            </div>
          </template>
          </template>

          <!-- History Tab -->
          <template v-else-if="activeTab === 'history'">
            <div class="history-grid">
              <!-- All-Time Titles Table -->
              <div class="history-panel titles-panel fade-in">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-ranking-star"></i>
                    All-Time Titles
                  </h2>
                </div>

                <div v-if="titlesLeaderboard.length === 0" class="empty-history compact">
                  <i class="fa-solid fa-trophy"></i>
                  <span>No titles yet</span>
                </div>

                <table v-else class="titles-table">
                  <thead>
                    <tr>
                      <th class="team-col">Team</th>
                      <th class="medal-col"><i class="fa-solid fa-trophy gold-icon"></i></th>
                      <th class="medal-col"><i class="fa-solid fa-medal silver-icon"></i></th>
                      <th class="medal-col"><i class="fa-solid fa-medal bronze-icon"></i></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(team, idx) in titlesLeaderboard" :key="team.name" :class="{ 'top-team': idx === 0 }">
                      <td class="team-col">
                        <img :src="getTeamLogo(team.name)" class="titles-logo" />
                        <span>{{ team.name }}</span>
                      </td>
                      <td class="medal-col gold-count">{{ team.gold || '-' }}</td>
                      <td class="medal-col silver-count">{{ team.silver || '-' }}</td>
                      <td class="medal-col bronze-count">{{ team.bronze || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Season History List -->
              <div class="history-panel seasons-panel fade-in">
                <div class="panel-header">
                  <h2>
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Season Results
                  </h2>
                </div>

                <div v-if="seasonHistory.length === 0" class="empty-history compact">
                  <i class="fa-solid fa-calendar"></i>
                  <span>No completed seasons</span>
                </div>

                <div v-else class="history-list-compact">
                  <div class="history-row" v-for="item in seasonHistory" :key="item.id">
                    <span class="history-year">{{ item.season_name }}</span>
                    <div class="history-results">
                      <div class="result-item gold">
                        <i class="fa-solid fa-trophy"></i>
                        <img :src="getTeamLogo(item.champion_name)" class="result-logo" />
                        <span>{{ item.champion_name }}</span>
                      </div>
                      <div class="result-item silver">
                        <span class="rank">2.</span>
                        <img :src="getTeamLogo(item.runner_up_name)" class="result-logo" />
                        <span>{{ item.runner_up_name }}</span>
                      </div>
                      <div class="result-item bronze">
                        <span class="rank">3.</span>
                        <img :src="getTeamLogo(item.third_place_name)" class="result-logo" />
                        <span>{{ item.third_place_name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHandballStore } from '../stores/handball'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const handballStore = useHandballStore()

const loading = ref(true)
const simulating = ref(false)
const creatingseason = ref(false)
const startingPlayoffs = ref(false)
const currentRound = ref(1)
const selectedMatch = ref(null)
const activeTab = ref('season')

// Live simulation state
const liveMatch = ref(null)
const liveRunning = ref(false)
const liveMinute = ref(0)
const liveHomeScore = ref(0)
const liveAwayScore = ref(0)
const liveEvents = ref([])
const allLiveEvents = ref([])
const homeScoreFlash = ref(false)
const awayScoreFlash = ref(false)
let liveInterval = null

const world = computed(() => handballStore.currentWorld)
const season = computed(() => handballStore.currentSeason)
const standings = computed(() => handballStore.standings)
const roundMatches = computed(() => handballStore.currentRoundMatches)
const playoffData = computed(() => handballStore.playoffData)
const playoutData = computed(() => handballStore.playoutData)
const league2Standings = computed(() => handballStore.league2Standings)
const seasonHistory = computed(() => handballStore.seasonHistory)

async function loadHistory() {
  try {
    await handballStore.fetchHistory(route.params.id)
  } catch (error) {
    console.error('Failed to load history:', error)
  }
}

// All-time titles leaderboard
const titlesLeaderboard = computed(() => {
  const counts = {}

  for (const season of seasonHistory.value) {
    // Count championships (gold)
    if (season.champion_name) {
      if (!counts[season.champion_name]) {
        counts[season.champion_name] = { name: season.champion_name, gold: 0, silver: 0, bronze: 0 }
      }
      counts[season.champion_name].gold++
    }
    // Count runner-ups (silver)
    if (season.runner_up_name) {
      if (!counts[season.runner_up_name]) {
        counts[season.runner_up_name] = { name: season.runner_up_name, gold: 0, silver: 0, bronze: 0 }
      }
      counts[season.runner_up_name].silver++
    }
    // Count third places (bronze)
    if (season.third_place_name) {
      if (!counts[season.third_place_name]) {
        counts[season.third_place_name] = { name: season.third_place_name, gold: 0, silver: 0, bronze: 0 }
      }
      counts[season.third_place_name].bronze++
    }
  }

  // Convert to array and sort by gold, then silver, then bronze
  return Object.values(counts).sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold
    if (b.silver !== a.silver) return b.silver - a.silver
    return b.bronze - a.bronze
  })
})

// Playoff computed properties
const playoffMatches = computed(() => {
  if (!playoffData.value?.matches) return { quarterfinal: [], semifinal: [], final: [], third_place: [] }
  const matches = playoffData.value.matches
  return {
    quarterfinal: matches.filter(m => m.playoff_round === 'quarterfinal'),
    semifinal: matches.filter(m => m.playoff_round === 'semifinal'),
    final: matches.filter(m => m.playoff_round === 'final'),
    third_place: matches.filter(m => m.playoff_round === 'third_place')
  }
})

// Playout computed properties
const playoutMatches = computed(() => {
  if (!playoutData.value?.matches) return { league: [], relegation: [] }
  const matches = playoutData.value.matches
  return {
    league: matches.filter(m => m.playoff_round === 'playout_league'),
    relegation: matches.filter(m => m.playoff_round === 'relegation_playoff')
  }
})

const playoutInfo = computed(() => {
  return playoutData.value?.playoutInfo || {}
})

const playoutStandings = computed(() => {
  return playoutInfo.value?.playoutStandings || []
})

const playoutMatchesCompleted = computed(() => {
  return playoutMatches.value.league.filter(m => m.status === 'completed').length
})

const playoutLeagueComplete = computed(() => {
  const league = playoutMatches.value.league
  return league.length === 12 && league.every(m => m.status === 'completed')
})

const relegationPlayoffComplete = computed(() => {
  return groupedPlayoutSeries('relegation_playoff').some(s => s.winner)
})

const playoffRoundLabel = computed(() => {
  if (playoffMatches.value.final?.some(m => m.status !== 'completed')) return 'Finals'
  if (playoffMatches.value.semifinal?.some(m => m.status !== 'completed')) return 'Semifinals'
  if (playoffMatches.value.quarterfinal?.some(m => m.status !== 'completed')) return 'Quarterfinals'
  return 'Complete'
})

const hasUnplayedPlayoffMatches = computed(() => {
  const all = [
    ...(playoffMatches.value.quarterfinal || []),
    ...(playoffMatches.value.semifinal || []),
    ...(playoffMatches.value.final || []),
    ...(playoffMatches.value.third_place || []),
    ...(playoutMatches.value.league || []),
    ...(playoutMatches.value.relegation || [])
  ]
  return all.some(m => m.status !== 'completed')
})

const isSeasonComplete = computed(() => {
  return season.value?.status === 'completed'
})

const champion = computed(() => {
  const finals = playoffMatches.value.final || []
  if (finals.length === 0) return null

  // Count wins for each team in finals (BO5 - first to 3 wins)
  const completed = finals.filter(m => m.status === 'completed')
  if (completed.length === 0) return null

  // Get the two teams from the first final match
  const team1 = finals[0]?.home_team_short
  const team2 = finals[0]?.away_team_short
  let team1Wins = 0, team2Wins = 0

  for (const m of completed) {
    const homeWon = m.home_score > m.away_score
    const winningTeam = homeWon ? m.home_team_short : m.away_team_short
    if (winningTeam === team1) team1Wins++
    else team2Wins++
  }

  // First to 3 wins in BO5
  if (team1Wins >= 3) return team1
  if (team2Wins >= 3) return team2
  return null
})

// Get original position for a team from the bracket data
function getOriginalPosition(teamId) {
  const bracket = playoffData.value?.bracket || []
  for (const pair of bracket) {
    if (pair.team1?.teamId === teamId) return pair.team1.originalPosition
    if (pair.team2?.teamId === teamId) return pair.team2.originalPosition
  }
  return null
}

function groupedPlayoffSeries(round) {
  const matches = playoffMatches.value[round] || []
  if (matches.length === 0) return []

  // Group matches by team pairs
  const seriesMap = new Map()
  for (const match of matches) {
    const teams = [match.home_team_short, match.away_team_short].sort().join('-')
    if (!seriesMap.has(teams)) {
      seriesMap.set(teams, {
        team1: match.home_team_short,
        team2: match.away_team_short,
        team1Id: match.home_team_id,
        team2Id: match.away_team_id,
        team1Position: getOriginalPosition(match.home_team_id),
        team2Position: getOriginalPosition(match.away_team_id),
        matches: [],
        team1Wins: 0,
        team2Wins: 0,
        winner: null
      })
    }
    const series = seriesMap.get(teams)

    // Add normalized scores relative to team1/team2
    const normalizedMatch = {
      ...match,
      team1Score: match.home_team_short === series.team1 ? match.home_score : match.away_score,
      team2Score: match.home_team_short === series.team1 ? match.away_score : match.home_score
    }
    series.matches.push(normalizedMatch)

    if (match.status === 'completed') {
      const homeWon = match.home_score > match.away_score
      const winningTeam = homeWon ? match.home_team_short : match.away_team_short
      if (winningTeam === series.team1) series.team1Wins++
      else series.team2Wins++
    }
  }

  // Determine winner and filter out unnecessary games
  for (const series of seriesMap.values()) {
    // Check if series is decided (first to 3 wins)
    if (series.team1Wins >= 3) {
      series.winner = series.team1
    } else if (series.team2Wins >= 3) {
      series.winner = series.team2
    }

    // Only show games that are played or still needed
    series.matches = series.matches.filter(m => {
      if (m.status === 'completed') return true // Always show completed games
      if (series.winner) return false // Hide unplayed games if series is decided
      return true // Show scheduled games if series not decided
    })

    // Sort by round number
    series.matches.sort((a, b) => a.round - b.round)
  }

  return Array.from(seriesMap.values())
}

function groupedPlayoutSeries(round) {
  const matches = playoutMatches.value[round === 'relegation_playoff' ? 'relegation' : 'round1'] || []
  if (matches.length === 0) return []

  // Group matches by team pairs
  const seriesMap = new Map()
  for (const match of matches) {
    const teams = [match.home_team_short, match.away_team_short].sort().join('-')
    if (!seriesMap.has(teams)) {
      seriesMap.set(teams, {
        team1: match.home_team_short,
        team2: match.away_team_short,
        team1Id: match.home_team_id,
        team2Id: match.away_team_id,
        matches: [],
        team1Wins: 0,
        team2Wins: 0,
        winner: null
      })
    }
    const series = seriesMap.get(teams)

    // Add normalized scores relative to team1/team2
    const normalizedMatch = {
      ...match,
      team1Score: match.home_team_short === series.team1 ? match.home_score : match.away_score,
      team2Score: match.home_team_short === series.team1 ? match.away_score : match.home_score
    }
    series.matches.push(normalizedMatch)

    if (match.status === 'completed') {
      const homeWon = match.home_score > match.away_score
      const winningTeam = homeWon ? match.home_team_short : match.away_team_short
      if (winningTeam === series.team1) series.team1Wins++
      else series.team2Wins++
    }
  }

  // Determine winner for BO5 series (first to 3 wins)
  for (const series of seriesMap.values()) {
    if (series.team1Wins >= 3) {
      series.winner = series.team1
    } else if (series.team2Wins >= 3) {
      series.winner = series.team2
    }

    // Only show games that are played or still needed
    series.matches = series.matches.filter(m => {
      if (m.status === 'completed') return true
      if (series.winner) return false
      return true
    })

    // Sort by round number
    series.matches.sort((a, b) => a.round - b.round)
  }

  return Array.from(seriesMap.values())
}

async function simulatePlayoutMatch(matchId) {
  simulating.value = true
  try {
    await handballStore.simulateMatch(matchId, false)
    // Refresh playout data first
    await handballStore.fetchPlayoffs(season.value.id)

    // Check if we should advance to relegation playoff (after refreshing data)
    const advanceResult = await handballStore.checkPlayoutAdvance(season.value.id)
    if (advanceResult.advanced) {
      console.log('Relegation playoff started:', advanceResult)
      await handballStore.fetchPlayoffs(season.value.id)
    }
  } catch (error) {
    console.error('Failed to simulate playout match:', error)
  } finally {
    simulating.value = false
  }
}

async function simulateAllPlayoffMatches() {
  simulating.value = true
  try {
    // Get all matches including playout
    let allMatches = [
      ...(playoffMatches.value.quarterfinal || []),
      ...(playoffMatches.value.semifinal || []),
      ...(playoffMatches.value.final || []),
      ...(playoffMatches.value.third_place || []),
      ...(playoutMatches.value.league || []),
      ...(playoutMatches.value.relegation || [])
    ]

    for (const match of allMatches) {
      if (match.status !== 'completed') {
        await handballStore.simulateMatch(match.id, false)

        // Check for round advancement after each match
        const advanceResult = await handballStore.checkPlayoffAdvance(season.value.id)
        if (advanceResult.advanced) {
          await handballStore.fetchPlayoffs(season.value.id)
        }

        // Check for playout advancement
        const playoutAdvance = await handballStore.checkPlayoutAdvance(season.value.id)
        if (playoutAdvance.advanced) {
          await handballStore.fetchPlayoffs(season.value.id)
          // Re-fetch all matches to include new relegation playoff
          allMatches = [
            ...(playoffMatches.value.quarterfinal || []),
            ...(playoffMatches.value.semifinal || []),
            ...(playoffMatches.value.final || []),
            ...(playoffMatches.value.third_place || []),
            ...(playoutMatches.value.league || []),
            ...(playoutMatches.value.relegation || [])
          ]
        }
      }
    }
    await handballStore.fetchPlayoffs(season.value.id)
  } catch (error) {
    console.error('Failed to simulate playoff matches:', error)
  } finally {
    simulating.value = false
  }
}

// Map team short names to logo files
const teamLogos = {
  'Talent Plzeň': 'talent-plzen.svg',
  'Karviná': 'karvina.svg',
  'Dukla Praha': 'dukla-praha.svg',
  'Zubří': 'zubri.svg',
  'Kopřivnice': 'koprivnice.svg',
  'Frýdek-Místek': 'frydek-mistek.svg',
  'Lovosice': 'lovosice.svg',
  'Nové Veselí': 'nove-veseli.svg',
  'Jičín': 'jicin.svg',
  'KP Brno': 'kp-brno.svg',
  'Strakonice': 'strakonice.svg',
  'Zlín': 'zlin.svg'
}

function getTeamLogo(teamName) {
  return `/logos/handball/${teamLogos[teamName] || 'default.svg'}`
}

const totalRounds = computed(() => {
  if (!world.value?.teams) return 22
  return (world.value.teams.length - 1) * 2
})

const phaseLabel = computed(() => {
  if (!season.value) return ''
  switch (season.value.phase) {
    case 'regular': return 'Regular Season'
    case 'playoff': return 'Playoffs'
    case 'playout': return 'Playout'
    default: return season.value.phase
  }
})

const hasUnplayedMatches = computed(() => {
  return roundMatches.value.some(m => m.status !== 'completed')
})

const isRegularSeasonComplete = computed(() => {
  // Check if we're at the last round and all current round matches are completed
  if (currentRound.value >= totalRounds.value && !hasUnplayedMatches.value) {
    return true
  }
  // Also check matches array if available
  if (season.value?.matches) {
    const regularMatches = season.value.matches.filter(m => m.phase === 'regular')
    return regularMatches.length > 0 && regularMatches.every(m => m.status === 'completed')
  }
  return false
})

function getPositionClass(index) {
  if (index < 8) return 'playoff-zone'
  return 'playout-zone'
}

function goBack() {
  router.push('/handball')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function confirmReset() {
  if (confirm('Reset this world? This will delete the current season and reset all teams to their original state. This cannot be undone!')) {
    try {
      await handballStore.resetWorld(route.params.id)
      // Reload the world data
      await handballStore.fetchWorld(route.params.id)
      activeTab.value = 'season'
    } catch (error) {
      console.error('Failed to reset world:', error)
      alert('Failed to reset world: ' + (error.response?.data?.error || error.message))
    }
  }
}

async function fixTeamSwap() {
  const relegated = prompt('Enter the team to relegate (e.g., "KP Brno"):')
  if (!relegated) return
  const promoted = prompt('Enter the team to promote from League 2 (e.g., "Přerov"):')
  if (!promoted) return

  if (confirm(`Swap ${relegated} with ${promoted}?`)) {
    try {
      await handballStore.fixTeamSwap(route.params.id, relegated, promoted)
      await handballStore.fetchWorld(route.params.id)
      alert(`Successfully swapped ${relegated} with ${promoted}`)
    } catch (error) {
      console.error('Failed to swap teams:', error)
      alert('Failed to swap teams: ' + (error.response?.data?.error || error.message))
    }
  }
}

function getNextSeasonYears() {
  // If there's a completed season, use its end year as the start of the new season
  if (season.value && season.value.status === 'completed') {
    return {
      start: season.value.year_end,
      end: season.value.year_end + 1
    }
  }
  // Otherwise start with current year
  const currentYear = new Date().getFullYear()
  return {
    start: currentYear,
    end: currentYear + 1
  }
}

const nextSeasonLabel = computed(() => {
  const years = getNextSeasonYears()
  return `${years.start}/${years.end}`
})

async function handleCreateSeason() {
  creatingseason.value = true
  try {
    const years = getNextSeasonYears()
    await handballStore.createSeason(route.params.id, years.start, years.end)
    // Reset playoff data for the new season
    handballStore.playoffData = null
    currentRound.value = 1
    await loadRound(1)
    await handballStore.fetchStandings(season.value.id)
  } catch (error) {
    console.error('Failed to create season:', error)
  } finally {
    creatingseason.value = false
  }
}

async function loadRound(round) {
  if (!season.value) return
  currentRound.value = round
  await handballStore.fetchRoundMatches(season.value.id, round)
}

async function changeRound(delta) {
  const newRound = currentRound.value + delta
  if (newRound >= 1 && newRound <= totalRounds.value) {
    await loadRound(newRound)
  }
}

async function simulateSingleMatch(matchId, showResult = true) {
  simulating.value = true
  try {
    const result = await handballStore.simulateMatch(matchId, true)
    if (showResult && season.value.phase === 'regular') {
      const match = roundMatches.value.find(m => m.id === matchId)
      if (match) {
        selectedMatch.value = match
      }
    }
    await handballStore.fetchStandings(season.value.id)
    // Refresh playoff data if in playoff phase
    if (season.value.phase === 'playoff') {
      // Check if we should advance to next round
      const advanceResult = await handballStore.checkPlayoffAdvance(season.value.id)
      if (advanceResult.advanced) {
        console.log(`Advanced to ${advanceResult.newRound}`)
      }
      await handballStore.fetchPlayoffs(season.value.id)
    }
  } catch (error) {
    console.error('Failed to simulate match:', error)
  } finally {
    simulating.value = false
  }
}

async function startLiveSimulation(match) {
  simulating.value = true
  try {
    // Get match simulation with detailed events
    const result = await handballStore.simulateMatch(match.id, true)

    // Setup live simulation
    liveMatch.value = roundMatches.value.find(m => m.id === match.id)
    liveMinute.value = 0
    liveHomeScore.value = 0
    liveAwayScore.value = 0
    liveEvents.value = [{ minute: 0, type: 'start' }]
    allLiveEvents.value = result.events || []
    liveRunning.value = true

    // Start the live simulation
    runLiveSimulation()
  } catch (error) {
    console.error('Failed to start live simulation:', error)
    simulating.value = false
  }
}

function runLiveSimulation() {
  let eventIndex = 0

  liveInterval = setInterval(() => {
    if (liveMinute.value >= 60) {
      // End of match
      clearInterval(liveInterval)
      liveEvents.value.push({ minute: 60, type: 'end' })
      liveRunning.value = false
      simulating.value = false
      handballStore.fetchStandings(season.value.id)
      return
    }

    liveMinute.value++

    // Check for events at this minute
    while (eventIndex < allLiveEvents.value.length && allLiveEvents.value[eventIndex].minute <= liveMinute.value) {
      const event = allLiveEvents.value[eventIndex]
      liveEvents.value.push(event)

      if (event.type === 'goal') {
        if (event.team === 'home') {
          liveHomeScore.value++
          homeScoreFlash.value = true
          setTimeout(() => homeScoreFlash.value = false, 500)
        } else {
          liveAwayScore.value++
          awayScoreFlash.value = true
          setTimeout(() => awayScoreFlash.value = false, 500)
        }
      }

      eventIndex++
    }
  }, 100) // 100ms per game minute = ~6 seconds for full match
}

function skipToEnd() {
  if (liveInterval) {
    clearInterval(liveInterval)
  }

  // Add all remaining events
  for (const event of allLiveEvents.value) {
    if (!liveEvents.value.find(e => e.minute === event.minute && e.type === event.type)) {
      liveEvents.value.push(event)
      if (event.type === 'goal') {
        if (event.team === 'home') {
          liveHomeScore.value++
        } else {
          liveAwayScore.value++
        }
      }
    }
  }

  liveMinute.value = 60
  liveEvents.value.push({ minute: 60, type: 'end' })
  liveRunning.value = false
  simulating.value = false
  handballStore.fetchStandings(season.value.id)
}

function closeLiveSimulation() {
  if (liveInterval) {
    clearInterval(liveInterval)
  }
  liveMatch.value = null
  liveRunning.value = false
  loadRound(currentRound.value)
}

async function simulateCurrentRound() {
  simulating.value = true
  try {
    await handballStore.simulateRound(season.value.id, currentRound.value)
    // Re-fetch season to update matches for playoff check
    await handballStore.fetchSeason(route.params.id)
    if (currentRound.value < totalRounds.value) {
      await loadRound(currentRound.value + 1)
    }
  } catch (error) {
    console.error('Failed to simulate round:', error)
  } finally {
    simulating.value = false
  }
}

async function handleStartPlayoffs() {
  startingPlayoffs.value = true
  try {
    await handballStore.startPlayoffs(season.value.id)
    await handballStore.fetchSeason(route.params.id)
    await handballStore.fetchPlayoffs(season.value.id)
  } catch (error) {
    console.error('Failed to start playoffs:', error)
  } finally {
    startingPlayoffs.value = false
  }
}

onMounted(async () => {
  try {
    await handballStore.fetchWorld(route.params.id)
    await handballStore.fetchSeason(route.params.id)
    if (season.value) {
      currentRound.value = season.value.current_round || 1
      await loadRound(currentRound.value)
      // Load playoffs if in playoff phase
      if (season.value.phase === 'playoff') {
        await handballStore.fetchPlayoffs(season.value.id)
      }
    }
  } catch (error) {
    console.error('Failed to load league:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.league-view {
  min-height: 100vh;
  background: var(--gray-50);
}

.league-header {
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
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ef4444;
}

.brand i {
  font-size: 1.75rem;
}

.season-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--gray-700);
  background: #fef2f2;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.season-info i {
  color: #ef4444;
}

.league-main {
  padding: 2rem 0;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-500);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
  color: #ef4444;
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
  background: linear-gradient(135deg, #fecaca, #fca5a5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.empty-icon i {
  font-size: 2.5rem;
  color: #ef4444;
}

.no-season h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.no-season p {
  color: var(--gray-500);
  margin-bottom: 1.5rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.league-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.league-grid.playoffs-mode {
  grid-template-columns: 1fr;
}

.league-grid.playoffs-mode .playoffs-panel {
  max-width: none;
}

.standings-panel,
.matches-panel {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
}

.panel-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.panel-header h2 i {
  color: #ef4444;
}

.round-nav {
  display: flex;
  gap: 0.25rem;
}

.standings-table-wrapper {
  overflow-x: auto;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.standings-table th,
.standings-table td {
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.standings-table th {
  background: var(--gray-50);
  font-weight: 600;
  color: var(--gray-600);
  border-bottom: 2px solid var(--gray-200);
}

.standings-table th.team,
.standings-table td.team {
  text-align: left;
  padding-left: 1rem;
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
}

.standings-table th.pos,
.standings-table td.pos {
  width: 40px;
  font-weight: 600;
}

.standings-table th.pts,
.standings-table td.pts {
  font-weight: 700;
  color: #ef4444;
}

.standings-table tbody tr {
  border-bottom: 1px solid var(--gray-100);
}

.standings-table tbody tr:hover {
  background: var(--gray-50);
}

.standings-table .playoff-zone td.pos {
  background: #dcfce7;
  color: #16a34a;
}

.standings-table .playout-zone td.pos {
  background: #fef2f2;
  color: #dc2626;
}

.positive {
  color: #16a34a;
}

.negative {
  color: #dc2626;
}

.legend {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: var(--gray-50);
  font-size: 0.75rem;
  color: var(--gray-600);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-item.playoff .dot {
  background: #dcfce7;
}

.legend-item.playout .dot {
  background: #fef2f2;
}

.matches-list {
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.match-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
}

.match-card.completed {
  background: white;
  border: 1px solid var(--gray-200);
}

.match-card .team {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.9rem;
}

.match-card .team.home {
  justify-content: flex-end;
  text-align: right;
}

.match-card .team.away {
  justify-content: flex-start;
  text-align: left;
}

.match-logo {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: contain;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.score-box .score {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
}

.score-box .halftime {
  font-size: 0.7rem;
  color: var(--gray-500);
}

.score-box .vs {
  color: var(--gray-400);
  font-weight: 500;
}

.match-actions-inline {
  display: flex;
  gap: 0.25rem;
}

.match-actions-inline .btn {
  padding: 0.4rem 0.6rem;
}

.match-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-100);
  display: flex;
  gap: 1rem;
}

.btn-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.btn-success:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
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
  padding: 1.5rem;
}

.match-modal {
  max-width: 500px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
}

.match-detail {
  text-align: center;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.team-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.team-large .team-name {
  font-weight: 600;
  color: var(--gray-800);
}

.team-large .score {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ef4444;
}

.match-divider {
  font-size: 2rem;
  color: var(--gray-400);
}

.halftime-score {
  color: var(--gray-500);
  font-size: 0.875rem;
}

/* Live Simulation Modal */
.live-modal {
  max-width: 600px;
  background: linear-gradient(135deg, #1f2937, #111827);
  color: white;
}

.live-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ef4444;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-weight: 700;
  font-size: 0.875rem;
}

.live-dot {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.live-timer {
  font-size: 2rem;
  font-weight: 700;
  color: #fbbf24;
}

.live-scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.live-team {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.live-team.home {
  flex-direction: row;
}

.live-team.away {
  flex-direction: row-reverse;
}

.live-team-name {
  font-size: 1.125rem;
  font-weight: 600;
  max-width: 120px;
  text-align: center;
}

.live-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
}

.live-score {
  font-size: 3rem;
  font-weight: 700;
  color: #fbbf24;
  transition: all 0.3s;
}

.live-score.score-flash {
  transform: scale(1.3);
  color: #22c55e;
}

.live-divider {
  font-size: 2rem;
  color: var(--gray-500);
}

.live-progress {
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--gray-700);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #fbbf24);
  border-radius: 4px;
  transition: width 0.1s linear;
}

.halftime-marker {
  position: absolute;
  left: 50%;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: white;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.live-events {
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.live-event {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
}

.live-event.new-event {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.live-event.goal.home {
  border-left: 3px solid #3b82f6;
}

.live-event.goal.away {
  border-left: 3px solid #ef4444;
}

.live-event.halftime {
  background: rgba(251, 191, 36, 0.2);
  border-left: 3px solid #fbbf24;
}

.live-event.start, .live-event.end {
  background: rgba(34, 197, 94, 0.2);
  border-left: 3px solid #22c55e;
}

.event-minute {
  font-weight: 700;
  color: #fbbf24;
  min-width: 40px;
}

.event-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-content i {
  color: var(--gray-400);
}

.event-team {
  font-weight: 600;
}

.event-score {
  color: var(--gray-400);
}

.live-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.live-actions .btn {
  min-width: 150px;
}

@media (max-width: 1024px) {
  .league-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .season-info {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .live-team-name {
    font-size: 0.9rem;
    max-width: 80px;
  }

  .live-score {
    font-size: 2rem;
  }
}

/* Tournament Bracket Styles */
.playoffs-panel {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tournament-bracket {
  display: flex;
  align-items: stretch;
  padding: 1.5rem;
  gap: 0;
  overflow-x: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
}

.bracket-column {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.bracket-column.quarterfinals {
  flex: 1;
}

.bracket-column.semifinals {
  flex: 1;
}

.bracket-column.finals {
  flex: 1;
}

.column-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.bracket-column.finals .column-title {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #78350f;
}

.bracket-column.finals .column-title i {
  color: #78350f;
}

.bracket-matchups {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 0.75rem;
}

.matchup-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.matchup-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.matchup-card.decided {
  border-color: #22c55e;
}

.matchup-card.placeholder {
  opacity: 0.5;
  border: 2px dashed var(--gray-300);
}

.matchup-card.final-card {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-color: #fbbf24;
}

.matchup-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.matchup-team.top {
  border-bottom: 1px solid var(--gray-100);
}

.matchup-team.winner {
  background: linear-gradient(90deg, #dcfce7, #bbf7d0);
}

.matchup-team.champion {
  background: linear-gradient(90deg, #fef3c7, #fde68a);
}

.matchup-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
  flex-shrink: 0;
}

.matchup-name {
  flex: 1;
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matchup-wins {
  font-weight: 700;
  font-size: 1rem;
  color: #ef4444;
  min-width: 20px;
  text-align: center;
}

.matchup-team.winner .matchup-wins {
  color: #16a34a;
}

.champion-icon {
  color: #fbbf24;
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.matchup-games {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--gray-50);
  flex-wrap: wrap;
}

.mini-game {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
}

.mini-game.completed {
  border: 1px solid var(--gray-200);
}

.mini-label {
  font-weight: 600;
  color: var(--gray-500);
}

.mini-score {
  font-weight: 600;
  color: var(--gray-800);
}

.mini-play {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  cursor: pointer;
  font-size: 0.625rem;
  transition: background 0.2s ease;
}

.mini-play:hover {
  background: #dc2626;
}

.mini-play:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.matchup-winner-badge {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  background: #22c55e;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* Bracket Connectors */
.bracket-connectors {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  flex-shrink: 0;
}

.connector-pair {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 120px;
}

.connector-pair.single {
  height: 180px;
}

.connector-line {
  position: absolute;
  right: 0;
  width: 15px;
  height: 2px;
  background: var(--gray-300);
}

.connector-line.top {
  top: 25%;
}

.connector-line.bottom {
  bottom: 25%;
}

.connector-merge {
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 2px;
  background: var(--gray-300);
}

.connector-merge::after {
  content: '';
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 2px;
  background: var(--gray-300);
}

/* Champion Column */
.champion-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 0 0.5rem 0.5rem 0;
  margin: -1.5rem -1.5rem -1.5rem 0;
  animation: championAppear 0.5s ease-out;
}

@keyframes championAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.champion-trophy {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 1rem;
  animation: trophyGlow 2s ease-in-out infinite;
}

@keyframes trophyGlow {
  0%, 100% {
    text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }
  50% {
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 0 30px rgba(245, 158, 11, 0.4);
  }
}

.champion-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.champion-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #92400e;
}

.champion-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  border: 2px solid #f59e0b;
  background: white;
  padding: 4px;
}

.champion-name {
  font-size: 1rem;
  font-weight: 700;
  color: #78350f;
  text-align: center;
}

.btn-new-season {
  margin-top: 1rem;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-new-season:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
  transform: translateY(-1px);
}

.btn-new-season:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Season Complete Banner */
.season-complete-banner {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 2px solid #22c55e;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #166534;
}

.banner-content i {
  font-size: 1.5rem;
}

.btn-new-season-large {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1.125rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
}

.btn-new-season-large:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px -2px rgba(34, 197, 94, 0.4);
}

.btn-new-season-large:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Header Tabs */
.header-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--gray-600);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--gray-100);
}

.tab-btn.active {
  background: #fef2f2;
  color: #ef4444;
}

.tab-btn i {
  font-size: 0.875rem;
}

.tab-btn.reset-btn {
  color: var(--gray-500);
  font-size: 0.8rem;
}

.tab-btn.reset-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* 3rd Place Match */
.third-place-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7, #fed7aa);
  border-radius: 0.75rem;
}

.third-place-title {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.third-place-title i {
  color: #d97706;
}

.third-place-match {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}

.tp-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.tp-team:first-child {
  justify-content: flex-end;
}

.tp-team:last-of-type {
  justify-content: flex-start;
}

.tp-team.winner {
  color: #16a34a;
  font-weight: 700;
}

.tp-logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: contain;
}

.tp-name {
  font-weight: 600;
}

.tp-score {
  font-size: 1.25rem;
  font-weight: 700;
  color: #d97706;
}

.tp-vs {
  color: var(--gray-500);
  font-weight: 500;
}

.tp-play {
  flex-shrink: 0;
}

.tp-medal {
  color: #d97706;
  font-size: 1.5rem;
}

/* History Grid Layout */
.history-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
}

@media (max-width: 900px) {
  .history-grid {
    grid-template-columns: 1fr;
  }
}

/* History Panel */
.history-panel {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

.empty-history.compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
}

.empty-history.compact i {
  font-size: 1.25rem;
  color: var(--gray-400);
}

/* Titles Table */
.titles-table {
  width: 100%;
  border-collapse: collapse;
}

.titles-table th,
.titles-table td {
  padding: 0.625rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--gray-100);
}

.titles-table thead th {
  background: var(--gray-50);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--gray-600);
}

.titles-table .team-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.titles-table .medal-col {
  text-align: center;
  width: 40px;
}

.titles-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
}

.gold-icon { color: #fbbf24; }
.silver-icon { color: #9ca3af; }
.bronze-icon { color: #d97706; }

.gold-count { color: #b45309; font-weight: 700; }
.silver-count { color: #6b7280; font-weight: 600; }
.bronze-count { color: #92400e; font-weight: 600; }

.titles-table tr.top-team {
  background: linear-gradient(90deg, #fef3c7, transparent);
}

.titles-table tr.top-team td {
  font-weight: 700;
}

/* Compact History List */
.history-list-compact {
  padding: 0.5rem;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}

.history-row:last-child {
  border-bottom: none;
}

.history-year {
  font-weight: 700;
  color: var(--gray-700);
  min-width: 80px;
  font-size: 0.875rem;
}

.history-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: var(--gray-50);
}

.result-item.gold {
  background: #fef3c7;
}

.result-item.gold i {
  color: #fbbf24;
  font-size: 0.75rem;
}

.result-item.silver .rank {
  color: #6b7280;
  font-weight: 600;
}

.result-item.bronze .rank {
  color: #92400e;
  font-weight: 600;
}

.result-logo {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: contain;
}

.result-item span:last-child {
  font-weight: 500;
  color: var(--gray-700);
}

@media (max-width: 900px) {
  .tournament-bracket {
    flex-direction: column;
    gap: 1.5rem;
    min-height: auto;
  }

  .bracket-column {
    min-width: auto;
  }

  .bracket-matchups {
    gap: 0.5rem;
  }

  .bracket-connectors {
    display: none;
  }

  .champion-column {
    margin: 0;
    border-radius: 0.5rem;
  }
}

/* Playout Section Styles */
.playout-section {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 2px solid #f87171;
  border-radius: 1rem;
}

.playout-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.playout-title i {
  color: #ef4444;
}

.playout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .playout-grid {
    grid-template-columns: 1fr;
  }
}

.playout-subtitle {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.playout-subtitle i {
  color: #f59e0b;
}

.playout-round1 {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.playout-matches {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.playout-match-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}

.pm-team {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
}

.pm-team:first-child {
  justify-content: flex-end;
}

.pm-team.winner {
  font-weight: 700;
  color: #16a34a;
}

.pm-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
}

.pm-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.pm-score {
  font-size: 1rem;
  font-weight: 700;
  color: #dc2626;
}

.pm-vs {
  color: var(--gray-500);
  font-weight: 500;
  padding: 0 0.25rem;
}

.pm-play {
  padding: 0.25rem 0.5rem;
}

.pm-round-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  padding: 0.25rem 0.5rem;
  background: var(--gray-200);
  border-radius: 0.25rem;
}

.aggregate-score {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(90deg, #fef3c7, #fde68a);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.agg-label {
  font-weight: 600;
  color: var(--gray-600);
}

.agg-team {
  font-weight: 500;
  color: var(--gray-700);
}

.agg-score {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--gray-600);
}

.agg-score.winner {
  color: #16a34a;
}

.agg-dash {
  color: var(--gray-400);
}

/* League 2 Table */
.league2-table-wrapper {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.league2-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.league2-table th,
.league2-table td {
  padding: 0.5rem 0.375rem;
  text-align: center;
}

.league2-table th {
  background: var(--gray-50);
  font-weight: 600;
  color: var(--gray-600);
  font-size: 0.7rem;
  text-transform: uppercase;
  border-bottom: 2px solid var(--gray-200);
}

.league2-table th.team,
.league2-table td.team {
  text-align: left;
  padding-left: 0.75rem;
}

.league2-table th.pos,
.league2-table td.pos {
  width: 30px;
  font-weight: 600;
}

.league2-table th.pts,
.league2-table td.pts {
  font-weight: 700;
  color: #dc2626;
}

.league2-table tbody tr {
  border-bottom: 1px solid var(--gray-100);
}

.league2-table tbody tr:hover {
  background: var(--gray-50);
}

.league2-table .promotion-zone td.pos {
  background: #dcfce7;
  color: #16a34a;
}

.league2-table td.positive {
  color: #16a34a;
}

.league2-table td.negative {
  color: #dc2626;
}

.league2-legend {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--gray-600);
}

.league2-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.league2-legend .legend-item.promotion .dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: #dcfce7;
}

/* Relegation Playoff */
.relegation-playoff {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 0.75rem;
  border: 2px solid #f59e0b;
}

.relegation-title {
  color: #b45309;
}

.relegation-title i {
  color: #f59e0b;
}

.relegation-info {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin-bottom: 0.75rem;
  font-style: italic;
}

.relegation-series {
  background: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.rel-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.rel-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}

.rel-team.winner {
  background: linear-gradient(90deg, #dcfce7, #bbf7d0);
  border: 2px solid #22c55e;
}

.rel-logo {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: contain;
}

.rel-logo.league2-logo {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  color: white;
  font-weight: 700;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rel-name {
  font-weight: 600;
  color: var(--gray-800);
}

.rel-wins {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f59e0b;
}

.rel-team.winner .rel-wins {
  color: #16a34a;
}

.rel-vs {
  color: var(--gray-500);
  font-weight: 500;
}

.rel-games {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.rel-game {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--gray-100);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.rel-game.completed {
  background: white;
  border: 1px solid var(--gray-200);
}

.rel-game-label {
  font-weight: 600;
  color: var(--gray-500);
}

.rel-game-score {
  font-weight: 600;
  color: var(--gray-800);
}

.rel-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(90deg, #dcfce7, #bbf7d0);
  border-radius: 0.5rem;
  font-weight: 600;
  color: #16a34a;
}

.rel-result i {
  font-size: 1.25rem;
}

/* Playout Table Styles */
.playout-league-wrapper {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.playout-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.playout-table th,
.playout-table td {
  padding: 0.5rem 0.375rem;
  text-align: center;
}

.playout-table th {
  background: var(--gray-50);
  font-weight: 600;
  color: var(--gray-600);
  font-size: 0.7rem;
  text-transform: uppercase;
  border-bottom: 2px solid var(--gray-200);
}

.playout-table th.team,
.playout-table td.team {
  text-align: left;
  padding-left: 0.75rem;
}

.playout-table th.pos,
.playout-table td.pos {
  width: 30px;
  font-weight: 600;
}

.playout-table th.orig,
.playout-table td.orig {
  width: 40px;
  font-size: 0.7rem;
  color: var(--gray-500);
}

.playout-table th.pts,
.playout-table td.pts {
  font-weight: 700;
  color: #dc2626;
}

.playout-table tbody tr {
  border-bottom: 1px solid var(--gray-100);
}

.playout-table tbody tr:hover {
  background: var(--gray-50);
}

.playout-table .relegation-zone td.pos {
  background: #fee2e2;
  color: #dc2626;
}

.playout-table td.positive {
  color: #16a34a;
}

.playout-table td.negative {
  color: #dc2626;
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-logo-sm {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: contain;
}

.playout-legend {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--gray-600);
}

.playout-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.playout-legend .legend-item.relegation .dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: #fee2e2;
}

.playout-matches-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.matches-subtitle {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 0.75rem;
}

.playout-matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
}

.playout-match-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.5rem;
  background: var(--gray-50);
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

.pmm-teams {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.pmm-teams span.winner {
  font-weight: 700;
  color: #16a34a;
}

.pmm-score {
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0.25rem;
}

.pmm-vs {
  color: var(--gray-500);
  margin: 0 0.25rem;
}

/* Original Position Badge for Playoff Brackets */
.matchup-position {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--gray-400);
  margin-right: 0.25rem;
}
</style>
