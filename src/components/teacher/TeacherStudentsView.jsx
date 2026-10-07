import { declaredPages, nextDeclaredPage } from '../../lib/memorization';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useTeacherRefresh } from '../../hooks/useTeacherRefresh';
import { fetchWithAuth } from '../../lib/api';

export const TeacherStudentsView = ({ initialFilter = 'all', groupId = null, onShowAll, onOpenStudentProfile }) => {
  const { user } = useAuth();
  const { lang, isRTL } = useLanguage();

  const requestVersion = useRef(0);
  const [loadError, setLoadError] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter); // 'all' | 'excellent' | 'needs_attention' | 'inactive'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'consistency' | 'last_recitation' | 'memorization'
  
  // Move-a-student modal & group code. The server only lets a teacher move her own
  // students between her own circles; new students join with the invite code.
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addFeedback, setAddFeedback] = useState(null);
  const [groupCode, setGroupCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [teacherGroups, setTeacherGroups] = useState([]);
  const [movableStudents, setMovableStudents] = useState([]);
  const [movableLoading, setMovableLoading] = useState(false);
  const [moveForm, setMoveForm] = useState({ studentUid: '', targetGroupId: '' });

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  // The roster and the invite code load independently, so a slow or failed
  // roster request no longer hides the code. Background refreshes keep the
  // current data on screen and only clear it when the server refuses access.
  const fetchStudents = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setLoadError('');
    try {
      if (!user?.uid) return;
      const params = new URLSearchParams({ filter: 'all', sort: sortBy });
      if (searchQuery) params.set('search', searchQuery);
      if (groupId) params.set('groupId', groupId);
      const response = await fetchWithAuth('/api/teacher/' + encodeURIComponent(user.uid) + '/students?' + params,
        { signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error('Roster unavailable');
      if (version !== requestVersion.current) return;
      setStudents(data.students || []);
    } catch {
      if (version === requestVersion.current) { setStudents([]); setLoadError('تعذر تحميل الطلاب أو انتهت صلاحية الوصول.'); }
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [user?.uid, sortBy, searchQuery, groupId]);
  useTeacherRefresh(fetchStudents);

  const groupCodeVersion = useRef(0);
  const [groupCodeLoading, setGroupCodeLoading] = useState(true);
  const fetchGroupCode = useCallback(async () => {
    const version = ++groupCodeVersion.current;
    try {
      if (!user?.uid) return;
      const response = await fetchWithAuth('/api/groups?teacherId=' + encodeURIComponent(user.uid),
        { signal: AbortSignal.timeout(20000) });
      const info = await response.json();
      if (!response.ok || !info.success) throw new Error('Groups unavailable');
      if (version !== groupCodeVersion.current) return;
      setTeacherGroups(info.groups || []);
      setGroupCode((groupId ? info.groups?.find(group => group.id === groupId) : info.groups?.[0])?.code || '');
    } catch {
      if (version === groupCodeVersion.current) setGroupCode('');
    } finally { if (version === groupCodeVersion.current) setGroupCodeLoading(false); }
  }, [user?.uid, groupId]);
  useTeacherRefresh(fetchGroupCode);
  useEffect(() => () => { requestVersion.current += 1; groupCodeVersion.current += 1; }, []);

  const handleCopyCode = () => {
    if (!groupCode) return;
    navigator.clipboard?.writeText(groupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const openMoveModal = async () => {
    setIsAddModalOpen(true);
    setAddFeedback(null);
    setMoveForm({ studentUid: '', targetGroupId: groupId || teacherGroups[0]?.id || '' });
    setMovableStudents([]);
    if (!user?.uid) return;
    setMovableLoading(true);
    try {
      const res = await fetchWithAuth(`/api/teacher/${encodeURIComponent(user.uid)}/available-students`,
        { signal: AbortSignal.timeout(20000) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Students unavailable');
      setMovableStudents(data.students || []);
    } catch {
      setAddFeedback({ type: 'error', text: 'تعذر تحميل طالبات حلقاتك' });
    } finally {
      setMovableLoading(false);
    }
  };

  // Only students in another of this teacher's circles can be moved into the target one.
  const moveCandidates = movableStudents.filter(student => student.groupId && student.groupId !== moveForm.targetGroupId);

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!moveForm.studentUid || !moveForm.targetGroupId) return;
    setAddLoading(true);
    setAddFeedback(null);

    try {
      if (!user?.uid) throw new Error('Authentication required');
      const teacherId = user.uid;
      const res = await fetchWithAuth(`/api/teacher/${encodeURIComponent(teacherId)}/add-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentUid: moveForm.studentUid, groupId: moveForm.targetGroupId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddFeedback({ type: 'success', text: 'تم نقل الطالبة إلى الحلقة' });
        setMoveForm(prev => ({ ...prev, studentUid: '' }));
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddFeedback(null);
        }, 1500);
        fetchStudents();
      } else {
        setAddFeedback({ type: 'error', text: data.message || 'فشل نقل الطالبة' });
      }
    } catch (err) {
      setAddFeedback({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setAddLoading(false);
    }
  };

  // Status is derived on the server from the last practice day and streak (see studentActivityStatus).
  const visibleStudents = activeFilter === 'all' ? students : students.filter(s => s.status === activeFilter);
  const filterTabs = [
    { id: 'all', label: 'الكل', count: students.length },
    { id: 'excellent', label: 'متميزات 🟢', count: students.filter(s => s.status === 'excellent').length },
    { id: 'needs_attention', label: 'بحاجة لمتابعة 🟡', count: students.filter(s => s.status === 'needs_attention').length },
    { id: 'inactive', label: 'منقطعات 🔴', count: students.filter(s => s.status === 'inactive').length }
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
            onClick={openMoveModal}
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
            <span>نقل طالبة من حلقاتي</span>
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
            {groupCode ? (
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', fontFamily: 'monospace' }}>
                {groupCode}
              </div>
            ) : (
              <div data-testid="teacher-no-group-code" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {groupCodeLoading ? 'جاري تحميل الرمز...' : 'لا توجد حلقة مرتبطة بحسابك بعد، فلا يوجد رمز دعوة. اطلبي من المشرفة إنشاء حلقة لكِ من لوحة الإدارة (التوزيع ← إنشاء حلقة).'}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCopyCode}
          disabled={!groupCode}
          style={{
            opacity: groupCode ? 1 : 0.5,
            padding: '8px 14px',
            borderRadius: '10px',
            background: copiedCode ? '#10B981' : 'var(--bg-surface)',
            color: copiedCode ? '#FFFFFF' : 'var(--text-primary)',
            border: `1px solid ${copiedCode ? '#10B981' : 'var(--glass-border)'}`,
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: groupCode ? 'pointer' : 'not-allowed',
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
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          متميزة: تدرّبت خلال آخر يومين و3 أيام متتالية أو أكثر • بحاجة لمتابعة: آخر تدريب قبل 3–7 أيام • منقطعة: لا تدريب منذ أكثر من 7 أيام
        </p>
      </div>

      {/* Students Cards Grid */}
      <button
        data-testid="teacher-roster-refresh"
        onClick={() => { fetchStudents(); fetchGroupCode(); }}
        disabled={loading}
        style={{
          alignSelf: 'flex-start',
          minHeight: '40px',
          padding: '0 16px',
          borderRadius: '10px',
          border: '1px solid var(--glass-border)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer'
        }}
      >
        {loading ? 'جاري التحديث...' : 'تحديث قائمة الطلاب'}
      </button>
      {groupId && <p data-testid="teacher-roster-group">القائمة مقيدة بالحلقة المحددة. <button data-testid="teacher-roster-all" onClick={onShowAll}>جميع طلاب حلقاتي</button></p>}
      {loadError && <p role="alert" data-testid="teacher-roster-error">{loadError}</p>}
      {loading && students.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          جاري تحميل بيانات الطالبات...
        </div>
      ) : visibleStudents.length === 0 ? (
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
          {visibleStudents.map((student) => {
            const isNeedAttention = student.status === 'needs_attention';
            const isInactive = student.status === 'inactive';
            const isExcellent = student.status === 'excellent';
            const statusColor = isNeedAttention ? '#F59E0B' : (isInactive ? '#EF4444' : (isExcellent ? '#10B981' : '#3B82F6'));
            const statusLabel = isNeedAttention ? 'بحاجة لمتابعة' : (isInactive ? 'منقطعة' : (isExcellent ? 'متميزة' : 'نشطة'));

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
                      {student.photoURL ? <img
                        src={student.photoURL}
                        alt={student.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${statusColor}` }}
                      /> : <span style={{ width: '48px', height: '48px', borderRadius: '50%', border: `2px solid ${statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor, fontWeight: 800 }}>{student.name?.slice(0, 1) || '؟'}</span>}
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
                        {student.currentSurah || 'غير متاح'}
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
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--bg-color)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>صفحات مصرّح بها ذاتيًا</span>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{declaredPages(student).length} صفحة</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>أيام متتالية</span>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{Number(student.streak) || 0} يوم</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>آخر تدريب</span>
                    <strong style={{ fontSize: '11.5px', color: student.lastRecitationDate ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{student.lastRecitationDate || 'لا يوجد'}</strong>
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
                    نقل طالبة من حلقاتي
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    نقل طالبة من حلقة أخرى لكِ إلى هذه الحلقة
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
              {teacherGroups.length > 1 && (
                <div>
                  <label htmlFor="move-target-group" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    إلى الحلقة
                  </label>
                  <select
                    id="move-target-group"
                    value={moveForm.targetGroupId}
                    disabled={Boolean(groupId)}
                    onChange={(e) => setMoveForm({ studentUid: '', targetGroupId: e.target.value })}
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
                    {teacherGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {movableLoading ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>جاري تحميل طالبات حلقاتك...</p>
              ) : moveCandidates.length > 0 ? (
                <div>
                  <label htmlFor="move-student" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    الطالبة *
                  </label>
                  <select
                    id="move-student"
                    required
                    value={moveForm.studentUid}
                    onChange={(e) => setMoveForm({ ...moveForm, studentUid: e.target.value })}
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
                    <option value="">اختاري طالبة من حلقاتك الأخرى</option>
                    {moveCandidates.map(student => (
                      <option key={student.uid} value={student.uid}>
                        {student.name || student.email} {student.groupName ? `(${student.groupName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p data-testid="move-student-empty" style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  لا توجد طالبات في حلقاتك الأخرى لنقلهن إلى هذه الحلقة.
                </p>
              )}

              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '12.5px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                لإضافة طالبة جديدة: تسجّل الطالبة حسابها ثم تدخل رمز الدعوة من 'انضمام لحلقة'.
                {groupCode && <> رمز حلقتك: <strong style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}>{groupCode}</strong></>}
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
                  disabled={addLoading || !moveForm.studentUid}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: addLoading ? 'wait' : 'pointer',
                    opacity: moveForm.studentUid ? 1 : 0.6,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {addLoading ? 'جاري النقل...' : 'تأكيد النقل 🌿'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
