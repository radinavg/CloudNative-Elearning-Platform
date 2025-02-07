import boto3
import json
import os

cognito_client = boto3.client('cognito-idp')


def handler(event, context):
    try:
        body = json.loads(event['body'])
        email = body['email']
        password = body['password']

        response = cognito_client.initiate_auth(
            AuthFlow='USER_PASSWORD_AUTH',
            ClientId=os.environ['CLIENT_ID'],
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Login successful",
                "token": response['AuthenticationResult']['IdToken']
            })
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)})
        }
