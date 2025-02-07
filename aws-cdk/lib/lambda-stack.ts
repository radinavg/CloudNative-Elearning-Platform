import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {Stack, StackProps} from "aws-cdk-lib";
import {DynamoDBStack} from "./dynamodb-stack";
import {AmazonSnsStack} from "./sns-stack";
import {Construct} from "constructs";
import path from "path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as cdk from "aws-cdk-lib/core";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import {DynamoEventSource, SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {StartingPosition} from "aws-cdk-lib/aws-lambda";

export class LambdaStack extends Stack {
    public readonly getExerciseLambdas: Record<string, lambda.Function> = {};
    public readonly postSolutionLambdas: Record<string, lambda.Function> = {};
    public readonly getProfileLambda: lambda.Function;


    constructor(scope: Construct, id: string,
                snsStack: AmazonSnsStack,
                dynamoStack: DynamoDBStack,
                props?: StackProps) {
        super(scope, id, props);

        const addition_table = dynamoStack.exerciseTables["addition"];
        const derivatives_table = dynamoStack.exerciseTables["derivatives"];
        const multiplication_table = dynamoStack.exerciseTables["multiplication"];


        const generatorAddition = new lambda.Function(this, "addition" + "Generator", {
            functionName: "addition" + "Generator",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "generators.generate_addition_exercises",
            environment: {
                TABLE_NAME: addition_table.tableName,
            }
        });

        const queueGenerator1 = new sqs.Queue(this, "Exercise-" + "addition" + "-Queue", {
            queueName: "Exercise-" + "addition" + "-Queue",
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // subscribe queue to SNS
        snsStack.exerciseGenerateTopic.addSubscription(new subs.SqsSubscription(queueGenerator1, {
            filterPolicy: {
                type: sns.SubscriptionFilter.stringFilter({allowlist: ["addition"]})
            }
        }));

        // Add SQS as an event source for the Lambda function
        generatorAddition.addEventSource(new SqsEventSource(queueGenerator1, {
            batchSize: 5, //TODO do we need batch size
        }));
        addition_table.grantWriteData(generatorAddition);

        // get exercise
        const getLambdaAddition = new lambda.Function(this, "addition-getExerciseLambda", {
            functionName: "addition-getExerciseLambda",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "get-exercise.handler",
            environment: {
                TABLE_NAME: addition_table.tableName,
            }
        });
        addition_table.grantReadData(getLambdaAddition);

        this.getExerciseLambdas["addition"] = getLambdaAddition;


        const generatorMultiplication = new lambda.Function(this, "multiplication" + "Generator", {
            functionName: "multiplication" + "Generator",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "generators.generate_multiplication_exercises",
            environment: {
                TABLE_NAME: multiplication_table.tableName,
            }
        });
        multiplication_table.grantWriteData(generatorMultiplication);

        const queueGenerator2 = new sqs.Queue(this, "Exercise-" + "multiplication" + "-Queue", {
            queueName: "Exercise-" + "multiplication" + "-Queue",
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // subscribe queue to SNS
        snsStack.exerciseGenerateTopic.addSubscription(new subs.SqsSubscription(queueGenerator2, {
            filterPolicy: {
                type: sns.SubscriptionFilter.stringFilter({allowlist: ["multiplication"]})
            }
        }));

        // Add SQS as an event source for the Lambda function
        generatorMultiplication.addEventSource(new SqsEventSource(queueGenerator2, {
            batchSize: 5, //TODO do we need batch size
        }));

        const getLambdaMultiplication = new lambda.Function(this, "multiplication-getExerciseLambda", {
            functionName: "multiplication-getExerciseLambda",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "get-exercise.handler",
            environment: {
                TABLE_NAME: multiplication_table.tableName,
            }
        });
        multiplication_table.grantReadData(getLambdaMultiplication);

        this.getExerciseLambdas["multiplication"] = getLambdaMultiplication;

        const generatorDerivatives = new lambda.Function(this, "derivatives" + "Generator", {
            functionName: "derivatives" + "Generator",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "generators.generate_derivative_exercises",
            environment: {
                TABLE_NAME: derivatives_table.tableName,
            }
        });
        derivatives_table.grantWriteData(generatorDerivatives);
        const queueGenerator3 = new sqs.Queue(this, "Exercise-" + "derivatives" + "-Queue", {
            queueName: "Exercise-" + "derivatives" + "-Queue",
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // subscribe queue to SNS
        snsStack.exerciseGenerateTopic.addSubscription(new subs.SqsSubscription(queueGenerator3, {
            filterPolicy: {
                type: sns.SubscriptionFilter.stringFilter({allowlist: ["derivatives"]})
            }
        }));

        // Add SQS as an event source for the Lambda function
        generatorDerivatives.addEventSource(new SqsEventSource(queueGenerator3, {
            batchSize: 5, //TODO do we need batch size
        }));

        // Grant Lambda permissions to read from SQS
        queueGenerator3.grantConsumeMessages(generatorDerivatives);

        const getLambdaDerivatives = new lambda.Function(this, "derivatives-getExerciseLambda", {
            functionName: "derivatives-getExerciseLambda",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "get-exercise.handler",
            environment: {
                TABLE_NAME: derivatives_table.tableName,
            }
        });
        derivatives_table.grantReadData(getLambdaDerivatives);

        this.getExerciseLambdas["derivatives"] = getLambdaDerivatives;

        const derivatives_evaluator = new lambda.Function(this, "DerivativesEvaluator", {
                functionName: "DerivativesEvaluator",
                runtime: lambda.Runtime.PYTHON_3_9,
                code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
                handler: "evaluator_lambdas.evaluate_derivatives",
                environment: {
                    TABLE_USER_COUNT: dynamoStack.userCountTable.tableName,
                    TABLE_EXERCISE: derivatives_table.tableName,
                }
            });

        derivatives_table.grantReadWriteData(derivatives_evaluator);
        dynamoStack.userCountTable.grantWriteData(derivatives_evaluator);

        const queueDerivativesEvaluator = new sqs.Queue(this, "ExerciseDerivativesEvaluateQueue", {
                    queueName: "Exercise-derivatives-EvaluateQueue",
                    visibilityTimeout: cdk.Duration.seconds(300),
        });

        snsStack.exerciseEvaluateTopic.addSubscription(new subs.SqsSubscription(queueDerivativesEvaluator, {
        filterPolicy: {
                type: sns.SubscriptionFilter.stringFilter({allowlist: ["derivatives"]})
        }
        }));

        queueDerivativesEvaluator.grantConsumeMessages(derivatives_evaluator);
        derivatives_evaluator.addEventSource(new SqsEventSource(queueDerivativesEvaluator, {}));

        const addition_evaluator = new lambda.Function(this, "AdditionEvaluator", {
                    functionName: "AdditionEvaluator",
                    runtime: lambda.Runtime.PYTHON_3_9,
                    code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
                    handler: "evaluator_lambdas.evaluate_addition",
                    environment: {
                        TABLE_USER_COUNT: dynamoStack.userCountTable.tableName,
                        TABLE_EXERCISE: addition_table.tableName,
                    }
                });

        addition_table.grantReadWriteData(addition_evaluator);
        dynamoStack.userCountTable.grantWriteData(addition_evaluator);

        const queueAdditionEvaluator = new sqs.Queue(this, "ExerciseAdditionEvaluateQueue", {
                    queueName: "Exercise-addition-EvaluateQueue",
                    visibilityTimeout: cdk.Duration.seconds(300),
        });

        snsStack.exerciseEvaluateTopic.addSubscription(new subs.SqsSubscription(queueAdditionEvaluator, {
        filterPolicy: {
                type: sns.SubscriptionFilter.stringFilter({allowlist: ["addition"]})
        }
        }));

        queueAdditionEvaluator.grantConsumeMessages(addition_evaluator);
        addition_evaluator.addEventSource(new SqsEventSource(queueAdditionEvaluator, {}));

        const multiplication_evaluator = new lambda.Function(this, "MultiplicationEvaluator", {
                    functionName: "MultiplicationEvaluator",
                    runtime: lambda.Runtime.PYTHON_3_9,
                    code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
                    handler: "evaluator_lambdas.evaluate_multiplication",
                    environment: {
                        TABLE_USER_COUNT: dynamoStack.userCountTable.tableName,
                        TABLE_EXERCISE: multiplication_table.tableName,
                    }
                });

        multiplication_table.grantReadWriteData(multiplication_evaluator);
        dynamoStack.userCountTable.grantWriteData(multiplication_evaluator);

        const queueMultiplicationEvaluator = new sqs.Queue(this, "ExerciseMultiplicationEvaluateQueue", {
                    queueName: "Exercise-Multiplication-EvaluateQueue",
                    visibilityTimeout: cdk.Duration.seconds(300),
        });

        snsStack.exerciseEvaluateTopic.addSubscription(new subs.SqsSubscription(queueMultiplicationEvaluator, {
        filterPolicy: {
                type: sns.SubscriptionFilter.stringFilter({allowlist: ["multiplication"]})
        }
        }));

        queueMultiplicationEvaluator.grantConsumeMessages(multiplication_evaluator);
        multiplication_evaluator.addEventSource(new SqsEventSource(queueMultiplicationEvaluator, {}));


        // Post solution lambdas

        const postAdditionSolutionLambda = new lambda.Function(this, "postAdditionSolutionLambda", {
            functionName: "PostAdditionSolution",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "post-solution.handler",
            environment: {
                SNS_TOPIC_ARN: snsStack.exerciseEvaluateTopic.topicArn,
                EXERCISE_TYPE: 'addition'
            }
        });

        const postMultiplicationSolutionLambda = new lambda.Function(this, "postMultiplicationSolutionLambda", {
            functionName: "PostMultiplicationSolution",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "post-solution.handler",
            environment: {
                SNS_TOPIC_ARN: snsStack.exerciseEvaluateTopic.topicArn,
                EXERCISE_TYPE: 'multiplication'
            }
        });

        const postDerivativeSolutionLambda = new lambda.Function(this, "postDerivativeSolutionLambda", {
            functionName: "PostDerivativeSolution",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "post-solution.handler",
            environment: {
                SNS_TOPIC_ARN: snsStack.exerciseEvaluateTopic.topicArn,
                EXERCISE_TYPE: 'derivatives'
            }
        });

        snsStack.exerciseEvaluateTopic.grantPublish(postAdditionSolutionLambda)
        snsStack.exerciseEvaluateTopic.grantPublish(postMultiplicationSolutionLambda)
        snsStack.exerciseEvaluateTopic.grantPublish(postDerivativeSolutionLambda)

        this.postSolutionLambdas['addition'] = postAdditionSolutionLambda;
        this.postSolutionLambdas['derivatives'] = postDerivativeSolutionLambda;
        this.postSolutionLambdas['multiplication'] = postMultiplicationSolutionLambda;

        // watcher
        const watcherAdditionLambda = new lambda.Function(this, "watcherAdditionLambda", {
            functionName: "WatcherAdditionExercises",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "watcher.handler",
            environment: {
                TABLE_NAME: addition_table.tableName,
                SNS_TOPIC_ARN: snsStack.exerciseGenerateTopic.topicArn,
                EXERCISE_TYPE: 'addition',
            }
        });


        const watcherMultiplicationLambda = new lambda.Function(this, "watcherMultiplicationLambda", {
            functionName: "WatcherMultiplicationExercises",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "watcher.handler",
            environment: {
                TABLE_NAME: multiplication_table.tableName,
                SNS_TOPIC_ARN: snsStack.exerciseGenerateTopic.topicArn,
                EXERCISE_TYPE: 'multiplication',
            }
        });

        const watcherDerivativeLambda = new lambda.Function(this, "watcherDerivativeLambda", {
            functionName: "WatcherDerivativeExercises",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "watcher.handler",
            environment: {
                TABLE_NAME: derivatives_table.tableName,
                SNS_TOPIC_ARN: snsStack.exerciseGenerateTopic.topicArn,
                EXERCISE_TYPE: 'derivatives',
            }
        });

        addition_table.grantStreamRead(watcherAdditionLambda)
        multiplication_table.grantStreamRead(watcherMultiplicationLambda)
        derivatives_table.grantStreamRead(watcherDerivativeLambda)

        snsStack.exerciseGenerateTopic.grantPublish(watcherAdditionLambda)
        snsStack.exerciseGenerateTopic.grantPublish(watcherMultiplicationLambda)
        snsStack.exerciseGenerateTopic.grantPublish(watcherDerivativeLambda)

        watcherAdditionLambda.addEventSource(
            new DynamoEventSource(addition_table, {startingPosition: StartingPosition.LATEST})
        );

        watcherMultiplicationLambda.addEventSource(
            new DynamoEventSource(multiplication_table, {startingPosition: StartingPosition.LATEST})
        );

        watcherDerivativeLambda.addEventSource(
            new DynamoEventSource(derivatives_table, {startingPosition: StartingPosition.LATEST})
        );


        // get profile lambda

        const getProfileLambda = new lambda.Function(this, "getProfileLambda", {
            functionName: "GetProfileLambda",
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambdas")),
            handler: "get-profile.handler",
            environment: {}
        });

        addition_table.grantReadData(getProfileLambda)
        multiplication_table.grantReadData(getProfileLambda)
        derivatives_table.grantReadData(getProfileLambda)

        this.getProfileLambda = getProfileLambda;

    }
}

