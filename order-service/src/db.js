// order-service/src/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// Uses the same "MAIN" DB config you used for auth/product services.
// Defaults so it still works in local dev with your cloudretail DB.
const pool = mysql.createPool({
  host: process.env.DB_HOST_MAIN || 'localhost',
  port: process.env.DB_PORT_MAIN || 3306,
  user: process.env.DB_USER_MAIN || 'root',
  password: process.env.DB_PASS_MAIN || 'your_password', // <- put real password
  database: process.env.DB_NAME_MAIN || 'order_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
