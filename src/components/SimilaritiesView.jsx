import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Filter, 
  Sparkles, 
  Info, 
  Lightbulb, 
  BookMarked,
  Share2,
  Loader2,
  Bot
} from 'lucide-react';
import { Card } from './ui/Card';
import { MUTASHABIHAT_DATA, RULE_CATEGORIES, getSurahListInDataset, normalizeArabicText } from '../data/mutashabihatData';

export const SimilaritiesView = ({ onSelectPageForRecitation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSurah, setSelectedSurah] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('almahfath_mutashabihat_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customItems, setCustomItems] = useState(() => {
    try {
      const saved = localStorage.getItem('almahfath_mutashabihat_custom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showRulesGuide, setShowRulesGuide] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('almahfath_mutashabihat_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  }, [bookmarkedIds]);

  // Persist custom items
  useEffect(() => {
    try {
      localStorage.setItem('almahfath_mutashabihat_custom', JSON.stringify(customItems));
    } catch (e) {
      console.error('Failed to save custom items:', e);
    }
  }, [customItems]);

  const toggleBookmark = (id) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (item) => {
    const textToCopy = `${item.title}\n\n` +
      item.verses.map(v => `• ${v.surahName} [آية ${v.ayah}]: ﴿ ${v.text} ﴾`).join('\n') +
      `\n\n💡 القاعدة الذهبية: ${item.goldenRule}\n🧠 الرابط الذهني: ${item.mnemonic}\n📚 المرجع: ${item.source}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Combine curated database with any user or AI-generated items
  const allItems = useMemo(() => {
    return [...MUTASHABIHAT_DATA, ...customItems];
  }, [customItems]);

  const surahsList = useMemo(() => {
    const surahSet = new Set();
    allItems.forEach(item => {
      item.surahs?.forEach(s => surahSet.add(s));
    });
    return Array.from(surahSet);
  }, [allItems]);

  // Filter with full Arabic text normalization (hamzas, alef variations, tashkeel, prefixes)
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Bookmark filter
      if (showBookmarksOnly && !bookmarkedIds.includes(item.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Surah filter
      if (selectedSurah !== 'all' && !item.surahs?.includes(selectedSurah)) {
        return false;
      }

      // Search term with Arabic normalization
      if (searchTerm.trim() !== '') {
        const queryNorm = normalizeArabicText(searchTerm);
        const queryWithoutSurah = queryNorm.replace(/^سوره\s+/, '').replace(/^سورة\s+/, '').trim();

        const matchesTitle = normalizeArabicText(item.title).includes(queryNorm) || 
          (queryWithoutSurah && normalizeArabicText(item.title).includes(queryWithoutSurah));

        const matchesRule = normalizeArabicText(item.goldenRule).includes(queryNorm) ||
          (queryWithoutSurah && normalizeArabicText(item.goldenRule).includes(queryWithoutSurah));

        const matchesMnemonic = normalizeArabicText(item.mnemonic).includes(queryNorm);

        const matchesSurahs = item.surahs?.some(s => {
          const sNorm = normalizeArabicText(s);
          return sNorm.includes(queryNorm) || (queryWithoutSurah && sNorm.includes(queryWithoutSurah));
        });

        const matchesVerses = item.verses?.some(v => {
          const textNorm = normalizeArabicText(v.text);
          const surahNorm = normalizeArabicText(v.surahName);
          const wordNorm = normalizeArabicText(v.highlightWord);
          return textNorm.includes(queryNorm) || 
                 surahNorm.includes(queryNorm) || 
                 (queryWithoutSurah && surahNorm.includes(queryWithoutSurah)) ||
                 wordNorm.includes(queryNorm);
        });

        return Boolean(matchesTitle || matchesRule || matchesMnemonic || matchesSurahs || matchesVerses);
      }

      return true;
    });
  }, [allItems, searchTerm, selectedCategory, selectedSurah, showBookmarksOnly, bookmarkedIds]);

  // AI-powered similarity generator for any Surah or query
  const handleGenerateAiSimilarities = async (targetTopic) => {
    const topic = (targetTopic || searchTerm || selectedSurah || 'سورة الكهف').trim();
    setIsAiGenerating(true);
    setAiStatusMessage(`جارٍ استخراج وتوجيه متشابهات "${topic}" عبر الذكاء الاصطناعي القرآني...`);

    try {
      const prompt = `أنت عالم متخصص في توجيه المتشابهات اللفظية بالقرآن الكريم (على مذهب الإسكافي والكرماني وابن جماعة والسخاوي).
المطلوب: استخرج 1 إلى 2 من أهم المتشابهات اللفظية الدقيقة المتعلقة بـ: "${topic}".
أجب بصيغة JSON حصراً (مصفوفة كائنات JSON صالحة للتحليل) بدون أي مقدمات أو شروح خارج الـ JSON:
[
  {
    "title": "عنوان المقارنة اللفظية (مثال: لفظ كذا vs لفظ كذا)",
    "category": "context",
    "categoryLabel": "موافقة السياق والمجاورة",
    "surahs": ["اسم السورة 1", "اسم السورة 2"],
    "verses": [
      {
        "surahName": "اسم السورة 1",
        "surahNumber": 18,
        "ayah": 1,
        "page": 293,
        "highlightWord": "الكلمة المميزة",
        "secondaryHighlight": "موضع التفريق",
        "text": "نص الآية الشريفة الأولى بالتشكيل والرسم القرآني"
      },
      {
        "surahName": "اسم السورة 2",
        "surahNumber": 17,
        "ayah": 1,
        "page": 282,
        "highlightWord": "الكلمة المقابلة",
        "secondaryHighlight": "موضع التفريق",
        "text": "نص الآية الشريفة المقابلة بالتشكيل"
      }
    ],
    "goldenRule": "القاعدة الذهبية والعلة البلاغية والتفسيرية الميسرة",
    "mnemonic": "رابط ذهني سريع وبسيط للحافظ أثناء التسميع",
    "source": "اسم المرجع التراثي المعتمد (مثل البرهان للكرماني أو درة التنزيل للإسكافي)"
  }
]`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          userId: 'mutashabihat_ai'
        })
      });

      const data = await res.json();
      const reply = data?.reply || data?.message || '';

      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((p, idx) => ({
            ...p,
            id: `ai-gen-${Date.now()}-${idx}`,
            isAiGenerated: true
          }));
          setCustomItems(prev => [...formatted, ...prev]);
          setAiStatusMessage(`✅ تم استخراج ${formatted.length} موضع متشابه بنجاح وإضافتها للقائمة!`);
          setTimeout(() => setAiStatusMessage(''), 4000);
        }
      } else {
        setAiStatusMessage('تم استلام توجيه الذكاء الاصطناعي للمتشابهة.');
        setTimeout(() => setAiStatusMessage(''), 3000);
      }
    } catch (e) {
      console.error('AI Generation error:', e);
      setAiStatusMessage('تعذر إكمال التوليد التلقائي حالياً، حاول مجدداً.');
      setTimeout(() => setAiStatusMessage(''), 3500);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <Card style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px' }}>🔍</span>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                مرشد المتشابهات اللفظية وقواعد الضبط
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', lineHeight: 1.6, maxWidth: '720px' }}>
              قاعدة بيانات موثوقة ومحققة للمتشابهات اللفظية مستندة إلى أمهات كتب الضبط والتوجيه البلاغي لمساعدة الحَفَظَة على رسوخ الحفظ دون تلعثم.
            </p>
          </div>

          {/* Quick Guide Trigger Button */}
          <button
            onClick={() => setShowRulesGuide(!showRulesGuide)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '14px',
              background: showRulesGuide ? 'var(--primary)' : 'var(--primary-light)',
              color: showRulesGuide ? '#FFFFFF' : 'var(--primary)',
              border: '1px solid var(--primary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Info size={16} />
            <span>{showRulesGuide ? 'إخفاء مراجع وقواعد الضبط' : 'دليل القواعد والمراجع العلمية'}</span>
          </button>
        </div>

        {/* Expandable Rules Guide Banner */}
        {showRulesGuide && (
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'var(--bg-color)', 
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '15px' }}>
              <BookMarked size={18} />
              <span>المراجع العلمية المعتمدة في هذه البيانات:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>📘 درة التنزيل وغرة التأويل</strong>
                <span style={{ color: 'var(--text-secondary)' }}>للإمام الخطيب الإسكافي (ت 420هـ) - أساس التوجيه البلاغي</span>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>📘 البرهان في توجيه متشابه القرآن</strong>
                <span style={{ color: 'var(--text-secondary)' }}>للإمام برهان الدين الكرماني (ت 505هـ) - قواعد التكرار والانفراد</span>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>📘 الضبط بالتقعيد للمتشابه اللفظي</strong>
                <span style={{ color: 'var(--text-secondary)' }}>للشيخ د. فواز بن سعد الحنين - الروابط الذهنية والقواعد الحديثة</span>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>📘 هداية المرتاب وغاية الطلاب</strong>
                <span style={{ color: 'var(--text-secondary)' }}>للإمام علم الدين السخاوي (ت 643هـ) - منظومة ضبط الآيات</span>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Main Search Input */}
          <div style={{ 
            flex: 1, 
            minWidth: '260px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '12px 16px', 
            borderRadius: '14px', 
            background: 'var(--bg-color)', 
            border: '1px solid var(--glass-border)' 
          }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="ابحث بالآية، السورة، الكلمة المختلفة، أو القاعدة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                outline: 'none', 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-body)', 
                fontSize: '14px',
                width: '100%'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Bookmarks Toggle Button */}
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '14px',
              background: showBookmarksOnly ? '#F59E0B' : 'var(--bg-color)',
              color: showBookmarksOnly ? '#FFFFFF' : 'var(--text-primary)',
              border: showBookmarksOnly ? '1px solid #F59E0B' : '1px solid var(--glass-border)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {showBookmarksOnly ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            <span>محفوظاتي ({bookmarkedIds.length})</span>
          </button>
        </div>

        {/* Rule Categories Filter Chips */}
        <div style={{ marginTop: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            نوع القاعدة التوجيهية:
          </span>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
            {Object.values(RULE_CATEGORIES).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  border: selectedCategory === cat.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: selectedCategory === cat.id ? 'var(--primary)' : 'var(--bg-color)',
                  color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Surah Filter Chips */}
        <div style={{ marginTop: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            تصفية حسب السورة:
          </span>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSelectedSurah('all')}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: selectedSurah === 'all' ? 700 : 500,
                border: selectedSurah === 'all' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: selectedSurah === 'all' ? 'var(--primary-light)' : 'var(--bg-color)',
                color: selectedSurah === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              كافة السور
            </button>
            {surahsList.map(surahName => (
              <button
                key={surahName}
                onClick={() => setSelectedSurah(surahName)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: selectedSurah === surahName ? 700 : 500,
                  border: selectedSurah === surahName ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: selectedSurah === surahName ? 'var(--primary-light)' : 'var(--bg-color)',
                  color: selectedSurah === surahName ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                سورة {surahName}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* AI Status Notification */}
      {aiStatusMessage && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '12px',
          background: 'rgba(20, 184, 166, 0.12)',
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          <span>{aiStatusMessage}</span>
        </div>
      )}

      {/* Results Count & AI Generation Trigger Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            تم العثور على <strong style={{ color: 'var(--primary)' }}>{filteredItems.length}</strong> موضع متشابه
          </span>
          {(selectedCategory !== 'all' || selectedSurah !== 'all' || searchTerm || showBookmarksOnly) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSurah('all');
                setSearchTerm('');
                setShowBookmarksOnly(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>

        {/* AI Quick Generator Button */}
        <button
          onClick={() => handleGenerateAiSimilarities(searchTerm || (selectedSurah !== 'all' ? selectedSurah : 'سورة الكهف'))}
          disabled={isAiGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), #0D9488)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isAiGenerating ? 'not-allowed' : 'pointer',
            opacity: isAiGenerating ? 0.7 : 1,
            boxShadow: '0 2px 8px rgba(20, 184, 166, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          {isAiGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>جارٍ التوليد القرآني...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>
                {searchTerm 
                  ? `استخراج متشابهات لـ "${searchTerm.slice(0, 12)}..." بالذكاء الاصطناعي`
                  : (selectedSurah !== 'all' ? `استخراج المزيد لسورة ${selectedSurah}` : 'استخراج متشابهات إضافية بالذكاء الاصطناعي')}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Similarities List */}
      {filteredItems.length === 0 ? (
        <Card style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍃</div>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            لم يتم العثور على مواضع مطابقة في القاعدة المجهزة
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            {searchTerm 
              ? `يمكنك استخراج وتوجيه متشابهات "${searchTerm}" فوراً بالذكاء الاصطناعي القرآني مع القواعد الذهبية والتوثيق التراثي:`
              : 'جرّب تغيير كلمات البحث أو استعراض كافة السور المسجلة.'}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {searchTerm && (
              <button
                onClick={() => handleGenerateAiSimilarities(searchTerm)}
                disabled={isAiGenerating}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: isAiGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>استخراج متشابهات "{searchTerm}" بالذكاء الاصطناعي</span>
              </button>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedSurah('all');
                setShowBookmarksOnly(false);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              عرض كافة المتشابهات
            </button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredItems.map(item => {
            const isBookmarked = bookmarkedIds.includes(item.id);
            const isCopied = copiedId === item.id;

            return (
              <Card 
                key={item.id} 
                style={{ 
                  padding: '24px', 
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  border: isBookmarked ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--glass-border)',
                  boxShadow: isBookmarked ? '0 4px 20px rgba(245, 158, 11, 0.08)' : 'none'
                }}
              >
                {/* Item Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      {item.categoryLabel}
                    </span>
                    {item.isAiGenerated && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366F1',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Sparkles size={12} />
                        <span>مستخرج بالذكاء الاصطناعي</span>
                      </span>
                    )}
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {item.title}
                    </h3>
                  </div>

                  {/* Actions (Bookmark & Copy) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => copyToClipboard(item)}
                      title="نسخ الآيات مع القاعدة"
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        background: isCopied ? '#10B981' : 'var(--bg-color)',
                        color: isCopied ? '#FFFFFF' : 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>

                    <button
                      onClick={() => toggleBookmark(item.id)}
                      title={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ للمراجعة'}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: isBookmarked ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-color)',
                        color: isBookmarked ? '#D97706' : 'var(--text-secondary)',
                        border: isBookmarked ? '1px solid #F59E0B' : '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isBookmarked ? <BookmarkCheck size={16} color="#D97706" /> : <Bookmark size={16} />}
                      <span>{isBookmarked ? 'محفوظة' : 'حفظ'}</span>
                    </button>
                  </div>
                </div>

                {/* Verses Comparison Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {item.verses.map((v, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '18px',
                        borderRadius: '16px',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      {/* Verse Meta & Mushaf Navigator */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          padding: '3px 10px',
                          borderRadius: '8px'
                        }}>
                          {v.surahName} • آية {v.ayah}
                        </span>

                        {onSelectPageForRecitation && v.page && (
                          <button
                            onClick={() => onSelectPageForRecitation(v.page)}
                            title={`فتح صفحة ${v.page} في المصحف`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <BookOpen size={13} />
                            <span>صفحة {v.page}</span>
                            <ExternalLink size={11} />
                          </button>
                        )}
                      </div>

                      {/* Verse Text */}
                      <p style={{
                        margin: 0,
                        fontSize: '17px',
                        fontFamily: 'serif',
                        color: 'var(--text-primary)',
                        direction: 'rtl',
                        textAlign: 'right',
                        lineHeight: 1.8
                      }}>
                        ﴿ {v.text} ﴾
                      </p>

                      {/* Highlight Badge */}
                      <div style={{ 
                        padding: '6px 12px', 
                        borderRadius: '8px', 
                        background: 'rgba(59, 130, 246, 0.08)', 
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        fontSize: '12px',
                        color: '#2563EB',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>🎯 اللفظ المؤثر:</span>
                        <strong style={{ color: '#1D4ED8' }}>{v.highlightWord}</strong>
                        {v.secondaryHighlight && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginRight: '4px' }}>
                            ({v.secondaryHighlight})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Golden Rule Section */}
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRight: '4px solid #F59E0B',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lightbulb size={16} color="#B45309" />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#B45309' }}>
                      القاعدة الذهبية للتوجيه والتذكر:
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                    {item.goldenRule}
                  </p>
                </div>

                {/* Mnemonic Anchor & Source Footer */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '10px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--glass-border)',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <span>🧠</span>
                    <strong style={{ color: 'var(--text-primary)' }}>الرابط الذهني السريع:</strong>
                    <span>{item.mnemonic}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <span>📚</span>
                    <span>المرجع: {item.source}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SimilaritiesView;
