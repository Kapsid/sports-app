// Speed Skating World Cup Calendar Generator

// World Cup venues with altitudes (affects times - higher altitude = faster)
const venues = [
  { location: 'Salt Lake City', country: 'USA', altitude: 1425 },
  { location: 'Calgary', country: 'CAN', altitude: 1034 },
  { location: 'Heerenveen', country: 'NED', altitude: 0 },
  { location: 'Nagano', country: 'JPN', altitude: 375 },
  { location: 'Inzell', country: 'GER', altitude: 690 },
  { location: 'Hamar', country: 'NOR', altitude: 128 },
  { location: 'Beijing', country: 'CHN', altitude: 50 },
  { location: 'Stavanger', country: 'NOR', altitude: 0 },
  { location: 'Tomaszow Mazowiecki', country: 'POL', altitude: 200 },
  { location: 'Erfurt', country: 'GER', altitude: 200 },
];

// Distance types with base times (for elite level, in seconds)
const distances = {
  500: { name: '500m', laps: 1.25, baseTime: 34.5, category: 'sprint' },
  1000: { name: '1000m', laps: 2.5, baseTime: 68, category: 'sprint' },
  1500: { name: '1500m', laps: 3.75, baseTime: 105, category: 'middle' },
  3000: { name: '3000m', laps: 7.5, baseTime: 230, category: 'long' },
  5000: { name: '5000m', laps: 12.5, baseTime: 390, category: 'long' },
  10000: { name: '10000m', laps: 25, baseTime: 780, category: 'long' }
};

// World Cup points (top 20)
const worldCupPoints = [
  100, 80, 60, 50, 45, 40, 36, 32, 29, 26,
  24, 22, 20, 18, 16, 15, 14, 13, 12, 11
];

