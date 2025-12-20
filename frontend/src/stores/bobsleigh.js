import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useBobsleighStore = defineStore('bobsleigh', () => {
  const teams = ref([])
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Current event being viewed/simulated
  const currentEvent = ref(null)
  const eventTeams = ref([])

  async function fetchTeams(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/bobsleigh/world/${worldId}/teams`)
      teams.value = response.data.teams || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch teams'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTeam(worldId, teamData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/bobsleigh/world/${worldId}/team`, teamData)
      teams.value.push(response.data.team)
      countryNames.value = response.data.countryNames || countryNames.value
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create team'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTeam(teamId, teamData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/bobsleigh/team/${teamId}`, teamData)
      const index = teams.value.findIndex(t => t.id === teamId)
      if (index !== -1) {
        teams.value[index] = response.data.team
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update team'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTeam(teamId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/bobsleigh/team/${teamId}`)
      teams.value = teams.value.filter(t => t.id !== teamId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete team'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllTeams(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/bobsleigh/world/${worldId}/all-teams`)
      teams.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete teams'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/bobsleigh/world/${worldId}/current-season`)
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
      const response = await api.post(`/bobsleigh/world/${worldId}/create-season`)
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
      const response = await api.get(`/bobsleigh/event/${eventId}`)
      currentEvent.value = response.data.event
      eventTeams.value = response.data.teams || []
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
      // Send frontend results if provided (from animation)
      const response = await api.post(`/bobsleigh/event/${eventId}/simulate`, { results })

      if (currentEvent.value) {
        currentEvent.value.run1_results = response.data.results
        currentEvent.value.status = 'run1_completed'
      }

      // Update the event in the events list
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
      // Send frontend results if provided (from animation)
      const response = await api.post(`/bobsleigh/event/${eventId}/simulate-run2`, { results })

      if (currentEvent.value) {
        currentEvent.value.run2_results = response.data.run2Results
        currentEvent.value.status = response.data.status
        if (response.data.status === 'completed') {
          currentEvent.value.results = response.data.finalResults
        }
      }

      // Update standings (only if race is completed)
      if (response.data.standings) {
        standings.value = response.data.standings
      }

      // Update the event in the events list
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
      // Send frontend results if provided (from animation)
      const response = await api.post(`/bobsleigh/event/${eventId}/simulate-run3`, { results })

      if (currentEvent.value) {
        currentEvent.value.run3_results = response.data.run3Results
        currentEvent.value.status = 'run3_completed'
      }

      // Update the event in the events list
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
      // Send frontend results if provided (from animation)
      const response = await api.post(`/bobsleigh/event/${eventId}/simulate-run4`, { results })

      if (currentEvent.value) {
        currentEvent.value.run4_results = response.data.run4Results
        currentEvent.value.results = response.data.finalResults
        currentEvent.value.status = 'completed'
      }

      // Update standings
      if (response.data.standings) {
        standings.value = response.data.standings
      }

      // Update the event in the events list
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
      const response = await api.post(`/bobsleigh/season/${seasonId}/reset`)
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
    eventTeams.value = []
  }

  return {
    teams,
    currentSeason,
    events,
    standings,
    countryNames,
    loading,
    error,
    currentEvent,
    eventTeams,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    deleteAllTeams,
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
