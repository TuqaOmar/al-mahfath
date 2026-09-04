import React, { useState } from 'react';
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

const LandingPage = () => {
  const { user, loginWithTestAccount } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'login' | 'signup'
  const navigate = useNavigate();

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

  return (
    <div className="landing-page-root" style={{
      position: 'relative',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      overflowX: 'hidden'
    }}>
      {/* 1. Header / Navbar */}
      <LandingNavbar
        onOpenAuth={handleOpenAuth}
        onDemoLogin={handleDemoLogin}
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
      <LandingFooter />

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
