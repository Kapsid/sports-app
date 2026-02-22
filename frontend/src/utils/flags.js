// Flag Utility - Provides flag images using flagcdn.com
// Maps tennis/IOC country codes to ISO 3166-1 alpha-2 codes

// Tennis/IOC code to ISO 2-letter code mapping
const COUNTRY_CODE_MAP = {
  // Major tennis nations
  'ESP': 'es', 'ITA': 'it', 'USA': 'us', 'FRA': 'fr', 'GER': 'de',
  'GBR': 'gb', 'AUS': 'au', 'RUS': 'ru', 'SRB': 'rs', 'ARG': 'ar',
  'CAN': 'ca', 'GRE': 'gr', 'POL': 'pl', 'NOR': 'no', 'CHI': 'cl',
  'JPN': 'jp', 'CRO': 'hr', 'SUI': 'ch', 'CZE': 'cz', 'BEL': 'be',

  // Additional countries
  'AUT': 'at', 'NED': 'nl', 'SWE': 'se', 'DEN': 'dk', 'FIN': 'fi',
  'POR': 'pt', 'BRA': 'br', 'MEX': 'mx', 'COL': 'co', 'URU': 'uy',
  'PER': 'pe', 'ECU': 'ec', 'VEN': 've', 'BOL': 'bo', 'PAR': 'py',
  'KOR': 'kr', 'CHN': 'cn', 'TPE': 'tw', 'IND': 'in', 'THA': 'th',
  'MAS': 'my', 'INA': 'id', 'PHI': 'ph', 'VIE': 'vn', 'SIN': 'sg',
  'NZL': 'nz', 'RSA': 'za', 'EGY': 'eg', 'TUN': 'tn', 'MAR': 'ma',
  'ISR': 'il', 'TUR': 'tr', 'UKR': 'ua', 'KAZ': 'kz', 'GEO': 'ge',
  'ARM': 'am', 'BLR': 'by', 'LAT': 'lv', 'LTU': 'lt', 'EST': 'ee',
  'SVK': 'sk', 'SVN': 'si', 'HUN': 'hu', 'ROU': 'ro', 'BUL': 'bg',
  'MNE': 'me', 'BIH': 'ba', 'ALB': 'al', 'MKD': 'mk', 'CYP': 'cy',
  'MLT': 'mt', 'LUX': 'lu', 'AND': 'ad', 'MON': 'mc', 'SMR': 'sm',
  'IRL': 'ie', 'WAL': 'gb-wls', 'SCO': 'gb-sct', 'ENG': 'gb-eng',

  // Less common
  'QAT': 'qa', 'UAE': 'ae', 'KSA': 'sa', 'BRN': 'bh', 'KUW': 'kw',
  'OMA': 'om', 'JOR': 'jo', 'LBN': 'lb', 'PAK': 'pk', 'SRI': 'lk',
  'NGR': 'ng', 'KEN': 'ke', 'ZIM': 'zw', 'BOT': 'bw'
};

