/**
 * @callback Predicate
 * @template A
 * @param {A} value
 * @returns {boolean}
 */

/**
 * Partitions the `array` into two arrays where the first one contains
 * all the elements of the `array` for which `predicate` returns `true`,
 * and the second one contains all the elements of the `array` for which
 * `predicate` returns `false`.
 * @template A
 * @param array {Array<A>}
 * @param predicate {Predicate<A>}
 * @returns {[Array<A>, Array<A>]}
 */
export const partition = (array, predicate) =>
  array.reduce(
    (results, item) => {
      const [truthyGroup, falsyGroup] = results;
      const itemGroup = predicate(item) ? truthyGroup : falsyGroup;
      itemGroup.push(item);
      return results
    },
    [[], []]
  );

/** @type {number} */
export const kB = 1024;
/** @type {number} */
export const MB = 1024 * 1024;
/** @type {number} */
export const GB = 1024 * 1024 * 1024;
/** @type {number} */
export const TB = 1024 * 1024 * 1024 * 1024;

/**
 * @param {number} value
 * @returns {string}
 */
export const formatBytes = (value) => {
  if (value <= kB) return `${Math.round(value)} B`
  else if (value <= MB) return `${Math.round(value / kB)} kB`
  else if (value <= GB) return `${Math.round(value / MB)} MB`
  else return `${Math.round(value / GB)} GB`
}

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

