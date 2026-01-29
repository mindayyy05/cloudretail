// inventory-service/server.js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`inventory-service running on port ${PORT}`);
});
