const AWSXRay = require('aws-xray-sdk');
const { SQSClient } = AWSXRay.captureAWSv3Client(require("@aws-sdk/client-sqs"));

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const sqsClient = new SQSClient({ region: AWS_REGION });

module.exports = sqsClient;
