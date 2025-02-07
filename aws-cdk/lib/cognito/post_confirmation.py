import boto3
import json
import os

dynamodb = boto3.resource("dynamodb")
sns_client = boto3.client("sns")

def handler(event, context):
    # user_pool_id = event["userPoolId"]
    user_attributes = event["request"]["userAttributes"]
    user_id = user_attributes["sub"]  # Cognito user ID

    # Insert user into DynamoDB
    table = dynamodb.Table(os.environ["TABLE_NAME"])
    table.put_item(
        Item={
            "id": user_id,
            "firstName": user_attributes.get("given_name", ""),
            "lastName": user_attributes.get("family_name", "")
        }
    )

    # Publish messages to SNS for exercise creation
    topic_arn = os.environ["SNS_TOPIC_ARN"]
    evaluate_topic_arn = os.environ["SNS_EVALUATE_TOPIC_ARN"]
    exercise_types = ["addition", "multiplication", "derivatives"]

    print(f"Running post_confirmation lambda on user {user_id}")
    for exercise_type in exercise_types:
        sns_client.publish(
            TopicArn=topic_arn,
            Message=json.dumps({"uid": user_id, "type": exercise_type, "count": 10}),
            MessageAttributes={
                "type": {"DataType": "String", "StringValue": exercise_type},
            },
        )

        # warm up evaluators
        sns_client.publish(
            TopicArn=evaluate_topic_arn,
            Message=json.dumps({"type": "warmup"}),
            MessageAttributes={
                "type": {"DataType": "String", "StringValue": exercise_type},
            },
        )
    return event
