// product-service/server.js
require('dotenv').config();
const app = require('./src/app');

const { loadSecrets } = require('./src/secrets');

const PORT = process.env.PORT || 4004;

async function startServer() {
  await loadSecrets();
  app.listen(PORT, () => {
    console.log(`product-service running on port ${PORT}`);
  });
}

startServer();

server.on('error', (err) => {
  console.error('Server failed to start:', err);
});

// Prevent process from exiting on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
