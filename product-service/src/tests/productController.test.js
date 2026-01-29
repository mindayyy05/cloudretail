const { listProducts, getProduct, createProduct } = require('../productController');
const db = require('../db');

jest.mock('../db');

describe('Product Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { query: {}, params: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('listProducts', () => {
        it('should return list of products', async () => {
            const mockProducts = [
                { id: 1, name: 'P1', quantity: 10 },
                { id: 2, name: 'P2', quantity: 0 }
            ];
            db.query.mockResolvedValueOnce([mockProducts]);

            await listProducts(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ id: 1, stock_status: 'in_stock' }),
                expect.objectContaining({ id: 2, stock_status: 'out_of_stock' })
            ]));
        });
    });

    describe('getProduct', () => {
        it('should return 404 if not found', async () => {
            req.params.id = 999;
            db.query.mockResolvedValueOnce([[]]); // Not found in products

            await getProduct(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return product details', async () => {
            req.params.id = 1;
            const product = { id: 1, name: 'P1', quantity: 5, image_url: 'img.jpg' };
            db.query.mockResolvedValueOnce([[product]]); // Product found
            db.query.mockResolvedValueOnce([[]]); // No additional images

            await getProduct(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1, stock_status: 'low_stock' }));
        });
    });

    describe('createProduct', () => {
        it('should return 400 for missing name/price', async () => {
            req.body = { name: 'P1' }; // No price
            await createProduct(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should create product successfully', async () => {
            req.body = { name: 'P1', price: 100, category: 'Tech' };
            db.query.mockResolvedValueOnce([{ insertId: 50 }]); // Insert success
            db.query.mockResolvedValueOnce([[{ id: 50, name: 'P1', price: 100 }]]); // Fetch back

            await createProduct(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 50 }));
        });
    });
});
