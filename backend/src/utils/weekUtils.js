/**
 * ISO 8601 Week Number Utilities
 *
 * Week 1 is the week containing the first Thursday of the year.
 * Monday is the first day of the week.
 */

/**
 * Get ISO week number and year from a date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {{ week: number, year: number }}
 */
function getISOWeekNumber(dateString) {
  const date = new Date(dateString + 'T00:00:00Z')

  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)

  // Get first day of year
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))

  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)

  return {
    week: weekNo,
    year: date.getUTCFullYear()
  }
}

/**
 * Get week key string from a date (e.g., "2024-W48")
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Week key in format "YYYY-WXX"
 */
function getWeekKey(dateString) {
  const { week, year } = getISOWeekNumber(dateString)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Parse a week key into year and week number
 * @param {string} weekKey - Week key in format "YYYY-WXX"
 * @returns {{ year: number, week: number }}
 */
function parseWeekKey(weekKey) {
  const [year, weekPart] = weekKey.split('-W')
  return {
    year: parseInt(year, 10),
    week: parseInt(weekPart, 10)
  }
}

/**
 * Get the Monday date for a given week key
 * @param {string} weekKey - Week key in format "YYYY-WXX"
 * @returns {Date}
 */
function getWeekStartDate(weekKey) {
  const { year, week } = parseWeekKey(weekKey)

  // Find January 4th of the year (always in week 1)
  const jan4 = new Date(Date.UTC(year, 0, 4))

  // Find the Monday of week 1
  const dayOfWeek = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1))

  // Add weeks to get to target week
  const targetMonday = new Date(week1Monday)
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)

  return targetMonday
}

/**
 * Get the date range (Monday to Sunday) for a given week key
 * @param {string} weekKey - Week key in format "YYYY-WXX"
 * @returns {{ start: Date, end: Date, dates: string[] }}
 */
function getWeekDateRange(weekKey) {
  const monday = getWeekStartDate(weekKey)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  // Generate all dates in the week
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  return {
    start: monday,
    end: sunday,
    dates
  }
}

/**
 * Format week key for display (e.g., "Week 48, 2024")
 * @param {string} weekKey - Week key in format "YYYY-WXX"
 * @returns {string}
 */
function formatWeekDisplay(weekKey) {
  const { year, week } = parseWeekKey(weekKey)
  return `Week ${week}, ${year}`
}

/**
 * Get day name from date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string}
 */
function getDayName(dateString) {
  const date = new Date(dateString + 'T00:00:00Z')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getUTCDay()]
}

/**
 * Get short day name from date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string}
 */
function getShortDayName(dateString) {
  const date = new Date(dateString + 'T00:00:00Z')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getUTCDay()]
}

module.exports = {
  getISOWeekNumber,
  getWeekKey,
  parseWeekKey,
  getWeekStartDate,
  getWeekDateRange,
  formatWeekDisplay,
  getDayName,
  getShortDayName
}
