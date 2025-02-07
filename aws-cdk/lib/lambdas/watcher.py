import json
import os
import boto3
import logging

from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):

    dynamodb = boto3.resource('dynamodb')
    sns_client = boto3.client('sns')

    table_name = os.environ['TABLE_NAME']
    exercise_type = os.environ['EXERCISE_TYPE']
    topic_arn = os.environ['SNS_TOPIC_ARN']

    table = dynamodb.Table(table_name)

    try:
        for record in event['Records']:

            if record['eventName'] != 'MODIFY':
                continue

            uid = record["dynamodb"]["Keys"]["uid"]["S"]

            response = table.query(
                KeyConditionExpression=Key('uid').eq(uid),
                FilterExpression=Attr('answered').exists() & Attr('answered').eq(False)
            )

            exercise_count = len(response.get('Items'))
            logger.info(f"Exercise count for user {uid}: {exercise_count}")

            if exercise_count and exercise_count < 5:
                logger.debug(f"Generating one more exercise of type {exercise_type} for user {uid}")

                message = {
                    'uid': uid,
                    'type': exercise_type,
                    'count': 1
                }

                sns_client.publish(
                    TopicArn=topic_arn,
                    Message=json.dumps(message),
                    MessageAttributes={
                        "type": {"DataType": "String", "StringValue": exercise_type},
                    }
                )

    except Exception as e:
        logger.error("Error while processing dynamodb stream: {} ".format(e))