// Country names - comprehensive list
const countryNames = {
  // Speed skating nations
  'NED': 'Netherlands',
  'NOR': 'Norway',
  'JPN': 'Japan',
  'USA': 'United States',
  'CAN': 'Canada',
  'GER': 'Germany',
  'KOR': 'South Korea',
  'CHN': 'China',
  'RUS': 'Russia',
  'POL': 'Poland',
  'ITA': 'Italy',
  'AUT': 'Austria',
  'SWE': 'Sweden',
  'BEL': 'Belgium',
  'CZE': 'Czech Republic',
  'KAZ': 'Kazakhstan',
  'FRA': 'France',
  'SUI': 'Switzerland',
  'FIN': 'Finland',
  'GBR': 'Great Britain',
  // All other nations
  'SLO': 'Slovenia',
  'EST': 'Estonia',
  'BUL': 'Bulgaria',
  'ROU': 'Romania',
  'TUR': 'Turkey',
  'AFG': 'Afghanistan',
  'ALB': 'Albania',
  'ALG': 'Algeria',
  'AND': 'Andorra',
  'ANG': 'Angola',
  'ANT': 'Antigua and Barbuda',
  'ARG': 'Argentina',
  'ARM': 'Armenia',
  'AUS': 'Australia',
  'AZE': 'Azerbaijan',
  'BAH': 'Bahamas',
  'BRN': 'Bahrain',
  'BAN': 'Bangladesh',
  'BAR': 'Barbados',
  'BLR': 'Belarus',
  'BIZ': 'Belize',
  'BEN': 'Benin',
  'BHU': 'Bhutan',
  'BOL': 'Bolivia',
  'BIH': 'Bosnia and Herzegovina',
  'BOT': 'Botswana',
  'BRA': 'Brazil',
  'BRU': 'Brunei',
  'BUR': 'Burkina Faso',
  'BDI': 'Burundi',
  'CPV': 'Cabo Verde',
  'CAM': 'Cambodia',
  'CMR': 'Cameroon',
  'CAF': 'Central African Republic',
  'CHA': 'Chad',
  'CHI': 'Chile',
  'COL': 'Colombia',
  'COM': 'Comoros',
  'CGO': 'Congo',
  'COD': 'DR Congo',
  'CRC': 'Costa Rica',
  'CIV': 'Côte d\'Ivoire',
  'CRO': 'Croatia',
  'CUB': 'Cuba',
  'CYP': 'Cyprus',
  'DEN': 'Denmark',
  'DJI': 'Djibouti',
  'DMA': 'Dominica',
  'DOM': 'Dominican Republic',
  'ECU': 'Ecuador',
  'EGY': 'Egypt',
  'ESA': 'El Salvador',
  'GEQ': 'Equatorial Guinea',
  'ERI': 'Eritrea',
  'SWZ': 'Eswatini',
  'ETH': 'Ethiopia',
  'FIJ': 'Fiji',
  'GAB': 'Gabon',
  'GAM': 'Gambia',
  'GEO': 'Georgia',
  'GHA': 'Ghana',
  'GRE': 'Greece',
  'GRN': 'Grenada',
  'GUA': 'Guatemala',
  'GUI': 'Guinea',
  'GBS': 'Guinea-Bissau',
  'GUY': 'Guyana',
  'HAI': 'Haiti',
  'HON': 'Honduras',
  'HKG': 'Hong Kong',
  'HUN': 'Hungary',
  'ISL': 'Iceland',
  'IND': 'India',
  'INA': 'Indonesia',
  'IRI': 'Iran',
  'IRQ': 'Iraq',
  'IRL': 'Ireland',
  'ISR': 'Israel',
  'JAM': 'Jamaica',
  'JOR': 'Jordan',
  'KEN': 'Kenya',
  'PRK': 'North Korea',
  'KUW': 'Kuwait',
  'KGZ': 'Kyrgyzstan',
  'LAO': 'Laos',
  'LAT': 'Latvia',
  'LBN': 'Lebanon',
  'LES': 'Lesotho',
  'LBR': 'Liberia',
  'LBA': 'Libya',
  'LIE': 'Liechtenstein',
  'LTU': 'Lithuania',
  'LUX': 'Luxembourg',
  'MAD': 'Madagascar',
  'MAW': 'Malawi',
  'MAS': 'Malaysia',
  'MDV': 'Maldives',
  'MLI': 'Mali',
  'MLT': 'Malta',
  'MTN': 'Mauritania',
  'MRI': 'Mauritius',
  'MEX': 'Mexico',
  'MDA': 'Moldova',
  'MON': 'Monaco',
  'MGL': 'Mongolia',
  'MNE': 'Montenegro',
  'MAR': 'Morocco',
  'MOZ': 'Mozambique',
  'MYA': 'Myanmar',
  'NAM': 'Namibia',
  'NEP': 'Nepal',
  'NZL': 'New Zealand',
  'NCA': 'Nicaragua',
  'NIG': 'Niger',
  'NGR': 'Nigeria',
  'MKD': 'North Macedonia',
  'OMA': 'Oman',
  'PAK': 'Pakistan',
  'PLE': 'Palestine',
  'PAN': 'Panama',
  'PNG': 'Papua New Guinea',
  'PAR': 'Paraguay',
  'PER': 'Peru',
  'PHI': 'Philippines',
  'POR': 'Portugal',
  'PUR': 'Puerto Rico',
  'QAT': 'Qatar',
  'KOS': 'Kosovo',
  'RWA': 'Rwanda',
  'SKN': 'Saint Kitts and Nevis',
  'LCA': 'Saint Lucia',
  'VIN': 'Saint Vincent and the Grenadines',
  'SAM': 'Samoa',
  'SMR': 'San Marino',
  'STP': 'São Tomé and Príncipe',
  'KSA': 'Saudi Arabia',
  'SEN': 'Senegal',
  'SRB': 'Serbia',
  'SEY': 'Seychelles',
  'SLE': 'Sierra Leone',
  'SGP': 'Singapore',
  'SVK': 'Slovakia',
  'RSA': 'South Africa',
  'SSD': 'South Sudan',
  'ESP': 'Spain',
  'SRI': 'Sri Lanka',
  'SUD': 'Sudan',
  'SUR': 'Suriname',
  'SYR': 'Syria',
  'TPE': 'Taiwan',
  'TJK': 'Tajikistan',
  'TAN': 'Tanzania',
  'THA': 'Thailand',
  'TLS': 'Timor-Leste',
  'TOG': 'Togo',
  'TGA': 'Tonga',
  'TTO': 'Trinidad and Tobago',
  'TUN': 'Tunisia',
  'TKM': 'Turkmenistan',
  'UGA': 'Uganda',
  'UKR': 'Ukraine',
  'UAE': 'United Arab Emirates',
  'URU': 'Uruguay',
  'UZB': 'Uzbekistan',
  'VAN': 'Vanuatu',
  'VEN': 'Venezuela',
  'VIE': 'Vietnam',
  'YEM': 'Yemen',
  'ZAM': 'Zambia',
  'ZIM': 'Zimbabwe'
};

