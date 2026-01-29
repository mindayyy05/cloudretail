
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Loads .env from root of service

async function createAdmin() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST_MAIN,
        user: process.env.DB_USER_MAIN,
        password: process.env.DB_PASS_MAIN,
        database: process.env.DB_NAME_MAIN
    });

    try {
        const email = 'admin@cloudretail.com';
        const password = 'admin123';
        const firstName = 'Admin';
        const lastName = 'User';

        // Check if exists
        const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            console.log('Admin user already exists:', email);
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert
        await conn.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            [email, hash, firstName, lastName, 'ADMIN']
        );

        console.log(`Admin user created successfully.`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (err) {
        console.error('Failed to create admin:', err);
    } finally {
        await conn.end();
    }
}

createAdmin();
