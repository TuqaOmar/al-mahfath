import { spawn } from 'child_process';
import https from 'https';
import { GoogleGenAI } from '@google/genai';

/**
 * Strips verse numbers, parenthesis, brackets, pause symbols and extra punctuation
 */
export function cleanQuranText(text) {
  if (!text) return '';
  return text
    .replace(/[\u0660-\u0669\d]/g, '') // Arabic & Latin numerals
    .replace(/[﴿﴾\(\)\[\]«»"'""'']/g, '') // Quran brackets and quotes
    .replace(/[\u06D6-\u06ED]/g, '') // Quranic pause & annotation marks
    .replace(/[.,!\?،؟؛:]/g, ' ') // Punctuation
    .trim();
}

/**
 * Normalizes Muqatta'at (الحروف المقطعة) like "ألف لام ميم" to "الم"
 * to ensure spoken recitation accurately matches Quranic orthography.
 */
export function normalizeMuqattaatInText(text) {
  if (!text) return '';
  const B = '(?=$|[^\\u0621-\\u064A])';
  return text
    // ألف لام ميم صاد -> المص
    .replace(new RegExp('(?:ألف|الف)\\s+لام\\s+ميم\\s+صاد' + B, 'g'), 'المص')
    // ألف لام ميم را -> المر
    .replace(new RegExp('(?:ألف|الف)\\s+لام\\s+ميم\\s+(?:را|راء|ر)' + B, 'g'), 'المر')
    // ألف لام ميم -> الم
    .replace(new RegExp('(?:ألف|الف)\\s+لام\\s+ميم' + B, 'g'), 'الم')
    // ألف لام را -> الر
    .replace(new RegExp('(?:ألف|الف)\\s+لام\\s+(?:را|راء|ر)' + B, 'g'), 'الر')
    // كاف ها يا عين صاد -> كهيعص
    .replace(new RegExp('كاف\\s+ها\\s+يا\\s+عين\\s+صاد' + B, 'g'), 'كهيعص')
    // طا سين ميم -> طسم
    .replace(new RegExp('طا\\s+سين\\s+ميم' + B, 'g'), 'طسم')
    // طا سين -> طس
    .replace(new RegExp('طا\\s+سين' + B, 'g'), 'طس')
    // طا ها -> طه
    .replace(new RegExp('طا\\s+ها' + B, 'g'), 'طه')
    // يا سين -> يس
    .replace(new RegExp('يا\\s+سين' + B, 'g'), 'يس')
    // عين سين قاف -> عسق
    .replace(new RegExp('عين\\s+سين\\s+قاف' + B, 'g'), 'عسق')
    // حا ميم -> حم
    .replace(new RegExp('حا\\s+ميم' + B, 'g'), 'حم')
    // صاد / قاف / نون منفردة
    .replace(new RegExp('(?:^|\\s)صاد' + B, 'g'), ' ص')
    .replace(new RegExp('(?:^|\\s)قاف' + B, 'g'), ' ق')
    .replace(new RegExp('(?:^|\\s)نون' + B, 'g'), ' ن');
}

/**
 * Determines score label, badge color and icon based on accuracy
 */
export function getRatingColor(score) {
  if (score >= 95) {
    return { rating: 'ممتاز ومتقن تماماً (ما شاء الله)', color: '#059669', icon: '🌟' };
  } else if (score >= 85) {
    return { rating: 'جيد جداً (حفظ متين)', color: '#10B981', icon: '🌿' };
  } else if (score >= 70) {
    return { rating: 'جيد (مع وجود ملاحظات تحتاج تثبيتاً)', color: '#D97706', icon: '📖' };
  } else {
    return { rating: 'يحتاج مراجعة وتثبيتاً', color: '#DC2626', icon: '⚠️' };
  }
}

/**
 * Normalizes Quranic Arabic text for accurate sequence matching
 */
export function normalizeQuran(text) {
  if (!text) return '';
  return text
    .replace(/[\u06D6-\u06ED]/g, '') // Quranic pause & annotation marks
    .replace(/\u0671/g, 'ا') // Alif Wasl ٱ -> ا
    .replace(/و\u0670/g, 'ا') // صلوٰة -> صلاة, زكوٰة -> زكاة, حيوٰة -> حياة
    .replace(/\u0670/g, '') // Dagger Alif (e.g. الرحمٰن -> الرحمن, عَلَىٰ -> على)
    .replace(/[\u064B-\u065F]/g, '') // Harakat (Tashkeel)
    .replace(/ء[\u064E\u0670]?([اٱآ])/g, 'ا') // Uthmani ءَا / ءا -> آ / ا (e.g. وبالءاخرة -> وبالاخرة)
    .replace(/ء[اٱآ]/g, 'ا') // Fallback for ءا
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0621-\u064A\s]/g, '') // Keep Arabic letters and spaces
    .trim();
}

/**
 * Extracts diacritics and the last consonant's harakah (حركة الإعراب)
 */
