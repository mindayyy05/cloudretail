
const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanup() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST_MAIN,
        user: process.env.DB_USER_MAIN,
        password: process.env.DB_PASS_MAIN,
        database: process.env.DB_NAME_MAIN
    });

    try {
        console.log('Starting cleanup...');

        const testPatterns = [
            'test_%@example.com',
            'cart_test_%@example.com',
            'checkout_test_%@example.com',
            'history_test_%@example.com',
            'fullflow_%@example.com'
        ];

        // 1. Find User IDs
        let allUserIds = [];
        for (const pattern of testPatterns) {
            const [rows] = await conn.query('SELECT id, email FROM users WHERE email LIKE ?', [pattern]);
            if (rows.length > 0) {
                console.log(`Found ${rows.length} users for pattern ${pattern}`);
                allUserIds = allUserIds.concat(rows.map(r => r.id));
            }
        }

        if (allUserIds.length === 0) {
            console.log('No test users found.');
            return;
        }

        console.log(`Deleting data for ${allUserIds.length} users:`, allUserIds);

        const placeholders = allUserIds.map(() => '?').join(',');

        // 2. Delete Order Items (indirectly via Orders if we had easy way, but safest is explicit)
        // First find orders for these users
        const [orders] = await conn.query(`SELECT id FROM orders WHERE user_id IN (${placeholders})`, allUserIds);
        const orderIds = orders.map(o => o.id);

        if (orderIds.length > 0) {
            const orderPlaceholders = orderIds.map(() => '?').join(',');
            console.log(`Deleting items for ${orderIds.length} orders...`);
            await conn.query(`DELETE FROM order_items WHERE order_id IN (${orderPlaceholders})`, orderIds);

            console.log(`Deleting ${orderIds.length} orders...`);
            await conn.query(`DELETE FROM orders WHERE id IN (${orderPlaceholders})`, orderIds);
        }

        // 3. Delete Cart Items ?? (User might have cart items)
        // We know we have a cart_items table in older migrations? Or order-service uses same DB?
        // Let's check if cart_items table exists and assuming it has user_id or similar?
        // Previous context said cart_items table (User ID...).
        try {
            await conn.query(`DELETE FROM cart_items WHERE user_id IN (${placeholders})`, allUserIds);
            console.log('Deleted cart items.');
        } catch (e) {
            console.log('Skipping cart_items (maybe table not found or different column):', e.message);
        }

        // 4. Delete User Logins
        console.log('Deleting user logins...');
        await conn.query(`DELETE FROM user_logins WHERE user_id IN (${placeholders})`, allUserIds);

        // 5. Delete Users
        console.log('Deleting users...');
        await conn.query(`DELETE FROM users WHERE id IN (${placeholders})`, allUserIds);

        console.log('Cleanup complete!');

    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        await conn.end();
    }
}

cleanup();
