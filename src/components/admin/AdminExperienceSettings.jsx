import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, AlertCircle, Eye, EyeOff, Plus, Trash2, Users, Trophy, X } from 'lucide-react';
import { badgeCriteria, saveUiConfiguration, useUiConfiguration } from '../../lib/uiConfiguration';
import { badgeRule, badgeRuleText } from '../../lib/badgeRules';

const emptyBadge = { title: '', description: '', type: 'streak', value: 30 };

const card = { padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' };
const input = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '10px',
  border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none'
};
const fieldLabel = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' };
const iconButton = {
  width: '32px', height: '32px', borderRadius: '9px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)',
  color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
};

// On/off switch backed by a real checkbox, so labels and tests can address it as one.
const Switch = ({ checked, onChange, label }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: checked ? 'var(--primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
    <span style={{ width: '38px', height: '22px', borderRadius: '999px', background: checked ? 'var(--primary)' : 'var(--glass-border)', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: '3px', insetInlineStart: checked ? '19px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'inset-inline-start 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'pointer' }} />
    </span>
    {label}
  </label>
);

const BadgePreview = ({ badge, size = 52 }) => {
  const Icon = badgeRule(badge).icon;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: badge.visible ? 'var(--primary)' : 'var(--glass-border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: badge.visible ? '0 6px 14px rgba(16, 185, 129, 0.25)' : 'none' }}>
      <Icon size={Math.round(size * 0.46)} />
    </div>
  );
};

/**
 * Admin settings for what students see in Community and Achievements.
 * view="sections": show/hide and order the two sidebar sections.
 * view="badges": edit, hide, reorder, add and delete badges.
 */
