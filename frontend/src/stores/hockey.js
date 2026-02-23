import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useHockeyStore = defineStore('hockey', () => {
  const worlds = ref([])
  const currentWorld = ref(null)
  const currentSeason = ref(null)
  const groupAStandings = ref([])
  const groupBStandings = ref([])
  const div2Standings = ref([])
  const playoffBracket = ref(null)
  const seasonHistory = ref([])
  const teamRoster = ref(null)
  const tournamentStats = ref([])
  const allStars = ref(null)
  const viewingHistoric = ref(false)
  const playerCareer = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Worlds
  async function fetchWorlds() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/hockey/worlds')
      worlds.value = response.data.worlds
      return response.data.worlds
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch worlds'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWorld(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/worlds/${id}`)
      currentWorld.value = response.data.world
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createWorld(name, description) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/hockey/worlds', { name, description })
      worlds.value.unshift(response.data.world)
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteWorld(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/hockey/worlds/${id}`)
      worlds.value = worlds.value.filter(w => w.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetWorld(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/hockey/worlds/${worldId}/reset`)
      currentSeason.value = null
      groupAStandings.value = []
      groupBStandings.value = []
      div2Standings.value = []
      playoffBracket.value = null
      seasonHistory.value = []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset world'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Season
  async function fetchSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/worlds/${worldId}/season`)
      currentSeason.value = response.data.season
      if (response.data.season) {
        groupAStandings.value = response.data.season.groupAStandings || []
        groupBStandings.value = response.data.season.groupBStandings || []
        div2Standings.value = response.data.season.div2Standings || []
        playoffBracket.value = response.data.season.playoffBracket || null
        allStars.value = response.data.season.allStars || null
      }
      return response.data.season
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSeason(worldId, year) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/hockey/worlds/${worldId}/season`, { year })
      currentSeason.value = response.data.season
      div2Standings.value = response.data.season.div2Standings || []
      return response.data.season
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create season'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Matches
  async function fetchGroupMatches(seasonId, group) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/seasons/${seasonId}/group/${group}`)
      return response.data.matches
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch matches'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateMatch(matchId, detailed = false, result = null) {
    loading.value = true
    error.value = null
    try {
      const payload = { detailed }
      // If result provided (from client-side detailed simulation), include it
      if (result) {
        payload.homeScore = result.homeScore
        payload.awayScore = result.awayScore
        payload.overtime = result.overtime || false
        payload.shootout = result.shootout || false
        payload.events = result.events || []
        payload.periodScores = result.periodScores || []
      }
      const response = await api.post(`/hockey/matches/${matchId}/simulate`, payload)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate match'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateAllGroupMatches(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/hockey/seasons/${seasonId}/simulate-group`)
      groupAStandings.value = response.data.groupAStandings
      groupBStandings.value = response.data.groupBStandings
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate group'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Playoffs
  async function startPlayoffs(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/hockey/seasons/${seasonId}/start-playoffs`)
      if (currentSeason.value) {
        currentSeason.value.phase = 'playoff'
      }
      playoffBracket.value = response.data.playoffBracket
      groupAStandings.value = response.data.groupAStandings
      groupBStandings.value = response.data.groupBStandings
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start playoffs'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPlayoffs(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/seasons/${seasonId}/playoffs`)
      playoffBracket.value = response.data.bracket
      groupAStandings.value = response.data.groupAStandings || []
      groupBStandings.value = response.data.groupBStandings || []
      div2Standings.value = response.data.div2Standings || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch playoffs'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkPlayoffAdvance(seasonId) {
    try {
      const response = await api.post(`/hockey/seasons/${seasonId}/check-advance`)
      return response.data
    } catch (err) {
      console.error('Failed to check playoff advance:', err)
      return { advanced: false }
    }
  }

  async function fetchTeamRoster(teamId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/teams/${teamId}/roster`)
      teamRoster.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch roster'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTournamentStats(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/seasons/${seasonId}/stats`)
      tournamentStats.value = response.data.stats
      return response.data.stats
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMatchDetails(matchId) {
    try {
      const response = await api.get(`/hockey/matches/${matchId}`)
      return response.data.match
    } catch (err) {
      console.error('Failed to fetch match details:', err)
      throw err
    }
  }

  async function fetchSeasonById(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/seasons/${seasonId}/full`)
      currentSeason.value = response.data.season
      if (response.data.season) {
        groupAStandings.value = response.data.season.groupAStandings || []
        groupBStandings.value = response.data.season.groupBStandings || []
        div2Standings.value = response.data.season.div2Standings || []
        playoffBracket.value = response.data.season.playoffBracket || null
        allStars.value = response.data.season.allStars || null
      }
      return response.data.season
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPlayerCareer(playerId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/players/${playerId}/career`)
      playerCareer.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch player career'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/hockey/worlds/${worldId}/history`)
      seasonHistory.value = response.data.history
      return response.data.history
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch history'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    worlds,
    currentWorld,
    currentSeason,
    groupAStandings,
    groupBStandings,
    div2Standings,
    playoffBracket,
    seasonHistory,
    teamRoster,
    tournamentStats,
    allStars,
    viewingHistoric,
    playerCareer,
    loading,
    error,
    fetchWorlds,
    fetchWorld,
    createWorld,
    deleteWorld,
    resetWorld,
    fetchSeason,
    fetchSeasonById,
    createSeason,
    fetchGroupMatches,
    simulateMatch,
    simulateAllGroupMatches,
    startPlayoffs,
    fetchPlayoffs,
    checkPlayoffAdvance,
    fetchTeamRoster,
    fetchTournamentStats,
    fetchMatchDetails,
    fetchHistory,
    fetchPlayerCareer
  }
})
