import {collectAllUsages} from "./collect-dynamodb-usage.mjs";
import {renderHtml} from "./render.mjs";

/** AWS Lambda handler triggered by the API Gateway */
export const getDynamoDBUsage = async (event) => {
  console.info('received:', event); // logs are written to CloudWatch
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    },
    body: await renderHtml(await collectAllUsages())
  }
};
