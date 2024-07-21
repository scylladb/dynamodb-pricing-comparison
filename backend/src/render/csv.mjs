import { createArrayCsvStringifier } from 'csv-writer';
import { BillingMode } from '@aws-sdk/client-dynamodb';
import {scyllaPricingUrl} from "./common.mjs";

/**
 * @param {{ onDemand: Usages, provisioned: Usages }} tableCosts
 */
export const renderCsv = ({ onDemand, provisioned }) => {
  const csv = createArrayCsvStringifier({
    header: ['Table name', 'Billing mode', 'Table size', 'Average item size', 'RCU', 'WCU', 'DynamoDB comparison URL']
  });
  const allRecords =
    usageRecords(provisioned, BillingMode.PROVISIONED)
      .concat(usageRecords(onDemand, BillingMode.PAY_PER_REQUEST));
  return csv.stringifyRecords(allRecords);
};

/**
 * @param {Usages} usages
 * @param {BillingMode} billingMode
 * @return {Array<[string, string, string, string, string, string, string]>}
 */
const usageRecords = (usages, billingMode) =>
  usages.tableUsages.map(table => {
    return [
      table.name,
      billingMode,
      table.sizeBytes,
      Math.round(table.averageItemSizeBytes),
      Math.round(table.rcu),
      Math.round(table.wcu),
      ''
    ]
  }).concat([[
    'TOTAL',
    billingMode,
    usages.summary.sizeBytes,
    Math.round(usages.summary.averageItemSizeBytes),
    Math.round(usages.summary.readThroughputBytes / 4096),
    Math.round(usages.summary.writeThroughputBytes / 1024),
    scyllaPricingUrl(usages.summary)
  ]]);
