def handler(event, context):
    # Automatically confirm the user and mark the email as verified
    event["response"]["autoConfirmUser"] = True
    event["response"]["autoVerifyEmail"] = True
    return event
