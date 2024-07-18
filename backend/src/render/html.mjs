import {formatBytes} from '../util.mjs';
import {dynamoDB} from "../collect-dynamodb-usage.mjs";
import {scyllaPricingUrl} from "./common.mjs";

/**
 * @param {{ onDemand: Usages, provisioned: Usages }} tableCosts
 * @returns {Promise<string>}
 */
export const renderHtml = async ({ onDemand, provisioned }) => `
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
      <header>
        <h1>DynamoDB Pricing Comparison</h1>
      </header>
      <article>
        <p>
          In the sections below, we summarize your provisioned and on-demand usage of DynamoDB
          in region ${ await dynamoDB.config.region() }, and we provide links to see the price
          of equivalent usages on ScyllaDB Cloud.
        </p>
      </article>
      <article>
        <h2>Provisioned DynamoDB Usage</h2>
        <p>The table below lists the characteristics of all your provisioned DynamoDB tables.</p>
        ${ renderUsages(provisioned) }
        <p>
          See <a href="${scyllaPricingUrl(provisioned.summary)}" target="_blank">ScyllaDB Cloud pricing</a> for a
          similar usage.
        </p>
      </article>
      <article>
        <h2>On-Demand DynamoDB Usage</h2>
        <p>
          The table below lists the size and usage of all your on-demand DynamoDB tables. The read and write capacity
          units are average values based on your actual consumption in the last 30 days.
        </p>
        ${ renderUsages(onDemand) }
        <p>
          See <a href="${scyllaPricingUrl(onDemand.summary)}" target="_blank">ScyllaDB Cloud pricing</a> for a
          similar usage.
        </p>
      </article>
      <footer>
        <p>
          <small>
            &copy; ${ new Date().getFullYear().toString() }, ScyllaDB. All rights reserved.
          </small>
        </p>
      </footer>
    </body>
  </html>
`;

/**
 *
 * @param {Usages} usages
 * @returns {string}
 */
const renderUsages = usages => `
  <table>
    <tr><th>Name</th><th>Size</th><th>Average Item Size</th><th>RCU</th><th>WCU</th></tr>
    ${
      usages.tableUsages.map(table => `
        <tr>
          <td>${table.name}</td>
          <td>${formatBytes(table.sizeBytes)}</td>
          <td>${formatBytes(table.averageItemSizeBytes)}</td>
          <td>${Math.round(table.rcu)}</td>
          <td>${Math.round(table.wcu)}</td>
        </tr>`
      ).join('')
    }
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>${formatBytes(usages.summary.sizeBytes)}</strong></td>
      <td><strong>${formatBytes(usages.summary.averageItemSizeBytes)}</strong></td>
      <td><strong>${Math.round(usages.summary.readThroughputBytes / 4096)}</strong></td>
      <td><strong>${Math.round(usages.summary.writeThroughputBytes / 1024)}</strong></td>
    </tr>
  </table>
`;
