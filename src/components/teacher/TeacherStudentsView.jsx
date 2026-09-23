import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Mic, 
  BookOpen, 
  TrendingUp,
  Flame,
  Award,
  UserPlus,
  Copy,
  Check,
  X,
  Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherStudentsView = ({ initialFilter = 'all', onOpenStudentProfile }) => {
  const { user } = useAuth();
  const { lang, isRTL } = useLanguage();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter); // 'all' | 'excellent' | 'needs_attention' | 'inactive'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'consistency' | 'last_recitation' | 'memorization'
  
  // Teacher Adding Student Modal & Group Code
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addFeedback, setAddFeedback] = useState(null);
  const [groupCode, setGroupCode] = useState('SAFAR-NUR');
  const [copiedCode, setCopiedCode] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    memorizedJuz: 1,
    currentTarget: 'صفحة واحدة يومياً'
  });

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    fetchStudents();
    fetchGroupInfo();
  }, [user, activeFilter, sortBy, searchQuery]);

  const fetchGroupInfo = async () => {
    try {
      const teacherId = user?.uid || 'teacher_aisha';
      const res = await fetch(`/api/groups?teacherId=${teacherId}`);
      const data = await res.json();
      if (data.success && data.groups?.length > 0) {
        setGroupCode(data.groups[0].code || 'SAFAR-NUR');
      }
    } catch (e) {
      console.log('Error fetching teacher group info:', e);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const teacherId = user?.uid || 'teacher_aisha';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter && activeFilter !== 'all') params.append('filter', activeFilter);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/teacher/${teacherId}/students?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.students);
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(groupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;
    setAddLoading(true);
    setAddFeedback(null);

    try {
      const teacherId = user?.uid || 'teacher_aisha';
      const res = await fetch(`/api/teacher/${teacherId}/add-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentForm)
      });
      const data = await res.json();
      if (data.success) {
        setAddFeedback({ type: 'success', text: data.message });
        setNewStudentForm({
          name: '',
          email: '',
          memorizedJuz: 1,
          currentTarget: 'صفحة واحدة يومياً'
        });
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddFeedback(null);
        }, 1500);
        fetchStudents();
      } else {
        setAddFeedback({ type: 'error', text: data.message || 'فشلت إضافة الطالبة' });
      }
    } catch (err) {
      setAddFeedback({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setAddLoading(false);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'الكل', count: 24 },
    { id: 'excellent', label: 'متميزات 🟢', count: 17 },
    { id: 'needs_attention', label: 'بحاجة لمتابعة 🟡', count: 4 },
    { id: 'inactive', label: 'منقطعات 🔴', count: 3 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {lang === 'ar' ? 'سجل طالبات المجموعة' : 'Group Student Roster'}
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {lang === 'ar' 
              ? 'متابعة شاملة لتقدم كل طالبة، ومعدل إتقانها وتسميعها بالذكاء الاصطناعي' 
              : 'Detailed monitoring of each student\'s progress and recitation'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              transition: 'transform 0.15s ease'
            }}
          >
            <UserPlus size={16} />
            <span>إضافة طالبة جديدة</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="name">الاسم أبجدياً</option>
              <option value="consistency">نسبة الالتزام</option>
              <option value="last_recitation">آخر موعد تسميع</option>
              <option value="memorization">مقدار الحفظ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Group Invite Code Card */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Share2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              رمز دعوة الطالبات المباشر للانضمام للمجموعة:
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', fontFamily: 'monospace' }}>
              {groupCode}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyCode}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            background: copiedCode ? '#10B981' : 'var(--bg-surface)',
            color: copiedCode ? '#FFFFFF' : 'var(--text-primary)',
            border: `1px solid ${copiedCode ? '#10B981' : 'var(--glass-border)'}`,
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {copiedCode ? <Check size={15} /> : <Copy size={15} />}
          <span>{copiedCode ? 'تم نسخ الرمز!' : 'نسخ الرمز ومشاركته مع الطالبات'}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '18px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)'
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
            placeholder={lang === 'ar' ? 'البحث عن طالبة بالاسم أو البريد...' : 'Search student by name or email...'}
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

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: isActive ? 'var(--primary)' : 'var(--bg-color)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Students Cards Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          جاري تحميل بيانات الطالبات...
        </div>
      ) : students.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
          <Users size={40} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>لا توجد طالبات تطابق البحث أو التصنيف</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>جربي تعديل خيارات البحث أو التصفية أعلاه.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '14px'
        }}>
          {students.map((student) => {
            const isNeedAttention = student.status === 'needs_attention';
            const isInactive = student.status === 'inactive';
            const statusColor = isNeedAttention ? '#F59E0B' : (isInactive ? '#EF4444' : '#10B981');
            const statusLabel = isNeedAttention ? 'بحاجة لمتابعة' : (isInactive ? 'منقطعة' : 'متميزة');

            return (
              <div
                key={student.uid}
                onClick={() => onOpenStudentProfile && onOpenStudentProfile(student.uid)}
                style={{
                  padding: '18px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface)',
                  border: isNeedAttention ? '1px solid rgba(245, 158, 11, 0.4)' : (isInactive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)'),
                  boxShadow: 'var(--shadow-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Header with Avatar, Name, and Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={student.photoURL}
                        alt={student.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${statusColor}` }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: statusColor,
                        border: '2px solid var(--bg-surface)'
                      }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {student.name}
                      </h4>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {student.currentSurah || 'سورة آل عمران'}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: `${statusColor}18`,
                    color: statusColor,
                    flexShrink: 0
                  }}>
                    {statusLabel}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--bg-color)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>الحفظ</span>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{student.memorizedJuz} ج</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>هذا الأسبوع</span>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{student.sessionsThisWeek} ج</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>الالتزام</span>
                    <strong style={{ fontSize: '12.5px', color: student.consistencyRate < 75 ? '#EF4444' : '#10B981' }}>{student.consistencyRate}%</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>آخر تسميع</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>{student.lastRecitationDate}</strong>
                  </div>
                </div>

                {/* Attention note if applicable */}
                {student.attentionReason && (
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: `${statusColor}12`,
                    color: statusColor,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                    <span>{student.attentionReason}</span>
                  </div>
                )}

                {/* Action button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                    عرض تفاصيل الإنجاز والتسميع
                  </span>
                  <ChevronLeft size={16} color="var(--primary)" style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    إضافة طالبة جديدة للمجموعة
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    تسجيل ومتابعة مباشرة للطالبة في مجموعتك
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {addFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 600,
                background: addFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: addFeedback.type === 'success' ? '#10B981' : '#EF4444',
                border: `1px solid ${addFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {addFeedback.text}
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  اسم الطالبة الرباعي أو الثلاثي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: هند عبد الله الشمري"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    عدد الأجزاء المحفوظة
                  </label>
                  <select
                    value={newStudentForm.memorizedJuz}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, memorizedJuz: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i} value={i}>{i === 0 ? 'مبتدئة (0 جزء)' : `${i} أجزاء`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    الورد اليومي المطلوب
                  </label>
                  <select
                    value={newStudentForm.currentTarget}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, currentTarget: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="نصف صفحة يومياً">نصف صفحة يومياً</option>
                    <option value="صفحة واحدة يومياً">صفحة واحدة يومياً</option>
                    <option value="صفحتان يومياً">صفحتان يومياً</option>
                    <option value="نصف جزء يومياً">نصف جزء يومياً</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'var(--bg-color)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: addLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {addLoading ? 'جاري الإضافة...' : 'تأكيد وإضافة الطالبة 🌿'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