export function AdminExperienceSettings({ view = 'badges' }) {
  const { configuration, loading } = useUiConfiguration();
  const [draft, setDraft] = useState(configuration);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [newBadge, setNewBadge] = useState(emptyBadge);
  useEffect(() => setDraft(configuration), [configuration]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(configuration);

  const updateSection = (id, field, value) => setDraft(previous => ({
    ...previous,
    sections: { ...previous.sections, [id]: { ...previous.sections[id], [field]: value } }
  }));
  const updateBadge = (id, field, value) => setDraft(previous => ({
    ...previous,
    badges: previous.badges.map(badge => badge.id === id ? { ...badge, [field]: value } : badge)
  }));

  const sortedBadges = [...draft.badges].sort((a, b) => a.order - b.order);
  // Swap display order with the neighbour; orders are renumbered 10, 20, 30... so gaps never collide.
  const moveBadge = (id, direction) => {
    const index = sortedBadges.findIndex(badge => badge.id === id);
    const target = index + direction;
    if (target < 0 || target >= sortedBadges.length) return;
    const reordered = [...sortedBadges];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const orderById = Object.fromEntries(reordered.map((badge, i) => [badge.id, (i + 1) * 10]));
    setDraft(previous => ({ ...previous, badges: previous.badges.map(badge => ({ ...badge, order: orderById[badge.id] })) }));
  };

  const save = async (next = draft, successMessage = 'تم حفظ الإعدادات، وستظهر للطلاب مباشرة.') => {
    setSaving(true);
    setStatus(null);
    setDraft(next);
    try {
      await saveUiConfiguration(next);
      setStatus({ type: 'success', text: successMessage });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', text: 'تعذر حفظ الإعدادات، حاول مرة أخرى.' });
    } finally {
      setSaving(false);
    }
  };

  const addBadge = () => {
    const value = Number(newBadge.value);
    if (!newBadge.title.trim() || !Number.isFinite(value) || value < 1) {
      setStatus({ type: 'error', text: 'اكتب اسم الوسام وحدًا رقميًا أكبر من صفر.' });
      return;
    }
    const maxOrder = Math.max(0, ...draft.badges.map(badge => Number(badge.order) || 0));
    const badge = {
      id: `custom_${Date.now().toString(36)}`, custom: true, visible: true, order: maxOrder + 10,
      title: newBadge.title.trim(),
      description: newBadge.description.trim() || `${badgeCriteria[newBadge.type]}: ${value} أو أكثر`,
      criterion: { type: newBadge.type, value }
    };
    save({ ...draft, badges: [...draft.badges, badge] }, isDirty ? 'تمت إضافة الوسام وحفظ باقي التعديلات.' : 'تمت إضافة الوسام.');
    setNewBadge(emptyBadge);
    setShowAddForm(false);
  };

  const removeBadge = id => {
    setConfirmRemoveId(null);
    save({ ...draft, badges: draft.badges.filter(badge => badge.id !== id) }, isDirty ? 'تم حذف الوسام وحفظ باقي التعديلات.' : 'تم حذف الوسام.');
  };

  if (loading) return <div style={{ ...card, textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل الإعدادات...</div>;

  const visibleCount = draft.badges.filter(badge => badge.visible).length;
  const newBadgePreview = { id: 'preview', visible: true, criterion: { type: newBadge.type, value: Number(newBadge.value) || 0 } };

  return (
    <div data-testid="admin-experience-settings" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: isDirty ? '80px' : 0 }}>

      {view === 'sections' && (
        <div style={card}>
          <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>ظهور الأقسام للطلاب</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>تحكم بظهور قسمي المجتمع والأوسمة في قائمة الطالب وترتيبهما (الرقم الأصغر يظهر أولًا).</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[['community', 'المجتمع', Users, 'منشورات الطلاب ولوحة الالتزام'], ['achievements', 'الأوسمة والثمار', Trophy, 'أوسمة الطالب وتقدمه نحوها']].map(([id, label, Icon, hint]) => (
              <div key={id} data-testid={`section-setting-${id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', padding: '14px', borderRadius: '14px', background: 'var(--bg-color)', opacity: draft.sections[id].visible ? 1 : 0.7 }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{hint}</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  الترتيب
                  <input aria-label={`ترتيب ${label}`} type="number" value={draft.sections[id].order} onChange={event => updateSection(id, 'order', Number(event.target.value))} style={{ ...input, width: '72px', textAlign: 'center' }} />
                </label>
                <Switch checked={draft.sections[id].visible} onChange={value => updateSection(id, 'visible', value)} label={draft.sections[id].visible ? 'ظاهر' : 'مخفي'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'badges' && (
        <>
          {/* Header + add */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>الأوسمة</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {visibleCount} ظاهرة من {draft.badges.length}. الإخفاء أو تعديل النص لا يحذف ما استحقه الطلاب.
              </p>
            </div>
            {showAddForm ? (
              <button key="close" type="button" onClick={() => setShowAddForm(false)} style={{ padding: '9px 16px', borderRadius: '11px', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={16} /> إغلاق
              </button>
            ) : (
              <button key="open" type="button" onClick={() => setShowAddForm(true)} style={{ padding: '9px 16px', borderRadius: '11px', backgroundColor: 'var(--primary)', color: 'white', border: '1px solid var(--primary)', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> وسام جديد
              </button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <div data-testid="add-badge-form" style={{ ...card, border: '1.5px solid var(--primary)' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>إضافة وسام جديد</h4>
              <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>يُمنح تلقائيًا لكل طالب يصل إلى الحد المطلوب.</p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center', width: '120px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}><BadgePreview badge={newBadgePreview} size={60} /></div>
                  <div style={{ marginTop: '8px', fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{newBadge.title || 'اسم الوسام'}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>معاينة</div>
                </div>
                <div style={{ flex: 1, minWidth: '240px', display: 'grid', gap: '10px' }}>
                  <div>
                    <label style={fieldLabel} htmlFor="new-badge-title">اسم الوسام</label>
                    <input id="new-badge-title" aria-label="اسم الوسام الجديد" placeholder="مثال: صاحب الثلاثين يومًا" value={newBadge.title} onChange={event => setNewBadge({ ...newBadge, title: event.target.value })} style={input} />
                  </div>
                  <div>
                    <label style={fieldLabel} htmlFor="new-badge-description">الوصف (اختياري)</label>
                    <textarea id="new-badge-description" aria-label="وصف الوسام الجديد" rows={2} placeholder="يُكتب تلقائيًا من الشرط إن تركته فارغًا" value={newBadge.description} onChange={event => setNewBadge({ ...newBadge, description: event.target.value })} style={{ ...input, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '160px' }}>
                      <label style={fieldLabel} htmlFor="new-badge-type">يُفتح عندما يصل الطالب إلى</label>
                      <select id="new-badge-type" aria-label="شرط الوسام الجديد" value={newBadge.type} onChange={event => setNewBadge({ ...newBadge, type: event.target.value })} style={input}>
                        {Object.entries(badgeCriteria).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '90px' }}>
                      <label style={fieldLabel} htmlFor="new-badge-value">الحد الأدنى</label>
                      <input id="new-badge-value" aria-label="حد الوسام الجديد" type="number" min="1" value={newBadge.value} onChange={event => setNewBadge({ ...newBadge, value: event.target.value })} style={input} />
                    </div>
                  </div>
                  <button type="button" data-testid="add-badge" disabled={saving} onClick={addBadge} style={{ padding: '10px 18px', background: 'var(--primary)', color: 'white', border: 0, borderRadius: '10px', justifySelf: 'start', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> إضافة الوسام
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Badge list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedBadges.map((badge, index) => (
              <div key={badge.id} data-testid={`badge-setting-${badge.id}`} style={{ ...card, padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap', opacity: badge.visible ? 1 : 0.75 }}>
                <BadgePreview badge={badge} />

                <div style={{ flex: 1, minWidth: '220px', display: 'grid', gap: '8px' }}>
                  <input aria-label={`عنوان ${badge.id}`} value={badge.title} onChange={event => updateBadge(badge.id, 'title', event.target.value)} style={{ ...input, fontWeight: 800, fontSize: '15px' }} />
                  <textarea aria-label={`وصف ${badge.id}`} rows={2} value={badge.description} onChange={event => updateBadge(badge.id, 'description', event.target.value)} style={{ ...input, fontSize: '13px', resize: 'vertical', lineHeight: 1.6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--bg-color)', fontWeight: 700 }}>يُفتح عند: {badgeRuleText(badge)}</span>
                    {badge.custom && <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>مخصص</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginInlineStart: 'auto' }}>
                  <Switch checked={badge.visible} onChange={value => updateBadge(badge.id, 'visible', value)} label={badge.visible ? <><Eye size={14} /> ظاهر</> : <><EyeOff size={14} /> مخفي</>} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" aria-label={`نقل ${badge.title} للأعلى`} title="للأعلى" disabled={index === 0} onClick={() => moveBadge(badge.id, -1)} style={{ ...iconButton, opacity: index === 0 ? 0.35 : 1 }}><ArrowUp size={15} /></button>
                    <button type="button" aria-label={`نقل ${badge.title} للأسفل`} title="للأسفل" disabled={index === sortedBadges.length - 1} onClick={() => moveBadge(badge.id, 1)} style={{ ...iconButton, opacity: index === sortedBadges.length - 1 ? 0.35 : 1 }}><ArrowDown size={15} /></button>
                    {badge.custom && confirmRemoveId !== badge.id && (
                      <button type="button" data-testid={`remove-badge-${badge.id}`} aria-label={`حذف ${badge.title}`} title="حذف الوسام" disabled={saving} onClick={() => setConfirmRemoveId(badge.id)} style={{ ...iconButton, color: '#DC2626' }}><Trash2 size={15} /></button>
                    )}
                  </div>
                  {badge.custom && confirmRemoveId === badge.id && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" data-testid={`confirm-remove-badge-${badge.id}`} onClick={() => removeBadge(badge.id)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: 'white', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>تأكيد الحذف</button>
                      <button type="button" onClick={() => setConfirmRemoveId(null)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>تراجع</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {status && (
        <div role={status.type === 'error' ? 'alert' : 'status'} data-testid="experience-settings-status" style={{
          padding: '11px 14px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
          background: status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'var(--primary-light)',
          color: status.type === 'error' ? '#DC2626' : 'var(--primary)',
          border: `1px solid ${status.type === 'error' ? '#EF4444' : 'var(--primary)'}`
        }}>
          {status.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {status.text}
        </div>
      )}

      {/* Save bar: sticks to the bottom while there are unsaved edits. */}
      <div style={{
        position: isDirty ? 'sticky' : 'static', bottom: '12px', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
        padding: '12px 16px', borderRadius: '14px',
        background: isDirty ? 'var(--bg-surface)' : 'transparent',
        border: isDirty ? '1.5px solid var(--primary)' : '1px solid transparent',
        boxShadow: isDirty ? '0 8px 24px rgba(0,0,0,0.12)' : 'none'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: isDirty ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {isDirty ? 'لديك تعديلات غير محفوظة' : 'كل التعديلات محفوظة'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isDirty && (
            <button type="button" onClick={() => { setDraft(configuration); setStatus(null); }} disabled={saving} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>تراجع</button>
          )}
          <button type="button" data-testid="save-experience-settings" disabled={saving || !isDirty} onClick={() => save()} style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: isDirty && !saving ? 'pointer' : 'not-allowed', opacity: isDirty && !saving ? 1 : 0.5 }}>
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  );
}
