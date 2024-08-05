import {BillingMode, DescribeTableCommand, DynamoDBClient, ListTablesCommand} from '@aws-sdk/client-dynamodb';
import {GetMetricDataCommand, CloudWatchClient} from '@aws-sdk/client-cloudwatch';
import {partition} from "./util.mjs";

/** @type {DynamoDBClient} */
export const dynamoDB = new DynamoDBClient();
const cloudWatch = new CloudWatchClient();

/**
 * @typedef {Object} TableUsage
 * @property {string} name
 * @property {number} sizeBytes
 * @property {number} itemCount
 * @property {number} averageItemSizeBytes
 * @property {number} rcu
 * @property {number} wcu
 */

/**
 * @typedef {Object} UsageSummary
 * @property {number} readThroughputBytes  read throughput in bytes per second
 * @property {number} writeThroughputBytes write throughput in bytes per second
 * @property {number} averageItemSizeBytes
 * @property {number} sizeBytes
 */

/**
 * @typedef {Object} Usages
 * @property {Array<TableUsage>} tableUsages
 * @property {UsageSummary} summary
 */

/**
 * @param {DateRange} dateRange Date range to use to collect on-demand usage
 * @returns {Promise<{ onDemand: Usages, provisioned: Usages }>}
 */
export const collectAllUsages = async (dateRange) => {
  const tableNames = await getAllTableNames();

  /** @type {Array<import('@aws-sdk/client-dynamodb').TableDescription>} */
  const tableDescriptions =
    await Promise.all(tableNames.map(describeTable));

  const [onDemandTableDescriptions, provisionedTableDescriptions] =
    partition(tableDescriptions, usesOnDemandBilling);

  /** @type {Array<TableUsage>} */
  const provisionedTableUsages =
    provisionedTableDescriptions.map(collectProvisionedCapacity);

  const onDemandTableUsages =
    await Promise.all(
      onDemandTableDescriptions.map(table => collectOnDemandUsage(table, dateRange))
    );

  return {
    provisioned: summarize(provisionedTableUsages),
    onDemand: summarize(onDemandTableUsages)
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
 * @param {string} tableName
 * @returns {Promise<import('@aws-sdk/client-dynamodb').TableDescription>}
 */
const describeTable = async (tableName) => {
  const output = await dynamoDB.send(new DescribeTableCommand({ TableName: tableName }));
  return output.Table
};

/**
 * @param {import('@aws-sdk/client-dynamodb').TableDescription} table
 * @returns {boolean}
 */
const usesOnDemandBilling =
  (table) =>
    (table.BillingModeSummary !== undefined &&
    table.BillingModeSummary.BillingMode === BillingMode.PAY_PER_REQUEST) ||
    table.ProvisionedThroughput === undefined;

/**
 * @param {import('@aws-sdk/client-dynamodb').TableDescription} table
 * @returns {TableUsage}
 */
const collectProvisionedCapacity = (table) => {
  const itemCount = table.ItemCount || 0;
  const sizeBytes = table.TableSizeBytes || 0;
  return {
    name: table.TableName,
    sizeBytes,
    itemCount,
    averageItemSizeBytes: itemCount !== 0 ? sizeBytes / itemCount : 0,
    rcu: table.ProvisionedThroughput.ReadCapacityUnits || 0,
    wcu: table.ProvisionedThroughput.WriteCapacityUnits || 0
  }
};

/**
 * @param {import('@aws-sdk/client-dynamodb').TableDescription} table
 * @param {DateRange} dateRange
 * @returns {Promise<TableUsage>}
 */
const collectOnDemandUsage = async (table, dateRange) => {

  const [consumedRCU, consumedWCU] =
    await Promise.all([
      getConsumedRCU(dateRange.start, dateRange.end, table.TableName),
      getConsumedWCU(dateRange.start, dateRange.end, table.TableName)
    ]);

  const itemCount = table.ItemCount || 0;
  const sizeBytes = table.TableSizeBytes || 0;
  return {
    name: table.TableName,
    sizeBytes,
    itemCount,
    averageItemSizeBytes: itemCount !== 0 ? sizeBytes / itemCount : 0,
    rcu: consumedRCU,
    wcu: consumedWCU
  }
};

/**
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string} tableName
 * @returns {Promise<number>}
 */
const getConsumedRCU = async (startTime, endTime, tableName) =>
  getConsumedCapacityUnits(startTime, endTime, tableName, 'ConsumedReadCapacityUnits');

/**
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string} tableName
 * @returns {Promise<number>}
 */
const getConsumedWCU = async (startTime, endTime, tableName) =>
  getConsumedCapacityUnits(startTime, endTime, tableName, 'ConsumedWriteCapacityUnits');

/**
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string} tableName
 * @param {string} metricName
 * @returns {Promise<number>}
 */
const getConsumedCapacityUnits = async (startTime, endTime, tableName, metricName) => {
  const period = 60 * 60 * 24; // collect one data point per day
  const getMetricData =
    new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: 'consumedCapacityUnits',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/DynamoDB',
              MetricName: metricName,
              Dimensions: [
                { Name: 'TableName', Value: tableName }
              ]
            },
            Stat: 'Sum',
            Period: period,
          }
        }
      ]
    });
  const output = await cloudWatch.send(getMetricData);
  const values = output.MetricDataResults[0].Values;
  if (values.length === 0) {
    return 0
  } else {
    const total = values.reduce((x, y) => x + y);
    return total / (period * values.length) // Convert back to a throughput per second for consistency with standard RCU and WCU
  }
};

/**
 * @param {Array<TableUsage>} tableUsages
 * @returns {{ tableUsages: Array<TableUsage>, summary: UsageSummary }}
 */
const summarize = (tableUsages) => {
  const summary = tableUsages.reduce((usageSummary, tableUsage) => ({
    readThroughputBytes: usageSummary.readThroughputBytes + tableUsage.rcu * 4096,
    writeThroughputBytes: usageSummary.writeThroughputBytes + tableUsage.wcu * 1024,
    sizeBytes: usageSummary.sizeBytes + tableUsage.sizeBytes,
    itemCount: usageSummary.itemCount + tableUsage.itemCount
  }), {
    readThroughputBytes: 0,
    writeThroughputBytes: 0,
    sizeBytes: 0,
    itemCount: 0
  });
  summary.averageItemSizeBytes = summary.sizeBytes / summary.itemCount;
  return {
    tableUsages,
    summary
  }
};
