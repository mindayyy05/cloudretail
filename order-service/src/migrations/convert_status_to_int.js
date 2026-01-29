// order-service/src/migrations/convert_status_to_int.js
const db = require('../db');

async function convertStatusToInt() {
    const conn = await db.getConnection();
    try {
        console.log('Converting status column from ENUM to INT...');

        // Step 1: Add a temporary column
        console.log('Step 1: Adding temporary status_new column...');
        await conn.query(`
      ALTER TABLE orders 
      ADD COLUMN status_new INT DEFAULT 1
    `);

        // Step 2: Copy data, converting ENUM to INT
        console.log('Step 2: Migrating data from ENUM to INT...');
        await conn.query(`
      UPDATE orders 
      SET status_new = CASE 
        WHEN status = 'PENDING' THEN 1
        WHEN status = 'CONFIRMED' THEN 2
        WHEN status = 'CANCELLED' THEN 5
        ELSE 1
      END
    `);

        // Step 3: Drop old status column
        console.log('Step 3: Dropping old status column...');
        await conn.query(`
      ALTER TABLE orders 
      DROP COLUMN status
    `);

        // Step 4: Rename new column to status
        console.log('Step 4: Renaming status_new to status...');
        await conn.query(`
      ALTER TABLE orders 
      CHANGE COLUMN status_new status INT NOT NULL DEFAULT 1
    `);

        console.log('✓ Status column successfully converted to INT!');
        console.log('  1 = Placed/Pending');
        console.log('  2 = Processing/Preparing');
        console.log('  3 = Shipped');
        console.log('  4 = Delivered');
        console.log('  5 = Cancelled');

    } finally {
        conn.release();
    }
}

if (require.main === module) {
    convertStatusToInt()
        .then(() => {
            console.log('\nMigration completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = convertStatusToInt;
