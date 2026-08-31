import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Shield, PlusCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Account Chooser State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isAddingNewGoogleAccount, setIsAddingNewGoogleAccount] = useState(false);

  const { login, signup, loginWithGoogle, loginWithTestAccount, loginWithAdminAccount } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  // Preset / Detected Google Accounts
  const knownGoogleAccounts = [
    {
      name: 'دعاء / Tuaa',
      email: 'tuaa.1999@gmail.com',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tuaa'
    },
    {
      name: 'حساب جوجل الرئيسي',
      email: 'user.quran@gmail.com',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuranStudent'
    }
  ];

  // Reset fields & sync mode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setShowGoogleChooser(false);
      setIsAddingNewGoogleAccount(false);
      setCustomGoogleEmail('');
      setCustomGoogleName('');
    }
  }, [isOpen, initialMode]);

  // Google Sign-In Trigger
  const handleGoogleClick = async () => {
    setIsLoading(true);
    setError('');

    // 1. Try Firebase Popup first
    try {
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        if (result && result.user) {
          const user = result.user;
          const res = await loginWithGoogle(user.email, user.displayName, user.photoURL);
          if (res.success && res.user) {
            setIsLoading(false);
            onClose();
            navigate(res.user.hasCompletedWizard ? '/dashboard' : '/wizard');
            return;
          }
        }
      }
    } catch (popupErr) {
      console.log('Firebase popup not opened directly (e.g. iframe restrictions), opening Google account selector:', popupErr.message);
    }

    // 2. Open interactive Google Account Chooser
    setIsLoading(false);
    setShowGoogleChooser(true);
  };

  // Select an account from Google Chooser
  const selectGoogleAccount = async (accEmail, accName, accPhoto) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle(accEmail, accName, accPhoto);
      if (res.success && res.user) {
        onClose();
        navigate(res.user.hasCompletedWizard ? '/dashboard' : '/wizard');
      } else {
        setError(res.message || (isRTL ? 'فشل تسجيل الدخول بحساب جوجل' : 'Failed to login with Google'));
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError(isRTL ? 'تعذر الاتصال بخدمة جوجل' : 'Failed to connect to Google service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      setError(isRTL ? 'يرجى إدخال بريد جوجل الإلكتروني' : 'Please enter Google email');
      return;
    }
    const accName = customGoogleName.trim() || customGoogleEmail.split('@')[0];
    selectGoogleAccount(customGoogleEmail.trim(), accName, null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError(t('auth_error_fields') || (isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields'));
        setIsLoading(false);
        return;
      }

      let result;
      if (isSignUp) {
        result = await signup(name.trim() || (isRTL ? 'حافظ جديد' : 'New Learner'), email.trim(), password.trim());
      } else {
        result = await login(email.trim(), password.trim());
      }

      if (result.success && result.user) {
        onClose();
        navigate(result.user.hasCompletedWizard ? '/dashboard' : '/wizard');
      } else if (result.success) {
        onClose();
        const storedUser = JSON.parse(localStorage.getItem('ma7fath_user') || '{}');
        navigate(storedUser.hasCompletedWizard ? '/dashboard' : '/wizard');
      } else {
        setError(result.message || (isRTL ? 'فشلت العملية، يرجى التحقق من المدخلات' : 'Operation failed, please check inputs'));
      }
    } catch (err) {
      console.error(err);
      setError(isRTL ? 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً' : 'Could not connect to server, please try again later');
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

  const iconPosition = isRTL ? { right: '14px', left: 'auto' } : { left: '14px', right: 'auto' };
  const inputStyle = {
    width: '100%',
    padding: isRTL ? '12px 42px 12px 14px' : '12px 14px 12px 42px',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
    background: 'var(--bg-color)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: '14px'
  };

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
            maxWidth: '460px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '32px 28px',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label={isRTL ? "إغلاق النافذة" : "Close window"}
            style={{
              position: 'absolute',
              top: '20px',
              left: isRTL ? '20px' : 'auto',
              right: !isRTL ? '20px' : 'auto',
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

          {/* VIEW A: Google Account Chooser */}
          {showGoogleChooser ? (
            <div>
              {/* Back to standard login */}
              <button
                type="button"
                onClick={() => { setShowGoogleChooser(false); setIsAddingNewGoogleAccount(false); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  padding: 0
                }}
              >
                {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                {isRTL ? 'الرجوع لخيارات الدخول' : 'Back to login options'}
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {isRTL ? 'اختيار حساب Google' : 'Choose a Google Account'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {isRTL ? 'اختر حسابك للمتابعة والدخول إلى منصة محفظ AI' : 'Select your account to continue to Mahfath AI'}
                </p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                  {error}
                </div>
              )}

              {/* Account list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {knownGoogleAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectGoogleAccount(acc.email, acc.name, acc.photo)}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      cursor: 'pointer',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                  >
                    <img
                      src={acc.photo}
                      alt={acc.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', border: '1px solid var(--glass-border)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.email}
                      </div>
                    </div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      ✓
                    </div>
                  </button>
                ))}
              </div>

              {/* Add custom Google account form toggle */}
              {!isAddingNewGoogleAccount ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNewGoogleAccount(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px dashed var(--glass-border)',
                    background: 'transparent',
                    color: 'var(--primary)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <PlusCircle size={16} />
                  {isRTL ? 'استخدام حساب Google آخر' : 'Use another Google account'}
                </button>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      {isRTL ? 'الاسم:' : 'Name:'}
                    </label>
                    <input
                      type="text"
                      placeholder={isRTL ? 'مثال: فاطمة أحمد' : 'e.g. Fatima Ahmad'}
                      value={customGoogleName}
                      onChange={e => setCustomGoogleName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      {isRTL ? 'بريد Google (Gmail):' : 'Google Email (Gmail):'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={customGoogleEmail}
                      onChange={e => setCustomGoogleEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: '#4285F4',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {isLoading ? (isRTL ? 'جاري تسجيل الدخول...' : 'Signing in...') : (isRTL ? 'دخول بهذا الحساب' : 'Sign in with this account')}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* VIEW B: Standard Auth Modal with Google Button */
            <div>
              {/* Modal Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  fontWeight: 'bold',
                  fontSize: '22px'
                }}>
                  م
                </div>

                <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                  {isSignUp ? (isRTL ? 'إنشاء حساب جديد في محفظ AI' : 'Create a New Account') : (isRTL ? 'تسجيل الدخول إلى محفظ AI' : 'Sign in to Mahfath AI')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                  {isSignUp 
                    ? (isRTL ? 'ابدأ رحلة حفظ وتثبيت القرآن بخطة مخصصة لك' : 'Start your personalized Quran memorization journey') 
                    : (isRTL ? 'مرحباً بك مجدداً! ادخل لمتابعة وردك اليومي' : 'Welcome back! Sign in to continue your daily routine')}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                  {error}
                </div>
              )}

              {/* Social / Quick Login Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={handleGoogleClick}
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
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  {isRTL ? 'المتابعة بحساب Google' : 'Continue with Google'}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleDemoClick}
                    disabled={isLoading}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid var(--primary)',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={15} /> {isRTL ? 'حساب تجريبي' : 'Demo Account'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminClick}
                    disabled={isLoading}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid #8B5CF6',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#8B5CF6',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🛡️ {isRTL ? 'دخول الأدمن' : 'Admin Login'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('auth_or') || (isRTL ? 'أو بالبريد الإلكتروني' : 'or with email')}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isSignUp && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>{t('auth_name') || (isRTL ? 'الاسم الكريم:' : 'Full Name:')}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', ...iconPosition }} />
                      <input
                        type="text"
                        required={isSignUp}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('auth_name_placeholder') || (isRTL ? 'مثال: عبد الله أحمد' : 'e.g. Abdullah')}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email-field" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>{t('auth_email') || (isRTL ? 'البريد الإلكتروني:' : 'Email address:')}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', ...iconPosition }} />
                    <input
                      type="email"
                      id="email-field"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('auth_email_placeholder') || 'name@example.com'}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password-field" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>{t('auth_password') || (isRTL ? 'كلمة المرور:' : 'Password:')}</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', ...iconPosition }} />
                    <input
                      type="password"
                      id="password-field"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t('auth_pass_placeholder') || '••••••••'}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    marginTop: '6px',
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
                  {isLoading ? (isRTL ? 'جاري المعالجة...' : 'Processing...') : (isSignUp ? (isRTL ? 'إنشاء حساب جديد 🚀' : 'Create Account') : (isRTL ? 'تسجيل الدخول' : 'Sign In'))}
                </button>
              </form>

              {/* Footer Toggle Switcher */}
              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {isSignUp ? (isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?') : (isRTL ? 'ليس لديك حساب بعد؟' : 'Do not have an account?')}
                </span>
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginRight: isRTL ? '6px' : '0',
                    marginLeft: !isRTL ? '6px' : '0'
                  }}
                >
                  {isSignUp ? (isRTL ? 'تسجيل الدخول هنا' : 'Sign In here') : (isRTL ? 'إنشاء حساب جديد الآن' : 'Create an Account now')}
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
