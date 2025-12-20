import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useSeasonsStore = defineStore('seasons', () => {
  const currentSeason = ref(null)
  const events = ref([])
  const standings = ref([])
  const previousStandings = ref([]) // Track previous standings for position change
  const fourHillsStandings = ref([])
  const flyingCupStandings = ref([])
  const history = ref([])
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Current event being viewed/simulated
  const currentEvent = ref(null)
  const eventJumpers = ref([])

  async function fetchCurrentSeason(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/seasons/world/${worldId}/current`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      fourHillsStandings.value = response.data.fourHillsStandings || []
      flyingCupStandings.value = response.data.flyingCupStandings || []
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
      const response = await api.post(`/seasons/world/${worldId}/create`)
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
      const response = await api.get(`/seasons/event/${eventId}`)
      currentEvent.value = response.data.event
      eventJumpers.value = response.data.jumpers || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function startQualifying(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/start-qualifying`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start qualifying'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateQualifying(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/simulate-qualifying`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate qualifying'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateNextJump(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/simulate-next`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
        // Update event status if race completed
        if (response.data.results.status === 'completed') {
          currentEvent.value.status = 'completed'
        }
      }
      // Update standings if returned (race completed)
      if (response.data.standings) {
        standings.value = response.data.standings
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate jump'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateSingleJump(eventId, jumperId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/simulate-jump/${jumperId}`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
        // Update event status if race completed
        if (response.data.results.status === 'completed') {
          currentEvent.value.status = 'completed'
        }
      }
      // Update standings if returned (race completed)
      if (response.data.standings) {
        standings.value = response.data.standings
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate jump'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function startRound1(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/start-round1`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start round 1'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRound1(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/simulate-round1`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate round 1'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function startRound2(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/start-round2`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start round 2'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateRound2(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/event/${eventId}/simulate-round2`)
      if (currentEvent.value) {
        currentEvent.value.results = response.data.results
        currentEvent.value.status = 'completed'
      }
      // Save previous standings before updating
      previousStandings.value = [...standings.value]
      // Update standings
      standings.value = response.data.standings || []
      // Update Four Hills standings if returned
      if (response.data.fourHillsStandings) {
        fourHillsStandings.value = response.data.fourHillsStandings
      }
      // Update Flying Cup standings if returned
      if (response.data.flyingCupStandings) {
        flyingCupStandings.value = response.data.flyingCupStandings
      }
      // Update the event in the events list
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].status = 'completed'
        events.value[eventIndex].results = response.data.results
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate round 2'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function completeSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/season/${seasonId}/complete`)
      if (currentSeason.value) {
        currentSeason.value.status = 'completed'
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to complete season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetSeason(seasonId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/seasons/season/${seasonId}/reset`)
      currentSeason.value = response.data.season
      events.value = response.data.events || []
      standings.value = response.data.standings || []
      fourHillsStandings.value = response.data.fourHillsStandings || []
      flyingCupStandings.value = response.data.flyingCupStandings || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset season'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/seasons/world/${worldId}/history`)
      history.value = response.data.history || []
      countryNames.value = response.data.countryNames || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch history'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearSeason() {
    currentSeason.value = null
    events.value = []
    standings.value = []
    previousStandings.value = []
    fourHillsStandings.value = []
    flyingCupStandings.value = []
  }

  function clearCurrentEvent() {
    currentEvent.value = null
    eventJumpers.value = []
  }

  return {
    currentSeason,
    events,
    standings,
    previousStandings,
    fourHillsStandings,
    flyingCupStandings,
    history,
    countryNames,
    loading,
    error,
    currentEvent,
    eventJumpers,
    fetchCurrentSeason,
    createSeason,
    fetchEvent,
    startQualifying,
    simulateQualifying,
    simulateNextJump,
    simulateSingleJump,
    startRound1,
    simulateRound1,
    startRound2,
    simulateRound2,
    completeSeason,
    resetSeason,
    fetchHistory,
    clearSeason,
    clearCurrentEvent
  }
})
