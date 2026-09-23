import PptxGenJS from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');

const pptx = new PptxGenJS();

// ── Global settings ──────────────────────────────────────
pptx.layout   = 'LAYOUT_WIDE';  // 16:9
pptx.author   = 'محفظ AI Team';
pptx.company  = 'دورة بصائر – مشروع سفر';
pptx.subject  = 'مشروع التخرج – محفظ AI';
pptx.title    = 'محفظ AI – العرض التقديمي الشامل';

// ── Color palette ─────────────────────────────────────────
const BG      = '060913';
const CARD    = '0F172A';
const PRIMARY = '10B981';
const BLUE    = '3B82F6';
const GOLD    = 'F59E0B';
const RED     = 'EF4444';
const PURPLE  = '8B5CF6';
const WHITE   = 'F1F5F9';
const MUTED   = '94A3B8';

// ── Helpers ───────────────────────────────────────────────
function bgSlide(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: BG }
  });
  // subtle top glow
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '60%', h: '30%',
    fill: { type: 'gradient', gradType: 'radial',
      stops: [{ pos: 0, color: '10B981', transparency: 88 },
              { pos: 100, color: BG, transparency: 100 }] }
  });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: opts.fill || CARD },
    line: { color: opts.border || '1E293B', width: 1 }
  });
}

function tag(slide, x, y, text, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 2.8, h: 0.28, rectRadius: 0.14,
    fill: { color: color, transparency: 88 },
    line: { color: color, width: 1, transparency: 60 }
  });
  slide.addText(text, {
    x, y, w: 2.8, h: 0.28,
    fontSize: 10, bold: true, color: color,
    align: 'center', valign: 'middle', rtlMode: true
  });
}

function sectionTitle(slide, x, y, text, color) {
  slide.addText(text, {
    x, y, w: 5.5, h: 0.7,
    fontSize: 28, bold: true, color: color,
    rtlMode: true, fontFace: 'Arial'
  });
}

function body(slide, x, y, w, h, text, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.size || 13,
    color: opts.color || MUTED,
    rtlMode: true,
    fontFace: 'Arial',
    valign: opts.valign || 'top',
    bullet: opts.bullet || false,
    lineSpacingMultiple: 1.3,
    ...opts
  });
}

