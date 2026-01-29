const db = require('./db');

async function cleanup() {
    try {
        console.log('Finding trace users...');
        const [users] = await db.query(
            "SELECT id FROM users WHERE email LIKE '%trace%' OR first_name LIKE '%Trace%'"
        );

        if (users.length === 0) {
            console.log('No trace users found.');
            return;
        }

        const userIds = users.map(u => u.id);
        console.log(`Found ${userIds.length} trace users: ${userIds.join(', ')}`);

        // Find associated orders
        const [orders] = await db.query(`SELECT id FROM orders WHERE user_id IN (${userIds.join(',')})`);
        const orderIds = orders.map(o => o.id);

        if (orderIds.length > 0) {
            console.log(`Found ${orderIds.length} orders. Deleting items...`);
            await db.query(`DELETE FROM order_items WHERE order_id IN (${orderIds.join(',')})`);

            console.log('Deleting orders...');
            await db.query(`DELETE FROM orders WHERE id IN (${orderIds.join(',')})`);
        }

        // Delete user logins
        console.log('Deleting associated logins...');
        await db.query(`DELETE FROM user_logins WHERE user_id IN (${userIds.join(',')})`);

        // Delete users
        console.log('Deleting users...');
        await db.query(`DELETE FROM users WHERE id IN (${userIds.join(',')})`);

        console.log('Cleanup complete.');
    } catch (err) {
        console.error('Cleanup failed:', err);
    } finally {
        process.exit();
    }
}

cleanup();
