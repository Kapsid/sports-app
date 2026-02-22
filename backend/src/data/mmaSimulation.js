// MMA Weight Classes (in kg)
const WEIGHT_CLASSES = {
  men: [
    { weight: 52, name: 'Strawweight' },
    { weight: 57, name: 'Flyweight' },
    { weight: 61, name: 'Bantamweight' },
    { weight: 66, name: 'Featherweight' },
    { weight: 70, name: 'Lightweight' },
    { weight: 77, name: 'Welterweight' },
    { weight: 84, name: 'Middleweight' },
    { weight: 93, name: 'Light Heavyweight' },
    { weight: 120, name: 'Heavyweight' }
  ],
  women: [
    { weight: 52, name: 'Strawweight' },
    { weight: 57, name: 'Flyweight' },
    { weight: 61, name: 'Bantamweight' },
    { weight: 66, name: 'Featherweight' }
  ]
};

// Cities pool for events (200+)
const CITIES = [
  // USA
  { city: 'Las Vegas', country: 'USA' },
  { city: 'New York', country: 'USA' },
  { city: 'Los Angeles', country: 'USA' },
  { city: 'Chicago', country: 'USA' },
  { city: 'Miami', country: 'USA' },
  { city: 'Atlanta', country: 'USA' },
  { city: 'Denver', country: 'USA' },
  { city: 'Houston', country: 'USA' },
  { city: 'Seattle', country: 'USA' },
  { city: 'Boston', country: 'USA' },
  { city: 'Philadelphia', country: 'USA' },
  { city: 'Dallas', country: 'USA' },
  { city: 'Phoenix', country: 'USA' },
  { city: 'San Antonio', country: 'USA' },
  { city: 'Jacksonville', country: 'USA' },
  { city: 'San Francisco', country: 'USA' },
  { city: 'Columbus', country: 'USA' },
  { city: 'Indianapolis', country: 'USA' },
  { city: 'Charlotte', country: 'USA' },
  { city: 'Detroit', country: 'USA' },
  { city: 'Nashville', country: 'USA' },
  { city: 'Portland', country: 'USA' },
  { city: 'Memphis', country: 'USA' },
  { city: 'Oklahoma City', country: 'USA' },
  { city: 'Baltimore', country: 'USA' },
  { city: 'Milwaukee', country: 'USA' },
  { city: 'Sacramento', country: 'USA' },
  { city: 'Kansas City', country: 'USA' },
  { city: 'Cleveland', country: 'USA' },
  { city: 'Tampa', country: 'USA' },
  { city: 'Orlando', country: 'USA' },
  { city: 'Pittsburgh', country: 'USA' },
  { city: 'Raleigh', country: 'USA' },
  { city: 'Minneapolis', country: 'USA' },
  { city: 'San Diego', country: 'USA' },
  { city: 'St. Louis', country: 'USA' },
  { city: 'New Orleans', country: 'USA' },
  { city: 'Salt Lake City', country: 'USA' },
  { city: 'Atlantic City', country: 'USA' },
  // Canada
  { city: 'Toronto', country: 'Canada' },
  { city: 'Montreal', country: 'Canada' },
  { city: 'Vancouver', country: 'Canada' },
  { city: 'Calgary', country: 'Canada' },
  { city: 'Edmonton', country: 'Canada' },
  { city: 'Ottawa', country: 'Canada' },
  // UK & Ireland
  { city: 'London', country: 'UK' },
  { city: 'Manchester', country: 'UK' },
  { city: 'Birmingham', country: 'UK' },
  { city: 'Glasgow', country: 'UK' },
  { city: 'Liverpool', country: 'UK' },
  { city: 'Leeds', country: 'UK' },
  { city: 'Dublin', country: 'Ireland' },
  { city: 'Belfast', country: 'UK' },
  { city: 'Edinburgh', country: 'UK' },
  // Europe
  { city: 'Paris', country: 'France' },
  { city: 'Lyon', country: 'France' },
  { city: 'Marseille', country: 'France' },
  { city: 'Madrid', country: 'Spain' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Munich', country: 'Germany' },
  { city: 'Hamburg', country: 'Germany' },
  { city: 'Frankfurt', country: 'Germany' },
  { city: 'Cologne', country: 'Germany' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Rotterdam', country: 'Netherlands' },
  { city: 'Brussels', country: 'Belgium' },
  { city: 'Vienna', country: 'Austria' },
  { city: 'Zurich', country: 'Switzerland' },
  { city: 'Stockholm', country: 'Sweden' },
  { city: 'Copenhagen', country: 'Denmark' },
  { city: 'Oslo', country: 'Norway' },
  { city: 'Helsinki', country: 'Finland' },
  { city: 'Warsaw', country: 'Poland' },
  { city: 'Krakow', country: 'Poland' },
  { city: 'Prague', country: 'Czech Republic' },
  { city: 'Budapest', country: 'Hungary' },
  { city: 'Bucharest', country: 'Romania' },
  { city: 'Sofia', country: 'Bulgaria' },
  { city: 'Belgrade', country: 'Serbia' },
  { city: 'Zagreb', country: 'Croatia' },
  { city: 'Athens', country: 'Greece' },
  { city: 'Rome', country: 'Italy' },
  { city: 'Milan', country: 'Italy' },
  { city: 'Naples', country: 'Italy' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Porto', country: 'Portugal' },
  // Middle East
  { city: 'Abu Dhabi', country: 'UAE' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Riyadh', country: 'Saudi Arabia' },
  { city: 'Jeddah', country: 'Saudi Arabia' },
  { city: 'Doha', country: 'Qatar' },
  { city: 'Kuwait City', country: 'Kuwait' },
  { city: 'Manama', country: 'Bahrain' },
  { city: 'Tel Aviv', country: 'Israel' },
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Ankara', country: 'Turkey' },
  // Asia
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Osaka', country: 'Japan' },
  { city: 'Nagoya', country: 'Japan' },
  { city: 'Sapporo', country: 'Japan' },
  { city: 'Yokohama', country: 'Japan' },
  { city: 'Seoul', country: 'South Korea' },
  { city: 'Busan', country: 'South Korea' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Jakarta', country: 'Indonesia' },
  { city: 'Manila', country: 'Philippines' },
  { city: 'Ho Chi Minh City', country: 'Vietnam' },
  { city: 'Hanoi', country: 'Vietnam' },
  { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Hong Kong', country: 'Hong Kong' },
  { city: 'Macau', country: 'Macau' },
  { city: 'Taipei', country: 'Taiwan' },
  { city: 'Shanghai', country: 'China' },
  { city: 'Beijing', country: 'China' },
  { city: 'Guangzhou', country: 'China' },
  { city: 'Shenzhen', country: 'China' },
  { city: 'Chengdu', country: 'China' },
  { city: 'Mumbai', country: 'India' },
  { city: 'Delhi', country: 'India' },
  { city: 'Bangalore', country: 'India' },
  { city: 'Chennai', country: 'India' },
  { city: 'Kolkata', country: 'India' },
  // Oceania
  { city: 'Sydney', country: 'Australia' },
  { city: 'Melbourne', country: 'Australia' },
  { city: 'Brisbane', country: 'Australia' },
  { city: 'Perth', country: 'Australia' },
  { city: 'Adelaide', country: 'Australia' },
  { city: 'Auckland', country: 'New Zealand' },
  { city: 'Wellington', country: 'New Zealand' },
  // South America
  { city: 'Sao Paulo', country: 'Brazil' },
  { city: 'Rio de Janeiro', country: 'Brazil' },
  { city: 'Brasilia', country: 'Brazil' },
  { city: 'Curitiba', country: 'Brazil' },
  { city: 'Fortaleza', country: 'Brazil' },
  { city: 'Buenos Aires', country: 'Argentina' },
  { city: 'Cordoba', country: 'Argentina' },
  { city: 'Santiago', country: 'Chile' },
  { city: 'Lima', country: 'Peru' },
  { city: 'Bogota', country: 'Colombia' },
  { city: 'Medellin', country: 'Colombia' },
  // Mexico & Central America
  { city: 'Mexico City', country: 'Mexico' },
  { city: 'Guadalajara', country: 'Mexico' },
  { city: 'Monterrey', country: 'Mexico' },
  { city: 'Cancun', country: 'Mexico' },
  { city: 'Tijuana', country: 'Mexico' },
  { city: 'Panama City', country: 'Panama' },
  // Africa
  { city: 'Johannesburg', country: 'South Africa' },
  { city: 'Cape Town', country: 'South Africa' },
  { city: 'Lagos', country: 'Nigeria' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Casablanca', country: 'Morocco' },
  { city: 'Marrakech', country: 'Morocco' },
  // Russia & Central Asia
  { city: 'Moscow', country: 'Russia' },
  { city: 'St. Petersburg', country: 'Russia' },
  { city: 'Sochi', country: 'Russia' },
  { city: 'Almaty', country: 'Kazakhstan' },
  { city: 'Astana', country: 'Kazakhstan' },
  { city: 'Tashkent', country: 'Uzbekistan' }
];

// Event themes (100+ unique themes with colors)
const EVENT_THEMES = [
  // Skulls & Death
  { name: 'Skull Crusher', color: '#1a1a1a' },
  { name: 'Death Dealer', color: '#2d2d2d' },
  { name: 'Grim Reaper', color: '#1f1f1f' },
  { name: 'Soul Collector', color: '#0d0d0d' },
  { name: 'Bone Breaker', color: '#3d3d3d' },
  // Fire & Heat
  { name: 'Inferno', color: '#dc2626' },
  { name: 'Blazing Fury', color: '#ef4444' },
  { name: 'Hellfire', color: '#b91c1c' },
  { name: 'Scorched Earth', color: '#9a3412' },
  { name: 'Burning Rage', color: '#c2410c' },
  { name: 'Phoenix Rising', color: '#f97316' },
  { name: 'Molten Core', color: '#ea580c' },
  // Ice & Cold
  { name: 'Frozen Fury', color: '#0ea5e9' },
  { name: 'Arctic Assault', color: '#0284c7' },
  { name: 'Blizzard', color: '#0369a1' },
  { name: 'Ice Storm', color: '#0891b2' },
  { name: 'Frostbite', color: '#06b6d4' },
  { name: 'Avalanche', color: '#22d3ee' },
  // Blood & War
  { name: 'Blood Sport', color: '#7f1d1d' },
  { name: 'War Zone', color: '#991b1b' },
  { name: 'Battleground', color: '#b91c1c' },
  { name: 'Warpath', color: '#dc2626' },
  { name: 'Blood Moon', color: '#7c2d12' },
  { name: 'Crimson Tide', color: '#be123c' },
  // Thunder & Lightning
  { name: 'Thunder Dome', color: '#4f46e5' },
  { name: 'Lightning Strike', color: '#6366f1' },
  { name: 'Storm Surge', color: '#818cf8' },
  { name: 'Electric Showdown', color: '#a78bfa' },
  { name: 'Voltage', color: '#8b5cf6' },
  // Animals & Beasts
  { name: 'Wolf Pack', color: '#57534e' },
  { name: 'Lion\'s Den', color: '#d97706' },
  { name: 'Shark Tank', color: '#0c4a6e' },
  { name: 'Viper Strike', color: '#16a34a' },
  { name: 'Dragon\'s Lair', color: '#dc2626' },
  { name: 'Tiger Claw', color: '#f59e0b' },
  { name: 'Bear Pit', color: '#78350f' },
  { name: 'Eagle Eye', color: '#1e3a8a' },
  { name: 'Scorpion Sting', color: '#facc15' },
  { name: 'Cobra Strike', color: '#15803d' },
  { name: 'Rhino Charge', color: '#525252' },
  { name: 'Panther Prowl', color: '#171717' },
  // Night & Darkness
  { name: 'Midnight Mayhem', color: '#0f172a' },
  { name: 'Dark Side', color: '#1e1b4b' },
  { name: 'Shadow Realm', color: '#27272a' },
  { name: 'Nightmare', color: '#18181b' },
  { name: 'Black Out', color: '#09090b' },
  { name: 'Twilight Zone', color: '#3730a3' },
  // Metals & Materials
  { name: 'Iron Fist', color: '#71717a' },
  { name: 'Steel Cage', color: '#a1a1aa' },
  { name: 'Golden Era', color: '#ca8a04' },
  { name: 'Silver Lining', color: '#d4d4d8' },
  { name: 'Bronze Age', color: '#a16207' },
  { name: 'Platinum', color: '#e4e4e7' },
  { name: 'Titanium', color: '#52525b' },
  { name: 'Chrome', color: '#e5e7eb' },
  // Destruction
  { name: 'Demolition', color: '#f97316' },
  { name: 'Annihilation', color: '#dc2626' },
  { name: 'Devastation', color: '#b91c1c' },
  { name: 'Carnage', color: '#7f1d1d' },
  { name: 'Chaos Theory', color: '#7c3aed' },
  { name: 'Total Destruction', color: '#991b1b' },
  { name: 'Wrecking Ball', color: '#404040' },
  // Victory & Glory
  { name: 'Road to Glory', color: '#fbbf24' },
  { name: 'Champions Collide', color: '#f59e0b' },
  { name: 'Victory Lane', color: '#eab308' },
  { name: 'Hall of Fame', color: '#ca8a04' },
  { name: 'Legend Killer', color: '#a16207' },
  { name: 'Title Hunt', color: '#d97706' },
  // Nature & Elements
  { name: 'Earthquake', color: '#78350f' },
  { name: 'Tsunami', color: '#0c4a6e' },
  { name: 'Wildfire', color: '#ea580c' },
  { name: 'Tornado Alley', color: '#64748b' },
  { name: 'Hurricane', color: '#0369a1' },
  { name: 'Volcanic', color: '#c2410c' },
  { name: 'Sandstorm', color: '#d4a276' },
  { name: 'Jungle Warfare', color: '#166534' },
  // Combat & Martial Arts
  { name: 'Knockout Kings', color: '#dc2626' },
  { name: 'Submission Sunday', color: '#7c3aed' },
  { name: 'Ground Game', color: '#854d0e' },
  { name: 'Stand and Bang', color: '#ef4444' },
  { name: 'Clash of Titans', color: '#1e40af' },
  { name: 'Fight Night', color: '#1f2937' },
  { name: 'Main Event', color: '#dc2626' },
  { name: 'War Machine', color: '#52525b' },
  // Revenge & Rivalry
  { name: 'Vendetta', color: '#7f1d1d' },
  { name: 'Grudge Match', color: '#991b1b' },
  { name: 'Bad Blood', color: '#450a0a' },
  { name: 'Rivalry Renewed', color: '#b91c1c' },
  { name: 'Payback', color: '#dc2626' },
  { name: 'Retribution', color: '#7c2d12' },
  // Speed & Power
  { name: 'Full Throttle', color: '#f97316' },
  { name: 'Maximum Impact', color: '#dc2626' },
  { name: 'Overdrive', color: '#ea580c' },
  { name: 'Power Surge', color: '#4f46e5' },
  { name: 'Turbo', color: '#3b82f6' },
  { name: 'Rampage', color: '#b91c1c' },
  // Misc Intense
  { name: 'No Mercy', color: '#111827' },
  { name: 'Unstoppable', color: '#dc2626' },
  { name: 'Unbreakable', color: '#1e3a8a' },
  { name: 'Savage', color: '#7f1d1d' },
  { name: 'Relentless', color: '#0f172a' },
  { name: 'Ruthless', color: '#27272a' },
  { name: 'Fearless', color: '#1e40af' },
  { name: 'Invincible', color: '#7c3aed' },
  { name: 'Immortal', color: '#6d28d9' },
  { name: 'Resurrection', color: '#059669' },
  // Colors themed
  { name: 'Code Red', color: '#dc2626' },
  { name: 'Code Black', color: '#0a0a0a' },
  { name: 'Whiteout', color: '#f5f5f5' },
  { name: 'Green Machine', color: '#16a34a' },
  { name: 'Purple Reign', color: '#9333ea' },
  { name: 'Orange Crush', color: '#ea580c' },
  { name: 'Blue Steel', color: '#2563eb' }
];

// Venue name templates
const VENUE_TYPES = [
  'Arena', 'Stadium', 'Center', 'Dome', 'Garden', 'Coliseum',
  'Pavilion', 'Hall', 'Complex', 'Fieldhouse'
];

const VENUE_PREFIXES = [
  'T-Mobile', 'Crypto.com', 'State Farm', 'Capital One', 'United',
  'American Airlines', 'Barclays', 'Staples', 'Madison Square', 'TD',
  'Chase', 'Wells Fargo', 'Bank of America', 'Prudential', 'Enterprise',
  'Little Caesars', 'Vivint', 'Climate Pledge', 'PPG Paints', 'Fiserv',
  'Nationwide', 'Scotiabank', 'Rogers', 'Bell', 'Air Canada',
  'Mercedes-Benz', 'O2', 'Accor', 'Etihad', 'Flash Forum'
];

// Fight methods
const METHODS = {
  ko: ['KO', 'TKO (Punches)', 'TKO (Kicks)', 'TKO (Elbows)', 'TKO (Ground and Pound)', 'TKO (Doctor Stoppage)', 'TKO (Corner Stoppage)'],
  sub: ['Rear Naked Choke', 'Guillotine Choke', 'Arm Triangle', 'Triangle Choke', 'Armbar', 'Kimura', 'Americana', 'Heel Hook', 'Kneebar', 'D\'Arce Choke', 'Anaconda Choke', 'Ezekiel Choke', 'Mounted Triangle', 'Neck Crank'],
  dec: ['Unanimous Decision', 'Split Decision', 'Majority Decision'],
  other: ['Draw', 'No Contest', 'DQ']
};

// Get weight class name
function getWeightClassName(weight, gender = 'men') {
  const classes = WEIGHT_CLASSES[gender] || WEIGHT_CLASSES.men;
  const wc = classes.find(c => c.weight === weight);
  return wc ? wc.name : `${weight} kg`;
}

// Get all weight classes for a gender
function getWeightClasses(gender = 'men') {
  return WEIGHT_CLASSES[gender] || WEIGHT_CLASSES.men;
}

// Get random city
function getRandomCity() {
  return CITIES[Math.floor(Math.random() * CITIES.length)];
}

// Get random event theme
function getRandomTheme() {
  return EVENT_THEMES[Math.floor(Math.random() * EVENT_THEMES.length)];
}

// Generate venue name
function generateVenueName(city) {
  const usePrefix = Math.random() > 0.3;
  const type = VENUE_TYPES[Math.floor(Math.random() * VENUE_TYPES.length)];

  if (usePrefix) {
    const prefix = VENUE_PREFIXES[Math.floor(Math.random() * VENUE_PREFIXES.length)];
    return `${prefix} ${type}`;
  }
  return `${city} ${type}`;
}

// Calculate fighter overall rating
function getFighterOverall(fighter) {
  return Math.round((fighter.striking + fighter.grappling + fighter.wrestling + fighter.cardio + fighter.chin + fighter.power) / 6);
}

// Strike commentary templates
const STRIKE_COMMENTARY = {
  jab: ['lands a crisp jab', 'connects with a stiff jab', 'pops the jab', 'fires a quick jab'],
  cross: ['lands a powerful cross', 'connects with the right hand', 'lands a straight right', 'fires the cross down the pipe'],
  hook: ['lands a vicious hook', 'connects with a left hook', 'catches them with a hook', 'lands a looping hook'],
  uppercut: ['lands a devastating uppercut', 'connects with an uppercut', 'drives an uppercut through'],
  kick: ['lands a nasty leg kick', 'chops the lead leg', 'lands a body kick', 'connects with a head kick'],
  knee: ['lands a crushing knee', 'drives a knee to the body', 'lands a flying knee'],
  elbow: ['lands a slicing elbow', 'opens them up with an elbow', 'connects with a spinning elbow']
};

const GRAPPLING_COMMENTARY = {
  takedown: ['scores a beautiful takedown', 'gets the takedown', 'takes them down', 'shoots and scores', 'completes the double leg', 'hits a single leg takedown', 'gets a body lock takedown'],
  defend: ['stuffs the takedown', 'defends the shot', 'sprawls beautifully', 'stays on the feet'],
  groundControl: ['maintaining top position', 'in full mount', 'working from side control', 'in half guard', 'looking for ground and pound'],
  submission: ['looking for the submission', 'threatening with a choke', 'hunting for the armbar', 'working for the finish']
};

const MOMENTUM_COMMENTARY = {
  f1Dominant: [
    'completely outclassing the opponent',
    'putting on a masterclass',
    'in total control',
    'dominating every exchange'
  ],
  f2Dominant: [
    'turning the tide dramatically',
    'taking over the fight',
    'imposing their will',
    'seizing control'
  ],
  backAndForth: [
    'What a battle!',
    'This is anyone\'s fight!',
    'Trading heavy leather!',
    'Neither fighter giving an inch!'
  ],
  hurt: [
    'is badly hurt!',
    'is in serious trouble!',
    'looks wobbly!',
    'is on unsteady legs!'
  ]
};

const ROUND_START_COMMENTARY = [
  'Both fighters touch gloves and we\'re underway',
  'The round begins with both fighters circling',
  'Here we go! Both fighters feeling each other out',
  'The action resumes with intense focus from both corners'
];

const FINISH_COMMENTARY = {
  ko: [
    'IT\'S ALL OVER! What a knockout!',
    'LIGHTS OUT! An incredible finish!',
    'DOWN GOES THE FIGHTER! That\'s it!',
    'DEVASTATING! The referee has seen enough!'
  ],
  tko: [
    'The referee steps in to stop the fight!',
    'The corner throws in the towel!',
    'Mercy stoppage by the referee!',
    'The doctor calls a halt to the bout!'
  ],
  sub: [
    'TAP! TAP! TAP! It\'s over by submission!',
    'The tap comes! Beautiful technique!',
    'Forced to submit! What a finish!',
    'No choice but to tap! Incredible grappling!'
  ]
};

// Simulate a single round with detailed commentary
function simulateRound(fighter1, fighter2, roundNum, totalRounds, f1Damage, f2Damage) {
  const events = [];
  let f1Score = 10;
  let f2Score = 10;
  let finish = null;

  const f1Name = `${fighter1.first_name} ${fighter1.last_name}`;
  const f2Name = `${fighter2.first_name} ${fighter2.last_name}`;

  // Round start commentary
  events.push(ROUND_START_COMMENTARY[Math.floor(Math.random() * ROUND_START_COMMENTARY.length)]);

  // Cardio degradation
  const f1Cardio = Math.max(30, fighter1.cardio - (roundNum - 1) * 8 - f1Damage * 0.3);
  const f2Cardio = Math.max(30, fighter2.cardio - (roundNum - 1) * 8 - f2Damage * 0.3);

  // Calculate round advantage
  const f1StrikingAdv = (fighter1.striking - fighter2.striking) / 100 + (f1Cardio - f2Cardio) / 200;
  const f1GrapplingAdv = (fighter1.grappling + fighter1.wrestling - fighter2.grappling - fighter2.wrestling) / 200;

  // Determine fight style this round
  const grappleChance = (fighter1.wrestling + fighter2.wrestling) / 200 * 0.4;
  const isGrapplingRound = Math.random() < grappleChance;

  // Strike counts
  let f1Strikes = Math.floor(20 + Math.random() * 30 + f1StrikingAdv * 20);
  let f2Strikes = Math.floor(20 + Math.random() * 30 - f1StrikingAdv * 20);
  let f1SigStrikes = Math.floor(f1Strikes * (0.3 + Math.random() * 0.2));
  let f2SigStrikes = Math.floor(f2Strikes * (0.3 + Math.random() * 0.2));

  // Add detailed striking commentary for BOTH fighters
  const strikeTypes = Object.keys(STRIKE_COMMENTARY);

  // Fighter 1 strikes
  const f1StrikeType = strikeTypes[Math.floor(Math.random() * strikeTypes.length)];
  const f1Comment = STRIKE_COMMENTARY[f1StrikeType][Math.floor(Math.random() * STRIKE_COMMENTARY[f1StrikeType].length)];
  events.push(`${f1Name} ${f1Comment}!`);

  // Fighter 2 responds
  const f2StrikeType = strikeTypes[Math.floor(Math.random() * strikeTypes.length)];
  const f2Comment = STRIKE_COMMENTARY[f2StrikeType][Math.floor(Math.random() * STRIKE_COMMENTARY[f2StrikeType].length)];
  events.push(`${f2Name} ${f2Comment}!`);

  // Add momentum commentary based on who's winning
  if (f1SigStrikes > f2SigStrikes + 5) {
    const strikeType2 = strikeTypes[Math.floor(Math.random() * strikeTypes.length)];
    const comment2 = STRIKE_COMMENTARY[strikeType2][Math.floor(Math.random() * STRIKE_COMMENTARY[strikeType2].length)];
    events.push(`${f1Name} ${comment2}! Building momentum!`);
  } else if (f2SigStrikes > f1SigStrikes + 5) {
    const strikeType2 = strikeTypes[Math.floor(Math.random() * strikeTypes.length)];
    const comment2 = STRIKE_COMMENTARY[strikeType2][Math.floor(Math.random() * STRIKE_COMMENTARY[strikeType2].length)];
    events.push(`${f2Name} ${comment2}! Building momentum!`);
  } else {
    events.push(MOMENTUM_COMMENTARY.backAndForth[Math.floor(Math.random() * MOMENTUM_COMMENTARY.backAndForth.length)]);
  }

  // Takedowns
  let f1Takedowns = 0;
  let f2Takedowns = 0;
  let f1TdAttempts = 0;
  let f2TdAttempts = 0;

  if (isGrapplingRound || Math.random() < 0.3) {
    f1TdAttempts = Math.floor(Math.random() * 3) + 1;
    f2TdAttempts = Math.floor(Math.random() * 3) + 1;
    const f1TdRate = 0.3 + (fighter1.wrestling / 200) + (f1GrapplingAdv * 0.3);
    const f2TdRate = 0.3 + (fighter2.wrestling / 200) - (f1GrapplingAdv * 0.3);
    f1Takedowns = Math.floor(f1TdAttempts * Math.min(1, Math.max(0, f1TdRate)));
    f2Takedowns = Math.floor(f2TdAttempts * Math.min(1, Math.max(0, f2TdRate)));

    // Takedown commentary for Fighter 1 attempt
    if (f1TdAttempts > 0) {
      if (f1Takedowns > 0) {
        const tdComment = GRAPPLING_COMMENTARY.takedown[Math.floor(Math.random() * GRAPPLING_COMMENTARY.takedown.length)];
        events.push(`${f1Name} ${tdComment}!`);
        const gcComment = GRAPPLING_COMMENTARY.groundControl[Math.floor(Math.random() * GRAPPLING_COMMENTARY.groundControl.length)];
        events.push(`${f1Name} ${gcComment}`);
      } else {
        events.push(`${f1Name} shoots for a takedown!`);
        const defComment = GRAPPLING_COMMENTARY.defend[Math.floor(Math.random() * GRAPPLING_COMMENTARY.defend.length)];
        events.push(`${f2Name} ${defComment}!`);
      }
    }

    // Takedown commentary for Fighter 2 attempt
    if (f2TdAttempts > 0) {
      if (f2Takedowns > 0) {
        const tdComment = GRAPPLING_COMMENTARY.takedown[Math.floor(Math.random() * GRAPPLING_COMMENTARY.takedown.length)];
        events.push(`${f2Name} ${tdComment}!`);
        const gcComment = GRAPPLING_COMMENTARY.groundControl[Math.floor(Math.random() * GRAPPLING_COMMENTARY.groundControl.length)];
        events.push(`${f2Name} ${gcComment}`);
      } else {
        events.push(`${f2Name} shoots for a takedown!`);
        const defComment = GRAPPLING_COMMENTARY.defend[Math.floor(Math.random() * GRAPPLING_COMMENTARY.defend.length)];
        events.push(`${f1Name} ${defComment}!`);
      }
    }
  }

  // Submission attempts
  let f1SubAttempts = 0;
  let f2SubAttempts = 0;
  if (f1Takedowns > 0 || f2Takedowns > 0) {
    f1SubAttempts = f1Takedowns > 0 && Math.random() < 0.5 ? 1 : 0;
    f2SubAttempts = f2Takedowns > 0 && Math.random() < 0.5 ? 1 : 0;

    if (f1SubAttempts > 0) {
      const subComment = GRAPPLING_COMMENTARY.submission[Math.floor(Math.random() * GRAPPLING_COMMENTARY.submission.length)];
      events.push(`${f1Name} ${subComment}!`);
    }
    if (f2SubAttempts > 0) {
      const subComment = GRAPPLING_COMMENTARY.submission[Math.floor(Math.random() * GRAPPLING_COMMENTARY.submission.length)];
      events.push(`${f2Name} ${subComment}!`);
    }
  }

  // Check for KO finish
  const f1KOChance = (fighter1.power / 100) * (0.08 + f1StrikingAdv * 0.05) * (1 - fighter2.chin / 150);
  const f2KOChance = (fighter2.power / 100) * (0.08 - f1StrikingAdv * 0.05) * (1 - fighter1.chin / 150);

  // Later rounds more likely for KO due to damage
  const koMultiplier = 1.2 + (f1Damage + f2Damage) / 150 + (roundNum / totalRounds) * 0.8;

  if (Math.random() < f1KOChance * koMultiplier) {
    const time = `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const method = METHODS.ko[Math.floor(Math.random() * METHODS.ko.length)];
    finish = { winner: 1, method, round: roundNum, time };

    // Add hurt commentary before finish
    const hurtComment = MOMENTUM_COMMENTARY.hurt[Math.floor(Math.random() * MOMENTUM_COMMENTARY.hurt.length)];
    events.push(`${f2Name} ${hurtComment}`);

    const finishComment = method.includes('TKO')
      ? FINISH_COMMENTARY.tko[Math.floor(Math.random() * FINISH_COMMENTARY.tko.length)]
      : FINISH_COMMENTARY.ko[Math.floor(Math.random() * FINISH_COMMENTARY.ko.length)];
    events.push(finishComment);
    events.push(`${f1Name} wins by ${method} at ${time} of Round ${roundNum}!`);
  } else if (Math.random() < f2KOChance * koMultiplier) {
    const time = `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const method = METHODS.ko[Math.floor(Math.random() * METHODS.ko.length)];
    finish = { winner: 2, method, round: roundNum, time };

    const hurtComment = MOMENTUM_COMMENTARY.hurt[Math.floor(Math.random() * MOMENTUM_COMMENTARY.hurt.length)];
    events.push(`${f1Name} ${hurtComment}`);

    const finishComment = method.includes('TKO')
      ? FINISH_COMMENTARY.tko[Math.floor(Math.random() * FINISH_COMMENTARY.tko.length)]
      : FINISH_COMMENTARY.ko[Math.floor(Math.random() * FINISH_COMMENTARY.ko.length)];
    events.push(finishComment);
    events.push(`${f2Name} wins by ${method} at ${time} of Round ${roundNum}!`);
  }

  // Check for submission finish (if no KO)
  if (!finish && (f1SubAttempts > 0 || f2SubAttempts > 0)) {
    const f1SubChance = f1SubAttempts * (fighter1.grappling / 100) * 0.28;
    const f2SubChance = f2SubAttempts * (fighter2.grappling / 100) * 0.28;

    if (Math.random() < f1SubChance) {
      const time = `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      const method = METHODS.sub[Math.floor(Math.random() * METHODS.sub.length)];
      finish = { winner: 1, method, round: roundNum, time };
      const finishComment = FINISH_COMMENTARY.sub[Math.floor(Math.random() * FINISH_COMMENTARY.sub.length)];
      events.push(finishComment);
      events.push(`${f1Name} wins by ${method} at ${time} of Round ${roundNum}!`);
    } else if (Math.random() < f2SubChance) {
      const time = `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      const method = METHODS.sub[Math.floor(Math.random() * METHODS.sub.length)];
      finish = { winner: 2, method, round: roundNum, time };
      const finishComment = FINISH_COMMENTARY.sub[Math.floor(Math.random() * FINISH_COMMENTARY.sub.length)];
      events.push(finishComment);
      events.push(`${f2Name} wins by ${method} at ${time} of Round ${roundNum}!`);
    }
  }

  // Calculate round score - NO 10-10 rounds allowed, one fighter must win
  if (!finish) {
    const f1Advantage = f1SigStrikes - f2SigStrikes + (f1Takedowns - f2Takedowns) * 3;

    // Determine round winner - if tied, randomly assign slight edge
    let roundAdvantage = f1Advantage;
    if (roundAdvantage === 0) {
      // Tiebreaker: random with slight bias based on overall stats
      roundAdvantage = Math.random() > 0.5 ? 1 : -1;
    }

    if (roundAdvantage > 0) {
      // Fighter 1 wins the round
      f2Score = 9;
      if (roundAdvantage > 20) f2Score = 8;
    } else {
      // Fighter 2 wins the round
      f1Score = 9;
      if (roundAdvantage < -20) f1Score = 8;
    }

    // Add end of round summary with detailed analysis
    if (f1Score > f2Score) {
      if (f1Score - f2Score >= 2) {
        events.push(`Dominant round for ${f1Name}! Complete control.`);
      } else {
        events.push(`${f1Name} edges the round with effective offense.`);
      }
    } else {
      if (f2Score - f1Score >= 2) {
        events.push(`Dominant round for ${f2Name}! Complete control.`);
      } else {
        events.push(`${f2Name} edges the round with effective offense.`);
      }
    }

    // Add damage commentary if applicable
    if (f1Damage > 30 || f2Damage > 30) {
      if (f1Damage > f2Damage + 10) {
        events.push(`${f1Name} showing signs of damage but still fighting hard.`);
      } else if (f2Damage > f1Damage + 10) {
        events.push(`${f2Name} showing signs of damage but still fighting hard.`);
      }
    }

    events.push(`Round ${roundNum} Score: ${f1Score}-${f2Score}`);
  }

  // Calculate damage accumulated
  const f1NewDamage = f2SigStrikes * 0.5 + f2Takedowns * 2;
  const f2NewDamage = f1SigStrikes * 0.5 + f1Takedowns * 2;

  return {
    roundNum,
    f1Score,
    f2Score,
    f1Strikes,
    f2Strikes,
    f1SigStrikes,
    f2SigStrikes,
    f1Takedowns,
    f2Takedowns,
    f1TdAttempts: f1TdAttempts || 0,
    f2TdAttempts: f2TdAttempts || 0,
    f1SubAttempts,
    f2SubAttempts,
    finish,
    events,
    f1NewDamage,
    f2NewDamage
  };
}

// Simulate full fight
function simulateFight(fighter1, fighter2, isTitle = false, detailed = false) {
  const rounds = isTitle ? 5 : 3;
  const roundResults = [];
  let f1TotalScore = 0;
  let f2TotalScore = 0;
  let f1Damage = 0;
  let f2Damage = 0;
  let finish = null;

  // Total stats
  const stats = {
    f1Strikes: 0, f2Strikes: 0,
    f1SigStrikes: 0, f2SigStrikes: 0,
    f1Takedowns: 0, f2Takedowns: 0,
    f1SubAttempts: 0, f2SubAttempts: 0
  };

  for (let r = 1; r <= rounds; r++) {
    const roundResult = simulateRound(fighter1, fighter2, r, rounds, f1Damage, f2Damage);
    roundResults.push(roundResult);

    f1TotalScore += roundResult.f1Score;
    f2TotalScore += roundResult.f2Score;
    f1Damage += roundResult.f1NewDamage;
    f2Damage += roundResult.f2NewDamage;

    stats.f1Strikes += roundResult.f1Strikes;
    stats.f2Strikes += roundResult.f2Strikes;
    stats.f1SigStrikes += roundResult.f1SigStrikes;
    stats.f2SigStrikes += roundResult.f2SigStrikes;
    stats.f1Takedowns += roundResult.f1Takedowns;
    stats.f2Takedowns += roundResult.f2Takedowns;
    stats.f1SubAttempts += roundResult.f1SubAttempts;
    stats.f2SubAttempts += roundResult.f2SubAttempts;

    if (roundResult.finish) {
      finish = roundResult.finish;
      break;
    }
  }

  // Determine winner
  let winnerId, method, round, time;

  if (finish) {
    winnerId = finish.winner === 1 ? fighter1.id : fighter2.id;
    method = finish.method;
    round = finish.round;
    time = finish.time;
  } else {
    // Decision
    if (f1TotalScore > f2TotalScore) {
      winnerId = fighter1.id;
    } else if (f2TotalScore > f1TotalScore) {
      winnerId = fighter2.id;
    } else {
      // Draw is rare, usually give it to one fighter
      winnerId = Math.random() > 0.5 ? fighter1.id : fighter2.id;
    }

    const scoreDiff = Math.abs(f1TotalScore - f2TotalScore);
    if (scoreDiff >= 3) {
      method = 'Unanimous Decision';
    } else if (scoreDiff >= 2) {
      method = Math.random() > 0.5 ? 'Unanimous Decision' : 'Split Decision';
    } else {
      method = Math.random() > 0.7 ? 'Split Decision' : 'Majority Decision';
    }
    round = rounds;
    time = '5:00';
  }

  const result = {
    winnerId,
    method,
    round,
    time,
    stats: {
      fighter1: {
        strikes: stats.f1Strikes,
        sigStrikes: stats.f1SigStrikes,
        takedowns: stats.f1Takedowns,
        subAttempts: stats.f1SubAttempts,
        score: f1TotalScore
      },
      fighter2: {
        strikes: stats.f2Strikes,
        sigStrikes: stats.f2SigStrikes,
        takedowns: stats.f2Takedowns,
        subAttempts: stats.f2SubAttempts,
        score: f2TotalScore
      }
    }
  };

  if (detailed) {
    result.rounds = roundResults;
  }

  return result;
}

// Matchmaking - create fight card
// IMPORTANT: Champions can ONLY fight in title fights
function createFightCard(fighters, eventCount) {
  // Group fighters by weight class and gender
  const divisions = {};

  for (const fighter of fighters) {
    if (fighter.status !== 'active') continue;
    const key = `${fighter.gender}_${fighter.weight_class}`;
    if (!divisions[key]) {
      divisions[key] = [];
    }
    divisions[key].push(fighter);
  }

  // Sort each division by ranking
  for (const key of Object.keys(divisions)) {
    divisions[key].sort((a, b) => a.ranking - b.ranking);
  }

  const fights = [];
  const usedFighters = new Set();

  // Helper to find a matchup (excludeChampions: if true, champions cannot be matched in non-title fights)
  function findMatchup(divisionKey, ranked = false, excludeChampions = true) {
    const pool = divisions[divisionKey];
    if (!pool || pool.length < 2) return null;

    // Filter out used fighters AND champions (since champions can only fight in title fights)
    let available = pool.filter(f => !usedFighters.has(f.id));
    if (excludeChampions) {
      available = available.filter(f => !f.is_champion);
    }
    if (available.length < 2) return null;

    if (ranked) {
      // Match top ranked fighters (excluding champions)
      const fighter1 = available[0];
      const fighter2 = available.find(f =>
        f.id !== fighter1.id &&
        Math.abs(f.ranking - fighter1.ranking) <= 5
      ) || available[1];

      if (fighter1 && fighter2) {
        usedFighters.add(fighter1.id);
        usedFighters.add(fighter2.id);
        return { fighter1, fighter2 };
      }
    } else {
      // Random matchup from lower ranked (excluding champions)
      const lowerRanked = available.filter(f => f.ranking > 5);
      if (lowerRanked.length >= 2) {
        const idx1 = Math.floor(Math.random() * lowerRanked.length);
        const fighter1 = lowerRanked[idx1];
        const remaining = lowerRanked.filter(f => f.id !== fighter1.id);
        const idx2 = Math.floor(Math.random() * remaining.length);
        const fighter2 = remaining[idx2];

        usedFighters.add(fighter1.id);
        usedFighters.add(fighter2.id);
        return { fighter1, fighter2 };
      }
    }

    return null;
  }

  // Get all division keys with enough fighters
  const viableDivisions = Object.keys(divisions).filter(k => divisions[k].length >= 2);

  if (viableDivisions.length === 0) return { fights: [], mainEvent: null };

  // Title fights after 3 events
  const canHaveTitleFights = eventCount >= 3;

  // Find divisions needing title fights (champion defense or vacant title)
  const titleFightDivisions = [];
  if (canHaveTitleFights) {
    for (const divKey of viableDivisions) {
      const pool = divisions[divKey];
      const hasChampion = pool.some(f => f.is_champion);
      const topTwo = pool.filter(f => !usedFighters.has(f.id)).slice(0, 2);

      if (topTwo.length >= 2) {
        if (hasChampion) {
          // Champion defense
          const champ = topTwo.find(f => f.is_champion);
          const contender = topTwo.find(f => !f.is_champion);
          if (champ && contender) {
            titleFightDivisions.push({ divKey, fighter1: champ, fighter2: contender, vacant: false });
          }
        } else {
          // Vacant title - #1 vs #2
          titleFightDivisions.push({ divKey, fighter1: topTwo[0], fighter2: topTwo[1], vacant: true });
        }
      }
    }
  }

  // Schedule 0-2 title fights per event (random chance, not guaranteed)
  // 30% chance: 0 title fights, 50% chance: 1 title fight, 20% chance: 2 title fights
  const titleRoll = Math.random();
  let maxTitleFights = 0;
  if (titleRoll > 0.3) maxTitleFights = 1;
  if (titleRoll > 0.8) maxTitleFights = 2;

  const titleFightsToBook = Math.min(titleFightDivisions.length, maxTitleFights);
  const shuffledTitleFights = titleFightDivisions.sort(() => Math.random() - 0.5);

  let mainEvent = null;

  for (let i = 0; i < titleFightsToBook; i++) {
    const titleFight = shuffledTitleFights[i];
    usedFighters.add(titleFight.fighter1.id);
    usedFighters.add(titleFight.fighter2.id);

    // Main event (first title fight) gets highest order (1000), others get 100+
    const fightOrder = (i === 0) ? 1000 : 100 + i;

    const fight = {
      fighter1: titleFight.fighter1,
      fighter2: titleFight.fighter2,
      cardPosition: 'main',
      fightOrder: fightOrder,
      isTitle: true,
      isVacant: titleFight.vacant,
      weightClass: titleFight.fighter1.weight_class
    };

    fights.push(fight);

    // First title fight is the main event
    if (i === 0) {
      mainEvent = fight;
    }
  }

  // Main card: 4-5 fights (ranked fighters, excluding champions)
  const mainCardTarget = 4 + Math.floor(Math.random() * 2) - fights.length;
  for (let i = 0; i < mainCardTarget && viableDivisions.length > 0; i++) {
    const divKey = viableDivisions[Math.floor(Math.random() * viableDivisions.length)];
    const matchup = findMatchup(divKey, true, true); // excludeChampions = true
    if (matchup) {
      // If no title fight yet, first main card fight becomes the main event with highest order
      const isMainEvent = !mainEvent && i === 0;
      const fightOrder = isMainEvent ? 1000 : mainCardTarget - i;

      const fight = {
        ...matchup,
        cardPosition: 'main',
        fightOrder: fightOrder,
        isTitle: false,
        weightClass: matchup.fighter1.weight_class
      };
      fights.push(fight);

      if (isMainEvent) {
        mainEvent = fight;
      }
    }
  }

  // Prelims: 3-4 fights (lower ranked, excluding champions)
  const prelimTarget = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < prelimTarget && viableDivisions.length > 0; i++) {
    const divKey = viableDivisions[Math.floor(Math.random() * viableDivisions.length)];
    const matchup = findMatchup(divKey, false, true); // excludeChampions = true
    if (matchup) {
      fights.push({
        ...matchup,
        cardPosition: 'prelim',
        fightOrder: prelimTarget - i,
        isTitle: false,
        weightClass: matchup.fighter1.weight_class
      });
    }
  }

  return { fights, mainEvent };
}

// Calculate P4P (Pound-for-Pound) rankings
function calculateP4PRankings(fighters) {
  // Filter active fighters only
  const activeFighters = fighters.filter(f => f.status === 'active');

  // Calculate P4P score for each fighter - form-based like UFC/Oktagon
  const scoredFighters = activeFighters.map(f => {
    const totalFights = f.wins + f.losses + f.draws;
    const winPct = totalFights > 0 ? f.wins / totalFights : 0;
    const finishRate = f.wins > 0 ? (f.ko_wins + f.sub_wins) / f.wins : 0;

    // P4P score formula - form matters most:
    // - Win streak bonus (major factor - up to 25 points)
    // - Loss streak penalty (up to -15 points)
    // - Champion bonus (20%)
    // - Win percentage (20%)
    // - Finish rate (15%)
    // - Title defense bonus (10%)
    // - Overall skills (10%)
    const overall = (f.striking + f.grappling + f.wrestling + f.cardio + f.chin + f.power) / 6;
    const winStreakBonus = Math.min((f.win_streak || 0) * 5, 25);
    const lossStreakPenalty = Math.min((f.loss_streak || 0) * 5, 15);

    const p4pScore = (
      winStreakBonus -
      lossStreakPenalty +
      (f.is_champion ? 20 : 0) +
      winPct * 20 +
      finishRate * 15 +
      (f.title_defenses || 0) * 3 +
      (overall / 100) * 10
    );

    return {
      ...f,
      p4pScore,
      finishRate: Math.round(finishRate * 100),
      winPct: Math.round(winPct * 100)
    };
  });

  // Sort by P4P score
  scoredFighters.sort((a, b) => b.p4pScore - a.p4pScore);

  // Assign P4P rankings (top 15)
  return scoredFighters.slice(0, 15).map((f, idx) => ({
    ...f,
    p4pRanking: idx + 1
  }));
}

// Update rankings after event - UFC/Oktagon style with form-based scoring
function calculateRankings(fighters) {
  // Group by weight class and gender
  const divisions = {};

  for (const fighter of fighters) {
    const key = `${fighter.gender}_${fighter.weight_class}`;
    if (!divisions[key]) {
      divisions[key] = [];
    }
    divisions[key].push(fighter);
  }

  // Calculate ranking score and sort
  const updates = [];

  for (const key of Object.keys(divisions)) {
    const pool = divisions[key];

    // Calculate ranking points - UFC/Oktagon style:
    // - Win streak is heavily weighted (recent form matters most)
    // - Loss streak penalizes significantly
    // - Overall record still matters but less than form
    // - Finishes are rewarded
    // - Title defenses boost ranking
    pool.forEach(f => {
      const totalFights = f.wins + f.losses + f.draws;
      const winPct = totalFights > 0 ? f.wins / totalFights : 0;

      // Base score from overall record (30% weight)
      const recordScore = winPct * 30;

      // Win streak bonus (major factor - up to 40 points for 5+ win streak)
      const winStreakBonus = Math.min((f.win_streak || 0) * 8, 40);

      // Loss streak penalty (significant - up to -30 for 3+ losses)
      const lossStreakPenalty = Math.min((f.loss_streak || 0) * 10, 30);

      // Finish bonus (KO/Sub wins worth more - up to 15 points)
      const finishRate = totalFights > 0 ? (f.ko_wins + f.sub_wins) / totalFights : 0;
      const finishBonus = finishRate * 15;

      // Activity bonus (fighters with more fights rank higher - up to 10 points)
      const activityBonus = Math.min(totalFights * 1, 10);

      // Title defense bonus (champions with defenses rank higher)
      const titleBonus = (f.title_defenses || 0) * 5;

      f.rankScore = recordScore + winStreakBonus - lossStreakPenalty + finishBonus + activityBonus + titleBonus;
    });

    // Sort by rank score (champion stays on top)
    pool.sort((a, b) => {
      if (a.is_champion) return -1;
      if (b.is_champion) return 1;
      return b.rankScore - a.rankScore;
    });

    // Assign rankings
    pool.forEach((f, idx) => {
      const newRanking = f.is_champion ? 0 : idx + 1;
      if (f.ranking !== newRanking) {
        updates.push({ id: f.id, ranking: newRanking });
      }
    });
  }

  return updates;
}

// Fighter name generation data
const FIRST_NAMES = {
  male: [
    // American/English
    'James', 'John', 'Michael', 'David', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
    'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
    'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin',
    'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler',
    // Brazilian
    'Carlos', 'Jose', 'Paulo', 'Pedro', 'Lucas', 'Marcos', 'Rafael', 'Bruno', 'Diego', 'Rodrigo',
    'Anderson', 'Fabricio', 'Mauricio', 'Thiago', 'Vitor', 'Junior', 'Wanderlei', 'Rogerio', 'Glover', 'Gilbert',
    // Russian/Eastern European
    'Sergei', 'Dmitri', 'Andrei', 'Vladimir', 'Alexei', 'Igor', 'Oleg', 'Nikolai', 'Maxim', 'Artem',
    'Khabib', 'Islam', 'Petr', 'Jiri', 'Jan', 'Mirko', 'Stipe', 'Dragan', 'Goran', 'Fedor',
    // Mexican/Spanish
    'Juan', 'Miguel', 'Luis', 'Jorge', 'Fernando', 'Hector', 'Raul', 'Oscar', 'Sergio', 'Alejandro',
    'Yair', 'Brandon', 'Erik', 'Cain', 'Nate', 'Nick', 'Tony', 'Kelvin', 'Gilbert', 'Abel',
    // Asian
    'Yushin', 'Takanori', 'Yoshihiro', 'Kazushi', 'Shinya', 'Chan', 'Sung', 'Doo', 'Seung', 'Min',
    'Zhang', 'Li', 'Wei', 'Chen', 'Weili', 'Jingliang', 'Song', 'Amir', 'Ali', 'Reza',
    // European
    'Conor', 'Sean', 'Darren', 'Neil', 'Ross', 'Leon', 'Tom', 'Arnold', 'Stefan', 'Dennis',
    'Gegard', 'Alistair', 'Bas', 'Semmy', 'Gilbert', 'Alexander', 'Ilir', 'Volkan', 'Ciryl', 'Francis'
  ],
  female: [
    'Amanda', 'Valentina', 'Rose', 'Jessica', 'Holly', 'Miesha', 'Ronda', 'Cat', 'Sara', 'Joanna',
    'Carla', 'Michelle', 'Tecia', 'Nina', 'Claudia', 'Karolina', 'Alexa', 'Marina', 'Mackenzie', 'Maycee',
    'Weili', 'Yan', 'Viviane', 'Tatiana', 'Juliana', 'Cynthia', 'Irene', 'Jennifer', 'Felice', 'Raquel',
    'Liz', 'Marion', 'Germaine', 'Yana', 'Ketlen', 'Julianna', 'Megan', 'Norma', 'Andrea', 'Aspen',
    'Tracy', 'Angela', 'Paige', 'Katlyn', 'Poliana', 'Ariane', 'Manon', 'Molly', 'Casey', 'Erin'
  ]
};

const LAST_NAMES = [
  // Common American
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott',
  'Torres', 'Hill', 'Adams', 'Nelson', 'Baker', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  // Brazilian
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento',
  'Lima', 'Araujo', 'Fernandes', 'Carvalho', 'Gomes', 'Barbosa', 'Ribeiro', 'Alves', 'Martins', 'Rocha',
  'Vieira', 'Nogueira', 'Machado', 'Teixeira', 'Moraes', 'Mendes', 'Medeiros', 'Andrade', 'Aldo', 'Nunes',
  // Russian/Eastern European
  'Nurmagomedov', 'Volkov', 'Shevchenko', 'Pavlovich', 'Tsarukyan', 'Chimaev', 'Prochazka', 'Blachowicz',
  'Ankalaev', 'Makhachev', 'Yan', 'Volkanovski', 'Nemkov', 'Romanov', 'Emeev', 'Krylov', 'Fiziev', 'Evloev',
  'Oezdemir', 'Rakic', 'Jotko', 'Bukauskas', 'Aspinall', 'Spivak', 'Tuivasa', 'Rozenstruik', 'Gane', 'Ngannou',
  // Mexican/Hispanic
  'Moreno', 'Pantoja', 'Royval', 'Garza', 'Vera', 'Morales', 'Chavez', 'Lopez', 'Hernandez', 'Gonzalez',
  'Ramirez', 'Sanchez', 'Diaz', 'Cruz', 'Reyes', 'Vega', 'Castillo', 'Jimenez', 'Ruiz', 'Vargas',
  // Irish/British
  'McGregor', 'Gallagher', 'McCann', 'Hughes', 'Sheridan', 'Kelly', 'Murphy', 'Walsh', 'Byrne', 'Ryan',
  'Edwards', 'Till', 'Hardy', 'Sherdog', 'Sherwood', 'Sherrington', 'Mitchell', 'Craig', 'Shore', 'Wood',
  // Various
  'Adesanya', 'Usman', 'Ngannou', 'Oezdemir', 'Gane', 'Lewis', 'Tuivasa', 'Tybura', 'Daukaus', 'Sakai',
  'Ige', 'Kattar', 'Emmett', 'Allen', 'Topuria', 'Evloev', 'Mitchell', 'Yusuff', 'Sodiq', 'Bryce'
];

const COUNTRIES = [
  { code: 'USA', weight: 25 },
  { code: 'BRA', weight: 15 },
  { code: 'RUS', weight: 10 },
  { code: 'GBR', weight: 5 },
  { code: 'MEX', weight: 5 },
  { code: 'CAN', weight: 4 },
  { code: 'AUS', weight: 3 },
  { code: 'POL', weight: 3 },
  { code: 'JPN', weight: 3 },
  { code: 'KOR', weight: 2 },
  { code: 'CHN', weight: 3 },
  { code: 'FRA', weight: 3 },
  { code: 'GER', weight: 2 },
  { code: 'NED', weight: 2 },
  { code: 'SWE', weight: 2 },
  { code: 'IRL', weight: 2 },
  { code: 'NZL', weight: 2 },
  { code: 'ARG', weight: 2 },
  { code: 'CZE', weight: 2 },
  { code: 'UKR', weight: 2 },
  { code: 'KAZ', weight: 1 },
  { code: 'GEO', weight: 1 },
  { code: 'NGA', weight: 1 },
  { code: 'CMR', weight: 1 }
];

function getRandomCountry() {
  const totalWeight = COUNTRIES.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;
  for (const country of COUNTRIES) {
    random -= country.weight;
    if (random <= 0) return country.code;
  }
  return 'USA';
}

function generateRandomFighter(gender, weightClass) {
  const firstNames = gender === 'men' ? FIRST_NAMES.male : FIRST_NAMES.female;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const countryCode = getRandomCountry();

  // Generate random skills (40-95 range with some variation)
  const baseSkill = 50 + Math.floor(Math.random() * 30); // 50-80 base
  const variance = () => Math.floor(Math.random() * 20) - 10; // -10 to +10

  const clamp = (val) => Math.max(40, Math.min(95, val));

  return {
    first_name: firstName,
    last_name: lastName,
    nickname: null,
    gender,
    weight_class: weightClass,
    country_code: countryCode,
    striking: clamp(baseSkill + variance()),
    grappling: clamp(baseSkill + variance()),
    wrestling: clamp(baseSkill + variance()),
    cardio: clamp(baseSkill + variance()),
    chin: clamp(baseSkill + variance()),
    power: clamp(baseSkill + variance())
  };
}

function generateRoster(fightersPerDivision = 10) {
  const roster = [];

  // Men's divisions
  for (const wc of WEIGHT_CLASSES.men) {
    for (let i = 0; i < fightersPerDivision; i++) {
      roster.push(generateRandomFighter('men', wc.weight));
    }
  }

  // Women's divisions (fewer fighters)
  const womenPerDivision = Math.max(4, Math.floor(fightersPerDivision * 0.6));
  for (const wc of WEIGHT_CLASSES.women) {
    for (let i = 0; i < womenPerDivision; i++) {
      roster.push(generateRandomFighter('women', wc.weight));
    }
  }

  return roster;
}

module.exports = {
  WEIGHT_CLASSES,
  CITIES,
  EVENT_THEMES,
  METHODS,
  getWeightClassName,
  getWeightClasses,
  getRandomCity,
  getRandomTheme,
  generateVenueName,
  getFighterOverall,
  simulateFight,
  createFightCard,
  calculateRankings,
  calculateP4PRankings,
  generateRoster
};
