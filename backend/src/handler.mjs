import {collectAllUsages} from "./collect-dynamodb-usage.mjs";
import {renderHtml} from "./render/html.mjs";
import {Options} from "./options.mjs";
import {renderCsv} from "./render/csv.mjs";

/**
 * AWS Lambda handler triggered by the API Gateway
 *
 * @param event {{queryStringParameters}}
 */
export const getDynamoDBUsage = async (event) => {
  console.info('received:', event); // logs are written to CloudWatch
  // Parse client request
  let options;
  try {
    options = new Options(event.queryStringParameters || {});
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      },
      body: `Error: ${error}`
    }
  }

  // Collect DynamoDB usage
  const usages = await collectAllUsages(options.dateRange);

  // Render result
  if (options.format === 'csv') {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8"
      },
      body: renderCsv(usages)
    }
  } else {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      },
      body: await renderHtml(usages)
    }
  }
};
