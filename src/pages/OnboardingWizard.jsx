import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { JuzMultiSelector } from '../components/JuzMultiSelector';
import { 
  CheckCircle, 
  Brain, 
  Target, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Volume2,
  BookOpen,
  Sparkles,
  Loader2,
  Calendar,
  ShieldCheck,
  Zap,
  User
} from 'lucide-react';

const OnboardingWizard = () => {
  const { t, lang, isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    learningStyle: lang === 'ar' ? 'سمعي بصري (مختلط)' : 'Audio-Visual (Mixed)',
    motivation: lang === 'ar' ? 'نيل رضا الله وتثبيت الحفظ كاملاً' : 'Pleasing Allah and mastering the entire Quran',
    // Unit Type choice: 'pages' | 'juzs' | 'surahs'
    unitType: 'juzs',
    // Current Memorization & Old Review
    selectedJuzList: [1, 30],
    juzsMemorized: lang === 'ar' ? 'الجزء 1، الجزء 30' : 'Juz 1, Juz 30',
    customPagesCount: '',
    selectedSurahRange: lang === 'ar' ? 'سورة البقرة وآل عمران' : 'Surah Al-Baqarah & Ali Imran',
    oldReviewDailyTarget: lang === 'ar' ? 'نصف جزء يومياً (10 صفحات)' : 'Half Juz daily (10 pages)',
    // Plan Creator Mode: 'ai' | 'manual'
    planCreatorMode: 'ai',
    dailyTarget: lang === 'ar' ? 'صفحة واحدة يومياً' : '1 page daily',
    manualNewTarget: '1',
    manualOldReviewTarget: '10',
    availableDays: lang === 'ar' ? 'كل أيام الأسبوع' : 'Every day of the week',
    photoURL: 'https://api.dicebear.com/7.x/micah/svg?seed=Ahmad&baseColor=f9c9b6'
  });

  const navigate = useNavigate();
  const { updateUserData } = useAuth();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => {
    if (step === 4) {
      // Move to step 5 (AI Analyzing step)
      setStep(5);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 2500);
    } else if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1 && step !== 5) setStep(step - 1);
  };

  const handleComplete = async () => {
    let memorizedPagesCount = 0;
    let totalJuz = 0;
    const selectedJuz = String(formData.juzsMemorized || '');

    if (formData.customPagesCount && !isNaN(Number(formData.customPagesCount))) {
      memorizedPagesCount = Math.min(604, Math.max(0, Number(formData.customPagesCount)));
    } else if (selectedJuz.includes('604') || selectedJuz.includes('كامل')) {
      memorizedPagesCount = 604;
    } else if (selectedJuz.includes('400') || selectedJuz.includes('20')) {
      memorizedPagesCount = 400;
    } else if (selectedJuz.includes('300') || selectedJuz.includes('15')) {
      memorizedPagesCount = 300;
    } else if (selectedJuz.includes('200') || selectedJuz.includes('10')) {
      memorizedPagesCount = 200;
    } else if (selectedJuz.includes('100') || selectedJuz.includes('5')) {
      memorizedPagesCount = 100;
    } else if (selectedJuz.includes('60') || selectedJuz.includes('3')) {
      memorizedPagesCount = 60;
    } else if (selectedJuz.includes('43') || selectedJuz.includes('تبارك')) {
      memorizedPagesCount = 43;
    } else if (selectedJuz.includes('23') || selectedJuz.includes('عم')) {
      memorizedPagesCount = 23;
    } else if (selectedJuz.includes('0') || selectedJuz.includes('لم أحفظ')) {
      memorizedPagesCount = 0;
    } else {
      memorizedPagesCount = 0;
    }

    totalJuz = Number((memorizedPagesCount / 20).toFixed(1));

    updateUserData({
      hasCompletedWizard: true,
      preferences: formData,
      memorizedPagesCount,
      totalJuz
    });

    try {
      const storedUser = JSON.parse(localStorage.getItem('ma7fath_user') || '{}');
      if (storedUser.uid) {
        await fetch(`/api/user/${storedUser.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasCompletedWizard: true,
            preferences: formData,
            memorizedPagesCount,
            totalJuz
          })
        });
      }
    } catch (e) {
      console.log('Error syncing wizard data with API:', e);
    }

    navigate('/dashboard');
  };

  const stepVariants = {
    hidden: { opacity: 0, x: isRTL ? 20 : -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRTL ? -20 : 20 }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 40px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center' }}>
        <Logo size={42} />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <Card style={{ maxWidth: '680px', width: '100%', padding: '40px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Progress Bar (5 Steps) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} style={{ flex: 1, height: '6px', borderRadius: '3px', background: s <= step ? 'var(--primary)' : 'var(--glass-border)', transition: 'background 0.3s ease' }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            
            {/* Step 1: Welcome & Intro */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Sparkles size={36} />
                  </div>
                  <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    {lang === 'ar' ? 'أهلاً بك في محفظ AI 🚀' : 'Welcome to Ma7fath AI 🚀'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 32px' }}>
                    {lang === 'ar' 
                      ? 'مساعدك الشخصي الذي يرافقك في رحلة القرآن الكريم، ويحلل أداءك باستخدام الذكاء الاصطناعي لتقديم خطة مخصصة لعقلك.'
                      : 'Your personal companion in the Holy Quran journey, analyzing your performance using AI to deliver a tailored plan for your mind.'}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                      <Brain size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {lang === 'ar' ? 'تحليل الأداء' : 'Performance Analysis'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {lang === 'ar' ? 'تحديد المتشابهات ومواضع الضعف تلقائياً.' : 'Automatically spot similar verses and weak pages.'}
                      </p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                      <ShieldCheck size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {lang === 'ar' ? 'الحصون الخمسة' : 'Five Fortresses'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {lang === 'ar' ? 'تثبيت دائم للمحفوظ دون نسيان.' : 'Permanent retention of memorized pages without forgetting.'}
                      </p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                      <Zap size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {lang === 'ar' ? 'مراجعة متباعدة' : 'Spaced Repetition'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {lang === 'ar' ? 'جدولة تلقائية لأفضل أوقات التسميع.' : 'Auto scheduling of optimal recitation times.'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Learning Style Assessment */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>{t('wizard_step1_title')}</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('wizard_step1_sub')}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { 
                      style: lang === 'ar' ? 'بصري (الخرائط والصور)' : 'Visual (Maps & Images)', 
                      icon: Eye, 
                      desc: lang === 'ar' ? 'تعتمد على رؤية الصفحات والخرائط الذهنية وتلوين الكلمات.' : 'Focuses on mind maps, visual pages, and word coloring.' 
                    },
                    { 
                      style: lang === 'ar' ? 'سمعي (التكرار والاستماع)' : 'Auditory (Listening & Repeat)', 
                      icon: Volume2, 
                      desc: lang === 'ar' ? 'تعتمد على الاستماع للقراء والتكرار الصوتي المباشر.' : 'Relies on listening to famous reciters and vocal repetition.' 
                    },
                    { 
                      style: lang === 'ar' ? 'قراءة وكتابة (الكتابة والرسم)' : 'Reading/Writing (Scribes)', 
                      icon: BookOpen, 
                      desc: lang === 'ar' ? 'تعتمد على كتابة الآيات وملاحظة المتشابهات كتابياً.' : 'Uses writing out verses and cataloging similarity points.' 
                    },
                    { 
                      style: lang === 'ar' ? 'مختلط (شامل)' : 'Mixed (Comprehensive Style)', 
                      icon: Sparkles, 
                      desc: lang === 'ar' ? 'الدمج بين الاستماع والبصر والتسميع التفاعلي.' : 'A robust blend of auditory, visual, and verbal recitation.' 
                    },
                  ].map((item) => (
                    <div
                      key={item.style}
                      onClick={() => setFormData({ ...formData, learningStyle: item.style })}
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        border: `2px solid ${formData.learningStyle === item.style ? 'var(--primary)' : 'var(--glass-border)'}`,
                        background: formData.learningStyle === item.style ? 'var(--primary-light)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: isRTL ? 'right' : 'left'
                      }}
                    >
                      <item.icon size={24} color={formData.learningStyle === item.style ? 'var(--primary)' : 'var(--text-secondary)'} style={{ marginBottom: '12px' }} />
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: formData.learningStyle === item.style ? 'var(--primary)' : 'var(--text-primary)' }}>{item.style}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Motivation & Goal */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>{t('wizard_step2_title')}</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('wizard_step2_sub')}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    rows={4}
                    placeholder={lang === 'ar' ? "اكتب هنا دافعك (مثل: ختم القرآن كاملاً عن ظهر قلب، تدبر المعاني، إمامة الناس...)" : "Write your motivation here (e.g., memorize the entire Quran, ponder meanings...)"}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '15px',
                      outline: 'none',
                      resize: 'none',
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Unit Selection, Current Progress & Plan Customization */}
            {step === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>
                      {lang === 'ar' ? 'تحديد الخطة ووحدة الحفظ والمراجعة' : 'Set Your Unit & Review Plan'}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {lang === 'ar' ? 'اختر وحدتك المفضلة، حدد محفوظك القديم للمراجعة، واختر آلية الخطة (ذكاء اصطناعي أم يدوياً).' : 'Choose unit, set old memorization review target, and select AI or manual plan creation.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '20px', marginBottom: '32px', textAlign: isRTL ? 'right' : 'left' }}>
                  
                  {/* 1. Unit Type Selection */}
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                      {lang === 'ar' ? '1️⃣ اختر طريقة القياس والتتبع المفضلة لك:' : '1️⃣ Choose your preferred tracking unit:'}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { id: 'pages', labelAr: '📖 بالصفحات', labelEn: '📖 By Pages', descAr: 'صفحات المصحف', descEn: 'Pages' },
                        { id: 'juzs', labelAr: '📚 بالأجزاء', labelEn: '📚 By Juzs', descAr: 'الأجزاء والأحزاب', descEn: 'Juzs & Hizbs' },
                        { id: 'surahs', labelAr: '📜 بالسور والآيات', labelEn: '📜 By Surahs/Verses', descAr: 'سور وآيات محددة', descEn: 'Surahs & Verses' }
                      ].map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setFormData({ ...formData, unitType: u.id })}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '10px',
                            border: `2px solid ${formData.unitType === u.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                            background: formData.unitType === u.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: formData.unitType === u.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                            {lang === 'ar' ? u.labelAr : u.labelEn}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {lang === 'ar' ? u.descAr : u.descEn}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Old Memorization & Review Portion (مراجعة المحفوظ القديم) */}
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                      {lang === 'ar' ? '2️⃣ تحديد المحفوظ القديم المسبق لمراجعته:' : '2️⃣ Past Memorization Range to Review:'}
                    </label>

                    {(formData.unitType === 'juzs' || formData.unitType === 'pages') && (
                      <div style={{ marginBottom: '16px' }}>
                        <JuzMultiSelector
                          selectedJuzs={formData.selectedJuzList || [1, 30]}
                          onChange={(newList) => {
                            const label = newList.length === 0 
                              ? 'لا يوجد أجزاء مسبقة' 
                              : newList.map(n => `الجزء ${n}`).join('، ');
                            setFormData({
                              ...formData,
                              selectedJuzList: newList,
                              juzsMemorized: label
                            });
                          }}
                        />
                      </div>
                    )}

                    {formData.unitType === 'surahs' && (
                      <input
                        type="text"
                        placeholder={lang === 'ar' ? "اكتب السور المحفوظة (مثال: سورة البقرة، آل عمران، الملك، عم)" : "Enter memorized Surahs (e.g., Al-Baqarah, Ali Imran, Amma)"}
                        value={formData.selectedSurahRange}
                        onChange={(e) => setFormData({ ...formData, selectedSurahRange: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', marginBottom: '10px' }}
                      />
                    )}

                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      {lang === 'ar' ? 'معدل مراجعة المحفوظ القديم اليومي (الحصن الخامس):' : 'Old memorization daily review rate:'}
                    </label>
                    <select
                      value={formData.oldReviewDailyTarget}
                      onChange={(e) => setFormData({ ...formData, oldReviewDailyTarget: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option>{lang === 'ar' ? 'ربع جزء يومياً (5 صفحات)' : 'Quarter Juz daily (5 pages)'}</option>
                      <option>{lang === 'ar' ? 'نصف جزء يومياً (10 صفحات)' : 'Half Juz daily (10 pages)'}</option>
                      <option>{lang === 'ar' ? 'جزء كامل يومياً (20 صفحة)' : '1 Full Juz daily (20 pages)'}</option>
                      <option>{lang === 'ar' ? 'سورة كاملة يومياً' : '1 Full Surah daily'}</option>
                      <option>{lang === 'ar' ? 'صفحتان يومياً (تثبيت بطيء وتدريجي)' : '2 pages daily (slow & steady)'}</option>
                    </select>
                  </div>

                  {/* 3. AI vs Manual Plan Creator Toggle */}
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                      {lang === 'ar' ? '3️⃣ تحديد طريقة إنشاء وتحديد الخطة:' : '3️⃣ Plan Determination Mode:'}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                      <div
                        onClick={() => setFormData({ ...formData, planCreatorMode: 'ai' })}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          border: `2px solid ${formData.planCreatorMode === 'ai' ? 'var(--primary)' : 'var(--glass-border)'}`,
                          background: formData.planCreatorMode === 'ai' ? 'var(--primary-light)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: formData.planCreatorMode === 'ai' ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                          🤖 {lang === 'ar' ? 'توليد ذكي بالذكاء الاصطناعي' : 'AI Automatic Smart Plan'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'يحسب AI توزيع الحصون الخمسة وتاريخ الختم أوتوماتيكياً.' : 'AI automatically sets 5 fortresses schedule and completion date.'}
                        </div>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, planCreatorMode: 'manual' })}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          border: `2px solid ${formData.planCreatorMode === 'manual' ? 'var(--primary)' : 'var(--glass-border)'}`,
                          background: formData.planCreatorMode === 'manual' ? 'var(--primary-light)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: formData.planCreatorMode === 'manual' ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                          ✏️ {lang === 'ar' ? 'تخصيص الخطة يدوياً' : 'Manual Custom Plan'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'تحديد كمية الحفظ الجديد والمراجعة بنفسك.' : 'Explicitly define your daily target amounts yourself.'}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Fields for AI vs Manual */}
                    {formData.planCreatorMode === 'ai' ? (
                      <div>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          {lang === 'ar' ? 'معدل الحفظ الجديد التلقائي:' : 'Daily new target:'}
                        </label>
                        <select
                          value={formData.dailyTarget}
                          onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                        >
                          <option>{lang === 'ar' ? 'نصف صفحة يومياً (10 دقائق)' : 'Half page daily (10 mins)'}</option>
                          <option>{lang === 'ar' ? 'صفحة واحدة يومياً (20 دقيقة)' : '1 page daily (20 mins)'}</option>
                          <option>{lang === 'ar' ? 'صفحتان يومياً (40 دقيقة)' : '2 pages daily (40 mins)'}</option>
                          <option>{lang === 'ar' ? 'ربع حزب / 2.5 صفحة يومياً' : 'Quarter Hizb daily'}</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            {lang === 'ar' ? 'مستهدف الحفظ الجديد اليومي:' : 'New daily target amount:'}
                          </label>
                          <input
                            type="text"
                            value={formData.manualNewTarget}
                            onChange={(e) => setFormData({ ...formData, manualNewTarget: e.target.value })}
                            placeholder={formData.unitType === 'pages' ? 'مثال: صفحة واحدة' : (formData.unitType === 'juzs' ? 'مثال: ثمن جزء' : 'مثال: 10 آيات')}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            {lang === 'ar' ? 'مستهدف المراجعة القديمة اليومية:' : 'Old daily review amount:'}
                          </label>
                          <input
                            type="text"
                            value={formData.manualOldReviewTarget}
                            onChange={(e) => setFormData({ ...formData, manualOldReviewTarget: e.target.value })}
                            placeholder={formData.unitType === 'pages' ? 'مثال: 10 صفحات' : (formData.unitType === 'juzs' ? 'مثال: 1 جزء' : 'مثال: سورة واحدة')}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* Step 5: AI Analysis & Final Personalized Plan */}
            {step === 5 && (
              <motion.div key="step5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                {isAnalyzing ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
                    <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('wizard_analyzing')}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                      {lang === 'ar' ? 'نلائم جدول الحصون الخمسة والتكرار المتباعد ليتناسب مع عقلك.' : 'We adapt the five fortresses and spaced repetition schedule to fit your mind.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <CheckCircle size={36} />
                    </div>
                    <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {lang === 'ar' ? 'تم اعتماد خطتك الشخصية بنجاح! 🎉' : 'Your custom plan has been configured! 🎉'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
                      {lang === 'ar' 
                        ? `نوع الخطة: (${formData.planCreatorMode === 'ai' ? 'ذكاء اصطناعي ذكي' : 'مخصصة يدوياً'}) - وحدة القياس: (${formData.unitType === 'pages' ? 'صفحات' : formData.unitType === 'juzs' ? 'أجزاء' : 'سور وآيات'})`
                        : `Plan Mode: (${formData.planCreatorMode === 'ai' ? 'AI Smart Plan' : 'Manual Custom'}) - Unit: (${formData.unitType})`}
                    </p>

                    <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: isRTL ? 'right' : 'left', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'وحدة التتبع المعتمدة:' : 'Tracking unit:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          {formData.unitType === 'pages' ? 'بالصفحات (Pages)' : formData.unitType === 'juzs' ? 'بالأجزاء (Juzs)' : 'بالسور والآيات (Surahs/Verses)'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'مراجعة المحفوظ القديم:' : 'Old review target:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formData.oldReviewDailyTarget}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'طريقة صياغة الخطة:' : 'Plan generation:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          {formData.planCreatorMode === 'ai' ? 'توليد ذكي آلي (AI)' : 'تحديد وتخصيص يدوي'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'أفضل وقت للمراجعة:' : 'Optimal review time:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          {lang === 'ar' ? 'بعد صلاة الفجر (أعلى تركيز ذهني)' : 'After Fajr prayer (highest mental focus)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Bottom Action Controls */}
          {!isAnalyzing && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
              <Button variant="outline" onClick={handleBack} disabled={step === 1 || step === 5} style={{ opacity: (step === 1 || step === 5) ? 0 : 1 }}>
                {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />} {t('wizard_back')}
              </Button>
              <Button variant="primary" onClick={handleNext}>
                {step === 5 
                  ? t('wizard_finish') 
                  : (step === 4 ? (lang === 'ar' ? 'تحليل وإنشاء الخطة' : 'Analyze & Create Plan') : t('wizard_next'))
                } {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </Button>
            </div>
          )}

        </Card>
      </main>
    </div>
  );
};

export default OnboardingWizard;
