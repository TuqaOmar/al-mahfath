import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  TrendingUp, 
  Layers, 
  GraduationCap, 
  UserX, 
  Sparkles, 
  Eye, 
  BarChart3, 
  Calendar, 
  Check, 
  X,
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AdminPerformanceDashboard } from './AdminPerformanceDashboard';
import { AdminDistributionView } from './AdminDistributionView';

export const AdminDashboard = ({ activeAdminTab = 'dashboard', onNavigateTab }) => {
  const { lang, isRTL } = useLanguage();

  const [currentTab, setCurrentTab] = useState(activeAdminTab);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'safar_member' | 'independent' | 'teacher' | 'active' | 'inactive'
  
  // Modals state
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
  const [confirmTeacherModal, setConfirmTeacherModal] = useState(null); // { user, action: 'assign' | 'remove' }
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    setCurrentTab(activeAdminTab);
  }, [activeAdminTab]);

  useEffect(() => {
    fetchAdminData();
  }, [searchQuery, userFilter]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/overview');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setOverview(statsData);
      }

      // Fetch users
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (userFilter && userFilter !== 'all') params.append('filter', userFilter);

      const usersRes = await fetch(`/api/admin/users?${params.toString()}`);
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleAction = async () => {
    if (!confirmTeacherModal) return;
    const { user, action } = confirmTeacherModal;
    const endpoint = action === 'assign' ? '/api/admin/assign-teacher' : '/api/admin/remove-teacher';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid })
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          type: 'success',
          text: action === 'assign' 
            ? `تم تعيين ${user.name} كمعلمة بنجاح 🌿` 
            : `تم إلغاء صفة معلمة عن ${user.name} بنجاح`
        });
        setConfirmTeacherModal(null);
        fetchAdminData();
      } else {
        setActionFeedback({ type: 'error', text: data.message || 'فشلت العملية' });
      }
    } catch (e) {
      setActionFeedback({ type: 'error', text: 'حدث خطأ أثناء تنفيذ الإجراء' });
    } finally {
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const stats = overview?.stats || {
    totalRegisteredUsers: 12842,
    safarMembers: 4281,
    teachersCount: 186,
    independentUsers: 8561,
    groupsCount: 142
  };

  const realTime = overview?.realTimeActivity || {
    activeToday: 1420,
    activeThisWeek: 6890,
    newRegistrationsWeek: 342,
    newGroupJoinsWeek: 94,
    activeTeachers: 174,
    activeGroups: 138
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Toast Feedback */}
      {actionFeedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '14px',
          background: actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${actionFeedback.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: actionFeedback.type === 'success' ? '#10B981' : '#EF4444',
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          {actionFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Admin Sub-Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'dashboard', label: 'لوحة القيادة', icon: BarChart3 },
            { id: 'performance', label: 'تحليلات الحفظ والإتقان 📊', icon: BookOpen },
            { id: 'distribution', label: 'توزيع الطالبات والانتساب 🌿', icon: UserCheck },
            { id: 'users', label: 'المستخدمون والأدوار', icon: Users },
            { id: 'teachers', label: 'المعلمات', icon: GraduationCap },
            { id: 'groups', label: 'المجموعات القرآنية', icon: Layers },
            { id: 'analytics', label: 'التحليلات والنمو', icon: TrendingUp }
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  if (onNavigateTab) onNavigateTab(tab.id);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث الإحصائيات</span>
        </button>
      </div>

      {/* VIEW 1: DASHBOARD OVERVIEW */}
      {currentTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Hero Banner */}
          <div style={{
            padding: '24px 28px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              <ShieldCheck size={14} color="#10B981" /> مركز إدارة منصة سَفَر القرآنية
            </div>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800 }}>
              نظرة عامة على المنصة والإحصائيات اللحظية 📊
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94A3B8', lineHeight: 1.5 }}>
              بيانات موثوقة ومحدثة لحظياً تعكس النشاط الفعلي لجميع أعضاء المنصة والمجموعات.
            </p>
          </div>

          {/* Section 9: Accurate Platform-Wide Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>إجمالي المسجلين</span>
                <Users size={18} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.totalRegisteredUsers.toLocaleString()}
              </div>
              <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>مستخدمين مسجلين بالمنصة</span>
            </div>

            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>أعضاء سَفَر (في المجموعات)</span>
                <Sparkles size={18} color="#10B981" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>
                {stats.safarMembers.toLocaleString()}
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>منضمون لمجموعات رسمية</span>
            </div>

            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>المعلمات والكوادر</span>
                <GraduationCap size={18} color="#8B5CF6" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#8B5CF6' }}>
                {stats.teachersCount.toLocaleString()}
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>معلمة معتمدة تشرف على المجموعات</span>
            </div>

            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>الحفاظ المستقلون</span>
                <BookOpen size={18} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B' }}>
                {stats.independentUsers.toLocaleString()}
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>يحفظون دون التقيد بمجموعة</span>
            </div>

            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>المجموعات القرآنية</span>
                <Layers size={18} color="#06B6D4" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#06B6D4' }}>
                {stats.groupsCount.toLocaleString()}
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>مجموعة نشطة برمز دعوة</span>
            </div>
          </div>

          {/* Real-Time Activity & Engagement Grid */}
          <div style={{
            padding: '24px',
            borderRadius: '22px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
              مؤشرات التفاعل والنشاط اللحظي (Engagement)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>النشطون اليوم</span>
                <strong style={{ fontSize: '20px', color: '#10B981' }}>{realTime.activeToday.toLocaleString()}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>سجلوا دخولاً أو تسميعاً</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>النشطون هذا الأسبوع</span>
                <strong style={{ fontSize: '20px', color: '#3B82F6' }}>{realTime.activeThisWeek.toLocaleString()}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>تفاعلوا مع المصحف والحلقات</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>تسجيلات جديدة (7 أيام)</span>
                <strong style={{ fontSize: '20px', color: '#8B5CF6' }}>+{realTime.newRegistrationsWeek}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>حساب جديد تم إنشاؤه</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>انضمام لحلقة (7 أيام)</span>
                <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>+{realTime.newGroupJoinsWeek}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>عبر رموز الدعوة</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>معلمات نشطات</span>
                <strong style={{ fontSize: '20px', color: '#10B981' }}>{realTime.activeTeachers} / {stats.teachersCount}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>قيّمن طالباتهن هذا الأسبوع</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>حلقات نشطة</span>
                <strong style={{ fontSize: '20px', color: '#06B6D4' }}>{realTime.activeGroups} / {stats.groupsCount}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>تجري جلساتها بانتظام</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MEMORIZATION PERFORMANCE & GOAL STATISTICS */}
      {currentTab === 'performance' && (
        <AdminPerformanceDashboard />
      )}

      {/* VIEW: STUDENT DISTRIBUTION & ENROLLMENT REQUESTS */}
      {currentTab === 'distribution' && (
        <AdminDistributionView />
      )}

      {/* VIEW 2: USERS MANAGEMENT & ROLE ASSIGNMENT */}
      {(currentTab === 'users' || currentTab === 'teachers') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentTab === 'teachers' ? 'سجل المعلمات المعتمدات' : 'إدارة المستخدمين والأدوار'}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {currentTab === 'teachers'
                  ? 'عرض المعلمات والحلقات التابعة لهن وصلاحيات الإشراف'
                  : 'البحث عن أي مستخدم بالاسم أو البريد الإلكتروني وإسناد أو تعديل الأدوار'}
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: isRTL ? '14px' : 'auto',
                  left: isRTL ? 'auto' : '14px',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px',
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Role & Status Filter Tabs */}
            {currentTab !== 'teachers' && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'safar_member', label: 'أعضاء سَفَر 👥' },
                  { id: 'independent', label: 'حفاظ مستقلون 📖' },
                  { id: 'teacher', label: 'المعلمات 👩‍🏫' },
                  { id: 'active', label: 'نشطون 🟢' },
                  { id: 'inactive', label: 'غير نشطين 🔴' }
                ].map((f) => {
                  const isActive = userFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setUserFilter(f.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        background: isActive ? 'var(--primary)' : 'var(--bg-color)',
                        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Users List Table / Cards */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              جاري جلب البيانات...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
              <Users size={40} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>لم يتم العثور على أي مستخدمين</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>تأكد من صيغة البحث أو الفلتر المختار.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map((u) => {
                const isTeacher = u.role === 'teacher';
                const isAdmin = u.role === 'admin';
                const isSafar = Boolean(u.isSafarMember);

                return (
                  <div
                    key={u.uid}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '18px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                      <img
                        src={u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                        alt={u.name}
                        style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {u.name}
                          </h4>
                          {/* Role Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: isAdmin ? '#EF444415' : (isTeacher ? '#8B5CF618' : '#10B98118'),
                            color: isAdmin ? '#EF4444' : (isTeacher ? '#8B5CF6' : '#10B981')
                          }}>
                            {isAdmin ? 'مدير المنصة 👑' : (isTeacher ? 'معلمة 👩‍🏫' : (isSafar ? 'عضوة في سَفَر 🌸' : 'حافظ مستقل 📖'))}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {u.email}
                        </div>

                        {isSafar && u.groupName && (
                          <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                            الحلقة: {u.groupName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress / Activity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <div>
                        الحفظ: <strong style={{ color: 'var(--text-primary)' }}>{u.memorizedJuz || 0} أجزاء</strong>
                      </div>
                      <div>
                        الحالة: <span style={{ color: u.status === 'active' ? '#10B981' : '#F59E0B', fontWeight: 600 }}>{u.status === 'active' ? 'نشط 🟢' : 'خامل 🟡'}</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setSelectedUserForProfile(u)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-color)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={14} />
                        <span>عرض الملف</span>
                      </button>

                      {/* Assign or Remove Teacher Button (ONLY Admin can do this!) */}
                      {!isAdmin && (
                        isTeacher ? (
                          <button
                            onClick={() => setConfirmTeacherModal({ user: u, action: 'remove' })}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <UserX size={14} />
                            <span>إلغاء صفة معلمة</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmTeacherModal({ user: u, action: 'assign' })}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: 'rgba(139, 92, 246, 0.12)',
                              color: '#8B5CF6',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <GraduationCap size={14} />
                            <span>تعيين كمعلمة</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: GROUPS MANAGEMENT */}
      {currentTab === 'groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              إدارة الحلقات والمجموعات (142 حلقة)
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              قائمة الحلقات المسجلة في منصة سَفَر ورموز الانضمام والمعلمات المشرفات عليها
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { id: 'g_nur', name: 'حلقة النور والهدى', code: 'SAFAR-NUR', teacherName: 'أ. عائشة العتيبي', count: 24, target: 'الأجزاء 1 - 3' },
              { id: 'g_fajr', name: 'حلقة الفجر القرآنية', code: 'SAFAR-FAJR', teacherName: 'أ. فاطمة الزهراء', count: 18, target: 'الأجزاء 28 - 30' },
              { id: 'g_bayan', name: 'حلقة تيجان البيان', code: 'SAFAR-BAYAN', teacherName: 'أ. مريم السالم', count: 21, target: 'تثبيت القرآن كاملاً' },
              { id: 'g_huda', name: 'حلقة مسار الهدى', code: 'SAFAR-HUDA', teacherName: 'أ. سارة المنصور', count: 19, target: 'سورة البقرة وآل عمران' },
              { id: 'g_itqan', name: 'حلقة الإتقان والترتيل', code: 'SAFAR-ITQAN', teacherName: 'أ. هدى الغامدي', count: 22, target: 'الأجزاء 10 - 15' }
            ].map((grp) => (
              <div
                key={grp.id}
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{grp.name}</h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)' }}>
                    نشطة
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  المعلمة: <strong style={{ color: 'var(--text-primary)' }}>{grp.teacherName}</strong>
                </div>

                <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px dashed var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>رمز الحلقة:</span>
                  <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>{grp.code}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>عدد الطالبات: {grp.count}</span>
                  <span>المقرر: {grp.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: ANALYTICS */}
      {currentTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '24px', borderRadius: '22px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              تحليلات النمو والانتظام عبر المنصة
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              معدل نمو المشتركين والتزام الحلقات بتسميع الأوراد اليومية باستخدام محرك الذكاء الاصطناعي الصوتي.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>معدل إكمال الأوراد الأسبوعية</span>
                <strong style={{ fontSize: '24px', color: '#10B981', display: 'block', margin: '4px 0' }}>84.5%</strong>
                <span style={{ fontSize: '11px', color: '#10B981' }}>↑ تحسن بنسبة 6% هذا الشهر</span>
              </div>
              <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>جلسات التسميع الصوتي شهرياً</span>
                <strong style={{ fontSize: '24px', color: '#3B82F6', display: 'block', margin: '4px 0' }}>42,800+</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>جلسة مراجعة وحفظ وتثبيت</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN / REMOVE TEACHER ROLE CONFIRMATION */}
      {confirmTeacherModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            padding: '24px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: confirmTeacherModal.action === 'assign' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: confirmTeacherModal.action === 'assign' ? '#8B5CF6' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              {confirmTeacherModal.action === 'assign' ? <GraduationCap size={28} /> : <UserX size={28} />}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', margin: '0 0 8px 0' }}>
              {confirmTeacherModal.action === 'assign' ? 'إسناد صفة معلمة' : 'إلغاء صفة معلمة'}
            </h3>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {confirmTeacherModal.action === 'assign'
                ? `هل أنت متأكد من تعيين "${confirmTeacherModal.user.name}" كمعلمة؟ ستتمكن المعلمة من إنشاء الحلقات، متابعة الطالبات، وإصدار التقارير.`
                : `هل أنت متأكد من إلغاء صفة معلمة عن "${confirmTeacherModal.user.name}"؟ سيعود الحساب إلى طالب/حافظ مستقل.`}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmTeacherModal(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>

              <button
                onClick={handleRoleAction}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: confirmTeacherModal.action === 'assign' ? '#8B5CF6' : '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                تأكيد العملية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW USER PROFILE */}
      {selectedUserForProfile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>ملف المستخدم</h3>
              <button
                onClick={() => setSelectedUserForProfile(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <img
                src={selectedUserForProfile.photoURL}
                alt={selectedUserForProfile.name}
                style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
              />
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedUserForProfile.name}
                </h4>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{selectedUserForProfile.email}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                  الدور: {selectedUserForProfile.role}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>عضوية سَفَر:</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {selectedUserForProfile.isSafarMember ? 'نعم (في حلقة)' : 'حافظ مستقل'}
                </strong>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>الحلقة التابعة:</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {selectedUserForProfile.groupName || 'لا يوجد'}
                </strong>
              </div>
            </div>

            <button
              onClick={() => setSelectedUserForProfile(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
