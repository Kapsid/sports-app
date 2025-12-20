// Cross-Country Skiing World Cup Calendar Generator

const xcVenues = [
  { location: 'Ruka', country: 'FIN', altitude: 200 },
  { location: 'Lillehammer', country: 'NOR', altitude: 180 },
  { location: 'Davos', country: 'SUI', altitude: 1560 },
  { location: 'Val di Fiemme', country: 'ITA', altitude: 1000 },
  { location: 'Tour de Ski', country: 'ITA', altitude: 1200 }, // Multi-stage
  { location: 'Les Rousses', country: 'FRA', altitude: 1100 },
  { location: 'Toblach', country: 'ITA', altitude: 1250 },
  { location: 'Planica', country: 'SLO', altitude: 940 },
  { location: 'Lahti', country: 'FIN', altitude: 100 },
  { location: 'Trondheim', country: 'NOR', altitude: 50 },
  { location: 'Falun', country: 'SWE', altitude: 140 },
  { location: 'Oslo Holmenkollen', country: 'NOR', altitude: 350 },
  { location: 'Engadin', country: 'SUI', altitude: 1800 },
];

// Race types with their characteristics
const xcRaceTypes = {
  sprint_free: {
    name: 'Sprint Freestyle',
    distance: 1.5, // km
    technique: 'freestyle',
    startType: 'sprint', // Heats
    category: 'sprint',
    wcPoints: true
  },
  sprint_classic: {
    name: 'Sprint Classic',
    distance: 1.5,
    technique: 'classic',
    startType: 'sprint',
    category: 'sprint',
    wcPoints: true
  },
  interval_10_classic: {
    name: '10km Classic',
    distance: 10,
    technique: 'classic',
    startType: 'interval',
    category: 'distance',
    wcPoints: true
  },
  interval_10_free: {
    name: '10km Freestyle',
    distance: 10,
    technique: 'freestyle',
    startType: 'interval',
    category: 'distance',
    wcPoints: true
  },
  interval_15_classic: {
    name: '15km Classic',
    distance: 15,
    technique: 'classic',
    startType: 'interval',
    category: 'distance',
    wcPoints: true
  },
  interval_15_free: {
    name: '15km Freestyle',
    distance: 15,
    technique: 'freestyle',
    startType: 'interval',
    category: 'distance',
    wcPoints: true
  },
  interval_20_classic: {
    name: '20km Classic',
    distance: 20,
    technique: 'classic',
    startType: 'interval',
    category: 'distance',
    wcPoints: true
  },
  mass_start_30_classic: {
    name: '30km Mass Start Classic',
    distance: 30,
    technique: 'classic',
    startType: 'mass',
    category: 'distance',
    wcPoints: true
  },
  mass_start_30_free: {
    name: '30km Mass Start Freestyle',
    distance: 30,
    technique: 'freestyle',
    startType: 'mass',
    category: 'distance',
    wcPoints: true
  },
  mass_start_50_classic: {
    name: '50km Mass Start Classic',
    distance: 50,
    technique: 'classic',
    startType: 'mass',
    category: 'distance',
    wcPoints: true
  },
  mass_start_50_free: {
    name: '50km Mass Start Freestyle',
    distance: 50,
    technique: 'freestyle',
    startType: 'mass',
    category: 'distance',
    wcPoints: true
  },
  skiathlon: {
    name: 'Skiathlon 30km',
    distance: 30, // 15km classic + 15km free
    technique: 'combined',
    startType: 'mass',
    category: 'distance',
    wcPoints: true
  },
  pursuit: {
    name: 'Pursuit',
    distance: 10,
    technique: 'freestyle',
    startType: 'pursuit',
    category: 'distance',
    wcPoints: true
  },
  relay: {
    name: 'Relay',
    distance: 10, // per leg
    legs: 4,
    technique: 'mixed', // 2 classic + 2 freestyle
    startType: 'mass',
    wcPoints: false
  }
};

// World Cup points distribution (top 30)
const worldCupPoints = [
  100, 80, 60, 50, 45, 40, 36, 32, 29, 26,
  24, 22, 20, 18, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1
];

// Tour de Ski bonus points
const tourBonusPoints = [
  400, 320, 240, 200, 180, 160, 144, 128, 116, 104,
  96, 88, 80, 72, 64, 60, 56, 52, 48, 44,
  40, 36, 32, 28, 24, 20, 16, 12, 8, 4
];

