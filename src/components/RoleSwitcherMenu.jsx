import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, GraduationCap, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBackHandler } from '../hooks/useBackHandler';

const roleIcons = { user: BookOpen, teacher: GraduationCap, admin: ShieldCheck };

/**
 * Top-bar menu for multi-role accounts: the user picks one role and the
 * navigation shows only that role's sections. Hidden for single-role accounts.
 */
export const RoleSwitcherMenu = ({ isMobile = false }) => {
  const { activeRole, availableRoles, setActiveRole } = useAuth();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  useBackHandler(isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (availableRoles.length < 2) return null;

  const ar = lang === 'ar';
  const roles = {
    user: { label: ar ? 'طالب' : 'Student', hint: ar ? 'حفظي ومراجعتي وأدواتي' : 'My memorization and tools' },
    teacher: { label: ar ? 'معلم' : 'Teacher', hint: ar ? 'طلابي وحلقاتي وتقاريري' : 'My students, circles and reports' },
    admin: { label: ar ? 'إداري' : 'Admin', hint: ar ? 'إدارة المنصة والمستخدمين' : 'Platform and user management' }
  };
  const current = roles[activeRole] ? activeRole : availableRoles[0];
  const CurrentIcon = roleIcons[current];

  const chooseRole = (role) => {
    setIsOpen(false);
    if (role !== activeRole) setActiveRole(role);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        id="active-role-switcher"
        type="button"
        data-active-role={current}
        onClick={() => setIsOpen(open => !open)}
        aria-label={ar ? `الدور الحالي: ${roles[current].label}. تبديل الدور` : `Current role: ${roles[current].label}. Switch role`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: isMobile ? '0 8px' : '0 12px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          background: isOpen ? 'var(--primary-light)' : 'var(--bg-color)',
          color: isOpen ? 'var(--primary)' : 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        <CurrentIcon size={16} color="var(--primary)" />
        <span>{roles[current].label}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div
          id="active-role-menu"
          role="menu"
          aria-label={ar ? 'اختيار الدور' : 'Choose role'}
          style={{
            position: 'absolute',
            top: '48px',
            insetInlineEnd: 0,
            width: isMobile ? 'min(250px, calc(100vw - 24px))' : '250px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
            padding: '6px',
            zIndex: 110,
            boxSizing: 'border-box',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ padding: '8px 10px 6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {ar ? 'الدخول بصفة' : 'Continue as'}
          </div>
          {availableRoles.map(role => {
            const Icon = roleIcons[role];
            const isActive = role === current;
            return (
              <button
                key={role}
                id={`role-option-${role}`}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => chooseRole(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  minHeight: '52px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  textAlign: 'start'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>{roles[role].label}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{roles[role].hint}</span>
                </span>
                {isActive && <Check size={16} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