// Full country names
const COUNTRY_NAMES = {
  'ESP': 'Spain', 'ITA': 'Italy', 'USA': 'United States', 'FRA': 'France', 'GER': 'Germany',
  'GBR': 'Great Britain', 'AUS': 'Australia', 'RUS': 'Russia', 'SRB': 'Serbia', 'ARG': 'Argentina',
  'CAN': 'Canada', 'GRE': 'Greece', 'POL': 'Poland', 'NOR': 'Norway', 'CHI': 'Chile',
  'JPN': 'Japan', 'CRO': 'Croatia', 'SUI': 'Switzerland', 'CZE': 'Czech Republic', 'BEL': 'Belgium',
  'AUT': 'Austria', 'NED': 'Netherlands', 'SWE': 'Sweden', 'DEN': 'Denmark', 'FIN': 'Finland',
  'POR': 'Portugal', 'BRA': 'Brazil', 'MEX': 'Mexico', 'COL': 'Colombia', 'URU': 'Uruguay',
  'PER': 'Peru', 'ECU': 'Ecuador', 'VEN': 'Venezuela', 'BOL': 'Bolivia', 'PAR': 'Paraguay',
  'KOR': 'South Korea', 'CHN': 'China', 'TPE': 'Chinese Taipei', 'IND': 'India', 'THA': 'Thailand',
  'MAS': 'Malaysia', 'INA': 'Indonesia', 'PHI': 'Philippines', 'VIE': 'Vietnam', 'SIN': 'Singapore',
  'NZL': 'New Zealand', 'RSA': 'South Africa', 'EGY': 'Egypt', 'TUN': 'Tunisia', 'MAR': 'Morocco',
  'ISR': 'Israel', 'TUR': 'Turkey', 'UKR': 'Ukraine', 'KAZ': 'Kazakhstan', 'GEO': 'Georgia',
  'ARM': 'Armenia', 'BLR': 'Belarus', 'LAT': 'Latvia', 'LTU': 'Lithuania', 'EST': 'Estonia',
  'SVK': 'Slovakia', 'SVN': 'Slovenia', 'HUN': 'Hungary', 'ROU': 'Romania', 'BUL': 'Bulgaria',
  'MNE': 'Montenegro', 'BIH': 'Bosnia and Herzegovina', 'ALB': 'Albania', 'MKD': 'North Macedonia',
  'CYP': 'Cyprus', 'MLT': 'Malta', 'LUX': 'Luxembourg', 'AND': 'Andorra', 'MON': 'Monaco',
  'SMR': 'San Marino', 'IRL': 'Ireland', 'WAL': 'Wales', 'SCO': 'Scotland', 'ENG': 'England',
  'QAT': 'Qatar', 'UAE': 'United Arab Emirates', 'KSA': 'Saudi Arabia', 'BRN': 'Bahrain',
  'KUW': 'Kuwait', 'OMA': 'Oman', 'JOR': 'Jordan', 'LBN': 'Lebanon', 'PAK': 'Pakistan',
  'SRI': 'Sri Lanka', 'NGR': 'Nigeria', 'KEN': 'Kenya', 'ZIM': 'Zimbabwe', 'BOT': 'Botswana'
};

/**
 * Get flag image URL from flagcdn.com
 * @param {string} countryCode - Tennis/IOC country code (e.g., 'ESP', 'USA')
 * @param {string} size - Size of flag ('16', '24', '32', '48', '64', '128', '256')
 * @returns {string} URL to flag image
 */
export function getFlagUrl(countryCode, size = '24') {
  if (!countryCode) return '';

  const isoCode = COUNTRY_CODE_MAP[countryCode.toUpperCase()];
  if (!isoCode) {
    // Try direct mapping if already ISO
    return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${countryCode.toLowerCase()}.png`;
  }

  // Return PNG flag from flagcdn
  return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${isoCode}.png`;
}

/**
 * Get SVG flag URL (better quality, scalable)
 * @param {string} countryCode - Tennis/IOC country code
 * @returns {string} URL to SVG flag
 */
export function getFlagSvgUrl(countryCode) {
  if (!countryCode) return '';

  const isoCode = COUNTRY_CODE_MAP[countryCode.toUpperCase()];
  if (!isoCode) {
    return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
  }

  return `https://flagcdn.com/${isoCode}.svg`;
}

/**
 * Get country name from code
 * @param {string} countryCode - Tennis/IOC country code
 * @returns {string} Full country name
 */
export function getCountryName(countryCode) {
  if (!countryCode) return '';
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}

/**
 * Get all available countries as an array for dropdowns
 * @returns {Array} Array of {code, name} objects
 */
export function getAllCountries() {
  return Object.entries(COUNTRY_NAMES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Convert ISO2 code to tennis code
 * @param {string} iso2 - ISO 3166-1 alpha-2 code
 * @returns {string} Tennis/IOC code or original if not found
 */
export function iso2ToTennisCode(iso2) {
  if (!iso2) return '';
  const lower = iso2.toLowerCase();
  for (const [tennis, iso] of Object.entries(COUNTRY_CODE_MAP)) {
    if (iso === lower) return tennis;
  }
  return iso2.toUpperCase();
}

export default {
  getFlagUrl,
  getFlagSvgUrl,
  getCountryName,
  getAllCountries,
  iso2ToTennisCode,
  COUNTRY_CODE_MAP,
  COUNTRY_NAMES
};
