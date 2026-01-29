const db = require('../db');

async function fixOrders() {
    console.log('Starting Data Fix: Reassigning orders from User 1 to User 2...');

    try {
        const conn = await db.getConnection();
        try {
            const [result] = await conn.query(
                'UPDATE orders SET user_id = 2 WHERE user_id = 18'
            );

            console.log(`Success: Updated ${result.changedRows} orders.`);
            console.log('Orders should now be visible to the logged-in user (ID 2).');

        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Data Fix Failed:', err);
        process.exit(1);
    }
    process.exit(0);
}

fixOrders();
