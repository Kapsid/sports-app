// Luge World Cup Calendar Generator

const lugeVenues = [
  { location: 'Whistler', country: 'CAN', trackLength: 1450, turns: 16 },
  { location: 'Park City', country: 'USA', trackLength: 1335, turns: 15 },
  { location: 'Lake Placid', country: 'USA', trackLength: 1455, turns: 20 },
  { location: 'St. Moritz', country: 'SUI', trackLength: 1722, turns: 19 },
  { location: 'Innsbruck', country: 'AUT', trackLength: 1270, turns: 14 },
  { location: 'Altenberg', country: 'GER', trackLength: 1413, turns: 17 },
  { location: 'Winterberg', country: 'GER', trackLength: 1330, turns: 15 },
  { location: 'Sigulda', country: 'LAT', trackLength: 1420, turns: 16 },
  { location: 'La Plagne', country: 'FRA', trackLength: 1508, turns: 19 },
  { location: 'Königssee', country: 'GER', trackLength: 1306, turns: 16 },
  { location: 'Cortina d\'Ampezzo', country: 'ITA', trackLength: 1370, turns: 16 },
  { location: 'Lillehammer', country: 'NOR', trackLength: 1365, turns: 16 },
  { location: 'PyeongChang', country: 'KOR', trackLength: 1376, turns: 16 },
  { location: 'Beijing', country: 'CHN', trackLength: 1615, turns: 16 },
];

// World Cup points distribution (top 25)
const worldCupPoints = [
  225, 195, 170, 155, 145, 135, 125, 115, 105, 100,
  95, 90, 85, 80, 75, 70, 65, 60, 55, 50,
  46, 43, 40, 37, 35
];

// Generate a season calendar
function generateLugeCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Luge World Cup calendar structure
  // runs: 2 = standard World Cup, 4 = Championship/Olympic format
  const seasonStructure = [
    // November - Season opener
    { venue: 4, month: 11, day: 16, runs: 2 },  // Innsbruck
    { venue: 5, month: 11, day: 23, runs: 2 },  // Altenberg

    // December
    { venue: 6, month: 12, day: 2, runs: 2 },   // Winterberg
    { venue: 7, month: 12, day: 9, runs: 2 },   // Sigulda
    { venue: 9, month: 12, day: 16, runs: 4 },  // Königssee - 4 runs
    { venue: 8, month: 12, day: 23, runs: 2 },  // La Plagne

    // January
    { venue: 3, month: 1, day: 4, year: endYear, runs: 2 },    // St. Moritz
    { venue: 2, month: 1, day: 11, year: endYear, runs: 4 },   // Lake Placid - 4 runs
    { venue: 1, month: 1, day: 18, year: endYear, runs: 2 },   // Park City
    { venue: 0, month: 1, day: 25, year: endYear, runs: 4 },   // Whistler - 4 runs

    // February - Championships
    { venue: 10, month: 2, day: 1, year: endYear, runs: 2 },   // Cortina
    { venue: 5, month: 2, day: 8, year: endYear, runs: 4, championship: true },  // Altenberg (World Champs)

    // March - Finals
    { venue: 11, month: 3, day: 2, year: endYear, runs: 2 },   // Lillehammer
    { venue: 4, month: 3, day: 9, year: endYear, runs: 4 },    // Innsbruck (Finals)
  ];

  for (const event of seasonStructure) {
    const venue = lugeVenues[event.venue];
    if (!venue) continue;

    const year = event.year || startYear;

    calendar.push({
      id: null,
      eventIndex: eventIndex++,
      name: `${venue.location} - Singles${event.runs === 4 ? ' (4 Runs)' : ''}`,
      location: venue.location,
      country: venue.country,
      trackLength: venue.trackLength,
      turns: venue.turns,
      date: `${year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`,
      status: 'scheduled',
      runs: event.runs || 2,
      championship: event.championship || false
    });
  }

  return calendar;
}

// Luge country names
const lugeCountryNames = {
  'GER': 'Germany',
  'AUT': 'Austria',
  'ITA': 'Italy',
  'USA': 'United States',
  'CAN': 'Canada',
  'LAT': 'Latvia',
  'RUS': 'Russia',
  'POL': 'Poland',
  'UKR': 'Ukraine',
  'KOR': 'South Korea',
  'JPN': 'Japan',
  'CHN': 'China',
  'SUI': 'Switzerland',
  'FRA': 'France',
  'NOR': 'Norway',
  'SWE': 'Sweden',
  'CZE': 'Czech Republic',
  'SVK': 'Slovakia',
  'SLO': 'Slovenia',
  'ROU': 'Romania',
};

// Countries distribution for luge (top nations have more athletes)
const lugeCountryDistribution = {
  'GER': 4,  // Germany - dominant in luge
  'AUT': 3,  // Austria - very strong
  'ITA': 2,  // Italy
  'USA': 2,  // USA
  'LAT': 2,  // Latvia
  'RUS': 2,  // Russia
  'CAN': 1,  // Canada
  'POL': 1,  // Poland
  'UKR': 1,  // Ukraine
  'KOR': 1,  // South Korea
  'CHN': 1,  // China
  'SUI': 1,  // Switzerland
};

module.exports = {
  lugeVenues,
  worldCupPoints,
  generateLugeCalendar,
  lugeCountryNames,
  lugeCountryDistribution
};
