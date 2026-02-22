// Tennis Tournament Calendar Data
// Contains all tournament information for generating ATP-style seasons

const TOURNAMENT_TYPES = {
  GRAND_SLAM: 'grand_slam',
  MASTERS_1000: 'masters_1000',
  ATP_500: 'atp_500',
  ATP_250: 'atp_250'
};

const SURFACES = {
  HARD: 'hard',
  CLAY: 'clay',
  GRASS: 'grass'
};

const TOURNAMENT_POINTS = {
  [TOURNAMENT_TYPES.GRAND_SLAM]: {
    winner: 2000,
    finalist: 1200,
    semifinal: 720,
    quarterfinal: 360,
    round16: 180,
    round32: 90,
    round64: 45,
    round128: 10
  },
  [TOURNAMENT_TYPES.MASTERS_1000]: {
    winner: 1000,
    finalist: 600,
    semifinal: 360,
    quarterfinal: 180,
    round16: 90,
    round32: 45,
    round64: 25,
    round96: 10
  },
  [TOURNAMENT_TYPES.ATP_500]: {
    winner: 500,
    finalist: 300,
    semifinal: 180,
    quarterfinal: 90,
    round16: 45,
    round32: 20,
    round48: 0
  },
  [TOURNAMENT_TYPES.ATP_250]: {
    winner: 250,
    finalist: 150,
    semifinal: 90,
    quarterfinal: 45,
    round16: 20,
    round32: 5
  }
};

const DRAW_SIZES = {
  [TOURNAMENT_TYPES.GRAND_SLAM]: 128,
  [TOURNAMENT_TYPES.MASTERS_1000]: 64,
  [TOURNAMENT_TYPES.ATP_500]: 32,
  [TOURNAMENT_TYPES.ATP_250]: 32
};

// Tournament calendar - ordered chronologically through the year (32 tournaments)
const TOURNAMENTS = [
  // January
  {
    name: 'Adelaide International',
    location: 'Adelaide',
    country: 'AUS',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 1,
    week: 1,
    duration: 7
  },
  {
    name: 'Auckland Open',
    location: 'Auckland',
    country: 'NZL',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 1,
    week: 1,
    duration: 7
  },
  {
    name: 'Australian Open',
    location: 'Melbourne',
    country: 'AUS',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.GRAND_SLAM,
    month: 1,
    week: 3,
    duration: 14
  },

  // February
  {
    name: 'Cordoba Open',
    location: 'Cordoba',
    country: 'ARG',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 2,
    week: 1,
    duration: 7
  },
  {
    name: 'ABN AMRO Open',
    location: 'Rotterdam',
    country: 'NED',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 2,
    week: 2,
    duration: 7
  },
  {
    name: 'Rio Open',
    location: 'Rio de Janeiro',
    country: 'BRA',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 2,
    week: 3,
    duration: 7
  },
  {
    name: 'Dubai Tennis Championships',
    location: 'Dubai',
    country: 'UAE',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 2,
    week: 4,
    duration: 7
  },

  // March
  {
    name: 'Indian Wells Masters',
    location: 'Indian Wells',
    country: 'USA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 3,
    week: 2,
    duration: 14
  },
  {
    name: 'Miami Open',
    location: 'Miami',
    country: 'USA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 3,
    week: 4,
    duration: 12
  },

  // April
  {
    name: 'Monte-Carlo Masters',
    location: 'Monte Carlo',
    country: 'MON',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 4,
    week: 2,
    duration: 8
  },
  {
    name: 'Barcelona Open',
    location: 'Barcelona',
    country: 'ESP',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 4,
    week: 3,
    duration: 7
  },
  {
    name: 'Serbia Open',
    location: 'Belgrade',
    country: 'SRB',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 4,
    week: 3,
    duration: 7
  },

  // May
  {
    name: 'Madrid Open',
    location: 'Madrid',
    country: 'ESP',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 5,
    week: 1,
    duration: 9
  },
  {
    name: 'Italian Open',
    location: 'Rome',
    country: 'ITA',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 5,
    week: 2,
    duration: 9
  },
  {
    name: 'Geneva Open',
    location: 'Geneva',
    country: 'SUI',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 5,
    week: 3,
    duration: 7
  },
  {
    name: 'French Open',
    location: 'Paris',
    country: 'FRA',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.GRAND_SLAM,
    month: 5,
    week: 4,
    duration: 14
  },

  // June
  {
    name: 'Stuttgart Open',
    location: 'Stuttgart',
    country: 'GER',
    surface: SURFACES.GRASS,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 6,
    week: 1,
    duration: 7
  },
  {
    name: "Queen's Club Championships",
    location: 'London',
    country: 'GBR',
    surface: SURFACES.GRASS,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 6,
    week: 2,
    duration: 7
  },
  {
    name: 'Halle Open',
    location: 'Halle',
    country: 'GER',
    surface: SURFACES.GRASS,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 6,
    week: 2,
    duration: 7
  },
  {
    name: 'Eastbourne International',
    location: 'Eastbourne',
    country: 'GBR',
    surface: SURFACES.GRASS,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 6,
    week: 3,
    duration: 7
  },
  {
    name: 'Wimbledon',
    location: 'London',
    country: 'GBR',
    surface: SURFACES.GRASS,
    type: TOURNAMENT_TYPES.GRAND_SLAM,
    month: 7,
    week: 1,
    duration: 14
  },

  // July-August
  {
    name: 'Hamburg Open',
    location: 'Hamburg',
    country: 'GER',
    surface: SURFACES.CLAY,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 7,
    week: 3,
    duration: 7
  },
  {
    name: 'Washington Open',
    location: 'Washington',
    country: 'USA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 7,
    week: 4,
    duration: 7
  },
  {
    name: 'Canadian Open',
    location: 'Toronto/Montreal',
    country: 'CAN',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 8,
    week: 1,
    duration: 8
  },
  {
    name: 'Cincinnati Masters',
    location: 'Cincinnati',
    country: 'USA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 8,
    week: 2,
    duration: 8
  },
  {
    name: 'Winston-Salem Open',
    location: 'Winston-Salem',
    country: 'USA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 8,
    week: 3,
    duration: 7
  },
  {
    name: 'US Open',
    location: 'New York',
    country: 'USA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.GRAND_SLAM,
    month: 8,
    week: 4,
    duration: 14
  },

  // September-October
  {
    name: 'Chengdu Open',
    location: 'Chengdu',
    country: 'CHN',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_250,
    month: 9,
    week: 4,
    duration: 7
  },
  {
    name: 'Tokyo Open',
    location: 'Tokyo',
    country: 'JPN',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 10,
    week: 1,
    duration: 7
  },
  {
    name: 'Shanghai Masters',
    location: 'Shanghai',
    country: 'CHN',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 10,
    week: 2,
    duration: 8
  },
  {
    name: 'Vienna Open',
    location: 'Vienna',
    country: 'AUT',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.ATP_500,
    month: 10,
    week: 3,
    duration: 7
  },

  // November
  {
    name: 'Paris Masters',
    location: 'Paris',
    country: 'FRA',
    surface: SURFACES.HARD,
    type: TOURNAMENT_TYPES.MASTERS_1000,
    month: 10,
    week: 4,
    duration: 8
  }
];

