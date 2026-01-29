
const AUTH_URL = 'http://localhost:4001/api/v1/auth';
const ORDER_URL = 'http://localhost:4004/api/v1/orders';

const TEST_EMAIL = `history_test_${Date.now()}@example.com`;
const TEST_PASS = 'password123';

async function verifyOrderHistory() {
    try {
        console.log('0. Registering & Logging In...');
        await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: 'History', last_name: 'Tester', email: TEST_EMAIL, password: TEST_PASS })
        });

        const loginRes = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS })
        });
        const { token } = await loginRes.json();
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        console.log('1. Fetching Orders...');
        const res = await fetch(ORDER_URL, { headers });
        const data = await res.json();

        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (!Array.isArray(data)) {
            throw new Error('Response is not an array');
        }

        console.log('Orders Count:', data.length);

        // ... (Skipping creation for now to just debug the generic get)

    } catch (err) {
        console.error('Test failed:', err);
    }
}

verifyOrderHistory();
