// Learning Style Diagnostic Quiz Data & Evaluation Algorithms

export const learningQuizQuestions = [
  {
    id: 1,
    titleAr: "١. عندما تحاول استرجاع آية نَسيتَها أثناء التسميع، ما أول ما يتبادر إلى ذهنك؟",
    titleEn: "1. When trying to recall a forgotten verse while reciting, what comes to mind first?",
    options: [
      {
        id: "a",
        style: "auditory",
        textAr: "نغمة القارئ وصوته وهو يتلوها في أذني، أو رنين القافية الصوتية.",
        textEn: "The reciter's tone and voice in my ear, or the phonetic rhyme rhythm.",
        icon: "Volume2",
        weight: { auditory: 3, visual: 0, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "b",
        style: "visual",
        textAr: "موضع الآية في الصفحة (أعلى/أسفل/يمين)، وشكل الكلمات أو لون المصحف.",
        textEn: "The verse's position on the page (top/bottom), line shape, or font color.",
        icon: "Eye",
        weight: { auditory: 0, visual: 3, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "c",
        style: "kinesthetic",
        textAr: "حركة لساني ونطقي للحروف السابقة، أو كتابتي لها بيدي في الهواء/الدفتر.",
        textEn: "The muscle memory of my tongue pronouncing preceding words, or hand writing.",
        icon: "Fingerprint",
        weight: { auditory: 0, visual: 0, kinesthetic: 3, analytical: 0 }
      },
      {
        id: "d",
        style: "analytical",
        textAr: "معنى الآية وتسلسل قصة السورة، وماذا كان موضوع الآية السابقة.",
        textEn: "The meaning, narrative flow of the Surah, and the thematic context.",
        icon: "BookOpen",
        weight: { auditory: 0, visual: 0, kinesthetic: 0, analytical: 3 }
      }
    ]
  },
  {
    id: 2,
    titleAr: "٢. ما هي الخطوة الأكثر فاعلية وسرعة بالنسبة لك لحفظ نصف صفحة جديدة؟",
    titleEn: "2. What is the most effective and fastest step for you to memorize a new half page?",
    options: [
      {
        id: "a",
        style: "auditory",
        textAr: "الاستماع لتكرار الشيخ (مثل الحصري أو المنشاوي) وترديد الآية بصوت مسموع عدة مرات.",
        textEn: "Listening to the Qari repeat the verse and echoing aloud multiple times.",
        icon: "Volume2",
        weight: { auditory: 3, visual: 0, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "b",
        style: "visual",
        textAr: "النظر بدقة لصفحة المصحف، وتخيل التقسيم البصري والخرائط الذهنية وتلوين الكلمات.",
        textEn: "Looking intently at the Mushaf page, visualizing layout, colors, and mind maps.",
        icon: "Eye",
        weight: { auditory: 0, visual: 3, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "c",
        style: "kinesthetic",
        textAr: "كتابة الآيات على لوح أو ورقة، واستخدام السبحة الإلكترونية أو النقر للتكرار.",
        textEn: "Writing verses down on paper or board, using tasbeeh counter or physical taps.",
        icon: "Fingerprint",
        weight: { auditory: 0, visual: 0, kinesthetic: 3, analytical: 0 }
      },
      {
        id: "d",
        style: "analytical",
        textAr: "قراءة تفسير الآيات الصعبة أولاً وربط نهايات الآيات بمعانيها وبدايات الآيات التالية.",
        textEn: "Reading Tafsir of difficult words first and logically linking verse endings to beginnings.",
        icon: "BookOpen",
        weight: { auditory: 0, visual: 0, kinesthetic: 0, analytical: 3 }
      }
    ]
  },
  {
    id: 3,
    titleAr: "٣. ما هو العامل الأكبر الذي يشتت تركيزك ويجعلك تتعثر في حفظك؟",
    titleEn: "3. What factor distracts your concentration the most and causes slips?",
    options: [
      {
        id: "a",
        style: "auditory",
        textAr: "الضوضاء الخارجية، الأصوات المتداخلة، أو اضطراري للتسميع بصوت منخفض سراً.",
        textEn: "External noise, overlapping voices, or having to recite silently.",
        icon: "Volume2",
        weight: { auditory: 3, visual: 0, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "b",
        style: "visual",
        textAr: "تغيير طبعة المصحف التي اعتدت عليها بمصحف ذي ترتيب صفحات ومقاس مختلف.",
        textEn: "Switching the physical Mushaf edition to one with different page layouts.",
        icon: "Eye",
        weight: { auditory: 0, visual: 3, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "c",
        style: "kinesthetic",
        textAr: "الجلوس المتواصل لفترة طويلة دون حركة أو تفاعل عملي وكتابة.",
        textEn: "Sitting still for a long duration without physical motion, writing, or interaction.",
        icon: "Fingerprint",
        weight: { auditory: 0, visual: 0, kinesthetic: 3, analytical: 0 }
      },
      {
        id: "d",
        style: "analytical",
        textAr: "تشابه ألفاظ الآيات دون فهم سبب الاختلاف اللفظي بين هذا الموضع وموضع آخر.",
        textEn: "Similarities between verses without understanding the underlying wisdom and differences.",
        icon: "BookOpen",
        weight: { auditory: 0, visual: 0, kinesthetic: 0, analytical: 3 }
      }
    ]
  },
  {
    id: 4,
    titleAr: "٤. في الحصون الخمسة للمراجعة والتثبيت، ما الأسلوب المريح والممتع لك أكثر؟",
    titleEn: "4. In the Five Fortresses revision system, which medium feels most enjoyable and engaging?",
    options: [
      {
        id: "a",
        style: "auditory",
        textAr: "الاستماع للمصاحف المرتلة ومراجعة الحدر الصوتي أثناء المشي والسيارة.",
        textEn: "Listening to Qari recitations and audio Hadr revision while walking or commuting.",
        icon: "Volume2",
        weight: { auditory: 3, visual: 0, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "b",
        style: "visual",
        textAr: "مراجعة المصحف العيني والخرائط البصرية وتتبع تسلسل صفحات القرآن الملونة.",
        textEn: "Reviewing the visual Mushaf, colored page maps, and tracking visual layouts.",
        icon: "Eye",
        weight: { auditory: 0, visual: 3, kinesthetic: 0, analytical: 0 }
      },
      {
        id: "c",
        style: "kinesthetic",
        textAr: "التسميع التفاعلي مع عداد التكرار، واختبارات إكمال الفراغات وسحب الكلمات.",
        textEn: "Interactive recitation with clicker repetition counters and drag-and-drop word tests.",
        icon: "Fingerprint",
        weight: { auditory: 0, visual: 0, kinesthetic: 3, analytical: 0 }
      },
      {
        id: "d",
        style: "analytical",
        textAr: "جداول المتشابهات، والمقارنة البلاغية بين الآيات، ومحاور السورة الموضوعية.",
        textEn: "Similarity tables, thematic pillars of the Surah, and linguistic nuances.",
        icon: "BookOpen",
        weight: { auditory: 0, visual: 0, kinesthetic: 0, analytical: 3 }
      }
    ]
  }
];

// Calculation of dominant style from user answers
export const calculateLearningProfile = (answers = {}) => {
  const scores = {
    auditory: 0,
    visual: 0,
    kinesthetic: 0,
    analytical: 0
  };

  learningQuizQuestions.forEach((q) => {
    const selectedOptionId = answers[q.id];
    if (selectedOptionId) {
      const option = q.options.find(o => o.id === selectedOptionId);
      if (option && option.weight) {
        scores.auditory += option.weight.auditory || 0;
        scores.visual += option.weight.visual || 0;
        scores.kinesthetic += option.weight.kinesthetic || 0;
        scores.analytical += option.weight.analytical || 0;
      }
    }
  });

  const total = scores.auditory + scores.visual + scores.kinesthetic + scores.analytical || 1;

  const percentages = {
    auditory: Math.round((scores.auditory / total) * 100),
    visual: Math.round((scores.visual / total) * 100),
    kinesthetic: Math.round((scores.kinesthetic / total) * 100),
    analytical: Math.round((scores.analytical / total) * 100)
  };

  // Find dominant
  const sorted = [
    { key: 'auditory', score: scores.auditory },
    { key: 'visual', score: scores.visual },
    { key: 'kinesthetic', score: scores.kinesthetic },
    { key: 'analytical', score: scores.analytical }
  ].sort((a, b) => b.score - a.score);

  const top = sorted[0];
  const second = sorted[1];

  let styleLabelAr = 'سمعي بصري (مختلط)';
  let styleLabelEn = 'Audio-Visual (Mixed)';
  let recommendationAr = '';
  let recommendationEn = '';

  // Check if mixed or distinct
  if (Math.abs(top.score - second.score) <= 1 && top.score > 0) {
    if ((top.key === 'auditory' && second.key === 'visual') || (top.key === 'visual' && second.key === 'auditory')) {
      styleLabelAr = 'سمعي بصري (مختلط متوازن)';
      styleLabelEn = 'Balanced Audio-Visual (Mixed)';
      recommendationAr = 'دماغك يجمع بين قوة الأذن في التقاط نبرة التلاوة، وذاكرة العين في تذكر شكل الصفحة. ننصحك بالاستماع للشيخ أولاً ثم فتح صفحة المصحف للتثبيت.';
      recommendationEn = 'Your brain balances auditory rhythm with visual page recall. Listen first, then look at the Mushaf.';
    } else {
      styleLabelAr = 'مختلط شامل (متعدد الحواس)';
      styleLabelEn = 'Multi-Sensory Comprehensive';
      recommendationAr = 'تستفيد من الجمع بين التكرار الصوتي والكتابي والخرائط الذهنية.';
      recommendationEn = 'You benefit from combining listening, writing, and visual mind maps.';
    }
  } else if (top.key === 'auditory') {
    styleLabelAr = 'سمعي (صوتي)';
    styleLabelEn = 'Auditory (Audio-First)';
    recommendationAr = 'أنت حافظ ذو ذاكرة سمعية عالية! أفضل طريقة لك هي الاستماع للقارئ المتقن وتكرار التلاوة بصوت مسموع وتفعيل الحدر الصوتي.';
    recommendationEn = 'High auditory memory! Optimal path: listen to your Qari, repeat aloud, and rely on voice recitation.';
  } else if (top.key === 'visual') {
    styleLabelAr = 'بصري (مرئي)';
    styleLabelEn = 'Visual (Visual-First)';
    recommendationAr = 'أنت صاحب ذاكرة فوتوغرافية بصرية! احرص دائماً على الحفظ من طبعة مصحف واحدة ثابتة، واستعن بخريطة القرآن والخرائط الذهنية وتلوين نهايات الآيات.';
    recommendationEn = 'Photographic visual memory! Always use one single Mushaf edition, rely on Quran Maps and highlighted pages.';
  } else if (top.key === 'kinesthetic') {
    styleLabelAr = 'حركي وكتابي (تفاعلي)';
    styleLabelEn = 'Kinesthetic & Scribe';
    recommendationAr = 'تثبت حفظك بالعمل والتدوين! استخدم السبحة الإلكترونية للنقر، واكتب الآيات في الدفتر، وفعّل اختبارات السحب وإكمال الفراغات.';
    recommendationEn = 'Solidify through action! Write verses down, use the digital clicker counter, and practice drag-and-drop quizzes.';
  } else {
    styleLabelAr = 'تحليلي وتدبري (معرفي)';
    styleLabelEn = 'Analytical & Thematic';
    recommendationAr = 'حفظك يرتبط بقوة الفهم! اقرأ التفسير الميسر وأسباب النزول قبل الحفظ، واعتمد على جداول المتشابهات اللفظية لفك اللبس.';
    recommendationEn = 'Memorization thrives on comprehension! Read Tafsir first and study similarity tables.';
  }

  return {
    dominantKey: top.key,
    styleLabelAr,
    styleLabelEn,
    scores,
    percentages,
    recommendationAr,
    recommendationEn
  };
};
