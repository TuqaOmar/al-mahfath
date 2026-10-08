import React from 'react';
import { motion } from 'framer-motion';

/**
 * Mid-sagittal head section (face looking left) showing where a letter is articulated.
 * Tongue, lips and velum are built from point sets with a fixed command structure,
 * so framer-motion can morph their `d` between letters.
 */

const REST_TONGUE = { T: [92, 198], B: [118, 188], F: [158, 182], D: [205, 180], K: [248, 190], R: [272, 222], Rb: [268, 292] };

const LIPS = {
  open: { ux: 0, ly: 196, lx: 44 },
  apart: { ux: 0, ly: 202, lx: 46 },
  closed: { ux: 0, ly: 183, lx: 42 },
  round: { ux: -8, ly: 187, lx: 34 },
  labiodental: { ux: 0, ly: 183, lx: 56 }
};

const POSES = {
  jawf: { tongue: { F: [158, 192], D: [205, 190] }, lips: 'open', velum: 'up', air: 'oral', contact: null },
  aqsaHalq: { tongue: {}, lips: 'open', velum: 'up', air: 'oral', contact: [294, 303] },
  wasatHalq: { tongue: { K: [256, 196], R: [290, 224] }, lips: 'open', velum: 'up', air: 'oral', contact: [300, 236] },
  adnaHalq: { tongue: { D: [220, 166], K: [262, 158], R: [276, 214] }, lips: 'open', velum: 'up', air: 'oral', contact: [288, 172] },
  qaf: { tongue: { F: [165, 172], D: [225, 150], K: [265, 141] }, lips: 'open', velum: 'up', air: 'oral', contact: [266, 140] },
  kaf: { tongue: { F: [170, 150], D: [222, 131], K: [255, 152] }, lips: 'open', velum: 'up', air: 'oral', contact: [222, 128] },
  wasatLisan: { tongue: { B: [122, 172], F: [165, 133], D: [210, 138], K: [250, 172] }, lips: 'open', velum: 'up', air: 'oral', contact: [168, 129] },
  dad: { tongue: { B: [120, 176], F: [160, 150], D: [208, 145], K: [252, 160] }, lips: 'open', velum: 'up', air: 'oral', contact: [182, 154], molars: true },
  lam: { tongue: { T: [100, 162], B: [124, 172], F: [160, 180] }, lips: 'open', velum: 'up', air: 'oral', contact: [99, 160] },
  noon: { tongue: { T: [97, 165], B: [122, 175] }, lips: 'open', velum: 'down', air: 'nasal', contact: [96, 163] },
  ra: { tongue: { T: [106, 157], B: [126, 163], F: [162, 176] }, lips: 'open', velum: 'up', air: 'oral', contact: [106, 155] },
  nitiyya: { tongue: { T: [88, 170], B: [110, 175] }, lips: 'open', velum: 'up', air: 'oral', contact: [87, 168] },
  asaliyya: { tongue: { T: [86, 191], B: [104, 176], F: [150, 180] }, lips: 'open', velum: 'up', air: 'oral', contact: [86, 189] },
  lithawiyya: { tongue: { T: [73, 187], B: [98, 186] }, lips: 'apart', velum: 'up', air: 'oral', contact: [76, 185] },
  faa: { tongue: {}, lips: 'labiodental', velum: 'up', air: 'oral', contact: [78, 184] },
  shafatanClosed: { tongue: {}, lips: 'closed', velum: 'up', air: 'oral', contact: [44, 183] },
  shafatanRound: { tongue: { K: [255, 176] }, lips: 'round', velum: 'up', air: 'oral', contact: [36, 186] },
  ghunna: { tongue: { T: [97, 165], B: [122, 175] }, lips: 'open', velum: 'down', air: 'nasal', contact: [170, 100] }
};

// Front articulations that also raise the back of the tongue (isti'la + itbaq).
const EMPHATIC_FRONT = ['dad', 'nitiyya', 'asaliyya', 'lithawiyya'];

export const resolvePose = (poseId, { emphatic = false, nasal = false } = {}) => {
  const pose = POSES[poseId] || POSES.jawf;
  const tongue = { ...REST_TONGUE, ...pose.tongue };
  if (emphatic && EMPHATIC_FRONT.includes(poseId)) {
    tongue.F = [tongue.F[0], Math.min(tongue.F[1], 140)];
    tongue.D = [tongue.D[0], Math.min(tongue.D[1], 140)];
    tongue.K = [tongue.K[0], Math.min(tongue.K[1], 150)];
  }
  return {
    ...pose,
    tongue,
    velum: nasal ? 'down' : pose.velum,
    air: nasal ? 'nasal' : pose.air
  };
};

const f = (n) => Math.round(n * 10) / 10;

/** Catmull-Rom spline through the points, as an open path. */
const spline = (pts) => {
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
};

