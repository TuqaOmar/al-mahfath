import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowLeft, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, signup, loginWithTestAccount, loginWithAdminAccount, updateUserData } = useAuth();
  const navigate = useNavigate();

  // Listen to postMessage event from Mock Google Popup window
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'GOOGLE_SIGN_IN_SUCCESS') {
        setIsLoading(true);
        const { name: googleName, email: googleEmail } = event.data;

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: googleName, email: googleEmail })
          });
          const data = await res.json();
          if (data.success && data.user) {
            updateUserData(data.user);
            onClose();
            navigate(data.user.hasCompletedWizard ? '/dashboard' : '/wizard');
          }
        } catch (err) {
          console.error('Error authenticating with backend:', err);
          setError('حدث خطأ أثناء معالجة بيانات جوجل');
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateUserData, onClose, navigate]);

  // Open the Mock Google Popup window
  const triggerGooglePopup = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      '/mock-google-login.html',
      'Google Sign-In',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        setIsLoading(false);
        return;
      }

      let result;
      if (isSignUp) {
        result = await signup(name.trim() || 'حافظ جديد', email.trim(), password.trim());
      } else {
        result = await login(email.trim(), password.trim());
      }

      if (result.success) {
        onClose();
        // The user is already set in context, navigate
        const storedUser = JSON.parse(localStorage.getItem('ma7fath_user') || '{}');
        navigate(storedUser.hasCompletedWizard ? '/dashboard' : '/wizard');
      } else {
        setError(result.message || 'فشلت العملية، يرجى التحقق من المدخلات');
      }
    } catch (err) {
      console.error(err);
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setIsLoading(true);
    await loginWithTestAccount();
    setIsLoading(false);
    onClose();
    navigate('/dashboard');
  };

  const handleAdminClick = async () => {
    setIsLoading(true);
    await loginWithAdminAccount();
    setIsLoading(false);
    onClose();
    navigate('/dashboard');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            maxWidth: '450px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '36px 32px',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontWeight: 'bold',
              fontSize: '22px'
            }}>
              م
            </div>

            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول للمنصة'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              {isSignUp ? 'ابدأ رحلتك المباركة مع القرآن الكريم الآن' : 'مرحباً بعودتك لمتابعة وردك وإنجازك اليومي'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          {/* Social / Quick Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={triggerGooglePopup}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              متابعة بحساب Google المفتوح بالمتصفح
            </button>

            <button
              type="button"
              onClick={handleDemoClick}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--primary)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} /> دخول سريع بالحساب التجريبي (Demo)
            </button>

            <button
              type="button"
              onClick={handleAdminClick}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #8B5CF6',
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#8B5CF6',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🛡️ دخول سريع بحساب مدير النظام (Admin)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>أو عبر البريد الإلكتروني</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isSignUp && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>الاسم الكريم:</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', right: '14px' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="أدخل اسمك الثلاثي..."
                    style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-field" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>البريد الإلكتروني:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', right: '14px' }} />
                <input
                  type="email"
                  id="email-field"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-field" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>كلمة المرور:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', right: '14px' }} />
                <input
                  type="password"
                  id="password-field"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isLoading ? 'جاري الاتصال بالسيرفر...' : (isSignUp ? 'تأكيد وإنشاء الحساب' : 'تسجيل الدخول')}
            </button>
          </form>

          {/* Footer Toggle Switcher */}
          <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {isSignUp ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب بعد؟ '}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                marginRight: '4px'
              }}
            >
              {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
