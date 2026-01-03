import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkAuth, fetchJson } from '../utils/api.js';
import '../styles/login.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let isActive = true;
    checkAuth()
      .then((data) => {
        if (isActive && data.isAuthenticated) {
          navigate('/tasks', { replace: true });
        }
      })
      .catch(() => {
        // Stay on public page if auth check fails.
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    let valid = true;

    setEmailError('');
    setPasswordError('');

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      valid = false;
    }

    if (!valid) {
      return;
    }

    try {
      await fetchJson('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      navigate('/tasks');
    } catch (error) {
      setPasswordError(error.message || 'Invalid email or password');
    }
  };

  return (
    <div className="page-login">
      <div className="container">
        <h1>Login</h1>
        <form id="loginForm" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={emailError ? 'error' : ''}
              required
            />
            <div className="error-message" id="emailError" style={{ display: emailError ? 'block' : 'none' }}>
              {emailError}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={passwordError ? 'error' : ''}
              required
            />
            <div
              className="error-message"
              id="passwordError"
              style={{ display: passwordError ? 'block' : 'none' }}
            >
              {passwordError}
            </div>
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="signup-link">
          Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
