import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 5 }, // Low concurrency for functional verification
    ],
};

const BASE_URL = 'http://localhost:4000/api/v1';

export default function () {

    group('Authentication Flow', function () {
        // 1. Login
        const loginPayload = JSON.stringify({
            email: 'test@example.com',
            password: 'password',
        });

        const params = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);

        check(loginRes, {
            'login successful': (r) => r.status === 200,
            'has token': (r) => r.json('token') !== undefined,
        });

        const token = loginRes.json('token');
        const authHeaders = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            group('Product Flow', function () {
                // 2. List Products
                const productsRes = http.get(`${BASE_URL}/products`, authHeaders);
                check(productsRes, {
                    'products retrieved': (r) => r.status === 200,
                });

                // 3. Search Products (Simulated via list for now or explicit search endpoint if available)
                // Assuming list returns array, we pick one ID
                const products = productsRes.json('products'); // Adjust structure based on API
                if (products && products.length > 0) {
                    const productId = products[0].id;

                    // 4. Product Details
                    const detailRes = http.get(`${BASE_URL}/products/${productId}`, authHeaders);
                    check(detailRes, {
                        'product detail retrieved': (r) => r.status === 200,
                        'correct product id': (r) => r.json('id') === productId,
                    });
                }
            });

            group('Order Flow', function () {
                // 5. List Orders (Private functionality)
                const ordersRes = http.get(`${BASE_URL}/orders`, authHeaders);
                check(ordersRes, {
                    'orders retrieved': (r) => r.status === 200,
                });
            });
        }
    });

    sleep(1);
}
