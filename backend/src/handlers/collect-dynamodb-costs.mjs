import {DescribeTableCommand, DynamoDBClient, ListTablesCommand} from '@aws-sdk/client-dynamodb';

const dynamoDB = new DynamoDBClient();

const collectCosts = async () => {
  const listResponse =
    await dynamoDB.send(new ListTablesCommand({ /* TODO handle pagination */}));

  const tableNames = listResponse.TableNames;

  const tableDescriptions =
    await Promise.all(
      tableNames.map(tableName => dynamoDB.send(new DescribeTableCommand({ "TableName": tableName })))
    );

  return tableDescriptions.map(tableDescription => {
    const table = tableDescription.Table;
    const itemCount = table.ItemCount;
    const sizeBytes = table.TableSizeBytes;
    const averageItemSizeBytes = sizeBytes / itemCount;
    const rcu = table.ProvisionedThroughput.ReadCapacityUnits;
    const wcu = table.ProvisionedThroughput.WriteCapacityUnits;
    return {
      name: table.TableName,
      averageItemSizeBytes,
      sizeBytes,
      rcu,
      wcu
    }
  });
};

const kB = 1024;
const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;
const TB = 1024 * 1024 * 1024 * 1024;

const formatBytes = (value) => {
  if (value <= kB) return `${Math.round(value)} B`
  else if (value <= MB) return `${Math.round(value / kB)} kB`
  else if (value <= GB) return `${Math.round(value / MB)} MB`
  else return `${Math.round(value / GB)} GB`
}

const scyllaPricingUrl = (table) => {
  const uri = new URL('https://www.scylladb.com/product/scylla-cloud/get-pricing?');
  uri.searchParams.append('reads', Math.round(table.rcu * 4096 / table.averageItemSizeBytes).toString());
  uri.searchParams.append('writes', Math.round(table.wcu * 1024 / table.averageItemSizeBytes).toString());
  uri.searchParams.append('itemSize', Math.round(table.averageItemSizeBytes / kB).toString());
  uri.searchParams.append('storage', Math.round(table.sizeBytes / TB).toString());
  uri.searchParams.append('cloudProvider', 'AWS')
  return uri.href
};

const renderHtml = async (tables) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>DynamoDB Pricing Comparison</title>
      <style>
        table {
          border: 2px solid rgb(140 140 140);
        }
        th, td {
          border: 1px solid rgb(160 160 160);
        }
      </style>
    </head>
    <body>
      <h1>DynamoDB Pricing Comparison</h1>
      <p>
      The table below lists the costs of all the DynamoDB tables you own in region ${await dynamoDB.config.region()}.
      </p>
      <table>
        <tr><th>Name</th><th>Size</th><th>Average Item Size</th><th>RCU</th><th>WCU</th><th>Pricing on Scylla Cloud</th></tr>
        ${
          tables.map(table => `
            <tr>
              <td>${table.name}</td>
              <td>${formatBytes(table.sizeBytes)}</td>
              <td>${formatBytes(table.averageItemSizeBytes)}</td>
              <td>${table.rcu}</td>
              <td>${table.wcu}</td>
              <td><a href="${scyllaPricingUrl(table)}" target="_blank">Explore Scylla Cloud's pricing</a></td>
            </tr>`
          ).join('') 
        }
      </table>
    </body>
  </html>
`;

export const handler = async (event) => {
  console.info('received:', event); // logs are written to CloudWatch
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    },
    body: await renderHtml(await collectCosts())
  }
};
