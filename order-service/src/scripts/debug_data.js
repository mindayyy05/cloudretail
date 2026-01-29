const db = require('../db');

async function checkData() {
    console.log('Checking Users and Orders...');
    try {
        const conn = await db.getConnection();
        try {
            const [users] = await conn.query('SELECT id, email, role FROM users');
            console.log('--- USERS ---');
            console.table(users);

            const [orders] = await conn.query('SELECT id, user_id, total_amount, status FROM orders LIMIT 5');
            console.log('--- ORDERS (Sample) ---');
            console.table(orders);

        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Check Failed:', err);
    }
    process.exit();
}

checkData();