// Country distribution for generating skaters (top nations have more)
const countryDistribution = {
  'NED': 8,  // Netherlands - strongest nation
  'NOR': 5,
  'JPN': 5,
  'USA': 4,
  'CAN': 4,
  'GER': 4,
  'KOR': 3,
  'CHN': 3,
  'RUS': 3,
  'POL': 2,
  'ITA': 2,
  'AUT': 2,
  'SWE': 2,
  'BEL': 1,
  'CZE': 1,
  'KAZ': 1,
};

// First names by country for generating skaters
const firstNamesByCountry = {
  'NED': ['Jutta', 'Ireen', 'Sven', 'Kjeld', 'Thomas', 'Patrick', 'Koen', 'Hein', 'Jorrit', 'Kai'],
  'NOR': ['Sverre', 'Havard', 'Allan', 'Henrik', 'Sindre', 'Ragne', 'Ida', 'Julie'],
  'JPN': ['Nao', 'Miho', 'Yuma', 'Tatsuya', 'Shota', 'Fumiya', 'Ryosuke', 'Yamato'],
  'USA': ['Joey', 'Brittany', 'Mitchell', 'Casey', 'Erin', 'Emery', 'Jordan'],
  'CAN': ['Ted-Jan', 'Laurent', 'Connor', 'Graeme', 'Alex', 'Ivanie', 'Isabelle'],
  'GER': ['Nico', 'Felix', 'Patrick', 'Claudia', 'Roxanne', 'Michelle', 'Joel'],
  'KOR': ['Min-Seok', 'Jun-Ho', 'Sang-Hwa', 'Bo-Reum', 'Seung-Hoon', 'Hyeong-Jun'],
  'CHN': ['Ning', 'Gao', 'Han', 'Yang', 'Sun', 'Zhongyan', 'Tingyu'],
  'RUS': ['Pavel', 'Viktor', 'Olga', 'Natalia', 'Denis', 'Ruslan', 'Artem'],
  'POL': ['Artur', 'Piotr', 'Zbigniew', 'Marek', 'Luiza', 'Natalia'],
  'ITA': ['Davide', 'Mirko', 'Andrea', 'Francesca', 'Giulia', 'Nicola'],
  'AUT': ['Vanessa', 'Gabriel', 'Michael', 'Anna', 'Thomas'],
  'SWE': ['Nils', 'David', 'Erik', 'Johanna', 'Anna'],
  'BEL': ['Bart', 'Mathias', 'Sandrine'],
  'CZE': ['Martina', 'Karolina', 'Nikola'],
  'KAZ': ['Denis', 'Roman', 'Yekaterina'],
};

// Last names by country
const lastNamesByCountry = {
  'NED': ['Kramer', 'Leerdam', 'Wust', 'Nuis', 'Roest', 'Krol', 'Bergsma', 'Verweij', 'de Jong', 'Verbij'],
  'NOR': ['Lorentzen', 'Pedersen', 'Wiklund', 'Engebråten', 'Henriksen', 'Bjørgen'],
  'JPN': ['Takagi', 'Kodaira', 'Mori', 'Shimizu', 'Tsuchiya', 'Yamazaki', 'Sato'],
  'USA': ['Mantia', 'Bowe', 'Whitmore', 'Jackson', 'Lehman', 'Denny'],
  'CAN': ['Bloemen', 'Dubreuil', 'Fong', 'Fish', 'Howe', 'Weidemann'],
  'GER': ['Ihle', 'Beckert', 'Pechstein', 'Geisreiter', 'Dufter', 'Herzog'],
  'KOR': ['Kim', 'Lee', 'Chung', 'Park', 'Cha', 'Jung'],
  'CHN': ['Gao', 'Han', 'Ning', 'Yang', 'Sun', 'Zhang'],
  'RUS': ['Kulizhnikov', 'Yuskov', 'Graf', 'Fatkulina', 'Voronina'],
  'POL': ['Brodka', 'Waś', 'Bródka', 'Czerwonka', 'Wojciechowski'],
  'ITA': ['Ghiotto', 'Giovannini', 'Lollobrigida', 'Tumolero'],
  'AUT': ['Herzog', 'Maier', 'Reiter', 'Baumgartner'],
  'SWE': ['van der Poel', 'Eriksson', 'Lindberg', 'Nilsson'],
  'BEL': ['Swings', 'Vanhoutte', 'Desmet'],
  'CZE': ['Sablikova', 'Erbanová', 'Zdráhalová'],
  'KAZ': ['Aidova', 'Kuzin', 'Yekaterina'],
};

