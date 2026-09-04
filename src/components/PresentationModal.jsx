import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Sparkles, 
  Shield, 
  BookOpen, 
  Compass, 
  Mic, 
  Trophy, 
  Users, 
  Brain, 
  Flame, 
  Layers, 
  HelpCircle,
  ExternalLink,
  Presentation
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PresentationModal = ({ isOpen, onClose }) => {
  const { lang, isRTL } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        if (isRTL) prevSlide(); else nextSlide();
      } else if (e.key === 'ArrowLeft') {
        if (isRTL) nextSlide(); else prevSlide();
      } else if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, isRTL, isFullscreen]);

  if (!isOpen) return null;

  const slides = [
    {
      id: 1,
      badge: isRTL ? 'الغلاف التعريفي للمشروع' : 'Project Cover & Vision',
      title: isRTL ? 'مَنَصّة الْمَحْفَظَة AI' : 'Al-Mahfath AI Platform',
      subtitle: isRTL 
        ? 'المنظومة الرقمية الرائدة لإتقان وتثبيت القرآن الكريم بمنهجية الحصون الخمسة والذكاء الاصطناعي'
        : 'The Premier Digital Ecosystem for Quran Memorization & Retention via the Five Fortresses and AI',
      icon: Sparkles,
      color: '#10B981',
      highlights: [
        { label: isRTL ? 'المنهجية العلمية' : 'Scientific Methodology', value: isRTL ? 'الحصون الخمسة للشيخ د. سعيد أبو العلا حمزة' : 'Five Fortresses Methodology' },
        { label: isRTL ? 'التقنية المعتمدة' : 'Core Technology', value: isRTL ? 'الذكاء الاصطناعي الصوتي والمصحف التفاعلي' : 'Voice AI & Interactive Mus-haf' },
        { label: isRTL ? 'الهدف الأسمى' : 'Core Objective', value: isRTL ? 'الانتقال من الحفظ المتفلت إلى الإتقان الراسخ مدى الحياة' : 'Lifelong Permanent Retention' }
      ],
      points: [
        isRTL ? 'دمج أصالة المنهجية التراثية الموثقة بأحدث أدوات العصر والذكاء الاصطناعي.' : 'Harmonizing authentic traditional methodology with cutting-edge AI tools.',
        isRTL ? 'توجيه آلي يومي للحافظ يحسب له أوراده الخمسة دون تشتت أو تخطيط يدوي.' : 'Automated daily guidance calculating the 5 fortresses dynamically without guesswork.',
        isRTL ? 'بيئة تفاعلية محفزة تجمع بين المصحف، التسميع الذكي، الخرائط الذهنية، ومجتمع الحفاظ.' : 'An integrated motivational space featuring Quran, AI recitation, mind maps, and community.'
      ],
      speakerNotes: isRTL 
        ? 'ابدأ العرض بالترحيب، وأكد أن "المحفظة AI" ليست مجرد تطبيق لقراءة القرآن، بل منظومة تعليمية تربوية متكاملة تعالج جوهر مشكلة نسيان المحفوظ عبر تأصيل المنهجية العلمية رقمياً.'
        : 'Welcome the audience. Emphasize that Al-Mahfath AI is not just a Quran reader, but a complete learning ecosystem solving Quran retention challenges.'
    },
    {
      id: 2,
      badge: isRTL ? 'المشكلة والواقع' : 'The Problem & Challenge',
      title: isRTL ? 'أزمة تفلّت القرآن وغياب المنهجية' : 'The Retention Crisis in Quran Memorization',
      subtitle: isRTL 
        ? 'لماذا يعاني أكثر من 90% من طلاب القرآن من نسيان ما حفظوه سريعاً؟'
        : 'Why do over 90% of students struggle with rapid forgetting after memorizing?',
      icon: HelpCircle,
      color: '#EF4444',
      highlights: [
        { label: isRTL ? 'نسبة التفلت' : 'Forgetting Rate', value: '90%' },
        { label: isRTL ? 'السبب الأكبر' : 'Root Cause', value: isRTL ? 'الحفظ بلا تكرار ومنهجية مراجعة تراكمية' : 'Memorizing without structured review' },
        { label: isRTL ? 'عقبة المتشابهات' : 'Similarities Hurdle', value: isRTL ? 'التردد والشك أثناء الصلاة والمحراب' : 'Hesitation during recitation' }
      ],
      points: [
        isRTL ? 'الحفظ السريع مع التفلت السريع: الطالب يحفظ الجديد ويهمل ما سبقه فيتفلت المحفوظ سريعاً.' : 'Rapid memorization leads to rapid forgetting when prior portions are neglected.',
        isRTL ? 'العشوائية وضياع بوصلة اليوم: الحافظ يستيقظ ولا يدري ماذا يراجع وكم صفحة تكفي لرسوخ الحفظ.' : 'Lack of daily structure leaves learners guessing what and how much to review.',
        isRTL ? 'الخوف من المتشابهات اللفظية: تشابه خواتم الآيات والقصص القرآنية يسبب عثرات محرجة.' : 'Fear of subtle verse variations (Mutashabihat) causes friction and loss of confidence.',
        isRTL ? 'ندرة المتابعة الفردية الدائمة: لا يتوفر لكل طالب شيخ متفرغ يصغي لتسميعه يومياً في كل الأوقات.' : 'Shortage of full-time tutors to listen and verify recitations at any time of day.'
      ],
      speakerNotes: isRTL 
        ? 'ركز هنا على نقطة الألم الكبرى لدى كل مسلم: الحسرة على ما تم حفظه ثم نسيانه، وأوضح أن المشكلة ليست في ذكاء الطالب، بل في غياب المنهجية المناسبة.'
        : 'Focus on the universal pain point: the heartbreak of forgetting memorized Quran. Emphasize it is a methodological flaw, not a lack of student ability.'
    },
    {
      id: 3,
      badge: isRTL ? 'الحل والمنهجية' : 'The Solution & Method',
      title: isRTL ? 'أتمتة منهجية "الحصون الخمسة"' : 'Digitizing the "Five Fortresses" Method',
      subtitle: isRTL 
        ? 'ابتكار فضيلة الشيخ د. سعيد أبو العلا حمزة محولاً إلى خوارزمية ذكية'
        : 'Dr. Saeed Abu Al-Ola Hamza’s acclaimed framework automated into an intelligent guide',
      icon: Shield,
      color: '#3B82F6',
      highlights: [
        { label: isRTL ? 'مؤسس المنهجية' : 'Method Founder', value: isRTL ? 'د. سعيد أبو العلا حمزة' : 'Dr. Saeed Abu Al-Ola' },
        { label: isRTL ? 'طبيعة الحصون' : 'Core Architecture', value: isRTL ? '٥ حصون دفاعية متكاملة' : '5 Interconnected Defense Fortresses' },
        { label: isRTL ? 'أثر التطبيق' : 'Impact', value: isRTL ? 'قراءة القرآن كالفاتحة دون تردد' : 'Reciting like Surah Al-Fatihah effortlessly' }
      ],
      points: [
        isRTL ? 'التحول من الجداول الورقية المعقدة إلى تطبيق ذكي يحسب الأوراد تلقائياً بنقرة واحدة.' : 'Transforming complex paper schedules into an intuitive, one-click daily roadmap.',
        isRTL ? 'نظام دفاعي خماسي يحيط بصفحة الحفظ من كل جانب: قبل الحفظ، وأثناءه، وبعده، وعلى المدى البعيد.' : 'A 5-layer defense perimeter surrounding every page: before, during, after, and long-term.',
        isRTL ? 'مواءمة مستمرة مع مستوى كل طالب وفق عدد الصفحات المحفوظة ومعدل تقدمه الشخصي.' : 'Dynamic adaptation tailored to each learner’s memorized count and daily pace.'
      ],
      speakerNotes: isRTL 
        ? 'بين كيف وفرت المنصة على الطالب عناء الحساب الذهني للماضي القريب والبعيد؛ فالمنصة أصبحت هي المعلم والموجه الذي يرشده لما يجب فعله كل يوم.'
        : 'Explain how the platform eliminates mental scheduling burden by computing daily assignments automatically.'
    },
    {
      id: 4,
      badge: isRTL ? 'الأركان الخمسة بالتفصيل' : 'The 5 Fortresses Breakdown',
      title: isRTL ? 'خريطة الحصون الخمسة في المنصة' : 'The 5 Fortresses Workflow',
      subtitle: isRTL 
        ? 'منظومة الأوراد اليومية الشاملة لرسوخ كتاب الله في الصدر'
        : 'The comprehensive daily assignments ensuring rock-solid retention',
      icon: BookOpen,
      color: '#8B5CF6',
      highlights: [
        { label: isRTL ? 'الحصن ١' : 'Fortress 1', value: isRTL ? 'قراءة الختمة والحدر (جزء يومياً)' : 'Hadr Khatmah (1 Juz/day)' },
        { label: isRTL ? 'الحصن ٢' : 'Fortress 2', value: isRTL ? 'التحضير الثلاثي (أسبوعي/ليلي/قبلي)' : 'Triple Preparation' },
        { label: isRTL ? 'الحصن ٣' : 'Fortress 3', value: isRTL ? 'الحفظ الجديد بالتكرار (20x/40x)' : 'New Memorization (20x/40x)' }
      ],
      points: [
        isRTL ? '١. قراءة الختمة والحدر: قراءة جزء يومياً نظراً لإنهاء ختمة كاملة كل شهر وتثبيت الصورة البصرية.' : '1. Continuous Reading (Hadr): 1 Juz daily to complete a monthly Khatmah and embed visual memory.',
        isRTL ? '٢. التحضير الثلاثي: سماع وقراءة الصفحة قبل الحفظ بأسبوع وبالأمس وقبل الجلسة بـ 15 دقيقة لكسر الغرابة.' : '2. Triple Prep: Weekly, nightly, and 15-min pre-read to dismantle vocal and textual difficulty.',
        isRTL ? '٣. الحفظ الجديد المتقن: تكرار كل آية 20 مرة، وربطها بالسابقة 10 مرات، وتكرار الوجه كاملاً 40 مرة.' : '3. New Memorization: 20 repetitions per ayah, 10 linking reps, and 40 full-page reps.',
        isRTL ? '٤. المراجعة القريبة: مراجعة آخر 20 صفحة يومياً للحفاظ على طراوة الحفظ الحديث وغضاضته.' : '4. Near Review: Reviewing the last 20 pages daily to protect fresh memory.',
        isRTL ? '٥. المراجعة البعيدة: مراجعة الأجزاء القديمة بالتناوب، والصلاة بها في المحراب والنوافل.' : '5. Distant Review: Rotating older ajzaa and praying with them in night prayers.'
      ],
      speakerNotes: isRTL 
        ? 'أبرز هنا قوة معادلة التكرار (20x للآية و 40x للصفحة) وكيف تحول الآية من الذاكرة اللحظية إلى الذاكرة الدائمة التي لا تزول.'
        : 'Highlight the power of the repetition formula (20x ayah, 40x page) in transferring verses from working memory to permanent long-term memory.'
    },
    {
      id: 5,
      badge: isRTL ? 'الابتكارات والمزايا التقنية' : 'Technical Innovations',
      title: isRTL ? 'الأدوات الذكية الحصرية بالمنصة' : 'Exclusive Smart Platform Tools',
      subtitle: isRTL 
        ? 'تقنيات متقدمة تجعل رحلة الحفظ سهلة وممتعة ودقيقة'
        : 'Advanced tools making the Quran journey effortless, enjoyable, and accurate',
      icon: Mic,
      color: '#EC4899',
      highlights: [
        { label: isRTL ? 'التسميع الصوتي' : 'Voice Recitation', value: isRTL ? 'تحليل ومزامنة صوتية فورية' : 'Real-time verse sync & audio' },
        { label: isRTL ? 'الخرائط الموضوعية' : 'Mind Maps', value: isRTL ? 'ربط السور بالمعاني البصرية' : 'Thematic Surah breakdown' },
        { label: isRTL ? 'المتشابهات' : 'Mutashabihat', value: isRTL ? 'قواعد ذهبية للتمييز بين الآيات' : 'Golden disambiguation rules' }
      ],
      points: [
        isRTL ? '🎙️ جلسة التسميع الصوتي والمصحف التفاعلي: استماع مباشر لكبار القراء مع تظليل الآية المقروءة وموجات صوتية تفاعلية.' : '🎙️ Interactive Voice Recitation & Mus-haf: Synchronized audio with top reciters, real-time highlighting and waveforms.',
        isRTL ? '🗺️ الخرائط الذهنية الموضوعية: تقسيم كل سورة إلى مقاطع ومحاور بصرية تسهل الاستيعاب وربط اللفظ بالمعنى.' : '🗺️ Thematic Mind Maps: Visual breakdown of Surahs connecting textual words to conceptual meaning.',
        isRTL ? '🔍 مرشد المتشابهات اللفظية: رصد الآيات المتشابهة بدقة وتقديم ضوابط شعرية وقواعد عقلية لعدم الخلط بينها.' : '🔍 Similar Verses Guide: Pinpoints confusing verses with mnemonic rules and clear distinctions.',
        isRTL ? '🤖 المعلم والموجه الإيماني الذكي: إجابة فورية عن معاني الكلمات، أسباب النزول، وخطط الحفظ المناسبة.' : '🤖 AI Spiritual & Learning Tutor: Instant answers to tafsir, vocabulary, and personalized tips.'
      ],
      speakerNotes: isRTL 
        ? 'أوضح للحضور أن المنصة ليست مجرد مشغل صوتي، بل توظف الخرائط الذهنية والمتشابهات والذكاء الاصطناعي لتغطية كافة جوانب الإتقان الحسي والبصري والذهني.'
        : 'Explain that the platform engages all senses: visual (mind maps), auditory (authentic Qaris), and cognitive (similarity rules).'
    },
    {
      id: 6,
      badge: isRTL ? 'التحفيز والاستدامة' : 'Engagement & Gamification',
      title: isRTL ? 'هندسة الاستمرار والتحفيز الإيماني' : 'Motivation Engineering & Community',
      subtitle: isRTL 
        ? 'بناء عادات قرآنية يومية راسخة لا تنقطع بإذن الله'
        : 'Building unbreakable daily Quran habits through positive behavioral design',
      icon: Trophy,
      color: '#F59E0B',
      highlights: [
        { label: isRTL ? 'سلاسل الالتزام' : 'Streaks', value: isRTL ? 'حماية العهد اليومي 🔥' : 'Daily Streak Guard 🔥' },
        { label: isRTL ? 'نقاط الإتقان' : 'XP Points', value: isRTL ? 'ارتقاء في مدارج الحفاظ' : 'Levels & Badges' },
        { label: isRTL ? 'المجتمع القرآني' : 'Cohorts', value: isRTL ? 'صحبة القرآن والتنافس المحمود' : 'Social encouragement' }
      ],
      points: [
        isRTL ? '🔥 سلاسل الالتزام اليومية (Streaks): تشجيع الحافظ على عدم إضاعة يوم واحد دون القرآن الكريم.' : '🔥 Daily Streaks: Motivating students to never miss a single day with the Book of Allah.',
        isRTL ? '🎖️ نظام أوسمة وثمار الإتقان: تكريم المحطات البارزة (رباط الاستمرار، فارس الحصون، حافظ البقرة).' : '🎖️ Badges & Milestone Rewards: Celebrating meaningful progress (e.g., 7-day streak, Fortress Knight).',
        isRTL ? '📊 لوحة تحليلات وإحصاءات حية: قياس معدل استقرار الذاكرة، وعدد الصفحات المحفوظة، ونسبة الإنجاز.' : '📊 Live Retention Analytics: Quantifying memory stability, memorized pages, and daily target pacing.',
        isRTL ? '👥 مجتمع الحفاظ وحلقات التشجيع: مجموعات تنافسية إيجابية للتعاون على البر والتقوى.' : '👥 Quranic Circles & Leaderboard: Positive group dynamics fostering peer motivation.'
      ],
      speakerNotes: isRTL 
        ? 'أكد هنا على فكرة "الاستدامة": الشيطان يقطع الحافظ بالتسويف، والمنصة تجعل الإنجاز الصغير اليومي ممتعاً وملموساً ومرئياً.'
        : 'Highlight habit formation: small consistent daily steps beat erratic bursts. The platform makes progress tangible and rewarding.'
    },
    {
      id: 7,
      badge: isRTL ? 'البنية التقنية' : 'Technical Architecture',
      title: isRTL ? 'البناء التقني الموثوق والأمان' : 'Modern Robust Architecture',
      subtitle: isRTL 
        ? 'سرعة فائقة، أمان متكامل، وتجربة سلسة على جميع الأجهزة'
        : 'Blazing speed, rock-solid security, and responsive cross-platform support',
      icon: Layers,
      color: '#06B6D4',
      highlights: [
        { label: isRTL ? 'الواجهة' : 'Frontend', value: 'React 18 + Vite + Tailwind' },
        { label: isRTL ? 'السحابة وقاعدة البيانات' : 'Cloud & DB', value: 'Google Cloud & Firestore' },
        { label: isRTL ? 'دعم الأجهزة' : 'Devices', value: isRTL ? 'هواتف، أجهزة لوحية، وحواسيب' : 'Mobile, Tablet, Desktop' }
      ],
      points: [
        isRTL ? '📱 تصميم فائق الاستجابة: تجربة تطبيق أصيل متوافقة مع iPhone و Android والأجهزة اللوحية والحواسيب.' : '📱 Responsive PWA Design: Native app feel on smartphones, tablets, and desktop displays.',
        isRTL ? '☁️ مزامنة سحابية لحظية: تقدمك وأورادك محفوظة بدقة عبر Firebase Firestore المشفرة.' : '☁️ Real-time Cloud Sync: User progress securely stored and synchronized across devices via Firestore.',
        isRTL ? '🌙 دعم النمط الداكن والفاتح: قراءة مريحة للعينين في قيام الليل وساعات النهار.' : '🌙 Dark & Light Themes: Eye-friendly contrast tailored for both daytime study and Tahajjud.',
        isRTL ? '🌐 ثنائية اللغة (عربي / إنجليزي): واجهة متعددة اللغات لخدمة الحفاظ حول العالم.' : '🌐 Bilingual Interface: Full Arabic and English support to serve global Muslim communities.'
      ],
      speakerNotes: isRTL 
        ? 'أظهر للجمهور أو المستثمرين أو لجان التحكيم متانة البناء البرمجي وسرعة الاستجابة واعتماد أفضل معايير تجربة المستخدم وأمان البيانات.'
        : 'Demonstrate to stakeholders and judges that the app is built on modern, production-grade cloud standards.'
    },
    {
      id: 8,
      badge: isRTL ? 'الأثر والرؤية المستقبلية' : 'Vision & Next Steps',
      title: isRTL ? 'رؤيتنا: جيلٌ متقنٌ لكتاب الله' : 'Our Vision: A Generation of Steadfast Hufadh',
      subtitle: isRTL 
        ? 'رسالتنا نشر نور القرآن في كل بيت وتحقيق الإتقان لكل راغب'
        : 'Empowering every Muslim to memorize, understand, and retain the Quran with certainty',
      icon: Flame,
      color: '#10B981',
      highlights: [
        { label: isRTL ? 'الرؤية الاستراتيجية' : 'Core Vision', value: isRTL ? 'تخريج مليون حافظ متقن' : 'Empower 1M steadfast Hufadh' },
        { label: isRTL ? 'الشراكات المستهدفة' : 'Partnerships', value: isRTL ? 'حلقات ودور التحفيظ والمدارس' : 'Quranic academies & institutes' },
        { label: isRTL ? 'الشعار الختامي' : 'Motto', value: isRTL ? '«خيركم من تعلّم القرآن وعلّمه»' : 'Best among you are those who learn Quran' }
      ],
      points: [
        isRTL ? 'لوحة تحكم للمؤسسات القرآنية: تمكين المعلمين والمشرفين من متابعة إنجاز الطلاب وأورادهم لحظياً.' : 'Institutional Dashboard: Enabling teachers and Quran schools to track student progress live.',
        isRTL ? 'تطبيقات مخصصة للهواتف (iOS / Android): إشعارات ذكية مخصصة لمواقيت الصلوات وساعات الاستجابة.' : 'Native Mobile Apps: Customized smart alerts synced with prayer times and dawn hours.',
        isRTL ? 'إتاحة المنصة للمسلمين الجدد وغير الناطقين بالعربية مع شروحات وتلاوات مترجمة.' : 'Expanding to non-Arabic speakers with transliterated guidance and multilingual audio.',
        isRTL ? 'دعوة للمشاركة والدعم: استثمر معنا في أعظم مشروع؛ خدمة كتاب الله وخدمة أهله.' : 'Call for partnership: Join us in elevating the service of the Holy Quran and its companions.'
      ],
      speakerNotes: isRTL 
        ? 'اختم العرض بنبرة إيمانية ملهمة: هذا المشروع ليس مجرد برمجية، بل أثر ممتد وصدقة جارية وخير باقٍ لكل من ساهم فيه واستخدمه.'
        : 'Conclude with an inspiring spiritual tone: this project is a lasting legacy, serving the timeless word of Allah.'
    }
  ];

  const current = slides[currentSlide];
  const Icon = current.icon;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const copyDeckText = () => {
    const fullText = slides.map((s, idx) => `
========================================
الشريحة ${idx + 1}: ${s.title}
العنوان الفرعي: ${s.subtitle}
----------------------------------------
النقاط الرئيسية:
${s.points.map(p => `• ${p}`).join('\n')}

ملاحظات المتحدث (Speaker Notes):
${s.speakerNotes}
`).join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        id="presentation-modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isFullscreen ? '0' : '20px'
        }}
      >
        <motion.div
          id="presentation-deck-container"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          style={{
            width: isFullscreen ? '100vw' : '100%',
            maxWidth: isFullscreen ? '100vw' : '1100px',
            height: isFullscreen ? '100vh' : 'auto',
            maxHeight: isFullscreen ? '100vh' : '90vh',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: isFullscreen ? '0' : '24px',
            border: isFullscreen ? 'none' : '1px solid var(--glass-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
        >
          {/* Top Bar / Controls */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${current.color}15`,
                color: current.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Presentation size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isRTL ? 'العرض التعريفي والتقديمي لمنصة الْمَحْفَظَة AI' : 'Al-Mahfath AI Platform Pitch Deck'}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {isRTL ? `الشريحة ${currentSlide + 1} من ${slides.length}` : `Slide ${currentSlide + 1} of ${slides.length}`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Speaker Notes Toggle */}
              <button
                onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: showSpeakerNotes ? 'var(--primary-light)' : 'transparent',
                  color: showSpeakerNotes ? 'var(--primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={isRTL ? 'إظهار / إخفاء ملاحظات المتحدث' : 'Toggle Speaker Notes'}
              >
                <span>🎙️</span>
                <span style={{ display: 'inline' }}>{isRTL ? 'ملاحظات الإلقاء' : 'Notes'}</span>
              </button>

              {/* Copy Deck Text */}
              <button
                onClick={copyDeckText}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: copied ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: copied ? '#10B981' : 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={isRTL ? 'نسخ كافة محتويات الشرائح إلى الحافظة' : 'Copy All Slides Text'}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? (isRTL ? 'تم النسخ!' : 'Copied!') : (isRTL ? 'نسخ النص' : 'Copy Text')}</span>
              </button>

              {/* Print / PDF */}
              <button
                onClick={handlePrint}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isRTL ? 'طباعة أو تصدير PDF' : 'Print / Export PDF'}
              >
                <Printer size={16} />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isFullscreen ? (isRTL ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen') : (isRTL ? 'ملء الشاشة' : 'Fullscreen')}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isRTL ? 'إغلاق العرض' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Slide Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isFullscreen ? '40px 60px' : '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}
              >
                {/* Slide Category Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: `${current.color}15`,
                    color: current.color,
                    border: `1px solid ${current.color}30`,
                    fontSize: '12.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Icon size={14} />
                    {current.badge}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    • الشريحة {currentSlide + 1}
                  </span>
                </div>

                {/* Slide Title */}
                <h1 style={{
                  fontSize: isFullscreen ? '38px' : '30px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 10px 0',
                  lineHeight: 1.3
                }}>
                  {current.title}
                </h1>

                {/* Subtitle */}
                <p style={{
                  fontSize: isFullscreen ? '18px' : '16px',
                  color: 'var(--text-secondary)',
                  margin: '0 0 28px 0',
                  lineHeight: 1.6
                }}>
                  {current.subtitle}
                </p>

                {/* Highlight Cards Grid */}
                {current.highlights && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                    marginBottom: '28px'
                  }}>
                    {current.highlights.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '16px 18px',
                          borderRadius: '16px',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--glass-border)'
                        }}
                      >
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          {h.label}
                        </span>
                        <strong style={{ fontSize: '15px', color: current.color, display: 'block' }}>
                          {h.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Points List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {current.points.map((pt, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: `${current.color}20`,
                        color: current.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {i + 1}
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6
                      }}>
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Speaker Notes Drawer (Optional) */}
                {showSpeakerNotes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '14px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      marginTop: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span>🎙️</span>
                      <strong style={{ fontSize: '13px', color: '#F59E0B' }}>
                        {isRTL ? 'إرشادات المتحدث للإلقاء (Speaker Notes):' : 'Speaker Delivery Notes:'}
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {current.speakerNotes}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls / Slide Navigation */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)'
          }}>
            {/* Prev Button */}
            <button
              onClick={isRTL ? nextSlide : prevSlide}
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              <span>{isRTL ? 'السابق' : 'Previous'}</span>
            </button>

            {/* Slide Navigation Dots / Numbered Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              padding: '4px'
            }}>
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: currentSlide === idx ? '28px' : '10px',
                    height: '10px',
                    borderRadius: '5px',
                    background: currentSlide === idx ? s.color : 'var(--glass-border)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                  title={`الشريحة ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={isRTL ? prevSlide : nextSlide}
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                background: current.color,
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: `0 4px 12px ${current.color}40`
              }}
            >
              <span>{isRTL ? 'التالي' : 'Next'}</span>
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
