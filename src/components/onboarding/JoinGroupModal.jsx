import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  X, 
  BookOpen, 
  ShieldCheck, 
  UserCheck, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

export const JoinGroupModal = ({ isOpen, onClose, onJoined }) => {
  const { user, refreshUserData } = useAuth();
  const { lang, isRTL } = useLanguage();

  const [step, setStep] = useState('prompt'); // 'prompt' | 'enter_code' | 'confirm_group' | 'confirm_leave' | 'success'
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundGroup, setFoundGroup] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setGroupCode('');
      setErrorMsg('');
      setFoundGroup(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;



  const handleLookup = async (codeToSearch) => {
    const code = (codeToSearch || groupCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رمز الحلقة أولاً' : 'Please enter a group code');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/groups/lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.success && data.group) {
        setFoundGroup(data.group);
        setStep('confirm_group');
      } else {
        setErrorMsg(data.message || (lang === 'ar' ? 'رمز الحلقة غير صحيح أو لم يعد متاحاً' : 'Invalid group code'));
      }
    } catch (err) {
      console.error('Group lookup error:', err);
      setErrorMsg(lang === 'ar' ? 'تعذر الاتصال بالخادم للتحقق من الرمز' : 'Could not verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!foundGroup) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchWithAuth('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: foundGroup.code
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUserData();
        setStep('success');
        if (onJoined) onJoined(foundGroup);
      } else {
        setErrorMsg(data.message || (lang === 'ar' ? 'فشل الانضمام للحلقة' : 'Failed to join group'));
      }
    } catch (err) {
      console.error('Join group error:', err);
      setErrorMsg(lang === 'ar' ? 'حدث خطأ أثناء الانضمام' : 'Error joining group');
    } finally {
      setLoading(false);
    }
  };

  // A student who is not in a circle has nothing to leave; a member must confirm first.
  const handleContinueIndependent = () => {
    if (user?.isSafarMember) {
      setErrorMsg('');
      setStep('confirm_leave');
    } else {
      onClose();
    }
  };

  const handleConfirmLeave = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchWithAuth('/api/groups/leave', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر الخروج من الحلقة');
      await refreshUserData();
      onClose();
    } catch (error) {
      console.error('Leave group error:', error);
      setErrorMsg(error.message || (lang === 'ar' ? 'تعذر الخروج من الحلقة' : 'Could not leave the group'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Top Header Banner */}
        <div style={{
          padding: '24px 24px 18px 24px',
          background: 'linear-gradient(135deg, #064E3B 0%, #0F766E 50%, #065F46 100%)',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            aria-label={lang === 'ar' ? 'إغلاق نافذة الحلقة' : 'Close group dialog'}
            style={{
              position: 'absolute',
              top: '16px',
              left: isRTL ? '16px' : 'auto',
              right: isRTL ? 'auto' : '16px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', marginBottom: '8px' }}>
            <Sparkles size={14} /> سَفَر للقرآن الكريم
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800 }}>
            {lang === 'ar' ? 'مرحباً بك في سَفَر 🌿' : 'Welcome to Safar 🌿'}
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#D1FAE5', lineHeight: 1.5 }}>
            {lang === 'ar' 
              ? 'رحلتك المباركة في إتقان حفظ كتاب الله ومراجعته بوعي ومنهجية رصينة'
              : 'Your blessed journey in mastering Quran memorization and structured revision'}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: INITIAL PROMPT */}
          {step === 'prompt' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Users size={32} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {lang === 'ar' ? 'هل لديك رمز دعوة للانضمام إلى حلقة؟' : 'Do you have an invitation code to join a group?'}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {lang === 'ar'
                  ? 'يمكنك الانضمام لحلقة مع معلمتك ومتابعة وردك مع مجموعتك، أو يمكنك المتابعة بحرية كاملة كحافظ مستقل.'
                  : 'You can join a group to learn with your teacher, or continue as an independent learner.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Option 1: Join a Group */}
                <button
                  onClick={() => setStep('enter_code')}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Key size={18} />
                  <span>{lang === 'ar' ? 'انضم إلى حلقة (رمز دعوة)' : 'Join a Group (with Code)'}</span>
                </button>

                {/* Option 2: Continue Without a Group */}
                <button
                  onClick={handleContinueIndependent}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '16px',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <BookOpen size={16} />
                  <span>
                    {user?.isSafarMember
                      ? (lang === 'ar' ? 'الخروج من الحلقة والمتابعة كحافظ مستقل' : 'Leave Group and Continue Independently')
                      : (lang === 'ar' ? 'المتابعة كحافظ مستقل دون حلقة' : 'Continue Without a Group')}
                  </span>
                </button>
              </div>

              <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {lang === 'ar' ? '💡 لا تشترط المنصة الانضمام لحلقة للاستفادة من كامل المصحف والتسميع الذكي.' : 'You can always join a group later.'}
              </div>
            </div>
          )}

          {/* STEP 2: ENTER GROUP CODE */}
          {step === 'enter_code' && (
            <div>
              <button
                onClick={() => setStep('prompt')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '16px'
                }}
              >
                <ArrowRight size={14} style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
                <span>{lang === 'ar' ? 'الرجوع للخلف' : 'Back'}</span>
              </button>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {lang === 'ar' ? 'أدخل رمز الحلقة (Group Code)' : 'Enter Group Code'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                {lang === 'ar'
                  ? 'اكتب الرمز المكون من حروف وأرقام الذي زودتك به معلمتك'
                  : 'Enter the code provided by your teacher'}
              </p>

              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'رمز الدعوة من المعلم' : 'Invitation code from your teacher'}
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: '2px solid var(--primary)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleLookup()}
                  disabled={loading || !groupCode.trim()}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading || !groupCode.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !groupCode.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? 'جارٍ التحقق...' : 'التحقق والبحث عن الحلقة'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM FOUND GROUP */}
          {step === 'confirm_group' && foundGroup && (
            <div>
              <div style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                  <CheckCircle size={18} />
                  <span>{lang === 'ar' ? 'تم العثور على الحلقة بنجاح 🌿' : 'Group Found!'}</span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                    {lang === 'ar' ? 'اسم الحلقة:' : 'Group Name:'}
                  </span>
                  <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                    {foundGroup.name}
                  </h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-surface)', borderRadius: '12px', marginBottom: '12px' }}>
                  <img
                    src={foundGroup.teacherAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha'}
                    alt={foundGroup.teacherName}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary)' }}
                  />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>المعلمة المشرفة:</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{foundGroup.teacherName}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>عدد الطالبات:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{foundGroup.membersCount} طالبة</strong>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>المقرر الحالي:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{foundGroup.targetJuz || 'الأجزاء 1 - 3'}</strong>
                  </div>
                </div>
              </div>

              {foundGroup.description && (
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                  {foundGroup.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep('enter_code')}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'ar' ? 'تغيير الرمز' : 'Change Code'}
                </button>

                <button
                  onClick={handleConfirmJoin}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <UserCheck size={18} />
                  <span>{loading ? 'جارٍ الانضمام...' : 'تأكيد الانضمام للحلقة'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CONFIRM LEAVING THE CURRENT GROUP */}
          {step === 'confirm_leave' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <AlertCircle size={32} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {lang === 'ar'
                  ? `هل تريدين الخروج من ${user?.groupName || 'حلقتك'}؟`
                  : `Leave ${user?.groupName || 'your group'}?`}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {lang === 'ar'
                  ? 'ستتوقف متابعة المعلمة لوردك وتسميعك، ولن تظهري في قائمة طالبات الحلقة. يمكنك الانضمام مجددًا لاحقًا برمز الدعوة.'
                  : 'Your teacher will no longer follow your progress and you will be removed from the group roster. You can rejoin later with the invite code.'}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep('prompt')}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'ar' ? 'البقاء في الحلقة' : 'Stay in Group'}
                </button>

                <button
                  onClick={handleConfirmLeave}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading
                    ? (lang === 'ar' ? 'جارٍ الخروج...' : 'Leaving...')
                    : (lang === 'ar' ? 'نعم، الخروج من الحلقة' : 'Yes, Leave Group')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <CheckCircle size={36} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {lang === 'ar' ? 'مرحباً بك في حلقتك القرآنية! 🌿' : 'Successfully Joined!'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                {lang === 'ar'
                  ? `أصبحتِ الآن عضوة رسمية في "${foundGroup?.name}". يمكنك مشاركة تلاواتك ومتابعة تقييم معلمتك مباشرة.`
                  : `You are now part of ${foundGroup?.name}.`}
              </p>

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {lang === 'ar' ? 'الانتقال إلى لوحتي القرآنية 🚀' : 'Go to Dashboard'}
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
