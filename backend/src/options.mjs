/**
 * @typedef {'html' | 'csv'} Format
 */

/**
 * @typedef {Object} DateRange
 * @property {Date} start
 * @property {Date} end
 */

/**
 * Supported options when running the program.
 */
export class Options {
  /**
   * @param {Object} userInput
   */
  constructor(userInput) {
    /**
     * Output format (HTML or CSV).
     * @type {Format}
     */
    this.format = parseFormat(userInput);

    /**
     * Date range to use to collect usage of on-demand tables.
     * @type {DateRange}
     */
    this.dateRange = parseDateRange(userInput);
  }

}

export const OPTION_FORMAT = 'format';
export const supportedFormats = ['html', 'csv'];
export const defaultFormat = 'html';
export const OPTION_FROM_DATE = 'from-date';
export const OPTION_TO_DATE = 'to-date';

/**
 * @param {Object} inputs
 * @return {Format}
 */
const parseFormat = (inputs) => {
  const format = inputs[OPTION_FORMAT];
  if (format !== undefined) {
    if (supportedFormats.includes(format)) {
      return format
    } else {
      throw `Unsupported format '${format}'. Valid formats are ${supportedFormats.map(f => `'${f}'`).join(', ')}.`
    }
  } else {
    return defaultFormat
  }
};

/**
 * @param {Object} inputs
 * @return {DateRange}
 */
const parseDateRange = (inputs) => {
  const fromDate = inputs[OPTION_FROM_DATE];
  const toDate = inputs[OPTION_TO_DATE];
  if (fromDate !== undefined) {
    const start = parseDate(fromDate);
    const end = toDate !== undefined ? parseDate(toDate) : new Date();
    if (end <= start) {
      throw `Invalid combination of parameters: '${OPTION_FROM_DATE}' must be before '${OPTION_TO_DATE}'`;
    }
    return { start, end }
  } else if (toDate === undefined) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    return { start: thirtyDaysAgo, end: now }
  } else {
    throw `Invalid combination of parameters: '${OPTION_FROM_DATE}' must be supplied if '${OPTION_TO_DATE}' is supplied`;
  }
};

/**
 * @param {string} str
 * @return {Date}
 */
export const parseDate = (str) => {
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    throw `Invalid date: ${str}. Please use the format 'YYYY-MM-DD'.`
  }
  return date
};
