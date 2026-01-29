const db = require('./db');


async function seed() {
    console.log('Seeding Product Service...');
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Products
        const products = [
            { name: 'Wireless Headphones', description: 'Noise cancelling', price: 99.99, category: 'Electronics', quantity: 50 },
            { name: 'Running Shoes', description: 'Comfortable', price: 79.99, category: 'Sports', quantity: 100 },
            { name: 'Coffee Maker', description: 'Automatic', price: 49.99, category: 'Home', quantity: 30 }
        ];

        for (const p of products) {
            await connection.query(
                'INSERT INTO products (name, description, price, category, quantity) VALUES (?, ?, ?, ?, ?)',
                [p.name, p.description, p.price, p.category, p.quantity]
            );
        }
        console.log(`Inserted ${products.length} products`);

        await connection.commit();
        console.log('Product Seeding Completed.');
    } catch (err) {
        await connection.rollback();
        console.error('Seeding failed:', err);
    } finally {
        connection.release();
        process.exit();
    }
}

seed();
