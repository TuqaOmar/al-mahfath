import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
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
    juzsMemorized: lang === 'ar' ? '5 أجزاء' : '5 Juz',
    dailyTarget: lang === 'ar' ? 'صفحة واحدة يومياً' : '1 page daily',
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
    const selectedJuz = formData.juzsMemorized || '';
    if (selectedJuz.includes('جزء واحد') || selectedJuz.includes('1 to 3')) {
      memorizedPagesCount = 40;
      totalJuz = 2;
    } else if (selectedJuz.includes('5')) {
      memorizedPagesCount = 100;
      totalJuz = 5;
    } else if (selectedJuz.includes('15')) {
      memorizedPagesCount = 300;
      totalJuz = 15;
    } else if (selectedJuz.includes('20')) {
      memorizedPagesCount = 440;
      totalJuz = 22;
    }

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

            {/* Step 4: Current Progress */}
            {step === 4 && (
              <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>{t('wizard_step3_title')}</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{t('wizard_step3_sub')}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '16px', marginBottom: '32px', textAlign: isRTL ? 'right' : 'left' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                      {lang === 'ar' ? 'عدد الأجزاء المحفوظة سابقاً:' : 'Number of Juz previously memorized:'}
                    </label>
                    <select
                      value={formData.juzsMemorized}
                      onChange={(e) => setFormData({ ...formData, juzsMemorized: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }}
                    >
                      {lang === 'ar' ? (
                        <>
                          <option>لم أحفظ شيئاً بعد (0 جزء)</option>
                          <option>جزء واحد إلى 3 أجزاء</option>
                          <option>5 أجزاء (ربع القرآن)</option>
                          <option>15 جزءاً (نصف القرآن)</option>
                          <option>أكثر من 20 جزءاً</option>
                        </>
                      ) : (
                        <>
                          <option>None yet (0 Juz)</option>
                          <option>1 to 3 Juz</option>
                          <option>5 Juz (Quarter of Quran)</option>
                          <option>15 Juz (Half of Quran)</option>
                          <option>More than 20 Juz</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                      {lang === 'ar' ? 'معدل الحفظ اليومي المستهدف:' : 'Daily memorization target rate:'}
                    </label>
                    <select
                      value={formData.dailyTarget}
                      onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }}
                    >
                      {lang === 'ar' ? (
                        <>
                          <option>نصف صفحة يومياً (10 دقائق)</option>
                          <option>صفحة واحدة يومياً (20 دقيقة)</option>
                          <option>صفحتان يومياً (40 دقيقة)</option>
                          <option>ربع حزب يومياً (ساعة)</option>
                        </>
                      ) : (
                        <>
                          <option>Half page daily (10 mins)</option>
                          <option>1 page daily (20 mins)</option>
                          <option>2 pages daily (40 mins)</option>
                          <option>Quarter of Hizb daily (1 hr)</option>
                        </>
                      )}
                    </select>
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
                      {lang === 'ar' ? 'تم إنشاء خطتك الشخصية الذكية! 🎉' : 'Your smart personalized plan was created! 🎉'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
                      {lang === 'ar' ? `بناءً على نمطك (${formData.learningStyle}) وهدفك اليومي.` : `Based on your learning style (${formData.learningStyle}) and daily target.`}
                    </p>

                    <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: isRTL ? 'right' : 'left', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'تاريخ الختم المتوقع:' : 'Expected completion date:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{lang === 'ar' ? '14 رمضان 1447 هـ' : '14 Ramadan 1447 AH'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'النمط المعتمد:' : 'Adopted learning style:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formData.learningStyle}</span>
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
