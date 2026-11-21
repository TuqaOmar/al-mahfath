import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { useLanguage } from '../context/LanguageContext';
import { isNativeMobile, getPlatform } from '../utils/platform';

// "Later" hides the prompt for this version for one day.
const SNOOZE_KEY = 'ma7fath_update_snooze';
const SNOOZE_MS = 24 * 60 * 60 * 1000;
// Apple ID of the app (the number in https://apps.apple.com/app/id123456789) — required to open the App Store on iOS.
const IOS_APP_STORE_ID = import.meta.env.VITE_IOS_APP_STORE_ID;

const versionOf = (info) => info.availableVersionName || info.availableVersionCode || '';

const isSnoozed = (version) => {
  try {
    const snooze = JSON.parse(localStorage.getItem(SNOOZE_KEY) || 'null');
    return snooze?.version === version && Date.now() < snooze.until;
  } catch {
    return false;
  }
};

export const AppUpdatePrompt = () => {
  const { isRTL } = useLanguage();
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (!isNativeMobile()) return;
    if (getPlatform() === 'ios' && !IOS_APP_STORE_ID) return;

    let cancelled = false;
    AppUpdate.getAppUpdateInfo()
      .then((info) => {
        if (cancelled || info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
        if (isSnoozed(versionOf(info))) return;
        setUpdateInfo(info);
      })
      // Fails when the app was not installed from the store (debug builds, sideloaded APKs).
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!updateInfo) return null;

  const handleLater = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify({ version: versionOf(updateInfo), until: Date.now() + SNOOZE_MS }));
    } catch { /* storage unavailable — prompt simply returns next launch */ }
    setUpdateInfo(null);
  };

  const handleUpdate = async () => {
    try {
      if (getPlatform() === 'android' && updateInfo.immediateUpdateAllowed) {
        // Google Play's own full-screen update flow, without leaving the app.
        await AppUpdate.performImmediateUpdate();
      } else {
        await AppUpdate.openAppStore(getPlatform() === 'ios' ? { appId: IOS_APP_STORE_ID } : undefined);
      }
    } catch {
      await AppUpdate.openAppStore(getPlatform() === 'ios' ? { appId: IOS_APP_STORE_ID } : undefined).catch(() => {});
    }
    setUpdateInfo(null);
  };

  const version = updateInfo.availableVersionName;

  return (
    <AnimatePresence>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(2, 6, 23, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-update-title"
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.94 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
            border: '2px solid #10B981',
            borderRadius: '24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45), 0 0 30px rgba(16, 185, 129, 0.3)',
            padding: '24px',
            color: 'white',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          <button
            onClick={handleLater}
            aria-label={isRTL ? 'إغلاق' : 'Close'}
            style={{
              position: 'absolute',
              top: '14px',
              insetInlineEnd: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>

          <div style={{
            width: '60px',
            height: '60px',
            margin: '4px auto 14px',
            borderRadius: '18px',
            background: 'rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Download size={28} />
          </div>

          <h3 id="app-update-title" style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 'bold' }}>
            {isRTL ? 'يتوفر تحديث جديد' : 'A new update is available'}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#E2E8F0', lineHeight: 1.7 }}>
            {isRTL
              ? `حدّث تطبيق المحفظ${version ? ` إلى الإصدار ${version}` : ''} لتحصل على أحدث الميزات والإصلاحات.`
              : `Update the app${version ? ` to version ${version}` : ''} to get the latest features and fixes.`}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleUpdate}
              style={{
                flex: '1 1 160px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isRTL ? 'تحديث الآن' : 'Update now'}
            </button>
            <button
              onClick={handleLater}
              style={{
                flex: '1 1 100px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#E2E8F0',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {isRTL ? 'لاحقًا' : 'Later'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppUpdatePrompt;
