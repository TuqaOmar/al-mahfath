import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Map, 
  GitFork, 
  Shield, 
  LayoutDashboard, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const LandingShowcase = ({ onOpenAuth, onDemoLogin }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recitation');

  const showcaseItems = [
    {
      id: 'recitation',
      icon: Mic,
      label: isRTL ? 'التسميع الصوتي الذكي' : 'Voice AI Recitation',
      badge: isRTL ? 'الذكاء الاصطناعي الصوتي 🎙️' : 'Voice AI Engine 🎙️',
      title: isRTL ? 'استمع وسمّع.. والذكاء الاصطناعي يصحح لك بدقة لحظية' : 'Recite & Listen.. AI Corrects in Real Time',
      description: isRTL 
        ? 'وداعاً للقلق من نسيان كلمة أو تشكيل آية، محرك التسميع الصوتي المتطور يتعرف على تلاوتك بدقة بالغة، يبرز الآيات المتلوة، وينبهك بلطف عند حدوث أي خطأ أو تردد.'
        : 'Recite freely with instant phoneme accuracy. The advanced AI highlights recited verses in real-time and gently alerts you to skipped words or pronunciation slips.',
      points: isRTL ? [
        'تعرف صوتي فوري وفائق الدقة للقرآن الكريم كاملاً برواية حفص',
        'تحديد الكلمات المفقودة أو التي حدث فيها خطأ في التشكيل أو اللفظ',
        'مقياس إتقان ورسوم بيانية لنسبة الحفظ ودقة الأداء'
      ] : [
        'Instant voice recognition for the entire Quran (Hafs narration)',
        'Accurate detection of skipped or mispronounced words',
        'Real-time mastery metric and performance analytics'
      ],
      image: '/voice_recitation_preview.png',
      cta: isRTL ? 'تجربة التسميع الصوتي' : 'Try Voice Recitation'
    },
    {
      id: 'map',
      icon: Map,
      label: isRTL ? 'خريطة القرآن التفاعلية' : 'Quran Interactive Map',
      badge: isRTL ? 'الرؤية البصرية الشاملة 🗺️' : 'Visual Overview 🗺️',
      title: isRTL ? 'تصفح القرآن الكريم كاملاً برؤية بصرية شاملة وتفاعلية' : 'Explore the Full Quran Through an Interactive Map',
      description: isRTL 
        ? 'خريطة رقمية مذهلة لـ 114 سورة و 604 صفحة، تعرض حالة حفظك بالألوان (المتقن، قيد المراجعة، الجديد) لتعرف بدقة أين تقف في رحلتك.'
        : 'A visual heat map across all 114 Surahs and 604 pages, displaying your exact retention status (Mastered, Under Review, New).',
      points: isRTL ? [
        'خريطة حرارية وتلوين ذكي لحالة كل سورة وآية في المصحف',
        'مؤشر تفاعلي للأجزاء والأحزاب والأرباع',
        'إمكانية البدء المباشر بالحفظ أو المراجعة بنقرة واحدة'
      ] : [
        'Color-coded heat map for every Surah, Juz, and page',
        'Interactive indicators for Hizb and Rub status',
        'Direct 1-click launch for revision or new memorization'
      ],
      image: '/quran_map_preview.png',
      cta: isRTL ? 'استعراض خريطة المصحف' : 'Explore Quran Map'
    },
    {
      id: 'mindmaps',
      icon: GitFork,
      label: isRTL ? 'الخرائط الذهنية والموضوعية' : 'Thematic Mind Maps',
      badge: isRTL ? 'ربط المعاني وتثبيت الحفظ 🌲' : 'Thematic Connections 🌲',
      title: isRTL ? 'افهم ما تحفظ عبر الخرائط الذهنية والروابط الموضوعية' : 'Understand What You Memorize via Visual Mind Maps',
      description: isRTL 
        ? 'تقسيم السور الطويلة والمتوسطة إلى مقاطع موضوعية ومحاور واضحة مترابطة، مع تحديد أوجه الشبه والتشابهات لتفادي الخلط.'
        : 'Break down long and medium Surahs into structured thematic blocks, linking beginnings and endings with clarity.',
      points: isRTL ? [
        'تشجير موضوعي لكل سورة يوضح الوحدة الموضوعية ومحاور الآيات',
        'تثبيت بصري قوي يربط بداية المقاطع بخواتيمها',
        'إبراز المتشابهات اللفظية وتوضيح الفروق بينها'
      ] : [
        'Thematic trees for each Surah highlighting verse topics',
        'Visual anchors linking passage openings and conclusions',
        'Highlighting mutashabihat (similar verses) with subtle distinctions'
      ],
      image: '/mind_maps_preview.png',
      cta: isRTL ? 'استكشف الخرائط الذهنية' : 'Explore Mind Maps'
    },
    {
      id: 'fortresses',
      icon: Shield,
      label: isRTL ? 'نظام الحصون الخمسة' : 'Five Fortresses Plan',
      badge: isRTL ? 'المنهجية العلمية الراسخة 🛡️' : 'Proven Methodology 🛡️',
      title: isRTL ? 'خطة الحصون الخمسة المبتكرة لضمان عدم النسيان' : 'The 5-Fortresses System to Guarantee Permanent Retention',
      description: isRTL 
        ? 'منهجية مؤصلة علمياً تقسم وقتك بذكاء بين القراءة المستمرة (الحدر)، التحضير، الحفظ الجديد، مراجعة الماضي القريب، ومراجعة الماضي البعيد.'
        : 'A proven framework dividing your time across Continuous Reading (Hadr), Preparation, New Memorization, Near Review, and Distant Review.',
      points: isRTL ? [
        'جدولة تلقائية وتنبيهات يومية ذكية لحصون المراجعة',
        'ضمان مرورك الدوري على محفوظك كاملاً دون تفلت',
        'نقاط خبرة، أوسمة إنجاز، ومتابعة حماسية مستمرة'
      ] : [
        'Automated daily scheduling and smart revision reminders',
        'Guarantees regular cycling through all previously memorized portions',
        'Gamified XP points, streak badges, and motivation milestones'
      ],
      image: '/five_fortresses_preview.png',
      cta: isRTL ? 'توليد خطتك الخماسية' : 'Generate 5-Fortresses Plan'
    },
    {
      id: 'admin',
      icon: LayoutDashboard,
      label: isRTL ? 'لوحة المعلم والمشرف' : 'Teacher & Admin Panel',
      badge: isRTL ? 'إدارة الحلقات والمؤسسات 📊' : 'Halaqah Management 📊',
      title: isRTL ? 'لوحة تحكم متكاملة للمعلمين والمشرفين لمتابعة الطلاب' : 'Unified Dashboard for Teachers, Mentors, and Academies',
      description: isRTL 
        ? 'أدوات قوية للمعلم لمتابعة تسميع طلابه، تقييم أدائهم، إرسال الملاحظات، وإصدار تقارير الإنجاز الدورية بكل سهولة.'
        : 'Comprehensive tools for Quran teachers to track student recitations, grade accuracy, give notes, and export progress reports.',
      points: isRTL ? [
        'متابعة تفصيلية لدرجات وإنجازات كل طالب في الحلقة',
        'إحصائيات ذكية لمعدل الإتقان والالتزام بالحصون الخمسة',
        'صلاحيات متعددة (معلم، مشرف، مدير أكاديمية)'
      ] : [
        'Detailed tracking of student scores and session streaks',
        'Smart analytics for accuracy rates and 5-Fortress adherence',
        'Role-based permissions (Teacher, Supervisor, Academy Director)'
      ],
      image: '/admin_analytics_preview.png',
      cta: isRTL ? 'استعراض لوحة المعلم' : 'Preview Teacher Dashboard'
    }
  ];

  const currentItem = showcaseItems.find(item => item.id === activeTab) || showcaseItems[0];

  return (
    <section id="showcase" style={{
      padding: '90px 0',
      background: 'var(--bg-color)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div className="badge-modern" style={{ marginBottom: '14px' }}>
            <Sparkles size={14} />
            <span>{isRTL ? 'استعراض مميزات المنصة الحية' : 'Live Platform Showcase'}</span>
          </div>
          
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '14px'
          }}>
            {isRTL ? 'أقوى الأدوات التقنية' : 'Cutting-Edge Technology'}{' '}
            <span className="text-gradient">{isRTL ? 'في خدمة كتاب الله' : 'Dedicated to the Quran'}</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            maxWidth: '620px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {isRTL 
              ? 'تصفح أهم الواجهات والحلول المبتكرة المصممة خصيصاً لتيسير الحفظ وتسريع الإتقان.'
              : 'Browse the key innovative interfaces designed specifically to streamline memorization and guarantee mastery.'}
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}>
          {showcaseItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: isActive ? 'var(--primary-light)' : 'var(--bg-surface)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-soft)',
                  transition: 'all 0.25s ease'
                }}
              >
                <item.icon size={17} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Active Content Frame */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'center',
              padding: '32px',
              borderRadius: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Left Column: Feature Details */}
            <div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '12.5px',
                marginBottom: '14px',
                border: '1px solid var(--primary-border)'
              }}>
                {currentItem.badge}
              </div>

              <h3 style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '14px',
                lineHeight: 1.35
              }}>
                {currentItem.title}
              </h3>

              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '24px'
              }}>
                {currentItem.description}
              </p>

              {/* Key Bullet Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {currentItem.points.map((pt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
                      {pt}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={onDemoLogin}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px var(--primary-glow)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>{currentItem.cta} 🚀</span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>

            {/* Right Column: Screenshot Visual Frame */}
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              aspectRatio: '16/10'
            }}>
              <img
                src={currentItem.image}
                alt={currentItem.label}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: isRTL ? '12px' : 'auto',
                left: !isRTL ? '12px' : 'auto',
                background: 'rgba(11, 17, 26, 0.85)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                لقطة حية من المنصة 📸
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