// Generate tournament dates for a given year
function generateCalendarForYear(year) {
  return TOURNAMENTS.map((tournament, index) => {
    // Calculate approximate date based on month and week
    const baseDate = new Date(year, tournament.month - 1, 1);
    const dayOffset = (tournament.week - 1) * 7;
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + dayOffset);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tournament.duration);

    return {
      event_index: index,
      name: tournament.name,
      location: tournament.location,
      country: tournament.country,
      surface: tournament.surface,
      tournament_type: tournament.type,
      points: TOURNAMENT_POINTS[tournament.type].winner,
      draw_size: DRAW_SIZES[tournament.type],
      date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'upcoming',
      results: null,
      rounds: null
    };
  });
}

// Get country flag emoji from country code
function getCountryFlag(countryCode) {
  const flags = {
    'AUS': '🇦🇺',
    'NZL': '🇳🇿',
    'ARG': '🇦🇷',
    'BRA': '🇧🇷',
    'NED': '🇳🇱',
    'UAE': '🇦🇪',
    'USA': '🇺🇸',
    'MON': '🇲🇨',
    'ESP': '🇪🇸',
    'SRB': '🇷🇸',
    'ITA': '🇮🇹',
    'SUI': '🇨🇭',
    'FRA': '🇫🇷',
    'GBR': '🇬🇧',
    'GER': '🇩🇪',
    'CAN': '🇨🇦',
    'CHN': '🇨🇳',
    'JPN': '🇯🇵',
    'AUT': '🇦🇹'
  };
  return flags[countryCode] || '🏳️';
}

// Get surface color for UI
function getSurfaceColor(surface) {
  const colors = {
    [SURFACES.HARD]: '#3b82f6',    // Blue
    [SURFACES.CLAY]: '#f97316',     // Orange
    [SURFACES.GRASS]: '#22c55e'     // Green
  };
  return colors[surface] || '#6b7280';
}

// Get tournament type badge info
function getTournamentBadge(type) {
  const badges = {
    [TOURNAMENT_TYPES.GRAND_SLAM]: { label: 'Grand Slam', color: '#eab308', bg: '#fef3c7' },
    [TOURNAMENT_TYPES.MASTERS_1000]: { label: 'Masters 1000', color: '#8b5cf6', bg: '#ede9fe' },
    [TOURNAMENT_TYPES.ATP_500]: { label: 'ATP 500', color: '#3b82f6', bg: '#dbeafe' },
    [TOURNAMENT_TYPES.ATP_250]: { label: 'ATP 250', color: '#6b7280', bg: '#f3f4f6' }
  };
  return badges[type] || { label: 'Tournament', color: '#6b7280', bg: '#f3f4f6' };
}

module.exports = {
  TOURNAMENT_TYPES,
  SURFACES,
  TOURNAMENT_POINTS,
  DRAW_SIZES,
  TOURNAMENTS,
  generateCalendarForYear,
  getCountryFlag,
  getSurfaceColor,
  getTournamentBadge
};
