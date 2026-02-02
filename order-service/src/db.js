const AWSXRay = require('aws-xray-sdk');
const mysql = AWSXRay.captureMySQL(require('mysql2/promise'));

let pool;

function getPool() {
  if (!pool) {
    console.log('[OrderService] Initializing DB Pool...');
    pool = mysql.createPool({
      host: process.env.DB_HOST_MAIN || 'localhost',
      port: process.env.DB_PORT_MAIN || 3306,
      user: process.env.DB_USER_MAIN || 'root',
      password: process.env.DB_PASS_MAIN || 'your_password',
      database: process.env.DB_NAME_MAIN || 'order_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

module.exports = {
  query: (...args) => getPool().query(...args),
  execute: (...args) => getPool().execute(...args),
  getConnection: (...args) => getPool().getConnection(...args),
};
