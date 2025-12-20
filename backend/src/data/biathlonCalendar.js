// Biathlon World Cup Calendar Generator

const biathlonVenues = [
  { location: 'Östersund', country: 'SWE', altitude: 380 },
  { location: 'Hochfilzen', country: 'AUT', altitude: 960 },
  { location: 'Annecy-Le Grand Bornand', country: 'FRA', altitude: 1000 },
  { location: 'Oberhof', country: 'GER', altitude: 815 },
  { location: 'Ruhpolding', country: 'GER', altitude: 650 },
  { location: 'Antholz-Anterselva', country: 'ITA', altitude: 1600 },
  { location: 'Pokljuka', country: 'SLO', altitude: 1350 },
  { location: 'Nové Město', country: 'CZE', altitude: 590 },
  { location: 'Kontiolahti', country: 'FIN', altitude: 150 },
  { location: 'Oslo Holmenkollen', country: 'NOR', altitude: 350 },
  { location: 'Soldier Hollow', country: 'USA', altitude: 1700 },
  { location: 'Canmore', country: 'CAN', altitude: 1400 },
];

// Race types with their characteristics
const raceTypes = {
  sprint: {
    name: 'Sprint',
    distance: 10, // km for men
    shootings: 2,
    shootingSequence: ['prone', 'standing'],
    penaltyType: 'loop', // 150m penalty loop per miss
    startType: 'interval',
    wcPoints: true
  },
  pursuit: {
    name: 'Pursuit',
    distance: 12.5,
    shootings: 4,
    shootingSequence: ['prone', 'prone', 'standing', 'standing'],
    penaltyType: 'loop',
    startType: 'chase', // Based on sprint results
    wcPoints: true
  },
  individual: {
    name: 'Individual',
    distance: 20,
    shootings: 4,
    shootingSequence: ['prone', 'standing', 'prone', 'standing'],
    penaltyType: 'time', // 1 minute per miss
    startType: 'interval',
    wcPoints: true
  },
  mass_start: {
    name: 'Mass Start',
    distance: 15,
    shootings: 4,
    shootingSequence: ['prone', 'prone', 'standing', 'standing'],
    penaltyType: 'loop',
    startType: 'mass',
    wcPoints: true
  }
};

// World Cup points distribution (top 40)
const worldCupPoints = [
  60, 54, 48, 43, 40, 38, 36, 34, 32, 31,
  30, 29, 28, 27, 26, 25, 24, 23, 22, 21,
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1
];

