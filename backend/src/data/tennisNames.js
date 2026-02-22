// Tennis Player Names Data
// Used for generating random tennis players with realistic names by country

const COUNTRIES = [
  { code: 'ESP', name: 'Spain', weight: 12 },
  { code: 'ITA', name: 'Italy', weight: 10 },
  { code: 'USA', name: 'United States', weight: 10 },
  { code: 'FRA', name: 'France', weight: 8 },
  { code: 'GER', name: 'Germany', weight: 7 },
  { code: 'GBR', name: 'Great Britain', weight: 6 },
  { code: 'AUS', name: 'Australia', weight: 6 },
  { code: 'RUS', name: 'Russia', weight: 6 },
  { code: 'SRB', name: 'Serbia', weight: 5 },
  { code: 'ARG', name: 'Argentina', weight: 5 },
  { code: 'CAN', name: 'Canada', weight: 4 },
  { code: 'GRE', name: 'Greece', weight: 3 },
  { code: 'POL', name: 'Poland', weight: 3 },
  { code: 'NOR', name: 'Norway', weight: 3 },
  { code: 'CHI', name: 'Chile', weight: 3 },
  { code: 'JPN', name: 'Japan', weight: 3 },
  { code: 'CRO', name: 'Croatia', weight: 3 },
  { code: 'SUI', name: 'Switzerland', weight: 3 },
  { code: 'CZE', name: 'Czech Republic', weight: 2 },
  { code: 'BEL', name: 'Belgium', weight: 2 }
];

