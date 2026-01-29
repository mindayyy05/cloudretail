const mysql = require('mysql2/promise');
require('dotenv').config();

const AUTH_URL = 'http://localhost:4001/api/v1/auth';
const ORDER_URL = 'http://localhost:4004/api/v1/orders';
const PRODUCT_URL = 'http://localhost:4002/api/v1/products';

const TEST_EMAIL = `checkout_test_${Date.now()}@example.com`;
const TEST_PASS = 'password123';

async function verifyCheckout() {
    let conn;
    try {
        console.log('Connecting to DB...');
        conn = await mysql.createConnection({
            host: process.env.DB_HOST_MAIN || 'localhost',
            user: process.env.DB_USER_MAIN || 'root',
            password: process.env.DB_PASS_MAIN || 'your_password',
            database: process.env.DB_NAME_MAIN || 'cloudretail'
        });

        console.log('0. Registering User...');
        const regRes = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: 'Checkout', last_name: 'Tester', email: TEST_EMAIL, password: TEST_PASS })
        });

        const loginRes = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS })
        });
        const { token } = await loginRes.json();
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        console.log('0.5 Creating Product...');
        const prodRes = await fetch(PRODUCT_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Checkout Item', price: 50, category: 'Test', stock: 100 })
        });
        const product = await prodRes.json();
        const productId = product.id;
        console.log('Product created:', productId);

        const [rows] = await conn.query('SELECT * FROM products WHERE id = ?', [productId]);
        console.log('DB check product:', rows.length > 0 ? 'FOUND' : 'NOT FOUND');

        console.log('1. Creating Order with Checkout Info...');
        const payload = {
            items: [{ product_id: productId, quantity: 2, price: 50 }],
            shipping_name: 'John Doe',
            shipping_address: '123 Main St',
            shipping_city: 'New York',
            shipping_zip: '10001',
            shipping_country: 'USA',
            delivery_date: '2025-01-01',
            payment_method: 'CREDIT_CARD'
        };

        const res = await fetch(ORDER_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (res.status === 201) {
            const data = await res.json();
            console.log('PASS: Order created. ID:', data.id);
        } else {
            console.error('FAIL: Create order', await res.text());
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        if (conn) conn.end();
    }
}

verifyCheckout();
