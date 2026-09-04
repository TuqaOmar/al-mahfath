import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingFAQ = () => {
  const { isRTL } = useLanguage();
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'هل تطبيق محفظ AI مجاني ومتاح لكافة المسلمين؟',
      a: 'نعم بفضل الله وتوفيقه، التطبيق متاح ومجاني لوجه الله تعالى ومصمم لخدمة كتاب الله وحفاظه في كل مكان («مَا كَانَ لِلَّهِ يَبْقَى وَمَا كَانَ لِغَيْرِهِ يَنْدَثِرُ»).'
    },
    {
      q: 'كيف يعمل محرك التسميع الصوتي الذكي؟',
      a: 'يستخدم التطبيق تقنيات متقدمة للتعرف على الصوت القرآني، حيث يستمع لقراءتك كلمة بكلمة، ويقارنها بالنص القرآني المعتمد برواية حفص عن عاصم، ويبرز الكلمات المتلوة فوراً مع تنبيهك لأي خطأ في الحفظ أو التشكيل.'
    },
    {
      q: 'ما هي منهجية الحصون الخمسة؟ وكيف تضمن عدم نسيان القرآن؟',
      a: 'الحصون الخمسة هي منهجية مؤصلة علمياً للدكتور سعيد حمزة تقسم وقت الحافظ بين خمسة أركان أساسية: القراءة المستمرة (الحدر)، التحضير المسبق، الحفظ الجديد، مراجعة الماضي القريب (آخر 20 صفحة)، ومراجعة الماضي البعيد الدوري، مما يضمن مرورك الدائم على محفوظك كاملاً دون تفلت.'
    },
    {
      q: 'هل يتوافق التطبيق مع الهواتف الذكية والأجهزة اللوحية؟',
      a: 'نعم بالكامل، المنصة مصممة بتصميم متجاوب فائق السرعة يعمل بسلاسة على الهواتف (iPhone و Android)، الأجهزة اللوحية (iPad و Tablets)، وأجهزة الكمبيوتر المحمولة والمكتبية.'
    },
    {
      q: 'هل يتم حفظ إنجازاتي ونقاطي وسجل تسميعي بشكل سحابي؟',
      a: 'نعم، بمجرد تسجيل حسابك يتم مزامنة كل صفحة تحفظها، خطة الحصون الخمسة، الإشعارات، ونقاط الخبرة تلقائياً مع قاعدة البيانات السحابية لتستأنف حفظك من أي جهاز في أي وقت.'
    }
  ];

  return (
    <section id="faq" style={{
      padding: '90px 0',
      background: 'var(--bg-color)',
      position: 'relative'
    }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="badge-modern" style={{ marginBottom: '14px' }}>
            <HelpCircle size={14} />
            <span>إجابات واضحة ومباشرة</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            الأسئلة <span className="text-gradient">الشائعة والأكثر تكراراً</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)'
          }}>
            كل ما تود معرفته عن منصة محفظ AI ومنظومة الحفظ الذكية.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '16px',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isOpen ? 'var(--primary-border)' : 'var(--glass-border)'}`,
                  overflow: 'hidden',
                  boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-soft)',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                >
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: isOpen ? 'var(--primary)' : 'var(--text-primary)'
                  }}>
                    {faq.q}
                  </span>

                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isOpen ? 'var(--primary-light)' : 'var(--bg-color)',
                    color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div style={{
                        padding: '0 24px 22px',
                        fontSize: '14.5px',
                        lineHeight: 1.75,
                        color: 'var(--text-secondary)',
                        borderTop: '1px dashed var(--glass-border)',
                        paddingTop: '16px'
                      }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
