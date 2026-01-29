
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../db');

async function migrate() {
    try {
        console.log('Adding brand column to products table...');
        const connection = await db.getConnection();

        // Check if column exists first to avoid error on rerun
        const [columns] = await connection.query("SHOW COLUMNS FROM products LIKE 'brand'");

        if (columns.length === 0) {
            await connection.query('ALTER TABLE products ADD COLUMN brand VARCHAR(100) AFTER category');
            console.log('Column "brand" added successfully.');
        } else {
            console.log('Column "brand" already exists.');
        }

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
