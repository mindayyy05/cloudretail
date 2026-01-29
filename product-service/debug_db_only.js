const mysql = require('mysql2/promise');
require('dotenv').config();

async function debug() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST_MAIN || 'localhost',
        port: Number(process.env.DB_PORT_MAIN) || 3306,
        user: process.env.DB_USER_MAIN || 'root',
        password: process.env.DB_PASS_MAIN || 'your_password',
        database: process.env.DB_NAME_MAIN || 'cloudretail_main'
    });

    try {
        const [rows] = await connection.query('SELECT id, name, quantity FROM products');
        console.log('--- DB Content ---');
        if (rows.length === 0) {
            console.log('No products found in DB.');
        } else {
            console.table(rows);
            console.log(`Total DB Count: ${rows.length}`);
        }
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await connection.end();
    }
}

debug();
