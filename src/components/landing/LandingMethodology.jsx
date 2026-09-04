import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  RotateCw, 
  Compass, 
  Flame, 
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingMethodology = ({ onDemoLogin }) => {
  const { isRTL } = useLanguage();

  const fortresses = [
    {
      number: isRTL ? '١' : '1',
      title: isRTL ? 'قراءة الحدر اليومي (الختمة)' : 'Daily Continuous Reading (Hadr)',
      time: isRTL ? '١٥ - ٢٠ دقيقة' : '15 - 20 min',
      desc: isRTL 
        ? 'قراءة سريعة مع مراعاة أحكام التجويد بمقدار جزء إلى جزأين يومياً لجعل اللسان معتاداً على الألفاظ القرآنية.'
        : 'Fluent, continuous reading (1-2 Juz daily) keeping the tongue accustomed to Quranic phonetics.',
      color: 'var(--primary)'
    },
    {
      number: isRTL ? '٢' : '2',
      title: isRTL ? 'التحضير المسبق والاستماع' : 'Advance Prep & Listening',
      time: isRTL ? '١٠ - ١٥ دقيقة' : '10 - 15 min',
      desc: isRTL 
        ? 'الاستماع لصوت قارئ متقن وقراءة الصفحة الجديدة عدة مرات قبل جلسة الحفظ الفعلية لفك الألفاظ والتشكيل.'
        : 'Listening to an authentic Qari and previewing the new page multiple times prior to memorization.',
      color: 'var(--accent)'
    },
    {
      number: isRTL ? '٣' : '3',
      title: isRTL ? 'الحفظ الجديد بتركيز' : 'Focused New Memorization',
      time: isRTL ? '٢٠ - ٣٠ دقيقة' : '20 - 30 min',
      desc: isRTL 
        ? 'حفظ مقدار اليوم المقرر (صفحة أو وجهين) بربط الآيات بالخرائط الذهنية وتسميعها كاملة للذكاء الاصطناعي.'
        : 'Dedicated session for the assigned new portion, reinforced with mind maps and AI voice recitation.',
      color: 'var(--secondary)'
    },
    {
      number: isRTL ? '٤' : '4',
      title: isRTL ? 'مراجعة الماضي القريب' : 'Near Past Review',
      time: isRTL ? '١٥ - ٢٠ دقيقة' : '15 - 20 min',
      desc: isRTL 
        ? 'تكرار آخر ٢٠ صفحة تم حفظها بشكل يومي لتثبيتها في الذاكرة قصيرة المدى ونقلها للذاكرة الراسخة.'
        : 'Daily cycling of the last 20 pages memorized, solidifying short-term recall into permanent memory.',
      color: 'var(--primary)'
    },
    {
      number: isRTL ? '٥' : '5',
      title: isRTL ? 'مراجعة الماضي البعيد' : 'Distant Past Review',
      time: isRTL ? '٢٠ - ٣٠ دقيقة' : '20 - 30 min',
      desc: isRTL 
        ? 'مراجعة دورية للمحفوظ القديم كاملاً على دورة أسبوعية أو شهرية لضمان عدم تفلت أي جزء إطلاقاً.'
        : 'Systematic weekly/monthly rotation through all previous portions, preventing any verse from fading.',
      color: '#8B5CF6'
    }
  ];

  return (
    <section id="methodology" style={{
      padding: '90px 0',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="badge-modern" style={{ marginBottom: '14px' }}>
            <ShieldCheck size={14} />
            <span>{isRTL ? 'المنهجية العلمية الراسخة' : 'Proven Scientific Methodology'}</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '14px'
          }}>
            {isRTL ? 'نظام' : 'The Proven'}{' '}
            <span className="text-gradient">{isRTL ? 'الحصون الخمسة' : 'Five Fortresses System'}</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {isRTL 
              ? 'نظام علمي متكامل لحفظ القرآن الكريم وتثبيته يعالج مشكلة النسيان والتفلت بشكل جذري من خلال توزيع الجهد اليومي على خمسة حصون منيعة.'
              : 'A structured methodology that permanently eliminates forgetfulness by balancing daily effort across five protective fortresses.'}
          </p>
        </div>

        {/* 5 Fortress Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '48px'
        }}>
          {fortresses.map((fort, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              style={{
                padding: '24px 20px',
                borderRadius: '20px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--primary-border)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'var(--primary-light)',
                    color: fort.color,
                    fontSize: '18px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    {fort.number}
                  </span>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-surface)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <Clock size={12} />
                    {fort.time}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                  lineHeight: 1.4
                }}>
                  {fort.title}
                </h3>

                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {fort.desc}
                </p>
              </div>

              <div style={{
                marginTop: '20px',
                paddingTop: '12px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary)'
              }}>
                <CheckCircle2 size={13} />
                <span>مجدول تلقائياً بالذكاء الاصطناعي</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Bar below Fortress */}
        <div style={{
          padding: '24px 32px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              هل ترغب في توليد خطة الحصون الخمسة المخصصة لمستواك؟ 🎯
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              يحدد النظام مقدار حفظك الحالي ويقسم لك الحصون الخمسة تلقائياً في ثوانٍ معدودة.
            </p>
          </div>

          <button
            onClick={onDemoLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: 'white',
              border: 'none',
              fontSize: '14.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}
          >
            <span>ابدأ خطتك الخماسية الآن</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>

      </div>
    </section>
  );
};
