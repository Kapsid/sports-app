import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useSportsmenStore = defineStore('sportsmen', () => {
  const sportsmen = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchSportsmen(search = '', country = '') {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (country) params.append('country', country)
      const query = params.toString() ? `?${params.toString()}` : ''
      const response = await api.get(`/sportsmen${query}`)
      sportsmen.value = response.data.sportsmen
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch sportsmen'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSportsman(data) {
    error.value = null
    try {
      const response = await api.post('/sportsmen', data)
      sportsmen.value.push(response.data.sportsman)
      return response.data.sportsman
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create sportsman'
      throw err
    }
  }

  async function bulkCreateSportsmen(entries) {
    error.value = null
    try {
      const response = await api.post('/sportsmen/bulk', { entries })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to bulk create sportsmen'
      throw err
    }
  }

  async function updateSportsman(id, data) {
    error.value = null
    try {
      const response = await api.put(`/sportsmen/${id}`, data)
      const index = sportsmen.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sportsmen.value[index] = response.data.sportsman
      }
      return response.data.sportsman
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update sportsman'
      throw err
    }
  }

  async function deleteSportsman(id) {
    error.value = null
    try {
      await api.delete(`/sportsmen/${id}`)
      sportsmen.value = sportsmen.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete sportsman'
      throw err
    }
  }

  return {
    sportsmen,
    loading,
    error,
    fetchSportsmen,
    createSportsman,
    bulkCreateSportsmen,
    updateSportsman,
    deleteSportsman
  }
})
