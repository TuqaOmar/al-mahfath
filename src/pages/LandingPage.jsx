import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingScreens } from '../components/landing/LandingScreens';
import { LandingFAQ } from '../components/landing/LandingFAQ';
import { LandingFooter } from '../components/landing/LandingFooter';
import { DocumentationModal } from '../components/DocumentationModal';
import { MobileWelcomeView } from '../components/mobile/MobileWelcomeView';
import { isMobileEnvironment } from '../utils/platform';

const LandingPage = () => {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'login' | 'signup'
  const navigate = useNavigate();
  const isMobile = isMobileEnvironment();

  // If already authenticated, redirect directly into the app
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleOpenAuth = (mode = 'signup') => {
    if (user) {
      navigate('/dashboard');
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
    }
  };

  // When running inside a mobile app (Capacitor/PWA) and not yet logged in:
  // Render clean, streamlined mobile onboarding instead of heavy marketing website
  if (isMobile && !user) {
    return (
      <div className="landing-page-root">
        <MobileWelcomeView onOpenAuth={handleOpenAuth} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </div>
    );
  }

  return (
    <div className="landing-page-root" style={{
      position: 'relative',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      overflowX: 'clip'
    }}>
      <LandingNavbar onOpenAuth={handleOpenAuth} />
      <main>
        <LandingHero onOpenAuth={handleOpenAuth} />
        <LandingFeatures>
          <LandingScreens />
        </LandingFeatures>
        <LandingFAQ />
      </main>
      <LandingFooter onOpenAuth={handleOpenAuth} onOpenDocs={() => setIsDocsOpen(true)} />

      <DocumentationModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
