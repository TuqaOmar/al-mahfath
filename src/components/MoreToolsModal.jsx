import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Map, 
  BookOpen, 
  Sliders, 
  Users, 
  Trophy, 
  BarChart3, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Presentation
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const MoreToolsModal = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { lang, isRTL } = useLanguage();

  if (!isOpen) return null;

  const tools = [
    {
      id: 'mind-maps',
      title: lang === 'ar' ? 'الخرائط الذهنية الموضوعية' : 'Thematic Mind Maps',
      desc: lang === 'ar' ? 'استيعاب محاور السور وتقسيمها الموضوعي لترسيخ الروابط' : 'Visual themes and structural breakdown of Surahs',
      icon: Map,
      color: '#3B82F6'
    },
    {
      id: 'similarities',
      title: lang === 'ar' ? 'مرشد المتشابهات اللفظية' : 'Similar Verses Guide',
      desc: lang === 'ar' ? 'قواعد ذهبية للتمييز بين الآيات المتشابهة لتلاوة بلا تردد' : 'Golden rules to master subtle verse variations',
      icon: BookOpen,
      color: '#10B981'
    },
    {
      id: 'my-plan',
      title: lang === 'ar' ? 'تخصيص الخطة ومقدار الورد' : 'Plan Customizer',
      desc: lang === 'ar' ? 'تعديل وتحديد الأجزاء ومعدل الحفظ والمراجعة اليومي' : 'Adjust daily target, Juz selection, and paces',
      icon: Sliders,
      color: '#8B5CF6'
    },
    {
      id: 'community',
      title: lang === 'ar' ? 'مجتمع الحفاظ والتنافس' : 'Community & Cohorts',
      desc: lang === 'ar' ? 'مجموعات التسميع والتشجيع اليومي مع رفقاء القرآن' : 'Group recitation and daily motivation circles',
      icon: Users,
      color: '#EC4899'
    },
    {
      id: 'achievements',
      title: lang === 'ar' ? 'الأوسمة والإنجازات' : 'Achievements & Badges',
      desc: lang === 'ar' ? 'شواهد استمرارك في صحبة القرآن وثمار الإتقان' : 'Milestones, streaks, and Quran companion awards',
      icon: Trophy,
      color: '#F59E0B'
    },
    {
      id: 'analytics',
      title: lang === 'ar' ? 'التحليلات والمتابعة الإحصائية' : 'Analytics & Insights',
      desc: lang === 'ar' ? 'رسوم بيانية لدقة التسميع ومعدل ثبات الحفظ عبر الزمن' : 'Charts tracking retention, memory stability, and review',
      icon: BarChart3,
      color: '#06B6D4'
    },
    {
      id: 'presentation',
      title: lang === 'ar' ? 'العرض التعريفي للمنصة 📽️' : 'Platform Pitch Deck 📽️',
      desc: lang === 'ar' ? 'عرض شرائح متكامل يشرح فكرة المنصة، الحصون الخمسة، والأثر القرآني' : 'Full presentation slides explaining the vision, fortresses, and impact',
      icon: Presentation,
      color: '#10B981'
    }
  ];

  return (
    <AnimatePresence>
      <div 
        id="more-tools-modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }}
      >
        <motion.div
          id="more-tools-modal-sheet"
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: 'var(--bg-surface)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid var(--glass-border)',
            padding: '24px 20px 36px 20px',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Grab Handle */}
          <div style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--glass-border)',
            margin: '0 auto 16px auto'
          }} />

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'الأدوات والخدمات المساعدة' : 'Additional Tools & Services'}
              </h3>
            </div>
            <button
              id="more-tools-close-btn"
              onClick={onClose}
              style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* List of tools */}
          <div style={{
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '2px'
          }}>
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeTab === tool.id;

              return (
                <button
                  key={tool.id}
                  id={`more-tool-item-${tool.id}`}
                  onClick={() => {
                    setActiveTab(tool.id);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-color)',
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: `${tool.color}15`,
                      color: tool.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        marginBottom: '2px'
                      }}>
                        {tool.title}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4
                      }}>
                        {tool.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