const FIRST_NAMES = {
  ESP: ['Carlos', 'Pablo', 'Alejandro', 'Rafael', 'Fernando', 'David', 'Roberto', 'Javier', 'Daniel', 'Miguel', 'Sergio', 'Alberto', 'Juan', 'Antonio', 'Luis'],
  ITA: ['Jannik', 'Lorenzo', 'Matteo', 'Fabio', 'Marco', 'Andrea', 'Alessandro', 'Francesco', 'Luca', 'Simone', 'Paolo', 'Stefano', 'Giuseppe', 'Roberto', 'Giovanni'],
  USA: ['Taylor', 'Ben', 'Tommy', 'Sebastian', 'Brandon', 'John', 'Sam', 'Michael', 'Chris', 'Jack', 'Ryan', 'James', 'Andrew', 'Patrick', 'Connor'],
  FRA: ['Ugo', 'Arthur', 'Adrian', 'Gael', 'Benoit', 'Richard', 'Lucas', 'Jo-Wilfried', 'Pierre', 'Julien', 'Nicolas', 'Maxime', 'Alexandre', 'Theo', 'Hugo'],
  GER: ['Alexander', 'Jan-Lennard', 'Oscar', 'Daniel', 'Dominik', 'Philipp', 'Florian', 'Maximilian', 'Yannick', 'Peter', 'Nicolas', 'Kevin', 'Sebastian', 'Lukas', 'Tim'],
  GBR: ['Cameron', 'Jack', 'Daniel', 'Andy', 'Kyle', 'Liam', 'Arthur', 'James', 'Oliver', 'Henry', 'George', 'William', 'Thomas', 'Charlie', 'Harry'],
  AUS: ['Alex', 'Thanasi', 'Jordan', 'Nick', 'John', 'Max', 'James', 'Alexei', 'Chris', 'Rinky', 'Bernard', 'Matthew', 'Luke', 'Jason', 'Mark'],
  RUS: ['Andrey', 'Daniil', 'Karen', 'Aslan', 'Roman', 'Evgeny', 'Pavel', 'Alexander', 'Mikhail', 'Dmitry', 'Ivan', 'Nikita', 'Sergei', 'Viktor', 'Maxim'],
  SRB: ['Novak', 'Miomir', 'Dusan', 'Laslo', 'Filip', 'Viktor', 'Nikola', 'Stefan', 'Aleksandar', 'Marko', 'Danilo', 'Milan', 'Ivan', 'Petar', 'Boris'],
  ARG: ['Sebastian', 'Francisco', 'Tomas', 'Federico', 'Diego', 'Juan Martin', 'Horacio', 'Guido', 'Leonardo', 'Nicolas', 'Mariano', 'Carlos', 'Martin', 'Facundo', 'Agustin'],
  CAN: ['Felix', 'Denis', 'Milos', 'Vasek', 'Gabriel', 'Steven', 'Brayden', 'Alexis', 'Liam', 'Filip', 'Daniel', 'Peter', 'Kelsey', 'Benjamin', 'Ethan'],
  GRE: ['Stefanos', 'Michail', 'Konstantinos', 'Alexandros', 'Petros', 'Dimitrios', 'Aristotelis', 'Markos', 'Ioannis', 'Georgios', 'Nikos', 'Christos', 'Vasilis', 'Panagiotis', 'Andreas'],
  POL: ['Hubert', 'Kamil', 'Kacper', 'Lukasz', 'Jerzy', 'Michal', 'Wojciech', 'Jakub', 'Piotr', 'Tomasz', 'Marcin', 'Jan', 'Krzysztof', 'Adam', 'Dawid'],
  NOR: ['Casper', 'Viktor', 'Ulrik', 'Henrik', 'Magnus', 'Lars', 'Erik', 'Kristian', 'Fredrik', 'Ole', 'Sander', 'Jonas', 'Andreas', 'Thomas', 'Martin'],
  CHI: ['Nicolas', 'Cristian', 'Alejandro', 'Gonzalo', 'Fernando', 'Marcelo', 'Guillermo', 'Hans', 'Paul', 'Jorge', 'Eduardo', 'Sebastian', 'Martin', 'Tomas', 'Pablo'],
  JPN: ['Kei', 'Yoshihito', 'Taro', 'Shintaro', 'Yasutaka', 'Go', 'Yuichi', 'Hiroki', 'Sho', 'Yosuke', 'Kaito', 'Ryo', 'Kazuki', 'Daiki', 'Takumi'],
  CRO: ['Borna', 'Marin', 'Ivan', 'Ivo', 'Ante', 'Mate', 'Dino', 'Luka', 'Marko', 'Josip', 'Nino', 'Filip', 'Petar', 'Mario', 'Tomislav'],
  SUI: ['Roger', 'Stan', 'Marc', 'Henri', 'Dominic', 'Sandro', 'Antoine', 'Leandro', 'Luca', 'Alexander', 'Jerome', 'Adrien', 'Johan', 'Marco', 'Yves'],
  CZE: ['Tomas', 'Jiri', 'Jakub', 'Lukas', 'Jan', 'Martin', 'Radek', 'Adam', 'Petr', 'David', 'Filip', 'Michal', 'Pavel', 'Ondrej', 'Daniel'],
  BEL: ['David', 'Steve', 'Ruben', 'Zizou', 'Kimmer', 'Michael', 'Joris', 'Yannick', 'Arthur', 'Xavier', 'Arnaud', 'Pierre', 'Maxime', 'Julien', 'Simon']
};

