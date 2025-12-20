// Realistic name database for ski jumping countries
// Based on actual ski jumping nations and their typical names

const nationalNames = {
  // Norway - dominant nation
  NOR: {
    firstNames: ['Anders', 'Daniel', 'Halvor', 'Johann', 'Marius', 'Robert', 'Stefan', 'Thomas', 'Kenneth', 'Bjørn', 'Erik', 'Lars', 'Ole', 'Per', 'Sigurd', 'Tom', 'Andreas', 'Fredrik', 'Kristoffer', 'Magnus'],
    lastNames: ['Johansson', 'Forfang', 'Granerud', 'Tande', 'Lindvik', 'Fannemel', 'Jacobsen', 'Hilde', 'Pedersen', 'Stjernen', 'Gangnes', 'Bardal', 'Evensen', 'Romoeren', 'Småsveen', 'Aalbu', 'Ringen', 'Bjoereng', 'Haukedal', 'Villumstad']
  },
  // Austria - traditional power
  AUT: {
    firstNames: ['Stefan', 'Michael', 'Manuel', 'Gregor', 'Thomas', 'Daniel', 'Andreas', 'Jan', 'Philipp', 'Markus', 'Clemens', 'Wolfgang', 'Martin', 'Florian', 'Dominik', 'Sebastian', 'Christian', 'Lukas', 'Patrick', 'Benjamin'],
    lastNames: ['Kraft', 'Hayböck', 'Fettner', 'Schlierenzauer', 'Morgenstern', 'Hörl', 'Aigner', 'Huber', 'Aschenwald', 'Poppinger', 'Lackner', 'Diethart', 'Loitzl', 'Kofler', 'Iraschko', 'Müller', 'Brandner', 'Leitner', 'Steiner', 'Egger']
  },
  // Germany
  GER: {
    firstNames: ['Karl', 'Andreas', 'Markus', 'Severin', 'Pius', 'Constantin', 'Stephan', 'Martin', 'Richard', 'Felix', 'David', 'Maximilian', 'Philipp', 'Simon', 'Johannes', 'Luca', 'Moritz', 'Paul', 'Tim', 'Nico'],
    lastNames: ['Geiger', 'Wellinger', 'Eisenbichler', 'Freund', 'Leyhe', 'Paschke', 'Schmid', 'Freitag', 'Wank', 'Barthel', 'Raimund', 'Neumayer', 'Uhrmann', 'Späth', 'Heß', 'Hamann', 'Schuster', 'Vogt', 'Lackner', 'Höfer']
  },
  // Poland
  POL: {
    firstNames: ['Kamil', 'Dawid', 'Piotr', 'Stefan', 'Jakub', 'Maciej', 'Aleksander', 'Klemens', 'Paweł', 'Tomasz', 'Andrzej', 'Krzysztof', 'Marcin', 'Bartosz', 'Wojciech', 'Adam', 'Michał', 'Łukasz', 'Grzegorz', 'Rafał'],
    lastNames: ['Stoch', 'Kubacki', 'Żyła', 'Wolny', 'Murańka', 'Kot', 'Hula', 'Zniszczoł', 'Pilch', 'Kołodziejczyk', 'Przybyła', 'Wąsek', 'Jarząbek', 'Tajner', 'Małysz', 'Biegun', 'Klimov', 'Łomnicki', 'Kowalski', 'Nowak']
  },
  // Japan
  JPN: {
    firstNames: ['Ryoyu', 'Yukiya', 'Junshiro', 'Naoki', 'Daiki', 'Keiichi', 'Taku', 'Noriaki', 'Yuki', 'Shohei', 'Kazuyoshi', 'Masahiko', 'Hideharu', 'Takanobu', 'Kenji', 'Hiroshi', 'Satoshi', 'Yoshiaki', 'Takumi', 'Ryo'],
    lastNames: ['Kobayashi', 'Sato', 'Kasai', 'Nakamura', 'Ito', 'Sakuyama', 'Takeuchi', 'Okabe', 'Funaki', 'Harada', 'Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe', 'Yoshida', 'Matsumoto', 'Kimura', 'Hayashi', 'Shimizu', 'Mori']
  },
  // Slovenia
  SLO: {
    firstNames: ['Anže', 'Peter', 'Timi', 'Domen', 'Rok', 'Jernej', 'Žiga', 'Lovro', 'Cene', 'Tilen', 'Matjaž', 'Primož', 'Jurij', 'Robert', 'Bor', 'Jan', 'Luka', 'Nejc', 'Matic', 'Urban'],
    lastNames: ['Lanišek', 'Prevc', 'Zajc', 'Kos', 'Damjan', 'Jelar', 'Pavlovčič', 'Kranjec', 'Bartol', 'Semenič', 'Pungertar', 'Zupančič', 'Hvala', 'Dezman', 'Tepeš', 'Kraus', 'Peterka', 'Žont', 'Bogataj', 'Rogelj']
  },
  // Switzerland
  SUI: {
    firstNames: ['Simon', 'Gregor', 'Killian', 'Dominik', 'Andreas', 'Pascal', 'Marco', 'Sandro', 'Luca', 'Fabio', 'Reto', 'Stefan', 'Christoph', 'Tobias', 'Jonas', 'Nico', 'Benjamin', 'David', 'Florian', 'Patrick'],
    lastNames: ['Ammann', 'Deschwanden', 'Peier', 'Peter', 'Schuler', 'Egloff', 'Hauswirth', 'Karlen', 'Sommer', 'Baumann', 'Künzle', 'Bracher', 'Imhof', 'Kälin', 'Moser', 'Renggli', 'Schmid', 'Steiner', 'Weber', 'Müller']
  },
  // Finland
  FIN: {
    firstNames: ['Antti', 'Jarkko', 'Eetu', 'Niko', 'Arttu', 'Ville', 'Kalle', 'Janne', 'Matti', 'Lauri', 'Sami', 'Toni', 'Olli', 'Mikko', 'Juha', 'Pekka', 'Aki', 'Teemu', 'Henri', 'Aleksi'],
    lastNames: ['Aalto', 'Nousiainen', 'Mäkinen', 'Ahonen', 'Olli', 'Hautamäki', 'Happonen', 'Muotka', 'Larinto', 'Jokinen', 'Korhonen', 'Virtanen', 'Lehtinen', 'Heikkinen', 'Nieminen', 'Koskela', 'Laine', 'Hämäläinen', 'Salminen', 'Turunen']
  },
  // Czech Republic
  CZE: {
    firstNames: ['Roman', 'Viktor', 'Jan', 'Čestmír', 'Tomáš', 'Jakub', 'Filip', 'David', 'Lukáš', 'Martin', 'Petr', 'Ondřej', 'Vojtěch', 'Michal', 'Pavel', 'Adam', 'Daniel', 'Josef', 'Marek', 'Jiří'],
    lastNames: ['Koudelka', 'Polášek', 'Matura', 'Sakala', 'Janda', 'Kozisek', 'Hajek', 'Vancura', 'Hlava', 'Sedlák', 'Kožíšek', 'Štursa', 'Vaculík', 'Jiroutek', 'Skoček', 'Novák', 'Dvořák', 'Horák', 'Procházka', 'Svoboda']
  },
  // Russia
  RUS: {
    firstNames: ['Evgeniy', 'Ilya', 'Mikhail', 'Denis', 'Dimitri', 'Roman', 'Alexei', 'Sergei', 'Vladimir', 'Andrei', 'Nikolai', 'Pavel', 'Ivan', 'Maksim', 'Artem', 'Viktor', 'Konstantin', 'Aleksandr', 'Yuri', 'Oleg'],
    lastNames: ['Klimov', 'Nazarov', 'Kornilov', 'Romashov', 'Vassiliev', 'Fatkullin', 'Bazhenov', 'Trofimov', 'Karpenko', 'Ivanov', 'Petrov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev', 'Kozlov', 'Novikov', 'Morozov', 'Volkov']
  },
  // Italy
  ITA: {
    firstNames: ['Giovanni', 'Francesco', 'Alessandro', 'Alex', 'Davide', 'Sebastian', 'Andrea', 'Roberto', 'Marco', 'Luca', 'Federico', 'Matteo', 'Lorenzo', 'Stefano', 'Paolo', 'Giuseppe', 'Antonio', 'Daniele', 'Simone', 'Michele'],
    lastNames: ['Bresadola', 'Insam', 'Cecon', 'Colloredo', 'Dellasega', 'Morassi', 'Runggaldier', 'Pittin', 'Malsiner', 'Bianchi', 'Rossi', 'Ferrari', 'Romano', 'Galli', 'Costa', 'Fontana', 'Conti', 'Ricci', 'Marino', 'Greco']
  },
  // USA
  USA: {
    firstNames: ['Kevin', 'Casey', 'Nicholas', 'Anders', 'Michael', 'Patrick', 'William', 'James', 'Thomas', 'Ryan', 'Matthew', 'Daniel', 'Christopher', 'Joshua', 'Andrew', 'David', 'John', 'Robert', 'Steven', 'Brandon'],
    lastNames: ['Bickner', 'Larson', 'Fairall', 'Johnson', 'Alexander', 'Glasder', 'Smith', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson']
  },
  // Canada
  CAN: {
    firstNames: ['Mackenzie', 'Matthew', 'Trevor', 'Stefan', 'Adam', 'Tyler', 'Ryan', 'Connor', 'Kyle', 'Justin', 'Nathan', 'Evan', 'Brandon', 'Dylan', 'Jordan', 'Austin', 'Cameron', 'Devon', 'Mitchell', 'Logan'],
    lastNames: ['Boyd-Clowes', 'Gorham', 'Frenette', 'Read', 'Thompson', 'Campbell', 'Stewart', 'Turner', 'Phillips', 'Parker', 'Evans', 'Edwards', 'Collins', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy']
  },
  // Kazakhstan
  KAZ: {
    firstNames: ['Alexei', 'Nikolay', 'Sergey', 'Dmitriy', 'Viktor', 'Andrey', 'Roman', 'Pavel', 'Ivan', 'Yevgeniy', 'Vladislav', 'Artyom', 'Denis', 'Aleksandr', 'Maksim', 'Oleg', 'Mikhail', 'Ruslan', 'Timur', 'Danil'],
    lastNames: ['Zhaparov', 'Karpenko', 'Sokolenko', 'Muminov', 'Levkin', 'Tkachenko', 'Savenko', 'Kovalenko', 'Bondarenko', 'Zaytsev', 'Marchenko', 'Shevchenko', 'Polishchuk', 'Melnik', 'Boyko', 'Kravchenko', 'Lysenko', 'Rudenko', 'Petrenko', 'Moroz']
  },
  // Estonia
  EST: {
    firstNames: ['Kristjan', 'Artti', 'Kaarel', 'Kevin', 'Silver', 'Markus', 'Karl', 'Martin', 'Andreas', 'Rainer', 'Tanel', 'Rauno', 'Andres', 'Jaan', 'Mart', 'Tarmo', 'Toomas', 'Urmas', 'Indrek', 'Meelis'],
    lastNames: ['Ilves', 'Aigro', 'Nurmsalu', 'Laan', 'Kang', 'Tamm', 'Sepp', 'Pärn', 'Kask', 'Rebane', 'Kukk', 'Mägi', 'Vaher', 'Saare', 'Lepik', 'Saar', 'Kivi', 'Ots', 'Rand', 'Koppel']
  },
  // South Korea
  KOR: {
    firstNames: ['Choi', 'Kim', 'Park', 'Lee', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Im', 'Seo', 'Han', 'Oh', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yu', 'Hong'],
    lastNames: ['Heung-chul', 'Seong-jin', 'Min-su', 'Hyun-ki', 'Ji-hwan', 'Dong-wook', 'Sung-hyun', 'Yong-jik', 'Jun-young', 'Tae-hoon', 'Woo-jin', 'Jae-won', 'Seung-hoon', 'Young-woo', 'Ki-young', 'Dae-sung', 'Chang-min', 'Jin-woo', 'Hyung-jun', 'Sang-ho']
  },
  // France
  FRA: {
    firstNames: ['Vincent', 'Jonathan', 'Ronan', 'Mathis', 'Nicolas', 'Léo', 'Thomas', 'Antoine', 'Julien', 'Pierre', 'Alexandre', 'Maxime', 'Lucas', 'Hugo', 'Paul', 'Louis', 'Théo', 'Clément', 'Romain', 'Adrien'],
    lastNames: ['Descombes Sevoie', 'Learoyd', 'Lamy Chappuis', 'Clair', 'Foubert', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefevre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet']
  },
  // Bulgaria
  BUL: {
    firstNames: ['Vladimir', 'Dimitar', 'Georgi', 'Nikolay', 'Aleksandar', 'Ivan', 'Petar', 'Stefan', 'Todor', 'Hristo', 'Yordan', 'Krasimir', 'Plamen', 'Stanislav', 'Valentin', 'Ivaylo', 'Boris', 'Vasil', 'Angel', 'Kiril'],
    lastNames: ['Zografski', 'Petrov', 'Ivanov', 'Dimitrov', 'Georgiev', 'Todorov', 'Stoyanov', 'Nikolov', 'Hristov', 'Kolev', 'Angelov', 'Vasilev', 'Metodiev', 'Kovachev', 'Kostov', 'Popov', 'Simeonov', 'Marinov', 'Alexandrov', 'Stefanov']
  },
  // Romania
  ROU: {
    firstNames: ['Nicolae', 'Andrei', 'Mihai', 'Alexandru', 'Gabriel', 'Daniel', 'Cristian', 'Adrian', 'Florin', 'Ionut', 'Valentin', 'Marius', 'Bogdan', 'Cosmin', 'Razvan', 'Vlad', 'Stefan', 'Dragos', 'Lucian', 'Catalin'],
    lastNames: ['Mitrofan', 'Popescu', 'Ionescu', 'Popa', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Marin', 'Constantin', 'Florea', 'Barbu', 'Nicolae', 'Cristea', 'Lazar', 'Moldovan', 'Rusu', 'Dinu', 'Tudor', 'Munteanu']
  },
  // Turkey
  TUR: {
    firstNames: ['Fatih', 'Murat', 'Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hasan', 'Huseyin', 'Osman', 'Yusuf', 'Ibrahim', 'Burak', 'Emre', 'Can', 'Serkan', 'Kerem', 'Arda', 'Baris', 'Omer', 'Enes'],
    lastNames: ['Arda', 'Ipcioglu', 'Yilmaz', 'Demir', 'Kaya', 'Sahin', 'Celik', 'Yildiz', 'Ozturk', 'Aydin', 'Arslan', 'Dogan', 'Kilic', 'Aslan', 'Cetin', 'Koc', 'Kurt', 'Ozdemir', 'Simsek', 'Polat']
  }
};

// Country distribution for ski jumping (based on real-world strength)
// Total should add up to about 80 jumpers
const countryDistribution = {
  NOR: 10,  // Norway - strongest nation
  AUT: 10,  // Austria
  GER: 10,  // Germany
  POL: 8,   // Poland
  JPN: 8,   // Japan
  SLO: 7,   // Slovenia
  SUI: 5,   // Switzerland
  FIN: 5,   // Finland
  CZE: 4,   // Czech Republic
  RUS: 3,   // Russia
  ITA: 3,   // Italy
  USA: 2,   // USA
  CAN: 1,   // Canada
  KAZ: 1,   // Kazakhstan
  EST: 1,   // Estonia
  KOR: 1,   // South Korea
  FRA: 1,   // France
};

// Country codes to full names mapping (all world nations)
const countryNames = {
  // Ski jumping nations (with name generation support)
  NOR: 'Norway',
  AUT: 'Austria',
  GER: 'Germany',
  POL: 'Poland',
  JPN: 'Japan',
  SLO: 'Slovenia',
  SUI: 'Switzerland',
  FIN: 'Finland',
  CZE: 'Czech Republic',
  RUS: 'Russia',
  ITA: 'Italy',
  USA: 'United States',
  CAN: 'Canada',
  KAZ: 'Kazakhstan',
  EST: 'Estonia',
  KOR: 'South Korea',
  FRA: 'France',
  BUL: 'Bulgaria',
  ROU: 'Romania',
  TUR: 'Turkey',
  // All other world nations
  AFG: 'Afghanistan',
  ALB: 'Albania',
  ALG: 'Algeria',
  AND: 'Andorra',
  ANG: 'Angola',
  ANT: 'Antigua and Barbuda',
  ARG: 'Argentina',
  ARM: 'Armenia',
  AUS: 'Australia',
  AZE: 'Azerbaijan',
  BAH: 'Bahamas',
  BRN: 'Bahrain',
  BAN: 'Bangladesh',
  BAR: 'Barbados',
  BLR: 'Belarus',
  BEL: 'Belgium',
  BIZ: 'Belize',
  BEN: 'Benin',
  BHU: 'Bhutan',
  BOL: 'Bolivia',
  BIH: 'Bosnia and Herzegovina',
  BOT: 'Botswana',
  BRA: 'Brazil',
  BRU: 'Brunei',
  BUR: 'Burkina Faso',
  BDI: 'Burundi',
  CPV: 'Cabo Verde',
  CAM: 'Cambodia',
  CMR: 'Cameroon',
  CAF: 'Central African Republic',
  CHA: 'Chad',
  CHI: 'Chile',
  CHN: 'China',
  COL: 'Colombia',
  COM: 'Comoros',
  CGO: 'Congo',
  COD: 'DR Congo',
  CRC: 'Costa Rica',
  CIV: 'Côte d\'Ivoire',
  CRO: 'Croatia',
  CUB: 'Cuba',
  CYP: 'Cyprus',
  DEN: 'Denmark',
  DJI: 'Djibouti',
  DMA: 'Dominica',
  DOM: 'Dominican Republic',
  ECU: 'Ecuador',
  EGY: 'Egypt',
  ESA: 'El Salvador',
  GEQ: 'Equatorial Guinea',
  ERI: 'Eritrea',
  SWZ: 'Eswatini',
  ETH: 'Ethiopia',
  FIJ: 'Fiji',
  GAB: 'Gabon',
  GAM: 'Gambia',
  GEO: 'Georgia',
  GHA: 'Ghana',
  GBR: 'Great Britain',
  GRE: 'Greece',
  GRN: 'Grenada',
  GUA: 'Guatemala',
  GUI: 'Guinea',
  GBS: 'Guinea-Bissau',
  GUY: 'Guyana',
  HAI: 'Haiti',
  HON: 'Honduras',
  HKG: 'Hong Kong',
  HUN: 'Hungary',
  ISL: 'Iceland',
  IND: 'India',
  INA: 'Indonesia',
  IRI: 'Iran',
  IRQ: 'Iraq',
  IRL: 'Ireland',
  ISR: 'Israel',
  JAM: 'Jamaica',
  JOR: 'Jordan',
  KEN: 'Kenya',
  PRK: 'North Korea',
  KUW: 'Kuwait',
  KGZ: 'Kyrgyzstan',
  LAO: 'Laos',
  LAT: 'Latvia',
  LBN: 'Lebanon',
  LES: 'Lesotho',
  LBR: 'Liberia',
  LBA: 'Libya',
  LIE: 'Liechtenstein',
  LTU: 'Lithuania',
  LUX: 'Luxembourg',
  MAD: 'Madagascar',
  MAW: 'Malawi',
  MAS: 'Malaysia',
  MDV: 'Maldives',
  MLI: 'Mali',
  MLT: 'Malta',
  MTN: 'Mauritania',
  MRI: 'Mauritius',
  MEX: 'Mexico',
  MDA: 'Moldova',
  MON: 'Monaco',
  MGL: 'Mongolia',
  MNE: 'Montenegro',
  MAR: 'Morocco',
  MOZ: 'Mozambique',
  MYA: 'Myanmar',
  NAM: 'Namibia',
  NEP: 'Nepal',
  NED: 'Netherlands',
  NZL: 'New Zealand',
  NCA: 'Nicaragua',
  NIG: 'Niger',
  NGR: 'Nigeria',
  MKD: 'North Macedonia',
  OMA: 'Oman',
  PAK: 'Pakistan',
  PLE: 'Palestine',
  PAN: 'Panama',
  PNG: 'Papua New Guinea',
  PAR: 'Paraguay',
  PER: 'Peru',
  PHI: 'Philippines',
  POR: 'Portugal',
  PUR: 'Puerto Rico',
  QAT: 'Qatar',
  KOS: 'Kosovo',
  RWA: 'Rwanda',
  SKN: 'Saint Kitts and Nevis',
  LCA: 'Saint Lucia',
  VIN: 'Saint Vincent and the Grenadines',
  SAM: 'Samoa',
  SMR: 'San Marino',
  STP: 'São Tomé and Príncipe',
  KSA: 'Saudi Arabia',
  SEN: 'Senegal',
  SRB: 'Serbia',
  SEY: 'Seychelles',
  SLE: 'Sierra Leone',
  SGP: 'Singapore',
  SVK: 'Slovakia',
  RSA: 'South Africa',
  SSD: 'South Sudan',
  ESP: 'Spain',
  SRI: 'Sri Lanka',
  SUD: 'Sudan',
  SUR: 'Suriname',
  SWE: 'Sweden',
  SYR: 'Syria',
  TPE: 'Taiwan',
  TJK: 'Tajikistan',
  TAN: 'Tanzania',
  THA: 'Thailand',
  TLS: 'Timor-Leste',
  TOG: 'Togo',
  TGA: 'Tonga',
  TTO: 'Trinidad and Tobago',
  TUN: 'Tunisia',
  TKM: 'Turkmenistan',
  UGA: 'Uganda',
  UKR: 'Ukraine',
  UAE: 'United Arab Emirates',
  URU: 'Uruguay',
  UZB: 'Uzbekistan',
  VAN: 'Vanuatu',
  VEN: 'Venezuela',
  VIE: 'Vietnam',
  YEM: 'Yemen',
  ZAM: 'Zambia',
  ZIM: 'Zimbabwe'
};

module.exports = { nationalNames, countryDistribution, countryNames };
