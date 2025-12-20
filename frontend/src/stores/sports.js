import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useSportsStore = defineStore('sports', () => {
  const sports = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchSports() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/sports')
      sports.value = response.data.sports
      return response.data.sports
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch sports'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    sports,
    loading,
    error,
    fetchSports
  }
})
