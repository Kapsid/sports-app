import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref([])
  const teamStandings = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all global teams for a world
  async function fetchTeams(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/teams/world/${worldId}`)
      teams.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch teams'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTeam(teamId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/teams/${teamId}`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch team'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTeam(worldId, teamData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/teams/world/${worldId}`, teamData)
      teams.value.push(response.data)
      teams.value.sort((a, b) => a.name.localeCompare(b.name))
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
      const response = await api.put(`/teams/${teamId}`, teamData)
      const index = teams.value.findIndex(t => t.id === teamId)
      if (index !== -1) {
        teams.value[index] = { ...teams.value[index], ...response.data }
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
      await api.delete(`/teams/${teamId}`)
      teams.value = teams.value.filter(t => t.id !== teamId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete team'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Assign athlete to team - sport is needed to identify which table to update
  async function assignAthleteToTeam(teamId, athleteId, sport = 'skijumping') {
    loading.value = true
    error.value = null
    try {
      await api.post(`/teams/${teamId}/assign/${athleteId}?sport=${sport}`)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to assign athlete to team'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Unassign athlete from team - sport is needed to identify which table to update
  async function unassignAthlete(athleteId, sport = 'skijumping') {
    loading.value = true
    error.value = null
    try {
      await api.post(`/teams/unassign/${athleteId}?sport=${sport}`)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to remove athlete from team'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch team standings for a specific sport
  async function fetchTeamStandings(worldId, sport = 'skijumping') {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/teams/world/${worldId}/standings?sport=${sport}`)
      teamStandings.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch team standings'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearTeams() {
    teams.value = []
    teamStandings.value = []
  }

  // Keep old function names for backwards compatibility
  const assignJumperToTeam = assignAthleteToTeam
  const unassignJumper = unassignAthlete

  return {
    teams,
    teamStandings,
    loading,
    error,
    fetchTeams,
    fetchTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    assignAthleteToTeam,
    assignJumperToTeam,
    unassignAthlete,
    unassignJumper,
    fetchTeamStandings,
    clearTeams
  }
})
