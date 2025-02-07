import { Stack, StackProps } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AmazonCognitoStack } from './amazon-cognito-stack';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { S3Stack } from './s3-stack';
import { AmazonSnsStack } from './sns-stack';
import {AwsIntegration} from "aws-cdk-lib/aws-apigateway";

export class ApiGatewayStack extends Stack {
    constructor(
        scope: Construct,
        id: string,
        snsStack: AmazonSnsStack,
        dynamoStack: DynamoDBStack,
        s3Stack: S3Stack,
        cognitoStack: AmazonCognitoStack,
        lambdaStack: LambdaStack,
        props?: StackProps
    ) {
        super(scope, id, props);

        // Create API Gateway
        const api = new apigateway.RestApi(this, 'ApiGateway', {
            restApiName: 'API Gateway',
            description: 'API Gateway',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'Authorization'],
            },
        });

        // Get the underlying CloudFormation resource
        const cfnApi = api.node.defaultChild as apigateway.CfnRestApi;

        // Add the _custom_id_ tag for static url
        cfnApi.tags.setTag('_custom_id_', '4qo8xcutrn');

        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            authorizerName: 'CognitoAuthorizer',
            cognitoUserPools: [cognitoStack.userPool],
        });

        // Create an IAM Role for API Gateway
        const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        });

        // setting up auth
        const authResource = api.root.addResource('auth');

        // Register endpoint (Cognito SignUp)
        authResource.addResource('register').addMethod(
            'POST',
            new apigateway.AwsIntegration({
                service: 'cognito-idp',
                integrationHttpMethod: 'POST',
                action: 'SignUp',
                options: {
                    credentialsRole: apiGatewayRole,
                    requestParameters: {
                        'integration.request.header.Content-Type': "'application/x-amz-json-1.1'",
                        'integration.request.header.X-Amz-Target': "'AWSCognitoIdentityProviderService.SignUp'",
                    },
                    requestTemplates: {
                        'application/json': JSON.stringify({
                            ClientId: cognitoStack.userPoolClient.userPoolClientId,
                            Username: "$input.path('$.email')",
                            Password: "$input.path('$.password')",
                            UserAttributes: [
                                {
                                    Name: 'email',
                                    Value: "$input.path('$.email')",
                                },
                                {
                                    Name: 'given_name',
                                    Value: "$input.path('$.firstName')",
                                },
                                {
                                    Name: 'family_name',
                                    Value: "$input.path('$.lastName')",
                                },
                            ],
                        }),
                    },

                    integrationResponses: [
                        {
                            statusCode: '200',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                    ],
                },
            }),
            {
                authorizationType: apigateway.AuthorizationType.NONE,
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                ],
            }
        );

        const loginResource = authResource.addResource('login');
        loginResource.addMethod(
            'POST',
            new apigateway.AwsIntegration({
                service: 'cognito-idp',
                integrationHttpMethod: 'POST',
                action: 'InitiateAuth',
                options: {
                    credentialsRole: apiGatewayRole,
                    requestParameters: {
                        'integration.request.header.Content-Type': "'application/x-amz-json-1.1'",
                        'integration.request.header.X-Amz-Target': "'AWSCognitoIdentityProviderService.InitiateAuth'",
                    },
                    requestTemplates: {
                        'application/json': JSON.stringify({
                            AuthFlow: 'USER_PASSWORD_AUTH',
                            ClientId: cognitoStack.userPoolClient.userPoolClientId,
                            AuthParameters: {
                                USERNAME: "$input.path('$.email')",
                                PASSWORD: "$input.path('$.password')",
                            },
                        }),
                    },
                    integrationResponses: [
                        {
                            statusCode: '200',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                    ],
                },
            }),
            {
                authorizationType: apigateway.AuthorizationType.NONE,
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                ],
            }
        );

        ///////////////////////////////////////////////////////////////////////////////////////////
        // setting up the s3 bucket

        const bucket = s3Stack.bucket;

        // Grant API Gateway permissions to read/write from S3
        bucket.grantReadWrite(apiGatewayRole);

        const files = api.root.addResource('files');
        const file = files.addResource('{object}');

        file.addMethod(
            'GET',
            new apigateway.AwsIntegration({
                service: 's3',
                integrationHttpMethod: 'GET',
                path: `${bucket.bucketName}/{object}`,
                options: {
                    credentialsRole: apiGatewayRole,
                    requestParameters: {
                        'integration.request.path.object': 'method.request.path.object',
                    },
                    integrationResponses: [
                        {
                            statusCode: '200',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'GET,PUT,POST,DELETE,OPTIONS'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                        {
                            selectionPattern: '4\\d{2}', 
                            statusCode: '400',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'GET,PUT,POST,DELETE,OPTIONS'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                        {
                            selectionPattern: '5\\d{2}',
                            statusCode: '500',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'GET,PUT,POST,DELETE,OPTIONS'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                    ],
                },
            }),
            {
                authorizationType: apigateway.AuthorizationType.COGNITO,
                authorizer,
                requestParameters: {
                    'method.request.path.object': true,
                },
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                    {
                        statusCode: '400',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                    {
                        statusCode: '500',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                ],
            }
        );

        // PUT /files/{object}
        file.addMethod(
            'PUT',
            new apigateway.AwsIntegration({
              service: 's3',
              integrationHttpMethod: 'PUT',
              path: `${bucket.bucketName}/{object}`,
              options: {
                credentialsRole: apiGatewayRole,
                requestParameters: {
                  'integration.request.path.object': 'method.request.path.object',
                },
                integrationResponses: [
                  {
                    // 200 (success)
                    statusCode: '200',
                    responseParameters: {
                      'method.response.header.Access-Control-Allow-Origin': "'*'",
                      'method.response.header.Access-Control-Allow-Methods': "'PUT,OPTIONS'",
                      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                    },
                  },
                  {
                    // 4xx errors
                    selectionPattern: '4\\d{2}',
                    statusCode: '400',
                    responseParameters: {
                      'method.response.header.Access-Control-Allow-Origin': "'*'",
                      'method.response.header.Access-Control-Allow-Methods': "'PUT,OPTIONS'",
                      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                    },
                  },
                  {
                    // 5xx errors
                    selectionPattern: '5\\d{2}',
                    statusCode: '500',
                    responseParameters: {
                      'method.response.header.Access-Control-Allow-Origin': "'*'",
                      'method.response.header.Access-Control-Allow-Methods': "'PUT,OPTIONS'",
                      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                    },
                  },
                ],
              },
            }),
            {
              requestParameters: {
                'method.request.path.object': true,
              },
              methodResponses: [
                {
                  statusCode: '200',
                  responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Headers': true,
                  },
                },
                {
                  statusCode: '400',
                  responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Headers': true,
                  },
                },
                {
                  statusCode: '500',
                  responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Headers': true,
                  },
                },
              ],
            }
          );

        const exerciseResource = api.root.addResource('exercise');

        for (let exerciseType of snsStack.exerciseTypeList) {
            const exerciseTypeResource = exerciseResource.addResource(exerciseType);

            // GET one exercise
            exerciseTypeResource.addMethod(
                'GET',
                new apigateway.LambdaIntegration(lambdaStack.getExerciseLambdas[exerciseType], {
                    integrationResponses: [
                        {
                            statusCode: '200',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                        {
                            statusCode: '404',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        },
                        {
                            statusCode: '500',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                            },
                        }
                    ]
                }),
                {
                    authorizationType: apigateway.AuthorizationType.COGNITO,
                    authorizer,
                    methodResponses: [
                        {
                            statusCode: '200',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': true,
                                'method.response.header.Access-Control-Allow-Methods': true,
                                'method.response.header.Access-Control-Allow-Headers': true,
                            },
                        },
                        {
                            statusCode: '404',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': true,
                                'method.response.header.Access-Control-Allow-Methods': true,
                                'method.response.header.Access-Control-Allow-Headers': true,
                            },
                        },
                        {
                            statusCode: '500',
                            responseParameters: {
                                'method.response.header.Access-Control-Allow-Origin': true,
                                'method.response.header.Access-Control-Allow-Methods': true,
                                'method.response.header.Access-Control-Allow-Headers': true,
                            },
                        },
                    ],
                },
            );


            // POST exercise answer
            exerciseTypeResource.addMethod("POST", new apigateway.LambdaIntegration(lambdaStack.postSolutionLambdas[exerciseType], {
                integrationResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
                            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                        },
                    },
                    {
                        statusCode: '404',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
                            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                        },
                    },
                    {
                        statusCode: '500',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
                            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                        },
                    }
                ]
            }),
            {
                authorizationType: apigateway.AuthorizationType.COGNITO,
                authorizer,
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                    {
                        statusCode: '404',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                    {
                        statusCode: '500',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                ]
            });
        }


        // GET profile
        const profileResource = api.root.addResource('profile');
        profileResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(lambdaStack.getProfileLambda, {
                integrationResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
                            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                        },
                    },
                    {
                        statusCode: '404',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
                            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                        },
                    },
                    {
                        statusCode: '500',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
                            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                        },
                    }
                ]
            }),
            {
                authorizationType: apigateway.AuthorizationType.COGNITO,
                authorizer,
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                    {
                        statusCode: '404',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                    {
                        statusCode: '500',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': true,
                            'method.response.header.Access-Control-Allow-Methods': true,
                            'method.response.header.Access-Control-Allow-Headers': true,
                        },
                    },
                ]
            }
        )

        const deployment = new apigateway.Deployment(this, 'ApiGatewayDeployment', {
            api,
        });

        // Create a Stage for the API
        new apigateway.Stage(this, 'ApiGatewayStage', {
            deployment,
            stageName: 'dev',
        });
    }
}
