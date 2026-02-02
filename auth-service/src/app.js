// auth-service/src/app.js
require('dotenv').config();
const express = require('express');
const AWSXRay = require('aws-xray-sdk');
const cors = require('cors');
const helmet = require('helmet');
const client = require('prom-client');

// Capture outgoing HTTP calls
AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureHTTPsGlobal(require('https'));
const { register, login, generateOTP, verifyOTP } = require('./authController');

const app = express();

// AWS X-Ray - Start segment (MUST BE FIRST)
app.use(AWSXRay.express.openSegment('auth-service'));

// Security Hardening
app.use(helmet());

// Metrics Setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Correlation ID Middleware (Distributed Tracing)
app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    console.log(`[AuthService] [${correlationId}] Request: ${req.method} ${req.path}`);
    next();
});

app.use(cors());
app.use(express.json());

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
});

app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);
app.post('/api/v1/auth/mfa/generate', generateOTP);
app.post('/api/v1/auth/mfa/verify', verifyOTP);

// User Management Routes
// Note: In a real app, you should add an adminAuth middleware here
app.get('/api/v1/users', require('./authController').listUsers);
app.delete('/api/v1/users/:id', require('./authController').deleteUser);
app.put('/api/v1/users/:id', require('./authController').updateUser);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// AWS X-Ray - End segment (MUST BE LAST)
app.use(AWSXRay.express.closeSegment());

module.exports = app;
