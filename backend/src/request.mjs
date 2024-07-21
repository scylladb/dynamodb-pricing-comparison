/**
 * @typedef {'html' | 'csv'} Format
 */

export class Request {
  constructor() {
    /** @type {Format} */
    this.format = 'html';
  }

  /** @param {Format} format */
  withFormat(format) {
    this.format = format;
  }
}
