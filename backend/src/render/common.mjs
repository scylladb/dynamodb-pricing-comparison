import {kB, TB} from "../util.mjs";

/**
 * @param {UsageSummary} summary
 * @returns {string}
 */
export const scyllaPricingUrl = (summary) => {
  const uri = new URL('https://www.scylladb.com/product/scylla-cloud/get-pricing?');
  uri.searchParams.append('reads', Math.round(summary.readThroughputBytes / summary.averageItemSizeBytes).toString());
  uri.searchParams.append('writes', Math.round(summary.writeThroughputBytes / summary.averageItemSizeBytes).toString());
  uri.searchParams.append('itemSize', Math.round(summary.averageItemSizeBytes / kB).toString());
  uri.searchParams.append('storage', Math.round(summary.sizeBytes / TB).toString());
  uri.searchParams.append('cloudProvider', 'AWS')
  return uri.href
};
