import React from 'react';
import { BookOpen, Sparkles, Compass, ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';

export const MobileWelcomeView = ({ onOpenAuth, onDemoLogin }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom)) 20px',
        boxSizing: 'border-box',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Brand Area */}
      <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', zIndex: 1 }}>
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '26px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <BookOpen size={42} color="#ffffff" strokeWidth={2.2} />
        </div>

        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              margin: '0 0 6px 0',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            مُحَفِّظ AI
          </h1>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <Sparkles size={14} />
            <span>رفيقك المتقن في تحفيظ القرآن الكريم</span>
          </div>
        </div>
      </div>

      {/* Center Highlights */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '340px',
          margin: '20px auto',
          width: '100%',
          zIndex: 1
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'right'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              منهجية الحصون الخمسة
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              حفظ متين، مراجعة قريبة وبعيدة، وتلاوة يومية
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'right'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              تسميع ذكي وتصحيح فوري
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              كشف اللحن الجلي وتظليل الآيات مباشرة بصوتك
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions for Mobile */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          maxWidth: '360px',
          margin: '0 auto',
          zIndex: 1
        }}
      >
        <button
          onClick={() => onOpenAuth('signup')}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px var(--primary-glow)'
          }}
        >
          <span>ابدأ رحلة الحفظ الآن</span>
          <ArrowLeft size={18} />
        </button>

        <button
          onClick={() => onOpenAuth('login')}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--card-border)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <LogIn size={16} />
          <span>لدي حساب بالفعل (تسجيل الدخول)</span>
        </button>

        {onDemoLogin && (
          <button
            onClick={onDemoLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '8px',
              marginTop: '4px',
              textDecoration: 'underline'
            }}
          >
            تجربة فورية سريعة بحساب تجريبي
          </button>
        )}
      </div>
    </div>
  );
};
