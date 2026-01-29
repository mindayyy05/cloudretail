const mysql = require('mysql2/promise');
require('dotenv').config();
const axios = require('axios');

async function debug() {
    // 1. Check Database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST_MAIN || 'localhost',
        port: Number(process.env.DB_PORT_MAIN) || 3306,
        user: process.env.DB_USER_MAIN || 'root',
        password: process.env.DB_PASS_MAIN || 'your_password',
        database: process.env.DB_NAME_MAIN || 'cloudretail_main'
    });

    try {
        const [rows] = await connection.query('SELECT id, name, quantity FROM products LIMIT 5');
        console.log('--- DB Content (First 5 products) ---');
        console.table(rows);
        console.log(`Total DB Count: ${rows.length}`);
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await connection.end();
    }

    // 2. Check API
    try {
        console.log('\n--- API Response (GET http://localhost:4002/api/v1/products) ---');
        const res = await axios.get('http://localhost:4002/api/v1/products');
        console.log(`Status: ${res.status}`);
        console.log(`Data Length: ${res.data.length}`);
        if (res.data.length > 0) {
            console.log('Sample Element:', res.data[0]);
        }
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.error('API Response Data:', err.response.data);
        }
    }
}

debug();
