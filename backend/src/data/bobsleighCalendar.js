// Bobsleigh World Cup Calendar Generator

const bobsleighVenues = [
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
function generateBobsleighCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Bobsleigh World Cup calendar structure (4-man only for now)
  // runs: 2 = standard World Cup, 4 = Championship/Olympic format
  const seasonStructure = [
    // November - Season opener
    { venue: 5, month: 11, day: 17, runs: 2 },  // Altenberg
    { venue: 6, month: 11, day: 24, runs: 2 },  // Winterberg

    // December
    { venue: 7, month: 12, day: 1, runs: 2 },   // Sigulda
    { venue: 4, month: 12, day: 8, runs: 4 },   // Innsbruck - 4 runs
    { venue: 3, month: 12, day: 15, runs: 2 },  // St. Moritz
    { venue: 8, month: 12, day: 22, runs: 2 },  // La Plagne

    // January
    { venue: 9, month: 1, day: 5, year: endYear, runs: 2 },    // Königssee
    { venue: 2, month: 1, day: 12, year: endYear, runs: 4 },   // Lake Placid - 4 runs
    { venue: 1, month: 1, day: 19, year: endYear, runs: 2 },   // Park City
    { venue: 0, month: 1, day: 26, year: endYear, runs: 4 },   // Whistler - 4 runs

    // February - Championships
    { venue: 10, month: 2, day: 2, year: endYear, runs: 2 },   // Cortina
    { venue: 3, month: 2, day: 9, year: endYear, runs: 4, championship: true },  // St. Moritz (World Champs) - 4 runs

    // March - Finals
    { venue: 5, month: 3, day: 1, year: endYear, runs: 2 },    // Altenberg
    { venue: 11, month: 3, day: 8, year: endYear, runs: 4 },   // Lillehammer (Finals) - 4 runs
  ];

  for (const event of seasonStructure) {
    const venue = bobsleighVenues[event.venue];
    if (!venue) continue;

    const year = event.year || startYear;

    calendar.push({
      id: null,
      eventIndex: eventIndex++,
      name: `${venue.location} - 4-Man Bobsled${event.runs === 4 ? ' (4 Runs)' : ''}`,
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

// Bobsleigh country names
const bobsleighCountryNames = {
  'GER': 'Germany',
  'SUI': 'Switzerland',
  'AUT': 'Austria',
  'USA': 'United States',
  'CAN': 'Canada',
  'LAT': 'Latvia',
  'GBR': 'Great Britain',
  'FRA': 'France',
  'RUS': 'Russia',
  'KOR': 'South Korea',
  'JPN': 'Japan',
  'CHN': 'China',
  'ITA': 'Italy',
  'NED': 'Netherlands',
  'BEL': 'Belgium',
  'CZE': 'Czech Republic',
  'POL': 'Poland',
  'ROU': 'Romania',
  'AUS': 'Australia',
  'JAM': 'Jamaica',
  'NOR': 'Norway',
  'SWE': 'Sweden',
  'MON': 'Monaco',
  'NZL': 'New Zealand',
  'BRA': 'Brazil',
  'MEX': 'Mexico',
};

// Countries distribution for bobsleigh (top nations have more teams)
const bobsleighCountryDistribution = {
  'GER': 3,  // Germany - historically strongest
  'SUI': 2,  // Switzerland
  'AUT': 2,  // Austria
  'USA': 2,  // USA
  'CAN': 2,  // Canada
  'LAT': 2,  // Latvia - strong program
  'GBR': 1,  // Great Britain
  'FRA': 1,  // France
  'KOR': 1,  // South Korea
  'JPN': 1,  // Japan
  'CHN': 1,  // China
  'ITA': 1,  // Italy
  'NED': 1,  // Netherlands
  'ROU': 1,  // Romania
  'JAM': 1,  // Jamaica - Cool Runnings!
  'MON': 1,  // Monaco
};

module.exports = {
  bobsleighVenues,
  worldCupPoints,
  generateBobsleighCalendar,
  bobsleighCountryNames,
  bobsleighCountryDistribution
};