const LAST_NAMES = {
  ESP: ['Alcaraz', 'Carreno Busta', 'Bautista Agut', 'Nadal', 'Verdasco', 'Ferrer', 'Lopez', 'Garcia', 'Martinez', 'Gonzalez', 'Rodriguez', 'Sanchez', 'Munar', 'Ramos', 'Vilella'],
  ITA: ['Sinner', 'Musetti', 'Berrettini', 'Fognini', 'Sonego', 'Cobolli', 'Arnaldi', 'Darderi', 'Nardi', 'Passaro', 'Moroni', 'Agamenone', 'Cecchinato', 'Travaglia', 'Caruso'],
  USA: ['Fritz', 'Shelton', 'Paul', 'Korda', 'Tiafoe', 'Isner', 'Querrey', 'Opelka', 'Giron', 'Wolf', 'Nakashima', 'Johnson', 'McDonald', 'Brooksby', 'Eubanks'],
  FRA: ['Humbert', 'Fils', 'Mannarino', 'Monfils', 'Paire', 'Gasquet', 'Simon', 'Tsonga', 'Moutet', 'Rinderknech', 'Bonzi', 'Halys', 'Barrere', 'Lestienne', 'Muller'],
  GER: ['Zverev', 'Struff', 'Otte', 'Altmaier', 'Koepfer', 'Gojowczyk', 'Marterer', 'Hanfmann', 'Squire', 'Molleker', 'Kohlschreiber', 'Masur', 'Bachinger', 'Stebe', 'Krawietz'],
  GBR: ['Norrie', 'Draper', 'Evans', 'Murray', 'Edmund', 'Jubb', 'Sherrick', 'Ward', 'Clarke', 'Mayfield', 'Harris', 'Sherwood', 'Sherlock', 'Thompson', 'Collins'],
  AUS: ['de Minaur', 'Kokkinakis', 'Thompson', 'Kyrgios', 'Millman', 'Purcell', 'Duckworth', 'Popyrin', 'Vukic', 'Hijikata', 'Tomic', 'Ebden', 'Groth', 'Bolt', 'Hewitt'],
  RUS: ['Rublev', 'Medvedev', 'Khachanov', 'Karatsev', 'Safiullin', 'Donskoy', 'Kotov', 'Shevchenko', 'Tiurnev', 'Kuznetsov', 'Ivashka', 'Gerasimov', 'Gabashvili', 'Donskoy', 'Safin'],
  SRB: ['Djokovic', 'Kecmanovic', 'Lajovic', 'Djere', 'Krajinovic', 'Troicki', 'Tipsarevic', 'Zimonjic', 'Milojevic', 'Popovic', 'Ivanovic', 'Jovovic', 'Nikolic', 'Stosic', 'Petrovic'],
  ARG: ['Baez', 'Cerundolo', 'Etcheverry', 'Schwartzman', 'Delbonis', 'Pella', 'Zeballos', 'Mayer', 'Londero', 'Coria', 'Bagnis', 'Cecchinato', 'Arguello', 'Garino', 'Olivo'],
  CAN: ['Auger-Aliassime', 'Shapovalov', 'Raonic', 'Pospisil', 'Diallo', 'Schnur', 'Polansky', 'Galarneau', 'Broom', 'Draxl', 'Tabilo', 'Baxter', 'Berg', 'Jensen', 'Makela'],
  GRE: ['Tsitsipas', 'Pervolarakis', 'Grammatikopulos', 'Papagiannis', 'Petrakis', 'Kalovelonis', 'Triantafyllou', 'Stergiou', 'Mavrotas', 'Kanatas', 'Alexopoulos', 'Georgoudas', 'Lazarakis', 'Mandilaris', 'Psychas'],
  POL: ['Hurkacz', 'Majchrzak', 'Zuk', 'Kubot', 'Janowicz', 'Gawron', 'Kowalski', 'Panfil', 'Michalski', 'Przysienny', 'Kacperek', 'Smolorz', 'Wrzesinski', 'Rutkowski', 'Szymanski'],
  NOR: ['Ruud', 'Durasovic', 'Settergren', 'Lokken', 'Arntsen', 'Erichsen', 'Eriksen', 'Hansen', 'Johansen', 'Kristiansen', 'Olsen', 'Pedersen', 'Nilsen', 'Berg', 'Larsen'],
  CHI: ['Jarry', 'Garin', 'Lama', 'Rios', 'Gonzalez', 'Massu', 'Capdeville', 'Podlipnik', 'Barrios', 'Saavedra', 'Nunez', 'Urzua', 'Zanevska', 'Fernandez', 'Silva'],
  JPN: ['Nishikori', 'Nishioka', 'Daniel', 'Shimabukuro', 'Uchiyama', 'Soeda', 'Watanuki', 'Mochizuki', 'Ito', 'Suzuki', 'Matsui', 'Kato', 'Sato', 'Uchida', 'Shimizu'],
  CRO: ['Coric', 'Cilic', 'Dodig', 'Karlovic', 'Pavic', 'Skugor', 'Mektic', 'Serdarusic', 'Ajdukovic', 'Prizmic', 'Galovic', 'Gojo', 'Vrljic', 'Zelba', 'Draganja'],
  SUI: ['Federer', 'Wawrinka', 'Laaksonen', 'Huesler', 'Stricker', 'Riedi', 'Kym', 'Ehrat', 'Bellier', 'Casanova', 'Dietrich', 'Jakupi', 'Murer', 'Bader', 'Tamnani'],
  CZE: ['Berdych', 'Lehecka', 'Machac', 'Mensik', 'Stepanek', 'Vesely', 'Rosol', 'Kolar', 'Vondrasek', 'Barton', 'Svrcinova', 'Kellovsky', 'Krutil', 'Fridrych', 'Pavlasek'],
  BEL: ['Goffin', 'Darcis', 'Bemelmans', 'Bergs', 'Coppejans', 'Collignon', 'Geerts', 'Hermans', 'Jacobs', 'Michiels', 'Pelerin', 'Puetz', 'Mestach', 'Vliegen', 'Dewit']
};

