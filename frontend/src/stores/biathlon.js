import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useBiathlonStore = defineStore('biathlon', () => {
  const athletes = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const disciplineStandings = ref({
    sprint: [],
    pursuit: [],
    individual: [],
    mass_start: []
  })
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
      const response = await api.get(`/biathlon/world/${worldId}/athletes`)
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

  async function generateAthletes(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/biathlon/world/${worldId}/generate-athletes`)
      athletes.value = response.data.athletes || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate athletes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createAthlete(worldId, athleteData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/biathlon/world/${worldId}/athlete`, athleteData)
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
      const response = await api.put(`/biathlon/athlete/${athleteId}`, athleteData)
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
      await api.delete(`/biathlon/athlete/${athleteId}`)
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
      await api.delete(`/biathlon/world/${worldId}/all-athletes`)
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
      const response = await api.get(`/biathlon/world/${worldId}/current-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        sprint: [],
        pursuit: [],
        individual: [],
        mass_start: []
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
      const response = await api.post(`/biathlon/world/${worldId}/create-season`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        sprint: [],
        pursuit: [],
        individual: [],
        mass_start: []
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
      const response = await api.get(`/biathlon/event/${eventId}`)
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

  async function simulateRace(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/biathlon/event/${eventId}/simulate`)
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
      const response = await api.post(`/biathlon/season/${seasonId}/reset`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      disciplineStandings.value = response.data.disciplineStandings || {
        sprint: [],
        pursuit: [],
        individual: [],
        mass_start: []
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
      pursuit: [],
      individual: [],
      mass_start: []
    }
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
    disciplineStandings,
    countryNames,
    loading,
    error,
    currentEvent,
    eventAthletes,
    fetchAthletes,
    generateAthletes,
    createAthlete,
    updateAthlete,
    deleteAthlete,
    deleteAllAthletes,
    fetchCurrentSeason,
    createSeason,
    fetchEvent,
    simulateRace,
    resetSeason,
    clearSeason,
    clearCurrentEvent
  }
})
