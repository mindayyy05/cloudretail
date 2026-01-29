
const db = require('../db');

async function migrate() {
    try {
        console.log('Adding rating and feedback columns to order_items...');
        const connection = await db.getConnection();

        await connection.query(`
            ALTER TABLE order_items 
            ADD COLUMN IF NOT EXISTS rating INT NULL CHECK (rating >= 1 AND rating <= 5),
            ADD COLUMN IF NOT EXISTS feedback TEXT NULL
        `);

        console.log('Columns added successfully.');

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
