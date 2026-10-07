import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useUiConfiguration } from '../lib/uiConfiguration';
import { getNavigation, isNavItemActive } from '../lib/navigation';
import { PWAInstallButton } from './PWAInstallButton';

/**
 * Mobile "More" sheet: every section that is not pinned to the bottom bar,
 * grouped the same way as the desktop sidebar.
 */
export const MoreToolsModal = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { lang } = useLanguage();
  const { activeRole } = useAuth();
  const { configuration } = useUiConfiguration();

  if (!isOpen) return null;

  const { primary, sections } = getNavigation(activeRole || 'user', lang, configuration);
  const groups = sections
    .map(section => ({ ...section, items: section.items.filter(entry => !primary.includes(entry.id)) }))
    .filter(section => section.items.length > 0);

  return (
    <div
      id="more-tools-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <motion.div
        id="more-tools-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'ar' ? 'المزيد' : 'More'}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-surface)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--glass-border)', margin: '0 auto 12px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {lang === 'ar' ? 'المزيد' : 'More'}
          </h3>
          <button
            id="more-tools-close-btn"
            onClick={onClose}
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
            style={{
              background: 'var(--bg-color)',
              border: 'none',
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
        </div>

        <PWAInstallButton style={{ justifyContent: 'center', marginTop: '8px' }} />

        {groups.map(group => (
          <section key={group.title} style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              {group.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
              {group.items.map(entry => {
                const Icon = entry.icon;
                const isSelected = isNavItemActive(entry.id, activeTab);
                return (
                  <button
                    key={entry.id}
                    id={`more-tool-item-${entry.id}`}
                    aria-current={isSelected ? 'page' : undefined}
                    onClick={() => {
                      setActiveTab(entry.id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      minHeight: '84px',
                      padding: '12px 6px',
                      borderRadius: '16px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-color)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Icon size={22} color="var(--primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>
                      {entry.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </motion.div>
    </div>
  );
};