export function extractHarakat(word) {
  if (!word) return { hasAny: false, list: [], string: '', lastHarakah: null };
  const harakatRegex = /[\u064B-\u0652]/g;
  const matches = word.match(harakatRegex) || [];

  let lastHarakah = null;
  // Search backward for the last vowel mark
  for (let i = word.length - 1; i >= 0; i--) {
    const charCode = word.charCodeAt(i);
    if (charCode >= 0x064B && charCode <= 0x0652) {
      lastHarakah = word[i];
      break;
    }
  }

  return {
    hasAny: matches.length > 0,
    list: matches,
    string: matches.join(''),
    lastHarakah
  };
}

/**
 * Friendly Arabic description for vowel marks
 */
export function describeHarakah(h) {
  switch (h) {
    case '\u064E': return 'فتحة (ـَ)';
    case '\u064F': return 'ضمة (ـُ)';
    case '\u0650': return 'كسرة (ـِ)';
    case '\u064B': return 'تنوين فتح (ـً)';
    case '\u064C': return 'تنوين ضم (ـٌ)';
    case '\u064D': return 'تنوين كسر (ـٍ)';
    case '\u0651': return 'شدّة (ـّ)';
    case '\u0652': return 'سكون (ـْ)';
    default: return h || 'بلا تشكيل';
  }
}

/**
 * Strict check for word equivalence in Quranic recitation.
 * Grammatical differences (e.g. المؤمنون vs المؤمنين or مؤمنين vs المؤمنين)
 * MUST NOT match.
 */
export function areWordsEquivalent(w1, w2) {
  const n1 = normalizeQuran(w1);
  const n2 = normalizeQuran(w2);
  if (n1 === n2) return true;

  // Strict inflectional check:
  // If one ends in 'ون' and other in 'ين', they are NOT equivalent!
  if ((n1.endsWith('ون') && n2.endsWith('ين')) || (n1.endsWith('ين') && n2.endsWith('ون'))) {
    return false;
  }
  // If one ends in 'ان' and other in 'ين' (Dual), they are NOT equivalent!
  if ((n1.endsWith('ان') && n2.endsWith('ين')) || (n1.endsWith('ين') && n2.endsWith('ان'))) {
    return false;
  }
  // If one has definite article 'ال' and other does not, they are NOT equivalent!
  if (n1.startsWith('ال') !== n2.startsWith('ال')) {
    return false;
  }

  // Handle pure Uthmani script dagger alif omissions only (e.g. صلحين vs صالحين)
  // where the difference is only internal alif and length difference is 1
  if (Math.abs(n1.length - n2.length) === 1 && n1.replace(/ا/g, '') === n2.replace(/ا/g, '')) {
    return true;
  }

  return false;
}

/**
 * Checks if a string contains Arabic vowels/diacritics
 */
export function hasDiacritics(text) {
  return /[\u064B-\u0652]/.test(text);
}

/**
 * Deep morphological & diacritic analysis comparing expected vs spoken word.
 * Specifically catches:
 * 1. جمع المذكر السالم (المؤمنون vs المؤمنين)
 * 2. حذف أو زيادة أداة التعريف (مؤمنين vs المؤمنين)
 * 3. حركات الإعراب الأخيرة (لحن جلي في آخر الكلمة)
 * 4. أحرف العطف والضمائر
 */
