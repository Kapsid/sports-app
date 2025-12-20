import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useAlpineStore = defineStore('alpine', () => {
  const skiers = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const disciplineStandings = ref({
    downhill: [],
    super_g: [],
    giant_slalom: [],
    slalom: []
  })
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Current event being viewed/simulated
  const currentEvent = ref(null)
  const eventSkiers = ref([])
  const disciplineInfo = ref(null)

  async function fetchSkiers(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/alpine/world/${worldId}/skiers`)
      skiers.value = response.data.skiers || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch skiers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateSkiers(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/alpine/world/${worldId}/generate-skiers`)
      skiers.value = response.data.skiers || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate skiers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSkier(worldId, skierData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/alpine/world/${worldId}/skier`, skierData)
      skiers.value.push(response.data.skier)
      countryNames.value = response.data.countryNames || countryNames.value
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create skier'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSkier(skierId, skierData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/alpine/skier/${skierId}`, skierData)
      const index = skiers.value.findIndex(s => s.id === skierId)
      if (index !== -1) {
        skiers.value[index] = response.data.skier
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update skier'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSkier(skierId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/alpine/skier/${skierId}`)
      skiers.value = skiers.value.filter(s => s.id !== skierId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete skier'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllSkiers(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/alpine/world/${worldId}/all-skiers`)
      skiers.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete skiers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/alpine/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        downhill: [],
        super_g: [],
        giant_slalom: [],
        slalom: []
      }
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
      const response = await api.post(`/alpine/world/${worldId}/create-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        downhill: [],
        super_g: [],
        giant_slalom: [],
        slalom: []
      }
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
      const response = await api.get(`/alpine/event/${eventId}`)
      currentEvent.value = response.data.event
      eventSkiers.value = response.data.skiers || []
      countryNames.value = response.data.countryNames || {}
      disciplineInfo.value = response.data.disciplineInfo || null
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRace(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/alpine/event/${eventId}/simulate`)

      if (currentEvent.value) {
        if (response.data.needsRun2) {
          // Two-run race, Run 1 completed
          currentEvent.value.run1_results = response.data.results
          currentEvent.value.status = 'run1_completed'
        } else {
          // Single-run race completed
          currentEvent.value.results = response.data.results
          currentEvent.value.status = 'completed'
        }
      }

      // Update standings if returned
      if (response.data.standings) {
        standings.value = response.data.standings
      }
      if (response.data.disciplineStandings) {
        for (const [discipline, data] of Object.entries(response.data.disciplineStandings)) {
          disciplineStandings.value[discipline] = data
        }
      }

      // Update the event in the events list
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = response.data.status
        if (response.data.needsRun2) {
          events.value[eventIndex].run1_results = response.data.results
        } else {
          events.value[eventIndex].results = response.data.results
        }
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate race'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRun2(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/alpine/event/${eventId}/simulate-run2`)

      if (currentEvent.value) {
        currentEvent.value.run2_results = response.data.run2Results
        currentEvent.value.results = response.data.finalResults
        currentEvent.value.status = 'completed'
      }

      // Update standings
      if (response.data.standings) {
        standings.value = response.data.standings
      }
      if (response.data.disciplineStandings) {
        for (const [discipline, data] of Object.entries(response.data.disciplineStandings)) {
          disciplineStandings.value[discipline] = data
        }
      }

      // Update the event in the events list
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = 'completed'
        events.value[eventIndex].run2_results = response.data.run2Results
        events.value[eventIndex].results = response.data.finalResults
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate run 2'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/alpine/season/${seasonId}/reset`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        downhill: [],
        super_g: [],
        giant_slalom: [],
        slalom: []
      }
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
    disciplineStandings.value = {
      downhill: [],
      super_g: [],
      giant_slalom: [],
      slalom: []
    }
  }

  function clearCurrentEvent() {
    currentEvent.value = null
    eventSkiers.value = []
    disciplineInfo.value = null
  }

  return {
    skiers,
    currentSeason,
    events,
    standings,
    disciplineStandings,
    countryNames,
    loading,
    error,
    currentEvent,
    eventSkiers,
    disciplineInfo,
    fetchSkiers,
    generateSkiers,
    createSkier,
    updateSkier,
    deleteSkier,
    deleteAllSkiers,
    fetchCurrentSeason,
    createSeason,
    fetchEvent,
    simulateRace,
    simulateRun2,
    resetSeason,
    clearSeason,
    clearCurrentEvent
  }
})
