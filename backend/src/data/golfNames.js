// Golf Player Names Data
// Used for generating random golfers with realistic names by country

const COUNTRIES = [
  { code: 'USA', name: 'United States', weight: 25 },
  { code: 'AUS', name: 'Australia', weight: 8 },
  { code: 'GBR', name: 'Great Britain', weight: 7 },
  { code: 'KOR', name: 'South Korea', weight: 6 },
  { code: 'JPN', name: 'Japan', weight: 5 },
  { code: 'ESP', name: 'Spain', weight: 5 },
  { code: 'RSA', name: 'South Africa', weight: 5 },
  { code: 'IRL', name: 'Ireland', weight: 4 },
  { code: 'SWE', name: 'Sweden', weight: 4 },
  { code: 'CAN', name: 'Canada', weight: 3 },
  { code: 'ARG', name: 'Argentina', weight: 3 },
  { code: 'GER', name: 'Germany', weight: 3 },
  { code: 'ITA', name: 'Italy', weight: 3 },
  { code: 'FRA', name: 'France', weight: 3 },
  { code: 'NOR', name: 'Norway', weight: 2 },
  { code: 'DEN', name: 'Denmark', weight: 2 },
  { code: 'IND', name: 'India', weight: 2 },
  { code: 'CHN', name: 'China', weight: 2 },
  { code: 'THA', name: 'Thailand', weight: 2 },
  { code: 'NZL', name: 'New Zealand', weight: 2 }
];

