import React from 'react';
import { Check, Lock, Trophy } from 'lucide-react';
import { declaredPages } from '../lib/memorization';
import { badgeRule } from '../lib/badgeRules';

// Arabic count agreement: 1 يوم، 3 أيام، 11 يومًا.
const UNITS = {
  streak: ['يوم', 'أيام', 'يومًا'],
  pages: ['صفحة', 'صفحات', 'صفحة'],
  fortresses: ['حصن', 'حصون', 'حصنًا'],
  level: ['مستوى', 'مستويات', 'مستوى'],
  xp: ['XP', 'XP', 'XP']
};
const withUnit = (n, unit) => {
  const forms = UNITS[unit];
  const value = n.toLocaleString('en-US');
  if (!forms) return value;
  return `${value} ${n >= 3 && n <= 10 ? forms[1] : n > 10 ? forms[2] : forms[0]}`;
};

const ProgressBar = ({ value, max }) => (
  <div style={{ height: '6px', borderRadius: '999px', background: 'var(--glass-border)', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.round((value / max) * 100))}%`, height: '100%', borderRadius: '999px', background: 'var(--primary)', transition: 'width 0.4s ease' }} />
  </div>
);

export const AchievementsView = ({ user, badges, fortressesToday = {} }) => {
  const earned = Array.isArray(user?.earnedBadges) ? user.earnedBadges : [];
  const metrics = {
    streak: Number(user?.streak || 0),
    xp: Number(user?.xp || 0),
    level: Number(user?.level || 0),
    pages: declaredPages(user).length,
    fortresses: Object.values(fortressesToday).filter(Boolean).length
  };

  const items = [...badges].filter(badge => badge.visible).sort((a, b) => a.order - b.order).map(badge => {
    const rule = badgeRule(badge);
    const spec = rule.metric
      ? { icon: rule.icon, current: Number(metrics[rule.metric] || 0), target: rule.target, unit: rule.metric }
      : { icon: rule.icon };
    const unlocked = earned.includes(badge.id) || (spec.target != null && spec.current >= spec.target);
    return { ...badge, ...spec, unlocked };
  });

  const unlockedItems = items.filter(item => item.unlocked);
  const lockedItems = items.filter(item => !item.unlocked);
  const nextUp = lockedItems
    .filter(item => item.target)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];

  const renderBadge = (item) => {
    const Icon = item.icon;
    return (
      <div key={item.id} data-testid={`achievement-${item.id}`} data-unlocked={item.unlocked} style={{
        position: 'relative',
        padding: '18px 14px 16px',
        borderRadius: '16px',
        textAlign: 'center',
        background: item.unlocked ? 'linear-gradient(160deg, var(--primary-light) 0%, var(--bg-surface) 100%)' : 'var(--bg-color)',
        border: `1px solid ${item.unlocked ? 'var(--primary)' : 'var(--glass-border)'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: item.unlocked ? 'var(--primary)' : 'var(--bg-surface)',
            color: item.unlocked ? 'white' : 'var(--text-secondary)',
            border: item.unlocked ? 'none' : '1.5px dashed var(--glass-border)',
            boxShadow: item.unlocked ? '0 6px 16px rgba(16, 185, 129, 0.3)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: item.unlocked ? 1 : 0.7
          }}>
            <Icon size={26} />
          </div>
          <span style={{
            position: 'absolute', bottom: '-2px', insetInlineEnd: '-4px',
            width: '22px', height: '22px', borderRadius: '50%',
            background: item.unlocked ? '#F59E0B' : 'var(--text-secondary)', color: 'white',
            border: '2px solid var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {item.unlocked ? <Check size={12} strokeWidth={3} /> : <Lock size={11} />}
          </span>
        </div>

        <h3 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800, color: item.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.title}</h3>
        <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{item.description}</p>

        {!item.unlocked && item.target != null && (
          <div style={{ width: '100%', marginTop: 'auto', paddingTop: '4px' }}>
            <ProgressBar value={item.current} max={item.target} />
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '5px' }}>
              {Math.min(item.current, item.target).toLocaleString('en-US')} من {withUnit(item.target, item.unit)}
            </div>
          </div>
        )}
        {item.unlocked && (
          <span style={{ marginTop: 'auto', fontSize: '11.5px', fontWeight: 800, color: 'var(--primary)' }}>✓ مُكتسب</span>
        )}
      </div>
    );
  };

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))', gap: '12px' };
  const sectionTitle = { margin: '0 0 10px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
      {/* Summary */}
      <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={28} />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>أوسمة صحبة القرآن</h2>
          <p style={{ margin: '2px 0 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            حصلت على <strong style={{ color: 'var(--primary)' }}>{unlockedItems.length}</strong> من {items.length} أوسمة
          </p>
          {items.length > 0 && <ProgressBar value={unlockedItems.length} max={items.length} />}
        </div>
        {nextUp && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-color)', fontSize: '12.5px', color: 'var(--text-secondary)', minWidth: '180px' }}>
            <div style={{ fontWeight: 700 }}>الأقرب إليك</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>{nextUp.title}</div>
            <div>بقي {withUnit(nextUp.target - nextUp.current, nextUp.unit)}</div>
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد أوسمة مفعّلة حاليًا.</div>
      )}

      {unlockedItems.length > 0 && (
        <section>
          <h3 style={sectionTitle}>أوسمتك</h3>
          <div style={grid}>{unlockedItems.map(renderBadge)}</div>
        </section>
      )}

      {lockedItems.length > 0 && (
        <section>
          <h3 style={sectionTitle}>{unlockedItems.length > 0 ? 'في الطريق إليها' : 'ابدأ رحلتك نحو أول وسام'}</h3>
          <div style={grid}>{lockedItems.map(renderBadge)}</div>
        </section>
      )}
    </div>
  );
};

export default AchievementsView;