// ────────────────────────────────────────────────────────
// SLIDE 1 – TITLE
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);

  // Basaer banner pill
  s.addShape(pptx.ShapeType.roundRect, {
    x: 2.8, y: 0.25, w: 7.6, h: 0.6, rectRadius: 0.1,
    fill: { type: 'gradient', gradType: 'linear', angle: 90,
      stops: [{ pos: 0, color: '4ADE80', transparency: 88 },
              { pos: 100, color: BLUE, transparency: 88 }] },
    line: { color: '4ADE80', width: 1, transparency: 50 }
  });
  s.addText('🌿  مشروع التخرج من دورة بصائر – مشروع سفر  |  لإعداد معلم القرآن  |  الدفعة 19  |  2026', {
    x: 2.8, y: 0.25, w: 7.6, h: 0.6,
    fontSize: 12, bold: true, color: '4ADE80',
    align: 'center', valign: 'middle', rtlMode: true
  });

  // Quran ayah
  s.addShape(pptx.ShapeType.roundRect, {
    x: 2.2, y: 1.05, w: 8.8, h: 0.65, rectRadius: 0.08,
    fill: { color: GOLD, transparency: 96 },
    line: { color: GOLD, width: 1, transparency: 60 }
  });
  s.addText('« إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ »', {
    x: 2.2, y: 1.05, w: 8.8, h: 0.65,
    fontSize: 20, bold: true, color: GOLD,
    align: 'center', valign: 'middle', rtlMode: true, fontFace: 'Arial'
  });

  // App name
  s.addText('محفّظ AI  (Ma7fath-AI)', {
    x: 1, y: 1.95, w: 11.2, h: 0.85,
    fontSize: 40, bold: true, color: PRIMARY,
    align: 'center', rtlMode: true, fontFace: 'Arial'
  });

  // Subtitle
  s.addText('المنصة الذكية الأولى التي تجمع بين قوة الذكاء الاصطناعي وأساليب الحفظ العلمية\nلتحويل رحلة حفظ القرآن الكريم من تحدٍ مُرهق إلى تجربة إيمانية ممتعة ومستدامة', {
    x: 1.5, y: 2.85, w: 10.2, h: 0.8,
    fontSize: 14, color: MUTED,
    align: 'center', rtlMode: true, fontFace: 'Arial'
  });

  // Team pill
  s.addShape(pptx.ShapeType.roundRect, {
    x: 3.2, y: 3.8, w: 6.8, h: 0.45, rectRadius: 0.08,
    fill: { color: PRIMARY, transparency: 88 },
    line: { color: PRIMARY, width: 1, transparency: 60 }
  });
  s.addText('إعداد وتطوير: تقى أبو الذهب  •  فرح الأحمد  •  أماني الربابعة', {
    x: 3.2, y: 3.8, w: 6.8, h: 0.45,
    fontSize: 13, bold: true, color: PRIMARY,
    align: 'center', valign: 'middle', rtlMode: true
  });

  // Stats row
  const stats = [
    { v: '+50K', l: 'حافظ مسجّل' },
    { v: '+2M',  l: 'صفحة محفوظة' },
    { v: '94%',  l: 'نسبة الالتزام' },
    { v: '9',    l: 'ميزات رئيسية' },
  ];
  stats.forEach((st, i) => {
    const x = 1.4 + i * 2.8;
    card(s, x, 4.45, 2.4, 0.9);
    s.addText(st.v, { x, y: 4.5,  w: 2.4, h: 0.38, fontSize: 22, bold: true, color: PRIMARY, align: 'center' });
    s.addText(st.l, { x, y: 4.85, w: 2.4, h: 0.28, fontSize: 11, color: MUTED, align: 'center', rtlMode: true });
  });
}

// ────────────────────────────────────────────────────────
// SLIDE 2 – PROBLEMS
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 4.8, 0.3, '❌  التحديات العصرية', RED);
  s.addText('لماذا يتوقف الحفاظ عن الحفظ؟', {
    x: 1, y: 0.7, w: 11.2, h: 0.75,
    fontSize: 32, bold: true, color: RED,
    align: 'center', rtlMode: true
  });
  s.addText('دراسة الواقع أثبتت أن 70% من الحفاظ يتوقفون في السنة الأولى بسبب عقبات يمكن حلها بالتكنولوجيا الذكية', {
    x: 1.5, y: 1.5, w: 10.2, h: 0.4,
    fontSize: 14, color: MUTED, align: 'center', rtlMode: true
  });

  const problems = [
    { icon: '⏳', title: 'ضيق الوقت والتشتت', desc: 'حياة مزدحمة بالمشتتات تجعل الالتزام بورد يومي ثابت شبه مستحيل.' },
    { icon: '🗺️', title: 'عشوائية المراجعة', desc: 'تكرار المحفوظ الجيد وإهمال الضعيف يؤدي لتراكم النسيان خِفية.' },
    { icon: '🗣️', title: 'غياب المعلم والملقن', desc: 'صعوبة إيجاد شيخ متفرغ لتصحيح الأخطاء وتسميع التلاوة.' },
    { icon: '🧠', title: 'تداخل المتشابهات', desc: 'الخلط بين الآيات المتشابهة يُربك الحافظ ويُضعف ثقته بنفسه.' },
    { icon: '😞', title: 'فتور الهمة والعزلة', desc: 'الحفظ الفردي الصامت بلا تشجيع أو مجتمع يورث الملل والانقطاع.' },
  ];
  problems.forEach((p, i) => {
    const x = 0.3 + i * 2.6;
    card(s, x, 2.1, 2.4, 2.7, { fill: '0D1A2D', border: RED });
    s.addText(p.icon, { x, y: 2.2, w: 2.4, h: 0.55, fontSize: 28, align: 'center' });
    s.addText(p.title, { x, y: 2.78, w: 2.4, h: 0.45, fontSize: 13, bold: true, color: WHITE, align: 'center', rtlMode: true });
    s.addText(p.desc,  { x: x+0.1, y: 3.28, w: 2.2, h: 1.4, fontSize: 11, color: MUTED, rtlMode: true, align: 'center' });
  });
}

