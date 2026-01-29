const db = require('./db');

async function debugUsers() {
    try {
        console.log('Querying users...');
        const sql = `
            SELECT u.id, u.first_name, u.email, u.role
            FROM users u
        `;
        const [rows] = await db.query(sql);
        console.log('Users found:', rows.length);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugUsers();