export function checkWordPrecision(expWord, spkWord) {
  const nExp = normalizeQuran(expWord);
  const nSpk = normalizeQuran(spkWord);

  // 1. Grammatical and inflectional checks
  if (nExp !== nSpk) {
    // a) جمع المذكر السالم: ون vs ين
    if (
      (nExp.endsWith('ين') && nSpk.endsWith('ون')) ||
      (nExp.endsWith('ون') && nSpk.endsWith('ين'))
    ) {
      const expEnding = nExp.endsWith('ين') ? 'بالياء' : 'بالواو';
      const spkEnding = nSpk.endsWith('ون') ? 'بالواو' : 'بالياء';
      return {
        match: false,
        status: 'grammar_error',
        severity: 'major',
        message: `خطأ إعرابي وتصريفي (لحن جلي): المتوقع [${expWord}] ${expEnding} ونطقت [${spkWord}] ${spkEnding}`
      };
    }

    // b) المثنى: ان vs ين
    if (
      (nExp.endsWith('ان') && nSpk.endsWith('ين')) ||
      (nExp.endsWith('ين') && nSpk.endsWith('ان'))
    ) {
      return {
        match: false,
        status: 'grammar_error',
        severity: 'major',
        message: `خطأ إعرابي في التثنية: المتوقع [${expWord}] ونطقت [${spkWord}]`
      };
    }

    // c) أداة التعريف (الـ)
    if (nExp.startsWith('ال') && !nSpk.startsWith('ال')) {
      return {
        match: false,
        status: 'grammar_error',
        severity: 'major',
        message: `حذف أداة التعريف (الـ): المتوقع [${expWord}] ونطقت نكرة [${spkWord}]`
      };
    }
    if (!nExp.startsWith('ال') && nSpk.startsWith('ال')) {
      return {
        match: false,
        status: 'grammar_error',
        severity: 'major',
        message: `زيادة أداة التعريف (الـ): المتوقع نكرة [${expWord}] ونطقت معرفة [${spkWord}]`
      };
    }

    // d) الضمائر المتصلة (هم vs كم vs نا vs ها)
    const suffixes = ['هم', 'كم', 'نا', 'ها', 'ه', 'هما', 'تم'];
    for (const s1 of suffixes) {
      for (const s2 of suffixes) {
        if (s1 !== s2 && nExp.endsWith(s1) && nSpk.endsWith(s2)) {
          const b1 = nExp.slice(0, -s1.length);
          const b2 = nSpk.slice(0, -s2.length);
          if (b1 === b2) {
            return {
              match: false,
              status: 'grammar_error',
              severity: 'major',
              message: `خطأ في الضمير المتصل: المتوقع [${expWord}] ونطقت [${spkWord}]`
            };
          }
        }
      }
    }

    // e) أحرف العطف والجر في البداية (و، ف، ب، ل)
    const prefixes = ['و', 'ف', 'ب', 'ل'];
    for (const p of prefixes) {
      if (nExp.startsWith(p) && !nSpk.startsWith(p) && nExp.slice(1) === nSpk) {
        return {
          match: false,
          status: 'grammar_error',
          severity: 'major',
          message: `إسقاط حرف [${p}]: المتوقع [${expWord}] ونطقت [${spkWord}]`
        };
      }
      if (!nExp.startsWith(p) && nSpk.startsWith(p) && nSpk.slice(1) === nExp) {
        return {
          match: false,
          status: 'grammar_error',
          severity: 'major',
          message: `زيادة حرف [${p}]: المتوقع [${expWord}] ونطقت [${spkWord}]`
        };
      }
    }

    // f) Uthmani internal alif variant (like صلحين vs صالحين)
    if (Math.abs(nExp.length - nSpk.length) === 1 && nExp.replace(/ا/g, '') === nSpk.replace(/ا/g, '')) {
      // Allowed Uthmani script variant
    } else {
      return {
        match: false,
        status: 'word_error',
        severity: 'major',
        message: `استبدال كلمة: المتوقع [${expWord}] والمنطوق [${spkWord}]`
      };
    }
  }

  // 2. Diacritics & Tashkeel checking (الحركات)
  const expH = extractHarakat(expWord);
  const spkH = extractHarakat(spkWord);

  if (spkH.hasAny) {
    // Check last letter vowel (حركة الإعراب - لحن جلي)
    if (expH.lastHarakah && spkH.lastHarakah && expH.lastHarakah !== spkH.lastHarakah) {
      return {
        match: false,
        status: 'diacritic_error',
        severity: 'major',
        message: `لحن جلي في حركة الإعراب الأخيرة: المتوقع ${describeHarakah(expH.lastHarakah)} ونطقت ${describeHarakah(spkH.lastHarakah)} في كلمة [${expWord}]`
      };
    }

    // Check overall diacritic harmony
    if (expH.string !== spkH.string) {
      return {
        match: false,
        status: 'diacritic_error',
        severity: 'minor',
        message: `اختلاف في تشكيل الكلمة: المتوقع [${expWord}] ونطقت [${spkWord}]`
      };
    }
  }

  return {
    match: true,
    status: 'correct',
    severity: 'none',
    message: 'نطق سليم تام'
  };
}

/**
 * Builds a structured, educational list of exact recitation mistakes with clear Arabic guidance.
 */
function buildMistakesList(results) {
  if (!results || !Array.isArray(results)) return [];
  return results
    .filter(r => r.status && r.status !== 'correct')
    .map((r, idx) => {
      let typeLabel = 'خطأ في الحفظ';
      let correctionTip = '';
      
      switch (r.status) {
        case 'grammar_error':
          typeLabel = 'لحن جلي (إعراب وتصريف)';
          correctionTip = `تثبت من ضبط أواخر الكلمات وحركات الإعراب: «${r.expected}»`;
          break;
        case 'word_error':
          typeLabel = 'استبدال كلمة بأخرى';
          correctionTip = `انتبه لاستبدال المفردات، الكلمة القرآنية الصحيحة هي: «${r.expected}»`;
          break;
        case 'missing_word':
          typeLabel = 'كلمة منسية (سقطت من الحفظ)';
          correctionTip = `سقطت هذه الكلمة أثناء التسميع، لا تنسَ قراءتها: «${r.expected}»`;
          break;
        case 'extra_word':
          typeLabel = 'زيادة كلمة ليست في الآية';
          correctionTip = `احذف هذه الزيادة والتزم بالنص القرآني دون زيادة: «${r.spoken}»`;
          break;
        case 'diacritic_error':
          typeLabel = 'خطأ تشكيل وحركات';
          correctionTip = `اضبط الحركة الصوتية كما هي في رسم المصحف: «${r.expected}»`;
          break;
        default:
          typeLabel = 'ملاحظة نطق';
          correctionTip = `المتوقع قراءة: «${r.expected}»`;
      }

      return {
        id: `mistake-${idx + 1}`,
        ayahNumber: r.ayahNumber || null,
        numberInSurah: r.numberInSurah || null,
        surahName: r.surahName || null,
        expected: r.expected || '—',
        spoken: r.spoken || 'لم تُذكر (سقطت)',
        type: r.status,
        typeLabel,
        message: r.message || `المتوقع: [${r.expected}] - المنطوق: [${r.spoken || 'فارغ'}]`,
        correctionTip,
        severity: r.severity || 'minor'
      };
    });
}

