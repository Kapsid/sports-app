// Real Ski Jumping World Cup Calendar (based on typical season)
// Only individual competitions, no team events

const worldCupCalendar = [
  // November - Season Start
  { location: 'Wisla', country: 'POL', hillSize: 'LH', kPoint: 134, month: 11, day: 17 },
  { location: 'Ruka', country: 'FIN', hillSize: 'LH', kPoint: 142, month: 11, day: 24 },
  { location: 'Ruka', country: 'FIN', hillSize: 'LH', kPoint: 142, month: 11, day: 25 },

  // December
  { location: 'Lillehammer', country: 'NOR', hillSize: 'LH', kPoint: 140, month: 12, day: 8 },
  { location: 'Lillehammer', country: 'NOR', hillSize: 'LH', kPoint: 140, month: 12, day: 9 },
  { location: 'Titisee-Neustadt', country: 'GER', hillSize: 'LH', kPoint: 142, month: 12, day: 15 },
  { location: 'Titisee-Neustadt', country: 'GER', hillSize: 'LH', kPoint: 142, month: 12, day: 16 },
  { location: 'Engelberg', country: 'SUI', hillSize: 'LH', kPoint: 137, month: 12, day: 22 },
  { location: 'Engelberg', country: 'SUI', hillSize: 'LH', kPoint: 137, month: 12, day: 23 },

  // Four Hills Tournament (late Dec - early Jan)
  { location: 'Oberstdorf', country: 'GER', hillSize: 'LH', kPoint: 137, month: 12, day: 29, tournament: 'Four Hills' },
  { location: 'Garmisch-Partenkirchen', country: 'GER', hillSize: 'LH', kPoint: 142, month: 1, day: 1, tournament: 'Four Hills' },
  { location: 'Innsbruck', country: 'AUT', hillSize: 'LH', kPoint: 128, month: 1, day: 4, tournament: 'Four Hills' },
  { location: 'Bischofshofen', country: 'AUT', hillSize: 'LH', kPoint: 142, month: 1, day: 6, tournament: 'Four Hills' },

  // January
  { location: 'Zakopane', country: 'POL', hillSize: 'LH', kPoint: 134, month: 1, day: 13 },
  { location: 'Zakopane', country: 'POL', hillSize: 'LH', kPoint: 134, month: 1, day: 14 },
  { location: 'Sapporo', country: 'JPN', hillSize: 'LH', kPoint: 137, month: 1, day: 20 },
  { location: 'Sapporo', country: 'JPN', hillSize: 'LH', kPoint: 137, month: 1, day: 21 },

  // Ski Flying Week
  { location: 'Oberstdorf', country: 'GER', hillSize: 'FH', kPoint: 225, month: 1, day: 27, skiFlying: true },
  { location: 'Oberstdorf', country: 'GER', hillSize: 'FH', kPoint: 225, month: 1, day: 28, skiFlying: true },

  // February
  { location: 'Willingen', country: 'GER', hillSize: 'LH', kPoint: 145, month: 2, day: 3 },
  { location: 'Willingen', country: 'GER', hillSize: 'LH', kPoint: 145, month: 2, day: 4 },
  { location: 'Lake Placid', country: 'USA', hillSize: 'LH', kPoint: 128, month: 2, day: 10 },
  { location: 'Lake Placid', country: 'USA', hillSize: 'LH', kPoint: 128, month: 2, day: 11 },
  { location: 'Lahti', country: 'FIN', hillSize: 'LH', kPoint: 130, month: 2, day: 24 },
  { location: 'Lahti', country: 'FIN', hillSize: 'LH', kPoint: 130, month: 2, day: 25 },

  // March
  { location: 'Oslo', country: 'NOR', hillSize: 'LH', kPoint: 134, month: 3, day: 9 },
  { location: 'Oslo', country: 'NOR', hillSize: 'LH', kPoint: 134, month: 3, day: 10 },
  { location: 'Trondheim', country: 'NOR', hillSize: 'LH', kPoint: 140, month: 3, day: 14 },
  { location: 'Vikersund', country: 'NOR', hillSize: 'FH', kPoint: 240, month: 3, day: 16, skiFlying: true },
  { location: 'Vikersund', country: 'NOR', hillSize: 'FH', kPoint: 240, month: 3, day: 17, skiFlying: true },

  // Planica Finale
  { location: 'Planica', country: 'SLO', hillSize: 'FH', kPoint: 240, month: 3, day: 22, skiFlying: true },
  { location: 'Planica', country: 'SLO', hillSize: 'FH', kPoint: 240, month: 3, day: 23, skiFlying: true },
  { location: 'Planica', country: 'SLO', hillSize: 'FH', kPoint: 240, month: 3, day: 24, skiFlying: true },
];

// World Cup points system (top 30)
const worldCupPoints = {
  1: 100, 2: 80, 3: 60, 4: 50, 5: 45,
  6: 40, 7: 36, 8: 32, 9: 29, 10: 26,
  11: 24, 12: 22, 13: 20, 14: 18, 15: 16,
  16: 15, 17: 14, 18: 13, 19: 12, 20: 11,
  21: 10, 22: 9, 23: 8, 24: 7, 25: 6,
  26: 5, 27: 4, 28: 3, 29: 2, 30: 1
};

// Generate calendar for a specific season (year_start/year_end)
function generateSeasonCalendar(yearStart, yearEnd) {
  return worldCupCalendar.map((event, index) => {
    const year = event.month >= 11 ? yearStart : yearEnd;
    const date = `${year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`;

    let name = event.location;
    if (event.tournament) {
      name = `${event.tournament} - ${event.location}`;
    }
    if (event.skiFlying) {
      name = `${event.location} (Ski Flying)`;
    }

    return {
      eventIndex: index,
      name,
      location: event.location,
      country: event.country,
      hillSize: event.hillSize,
      kPoint: event.kPoint,
      date,
      skiFlying: event.skiFlying || false,
      tournament: event.tournament || null
    };
  });
}

module.exports = {
  worldCupCalendar,
  worldCupPoints,
  generateSeasonCalendar
};
