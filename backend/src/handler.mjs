import {collectAllUsages} from "./collect-dynamodb-usage.mjs";
import {renderHtml} from "./render/html.mjs";
import {Request} from "./request.mjs";
import {renderCsv} from "./render/csv.mjs";
import {parseDate} from "./util.mjs";

/**
 * AWS Lambda handler triggered by the API Gateway
 *
 * @param event {{queryStringParameters}}
 */
export const getDynamoDBUsage = async (event) => {
  console.info('received:', event); // logs are written to CloudWatch
  // Parse client request
  let request;
  try {
    request = parseRequest(event.queryStringParameters || {});
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
  const usages = await collectAllUsages(request.dateRange);

  // Render result
  if (request.format === 'csv') {
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

/**
 * @param queryParameters {Object}
 * @return {Request}
 */
const parseRequest = (queryParameters) => {
  const request = new Request();

  const format = queryParameters.format;
  if (format !== undefined) {
    if (format === 'html' || format === 'csv') {
      request.withFormat(format);
    } else {
      throw `Unsupported format '${format}'. Valid formats are 'html' and 'csv'.`;
    }
  }

  const fromDate = queryParameters['from-date'];
  const toDate = queryParameters['to-date'];
  if (fromDate !== undefined && toDate !== undefined) {
    const start = parseDate(fromDate);
    const end = parseDate(toDate);
    if (end <= start) {
      throw `Invalid combination of parameters: 'from-date' must be before 'to-date'`;
    }
    request.withDateRange({ start, end });
  } else if (fromDate === undefined && toDate !== undefined) {
    throw `Invalid combination of parameters: 'from-date' must be supplied with 'to-date'`;
  } else if (fromDate !== undefined && toDate === undefined) {
    throw `Invalid combination of parameters: 'to-date' must be supplied with 'from-date'`;
  }

  return request;
};