// Pick random element from array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick weighted random country
function randomCountry() {
  const totalWeight = COUNTRIES.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;

  for (const country of COUNTRIES) {
    random -= country.weight;
    if (random <= 0) {
      return country;
    }
  }
  return COUNTRIES[0];
}

// Generate random skill value between min and max (normal distribution centered around mean)
function randomSkill(min = 50, max = 95, mean = 70) {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Scale to our range with standard deviation of ~12
  const stdDev = (max - min) / 4;
  let value = Math.round(mean + z * stdDev);

  // Clamp to min/max
  return Math.max(min, Math.min(max, value));
}

// Generate a random player
function generatePlayer(worldId) {
  const country = randomCountry();
  const firstName = randomElement(FIRST_NAMES[country.code] || FIRST_NAMES.USA);
  const lastName = randomElement(LAST_NAMES[country.code] || LAST_NAMES.USA);

  // Generate skills with some correlation (good players tend to be good overall)
  const baseSkill = randomSkill(50, 95, 70);
  const variance = 12;

  const skills = {
    serve: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    forehand: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    backhand: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    volley: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    movement: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    mental: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0)))
  };

  // Consistency and form
  const consistency = randomSkill(50, 95, 75);
  const form = randomSkill(40, 100, 70);

  // Specialty based on country and random
  const specialties = ['hardcourt', 'clay', 'grass', 'all-round'];
  const countryBias = {
    ESP: ['clay', 'clay', 'clay', 'all-round'],
    ARG: ['clay', 'clay', 'all-round'],
    ITA: ['clay', 'all-round', 'hardcourt'],
    FRA: ['clay', 'all-round'],
    GBR: ['grass', 'grass', 'all-round'],
    AUS: ['hardcourt', 'grass', 'all-round'],
    USA: ['hardcourt', 'hardcourt', 'all-round']
  };

  const specialtyPool = countryBias[country.code] || specialties;
  const specialty = randomElement(specialtyPool);

  return {
    world_id: worldId,
    first_name: firstName,
    last_name: lastName,
    country: country.code,
    skill_serve: skills.serve,
    skill_forehand: skills.forehand,
    skill_backhand: skills.backhand,
    skill_volley: skills.volley,
    skill_movement: skills.movement,
    skill_mental: skills.mental,
    consistency,
    form,
    specialty,
    ranking_points: 0
  };
}

// Generate multiple players
function generatePlayers(worldId, count = 100) {
  const players = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    let player;
    let attempts = 0;

    // Ensure unique names
    do {
      player = generatePlayer(worldId);
      attempts++;
    } while (usedNames.has(`${player.first_name} ${player.last_name}`) && attempts < 10);

    usedNames.add(`${player.first_name} ${player.last_name}`);
    players.push(player);
  }

  return players;
}

// Get country flag emoji
function getCountryFlag(countryCode) {
  const flags = {
    'ESP': '🇪🇸', 'ITA': '🇮🇹', 'USA': '🇺🇸', 'FRA': '🇫🇷', 'GER': '🇩🇪',
    'GBR': '🇬🇧', 'AUS': '🇦🇺', 'RUS': '🇷🇺', 'SRB': '🇷🇸', 'ARG': '🇦🇷',
    'CAN': '🇨🇦', 'GRE': '🇬🇷', 'POL': '🇵🇱', 'NOR': '🇳🇴', 'CHI': '🇨🇱',
    'JPN': '🇯🇵', 'CRO': '🇭🇷', 'SUI': '🇨🇭', 'CZE': '🇨🇿', 'BEL': '🇧🇪'
  };
  return flags[countryCode] || '🏳️';
}

// Get country name from code
function getCountryName(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
}

module.exports = {
  COUNTRIES,
  FIRST_NAMES,
  LAST_NAMES,
  generatePlayer,
  generatePlayers,
  getCountryFlag,
  getCountryName,
  randomSkill
};
