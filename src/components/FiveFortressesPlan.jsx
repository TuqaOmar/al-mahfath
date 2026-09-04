import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck,
  CheckCircle2, 
  Play, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Clock, 
  Repeat, 
  Calendar, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  Sun, 
  Moon, 
  Compass, 
  Flame, 
  RotateCcw,
  Sliders,
  Check,
  Zap,
  ArrowRight,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { SimplifiedFortressPlan } from './SimplifiedFortressPlan';
import { FiveFortressesVisualMap } from './FiveFortressesVisualMap';

// Helper to determine Surah and Juz based on page number
const getSurahNameForPage = (page) => {
  if (page <= 1) return 'الفاتحة';
  if (page <= 49) return 'البقرة';
  if (page <= 76) return 'آل عمران';
  if (page <= 106) return 'النساء';
  if (page <= 127) return 'المائدة';
  if (page <= 150) return 'الأنعام';
  if (page <= 176) return 'الأعراف';
  if (page <= 186) return 'الأنفال';
  if (page <= 207) return 'التوبة';
  if (page <= 221) return 'يونس';
  if (page <= 235) return 'هود';
  if (page <= 248) return 'يوسف';
  if (page <= 255) return 'الرعد';
  if (page <= 261) return 'إبراهيم';
  if (page <= 267) return 'الحجر';
  if (page <= 281) return 'النحل';
  if (page <= 293) return 'الإسراء';
  if (page <= 304) return 'الكهف';
  if (page <= 582) return 'عموم السور المتوسطة';
  return 'جزء عمّ';
};

const getJuzForPage = (page) => {
  return Math.min(30, Math.max(1, Math.ceil(page / 20)));
};

