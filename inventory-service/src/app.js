// inventory-service/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getInventory, reserveStock, releaseStock } = require('./inventoryController');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/inventory/:productId', getInventory);
app.post('/api/v1/inventory/reserve', reserveStock);
app.post('/api/v1/inventory/release', releaseStock);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory-service' }));

module.exports = app;
