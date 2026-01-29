// product-service/src/db.js
const mysql = require('mysql2/promise');

// For this assignment we connect directly to the `cloudretail` DB
// (the one you see in phpMyAdmin).
// You can still override host/user/password with env vars if you want.
const pool = mysql.createPool({
  host: process.env.DB_HOST_MAIN || 'localhost',
  port: Number(process.env.DB_PORT_MAIN) || 3306,
  user: process.env.DB_USER_MAIN || 'root',
  password: process.env.DB_PASS_MAIN || 'your_password', // <-- put your real MySQL password
  database: process.env.DB_NAME_MAIN || 'product_db',   // <-- Use env var
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
