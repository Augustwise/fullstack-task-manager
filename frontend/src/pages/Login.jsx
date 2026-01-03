import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = event => {
    event.preventDefault();
    let valid = true;

    setEmailError('');
    setPasswordError('');

    if (!validateEmail(email)) {
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

    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Invalid email or password');
          });
        }
        return response.json();
      })
      .then(() => {
        navigate('/tasks');
      })
      .catch(error => {
        setPasswordError(error.message);
      });
  };

  return (
    <div className="login-page">
      <div className="container">
        <h1>Login</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className={emailError ? 'error' : ''}
              required
            />
            <div className="error-message" style={{ display: emailError ? 'block' : 'none' }}>
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
              onChange={event => setPassword(event.target.value)}
              className={passwordError ? 'error' : ''}
              required
            />
            <div className="error-message" style={{ display: passwordError ? 'block' : 'none' }}>
              {passwordError}
            </div>
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
