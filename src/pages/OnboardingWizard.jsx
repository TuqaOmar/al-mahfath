import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    learningStyle: 'سمعي بصري (مختلط)',
    motivation: 'نيل رضا الله وتثبيت الحفظ كاملاً',
    juzsMemorized: '5 أجزاء',
    dailyTarget: 'صفحة واحدة يومياً',
    availableDays: 'كل أيام الأسبوع',
    photoURL: 'https://api.dicebear.com/7.x/micah/svg?seed=Ahmad&baseColor=f9c9b6'
  });

  const navigate = useNavigate();
  const { updateUserData } = useAuth();

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
    if (selectedJuz.includes('جزء واحد إلى 3 أجزاء')) {
      memorizedPagesCount = 40;
      totalJuz = 2;
    } else if (selectedJuz.includes('5 أجزاء')) {
      memorizedPagesCount = 100;
      totalJuz = 5;
    } else if (selectedJuz.includes('15 جزءاً')) {
      memorizedPagesCount = 300;
      totalJuz = 15;
    } else if (selectedJuz.includes('أكثر من 20 جزءاً')) {
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
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
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
                  <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>أهلاً بك في محفظ AI 🚀</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 32px' }}>
                    مساعدك الشخصي الذي يرافقك في رحلة القرآن الكريم، ويحلل أداءك باستخدام الذكاء الاصطناعي لتقديم خطة خياطة مخصصة لعقلك.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'right' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                      <Brain size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>تحليل الأداء</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>تحديد المتشابهات ومواضع الضعف تلقائياً.</p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                      <ShieldCheck size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>الحصون الخمسة</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>تثبيت دائم للمحفوظ دون نسيان.</p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                      <Zap size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>مراجعة متباعدة</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>جدولة تلقائية لأفضل أوقات التسميع.</p>
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
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>ما هو نمط وأسلوب تعلمك المفصل؟</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>سيقوم الذكاء الاصطناعي بتكييف وسائل العرض والتكرار بناءً عليه.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { style: 'بصري (الخرائط والصور)', icon: Eye, desc: 'تعتمد على رؤية الصفحات والخرائط الذهنية وتلوين الكلمات.' },
                    { style: 'سمعي (التكرار والاستماع)', icon: Volume2, desc: 'تعتمد على الاستماع للقراء والتكرار الصوتي المباشر.' },
                    { style: 'قراءة وكتابة (الكتابة والرسم)', icon: BookOpen, desc: 'تعتمد على كتابة الآيات وملاحظة المتشابهات كتابياً.' },
                    { style: 'مختلط (شامل)', icon: Sparkles, desc: 'الدمج بين الاستماع والبصر والتسميع التفاعلي.' },
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
                        transition: 'all 0.2s ease'
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
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>ما هو دافعك وهدفك الأساسي للحفظ؟</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>سيعرضها لك الذكاء الاصطناعي دائماً لتجديد الشغف والتحفيز.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    rows={4}
                    placeholder="اكتب هنا دافعك (مثل: ختم القرآن كاملاً عن ظهر قلب، تدبر المعاني، إمامة الناس...)"
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
                      resize: 'none'
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
                    <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>ما هو مستواك وخطتك الحالية؟</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>حدد بياناتك لحساب الجدول والختم المتوقع.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>عدد الأجزاء المحفوظة سابقاً:</label>
                    <select
                      value={formData.juzsMemorized}
                      onChange={(e) => setFormData({ ...formData, juzsMemorized: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }}
                    >
                      <option>لم أحفظ شيئاً بعد (0 جزء)</option>
                      <option>جزء واحد إلى 3 أجزاء</option>
                      <option>5 أجزاء (ربع القرآن)</option>
                      <option>15 جزءاً (نصف القرآن)</option>
                      <option>أكثر من 20 جزءاً</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>معدل الحفظ اليومي المستهدف:</label>
                    <select
                      value={formData.dailyTarget}
                      onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }}
                    >
                      <option>نصف صفحة يومياً (10 دقائق)</option>
                      <option>صفحة واحدة يومياً (20 دقيقة)</option>
                      <option>صفحتان يومياً (40 دقيقة)</option>
                      <option>ربع حزب يومياً (ساعة)</option>
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
                    <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '12px' }}>جاري تحليل إجاباتك بواسطة الذكاء الاصطناعي...</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>نلائم جدول الحصون الخمسة والتكرار المتباعد ليتناسب مع عقلك.</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <CheckCircle size={36} />
                    </div>
                    <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>تم إنشاء خطتك الشخصية الذكية! 🎉</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>بناءً على نمطك ({formData.learningStyle}) وهدفك اليومي.</p>

                    <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: 'right', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>تاريخ الختم المتوقع:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>14 رمضان 1447 هـ</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>النمط المعتمد:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formData.learningStyle}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>أفضل وقت للمراجعة:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>بعد صلاة الفجر (أعلى تركيز ذهني)</span>
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
                <ArrowRight size={18} /> السابق
              </Button>
              <Button variant="primary" onClick={handleNext}>
                {step === 5 ? 'الذهاب للوحة التحكم' : (step === 4 ? 'تحليل وإنشاء الخطة' : 'التالي')} <ArrowLeft size={18} />
              </Button>
            </div>
          )}

        </Card>
      </main>
    </div>
  );
};

export default OnboardingWizard;
