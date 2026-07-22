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
  Brain,
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { Card } from './ui/Card';

export const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    level: 1,
    xp: 0,
    memorizedPagesCount: 0,
    totalJuz: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (uid) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً من النظام؟ لا يمكن التراجع عن هذا.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/user/${uid}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.uid !== uid));
        alert('تم حذف المستخدم بنجاح');
      }
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user.uid);
    setEditFormData({
      name: user.name || '',
      level: user.level || 1,
      xp: user.xp || 0,
      memorizedPagesCount: user.memorizedPagesCount || 0,
      totalJuz: user.totalJuz || 0
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
      if (data.success && data.user) {
        setUsers(users.map(u => u.uid === uid ? { ...u, ...data.user } : u));
        setEditingUserId(null);
        alert('تم تحديث بيانات المستخدم بنجاح');
      }
    } catch (e) {
      console.error('Error updating user:', e);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Statistics calculations
  const totalUsers = users.length;
  const totalPages = users.reduce((sum, u) => sum + (Number(u.memorizedPagesCount) || 0), 0);
  const averageStreak = totalUsers > 0 
    ? Math.round(users.reduce((sum, u) => sum + (Number(u.streak) || 0), 0) / totalUsers) 
    : 0;
  const averageXp = totalUsers > 0 
    ? Math.round(users.reduce((sum, u) => sum + (Number(u.xp) || 0), 0) / totalUsers) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Admin Header */}
      <div>
        <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          🛡️ لوحة التحكم الإدارية (Admin Panel)
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '15px' }}>
          مراقبة نشاط الحفاظ، إدارة الحسابات، وتعديل إحصائيات مستخدمي تطبيق محفظ AI.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>إجمالي المستخدمين</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : totalUsers} مستخدم
          </p>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>الصفحات المحفوظة كلياً</span>
            <BookOpen size={20} color="#10B981" />
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : totalPages} صفحة
          </p>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>متوسط الالتزام (الرباط)</span>
            <Flame size={20} color="#F59E0B" />
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : averageStreak} يوم متتالي
          </p>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>متوسط النقاط (XP)</span>
            <Trophy size={20} color="#8B5CF6" />
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : averageXp} XP
          </p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card style={{ padding: '24px' }}>
        
        {/* Search and Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>إدارة حسابات الحفاظ</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', minWidth: '300px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="ابحث باسم المستخدم أو البريد..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', width: '100%' }}
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>جاري جلب حسابات المستخدمين...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>لا يوجد مستخدمين مسجلين يطابقون البحث.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>المستخدم</th>
                  <th style={{ padding: '12px' }}>المستوى / النقاط</th>
                  <th style={{ padding: '12px' }}>المحفوظ (صفحة / جزء)</th>
                  <th style={{ padding: '12px' }}>صحبة القرآن</th>
                  <th style={{ padding: '12px' }}>نوع الحساب</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isEditing = editingUserId === u.uid;
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '14px', transition: 'background 0.2s' }}>
                      
                      {/* Name and Email */}
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'} 
                            alt={u.name} 
                            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', border: '1px solid var(--glass-border)' }}
                          />
                          <div>
                            {isEditing ? (
                              <input 
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
                              />
                            ) : (
                              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{u.name || 'حافظ جديد'}</strong>
                            )}
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Level and XP */}
                      <td style={{ padding: '16px 12px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="number"
                              title="المستوى"
                              value={editFormData.level}
                              onChange={(e) => setEditFormData({ ...editFormData, level: Number(e.target.value) })}
                              style={{ width: '50px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            />
                            <input 
                              type="number"
                              title="XP النقاط"
                              value={editFormData.xp}
                              onChange={(e) => setEditFormData({ ...editFormData, xp: Number(e.target.value) })}
                              style={{ width: '70px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-primary)' }}>المستوى {u.level || 1}</span>
                            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{u.xp || 0} XP</span>
                          </div>
                        )}
                      </td>

                      {/* Pages and Juz */}
                      <td style={{ padding: '16px 12px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="number"
                              title="عدد الصفحات"
                              value={editFormData.memorizedPagesCount}
                              onChange={(e) => setEditFormData({ ...editFormData, memorizedPagesCount: Number(e.target.value) })}
                              style={{ width: '60px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            />
                            <input 
                              type="number"
                              step="0.05"
                              title="عدد الأجزاء"
                              value={editFormData.totalJuz}
                              onChange={(e) => setEditFormData({ ...editFormData, totalJuz: Number(e.target.value) })}
                              style={{ width: '60px', padding: '4px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-primary)' }}>{u.memorizedPagesCount || 0} صفحة</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.totalJuz || 0} جزء</span>
                          </div>
                        )}
                      </td>

                      {/* Streak */}
                      <td style={{ padding: '16px 12px', color: 'var(--text-primary)' }}>
                        🔥 {u.streak || 1} يوم
                      </td>

                      {/* Role */}
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: u.role === 'admin' ? '#8B5CF6' : 'var(--primary)'
                        }}>
                          {u.role === 'admin' ? 'مدير' : 'مستخدم'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleSaveEdit(u.uid)}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="حفظ"
                              >
                                <Save size={14} /> حفظ
                              </button>
                              <button 
                                onClick={() => setEditingUserId(null)}
                                style={{ background: 'var(--glass-border)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="إلغاء"
                              >
                                <X size={14} /> إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleStartEdit(u)}
                                style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="تعديل"
                              >
                                <Edit2 size={14} /> تعديل
                              </button>
                              {u.uid !== 'admin_123' && (
                                <button 
                                  onClick={() => handleDeleteUser(u.uid)}
                                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="حذف الحساب"
                                >
                                  <Trash2 size={14} /> حذف
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

    </div>
  );
};
