import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  BookOpen, 
  ChevronDown, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RoleSwitcher = ({ onRoleChanged }) => {
  const { user, updateUserData } = useAuth();
  const { lang, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    {
      id: 'student_safar',
      title: 'طالبة في سَفَر',
      subtitle: 'حلقة النور والهدى (أ. عائشة)',
      role: 'user',
      isSafarMember: true,
      groupName: 'حلقة النور والهدى',
      groupId: 'g_nur',
      teacherName: 'أ. عائشة العتيبي',
      icon: Users,
      color: '#10B981',
      badge: 'طالبة حلقة'
    },
    {
      id: 'teacher',
      title: 'معلمة حلقة (أ. عائشة)',
      subtitle: 'إشراف على 24 طالبة وتنبيهات',
      role: 'teacher',
      isSafarMember: true,
      icon: GraduationCap,
      color: '#8B5CF6',
      badge: 'معلمة'
    },
    {
      id: 'admin',
      title: 'مدير المنصة (Admin)',
      subtitle: 'إحصائيات كاملة وإدارة الأدوار',
      role: 'admin',
      icon: ShieldCheck,
      color: '#EF4444',
      badge: 'المدير'
    },
    {
      id: 'student_independent',
      title: 'حافظ مستقل (دون حلقة)',
      subtitle: 'حفظ شخصي واستكشاف المصحف',
      role: 'user',
      isSafarMember: false,
      groupName: null,
      groupId: null,
      teacherName: null,
      icon: BookOpen,
      color: '#F59E0B',
      badge: 'مستقل'
    }
  ];

  // Determine currently active preview
  const currentActiveRole = user?.role === 'admin' 
    ? 'admin' 
    : (user?.role === 'teacher' ? 'teacher' : (user?.isSafarMember ? 'student_safar' : 'student_independent'));

  const activeOption = roles.find(r => r.id === currentActiveRole) || roles[0];

  const handleSelect = (r) => {
    setIsOpen(false);
    if (updateUserData) {
      if (r.id === 'teacher') {
        updateUserData({
          role: 'teacher',
          name: 'أ. عائشة العتيبي',
          email: 'aisha@safar.org',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AishaTeacher',
          isSafarMember: true,
          groupId: 'g_nur',
          groupName: 'حلقة النور والهدى'
        });
      } else if (r.id === 'admin') {
        updateUserData({
          role: 'admin',
          name: 'مدير منصة سَفَر',
          email: 'admin@ma7fath.ai',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminSafar'
        });
      } else if (r.id === 'student_safar') {
        updateUserData({
          role: 'user',
          name: 'سارة الخالدي',
          email: 'sara@safar.org',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaraKh',
          isSafarMember: true,
          groupId: 'g_nur',
          groupName: 'حلقة النور والهدى',
          teacherName: 'أ. عائشة العتيبي'
        });
      } else {
        updateUserData({
          role: 'user',
          name: 'أحمد محمد',
          email: 'ahmad@example.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
          isSafarMember: false,
          groupId: null,
          groupName: null,
          teacherName: null
        });
      }
    }
    if (onRoleChanged) onRoleChanged(r.role);
  };

  const Icon = activeOption.icon;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '14px',
          background: 'var(--bg-color)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '12.5px',
          fontWeight: 700,
          transition: 'all 0.15s ease'
        }}
        title="تبديل الدور لتجربة واجهات المعلمة، المدير، والطالب"
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          background: `${activeOption.color}20`,
          color: activeOption.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={14} />
        </div>
        <span>{activeOption.badge}</span>
        <ChevronDown size={14} color="var(--text-secondary)" />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: isRTL ? 0 : 'auto',
            right: isRTL ? 'auto' : 0,
            width: '280px',
            background: 'var(--bg-surface)',
            borderRadius: '18px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
            zIndex: 50,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ padding: '8px 12px 6px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              تبديل تجربة العرض الفوري (Role Preview):
            </div>

            {roles.map((r) => {
              const isCurrent = r.id === currentActiveRole;
              const RIcon = r.icon;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isCurrent ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-color)'; }}
                  onMouseOut={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${r.color}18`,
                      color: r.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <RIcon size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>{r.title}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.subtitle}</span>
                    </div>
                  </div>

                  {isCurrent && <Check size={16} color="var(--primary)" />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
