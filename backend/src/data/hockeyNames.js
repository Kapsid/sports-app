// Hockey player name pools per country
// ~20 first names + ~20 last names per nation

const namePools = {
  CAN: {
    first: ['Connor', 'Sidney', 'Nathan', 'Brad', 'Ryan', 'Tyler', 'Brayden', 'Mark', 'Cale', 'Josh', 'Carter', 'Travis', 'Drake', 'Lawson', 'Shane', 'Dillon', 'Jared', 'Colton', 'Mason', 'Logan'],
    last: ['McDavid', 'Crosby', 'MacKinnon', 'Marchand', 'O\'Reilly', 'Seguin', 'Point', 'Scheifele', 'Makar', 'Anderson', 'Hart', 'Konecny', 'Batherson', 'Crouse', 'Wright', 'Dubois', 'Spurgeon', 'Parayko', 'Chabot', 'Theodore']
  },
  FIN: {
    first: ['Aleksander', 'Mikko', 'Sebastian', 'Miro', 'Teuvo', 'Patrik', 'Roope', 'Jesperi', 'Kaapo', 'Eeli', 'Joel', 'Artturi', 'Saku', 'Ville', 'Juho', 'Henri', 'Olli', 'Rasmus', 'Niko', 'Markus'],
    last: ['Barkov', 'Rantanen', 'Aho', 'Heiskanen', 'Teravainen', 'Laine', 'Hintz', 'Kotkaniemi', 'Kakko', 'Tolvanen', 'Armia', 'Lehkonen', 'Maenalanen', 'Husso', 'Lammikko', 'Jokiharju', 'Maatta', 'Ristolainen', 'Mikkola', 'Nutivaara']
  },
  SWE: {
    first: ['Victor', 'William', 'Filip', 'Mika', 'Gustav', 'Elias', 'Rasmus', 'Adrian', 'Lucas', 'Oliver', 'Erik', 'Henrik', 'Joel', 'Jesper', 'Leo', 'Nils', 'Isak', 'Andre', 'Linus', 'Mattias'],
    last: ['Hedman', 'Nylander', 'Forsberg', 'Zibanejad', 'Nyquist', 'Pettersson', 'Dahlin', 'Kempe', 'Raymond', 'Ekman-Larsson', 'Karlsson', 'Lundqvist', 'Eriksson', 'Bratt', 'Carlsson', 'Hoglander', 'Lindblom', 'Burakovsky', 'Ullmark', 'Johansson']
  },
  USA: {
    first: ['Auston', 'Jack', 'Quinn', 'Matthew', 'Jason', 'Kyle', 'Brady', 'Luke', 'Chris', 'Alex', 'Tage', 'Trevor', 'Jake', 'Adam', 'Kevin', 'Patrick', 'Dylan', 'Clayton', 'Seth', 'John'],
    last: ['Matthews', 'Hughes', 'Tkachuk', 'Robertson', 'Connor', 'DeBrincat', 'Fox', 'Guentzel', 'Kreider', 'Thompson', 'Zegras', 'Gaudreau', 'Kane', 'Hayes', 'Keller', 'Farabee', 'Larkin', 'Gibson', 'Jones', 'Carlson']
  },
  CZE: {
    first: ['David', 'Tomas', 'Martin', 'Jakub', 'Ondrej', 'Filip', 'Dominik', 'Pavel', 'Radko', 'Jan', 'Dmitrij', 'Michal', 'Matej', 'Adam', 'Lukas', 'Jiri', 'Petr', 'Daniel', 'Roman', 'Ales'],
    last: ['Pastrnak', 'Hertl', 'Necas', 'Voracek', 'Palat', 'Chytil', 'Kubalik', 'Zacha', 'Gudas', 'Rutta', 'Jaskin', 'Hronek', 'Krejci', 'Blümel', 'Sedlak', 'Spacek', 'Simek', 'Vanecek', 'Mrazek', 'Vejmelka']
  },
  SUI: {
    first: ['Nico', 'Timo', 'Nino', 'Kevin', 'Roman', 'Sven', 'Luca', 'Philipp', 'Janis', 'Dean', 'Pius', 'Gregory', 'Gaetan', 'Reto', 'Denis', 'Christoph', 'Yannick', 'Samuel', 'Joel', 'Tristan'],
    last: ['Hischier', 'Meier', 'Niederreiter', 'Fiala', 'Josi', 'Andrighetto', 'Sbisa', 'Kurashev', 'Moser', 'Kukan', 'Suter', 'Hofmann', 'Haas', 'Berra', 'Malgin', 'Bertschy', 'Weber', 'Scherwey', 'Genoni', 'Berni']
  },
  GER: {
    first: ['Leon', 'Tim', 'Moritz', 'Dominik', 'Marc', 'Lukas', 'Nico', 'Manuel', 'Tom', 'John', 'Tobias', 'Stefan', 'Alexander', 'Matthias', 'Daniel', 'Korbinian', 'Frederik', 'Yasin', 'Marcel', 'Jonas'],
    last: ['Draisaitl', 'Stützle', 'Seider', 'Kahun', 'Michaelis', 'Reichel', 'Sturm', 'Grubauer', 'Kühnhackl', 'Peterka', 'Rieder', 'Loibl', 'Ehliz', 'Plachta', 'Noebels', 'Holzer', 'Tiffels', 'Ehl', 'Niederberger', 'Müller']
  },
  SVK: {
    first: ['Juraj', 'Tomas', 'Martin', 'Erik', 'Samuel', 'Adam', 'Pavol', 'Libor', 'Marian', 'Andrej', 'Peter', 'Kristian', 'Milos', 'Simon', 'Marek', 'Richard', 'Matej', 'Michal', 'Filip', 'Robert'],
    last: ['Slafkovsky', 'Tatar', 'Fehervary', 'Cernak', 'Nemec', 'Liska', 'Hudacek', 'Hajek', 'Studenic', 'Sekera', 'Regenda', 'Pospisil', 'Roman', 'Mesar', 'Halak', 'Godla', 'Chromiak', 'Kelemen', 'Gachulinec', 'Cehlarik']
  },
  LAT: {
    first: ['Zemgus', 'Teodors', 'Elvis', 'Rudolfs', 'Rodrigo', 'Rihards', 'Arturs', 'Oskars', 'Roberts', 'Kristaps', 'Maris', 'Ralfs', 'Kaspars', 'Andris', 'Janis', 'Edgars', 'Martins', 'Renars', 'Guntis', 'Uvis'],
    last: ['Girgensons', 'Blugers', 'Merzlikins', 'Balcers', 'Abols', 'Bukarts', 'Silovs', 'Cibulskis', 'Batna', 'Sotnieks', 'Dzerins', 'Freibergs', 'Jaks', 'Kenins', 'Krastenbergs', 'Balinskis', 'Galvins', 'Grundmanis', 'Indrasis', 'Kulda']
  },
  DEN: {
    first: ['Lars', 'Nikolaj', 'Oliver', 'Frederik', 'Patrick', 'Mikkel', 'Joachim', 'Markus', 'Peter', 'Jesper', 'Nicklas', 'Morten', 'Mathias', 'Frans', 'Sebastian', 'Emil', 'Marcus', 'Alexander', 'Phillip', 'Magnus'],
    last: ['Eller', 'Ehlers', 'Bjorkstrand', 'Lauridsen', 'Russell', 'Boedker', 'Bau', 'Jensen', 'Regin', 'Nielsen', 'Madsen', 'Jakobsen', 'Storm', 'From', 'Olsen', 'Kristensen', 'Poulsen', 'Andersen', 'Dahm', 'Larsen']
  },
  NOR: {
    first: ['Mats', 'Mathis', 'Andreas', 'Patrick', 'Tobias', 'Martin', 'Michael', 'Thomas', 'Christian', 'Stefan', 'Jonas', 'Alexander', 'Erlend', 'Mattias', 'Ken', 'Sondre', 'Daniel', 'Kristian', 'Eirik', 'Niklas'],
    last: ['Zuccarello', 'Olimb', 'Martinsen', 'Thoresen', 'Lindstrom', 'Roymark', 'Haga', 'Valkvae-Olsen', 'Espeland', 'Trettenes', 'Holós', 'Bonsaksen', 'Krogdahl', 'Haukeland', 'Nørstebø', 'Salsten', 'Olden', 'Rosberg', 'Henriksen', 'Lesund']
  },
  FRA: {
    first: ['Pierre-Edouard', 'Antoine', 'Alexandre', 'Yohann', 'Damien', 'Charles', 'Sacha', 'Jordann', 'Stephane', 'Valentin', 'Guillaume', 'Nicolas', 'Thomas', 'Florian', 'Teddy', 'Hugo', 'Kevin', 'Julien', 'Bastien', 'Maxime'],
    last: ['Bellemare', 'Roussel', 'Texier', 'Auvitu', 'Fleury', 'Bertrand', 'Treille', 'Perret', 'Da Costa', 'Claireaux', 'Leclerc', 'Rech', 'Chakiachvili', 'Abit', 'Hardy', 'Guttig', 'Bozon', 'Douay', 'Quemener', 'Bussiere']
  },
  AUT: {
    first: ['Marco', 'Michael', 'Thomas', 'Dominic', 'Lukas', 'Peter', 'Benjamin', 'Manuel', 'Fabio', 'Patrick', 'David', 'Bernd', 'Konstantin', 'Clemens', 'Rafael', 'Erik', 'Vinzenz', 'Paul', 'Dominique', 'Tobias'],
    last: ['Rossi', 'Raffl', 'Vanek', 'Zwerger', 'Haudum', 'Schneider', 'Herburger', 'Ganahl', 'Hofer', 'Kasper', 'Starkbaum', 'Wolf', 'Lebler', 'Unterweger', 'Huber', 'Achermann', 'Nissner', 'Brunner', 'Baumgartner', 'Heinrich']
  },
  KAZ: {
    first: ['Nikita', 'Dmitri', 'Roman', 'Kirill', 'Alikhan', 'Artur', 'Damir', 'Maxim', 'Ilya', 'Yegor', 'Alexei', 'Andrei', 'Stanislav', 'Leonid', 'Pavel', 'Vladislav', 'Yevgeni', 'Sergei', 'Denis', 'Oleg'],
    last: ['Mikhailis', 'Shevchenko', 'Starchenko', 'Savitsky', 'Asetov', 'Sagadeyev', 'Metalnikov', 'Svedberg', 'Valk', 'Petrov', 'Rymarev', 'Dietz', 'Orekhovskiy', 'Shin', 'Akolzin', 'Shalapov', 'Blacker', 'Saginadze', 'Kuzmin', 'Voronov']
  },
  SLO: {
    first: ['Anze', 'Jan', 'Robert', 'Rok', 'Miha', 'Ales', 'Luka', 'Ziga', 'Bostjan', 'Gasper', 'Matic', 'Tadej', 'Nejc', 'Marcel', 'Blaz', 'Ken', 'Nik', 'David', 'Jakob', 'Urban'],
    last: ['Kopitar', 'Mursak', 'Sabolic', 'Ticar', 'Verlic', 'Music', 'Vidmar', 'Jeglic', 'Goldmann', 'Kroselj', 'Ograjensek', 'Kuralt', 'Pretnar', 'Rodman', 'Gregorc', 'Cimzar', 'Tomazevic', 'Us', 'Svetina', 'Hebar']
  },
  GBR: {
    first: ['Ben', 'Liam', 'Robert', 'Brendan', 'Brett', 'Mark', 'Colin', 'Jonathan', 'Matthew', 'David', 'Sam', 'Evan', 'Luke', 'Joshua', 'Ciaran', 'Dallas', 'Mike', 'Stephen', 'Josh', 'Lewis'],
    last: ['Davies', 'Kirk', 'Sherwell', 'Sherlock', 'Sheridan', 'Sherwood', 'Sherstone', 'Sherling', 'Sheridan', 'Sherwick', 'Sherberry', 'Shermarket', 'Dowd', 'Sheringham', 'Lake', 'Sherridge', 'Sherfield', 'Sherby', 'Shergate', 'Shertown']
  },
  HUN: {
    first: ['Balazs', 'Istvan', 'Csanad', 'Vilmos', 'Janos', 'Gergo', 'Bence', 'Daniel', 'Adam', 'Kevin', 'Tamas', 'Zsombor', 'Mate', 'Peter', 'Krisztian', 'Nandor', 'Marton', 'Gabor', 'Zoltan', 'Miklos'],
    last: ['Szabo', 'Nagy', 'Horvath', 'Toth', 'Varga', 'Kiss', 'Molnar', 'Nemeth', 'Farkas', 'Balogh', 'Papp', 'Takacs', 'Juhasz', 'Kovacs', 'Erdei', 'Gal', 'Fejes', 'Sofron', 'Hári', 'Galló']
  },
  ITA: {
    first: ['Daniel', 'Marco', 'Luca', 'Simon', 'Angelo', 'Alex', 'Peter', 'Thomas', 'Ivan', 'Hans', 'Raphael', 'Armin', 'Phil', 'Diego', 'Andreas', 'Markus', 'Christian', 'Patrick', 'Stefan', 'Martin'],
    last: ['Mantenuto', 'Rosa', 'Sanna', 'Kostner', 'Miceli', 'Trivellato', 'Insam', 'Larkin', 'Deluca', 'Pföstl', 'Gander', 'Hochkofler', 'Pietroniro', 'Magnabosco', 'Frank', 'Andergassen', 'Morini', 'Hannoun', 'Bernard', 'Frycklund']
  },
  POL: {
    first: ['Krzysztof', 'Bartosz', 'Maciej', 'Mateusz', 'Patryk', 'Wojciech', 'Alan', 'Kamil', 'Aron', 'Dominik', 'Jakub', 'Mariusz', 'Tomasz', 'Michal', 'Filip', 'Pawel', 'Dawid', 'Adrian', 'Radoslaw', 'Lukasz'],
    last: ['Zygmunt', 'Kowalczyk', 'Wronka', 'Ciura', 'Vay', 'Stasiewicz', 'Lyszczarczyk', 'Walega', 'Chmielewski', 'Gorny', 'Urbanowicz', 'Kolusz', 'Wajda', 'Szmatula', 'Nalewajka', 'Bryk', 'Kazula', 'Goscinski', 'Rompkowski', 'Jarosz']
  },
  KOR: {
    first: ['Sang-Hoon', 'Jin-Hui', 'Sung-Je', 'Hyun-Soo', 'Ki-Sung', 'Min-Woo', 'Brock', 'Michael', 'Bryan', 'Alex', 'Jung-Min', 'Dong-Hwan', 'Yun-Sang', 'Seung-Hwan', 'Minho', 'Jae-Hyuk', 'Kyung-Hwan', 'Tae-Hoon', 'Won-Jun', 'Han-Sol'],
    last: ['Shin', 'Cho', 'Kim', 'Lee', 'Park', 'Jung', 'Kang', 'Yoon', 'Choi', 'Han', 'Jang', 'Lim', 'Oh', 'Seo', 'Song', 'Ahn', 'Hwang', 'Ryu', 'Baek', 'Moon']
  },
  JPN: {
    first: ['Yushiroh', 'Kohei', 'Takeshi', 'Hiroki', 'Rui', 'Shuto', 'Akira', 'Taro', 'Kenji', 'Ryuto', 'Yuki', 'Daiki', 'Sora', 'Haruki', 'Hayato', 'Ren', 'Kenta', 'Ryosuke', 'Tatsuya', 'Shoma'],
    last: ['Hirano', 'Yamamoto', 'Tanaka', 'Suzuki', 'Watanabe', 'Sato', 'Takahashi', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Ito', 'Shimizu', 'Nishiwaki', 'Tokunaga', 'Furuhashi', 'Iwatsuki', 'Otsuka', 'Kitagawa', 'Haga']
  },
  LTU: {
    first: ['Dainius', 'Mantas', 'Rokas', 'Eimantas', 'Arnoldas', 'Lukas', 'Povilas', 'Tomas', 'Ugnius', 'Domas', 'Edgaras', 'Mindaugas', 'Aivaras', 'Justas', 'Nerijus', 'Dominykas', 'Karolis', 'Giedrius', 'Paulius', 'Antanas'],
    last: ['Zubrus', 'Kaleinikovas', 'Cizas', 'Rulevicius', 'Protcenko', 'Gintautas', 'Katulis', 'Bosas', 'Grigalionis', 'Sviskevicius', 'Aliukonis', 'Cetvertak', 'Lapenis', 'Garbuzas', 'Maciulis', 'Jonauskas', 'Vaitiekunas', 'Rimkus', 'Paukstys', 'Jasinevicius']
  },
  ROU: {
    first: ['Robert', 'Csaba', 'Attila', 'Gergo', 'Hunor', 'Szabolcs', 'Levente', 'Albert', 'Andras', 'Zsolt', 'Ferenc', 'Imre', 'Lorand', 'Norbert', 'Tamas', 'Gheorghe', 'Bogdan', 'Mihai', 'Stefan', 'Alexandru'],
    last: ['Gergely', 'Biro', 'Adorjan', 'Fejes', 'Balazs', 'Rokaly', 'Geczi', 'Molnar', 'Kiss', 'Szabo', 'Toth', 'Varga', 'Kovacs', 'Nagy', 'Fodor', 'Galfi', 'Vincze', 'Bartalis', 'Antal', 'Kelemen']
  },
  UKR: {
    first: ['Dmytro', 'Oleksiy', 'Denys', 'Vladyslav', 'Artem', 'Yevhen', 'Andriy', 'Sergiy', 'Anton', 'Maksym', 'Bohdan', 'Oleksandr', 'Vitaliy', 'Ruslan', 'Mykola', 'Roman', 'Ivan', 'Kostiantyn', 'Viktor', 'Taras'],
    last: ['Timashov', 'Blokhin', 'Peresunko', 'Komarov', 'Gavrik', 'Perehoduk', 'Merezhko', 'Nimenko', 'Varyvdin', 'Tymchenko', 'Kravchenko', 'Shevchenko', 'Lysenko', 'Bondarenko', 'Boyko', 'Marchenko', 'Tkachenko', 'Zhuk', 'Pylypenko', 'Bilyi']
  }
};

// Generate a roster of 25 players for a national team
function generateRoster(countryCode, teamPower) {
  const pool = namePools[countryCode];
  if (!pool) return [];

  const roster = [];
  const usedNames = new Set();

  function pickUniqueName() {
    let attempts = 0;
    let first, last, fullName;
    do {
      first = pool.first[Math.floor(Math.random() * pool.first.length)];
      last = pool.last[Math.floor(Math.random() * pool.last.length)];
      fullName = `${first} ${last}`;
      attempts++;
    } while (usedNames.has(fullName) && attempts < 50);
    usedNames.add(fullName);
    return { firstName: first, lastName: last };
  }

  function clampSkill(val) {
    return Math.max(40, Math.min(99, Math.round(val)));
  }

  function generateSkill(base, variance = 15) {
    return clampSkill(base + (Math.random() - 0.5) * 2 * variance);
  }

  // Position breakdown: 3 goalies, 8 defensemen, 14 forwards
  const positions = [
    ...Array(3).fill('G'),
    ...Array(8).fill('D'),
    ...Array(14).fill('F')
  ];

  // Jersey numbers - avoid duplicates
  const usedNumbers = new Set();
  function pickJersey(position) {
    let num;
    if (position === 'G') {
      const goalieNums = [1, 29, 30, 31, 33, 35, 37, 39, 40];
      const available = goalieNums.filter(n => !usedNumbers.has(n));
      num = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
    }
    if (!num) {
      do {
        num = Math.floor(Math.random() * 97) + 2; // 2-98
      } while (usedNumbers.has(num));
    }
    usedNumbers.add(num);
    return num;
  }

  for (const position of positions) {
    const { firstName, lastName } = pickUniqueName();
    const jersey = pickJersey(position);

    let shooting, skating, passing, defenseSkill, physical;

    if (position === 'G') {
      // Goalies: high defense, lower shooting
      shooting = generateSkill(teamPower - 20, 10);
      skating = generateSkill(teamPower - 10, 12);
      passing = generateSkill(teamPower - 15, 10);
      defenseSkill = generateSkill(teamPower + 5, 10);
      physical = generateSkill(teamPower - 10, 12);
    } else if (position === 'D') {
      // Defensemen: balanced, higher defense
      shooting = generateSkill(teamPower - 5, 15);
      skating = generateSkill(teamPower, 12);
      passing = generateSkill(teamPower, 12);
      defenseSkill = generateSkill(teamPower + 3, 12);
      physical = generateSkill(teamPower + 2, 12);
    } else {
      // Forwards: high shooting/passing
      shooting = generateSkill(teamPower + 3, 15);
      skating = generateSkill(teamPower + 2, 12);
      passing = generateSkill(teamPower + 3, 12);
      defenseSkill = generateSkill(teamPower - 5, 12);
      physical = generateSkill(teamPower - 2, 12);
    }

    roster.push({
      firstName,
      lastName,
      countryCode,
      position,
      jerseyNumber: jersey,
      shooting,
      skating,
      passing,
      defenseSkill,
      physical
    });
  }

  return roster;
}

module.exports = { namePools, generateRoster };
