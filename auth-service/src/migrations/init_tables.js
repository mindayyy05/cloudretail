
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../db');

async function migrate() {
    try {
        console.log('Starting migration...');
        const connection = await db.getConnection();

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop tables
        console.log('Dropping tables...');
        await connection.query('DROP TABLE IF EXISTS user_logins');
        // We try to drop users, if it exists
        await connection.query('DROP TABLE IF EXISTS users');

        // 1. Create users table with BIGINT id to match orders table
        console.log('Creating users table...');
        const createUsersTable = `
      CREATE TABLE users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `;
        await connection.query(createUsersTable);
        console.log('users table created.');

        // 2. Create user_logins table
        console.log('Creating user_logins table...');
        const createUserLoginsTable = `
      CREATE TABLE IF NOT EXISTS user_logins (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `;
        await connection.query(createUserLoginsTable);
        console.log('user_logins table created.');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        connection.release();
        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
