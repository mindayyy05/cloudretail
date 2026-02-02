// src/pages/AdminReset.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../api';

function AdminReset() {
    const [email, setEmail] = useState('admin@cloudretail.com');
    const [newPassword, setNewPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await resetPassword({ email, newPassword, secretKey });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/admin/login'), 2000);
        } catch (err) {
            console.error('reset error', err);
            setError(err.response?.data?.message || 'Failed to reset password. Check your Secret Key.');
        }
    };

    return (
        <div className="form-container">
            <h2>Admin Emergency Reset</h2>
            <p style={{ fontSize: 13, color: '#666' }}>
                If you are locked out, use the special **Secret Key** to set a new password.
            </p>

            {message && <div style={{ color: 'green', fontSize: 13 }}>{message}</div>}
            {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleReset}>
                <label>Admin Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label>New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                />

                <label>Emergency Secret Key</label>
                <input
                    type="text"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter the reset key"
                    required
                />

                <button type="submit" style={{ backgroundColor: '#ff4d4d' }}>
                    Force Reset Password
                </button>
            </form>

            <div style={{ marginTop: 20 }}>
                <button onClick={() => navigate('/admin/login')} className="secondary-btn">
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default AdminReset;
