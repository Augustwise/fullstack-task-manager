import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkAuth, fetchJson } from '../utils/api.js';
import '../styles/signup.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cyrillicRegex = /[\u0400-\u04FF]/;

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const requirements = useMemo(() => {
    return {
      length: password.length >= 12,
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCyrillic: !cyrillicRegex.test(password)
    };
  }, [password]);

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

  const validateForm = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (cyrillicRegex.test(password)) {
      setPasswordError('Password cannot contain Cyrillic characters');
      valid = false;
    } else if (!requirements.length || !requirements.digit || !requirements.special || !requirements.noCyrillic) {
      setPasswordError('Password does not meet the requirements');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      await fetchJson('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      navigate('/tasks');
    } catch (error) {
      setEmailError(error.message || 'Registration failed');
    }
  };

  return (
    <div className="page-signup">
      <div className="container">
        <h1>Sign Up</h1>
        <form id="signupForm" onSubmit={handleSubmit} noValidate>
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
            <div className="password-requirements">
              <div className={`requirement ${requirements.length ? 'met' : 'unmet'}`} id="lengthReq">
                • Minimum 12 characters
              </div>
              <div className={`requirement ${requirements.digit ? 'met' : 'unmet'}`} id="digitReq">
                • Minimum one digit
              </div>
              <div className={`requirement ${requirements.special ? 'met' : 'unmet'}`} id="specialReq">
                • Minimum one special character
              </div>
            </div>
            <div
              className="error-message"
              id="passwordError"
              style={{ display: passwordError ? 'block' : 'none' }}
            >
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
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={confirmError ? 'error' : ''}
              required
            />
            <div
              className="error-message"
              id="confirmPasswordError"
              style={{ display: confirmError ? 'block' : 'none' }}
            >
              {confirmError}
            </div>
          </div>
          <button type="submit">Sign Up</button>
        </form>
        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
