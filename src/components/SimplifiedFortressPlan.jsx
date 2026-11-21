import { declaredPages, nextDeclaredPage } from '../lib/memorization';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  BookOpen, 
  Moon, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  Circle, 
  Compass, 
  Flame, 
  Clock, 
  Layers, 
  Share2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Cloud,
  Check,
  Bell,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  generateFiveFortressesPlan, 
  saveFortressPlanToFirestore, 
  getFortressPlanFromFirestore, 
  subscribeToFortressPlan,
  currentFortressCompletion
} from '../lib/fortressService';
import { getSurahNameForPage, getJuzForPage, getPageRangeForJuz, getJuzStartPage } from '../utils/quranData';

export const SimplifiedFortressPlan = ({ onNavigateToQuran, onAskAi, onPlanSaved }) => {
  const { user, applyConfirmedUser } = useAuth();
  const { lang } = useLanguage();
  const ar = lang !== 'en';
  const { 
    reminderSettings, 
    updateReminderSettings, 
    testReminderNow 
  } = useNotifications();
  const userId = user?.uid;

  // Current user's progress
  const userMemorizedCount = declaredPages(user).length;
  const initialPage = Math.min(604, Math.max(1, userMemorizedCount + 1));
  const initialJuz = getJuzForPage(initialPage);

  const [selectedJuz, setSelectedJuz] = useState(initialJuz);
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [plan, setPlan] = useState(() => generateFiveFortressesPlan(initialJuz, initialPage));
  const [completion, setCompletion] = useState({
    khatmah: false,
    preparation: false,
    newMemorization: false,
    nearRevision: false,
    farRevision: false
  });
  const [syncStatus, setSyncStatus] = useState('loading');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const saveInFlight = useRef(false);
  const [saveError, setSaveError] = useState(''); // 'synced' | 'saving' | 'saved'
  const [activeRepModal, setActiveRepModal] = useState(null); // 'ayah' | 'page' | null
  const [repCount, setRepCount] = useState(0);
  useEffect(() => {
    setPlan(generateFiveFortressesPlan(initialJuz, initialPage));
    setCompletion(currentFortressCompletion(null));
    setHasLoaded(false);
    setSaveError('');
  }, [userId]);

  // Load user plan from Firestore on mount
  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;

    async function loadInitialPlan() {
      setSyncStatus('loading');
      setHasLoaded(false);
      try {
        const loaded = await getFortressPlanFromFirestore(userId, initialJuz, initialPage);
        if (!active) return;
        setPlan(loaded);
        if (loaded.lastJuzReached) setSelectedJuz(loaded.lastJuzReached);
        if (loaded.currentPage) setSelectedPage(loaded.currentPage);
        setCompletion(currentFortressCompletion(loaded));
        setHasLoaded(true);
        setSaveError('');
        setSyncStatus(loaded.persistenceStatus === 'draft' ? 'draft' : 'synced');
      } catch (error) {
        if (active) { setSaveError(error.message); setSyncStatus('failed'); }
      }
    }

    loadInitialPlan();

    if (userId && userId !== 'guest') {
      unsubscribe = subscribeToFortressPlan(userId, (updatedPlan) => {
        if (active && updatedPlan && !saveInFlight.current) {
          setPlan(updatedPlan);
          setSelectedJuz(updatedPlan.lastJuzReached || initialJuz);
          setSelectedPage(updatedPlan.currentPage || initialPage);
          setCompletion(currentFortressCompletion(updatedPlan));
        }
      }, (error) => {
        if (active) { setSaveError(error.message); setSyncStatus('failed'); }
      });
    }

    return () => { active = false; unsubscribe(); };
  }, [userId, loadAttempt]);

  // Recalculate and persist whenever selected Juz or Page changes
  const handleJuzChange = async (newJuz) => {
    if (saveInFlight.current || !hasLoaded) return;
    const juzNum = Number(newJuz);
    const startPage = getJuzStartPage(juzNum);

    const newPlan = generateFiveFortressesPlan(juzNum, startPage, plan?.dailyTarget);
    newPlan.completionStatus = completion;
    saveInFlight.current = true;
    setSyncStatus('saving');
    try {
      setSaveError('');
      const result = await saveFortressPlanToFirestore(userId, newPlan);
      if (result.user && applyConfirmedUser(result).success !== true) throw new Error('Authentication changed while applying the saved plan');
      setPlan(result.plan);
      onPlanSaved?.(result.plan);
      setSelectedJuz(result.plan.lastJuzReached);
      setSelectedPage(result.plan.currentPage);
      setCompletion(currentFortressCompletion(result.plan));
      setSyncStatus('saved');
    } catch (error) {
      setSaveError(error.message);
      setSyncStatus('failed');
    } finally {
      saveInFlight.current = false;
    }
  };

  // Toggle completion of a fortress
  const handleToggleCompletion = async (key) => {
    if (saveInFlight.current || !hasLoaded) return;
    const updated = {
      ...completion,
      [key]: !completion[key]
    };

    const updatedPlan = {
      ...plan,
      completionStatus: updated
    };
    saveInFlight.current = true;
    setSyncStatus('saving');
    try {
      setSaveError('');
      const result = await saveFortressPlanToFirestore(userId, updatedPlan);
      if (result.user && applyConfirmedUser(result).success !== true) throw new Error('Authentication changed while applying the saved plan');
      setPlan(result.plan);
      onPlanSaved?.(result.plan);
      setCompletion(currentFortressCompletion(result.plan));
      setSyncStatus('saved');
    } catch (error) {
      setSaveError(error.message);
      setSyncStatus('failed');
    } finally {
      saveInFlight.current = false;
    }
  };

  // Completed count
  const completedCount = Object.values(completion).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  const currentSurah = getSurahNameForPage(selectedPage);
  const currentJuzRange = getPageRangeForJuz(selectedJuz);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {saveError && <div role="alert" data-testid="fortress-save-error">{saveError}</div>}
      {!hasLoaded && syncStatus === 'failed' && <button data-testid="simplified-fortress-reload" onClick={() => setLoadAttempt(n => n + 1)}>{ar ? 'إعادة تحميل الخطة المحفوظة' : 'Reload saved plan'}</button>}
      <p>{ar ? 'موقع البداية مبني على تصريحات الطالب وخيارات الخطة، وليس حفظًا معتمدًا.' : 'The starting point comes from your own entries and plan choices, not approved memorization.'}</p>
      {/* 🌟 Header Card with Juz Selector & Sync Indicator */}
      <div style={{
        padding: '24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #1A3F39 0%, #1F4A43 50%, #285C53 100%)',
        color: 'white',
        boxShadow: '0 12px 30px rgba(26, 63, 57, 0.25)',
        border: '1px solid rgba(79, 168, 153, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#8FD3C8" />
              </div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'white' }}>
                {ar ? <>خطة مراجعة الحصون الخمسة 🏰</> : <>Five Fortresses review plan 🏰</>}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#DDF1ED', lineHeight: 1.6 }}>
              {ar ? <>منهجية علمية متكاملة لربط الحفظ والمراجعة بآخر جزء وصلت إليه، لتثبيت القرآن في صدرك كالفاتحة.</> : <>A complete method linking memorization and review to the last juz you reached, so the Quran stays firm like al-Fatiha.</>}
            </p>
          </div>

          {/* Firestore Sync Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.2)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <Cloud size={15} color="#4FA899" />
            <span data-testid="simplified-fortress-status" style={{ fontSize: '12px', color: '#EDE6EA', fontWeight: 'bold' }}>
              {ar ? (syncStatus === 'failed' ? 'تعذر تحميل أو حفظ الخطة؛ لم يتغير آخر سجل مؤكد' : syncStatus === 'loading' ? 'جاري تحميل الخطة...' : syncStatus === 'saving' ? 'جاري الحفظ...' : syncStatus === 'draft' ? 'مسودة غير محفوظة؛ احفظ الجزء أو أول إنجاز' : syncStatus === 'saved' ? 'تم الحفظ ✓' : 'الخطة محفوظة') : (syncStatus === 'failed' ? 'Could not load or save the plan; last confirmed record unchanged' : syncStatus === 'loading' ? 'Loading plan...' : syncStatus === 'saving' ? 'Saving...' : syncStatus === 'draft' ? 'Unsaved draft; save the juz or a first completion' : syncStatus === 'saved' ? 'Saved ✓' : 'Plan saved')}
            </span>
          </div>
        </div>

        {/* Interactive "Last Juz Reached" Picker */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '16px 20px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Compass size={22} color="#4FA899" />
            <div>
              <span style={{ fontSize: '12px', color: '#BFE5DE', display: 'block' }}>{ar ? 'آخر جزء وصلت إليه في الحفظ والمراجعة:' : 'Last juz you reached:'}</span>
              <strong style={{ fontSize: '16px', color: 'white' }}>
                {ar ? <>الجزء {selectedJuz} (سورة {currentSurah} — الصفحات {currentJuzRange.startPage} إلى {currentJuzRange.endPage})</> : <>Juz {selectedJuz} (Surah {currentSurah} — pages {currentJuzRange.startPage} to {currentJuzRange.endPage})</>}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#EDE6EA' }}>{ar ? 'تغيير الجزء:' : 'Change juz:'}</label>
            <select
              data-testid="simplified-fortress-juz"
              disabled={!hasLoaded || syncStatus === 'saving'}
              value={selectedJuz}
              onChange={(e) => handleJuzChange(e.target.value)}
              style={{
                background: '#285C53',
                color: 'white',
                border: '1.5px solid #4FA899',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => (
                <option key={juzNum} value={juzNum}>
                  {`${ar ? 'الجزء' : 'Juz'} ${juzNum} (${getPageRangeForJuz(juzNum).startPage} - ${getPageRangeForJuz(juzNum).endPage})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Metric Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#DDF1ED', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} color="#F0BE5A" />
              {ar ? <>إنجاز الحصون المصرّح به لليوم: <strong data-testid="simplified-fortress-count">{completedCount} من أصل 5 حصون</strong></> : <>Fortresses you marked today: <strong data-testid="simplified-fortress-count">{completedCount} of 5</strong></>}
            </span>
            <span style={{ color: '#8FD3C8', fontWeight: 'bold' }}>{progressPercent}% {ar ? 'مكتمل' : 'done'}</span>
          </div>

          <div style={{ width: '100%', height: '10px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #F0BE5A 0%, #4FA899 100%)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* ⏰ Daily Review Reminder Quick Banner */}
      <div style={{
        padding: '14px 20px',
        borderRadius: '18px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: reminderSettings?.enabled ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.05)',
            color: reminderSettings?.enabled ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {ar ? <>⏰ التنبيه اليومي لمراجعة الحصون:</> : <>⏰ Daily fortress review reminder:</>}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: reminderSettings?.enabled ? 'rgba(55, 125, 113, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                color: reminderSettings?.enabled ? '#377D71' : '#EF4444',
                fontWeight: 'bold'
              }}>
                {reminderSettings?.enabled ? (ar ? `مفعل الساعة ${reminderSettings?.time}` : `On at ${reminderSettings?.time}`) : (ar ? 'معطل' : 'Off')}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {ar ? <>يتم إرسال إشعار تفاعلي وتنبيه صوتي يومي في الموعد المحدد لتثبيت المحفوظ دون انقطاع.</> : <>A daily notification and sound are sent at the chosen time so you keep your memorization steady.</>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => updateReminderSettings({ enabled: !reminderSettings?.enabled })}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: `1px solid ${reminderSettings?.enabled ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: reminderSettings?.enabled ? 'var(--primary-light)' : 'var(--bg-color)',
              color: reminderSettings?.enabled ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {reminderSettings?.enabled ? (ar ? 'إيقاف التنبيه' : 'Turn off reminder') : (ar ? 'تفعيل التنبيه 🔔' : 'Turn on reminder 🔔')}
          </button>

          <button
            onClick={testReminderNow}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #377D71 0%, #2F6B61 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(55, 125, 113, 0.3)'
            }}
          >
            <Volume2 size={14} />
            {ar ? <>تجربة التنبيه الفوري 🚀</> : <>Test the reminder now 🚀</>}
          </button>
        </div>
      </div>

      {/* 🏰 The 5 Fortress Simplified Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 1. الحصن الأول: الختمة والتلاوة */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.khatmah ? 'rgba(55, 125, 113, 0.08)' : 'var(--bg-surface)',
          border: completion.khatmah ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(76, 184, 230, 0.2) 0%, rgba(47, 149, 194, 0.1) 100%)',
              color: '#1F6E8C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BookOpen size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {ar ? <>1. الحصن الأول: قراءة الختمة والاستماع بالحدر</> : <>1. First fortress: reading the khatmah and listening (hadr)</>}
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(31, 110, 140, 0.12)', color: '#1F6E8C', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {ar ? <>الجزء {selectedJuz}</> : <>Juz {selectedJuz}</>}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ar ? <>قراءة الجزء {selectedJuz} (ص {currentJuzRange.startPage} - {currentJuzRange.endPage}) نظراً لتعهد المصحف كاملاً شهرياً، مع الاستماع للورد بالحدر.</> : <>Read juz {selectedJuz} (p. {currentJuzRange.startPage} - {currentJuzRange.endPage}) to go through the whole Mushaf monthly, while listening to the portion.</>}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="fortress-toggle-khatmah"
            onClick={() => handleToggleCompletion('khatmah')}
            disabled={!hasLoaded || syncStatus === 'saving'}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: completion.khatmah ? 'var(--primary)' : 'var(--bg-color)',
              color: completion.khatmah ? 'white' : 'var(--text-secondary)',
              border: completion.khatmah ? 'none' : '1px solid var(--glass-border)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {completion.khatmah ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {completion.khatmah ? (ar ? 'تم إنجاز القراءة' : 'Reading done') : (ar ? 'تحديد كمكتمل' : 'Mark as done')}
          </button>
        </div>

        {/* 2. الحصن الثاني: التحضير الثلاثي */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.preparation ? 'rgba(55, 125, 113, 0.08)' : 'var(--bg-surface)',
          border: completion.preparation ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(122, 64, 105, 0.1) 100%)',
              color: '#7A4069',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Moon size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {ar ? <>2. الحصن الثاني: التحضير الثلاثي (الليلي والقبلي)</> : <>2. Second fortress: preparation (night before and before memorizing)</>}
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(122, 64, 105, 0.12)', color: '#7A4069', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {ar ? <>ص {selectedPage} و ص {Math.min(604, selectedPage + 1)}</> : <>p. {selectedPage} and p. {Math.min(604, selectedPage + 1)}</>}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ar ? <>🌙 <strong>التحضير الليلي:</strong> تلاوة صفحة الغد (ص {Math.min(604, selectedPage + 1)}) 15 مرة قبل النوم مباشرة.</> : <>🌙 <strong>Night before:</strong> recite tomorrow's page (p. {Math.min(604, selectedPage + 1)}) 15 times right before sleep.</>}
                <br />
                {ar ? <>☀️ <strong>التحضير القبلي:</strong> قراءة صفحة اليوم (ص {selectedPage}) 15 دقيقة قبل الحفظ مع فهم الكلمات الغريبة.</> : <>☀️ <strong>Before memorizing:</strong> read today's page (p. {selectedPage}) for 15 minutes and understand unusual words.</>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('preparation')}
            data-testid="simplified-fortress-complete-preparation"
            disabled={!hasLoaded || syncStatus === 'saving'}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: completion.preparation ? 'var(--primary)' : 'var(--bg-color)',
              color: completion.preparation ? 'white' : 'var(--text-secondary)',
              border: completion.preparation ? 'none' : '1px solid var(--glass-border)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {completion.preparation ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {completion.preparation ? (ar ? 'تم التحضير' : 'Prepared') : (ar ? 'تحديد كمكتمل' : 'Mark as done')}
          </button>
        </div>

        {/* 3. الحصن الثالث: الحفظ الجديد */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.newMemorization ? 'rgba(55, 125, 113, 0.08)' : 'var(--bg-surface)',
          border: completion.newMemorization ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(55, 125, 113, 0.2) 0%, rgba(47, 107, 97, 0.1) 100%)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {ar ? <>3. الحصن الثالث: الحفظ الجديد وتكرار 20x و 40x</> : <>3. Third fortress: new memorization with 20x and 40x repetition</>}
                </h3>
                <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {ar ? <>صفحة {selectedPage} ({currentSurah})</> : <>Page {selectedPage} ({currentSurah})</>}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ar ? <>حفظ الصفحة {selectedPage} من سورة {currentSurah} مع تطبيق قاعدة التكرار: 20 مرة لكل آية غيباً، و40 مرة للصفحة كاملة متصلة.</> : <>Memorize page {selectedPage} of Surah {currentSurah} using the repetition rule: 20 times per ayah by heart, and 40 times for the whole page connected.</>}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {onNavigateToQuran && (
              <button
                type="button"
                onClick={() => onNavigateToQuran(selectedPage)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BookOpen size={15} color="var(--primary)" />
                {ar ? <>فتح الصفحة</> : <>Open page</>}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleToggleCompletion('newMemorization')}
              data-testid="simplified-fortress-complete-newMemorization"
              disabled={!hasLoaded || syncStatus === 'saving'}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: completion.newMemorization ? 'var(--primary)' : 'var(--bg-color)',
                color: completion.newMemorization ? 'white' : 'var(--text-secondary)',
                border: completion.newMemorization ? 'none' : '1px solid var(--glass-border)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {completion.newMemorization ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              {completion.newMemorization ? (ar ? 'تم الحفظ' : 'Memorized') : (ar ? 'تحديد كمكتمل' : 'Mark as done')}
            </button>
          </div>
        </div>

        {/* 4. الحصن الرابع: المراجعة القريبة */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.nearRevision ? 'rgba(55, 125, 113, 0.08)' : 'var(--bg-surface)',
          border: completion.nearRevision ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(227, 154, 45, 0.2) 0%, rgba(194, 127, 23, 0.1) 100%)',
              color: '#C27F17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <RefreshCw size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {ar ? <>4. الحصن الرابع: المراجعة القريبة (آخر 20 صفحة)</> : <>4. Fourth fortress: near review (last 20 pages)</>}
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(194, 127, 23, 0.12)', color: '#C27F17', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {ar ? <>ص {Math.max(1, selectedPage - 20)} إلى {Math.max(1, selectedPage - 1)}</> : <>p. {Math.max(1, selectedPage - 20)} to {Math.max(1, selectedPage - 1)}</>}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ar ? <>تسميع الصفحات من {Math.max(1, selectedPage - 20)} إلى {Math.max(1, selectedPage - 1)} غيباً كل يوم لتثبيت المحفوظ في الذاكرة المتوسطة ومنع تفلته.</> : <>Recite pages {Math.max(1, selectedPage - 20)} to {Math.max(1, selectedPage - 1)} by heart every day to fix them in medium-term memory.</>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('nearRevision')}
            data-testid="simplified-fortress-complete-nearRevision"
            disabled={!hasLoaded || syncStatus === 'saving'}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: completion.nearRevision ? 'var(--primary)' : 'var(--bg-color)',
              color: completion.nearRevision ? 'white' : 'var(--text-secondary)',
              border: completion.nearRevision ? 'none' : '1px solid var(--glass-border)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {completion.nearRevision ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {completion.nearRevision ? (ar ? 'تمت المراجعة القريبة' : 'Near review done') : (ar ? 'تحديد كمكتمل' : 'Mark as done')}
          </button>
        </div>

        {/* 5. الحصن الخامس: المراجعة البعيدة والصلوات */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.farRevision ? 'rgba(55, 125, 113, 0.08)' : 'var(--bg-surface)',
          border: completion.farRevision ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'var(--primary-light)',
              color: 'var(--primary, #377D71)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {ar ? <>5. الحصن الخامس: المراجعة البعيدة والصلاة بالمحفوظ</> : <>5. Fifth fortress: far review and praying with what you memorized</>}
                </h3>
                <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary, #377D71)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {selectedJuz > 1 ? (ar ? `الأجزاء 1 إلى ${selectedJuz - 1}` : `Juz 1 to ${selectedJuz - 1}`) : (ar ? 'ينشط بعد الجزء 1' : 'Starts after juz 1')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedJuz > 1 
                  ? (ar ? `تدوير مراجعة الأجزاء القديمة (من الجزء 1 إلى الجزء ${selectedJuz - 1}) بمعدل جزء أسبوعياً، والقراءة بها في صلاة النوافل وقيام الليل.` : `Rotate review of older juz (1 to ${selectedJuz - 1}) at one juz per week, and recite them in voluntary and night prayers.`)
                  : (ar ? `عند إتمامك حفظ الجزء الأول، سيبدأ نظام تدوير المحفوظ القديم والصلاة به يومياً.` : `Once you finish juz 1, rotating review and praying with it will start.`)
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('farRevision')}
            data-testid="simplified-fortress-complete-farRevision"
            disabled={!hasLoaded || syncStatus === 'saving'}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: completion.farRevision ? 'var(--primary)' : 'var(--bg-color)',
              color: completion.farRevision ? 'white' : 'var(--text-secondary)',
              border: completion.farRevision ? 'none' : '1px solid var(--glass-border)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {completion.farRevision ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {completion.farRevision ? (ar ? 'تمت المراجعة البعيدة' : 'Far review done') : (ar ? 'تحديد كمكتمل' : 'Mark as done')}
          </button>
        </div>

      </div>

      {/* 💡 Quick Help & AI Tutor Banner */}
      <div style={{
        padding: '18px 22px',
        borderRadius: '18px',
        background: 'var(--primary-light)',
        border: '1px solid var(--primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} color="var(--primary)" />
          <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '600' }}>
            {ar ? <>هل تواجه صعوبة في تثبيت ورد اليوم أو ضبط المتشابهات في الجزء {selectedJuz}؟</> : <>Struggling to fix today's portion or similar verses in juz {selectedJuz}?</>}
          </span>
        </div>

        {onAskAi && (
          <button
            type="button"
            onClick={() => onAskAi(`أريد خطة تثبيت ونصائح لضبط المتشابهات في الجزء ${selectedJuz} من سورة ${currentSurah}`)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {ar ? <>استشر المعلم الذكي 🤖</> : <>Ask the AI tutor 🤖</>}
          </button>
        )}
      </div>

    </div>
  );
};

export default SimplifiedFortressPlan;
