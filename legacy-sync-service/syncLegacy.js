// legacy-sync-service/syncLegacy.js
require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * This script simulates syncing data from a legacy MySQL database
 * (cloudretail_legacy) into the new main DB (cloudretail_main).
 *
 * In your assignment, you will describe this as:
 * - Legacy integration
 * - Eventual consistency between old monolith DB and new microservices DB.
 */

async function main() {
  // Connect to main (Aurora-like) DB
  const mainConn = await mysql.createConnection({
    host: process.env.DB_HOST_MAIN,
    port: process.env.DB_PORT_MAIN,
    user: process.env.DB_USER_MAIN,
    password: process.env.DB_PASS_MAIN,
    database: process.env.DB_NAME_MAIN,
  });

  // Connect to legacy DB
  const legacyConn = await mysql.createConnection({
    host: process.env.DB_HOST_LEGACY,
    port: process.env.DB_PORT_LEGACY,
    user: process.env.DB_USER_LEGACY,
    password: process.env.DB_PASS_LEGACY,
    database: process.env.DB_NAME_LEGACY,
  });

  console.log('Connected to main and legacy databases');

  // 1. Read legacy orders
  const [legacyOrders] = await legacyConn.query('SELECT * FROM legacy_orders');
  console.log(`Found ${legacyOrders.length} legacy orders`);

  // 2. Simple sync example:
  //    Insert them into main "orders" table as CONFIRMED orders for user_id = 1
  for (const lo of legacyOrders) {
    const total = Number(lo.legacy_total) || 0;

    await mainConn.query(
      'INSERT INTO orders (user_id, status, total_amount) VALUES (?, ?, ?)',
      [1, 'CONFIRMED', total]
    );
  }

  console.log('Legacy orders synced into main DB');

  await legacyConn.end();
  await mainConn.end();
  console.log('Connections closed. Sync complete.');
}

// Run the script
main().catch((err) => {
  console.error('Error during legacy sync:', err);
  process.exit(1);
});
