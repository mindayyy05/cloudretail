// order-service/server.js
require('dotenv').config();
const { loadSecrets } = require('./src/secrets');
const app = require('./src/app');

const PORT = process.env.PORT || 4004;

async function startServer() {
  await loadSecrets();
  app.listen(PORT, () => {
    console.log(`order-service running on port ${PORT}`);
  });
}

startServer();
