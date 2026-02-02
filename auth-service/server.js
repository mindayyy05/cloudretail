// auth-service/server.js
const app = require('./src/app');
const { loadSecrets } = require('./src/secrets');

const PORT = process.env.PORT || 4001;

async function startServer() {
    // Load secrets from AWS Secrets Manager
    await loadSecrets();

    app.listen(PORT, () => console.log(`auth-service running on ${PORT}`));
}

startServer();
