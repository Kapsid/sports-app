import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useTennisStore = defineStore('tennis', () => {
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
      const response = await api.get('/tennis/worlds')
      worlds.value = response.data.worlds
      return response.data.worlds
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch tennis worlds'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWorld(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/tennis/world/${id}`)
      currentWorld.value = response.data.world
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch tennis world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createWorld(name, description) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/tennis/worlds', { name, description })
      worlds.value.unshift(response.data.world)
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create tennis world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteWorld(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/tennis/world/${id}`)
      worlds.value = worlds.value.filter(w => w.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete tennis world'
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
      const response = await api.get(`/tennis/world/${worldId}/players`)
      players.value = response.data.players
      return response.data.players
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch tennis players'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generatePlayers(worldId, count = 100) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/tennis/world/${worldId}/generate-players`, { count })
      // Refetch players after generation
      await fetchPlayers(worldId)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate tennis players'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createPlayer(worldId, playerData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/tennis/world/${worldId}/player`, playerData)
      players.value.push(response.data.player)
      return response.data.player
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create tennis player'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePlayer(playerId, playerData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/tennis/player/${playerId}`, playerData)
      const index = players.value.findIndex(p => p.id === playerId)
      if (index !== -1) {
        players.value[index] = response.data.player
      }
      return response.data.player
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update tennis player'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePlayer(playerId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/tennis/player/${playerId}`)
      players.value = players.value.filter(p => p.id !== playerId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete tennis player'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllPlayers(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/tennis/world/${worldId}/all-players`)
      players.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete all tennis players'
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
      const response = await api.get(`/tennis/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch tennis season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSeason(worldId, year) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/tennis/world/${worldId}/create-season`, { year })
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create tennis season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      await api.post(`/tennis/season/${seasonId}/reset`)
      // Refetch the season after reset
      if (currentWorld.value) {
        await fetchCurrentSeason(currentWorld.value.id)
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset tennis season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/tennis/season/${seasonId}`)
      currentSeason.value = null
      events.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete tennis season'
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
      const response = await api.get(`/tennis/world/${worldId}/standings`)
      standings.value = response.data.standings
      return response.data.standings
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch tennis standings'
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
      const response = await api.get(`/tennis/event/${eventId}`)
      return response.data.event
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch tennis event'
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

    // Utility
    clearWorld
  }
})