/** Smooth closed tongue outline: spline through the dorsum points, fixed floor underneath. */
const tonguePath = (t) =>
  `${spline([t.T, t.B, t.F, t.D, t.K, t.R, t.Rb])} C 230 286, 140 256, 100 226 C 90 220, ${t.T[0] - 4} ${t.T[1] + 8}, ${t.T[0]} ${t.T[1]} Z`;

// Roof of the mouth (hard palate, then lower edge of the raised velum), front to back.
const PALATE = [[88, 158], [118, 141], [165, 127], [210, 124], [242, 132], [270, 140]];

const yAt = (pts, x) => {
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x >= x1 && x <= x2) return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
  }
  return x < pts[0][0] ? pts[0][1] : pts[pts.length - 1][1];
};

/** Oral airflow runs between the tongue's back and the palate, so it never crosses the tongue. */
const oralAirPath = (t, lips) => {
  const dorsum = [t.T, t.B, t.F, t.D, t.K];
  const channel = [250, 205, 160, 115].map(x => [x, (yAt(dorsum, x) + yAt(PALATE, x)) / 2]);
  const lipY = (182 + lips.ly) / 2;
  return spline([[294, 330], [292, 250], [282, 190], ...channel, [70, lipY], [18, lipY]]);
};

const upperLipPath = ({ ux }) =>
  `M 56 140 C ${48 + ux} 150, ${38 + ux} 160, ${40 + ux} 172 C ${41 + ux} 179, ${50 + ux} 183, 62 183 L 79 182 L 82 162 C 74 150, 66 144, 56 140 Z`;

const lowerLipPath = ({ ly, lx }) =>
  `M 80 ${ly} C 70 ${ly - 3}, ${lx + 6} ${ly - 3}, ${lx} ${ly + 5} C ${lx - 3} ${ly + 16}, ${lx + 4} ${ly + 26}, 56 222 L 84 222 Z`;

const VELUM = {
  up: 'M 240 124 C 270 122, 296 130, 306 140 C 300 146, 268 140, 240 136 Z',
  down: 'M 240 124 C 262 128, 270 160, 272 180 C 262 182, 254 150, 240 136 Z'
};

const NASAL_AIR = 'M 294 330 C 294 280, 294 200, 296 152 C 296 110, 240 100, 170 100 C 110 100, 70 112, 32 126';

const COLORS = {
  tongue: '#e07a8b',
  tongueEdge: '#b4505f',
  palate: '#efb8bf',
  lips: '#d97f8e',
  teeth: '#fffdf7',
  teethEdge: '#b8c2cf'
};

const LABELS = [
  { x: 180, y: 104, ar: 'الخيشوم', en: 'Nasal cavity' },
  { x: 168, y: 113, ar: 'الحنك الصلب', en: 'Hard palate', small: true },
  { x: 274, y: 118, ar: 'الحنك اللين', en: 'Soft palate', small: true },
  { x: 292, y: 262, ar: 'الحلق', en: 'Throat' },
  { x: 190, y: 228, ar: 'اللسان', en: 'Tongue' },
  { x: 32, y: 240, ar: 'الشفتان', en: 'Lips' },
  { x: 250, y: 318, ar: 'الوتران الصوتيان', en: 'Vocal folds', small: true }
];

const transition = { type: 'spring', stiffness: 120, damping: 18 };

