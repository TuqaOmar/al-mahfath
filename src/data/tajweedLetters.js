/**
 * Makharij al-huruf (17 articulation points, per Ibn al-Jazari) and sifat for each letter.
 * `pose` drives the articulation diagram in src/components/tajweed/ArticulationDiagram.jsx.
 * Content must be reviewed by a certified tajweed teacher before it is shown to students.
 */

export const REGIONS = [
  { id: 'jawf', ar: 'الجوف', en: 'Oral cavity' },
  { id: 'halq', ar: 'الحلق', en: 'Throat' },
  { id: 'lisan', ar: 'اللسان', en: 'Tongue' },
  { id: 'shafatan', ar: 'الشفتان', en: 'Lips' },
  { id: 'khayshum', ar: 'الخيشوم', en: 'Nasal cavity' }
];

export const MAKHARIJ = {
  jawf: {
    region: 'jawf', ar: 'الجوف', en: 'Oral cavity (vowel length)', pose: 'jawf',
    steps: [
      'اترك اللسان مسترخيًا في قاع الفم دون أن يلمس شيئًا.',
      'يخرج الصوت من فراغ الحلق والفم وينتهي بانتهاء الهواء.',
      'الألف: افتح الفم. الواو المدية: ضمّ الشفتين. الياء المدية: اخفض الفك قليلًا.'
    ]
  },
  aqsaHalq: {
    region: 'halq', ar: 'أقصى الحلق', en: 'Deepest throat', pose: 'aqsaHalq',
    steps: ['اللسان مسترخٍ تمامًا.', 'الصوت يخرج من أبعد نقطة في الحلق مما يلي الصدر (عند الوترين الصوتيين).', 'الهمزة: انحباس تام ثم انفتاح مفاجئ. الهاء: نفس يجري بلا انحباس.']
  },
  wasatHalq: {
    region: 'halq', ar: 'وسط الحلق', en: 'Mid throat', pose: 'wasatHalq',
    steps: ['اللسان مسترخٍ، وجذره يرجع قليلًا نحو الجدار الخلفي للحلق.', 'يضيق وسط الحلق ويخرج الصوت منه.', 'العين: صوت مجهور يجري بعضه. الحاء: نفس مهموس يجري كله.']
  },
  adnaHalq: {
    region: 'halq', ar: 'أدنى الحلق', en: 'Upper throat', pose: 'adnaHalq',
    steps: ['يرتفع أقصى اللسان نحو اللهاة دون أن يلتصق بها.', 'يخرج الصوت من أقرب جزء في الحلق إلى الفم.', 'الحرفان مفخّمان (استعلاء)، والخاء مهموسة والغين مجهورة.']
  },
  qaf: {
    region: 'lisan', ar: 'أقصى اللسان مع ما فوقه من الحنك الأعلى', en: 'Back of tongue + soft palate', pose: 'qaf',
    steps: ['ارفع أقصى اللسان (أبعده عن الشفتين) ليلتصق باللهاة والحنك اللين.', 'يُحبس الصوت والنفس تمامًا.', 'افصل اللسان بقوة؛ وعند السكون تظهر القلقلة (أَقْ).']
  },
  kaf: {
    region: 'lisan', ar: 'أقصى اللسان أسفل مخرج القاف قليلًا', en: 'Back of tongue, slightly forward of qaf', pose: 'kaf',
    steps: ['ارفع أقصى اللسان ليلتصق بالحنك، أقرب إلى الفم من مخرج القاف.', 'يُحبس الصوت ويجري النفس قليلًا (همس).', 'الكاف مرققة بخلاف القاف المفخمة.']
  },
  wasatLisan: {
    region: 'lisan', ar: 'وسط اللسان مع ما يحاذيه من الحنك الأعلى', en: 'Middle of tongue + hard palate', pose: 'wasatLisan',
    steps: ['ارفع وسط اللسان نحو الحنك الصلب فوقه.', 'الجيم: التصاق تام ثم انفصال (قلقلة عند السكون).', 'الشين: يتفشى الهواء في الفم. الياء: يجري الصوت بلين.']
  },
  dad: {
    region: 'lisan', ar: 'إحدى حافتي اللسان مع الأضراس العليا', en: 'Side edge of tongue + upper molars', pose: 'dad',
    steps: ['ألصق حافة اللسان الجانبية (اليسرى أو اليمنى أو كلتيهما) بالأضراس العليا.', 'ارفع أقصى اللسان (استعلاء) وأطبق ظهره على الحنك (إطباق).', 'يستطيل الصوت على حافة اللسان من أوله إلى آخره — لا تُخرجها ظاءً ولا دالًا مفخمة.']
  },
  lam: {
    region: 'lisan', ar: 'أدنى حافتي اللسان إلى منتهى طرفه مع لثة الثنايا العليا', en: 'Tongue rim to tip + upper gum', pose: 'lam',
    steps: ['ألصق طرف اللسان وحافتيه الأماميتين باللثة خلف الثنايا العليا.', 'ينحرف الصوت ويخرج من جانبي اللسان.', 'تُرقق اللام إلا في لفظ الجلالة بعد فتح أو ضم.']
  },
  noon: {
    region: 'lisan', ar: 'طرف اللسان تحت مخرج اللام قليلًا', en: 'Tongue tip, just below lam', pose: 'noon',
    steps: ['ضع طرف اللسان على اللثة العليا، أقرب إلى الأسنان من اللام.', 'تنخفض اللهاة فيمرّ الصوت من الأنف (غنة).', 'جرّب: أمسك أنفك عند قول «أَنْ» تشعر بانقطاع الغنة.']
  },
  ra: {
    region: 'lisan', ar: 'طرف اللسان مع ظهره قريبًا من مخرج النون', en: 'Tongue tip + its top, near noon', pose: 'ra',
    steps: ['ارفع طرف اللسان مع ظهره قليلًا نحو اللثة، أدخل قليلًا من مخرج النون.', 'يرتعد طرف اللسان (تكرير) — والمطلوب إخفاء التكرير لا إظهاره.', 'تُفخّم وتُرقّق بحسب أحكامها.']
  },
  nitiyya: {
    region: 'lisan', ar: 'طرف اللسان مع أصول الثنايا العليا', en: 'Tongue tip + roots of upper incisors', pose: 'nitiyya',
    steps: ['ألصق طرف اللسان بأصول الثنايا العليا (عند اتصال السن باللثة).', 'يُحبس الصوت ثم ينفصل اللسان.', 'الطاء مفخمة مطبقة، والدال مجهورة مقلقلة، والتاء مهموسة.']
  },
  asaliyya: {
    region: 'lisan', ar: 'طرف اللسان فوق الثنايا السفلى', en: 'Tongue tip above lower incisors', pose: 'asaliyya',
    steps: ['ضع طرف اللسان خلف الثنايا السفلى من فوق.', 'اترك فرجة صغيرة بين اللسان والثنايا العليا يمرّ منها الهواء.', 'يخرج صوت يشبه الصفير. الصاد مفخمة، والسين مهموسة، والزاي مجهورة.']
  },
  lithawiyya: {
    region: 'lisan', ar: 'طرف اللسان مع أطراف الثنايا العليا', en: 'Tongue tip + edges of upper incisors', pose: 'lithawiyya',
    steps: ['أخرج طرف اللسان قليلًا بين الثنايا العليا والسفلى.', 'ألصقه بأطراف الثنايا العليا ودع الهواء يجري.', 'الظاء مفخمة مطبقة، والذال مجهورة، والثاء مهموسة.']
  },
  faa: {
    region: 'shafatan', ar: 'باطن الشفة السفلى مع أطراف الثنايا العليا', en: 'Inner lower lip + upper incisors', pose: 'faa',
    steps: ['ضع أطراف الثنايا العليا على باطن الشفة السفلى.', 'اترك الهواء يجري بينهما (همس ورخاوة).', 'اللسان لا يشارك في هذا الحرف.']
  },
  shafatanClosed: {
    region: 'shafatan', ar: 'الشفتان بانطباقهما', en: 'Both lips closed', pose: 'shafatanClosed',
    steps: ['أطبق الشفتين تمامًا.', 'الباء: يُحبس الصوت ثم تنفتح الشفتان (قلقلة عند السكون).', 'الميم: يجري الصوت من الأنف (غنة) والشفتان مطبقتان.']
  },
  shafatanRound: {
    region: 'shafatan', ar: 'الشفتان بانفتاح مع ضمّهما', en: 'Rounded lips (not closed)', pose: 'shafatanRound',
    steps: ['ضمّ الشفتين إلى الأمام كهيئة الدائرة.', 'لا تُطبقهما — تبقى فتحة صغيرة.', 'هذه الواو المتحركة أو الساكنة غير المدية.']
  },
  ghunna: {
    region: 'khayshum', ar: 'الخيشوم', en: 'Nasal cavity (ghunna)', pose: 'ghunna',
    steps: ['هو مخرج الغنة لا حرف مستقل.', 'تنخفض اللهاة فيمرّ الصوت عبر تجويف الأنف.', 'يظهر مع النون والميم، خاصة المشددتين والمخفاة والمدغمة بغنة.']
  }
};

