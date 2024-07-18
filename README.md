# dynamodb-pricing-comparison

AWS Serverless Application that analyzes your DynamoDB usage on the AWS cloud, and shows you the pricing for an equivalent usage of [ScyllaDB’s Alternator](https://resources.scylladb.com/dynamodb-replacement), which is a drop-in alternative for DynamoDB.

## Install

The simplest way to use the application is to deploy the version published to the AWS Serverless Application Repository. Alternatively, you can build the application from the sources and deploy it with the AWS SAM CLI.

### Deploy from the Serverless Application Repository

1. Open the [Serverless Application Repository](https://console.aws.amazon.com/serverlessrepo#/available-applications).
2. In the top-right corner, select the region in which you want to analyse your DynamoDB usage.
3. Search for the application “dynamodb-pricing-comparison”. Make sure to tick the box “Show apps that create custom IAM roles or resource policies”.
   In case the application is not available in your region, follow the manual deployment process below or [open a new issue](https://github.com/scylladb/dynamodb-pricing-comparison/issues/new).
4. Click on the application name to open the deployment screen.
5. Tick the box “I acknowledge that this app creates custom IAM roles.”
   Please note that the application will create IAM roles to query your DynamoDB usage. More specifically, the application needs to be granted the right to perform the actions `dynamodb:ListTables`, `dynamodb:DescribeTable`, and `cloudwatch:GetMetricData`. **The application will not read, change, delete, or share any of your data**.
6. Edit the stack name if desired, and choose “Deploy”.
7. You should be redirected to the newly created Lambda application. After the deployment finishes, you should see an endpoint in the “API endpoint” box.
8. Click that endpoint to collect metrics about your DynamoDB usage and visualize the results on a web page. The web page displays a summary of your usage of provisioned tables, and a summary of your usage of on-demand tables, with links to Scylla Cloud pricing calculator to estimates your possible savings if you switch to ScyllaDB. See the “Use” section below for more options.

To delete the application, delete the CloudFormation stack that was created during the deployment step. Open the CloudFormation console at https://console.aws.amazon.com/cloudformation#/stacks. Find the deployed stack (for example, look for `serverlessrepo-dynamodb-pricing-comparison`), and choose “Delete”.

### Build and Deploy from Sources

You need the following tools:

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
- [Node.js](https://nodejs.org/en/), including the `npm` package management tool.

To build and deploy the application for the first time, run the following in your shell:

~~~ shell
sam build
sam deploy --guided
~~~

The first command will build the source of the application. The second command will package and deploy the application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this application, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **CollectDynamoDBCosts has no authentication**: The deployed application will be publicly accessible (but the URL will be hard to guess).
* **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to the application.

The following output will be displayed in the outputs when the deployment is complete:
* API Gateway endpoint URL

Open that endpoint URL to collect metrics about your DynamoDB usage and visualize the results on a web page. See the “Use” section below for more options.

To delete the application, you can use the AWS CLI. Assuming you used `dynamodb-pricing-comparison` for the stack name, you can run the following:

~~~ shell
sam delete --stack-name dynamodb-pricing-comparison
~~~

## Use

The installation process outputs the URL of an API endpoint that you can call to collect metrics about your DynamoDB usage.

The endpoint supports the following query parameter:

- `format`: Accepted values are either `html` or `csv`. This parameter is optional and defaults to `html`. With `format=html`, the endpoint produces an HTML page that can be rendered by a Web browser. With `format=csv`, the endpoint produces a CSV document with the following columns:
  - Table name
  - Billing mode (`PAY_PER_REQUEST`, or `PROVISIONED`)
  - Table size (bytes)
  - Average item size (bytes)
  - Read capacity units
  - Write capacity units
  - ScyllaDB cloud pricing comparison

For instance, to export your DynamoDB usage into a CSV file, use the following command:

~~~ bash
curl "${API_GATEWAY_ENDPOINT_URL}?format=csv" > dynamodb-usage.csv
~~~

Where `API_GATEWAY_ENDPOINT_URL` is the URL of the API endpoint produced by the installation process.

## Contribute

See the [CONTRIBUTING.md](./CONTRIBUTING.md) file to learn how to build, maintain, and publish the application.

## License

The content of this repository is released under the [Apache 2.0 License](./LICENSE.txt).
