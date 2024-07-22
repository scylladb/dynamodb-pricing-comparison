import yargs from 'yargs';
import {Request} from './request.mjs';
import {collectAllUsages} from "./collect-dynamodb-usage.mjs";
import {renderCsv} from "./render/csv.mjs";
import {renderHtml} from "./render/html.mjs";
import {parseDate} from "./util.mjs";

export default async () => {
  // Parse user request
  const request = parseRequest();

  // Collect DynamoDB usage
  const usages = await collectAllUsages(request.dateRange);

  // Render result
  if (request.format === 'csv') {
    console.log(renderCsv(usages));
  } else {
    console.log(await renderHtml(usages));
  }
};

const parseRequest = () => {
  const request = new Request();
  const options = yargs(process.argv.slice(2))
    .option('format', {
      type: 'string',
      description: 'Output format',
      choices: ['html', 'csv'],
      default: 'html'
    })
    .option('from-date', {
      type: 'string',
      description: "Start date to use when collecting usage of on-demand tables. Must be supplied if '--to-date' is supplied.",
      coerce: parseDate,
    })
    .option('to-date', {
      type: 'string',
      description: "End date to use when collecting usage of on-demand tables. Must be supplied if '--from-date' is supplied.",
      coerce: parseDate,
    })
    .check((args) => {
      if (args['from-date'] !== undefined && args['to-date'] === undefined) {
        throw `Invalid combination of arguments: '--to-date' must be supplied if '--from-date' is supplied.`
      } else if (args['from-date'] === undefined && args['to-date'] !== undefined) {
        throw `Invalid combination of arguments: '--from-date' must be supplied if '--to-date' is supplied.`
      } else if (args['to-date'] <= args['from-date']) {
        throw `Invalid combination of arguments: '--from-date' must be before '--to-date'.`
      }
      return true
    })
    .version(false)
    .parse();

  if (options.format === 'html' || options.format === 'csv') {
    request.withFormat(options.format);
  }

  if (options['from-date'] !== undefined && options['to-date'] !== undefined) {
    request.withDateRange({ start: options['from-date'], end: options['to-date'] });
  }

  return request
};