// Sifat with opposites: every letter takes exactly one side of each pair.
const HAMS = 'فحثهشخصسكت';
const SHIDDA = 'ءأجدقطبكت';
const TAWASSUT = 'لنعمر';
const ISTILA = 'خصضغطقظ';
const ITBAQ = 'صضطظ';
const IDHLAQ = 'فرمنلب';

// Sifat without opposites.
const SINGLE = [
  { id: 'safir', ar: 'الصفير', letters: 'صزس' },
  { id: 'qalqala', ar: 'القلقلة', letters: 'قطبجد' },
  { id: 'inhiraf', ar: 'الانحراف', letters: 'لر' },
  { id: 'takrir', ar: 'التكرير', letters: 'ر' },
  { id: 'tafashi', ar: 'التفشي', letters: 'ش' },
  { id: 'istitala', ar: 'الاستطالة', letters: 'ض' },
  { id: 'ghunna', ar: 'الغنة', letters: 'نم' }
];

export const getSifat = (letter) => {
  if (letter === 'غنة') return { pairs: [], single: [] };
  if (letter === 'ا') return { pairs: [], single: [{ id: 'madd', ar: 'المدّ' }] };
  const char = letter.replace('ـ', '');
  const pairs = [
    HAMS.includes(char) ? { ar: 'الهمس', opposite: 'الجهر', strong: false } : { ar: 'الجهر', opposite: 'الهمس', strong: true },
    SHIDDA.includes(char)
      ? { ar: 'الشدة', opposite: 'الرخاوة', strong: true }
      : TAWASSUT.includes(char)
        ? { ar: 'التوسط', opposite: 'الشدة / الرخاوة', strong: null }
        : { ar: 'الرخاوة', opposite: 'الشدة', strong: false },
    ISTILA.includes(char) ? { ar: 'الاستعلاء', opposite: 'الاستفال', strong: true } : { ar: 'الاستفال', opposite: 'الاستعلاء', strong: false },
    ITBAQ.includes(char) ? { ar: 'الإطباق', opposite: 'الانفتاح', strong: true } : { ar: 'الانفتاح', opposite: 'الإطباق', strong: false },
    IDHLAQ.includes(char) ? { ar: 'الإذلاق', opposite: 'الإصمات', strong: null } : { ar: 'الإصمات', opposite: 'الإذلاق', strong: null }
  ];
  return { pairs, single: SINGLE.filter(s => s.letters.includes(char)) };
};

