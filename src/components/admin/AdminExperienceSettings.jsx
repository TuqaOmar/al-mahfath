import React, { useEffect, useState } from 'react';
import { badgeCriteria, saveUiConfiguration, useUiConfiguration } from '../../lib/uiConfiguration';

const emptyBadge = { title: '', description: '', type: 'streak', value: 30 };

export function AdminExperienceSettings() {
  const { configuration, loading } = useUiConfiguration();
  const [draft, setDraft] = useState(configuration);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(configuration), [configuration]);

  const updateSection = (id, field, value) => setDraft(previous => ({
    ...previous,
    sections: { ...previous.sections, [id]: { ...previous.sections[id], [field]: value } }
  }));
  const updateBadge = (id, field, value) => setDraft(previous => ({
    ...previous,
    badges: previous.badges.map(badge => badge.id === id ? { ...badge, [field]: value } : badge)
  }));
  const [newBadge, setNewBadge] = useState(emptyBadge);
  const addBadge = () => {
    const value = Number(newBadge.value);
    if (!newBadge.title.trim() || !Number.isFinite(value) || value < 1) {
      setStatus('اكتب اسم الوسام وحدًا رقميًا أكبر من صفر.');
      return;
    }
    const maxOrder = Math.max(0, ...draft.badges.map(badge => Number(badge.order) || 0));
    const badge = {
      id: `custom_${Date.now().toString(36)}`, custom: true, visible: true, order: maxOrder + 10,
      title: newBadge.title.trim(),
      description: newBadge.description.trim() || `${badgeCriteria[newBadge.type]}: ${value} أو أكثر`,
      criterion: { type: newBadge.type, value }
    };
    save({ ...draft, badges: [...draft.badges, badge] }, 'تمت إضافة الوسام وحفظه.');
    setNewBadge(emptyBadge);
  };
  const removeBadge = id => {
    if (!window.confirm('حذف هذا الوسام نهائيًا؟')) return;
    save({ ...draft, badges: draft.badges.filter(badge => badge.id !== id) }, 'تم حذف الوسام.');
  };
  const save = async (next = draft, successMessage = 'تم حفظ إعدادات الواجهة في Firestore.') => {
    setSaving(true);
    setStatus('');
    setDraft(next);
    try {
      await saveUiConfiguration(next);
      setStatus(successMessage);
    } catch (error) {
      console.error(error);
      setStatus('تعذر حفظ إعدادات الواجهة.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>جاري تحميل إعدادات الواجهة...</div>;
  return <div data-testid="admin-experience-settings" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
    <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginTop: 0 }}>ظهور وترتيب الأقسام</h3>
      {[
        ['community', 'المجتمع'], ['achievements', 'الأوسمة والثمار']
      ].map(([id, label]) => <div key={id} data-testid={`section-setting-${id}`} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
        <label><input type="checkbox" checked={draft.sections[id].visible} onChange={event => updateSection(id, 'visible', event.target.checked)} /> إظهار {label}</label>
        <label>الترتيب <input aria-label={`ترتيب ${label}`} type="number" value={draft.sections[id].order} onChange={event => updateSection(id, 'order', Number(event.target.value))} style={{ width: '75px', padding: '6px' }} /></label>
      </div>)}
    </div>
    <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
      <h3 style={{ marginTop: 0 }}>إدارة بيانات عرض الأوسمة</h3>
      <p style={{ color: 'var(--text-secondary)' }}>الإخفاء أو تعديل العرض لا يحذف أي استحقاق محفوظ للطلاب.</p>
      <div style={{ display: 'grid', gap: '12px' }}>
        {[...draft.badges].sort((a, b) => a.order - b.order).map(badge => <div key={badge.id} data-testid={`badge-setting-${badge.id}`} style={{ padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'grid', gap: '8px' }}>
          <label><input type="checkbox" checked={badge.visible} onChange={event => updateBadge(badge.id, 'visible', event.target.checked)} /> مفعّل</label>
          <input aria-label={`عنوان ${badge.id}`} value={badge.title} onChange={event => updateBadge(badge.id, 'title', event.target.value)} style={{ padding: '8px' }} />
          <textarea aria-label={`وصف ${badge.id}`} value={badge.description} onChange={event => updateBadge(badge.id, 'description', event.target.value)} style={{ padding: '8px' }} />
          <label>الترتيب <input aria-label={`ترتيب ${badge.id}`} type="number" value={badge.order} onChange={event => updateBadge(badge.id, 'order', Number(event.target.value))} style={{ width: '75px', padding: '6px' }} /></label>
          {badge.custom && <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>يُفتح عند: {badgeCriteria[badge.criterion.type]} ≥ {badge.criterion.value}</span>
            <button type="button" data-testid={`remove-badge-${badge.id}`} disabled={saving} onClick={() => removeBadge(badge.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}>حذف الوسام</button>
          </div>}
        </div>)}
      </div>
    </div>
    <div data-testid="add-badge-form" style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', display: 'grid', gap: '10px' }}>
      <h3 style={{ margin: 0 }}>إضافة وسام جديد</h3>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>يُمنح الوسام تلقائيًا لكل طالب يصل إلى الحد المطلوب.</p>
      <input aria-label="اسم الوسام الجديد" placeholder="اسم الوسام" value={newBadge.title} onChange={event => setNewBadge({ ...newBadge, title: event.target.value })} style={{ padding: '8px' }} />
      <textarea aria-label="وصف الوسام الجديد" placeholder="الوصف (اختياري)" value={newBadge.description} onChange={event => setNewBadge({ ...newBadge, description: event.target.value })} style={{ padding: '8px' }} />
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>الشرط <select aria-label="شرط الوسام الجديد" value={newBadge.type} onChange={event => setNewBadge({ ...newBadge, type: event.target.value })} style={{ padding: '6px' }}>
          {Object.entries(badgeCriteria).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
        </select></label>
        <label>الحد الأدنى <input aria-label="حد الوسام الجديد" type="number" min="1" value={newBadge.value} onChange={event => setNewBadge({ ...newBadge, value: event.target.value })} style={{ width: '90px', padding: '6px' }} /></label>
      </div>
      <button type="button" data-testid="add-badge" disabled={saving} onClick={addBadge} style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 0, borderRadius: '10px', justifySelf: 'start', cursor: 'pointer' }}>+ إضافة الوسام</button>
    </div>
    <button data-testid="save-experience-settings" disabled={saving} onClick={() => save()} style={{ padding: '11px 18px', background: 'var(--primary)', color: 'white', border: 0, borderRadius: '10px' }}>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الواجهة'}</button>
    {status && <div role="status" data-testid="experience-settings-status">{status}</div>}
  </div>;
}
