const db = require('./db');
const bcrypt = require('bcryptjs');

async function reset() {
    console.log('Resetting Admin Password...');
    try {
        const adminEmail = 'admin@cloudretail.com';
        const newPass = 'admin123';
        const hash = await bcrypt.hash(newPass, 10);

        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

        if (rows.length === 0) {
            console.log('Admin user not found, creating new one...');
            await db.query(
                'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                ['Admin', 'User', adminEmail, hash, 'ADMIN']
            );
        } else {
            console.log(`Updating existing admin (ID: ${rows[0].id})...`);
            await db.query(
                'UPDATE users SET password_hash = ?, role = "ADMIN" WHERE email = ?',
                [hash, adminEmail]
            );
        }

        console.log('------------------------------------------------');
        console.log('SUCCESS: Admin password reset to: admin123');
        console.log('------------------------------------------------');
    } catch (err) {
        console.error('Reset failed:', err);
    } finally {
        process.exit();
    }
}

reset();
