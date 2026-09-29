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
  User,
  Fingerprint,
  RotateCcw,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Users,
  Check
} from 'lucide-react';
import { getPageRangeForJuz } from '../utils/quranData';
import { learningQuizQuestions, calculateLearningProfile } from '../utils/learningQuizData';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const OnboardingWizard = () => {
  const { t, lang, isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Diagnostic Quiz State
  const [quizMode, setQuizMode] = useState('quiz'); // 'quiz' | 'manual'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [calculatedProfile, setCalculatedProfile] = useState(null);

  const [formData, setFormData] = useState({
    learningStyle: lang === 'ar' ? 'سمعي بصري (مختلط)' : 'Audio-Visual (Mixed)',
    displayName: '',
    learningProfile: null,
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
    photoURL: ''
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Safar Ecosystem Group & Path State
  const [groupInfo, setGroupInfo] = useState({
    choice: 'independent', // 'group' | 'independent'
    code: '',
    verifiedGroup: null,
    isSafarMember: false,
    verifying: false,
    error: '',
    successMessage: ''
  });

  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();

  const handleVerifyGroupCode = async () => {
    const clean = groupInfo.code.trim().toUpperCase();
    if (!clean) {
      setGroupInfo(prev => ({ ...prev, error: isRTL ? 'الرجاء كتابة رمز الحلقة أولاً' : 'Please enter group code' }));
      return;
    }
    setGroupInfo(prev => ({ ...prev, verifying: true, error: '', successMessage: '' }));
    try {
      // Mock some static codes if Firestore is empty/offline for demo
      if (clean === 'SAFAR2024' || clean === 'DEMO') {
        setTimeout(() => {
          setGroupInfo(prev => ({
            ...prev,
            verifying: false,
            verifiedGroup: { id: 'demo123', name: 'حلقة الهمم العالية', teacherName: 'أ. فاطمة' },
            isSafarMember: true,
            error: '',
            successMessage: isRTL ? `تم التحقق بنجاح! حلقة: الهمم العالية (المعلمة: أ. فاطمة)` : `Verified: High Resolve Group`
          }));
        }, 1000);
        return;
      }

      // Query Firestore for the group
      const q = query(collection(db, 'groups'), where('code', '==', clean));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const groupData = doc.data();
        setGroupInfo(prev => ({
          ...prev,
          verifying: false,
          verifiedGroup: { id: doc.id, ...groupData },
          isSafarMember: true,
          error: '',
          successMessage: isRTL ? `تم التحقق بنجاح! حلقة: ${groupData.name} (المعلمة: ${groupData.teacherName})` : `Verified: ${groupData.name}`
        }));
      } else {
        setGroupInfo(prev => ({
          ...prev,
          verifying: false,
          verifiedGroup: null,
          isSafarMember: false,
          error: isRTL ? 'رمز الحلقة غير صحيح أو غير متاح' : 'Invalid group code'
        }));
      }
    } catch (e) {
      setGroupInfo(prev => ({
        ...prev,
        verifying: false,
        verifiedGroup: null,
        isSafarMember: false,
        error: isRTL ? 'حدث خطأ أثناء التحقق من الرمز، يرجى التأكد من الرمز والمحاولة مجدداً.' : 'Error verifying code, please try again.'
      }));
    }
  };

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (user && !formData.displayName) {
      setFormData(prev => ({ ...prev, displayName: user.name || '' }));
    }
  }, [user]);

  const handleNext = () => {
    if (step === 1 && groupInfo.choice === 'group' && !groupInfo.isSafarMember) {
      setGroupInfo(prev => ({
        ...prev,
        error: isRTL ? 'يرجى التحقق من الرمز والضغط على "تحقق وانضمام" أولاً للمتابعة.' : 'Please verify the group code before proceeding.'
      }));
      return;
    }

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

  // Quiz Answer Handler
  const handleAnswerQuestion = (questionId, optionId) => {
    const updatedAnswers = { ...quizAnswers, [questionId]: optionId };
    setQuizAnswers(updatedAnswers);

    if (currentQuestionIdx < learningQuizQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Quiz finished - calculate profile
      const profile = calculateLearningProfile(updatedAnswers);
      setCalculatedProfile(profile);
      setQuizCompleted(true);
      const chosenStyle = lang === 'ar' ? profile.styleLabelAr : profile.styleLabelEn;
      setFormData(prev => ({
        ...prev,
        learningStyle: chosenStyle,
        learningProfile: profile
      }));
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setCurrentQuestionIdx(0);
    setQuizCompleted(false);
    setCalculatedProfile(null);
  };

  const handleComplete = async () => {
    let memorizedPages = [];
    let memorizedPagesCount = 0;
    let totalJuz = 0;

    if ((formData.unitType === 'juzs' || formData.unitType === 'pages') && Array.isArray(formData.selectedJuzList) && formData.selectedJuzList.length > 0) {
      formData.selectedJuzList.forEach(juzNum => {
        const range = getPageRangeForJuz(juzNum);
        for (let p = range.startPage; p <= range.endPage; p++) {
          if (!memorizedPages.includes(p)) {
            memorizedPages.push(p);
          }
        }
      });
      memorizedPages.sort((a, b) => a - b);
      memorizedPagesCount = memorizedPages.length;
    } else if (formData.customPagesCount && !isNaN(Number(formData.customPagesCount))) {
      const count = Math.min(604, Math.max(0, Number(formData.customPagesCount)));
      memorizedPagesCount = count;
      memorizedPages = Array.from({ length: count }, (_, i) => i + 1);
    } else if (formData.unitType === 'surahs') {
      memorizedPages = Array.from({ length: 21 }, (_, i) => i + 1);
      memorizedPagesCount = 21;
    } else {
      memorizedPages = [];
      memorizedPagesCount = 0;
    }

    totalJuz = Number((memorizedPagesCount / 20).toFixed(1));

    const wizardUpdate = {
      name: formData.displayName?.trim() || user?.name || 'حافظ جديد',
      hasCompletedWizard: true,
      preferences: formData,
      photoURL: formData.photoURL || user?.photoURL || '',
      memorizedPages,
      memorizedPagesCount,
      totalJuz,
      isSafarMember: Boolean(groupInfo.isSafarMember),
      groupId: groupInfo.verifiedGroup?.id || null,
      groupName: groupInfo.verifiedGroup?.name || null,
      teacherName: groupInfo.verifiedGroup?.teacherName || null
    };

    if (auth.currentUser && formData.photoURL) {
      try {
        await updateProfile(auth.currentUser, { photoURL: formData.photoURL });
      } catch (e) {
        console.error("Failed to update profile photoURL", e);
      }
    }

    // Update React Auth context & Firestore immediately
    await updateUserData(wizardUpdate);

    navigate('/dashboard', { replace: true });
  };

  const stepVariants = {
    hidden: { opacity: 0, x: isRTL ? 20 : -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRTL ? -20 : 20 }
  };

  const currentQ = learningQuizQuestions[currentQuestionIdx];

  const getOptionIcon = (iconName) => {
    switch (iconName) {
      case 'Volume2': return <Volume2 size={20} />;
      case 'Eye': return <Eye size={20} />;
      case 'Fingerprint': return <Fingerprint size={20} />;
      case 'BookOpen': return <BookOpen size={20} />;
      default: return <Brain size={20} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 40px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center' }}>
        <Logo size={42} />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px 12px' : '32px 20px' }}>
        <Card style={{ maxWidth: '680px', width: '100%', padding: isMobile ? '24px 16px' : '32px 28px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Progress Bar (5 Steps) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} style={{ flex: 1, height: '6px', borderRadius: '3px', background: s <= step ? 'var(--primary)' : 'var(--glass-border)', transition: 'background 0.3s ease' }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            
            {/* Step 1: Welcome, Value Propositions & Choose Path */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <BookOpen size={32} />
                  </div>
                  <h2 style={{ fontSize: isMobile ? '22px' : '26px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {lang === 'ar' ? 'أهلاً بك في منصة سَفَر القرآنية 🌿' : 'Welcome to Safar Quran Platform 🌿'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px' }}>
                    {lang === 'ar' 
                      ? 'منظومة حديثة ومتكاملة لحفظ القرآن الكريم ومراجعته وإتقانه بإشراف نخبة من المعلمات المعتمدات أو بمسار الحفظ الذاتي المستقل.'
                      : 'A modern, structured ecosystem for Quran memorization, recitation, and mastery with certified teachers or independent study.'}
                  </p>
                  
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: isRTL ? 'right' : 'left' }}>
                    
                    {/* Avatar Upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {formData.photoURL || user?.photoURL ? (
                          <img src={formData.photoURL || user?.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={32} color="var(--text-secondary)" />
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {lang === 'ar' ? 'الصورة الشخصية' : 'Profile Picture'}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file && user?.uid) {
                              setUploadingAvatar(true);
                              try {
                                const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
                                await uploadBytes(storageRef, file);
                                const url = await getDownloadURL(storageRef);
                                setFormData(prev => ({ ...prev, photoURL: url }));
                              } catch (err) {
                                console.error('Upload failed', err);
                                alert(lang === 'ar' ? 'فشل رفع الصورة.' : 'Failed to upload image.');
                              }
                              setUploadingAvatar(false);
                            }
                          }}
                          style={{ display: 'none' }}
                          id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload" style={{ fontSize: '12px', color: 'var(--primary)', cursor: uploadingAvatar ? 'wait' : 'pointer', fontWeight: 'bold' }}>
                          {uploadingAvatar ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع صورة جديدة' : 'Upload new picture')}
                        </label>
                      </div>
                    </div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {lang === 'ar' ? 'اسمك الظاهر في المنصة (يمكنك تعديله):' : 'Your Display Name (You can edit it):'}
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder={lang === 'ar' ? 'اكتب اسمك' : 'Enter your name'}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--primary)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  {/* 4 Value Proposition Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px', textAlign: isRTL ? 'right' : 'left', marginBottom: '24px' }}>
                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                        <Target size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          {lang === 'ar' ? 'حفظ ومراجعة يومية' : 'Daily Memorization & Review'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'أوراد ذكية تتجدد تلقائياً حسب جدولك ومستواك.' : 'Structured daily targets adapted to your rhythm.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                        <Volume2 size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          {lang === 'ar' ? 'تسميع صوتي وتكرار ذكي' : 'Audio & Smart Repetition'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'استماع لكبار القراء مع تقنيات تثبيت متقدمة.' : 'Audio recitation & AI-assisted repetition tools.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                        <Users size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          {lang === 'ar' ? 'حلقات معلمات أو مسار حر' : 'Teacher Groups or Solo'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'انضم لحلقة مع معلمتك أو احفظ مستقلاً بحرية.' : 'Guided study with certified teachers or self-paced.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          {lang === 'ar' ? 'الحصون والمراجعة المتباعدة' : 'Retention & Spaced System'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'منظومة الحصون الخمسة لرسوخ لا ينسى.' : 'Progress tracking & spaced revision system.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Choose Path: Group Code vs Independent Learner */}
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    background: 'var(--bg-color)', 
                    border: '1px solid var(--primary-border)', 
                    textAlign: isRTL ? 'right' : 'left' 
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                      {lang === 'ar' ? 'اختر مسارك في سَفَر: هل لديك رمز حلقة من معلمتك؟' : 'Choose your path: Do you have a group code from your teacher?'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                      {lang === 'ar' 
                        ? 'إذا كان لديك رمز دعوة من حلقتك القرآنية أدخله هنا، أو تابع كحافظ مستقل دون أي إلزام.' 
                        : 'If you have an invitation code enter it below, or continue freely as an independent learner.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <button
                        type="button"
                        onClick={() => setGroupInfo(prev => ({ ...prev, choice: 'group' }))}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: groupInfo.choice === 'group' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                          background: groupInfo.choice === 'group' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: isRTL ? 'right' : 'left'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>👥</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)' }}>
                            {lang === 'ar' ? 'نعم، لدي رمز حلقة' : 'Yes, I have a code'}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {lang === 'ar' ? 'للانضمام لحلقة مع معلمة' : 'Join a teacher group'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGroupInfo(prev => ({ 
                          ...prev, 
                          choice: 'independent', 
                          isSafarMember: false, 
                          verifiedGroup: null, 
                          error: '',
                          successMessage: '' 
                        }))}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: groupInfo.choice === 'independent' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                          background: groupInfo.choice === 'independent' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: isRTL ? 'right' : 'left'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>🌿</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)' }}>
                            {lang === 'ar' ? 'حافظ مستقل' : 'Independent Learner'}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {lang === 'ar' ? 'متابعة حرة دون حلقة' : 'Self-paced memorization'}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* If Group Path chosen: show input & verification */}
                    {groupInfo.choice === 'group' && (
                      <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px dashed var(--primary)' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          {lang === 'ar' ? 'أدخل رمز الحلقة (مثال: NOOR2026 أو TAQWA-A)' : 'Enter Group Code (e.g. NOOR2026)'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={groupInfo.code}
                            onChange={(e) => setGroupInfo(prev => ({ ...prev, code: e.target.value.toUpperCase(), error: '', successMessage: '' }))}
                            placeholder="NOOR2026"
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--glass-border)',
                              background: 'var(--bg-color)',
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              fontFamily: 'monospace',
                              letterSpacing: '1px',
                              textTransform: 'uppercase'
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyGroupCode}
                            disabled={groupInfo.verifying || !groupInfo.code.trim()}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: 'var(--primary)',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: (groupInfo.verifying || !groupInfo.code.trim()) ? 'not-allowed' : 'pointer',
                              opacity: (groupInfo.verifying || !groupInfo.code.trim()) ? 0.7 : 1
                            }}
                          >
                            {groupInfo.verifying ? (lang === 'ar' ? 'جاري التحقق...' : 'Checking...') : (lang === 'ar' ? 'تحقق وانضمام' : 'Verify')}
                          </button>
                        </div>

                        {groupInfo.error && (
                          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#EF4444', fontWeight: 600 }}>
                            ⚠️ {groupInfo.error}
                          </div>
                        )}

                        {groupInfo.successMessage && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Check size={14} />
                            <span>{groupInfo.successMessage}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {groupInfo.choice === 'independent' && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px' }}>
                        💡 {lang === 'ar' 
                          ? 'يمكنك دائماً الانضمام لأي حلقة لاحقاً من ملفك الشخصي أو من الصفحة الرئيسية متى ما رغبت بذلك.'
                          : 'You can join a group later anytime from your profile or settings.'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Learning Style Assessment (Quiz vs Manual) */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                
                {/* Header with Mode Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Brain size={24} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>
                        {lang === 'ar' ? 'اختبار تحديد نمط الحفظ الأفضل لدماغك 🧠' : 'Brain Learning Style Assessment 🧠'}
                      </h2>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {lang === 'ar' ? 'صوتي أم مرئي؟ سنكتشف الطريقة الأكثر رسوخاً لتثبيت القرآن في صدرك.' : 'Audio or visual? Discover your most retention-proof memorization style.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setQuizMode(quizMode === 'quiz' ? 'manual' : 'quiz')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sliders size={14} />
                    <span>{quizMode === 'quiz' ? (lang === 'ar' ? 'تحديد يدوي مباشر' : 'Select Manually') : (lang === 'ar' ? 'خوض الاختبار الذكي' : 'Take Smart Quiz')}</span>
                  </button>
                </div>

                {/* 1. QUIZ MODE */}
                {quizMode === 'quiz' && (
                  <div>
                    {!quizCompleted ? (
                      <div>
                        {/* Question Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {lang === 'ar' ? `السؤال ${currentQuestionIdx + 1} من ${learningQuizQuestions.length}` : `Question ${currentQuestionIdx + 1} of ${learningQuizQuestions.length}`}
                          </span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {lang === 'ar' ? 'اختبار تشخيصي سريع (دقيقة واحدة)' : 'Quick Diagnostic (1 min)'}
                          </span>
                        </div>

                        <div style={{ height: '4px', width: '100%', background: 'var(--glass-border)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${((currentQuestionIdx + 1) / learningQuizQuestions.length) * 100}%`, 
                              background: 'var(--primary)', 
                              transition: 'width 0.3s ease' 
                            }} 
                          />
                        </div>

                        {/* Question Title */}
                        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>
                          {lang === 'ar' ? currentQ.titleAr : currentQ.titleEn}
                        </h3>

                        {/* Question Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                          {currentQ.options.map((opt) => {
                            const isSelected = quizAnswers[currentQ.id] === opt.id;
                            return (
                              <div
                                key={opt.id}
                                onClick={() => handleAnswerQuestion(currentQ.id, opt.id)}
                                style={{
                                  padding: '16px',
                                  borderRadius: '14px',
                                  border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                                  background: isSelected ? 'var(--primary-light)' : 'var(--bg-color)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '14px',
                                  transition: 'all 0.2s ease',
                                  textAlign: isRTL ? 'right' : 'left'
                                }}
                              >
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                                  color: isSelected ? 'white' : 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {getOptionIcon(opt.icon)}
                                </div>
                                <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                  {lang === 'ar' ? opt.textAr : opt.textEn}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Quiz Completed - Diagnosis Card */
                      <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-color)', border: '1.5px solid var(--primary)', textAlign: isRTL ? 'right' : 'left', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', display: 'block' }}>
                              🎯 النمط الأنسب الذي أظهره الاختبار:
                            </span>
                            <h3 style={{ margin: 0, fontSize: '19px', color: 'var(--text-primary)' }}>
                              {lang === 'ar' ? calculatedProfile?.styleLabelAr : calculatedProfile?.styleLabelEn}
                            </h3>
                          </div>
                        </div>

                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
                          {lang === 'ar' ? calculatedProfile?.recommendationAr : calculatedProfile?.recommendationEn}
                        </p>

                        {/* Scores breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>🎧 نمط صوتي / سمعي</span>
                            <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>{calculatedProfile?.percentages?.auditory}%</strong>
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>👁️ نمط مرئي / بصري</span>
                            <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>{calculatedProfile?.percentages?.visual}%</strong>
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>✍️ نمط حركي / كتابي</span>
                            <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{calculatedProfile?.percentages?.kinesthetic}%</strong>
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>📖 نمط تحليلي / تدبري</span>
                            <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{calculatedProfile?.percentages?.analytical}%</strong>
                          </div>
                        </div>

                        <button
                          onClick={handleResetQuiz}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>{lang === 'ar' ? 'إعادة الاختبار' : 'Retake Quiz'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. MANUAL SELECTION MODE */}
                {quizMode === 'manual' && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {[
                      { 
                        style: lang === 'ar' ? 'سمعي (صوتي)' : 'Auditory (Audio-First)', 
                        icon: Volume2, 
                        desc: lang === 'ar' ? 'تعتمد على الاستماع للقراء والتكرار الصوتي المباشر لنبرة التلاوة.' : 'Relies on listening to famous reciters and vocal repetition.' 
                      },
                      { 
                        style: lang === 'ar' ? 'بصري (مرئي)' : 'Visual (Visual-First)', 
                        icon: Eye, 
                        desc: lang === 'ar' ? 'تعتمد على رؤية الصفحات والخرائط الذهنية وتلوين الكلمات وأماكن الآيات.' : 'Focuses on mind maps, visual pages, and word coloring.' 
                      },
                      { 
                        style: lang === 'ar' ? 'سمعي بصري (مختلط)' : 'Audio-Visual (Mixed)', 
                        icon: Sparkles, 
                        desc: lang === 'ar' ? 'الدمج المتوازن بين الاستماع للشيخ ومتابعة صفحة المصحف.' : 'A robust blend of auditory, visual, and verbal recitation.' 
                      },
                      { 
                        style: lang === 'ar' ? 'حركي وكتابي (تفاعلي)' : 'Kinesthetic & Scribe', 
                        icon: Fingerprint, 
                        desc: lang === 'ar' ? 'تعتمد على كتابة الآيات واستخدام المسبحة والتسميع التفاعلي.' : 'Uses writing out verses and interactive repetition.' 
                      }
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
                )}

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

                  {/* 2. Old Memorization & Review Portion */}
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
                      {lang === 'ar' ? 'تم اعتماد خطتك ومحفظتك القرآنية بنجاح! 🎉' : 'Your custom plan has been configured! 🎉'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
                      {lang === 'ar' 
                        ? `نمط الحفظ: (${formData.learningStyle}) - وحدة القياس: (${formData.unitType === 'pages' ? 'صفحات' : formData.unitType === 'juzs' ? 'أجزاء' : 'سور وآيات'})`
                        : `Learning Style: (${formData.learningStyle}) - Unit: (${formData.unitType})`}
                    </p>

                    <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', textAlign: isRTL ? 'right' : 'left', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'نمط الحفظ المعتمد:' : 'Adopted style:'}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formData.learningStyle}</span>
                      </div>
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
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'أفضل وقت للمراجعة والتسميع:' : 'Optimal review time:'}</span>
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
