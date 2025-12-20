import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useCrossCountryStore = defineStore('crosscountry', () => {
  const skiers = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const disciplineStandings = ref({
    sprint: [],
    distance: [],
    tour: []
  })
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Current event being viewed/simulated
  const currentEvent = ref(null)
  const eventSkiers = ref([])

  async function fetchSkiers(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/crosscountry/world/${worldId}/skiers`)
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
      const response = await api.post(`/crosscountry/world/${worldId}/generate-skiers`)
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
      const response = await api.post(`/crosscountry/world/${worldId}/skier`, skierData)
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
      const response = await api.put(`/crosscountry/skier/${skierId}`, skierData)
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
      await api.delete(`/crosscountry/skier/${skierId}`)
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
      await api.delete(`/crosscountry/world/${worldId}/all-skiers`)
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
      const response = await api.get(`/crosscountry/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        sprint: [],
        distance: [],
        tour: []
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
      const response = await api.post(`/crosscountry/world/${worldId}/create-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        sprint: [],
        distance: [],
        tour: []
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
      const response = await api.get(`/crosscountry/event/${eventId}`)
      currentEvent.value = response.data.event
      eventSkiers.value = response.data.skiers || []
      countryNames.value = response.data.countryNames || {}
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
      const response = await api.post(`/crosscountry/event/${eventId}/simulate`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
        currentEvent.value.status = 'completed'
      }
      // Update standings
      standings.value = response.data.standings || []
      // Update discipline standings if returned
      if (response.data.disciplineStandings) {
        for (const [discipline, data] of Object.entries(response.data.disciplineStandings)) {
          disciplineStandings.value[discipline] = data
        }
      }
      // Update the event in the events list
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = 'completed'
        events.value[eventIndex].results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate race'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/crosscountry/season/${seasonId}/reset`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        sprint: [],
        distance: [],
        tour: []
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
      sprint: [],
      distance: [],
      tour: []
    }
  }

  function clearCurrentEvent() {
    currentEvent.value = null
    eventSkiers.value = []
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
    resetSeason,
    clearSeason,
    clearCurrentEvent
  }
})
