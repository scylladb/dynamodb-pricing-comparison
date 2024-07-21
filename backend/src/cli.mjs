import yargs from 'yargs';
import {Request} from './request.mjs';
import {collectAllUsages} from "./collect-dynamodb-usage.mjs";
import {renderCsv} from "./render/csv.mjs";
import {renderHtml} from "./render/html.mjs";

export default async () => {
  // Parse user request
  const request = new Request();
  const options = yargs(process.argv.slice(2))
    .option('format', {
      type: 'string',
      description: 'Output format',
      choices: ['html', 'csv'],
      default: 'html'
    })
    .version(false)
    .parse();

  if (options.format === 'html' || options.format === 'csv') {
    request.withFormat(options.format);
  }

  // Collect DynamoDB usage
  const usages = await collectAllUsages();

  // Render result
  if (request.format === 'csv') {
    console.log(renderCsv(usages));
  } else {
    console.log(await renderHtml(usages));
  }
};
