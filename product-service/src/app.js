// product-service/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// NOTE: auth middleware disabled for demo to avoid "Invalid token" issues
const { authRequired, detectUser } = require('./middleware/auth');
const {
  listProducts, getProduct, createProduct, getSuggestions,
  getReviews, addReview,
  getWishlist, addToWishlist, removeFromWishlist,
  updateStock, reduceStockBatch, handleEvent,
  getExchangeRates
} = require('./productController');

const app = express();

app.use(cors());
app.use(express.json());

// Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  console.log(`[ProductService] [${correlationId}] Request: ${req.method} ${req.path}`);
  next();
});

/* ---------- Static serving for uploaded images ---------- */

const uploadsPath = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Expose /uploads so frontend can load images
app.use('/uploads', express.static(uploadsPath));

/* ---------- Multer setup for image uploads ---------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

/* ---------- Routes ---------- */

// Image upload endpoint for products
// DEMO: left unauthenticated to avoid JWT validation problems
// URL: POST http://localhost:4002/api/v1/products/upload-image
// Body: multipart/form-data, field name: "image"
app.post('/api/v1/products/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  return res.status(201).json({ imageUrl: publicUrl });
});

// Product CRUD – ALSO left unauthenticated for now in local demo
app.get('/api/v1/products/rates', getExchangeRates);
app.get('/api/v1/products', detectUser, listProducts);
app.get('/api/v1/products/suggestions', getSuggestions);
app.get('/api/v1/products/:id', detectUser, getProduct);
app.get('/api/v1/products/:id/reviews', getReviews);
app.post('/api/v1/products/:id/reviews', authRequired, addReview);

// Wishlist
app.get('/api/v1/wishlist', authRequired, getWishlist);
app.post('/api/v1/wishlist', authRequired, addToWishlist);
app.delete('/api/v1/wishlist/:productId', authRequired, removeFromWishlist);

// Product CRUD – ALSO left unauthenticated for now in local demo
app.post('/api/v1/products', createProduct);
app.post('/api/v1/products/:id/stock', detectUser, updateStock);
app.post('/api/v1/products/:id/stock', detectUser, updateStock);
app.post('/api/v1/products/batch-stock', reduceStockBatch);
app.put('/api/v1/products/:id/price', detectUser, require('./productController').updateProduct); // New Endpoint


// Event Handler (AWS EventBridge Target)
app.post('/events', handleEvent);

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'product-service' })
);

module.exports = app;
