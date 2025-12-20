import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from './auth'

/**
 * Get ISO week number from a date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Week key in format "YYYY-WXX"
 */
function getWeekKey(dateString) {
  const date = new Date(dateString + 'T00:00:00Z')
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

/**
 * Parse a week key into year and week number
 * @param {string} weekKey - Week key in format "YYYY-WXX"
 * @returns {{ year: number, week: number }}
 */
function parseWeekKey(weekKey) {
  if (!weekKey) return { year: 0, week: 0 }
  const [year, weekPart] = weekKey.split('-W')
  return {
    year: parseInt(year, 10),
    week: parseInt(weekPart, 10)
  }
}

export const useWeekStatusStore = defineStore('weekStatus', () => {
  // State
  const currentUnlockedWeek = ref(null)
  const isWeekComplete = ref(false)
  const eventsByDate = ref({})
  const currentWeekEvents = ref([])
  const allWeeks = ref([])
  const completedInWeek = ref(0)
  const totalInWeek = ref(0)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const weekProgress = computed(() => {
    if (totalInWeek.value === 0) return 0
    return Math.round((completedInWeek.value / totalInWeek.value) * 100)
  })

  const formattedWeek = computed(() => {
    if (!currentUnlockedWeek.value) return ''
    const { year, week } = parseWeekKey(currentUnlockedWeek.value)
    return `Week ${week}, ${year}`
  })

  // Actions
  async function fetchWeekStatus(worldId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/worlds/${worldId}/current-week-status`)
      currentUnlockedWeek.value = response.data.currentUnlockedWeek
      isWeekComplete.value = response.data.isWeekComplete
      eventsByDate.value = response.data.eventsByDate || {}
      currentWeekEvents.value = response.data.currentWeekEvents || []
      allWeeks.value = response.data.allWeeks || []
      completedInWeek.value = response.data.completedInWeek || 0
      totalInWeek.value = response.data.totalInWeek || 0
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch week status'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if an event is locked (in a future week)
   * @param {string} eventDate - Event date in YYYY-MM-DD format
   * @returns {boolean}
   */
  function isEventLocked(eventDate) {
    if (!currentUnlockedWeek.value || !eventDate) return false
    const eventWeekKey = getWeekKey(eventDate)
    return eventWeekKey > currentUnlockedWeek.value
  }

  /**
   * Get the week key for a given date
   * @param {string} eventDate - Event date in YYYY-MM-DD format
   * @returns {string}
   */
  function getEventWeekKey(eventDate) {
    return getWeekKey(eventDate)
  }

  function clearWeekStatus() {
    currentUnlockedWeek.value = null
    isWeekComplete.value = false
    eventsByDate.value = {}
    currentWeekEvents.value = []
    allWeeks.value = []
    completedInWeek.value = 0
    totalInWeek.value = 0
    error.value = null
  }

  return {
    // State
    currentUnlockedWeek,
    isWeekComplete,
    eventsByDate,
    currentWeekEvents,
    allWeeks,
    completedInWeek,
    totalInWeek,
    loading,
    error,
    // Computed
    weekProgress,
    formattedWeek,
    // Actions
    fetchWeekStatus,
    isEventLocked,
    getEventWeekKey,
    clearWeekStatus
  }
})
