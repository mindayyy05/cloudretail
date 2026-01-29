
// order-service/src/cartController.js
const db = require('./db');

// Get cart items for a user
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.userId; // Provided by auth middleware typically
        // For now we assume we get userId from headers or token. 
        // Wait, order-service might not have full auth middleware setups yet?
        // Let's assume the gateway or frontend passes the user ID or we decode the token.
        // The previous plan said "authHeaders" in frontend, so we receive Bearer token.
        // We need a middleware to decode it, OR we trust the caller.
        // Let's look at orderController logic later, but for now let's implement the DB logic.
        // We will assume req.user is populated by a middleware we'll check/add.

        const [rows] = await db.query(
            'SELECT * FROM cart_items WHERE user_id = ?',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Get cart error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add item or increment quantity
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ message: 'Product ID required' });
        }

        // Check if exists
        const [existing] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (existing.length > 0) {
            // Update
            const newQty = existing[0].quantity + quantity;
            await db.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQty, existing[0].id]
            );
            res.json({ message: 'Cart updated', product_id, quantity: newQty });
        } else {
            // Insert
            await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, quantity]
            );
            res.status(201).json({ message: 'Item added', product_id, quantity });
        }
    } catch (err) {
        console.error('Add to cart error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update specific quantity
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { product_id, quantity } = req.body;

        if (quantity <= 0) {
            // Remove
            await db.query(
                'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, product_id]
            );
            return res.json({ message: 'Item removed', product_id, quantity: 0 });
        }

        await db.query(
            'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, product_id]
        );
        res.json({ message: 'Cart updated', product_id, quantity });
    } catch (err) {
        console.error('Update cart error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Remove item
exports.removeCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { product_id } = req.params; // or body

        await db.query(
            'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );
        res.json({ message: 'Item removed', product_id });
    } catch (err) {
        console.error('Remove cart error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Clear cart error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
