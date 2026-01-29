// order-service/src/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

// First middleware: verify JWT and extract user
exports.authRequired = (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Second middleware: check if user is admin
exports.adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin only' });
    }
    next();
};