// Generate a season calendar
function generateBiathlonCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Typical World Cup calendar structure
  const seasonStructure = [
    // November - Season opener
    { venue: 0, month: 11, days: [25, 26, 27], races: ['individual', 'sprint', 'pursuit'] },

    // December
    { venue: 1, month: 12, days: [8, 9, 10], races: ['sprint', 'pursuit', 'mass_start'] },
    { venue: 2, month: 12, days: [15, 16, 17], races: ['sprint', 'sprint', 'pursuit'] },

    // January
    { venue: 3, month: 1, days: [5, 6, 7], races: ['sprint', 'pursuit', 'mass_start'], year: endYear },
    { venue: 4, month: 1, days: [12, 13, 14], races: ['individual', 'sprint', 'mass_start'], year: endYear },
    { venue: 5, month: 1, days: [19, 20, 21], races: ['sprint', 'pursuit', 'individual'], year: endYear },

    // February - World Championships month (simplified as regular events)
    { venue: 6, month: 2, days: [9, 10, 11], races: ['sprint', 'pursuit', 'individual'], year: endYear, championship: true },
    { venue: 7, month: 2, days: [16, 17, 18], races: ['sprint', 'sprint', 'mass_start'], year: endYear },

    // March - Season finale
    { venue: 8, month: 3, days: [8, 9, 10], races: ['sprint', 'pursuit', 'individual'], year: endYear },
    { venue: 9, month: 3, days: [15, 16, 17], races: ['sprint', 'mass_start', 'pursuit'], year: endYear },
  ];

  for (const week of seasonStructure) {
    const venue = biathlonVenues[week.venue];
    const year = week.year || startYear;

    for (let i = 0; i < week.races.length; i++) {
      const raceType = week.races[i];
      const raceInfo = raceTypes[raceType];
      const day = week.days[i];

      calendar.push({
        id: null, // Will be assigned when saved to DB
        eventIndex: eventIndex++,
        name: `${venue.location} - ${raceInfo.name}`,
        location: venue.location,
        country: venue.country,
        altitude: venue.altitude,
        raceType: raceType,
        distance: raceInfo.distance,
        shootings: raceInfo.shootings,
        date: `${year}-${String(week.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        status: 'scheduled',
        championship: week.championship || false,
        discipline: raceType // For discipline standings
      });
    }
  }

  return calendar;
}

// Biathlon country names
const biathlonCountryNames = {
  'NOR': 'Norway',
  'FRA': 'France',
  'GER': 'Germany',
  'SWE': 'Sweden',
  'ITA': 'Italy',
  'AUT': 'Austria',
  'SLO': 'Slovenia',
  'CZE': 'Czech Republic',
  'SUI': 'Switzerland',
  'FIN': 'Finland',
  'USA': 'United States',
  'CAN': 'Canada',
  'RUS': 'Russia',
  'BLR': 'Belarus',
  'UKR': 'Ukraine',
  'POL': 'Poland',
  'EST': 'Estonia',
  'LAT': 'Latvia',
  'LTU': 'Lithuania',
  'BEL': 'Belgium',
  'CHN': 'China',
  'JPN': 'Japan',
  'KOR': 'South Korea',
  'KAZ': 'Kazakhstan',
  'BUL': 'Bulgaria',
  'ROU': 'Romania',
  'SVK': 'Slovakia'
};

// Biathlon first names by country
const biathlonFirstNames = {
  'NOR': ['Johannes', 'Tarjei', 'Sturla', 'Vetle', 'Filip', 'Erlend', 'Sivert', 'Martin', 'Lars'],
  'FRA': ['Quentin', 'Emilien', 'Fabien', 'Simon', 'Antonin', 'Eric', 'Martin', 'Florent'],
  'GER': ['Benedikt', 'Philipp', 'Roman', 'Johannes', 'Erik', 'Justus', 'David', 'Danilo'],
  'SWE': ['Sebastian', 'Martin', 'Jesper', 'Peppe', 'Viktor', 'Felix', 'Malte', 'Tobias'],
  'ITA': ['Tommaso', 'Lukas', 'Dominik', 'Patrick', 'Thomas', 'Didier', 'Daniele'],
  'AUT': ['Simon', 'Felix', 'David', 'Patrick', 'Lorenz', 'Harald', 'Tobias'],
  'SLO': ['Jakov', 'Miha', 'Rok', 'Klemen', 'Lovro', 'Alex'],
  'CZE': ['Michal', 'Ondřej', 'Jakub', 'Adam', 'Tomáš', 'Vítězslav'],
  'SUI': ['Niklas', 'Sebastian', 'Martin', 'Benjamin', 'Jeremy', 'Joscha'],
  'FIN': ['Tero', 'Olli', 'Tuomas', 'Jaakko', 'Otto', 'Heikki'],
  'USA': ['Paul', 'Jake', 'Sean', 'Leif', 'Patrick', 'Campbell'],
  'CAN': ['Scott', 'Christian', 'Jules', 'Adam', 'Aidan'],
  'default': ['Alexander', 'Michael', 'Daniel', 'David', 'Thomas', 'Martin', 'Andreas', 'Peter']
};

// Biathlon last names by country
const biathlonLastNames = {
  'NOR': ['Bø', 'Lægreid', 'Christiansen', 'Dale', 'Andersen', 'Bakken', 'Strømsheim', 'Uldal', 'Femsteinevik'],
  'FRA': ['Fillon Maillet', 'Jacquelin', 'Claude', 'Desthieux', 'Guigonnat', 'Perrot', 'Braisaz'],
  'GER': ['Doll', 'Nawrath', 'Rees', 'Kühn', 'Lesser', 'Strelow', 'Zobel', 'Hartweg'],
  'SWE': ['Samuelsson', 'Ponsiluoma', 'Nelin', 'Femling', 'Brandt', 'Persson', 'Uddebäck'],
  'ITA': ['Giacomel', 'Hofer', 'Windisch', 'Bionaz', 'Braunhofer', 'Cappellari'],
  'AUT': ['Eder', 'Leitner', 'Komatz', 'Grossegger', 'Landertinger', 'Eberhard'],
  'SLO': ['Fak', 'Dovžan', 'Vidmar', 'Planko', 'Cisar', 'Trsan'],
  'CZE': ['Krčmář', 'Moravec', 'Štvrtecký', 'Karlík', 'Hornig', 'Mikyska'],
  'SUI': ['Weger', 'Hartweg', 'Stalder', 'Burkhalter', 'Finello'],
  'FIN': ['Seppälä', 'Hiidensalo', 'Harjula', 'Ranta', 'Laitinen'],
  'USA': ['Schommer', 'Brown', 'Doherty', 'Nordgren', 'Church', 'Wright'],
  'CAN': ['Chicken', 'Runnalls', 'Burnotte', 'Borglum', 'Chicken'],
  'default': ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Bauer', 'Koch']
};

// Get random name for a country
function getRandomBiathlonName(country) {
  const firstNames = biathlonFirstNames[country] || biathlonFirstNames['default'];
  const lastNames = biathlonLastNames[country] || biathlonLastNames['default'];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}

module.exports = {
  generateBiathlonCalendar,
  biathlonVenues,
  raceTypes,
  worldCupPoints,
  biathlonCountryNames,
  getRandomBiathlonName
};
