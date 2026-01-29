// inventory-service/src/inventoryController.js
const db = require('./db');

exports.getInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await db.query('SELECT quantity as available_qty FROM products WHERE id = ?', [productId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getInventory error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.reserveStock = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT quantity FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Not found' });
    }

    const currentQty = rows[0].quantity;
    if (currentQty < quantity) {
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await conn.query(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [quantity, productId]
    );
    await conn.commit();
    res.json({ message: 'Reserved', productId, quantity });
  } catch (err) {
    await conn.rollback();
    console.error('reserveStock error', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    conn.release();
  }
};

exports.releaseStock = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'UPDATE products SET quantity = quantity + ? WHERE id = ?',
      [quantity, productId]
    );
    await conn.commit();
    res.json({ message: 'Released', productId, quantity });
  } catch (err) {
    await conn.rollback();
    console.error('releaseStock error', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    conn.release();
  }
};
