import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Sparkles, Shield, Trophy, X, ChevronRight, Award, Circle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    triggerCelebration,
    toast
  } = useNotifications();

  const { lang, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'achievements' | 'unread'
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'achievements') return n.type === 'wird' || n.type === 'mindmap' || n.type === 'badge' || n.type === 'achievement';
    return true;
  });

  const getItemIcon = (n) => {
    if (n.icon) return <span style={{ fontSize: '18px' }}>{n.icon}</span>;
    switch (n.type) {
      case 'wird':
        return <Shield size={18} color="#10B981" />;
      case 'mindmap':
        return <Sparkles size={18} color="#8B5CF6" />;
      case 'badge':
        return <Trophy size={18} color="#F59E0B" />;
      default:
        return <Award size={18} color="#3B82F6" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      
      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-surface)',
              border: '2px solid var(--primary)',
              borderRadius: '16px',
              padding: '12px 20px',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '380px',
              width: '90%'
            }}
          >
            <div style={{ fontSize: '22px' }}>{toast.icon || '🎉'}</div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{toast.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{toast.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          background: isOpen ? 'var(--primary-light)' : 'var(--bg-color)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--glass-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        title={lang === 'ar' ? 'الإشعارات والإنجازات' : 'Notifications & Achievements'}
      >
        <Bell size={20} color={isOpen ? 'var(--primary)' : 'var(--text-secondary)'} />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#EF4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '10px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              border: '2px solid var(--bg-surface)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              top: '50px',
              left: isRTL ? '0' : 'auto',
              right: isRTL ? 'auto' : '0',
              width: '360px',
              maxWidth: '92vw',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
              zIndex: 9999,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {lang === 'ar' ? 'الإشعارات والإنجازات' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {unreadCount} {lang === 'ar' ? 'جديد' : 'new'}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCheck size={14} />
                  {lang === 'ar' ? 'مقروء للكل' : 'Mark all read'}
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', padding: '4px 8px', gap: '4px', background: 'var(--bg-surface)' }}>
              {[
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'achievements', labelAr: '🏆 الإنجازات', labelEn: '🏆 Achievements' },
                { id: 'unread', labelAr: 'غير مقروء', labelEn: 'Unread' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
              {filteredNotifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Sparkles size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    {lang === 'ar' ? 'لا توجد إشعارات في هذا القسم حالياً.' : 'No notifications found.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.type === 'wird' || n.type === 'mindmap' || n.type === 'badge' || n.type === 'achievement') {
                        triggerCelebration({
                          title: n.title,
                          message: n.message,
                          type: n.type,
                          xpBonus: n.xpBonus || 50
                        });
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: n.read ? 'transparent' : 'rgba(16, 185, 129, 0.06)',
                      border: `1px solid ${n.read ? 'transparent' : 'var(--primary-light)'}`,
                      marginBottom: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getItemIcon(n)}
                    </div>

                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: n.read ? 'normal' : 'bold', color: 'var(--text-primary)' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{n.timestamp}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        opacity: 0.6
                      }}
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {notifications.length} {lang === 'ar' ? 'إشعارات محفوظة' : 'notifications'}
                </span>
                <button
                  onClick={clearAll}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
