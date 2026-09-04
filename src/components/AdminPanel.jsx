import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Trash2, 
  Edit2, 
  Search, 
  Save, 
  X, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Card } from './ui/Card';

export const AdminPanel = ({ onSwitchToHome }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    level: 1,
    xp: 0,
    memorizedPagesCount: 0,
    totalJuz: 0
  });

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showFeedback = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
      showFeedback('فشل تحميل قائمة المستخدمين من الخادم', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (uid) => {
    try {
      const res = await fetch(`/api/admin/user/${uid}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.success) {
        setUsers(prev => prev.filter(u => u.uid !== uid));
        setUserToDelete(null);
        showFeedback('تم حذف الحساب بنجاح');
      } else {
        showFeedback('تعذر حذف الحساب', 'error');
      }
    } catch (e) {
      console.error('Error deleting user:', e);
      showFeedback('حدث خطأ أثناء محاولة الحذف', 'error');
    }
  };

  const handleStartEdit = (user) => {
    if (!user) return;
    setEditingUserId(user.uid);
    setEditFormData({
      name: user.name || '',
      level: Number(user.level) || 1,
      xp: Number(user.xp) || 0,
      memorizedPagesCount: Number(user.memorizedPagesCount) || 0,
      totalJuz: Number(user.totalJuz) || 0
    });
  };

  const handleSaveEdit = async (uid) => {
    try {
      const res = await fetch(`/api/admin/user/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (data && data.success && data.user) {
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data.user } : u));
        setEditingUserId(null);
        showFeedback('تم حفظ بيانات المستخدم وتحديث الإحصائيات بنجاح');
      } else {
        showFeedback('فشل حفظ التعديلات', 'error');
      }
    } catch (e) {
      console.error('Error updating user:', e);
      showFeedback('حدث خطأ في الاتصال بالخادم', 'error');
    }
  };

  // Safe search filtering
  const q = (searchQuery || '').trim().toLowerCase();
  const filteredUsers = (users || []).filter(u => {
    if (!u) return false;
    const name = String(u.name || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  // Statistics calculations safely
  const totalUsers = users.length;
  const totalPages = users.reduce((sum, u) => sum + (Number(u?.memorizedPagesCount) || 0), 0);
  const averageStreak = totalUsers > 0 
    ? Math.round(users.reduce((sum, u) => sum + (Number(u?.streak) || 0), 0) / totalUsers) 
    : 0;
  const averageXp = totalUsers > 0 
    ? Math.round(users.reduce((sum, u) => sum + (Number(u?.xp) || 0), 0) / totalUsers) 
    : 0;

  return (
    <div id="admin-panel-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Admin Header & Quick Controls */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--primary)" /> لوحة تحكم المشرف
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '14px' }}>
            إدارة حسابات الحفاظ، متابعة مستويات الإنجاز، والتحكم في بيانات المنصة.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>

          {onSwitchToHome && (
            <button
              onClick={onSwitchToHome}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              عرض واجهة الطالب
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {statusMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${statusMessage.type === 'error' ? '#EF4444' : 'var(--primary)'}`,
          color: statusMessage.type === 'error' ? '#EF4444' : 'var(--primary)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          {statusMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '12px' : '16px' }}>
        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>إجمالي المستخدمين</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : totalUsers}
          </p>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>الصفحات المحفوظة</span>
            <BookOpen size={18} color="#10B981" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : totalPages} صفحة
          </p>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>متوسط الالتزام</span>
            <Flame size={18} color="#F59E0B" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : averageStreak} يوم
          </p>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>متوسط النقاط</span>
            <Trophy size={18} color="#8B5CF6" />
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : averageXp} XP
          </p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card style={{ padding: isMobile ? '16px 12px' : '24px' }}>
        
        {/* Search Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="var(--primary)" /> حسابات الحفاظ ({filteredUsers.length})
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', width: isMobile ? '100%' : '320px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو البريد الإلكتروني..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', width: '100%' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            جاري تحميل الحسابات...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            لا يوجد مستخدمين يطابقون شروط البحث.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <th style={{ padding: '12px 8px' }}>المستخدم</th>
                  <th style={{ padding: '12px 8px' }}>المستوى / XP</th>
                  <th style={{ padding: '12px 8px' }}>المحفوظ</th>
                  <th style={{ padding: '12px 8px' }}>الالتزام</th>
                  <th style={{ padding: '12px 8px' }}>الرتبة</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isEditing = editingUserId === u.uid;
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px' }}>
                      
                      {/* Name and Email */}
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || 'User')}`} 
                            alt={u.name || 'User'} 
                            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', border: '1px solid var(--glass-border)', flexShrink: 0 }}
                          />
                          <div>
                            {isEditing ? (
                              <input 
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                              />
                            ) : (
                              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px' }}>{u.name || 'حافظ'}</strong>
                            )}
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Level and XP */}
                      <td style={{ padding: '14px 8px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input 
                              type="number"
                              title="المستوى"
                              value={editFormData.level}
                              onChange={(e) => setEditFormData({ ...editFormData, level: Number(e.target.value) })}
                              style={{ width: '50px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                            />
                            <input 
                              type="number"
                              title="XP النقاط"
                              value={editFormData.xp}
                              onChange={(e) => setEditFormData({ ...editFormData, xp: Number(e.target.value) })}
                              style={{ width: '65px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px' }}>المستوى {u.level || 1}</span>
                            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{u.xp || 0} XP</span>
                          </div>
                        )}
                      </td>

                      {/* Pages and Juz */}
                      <td style={{ padding: '14px 8px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input 
                              type="number"
                              title="عدد الصفحات"
                              value={editFormData.memorizedPagesCount}
                              onChange={(e) => setEditFormData({ ...editFormData, memorizedPagesCount: Number(e.target.value) })}
                              style={{ width: '55px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                            />
                            <input 
                              type="number"
                              step="0.1"
                              title="عدد الأجزاء"
                              value={editFormData.totalJuz}
                              onChange={(e) => setEditFormData({ ...editFormData, totalJuz: Number(e.target.value) })}
                              style={{ width: '55px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px' }}>{u.memorizedPagesCount || 0} صفحة</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.totalJuz || 0} جزء</span>
                          </div>
                        )}
                      </td>

                      {/* Streak */}
                      <td style={{ padding: '14px 8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                        🔥 {u.streak || 0} يوم
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: u.role === 'admin' ? '#8B5CF6' : 'var(--primary)'
                        }}>
                          {u.role === 'admin' ? 'مدير' : 'حافظ'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleSaveEdit(u.uid)}
                                style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                                title="حفظ"
                              >
                                <Save size={14} /> حفظ
                              </button>
                              <button 
                                onClick={() => setEditingUserId(null)}
                                style={{ background: 'var(--glass-border)', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                title="إلغاء"
                              >
                                <X size={14} /> إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleStartEdit(u)}
                                style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500 }}
                                title="تعديل الإحصائيات"
                              >
                                <Edit2 size={13} /> تعديل
                              </button>
                              {u.uid !== 'admin_123' && (
                                <button 
                                  onClick={() => setUserToDelete(u)}
                                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                  title="حذف الحساب"
                                >
                                  <Trash2 size={13} /> حذف
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </Card>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              تأكيد حذف حساب المستخدم
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              هل أنت متأكد من حذف حساب "{userToDelete.name || userToDelete.email}" نهائياً من قاعدة البيانات؟
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setUserToDelete(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete.uid)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