const FIRST_NAMES = {
  USA: ['Tiger', 'Jordan', 'Justin', 'Collin', 'Scottie', 'Brooks', 'Xander', 'Patrick', 'Tony', 'Sam', 'Rickie', 'Will', 'Brian', 'Kevin', 'Cameron', 'Max', 'Davis', 'Sahith', 'Maverick', 'Taylor'],
  AUS: ['Jason', 'Adam', 'Cameron', 'Marc', 'Min Woo', 'Lucas', 'Matt', 'Stuart', 'Geoff', 'Aaron', 'Ryan', 'Jack', 'Harrison', 'Brendan', 'Travis'],
  GBR: ['Rory', 'Tommy', 'Matt', 'Tyrrell', 'Luke', 'Ian', 'Justin', 'Lee', 'Paul', 'Danny', 'Robert', 'Aaron', 'Sam', 'Callum', 'Jordan'],
  KOR: ['Sungjae', 'Si Woo', 'Tom', 'Byeong Hun', 'Joohyung', 'K.H.', 'Kyoung-Hoon', 'Sungho', 'Minkyu', 'Dongmin', 'Junwoo', 'Taehee', 'Younghun', 'Seungmin', 'Hyungjun'],
  JPN: ['Hideki', 'Takumi', 'Keita', 'Rikuya', 'Yuto', 'Shugo', 'Kazuki', 'Ryo', 'Satoshi', 'Hiroshi', 'Takuya', 'Masahiro', 'Daisuke', 'Haruki', 'Yuki'],
  ESP: ['Jon', 'Sergio', 'Rafael', 'Pablo', 'Adri', 'Jorge', 'Nacho', 'David', 'Alejandro', 'Angel', 'Ivan', 'Miguel', 'Carlos', 'Adrian', 'Gonzalo'],
  RSA: ['Erik', 'Louis', 'Charl', 'Branden', 'Dean', 'Dylan', 'Christiaan', 'George', 'Garrick', 'Jaco', 'Daniel', 'Brandon', 'Hennie', 'Martin', 'Pieter'],
  IRL: ['Shane', 'Padraig', 'Seamus', 'Graeme', 'Tom', 'Conor', 'Niall', 'Brendan', 'Cian', 'Ronan', 'Eoin', 'Declan', 'Patrick', 'Sean', 'Liam'],
  SWE: ['Henrik', 'Alex', 'Ludvig', 'David', 'Marcus', 'Sebastian', 'Viktor', 'Oscar', 'Erik', 'Jonas', 'Joakim', 'Jesper', 'Niklas', 'Fredrik', 'Lars'],
  CAN: ['Corey', 'Adam', 'Mackenzie', 'Nick', 'Taylor', 'Michael', 'Graham', 'Ben', 'Roger', 'David', 'Stuart', 'Ryan', 'Adam', 'Chris', 'Jake'],
  ARG: ['Emiliano', 'Angel', 'Fabian', 'Andres', 'Eduardo', 'Ricardo', 'Matias', 'Federico', 'Sebastian', 'Nicolas', 'Pablo', 'Alejandro', 'Martin', 'Diego', 'Lucas'],
  GER: ['Martin', 'Bernhard', 'Marcel', 'Stephan', 'Maximilian', 'Hurly', 'Alexander', 'Nicolas', 'Florian', 'Yannik', 'Matti', 'Sebastian', 'Dominic', 'Simon', 'Felix'],
  ITA: ['Francesco', 'Guido', 'Edoardo', 'Matteo', 'Renato', 'Andrea', 'Lorenzo', 'Filippo', 'Giovanni', 'Marco', 'Luca', 'Alessandro', 'Stefano', 'Roberto', 'Pietro'],
  FRA: ['Victor', 'Mike', 'Romain', 'Antoine', 'Matthieu', 'Julien', 'Nicolas', 'Alexandre', 'Thomas', 'Benjamin', 'Clement', 'Adrien', 'Maxime', 'Hugo', 'Pierre'],
  NOR: ['Viktor', 'Kristoffer', 'Espen', 'Marius', 'Andreas', 'Henrik', 'Eirik', 'Lars', 'Sven', 'Magnus', 'Ole', 'Knut', 'Jon', 'Bjorn', 'Harald'],
  DEN: ['Thorbjorn', 'Lucas', 'Rasmus', 'Jeff', 'Soren', 'Nicolai', 'Marcus', 'Joachim', 'Emil', 'Frederik', 'Christian', 'Mads', 'Anders', 'Thomas', 'Kristian'],
  IND: ['Anirban', 'Shubhankar', 'Gaganjeet', 'Arjun', 'Udayan', 'Rashid', 'Chiragh', 'Veer', 'Randhir', 'Ajeetesh', 'Khalin', 'Kartik', 'Rahil', 'Viraj', 'Aman'],
  CHN: ['Haotong', 'Ashun', 'Xinjun', 'Yuxin', 'Hao', 'Wenyi', 'Zheng', 'Minghao', 'Jinghe', 'Wenchong', 'Yikeshan', 'Daxing', 'Zecheng', 'Bowen', 'Jianxin'],
  THA: ['Jazz', 'Kiradech', 'Gunn', 'Phachara', 'Danthai', 'Atiruj', 'Sadom', 'Pavit', 'Suradit', 'Tirawat', 'Poom', 'Rattanon', 'Nitithorn', 'Sattaya', 'Charng'],
  NZL: ['Ryan', 'Tim', 'Danny', 'Josh', 'Michael', 'Ben', 'Mark', 'Luke', 'Harry', 'Sam', 'James', 'Tom', 'Matt', 'Nick', 'Jayden']
};

