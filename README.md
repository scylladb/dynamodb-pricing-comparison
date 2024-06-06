# dynamodb-pricing-comparison

Source code of an AWS Serverless Application that analyzes your DynamoDB usage on the AWS cloud, and shows you the pricing for an equivalent usage of [ScyllaDB’s Alternator](https://resources.scylladb.com/dynamodb-replacement), which is a drop-in alternative for DynamoDB.

## Install

The simplest way to use the application is to deploy the version published to the AWS Serverless Application Repository. Alternatively, you can build the application from the sources and deploy it with the AWS SAM CLI.

### Deploy from the Serverless Application Repository

Open the following URL:

https://eu-central-1.console.aws.amazon.com/lambda/home#/create/app?applicationId=arn:aws:serverlessrepo:eu-central-1:164221962816:applications/dynamodb-pricing-comparison

Please note that the application will create IAM roles to query your DynamoDB usage. More specifically, the application needs to be granted the right to perform the actions `dynamodb:ListTables`, `dynamodb:DescribeTable`, and `cloudwatch:GetMetricData`. The application will not read, change, delete, or share any of your data.

Tick the box “I acknowledge that this app creates custom IAM roles.”

Edit the stack name if desired, and choose “Deploy”.

You should be redirected to the newly created Lambda application. After the deployment finishes, you should see an endpoint in the “API endpoint” box.

Click that endpoint to collect metrics about your DynamoDB usage and visualize the results on a web page. The web page displays a summary of your usage of provisioned tables, and a summary of your usage of on-demand tables, with links to Scylla Cloud pricing calculator to estimates your possible savings if you switch to ScyllaDB.

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

Open that endpoint URL to collect metrics about your DynamoDB usage and visualize the results on a web page.

To delete the application, you can use the AWS CLI. Assuming you used `dynamodb-pricing-comparison` for the stack name, you can run the following:

~~~ shell
sam delete --stack-name dynamodb-pricing-comparison
~~~

## Contribute

See the [CONTRIBUTING.md](./CONTRIBUTING.md) file to learn how to build, maintain, and publish the application.

## License

The content of this repository is released under the [Apache 2.0 License](./LICENSE.txt).
