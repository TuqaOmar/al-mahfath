import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LearningStyleProfiler } from './LearningStyleProfiler';
import { JuzMultiSelector } from './JuzMultiSelector';
import { declaredPages } from '../lib/memorization';
import { getPageRangeForJuz } from '../utils/quranData';
import { 
  Sparkles, 
  BookOpen, 
  Layers, 
  FileText, 
  Sliders, 
  CheckCircle, 
  BrainCircuit, 
  Shield, 
  RotateCcw,
  Calendar,
  Save
} from 'lucide-react';

export const MyPlanManager = () => {
  const { user, updateUserData } = useAuth();
  const { lang, isRTL } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const preferences = user?.preferences || {};

  const [unitType, setUnitType] = useState(preferences.unitType || 'juzs'); // 'pages' | 'juzs' | 'surahs'
  const [oldReviewDailyTarget, setOldReviewDailyTarget] = useState(preferences.oldReviewDailyTarget || 'نصف جزء يومياً (10 صفحات)');
  const [selectedSurahRange, setSelectedSurahRange] = useState(preferences.selectedSurahRange || 'سورة البقرة وآل عمران');
  
  // Array of selected individual Juz numbers (e.g. [1, 30])
  const [selectedJuzList, setSelectedJuzList] = useState(() => {
    if (Array.isArray(preferences.selectedJuzList)) return preferences.selectedJuzList;
    // No saved list: start from the juz the student has fully declared, never an invented default.
    const pages = new Set(declaredPages(user));
    return Array.from({ length: 30 }, (_, i) => i + 1).filter(juz => {
      const { startPage, endPage } = getPageRangeForJuz(juz);
      for (let page = startPage; page <= endPage; page++) if (!pages.has(page)) return false;
      return true;
    });
  });

  const juzLabel = list => list.length === 0 ? 'لا يوجد أجزاء مسبقة' : list.map(n => `الجزء ${n}`).join('، ');
  const [juzsMemorized, setJuzsMemorized] = useState(() => preferences.juzsMemorized || juzLabel(selectedJuzList));
  const [planCreatorMode, setPlanCreatorMode] = useState(preferences.planCreatorMode || 'ai'); // 'ai' | 'manual'
  const [dailyTarget, setDailyTarget] = useState(preferences.dailyTarget || 'صفحة واحدة يومياً');
  const [manualNewTarget, setManualNewTarget] = useState(preferences.manualNewTarget || '1');
  const [manualOldReviewTarget, setManualOldReviewTarget] = useState(preferences.manualOldReviewTarget || '10');

  const handleJuzChange = (newList) => {
    setSelectedJuzList(newList);
    setJuzsMemorized(juzLabel(newList));
  };

  // Apply only the juz that changed to the self-declared pages, so pages declared one by one
  // on the Quran map (in other juz) are kept. Same page source the wizard and the map use.
  const declaredPagesAfterJuzChange = () => {
    const juzPages = juz => {
      const { startPage, endPage } = getPageRangeForJuz(juz);
      return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };
    const previousJuz = Array.isArray(preferences.selectedJuzList) ? preferences.selectedJuzList : [];
    const added = selectedJuzList.filter(juz => !previousJuz.includes(juz));
    const removed = previousJuz.filter(juz => !selectedJuzList.includes(juz));
    const pages = new Set(declaredPages(user));
    removed.forEach(juz => juzPages(juz).forEach(page => pages.delete(page)));
    added.forEach(juz => juzPages(juz).forEach(page => pages.add(page)));
    const statuses = Object.fromEntries(Object.entries(preferences.studentDeclaredPageStatuses || {})
      .filter(([page]) => pages.has(Number(page))));
    return { studentDeclaredPages: [...pages].sort((a, b) => a - b), studentDeclaredPageStatuses: statuses };
  };

  const handleSavePlan = async () => {
    const tracksJuz = unitType === 'juzs' || unitType === 'pages';
    const updatedPreferences = {
      ...preferences,
      ...(tracksJuz ? declaredPagesAfterJuzChange() : {}),
      unitType,
      oldReviewDailyTarget,
      selectedSurahRange,
      selectedJuzList,
      juzsMemorized,
      planCreatorMode,
      dailyTarget,
      manualNewTarget,
      manualOldReviewTarget
    };

    setIsSaving(true);
    setSaveError('');
    setIsSaved(false);
    const result = await updateUserData({ preferences: updatedPreferences });
    setIsSaving(false);
    if (!result?.success) {
      setSaveError(lang === 'ar' ? 'تعذر حفظ الخطة؛ بقيت الخطة السابقة.' : 'Could not save the plan; the previous plan was kept.');
      return;
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Banner */}
      <div style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>
              {lang === 'ar' ? '📋 إعدادات خطة الحفظ والمراجعة' : '📋 Memorization & Review Plan Settings'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {lang === 'ar' ? 'خصّص وحدة القياس (صفحات / أجزاء / سور)، خطة المحفوظ القديم، وآلية الخطة (ذكاء اصطناعي أم يدوياً).' : 'Customize tracking units (pages/juzs/surahs), old review targets, and plan generation mode.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSavePlan}
          disabled={isSaving}
          data-testid="save-plan"
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
          {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
          {isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : isSaved
            ? (lang === 'ar' ? 'تم حفظ التعديلات!' : 'Saved!') 
            : (lang === 'ar' ? 'حفظ الخطة المعدلة' : 'Save Plan Changes')
          }
        </button>
      </div>
      {isSaved && <div role="status" data-testid="plan-save-success" style={{ color: '#047857', fontWeight: 700 }}>{lang === 'ar' ? 'تم حفظ الخطة في Firestore.' : 'Plan saved in Firestore.'}</div>}
      {saveError && <div role="alert" data-testid="plan-save-error" style={{ color: '#B91C1C', fontWeight: 700 }}>{saveError}</div>}

      {/* 1. Unit Type Selector */}
      <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BookOpen size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>
            {lang === 'ar' ? '1️⃣ وحدة القياس والتتبع المعتمدة:' : '1️⃣ Preferred Tracking Unit:'}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[
            { id: 'pages', titleAr: '📖 بالصفحات', titleEn: '📖 By Pages', descAr: 'تحديد وتتبع الورد بعدد صفحات المصحف.', descEn: 'Track target by Quran page count.' },
            { id: 'juzs', titleAr: '📚 بالأجزاء والأحزاب', titleEn: '📚 By Juzs & Hizbs', descAr: 'تتبع الورد بالأجزاء والأرباع.', descEn: 'Track target by Juzs and Hizb quarters.' },
            { id: 'surahs', titleAr: '📜 بالسور والآيات', titleEn: '📜 By Surahs & Verses', descAr: 'تتبع الحفظ بسور وآيات محددة.', descEn: 'Track target by specific Surahs & Verses.' }
          ].map((u) => (
            <div
              key={u.id}
              role="button"
              tabIndex={0}
              data-testid={`plan-unit-${u.id}`}
              aria-pressed={unitType === u.id}
              onClick={() => setUnitType(u.id)}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setUnitType(u.id); }}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: `2px solid ${unitType === u.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                background: unitType === u.id ? 'var(--primary-light)' : 'var(--bg-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: unitType === u.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                {lang === 'ar' ? u.titleAr : u.titleEn}
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {lang === 'ar' ? u.descAr : u.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Old Memorization Review Plan (خطة مراجعة المحفوظ القديم) */}
      <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <RotateCcw size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>
            {lang === 'ar' ? '2️⃣ خطة مراجعة المحفوظ القديم (الحصن الخامس):' : '2️⃣ Past Memorization Review Plan:'}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              {lang === 'ar' ? 'اختر الأجزاء المحفوظة السابقة (يمكنك اختيار أجزاء منفصلة وغير متتالية):' : 'Select Memorized Juzs (Choose non-contiguous individual Juzs):'}
            </label>
            {unitType === 'surahs' ? (
              <input
                type="text"
                value={selectedSurahRange}
                onChange={(e) => setSelectedSurahRange(e.target.value)}
                placeholder="مثل: سورة البقرة، آل عمران، جزء عم"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
              />
            ) : (
              <JuzMultiSelector
                selectedJuzs={selectedJuzList}
                onChange={handleJuzChange}
              />
            )}
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              {lang === 'ar' ? 'معدل المراجعة اليومي للمحفوظ القديم:' : 'Daily Old Review Target:'}
            </label>
            <select
              value={oldReviewDailyTarget}
              onChange={(e) => setOldReviewDailyTarget(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option>{lang === 'ar' ? 'ربع جزء يومياً (5 صفحات)' : 'Quarter Juz daily'}</option>
              <option>{lang === 'ar' ? 'نصف جزء يومياً (10 صفحات)' : 'Half Juz daily'}</option>
              <option>{lang === 'ar' ? 'جزء كامل يومياً (20 صفحة)' : '1 Full Juz daily'}</option>
              <option>{lang === 'ar' ? 'سورة كاملة يومياً' : '1 Full Surah daily'}</option>
              <option>{lang === 'ar' ? 'صفحتان يومياً (تثبيت هادئ)' : '2 pages daily'}</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3. AI vs Manual Plan Determination (تحديد الخطة) */}
      <div style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BrainCircuit size={20} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>
            {lang === 'ar' ? '3️⃣ طريقة تحديد وصياغة الخطة (AI أم يدوياً):' : '3️⃣ Plan Generation Mode:'}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div
            role="button"
            tabIndex={0}
            data-testid="plan-mode-ai"
            aria-pressed={planCreatorMode === 'ai'}
            onClick={() => setPlanCreatorMode('ai')}
            style={{
              padding: '18px',
              borderRadius: '14px',
              border: `2px solid ${planCreatorMode === 'ai' ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: planCreatorMode === 'ai' ? 'var(--primary-light)' : 'var(--bg-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: planCreatorMode === 'ai' ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
              🤖 {lang === 'ar' ? 'توليد خطة بالذكاء الاصطناعي' : 'AI Smart Auto Plan'}
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {lang === 'ar' ? 'يقوم AI بحساب وتوزيع أرباع الحصون الخمسة تلقائياً وتوقع تاريخ الختم.' : 'AI automatically scales 5 fortresses and computes target finish date.'}
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            data-testid="plan-mode-manual"
            aria-pressed={planCreatorMode === 'manual'}
            onClick={() => setPlanCreatorMode('manual')}
            style={{
              padding: '18px',
              borderRadius: '14px',
              border: `2px solid ${planCreatorMode === 'manual' ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: planCreatorMode === 'manual' ? 'var(--primary-light)' : 'var(--bg-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: planCreatorMode === 'manual' ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
              ✏️ {lang === 'ar' ? 'تخصيص وتحديد الخطة يدوياً' : 'Manual Custom Plan'}
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {lang === 'ar' ? 'تحديد المستهدفات اليومية للحفظ والمراجعة بنفسك بحرية كاملة.' : 'Set explicit custom numbers for daily new memorization & review.'}
            </p>
          </div>
        </div>

        {planCreatorMode === 'manual' ? (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px dashed var(--primary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {lang === 'ar' ? 'مستهدف الحفظ الجديد اليومي (يدوياً):' : 'Manual Daily New Target:'}
              </label>
              <input
                aria-label="مستهدف الحفظ الجديد اليومي"
                type="text"
                value={manualNewTarget}
                onChange={(e) => setManualNewTarget(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {lang === 'ar' ? 'مستهدف المراجعة القديمة اليومي (يدوياً):' : 'Manual Daily Old Review Target:'}
              </label>
              <input
                aria-label="مستهدف المراجعة القديمة اليومي"
                type="text"
                value={manualOldReviewTarget}
                onChange={(e) => setManualOldReviewTarget(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {lang === 'ar' ? 'معدل الحفظ اليومي التلقائي:' : 'AI Default New Target:'}
            </span>
            <select
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
            >
              <option>{lang === 'ar' ? 'نصف صفحة يومياً (10 دقائق)' : 'Half page daily'}</option>
              <option>{lang === 'ar' ? 'صفحة واحدة يومياً (20 دقيقة)' : '1 page daily'}</option>
              <option>{lang === 'ar' ? 'صفحتان يومياً (40 دقيقة)' : '2 pages daily'}</option>
              <option>{lang === 'ar' ? 'ربع حزب يومياً' : 'Quarter Hizb daily'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Learning Style Profiler */}
      <LearningStyleProfiler />

    </div>
  );
};
