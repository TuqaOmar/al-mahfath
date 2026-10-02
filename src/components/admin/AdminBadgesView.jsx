import React from 'react';
import { Award } from 'lucide-react';

export const AdminBadgesView = ({ badges }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '24px', borderRadius: '22px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              إدارة الأوسمة والمكافآت التقديرية 🏆
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              تحكم بأنواع الأوسمة وشروط الحصول عليها أو امنح الأوسمة يدوياً للمتميزين.
            </p>
          </div>
          <button style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            + إنشاء وسام جديد
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {badges.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              لا توجد أوسمة حالياً في النظام. قم بإنشاء وسام جديد.
            </div>
          ) : (
            badges.map((badge) => (
              <div key={badge.id} style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: badge.bg || 'rgba(16, 185, 129, 0.1)', color: badge.color || '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={20} />
                    </div>
                    <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>{badge.name}</strong>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    نظام: {badge.type || 'تلقائي'}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {badge.desc || badge.description}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button style={{ flex: 1, padding: '6px', borderRadius: '8px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>تعديل الشروط</button>
                  {badge.type === 'يدوي' && (
                    <button style={{ flex: 1, padding: '6px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>منح لطالب</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
