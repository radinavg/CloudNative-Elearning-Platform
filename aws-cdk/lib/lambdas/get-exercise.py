import json
import os
import logging

import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def convert_decimal(n):
    if isinstance(n, Decimal):
        return float(n)

def handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ.get('TABLE_NAME')

    if not table_name:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
            'body': json.dumps({'error': 'TABLE_NAME environment variable not set'})
        }

    exercise_table = dynamodb.Table(table_name)

    try:
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

        response = exercise_table.query(
            KeyConditionExpression=Key('uid').eq(uid),
            FilterExpression=Attr('answered').exists() & Attr('answered').eq(False),
            ConsistentRead=True
        )


        items = response.get('Items', [])
        

        if len(items) == 0:
            logger.error('Items not found')
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                },
                'body': json.dumps({'error': 'No exercises found'})
            }

        logger.info('Item found')
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
            'body': json.dumps(items[0], default=convert_decimal)
        }

    except KeyError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
            'body': json.dumps({'error': f'Missing key in event: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
            'body': json.dumps({'error': str(e)})
        }