/**
 * Compares expected Quranic verse against spoken/transcribed text
 * using sequence matching (LCS) and detailed opcode analysis
 */
export function compareRecitation(expectedText, spokenText) {
  // Pre-normalize spoken text for Muqatta'at (e.g. "ألف لام ميم" -> "الم")
  const processedSpoken = normalizeMuqattaatInText(cleanQuranText(spokenText));

  // Handle opening Basmalah if user recited without it
  const basmalahPattern = /^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s+/;
  const spokenHasBasmalah = /^(?:بِسْمِ|بسم|باسم)\s+(?:ٱللَّهِ|الله|الاه)/.test(processedSpoken.trim());
  let cleanExp = cleanQuranText(expectedText);
  if (basmalahPattern.test(cleanExp) && !spokenHasBasmalah) {
    cleanExp = cleanExp.replace(basmalahPattern, '');
  }

  const cleanSpk = processedSpoken;
  const expWords = cleanExp.split(/\s+/).filter(Boolean);
  const spkWords = cleanSpk.split(/\s+/).filter(Boolean);

  const expNorm = expWords.map(normalizeQuran);
  const spkNorm = spkWords.map(normalizeQuran);

  const m = expNorm.length;
  const n = spkNorm.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (areWordsEquivalent(expWords[i - 1], spkWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m, j = n;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && areWordsEquivalent(expWords[i - 1], spkWords[j - 1])) {
      ops.unshift({ type: 'equal', exp: expWords[i - 1], spk: spkWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', exp: '', spk: spkWords[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'delete', exp: expWords[i - 1], spk: '' });
      i--;
    }
  }

  const results = [];
  for (let k = 0; k < ops.length; k++) {
    const curr = ops[k];
    const next = ops[k + 1];

    if (curr.type === 'delete' && next && next.type === 'insert') {
      const precision = checkWordPrecision(curr.exp, next.spk);
      results.push({
        expected: curr.exp,
        spoken: next.spk,
        status: precision.status,
        severity: precision.severity,
        message: precision.message
      });
      k++; // Skip next
    } else if (curr.type === 'equal') {
      const precision = checkWordPrecision(curr.exp, curr.spk);
      results.push({
        expected: curr.exp,
        spoken: curr.spk,
        status: precision.status,
        severity: precision.severity,
        message: precision.message
      });
    } else if (curr.type === 'delete') {
      results.push({
        expected: curr.exp,
        spoken: '',
        status: 'missing_word',
        severity: 'major',
        message: `كلمة منسية لم تُذكر: [${curr.exp}]`
      });
    } else if (curr.type === 'insert') {
      results.push({
        expected: '',
        spoken: curr.spk,
        status: 'extra_word',
        severity: 'minor',
        message: `زيادة كلمة ليست من الآية: [${curr.spk}]`
      });
    }
  }

  const correctCount = results.filter(r => r.status === 'correct').length;
  const diacriticCount = results.filter(r => r.status === 'diacritic_error').length;
  const grammarCount = results.filter(r => r.status === 'grammar_error').length;
  const missingCount = results.filter(r => r.status === 'missing_word').length;
  const errorCount = results.filter(r => r.status === 'word_error').length;
  const extraCount = results.filter(r => r.status === 'extra_word').length;

  const totalWords = expWords.length || 1;
  const penalty = (grammarCount * 1.0) + (errorCount * 1.0) + (missingCount * 1.0) + (diacriticCount * 0.4) + (extraCount * 0.3);
  const rawScore = Math.round(Math.max(0, (totalWords - penalty) / totalWords) * 100);
  const accuracy = Math.max(0, Math.min(100, rawScore));

  let rating = 'يحتاج تثبيت ومراجعة';
  let ratingColor = '#DC2626';
  let ratingIcon = '⚠️';
  if (accuracy >= 95) {
    rating = 'ممتاز ومتقن تماماً (ما شاء الله)';
    ratingColor = '#059669';
    ratingIcon = '🌟';
  } else if (accuracy >= 85) {
    rating = 'جيد جداً (حفظ متين)';
    ratingColor = '#10B981';
    ratingIcon = '🌿';
  } else if (accuracy >= 70) {
    rating = 'جيد (مع وجود تعثرات أو كلمات منسية)';
    ratingColor = '#D97706';
    ratingIcon = '📖';
  }

  const mistakes = buildMistakesList(results);

  return {
    accuracy,
    rating,
    ratingColor,
    ratingIcon,
    results,
    mistakes,
    originalExpected: expectedText,
    transcribedSpoken: cleanSpk,
    stats: {
      totalWords,
      correctCount,
      grammarCount,
      diacriticCount,
      missingCount,
      errorCount,
      extraCount
    }
  };
}

/**
 * Comprehensive Full Page Recitation Evaluation.
 * Compares continuous spoken recitation across all ayahs of a Quran page.
 * Returns both global page accuracy and per-ayah scores.
 */
export function comparePageRecitation(ayahs, spokenText) {
  if (!ayahs || ayahs.length === 0) {
    return compareRecitation('', spokenText);
  }

  // Pre-normalize spoken text for Muqatta'at (e.g. "ألف لام ميم" -> "الم")
  const processedSpoken = normalizeMuqattaatInText(cleanQuranText(spokenText));

  // Check if first ayah has opening Basmalah (Surah start other than Al-Fatiha)
  const firstAyah = ayahs[0];
  const basmalahPattern = /^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s+/;
  const spokenHasBasmalah = /^(?:بِسْمِ|بسم|باسم)\s+(?:ٱللَّهِ|الله|الاه)/.test(processedSpoken.trim());

  let processedAyahs = ayahs;
  if (firstAyah && firstAyah.numberInSurah === 1 && firstAyah.surah?.number !== 1) {
    if (basmalahPattern.test(firstAyah.text) && !spokenHasBasmalah) {
      // User did not recite the opening Basmalah; don't penalize as 4 missing words
      processedAyahs = ayahs.map((a, idx) => {
        if (idx === 0) {
          return {
            ...a,
            text: a.text.replace(basmalahPattern, '')
          };
        }
        return a;
      });
    }
  }

  // 1. Build flattened word list tagged with ayah metadata
  const pageWords = [];
  processedAyahs.forEach((ayah, aIdx) => {
    const cleanA = cleanQuranText(ayah.text);
    const words = cleanA.split(/\s+/).filter(Boolean);
    words.forEach((w, wIdx) => {
      pageWords.push({
        expectedWord: w,
        wordIndex: wIdx,
        ayahIndex: aIdx,
        ayahNumber: ayah.number,
        numberInSurah: ayah.numberInSurah,
        surahName: ayah.surah?.name || 'سورة الشريفة',
        surahNumber: ayah.surah?.number || 1
      });
    });
  });

  const fullExpectedText = processedAyahs.map(a => a.text).join(' ');
  const cleanSpk = processedSpoken;
  const spkWords = cleanSpk.split(/\s+/).filter(Boolean);

  const expNorm = pageWords.map(pw => normalizeQuran(pw.expectedWord));
  const spkNorm = spkWords.map(normalizeQuran);

  const m = expNorm.length;
  const n = spkNorm.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (areWordsEquivalent(pageWords[i - 1].expectedWord, spkWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m, j = n;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && areWordsEquivalent(pageWords[i - 1].expectedWord, spkWords[j - 1])) {
      ops.unshift({ type: 'equal', expObj: pageWords[i - 1], spk: spkWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', expObj: null, spk: spkWords[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'delete', expObj: pageWords[i - 1], spk: '' });
      i--;
    }
  }

  const results = [];
  for (let k = 0; k < ops.length; k++) {
    const curr = ops[k];
    const next = ops[k + 1];

    if (curr.type === 'delete' && next && next.type === 'insert') {
      const precision = checkWordPrecision(curr.expObj.expectedWord, next.spk);
      results.push({
        expected: curr.expObj.expectedWord,
        spoken: next.spk,
        ayahNumber: curr.expObj.ayahNumber,
        numberInSurah: curr.expObj.numberInSurah,
        surahName: curr.expObj.surahName,
        status: precision.status,
        severity: precision.severity,
        message: precision.message
      });
      k++;
    } else if (curr.type === 'equal') {
      const precision = checkWordPrecision(curr.expObj.expectedWord, curr.spk);
      results.push({
        expected: curr.expObj.expectedWord,
        spoken: curr.spk,
        ayahNumber: curr.expObj.ayahNumber,
        numberInSurah: curr.expObj.numberInSurah,
        surahName: curr.expObj.surahName,
        status: precision.status,
        severity: precision.severity,
        message: precision.message
      });
    } else if (curr.type === 'delete') {
      results.push({
        expected: curr.expObj.expectedWord,
        spoken: '',
        ayahNumber: curr.expObj.ayahNumber,
        numberInSurah: curr.expObj.numberInSurah,
        surahName: curr.expObj.surahName,
        status: 'missing_word',
        severity: 'major',
        message: `كلمة منسية لم تُذكر: [${curr.expObj.expectedWord}]`
      });
    } else if (curr.type === 'insert') {
      results.push({
        expected: '',
        spoken: curr.spk,
        ayahNumber: null,
        numberInSurah: null,
        surahName: null,
        status: 'extra_word',
        severity: 'minor',
        message: `زيادة كلمة ليست من الآية: [${curr.spk}]`
      });
    }
  }

  // Calculate per-ayah breakdown
  const ayahBreakdown = processedAyahs.map((ayah) => {
    const aResults = results.filter(r => r.ayahNumber === ayah.number);
    const cleanA = cleanQuranText(ayah.text);
    const aWords = cleanA.split(/\s+/).filter(Boolean);
    const totalWords = aWords.length || 1;

    const correct = aResults.filter(r => r.status === 'correct').length;
    const grammar = aResults.filter(r => r.status === 'grammar_error').length;
    const wordErr = aResults.filter(r => r.status === 'word_error').length;
    const missing = aResults.filter(r => r.status === 'missing_word').length;
    const diacritic = aResults.filter(r => r.status === 'diacritic_error').length;

    const penalty = (grammar * 1.0) + (wordErr * 1.0) + (missing * 1.0) + (diacritic * 0.4);
    const accuracy = Math.max(0, Math.min(100, Math.round(((totalWords - penalty) / totalWords) * 100)));

    const mistakes = buildMistakesList(aResults);

    return {
      ayahNumber: ayah.number,
      numberInSurah: ayah.numberInSurah,
      surahName: ayah.surah?.name || 'سورة الشريفة',
      text: ayah.text,
      totalWords,
      correctCount: correct,
      accuracy,
      status: accuracy >= 85 ? 'memorized' : (accuracy >= 65 ? 'needs_review' : 'weak'),
      mistakes,
      results: aResults
    };
  });

  const totalPageWords = pageWords.length || 1;
  const correctCount = results.filter(r => r.status === 'correct').length;
  const grammarCount = results.filter(r => r.status === 'grammar_error').length;
  const diacriticCount = results.filter(r => r.status === 'diacritic_error').length;
  const missingCount = results.filter(r => r.status === 'missing_word').length;
  const errorCount = results.filter(r => r.status === 'word_error').length;
  const extraCount = results.filter(r => r.status === 'extra_word').length;

  const totalPenalty = (grammarCount * 1.0) + (errorCount * 1.0) + (missingCount * 1.0) + (diacriticCount * 0.4) + (extraCount * 0.3);
  const pageAccuracy = Math.max(0, Math.min(100, Math.round(((totalPageWords - totalPenalty) / totalPageWords) * 100)));

  let rating = 'يحتاج تثبيت ومراجعة';
  let ratingColor = '#DC2626';
  let ratingIcon = '⚠️';
  if (pageAccuracy >= 95) {
    rating = 'ممتاز ومتقن تماماً (ما شاء الله)';
    ratingColor = '#059669';
    ratingIcon = '🌟';
  } else if (pageAccuracy >= 85) {
    rating = 'جيد جداً (حفظ متين)';
    ratingColor = '#10B981';
    ratingIcon = '🌿';
  } else if (pageAccuracy >= 70) {
    rating = 'جيد (مع وجود تعثرات أو كلمات منسية)';
    ratingColor = '#D97706';
    ratingIcon = '📖';
  }

  const mistakes = buildMistakesList(results);

  return {
    isFullPage: true,
    pageAccuracy,
    accuracy: pageAccuracy,
    rating,
    ratingColor,
    ratingIcon,
    results,
    mistakes,
    ayahBreakdown,
    originalExpected: fullExpectedText,
    transcribedSpoken: cleanSpk,
    stats: {
      totalWords: totalPageWords,
      correctCount,
      grammarCount,
      diacriticCount,
      missingCount,
      errorCount,
      extraCount
    }
  };
}

/**
 * Converts audio buffer to 16kHz WAV mono using ffmpeg
 */
export async function convertTo16kHzWav(audioBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      'pipe:1'
    ]);

    const chunks = [];
    const errors = [];

    ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
    ffmpeg.stderr.on('data', err => errors.push(err));

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`FFmpeg error (code ${code}): ${Buffer.concat(errors).toString()}`));
      }
    });

    ffmpeg.stdin.write(audioBuffer);
    ffmpeg.stdin.end();
  });
}

