const { authRequired, adminOnly } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('authRequired', () => {
        it('should return 401 if no token', () => {
            authRequired(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing token' });
        });

        it('should return 401 if invalid token', () => {
            req.headers['authorization'] = 'Bearer invalid';
            jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });

            authRequired(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should call next if valid token', () => {
            req.headers['authorization'] = 'Bearer valid';
            jwt.verify.mockReturnValue({ userId: 1 });

            authRequired(req, res, next);
            expect(req.user).toEqual({ userId: 1 });
            expect(next).toHaveBeenCalled();
        });
    });

    describe('adminOnly', () => {
        it('should return 403 if no user', () => {
            adminOnly(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 403 if role is USER', () => {
            req.user = { role: 'USER' };
            adminOnly(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should call next if role is ADMIN', () => {
            req.user = { role: 'ADMIN' };
            adminOnly(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
