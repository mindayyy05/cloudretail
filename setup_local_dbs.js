const mysql = require('mysql2/promise');

async function createDatabases() {
    const config = {
        host: 'cloudretail-db.cpmeqcggyjs.eu-north-1.rds.amazonaws.com',
        user: 'admin',
        // Try default password first, commonly used in dev
        password: 'SecurePass123!',
    };

    try {
        console.log('Connecting to MySQL...');
        // Connect without selecting a database first
        const connection = await mysql.createConnection(config);

        const databases = ['auth_db', 'order_db', 'product_db', 'inventory_db'];

        for (const dbName of databases) {
            await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
            console.log(`Verified/Created database: ${dbName}`);
        }

        console.log('All databases initialized successfully.');
        await connection.end();
    } catch (err) {
        console.error('Error initializing databases:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\nPlease verify your MySQL password in the script.');
        }
    }
}

createDatabases();
