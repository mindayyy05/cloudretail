
// tests/manual/test_product_logic.js
const assert = require('assert');
// mocked manually
const productController = require('../../product-service/src/productController');
const db = require('../../product-service/src/db');

// Mock Request and Response
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

// Test Suite
async function runTests() {
    console.log('--- STARTING UNIT TESTS: Product Service ---');

    // TEST 1: listProducts should return products
    console.log('\n[TEST 1] listProducts should return products');
    try {
        const req = { query: {} };
        const res = mockRes();

        // Mock DB Query for listProducts
        // Expected signature: db.query(sql, params)
        const originalQuery = db.query;
        db.query = async (sql, params) => {
            // Return mock rows
            return [[
                { id: 1, name: 'Test Product', price: 100, quantity: 10 }
            ]];
        };

        await productController.listProducts(req, res);

        // Assertions
        assert.strictEqual(Array.isArray(res.body), true, 'Body should be an array');
        assert.strictEqual(res.body[0].name, 'Test Product', 'Product name should match');
        assert.strictEqual(res.body[0].in_stock, true, 'in_stock should be calculated as true');

        console.log('✅ PASS');

        // Restore db
        db.query = originalQuery;
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    // TEST 2: Validation for createProduct
    console.log('\n[TEST 2] createProduct validation');
    try {
        const req = { body: { name: '', price: 100 } }; // Missing name
        const res = mockRes();

        await productController.createProduct(req, res);

        assert.strictEqual(res.statusCode, 400, 'Should return 400 for missing name');
        console.log('✅ PASS');
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    // TEST 3: Validation for getSuggestions
    console.log('\n[TEST 3] getSuggestions validation');
    try {
        const req = { query: { search: 'a' } }; // Too short
        const res = mockRes();

        await productController.getSuggestions(req, res);

        assert.deepStrictEqual(res.body, [], 'Should return empty array for short query');
        console.log('✅ PASS');
    } catch (e) {
        console.error('❌ FAIL', e);
    }

    console.log('\n--- UNIT TESTS COMPLETE ---');
}

runTests();
