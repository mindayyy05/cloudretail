require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTables() {
    const config = {
        host: process.env.RDS_ENDPOINT || 'localhost',
        user: process.env.RDS_USER || 'root',
        password: process.env.RDS_PASS || 'your_password',
    };

    const tables = {
        auth_db: [
            `CREATE TABLE IF NOT EXISTS users (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         first_name VARCHAR(100) NOT NULL,
         last_name VARCHAR(100) NOT NULL,
         email VARCHAR(100) NOT NULL UNIQUE,
         password_hash VARCHAR(255) NOT NULL,
         role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );`,
            // Create user_logins table as seen in authController.js
            `CREATE TABLE IF NOT EXISTS user_logins (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         user_id BIGINT NOT NULL,
         login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );`
        ],
        product_db: [
            `CREATE TABLE IF NOT EXISTS products (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         description TEXT,
         price DECIMAL(10,2) NOT NULL,
         category VARCHAR(100),
         brand VARCHAR(100),
         image_url VARCHAR(255),
         quantity INT DEFAULT 0,
         rating DECIMAL(2,1),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );`,
            `CREATE TABLE IF NOT EXISTS product_images (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         product_id BIGINT NOT NULL,
         image_url VARCHAR(255) NOT NULL,
         is_primary BOOLEAN DEFAULT FALSE,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
       );`,
            `CREATE TABLE IF NOT EXISTS stock_history (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         product_id BIGINT NOT NULL,
         quantity_added INT NOT NULL,
         added_by BIGINT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         CONSTRAINT fk_history_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
       );`,
            `CREATE TABLE IF NOT EXISTS idempotency_log (
         event_id VARCHAR(255) PRIMARY KEY,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );`,
            `CREATE TABLE IF NOT EXISTS reviews (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         product_id BIGINT NOT NULL,
         user_id BIGINT,
         user_name VARCHAR(100),
         rating INT,
         comment TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
       );`,
            `CREATE TABLE IF NOT EXISTS wishlist (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         user_id BIGINT NOT NULL,
         product_id BIGINT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         UNIQUE KEY unique_wishlist (user_id, product_id),
         CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
       );`
        ],
        inventory_db: [
            // Removed FK to products (cross-db)
            `CREATE TABLE IF NOT EXISTS inventory (
         product_id BIGINT PRIMARY KEY,
         available_qty INT NOT NULL,
         reserved_qty INT NOT NULL DEFAULT 0
       );`
        ],
        order_db: [
            // Removed FK to users (cross-db)
            `CREATE TABLE IF NOT EXISTS orders (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         user_id BIGINT NOT NULL,
         total_amount DECIMAL(10,2) NOT NULL,
         status INT NOT NULL DEFAULT 1 COMMENT '1=Placed, 2=Processing, 3=Shipped, 4=Delivered, 5=Cancelled',
         tracking_status VARCHAR(50) DEFAULT 'placed',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         shipping_name VARCHAR(255),
         shipping_address VARCHAR(255),
         shipping_city VARCHAR(100),
         shipping_zip VARCHAR(20),
         shipping_country VARCHAR(100),
         delivery_date DATE,
         payment_method VARCHAR(50),
         payment_status VARCHAR(50) DEFAULT 'PENDING'
       );`,
            // Removed FK to orders (same-db OK) and products (cross-db NO)
            `CREATE TABLE IF NOT EXISTS order_items (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          order_id BIGINT NOT NULL,
          product_id BIGINT NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          feedback TEXT,
          rating INT,
          CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id)
        );`
            // Note: Kept fk_items_order because both are in order_db
        ]
    };

    try {
        for (const [dbName, queries] of Object.entries(tables)) {
            console.log(`\n--- Setting up ${dbName} ---`);
            // Connect specifically to this database
            const connection = await mysql.createConnection({ ...config, database: dbName });

            // We process queries. For CREATE TABLE, users often want a clean start or migration
            // Since this is a setup script, we will be aggressive and DROP existing tables to ensure schema match
            // Note: Reversing order for tables with FKs
            if (dbName === 'auth_db') {
                await connection.query('DROP TABLE IF EXISTS user_logins');
                await connection.query('DROP TABLE IF EXISTS users');
            }
            if (dbName === 'order_db') {
                await connection.query('DROP TABLE IF EXISTS order_items');
                await connection.query('DROP TABLE IF EXISTS orders');
            }
            if (dbName === 'product_db') {
                await connection.query('SET FOREIGN_KEY_CHECKS = 0');
                await connection.query('DROP TABLE IF EXISTS wishlist');
                await connection.query('DROP TABLE IF EXISTS reviews');
                await connection.query('DROP TABLE IF EXISTS stock_history');
                await connection.query('DROP TABLE IF EXISTS product_images');
                await connection.query('DROP TABLE IF EXISTS idempotency_log');
                await connection.query('DROP TABLE IF EXISTS products');
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');
            }
            // For others just naive drop if needed, but IF NOT EXISTS handles creation

            for (const query of queries) {
                await connection.query(query);
                console.log(`Executed table creation in ${dbName}`);
            }
            await connection.end();
        }
        console.log('\nAll tables created successfully.');
    } catch (err) {
        console.error('Error creating tables:', err.message);
    }
}

createTables();
