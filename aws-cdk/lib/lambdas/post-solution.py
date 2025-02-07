import json
import os
import boto3


def handler(event, context):

    sns_client = boto3.client('sns')
    exercise_type = os.environ['EXERCISE_TYPE']

    try:

        uid = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('sub')

        if not uid:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                },
                'body': json.dumps({'error': 'Unauthorized or user ID not found'})
            }

        body = json.loads(event['body'])
        eid = body['eid']
        solution = body['solution']

        if exercise_type == 'multiplication':
            multipliers = body['multipliers']
            message = {
                "uid": uid,
                "eid": eid,
                "type": exercise_type,
                "multipliers": multipliers,
                "solution": solution
            }
        elif exercise_type == 'addition':
            addends = body['addends']
            message = {
                "uid": uid,
                "eid": eid,
                "type": exercise_type,
                "addends": addends,
                "solution": solution
            }
        else:
            power = body['power']
            coeffs = body['coeffs']
            message = {
                "uid": uid,
                "eid": eid,
                "type": exercise_type,
                "power": power,
                "coeffs": coeffs,
                "solution": solution
            }



        topic = os.environ['SNS_TOPIC_ARN']

        sns_client.publish(
            TopicArn=topic,
            Message=json.dumps(message),
            MessageAttributes={
                "type": {"DataType": "String", "StringValue": exercise_type}
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },

            'body': json.dumps({"message": "Solution has been submitted successfully."}),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
            'body': json.dumps({"error": str(e)})
        }
