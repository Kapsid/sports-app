import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useSpeedSkatingStore = defineStore('speedSkating', () => {
  const skaters = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const disciplineStandings = ref({})
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Current event being viewed/simulated
  const currentEvent = ref(null)
  const eventHeats = ref([])
  const eventResults = ref([])
  const eventSkaters = ref([])

  async function fetchSkaters(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/speed-skating/world/${worldId}/skaters`)
      skaters.value = response.data.skaters || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch skaters'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateSkaters(worldId, count = 50) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/speed-skating/world/${worldId}/generate-skaters`, { count })
      skaters.value = response.data.skaters || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate skaters'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSkater(worldId, skaterData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/speed-skating/world/${worldId}/skater`, skaterData)
      skaters.value.push(response.data.skater)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create skater'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSkater(skaterId, skaterData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/speed-skating/skater/${skaterId}`, skaterData)
      const index = skaters.value.findIndex(s => s.id === skaterId)
      if (index !== -1) {
        skaters.value[index] = response.data.skater
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update skater'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSkater(skaterId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/speed-skating/skater/${skaterId}`)
      skaters.value = skaters.value.filter(s => s.id !== skaterId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete skater'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllSkaters(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/speed-skating/world/${worldId}/all-skaters`)
      skaters.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete skaters'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/speed-skating/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {}
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSeason(worldId, yearStart) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/speed-skating/world/${worldId}/create-season`, { yearStart })
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEvent(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/speed-skating/event/${eventId}`)
      currentEvent.value = response.data.event
      eventHeats.value = response.data.heats || []
      eventResults.value = response.data.results || []
      eventSkaters.value = response.data.skaters || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateHeat(eventId, heatNumber, frontendResults = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/speed-skating/event/${eventId}/simulate-heat`, {
        heatNumber,
        frontendResults
      })

      eventHeats.value = response.data.heats || eventHeats.value

      if (response.data.completed) {
        eventResults.value = response.data.results || []
        currentEvent.value.status = 'completed'

        // Update the event in the events list
        const eventIndex = events.value.findIndex(e => e.id === eventId)
        if (eventIndex !== -1) {
          events.value[eventIndex].status = 'completed'
          events.value[eventIndex].results = JSON.stringify(response.data.results)
        }
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate heat'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateAllHeats(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/speed-skating/event/${eventId}/simulate-all`)

      eventHeats.value = response.data.heats || []
      eventResults.value = response.data.results || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {}

      if (currentEvent.value) {
        currentEvent.value.status = 'completed'
      }

      // Update the event in the events list
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = 'completed'
        events.value[eventIndex].results = JSON.stringify(response.data.results)
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/speed-skating/season/${seasonId}/reset`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset season'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearSeason() {
    currentSeason.value = null
    events.value = []
    standings.value = []
    disciplineStandings.value = {}
  }

  function clearCurrentEvent() {
    currentEvent.value = null
    eventHeats.value = []
    eventResults.value = []
    eventSkaters.value = []
  }

  return {
    skaters,
    currentSeason,
    events,
    standings,
    disciplineStandings,
    countryNames,
    loading,
    error,
    currentEvent,
    eventHeats,
    eventResults,
    eventSkaters,
    fetchSkaters,
    generateSkaters,
    createSkater,
    updateSkater,
    deleteSkater,
    deleteAllSkaters,
    fetchCurrentSeason,
    createSeason,
    fetchEvent,
    simulateHeat,
    simulateAllHeats,
    resetSeason,
    clearSeason,
    clearCurrentEvent
  }
})
