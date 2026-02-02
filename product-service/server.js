// product-service/server.js
require('dotenv').config();
const app = require('./src/app');

const { loadSecrets } = require('./src/secrets');

const PORT = process.env.PORT || 4004;

async function startServer() {
  await loadSecrets();
  const server = app.listen(PORT, () => {
    console.log(`product-service running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err);
  });
}

startServer();

// Prevent process from exiting on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