/**
 * Direct Multimodal Quran Recitation Evaluation using modern Gemini Flash models.
 * Listens directly to audio and compares against expected Quranic text with diacritics,
 * detecting grammatical errors (لحن جلي), tashkeel/diacritic slips, word substitutions, and skipped words.
 */
export async function evaluateRecitationAudioDirect(audioBuffer, expectedText, ayahs = [], isFullPage = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const candidateModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];
  const base64Audio = audioBuffer.toString('base64');

  const prompt = `أنت شيخ ومقرئ قرآن مجاز ومحكّم متقن في مسابقات القرآن الكريم العالمية.
المطلوب منك فحص التسجيل الصوتي المرفق لتلاوة الطالب بدقة وحزم تامين، ومقارنته بالنص القرآني المرجعي المشكول.

النص القرآني المرجعي المطلوب تلاوته ${isFullPage ? 'للصفحة كاملة' : 'للآيات'}:
«${expectedText}»

تعليمات التحكيم القرآني الصارمة:
1. استمع للتسجيل الصوتي بدقة متناهية، واكتب ما تلفظ به الطالب حرفياً في حقل "transcribedText" مع حركاته المنطوقة.
2. تحذير حاسم: إياك والتصحيح التلقائي للطالب! إذا نطق كلمة خطأ أو بدّل حرفاً أو لحن في حركة إعراب (مثلاً ضم موضع الفتح أو النصب، أو قال "المؤمنون" بدل "المؤمنين")، أو أسقط كلمة؛ فاكتب خطأه الصريح كما نطق به لسانه دون تجميل.
3. رصد كل موضع خطأ في مصفوفة "mistakes" مع تحديد:
   - expected: الكلمة الصحيحة في القرآن الكريم.
   - spoken: الكلمة الخاطئة كما نطقها الطالب فعلياً (أو "كلمة منسية لم تُنطق").
   - type: أحد الأنواع التالية بدقة:
     * "grammar_error" (لحن جلي في الإعراب أو تصريف الحروف مثل رفع المنصوب أو إبدال الواو بالياء).
     * "diacritic_error" (خطأ في حركة إعرابية أو تشكيل الحرف كفتح بدل كسر أو ضم).
     * "word_error" (استبدال كلمة قرآنية بكلمة أخرى).
     * "missing_word" (نسيان أو إسقاط كلمة من الآية).
   - typeLabel: وصف عربي واضح للخطأ.
   - message: شرح دقيق للخطأ النحوي أو الصرفي.
   - correctionTip: نصيحة توجيهية لكيفية نطقها بالصواب.
4. احسب نسبة الإتقان "accuracy" كنسبة مئوية حقيقية (0 إلى 100) تخصم منها درجات عن كل لحن جلي أو كلمة مفقودة أو حركة خاطئة.

أخرج النتيجة بصيغة JSON فقط بالهيكل الآتي:
{
  "accuracy": 85,
  "transcribedText": "النص المنطوق الفعلي كما خرج من صوت الطالب",
  "mistakes": [
    {
      "expected": "الكلمة الصحيحة",
      "spoken": "ما نطق به الطالب",
      "type": "diacritic_error",
      "typeLabel": "لحن جلي في حركة الإعراب",
      "message": "شرح الخطأ",
      "correctionTip": "كيفية الصواب"
    }
  ],
  "overallFeedback": "تقييم عام وتوجيه القارئ للتثبيت"
}`;

  for (const model of candidateModels) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType: 'audio/webm',
              data: base64Audio
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (typeof parsed.accuracy === 'number' && parsed.transcribedText) {
          console.log(`[RecitationEngine] Direct evaluation succeeded with model: ${model}`);
          return {
            ...parsed,
            modelUsed: `gemini-${model}-evaluator`
          };
        }
      }
    } catch (err) {
      console.warn(`[RecitationEngine] Direct evaluation with model ${model} notice:`, err.message);
    }
  }

  return null;
}

