import boto3
import json
import os
import uuid
import random



import boto3
import json
import os
import uuid
import random
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB resource
dynamodb = boto3.resource("dynamodb")


def handler(event, context, exercise_json):
    table = dynamodb.Table(os.environ["TABLE_NAME"])

    for record in event.get("Records", []):
        try:
            body = json.loads(record.get("body", "{}"))
            message = json.loads(body.get("Message", "{}"))
            user_id = message.get("uid")

            if not user_id:
                logger.error("User ID is missing in the message.")
                continue

            # Add exercise to DynamoDB
            try:
                table.put_item(
                    Item={
                        "uid": user_id,  # HASH key
                        "id": str(uuid.uuid4()),  # RANGE key
                        "exercise": exercise_json,
                        "answered": False,
                        "solveTime": random.randint(1, 100)  # Optional, based on your table schema
                    }
                )
            except Exception as e:
                logger.error(f"Error adding exercise to DynamoDB for user {user_id}: {e}")

        except Exception as e:
            logger.error(f"Error processing record: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Exercises processed successfully"})
    }


# example exercise: {"type":"addition", "addends":[2,3,4]}
def generate_random_addition_exercise():

    exercise = {'type': 'addition', "addends": []}
    number_addends = random.randint(2, 10)
    for i in range(number_addends):
        exercise['addends'].append(random.randint(1, 10))

    return json.dumps(exercise)


# example message: {"count": 10, "userId":1}
def generate_addition_exercises(event, context):
    try:
        records = event.get('Records', [])
        if not records:
            logger.error("No records found in the event.")
            return {"statusCode": 400, "body": "No records found in the event"}

        for record in records:
            try:
                body = json.loads(record.get('body', '{}'))
                inner_body = json.loads(body.get('Message', '{}'))
                exercises = []
                number_exercises = inner_body.get('count', 0)

                if number_exercises <= 0:
                    logger.error(f"Invalid number of exercises {number_exercises} in the message.")
                    continue

                for i in range(number_exercises):
                    exercise = generate_random_addition_exercise()
                    try:
                        handler(event, context, json.loads(exercise))
                        exercises.append(exercise)
                    except Exception as e:
                        logger.error(f"Error processing exercise {i + 1} for user {body.get('uid')}: {e}")

                logger.info(f"Successfully processed {number_exercises} addition exercises.")
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding JSON from record: {e}")
            except Exception as e:
                logger.error(f"Unexpected error processing record: {e}")

        return {"statusCode": 200, "body": "Addition exercises generated successfully"}

    except Exception as e:
        logger.error(f"Error in generate_addition_exercises: {e}")
        return {"statusCode": 500, "body": "Internal server error"}

# example exercise: {"type":"derivative", power: 2, coeffs: []}
def generate_random_derivative_exercise():
    exercise = {'type': 'derivative', "coeffs": []}

    power = random.randint(2, 10)
    exercise['power'] = power

    for i in range(power + 1):
        exercise["coeffs"].append(random.randint(1, 10))

    return json.dumps(exercise)

# example message: {"count": 10, "userId":1}
def generate_derivative_exercises(event, context):
    records = event['Records']

    for record in records:
        body = json.loads(record['body'])
        inner_body = json.loads(body.get('Message', '{}'))
        exercises = []
        number_exercises = inner_body['count']

        for i in range(number_exercises):
            exercise = generate_random_derivative_exercise()
            handler(event, context, json.loads(exercise))

        print(exercises)

    return {"statusCode": 200, "body": "Derivative exercises generated successfully"}

# example exercise: {"type":"multiplication", "multipliers":[2,3,4]}
def generate_random_multiplication_exercise():

    exercise = {'type': 'multiplication', "multipliers": []}
    number_addends = random.randint(2, 10)
    for i in range(number_addends):
        exercise['multipliers'].append(random.randint(1, 10))

    return json.dumps(exercise)

# example message: {"count": 10, "userId":1}
def generate_multiplication_exercises(event, context):
    # message: {"numberExercises": 10, "userId":1}
    records = event['Records']

    for record in records:
        body = json.loads(record['body'])
        inner_body = json.loads(body.get('Message', '{}'))
        exercises = []
        number_exercises = inner_body['count']

        for i in range(number_exercises):
            exercise = generate_random_multiplication_exercise()
            handler(event, context, json.loads(exercise))

        print(exercises)

    return {"statusCode": 200, "body": "Multiplication exercises generated successfully"}
