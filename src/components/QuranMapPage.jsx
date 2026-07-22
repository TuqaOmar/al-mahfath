import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';

// Generate mock status for 604 pages
const generateQuranPages = () => {
  const pages = [];
  for (let i = 1; i <= 604; i++) {
    let status = 'unmemorized'; // 'excellent' | 'review' | 'critical' | 'unmemorized'
    let score = 0;

    if (i <= 50) {
      status = 'excellent';
      score = Math.floor(Math.random() * 15) + 85; // 85-100%
    } else if (i <= 80) {
      status = 'review';
      score = Math.floor(Math.random() * 20) + 60; // 60-79%
    } else if (i === 82 || i === 85 || i === 89) {
      status = 'critical';
      score = Math.floor(Math.random() * 20) + 35; // 35-55%
    }

    pages.push({
      pageNumber: i,
      juz: getJuzForPage(i),
      status,
      score,
      lastReviewed: status !== 'unmemorized' ? 'منذ يومين' : 'لم يراجع بعد',
      errorsCount: status === 'critical' ? 4 : (status === 'review' ? 2 : 0),
      surahName: getSurahNameForPage(i)
    });
  }
  return pages;
};

const allPages = generateQuranPages();

export const QuranMapPage = () => {
  const [pages, setPages] = React.useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'excellent' | 'review' | 'critical'
  const [juzFilter, setJuzFilter] = useState('all');

  React.useEffect(() => {
    fetch('/api/quran/pages')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pages) {
          const defaultPages = generateQuranPages();
          const merged = defaultPages.map(dp => {
            const serverPage = data.pages.find(sp => sp.pageNumber === dp.pageNumber);
            return serverPage ? { ...dp, ...serverPage } : dp;
          });
          setPages(merged);
        } else {
          setPages(generateQuranPages());
        }
      })
      .catch(() => setPages(generateQuranPages()));
  }, []);

  // Filtered pages
  const filteredPages = pages.filter(p => {
    const matchesSearch = searchQuery === '' || p.pageNumber.toString().includes(searchQuery) || p.surahName.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesJuz = juzFilter === 'all' || p.juz.toString() === juzFilter;
    return matchesSearch && matchesStatus && matchesJuz;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#10B981'; // Green
      case 'review': return '#F59E0B'; // Yellow
      case 'critical': return '#EF4444'; // Red
      default: return '#334155'; // Dark Gray
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
      
      {/* Main Grid View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header & Controls */}
        <div style={{ 
          padding: '24px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', margin: 0 }}>📖 خريطة القرآن الكريم التفاعلية (604 صفحة)</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>
              متابعة بصرية شاملة لاستقرار الذاكرة وحالة كل صفحة من المصحف الشريف.
            </p>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', minWidth: '220px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="ابحث برقم الصفحة أو السورة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', width: '100%' }}
              />
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'الكل (604)' },
                { id: 'excellent', label: '🟢 ممتاز', color: '#10B981' },
                { id: 'review', label: '🟡 يحتاج مراجعة', color: '#F59E0B' },
                { id: 'critical', label: '🔴 حرج / ضعيف', color: '#EF4444' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${statusFilter === f.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: statusFilter === f.id ? 'var(--primary-light)' : 'var(--bg-color)',
                    color: statusFilter === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Juz Selector */}
            <select
              value={juzFilter}
              onChange={(e) => setJuzFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '13px'
              }}
            >
              <option value="all">كل الأجزاء (30 جزء)</option>
              {Array.from({ length: 30 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString()}>الجزء {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 604 Grid Box Container */}
        <div style={{ 
          padding: '24px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
            gap: '8px'
          }}>
            {filteredPages.map(page => {
              const bg = getStatusColor(page.status);
              const isSelected = selectedPage?.pageNumber === page.pageNumber;

              return (
                <button
                  key={page.pageNumber}
                  onClick={() => setSelectedPage(page)}
                  title={`صفحة ${page.pageNumber} - سورة ${page.surahName} (${page.score}%)`}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #FFFFFF' : 'none',
                    backgroundColor: bg,
                    color: page.status === 'unmemorized' ? '#94A3B8' : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {page.pageNumber}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Side Detail Panel (Appears when a page is selected) */}
      {selectedPage && (
        <div style={{
          width: '320px',
          padding: '24px',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-soft)',
          position: 'sticky',
          top: '100px',
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>
              تفاصيل الصفحة {selectedPage.pageNumber}
            </h3>
            <button 
              onClick={() => setSelectedPage(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>السورة والجزء</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', color: 'var(--text-primary)' }}>
              سورة {selectedPage.surahName} (الجزء {selectedPage.juz})
            </h4>
          </div>

          {/* Memory Score Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>استقرار الذاكرة (Memory Score):</span>
              <span style={{ fontWeight: 'bold', color: getStatusColor(selectedPage.status) }}>
                {selectedPage.score}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${selectedPage.score}%`, height: '100%', background: getStatusColor(selectedPage.status), borderRadius: '4px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', textAlign: 'center' }}>
              <Clock size={18} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>آخر مراجعة</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedPage.lastReviewed}</strong>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', textAlign: 'center' }}>
              <AlertTriangle size={18} color={selectedPage.errorsCount > 0 ? '#EF4444' : 'var(--primary)'} style={{ margin: '0 auto 4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>سجل الأخطاء</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedPage.errorsCount} أخطاء</strong>
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="var(--primary)" />
              <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>توصية الذكاء الاصطناعي:</strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {selectedPage.status === 'critical' 
                ? 'ينصح بمراجعة هذه الصفحة اليوم في حصن الغد والتكرار 5 مرات صوتاً.' 
                : 'حالة الحفظ ممتازة. جدول المراجعة القادم بعد 5 أيام.'}
            </p>
          </div>

          {/* Dynamic Surah Mind Map Flowchart */}
          {(() => {
            const getSurahMindMap = (surahName) => {
              if (surahName === 'الفاتحة') {
                return {
                  axis: 'محور السورة: تحقيق العبودية لله والاستعانة به وهداية الصراط.',
                  nodes: [
                    { label: 'القسم الأول', desc: 'حمد الله والثناء عليه وتمجيده (1-4)' },
                    { label: 'القسم الثاني', desc: 'إفراد الله بالعبادة والاستعانة (5)' },
                    { label: 'القسم الثالث', desc: 'الدعاء بالهداية للصراط المستقيم (6-7)' }
                  ]
                };
              }
              if (surahName === 'البقرة') {
                return {
                  axis: 'محور السورة: تهيئة الأمة للاستخلاف في الأرض وإقامة دين الله.',
                  nodes: [
                    { label: 'المقدمة وأصناف الناس', desc: 'صفات المؤمنين، الكافرين، والمنافقين (1-20)' },
                    { label: 'قصة الاستخلاف وآدم', desc: 'بدء الخلق وعمارة الأرض وقصة السجود لآدم (30-39)' },
                    { label: 'قصة البقرة وميثاق بني إسرائيل', desc: 'نقض العهد والتلكؤ في تلبية الأوامر (40-123)' },
                    { label: 'أحكام التشريع والعبادات', desc: 'أحكام الصيام، النكاح، القصاص، الحج، والإنفاق (163-284)' },
                    { label: 'آية الكرسي وخاتمة الدعاء', desc: 'أعظم آية بالقرآن والالتجاء التام لله (255, 285-286)' }
                  ]
                };
              }
              return {
                axis: `محور السورة: مقاصد سورة ${surahName} وتثبيت العقيدة والعمل الصالح.`,
                nodes: [
                  { label: 'القسم الأول', desc: 'مقدمة السورة وبيان إعجاز القرآن ومحور الهداية.' },
                  { label: 'القسم الثاني', desc: 'القصص والآيات الدالة على عظمة الخالق وتشريعه.' },
                  { label: 'القسم الثالث', desc: 'خاتمة السورة والتوجيهات الإيمانية العامة للحفاظ.' }
                ]
              };
            };

            const map = getSurahMindMap(selectedPage.surahName);
            return (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} color="#3B82F6" />
                  <strong style={{ fontSize: '14px', color: '#2563EB' }}>الخريطة الذهنية للمحاور 🗺️:</strong>
                </div>
                
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {map.axis}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {map.nodes.map((node, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', marginTop: '5px' }} />
                        {idx < map.nodes.length - 1 && (
                          <div style={{ width: '2px', height: '28px', background: 'rgba(59, 130, 246, 0.2)' }} />
                        )}
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563EB', display: 'block' }}>{node.label}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{node.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};
