import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useWorldsStore = defineStore('worlds', () => {
  const worlds = ref([])
  const currentWorld = ref(null)
  const dashboardSummary = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchWorlds() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/worlds')
      worlds.value = response.data.worlds
      return response.data.worlds
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch worlds'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWorld(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/worlds/${id}`)
      currentWorld.value = response.data.world
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createWorld(name, description) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/worlds', { name, description })
      worlds.value.unshift(response.data.world)
      return response.data.world
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteWorld(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/worlds/${id}`)
      worlds.value = worlds.value.filter(w => w.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete world'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDashboardSummary(worldId) {
    try {
      const response = await api.get(`/worlds/${worldId}/dashboard-summary`)
      dashboardSummary.value = response.data.summary
      return response.data.summary
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err)
      dashboardSummary.value = null
      return null
    }
  }

  return {
    worlds,
    currentWorld,
    dashboardSummary,
    loading,
    error,
    fetchWorlds,
    fetchWorld,
    createWorld,
    deleteWorld,
    fetchDashboardSummary
  }
})
