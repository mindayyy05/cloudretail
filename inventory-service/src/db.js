// auth-service/src/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST_MAIN,
  port: process.env.DB_PORT_MAIN,
  user: process.env.DB_USER_MAIN,
  password: process.env.DB_PASS_MAIN,
  database: process.env.DB_NAME_MAIN || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
