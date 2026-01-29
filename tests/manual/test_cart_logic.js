
// tests/manual/test_cart_logic.js
const assert = require('assert');
const cartController = require('../../order-service/src/cartController');
const db = require('../../order-service/src/db');

// Mock Request/Response
const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
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
    console.log('--- STARTING UNIT TESTS: Cart Service ---');

    console.log('\n[TEST 1] addToCart should require product_id');
    try {
        const req = { body: { quantity: 1 }, user: { userId: 123 } };
        const res = mockRes();

        await cartController.addToCart(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'Product ID required');
        console.log('✅ PASS');
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    console.log('\n[TEST 2] addToCart should insert new item if not exists (mocked DB)');
    try {
        const req = { body: { product_id: 99, quantity: 2 }, user: { userId: 123 } };
        const res = mockRes();

        const originalQuery = db.query;
        let insertCalled = false;

        db.query = async (sql, params) => {
            if (sql.includes('SELECT')) {
                return [[]]; // Not found
            }
            if (sql.includes('INSERT')) {
                insertCalled = true;
                return [{}];
            }
            return [{}];
        };

        await cartController.addToCart(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(insertCalled, true, 'Should call INSERT');
        console.log('✅ PASS');

        db.query = originalQuery;
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    console.log('\n--- UNIT TESTS COMPLETE ---');
}

runTests();
