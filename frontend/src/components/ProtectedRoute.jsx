import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStatus from '../hooks/useAuthStatus.js';

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuthStatus();

  if (loading) {
    return <div className="loading-state">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
