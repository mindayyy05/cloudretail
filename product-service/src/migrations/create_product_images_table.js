
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../db');

async function migrate() {
    try {
        console.log('Creating product_images table...');
        const connection = await db.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                /* , FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE */
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        console.log('Table "product_images" created successfully.');

        // Optionally: populate from existing products
        const [rows] = await connection.query("SELECT id, image_url FROM products WHERE image_url IS NOT NULL");
        for (const row of rows) {
            // Check if already exists
            const [exists] = await connection.query("SELECT id FROM product_images WHERE product_id = ? AND image_url = ?", [row.id, row.image_url]);
            if (exists.length === 0) {
                await connection.query("INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)", [row.id, row.image_url, true]);
            }
        }
        console.log('Populated "product_images" from existing products.');

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