const LAST_NAMES = {
  USA: ['Woods', 'Spieth', 'Thomas', 'Morikawa', 'Scheffler', 'Koepka', 'Schauffele', 'Cantlay', 'Finau', 'Burns', 'Fowler', 'Zalatoris', 'Harman', 'Kisner', 'Young', 'Homa', 'Riley', 'Theegala', 'McNealy', 'Moore'],
  AUS: ['Day', 'Scott', 'Smith', 'Leishman', 'Lee', 'Herbert', 'Jones', 'Appleby', 'Ogilvy', 'Baddeley', 'Fox', 'Thompson', 'Barber', 'Davis', 'Head'],
  GBR: ['McIlroy', 'Fleetwood', 'Fitzpatrick', 'Hatton', 'Donald', 'Poulter', 'Rose', 'Westwood', 'Casey', 'Willett', 'MacIntyre', 'Rai', 'Horsfield', 'Sheridan', 'Smith'],
  KOR: ['Im', 'Kim', 'Lee', 'An', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Shin', 'Jeon', 'Seo', 'Bae', 'Lim', 'Hong'],
  JPN: ['Matsuyama', 'Kanaya', 'Nakajima', 'Hoshino', 'Katayama', 'Imahira', 'Tanaka', 'Ishikawa', 'Suzuki', 'Sato', 'Watanabe', 'Yamamoto', 'Ito', 'Kobayashi', 'Hayashi'],
  ESP: ['Rahm', 'Garcia', 'Cabrera Bello', 'Larrazabal', 'Arnaus', 'Campillo', 'Elvira', 'Puig', 'Otaegui', 'Hidalgo', 'Fernandez', 'Quiroz', 'Sola', 'Del Val', 'Pastor'],
  RSA: ['van Rooyen', 'Oosthuizen', 'Schwartzel', 'Grace', 'Burmester', 'Frittelli', 'Bezuidenhout', 'Coetzee', 'Higgo', 'Ahlers', 'du Plessis', 'Stone', 'Blaauw', 'Nienaber', 'van der Walt'],
  IRL: ['Lowry', 'Harrington', 'Power', 'McDowell', 'McKibbin', 'Ring', 'O\'Brien', 'Murray', 'Sharvin', 'Kinsella', 'Dunne', 'Walsh', 'Murphy', 'Kelly', 'O\'Neill'],
  SWE: ['Stenson', 'Noren', 'Aberg', 'Lingmerth', 'Kinhult', 'Soderberg', 'Broberg', 'Forsbrand', 'Hanson', 'Karlsson', 'Blixt', 'Eriksson', 'Persson', 'Johansson', 'Andersson'],
  CAN: ['Conners', 'Hadwin', 'Hughes', 'Taylor', 'Pendrith', 'Svensson', 'DeLaet', 'Lamb', 'Chicken', 'Hebert', 'Makela', 'Henderson', 'Baxter', 'Makela', 'Jensen'],
  ARG: ['Grillo', 'Cabrera', 'Gomez', 'Romero', 'Echenique', 'Aphibarnrat', 'Ledesma', 'Demare', 'Fernandez', 'Alvarez', 'Dominguez', 'Peralta', 'Vega', 'Molina', 'Paz'],
  GER: ['Kaymer', 'Langer', 'Siem', 'Jaeger', 'Kieffer', 'Long', 'Schmid', 'Eckrodt', 'Heisele', 'Paul', 'Fritsch', 'Fischer', 'Weber', 'Braun', 'Richter'],
  ITA: ['Molinari', 'Migliozzi', 'Paratore', 'Bertasio', 'Laporta', 'Gagli', 'Scalise', 'Celli', 'Nardi', 'Bianchi', 'Romano', 'Conti', 'Rossi', 'Greco', 'Vitale'],
  FRA: ['Dubuisson', 'Lorenzo-Vera', 'Langasque', 'Rozner', 'Pavon', 'Havret', 'Perez', 'Wattel', 'Lepine', 'Sarazin', 'Bacquelin', 'Brun', 'Dumont', 'Garnier', 'Leroy'],
  NOR: ['Hovland', 'Ventura', 'Aasbo', 'Borge', 'Fossum', 'Hagen', 'Olsen', 'Berg', 'Hansen', 'Johansen', 'Larsen', 'Nilsen', 'Eriksen', 'Kristiansen', 'Pedersen'],
  DEN: ['Olesen', 'Bjerregaard', 'Hojgaard', 'Winther', 'Kjeldsen', 'Norgaard', 'Sorensen', 'Hansen', 'Rasmussen', 'Andersen', 'Christensen', 'Jensen', 'Nielsen', 'Petersen', 'Madsen'],
  IND: ['Lahiri', 'Sharma', 'Bhullar', 'Atwal', 'Mane', 'Khan', 'Kumar', 'Ahlawat', 'Sandhu', 'Gangjee', 'Joshi', 'Singh', 'Patel', 'Verma', 'Gupta'],
  CHN: ['Li', 'Wu', 'Zhang', 'Lin', 'Dou', 'Guan', 'Liang', 'Wang', 'Chen', 'Liu', 'Yang', 'Huang', 'Zhao', 'Zhou', 'Xu'],
  THA: ['Janewattananond', 'Aphibarnrat', 'Chapchai', 'Khongwatmai', 'Boonma', 'Kaewsiribandit', 'Suwannapura', 'Meesawat', 'Tantipokhakul', 'Prom-uthai', 'Srisanga', 'Buranathanakul', 'Charoenrit', 'Madsawat', 'Pittayarat'],
  NZL: ['Fox', 'Wilkinson', 'Lee', 'Geall', 'Murray', 'Campbell', 'Woods', 'Brown', 'Wilson', 'Taylor', 'Clark', 'Robinson', 'White', 'Hall', 'Walker']
};

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCountry() {
  const totalWeight = COUNTRIES.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;
  for (const country of COUNTRIES) {
    random -= country.weight;
    if (random <= 0) return country;
  }
  return COUNTRIES[0];
}

function randomSkill(min = 50, max = 95, mean = 70) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const stdDev = (max - min) / 4;
  let value = Math.round(mean + z * stdDev);
  return Math.max(min, Math.min(max, value));
}

