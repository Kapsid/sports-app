// Alpine Skiing World Cup Calendar Generator

const alpineVenues = [
  // Speed events venues
  { location: 'Sölden', country: 'AUT', altitude: 3040, disciplines: ['giant_slalom'] },
  { location: 'Levi', country: 'FIN', altitude: 531, disciplines: ['slalom'] },
  { location: 'Lake Louise', country: 'CAN', altitude: 1646, disciplines: ['downhill', 'super_g'] },
  { location: 'Beaver Creek', country: 'USA', altitude: 3488, disciplines: ['downhill', 'super_g', 'giant_slalom'] },
  { location: 'Val d\'Isère', country: 'FRA', altitude: 2800, disciplines: ['giant_slalom', 'slalom'] },
  { location: 'Val Gardena', country: 'ITA', altitude: 2249, disciplines: ['downhill', 'super_g'] },
  { location: 'Alta Badia', country: 'ITA', altitude: 1540, disciplines: ['giant_slalom'] },
  { location: 'Madonna di Campiglio', country: 'ITA', altitude: 1522, disciplines: ['slalom'] },
  { location: 'Bormio', country: 'ITA', altitude: 3012, disciplines: ['downhill', 'super_g'] },
  { location: 'Zagreb', country: 'CRO', altitude: 1030, disciplines: ['slalom'] },
  { location: 'Adelboden', country: 'SUI', altitude: 1560, disciplines: ['giant_slalom', 'slalom'] },
  { location: 'Wengen', country: 'SUI', altitude: 2320, disciplines: ['downhill', 'slalom', 'combined'] },
  { location: 'Kitzbühel', country: 'AUT', altitude: 1665, disciplines: ['downhill', 'super_g', 'slalom'] },
  { location: 'Schladming', country: 'AUT', altitude: 1894, disciplines: ['slalom', 'giant_slalom'] },
  { location: 'Garmisch-Partenkirchen', country: 'GER', altitude: 1940, disciplines: ['downhill', 'super_g'] },
  { location: 'Cortina d\'Ampezzo', country: 'ITA', altitude: 2930, disciplines: ['downhill', 'super_g'] },
  { location: 'Chamonix', country: 'FRA', altitude: 1877, disciplines: ['slalom', 'combined'] },
  { location: 'Kvitfjell', country: 'NOR', altitude: 1025, disciplines: ['downhill', 'super_g'] },
  { location: 'Kranjska Gora', country: 'SLO', altitude: 1215, disciplines: ['giant_slalom', 'slalom'] },
  { location: 'Are', country: 'SWE', altitude: 1274, disciplines: ['giant_slalom', 'slalom'] },
  { location: 'Saalbach', country: 'AUT', altitude: 2096, disciplines: ['downhill', 'super_g', 'slalom'] },
];

// Discipline types with their characteristics
const disciplineTypes = {
  downhill: {
    name: 'Downhill',
    shortName: 'DH',
    runs: 1,
    gates: 30,
    courseLength: 3000, // meters
    verticalDrop: 900,
    baseTime: 105, // seconds - base time for elite
    dnfRate: 0.03, // 3% DNF rate
    speedFocus: true
  },
  super_g: {
    name: 'Super-G',
    shortName: 'SG',
    runs: 1,
    gates: 35,
    courseLength: 2000,
    verticalDrop: 550,
    baseTime: 75,
    dnfRate: 0.025, // 2.5% DNF rate
    speedFocus: true
  },
  giant_slalom: {
    name: 'Giant Slalom',
    shortName: 'GS',
    runs: 2,
    gates: 55,
    courseLength: 1500,
    verticalDrop: 400,
    baseTime: 70,
    dnfRate: 0.04, // 4% per run
    speedFocus: false
  },
  slalom: {
    name: 'Slalom',
    shortName: 'SL',
    runs: 2,
    gates: 65,
    courseLength: 550,
    verticalDrop: 200,
    baseTime: 50,
    dnfRate: 0.06, // 6% per run
    speedFocus: false
  },
  combined: {
    name: 'Combined',
    shortName: 'AC',
    runs: 2, // 1 DH + 1 SL
    gates: null, // varies
    courseLength: null,
    verticalDrop: null,
    baseTime: null,
    dnfRate: 0.04, // 4% per run
    speedFocus: null,
    components: ['downhill', 'slalom']
  }
};

// World Cup points distribution (top 30)
const worldCupPoints = [
  100, 80, 60, 50, 45, 40, 36, 32, 29, 26,
  24, 22, 20, 18, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1
];

