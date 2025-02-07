import boto3
import json
import os

cognito_client = boto3.client('cognito-idp')


def handler(event, context):
    try:
        body = json.loads(event['body'])
        email = body['email']
        password = body['password']

        response = cognito_client.sign_up(
            ClientId=os.environ['CLIENT_ID'],
            Username=email,  # Use email as the username
            Password=password,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "given_name", "Value": body['firstName']},
                {"Name": "family_name", "Value": body['lastName']},
            ]
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Sign-up successful",
                "data": response
            })
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)})
        }
