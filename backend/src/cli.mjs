import yargs from 'yargs';
import {defaultFormat, OPTION_FORMAT, OPTION_FROM_DATE, OPTION_TO_DATE, Options, supportedFormats} from './options.mjs';
import {collectAllUsages} from "./collect-dynamodb-usage.mjs";
import {renderCsv} from "./render/csv.mjs";
import {renderHtml} from "./render/html.mjs";

export default async () => {
  // Parse program options
  const options = parseOptions();

  // Collect DynamoDB usage
  const usages = await collectAllUsages(options.dateRange);

  // Render result
  if (options.format === 'csv') {
    console.log(renderCsv(usages));
  } else {
    console.log(await renderHtml(usages));
  }
};

const parseOptions = () => {
  let options;

  yargs(process.argv.slice(2))
    .option(OPTION_FORMAT, {
      type: 'string',
      description: 'Output format',
      choices: supportedFormats,
      default: defaultFormat
    })
    .option(OPTION_FROM_DATE, {
      type: 'string',
      description: `Start date to use when collecting usage of on-demand tables. Must be supplied if '--${OPTION_TO_DATE}' is supplied.`,
    })
    .option(OPTION_TO_DATE, {
      type: 'string',
      description: `End date to use when collecting usage of on-demand tables. Must be supplied if '--${OPTION_FROM_DATE}' is supplied.`,
    })
    .version(false)
    .check(args => {
      options = new Options(args);
      return true
    })
    .parse();

  return options;
};
