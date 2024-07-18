import {kB, TB} from "../util.mjs";

/**
 * @param {UsageSummary} table
 * @returns {string}
 */
export const scyllaPricingUrl = (table) => {
  const uri = new URL('https://www.scylladb.com/product/scylla-cloud/get-pricing?');
  uri.searchParams.append('reads', Math.round(table.readThroughputBytes / table.averageItemSizeBytes).toString());
  uri.searchParams.append('writes', Math.round(table.writeThroughputBytes / table.averageItemSizeBytes).toString());
  uri.searchParams.append('itemSize', Math.round(table.averageItemSizeBytes / kB).toString());
  uri.searchParams.append('storage', Math.round(table.sizeBytes / TB).toString());
  uri.searchParams.append('cloudProvider', 'AWS')
  return uri.href
};
