import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useHandballStore = defineStore('handball', () => {
  const worlds = ref([])
  const currentWorld = ref(null)
  const currentSeason = ref(null)
  const standings = ref([])
  const currentRoundMatches = ref([])
  const playoffData = ref(null)
  const playoutData = ref(null)
  const league2Standings = ref([])
  const seasonHistory = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Worlds
  async function fetchWorlds() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/handball/worlds')
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
      const response = await api.get(`/handball/worlds/${id}`)
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
      const response = await api.post('/handball/worlds', { name, description })
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
      await api.delete(`/handball/worlds/${id}`)
      worlds.value = worlds.value.filter(w => w.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete world'
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
      const response = await api.get(`/handball/worlds/${worldId}/season`)
      currentSeason.value = response.data.season
      if (response.data.season) {
        standings.value = response.data.season.standings || []
      }
      return response.data.season
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSeason(worldId, yearStart, yearEnd) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/handball/worlds/${worldId}/season`, { yearStart, yearEnd })
      currentSeason.value = response.data.season
      return response.data.season
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create season'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Matches
  async function fetchRoundMatches(seasonId, round) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/handball/seasons/${seasonId}/round/${round}`)
      currentRoundMatches.value = response.data.matches
      return response.data.matches
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch matches'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateMatch(matchId, detailed = false) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/handball/matches/${matchId}/simulate`, { detailed })
      // Update match in current round matches
      const index = currentRoundMatches.value.findIndex(m => m.id === matchId)
      if (index !== -1) {
        currentRoundMatches.value[index] = response.data.match
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate match'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRound(seasonId, round) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/handball/seasons/${seasonId}/round/${round}/simulate`)
      standings.value = response.data.standings
      // Refresh current round matches
      await fetchRoundMatches(seasonId, round)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate round'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Standings
  async function fetchStandings(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/handball/seasons/${seasonId}/standings`)
      standings.value = response.data.standings
      return response.data.standings
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch standings'
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
      const response = await api.post(`/handball/seasons/${seasonId}/start-playoffs`)
      if (currentSeason.value) {
        currentSeason.value.phase = 'playoff'
      }
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
      const response = await api.get(`/handball/seasons/${seasonId}/playoffs`)
      playoffData.value = response.data
      // Also update playout data from the playoffs response
      if (response.data.playoutMatches) {
        playoutData.value = {
          matches: response.data.playoutMatches,
          playoutInfo: response.data.playoutData
        }
      }
      if (response.data.league2Standings) {
        league2Standings.value = response.data.league2Standings
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch playoffs'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPlayout(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/handball/seasons/${seasonId}/playout`)
      playoutData.value = {
        matches: response.data.playoutMatches,
        playoutInfo: response.data.playoutData
      }
      league2Standings.value = response.data.league2Standings
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch playout'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkPlayoutAdvance(seasonId) {
    try {
      const response = await api.post(`/handball/seasons/${seasonId}/check-playout-advance`)
      return response.data
    } catch (err) {
      console.error('Failed to check playout advance:', err)
      return { advanced: false }
    }
  }

  async function checkPlayoffAdvance(seasonId) {
    try {
      const response = await api.post(`/handball/seasons/${seasonId}/check-playoff-advance`)
      return response.data
    } catch (err) {
      console.error('Failed to check playoff advance:', err)
      return { advanced: false }
    }
  }

  async function fetchHistory(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/handball/worlds/${worldId}/history`)
      seasonHistory.value = response.data.history
      return response.data.history
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch history'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetWorld(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/handball/worlds/${worldId}/reset`)
      currentSeason.value = null
      standings.value = []
      currentRoundMatches.value = []
      playoffData.value = null
      playoutData.value = null
      seasonHistory.value = []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fixTeamSwap(worldId, relegatedTeam, promotedTeam) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/handball/worlds/${worldId}/fix-swap`, {
        relegatedTeam,
        promotedTeam
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to swap teams'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    worlds,
    currentWorld,
    currentSeason,
    standings,
    currentRoundMatches,
    playoffData,
    playoutData,
    league2Standings,
    seasonHistory,
    loading,
    error,
    fetchWorlds,
    fetchWorld,
    createWorld,
    deleteWorld,
    fetchSeason,
    createSeason,
    fetchRoundMatches,
    simulateMatch,
    simulateRound,
    fetchStandings,
    startPlayoffs,
    fetchPlayoffs,
    fetchPlayout,
    checkPlayoffAdvance,
    checkPlayoutAdvance,
    fetchHistory,
    resetWorld,
    fixTeamSwap
  }
})
