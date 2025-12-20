import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useLugeStore = defineStore('luge', () => {
  const athletes = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Current event being viewed/simulated
  const currentEvent = ref(null)
  const eventAthletes = ref([])

  async function fetchAthletes(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/luge/world/${worldId}/athletes`)
      athletes.value = response.data.athletes || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch athletes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createAthlete(worldId, athleteData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/world/${worldId}/athlete`, athleteData)
      athletes.value.push(response.data.athlete)
      countryNames.value = response.data.countryNames || countryNames.value
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create athlete'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAthlete(athleteId, athleteData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/luge/athlete/${athleteId}`, athleteData)
      const index = athletes.value.findIndex(a => a.id === athleteId)
      if (index !== -1) {
        athletes.value[index] = response.data.athlete
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update athlete'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAthlete(athleteId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/luge/athlete/${athleteId}`)
      athletes.value = athletes.value.filter(a => a.id !== athleteId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete athlete'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllAthletes(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/luge/world/${worldId}/all-athletes`)
      athletes.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete athletes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/luge/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/world/${worldId}/create-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
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
      const response = await api.get(`/luge/event/${eventId}`)
      currentEvent.value = response.data.event
      eventAthletes.value = response.data.athletes || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRace(eventId, results = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/event/${eventId}/simulate`, { results })

      if (currentEvent.value) {
        currentEvent.value.run1_results = response.data.results
        currentEvent.value.status = 'run1_completed'
      }

      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = response.data.status
        events.value[eventIndex].run1_results = response.data.results
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate race'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRun2(eventId, results = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/event/${eventId}/simulate-run2`, { results })

      if (currentEvent.value) {
        currentEvent.value.run2_results = response.data.run2Results
        currentEvent.value.status = response.data.status
        if (response.data.status === 'completed') {
          currentEvent.value.results = response.data.finalResults
        }
      }

      if (response.data.standings) {
        standings.value = response.data.standings
      }

      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = response.data.status
        events.value[eventIndex].run2_results = response.data.run2Results
        if (response.data.status === 'completed') {
          events.value[eventIndex].results = response.data.finalResults
        }
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate run 2'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRun3(eventId, results = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/event/${eventId}/simulate-run3`, { results })

      if (currentEvent.value) {
        currentEvent.value.run3_results = response.data.run3Results
        currentEvent.value.status = 'run3_completed'
      }

      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = 'run3_completed'
        events.value[eventIndex].run3_results = response.data.run3Results
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate run 3'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRun4(eventId, results = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/event/${eventId}/simulate-run4`, { results })

      if (currentEvent.value) {
        currentEvent.value.run4_results = response.data.run4Results
        currentEvent.value.results = response.data.finalResults
        currentEvent.value.status = 'completed'
      }

      if (response.data.standings) {
        standings.value = response.data.standings
      }

      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = 'completed'
        events.value[eventIndex].run4_results = response.data.run4Results
        events.value[eventIndex].results = response.data.finalResults
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate run 4'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/luge/season/${seasonId}/reset`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
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
  }

  function clearCurrentEvent() {
    currentEvent.value = null
    eventAthletes.value = []
  }

  return {
    athletes,
    currentSeason,
    events,
    standings,
    countryNames,
    loading,
    error,
    currentEvent,
    eventAthletes,
    fetchAthletes,
    createAthlete,
    updateAthlete,
    deleteAthlete,
    deleteAllAthletes,
    fetchCurrentSeason,
    createSeason,
    fetchEvent,
    simulateRace,
    simulateRun2,
    simulateRun3,
    simulateRun4,
    resetSeason,
    clearSeason,
    clearCurrentEvent
  }
})
