/**
 * CloudRetail Inventory Lambda
 * Triggered by: AWS EventBridge (OrderedPlaced Event)
 * Purpose: Asynchronous stock reduction to ensure high availability and decoupling.
 */

const mysql = require('mysql2/promise');

// DB configuration - In production, these should come from environment variables
// which are populated from AWS Secrets Manager
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'product_db', // Explicitly hit product_db where products table is
};

exports.handler = async (event) => {
    console.log('Received Event:', JSON.stringify(event, null, 2));

    const detail = event.detail;
    if (!detail || !detail.items) {
        console.error('Invalid event detail: missing items');
        return;
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        for (const item of detail.items) {
            const { productId, quantity } = item;

            console.log(`Processing Stock Reduction: Product ${productId}, Qty ${quantity}`);

            // 1. Check current stock
            const [rows] = await connection.execute(
                'SELECT quantity FROM products WHERE id = ? FOR UPDATE',
                [productId]
            );

            if (rows.length === 0) {
                console.warn(`Product ${productId} not found. Skipping.`);
                continue;
            }

            const currentQty = rows[0].quantity;
            if (currentQty < quantity) {
                console.error(`Insufficient stock for product ${productId}. Available: ${currentQty}, Requested: ${quantity}`);
                // In a real scenario, you might emit a "StockInsufficient" event here
                continue;
            }

            // 2. Reduce stock
            await connection.execute(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [quantity, productId]
            );
        }

        await connection.commit();
        console.log('Stock reduction completed successfully.');

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in Inventory Lambda:', err);
        throw err; // Allow Lambda to retry if configured
    } finally {
        if (connection) await connection.end();
    }
};
