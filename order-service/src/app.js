// order-service/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { createOrder, getUserOrders, getOrderById, getAllOrders, updateOrderStatus, updateItemFeedback } = require('./orderController');
const logger = require('./logger');
const client = require('prom-client');

const app = express();

// Metrics Setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Request Logging Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.correlationId = correlationId; // Attach to request object for controllers
  res.setHeader('x-correlation-id', correlationId); // Return to client

  // logger.defaultMeta = { ...logger.defaultMeta, correlationId }; // winston context (simplified for this demo)

  // Console Log for "evidence" screenshot
  console.log(`[OrderService] [${correlationId}] Incoming Request: ${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use(express.json());

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('./cartController');
const auth = require('./middleware/auth');
const { authRequired, adminOnly } = require('./middleware/adminAuth');

// Cart Routes
app.get('/api/v1/cart', auth, getCart);
app.post('/api/v1/cart', auth, addToCart);
app.put('/api/v1/cart/item', auth, updateCartItem); // pass product_id in body
app.delete('/api/v1/cart/:product_id', auth, removeCartItem);
app.delete('/api/v1/cart', auth, clearCart);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

app.post('/api/v1/orders', auth, createOrder); // Auth optional? Plan said createOrder takes user from token, but previous code defaulted to 1. Let's make sure we use auth middleware if we want real user IDs.
app.get('/api/v1/orders', auth, getUserOrders);
app.get('/api/v1/orders/:orderId', auth, getOrderById);
app.put('/api/v1/orders/items/:orderItemId/feedback', auth, updateItemFeedback);

// Admin Routes
app.get('/api/v1/admin/orders', authRequired, adminOnly, getAllOrders);
app.put('/api/v1/admin/orders/:orderId/status', authRequired, adminOnly, updateOrderStatus);

module.exports = app;
