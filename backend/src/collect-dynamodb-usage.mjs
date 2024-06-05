import {BillingMode, DescribeTableCommand, DynamoDBClient, ListTablesCommand} from '@aws-sdk/client-dynamodb';
import {partition} from "./util.mjs";

/** @type {DynamoDBClient} */
export const dynamoDB = new DynamoDBClient();

/**
 * @typedef {Object} ProvisionedCapacity
 * @property {number} rcu
 * @property {number} wcu
 */

/**
 * @typedef {Object} TableUsage
 * @property {string} name
 * @property {number} sizeBytes
 * @property {number} itemCount
 * @property {number} averageItemSizeBytes
 * @property {ProvisionedCapacity | undefined} provisionedCapacity
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
export const collectAllUsages = async () => {
  const tableNames = await getAllTableNames();

  /** @type {Array<import('@aws-sdk/client-dynamodb').DescribeTableCommandOutput>} */
  const tableDescriptions =
    await Promise.all(
      tableNames.map(
        tableName =>
          dynamoDB.send(new DescribeTableCommand({ "TableName": tableName }))
      )
    );

  /** @type {Array<TableUsage>} */
  const tableUsages =
    tableDescriptions.map(describeOutput => collectTableUsage(describeOutput.Table));

  const [provisioned, onDemand] =
    partition(tableUsages, tableUsage => tableUsage.provisionedCapacity !== undefined);

  return {
    provisioned: summarize(provisioned),
    onDemand: summarize(onDemand)
  }
};

/**
 * @returns {Promise<Array<string>>}
 */
const getAllTableNames = async () => {
  /**
   * Recursively send `ListTables` commands to DynamoDB to fetch all the table names.
   * @param {Array<string>} previousResults
   * @param {string | undefined} lastEvaluatedTableName
   * @returns {Promise<Array<string>>}
   */
  const sendCommand = async (previousResults, lastEvaluatedTableName) => {
    const input =
      lastEvaluatedTableName !== undefined ? { ExclusiveStartTableName: lastEvaluatedTableName } : {};
    const output = await dynamoDB.send(new ListTablesCommand(input));
    const results = previousResults.concat(output.TableNames);
    if (output.LastEvaluatedTableName !== undefined) {
      return sendCommand(results, output.LastEvaluatedTableName)
    } else {
      return results
    }
  }

  return await sendCommand([], undefined)
};

/**
 * @param {import('@aws-sdk/client-dynamodb').TableDescription} table
 * @returns {TableUsage}
 */
const collectTableUsage = (table) => {
  const itemCount = table.ItemCount || 0;
  const sizeBytes = table.TableSizeBytes || 0;
  const averageItemSizeBytes = itemCount !== 0 ? sizeBytes / itemCount : 0;
  const provisionedCapacity =
    ((table.BillingModeSummary !== undefined &&
        table.BillingModeSummary.BillingMode === BillingMode.PAY_PER_REQUEST) ||
        table.ProvisionedThroughput === undefined) ?
      undefined :
      {
        rcu: table.ProvisionedThroughput.ReadCapacityUnits || 0,
        wcu: table.ProvisionedThroughput.WriteCapacityUnits || 0
      };
  return {
    name: table.TableName,
    sizeBytes,
    itemCount,
    averageItemSizeBytes,
    provisionedCapacity
  }
};

/**
 * @param {Array<TableUsage>} tableUsages
 * @returns {{ tableUsages: Array<TableUsage>, summary: UsageSummary }}
 */
const summarize = (tableUsages) => {
  const summary = tableUsages.reduce((usageSummary, tableUsage) => ({
    byteReads: usageSummary.byteReads + (tableUsage.provisionedCapacity?.rcu || 0) * 4096, // TODO Handle on-demand throughput
    byteWrites: usageSummary.byteWrites + (tableUsage.provisionedCapacity?.wcu || 0) * 1024,
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
