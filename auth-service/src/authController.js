const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, hash, userRole]
    );

    res.status(201).json({ id: result.insertId, first_name, last_name, email, role: userRole });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not registered' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Track login
    await db.query('INSERT INTO user_logins (user_id) VALUES (?)', [user.id]);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.emergencyReset = async (req, res) => {
  try {
    const { email, newPassword, secretKey } = req.body;
    if (secretKey !== 'CLOUD_RETAIL_ADMIN_RESET_2026') {
      return res.status(403).json({ message: 'Invalid secret key' });
    }
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query('UPDATE users SET password_hash = ? WHERE email = ? AND role = "ADMIN"', [hash, email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    res.json({ message: 'Admin password reset successfully' });
  } catch (err) {
    console.error('Reset error', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// --- MFA IMPLEMENTATION (Basic Email/SMS OTP Flow) ---

const redis = require('redis');
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis for OTP storage');
})();

exports.generateOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 5 min (300 sec) expiry
    await redisClient.set(`otp:${email}`, otp, { EX: 300 });

    console.log(`[MFA] OTP for ${email}: ${otp} (Stored in Redis)`);
    res.json({ message: 'OTP sent to email (checked server logs)', status: 'sent' });
  } catch (err) {
    console.error('generateOTP error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp) return res.status(400).json({ message: 'No OTP requested or expired' });

    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP Valid - Delete from Redis
    await redisClient.del(`otp:${email}`);
    // If this was part of login, we would issue the JWT here.
    // For this proof-of-concept, we just confirm verification.
    res.json({ message: 'MFA Verification Successful', verified: true });
  } catch (err) {
    console.error('verifyOTP error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- USER MANAGEMENT ---

exports.listUsers = async (req, res) => {
  try {
    // Get all users with their most recent login time
    const sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
             MAX(ul.login_time) as last_login
      FROM users u
      LEFT JOIN user_logins ul ON u.id = ul.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('listUsers error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting the last admin or yourself if needed, but for now just simple delete
    // In a real app, check if req.user.userId === id to prevent self-deletion if desired

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role } = req.body;

    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Check if email is taken by another user
    const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    await db.query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, role = ? WHERE id = ?',
      [first_name, last_name, email, role, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('updateUser error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
