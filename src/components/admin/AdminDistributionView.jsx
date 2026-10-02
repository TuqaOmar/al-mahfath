import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  UserCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  ArrowRight, 
  Search, 
  Clock, 
  Phone, 
  Mail, 
  BookOpen, 
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchWithAuth } from '../../lib/api';

export const AdminDistributionView = () => {
  const { lang, isRTL } = useLanguage();

  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Selected for assignment modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStudentToMove, setSelectedStudentToMove] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Group State
  const [newGroupData, setNewGroupData] = useState({ name: '', teacherId: '', targetJuz: '', description: '' });
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [reqRes, groupsRes, usersRes] = await Promise.all([
        fetchWithAuth('/api/admin/enrollment-requests'),
        fetchWithAuth('/api/groups'),
        fetchWithAuth('/api/admin/users')
      ]);

      const reqData = await reqRes.json();
      const grpData = await groupsRes.json();
      const usrData = await usersRes.json();
      if (!reqRes.ok || !groupsRes.ok || !usersRes.ok || !reqData.success || !grpData.success || !usrData.success) {
        throw new Error(reqData.message || grpData.message || usrData.message || 'تعذر تحميل بيانات التوزيع');
      }

      if (reqData.success) setRequests(reqData.requests || []);
      if (grpData.success) {
        setGroups(grpData.groups || []);
        if (grpData.groups?.length > 0 && !targetGroupId) {
          setTargetGroupId(grpData.groups[0].id);
        }
      }
      if (usrData.success) {
        setStudents(usrData.users?.filter(u => u.role !== 'admin' && !u.roles?.admin) || []);
        setTeachers(usrData.users?.filter(u => u.role === 'teacher' || u.roles?.teacher) || []);
      }
    } catch (e) {
      console.error('Failed to load distribution data:', e);
      setFeedback({ type: 'error', text: e.message || (lang === 'ar' ? 'تعذر تحميل البيانات' : 'Could not load data') });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !targetGroupId) return;
    setIsSubmitting(true);

    try {
      const res = await fetchWithAuth('/api/admin/enrollment-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          groupId: targetGroupId,
          teacherId: targetTeacherId || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        setSelectedRequest(null);
        fetchAllData();
      } else {
        setFeedback({ type: 'error', text: data.message || 'فشلت عملية التعيين' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDistributeStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentToMove || !targetGroupId) return;
    setIsSubmitting(true);

    try {
      const res = await fetchWithAuth('/api/admin/distribute-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentUid: selectedStudentToMove.uid,
          groupId: targetGroupId,
          teacherId: targetTeacherId || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        setSelectedStudentToMove(null);
        fetchAllData();
      } else {
        setFeedback({ type: 'error', text: data.message || 'فشل نقل الطالبة' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupData.name) {
      setFeedback({ type: 'error', text: 'اسم الحلقة مطلوب' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/admin/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroupData)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        setNewGroupData({ name: '', teacherId: '', targetJuz: '', description: '' });
        setShowCreateGroup(false);
        fetchAllData();
      } else {
        setFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>
            إدارة وتوزيع الطالبات وطلبات الانتساب 🌿
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            توزيع الطالبات على المجموعات والمعلمات حسب المستوى والورد اليومي والمفاضلة الذكية
          </p>
        </div>

        <button
          onClick={fetchAllData}
          style={{
            padding: '9px 16px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={15} />
          <span>تحديث القوائم</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '14px',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: feedback.type === 'success' ? '#10B981' : '#EF4444',
          fontSize: '13.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Create New Group Section */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showCreateGroup ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>إنشاء حلقة جديدة</h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>تأسيس مجموعة للحفظ وتعيين معلمة لها</span>
            </div>
          </div>
          <button onClick={() => setShowCreateGroup(!showCreateGroup)} style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showCreateGroup ? <Check size={16} /> : <Users size={16} />}
            <span>{showCreateGroup ? 'إلغاء' : 'إنشاء حلقة'}</span>
          </button>
        </div>

        {showCreateGroup && (
          <form onSubmit={handleCreateGroup} style={{ display: 'grid', gap: '16px', background: 'var(--bg-color)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>اسم الحلقة *</label>
                <input type="text" value={newGroupData.name} onChange={e => setNewGroupData({...newGroupData, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} placeholder="مثال: حلقة النور" required />
              </div>
              <div>
                <label htmlFor="create-group-teacher" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>المعلمة المشرفة</label>
                <select id="create-group-teacher" value={newGroupData.teacherId} onChange={e => setNewGroupData({...newGroupData, teacherId: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  <option value="">بدون معلمة حالياً</option>
                  {teachers.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>نطاق الحفظ (مثال: الجزء 30)</label>
                <input type="text" value={newGroupData.targetJuz} onChange={e => setNewGroupData({...newGroupData, targetJuz: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} placeholder="مثال: الأجزاء 1-5" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>وصف الحلقة</label>
                <input type="text" value={newGroupData.description} onChange={e => setNewGroupData({...newGroupData, description: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} placeholder="وصف قصير للحلقة" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '10px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer' }}>
              {isSubmitting ? 'جاري الإنشاء...' : 'حفظ وإنشاء الحلقة'}
            </button>
          </form>
        )}
      </div>

      {/* Section 1: Pending Enrollment Requests */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                طلبات الانتساب الجديدة بانتظار التوزيع ({requests.filter(r => r.status === 'pending').length})
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                طالبات قدّمن للانضمام إلى مشروع سَفَر وبانتظار موافقة وتعيين المشرف العام
              </span>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            لا توجد طلبات انتساب جديدة حالياً
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {requests.map((req) => {
              const isPending = req.status === 'pending';
              return (
                <div
                  key={req.id}
                  data-testid={`request-${req.id}`}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: isPending ? 'var(--bg-color)' : 'rgba(16, 185, 129, 0.05)',
                    border: `1px solid ${isPending ? 'var(--glass-border)' : 'rgba(16, 185, 129, 0.25)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {req.email} {req.phone ? `• ${req.phone}` : ''}
                      </div>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isPending ? '#D97706' : '#10B981'
                    }}>
                      {isPending ? 'بانتظار التوزيع' : 'تم التعيين ✅'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ padding: '6px 8px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>المحفوظ:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{req.memorizedJuz} أجزاء</strong>
                    </div>
                    <div style={{ padding: '6px 8px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>الورد المطلوب:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{req.dailyGoal}</strong>
                    </div>
                  </div>

                  {req.notes && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '8px', borderRadius: '8px' }}>
                      "{req.notes}"
                    </div>
                  )}

                  {isPending ? (
                    <button
                      onClick={() => setSelectedRequest(req)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: 'auto'
                      }}
                    >
                      <UserCheck size={16} />
                      <span>توزيع وتعيين الطالبة الآن 🎯</span>
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                      عضوة في {groups.find(group => group.id === req.groupId)?.name || 'حلقة غير متاحة'} (المعلمة: {groups.find(group => group.id === req.groupId)?.teacherName || 'غير محددة'})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Student Distribution Table */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                توزيع الطالبات المسجلات في المنصة ({students.length})
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                نقل أي طالبة بين المجموعات أو إلحاق الطالبات المستقلات بمجموعة سفر
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {students.map((st) => (
            <div
              key={st.uid}
              data-testid={`distribution-student-${st.uid}`}
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={st.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(st.name)}`}
                  alt={st.name}
                  style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {st.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {st.email} • {st.memorizedJuz || 1} أجزاء ({st.memorizedPagesCount || 20} صفحة)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: st.groupName ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {st.groupName ? st.groupName : 'مستخدمة مستقلة (غير منضمة)'}
                  </div>
                  {st.teacherName && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      المعلمة: {st.teacherName}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedStudentToMove(st)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{st.groupName ? 'نقل لمجموعة أخرى' : 'إلحاق بمجموعة'}</span>
                  <ArrowRight size={14} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Modal (For Request Approval or Student Movement) */}
      {(selectedRequest || selectedStudentToMove) && (
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
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedRequest ? 'توزيع طلب الانتساب على مجموعة' : 'نقل وتوزيع الطالبة'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              الطالبة: <strong>{selectedRequest?.name || selectedStudentToMove?.name}</strong>
            </p>

            <form onSubmit={selectedRequest ? handleApproveRequest : handleDistributeStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="distribution-target-group" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  اختر المجموعة المستهدفة:
                </label>
                <select
                  id="distribution-target-group"
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
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
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.teacherName || 'معلمة معتمدة'}) - {g.studentsCount ?? 0} طالبة
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  المعلمة المشرفة (اختياري، يتبع المجموعة افتراضياً):
                </label>
                <select
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
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
                  <option value="">نفس معلمة المجموعة الافتراضية</option>
                  {teachers.map((t) => (
                    <option key={t.uid} value={t.uid}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setSelectedStudentToMove(null);
                  }}
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
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {isSubmitting ? 'جاري التوزيع...' : 'تأكيد التوزيع والحفظ 🌿'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
