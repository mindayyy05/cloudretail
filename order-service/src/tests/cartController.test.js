const { getCart, addToCart, removeCartItem } = require('../cartController');
const db = require('../db');

jest.mock('../db');

describe('Cart Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { userId: 1 }, body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getCart', () => {
        it('should return empty array if no items', async () => {
            db.query.mockResolvedValueOnce([[]]);
            await getCart(req, res);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return items', async () => {
            const items = [{ id: 1, product_id: 10, quantity: 2 }];
            db.query.mockResolvedValueOnce([items]);
            await getCart(req, res);
            expect(res.json).toHaveBeenCalledWith(items);
        });
    });

    describe('addToCart', () => {
        it('should return 400 if product_id is missing', async () => {
            await addToCart(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should insert new item', async () => {
            req.body = { product_id: 10, quantity: 1 };
            db.query.mockResolvedValueOnce([[]]); // Not existing
            db.query.mockResolvedValueOnce([{ insertId: 5 }]); // Insert

            await addToCart(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Item added' }));
        });

        it('should update existing item', async () => {
            req.body = { product_id: 10, quantity: 1 };
            db.query.mockResolvedValueOnce([[{ id: 5, quantity: 2 }]]); // Existing
            db.query.mockResolvedValueOnce([]); // Update

            await addToCart(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cart updated', quantity: 3 }));
        });
    });

    describe('removeCartItem', () => {
        it('should remove item', async () => {
            req.params.product_id = 10;
            db.query.mockResolvedValueOnce([]);
            await removeCartItem(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Item removed' }));
        });
    });
});
