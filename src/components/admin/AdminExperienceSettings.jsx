import React, { useEffect, useState } from 'react';
import { saveUiConfiguration, useUiConfiguration } from '../../lib/uiConfiguration';

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
  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      await saveUiConfiguration(draft);
      setStatus('تم حفظ إعدادات الواجهة في Firestore.');
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
        </div>)}
      </div>
    </div>
    <button data-testid="save-experience-settings" disabled={saving} onClick={save} style={{ padding: '11px 18px', background: 'var(--primary)', color: 'white', border: 0, borderRadius: '10px' }}>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الواجهة'}</button>
    {status && <div role="status" data-testid="experience-settings-status">{status}</div>}
  </div>;
}