export const FiveFortressesPlan = ({ setActiveTab }) => {
  const { user, updateUserData } = useAuth();
  const { isRTL, lang } = useLanguage();
  const { notifyAndCelebrate } = useNotifications();

  const [activeSubTab, setActiveSubTab] = useState('visual-map'); // 'visual-map' | 'simplified-plan' | 'daily-plan' | 'methodology' | 'repetition-studio' | 'plan-customizer'
  const [expandedFortress, setExpandedFortress] = useState(null);

  // User state
  const fortressesToday = user?.preferences?.fortressesToday || { 1: false, 2: false, 3: false, 4: false, 5: false };
  const userPage = (user?.memorizedPagesCount || 0) + 1;
  const currentSurah = getSurahNameForPage(userPage);
  const currentJuz = getJuzForPage(userPage);

  // AI Plan Generator State
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState(null);

  // Customizer preferences
  const [customDailyTarget, setCustomDailyTarget] = useState(user?.preferences?.dailyTarget || 'صفحة واحدة يومياً');
  const [customReadingWird, setCustomReadingWird] = useState(user?.preferences?.readingWirdTarget || 'جزء كامل يومياً (20 صفحة)');
  const [customNearReview, setCustomNearReview] = useState(user?.preferences?.nearReviewTarget || 'آخر 20 صفحة تم حفظها');
  const [customOldReview, setCustomOldReview] = useState(user?.preferences?.oldReviewDailyTarget || 'نصف جزء يومياً (10 صفحات)');
  const [customRestDay, setCustomRestDay] = useState(user?.preferences?.restDay || 'يوم الجمعة (مراجعة وتثبيت + سورة الكهف)');
  const [isPlanSaved, setIsPlanSaved] = useState(false);

  // Repetition Studio State
  const [repMode, setRepMode] = useState('verse'); // 'verse' (20x), 'passage' (20x), 'page' (40x), 'near-prep' (15x)
  const [targetReps, setTargetReps] = useState(20);
  const [currentReps, setCurrentReps] = useState(0);
  const [repActiveTimer, setRepActiveTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Handle AI Plan Generation
  const handleGenerateAiPlan = async () => {
    setAiPlanLoading(true);
    try {
      const userContext = {
        name: user?.name || 'حافظ القرآن',
        currentPage: userPage,
        currentSurah,
        currentJuz,
        memorizedPagesCount: user?.memorizedPagesCount || 0,
        fortressesToday,
        dailyTarget: customDailyTarget
      };
      const prompt = `أرجو إعداد خطة يومية دقيقة ومحكمة بنظام الحصون الخمسة (طريقة د. سعيد أبو العلا حمزة) بناءً على موقعي الحالي: الصفحة ${userPage} من سورة ${currentSurah} (الجزء ${currentJuz}). فصّل لي ورد الختمة والاستماع بالحدر، والتحضير الثلاثي (الأسبوعي والليلي والقريب)، وخطوات الحفظ الجديد مع التكرار، ومراجعة القريب لآخر 20 صفحة، ومراجعة البعيد والصلاة به.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, userId: user?.uid || 'guest', userContext })
      });
      const data = await res.json();
      if (data.reply) {
        setAiPlanResult(data.reply);
      }
    } catch (e) {
      console.error('AI Plan Error:', e);
    } finally {
      setAiPlanLoading(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (repActiveTimer) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [repActiveTimer]);

  const handleRepModeChange = (mode) => {
    setRepMode(mode);
    setCurrentReps(0);
    if (mode === 'verse') setTargetReps(20);
    else if (mode === 'passage') setTargetReps(20);
    else if (mode === 'page') setTargetReps(40);
    else if (mode === 'near-prep') setTargetReps(15);
  };

  const handleIncrementRep = () => {
    const next = currentReps + 1;
    setCurrentReps(next);
    if (next === targetReps) {
      notifyAndCelebrate({
        title: '🎉 أحسنت! اكتملت جولة التكرار بنجاح!',
        message: `أتممت ${targetReps} تكراراً متقناً لرسوخ الآيات في الذاكرة الدائمة!`,
        type: 'wird',
        xpBonus: 40,
        badgeTitle: 'حارس التكرار الذهبي'
      });
    }
  };

  const handleResetRep = () => {
    setCurrentReps(0);
    setTimerSeconds(0);
    setRepActiveTimer(false);
  };

  const handleSaveCustomPlan = async () => {
    const updatedPreferences = {
      ...(user?.preferences || {}),
      dailyTarget: customDailyTarget,
      readingWirdTarget: customReadingWird,
      nearReviewTarget: customNearReview,
      oldReviewDailyTarget: customOldReview,
      restDay: customRestDay
    };

    updateUserData({ preferences: updatedPreferences });

    if (user?.uid) {
      try {
        await fetch(`/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: updatedPreferences })
        });
      } catch (e) {
        console.error('Save custom plan error:', e);
      }
    }

    setIsPlanSaved(true);
    setTimeout(() => setIsPlanSaved(false), 3000);

    notifyAndCelebrate({
      title: '✅ تم حفظ خطة الحصون الخمسة المخصصة!',
      message: 'تم تحديث خطتك وتوزيع أورادك اليومية بنجاح.',
      type: 'wird',
      xpBonus: 30
    });
  };

  // Toggle fortress status
  const handleToggleFort = async (id) => {
    const currentStatus = !!fortressesToday[id];
    const newStatus = !currentStatus;
    const newFortressesToday = { ...fortressesToday, [id]: newStatus };

    const xpDelta = newStatus ? 60 : -60;
    const newXp = Math.max(0, (user?.xp || 100) + xpDelta);
    const newLevel = Math.floor(newXp / 500) + 1;

    updateUserData({
      xp: newXp,
      level: newLevel,
      preferences: {
        ...(user?.preferences || {}),
        fortressesToday: newFortressesToday
      }
    });

    if (newStatus) {
      const fort = detailedFortresses.find(f => f.id === id);
      const doneCount = Object.values(newFortressesToday).filter(Boolean).length;

      if (doneCount === 5) {
        notifyAndCelebrate({
          title: '🏆 تاج الحصون الخمسة! أنجزت كافة الحصون اليومية!',
          message: 'ما شاء الله تبارك الله! أتممت القراءة والتحضير والحفظ والمراجعة القريبة والبعيدة!',
          type: 'wird',
          xpBonus: 250,
          badgeTitle: 'فارس الحصون الخمسة'
        });
      } else {
        notifyAndCelebrate({
          title: `تم إنجاز: ${fort?.name || 'الحصن اليومي'}! 🎯`,
          message: `أكملت الحصن بنجاح (+60 XP). بارك الله في همتك!`,
          type: 'wird',
          xpBonus: 60,
          badgeTitle: 'حارس القرآن'
        });
      }
    }
  };

  // Detailed 5-Fortresses Definition
  const detailedFortresses = [
    {
      id: 1,
      number: 'الحصن الأول',
      name: 'قراءة الاستماع والتلاوة المستمرة (الورد نظراً)',
      summary: 'قراءة جزء كامل يومياً من المصحف نظراً بتأنٍ وخشوع لتثبيت الذاكرة البصرية ومواضع الآيات.',
      todayTarget: `قراءة الجزء ${currentJuz} (الصفحات ${(currentJuz - 1) * 20 + 1} إلى ${currentJuz * 20}) نظراً من مصحفك الخاص`,
      timing: 'بعد صلاة الفجر أو الصباح الباكر (15-20 دقيقة)',
      goldenRule: 'لا يمر عليك يوم دون قراءة جزء نظراً. المصحف الواحد لا تغيّره أبداً لترتسم أماكن الآيات في ذهنك.',
      detailedSteps: [
        'افتح مصحفك الورقي أو الإلكتروني المعتمد دائماً (مصحف المدينة).',
        'اقرأ بصوت مسموع معتدل وبترتيل وتأنٍ دون استعجال.',
        'تأمل رؤوس الآيات ومواضع الأرباع وبدايات الصفحات.',
        'إذا لم يتيسر لك قراءة جزء كامل دفعة واحدة، قسّمه على الصلوات الخمس (4 صفحات بعد كل صلاة).'
      ],
      color: '#3B82F6',
      badge: 'الذاكرة البصرية'
    },
    {
      id: 2,
      number: 'الحصن الثاني',
      name: 'التحضير الثلاثي (الأسبوعي، الليلي، والقريب)',
      summary: 'تهيئة العقل واستيعاب الآيات وسماعها قبل الحفظ الفعلي لإزالة أي صعوبة في الألفاظ.',
      todayTarget: `التحضير الليلي لصفحة الغد (${userPage + 1}) + التحضير القريب لصفحة اليوم (${userPage})`,
      timing: 'التحضير الأسبوعي (يوم الجمعة) - الليلي (قبل النوم) - القريب (قبل الحفظ بـ 15 دقيقة)',
      goldenRule: 'التحضير يختصر 70% من وقت الحفظ! الحفظ بلا تحضير كالبناء على أرض هشة.',
      detailedSteps: [
        '1️⃣ التحضير الأسبوعي: سماع سورة الأسبوع (سورة ' + currentSurah + ') 3-5 مرات من قارئ متقن وتدبر موضوعاتها.',
        '2️⃣ التحضير الليلي: تلاوة صفحة الغد 5 إلى 10 مرات قبل النوم مباشرة لتستقر في العقل أثناء النوم.',
        '3️⃣ التحضير القريب: تلاوة الصفحة المستهدفة 15 مرة قبل جلسة الحفظ بـ 15 دقيقة وفهم الكلمات الغريبة.'
      ],
      color: '#8B5CF6',
      badge: 'التهيئة الذهنية'
    },
    {
      id: 3,
      number: 'الحصن الثالث',
      name: 'الحفظ الجديد (حفظ الوجه اليومي بتكرار متقن)',
      summary: 'إدخال الصفحة الجديدة في الذاكرة طويلة المدى بالتكرار والتجزئة المنهجية لتكون كالفاتحة.',
      todayTarget: `حفظ الصفحة ${userPage} من سورة ${currentSurah} بالتكرار المتسلسل (20x للآية، 40x للصفحة غيباً)`,
      timing: 'وقت الصفاء الذهني (بعد الفجر أو الصباح الباكر)',
      goldenRule: 'التكرار يصنع القرار! لا تنتقل من آية إلى آية حتى تنطق الأولى بطلاقة دون أي تردد.',
      detailedSteps: [
        'الخطوة 1: فهم المعنى الإجمالي وربط الآيات بالسياق.',
        'الخطوة 2: قسّم الصفحة إلى مقاطع (كل مقطع 2-3 آيات).',
        'الخطوة 3: كرّر الآية الأولى 20 مرة غيباً حتى تستقر على لسانك.',
        'الخطوة 4: كرّر الآية الثانية 20 مرة، ثم اربط الأولى بالثانية وكرّرهما معاً 20 مرة.',
        'الخطوة 5: بعد إتمام الصفحة كاملة، اسردها غيباً من 20 إلى 40 مرة متتالية.'
      ],
      color: '#10B981',
      badge: 'الحفظ الراسخ',
      interactiveAction: true
    },
    {
      id: 4,
      number: 'الحصن الرابع',
      name: 'المراجعة القريبة (حفظ آخر 30 يوماً / آخر 20 صفحة)',
      summary: 'تثبيت ومراجعة الصفحات المحفوظة حديثاً يومياً لمنع تفلتها قبل استقرارها في الذاكرة الدائمة.',
      todayTarget: `مراجعة الصفحات من ${Math.max(1, userPage - 20)} إلى ${Math.max(1, userPage - 1)} غيباً`,
      timing: 'في المساء أو بين المغرب والعشاء (20 دقيقة)',
      goldenRule: 'المحفوظ الجديد كالنبتة الغضة يحتاج رعاية وسقياً يومياً لمدة شهر حتى يشتد عوده.',
      detailedSteps: [
        'راجع يومياً آخر 20 صفحة تم حفظها (أو ما تم حفظه خلال آخر 30 يوماً).',
        'تُقرأ المراجعة القريبة غيباً وسرداً متصلاً.',
        'سجّل أي موضع توقفت فيه لتكراره 10 مرات وتثبيته.',
        'يمكنك مراجعة نصفها بعد الظهر والنصف الآخر بعد العصر.'
      ],
      color: '#EC4899',
      badge: 'حماية الجديد'
    },
    {
      id: 5,
      number: 'الحصن الخامس',
      name: 'المراجعة البعيدة وتثبيت القديم (المعاهدة الدائمة والصلاة به)',
      summary: 'مراجعة دورية منتظمة لكامل محفوظك القديم وتلاوته في الصلوات المكتوبة والسنن والنوافل.',
      todayTarget: `مراجعة ${customOldReview} من قديم المحفوظ + القراءة بما حفظت في صلوات اليوم`,
      timing: 'موزعة على ركعات السنن، الضحى، والوتر وقيام الليل',
      goldenRule: 'من قرأ القرآن في صلاته ثَبَت، ومن قرأه في غير صلاته كَثُر ثوابه وتفلت حفظه.',
      detailedSteps: [
        'قسّم كامل محفوظك القديم على جدول منتظم (ختمة مراجعة كل 10 إلى 30 يوماً).',
        'راجع نصف جزء إلى جزء يومياً من السور التي أتممتها مسبقاً.',
        'صلِّ بسنتك الراتبة والوتر والتهجد بما حفظته هذا اليوم لتسكبه في صلاتك.',
        'شارك في جلسات التسميع مع الأصدقاء أو في منتدى المجتمع لتعزيز الاستقرار.'
      ],
      color: '#F59E0B',
      badge: 'المعاهدة والبركة'
    }
  ];

  const completedCount = Object.values(fortressesToday).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        padding: '28px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
        color: 'white',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🏰 نظام ومنهجية الحصون الخمسة</h1>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', fontWeight: 'bold' }}>
                  طريقة د. سعيد أبو العلا حمزة
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>
                المنهجية العلمية الأقوى لرسوخ القرآن الكريم ومنع التفلت والنسيان بتكامل الورد والتحضير والحفظ والمراجعة.
              </p>
            </div>
          </div>

          <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', display: 'block' }}>إنجاز حصون اليوم:</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34D399' }}>
              {completedCount} من 5 حصون ({progressPercent}%)
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '6px',
        borderRadius: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'visual-map', label: isRTL ? '🗺️ خريطة الحصون البصرية' : '🗺️ 5-Fortresses Map', icon: Compass },
          { id: 'simplified-plan', label: isRTL ? '⚡ الخطة اليومية المبسطة' : '⚡ Daily Fortress Plan', icon: ShieldCheck },
          { id: 'daily-plan', label: isRTL ? '📅 خطة اليوم التفصيلية' : '📅 Detailed Daily Plan', icon: Calendar },
          { id: 'repetition-studio', label: isRTL ? '🔢 معمل التكرار الذكي (20x)' : '🔢 20x Repetition Studio', icon: Repeat },
          { id: 'methodology', label: isRTL ? '📖 الدليل والمنهجية الشاملة' : '📖 Comprehensive Guide', icon: BookOpen },
          { id: 'plan-customizer', label: isRTL ? '⚙️ تخصيص وحاسبة الخطة' : '⚙️ Plan Customizer', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flex: 1,
                minWidth: '170px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2.4 SUB-VIEW: Interactive 5-Fortresses Visual Map */}
      {activeSubTab === 'visual-map' && (
        <FiveFortressesVisualMap 
          onNavigateToVoiceRecitation={(p) => setActiveTab && setActiveTab('daily-session')} 
          onNavigateToQuran={(p) => setActiveTab && setActiveTab('quran-interactive')} 
        />
      )}

      {/* 2.5 SUB-VIEW: Simplified Fortress Plan */}
      {activeSubTab === 'simplified-plan' && (
        <SimplifiedFortressPlan 
          onNavigateToQuran={(p) => setActiveTab && setActiveTab('quran-interactive')} 
          onAskAi={(prompt) => setActiveTab && setActiveTab('ai-assistant')} 
        />
      )}

      {/* 3. SUB-VIEW A: Daily Plan Detailed Tracker */}
      {activeSubTab === 'daily-plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Milestone Status Bar */}
          <div style={{
            padding: '18px 24px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Compass size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>موقعك المسجل في المصحف:</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '17px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  الصفحة {userPage} — سورة {currentSurah} (الجزء {currentJuz})
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleGenerateAiPlan}
                disabled={aiPlanLoading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: aiPlanLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                <Sparkles size={16} />
                {aiPlanLoading ? 'جاري إعداد الخطة...' : 'توليد خطة الحصون بالذكاء الاصطناعي 🤖'}
              </button>

              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Award size={16} color="var(--primary)" />
                  المجتمع القرآني
                </button>
              )}
            </div>
          </div>

          {/* AI Plan Result Box if Generated */}
          {aiPlanResult && (
            <div style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.04) 100%)',
              border: '1.5px solid var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary)" />
                  الخطة المولّدة خصيصاً لك بواسطة المعلم الذكي (Gemini AI)
                </h4>
                <button
                  type="button"
                  onClick={() => setAiPlanResult(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  إغلاق ✕
                </button>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                padding: '20px',
                borderRadius: '14px',
                border: '1px solid var(--glass-border)',
                lineHeight: 1.8,
                fontSize: '14px',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line'
              }}>
                {aiPlanResult}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#F59E0B" /> قائمة مهام الحصون الخمسة لليوم ({new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })})
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              اضغط على أي حصن لعرض تفاصيله وخطواته العملية 👇
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {detailedFortresses.map((fort) => {
              const isDone = !!fortressesToday[fort.id];
              const isExpanded = expandedFortress === fort.id;

              return (
                <div
                  key={fort.id}
                  style={{
                    borderRadius: '20px',
                    background: isDone ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)' : 'var(--bg-surface)',
                    border: `1.5px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Card Header & Summary */}
                  <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '280px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: `${fort.color}15`,
                        color: fort.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Shield size={24} fill={isDone ? fort.color : 'none'} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: fort.color, background: `${fort.color}15`, padding: '2px 8px', borderRadius: '6px' }}>
                            {fort.number}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                            {fort.badge}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                          {fort.name}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                            🎯 المطلوب اليوم: {fort.todayTarget}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> {fort.timing}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions and toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {fort.interactiveAction && !isDone && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('daily-session')}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          <Play size={14} /> جلسة الحفظ والتسميع 🎤
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleFort(fort.id)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '12px',
                          border: `1.5px solid ${isDone ? 'var(--primary)' : 'var(--glass-border)'}`,
                          background: isDone ? 'var(--primary-light)' : 'var(--bg-color)',
                          color: isDone ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 size={16} color="var(--primary)" />
                            تم الإنجاز (+60 XP)
                          </>
                        ) : (
                          'تحديد كـ منجز ✓'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedFortress(isExpanded ? null : fort.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid var(--glass-border)',
                          background: 'var(--bg-color)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                        title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل والخطوات'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Deep Details */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px 24px',
                      background: 'var(--bg-color)',
                      borderTop: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}>
                      {/* Golden Rule Note */}
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${fort.color}10`,
                        border: `1px solid ${fort.color}30`,
                        color: fort.color,
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Sparkles size={16} /> القاعدة الذهبية للحصن: {fort.goldenRule}
                      </div>

                      {/* Step by Step instructions */}
                      <div>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                          📝 الخطوات العملية لإتقان هذا الحصن اليوم:
                        </h5>
                        <ul style={{ margin: 0, paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {fort.detailedSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Quick Action in Card */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        {fort.id === 3 && (
                          <button
                            type="button"
                            onClick={() => setActiveSubTab('repetition-studio')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              border: '1px solid var(--primary)',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Repeat size={14} /> فتح معمل التكرار الذكي (20x)
                          </button>
                        )}
                        {fort.id === 1 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('daily-session')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3B82F6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <BookOpen size={14} /> فتح المصحف التفاعلي للقراءة
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SUB-VIEW B: Comprehensive Methodology & Book Guide */}
      {activeSubTab === 'methodology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              📚 ما هي طريقة الحصون الخمسة ولماذا هي الأنجح عالمياً؟
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
              ابتكر هذه الطريقة فضيلة الشيخ الدكتور <strong>سعيد أبو العلا حمزة</strong>، لمعالجة المشكلة الكبرى التي يعاني منها 90% من طلاب القرآن: <em>(الحفظ السريع مع التفلت السريع)</em>. 
              تقوم المنهجية على فكرة أن الحفظ ليس مجرد جلسة تسميع، بل هو <strong>قلعة محصنة بخمسة أسوار دفاعية</strong> تمنع الشيطان والنسيان من النيل من الآيات.
            </p>
          </div>

          {/* 6 Golden Rules */}
          <div style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} /> القواعد الذهبية الست لحافظ الحصون الخمسة:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: '1. الإخلاص والدعاء بالثبات', desc: 'استحضر نية التقرب إلى الله وطلب رضاه في كل آية تكررها.', icon: Heart, color: '#EF4444' },
                { title: '2. وحدة المصحف (الذاكرة الصورية)', desc: 'استخدم طبعة واحدة من المصحف طوال رحلتك لترتسم الصفحات في خيالك.', icon: BookOpen, color: '#3B82F6' },
                { title: '3. قانون التكرار (20x للآية)', desc: 'لا تنتقل لأي آية جديدة حتى تكرر الآية 20 مرة والمقطع 20 مرة.', icon: Repeat, color: '#10B981' },
                { title: '4. التحضير المسبق (سرعة الحفظ)', desc: 'قراءة الصفحة وسماعها قبل الحفظ يزيل عثرات اللسان وصعوبة المعنى.', icon: Zap, color: '#8B5CF6' },
                { title: '5. الصلاة بالمحفوظ (أعلى درجات التثبيت)', desc: 'صلِّ بما حفظت اليوم في السنن والنوافل وقيام الليل ليثبت كالفاتحة.', icon: Moon, color: '#F59E0B' },
                { title: '6. الاستمرار وعدم الانقطاع', desc: 'قليل دائم خير من كثير منقطع. الورد اليومي التزام لا يسقط أبداً.', icon: Flame, color: '#EC4899' }
              ].map((rule, idx) => {
                const Icon = rule.icon;
                return (
                  <div key={idx} style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${rule.color}15`, color: rule.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} />
                      </div>
                      <h5 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{rule.title}</h5>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rule.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Schedule breakdown */}
          <div style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sun size={20} color="#F59E0B" /> الجدول اليومي النموذجي لتوزيع الحصون الخمسة:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { time: '🌅 بعد صلاة الفجر (40 دقيقة)', task: 'الحصن 1 (قراءة جزء نظراً) + الحصن 3 (الحفظ الجديد للصفحة بالتكرار المتقن).' },
                { time: '☀️ الضحى / بعد الظهر (15 دقيقة)', task: 'الحصن 4 (المراجعة القريبة لآخر 20 صفحة تم حفظها).' },
                { time: '🌇 بعد العصر أو المغرب (20 دقيقة)', task: 'الحصن 5 (المراجعة البعيدة من قديم المحفوظ - نصف جزء).' },
                { time: '🌙 بعد العشاء وقبل النوم (15 دقيقة)', task: 'الحصن 2 (التحضير الليلي لصفحة الغد بقراءتها 10 مرات قبل النوم).' },
                { time: '🌌 قيام الليل والسنن', task: 'التلاوة بالوجه الجديد ومراجعة اليوم في ركعات الصلاة.' }
              ].map((slot, idx) => (
                <div key={idx} style={{ padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>{slot.time}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{slot.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VIEW C: Repetition Studio (20x-40x Counter) */}
      {activeSubTab === 'repetition-studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              🔢 معمل التكرار الذكي (عداد الحصن الثالث)
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 auto 20px', maxWidth: '600px' }}>
              وفق منهجية الحصون الخمسة، التكرار الصوتي المسموع هو سر انتقال الآية للذاكرة الدائمة. اختر الوضع واضغط على العداد مع كل تكرار!
            </p>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
              {[
                { id: 'verse', label: 'تكرار الآية الواحدة (20x)', target: 20 },
                { id: 'passage', label: 'تكرار المقطع والربط (20x)', target: 20 },
                { id: 'page', label: 'سرد الصفحة كاملة غيباً (40x)', target: 40 },
                { id: 'near-prep', label: 'التحضير القريب (15x)', target: 15 }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleRepModeChange(m.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${repMode === m.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: repMode === m.id ? 'var(--primary-light)' : 'var(--bg-color)',
                    color: repMode === m.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Big Interactive Click Counter */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '32px 20px',
              borderRadius: '24px',
              background: 'var(--bg-color)',
              border: '2px dashed var(--primary)',
              maxWidth: '450px',
              margin: '0 auto'
            }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                المستهدف الحالي: {targetReps} تكرارات
              </span>

              <button
                type="button"
                onClick={handleIncrementRep}
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: currentReps >= targetReps ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                  color: 'white',
                  border: 'none',
                  fontSize: '42px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                  transition: 'transform 0.1s ease',
                  userSelect: 'none'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>{currentReps}</span>
                <span style={{ fontSize: '11px', opacity: 0.9 }}>اضغط للتكرار +1</span>
              </button>

              {/* Progress visual */}
              <div style={{ width: '100%', maxWidth: '280px', height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (currentReps / targetReps) * 100)}%`, height: '100%', background: currentReps >= targetReps ? '#10B981' : '#3B82F6', transition: 'width 0.2s ease' }} />
              </div>

              {/* Status Note */}
              {currentReps >= targetReps ? (
                <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} /> تم إنجاز جولة التكرار بنجاح! انتقل للمقطع التالي 🌿
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  متبقي {Math.max(0, targetReps - currentReps)} تكرار لاكتمال الجولة
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRepActiveTimer(!repActiveTimer)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Clock size={14} />
                  {repActiveTimer ? `مؤقت الجلسة: ${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}` : 'بدء مؤقت الجلسة'}
                </button>

                <button
                  type="button"
                  onClick={handleResetRep}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={14} /> تصفير
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW D: Custom Plan Generator & Settings */}
      {activeSubTab === 'plan-customizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            padding: '24px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              ⚙️ حاسبة وتخصيص خطة الحصون الخمسة
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              اضبط مقادير أورادك اليومية لتلائم وقتك وظروفك، وسيقوم النظام بتوزيع الحصون الخمسة تلقائياً وتحديث أهدافك اليومية.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              
              {/* Field 1: Daily New Target */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  1️⃣ مقدار الحفظ الجديد اليومي (الحصن 3):
                </label>
                <select
                  value={customDailyTarget}
                  onChange={e => setCustomDailyTarget(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '13px', outline: 'none' }}
                >
                  <option value="نصف صفحة يومياً">نصف صفحة يومياً (للمبتدئين والمشغولين)</option>
                  <option value="صفحة واحدة يومياً">صفحة واحدة يومياً (الوتيرة الذهبية الموصى بها)</option>
                  <option value="صفحتان يومياً (وجهان)">صفحتان يومياً (وجهان - وتيرة متقدمة)</option>
                  <option value="ربع جزء يومياً (5 صفحات)">ربع جزء يومياً (للطلاب المتفرغين)</option>
                </select>
              </div>

              {/* Field 2: Reading Wird */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  2️⃣ قراءة الاستماع والتلاوة نظراً (الحصن 1):
                </label>
                <select
                  value={customReadingWird}
                  onChange={e => setCustomReadingWird(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '13px', outline: 'none' }}
                >
                  <option value="نصف جزء يومياً (10 صفحات)">نصف جزء يومياً (10 صفحات)</option>
                  <option value="جزء كامل يومياً (20 صفحة)">جزء كامل يومياً (20 صفحة - أصل الحصون الخمسة)</option>
                  <option value="جزأين يومياً (40 صفحة)">جزأين يومياً (40 صفحة - ختمة كل 15 يوماً)</option>
                </select>
              </div>

              {/* Field 3: Near Review */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  3️⃣ المراجعة القريبة للحديث (الحصن 4):
                </label>
                <select
                  value={customNearReview}
                  onChange={e => setCustomNearReview(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '13px', outline: 'none' }}
                >
                  <option value="آخر 10 صفحات تم حفظها">آخر 10 صفحات تم حفظها</option>
                  <option value="آخر 20 صفحة تم حفظها">آخر 20 صفحة تم حفظها (جزء كامل)</option>
                  <option value="كامل السورة الحالية قيد الحفظ">كامل السورة الحالية قيد الحفظ</option>
                </select>
              </div>

              {/* Field 4: Old Review */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  4️⃣ المراجعة البعيدة وتثبيت القديم (الحصن 5):
                </label>
                <select
                  value={customOldReview}
                  onChange={e => setCustomOldReview(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '13px', outline: 'none' }}
                >
                  <option value="ربع جزء يومياً (5 صفحات)">ربع جزء يومياً (5 صفحات)</option>
                  <option value="نصف جزء يومياً (10 صفحات)">نصف جزء يومياً (10 صفحات - الموصى به)</option>
                  <option value="جزء كامل يومياً (20 صفحة)">جزء كامل يومياً (ختمة مراجعة شهرية)</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveCustomPlan}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isPlanSaved ? <CheckCircle2 size={18} /> : <Check size={18} />}
                {isPlanSaved ? 'تم حفظ الخطة بنجاح!' : 'اعتماد وحفظ خطة الحصون الخمسة'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
