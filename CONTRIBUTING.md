# Contributing

This file contains instructions to build the application and publish it to the AWS Serverless Application Repository.

## Requirements

You need the following tools:

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
- [Node.js](https://nodejs.org/en/), including the `npm` package management tool.

## Overview

The application is made of the following resources:
- a Lambda function implemented in JavaScript, which collects metrics about DynamoDB usage and returns an HTML page displaying the results.
- an API Gateway defining a single HTTP endpoint to call the Lambda function.

## Build

Build the application by using the `sam build` command.

~~~ shell
sam build
~~~

The AWS SAM CLI installs dependencies that are defined in `package.json`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

## Run

Before running the application, login to the `aws` CLI.

~~~ shell
aws configure
~~~

You will be prompted for your AWS access key ID and AWS secret access key. The credentials will be saved in the `~/.aws/` directory. These credentials will be used by the Lambda function handler to query your DynamoDB usage.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

~~~ shell
sam local invoke CollectDynamoDBCosts --event events/event-invoke.json
~~~

The AWS SAM CLI can also emulate your application's API. Use the `sam local start-api` command to run the API locally on port 3000.

~~~ shell
sam local start-api
curl http://localhost:3000/
~~~

## Publish

Before publishing the application to the Serverless Application Repository, you need to [create an S3 bucket](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-template-publishing-applications.html#serverless-sam-template-publishing-applications-prerequisites) that will store the application package.

~~~ shell
aws s3 mb s3://dynamodb-pricing-comparison
~~~

You need to grant the Serverless Repository Service read permissions for artifacts uploaded to this bucket. Open the Amazon S3 console at https://console.aws.amazon.com/s3, choose the bucket `dynamodb-pricing-comparison`, choose “Permissions”, and then “Edit” under “Bucket policy” and paste the following policy statement.

~~~ json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service":  "serverlessrepo.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::dynamodb-pricing-comparison/*",
            "Condition" : {
                "StringEquals": {
                    "aws:SourceAccount": "<your-account-id>"
                }
            }
        }
    ]
}
~~~

Choose “Save changes”.

Publish a new version of the program with the following steps:

1. Bump the `SemanticVersion` property in the file `template.yaml`.
2. Build the application and package it to your S3 bucket:
   ~~~ shell
   sam build
   sam package --output-template-file packaged.yaml --s3-bucket dynamodb-pricing-comparison
   ~~~
3. Publish the packaged application:
   ~~~ shell
   sam publish --template packaged.yaml --region eu-central-1
   ~~~
