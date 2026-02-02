// src/pages/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser({ email, password });

      if (data.user.role !== 'ADMIN') {
        setError('Access denied. This account is not an admin.');
        return;
      }

      // Save token + user info
      localStorage.setItem('admin_jwt', data.token);
      localStorage.setItem('admin_userName', data.user.name);
      localStorage.setItem('admin_userRole', data.user.role);
      localStorage.setItem('admin_userEmail', data.user.email);

      navigate('/admin/products'); // admin dashboard
    } catch (err) {
      console.error('admin login error', err);
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="form-container">
      <h2>Admin Login</h2>
      {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>Admin Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login as Admin</button>
      </form>

      <div style={{ marginTop: 20, fontSize: 13 }}>
        <Link to="/admin/reset-password" style={{ color: '#007bff' }}>
          Forgot Password? / Emergency Reset
        </Link>
      </div>
    </div>
  );
}

export default AdminLogin;
