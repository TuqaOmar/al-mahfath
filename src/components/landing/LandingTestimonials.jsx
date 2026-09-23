import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Heart, Award, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingTestimonials = () => {
  const { isRTL } = useLanguage();

  const testimonials = [
    {
      name: 'الشيخ عبد الله المنصوري',
      role: 'معلم قراءات ومشرف حلقة قرآنية',
      quote: 'الدمج بين منهجية الحصون الخمسة الراسخة والذكاء الاصطناعي الصوتي نقل مستوى طلابي في الحلقة نقلة نوعية؛ أصبح الطالب يراجع ماضيه البعيد والقريب يومياً دون كلل.',
      avatar: '🕌',
      rating: 5,
      achievement: 'مشرف على +١٢٠ طالب'
    },
    {
      name: 'فاطمة الزهراء الشامي',
      role: 'حافظة ومجازة في القرآن الكريم',
      quote: 'كنت أعاني دائماً من المتشابهات وتفلت الماضي البعيد، وبفضل ميزة كشف المتشابهات والتنبيهات المجدولة استطعت تثبيت القرآن كاملاً بفضل الله وكرمه.',
      avatar: '🌸',
      rating: 5,
      achievement: 'خاتمة ومجازة برواية حفص'
    },
    {
      name: 'المهندس أحمد حسان',
      role: 'طالب في حلقة الإتقان المسائية',
      quote: 'بسبب انشغالي في العمل، كان من الصعب إيجاد شيخ يسمع لي في أي وقت، محرك التسميع الذكي أتاح لي التسميع في السيارة وفي أوقات الفراغ بدقة متناهية.',
      avatar: '✨',
      rating: 5,
      achievement: 'أتم حفظ ٢٠ جزءاً'
    }
  ];

  return (
    <section style={{
      padding: '90px 0',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--glass-border)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'relative'
    }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="badge-modern" style={{ marginBottom: '14px' }}>
            <Heart size={14} color="#EF4444" />
            <span>قصص نجاح من مجتمع الحفاظ</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '14px'
          }}>
            تجارب حقيقية لرحلات حفظ <span className="text-gradient">أثمرت ثباتاً وإتقاناً</span>
          </h2>

          <p style={{
            fontSize: '16.5px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            انضم إلى آلاف الطلاب والمعلمين الذين وثقوا بـ محفظ AI لمرافقتهم في رحلة حفظ كتاب الله.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              style={{
                padding: '30px',
                borderRadius: '20px',
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
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
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                {/* Rating & Quote Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>

                  <Quote size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
                </div>

                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  marginBottom: '24px',
                  fontStyle: 'italic'
                }}>
                  "{t.quote}"
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--glass-border)'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {t.avatar}
                </div>

                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
