const { getInventory, reserveStock, releaseStock } = require('../inventoryController');
const db = require('../db');

jest.mock('../db');

describe('Inventory Controller', () => {
    let req, res, mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockConnection = {
            beginTransaction: jest.fn(),
            query: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };
        db.getConnection.mockResolvedValue(mockConnection);
    });

    describe('getInventory', () => {
        it('should return 404 if not found', async () => {
            req.params.productId = 1;
            db.query.mockResolvedValueOnce([[]]);
            await getInventory(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return quantity', async () => {
            req.params.productId = 1;
            db.query.mockResolvedValueOnce([[{ available_qty: 10 }]]);
            await getInventory(req, res);
            expect(res.json).toHaveBeenCalledWith({ available_qty: 10 });
        });
    });

    describe('reserveStock', () => {
        it('should return 400 for invalid input', async () => {
            req.body = { productId: 1, quantity: -5 };
            await reserveStock(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 via transaction rollback if product missing', async () => {
            req.body = { productId: 99, quantity: 1 };
            mockConnection.query.mockResolvedValueOnce([[]]); // Not found

            await reserveStock(req, res);
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 via rollback if insufficient stock', async () => {
            req.body = { productId: 1, quantity: 10 };
            mockConnection.query.mockResolvedValueOnce([[{ quantity: 5 }]]); // Only 5

            await reserveStock(req, res);
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should reserve stock successfully', async () => {
            req.body = { productId: 1, quantity: 5 };
            mockConnection.query.mockResolvedValueOnce([[{ quantity: 10 }]]); // Has 10
            mockConnection.query.mockResolvedValueOnce([]); // Update result

            await reserveStock(req, res);
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reserved' }));
        });
    });

    describe('releaseStock', () => {
        it('should release stock successfully', async () => {
            req.body = { productId: 1, quantity: 5 };
            mockConnection.query.mockResolvedValueOnce([]); // Update

            await releaseStock(req, res);
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Released' }));
        });
    });
});