// Generate a season calendar
function generateXCCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Typical World Cup calendar structure
  const seasonStructure = [
    // November - Season opener
    { venue: 0, month: 11, days: [24, 25, 26], races: ['sprint_classic', 'interval_10_classic', 'interval_10_free'] },

    // December
    { venue: 1, month: 12, days: [1, 2, 3], races: ['sprint_free', 'interval_10_free', 'pursuit'] },
    { venue: 2, month: 12, days: [9, 10], races: ['sprint_classic', 'interval_15_free'] },
    { venue: 3, month: 12, days: [16, 17], races: ['interval_10_classic', 'mass_start_30_free'] },

    // January - Tour de Ski
    { venue: 4, month: 1, days: [1, 2, 3, 4], races: ['sprint_free', 'interval_15_classic', 'mass_start_30_free', 'interval_10_free'], year: endYear, tour: true },
    { venue: 5, month: 1, days: [13, 14], races: ['sprint_classic', 'interval_20_classic'], year: endYear },
    { venue: 6, month: 1, days: [20, 21], races: ['sprint_free', 'mass_start_30_classic'], year: endYear },

    // February - World Championships month (simplified)
    { venue: 7, month: 2, days: [10, 11, 12], races: ['sprint_classic', 'skiathlon', 'interval_15_free'], year: endYear, championship: true },
    { venue: 8, month: 2, days: [17, 18], races: ['sprint_free', 'interval_10_classic'], year: endYear },
    { venue: 9, month: 2, days: [24, 25], races: ['interval_15_classic', 'mass_start_30_free'], year: endYear },

    // March - Season finale
    { venue: 10, month: 3, days: [8, 9, 10], races: ['sprint_classic', 'interval_10_free', 'pursuit'], year: endYear },
    { venue: 11, month: 3, days: [15, 16], races: ['mass_start_50_classic', 'mass_start_50_free'], year: endYear },
  ];

  for (const week of seasonStructure) {
    const venue = xcVenues[week.venue];
    const year = week.year || startYear;

    for (let i = 0; i < week.races.length; i++) {
      const raceType = week.races[i];
      const raceInfo = xcRaceTypes[raceType];
      const day = week.days[i];

      calendar.push({
        id: null,
        eventIndex: eventIndex++,
        name: `${venue.location} - ${raceInfo.name}`,
        location: venue.location,
        country: venue.country,
        altitude: venue.altitude,
        raceType: raceType,
        technique: raceInfo.technique,
        distance: raceInfo.distance,
        startType: raceInfo.startType,
        date: `${year}-${String(week.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        status: 'scheduled',
        championship: week.championship || false,
        tourStage: week.tour ? i + 1 : 0,
        category: raceInfo.category
      });
    }
  }

  return calendar;
}

// Cross-country country names
const xcCountryNames = {
  'NOR': 'Norway',
  'SWE': 'Sweden',
  'FIN': 'Finland',
  'RUS': 'Russia',
  'GER': 'Germany',
  'ITA': 'Italy',
  'SUI': 'Switzerland',
  'FRA': 'France',
  'AUT': 'Austria',
  'CZE': 'Czech Republic',
  'POL': 'Poland',
  'USA': 'United States',
  'CAN': 'Canada',
  'SLO': 'Slovenia',
  'KAZ': 'Kazakhstan',
  'EST': 'Estonia',
  'UKR': 'Ukraine',
  'JPN': 'Japan',
  'CHN': 'China'
};

// Cross-country first names by country
const xcFirstNames = {
  'NOR': ['Johannes', 'Pål', 'Simen', 'Hans', 'Martin', 'Erik', 'Harald', 'Sjur', 'Didrik', 'Even'],
  'SWE': ['Calle', 'William', 'Marcus', 'Leo', 'Johan', 'Jens', 'Oskar', 'Emil'],
  'FIN': ['Iivo', 'Perttu', 'Ristomatti', 'Lauri', 'Arsi', 'Juho', 'Joni'],
  'RUS': ['Alexander', 'Sergey', 'Artem', 'Denis', 'Alexey', 'Ivan', 'Andrey'],
  'GER': ['Friedrich', 'Florian', 'Jonas', 'Lucas', 'Janosch', 'Albert', 'Thomas'],
  'ITA': ['Federico', 'Francesco', 'Dietmar', 'Simone', 'Giandomenico', 'Maicol'],
  'SUI': ['Dario', 'Jovian', 'Jonas', 'Roman', 'Jason', 'Valerio'],
  'FRA': ['Maurice', 'Richard', 'Hugo', 'Lucas', 'Jules', 'Clement'],
  'AUT': ['Dominik', 'Mika', 'Luis', 'Benjamin', 'Michael', 'Stefan'],
  'USA': ['Kevin', 'Scott', 'Erik', 'Ben', 'Zak', 'Kyle', 'Noah'],
  'CAN': ['Graham', 'Antoine', 'Remi', 'Jack', 'Pierre', 'Olivier'],
  'default': ['Alexander', 'Michael', 'Daniel', 'David', 'Thomas', 'Martin', 'Andreas', 'Peter']
};

// Cross-country last names by country
const xcLastNames = {
  'NOR': ['Klæbo', 'Golberg', 'Hegstad Krüger', 'Holund', 'Nyenget', 'Iversen', 'Tønseth', 'Røthe', 'Valnes', 'Northug'],
  'SWE': ['Halfvarsson', 'Poromaa', 'Hellner', 'Svensson', 'Burman', 'Persson', 'Westberg'],
  'FIN': ['Niskanen', 'Hyvarinen', 'Hakola', 'Vuorinen', 'Mäki', 'Ruuskanen'],
  'RUS': ['Bolshunov', 'Terentev', 'Maltsev', 'Yakimushkin', 'Sobakarev', 'Spitsov'],
  'GER': ['Moch', 'Notz', 'Dobler', 'Bögl', 'Brugger', 'Angerer'],
  'ITA': ['Pellegrino', 'De Fabiani', 'Nöckler', 'Rastelli', 'Salvadori', 'Ventura'],
  'SUI': ['Cologna', 'Hediger', 'Baumann', 'Rueesch', 'Klee', 'Schnider'],
  'FRA': ['Manificat', 'Jouve', 'Lapalus', 'Chauvin', 'Chanavat', 'Parisse'],
  'AUT': ['Stadlober', 'Vermeulen', 'Baldauf', 'Tritscher', 'Moser'],
  'USA': ['Norris', 'Patterson', 'Schoonmaker', 'Ogden', 'Hamilton', 'Bolger'],
  'CAN': ['Chicken', 'Cyr-Laroche', 'Drolet', 'Kennedy', 'Pralong'],
  'default': ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Bauer', 'Koch']
};

// Get random name for a country
function getRandomXCName(country) {
  const firstNames = xcFirstNames[country] || xcFirstNames['default'];
  const lastNames = xcLastNames[country] || xcLastNames['default'];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}

module.exports = {
  generateXCCalendar,
  xcVenues,
  xcRaceTypes,
  worldCupPoints,
  tourBonusPoints,
  xcCountryNames,
  getRandomXCName
};
