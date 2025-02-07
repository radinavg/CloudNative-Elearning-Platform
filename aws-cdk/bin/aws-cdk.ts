#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';

import * as dotenv from 'dotenv';
import { AmazonCognitoStack } from '../lib/amazon-cognito-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { DynamoDBStack } from "../lib/dynamodb-stack";
import { LambdaStack } from '../lib/lambda-stack';
import { AmazonSnsStack } from "../lib/sns-stack";
dotenv.config();

const app = new cdk.App();

const snsStack = new AmazonSnsStack(app, 'AwsSnsStack');
const dynamoStack = new DynamoDBStack(app, 'DynamoDBStack', snsStack);

const s3Stack = new S3Stack(app, 'AwsCdkStack');
const lambdaStack = new LambdaStack(app, 'LambdaStack', snsStack, dynamoStack);
const cognitoStack = new AmazonCognitoStack(app, 'AmazonCognitoStack', snsStack, dynamoStack, lambdaStack);

// API Gateway
new ApiGatewayStack(app, 'ApiGatewayStack', snsStack, dynamoStack, s3Stack, cognitoStack, lambdaStack);