// Generate a season calendar
function generateSpeedSkatingCalendar(startYear) {
  const endYear = startYear + 1;
  const calendar = [];
  let eventIndex = 0;

  // Season structure: 8 World Cup weekends with multiple distances each
  const seasonStructure = [
    // November - Season opener
    { venue: 2, month: 11, day: 10, distances: [500, 1500, 5000] }, // Heerenveen
    { venue: 2, month: 11, day: 11, distances: [1000, 3000] },
    { venue: 8, month: 11, day: 17, distances: [500, 1500] }, // Tomaszow
    { venue: 8, month: 11, day: 18, distances: [1000, 5000] },

    // December
    { venue: 0, month: 12, day: 1, distances: [500, 1500, 5000] }, // Salt Lake City
    { venue: 0, month: 12, day: 2, distances: [1000, 3000, 10000] },
    { venue: 1, month: 12, day: 8, distances: [500, 1500] }, // Calgary
    { venue: 1, month: 12, day: 9, distances: [1000, 5000] },
    { venue: 3, month: 12, day: 15, distances: [500, 1500, 3000] }, // Nagano
    { venue: 3, month: 12, day: 16, distances: [1000, 5000] },

    // January
    { venue: 5, month: 1, day: 12, year: endYear, distances: [500, 1500, 5000] }, // Hamar
    { venue: 5, month: 1, day: 13, year: endYear, distances: [1000, 3000, 10000] },
    { venue: 4, month: 1, day: 19, year: endYear, distances: [500, 1500] }, // Inzell
    { venue: 4, month: 1, day: 20, year: endYear, distances: [1000, 5000] },
    { venue: 2, month: 1, day: 26, year: endYear, distances: [500, 1500, 3000] }, // Heerenveen (World Champs prep)
    { venue: 2, month: 1, day: 27, year: endYear, distances: [1000, 5000, 10000] },

    // February - Finals
    { venue: 6, month: 2, day: 9, year: endYear, distances: [500, 1500, 5000] }, // Beijing
    { venue: 6, month: 2, day: 10, year: endYear, distances: [1000, 3000, 10000] },
    { venue: 0, month: 2, day: 16, year: endYear, distances: [500, 1500, 5000] }, // Salt Lake City Finals
    { venue: 0, month: 2, day: 17, year: endYear, distances: [1000, 3000, 10000] },
  ];

  for (const eventDay of seasonStructure) {
    const venue = venues[eventDay.venue];
    const year = eventDay.year || startYear;

    for (const distance of eventDay.distances) {
      const distanceInfo = distances[distance];
      calendar.push({
        id: null,
        eventIndex: eventIndex++,
        name: `${venue.location} - ${distanceInfo.name}`,
        location: venue.location,
        country: venue.country,
        altitude: venue.altitude,
        distance: distance,
        date: `${year}-${String(eventDay.month).padStart(2, '0')}-${String(eventDay.day).padStart(2, '0')}`,
        status: 'scheduled'
      });
    }
  }

  return calendar;
}

// Generate a random skater name for a country
function getRandomSkaterName(country) {
  const firstNames = firstNamesByCountry[country] || ['Alex', 'Jordan', 'Sam'];
  const lastNames = lastNamesByCountry[country] || ['Smith', 'Johnson', 'Williams'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { firstName, lastName };
}

// Generate specialty based on skills
function getSpecialty(acceleration, endurance) {
  if (acceleration >= 80 && endurance < 70) return 'sprinter';
  if (endurance >= 80 && acceleration < 70) return 'distance';
  return 'all-round';
}

module.exports = {
  venues,
  distances,
  worldCupPoints,
  countryNames,
  countryDistribution,
  generateSpeedSkatingCalendar,
  getRandomSkaterName,
  getSpecialty
};
