// Golf PGA Tour Calendar Data
// Contains all tournament information for generating PGA Tour-style seasons

const TOURNAMENT_TYPES = {
  MAJOR: 'major',
  PLAYERS_CHAMPIONSHIP: 'players_championship',
  WGC: 'wgc',
  INVITATIONAL: 'invitational',
  REGULAR: 'regular'
};

const TOURNAMENT_POINTS = {
  [TOURNAMENT_TYPES.MAJOR]: [600, 360, 240, 180, 140, 120, 100, 85, 72, 60, 52, 44, 38, 32, 28, 24, 20, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  [TOURNAMENT_TYPES.PLAYERS_CHAMPIONSHIP]: [500, 300, 200, 150, 120, 100, 85, 72, 60, 50, 44, 38, 32, 28, 24, 20, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  [TOURNAMENT_TYPES.WGC]: [450, 270, 180, 135, 108, 90, 76, 64, 54, 45, 40, 34, 29, 25, 22, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1],
  [TOURNAMENT_TYPES.INVITATIONAL]: [400, 240, 160, 120, 96, 80, 68, 56, 48, 40, 35, 30, 26, 22, 19, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1],
  [TOURNAMENT_TYPES.REGULAR]: [300, 180, 120, 90, 72, 60, 51, 42, 36, 30, 26, 22, 19, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1]
};

const FIELD_SIZES = {
  [TOURNAMENT_TYPES.MAJOR]: 120,
  [TOURNAMENT_TYPES.PLAYERS_CHAMPIONSHIP]: 120,
  [TOURNAMENT_TYPES.WGC]: 72,
  [TOURNAMENT_TYPES.INVITATIONAL]: 120,
  [TOURNAMENT_TYPES.REGULAR]: 120
};

// Tournament calendar - ordered chronologically through the year (~30 events)
const TOURNAMENTS = [
  // January
  { name: 'Sentry Tournament of Champions', location: 'Kapalua', country: 'USA', course_name: 'Plantation Course', course_par: 73, type: TOURNAMENT_TYPES.INVITATIONAL, month: 1, week: 1 },
  { name: 'Sony Open', location: 'Honolulu', country: 'USA', course_name: 'Waialae CC', course_par: 70, type: TOURNAMENT_TYPES.REGULAR, month: 1, week: 2 },
  { name: 'The American Express', location: 'La Quinta', country: 'USA', course_name: 'PGA West', course_par: 72, type: TOURNAMENT_TYPES.REGULAR, month: 1, week: 3 },
  { name: 'Farmers Insurance Open', location: 'San Diego', country: 'USA', course_name: 'Torrey Pines', course_par: 72, type: TOURNAMENT_TYPES.INVITATIONAL, month: 1, week: 4 },

  // February
  { name: 'AT&T Pebble Beach Pro-Am', location: 'Pebble Beach', country: 'USA', course_name: 'Pebble Beach GL', course_par: 72, type: TOURNAMENT_TYPES.INVITATIONAL, month: 2, week: 1 },
  { name: 'WM Phoenix Open', location: 'Scottsdale', country: 'USA', course_name: 'TPC Scottsdale', course_par: 71, type: TOURNAMENT_TYPES.REGULAR, month: 2, week: 2 },
  { name: 'Genesis Invitational', location: 'Pacific Palisades', country: 'USA', course_name: 'Riviera CC', course_par: 71, type: TOURNAMENT_TYPES.INVITATIONAL, month: 2, week: 3 },
  { name: 'Honda Classic', location: 'Palm Beach Gardens', country: 'USA', course_name: 'PGA National', course_par: 70, type: TOURNAMENT_TYPES.REGULAR, month: 2, week: 4 },

  // March
  { name: 'Arnold Palmer Invitational', location: 'Orlando', country: 'USA', course_name: 'Bay Hill Club', course_par: 72, type: TOURNAMENT_TYPES.INVITATIONAL, month: 3, week: 1 },
  { name: 'THE PLAYERS Championship', location: 'Ponte Vedra Beach', country: 'USA', course_name: 'TPC Sawgrass', course_par: 72, type: TOURNAMENT_TYPES.PLAYERS_CHAMPIONSHIP, month: 3, week: 2 },
  { name: 'Valspar Championship', location: 'Palm Harbor', country: 'USA', course_name: 'Innisbrook', course_par: 71, type: TOURNAMENT_TYPES.REGULAR, month: 3, week: 3 },
  { name: 'WGC-Dell Technologies Match Play', location: 'Austin', country: 'USA', course_name: 'Austin CC', course_par: 71, type: TOURNAMENT_TYPES.WGC, month: 3, week: 4 },

  // April
  { name: 'The Masters', location: 'Augusta', country: 'USA', course_name: 'Augusta National', course_par: 72, type: TOURNAMENT_TYPES.MAJOR, month: 4, week: 2 },
  { name: 'RBC Heritage', location: 'Hilton Head Island', country: 'USA', course_name: 'Harbour Town GL', course_par: 71, type: TOURNAMENT_TYPES.INVITATIONAL, month: 4, week: 3 },

  // May
  { name: 'Wells Fargo Championship', location: 'Charlotte', country: 'USA', course_name: 'Quail Hollow Club', course_par: 71, type: TOURNAMENT_TYPES.REGULAR, month: 5, week: 1 },
  { name: 'PGA Championship', location: 'Louisville', country: 'USA', course_name: 'Valhalla GC', course_par: 72, type: TOURNAMENT_TYPES.MAJOR, month: 5, week: 3 },
  { name: 'Charles Schwab Challenge', location: 'Fort Worth', country: 'USA', course_name: 'Colonial CC', course_par: 70, type: TOURNAMENT_TYPES.INVITATIONAL, month: 5, week: 4 },

  // June
  { name: 'The Memorial Tournament', location: 'Dublin', country: 'USA', course_name: 'Muirfield Village', course_par: 72, type: TOURNAMENT_TYPES.INVITATIONAL, month: 6, week: 1 },
  { name: 'RBC Canadian Open', location: 'Toronto', country: 'CAN', course_name: 'St. George\'s G&CC', course_par: 70, type: TOURNAMENT_TYPES.REGULAR, month: 6, week: 2 },
  { name: 'U.S. Open', location: 'Pinehurst', country: 'USA', course_name: 'Pinehurst No. 2', course_par: 70, type: TOURNAMENT_TYPES.MAJOR, month: 6, week: 3 },
  { name: 'Travelers Championship', location: 'Cromwell', country: 'USA', course_name: 'TPC River Highlands', course_par: 70, type: TOURNAMENT_TYPES.REGULAR, month: 6, week: 4 },

  // July
  { name: 'Rocket Mortgage Classic', location: 'Detroit', country: 'USA', course_name: 'Detroit GC', course_par: 72, type: TOURNAMENT_TYPES.REGULAR, month: 7, week: 1 },
  { name: 'John Deere Classic', location: 'Silvis', country: 'USA', course_name: 'TPC Deere Run', course_par: 71, type: TOURNAMENT_TYPES.REGULAR, month: 7, week: 2 },
  { name: 'The Open Championship', location: 'St Andrews', country: 'GBR', course_name: 'Old Course', course_par: 72, type: TOURNAMENT_TYPES.MAJOR, month: 7, week: 3 },
  { name: 'WGC-FedEx St. Jude Invitational', location: 'Memphis', country: 'USA', course_name: 'TPC Southwind', course_par: 70, type: TOURNAMENT_TYPES.WGC, month: 7, week: 4 },

  // August
  { name: 'Wyndham Championship', location: 'Greensboro', country: 'USA', course_name: 'Sedgefield CC', course_par: 70, type: TOURNAMENT_TYPES.REGULAR, month: 8, week: 1 },
  { name: 'FedEx St. Jude Championship', location: 'Memphis', country: 'USA', course_name: 'TPC Southwind', course_par: 70, type: TOURNAMENT_TYPES.INVITATIONAL, month: 8, week: 2 },
  { name: 'BMW Championship', location: 'Wilmington', country: 'USA', course_name: 'Wilmington CC', course_par: 71, type: TOURNAMENT_TYPES.INVITATIONAL, month: 8, week: 3 },
  { name: 'TOUR Championship', location: 'Atlanta', country: 'USA', course_name: 'East Lake GC', course_par: 70, type: TOURNAMENT_TYPES.INVITATIONAL, month: 8, week: 4 }
];

// Generate tournament dates for a given year
function generateCalendarForYear(year) {
  return TOURNAMENTS.map((tournament, index) => {
    const baseDate = new Date(year, tournament.month - 1, 1);
    const dayOffset = (tournament.week - 1) * 7;
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + dayOffset);

    return {
      event_index: index,
      name: tournament.name,
      location: tournament.location,
      country: tournament.country,
      course_name: tournament.course_name,
      course_par: tournament.course_par,
      tournament_type: tournament.type,
      field_size: FIELD_SIZES[tournament.type],
      date: startDate.toISOString().split('T')[0],
      status: 'upcoming'
    };
  });
}

// Get points for a given position and tournament type
function getPointsForPosition(tournamentType, position) {
  const table = TOURNAMENT_POINTS[tournamentType] || TOURNAMENT_POINTS[TOURNAMENT_TYPES.REGULAR];
  if (position < 1 || position > table.length) return 0;
  return table[position - 1];
}

// Get tournament type badge info
function getTournamentBadge(type) {
  const badges = {
    [TOURNAMENT_TYPES.MAJOR]: { label: 'Major', color: '#b45309', bg: '#fef3c7' },
    [TOURNAMENT_TYPES.PLAYERS_CHAMPIONSHIP]: { label: 'THE PLAYERS', color: '#7c3aed', bg: '#ede9fe' },
    [TOURNAMENT_TYPES.WGC]: { label: 'WGC', color: '#7c3aed', bg: '#ede9fe' },
    [TOURNAMENT_TYPES.INVITATIONAL]: { label: 'Invitational', color: '#2563eb', bg: '#dbeafe' },
    [TOURNAMENT_TYPES.REGULAR]: { label: 'Regular', color: '#4b5563', bg: '#f3f4f6' }
  };
  return badges[type] || { label: 'Tournament', color: '#4b5563', bg: '#f3f4f6' };
}

module.exports = {
  TOURNAMENT_TYPES,
  TOURNAMENT_POINTS,
  FIELD_SIZES,
  TOURNAMENTS,
  generateCalendarForYear,
  getPointsForPosition,
  getTournamentBadge
};
