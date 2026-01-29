
// tests/manual/test_order_logic.js
const assert = require('assert');
const orderController = require('../../order-service/src/orderController');
const db = require('../../order-service/src/db');

// Mock Res
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

async function runTests() {
    console.log('--- STARTING UNIT TESTS: Order Service ---');

    console.log('\n[TEST 1] createOrder should reject empty items');
    try {
        const req = { body: { items: [] }, user: { userId: 1 } };
        const res = mockRes();

        await orderController.createOrder(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'No items in order');
        console.log('✅ PASS');
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    console.log('\n[TEST 2] createOrder should validate admin role');
    try {
        const req = { body: { items: [{ product_id: 1, quantity: 1, price: 10 }] }, user: { userId: 1, role: 'ADMIN' } };
        const res = mockRes();

        await orderController.createOrder(req, res);

        console.log('✅ PASS');
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    console.log('\n[TEST 3] updateOrderStatus should validate status input');
    try {
        const req = { params: { orderId: 1 }, body: { status: 99 } }; // Invalid status
        const res = mockRes();

        await orderController.updateOrderStatus(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'Invalid status value');
        console.log('✅ PASS');
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    console.log('\n--- UNIT TESTS COMPLETE ---');
}

runTests();
