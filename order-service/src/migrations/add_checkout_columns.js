
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../db');

async function migrate() {
    try {
        console.log('Starting checkout columns migration...');
        const connection = await db.getConnection();

        console.log('Altering orders table...');
        // We will add columns if they don't exist. 
        // It's harder to check existence in raw SQL in one go without a procedure, 
        // so we'll just try to add them and ignore specific "duplicate column" errors or check information_schema.
        // simpler: usage of multiple ALTER statements or one big one.

        // Let's check if column exists first to be safe/idempotent
        const [cols] = await connection.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_name'",
            [process.env.DB_NAME_MAIN || 'cloudretail']
        );

        if (cols.length === 0) {
            const alterQuery = `
            ALTER TABLE orders
            ADD COLUMN shipping_name VARCHAR(255),
            ADD COLUMN shipping_address VARCHAR(255),
            ADD COLUMN shipping_city VARCHAR(100),
            ADD COLUMN shipping_zip VARCHAR(20),
            ADD COLUMN shipping_country VARCHAR(100),
            ADD COLUMN delivery_date DATE,
            ADD COLUMN payment_method VARCHAR(50),
            ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PAID';
        `;
            await connection.query(alterQuery);
            console.log('Columns added.');
        } else {
            console.log('Columns already exist, skipping.');
        }

        connection.release();
        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