/**
 * Transcribes audio buffer using Gemini multimodal API as fallback
 */
export async function transcribeWithGemini(audioBuffer, expectedHint, isFullPage = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const candidateModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64Audio = audioBuffer.toString('base64');
    const prompt = `أنت مصحح ومقرئ قرآن خبير ودقيق جداً. مهمتك هي التفريغ الصوتي الحرفي الدقيق لتلاوة القارئ.
قواعد إلزامية صارمة:
1. اكتب كل كلمة نطق بها القارئ حرفياً كما خرجت من فمه دون أي تعديل أو تصحيح تلقائي.
2. إذا أخطأ القارئ أو لحن (مثال: قال "المؤمنون" بدل "المؤمنين"، أو حذف "ال"، أو أبدل حركة إعراب كأن ضم موضع الكسر، أو أسقط كلمة، أو كرّر كلمة)، اكتب ما قاله هو حرفياً بأمانة صوتية تامة ولا تعطه النص الصحيح!
3. اكتب النص القرآني المنطوق فقط، دون أي مقدمات أو تعليقات أو علامات ترقيم زائدة.

النص المرجعي ${isFullPage ? 'للصفحة كاملة' : 'للآيات'} للمساعدة في استرشاد السياق القرآني فقط هو:
${expectedHint || ''}`;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: base64Audio
              }
            },
            { text: prompt }
          ],
          config: {
            temperature: 0.0
          }
        });

        if (response && response.text && response.text.trim()) {
          return {
            model: `gemini-${model}`,
            text: response.text.trim()
          };
        }
      } catch (err) {
        console.warn(`[RecitationEngine] Gemini model ${model} notice:`, err.message);
      }
    }
  } catch (e) {
    console.warn('[RecitationEngine] Gemini audio transcription notice:', e.message);
  }
  return null;
}

