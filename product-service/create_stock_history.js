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
        console.log('Creating stock_history table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        quantity_added INT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        added_by INT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
        console.log('Table created.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
