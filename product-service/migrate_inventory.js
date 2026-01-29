const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST_MAIN || 'localhost',
        port: Number(process.env.DB_PORT_MAIN) || 3306,
        user: process.env.DB_USER_MAIN || 'root',
        password: process.env.DB_PASS_MAIN || 'your_password',
        database: process.env.DB_NAME_MAIN || 'cloudretail_main'
    });

    console.log('Connected to database');

    try {
        // 1. Add quantity column if not exists
        console.log('Adding quantity column...');
        try {
            await connection.query('ALTER TABLE products ADD COLUMN quantity INT DEFAULT 0');
            console.log('Column added.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists, skipping.');
            } else {
                throw e;
            }
        }

        // 2. Migrate data
        console.log('Migrating inventory data...');
        // We use LEFT JOIN so even if no inventory, we set 0 (default is 0 anyway, but this syncs valid ones)
        // Actually if we want to sync, we should update products where inventory exists.
        await connection.query(`
      UPDATE products p 
      JOIN inventory i ON p.id = i.product_id 
      SET p.quantity = i.available_qty
    `);
        console.log('Data migrated.');

        // 3. Drop inventory table
        console.log('Dropping inventory table...');
        await connection.query('DROP TABLE IF EXISTS inventory');
        console.log('Table dropped.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
