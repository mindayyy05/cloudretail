// inventory-service/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const client = require('prom-client');
const { getInventory, reserveStock, releaseStock } = require('./inventoryController');

const app = express();

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
    console.log(`[InventoryService] [${correlationId}] Request: ${req.method} ${req.path}`);
    next();
});

app.use(cors());
app.use(express.json());

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
});

app.get('/api/v1/inventory/:productId', getInventory);
app.post('/api/v1/inventory/reserve', reserveStock);
app.post('/api/v1/inventory/release', releaseStock);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory-service' }));

module.exports = app;
