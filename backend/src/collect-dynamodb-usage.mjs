import {BillingMode, DescribeTableCommand, DynamoDBClient, ListTablesCommand} from '@aws-sdk/client-dynamodb';
import {partition} from "./util.mjs";

/** @type {DynamoDBClient} */
export const dynamoDB = new DynamoDBClient();

/**
 * @typedef {Object} TableUsage
 * @property {string} name
 * @property {number} sizeBytes
 * @property {number} itemCount
 * @property {number} averageItemSizeBytes
 * @property {number} rcu
 * @property {number} wcu
 * @property {boolean} usesOnDemandBilling
 */

/**
 * @typedef {Object} UsageSummary
 * @property {number} byteReads
 * @property {number} byteWrites
 * @property {number} averageItemSizeBytes
 * @property {number} sizeBytes
 */

/**
 * @typedef {Object} Usages
 * @property {Array<TableUsage>} tableUsages
 * @property {UsageSummary} summary
 */

/**
 * @returns {Promise<{ onDemand: Usages, provisioned: Usages }>}
 */
export const collectCosts = async () => {
  const listResponse =
    await dynamoDB.send(new ListTablesCommand({ /* TODO handle pagination */}));

  const tableNames = listResponse.TableNames;

  const tableDescriptions =
    await Promise.all(
      tableNames.map(
        tableName =>
          dynamoDB.send(new DescribeTableCommand({ "TableName": tableName }))
      )
    );

  /** @type {Array<TableUsage>} */
  const tableUsages =
    tableDescriptions.map(tableDescription => {
      const table = tableDescription.Table;
      const itemCount = table.ItemCount; // TODO resilience when undefined
      const sizeBytes = table.TableSizeBytes;
      const averageItemSizeBytes = sizeBytes / itemCount;
      const rcu = table.ProvisionedThroughput.ReadCapacityUnits;
      const wcu = table.ProvisionedThroughput.WriteCapacityUnits;
      const usesOnDemandBilling =
        table.BillingModeSummary !== undefined &&
        table.BillingModeSummary.BillingMode === BillingMode.PAY_PER_REQUEST;
      return {
        name: table.TableName,
        sizeBytes,
        itemCount,
        averageItemSizeBytes,
        rcu,
        wcu,
        usesOnDemandBilling
      }
    });

  const [onDemand, provisioned] =
    partition(tableUsages, tableUsage => tableUsage.usesOnDemandBilling);

  return {
    provisioned: summarize(provisioned),
    onDemand: summarize(onDemand)
  }
};

/**
 * @param {Array<TableUsage>} tableUsages
 * @returns {{ tableUsages: Array<TableUsage>, summary: UsageSummary }}
 */
const summarize = (tableUsages) => {
  const summary = tableUsages.reduce((usageSummary, tableUsage) => ({
    byteReads: usageSummary.byteReads + tableUsage.rcu * 4096,
    byteWrites: usageSummary.byteWrites + tableUsage.wcu * 1024,
    sizeBytes: usageSummary.sizeBytes + tableUsage.sizeBytes,
    itemCount: usageSummary.itemCount + tableUsage.itemCount
  }), {
    byteReads: 0,
    byteWrites: 0,
    sizeBytes: 0,
    itemCount: 0
  });
  summary.averageItemSizeBytes = summary.sizeBytes / summary.itemCount;
  return {
    tableUsages,
    summary
  }
};
