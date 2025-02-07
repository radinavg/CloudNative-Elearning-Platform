import json
import boto3
import boto3.dynamodb
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

def convert_decimal(n):
    if isinstance(n, Decimal):
        return float(n)

def handler(event, context):

    dynamodb = boto3.resource('dynamodb')

    uid = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('sub')
    if not uid:
        return {
            'statusCode': 401,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
            'body': json.dumps({'error': 'Unauthorized or user ID not found'})
        }
    
    message = {}

    for exercise_type in ['addition', 'derivatives', 'multiplication']:

        exercise_table = dynamodb.Table('Exercise' + exercise_type)

        response_answered_exercises = exercise_table.query(
            KeyConditionExpression=Key('uid').eq(uid),
            FilterExpression=Attr('answered').exists() & Attr('answered').eq(True)
        )
        number_answered_exercises = len(response_answered_exercises.get('Items', []))

        response_correct_answers = exercise_table.query(
            KeyConditionExpression=Key('uid').eq(uid),
            FilterExpression=Attr('answered').exists() & Attr('answered').eq(True) & Attr('correctness').exists() & Attr('correctness').eq(True)
        )
        number_correct_answers = len(response_correct_answers.get('Items', []))

        ratio =  float(number_correct_answers) / float(number_answered_exercises) if number_answered_exercises > 0 else 0



        message[exercise_type] = {'ratio': ratio, 'exercises': response_answered_exercises.get('Items', [])}

        if number_answered_exercises > 0:
            grade = (
                1 if ratio > 0.87 else
                2 if ratio >= 0.74 else
                3 if ratio >= 0.59 else
                4 if ratio >= 0.49 else
                5
            )
            message[exercise_type]['grade'] = grade

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        'body': json.dumps(message, default=convert_decimal)
    }
        


