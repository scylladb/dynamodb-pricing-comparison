/**
 * @typedef {'html' | 'csv'} Format
 */

/**
 * @typedef {Object} DateRange
 * @property {Date} start
 * @property {Date} end
 */

export class Request {
  constructor() {
    /**
     * Output format (HTML or CSV).
     * @type {Format}
     */
    this.format = 'html';

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setUTCDate(oneMonthAgo.getUTCDate() - 30);
    /**
     * Date range to use to collect usage of on-demand tables.
     * @type {DateRange}
     */
    this.dateRange = {
      start: oneMonthAgo,
      end: now
    };
  }

  /** @param {Format} format */
  withFormat(format) {
    this.format = format;
  }

  /** @param {DateRange} dateRange */
  withDateRange(dateRange) {
    this.dateRange = dateRange;
  }
}