function generatePlayer(worldId) {
  const country = randomCountry();
  const firstName = randomElement(FIRST_NAMES[country.code] || FIRST_NAMES.USA);
  const lastName = randomElement(LAST_NAMES[country.code] || LAST_NAMES.USA);

  const baseSkill = randomSkill(50, 95, 70);
  const variance = 12;

  return {
    world_id: worldId,
    first_name: firstName,
    last_name: lastName,
    country: country.code,
    skill_driving: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    skill_iron_play: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    skill_short_game: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    skill_putting: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    skill_mental: Math.max(40, Math.min(99, baseSkill + randomSkill(-variance, variance, 0))),
    consistency: randomSkill(50, 95, 75),
    form: randomSkill(40, 100, 70),
    ranking_points: 0,
    career_wins: 0,
    career_major_wins: 0,
    career_top10s: 0,
    tournaments_played: 0,
    best_finish: null
  };
}

function generatePlayers(worldId, count = 120) {
  const players = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    let player;
    let attempts = 0;
    do {
      player = generatePlayer(worldId);
      attempts++;
    } while (usedNames.has(`${player.first_name} ${player.last_name}`) && attempts < 10);

    usedNames.add(`${player.first_name} ${player.last_name}`);
    players.push(player);
  }

  return players;
}

function getCountryFlag(countryCode) {
  const flags = {
    'USA': '\u{1F1FA}\u{1F1F8}', 'AUS': '\u{1F1E6}\u{1F1FA}', 'GBR': '\u{1F1EC}\u{1F1E7}',
    'KOR': '\u{1F1F0}\u{1F1F7}', 'JPN': '\u{1F1EF}\u{1F1F5}', 'ESP': '\u{1F1EA}\u{1F1F8}',
    'RSA': '\u{1F1FF}\u{1F1E6}', 'IRL': '\u{1F1EE}\u{1F1EA}', 'SWE': '\u{1F1F8}\u{1F1EA}',
    'CAN': '\u{1F1E8}\u{1F1E6}', 'ARG': '\u{1F1E6}\u{1F1F7}', 'GER': '\u{1F1E9}\u{1F1EA}',
    'ITA': '\u{1F1EE}\u{1F1F9}', 'FRA': '\u{1F1EB}\u{1F1F7}', 'NOR': '\u{1F1F3}\u{1F1F4}',
    'DEN': '\u{1F1E9}\u{1F1F0}', 'IND': '\u{1F1EE}\u{1F1F3}', 'CHN': '\u{1F1E8}\u{1F1F3}',
    'THA': '\u{1F1F9}\u{1F1ED}', 'NZL': '\u{1F1F3}\u{1F1FF}'
  };
  return flags[countryCode] || '\u{1F3F3}\u{FE0F}';
}

module.exports = {
  COUNTRIES,
  FIRST_NAMES,
  LAST_NAMES,
  generatePlayer,
  generatePlayers,
  getCountryFlag,
  randomSkill
};