/**
 * Transcribes audio buffer using Hugging Face Inference API
 */
export async function transcribeWithHuggingFace(wavBuffer, token) {
  const hfToken = token || process.env.HUGGINGFACE_TOKEN || '';

  const models = [
    'tarteel-ai/whisper-base-ar-quran',
    'openai/whisper-large-v3-turbo',
    'openai/whisper-large-v3'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const result = await new Promise((resolve, reject) => {
        const url = `https://router.huggingface.co/hf-inference/models/${model}`;
        const req = https.request(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'audio/wav'
          },
          timeout: 6000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ model, text: parsed.text || '' });
              } else {
                reject(new Error(`Model ${model} returned ${res.statusCode}: ${data}`));
              }
            } catch (e) {
              reject(new Error(`Parse error for ${model}: ${data}`));
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Timeout contacting model ${model}`));
        });

        req.write(wavBuffer);
        req.end();
      });

      if (result && result.text) {
        return result;
      }
    } catch (err) {
      console.warn(`[RecitationEngine] Model ${model} attempt failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Hugging Face ASR model endpoints failed.');
}

/**
 * Complete recitation analysis pipeline supporting both single Ayah and Full Page Recitation.
 */
export async function analyzeRecitation({ audioBuffer, expectedText, ayahs = [], isFullPage = false, token }) {
  // 1. Direct Multimodal Quran Evaluation with modern Gemini Flash (examines raw audio + diacritics)
  if (process.env.GEMINI_API_KEY) {
    try {
      const directEval = await evaluateRecitationAudioDirect(audioBuffer, expectedText, ayahs, isFullPage);
      if (directEval && typeof directEval.accuracy === 'number') {
        // Also build comparison results for word-by-word visual coloring
        let comparison;
        if (isFullPage && ayahs && ayahs.length > 0) {
          comparison = comparePageRecitation(ayahs, directEval.transcribedText);
        } else {
          comparison = compareRecitation(expectedText, directEval.transcribedText);
        }

        // Merge direct expert mistakes if provided, otherwise use algorithmic mistakes
        const mistakes = (directEval.mistakes && directEval.mistakes.length > 0)
          ? directEval.mistakes
          : (comparison.mistakes || []);

        const ratingInfo = getRatingColor(directEval.accuracy);

        return {
          accuracy: directEval.accuracy,
          pageAccuracy: directEval.accuracy,
          rating: ratingInfo.rating,
          ratingColor: ratingInfo.color,
          ratingIcon: ratingInfo.icon,
          results: comparison.results || [],
          mistakes,
          ayahBreakdown: comparison.ayahBreakdown || [],
          originalExpected: isFullPage ? ayahs.map(a => a.text).join(' ') : expectedText,
          transcribedSpoken: directEval.transcribedText,
          overallFeedback: directEval.overallFeedback,
          modelUsed: directEval.modelUsed,
          stats: comparison.stats || {
            totalExpected: 0,
            totalSpoken: 0,
            correct: 0,
            wordErrors: mistakes.length,
            diacriticErrors: 0,
            missingWords: 0
          }
        };
      }
    } catch (evalErr) {
      console.warn('[RecitationEngine] Direct Gemini recitation evaluation notice:', evalErr.message);
    }
  }

  let transcribedText = '';
  let modelUsed = 'gemini-voice';

  // 2. Fallback: Transcribe with Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiRes = await transcribeWithGemini(audioBuffer, expectedText, isFullPage);
      if (geminiRes && geminiRes.text) {
        transcribedText = geminiRes.text.trim();
        modelUsed = geminiRes.model;
      }
    } catch (geminiErr) {
      console.warn('[RecitationEngine] Gemini direct ASR notice:', geminiErr.message);
    }
  }

  // 2. Fallback to Hugging Face Whisper if Gemini did not produce text
  if (!transcribedText) {
    try {
      let wavBuffer;
      try {
        wavBuffer = await convertTo16kHzWav(audioBuffer);
      } catch (err) {
        wavBuffer = audioBuffer;
      }
      const hfRes = await transcribeWithHuggingFace(wavBuffer, token);
      if (hfRes && hfRes.text) {
        transcribedText = hfRes.text.trim();
        modelUsed = hfRes.model;
      }
    } catch (hfErr) {
      console.warn('[RecitationEngine] Hugging Face fallback notice:', hfErr.message);
    }
  }

  if (!transcribedText) {
    throw new Error('تعذر تحويل الصوت إلى نص بدقة. يُرجى التحقق من نقاء ميكروفون جهازك والقراءة بترتيل واضح.');
  }

  // 3. Comparison mode: Full Page or Single Ayah
  let comparison;
  if (isFullPage && ayahs && ayahs.length > 0) {
    comparison = comparePageRecitation(ayahs, transcribedText);
  } else {
    comparison = compareRecitation(expectedText, transcribedText);
  }

  return {
    modelUsed,
    transcribedText,
    ...comparison
  };
}
