import json
import os
import time
from math import prod

import boto3

dynamodb = boto3.client("dynamodb")

def evaluate_multiplication(event, context):
    records = event["Records"]

    for record in records:


        body = json.loads(record["body"])
        inner_body = json.loads(body.get('Message', '{}'))

        if inner_body.get('type', '') == 'warmup':
            return
        multipliers = inner_body["multipliers"]
        solution = inner_body["solution"]
        correct = prod(multipliers) == solution

        handle("multiplication", inner_body["uid"], inner_body["eid"], inner_body["solution"], correct)

def evaluate_derivatives(event, context):
    records = event["Records"]

    for record in records:
        body = json.loads(record["body"])
        inner_body = json.loads(body.get('Message', '{}'))

        if inner_body.get('type', '') == 'warmup':
            return
        power = inner_body ['power']
        coeff = inner_body ['coeffs']
        solution = inner_body ['solution']
        correct = compute_derivative(power, coeff) == solution

        handle("derivatives", inner_body ["uid"], inner_body ["eid"], inner_body ["solution"], correct)

def compute_derivative(power, coeffs):
    derived_coeffs = []
    derived_power = power - 1

    for i in range(len(coeffs) - 1):
        if coeffs[i] > 0:  # Only derive terms with positive power
            derived_coeffs.append(coeffs[i] * power)
            power = power - 1

    return {"power": derived_power, "coeffs": derived_coeffs}

def evaluate_addition(event, context):
    records = event["Records"]

    for record in records:
        body = json.loads(record["body"])
        inner_body = json.loads(body.get('Message', '{}'))
        if inner_body.get('type', '') == 'warmup':
            return
        addends = inner_body ["addends"]
        solution = inner_body ["solution"]
        correct = sum(addends) == solution

        handle("addition", inner_body ["uid"], inner_body ["eid"], inner_body ["solution"], correct)


def handle(exercise_type, user_id, exercise_id, answer, correct):
    try:
        print(f"Evaluator-{exercise_type} uid={user_id} answer={answer} correct={correct} before table=" + os.environ["TABLE_EXERCISE"])

        # transaction
        transact_items = [
            # update exercise 'answered' to True, FAIL if answered already is True
            {
                "Update": {
                    "TableName": os.environ["TABLE_EXERCISE"],
                    "Key": {
                        "uid": {"S": user_id},
                        "id": {"S": exercise_id},
                    },
                    "UpdateExpression": "SET answered = :true, answer=:answer, correctness=:correct, solveTime=:time",
                    "ConditionExpression": "attribute_not_exists(answered) OR answered = :false",
                    "ExpressionAttributeValues": {
                        ":true": {"BOOL": True},
                        ":false": {"BOOL": False},
                        ":correct": {"BOOL": correct},
                        ":answer": {"S": json.dumps(answer)},
                        ":time": {"S": str(int(time.time()))},
                    },
                }
            },
            # insert / update UserCount
            {
                "Update": {
                    "TableName": os.environ["TABLE_USER_COUNT"],
                    "Key": {
                        "uid": {"S": user_id},
                        "etype": {"S": exercise_type},
                    },
                    "UpdateExpression": (
                        "SET correctCount = if_not_exists(correctCount, :zero) + :inc, "
                        "falseCount = if_not_exists(falseCount, :zero) + :dec"
                    ),
                    "ExpressionAttributeValues": {
                        ":zero": {"N": "0"},
                        ":inc": {"N": "1" if correct else "0"},
                        ":dec": {"N": "0" if correct else "1"},
                    },
                }
            }
        ]

        # Execute the transaction
        dynamodb.transact_write_items(TransactItems=transact_items)

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Transaction completed successfully."}),
        }
    except Exception as e:
        print(f"Evaluator {exercise_type} Error: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }