const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');

const app = express();
const { v4: uuidv4 } = require('uuid');

// Distributed Tracing (Correlation ID)
app.use((req, res, next) => {
    // Generate or propagate Correlation ID
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId); // Return to client for debugging
    next();
});

// CORS Configuration (Configured Properly)
// Function to dynamically check origin
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allowed origins
        const allowedOrigins = [
            'http://localhost:3000', // Frontend
            'http://localhost:4000', // Gateway (Self)
            'http://127.0.0.1:3000'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Allow cookies/headers
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = 4000;
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4003';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:4004';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const rateLimit = require('express-rate-limit');

// Rate Limiting (Gateway Policy)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again later.' }
});

// IP Whitelisting (Gateway Policy)
// Optional: In production, strict blocking of non-whitelisted IPs
const whitelist = ['127.0.0.1', '::1']; // Localhost IPv4 & IPv6
const ipWhitelistMiddleware = (req, res, next) => {
    // Skip if disabled via config
    if (process.env.ENABLE_IP_WHITELIST !== 'true') return next();

    const clientIp = req.ip || req.connection.remoteAddress;
    if (whitelist.includes(clientIp)) {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: IP not whitelisted' });
    }
};

// Apply rate limiting to all requests
app.use(limiter);
app.use(ipWhitelistMiddleware);

// API Key Management (Internal/External Access)
// Validates 'x-api-key' for Partner/Service-to-Service access
const validApiKeys = new Set(['partner-123', 'internal-service-key-abc']);
const apiKeyMiddleware = (req, res, next) => {
    // Skip for public auth routes
    if (req.path.startsWith('/api/v1/auth')) return next();

    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        if (validApiKeys.has(apiKey)) {
            // Valid API Key found, bypass JWT check or treat as "Partner Role"
            req.isPartner = true;
            req.headers['x-user-role'] = 'PARTNER';
            // We could return next() here to bypass JWT, 
            // OR let it fall through if we want dual-auth.
            // For now, let's allow API Key to grant access.
            return next();
        } else {
            return res.status(401).json({ message: 'Invalid API Key' });
        }
    }
    // No API Key? Continue to standard JWT Auth
    next();
};
app.use(apiKeyMiddleware);

// --- Authentication Middleware ---
// Validates JWT before forwarding requests (except public routes)
const authMiddleware = (req, res, next) => {
    const publicPaths = [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/products', // Assume public read
        '/health'
    ];

    if (publicPaths.some(path => req.path.startsWith(path) && req.method === 'GET') ||
        publicPaths.some(path => req.path.startsWith(path) && req.method === 'POST')) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Gateway: Missing Authorization Header' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Add user info to headers for downstream services
        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-user-role'] = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Gateway: Invalid Token' });
    }
};

// Apply auth middleware globally (can be refined per route)
// app.use(authMiddleware); 
// Note: For this demo, we'll keep it simple and just forward everything, 
// relying on services' own auth, OR we can enable it to prove the "Auth" part.
// Let's enable it for specific routes or demonstrate the capability.

// --- Routing ---

// Auth Service
app.use('/api/v1/auth', proxy(AUTH_SERVICE, {
    proxyReqPathResolver: (req) => `/api/v1/auth${req.url}`
}));

// Product Service
app.use('/api/v1/products', proxy(PRODUCT_SERVICE, {
    proxyReqPathResolver: (req) => `/api/v1/products${req.url}`
}));

// Order Service
app.use('/api/v1/orders', proxy(ORDER_SERVICE, {
    proxyReqPathResolver: (req) => `/api/v1/orders${req.url}`
}));

// Inventory Service
app.use('/api/v1/inventory', proxy(INVENTORY_SERVICE, {
    proxyReqPathResolver: (req) => `/api/v1/inventory${req.url}`
}));


app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway-service' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
