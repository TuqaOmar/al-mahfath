import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Brain, 
  Compass, 
  Mic, 
  Layers, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Laptop, 
  FileText, 
  Volume2, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Key,
  Shield,
  Zap,
  Globe,
  Database,
  Printer
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DocumentationModal = ({ isOpen, onClose }) => {
  const { lang, isRTL } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    {
      id: 'overview',
      title: isRTL ? '١. نظرة عامة ورسالة المنصة' : '1. Overview & Vision',
      icon: Sparkles,
      badge: isRTL ? 'الرؤية والهدف' : 'Vision'
    },
    {
      id: 'five-fortresses',
      title: isRTL ? '٢. منهجية الحصون الخمسة' : '2. Five Fortresses System',
      icon: ShieldCheck,
      badge: isRTL ? 'المنهجية العلمية' : 'Methodology'
    },
    {
      id: 'ai-engine',
      title: isRTL ? '٣. محرك الذكاء الاصطناعي و Gemini' : '3. AI Engine & Gemini',
      icon: Brain,
      badge: isRTL ? 'الذكاء القرآني' : 'AI Tech'
    },
    {
      id: 'learning-styles',
      title: isRTL ? '٤. تشخيص نمط الحفظ الدماغي' : '4. Learning Styles Profiler',
      icon: Layers,
      badge: isRTL ? 'تخصيص الدماغ' : 'Brain Profile'
    },
    {
      id: 'quran-map',
      title: isRTL ? '٥. خريطة المصحف والمحفظة (604 ص)' : '5. Quran Map & Portfolio',
      icon: Compass,
      badge: isRTL ? 'المتابعة البصرية' : 'Map System'
    },
    {
      id: 'recitation-audio',
      title: isRTL ? '٦. التسميع الصوتي والقراء' : '6. Recitation & Reciters',
      icon: Mic,
      badge: isRTL ? 'الصوت والتسميع' : 'Audio Engine'
    },
    {
      id: 'architecture',
      title: isRTL ? '٧. المعمارية البرمجية والتقنيات' : '7. Architecture & Stack',
      icon: Code2,
      badge: isRTL ? 'البنية التقنية' : 'Architecture'
    },
    {
      id: 'api-reference',
      title: isRTL ? '٨. مرجع واجهات البرمجة (REST API)' : '8. REST API Reference',
      icon: Terminal,
      badge: isRTL ? 'المسارات والطلبات' : 'API Docs'
    },
    {
      id: 'responsive-design',
      title: isRTL ? '٩. التجاوب وتوافق الأجهزة' : '9. Responsive Design',
      icon: Laptop,
      badge: isRTL ? 'اللابتوب والموبايل' : 'Multi-Device'
    }
  ];

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '1180px',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Modal Top Header Bar */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isRTL ? 'دليل وتوثيق منصة محفظ AI' : 'Ma7fath AI Documentation & Guide'}
                </h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid var(--primary-border)'
                }}>
                  v2.5 Full Doc
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isRTL ? 'المرجع التقني والمنهجي الشامل للمستخدمين والمطورين' : 'Comprehensive technical & operational manual'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              title={isRTL ? 'طباعة التوثيق' : 'Print Documentation'}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              <Printer size={15} />
              <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>
                {isRTL ? 'طباعة' : 'Print'}
              </span>
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isRTL ? 'إغلاق النافذة' : 'Close'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns on Desktop / Stacked on Mobile) */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row'
        }}>
          
          {/* Sidebar Nav with Search */}
          <div style={{
            width: window.innerWidth < 768 ? '100%' : '290px',
            borderLeft: isRTL ? '1px solid var(--glass-border)' : 'none',
            borderRight: isRTL ? 'none' : '1px solid var(--glass-border)',
            background: 'var(--bg-color)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            {/* Search Box */}
            <div style={{ padding: '14px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)'
              }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={isRTL ? 'ابحث في موضوعات التوثيق...' : 'Search documentation...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Nav Topics List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {filteredSections.map(sec => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: isRTL ? 'right' : 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                      <span>{sec.title}</span>
                    </div>
                    {isActive && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Pane */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px',
            lineHeight: 1.8,
            color: 'var(--text-primary)'
          }}>
            
            {/* SECTION 1: OVERVIEW */}
            {activeSection === 'overview' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '12px' }}>
                    📖 الرؤية والأهداف
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  مقدمة ورسالة منصة محفظ AI
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  <strong>محفظ AI</strong> هي منظومة رقمية تعليمية إيمانية متكاملة، صُممت خصيصاً لمرافقة حافظ القرآن الكريم في رحلته الإيمانية من البداية وحتى الختم والرسوخ التام. تجمع المنصة بين <strong>أصالة المنهجية التراثية المتقنة (منهجية الحصون الخمسة للدكتور سعيد أبو العلا حمزة)</strong>، وأحدث تقنيات العصر ممثلة في <strong>الذكاء الاصطناعي التوليدي التفاعلي (Google Gemini)</strong> والتعرف الصوتي المباشر.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0' }}>
                  <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Zap size={18} color="var(--primary)" />
                      <h4 style={{ margin: 0, fontSize: '15px' }}>حل مشكلة تفلت الحفظ</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      ينسى 80% من الحفاظ آياتهم بسبب غياب منهجية المراجعة المستمرة. يعالج التطبيق ذلك بحساب أوراد المراجعة القريبة والبعيدة آلياً كل يوم.
                    </p>
                  </div>

                  <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Brain size={18} color="var(--primary)" />
                      <h4 style={{ margin: 0, fontSize: '15px' }}>مواءمة النمط الدماغي</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      تشخيص ذكي يحدد ما إذا كان عقلك يثبت الحفظ عبر الصوت (الذاكرة السمعية) أو عبر موضع الآيات (الذاكرة البصرية)، وتكييف الأدوات وفقاً لذلك.
                    </p>
                  </div>

                  <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Compass size={18} color="var(--primary)" />
                      <h4 style={{ margin: 0, fontSize: '15px' }}>مرآة المحفظة الحقيقية</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      خريطة المصحف الكاملة (604 صفحة) مربوطة بمحفظة الحافظ الفعلية بدقة، مع أزرار التحكم الجماعي بالأجزاء الـ 30.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: FIVE FORTRESSES */}
            {activeSection === 'five-fortresses' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                    🏰 التأصيل العلمي
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  دليل منهجية الحصون الخمسة (د. سعيد حمزة)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  منهجية الحصون الخمسة هي منظومة علمية محكمة تهدف إلى حفظ القرآن الكريم حفظاً راسخاً لا يتفلت أبداً، عبر تقسيم اليوم إلى 5 محطات متكاملة:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#3B82F6' }}>
                      1️⃣ الحصن الأول: قراءة الاستماع والورد نظراً (الختمة المستمرة)
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      <strong>المطلوب:</strong> قراءة جزء كامل يومياً من المصحف نظراً بالحدر السريع المتقن في 20 دقيقة.<br />
                      <strong>الهدف:</strong> تغذية الذاكرة البصرية، ختم القرآن شهرياً، ورسم مواضع الآيات وأرقام الصفحات في الصدر دون انقطاع.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#8B5CF6' }}>
                      2️⃣ الحصن الثاني: التحضير الثلاثي (الأسبوعي، الليلي، القريب)
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      • <strong>التحضير الأسبوعي:</strong> سماع سورة الأسبوع 3 مرات وتدبر مقاصدها.<br />
                      • <strong>التحضير الليلي:</strong> تلاوة صفحة الغد 5-10 مرات قبل النوم مباشرة لتستقر في العقل الباطن.<br />
                      • <strong>التحضير القريب:</strong> تلاوة الوجه 15 مرة قبل جلسة الحفظ بـ 15 دقيقة، وهو ما يختصر 70% من وقت الحفظ.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#10B981' }}>
                      3️⃣ الحصن الثالث: الحفظ الجديد المتقن (قاعدة 20x و 40x)
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      <strong>طريقة الإتقان:</strong> تكرار كل آية 20 مرة غيباً، وربط كل آيتين 20 مرة، ثم سرد الصفحة كاملة غيباً 40 مرة متفرقة على مدار اليوم حتى تكون كالفاتحة.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(236, 72, 153, 0.3)', background: 'rgba(236, 72, 153, 0.05)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#EC4899' }}>
                      4️⃣ الحصن الرابع: المراجعة القريبة اليومية (آخر 20 صفحة)
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      <strong>المطلوب:</strong> مراجعة غيباً وسرداً بالحدر لآخر 20 صفحة تم حفظها في 20 دقيقة يومياً. هذه المراجعة تحمي الحفظ الحديث الطري من الاندثار.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#F59E0B' }}>
                      5️⃣ الحصن الخامس: المراجعة البعيدة والصلاة بالمحفوظ
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      مراجعة قديم المحفوظ وتلاوة ما حفظته في السنن والوتر وقيام الليل. قال السلف: <em>"من قرأ القرآن في صلاته ثَبَت، ومن قرأه في غير صلاته كَثُر ثوابه وتفلت حفظه"</em>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: AI ENGINE */}
            {activeSection === 'ai-engine' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '12px' }}>
                    🤖 المحرك الذكي
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  بنية الذكاء الاصطناعي ونماذج Gemini والمحرك الداخلي
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  تعتمد المنصة على نظام هجين ذكي مزدوج (Hybrid Intelligence Engine) يضمن استمرارية العمل التام بجودة فائقة في كافة الظروف:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--primary)' }}>
                      1. الربط المباشر مع نماذج Google Gemini الرسمية
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      يدعم التطبيق رسمياً نموذج <code>gemini-2.5-flash</code> و <code>gemini-2.0-flash</code>. تتيح المنصة للمستخدم خيار إدخال مفتاح Gemini API مجاني خاص به يتم حفظه بأمان تام في متصفحه (LocalStorage) للحصول على إجابات مباشرة غير محدودة.
                    </p>
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <code>https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent</code>
                      <button onClick={() => copyToClipboard('gemini-2.5-flash', 'gemini-model')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)' }}>
                        {copiedCode === 'gemini-model' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '18px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--primary)' }}>
                      2. محرك المعرفة القرآنية الداخلي (Offline Dynamic Engine)
                    </h4>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      في حال عدم وجود اتصال أو غياب مفتاح API، يقوم ملف <code>src/utils/quranAiEngine.js</code> بتوليد إجابات ديناميكية متخصصة تغطي سور القرآن الكريم، المتشابهات اللفظية، وأحكام التجويد، مع تخصيص النصائح تلقائياً لنمط الحفظ الدماغي للمستخدم (سمعي أم بصري).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: LEARNING STYLES */}
            {activeSection === 'learning-styles' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                    🧠 علم النفس المعرفي
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  تشخيص وتخصيص نمط الحفظ الدماغي
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  يختلف دماغ كل حافظ عن الآخر في آلية تخزين واسترجاع الآيات؛ لذا صممت المنصة اختباراً تشخيصياً من 4 أسئلة ذكية يحلل طريقة عمل الدماغ ويقدم توجيهات مخصصة:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Volume2 size={18} color="#3B82F6" />
                      <strong style={{ color: '#3B82F6' }}>النمط السمعي (Auditory)</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      يثبت الآيات بنغمة القارئ وصوته. ننصحه بتكرار الاستماع لتلاوة الشيخ ياسر الدوسري أو الشيخ الحصري بالحدر 5 مرات والتسميع بصوت مسموع.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Compass size={18} color="#10B981" />
                      <strong style={{ color: '#10B981' }}>النمط البصري (Visual)</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      يتذكر موقع الآية في أعلى الصفحة أو أسفلها. ننصحه بالاعتماد على مصحف واحد لا يغيره أبداً، وتلوين المتشابهات في الهامش.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Zap size={18} color="#F59E0B" />
                      <strong style={{ color: '#F59E0B' }}>النمط الحركي والكتابي</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      يثبت الحفظ بالحركة والكتابة والمسبحة. ننصحه باستخدام استوديو التكرار الرقمي وكتابة الآيات على لوح أو دفتر خاص.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <BookOpen size={18} color="#EC4899" />
                      <strong style={{ color: '#EC4899' }}>النمط التحليلي والتدبري</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      يحفظ عبر ربط المعاني وأسباب النزول. يقرأ التفسير الميسر أولاً لفهم السياق ثم ينتقل للحفظ السريع.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: QURAN MAP */}
            {activeSection === 'quran-map' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '12px' }}>
                    🗺️ الخريطة والمحفظة
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  خريطة القرآن التفاعلية (604 صفحة)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  خريطة بصرية تفاعلية تجسد صفحات المصحف الشريف الـ 604، مربوطة بدقة مع المحفوظ الفعلي للحافظ:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#10B981' }} />
                    <span style={{ fontSize: '14px' }}><strong>أخضر (حفظ ممتاز):</strong> درجات استقرار تفوق 85% مع إتقان الحدر والتسميع.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#F59E0B' }} />
                    <span style={{ fontSize: '14px' }}><strong>أصفر (يحتاج مراجعة):</strong> صفحات مضى على مراجعتها أكثر من 3 أيام وتحتاج تدعيماً بالحدر.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#EF4444' }} />
                    <span style={{ fontSize: '14px' }}><strong>أحمر (موضع حرج):</strong> صفحات بها أخطاء مرصودة في التسميع تتطلب إعادة تكرار.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#334155' }} />
                    <span style={{ fontSize: '14px' }}><strong>رمادي (غير محفوظ):</strong> صفحات لم يتم حفظها بعد في الصدر.</span>
                  </div>
                </div>

                <h4 style={{ margin: '20px 0 10px 0', fontSize: '16px' }}>ميزات التحكم الجماعي بالأجزاء:</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                  شريط تنقل للأجزاء الـ 30 مع أزرار الإجراءات الفورية: <strong>"تعليم الجزء كاملاً كمحفوظ 🟢"</strong> لتحديث محفظة الحافظ بـ 20 صفحة بنقرة واحدة، وزر <strong>"إلغاء تحديد الجزء ⚪"</strong> للتعديل المرن.
                </p>
              </div>
            )}

            {/* SECTION 6: RECITATION & QARIS */}
            {activeSection === 'recitation-audio' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236, 72, 153, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                    🎙️ التسميع والصوتيات
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  محرك التسميع الذكي ونخبة القراء المعتمدين
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  يوفر التطبيق تجربة صوتية فريدة تجمع بين التعرف اللحظي على صوت المستخدم عبر المايكروفون، والاستماع لكبار قراء العالم الإسلامي:
                </p>

                <h3 style={{ fontSize: '17px', color: 'var(--primary)', marginBottom: '10px' }}>
                  القارئ الشيخ د. ياسر الدوسري (إمام الحرم المكي)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '16px' }}>
                  تم ربط تلاوة الشيخ ياسر الدوسري عبر كافة أركان التطبيق (المصحف التفاعلي آية بآية، مشغل التلاوة العام، ورد الاستماع بالحدر، وتسميع الفاتحة التفاعلي).
                </p>

                <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    روابط الـ CDN المعتمدة لتلاوة الشيخ الدوسري:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                    <code>سورة كاملة: https://server11.mp3quran.net/yasser/001.mp3</code>
                    <code>آية بآية: https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/001001.mp3</code>
                  </div>
                </div>

                <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>قائمة القراء الإضافيين في المنصة:</h4>
                <ul style={{ margin: 0, paddingRight: '20px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                  <li>الشيخ مشاري راشد العفاسي</li>
                  <li>الشيخ محمود خليل الحصري (المصحف المعلم والمرتل)</li>
                  <li>الشيخ محمد صديق المنشاوي (المنشاوي المرتل)</li>
                  <li>الشيخ عبد الباسط عبد الصمد (المرتل)</li>
                  <li>الشيخ ماهر المعيقلي (إمام الحرم المكي)</li>
                  <li>الشيخ سعود الشريم (إمام الحرم المكي)</li>
                </ul>
              </div>
            )}

            {/* SECTION 7: ARCHITECTURE */}
            {activeSection === 'architecture' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '12px' }}>
                    🏗️ المعمارية والتقنيات
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  المعمارية البرمجية وحزمة التقنيات (Tech Stack)
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', margin: '20px 0' }}>
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
                      الواجهة الأمامية (Frontend)
                    </strong>
                    <ul style={{ margin: 0, paddingRight: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <li>React 19 & Vite 8</li>
                      <li>Framer Motion (انتقالات سلسة)</li>
                      <li>Lucide React (أيقونات عصرية)</li>
                      <li>CSS Variables (دعم الوضع الليلي والنهاري)</li>
                    </ul>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <strong style={{ fontSize: '15px', color: '#3B82F6', display: 'block', marginBottom: '6px' }}>
                      الخادم والـ Backend
                    </strong>
                    <ul style={{ margin: 0, paddingRight: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <li>Node.js & Express RESTful API</li>
                      <li>@google/genai SDK (Gemini AI)</li>
                      <li>CORS & JSON Body Parser</li>
                      <li>Security & Password Hashing (PBKDF2 / SHA-256)</li>
                    </ul>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <strong style={{ fontSize: '15px', color: '#F59E0B', display: 'block', marginBottom: '6px' }}>
                      قاعدة البيانات (Database)
                    </strong>
                    <ul style={{ margin: 0, paddingRight: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <li>SQLite3 (ملف <code>database.sqlite</code> خفيف وموثوق)</li>
                      <li>جداول: users, quran_pages, ai_chat_history, community_posts</li>
                      <li>LocalStorage للتخزين المؤقت دون اتصال</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: REST API */}
            {activeSection === 'api-reference' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '12px' }}>
                    🔌 مسارات الـ APIs
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  مرجع واجهات البرمجة (RESTful API Endpoints)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#10B981', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>POST</span>
                      <code style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>/api/auth/signup</code>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>إنشاء حساب مستخدم جديد مع تشفير كلمة المرور بـ Salt & Hash.</span>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#3B82F6', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>POST</span>
                      <code style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>/api/auth/login</code>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>تسجيل دخول المستخدم والتحقق من صحة البيانات.</span>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#10B981', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>POST</span>
                      <code style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>/api/ai/chat</code>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>إرسال رسالة للمعلم القرآني الذكي واستلام إجابة فورية وحفظها في التاريخ.</span>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#F59E0B', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>PUT</span>
                      <code style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>/api/user/:uid</code>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>تحديث تفضيلات الحافظ (الحصون، نمط الدماغ، الأهداف اليومية).</span>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#3B82F6', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>GET</span>
                      <code style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>/api/quran/pages</code>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>جلب مصفوفة صفحات المصحف وتفاصيل حالة التقييم وتاريخ المراجعة.</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 9: RESPONSIVE */}
            {activeSection === 'responsive-design' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                    💻 هندسة التجاوب
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px' }}>
                  دليل التجاوب ودعم حواسيب اللابتوب والشاشات المدمجة
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  تتميز المنصة بتكيف بصري فائق الذكاء مع شاشات اللابتوب (1366x768، 1280x800، 1536x864) والأجهزة الذكية:
                </p>

                <ul style={{ margin: 0, paddingRight: '20px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong>الطي التلقائي للقائمة الجانبية:</strong> يتم طي الـ Sidebar تلقائياً إلى الوضع المصغر (76px) على الشاشات تحت 1200px لتوفير 184px كاملة للمحتوى.</li>
                  <li><strong>شبكات التكفل الذاتي (Auto-fit minmax):</strong> تلتف بطاقات الإحصاءات والأوسمة تلقائياً لعمودين أو ثلاثة دون أن تتعرض أي بطاقة للانضغاط أو كسر النصوص.</li>
                  <li><strong>التمرير الداخلي للوحات التفاصيل:</strong> تم تزويد لوحة تفاصيل صفحة المصحف وشاشات الحصون بـ <code>maxHeight: calc(100vh - 100px)</code> و <code>overflowY: auto</code> لمنع اقتطاع أزرار الحفظ على شاشات اللابتوب ذات الارتفاع المنخفض (768p).</li>
                  <li><strong>تأمين العرض ضد التمدد:</strong> تطبيق <code>min-width: 0</code> و <code>overflow-x: hidden</code> على الحاويات الرئيسية يمنع أي خروج عن أبعاد الشاشة.</li>
                </ul>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentationModal;
