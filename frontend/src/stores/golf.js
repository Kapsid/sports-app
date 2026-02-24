import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useGolfStore = defineStore('golf', () => {
  const worlds = ref([])
  const currentWorld = ref(null)
  const players = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ==================== WORLDS ====================

  async function fetchWorlds() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/golf/worlds')
      worlds.value = response.data.worlds
      return response.data.worlds
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch golf worlds'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWorld(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/golf/world/${id}`)
      currentWorld.value = response.data.world
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch golf world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createWorld(name, description) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/golf/worlds', { name, description })
      worlds.value.unshift(response.data.world)
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create golf world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteWorld(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/golf/world/${id}`)
      worlds.value = worlds.value.filter(w => w.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete golf world'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== PLAYERS ====================

  async function fetchPlayers(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/golf/world/${worldId}/players`)
      players.value = response.data.players
      return response.data.players
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch golf players'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generatePlayers(worldId, count = 120) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/golf/world/${worldId}/generate-players`, { count })
      // Refetch players after generation
      await fetchPlayers(worldId)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate golf players'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createPlayer(worldId, playerData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/golf/world/${worldId}/player`, playerData)
      players.value.push(response.data.player)
      return response.data.player
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create golf player'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePlayer(playerId, playerData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/golf/player/${playerId}`, playerData)
      const index = players.value.findIndex(p => p.id === playerId)
      if (index !== -1) {
        players.value[index] = response.data.player
      }
      return response.data.player
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update golf player'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePlayer(playerId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/golf/player/${playerId}`)
      players.value = players.value.filter(p => p.id !== playerId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete golf player'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllPlayers(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/golf/world/${worldId}/all-players`)
      players.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete all golf players'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== SEASONS ====================

  async function fetchCurrentSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/golf/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch golf season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSeason(worldId, year) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/golf/world/${worldId}/create-season`, { year })
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create golf season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      await api.post(`/golf/season/${seasonId}/reset`)
      // Refetch the season after reset
      if (currentWorld.value) {
        await fetchCurrentSeason(currentWorld.value.id)
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset golf season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/golf/season/${seasonId}`)
      currentSeason.value = null
      events.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete golf season'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== STANDINGS ====================

  async function fetchStandings(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/golf/world/${worldId}/standings`)
      standings.value = response.data.standings
      return response.data.standings
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch golf standings'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== EVENTS ====================

  async function fetchEvent(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/golf/event/${eventId}`)
      return response.data.event
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch golf event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRound(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/golf/event/${eventId}/simulate-round`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate golf round'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function completeEvent(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/golf/event/${eventId}/complete`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to complete golf event'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearWorld() {
    currentWorld.value = null
    players.value = []
    currentSeason.value = null
    events.value = []
    standings.value = []
  }

  return {
    // State
    worlds,
    currentWorld,
    players,
    currentSeason,
    events,
    standings,
    loading,
    error,

    // World actions
    fetchWorlds,
    fetchWorld,
    createWorld,
    deleteWorld,

    // Player actions
    fetchPlayers,
    generatePlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    deleteAllPlayers,

    // Season actions
    fetchCurrentSeason,
    createSeason,
    resetSeason,
    deleteSeason,

    // Standings actions
    fetchStandings,

    // Event actions
    fetchEvent,
    simulateRound,
    completeEvent,

    // Utility
    clearWorld
  }
})
