const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST_MAIN || 'localhost',
        port: Number(process.env.DB_PORT_MAIN) || 3306,
        user: process.env.DB_USER_MAIN || 'root',
        password: process.env.DB_PASS_MAIN || 'your_password',
        database: process.env.DB_NAME_MAIN || 'cloudretail_main'
    });

    try {
        const [rows] = await connection.query('DESCRIBE products');
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkSchema();
