import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';
import './AuthDialog.css';

function AuthDialog({ isOpen, onClose, onSuccess }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegistering) {
                await registerUser({ first_name: firstName, last_name: lastName, email, password });
                // Attempt direct login after successful registration
                try {
                    const { token, user } = await loginUser({ email, password });
                    localStorage.setItem('jwt', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    alert('Registered and Logged in!');
                    onSuccess(user);
                    onClose();
                } catch (loginErr) {
                    // Fallback if auto-login fails
                    alert('Registration successful! Please log in.');
                    setIsRegistering(false);
                }
            } else {
                const { token, user } = await loginUser({ email, password });
                localStorage.setItem('jwt', token);
                localStorage.setItem('user', JSON.stringify(user));
                // alert('Logged in successfully'); // Removed alert for smoother flow
                onSuccess(user);
                onClose();
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Authentication failed');
            }
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="auth-overlay" onClick={handleOverlayClick}>
            <div className="auth-dialog">
                <button onClick={onClose} className="auth-close-btn">×</button>
                <h3>{isRegistering ? 'Create Account' : 'Welcome Back'}</h3>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {isRegistering && (
                        <>
                            <input
                                className="auth-input"
                                placeholder="First Name"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                required
                            />
                            <input
                                className="auth-input"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                required
                            />
                        </>
                    )}

                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="auth-submit-btn">
                        {isRegistering ? 'Sign Up' : 'Log In'}
                    </button>
                </form>

                <div className="auth-footer">
                    {isRegistering ? 'Already have an account? ' : 'New to CloudRetail? '}
                    <button
                        type="button"
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                        className="auth-switch-btn"
                    >
                        {isRegistering ? 'Log In' : 'Create Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthDialog;
