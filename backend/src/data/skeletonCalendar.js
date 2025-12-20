// Skeleton World Cup Calendar Generator

const skeletonVenues = [
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
function generateSkeletonCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Skeleton World Cup calendar structure
  // runs: 2 = standard World Cup, 4 = Championship/Olympic format
  const seasonStructure = [
    // November - Season opener
    { venue: 7, month: 11, day: 15, runs: 2 },  // Sigulda
    { venue: 5, month: 11, day: 22, runs: 2 },  // Altenberg

    // December
    { venue: 6, month: 12, day: 1, runs: 2 },   // Winterberg
    { venue: 4, month: 12, day: 8, runs: 4 },   // Innsbruck - 4 runs
    { venue: 9, month: 12, day: 15, runs: 2 },  // Königssee
    { venue: 3, month: 12, day: 22, runs: 2 },  // St. Moritz

    // January
    { venue: 8, month: 1, day: 5, year: endYear, runs: 2 },    // La Plagne
    { venue: 2, month: 1, day: 12, year: endYear, runs: 4 },   // Lake Placid - 4 runs
    { venue: 1, month: 1, day: 19, year: endYear, runs: 2 },   // Park City
    { venue: 0, month: 1, day: 26, year: endYear, runs: 4 },   // Whistler - 4 runs

    // February - Championships
    { venue: 10, month: 2, day: 2, year: endYear, runs: 2 },   // Cortina
    { venue: 6, month: 2, day: 9, year: endYear, runs: 4, championship: true },  // Winterberg (World Champs)

    // March - Finals
    { venue: 9, month: 3, day: 1, year: endYear, runs: 2 },    // Königssee
    { venue: 5, month: 3, day: 8, year: endYear, runs: 4 },    // Altenberg (Finals)
  ];

  for (const event of seasonStructure) {
    const venue = skeletonVenues[event.venue];
    if (!venue) continue;

    const year = event.year || startYear;

    calendar.push({
      id: null,
      eventIndex: eventIndex++,
      name: `${venue.location}${event.runs === 4 ? ' (4 Runs)' : ''}`,
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

// Skeleton country names
const skeletonCountryNames = {
  'GER': 'Germany',
  'GBR': 'Great Britain',
  'LAT': 'Latvia',
  'USA': 'United States',
  'CAN': 'Canada',
  'AUT': 'Austria',
  'RUS': 'Russia',
  'KOR': 'South Korea',
  'JPN': 'Japan',
  'CHN': 'China',
  'SUI': 'Switzerland',
  'NED': 'Netherlands',
  'AUS': 'Australia',
  'FRA': 'France',
  'ITA': 'Italy',
  'NOR': 'Norway',
  'BEL': 'Belgium',
  'CZE': 'Czech Republic',
};

// Countries distribution for skeleton (top nations have more athletes)
const skeletonCountryDistribution = {
  'GER': 3,  // Germany
  'GBR': 3,  // Great Britain - strong in skeleton
  'LAT': 2,  // Latvia - Dukurs brothers
  'USA': 2,  // USA
  'CAN': 2,  // Canada
  'AUT': 1,  // Austria
  'RUS': 1,  // Russia
  'KOR': 1,  // South Korea
  'CHN': 1,  // China
  'SUI': 1,  // Switzerland
  'NED': 1,  // Netherlands
  'AUS': 1,  // Australia
};

module.exports = {
  skeletonVenues,
  worldCupPoints,
  generateSkeletonCalendar,
  skeletonCountryNames,
  skeletonCountryDistribution
};
