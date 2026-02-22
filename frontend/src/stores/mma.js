import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from './auth'

// Countries list with codes and names
const COUNTRIES = [
  { code: 'AFG', name: 'Afghanistan' }, { code: 'ALB', name: 'Albania' }, { code: 'DZA', name: 'Algeria' },
  { code: 'ARG', name: 'Argentina' }, { code: 'ARM', name: 'Armenia' }, { code: 'AUS', name: 'Australia' },
  { code: 'AUT', name: 'Austria' }, { code: 'AZE', name: 'Azerbaijan' }, { code: 'BHR', name: 'Bahrain' },
  { code: 'BLR', name: 'Belarus' }, { code: 'BEL', name: 'Belgium' }, { code: 'BOL', name: 'Bolivia' },
  { code: 'BIH', name: 'Bosnia and Herzegovina' }, { code: 'BRA', name: 'Brazil' }, { code: 'BGR', name: 'Bulgaria' },
  { code: 'CMR', name: 'Cameroon' }, { code: 'CAN', name: 'Canada' }, { code: 'CHI', name: 'Chile' },
  { code: 'CHN', name: 'China' }, { code: 'COL', name: 'Colombia' }, { code: 'CRI', name: 'Costa Rica' },
  { code: 'HRV', name: 'Croatia' }, { code: 'CUB', name: 'Cuba' }, { code: 'CYP', name: 'Cyprus' },
  { code: 'CZE', name: 'Czech Republic' }, { code: 'DEN', name: 'Denmark' }, { code: 'DOM', name: 'Dominican Republic' },
  { code: 'ECU', name: 'Ecuador' }, { code: 'EGY', name: 'Egypt' }, { code: 'EST', name: 'Estonia' },
  { code: 'FIN', name: 'Finland' }, { code: 'FRA', name: 'France' }, { code: 'GEO', name: 'Georgia' },
  { code: 'GER', name: 'Germany' }, { code: 'GBR', name: 'Great Britain' }, { code: 'GRC', name: 'Greece' },
  { code: 'GUA', name: 'Guatemala' }, { code: 'HUN', name: 'Hungary' }, { code: 'ISL', name: 'Iceland' },
  { code: 'IND', name: 'India' }, { code: 'IDN', name: 'Indonesia' }, { code: 'IRN', name: 'Iran' },
  { code: 'IRL', name: 'Ireland' }, { code: 'ISR', name: 'Israel' }, { code: 'ITA', name: 'Italy' },
  { code: 'JAM', name: 'Jamaica' }, { code: 'JPN', name: 'Japan' }, { code: 'JOR', name: 'Jordan' },
  { code: 'KAZ', name: 'Kazakhstan' }, { code: 'KEN', name: 'Kenya' }, { code: 'KOR', name: 'South Korea' },
  { code: 'KGZ', name: 'Kyrgyzstan' }, { code: 'LAT', name: 'Latvia' }, { code: 'LTU', name: 'Lithuania' },
  { code: 'MYS', name: 'Malaysia' }, { code: 'MEX', name: 'Mexico' }, { code: 'MDA', name: 'Moldova' },
  { code: 'MNG', name: 'Mongolia' }, { code: 'MNE', name: 'Montenegro' }, { code: 'MAR', name: 'Morocco' },
  { code: 'NED', name: 'Netherlands' }, { code: 'NZL', name: 'New Zealand' }, { code: 'NGA', name: 'Nigeria' },
  { code: 'NOR', name: 'Norway' }, { code: 'PAK', name: 'Pakistan' }, { code: 'PAN', name: 'Panama' },
  { code: 'PAR', name: 'Paraguay' }, { code: 'PER', name: 'Peru' }, { code: 'PHI', name: 'Philippines' },
  { code: 'POL', name: 'Poland' }, { code: 'POR', name: 'Portugal' }, { code: 'PUR', name: 'Puerto Rico' },
  { code: 'ROU', name: 'Romania' }, { code: 'RUS', name: 'Russia' }, { code: 'KSA', name: 'Saudi Arabia' },
  { code: 'SEN', name: 'Senegal' }, { code: 'SRB', name: 'Serbia' }, { code: 'SGP', name: 'Singapore' },
  { code: 'SVK', name: 'Slovakia' }, { code: 'SLO', name: 'Slovenia' }, { code: 'RSA', name: 'South Africa' },
  { code: 'ESP', name: 'Spain' }, { code: 'SWE', name: 'Sweden' }, { code: 'SUI', name: 'Switzerland' },
  { code: 'SYR', name: 'Syria' }, { code: 'TPE', name: 'Taiwan' }, { code: 'TJK', name: 'Tajikistan' },
  { code: 'THA', name: 'Thailand' }, { code: 'TUN', name: 'Tunisia' }, { code: 'TUR', name: 'Turkey' },
  { code: 'TKM', name: 'Turkmenistan' }, { code: 'UKR', name: 'Ukraine' }, { code: 'UAE', name: 'United Arab Emirates' },
  { code: 'USA', name: 'United States' }, { code: 'URU', name: 'Uruguay' }, { code: 'UZB', name: 'Uzbekistan' },
  { code: 'VEN', name: 'Venezuela' }, { code: 'VIE', name: 'Vietnam' }
]

