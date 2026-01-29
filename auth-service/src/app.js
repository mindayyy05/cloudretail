// auth-service/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { register, login, generateOTP, verifyOTP } = require('./authController');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);
app.post('/api/v1/auth/mfa/generate', generateOTP);
app.post('/api/v1/auth/mfa/verify', verifyOTP);

// User Management Routes
// Note: In a real app, you should add an adminAuth middleware here
app.get('/api/v1/users', require('./authController').listUsers);
app.delete('/api/v1/users/:id', require('./authController').deleteUser);
app.put('/api/v1/users/:id', require('./authController').updateUser);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

module.exports = app;
