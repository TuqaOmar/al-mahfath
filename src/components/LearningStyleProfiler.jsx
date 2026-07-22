import React, { useState } from 'react';
import { BrainCircuit, Eye, Volume2, Fingerprint, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

export const LearningStyleProfiler = () => {
  // Simulated implicit behavior metrics calculated over the last 7 sessions
  const [metrics, setMetrics] = useState({
    auditoryTime: 65,   // 65% listening time
    visualTime: 85,     // 85% visual map & page viewing time
    kinestheticClicks: 92, // 92 interaction clicks (Tasbeeh, counters)
    analyticalReads: 40  // 40% reading meanings/Tadabbur
  });

  // Calculate dominant learning style scientifically
  const getDominantStyle = () => {
    const scores = [
      { type: 'visual', name: 'بصري (Visual)', icon: Eye, score: metrics.visualTime, desc: 'تعتمد على الذاكرة الصورية ورؤية موقع الآية في الصفحة والمصادف الملونة.' },
      { type: 'kinesthetic', name: 'حركي / تفاعلي (Kinesthetic)', icon: Fingerprint, score: metrics.kinestheticClicks, desc: 'تثبت حفظك عبر التكرار اليدوي، المسبحة التفاعلية، والكتابة.' },
      { type: 'auditory', name: 'سمعي (Auditory)', icon: Volume2, score: metrics.auditoryTime, desc: 'تعتمد على نبرة القارئ وترديد السماع والتكرار الصوتي للآيات.' },
      { type: 'analytical', name: 'تحليلي / تدبري (Analytical)', icon: BookOpen, score: metrics.analyticalReads, desc: 'تحفظ عبر فهم المعاني، أسباب النزول، وربط المتشابهات أولاً.' }
    ];

    scores.sort((a, b) => b.score - a.score);
    return scores[0];
  };

  const dominant = getDominantStyle();

  return (
    <div style={{
      padding: '28px',
      borderRadius: '24px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-soft)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BrainCircuit size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>تحليل نمط الحفظ الذكي (Implicit Learning Profiler)</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>تحليل غير مباشر لسلوك التفاعل بدون أسئلة</span>
        </div>
      </div>

      {/* Dominant Badge */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1px solid var(--primary)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <dominant.icon size={26} />
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
            🎯 النمط المكتشف تلقائياً لك:
          </span>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{dominant.name}</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{dominant.desc}</p>
        </div>
      </div>

      {/* How the platform customizes the experience */}
      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
        ⚙️ كيف تكيّف المنصة واجهتك بناءً على هذا النمط؟
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>👁️ للنمط البصري:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تظليل ألوان المصحف العثماني وإبراز مواقع الآيات مكانياً.</span>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>🎧 للنمط السمعي:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تلقيم صوتي تلقائي آية بآية وإبراز مشغل القارئ المفضل.</span>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>🔲 للنمط الحركي:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>تفعيل عداد المسبحة باللمس واختبارات سحب الكلمات اليدوية.</span>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>🧠 للنمط التحليلي:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>عرض شجرة المتشابهات ولطائف التدبر قبل التكرار.</span>
        </div>
      </div>
    </div>
  );
};
