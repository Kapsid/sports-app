import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useSummerWorldsStore = defineStore('summerWorlds', () => {
  const worlds = ref([])
  const currentWorld = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchWorlds() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/summer-worlds')
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
      const response = await api.get(`/summer-worlds/${id}`)
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
      const response = await api.post('/summer-worlds', { name, description })
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
      await api.delete(`/summer-worlds/${id}`)
      worlds.value = worlds.value.filter(w => w.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete world'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    worlds,
    currentWorld,
    loading,
    error,
    fetchWorlds,
    fetchWorld,
    createWorld,
    deleteWorld
  }
})