export const isEmphatic = (char) => ISTILA.includes(char);

/** Letters in Noorani order. `confused` lists letters students commonly mix it up with. */
export const LETTERS = [
  { char: 'ء', name: 'همزة', makhraj: 'aqsaHalq', practice: 'أَءْ', confused: ['ع'] },
  { char: 'ا', name: 'ألف', makhraj: 'jawf', practice: 'بَا' },
  { char: 'ب', name: 'باء', makhraj: 'shafatanClosed', practice: 'أَبْ' },
  { char: 'ت', name: 'تاء', makhraj: 'nitiyya', practice: 'أَتْ', confused: ['ط'] },
  { char: 'ث', name: 'ثاء', makhraj: 'lithawiyya', practice: 'أَثْ', confused: ['س'] },
  { char: 'ج', name: 'جيم', makhraj: 'wasatLisan', practice: 'أَجْ' },
  { char: 'ح', name: 'حاء', makhraj: 'wasatHalq', practice: 'أَحْ', confused: ['هـ'] },
  { char: 'خ', name: 'خاء', makhraj: 'adnaHalq', practice: 'أَخْ' },
  { char: 'د', name: 'دال', makhraj: 'nitiyya', practice: 'أَدْ', confused: ['ض'] },
  { char: 'ذ', name: 'ذال', makhraj: 'lithawiyya', practice: 'أَذْ', confused: ['ز'] },
  { char: 'ر', name: 'راء', makhraj: 'ra', practice: 'أَرْ' },
  { char: 'ز', name: 'زاي', makhraj: 'asaliyya', practice: 'أَزْ', confused: ['ذ'] },
  { char: 'س', name: 'سين', makhraj: 'asaliyya', practice: 'أَسْ', confused: ['ص', 'ث'] },
  { char: 'ش', name: 'شين', makhraj: 'wasatLisan', practice: 'أَشْ' },
  { char: 'ص', name: 'صاد', makhraj: 'asaliyya', practice: 'أَصْ', confused: ['س'] },
  { char: 'ض', name: 'ضاد', makhraj: 'dad', practice: 'أَضْ', confused: ['ظ', 'د'] },
  { char: 'ط', name: 'طاء', makhraj: 'nitiyya', practice: 'أَطْ', confused: ['ت'] },
  { char: 'ظ', name: 'ظاء', makhraj: 'lithawiyya', practice: 'أَظْ', confused: ['ض', 'ذ'] },
  { char: 'ع', name: 'عين', makhraj: 'wasatHalq', practice: 'أَعْ', confused: ['ء'] },
  { char: 'غ', name: 'غين', makhraj: 'adnaHalq', practice: 'أَغْ' },
  { char: 'ف', name: 'فاء', makhraj: 'faa', practice: 'أَفْ' },
  { char: 'ق', name: 'قاف', makhraj: 'qaf', practice: 'أَقْ', confused: ['ك'] },
  { char: 'ك', name: 'كاف', makhraj: 'kaf', practice: 'أَكْ', confused: ['ق'] },
  { char: 'ل', name: 'لام', makhraj: 'lam', practice: 'أَلْ' },
  { char: 'م', name: 'ميم', makhraj: 'shafatanClosed', practice: 'أَمْ', nasal: true },
  { char: 'ن', name: 'نون', makhraj: 'noon', practice: 'أَنْ', nasal: true },
  { char: 'هـ', name: 'هاء', makhraj: 'aqsaHalq', practice: 'أَهْ', confused: ['ح'] },
  { char: 'و', name: 'واو', makhraj: 'shafatanRound', practice: 'أَوْ' },
  { char: 'ي', name: 'ياء', makhraj: 'wasatLisan', practice: 'أَيْ' },
  { char: 'غنة', name: 'الغنة', makhraj: 'ghunna', practice: 'إِنَّ', nasal: true, isFeature: true }
];
