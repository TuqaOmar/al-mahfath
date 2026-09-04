import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Mic, Award, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingStats = () => {
  const { isRTL } = useLanguage();

  const stats = [
    {
      icon: Users,
      value: '+50,000',
      label: isRTL ? 'حافظ ومعلم نشط' : 'Active Memorizers',
      subtext: isRTL ? 'في مختلف دول العالم' : 'Across 40+ countries',
      color: 'var(--primary)'
    },
    {
      icon: BookOpen,
      value: '+2.5M',
      label: isRTL ? 'صفحة تم حفظها ومراجعتها' : 'Pages Reviewed',
      subtext: isRTL ? 'بمنهجية الحصون الخمسة' : 'With 5-Fortresses System',
      color: 'var(--accent)'
    },
    {
      icon: Mic,
      value: '99.4%',
      label: isRTL ? 'دقة التعرف والتصحيح اللحظي' : 'Voice AI Accuracy',
      subtext: isRTL ? 'محرك ذكاء اصطناعي صوتي متطور' : 'Real-time phoneme checking',
      color: 'var(--secondary)'
    },
    {
      icon: ShieldCheck,
      value: '100%',
      label: isRTL ? 'مؤصل علمياً ومنهجياً' : 'Scientifically Structured',
      subtext: isRTL ? 'مبني على قواعد الإتقان الراسخة' : 'Based on proven mastery',
      color: 'var(--primary)'
    }
  ];

  return (
    <section style={{
      padding: '40px 0',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--glass-border)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                borderRadius: '16px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                transition: 'all 0.25s ease'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-border)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                flexShrink: 0
              }}>
                <stat.icon size={22} />
              </div>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-heading)'
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {stat.subtext}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
