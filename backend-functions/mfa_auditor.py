# pyright: reportMissingImports=false
import boto3


def lambda_handler(event, context):
    iam = boto3.client('iam')
    sns = boto3.client('sns')
    
    users = iam.list_users()['Users']
    for user in users:
        username = user['UserName']
        # Check if MFA is enabled for the user
        mfa_devices = iam.list_mfa_devices(UserName=username)['MFADevices']
        
        if not mfa_devices:
            message = f"CRITICAL: User {username} does not have MFA enabled!"
            print(message)
            # Sends alert to SNS (Update with your Topic ARN later)
            # sns.publish(TopicArn='YOUR_SNS_TOPIC_ARN', Message=message)
            
    return {"status": "Audit Complete"}