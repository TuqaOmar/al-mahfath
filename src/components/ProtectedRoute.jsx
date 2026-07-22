import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireWizard = true }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If the route requires the user to have completed the wizard, and they haven't
  if (requireWizard && !user.hasCompletedWizard) {
    return <Navigate to="/wizard" replace />;
  }

  // If the route is the wizard itself, but the user HAS already completed it
  if (!requireWizard && user.hasCompletedWizard) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
