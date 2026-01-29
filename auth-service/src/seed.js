const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('Seeding Auth Service...');
    try {
        // Admin User
        const adminPass = await bcrypt.hash('admin123', 10);
        await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            ['Admin', 'User', 'admin@cloudretail.com', adminPass, 'ADMIN']
        );

        // Normal User
        const userPass = await bcrypt.hash('user123', 10);
        await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            ['Test', 'Customer', 'user@cloudretail.com', userPass, 'USER']
        );

        console.log('Auth Seeding Completed.');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log('Users already exist, skipping.');
        } else {
            console.error('Seeding failed:', err);
        }
    } finally {
        process.exit();
    }
}

seed();