// Generate a season calendar
function generateAlpineCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Alpine World Cup calendar structure (single gender)
  const seasonStructure = [
    // Late October - Season opener at Sölden
    { venue: 0, month: 10, days: [27], races: ['giant_slalom'] },

    // November - Levi slalom
    { venue: 1, month: 11, days: [12], races: ['slalom'] },

    // Late November/December - North America speed events
    { venue: 2, month: 11, days: [25, 26], races: ['downhill', 'super_g'] },
    { venue: 3, month: 12, days: [2, 3, 4], races: ['downhill', 'super_g', 'giant_slalom'] },

    // December - Val d'Isère
    { venue: 4, month: 12, days: [9, 10], races: ['giant_slalom', 'slalom'] },

    // December - Italian speed week
    { venue: 5, month: 12, days: [15, 16], races: ['downhill', 'super_g'] },
    { venue: 6, month: 12, days: [18], races: ['giant_slalom'] },

    // Late December - Madonna slalom & Bormio speed
    { venue: 7, month: 12, days: [22], races: ['slalom'] },
    { venue: 8, month: 12, days: [28, 29], races: ['downhill', 'super_g'] },

    // January - Zagreb slalom
    { venue: 9, month: 1, days: [4], races: ['slalom'], year: endYear },

    // January - Adelboden
    { venue: 10, month: 1, days: [6, 7], races: ['giant_slalom', 'slalom'], year: endYear },

    // January - Wengen classic
    { venue: 11, month: 1, days: [12, 13, 14], races: ['combined', 'downhill', 'slalom'], year: endYear },

    // January - Kitzbühel
    { venue: 12, month: 1, days: [19, 20, 21], races: ['super_g', 'downhill', 'slalom'], year: endYear },

    // January - Schladming
    { venue: 13, month: 1, days: [26, 28], races: ['giant_slalom', 'slalom'], year: endYear },

    // February - Garmisch
    { venue: 14, month: 2, days: [1, 2], races: ['downhill', 'super_g'], year: endYear },

    // February - Cortina (World Championships location)
    { venue: 15, month: 2, days: [10, 11, 12, 14, 15], races: ['super_g', 'downhill', 'giant_slalom', 'slalom', 'combined'], year: endYear, championship: true },

    // February/March - Chamonix
    { venue: 16, month: 2, days: [23], races: ['slalom'], year: endYear },

    // March - Kvitfjell speed
    { venue: 17, month: 3, days: [1, 2], races: ['downhill', 'super_g'], year: endYear },

    // March - Kranjska Gora
    { venue: 18, month: 3, days: [8, 9], races: ['giant_slalom', 'slalom'], year: endYear },

    // March - Are
    { venue: 19, month: 3, days: [13, 14], races: ['giant_slalom', 'slalom'], year: endYear },

    // March - Finals at Saalbach
    { venue: 20, month: 3, days: [19, 20, 21, 22], races: ['downhill', 'super_g', 'giant_slalom', 'slalom'], year: endYear },
  ];

  for (const week of seasonStructure) {
    const venue = alpineVenues[week.venue];
    if (!venue) continue;

    const year = week.year || startYear;

    for (let i = 0; i < week.races.length; i++) {
      const discipline = week.races[i];
      const disciplineInfo = disciplineTypes[discipline];
      const day = week.days[i];

      calendar.push({
        id: null,
        eventIndex: eventIndex++,
        name: `${venue.location} - ${disciplineInfo.name}`,
        location: venue.location,
        country: venue.country,
        altitude: venue.altitude,
        discipline: discipline,
        runs: disciplineInfo.runs,
        date: `${year}-${String(week.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        status: 'scheduled',
        championship: week.championship || false
      });
    }
  }

  return calendar;
}

// Alpine skiing country names
const alpineCountryNames = {
  'AUT': 'Austria',
  'SUI': 'Switzerland',
  'ITA': 'Italy',
  'FRA': 'France',
  'GER': 'Germany',
  'NOR': 'Norway',
  'SWE': 'Sweden',
  'USA': 'United States',
  'CAN': 'Canada',
  'SLO': 'Slovenia',
  'CRO': 'Croatia',
  'FIN': 'Finland',
  'SVK': 'Slovakia',
  'GBR': 'Great Britain',
  'BEL': 'Belgium',
  'POL': 'Poland',
  'CZE': 'Czech Republic',
  'ESP': 'Spain',
  'AND': 'Andorra',
  'LIE': 'Liechtenstein',
};

// Alpine country-specific athlete names
const alpineFirstNames = {
  'AUT': ['Marcel', 'Marco', 'Manuel', 'Vincent', 'Johannes', 'Stefan', 'Matthias', 'Roland', 'Christian', 'Dominik'],
  'SUI': ['Marco', 'Daniel', 'Beat', 'Loic', 'Ramon', 'Justin', 'Niels', 'Gino', 'Tanguy', 'Arnaud'],
  'ITA': ['Dominik', 'Christof', 'Alex', 'Tommaso', 'Luca', 'Giuliano', 'Matteo', 'Giovanni', 'Francesco', 'Pietro'],
  'FRA': ['Alexis', 'Clement', 'Johan', 'Victor', 'Nils', 'Blaise', 'Mathieu', 'Cyprien', 'Jean-Baptiste', 'Thibaut'],
  'GER': ['Thomas', 'Josef', 'Linus', 'Alexander', 'Stefan', 'Andreas', 'Simon', 'Felix', 'Julian', 'Sebastian'],
  'NOR': ['Aleksander', 'Henrik', 'Kjetil', 'Leif', 'Sebastian', 'Lars', 'Atle', 'Adrian', 'Lucas', 'Rasmus'],
  'SWE': ['Mattias', 'Andre', 'Kristoffer', 'William', 'Axel', 'Anton', 'Victor', 'Oscar', 'Elias', 'Jonathan'],
  'USA': ['Ryan', 'Tommy', 'Steven', 'River', 'Kyle', 'Sam', 'Travis', 'Jared', 'Luke', 'Bryce'],
  'CAN': ['James', 'Cameron', 'Jeffrey', 'Broderick', 'Simon', 'Benjamin', 'Erik', 'Jack', 'Crawford', 'Kyle'],
  'SLO': ['Zan', 'Miha', 'Martin', 'Boštjan', 'Stefan', 'Tilen', 'Rok', 'Nejc', 'Luka', 'Jan'],
  'CRO': ['Filip', 'Istok', 'Samuel', 'Ivan', 'Elias', 'Matej', 'Tvrtko', 'Matija', 'Bruno', 'Ante'],
};

const alpineLastNames = {
  'AUT': ['Hirscher', 'Schwarz', 'Feller', 'Kriechmayr', 'Mayer', 'Striedinger', 'Hemetsberger', 'Franz', 'Brennsteiner', 'Raschner'],
  'SUI': ['Odermatt', 'Meillard', 'Feuz', 'Caviezel', 'Zenhäusern', 'Murisier', 'Hintermann', 'Rogentin', 'Nef', 'Aerni'],
  'ITA': ['Paris', 'Innerhofer', 'Vinatzer', 'De Aliprandini', 'Casse', 'Razzoli', 'Gross', 'Moelgg', 'Tonetti', 'Maurberger'],
  'FRA': ['Pinturault', 'Noël', 'Muffat-Jeandet', 'Faivre', 'Allegre', 'Giezendanner', 'Sarrazin', 'Muzaton', 'Roger', 'Lizeroux'],
  'GER': ['Dressen', 'Ferstl', 'Straßer', 'Schmid', 'Holzmann', 'Tremmel', 'Schwaiger', 'Stehle', 'Luitz', 'Dopfer'],
  'NOR': ['Kilde', 'Kristoffersen', 'Jansrud', 'Sejersted', 'Kildow', 'Foss-Solevaag', 'Haugan', 'Braathen', 'McGrath', 'Windingstad'],
  'SWE': ['Hargin', 'Myhrer', 'Jakobsen', 'Hector', 'Roenngren', 'Lindell', 'Westerlund', 'Hallberg', 'Bergstrom', 'Rapp'],
  'USA': ['Cochran-Siegle', 'Ford', 'Nyman', 'Radamus', 'Bennett', 'Goldberg', 'Ligety', 'Miller', 'Ganong', 'Biesemeyer'],
  'CAN': ['Crawford', 'Alexander', 'Read', 'Thompson', 'Drury', 'Frenette', 'Nennemann', 'Critchlow', 'Fisk', 'Chicken'],
  'SLO': ['Kranjec', 'Hrobat', 'Cater', 'Kline', 'Hadalin', 'Rutar', 'Kolega', 'Kotnik', 'Kuerner', 'Naralocnik'],
  'CRO': ['Zubcic', 'Vidovic', 'Rodes', 'Kolega', 'Popovic', 'Ljutic', 'Komsic', 'Kostelić', 'Pavlek', 'Zrnic'],
};

// Get a random alpine skier name
function getRandomAlpineName(country) {
  const firstNames = alpineFirstNames[country] || alpineFirstNames['AUT'];
  const lastNames = alpineLastNames[country] || alpineLastNames['AUT'];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
}

// Countries and their typical number of top skiers
const alpineCountryDistribution = {
  'AUT': 8,  // Austria - historically strongest
  'SUI': 7,  // Switzerland
  'ITA': 6,  // Italy
  'FRA': 6,  // France
  'NOR': 5,  // Norway
  'GER': 4,  // Germany
  'USA': 4,  // USA
  'SWE': 3,  // Sweden
  'CAN': 3,  // Canada
  'SLO': 3,  // Slovenia
  'CRO': 2,  // Croatia (strong in slalom)
  'FIN': 2,  // Finland
  'SVK': 2,  // Slovakia
  'GBR': 1,  // Great Britain
  'BEL': 1,  // Belgium
};

module.exports = {
  alpineVenues,
  disciplineTypes,
  worldCupPoints,
  generateAlpineCalendar,
  alpineCountryNames,
  getRandomAlpineName,
  alpineCountryDistribution
};
