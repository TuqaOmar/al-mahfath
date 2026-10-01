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

  // ONLY SHOW ROLE SWITCHER FOR THE SUPER ADMIN
  if (user?.email !== 'tuqaabudahab@gmail.com') {
    return null;
  }

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
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: `${activeOption.color}15`,
            color: activeOption.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)' }}>
              {activeOption.title}
            </strong>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {activeOption.badge}
            </span>
          </div>
        </div>
        <ChevronDown size={16} color="var(--text-secondary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0, right: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '8px',
          zIndex: 50,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {roles.map((r) => {
            const isActive = r.id === activeOption.id;
            const RIcon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  background: isActive ? `${r.color}10` : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '8px',
                  background: `${r.color}15`,
                  color: r.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <RIcon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: isActive ? r.color : 'var(--text-primary)' }}>
                    {r.title}
                  </strong>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {r.subtitle}
                  </span>
                </div>
                {isActive && <Check size={16} color={r.color} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
