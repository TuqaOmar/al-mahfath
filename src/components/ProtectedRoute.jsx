import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireWizard = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Fallback check to localStorage to prevent race conditions during state updates
  let currentUser = user;
  if (!currentUser) {
    try {
      const stored = localStorage.getItem('ma7fath_user');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing stored user in ProtectedRoute:', e);
    }
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const wizardDone = Boolean(currentUser.hasCompletedWizard);

  // If the route requires the user to have completed the wizard, and they haven't
  if (requireWizard && !wizardDone) {
    return <Navigate to="/wizard" replace />;
  }

  // If the route is the wizard itself, but the user HAS already completed it
  if (!requireWizard && wizardDone) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
