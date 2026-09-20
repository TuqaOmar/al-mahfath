import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  Copy, 
  Check, 
  Layers, 
  Calendar, 
  Clock, 
  Award, 
  Plus, 
  Share2,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherGroupsView = ({ onViewStudentsInGroup }) => {
  const { user } = useAuth();
  const { lang, isRTL } = useLanguage();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const teacherId = user?.uid || 'teacher_aisha';
      const res = await fetch(`/api/groups?teacherId=${teacherId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups(data.groups);
      }
    } catch (e) {
      console.error('Failed to load groups:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {lang === 'ar' ? 'إدارة حلقاتي القرآنية' : 'My Quran Groups'}
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {lang === 'ar' ? 'عرض الحلقات المشرفة عليها ورموز الدعوة المخصصة لكل حلقة' : 'View your supervised groups and their invitation codes'}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          جاري تحميل الحلقات...
        </div>
      ) : groups.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
          <Layers size={40} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>لا توجد حلقات مسجلة حالياً</h4>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                padding: '24px',
                borderRadius: '22px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {group.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      المعلمة: {group.teacherName}
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)' }}>
                  نشطة
                </span>
              </div>

              {group.description && (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {group.description}
                </p>
              )}

              {/* Group Code Card */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'var(--bg-color)',
                border: '1px dashed var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>رمز دعوة الطالبات:</span>
                  <strong style={{ fontSize: '16px', color: 'var(--primary)', letterSpacing: '1px' }}>{group.code}</strong>
                </div>

                <button
                  onClick={() => handleCopy(group.code)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: copiedCode === group.code ? '#10B981' : 'var(--bg-surface)',
                    color: copiedCode === group.code ? '#FFFFFF' : 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copiedCode === group.code ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode === group.code ? 'تم النسخ!' : 'نسخ الرمز'}</span>
                </button>
              </div>

              {/* Group Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', borderRadius: '12px', background: 'var(--bg-color)' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الطالبات</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{group.membersCount}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>المقرر</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{group.targetJuz || '1 - 3'}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الموعد</span>
                  <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{group.schedule?.days || 'يومياً'}</strong>
                </div>
              </div>

              <button
                onClick={() => onViewStudentsInGroup && onViewStudentsInGroup(group.id)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Users size={16} />
                <span>عرض طالبات هذه الحلقة</span>
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
