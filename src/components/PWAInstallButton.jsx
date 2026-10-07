import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const GUIDE_STEPS = {
  ios: {
    title: 'تثبيت التطبيق على آيفون / آيباد',
    intro: 'افتحي الموقع في متصفح Safari ثم:',
    steps: [
      <>اضغطي زر <strong>مشاركة (Share)</strong> أسفل شاشة Safari.</>,
      <>مرّري للأسفل واختاري <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</>
    ]
  },
  android: {
    title: 'تثبيت التطبيق على أندرويد',
    intro: 'من متصفح Chrome:',
    steps: [
      <>اضغطي <strong>قائمة المتصفح ⋮</strong> أعلى الشاشة.</>,
      <>اختاري <strong>تثبيت التطبيق (Install app)</strong> أو <strong>إضافة إلى الشاشة الرئيسية</strong>.</>
    ]
  }
};

export const PWAInstallButton = ({ collapsed = false, style = {} }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [guide, setGuide] = useState(null);

  if (isInstalled) return null;
  // Desktop browser without an install prompt: nothing useful to offer.
  if (!isInstallable && !isIOS && !isAndroid) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    // iPhone never fires an install prompt; some Android browsers don't either.
    setGuide(isIOS ? 'ios' : 'android');
  };

  const content = guide && GUIDE_STEPS[guide];

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="تثبيت التطبيق على جهازك"
        aria-label="تثبيت التطبيق"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '8px',
          minHeight: '44px',
          padding: collapsed ? '8px' : '10px 14px',
          borderRadius: '12px',
          background: 'var(--primary)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
          width: collapsed ? '44px' : '100%',
          ...style
        }}
      >
        {isInstallable ? <Download size={17} /> : <Smartphone size={17} />}
        {!collapsed && <span>تثبيت التطبيق على جهازك</span>}
      </button>

      {content && (
        <div
          onClick={() => setGuide(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '24px',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
              direction: 'rtl',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 id="pwa-guide-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>{content.title}</h3>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setGuide(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: '44px', height: '44px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>{content.intro}</p>

            <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {content.steps.map((step, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--primary-light)', padding: '12px', borderRadius: '12px', fontSize: '14px', lineHeight: 1.7 }}>
                  <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setGuide(null)}
              style={{ width: '100%', minHeight: '44px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              حسنًا، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
