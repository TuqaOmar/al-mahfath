import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import OnboardingWizard from './pages/OnboardingWizard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Wizard Route (Protected, but requires user to NOT have finished wizard yet) */}
        <Route 
          path="/wizard" 
          element={
            <ProtectedRoute requireWizard={false}>
              <OnboardingWizard />
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard Route (Protected, requires wizard to be finished) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requireWizard={true}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
