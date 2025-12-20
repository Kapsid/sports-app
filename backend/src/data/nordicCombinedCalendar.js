// Nordic Combined World Cup Calendar Generator

// World Cup points distribution (same as other sports)
const worldCupPoints = [
  100, 80, 60, 50, 45, 40, 36, 32, 29, 26,
  24, 22, 20, 18, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// Nordic Combined event types
const eventTypes = {
  individual_normal: { name: 'Individual Gundersen NH', hillSize: 'normal', kPoint: 98, xcDistance: 10 },
  individual_large: { name: 'Individual Gundersen LH', hillSize: 'large', kPoint: 120, xcDistance: 10 },
  compact: { name: 'Compact', hillSize: 'normal', kPoint: 98, xcDistance: 7.5 },
  mass_start: { name: 'Mass Start', hillSize: 'large', kPoint: 120, xcDistance: 10 }
};

// Nordic Combined World Cup venues with country codes (IOC format)
const venues = [
  { location: 'Ruka', country: 'FIN', hillSize: 'large', kPoint: 120 },
  { location: 'Lillehammer', country: 'NOR', hillSize: 'large', kPoint: 120 },
  { location: 'Ramsau', country: 'AUT', hillSize: 'normal', kPoint: 98 },
  { location: 'Val di Fiemme', country: 'ITA', hillSize: 'large', kPoint: 120 },
  { location: 'Otepaa', country: 'EST', hillSize: 'normal', kPoint: 98 },
  { location: 'Seefeld', country: 'AUT', hillSize: 'normal', kPoint: 98 },
  { location: 'Klingenthal', country: 'GER', hillSize: 'large', kPoint: 125 },
  { location: 'Chaux-Neuve', country: 'FRA', hillSize: 'large', kPoint: 118 },
  { location: 'Lahti', country: 'FIN', hillSize: 'large', kPoint: 116 },
  { location: 'Oslo', country: 'NOR', hillSize: 'large', kPoint: 117 },
  { location: 'Trondheim', country: 'NOR', hillSize: 'large', kPoint: 120 },
  { location: 'Schonach', country: 'GER', hillSize: 'normal', kPoint: 96 }
];

// Generate a season calendar
function generateNordicCombinedCalendar(yearStart, yearEnd) {
  const events = [];
  let eventIndex = 0;

  // November - Season start
  events.push({
    event_index: eventIndex++,
    name: `${venues[0].location} - Individual Gundersen LH`,
    location: venues[0].location,
    country: venues[0].country,
    hill_size: venues[0].hillSize,
    k_point: venues[0].kPoint,
    xc_distance: 10,
    date: `${yearStart}-11-24`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[0].location} - Compact`,
    location: venues[0].location,
    country: venues[0].country,
    hill_size: 'normal',
    k_point: 98,
    xc_distance: 7.5,
    date: `${yearStart}-11-25`,
    event_type: 'compact'
  });

  // December
  events.push({
    event_index: eventIndex++,
    name: `${venues[1].location} - Individual Gundersen LH`,
    location: venues[1].location,
    country: venues[1].country,
    hill_size: venues[1].hillSize,
    k_point: venues[1].kPoint,
    xc_distance: 10,
    date: `${yearStart}-12-01`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[1].location} - Individual Gundersen LH`,
    location: venues[1].location,
    country: venues[1].country,
    hill_size: venues[1].hillSize,
    k_point: venues[1].kPoint,
    xc_distance: 10,
    date: `${yearStart}-12-02`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[2].location} - Individual Gundersen NH`,
    location: venues[2].location,
    country: venues[2].country,
    hill_size: venues[2].hillSize,
    k_point: venues[2].kPoint,
    xc_distance: 10,
    date: `${yearStart}-12-15`,
    event_type: 'individual_normal'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[2].location} - Individual Gundersen NH`,
    location: venues[2].location,
    country: venues[2].country,
    hill_size: venues[2].hillSize,
    k_point: venues[2].kPoint,
    xc_distance: 10,
    date: `${yearStart}-12-16`,
    event_type: 'individual_normal'
  });

  // January
  events.push({
    event_index: eventIndex++,
    name: `${venues[3].location} - Individual Gundersen LH`,
    location: venues[3].location,
    country: venues[3].country,
    hill_size: venues[3].hillSize,
    k_point: venues[3].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-01-05`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[3].location} - Compact`,
    location: venues[3].location,
    country: venues[3].country,
    hill_size: 'normal',
    k_point: 98,
    xc_distance: 7.5,
    date: `${yearEnd}-01-06`,
    event_type: 'compact'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[4].location} - Individual Gundersen NH`,
    location: venues[4].location,
    country: venues[4].country,
    hill_size: venues[4].hillSize,
    k_point: venues[4].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-01-12`,
    event_type: 'individual_normal'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[4].location} - Individual Gundersen NH`,
    location: venues[4].location,
    country: venues[4].country,
    hill_size: venues[4].hillSize,
    k_point: venues[4].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-01-13`,
    event_type: 'individual_normal'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[5].location} - Individual Gundersen NH`,
    location: venues[5].location,
    country: venues[5].country,
    hill_size: venues[5].hillSize,
    k_point: venues[5].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-01-26`,
    event_type: 'individual_normal'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[5].location} - Mass Start`,
    location: venues[5].location,
    country: venues[5].country,
    hill_size: 'large',
    k_point: 109,
    xc_distance: 10,
    date: `${yearEnd}-01-27`,
    event_type: 'mass_start'
  });

  // February
  events.push({
    event_index: eventIndex++,
    name: `${venues[6].location} - Individual Gundersen LH`,
    location: venues[6].location,
    country: venues[6].country,
    hill_size: venues[6].hillSize,
    k_point: venues[6].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-02-02`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[6].location} - Individual Gundersen LH`,
    location: venues[6].location,
    country: venues[6].country,
    hill_size: venues[6].hillSize,
    k_point: venues[6].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-02-03`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[7].location} - Individual Gundersen LH`,
    location: venues[7].location,
    country: venues[7].country,
    hill_size: venues[7].hillSize,
    k_point: venues[7].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-02-09`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[7].location} - Individual Gundersen LH`,
    location: venues[7].location,
    country: venues[7].country,
    hill_size: venues[7].hillSize,
    k_point: venues[7].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-02-10`,
    event_type: 'individual_large'
  });

  // March
  events.push({
    event_index: eventIndex++,
    name: `${venues[8].location} - Individual Gundersen LH`,
    location: venues[8].location,
    country: venues[8].country,
    hill_size: venues[8].hillSize,
    k_point: venues[8].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-03-01`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[8].location} - Compact`,
    location: venues[8].location,
    country: venues[8].country,
    hill_size: 'normal',
    k_point: 98,
    xc_distance: 7.5,
    date: `${yearEnd}-03-02`,
    event_type: 'compact'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[9].location} - Individual Gundersen LH`,
    location: venues[9].location,
    country: venues[9].country,
    hill_size: venues[9].hillSize,
    k_point: venues[9].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-03-08`,
    event_type: 'individual_large'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[9].location} - Individual Gundersen LH`,
    location: venues[9].location,
    country: venues[9].country,
    hill_size: venues[9].hillSize,
    k_point: venues[9].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-03-09`,
    event_type: 'individual_large'
  });

  // Season finale
  events.push({
    event_index: eventIndex++,
    name: `${venues[11].location} - Individual Gundersen NH`,
    location: venues[11].location,
    country: venues[11].country,
    hill_size: venues[11].hillSize,
    k_point: venues[11].kPoint,
    xc_distance: 10,
    date: `${yearEnd}-03-15`,
    event_type: 'individual_normal'
  });

  events.push({
    event_index: eventIndex++,
    name: `${venues[11].location} - Mass Start`,
    location: venues[11].location,
    country: venues[11].country,
    hill_size: 'large',
    k_point: 106,
    xc_distance: 10,
    date: `${yearEnd}-03-16`,
    event_type: 'mass_start'
  });

  return events;
}

// Random names for Nordic Combined athletes
const firstNames = [
  'Johannes', 'Jarl', 'Jens', 'Vinzenz', 'Mario', 'Franz', 'Lukas', 'Eric',
  'Julian', 'Manuel', 'Stefan', 'Akito', 'Ryota', 'Ilkka', 'Eero', 'Magnus',
  'Kristjan', 'Laurent', 'Antoine', 'Alessandro', 'Martin', 'Tobias', 'Fabian'
];

const lastNames = [
  'Lamparter', 'Riiber', 'Graabak', 'Geiger', 'Seidl', 'Muhlethaler', 'Faisst',
  'Oftebro', 'Watabe', 'Herola', 'Hirvonen', 'Schmid', 'Grond', 'Jouve',
  'Nagai', 'Buzzi', 'Riessle', 'Weber', 'Gruber', 'Rydzek', 'Frenzel', 'Pittin'
];

function getRandomNordicCombinedName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
}

module.exports = {
  worldCupPoints,
  eventTypes,
  venues,
  generateNordicCombinedCalendar,
  getRandomNordicCombinedName
};
