import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

export const useJumpersStore = defineStore('jumpers', () => {
  const jumpers = ref([])
  const countryNames = ref({})
  const loading = ref(false)
  const error = ref(null)

  async function fetchJumpers(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/jumpers/world/${worldId}`)
      jumpers.value = response.data.jumpers
      countryNames.value = response.data.countryNames
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch jumpers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateJumpers(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/jumpers/world/${worldId}/generate`)
      jumpers.value = response.data.jumpers
      countryNames.value = response.data.countryNames
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate jumpers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createJumper(worldId, jumperData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/jumpers/world/${worldId}`, jumperData)
      jumpers.value.push(response.data.jumper)
      // Sort by country and name
      jumpers.value.sort((a, b) => {
        if (a.country !== b.country) return a.country.localeCompare(b.country)
        if (a.last_name !== b.last_name) return a.last_name.localeCompare(b.last_name)
        return a.first_name.localeCompare(b.first_name)
      })
      return response.data.jumper
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create jumper'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateJumper(jumperId, jumperData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/jumpers/${jumperId}`, jumperData)
      const index = jumpers.value.findIndex(j => j.id === jumperId)
      if (index !== -1) {
        jumpers.value[index] = response.data.jumper
      }
      // Re-sort
      jumpers.value.sort((a, b) => {
        if (a.country !== b.country) return a.country.localeCompare(b.country)
        if (a.last_name !== b.last_name) return a.last_name.localeCompare(b.last_name)
        return a.first_name.localeCompare(b.first_name)
      })
      return response.data.jumper
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update jumper'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteJumper(jumperId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/jumpers/${jumperId}`)
      jumpers.value = jumpers.value.filter(j => j.id !== jumperId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete jumper'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAllJumpers(worldId) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/jumpers/world/${worldId}/all`)
      jumpers.value = []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete all jumpers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCountries() {
    try {
      const response = await api.get('/jumpers/data/countries')
      countryNames.value = response.data.countries
      return response.data.countries
    } catch (err) {
      console.error('Failed to fetch countries:', err)
      throw err
    }
  }

  function clearJumpers() {
    jumpers.value = []
  }

  return {
    jumpers,
    countryNames,
    loading,
    error,
    fetchJumpers,
    generateJumpers,
    createJumper,
    updateJumper,
    deleteJumper,
    deleteAllJumpers,
    fetchCountries,
    clearJumpers
  }
})
