const db = require('../db');

async function createIdempotencyTable() {
    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS idempotency_log (
        event_id VARCHAR(255) PRIMARY KEY,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('[ProductService] Idempotency table verified.');
    } catch (err) {
        console.error('Failed to create idempotency table', err);
    }
}

createIdempotencyTable();
