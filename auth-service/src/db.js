// auth-service/src/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST_MAIN || 'localhost',
  port: process.env.DB_PORT_MAIN || 3306,
  user: process.env.DB_USER_MAIN || 'root',
  password: process.env.DB_PASS_MAIN || 'your_password',
  database: process.env.DB_NAME_MAIN || 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
