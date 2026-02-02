// product-service/src/productController.js
const db = require('./db');
const redis = require('redis');

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis for Product Caching');
})();

// GET /api/v1/products
// --- MOCK EVENT PUBLISHER (Internal) ---
async function publishProductEvent(detailType, detail) {
  // Simulating sending to EventBridge or SNS
  console.log(`[ProductService] Publishing Event ${detailType}:`, JSON.stringify(detail));
  // In a real app, use AWS SDK v3 EventBridgeClient here
}

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (!price) return res.status(400).json({ message: 'Price is required for this specific update' });

    // Update DB
    await db.query('UPDATE products SET price = ? WHERE id = ?', [price, id]);

    // Invalidate cache
    await redisClient.del(`product:${id}`);
    await redisClient.del('products:list:*'); // Simple broad invalidation for lists

    // Publish Event
    await publishProductEvent('ProductPriceUpdated', { productId: id, newPrice: price, timestamp: new Date().toISOString() });

    res.json({ message: 'Product price updated and event published' });
  } catch (err) {
    console.error('updateProduct error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const { search, category, sort, min_price, max_price } = req.query;
    const userId = req.user ? req.user.userId : null;

    // Create a cache key based on query params
    const cacheKey = `products:list:${JSON.stringify(req.query)}:${userId || 'anon'}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('[ProductService] Returning cached product list');
      return res.json(JSON.parse(cachedData));
    }

    let sql = `SELECT p.id, p.name, p.description, p.price, p.category, p.brand, p.image_url, p.created_at,
               p.quantity,
               (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
               (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count`;

    if (userId) {
      sql += `, (SELECT COUNT(*) FROM wishlist WHERE user_id = ? AND product_id = p.id) > 0 as is_wishlisted`;
    } else {
      sql += `, 0 as is_wishlisted`;
    }

    sql += ` FROM products p
             WHERE 1=1`;
    const params = [];
    if (userId) params.push(userId);

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (min_price) {
      sql += ' AND p.price >= ?';
      params.push(Number(min_price));
    }

    if (max_price) {
      sql += ' AND p.price <= ?';
      params.push(Number(max_price));
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY p.price DESC';
    } else if (sort === 'name_asc') {
      sql += ' ORDER BY p.name ASC';
    } else if (sort === 'name_desc') {
      sql += ' ORDER BY p.name DESC';
    } else {
      sql += ' ORDER BY p.created_at DESC';
    }

    const [rows] = await db.query(sql, params);

    // Add stock status to each product
    const productsWithStock = rows.map(p => ({
      ...p,
      in_stock: p.quantity > 0,
      stock_status: p.quantity === 0 ? 'out_of_stock' : p.quantity <= 5 ? 'low_stock' : 'in_stock'
    }));

    // Cache for 2 minutes
    await redisClient.set(cacheKey, JSON.stringify(productsWithStock), { EX: 120 });

    res.json(productsWithStock);
  } catch (err) {
    console.error('listProducts error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/v1/products/:id
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;

    const cacheKey = `product:${id}:${userId || 'anon'}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[ProductService] Returning cached product ${id}`);
      return res.json(JSON.parse(cachedData));
    }

    let sql = `SELECT p.id, p.name, p.description, p.price, p.category, p.brand, p.image_url, p.created_at,
               p.quantity,
               (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
               (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count`;

    if (userId) {
      sql += `, (SELECT COUNT(*) FROM wishlist WHERE user_id = ? AND product_id = p.id) > 0 as is_wishlisted`;
    } else {
      sql += `, 0 as is_wishlisted`;
    }

    sql += ` FROM products p
             WHERE p.id = ?`;

    const params = userId ? [userId, id] : [id];
    const [rows] = await db.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    const product = rows[0];
    product.in_stock = product.quantity > 0;
    product.stock_status = product.quantity === 0 ? 'out_of_stock' : product.quantity <= 5 ? 'low_stock' : 'in_stock';

    // Fetch additional images
    try {
      const [images] = await db.query(
        'SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, created_at ASC',
        [id]
      );
      product.images = images.length > 0 ? images : [{ id: 0, image_url: product.image_url, is_primary: true }];
    } catch (imgErr) {
      console.error('Error fetching product images', imgErr);
      product.images = [{ id: 0, image_url: product.image_url, is_primary: true }];
    }

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(product), { EX: 300 });

    res.json(product);
  } catch (err) {
    console.error('getProduct error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/v1/products
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image_url, brand, quantity, additionalImages } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price required' });
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber)) {
      return res.status(400).json({ message: 'Invalid price' });
    }

    // Insert into products table
    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category, brand, image_url, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description || '', priceNumber, category || null, brand || null, image_url || null, quantity || 0]
    );

    const newId = result.insertId;

    // Handle additional images
    const imagesToInsert = [];
    if (image_url) {
      imagesToInsert.push([newId, image_url, true]);
    }
    if (additionalImages && Array.isArray(additionalImages)) {
      additionalImages.forEach(img => {
        if (img !== image_url) {
          imagesToInsert.push([newId, img, false]);
        }
      });
    }

    if (imagesToInsert.length > 0) {
      try {
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?',
          [imagesToInsert]
        );
      } catch (imgErr) {
        console.error('Failed to insert additional images', imgErr);
        // We don't fail the whole product creation if images fail
      }
    }

    // Fetch the inserted row and return it
    const [rows] = await db.query(
      'SELECT id, name, description, price, category, brand, image_url, quantity, created_at FROM products WHERE id = ?',
      [newId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/v1/products/suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || search.length < 2) {
      return res.json([]);
    }

    const sql = `SELECT id, name, image_url 
                 FROM products 
                 WHERE name LIKE ? 
                 LIMIT 5`;
    const [rows] = await db.query(sql, [`%${search}%`]);
    res.json(rows);
  } catch (err) {
    console.error('getSuggestions error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/v1/products/:id/reviews
exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id, user_name, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getReviews error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/v1/products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, user_name } = req.body;
    const userId = req.user ? req.user.userId : 0;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating 1-5 required' });
    }

    await db.query(
      'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, userId, user_name || 'Anonymous', rating, comment || null]
    );

    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    console.error('addReview error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/v1/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sql = `SELECT p.id, p.name, p.price, p.image_url, p.brand, p.category
                 FROM wishlist w
                 JOIN products p ON w.product_id = p.id
                 WHERE w.user_id = ?
                 ORDER BY w.created_at DESC`;
    const [rows] = await db.query(sql, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('getWishlist error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/v1/wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId required' });

    await db.query(
      'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    console.error('addToWishlist error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/v1/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    await db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('removeFromWishlist error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/v1/products/:id/stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_added } = req.body;
    const userId = req.user ? req.user.userId : null; // Admin userId

    if (!quantity_added || isNaN(quantity_added)) {
      return res.status(400).json({ message: 'Valid quantity_added is required' });
    }

    const qty = Number(quantity_added);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Update product quantity
      await conn.query(
        'UPDATE products SET quantity = quantity + ? WHERE id = ?',
        [qty, id]
      );

      // Log to stock_history
      await conn.query(
        'INSERT INTO stock_history (product_id, quantity_added, added_by) VALUES (?, ?, ?)',
        [id, qty, userId || null]
      );

      await conn.commit();

      // Fetch updated product to return
      const [rows] = await conn.query('SELECT quantity FROM products WHERE id = ?', [id]);
      const newQty = rows[0] ? rows[0].quantity : 0;

      res.json({ message: 'Stock updated', product_id: id, added: qty, new_quantity: newQty });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('updateStock error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Internal helper for stock reduction
async function reduceStockInternal(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Invalid items array');
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of items) {
      const pid = item.productId;
      const qtyToReduce = item.quantity;

      // Skip invalid items
      if (!pid || !qtyToReduce || qtyToReduce <= 0) continue;

      // Check current stock
      const [rows] = await conn.query('SELECT quantity FROM products WHERE id = ? FOR UPDATE', [pid]);
      if (rows.length === 0) {
        throw new Error(`Product ${pid} not found`);
      }

      const currentQty = rows[0].quantity;
      if (currentQty < qtyToReduce) {
        throw new Error(`Insufficient stock for product ${pid}`);
      }

      // Update stock
      await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qtyToReduce, pid]);
    }

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// POST /api/v1/products/batch-stock
exports.reduceStockBatch = async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    await reduceStockInternal(items);
    res.json({ message: 'Stock reduced successfully' });
  } catch (err) {
    console.error('reduceStockBatch transaction error', err);
    // Return 400 for business logic errors (like stock), 500 for others
    if (err.message.includes('Insufficient stock') || err.message.includes('not found') || err.message.includes('Invalid items')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Internal server error during stock reduction' });
  }
};

// POST /events (AWS EventBridge Target)
// POST /events (AWS EventBridge Target)
exports.handleEvent = async (req, res) => {
  try {
    const event = req.body;
    const correlationId = event.correlationId || 'unknown';
    console.log(`[ProductService] [${correlationId}] Received Event:`, event['detail-type']);

    if (event['detail-type'] === 'OrderPlaced') {
      const { orderId, items } = event.detail;

      // --- IDEMPOTENCY CHECK ---
      // Use orderId as the idempotency key for this event type
      const [rows] = await db.query('SELECT event_id FROM idempotency_log WHERE event_id = ?', [`order-placed-${orderId}`]);
      if (rows.length > 0) {
        console.log(`[ProductService] Event order-placed-${orderId} already processed. Skipping.`);
        return res.json({ status: 'success', message: 'Already processed' });
      }

      await reduceStockInternal(items);

      // Log processed event
      await db.query('INSERT INTO idempotency_log (event_id) VALUES (?)', [`order-placed-${orderId}`]);

      console.log('[ProductService] Processed OrderPlaced: Stock reduced.');
    }

    res.json({ status: 'success' });
  } catch (err) {
    console.error('handleEvent error', err);
    // Even if we fail, we might want to return 200 to EventBridge to avoid retry loops for logic errors,
    // but for now, 500 is fine for visibility.
    res.status(500).json({ message: 'Event processing failed' });
  }
};

const CBOpossum = require('opossum');

// GET /api/v1/products/rates
// EXTERNAL API INTEGRATION with Circuit Breaker
const EXTERNAL_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

async function fetchExchangeRatesExternal() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

  try {
    const response = await fetch(EXTERNAL_API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`External API returned status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

const breakerOptions = {
  timeout: 4000,
  errorThresholdPercentage: 50,
  resetTimeout: 15000
};

const exchangeRateBreaker = new CBOpossum(fetchExchangeRatesExternal, breakerOptions);

// Fallback rates in case external API fails or circuit is open
const fallbackRates = {
  base: 'USD',
  date: new Date().toISOString().split('T')[0],
  rates: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 148.5, AUD: 1.52, LKR: 310.0 }
};

exchangeRateBreaker.fallback(() => ({ source: 'fallback (circuit-open)', ...fallbackRates }));

exports.getExchangeRates = async (req, res) => {
  try {
    console.log(`[ProductService] Fetching exchange rates via Circuit Breaker`);
    const data = await exchangeRateBreaker.fire();

    if (data.source === 'fallback (circuit-open)') {
      return res.json(data);
    }

    res.json({ source: 'external', ...data });
  } catch (err) {
    console.error('[ProductService] Currency API failed:', err.message);
    res.json({ source: 'fallback (error)', ...fallbackRates });
  }
};
