// order-service/src/verify_tracking_status.js
const db = require('./db');

async function verifyTrackingStatus() {
    const conn = await db.getConnection();
    try {
        console.log('Checking orders table structure...');
        const [columns] = await conn.query(`
      SHOW COLUMNS FROM orders WHERE Field = 'tracking_status'
    `);

        if (columns.length > 0) {
            console.log('✓ tracking_status column exists!');
            console.log('Column details:', columns[0]);
        } else {
            console.log('✗ tracking_status column does NOT exist');
            return;
        }

        console.log('\nChecking current orders with tracking status:');
        const [orders] = await conn.query(`
      SELECT id, user_id, status, tracking_status, total_amount 
      FROM orders 
      ORDER BY id DESC 
      LIMIT 5
    `);

        console.table(orders);

    } finally {
        conn.release();
    }
}

verifyTrackingStatus()
    .then(() => {
        console.log('\nVerification complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Verification failed:', err);
        process.exit(1);
    });
