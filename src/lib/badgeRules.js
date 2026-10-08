import { Award, Brain, Flame, Shield, Sparkles, Trophy } from 'lucide-react';
import { badgeCriteria } from './uiConfiguration';

// Unlock rules for the six built-in badges (custom badges carry their own `criterion`).
// `metric` + `target` = unlocks automatically; no metric = only when listed in user.earnedBadges.
export const BUILT_IN_BADGE_RULES = Object.freeze({
  streak_7: { icon: Flame, metric: 'streak', target: 7 },
  baqarah: { icon: Award },
  xp_500: { icon: Sparkles, metric: 'xp', target: 500 },
  fortresses_3: { icon: Shield, metric: 'fortresses', target: 3 },
  stability_95: { icon: Brain },
  level_5: { icon: Trophy, metric: 'level', target: 5 }
});

const metricLabels = { ...badgeCriteria, fortresses: 'حصون اليوم المنجزة' };

// { icon, metric, target } for any badge, built-in or custom.
export const badgeRule = badge => {
  const builtIn = BUILT_IN_BADGE_RULES[badge.id];
  if (builtIn) return builtIn;
  if (badge.criterion) return { icon: Award, metric: badge.criterion.type, target: Number(badge.criterion.value) };
  return { icon: Award };
};

// Human-readable unlock condition, shown to admins.
export const badgeRuleText = badge => {
  const rule = badgeRule(badge);
  return rule.metric ? `${metricLabels[rule.metric] || rule.metric} ≥ ${rule.target}` : 'يُمنح عند تسجيله في حساب الطالب';
};