export const ArticulationDiagram = ({ pose, ghostPose, region, showLabels = true, lang = 'ar', ariaLabel }) => {
  const lips = LIPS[pose.lips];
  const accent = 'var(--primary)';
  const hl = (id) => region === id;

  return (
    <svg viewBox="0 0 400 360" role="img" aria-label={ariaLabel} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Head silhouette */}
      <path
        d="M 70 8 C 170 -14 360 10 372 130 C 382 210 362 270 352 360 L 178 360 C 172 318 160 296 134 284 C 100 274 70 270 60 260 C 50 250 48 236 56 222 L 60 186 L 58 140 C 46 138 34 132 28 122 C 26 112 40 98 50 84 C 58 64 62 40 70 8 Z"
        fill="var(--bg-color)" stroke="var(--text-muted)" strokeWidth="1.5"
      />

      {/* Nasal cavity */}
      <path
        d="M 60 128 C 70 100, 110 86, 170 84 C 230 82, 290 90, 312 108 L 312 140 C 290 128, 260 122, 242 124 C 190 116, 120 118, 60 128 Z"
        fill={hl('khayshum') ? accent : 'var(--bg-surface-elevated)'} fillOpacity={hl('khayshum') ? 0.25 : 1}
        stroke="var(--text-muted)" strokeWidth="1"
      />

      {/* Oral cavity */}
      <path
        d="M 80 184 L 90 158 C 120 138, 165 126, 210 126 C 228 127, 238 130, 242 134 L 270 150 L 268 250 C 230 270, 140 252, 98 224 L 82 192 Z"
        fill={hl('jawf') ? accent : 'var(--bg-surface-elevated)'} fillOpacity={hl('jawf') ? 0.25 : 1}
      />

      {/* Pharynx */}
      <path
        d="M 262 146 L 312 140 L 312 330 L 284 330 C 280 300, 272 280, 266 250 Z"
        fill={hl('halq') ? accent : 'var(--bg-surface-elevated)'} fillOpacity={hl('halq') ? 0.25 : 1}
      />

      {/* Previous letter, for comparison */}
      {ghostPose && (
        <path d={tonguePath(ghostPose.tongue)} fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
      )}

      {/* Tongue */}
      <motion.path
        initial={false}
        animate={{ d: tonguePath(pose.tongue) }}
        transition={transition}
        fill={COLORS.tongue}
        stroke={hl('lisan') ? accent : COLORS.tongueEdge}
        strokeWidth={hl('lisan') ? 3 : 1.5}
      />

      {/* Hard palate */}
      <path
        d="M 88 158 C 118 138, 165 124, 210 124 C 226 124, 236 128, 242 130 L 242 122 C 200 112, 120 114, 74 128 Z"
        fill={COLORS.palate} stroke={COLORS.tongueEdge} strokeWidth="1"
      />

      {/* Soft palate / uvula */}
      <motion.path initial={false} animate={{ d: VELUM[pose.velum] }} transition={transition} fill={COLORS.palate} stroke={COLORS.tongueEdge} strokeWidth="1" />

      {/* Back wall of the throat, epiglottis, vocal folds */}
      <path d="M 300 92 C 318 120, 316 200, 314 260 C 313 300, 308 330, 306 360" fill="none" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 270 272 C 272 254, 282 242, 292 242" fill="none" stroke={COLORS.tongueEdge} strokeWidth="3" strokeLinecap="round" />
      <path d="M 276 306 L 292 302 M 312 306 L 296 302" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Upper molars, shown for dad */}
      {pose.molars && (
        <g>
          <rect x="160" y="140" width="48" height="10" rx="4" fill={COLORS.teeth} stroke={accent} strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="184" y="136" textAnchor="middle" fontSize="8" fill={accent}>{lang === 'ar' ? 'الأضراس العليا (جانبيًا)' : 'Upper molars (side)'}</text>
        </g>
      )}

      {/* Incisors */}
      <path d="M 79 185 L 76 172 C 76 164, 82 158, 90 158 L 93 166 C 90 172, 86 180, 83 186 Z" fill={COLORS.teeth} stroke={COLORS.teethEdge} strokeWidth="1" />
      <path d="M 80 191 L 82 205 C 83 214, 90 218, 96 216 L 94 205 C 90 198, 86 193, 83 190 Z" fill={COLORS.teeth} stroke={COLORS.teethEdge} strokeWidth="1" />

      {/* Lips */}
      <motion.path
        initial={false} animate={{ d: upperLipPath(lips) }} transition={transition}
        fill={COLORS.lips} stroke={hl('shafatan') ? accent : COLORS.tongueEdge} strokeWidth={hl('shafatan') ? 2.5 : 1}
      />
      <motion.path
        initial={false} animate={{ d: lowerLipPath(lips) }} transition={transition}
        fill={COLORS.lips} stroke={hl('shafatan') ? accent : COLORS.tongueEdge} strokeWidth={hl('shafatan') ? 2.5 : 1}
      />

      {/* Airflow */}
      <motion.path
        key={pose.air}
        d={pose.air === 'nasal' ? NASAL_AIR : oralAirPath(pose.tongue, lips)}
        fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" opacity="0.8"
        animate={{ strokeDashoffset: [0, -24] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />

      {/* Contact point */}
      {pose.contact && (
        <g>
          <motion.circle
            initial={false}
            animate={{ cx: pose.contact[0], cy: pose.contact[1], r: [6, 11, 6], opacity: [0.5, 0.15, 0.5] }}
            transition={{ cx: transition, cy: transition, r: { duration: 1.6, repeat: Infinity }, opacity: { duration: 1.6, repeat: Infinity } }}
            fill={accent}
          />
          <motion.circle initial={false} animate={{ cx: pose.contact[0], cy: pose.contact[1] }} transition={transition} r="4" fill={accent} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}

      {showLabels && LABELS.map(label => (
        <text
          key={label.ar}
          x={label.x} y={label.y} textAnchor="middle"
          fontSize={label.small ? 8 : 10} fontWeight="700" fill="var(--text-secondary)"
          stroke="var(--bg-color)" strokeWidth="3" paintOrder="stroke"
        >
          {lang === 'ar' ? label.ar : label.en}
        </text>
      ))}
    </svg>
  );
};

export default ArticulationDiagram;
