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

  // Robust wizard completion detection:
  // User is considered to have completed the wizard if hasCompletedWizard is true,
  // OR if they already have non-empty preferences (dailyTarget, learningStyle),
  // OR have memorized pages count > 0, OR hold admin or teacher roles.
  const hasValidPreferences = currentUser.preferences && typeof currentUser.preferences === 'object' && Object.keys(currentUser.preferences).length > 0;
  const wizardDone = Boolean(
    currentUser.hasCompletedWizard === true ||
    currentUser.hasCompletedWizard === 1 ||
    currentUser.hasCompletedWizard === 'true' ||
    hasValidPreferences ||
    Number(currentUser.memorizedPagesCount) > 0 ||
    Number(currentUser.totalJuz) > 0 ||
    currentUser.role === 'admin' ||
    currentUser.role === 'teacher'
  );

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