export const useMMAStore = defineStore('mma', () => {
  const organizations = ref([])
  const currentOrganization = ref(null)
  const fighters = ref([])
  const currentFighter = ref(null)
  const events = ref([])
  const currentEvent = ref(null)
  const fights = ref([])
  const rankings = ref([])
  const p4pRankings = ref([])
  const weightClasses = ref({ men: [], women: [] })
  const loading = ref(false)
  const error = ref(null)

  // ==================== ORGANIZATIONS ====================

  async function fetchOrganizations() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/mma/organizations')
      organizations.value = response.data.organizations
      return response.data.organizations
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch organizations'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOrganization(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/mma/organizations/${id}`)
      currentOrganization.value = response.data.organization
      return response.data.organization
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch organization'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createOrganization(name, shortName, description) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/mma/organizations', {
        name,
        short_name: shortName,
        description
      })
      organizations.value.unshift(response.data.organization)
      return response.data.organization
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create organization'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteOrganization(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/mma/organizations/${id}`)
      organizations.value = organizations.value.filter(o => o.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete organization'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== FIGHTERS ====================

  async function fetchFighters(orgId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/mma/organizations/${orgId}/fighters`)
      fighters.value = response.data.fighters
      return response.data.fighters
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch fighters'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFighter(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/mma/fighters/${id}`)
      currentFighter.value = response.data.fighter
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch fighter'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createFighter(orgId, fighterData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/mma/organizations/${orgId}/fighters`, fighterData)
      fighters.value.push(response.data.fighter)
      return response.data.fighter
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create fighter'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateFighter(id, fighterData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/mma/fighters/${id}`, fighterData)
      const index = fighters.value.findIndex(f => f.id === id)
      if (index !== -1) {
        fighters.value[index] = response.data.fighter
      }
      return response.data.fighter
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update fighter'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteFighter(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/mma/fighters/${id}`)
      fighters.value = fighters.value.filter(f => f.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete fighter'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateFighters(orgId, fightersPerDivision = 10) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/mma/organizations/${orgId}/generate-fighters`, {
        fightersPerDivision
      })
      fighters.value = [...fighters.value, ...response.data.fighters]
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate fighters'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== EVENTS ====================

  async function fetchEvents(orgId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/mma/organizations/${orgId}/events`)
      events.value = response.data.events
      return response.data.events
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEvent(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/mma/events/${id}`)
      currentEvent.value = response.data.event
      fights.value = response.data.fights
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateEvent(orgId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/mma/organizations/${orgId}/events`)
      events.value.unshift(response.data.event)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to generate event'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== FIGHTS ====================

  async function simulateFight(fightId, detailed = false) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/mma/fights/${fightId}/simulate`, { detailed })
      // Update fight in the list
      const index = fights.value.findIndex(f => f.id === fightId)
      if (index !== -1) {
        fights.value[index] = {
          ...fights.value[index],
          status: 'completed',
          winner_id: response.data.result.winnerId,
          method: response.data.result.method,
          round: response.data.result.round,
          time: response.data.result.time,
          fight_stats: response.data.result.stats
        }
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate fight'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function simulateAllFights(eventId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/mma/events/${eventId}/simulate-all`)
      // Update current event status
      if (currentEvent.value && currentEvent.value.id === eventId) {
        currentEvent.value.status = 'completed'
      }
      // Refetch event to get updated fights
      await fetchEvent(eventId)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to simulate event'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== RANKINGS ====================

  async function fetchRankings(orgId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/mma/organizations/${orgId}/rankings`)
      rankings.value = response.data.rankings
      p4pRankings.value = response.data.p4pRankings || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch rankings'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== WEIGHT CLASSES ====================

  async function fetchWeightClasses() {
    try {
      const response = await api.get('/mma/weight-classes')
      weightClasses.value = response.data
      return response.data
    } catch (err) {
      console.error('Failed to fetch weight classes:', err)
      // Use default weight classes
      weightClasses.value = {
        men: [
          { weight: 52, name: 'Strawweight' },
          { weight: 57, name: 'Flyweight' },
          { weight: 61, name: 'Bantamweight' },
          { weight: 66, name: 'Featherweight' },
          { weight: 70, name: 'Lightweight' },
          { weight: 77, name: 'Welterweight' },
          { weight: 84, name: 'Middleweight' },
          { weight: 93, name: 'Light Heavyweight' },
          { weight: 120, name: 'Heavyweight' }
        ],
        women: [
          { weight: 52, name: 'Strawweight' },
          { weight: 57, name: 'Flyweight' },
          { weight: 61, name: 'Bantamweight' },
          { weight: 66, name: 'Featherweight' }
        ]
      }
      return weightClasses.value
    }
  }

  // ==================== RESET ====================

  function resetState() {
    organizations.value = []
    currentOrganization.value = null
    fighters.value = []
    currentFighter.value = null
    events.value = []
    currentEvent.value = null
    fights.value = []
    rankings.value = []
    p4pRankings.value = []
    error.value = null
  }

  return {
    // State
    organizations,
    currentOrganization,
    fighters,
    currentFighter,
    events,
    currentEvent,
    fights,
    rankings,
    p4pRankings,
    weightClasses,
    countries: COUNTRIES,
    loading,
    error,

    // Organizations
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    deleteOrganization,

    // Fighters
    fetchFighters,
    fetchFighter,
    createFighter,
    updateFighter,
    deleteFighter,
    generateFighters,

    // Events
    fetchEvents,
    fetchEvent,
    generateEvent,

    // Fights
    simulateFight,
    simulateAllFights,

    // Rankings
    fetchRankings,

    // Weight Classes
    fetchWeightClasses,

    // Reset
    resetState
  }
})
