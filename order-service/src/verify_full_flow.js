
const AUTH_URL = 'http://localhost:4001/api/v1/auth';
const ORDER_URL = 'http://localhost:4004/api/v1/orders';

const TEST_EMAIL = `fullflow_${Date.now()}@example.com`;
const TEST_PASS = 'password123';

async function run() {
    try {
        // 1. Register/Login
        console.log('1. Registering...');
        await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: 'Full', last_name: 'Flow', email: TEST_EMAIL, password: TEST_PASS })
        });

        const loginRes = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS })
        });
        const { token } = await loginRes.json();
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. Create Order with Details
        console.log('2. Creating Order with Details...');
        const payload = {
            items: [{ product_id: 3, quantity: 2, price: 50.00 }], // Valid product ID 3
            shipping_name: 'Sherlock Holmes',
            shipping_address: '221B Baker St',
            shipping_city: 'London',
            shipping_zip: 'NW1 6XE',
            shipping_country: 'UK',
            delivery_date: '2025-12-25',
            payment_method: 'card'
        };

        const createRes = await fetch(ORDER_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (createRes.status !== 201) {
            const txt = await createRes.text();
            console.log('Order creation failed:', txt);
            // If product FK fails, we might need to resort to just checking the code or using an existing product ID.
            // But let's see.
            return;
        }
        const orderData = await createRes.json();
        console.log('Order Created, ID:', orderData.id);

        // 3. Fetch Orders
        console.log('3. Fetching Orders...');
        const ordersRes = await fetch(ORDER_URL, { headers });
        const orders = await ordersRes.json();

        const myOrder = orders.find(o => o.id === orderData.id);
        if (!myOrder) throw new Error('Order not found in list');

        console.log('Fetched Order:', JSON.stringify(myOrder, null, 2));

        if (myOrder.shipping_name !== 'Sherlock Holmes') {
            throw new Error('Shipping name mismatch: ' + myOrder.shipping_name);
        }
        if (myOrder.shipping_city !== 'London') {
            throw new Error('Shipping city mismatch');
        }

        console.log('SUCCESS: Order details saved and retrieved correctly.');

    } catch (err) {
        console.error('FAILED:', err);
    }
}

run();
