import React, { useState, useEffect } from 'react';
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
import { useNotifications } from '../context/NotificationContext';
import { 
  generateFiveFortressesPlan, 
  saveFortressPlanToFirestore, 
  getFortressPlanFromFirestore, 
  subscribeToFortressPlan 
} from '../lib/fortressService';
import { getSurahNameForPage, getJuzForPage, getPageRangeForJuz, getJuzStartPage } from '../utils/quranData';

export const SimplifiedFortressPlan = ({ onNavigateToQuran, onAskAi }) => {
  const { user, updateUserData } = useAuth();
  const { 
    reminderSettings, 
    updateReminderSettings, 
    testReminderNow 
  } = useNotifications();
  const userId = user?.uid || 'guest';

  // Current user's progress
  const userMemorizedCount = user?.memorizedPagesCount || 0;
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
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'saving' | 'saved'
  const [activeRepModal, setActiveRepModal] = useState(null); // 'ayah' | 'page' | null
  const [repCount, setRepCount] = useState(0);

  // Load user plan from Firestore on mount
  useEffect(() => {
    let unsubscribe = () => {};

    async function loadInitialPlan() {
      setSyncStatus('saving');
      const loaded = await getFortressPlanFromFirestore(userId, selectedJuz, selectedPage);
      if (loaded) {
        setPlan(loaded);
        if (loaded.lastJuzReached) setSelectedJuz(loaded.lastJuzReached);
        if (loaded.currentPage) setSelectedPage(loaded.currentPage);
        if (loaded.completionStatus) setCompletion(loaded.completionStatus);
      }
      setSyncStatus('synced');
    }

    loadInitialPlan();

    if (userId && userId !== 'guest') {
      unsubscribe = subscribeToFortressPlan(userId, (updatedPlan) => {
        if (updatedPlan) {
          setPlan(updatedPlan);
          if (updatedPlan.completionStatus) setCompletion(updatedPlan.completionStatus);
        }
      });
    }

    return () => unsubscribe();
  }, [userId]);

  // Recalculate and persist whenever selected Juz or Page changes
  const handleJuzChange = async (newJuz) => {
    const juzNum = Number(newJuz);
    setSelectedJuz(juzNum);
    const startPage = getJuzStartPage(juzNum);
    setSelectedPage(startPage);

    const newPlan = generateFiveFortressesPlan(juzNum, startPage, plan?.dailyTarget);
    newPlan.completionStatus = completion;
    setPlan(newPlan);

    // Save to Firestore
    setSyncStatus('saving');
    await saveFortressPlanToFirestore(userId, newPlan);
    setTimeout(() => setSyncStatus('saved'), 500);
    setTimeout(() => setSyncStatus('synced'), 2500);
  };

  // Toggle completion of a fortress
  const handleToggleCompletion = async (key) => {
    const updated = {
      ...completion,
      [key]: !completion[key]
    };
    setCompletion(updated);

    const updatedPlan = {
      ...plan,
      completionStatus: updated
    };
    setPlan(updatedPlan);

    // Persist to Firestore
    setSyncStatus('saving');
    await saveFortressPlanToFirestore(userId, updatedPlan);
    
    // Also sync to user preferences in context
    if (updateUserData) {
      updateUserData({
        preferences: {
          ...(user?.preferences || {}),
          fortressesToday: updated
        }
      });
    }

    setTimeout(() => setSyncStatus('saved'), 400);
    setTimeout(() => setSyncStatus('synced'), 2000);
  };

  // Completed count
  const completedCount = Object.values(completion).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  const currentSurah = getSurahNameForPage(selectedPage);
  const currentJuzRange = getPageRangeForJuz(selectedJuz);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 🌟 Header Card with Juz Selector & Sync Indicator */}
      <div style={{
        padding: '24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
        color: 'white',
        boxShadow: '0 12px 30px rgba(6, 78, 59, 0.25)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#6EE7B7" />
              </div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'white' }}>
                خطة مراجعة الحصون الخمسة 🏰
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#D1FAE5', lineHeight: 1.6 }}>
              منهجية علمية متكاملة لربط الحفظ والمراجعة بآخر جزء وصلت إليه، لتثبيت القرآن في صدرك كالفاتحة.
            </p>
          </div>

          {/* Firestore Sync Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.2)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <Cloud size={15} color="#34D399" />
            <span style={{ fontSize: '12px', color: '#E2E8F0', fontWeight: 'bold' }}>
              {syncStatus === 'saving' ? 'جاري الحفظ في Firestore...' : syncStatus === 'saved' ? 'تم الحفظ في Firestore ✓' : 'مربوط بسحابة Firestore'}
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
            <Compass size={22} color="#34D399" />
            <div>
              <span style={{ fontSize: '12px', color: '#A7F3D0', display: 'block' }}>آخر جزء وصلت إليه في الحفظ والمراجعة:</span>
              <strong style={{ fontSize: '16px', color: 'white' }}>
                الجزء {selectedJuz} (سورة {currentSurah} — الصفحات {currentJuzRange.startPage} إلى {currentJuzRange.endPage})
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#E2E8F0' }}>تغيير الجزء:</label>
            <select
              value={selectedJuz}
              onChange={(e) => handleJuzChange(e.target.value)}
              style={{
                background: '#047857',
                color: 'white',
                border: '1.5px solid #34D399',
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
                  الجزء {juzNum} ({getPageRangeForJuz(juzNum).startPage} - {getPageRangeForJuz(juzNum).endPage})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Metric Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#D1FAE5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} color="#FBBF24" />
              إنجاز الحصون لليوم: <strong>{completedCount} من أصل 5 حصون</strong>
            </span>
            <span style={{ color: '#6EE7B7', fontWeight: 'bold' }}>{progressPercent}% مكتمل</span>
          </div>

          <div style={{ width: '100%', height: '10px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #FBBF24 0%, #34D399 100%)',
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
                ⏰ التنبيه اليومي لمراجعة الحصون:
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: reminderSettings?.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                color: reminderSettings?.enabled ? '#10B981' : '#EF4444',
                fontWeight: 'bold'
              }}>
                {reminderSettings?.enabled ? `مفعل الساعة ${reminderSettings?.time}` : 'معطل'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              يتم إرسال إشعار تفاعلي وتنبيه صوتي يومي في الموعد المحدد لتثبيت المحفوظ دون انقطاع.
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
            {reminderSettings?.enabled ? 'إيقاف التنبيه' : 'تفعيل التنبيه 🔔'}
          </button>

          <button
            onClick={testReminderNow}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Volume2 size={14} />
            تجربة التنبيه الفوري 🚀
          </button>
        </div>
      </div>

      {/* 🏰 The 5 Fortress Simplified Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 1. الحصن الأول: الختمة والتلاوة */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.khatmah ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
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
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.1) 100%)',
              color: '#0284C7',
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
                  1. الحصن الأول: قراءة الختمة والاستماع بالحدر
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  الجزء {selectedJuz}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                قراءة الجزء {selectedJuz} (ص {currentJuzRange.startPage} - {currentJuzRange.endPage}) نظراً لتعهد المصحف كاملاً شهرياً، مع الاستماع للورد بالحدر.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('khatmah')}
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
            {completion.khatmah ? 'تم إنجاز القراءة' : 'تحديد كمكتمل'}
          </button>
        </div>

        {/* 2. الحصن الثاني: التحضير الثلاثي */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.preparation ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
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
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
              color: '#9333EA',
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
                  2. الحصن الثاني: التحضير الثلاثي (الليلي والقبلي)
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(147, 51, 234, 0.12)', color: '#9333EA', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  ص {selectedPage} و ص {Math.min(604, selectedPage + 1)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                🌙 <strong>التحضير الليلي:</strong> تلاوة صفحة الغد (ص {Math.min(604, selectedPage + 1)}) 15 مرة قبل النوم مباشرة.  
                <br />
                ☀️ <strong>التحضير القبلي:</strong> قراءة صفحة اليوم (ص {selectedPage}) 15 دقيقة قبل الحفظ مع فهم الكلمات الغريبة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('preparation')}
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
            {completion.preparation ? 'تم التحضير' : 'تحديد كمكتمل'}
          </button>
        </div>

        {/* 3. الحصن الثالث: الحفظ الجديد */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.newMemorization ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
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
                  3. الحصن الثالث: الحفظ الجديد وتكرار 20x و 40x
                </h3>
                <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  صفحة {selectedPage} ({currentSurah})
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                حفظ الصفحة {selectedPage} من سورة {currentSurah} مع تطبيق قاعدة التكرار: 20 مرة لكل آية غيباً، و40 مرة للصفحة كاملة متصلة.
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
                فتح الصفحة
              </button>
            )}

            <button
              type="button"
              onClick={() => handleToggleCompletion('newMemorization')}
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
              {completion.newMemorization ? 'تم الحفظ' : 'تحديد كمكتمل'}
            </button>
          </div>
        </div>

        {/* 4. الحصن الرابع: المراجعة القريبة */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.nearRevision ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
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
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              color: '#D97706',
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
                  4. الحصن الرابع: المراجعة القريبة (آخر 20 صفحة)
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(217, 119, 6, 0.12)', color: '#D97706', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  ص {Math.max(1, selectedPage - 20)} إلى {Math.max(1, selectedPage - 1)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                تسميع الصفحات من {Math.max(1, selectedPage - 20)} إلى {Math.max(1, selectedPage - 1)} غيباً كل يوم لتثبيت المحفوظ في الذاكرة المتوسطة ومنع تفلته.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('nearRevision')}
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
            {completion.nearRevision ? 'تمت المراجعة القريبة' : 'تحديد كمكتمل'}
          </button>
        </div>

        {/* 5. الحصن الخامس: المراجعة البعيدة والصلوات */}
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: completion.farRevision ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
              color: '#059669',
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
                  5. الحصن الخامس: المراجعة البعيدة والصلاة بالمحفوظ
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(5, 150, 105, 0.12)', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {selectedJuz > 1 ? `الأجزاء 1 إلى ${selectedJuz - 1}` : 'ينشط بعد الجزء 1'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedJuz > 1 
                  ? `تدوير مراجعة الأجزاء القديمة (من الجزء 1 إلى الجزء ${selectedJuz - 1}) بمعدل جزء أسبوعياً، والقراءة بها في صلاة النوافل وقيام الليل.`
                  : `عند إتمامك حفظ الجزء الأول، سيبدأ نظام تدوير المحفوظ القديم والصلاة به يومياً.`
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleCompletion('farRevision')}
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
            {completion.farRevision ? 'تمت المراجعة البعيدة' : 'تحديد كمكتمل'}
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
            هل تواجه صعوبة في تثبيت ورد اليوم أو ضبط المتشابهات في الجزء {selectedJuz}؟
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
            استشر المعلم الذكي 🤖
          </button>
        )}
      </div>

    </div>
  );
};

export default SimplifiedFortressPlan;
