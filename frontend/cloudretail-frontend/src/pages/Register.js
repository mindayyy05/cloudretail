// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

function Register() {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('USER'); // keep simple
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser({ first_name: name, last_name: lastName, email, password, role });
      alert('Registered successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      console.error('register error', err);
      setError('Registration failed (maybe email is already used)');
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>First Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="First Name" />

        <label>Last Name</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Last Name" />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
