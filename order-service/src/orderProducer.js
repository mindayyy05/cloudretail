const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("./sqsClient");

const QUEUE_URL = process.env.SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/505038841441/cloudretail-orders-queue";

/**
 * Sends order data to SQS for asynchronous processing.
 */
exports.queueOrder = async (orderData) => {
    try {
        const params = {
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify(orderData),
            MessageAttributes: {
                "OrderType": {
                    DataType: "String",
                    StringValue: "RetailOrder"
                }
            }
        };

        const command = new SendMessageCommand(params);
        const result = await sqsClient.send(command);

        console.log(`[SQS Producer] Order queued successfully. MessageId: ${result.MessageId}`);
        return result;
    } catch (error) {
        console.error("[SQS Producer] Error queuing order:", error);
        throw error;
    }
};
