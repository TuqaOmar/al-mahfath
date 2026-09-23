import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingStats } from '../components/landing/LandingStats';
import { LandingShowcase } from '../components/landing/LandingShowcase';
import { LandingLiveDemo } from '../components/landing/LandingLiveDemo';
import { LandingMethodology } from '../components/landing/LandingMethodology';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingTestimonials } from '../components/landing/LandingTestimonials';
import { LandingFAQ } from '../components/landing/LandingFAQ';
import { LandingCTA } from '../components/landing/LandingCTA';
import { LandingFooter } from '../components/landing/LandingFooter';
import { DocumentationModal } from '../components/DocumentationModal';
import { MobileWelcomeView } from '../components/mobile/MobileWelcomeView';
import { isMobileEnvironment } from '../utils/platform';

const LandingPage = () => {
  const { user, loginWithTestAccount } = useAuth();
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

  const handleDemoLogin = async () => {
    try {
      await loginWithTestAccount();
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  // When running inside a mobile app (Capacitor/PWA) and not yet logged in:
  // Render clean, streamlined mobile onboarding instead of heavy marketing website
  if (isMobile && !user) {
    return (
      <div className="landing-page-root">
        <MobileWelcomeView
          onOpenAuth={handleOpenAuth}
          onDemoLogin={handleDemoLogin}
        />
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
      {/* 1. Header / Navbar */}
      <LandingNavbar
        onOpenAuth={handleOpenAuth}
        onDemoLogin={handleDemoLogin}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* 2. Hero Section with Live Floating Mockup */}
      <LandingHero
        onOpenAuth={handleOpenAuth}
        onDemoLogin={handleDemoLogin}
      />

      {/* 3. Social Proof & Key Statistics */}
      <LandingStats />

      {/* 4. Interactive Feature Showcase (Tabs Explorer) */}
      <LandingShowcase
        onOpenAuth={handleOpenAuth}
        onDemoLogin={handleDemoLogin}
      />

      {/* 5. Live Interactive Recitation Demo Widget */}
      <LandingLiveDemo
        onDemoLogin={handleDemoLogin}
      />

      {/* 6. The 5 Fortresses System & Scientific Method */}
      <LandingMethodology
        onDemoLogin={handleDemoLogin}
      />

      {/* 7. Key Features Bento Grid */}
      <LandingFeatures />

      {/* 8. Memorizers Testimonials & Real Stories */}
      <LandingTestimonials />

      {/* 9. Frequently Asked Questions (FAQ Accordion) */}
      <LandingFAQ />

      {/* 10. High Impact Inspiring CTA Banner */}
      <LandingCTA
        onOpenAuth={handleOpenAuth}
        onDemoLogin={handleDemoLogin}
      />

      {/* 11. Islamic Modern Footer with Dedication */}
      <LandingFooter onOpenDocs={() => setIsDocsOpen(true)} />

      {/* Platform In-App Interactive Documentation Modal */}
      <DocumentationModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Auth Modal popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