// ────────────────────────────────────────────────────────
// SLIDE 3 – LANDING PAGE
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🌐  الصفحة الرئيسية (Landing Page)', BLUE);
  sectionTitle(s, 0.4, 0.7, 'الزيارة الأولى للموقع', BLUE);

  const points = [
    '🖥️ شعار "محفظ AI" مع أزرار تسجيل الدخول وإنشاء حساب في أعلى الصفحة',
    '📸 قسم Hero مع صورة مصحف واقعية وشرح مختصر للفكرة',
    '📊 إحصائيات حقيقية: عدد الحفاظ المسجلين والصفحات المحفوظة',
    '🖼️ معرض صور تفاعلي يعرض لقطات حقيقية من داخل التطبيق',
    '🃏 كروت الميزات مع شرح مختصر لكل ميزة',
    '⚡ زر الدخول السريع بحساب تجريبي (Demo) بدون تسجيل',
  ];
  points.forEach((p, i) => {
    card(s, 0.4, 1.55 + i * 0.62, 5.8, 0.54);
    s.addText(p, { x: 0.55, y: 1.6 + i * 0.62, w: 5.6, h: 0.44,
      fontSize: 12, color: WHITE, rtlMode: true, valign: 'middle' });
  });

  // Real screenshot
  s.addImage({ path: path.join(publicDir, 'quran_holy_book.jpg'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 4 – SIGN UP / LOGIN
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🔐  التسجيل والدخول', PURPLE);
  sectionTitle(s, 0.4, 0.7, 'تسجيل الدخول وإنشاء الحساب', PURPLE);

  const methods = [
    { icon: '📝', title: 'إنشاء حساب جديد (Sign Up)', color: PRIMARY,
      lines: ['يُدخل: الاسم الكامل، البريد الإلكتروني، كلمة المرور',
               'التحقق من صحة البيانات آنياً',
               'تشفير كلمة المرور بـ Bcrypt قبل الحفظ',
               'إعادة التوجيه لمرحلة التهيئة الشخصية'] },
    { icon: '🔑', title: 'تسجيل الدخول (Login)', color: BLUE,
      lines: ['يُدخل: البريد الإلكتروني وكلمة المرور',
               'التحقق مقابل قاعدة البيانات',
               'تحميل التقدم السابق (خريطة، نقاط، أوسمة)',
               'إعادة التوجيه للوحة الرئيسية مباشرة'] },
    { icon: '⚡', title: 'الدخول التجريبي السريع', color: GOLD,
      lines: ['بضغطة واحدة فقط – بدون تسجيل',
               'بيانات تجريبية كاملة جاهزة للعرض',
               'مناسب لمن يريد رؤية التطبيق أولاً',
               'لا يحتاج إدخال أي بيانات'] },
  ];

  methods.forEach((m, i) => {
    const x = 0.4 + i * 4.3;
    card(s, x, 1.6, 4.0, 3.5, { fill: '0D1A2D', border: m.color });
    s.addText(m.icon + '  ' + m.title, {
      x: x+0.1, y: 1.7, w: 3.8, h: 0.45,
      fontSize: 13, bold: true, color: m.color, rtlMode: true });
    m.lines.forEach((line, j) => {
      s.addText('✦  ' + line, {
        x: x+0.15, y: 2.25 + j * 0.65, w: 3.7, h: 0.55,
        fontSize: 11, color: MUTED, rtlMode: true });
    });
  });
}

// ────────────────────────────────────────────────────────
// SLIDE 5 – ONBOARDING WIZARD
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🧙  مستشار التهيئة', PRIMARY);
  sectionTitle(s, 0.4, 0.7, 'بناء خطة حفظ شخصية ذكية', PRIMARY);
  body(s, 0.4, 1.45, 5.8, 0.4,
    'بعد التسجيل مباشرة، يستقبل التطبيق المستخدم بمعالج تفاعلي يفهم من هو ويبني له خطة مخصصة.');

  const steps = [
    { n: '1', q: 'ما مستوى حفظك الحالي؟', a: 'مبتدئ / متوسط / متقدم / حافظ مكتمل' },
    { n: '2', q: 'كم صفحة تستطيع يومياً؟', a: '1 – 5 صفحات' },
    { n: '3', q: 'ما نمط تعلمك المفضل؟', a: 'بصري (ألوان) / سمعي (تلاوة) / مختلط' },
    { n: '4', q: 'ما وقت التنبيهات المفضل؟', a: 'الفجر / الضحى / العصر / الليل' },
  ];
  steps.forEach((st, i) => {
    card(s, 0.4, 1.95 + i * 0.82, 5.8, 0.74);
    s.addShape(pptx.ShapeType.ellipse, {
      x: 0.5, y: 2.05 + i * 0.82, w: 0.45, h: 0.45,
      fill: { color: PRIMARY, transparency: 85 },
      line: { color: PRIMARY, width: 1 }
    });
    s.addText(st.n, { x: 0.5, y: 2.05 + i * 0.82, w: 0.45, h: 0.45, fontSize: 14, bold: true, color: PRIMARY, align: 'center', valign: 'middle' });
    s.addText(st.q, { x: 1.05, y: 2.06 + i * 0.82, w: 4.9, h: 0.3, fontSize: 13, bold: true, color: WHITE, rtlMode: true });
    s.addText(st.a, { x: 1.05, y: 2.38 + i * 0.82, w: 4.9, h: 0.25, fontSize: 11, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'five_fortresses_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 6 – DASHBOARD
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🏠  الواجهة الرئيسية', PRIMARY);
  sectionTitle(s, 0.4, 0.7, 'لوحة القيادة (Dashboard)', PRIMARY);

  const items = [
    { icon: '📖', title: 'شريط الحديث الدوّار', desc: 'أحاديث فضائل القرآن تتغير كل 6 ثوانٍ تلقائياً لتجديد النية.' },
    { icon: '📊', title: 'بطاقات القياس الثلاث', desc: 'Memory Score • Streak أيام متتالية • تطبيق اليوم العملي.' },
    { icon: '🤖', title: 'توصيات الذكاء الاصطناعي', desc: 'يقترح الصفحة التالية للحفظ أو الأحوج للمراجعة بناءً على الخريطة.' },
    { icon: '🏰', title: 'الحصون الخمسة اليومية', desc: 'قائمة مرئية بمهام الحصون مع +50 XP عند إتمام كل حصن.' },
    { icon: '🏆', title: 'المستوى والنقاط', desc: 'شريط تقدم يوضح المستوى الحالي والهدف اللازم للترقي.' },
  ];
  items.forEach((it, i) => {
    card(s, 0.4, 1.5 + i * 0.75, 5.8, 0.67);
    s.addText(it.icon, { x: 0.5, y: 1.56 + i * 0.75, w: 0.5, h: 0.55, fontSize: 20 });
    s.addText(it.title, { x: 1.1, y: 1.56 + i * 0.75, w: 4.9, h: 0.28, fontSize: 13, bold: true, color: PRIMARY, rtlMode: true });
    s.addText(it.desc,  { x: 1.1, y: 1.85 + i * 0.75, w: 4.9, h: 0.28, fontSize: 11, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'admin_analytics_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 7 – QURAN MAP
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '📖  الميزة 1', BLUE);
  sectionTitle(s, 0.4, 0.7, 'خريطة القرآن التفاعلية (604 صفحة)', BLUE);

  const colors = [
    { c: '10B981', label: 'أخضر — حفظ ممتاز 90%+' },
    { c: 'F59E0B', label: 'أصفر — يحتاج مراجعة 60–89%' },
    { c: 'EF4444', label: 'أحمر — ضعيف، تدخل عاجل' },
    { c: '475569', label: 'رمادي — غير محفوظ بعد' },
  ];
  colors.forEach((cl, i) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.4, y: 1.55 + i * 0.65, w: 0.38, h: 0.38, rectRadius: 0.04,
      fill: { color: cl.c }, line: { color: cl.c, width: 0 }
    });
    s.addText(cl.label, { x: 0.9, y: 1.58 + i * 0.65, w: 5.2, h: 0.34, fontSize: 13, color: WHITE, rtlMode: true });
  });

  const features = [
    'الضغط على أي صفحة يفتح تفاصيلها (السورة، الجزء، آخر درجة)',
    'تصفية حسب الجزء أو السورة',
    'تحديث تلقائي للألوان بعد كل جلسة تسميع',
    'يوفر 50%+ من وقت المراجعة بالتوجيه للصفحات الحرجة',
  ];
  features.forEach((f, i) => {
    s.addText('✦  ' + f, { x: 0.4, y: 4.2 + i * 0.5, w: 5.8, h: 0.42, fontSize: 12, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'quran_map_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 8 – DAILY SESSION / RECITATION
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🎯  الميزة 2', PRIMARY);
  sectionTitle(s, 0.4, 0.7, 'جلسة اليوم والتسميع التفاعلي', PRIMARY);

  const sections = [
    { icon: '✍️', title: 'آلية التسميع الذكي', color: PRIMARY,
      desc: 'يختار الحافظ الصفحة ويقرأها غيباً. عند التوقف يضغط "تردد"، وعند الخطأ يضغط "خطأ". بعد الانتهاء يضغط "إتمام التسميع" لاحتساب الدرجة.' },
    { icon: '📊', title: 'خوارزمية Memory Score', color: GOLD,
      desc: 'درجة الحفظ = 100 − (خطأ × 2) − (تردد × 1)\nتُحدَّث في الخريطة التفاعلية فوراً وتغيّر لون الصفحة تلقائياً.' },
    { icon: '🎵', title: 'مشغّل التلاوات القرآنية', color: BLUE,
      desc: 'مشغّل صوتي مدمج بأصوات: المنشاوي المرتّل • الحصري المعلّم • الغامدي\nيثبّت الصوت في الذاكرة السمعية ويصحح مخارج الحروف.' },
  ];
  sections.forEach((sec, i) => {
    card(s, 0.4, 1.55 + i * 1.35, 5.8, 1.25, { fill: '0D1A2D', border: sec.color });
    s.addText(sec.icon + '  ' + sec.title, { x: 0.55, y: 1.63 + i * 1.35, w: 5.5, h: 0.35, fontSize: 14, bold: true, color: sec.color, rtlMode: true });
    s.addText(sec.desc, { x: 0.55, y: 2.0 + i * 1.35, w: 5.5, h: 0.8, fontSize: 11, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'voice_recitation_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'contain', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 9 – FIVE FORTRESSES + GAMIFICATION
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🏰  الميزة 3', GOLD);
  sectionTitle(s, 0.4, 0.7, 'الحصون الخمسة والتلعيب التحفيزي', GOLD);

  const fortresses = [
    { n: '1️⃣', title: 'الحصن 1 – الجديد',         desc: 'حفظ الصفحات المستهدفة لليوم' },
    { n: '2️⃣', title: 'الحصن 2 – المراجعة القريبة', desc: 'مراجعة ما حُفظ خلال الأسبوع الماضي' },
    { n: '3️⃣', title: 'الحصن 3 – المراجعة البعيدة', desc: 'مراجعة حفظ قديم (أكثر من شهر)' },
    { n: '4️⃣', title: 'الحصن 4 – السماع',          desc: 'الاستماع لتلاوة الصفحات المحددة' },
    { n: '5️⃣', title: 'الحصن 5 – القراءة',          desc: 'قراءة نظر للمصحف لتثبيت الصورة البصرية' },
  ];
  fortresses.forEach((ft, i) => {
    card(s, 0.4, 1.5 + i * 0.75, 5.8, 0.68, { fill: '0D1A2D', border: GOLD });
    s.addText(ft.n + '  ' + ft.title, { x: 0.55, y: 1.56 + i * 0.75, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: GOLD, rtlMode: true });
    s.addText(ft.desc,  { x: 0.55, y: 1.88 + i * 0.75, w: 5.5, h: 0.26, fontSize: 11, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'five_fortresses_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 10 – AI ASSISTANT + SIMILARITIES
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '🤖  الميزة 4 و5', PURPLE);
  sectionTitle(s, 0.4, 0.7, 'مساعد Gemini AI والمتشابهات', PURPLE);

  const items = [
    { icon: '🤖', title: 'مساعد AI (Google Gemini)', color: PURPLE,
      desc: 'معلم قرآني ذكي متاح 24/7 • يجيب على أسئلة المتشابهات • يقدم التفسير الميسر • يعطي قواعد ذهبية للتفريق بين الآيات • يحفظ سجل المحادثات.' },
    { icon: '🔍', title: 'مرشد المتشابهات اللفظية', color: BLUE,
      desc: 'يعرض الآيات جنباً لجنب • يميّز الاختلافات بالألوان • يقدم "القاعدة الذهبية" لتذكر أيهما يأتي في أي سورة.' },
    { icon: '🌲', title: 'الخرائط الذهنية الموضوعية', color: PRIMARY,
      desc: 'تقسيم السور الطويلة لهيكل شجري مترابط • المحاور الرئيسية والفرعية • يمنع الضياع ويثبّت الانتقالات الكبرى في الذاكرة.' },
  ];
  items.forEach((it, i) => {
    card(s, 0.4, 1.5 + i * 1.4, 5.8, 1.3, { fill: '0D1A2D', border: it.color });
    s.addText(it.icon + '  ' + it.title, { x: 0.55, y: 1.58 + i * 1.4, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: it.color, rtlMode: true });
    s.addText(it.desc, { x: 0.55, y: 1.97 + i * 1.4, w: 5.5, h: 0.76, fontSize: 11, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'mind_maps_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 11 – COMMUNITY + ADMIN
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 0.4, 0.3, '👥  الميزات المتبقية', BLUE);
  sectionTitle(s, 0.4, 0.7, 'المجتمع، الإنجازات، ولوحة الإدارة', BLUE);

  const items = [
    { icon: '👥', color: BLUE,   title: 'ملتقى الحفاظ (Community)', desc: 'نشر خواطر تدبرية • طرح الأسئلة والرد عليها • الإعجاب والتعليق • مشاركة الإنجازات.' },
    { icon: '🏆', color: GOLD,   title: 'صفحة الإنجازات والأوسمة', desc: 'أوسمة مُكتسبة بألوان ذهبية • أوسمة مقفلة مع شرط الحصول عليها • شريط XP تحفيزي.' },
    { icon: '📊', color: RED,    title: 'التحليلات والإحصاءات', desc: 'منحنى التقدم الأسبوعي والشهري • مقارنة Memory Score • الصفحات الأكثر ضعفاً.' },
    { icon: '⚙️', color: PURPLE, title: 'لوحة الإدارة (Admin Panel)', desc: 'مراقبة إجمالي المستخدمين وإحصاءاتهم • صلاحيات الحسابات • نسخ احتياطية لقاعدة البيانات.' },
  ];
  items.forEach((it, i) => {
    card(s, 0.4, 1.5 + i * 1.0, 5.8, 0.92, { fill: '0D1A2D', border: it.color });
    s.addText(it.icon + '  ' + it.title, { x: 0.55, y: 1.56 + i * 1.0, w: 5.5, h: 0.32, fontSize: 13, bold: true, color: it.color, rtlMode: true });
    s.addText(it.desc, { x: 0.55, y: 1.9 + i * 1.0, w: 5.5, h: 0.42, fontSize: 11, color: MUTED, rtlMode: true });
  });

  s.addImage({ path: path.join(publicDir, 'admin_analytics_preview.png'),
    x: 6.8, y: 0.3, w: 6.3, h: 5.2, sizing: { type: 'cover', w: 6.3, h: 5.2 } });
}

// ────────────────────────────────────────────────────────
// SLIDE 12 – CLOSING / USER JOURNEY SUMMARY
// ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bgSlide(s);
  tag(s, 4.2, 0.3, '🌟  ختام رحلة المستخدم', PRIMARY);
  s.addText('من الدخول الأول حتى تسجيل الخروج', {
    x: 1, y: 0.7, w: 11.2, h: 0.7,
    fontSize: 30, bold: true, color: PRIMARY,
    align: 'center', rtlMode: true
  });

  const journey = [
    { n: '١', icon: '🌐', title: 'الصفحة الرئيسية', desc: 'الزائر يرى الهوية ويختار التسجيل أو التجربة' },
    { n: '٢', icon: '🔐', title: 'التسجيل والدخول', desc: 'حساب آمن أو دخول سريع تجريبي' },
    { n: '٣', icon: '🧙', title: 'التهيئة الأولى', desc: 'خطة حفظ مخصصة حسب المستوى' },
    { n: '٤', icon: '🏠', title: 'لوحة القيادة', desc: 'إحصاءات + توصيات AI يومياً' },
    { n: '٥', icon: '🗺️', title: 'خريطة المصحف', desc: '604 صفحة ملونة تحديث آلي' },
    { n: '٦', icon: '🎯', title: 'جلسة التسميع', desc: 'تسميع ذكي + Memory Score' },
    { n: '٧', icon: '🏰', title: 'الحصون الخمسة', desc: 'مراجعة يومية منظمة + XP' },
    { n: '٨', icon: '🤖', title: 'مساعد Gemini AI', desc: 'معلم ذكي متاح 24/7' },
  ];

  journey.forEach((j, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = col === 0 ? 0.4 : 6.7;
    card(s, x, 1.55 + row * 0.93, 5.8, 0.85);
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.12, y: 1.65 + row * 0.93, w: 0.42, h: 0.42,
      fill: { color: PRIMARY, transparency: 82 },
      line: { color: PRIMARY, width: 1 }
    });
    s.addText(j.n, { x: x+0.12, y: 1.65+row*0.93, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: PRIMARY, align: 'center', valign: 'middle' });
    s.addText(j.icon + '  ' + j.title, { x: x+0.65, y: 1.65+row*0.93, w: 4.9, h: 0.3, fontSize: 13, bold: true, color: WHITE, rtlMode: true });
    s.addText(j.desc, { x: x+0.65, y: 1.96+row*0.93, w: 4.9, h: 0.3, fontSize: 11, color: MUTED, rtlMode: true });
  });

  // Final tagline
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 5.2, w: 11.6, h: 0.52, rectRadius: 0.1,
    fill: { color: PRIMARY, transparency: 88 },
    line: { color: PRIMARY, width: 1, transparency: 50 }
  });
  s.addText('✨  محفّظ AI — نبتكر لنحمي ما في الصدور، ونيسّر حفظ آيات الرحمن بالإيمان والذكاء  ✨', {
    x: 0.8, y: 5.2, w: 11.6, h: 0.52,
    fontSize: 14, bold: true, color: PRIMARY,
    align: 'center', valign: 'middle', rtlMode: true
  });
}

// ── Save ─────────────────────────────────────────────────
const outPath = 'C:\\Users\\ASUS\\OneDrive\\Desktop\\محفظ_AI_Presentation.pptx';
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log('✅  PPTX saved to:', outPath);
}).catch(err => {
  console.error('❌  Error:', err);
});
