import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStatus from '../hooks/useAuthStatus.js';
import '../styles/signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuthStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/tasks', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const passwordStatus = useMemo(() => {
    return {
      hasMinLength: password.length >= 12,
      hasDigit: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNoCyrillic: !/[\u0400-\u04FF]/.test(password)
    };
  }, [password]);

  const validateEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isPasswordValid =
    passwordStatus.hasMinLength &&
    passwordStatus.hasDigit &&
    passwordStatus.hasSpecial &&
    passwordStatus.hasNoCyrillic;

  const handleSubmit = event => {
    event.preventDefault();
    let valid = true;

    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (/[\u0400-\u04FF]/.test(password)) {
      setPasswordError('Password cannot contain Cyrillic characters');
      valid = false;
    } else if (!isPasswordValid) {
      setPasswordError('Password does not meet the requirements');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    if (!valid) {
      return;
    }

    fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Registration failed');
          });
        }
        return response.json();
      })
      .then(() => {
        navigate('/tasks');
      })
      .catch(error => {
        setEmailError(error.message);
      });
  };

  return (
    <div className="signup-page">
      <div className="container">
        <h1>Sign Up</h1>
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
            <div className="password-requirements">
              <div className={`requirement ${passwordStatus.hasMinLength ? 'met' : 'unmet'}`} id="lengthReq">
                At least 12 characters
              </div>
              <div className={`requirement ${passwordStatus.hasDigit ? 'met' : 'unmet'}`} id="digitReq">
                At least one digit
              </div>
              <div className={`requirement ${passwordStatus.hasSpecial ? 'met' : 'unmet'}`} id="specialReq">
                At least one special character
              </div>
            </div>
            <div className="error-message" style={{ display: passwordError ? 'block' : 'none' }}>
              {passwordError}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className={confirmPasswordError ? 'error' : ''}
              required
            />
            <div className="error-message" style={{ display: confirmPasswordError ? 'block' : 'none' }}>
              {confirmPasswordError}
            </div>
          </div>

          <button type="submit">Sign Up</button>
        </form>
        <div className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
