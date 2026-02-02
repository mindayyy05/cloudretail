/**
 * expert-level: Asynchronous Order Worker (SQS Consumer)
 * This script polls the SQS queue, processes orders, and saves them to the DB.
 */
const { ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("./sqsClient");
const db = require("./db");
const axios = require("axios");
const { loadSecrets } = require("./secrets");

async function processOrder(orderData) {
    const { userId, items, totalAmount, shipping, payment, correlationId } = orderData;
    console.log(`[Worker] [${correlationId}] Processing order for userId: ${userId}`);

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1) Insert into orders
        const [orderRes] = await conn.query(
            `INSERT INTO orders (
          user_id, total_amount, status, tracking_status, created_at,
          shipping_name, shipping_address, shipping_city, shipping_zip, shipping_country,
          delivery_date, payment_method, payment_status
       ) VALUES (?, ?, 1, 'placed', NOW(), ?, ?, ?, ?, ?, ?, ?, 'PAID')`,
            [
                userId, totalAmount,
                shipping.name, shipping.address, shipping.city, shipping.zip, shipping.country,
                payment.date, payment.method
            ]
        );
        const orderId = orderRes.insertId;

        // 2) Insert into order_items
        for (const it of items) {
            await conn.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, it.productId, it.quantity, it.price]
            );
        }

        // 3) Simulate Payment Gateway Call (Mock)
        console.log(`[Worker] [${correlationId}] Mocking payment for order: ${orderId}`);
        // In a real app, this is where you'd call Stripe/Stripe/etc.

        await conn.commit();
        console.log(`[Worker] [${correlationId}] SUCCESSFULLY processed order: ${orderId}`);
        return true;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error(`[Worker] [${correlationId}] FAILED to process order:`, error);
        return false;
    } finally {
        if (conn) conn.release();
    }
}

async function pollMessages() {
    console.log(`[Worker] Polling for messages from SQS...`);

    const params = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20 // Long polling
    };

    try {
        const command = new ReceiveMessageCommand(params);
        const response = await sqsClient.send(command);

        if (response.Messages && response.Messages.length > 0) {
            console.log(`[Worker] Received ${response.Messages.length} messages.`);

            for (const message of response.Messages) {
                const orderData = JSON.parse(message.Body);
                const success = await processOrder(orderData);

                if (success) {
                    // Delete message from queue if processed successfully
                    const deleteParams = {
                        QueueUrl: process.env.SQS_QUEUE_URL,
                        ReceiptHandle: message.ReceiptHandle
                    };
                    await sqsClient.send(new DeleteMessageCommand(deleteParams));
                    console.log(`[Worker] Message deleted from SQS.`);
                }
            }
        }
    } catch (error) {
        console.error("[Worker] Error polling SQS:", error);
    }

    // Poll again
    setImmediate(pollMessages);
}

async function start() {
    await loadSecrets();
    // Start polling
    pollMessages();
}

start();
