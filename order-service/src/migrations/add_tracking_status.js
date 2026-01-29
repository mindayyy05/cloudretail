// order-service/src/migrations/add_tracking_status.js
const db = require('../db');

async function addTrackingStatusColumn() {
    const conn = await db.getConnection();
    try {
        console.log('Adding tracking_status column to orders table...');

        await conn.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50) DEFAULT 'placed'
    `);

        console.log('tracking_status column added successfully!');

        // Update existing orders to have tracking status based on their current status
        console.log('Updating existing orders with tracking status...');
        await conn.query(`
      UPDATE orders 
      SET tracking_status = CASE 
        WHEN status = 1 OR status = 'PENDING' THEN 'placed'
        WHEN status = 2 THEN 'preparing'
        WHEN status = 3 THEN 'shipped'
        WHEN status = 4 THEN 'delivered'
        WHEN status = 5 THEN 'cancelled'
        ELSE 'placed'
      END
      WHERE tracking_status IS NULL OR tracking_status = ''
    `);

        console.log('Existing orders updated successfully!');
    } finally {
        conn.release();
    }
}

if (require.main === module) {
    addTrackingStatusColumn()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = addTrackingStatusColumn;
