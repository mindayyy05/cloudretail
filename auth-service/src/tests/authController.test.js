const { register, login } = require('../authController');
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../db');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('register', () => {
        it('should return 400 if fields are missing', async () => {
            req.body = { email: 'test@test.com' }; // Missing others
            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing fields' }));
        });

        it('should return 409 if email already exists', async () => {
            req.body = { first_name: 'Test', last_name: 'User', email: 'exist@test.com', password: 'password' };
            db.query.mockResolvedValueOnce([[{ id: 1 }]]); // Existing user found

            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('should create user successfully', async () => {
            req.body = { first_name: 'New', last_name: 'User', email: 'new@test.com', password: 'password' };
            db.query.mockResolvedValueOnce([[]]); // No existing user
            bcrypt.hash.mockResolvedValue('hashed_password');
            db.query.mockResolvedValueOnce([{ insertId: 10 }]); // Insert success

            await register(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
        });
    });

    describe('login', () => {
        it('should return 401 if user not found', async () => {
            req.body = { email: 'unknown@test.com', password: 'pass' };
            db.query.mockResolvedValueOnce([[]]); // Users empty

            await login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not registered' }));
        });

        it('should return 401 if password mismatch', async () => {
            req.body = { email: 'valid@test.com', password: 'wrong' };
            db.query.mockResolvedValueOnce([[{ id: 1, password_hash: 'hash' }]]);
            bcrypt.compare.mockResolvedValue(false);

            await login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return token on success', async () => {
            req.body = { email: 'valid@test.com', password: 'correct' };
            const user = { id: 1, first_name: 'A', last_name: 'B', email: 'e', role: 'USER', password_hash: 'hash' };
            db.query.mockResolvedValueOnce([[user]]);
            bcrypt.compare.mockResolvedValue(true);
            db.query.mockResolvedValueOnce([]); // Log login
            jwt.sign.mockReturnValue('fake_token');

            await login(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fake_token' }));
        });
    });
});
