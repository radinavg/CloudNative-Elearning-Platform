import { Stack, StackProps } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { UserPool, UserPoolClient, VerificationEmailStyle } from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { AmazonSnsStack } from './sns-stack';

export class AmazonCognitoStack extends Stack {
    public readonly userPool: UserPool;
    public readonly userPoolClient: UserPoolClient;
    public readonly signUpFunction: lambda.Function;
    public readonly loginFunction: lambda.Function;

    constructor(
        scope: Construct,
        id: string,
        snsStack: AmazonSnsStack,
        dynamoStack: DynamoDBStack,
        lambdaStack: LambdaStack,
        props?: StackProps
    ) {
        super(scope, id, props);

        // Create a User Pool
        this.userPool = new UserPool(this, 'UserPool', {
            userPoolName: 'MyUserPool',
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            passwordPolicy: {
                minLength: 8,
            },

            standardAttributes: {
                profilePicture: {
                    mutable: true,
                },
                givenName: {
                    required: true,
                    mutable: true,
                },
                familyName: {
                    required: true,
                    mutable: true,
                },
            },

            autoVerify: { email: true },
            userVerification: {
                emailSubject: 'Verify your email for MyApp',
                emailBody: 'Click the link to verify your email: {##Verify Email##}',
                emailStyle: VerificationEmailStyle.LINK,
            },
        });

        this.userPoolClient = new UserPoolClient(this, 'MyUserPoolClient', {
            userPoolClientName: 'MyUserPoolClient',
            userPool: this.userPool,
            authFlows: {
                userPassword: true,
            },
        });

        //Pre Signup Lambda for Verification
        const preSignUpLambda = new lambda.Function(this, 'PreSignUpLambda', {
            functionName: 'PreSignUpLambda',
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, 'cognito')),
            handler: 'pre_signup.handler',
        });
        this.userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, preSignUpLambda);

        // Post Confirmation Lambda for Cognito
        const postConfirmationLambda = new lambda.Function(this, 'PostConfirmationLambda', {
            functionName: 'PostConfirmationLambda',
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, 'cognito')),
            handler: 'post_confirmation.handler',
            environment: {
                TABLE_NAME: dynamoStack.userTable.tableName,
                SNS_TOPIC_ARN: snsStack.exerciseGenerateTopic.topicArn,
                SNS_EVALUATE_TOPIC_ARN: snsStack.exerciseEvaluateTopic.topicArn
            },
        });
        this.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationLambda);

        dynamoStack.userTable.grantWriteData(postConfirmationLambda); 
        snsStack.exerciseGenerateTopic.grantPublish(postConfirmationLambda); 
    }
}
