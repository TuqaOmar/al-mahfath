import React from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  ShieldCheck, 
  GitFork, 
  Sparkles, 
  BellRing, 
  Users, 
  Award,
  BookOpen,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingFeatures = () => {
  const { isRTL } = useLanguage();

  const features = [
    {
      icon: BrainCircuit,
      tag: isRTL ? 'محرك صوتي ذكي' : 'Voice AI Engine',
      title: isRTL ? 'التسميع الصوتي والتصحيح اللحظي' : 'Real-time Voice AI Recitation',
      desc: isRTL 
        ? 'يتعرف الذكاء الاصطناعي على تلاوتك كلمة بكلمة، ويبرز أي خطأ في الحفظ أو التشكيل مع تقديم تنبيه فوري لطيف دون إحباط.'
        : 'AI tracks your recitation word-by-word, highlighting errors and offering gentle, instant guidance.',
      color: 'var(--primary)'
    },
    {
      icon: ShieldCheck,
      tag: isRTL ? 'منهجية راسخة' : 'Proven System',
      title: isRTL ? 'نظام الحصون الخمسة المتكامل' : 'Integrated 5-Fortresses System',
      desc: isRTL 
        ? 'جدولة آلية لورد الحفظ الجديد، التحضير، ومراجعة الماضي القريب والبعيد لضمان رسوخ القرآن كالجبال الرواسي في صدرك.'
        : 'Automated scheduling for new memorization, prep, and near/distant review guaranteeing unshakable retention.',
      color: 'var(--accent)'
    },
    {
      icon: GitFork,
      tag: isRTL ? 'تثبيت بصري' : 'Visual Retention',
      title: isRTL ? 'الخرائط الذهنية وتصنيف الآيات' : 'Thematic Mind Maps',
      desc: isRTL 
        ? 'ربط بصري وموضوعي لآيات السورة الكريمة يوضح الوحدة الموضوعية وييسر الربط الذهني بين أوائل الآيات وأواخرها.'
        : 'Visual thematic breakdowns linking verse beginnings and endings into cohesive conceptual maps.',
      color: 'var(--secondary)'
    },
    {
      icon: Sparkles,
      tag: isRTL ? 'إتقان المتشابهات' : 'Verse Similarities',
      title: isRTL ? 'كاشف المتشابهات اللفظية' : 'Similar Verses Identifier',
      desc: isRTL 
        ? 'تنبيهك للآيات المتشابهة في السور الأخرى مع توضيح الفروق الدقيقة وقواعد الضبط والتوجيه لتجنب الخلط أثناء التسميع.'
        : 'Flags similar verses across Surahs with clear mnemonic distinctions to prevent confusion.',
      color: '#8B5CF6'
    },
    {
      icon: BellRing,
      tag: isRTL ? 'انضباط يومي' : 'Daily Discipline',
      title: isRTL ? 'التنبيهات الذكية والتذكير المخصص' : 'Smart Daily Reminders',
      desc: isRTL 
        ? 'إشعارات تفاعلية ترسل في الموعد الأنسب لك يومياً لتذكيرك بجلسة الحفظ وتثبيت الورد دون انقطاع أو تسويف.'
        : 'Timely personalized notifications tailored to your routine, ensuring consistent daily practice.',
      color: '#EC4899'
    },
    {
      icon: Users,
      tag: isRTL ? 'بيئة محفزة' : 'Inspiring Community',
      title: isRTL ? 'مجتمع الحفاظ ولوحات الشرف' : 'Memorizers Community & Leaderboard',
      desc: isRTL 
        ? 'تنافس في الخيرات مع آلاف الحفاظ، واكسب أوسمة ونقاط خبرة (XP) مع كل صفحة تتقنها، وتابع مسارك على سلم الإتقان.'
        : 'Compete in righteousness, earn badges and XP with every mastered page, and track your climb on the leaderboard.',
      color: 'var(--primary)'
    }
  ];

  return (
    <section id="features" style={{
      padding: '90px 0',
      background: 'var(--bg-color)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="badge-modern" style={{ marginBottom: '14px' }}>
            <Sparkles size={14} />
            <span>{isRTL ? 'لماذا يختار الحفاظ محفظ AI؟' : 'Why Memorizers Choose Ma7fath AI?'}</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '14px'
          }}>
            {isRTL ? 'أدوات متكاملة تجعل الحفظ' : 'Integrated Tools That Make Memorization'}{' '}
            <span className="text-gradient">{isRTL ? 'أسهل، أمتع، وأكثر رسوخاً' : 'Easier, Inspiring, and Permanent'}</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            maxWidth: '620px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {isRTL 
              ? 'صُممت كل ميزة في المنصة بعناية فائقة لتلبي الاحتياجات الحقيقية لطالب القرآن ومعلم الحلقات.'
              : 'Every single feature is meticulously crafted to meet the actual daily needs of Quran students and teachers.'}
          </p>
        </div>

        {/* Features Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              style={{
                padding: '28px',
                borderRadius: '20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--primary-border)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'var(--primary-light)',
                    color: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <feature.icon size={24} />
                  </div>

                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-color)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-muted)'
                  }}>
                    {feature.tag}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '18.5px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                  lineHeight: 1.35
                }}>
                  {feature.title}
                </h3>

                <p style={{
                  fontSize: '14.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  margin: 0
                }}>
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
