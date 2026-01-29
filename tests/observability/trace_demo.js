const _fetch = fetch;
const ORDER_SERVICE_URL = 'http://localhost:4004/api/v1/orders';

async function generateTrace() {
    console.log('--- Generating Distributed Trace ---');

    // Custom Trace ID to look for in logs
    const traceId = `trace-demo-${Date.now()}`;
    console.log(`Injecting Correlation ID: ${traceId}`);

    const payload = {
        items: [{ product_id: 1, quantity: 1, price: 100 }],
        shipping_name: "Trace Tester",
        shipping_address: "123 Observability Lane",
        shipping_city: "Log City",
        shipping_zip: "90210",
        shipping_country: "Cloud",
        delivery_date: "2023-12-25",
        payment_method: "credit_card"
    };

    try {
        // Need to Mock Auth Header? order-service requires it.
        // We'll bypass or assuming we have a valid token?
        // Wait, order-service `auth` middleware checks for `req.headers.authorization`.
        // I will use a dummy token if the middleware allows, or I need to login first.
        // Actually, for the "Monitoring Demo", let's just use the `trace-demo` script to hit the HEALTH check if that logs?
        // Use `createOrder` to trigger event flow.

        // I'll assume the same fake token from previous tests works if I defined it, 
        // OR I will register a user quickly.

        const testEmail = `trace_${Date.now()}@test.com`;

        // Register User
        const authRes = await _fetch('http://localhost:4001/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Trace', last_name: 'User', email: testEmail, password: 'password', role: 'USER'
            })
        });

        let token;
        if (authRes.status === 201) {
            // Login to get token
            const loginRes = await _fetch('http://localhost:4001/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, password: 'password' })
            });
            const data = await loginRes.json();
            token = data.token;
        } else {
            // Maybe already exists? Try login
            const loginRes = await _fetch('http://localhost:4001/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, password: 'password' })
            });
            if (!loginRes.ok) {
                console.log('Login Failed:', await loginRes.text());
            } else {
                const data = await loginRes.json();
                token = data.token;
            }
        }

        if (!token) {
            console.log('Failed to get auth token. Skipping Order Creation Trace.');
            return;
        }

        // Get a valid product
        const prodRes = await _fetch('http://localhost:4002/api/v1/products', {
            headers: { 'Authorization': `Bearer ${token}` } // Optional depending on middleware
        });
        const products = await prodRes.json();
        if (!products.length) {
            console.log('No products found to order. Seed DB first.');
            return;
        }
        const productId = products[0].id;
        const price = products[0].price;
        console.log(`Ordering Product ID: ${productId} at $${price}`);

        const res = await _fetch(ORDER_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-correlation-id': traceId,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: [{ product_id: productId, quantity: 1, price: price }],
                shipping_name: "Trace Tester",
                shipping_address: "123 Observability Lane",
                shipping_city: "Log City",
                shipping_zip: "90210",
                shipping_country: "Cloud",
                delivery_date: "2023-12-25",
                payment_method: "credit_card"
            })
        });

        console.log(`Order Creation Status: ${res.status}`);
        if (res.status === 201) {
            console.log('✅ Order Created. Check logs for ID:', traceId);
        } else {
            console.log('❌ Order Failed:', await res.text());
        }

    } catch (e) {
        console.error('Trace Generation Error:', e.message);
    }
}

generateTrace();
