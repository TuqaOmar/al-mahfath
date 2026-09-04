import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Save, CheckCircle2, Sparkles, Trophy, Flame, Shield, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { IslamicAvatarSelector } from './IslamicAvatarSelector';

export const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserData } = useAuth();
  const { lang, isRTL } = useLanguage();

  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setPhotoURL(user.photoURL || '');
      setShowAvatarPicker(false);
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(isRTL ? 'يرجى إدخال اسم صحيح' : 'Please enter a valid name');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedName = name.trim();
      const updatedPhoto = photoURL || user?.photoURL;

      // 1. Update AuthContext & localStorage
      await updateUserData({
        name: updatedName,
        photoURL: updatedPhoto
      });

      // 2. Sync with Backend Database API
      const targetUid = user?.uid;
      if (targetUid) {
        await fetch(`/api/user/${targetUid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updatedName,
            photoURL: updatedPhoto
          })
        });
      }

      setSuccessMsg(isRTL ? 'تم حفظ وتحديث الاسم والملف الشخصي بنجاح! ✨' : 'Profile updated successfully! ✨');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMsg(isRTL ? 'تعذر حفظ التعديلات، يرجى المحاولة مرة أخرى' : 'Failed to save changes, please try again');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              left: isRTL ? '20px' : 'auto',
              right: isRTL ? 'auto' : '20px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <User size={26} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              {isRTL ? 'الملف الشخصي وتعديل الاسم' : 'User Profile & Display Name'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {isRTL ? 'خصص اسمك وصورتك الرمزية في رحلة حفظ القرآن' : 'Customize your name and avatar for your Quran journey'}
            </p>
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}>
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '18px'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Profile Overview Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '18px',
            borderRadius: '18px',
            background: 'var(--bg-color)',
            border: '1px solid var(--glass-border)',
            marginBottom: '20px'
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'}
                alt="Avatar"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: '2px solid var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isRTL ? 'تغيير الصورة الرمزية' : 'Change Avatar'}
              >
                <Camera size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} />
              {showAvatarPicker ? (isRTL ? 'إخفاء خيارات الصور' : 'Hide Avatars') : (isRTL ? 'اختر صورة رمزية إسلامية مناسبة' : 'Choose Islamic Avatar')}
            </button>

            {/* Avatar Selector Panel */}
            {showAvatarPicker && (
              <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <IslamicAvatarSelector
                  currentAvatar={photoURL}
                  onSelectAvatar={(newAvatarUrl) => {
                    setPhotoURL(newAvatarUrl);
                    setShowAvatarPicker(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Display Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isRTL ? 'اسم العرض في المنصة (الاسم الشخصي):' : 'Display Name in Platform:'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: isRTL ? '14px' : 'auto',
                  left: isRTL ? 'auto' : '14px',
                  color: 'var(--text-secondary)'
                }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRTL ? 'اكتب اسمك المفضل (مثال: تقى عمر)' : 'e.g. Tuaa Omar'}
                  style={{
                    width: '100%',
                    padding: isRTL ? '12px 42px 12px 14px' : '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    fontWeight: 500
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                {isRTL ? '💡 سيظهر هذا الاسم في رسائل الترحيب، لوحة الشرف، والشهادات.' : '💡 This name appears in greetings, badges, and certificates.'}
              </span>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isRTL ? 'البريد الإلكتروني الموثق:' : 'Verified Email Address:'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: isRTL ? '14px' : 'auto',
                  left: isRTL ? 'auto' : '14px',
                  color: 'var(--text-secondary)'
                }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  style={{
                    width: '100%',
                    padding: isRTL ? '12px 42px 12px 14px' : '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                    direction: 'ltr',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                />
              </div>
            </div>

            {/* Account Stats Preview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '12px',
              borderRadius: '14px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isRTL ? 'المستوى' : 'Level'}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>⭐ {user?.level || 1}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isRTL ? 'الالتزام' : 'Streak'}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B' }}>🔥 {user?.streak || 1} {isRTL ? 'يوم' : 'd'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isRTL ? 'الحصون' : 'Fortresses'}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6' }}>🛡️ 5</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: isSaving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Save size={18} />
                {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التعديلات' : 'Save Changes')}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default UserProfileModal;
