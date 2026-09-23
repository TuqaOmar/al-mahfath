import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton = ({ collapsed = false, style = {} }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running standalone, don't show
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop PWA install trigger
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="تثبيت التطبيق على جهازك"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: collapsed ? '8px' : '9px 14px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
          transition: 'all 0.2s ease',
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: collapsed ? '40px' : '100%',
          ...style
        }}
      >
        <Download size={16} />
        {!collapsed && <span>تثبيت التطبيق</span>}
      </button>
    );
  }

  // iOS Safari guide
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="تثبيت التطبيق على الآيفون"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: collapsed ? '8px' : '8px 12px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#E2E8F0',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: collapsed ? '40px' : '100%',
            ...style
          }}
        >
          <Smartphone size={15} color="#10B981" />
          {!collapsed && <span>تثبيت على الآيفون</span>}
        </button>

        {showIOSGuide && (
          <div 
            onClick={() => setShowIOSGuide(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '24px',
                color: '#F8FAFC',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                direction: 'rtl',
                textAlign: 'right'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={20} color="#10B981" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>تثبيت التطبيق على آيفون / آيباد</h3>
                </div>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                يمكنك تشغيل التطبيق في وضع الشاشة الكاملة وبدون إنترنت كأي تطبيق أصلي عبر الخطوتين التاليتين في متصفح Safari:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ background: '#10B981', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                  <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
                    اضغط على زر <strong>مشاركة (Share)</strong> 📤 أسفل شاشة Safari.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ background: '#10B981', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                  <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
                    مرر لأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> ➕.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#F8FAFC',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
