// Quran Static Data (Madina Mushaf layout, 604 pages)

export const surahs = [
  { name: "الفاتحة", startPage: 1 },
  { name: "البقرة", startPage: 2 },
  { name: "آل عمران", startPage: 50 },
  { name: "النساء", startPage: 77 },
  { name: "المائدة", startPage: 106 },
  { name: "الأنعام", startPage: 128 },
  { name: "الأعراف", startPage: 151 },
  { name: "الأنفال", startPage: 177 },
  { name: "التوبة", startPage: 187 },
  { name: "يونس", startPage: 208 },
  { name: "هود", startPage: 221 },
  { name: "يوسف", startPage: 235 },
  { name: "الرعد", startPage: 249 },
  { name: "إبراهيم", startPage: 255 },
  { name: "الحجر", startPage: 262 },
  { name: "النحل", startPage: 267 },
  { name: "الإسراء", startPage: 282 },
  { name: "الكهف", startPage: 293 },
  { name: "مريم", startPage: 305 },
  { name: "طه", startPage: 312 },
  { name: "الأنبياء", startPage: 322 },
  { name: "الحج", startPage: 332 },
  { name: "المؤمنون", startPage: 342 },
  { name: "النور", startPage: 350 },
  { name: "الفرقان", startPage: 359 },
  { name: "الشعراء", startPage: 367 },
  { name: "النمل", startPage: 377 },
  { name: "القصص", startPage: 385 },
  { name: "العنكبوت", startPage: 396 },
  { name: "الروم", startPage: 404 },
  { name: "لقمان", startPage: 411 },
  { name: "السجدة", startPage: 415 },
  { name: "الأحزاب", startPage: 418 },
  { name: "سبأ", startPage: 428 },
  { name: "فاطر", startPage: 434 },
  { name: "يس", startPage: 440 },
  { name: "الصافات", startPage: 446 },
  { name: "ص", startPage: 453 },
  { name: "الزمر", startPage: 458 },
  { name: "غافر", startPage: 467 },
  { name: "فصلت", startPage: 477 },
  { name: "الشورى", startPage: 483 },
  { name: "الزخرف", startPage: 489 },
  { name: "الدخان", startPage: 496 },
  { name: "الجاثية", startPage: 499 },
  { name: "الأحقاف", startPage: 502 },
  { name: "محمد", startPage: 507 },
  { name: "الفتح", startPage: 511 },
  { name: "الحجرات", startPage: 515 },
  { name: "ق", startPage: 518 },
  { name: "الذاريات", startPage: 520 },
  { name: "الطور", startPage: 523 },
  { name: "النجم", startPage: 526 },
  { name: "القمر", startPage: 528 },
  { name: "الرحمن", startPage: 531 },
  { name: "الواقعة", startPage: 534 },
  { name: "الحديد", startPage: 537 },
  { name: "المجادلة", startPage: 542 },
  { name: "الحشر", startPage: 545 },
  { name: "الممتحنة", startPage: 549 },
  { name: "الصف", startPage: 551 },
  { name: "الجمعة", startPage: 553 },
  { name: "المنافقون", startPage: 554 },
  { name: "التغابن", startPage: 556 },
  { name: "الطلاق", startPage: 558 },
  { name: "التحريم", startPage: 560 },
  { name: "الملك", startPage: 562 },
  { name: "القلم", startPage: 564 },
  { name: "الحاقة", startPage: 566 },
  { name: "المعارج", startPage: 568 },
  { name: "نوح", startPage: 570 },
  { name: "الجن", startPage: 572 },
  { name: "المزمل", startPage: 574 },
  { name: "المدثر", startPage: 575 },
  { name: "القيامة", startPage: 577 },
  { name: "الإنسان", startPage: 578 },
  { name: "المرسلات", startPage: 580 },
  { name: "النبأ", startPage: 582 },
  { name: "النازعات", startPage: 583 },
  { name: "عبس", startPage: 585 },
  { name: "التكوير", startPage: 586 },
  { name: "الانفطار", startPage: 587 },
  { name: "المطففين", startPage: 587 },
  { name: "الانشقاق", startPage: 589 },
  { name: "البروج", startPage: 590 },
  { name: "الطارق", startPage: 591 },
  { name: "الأعلى", startPage: 591 },
  { name: "الغاشية", startPage: 592 },
  { name: "الفجر", startPage: 593 },
  { name: "البلد", startPage: 594 },
  { name: "الشمس", startPage: 595 },
  { name: "الليل", startPage: 595 },
  { name: "الضحى", startPage: 596 },
  { name: "الشرح", startPage: 596 },
  { name: "التين", startPage: 597 },
  { name: "العلق", startPage: 597 },
  { name: "القدر", startPage: 598 },
  { name: "البينة", startPage: 598 },
  { name: "الزلزلة", startPage: 599 },
  { name: "العاديات", startPage: 599 },
  { name: "القارعة", startPage: 600 },
  { name: "التكاثر", startPage: 600 },
  { name: "العصر", startPage: 601 },
  { name: "الهمزة", startPage: 601 },
  { name: "الفيل", startPage: 601 },
  { name: "قريش", startPage: 602 },
  { name: "الماعون", startPage: 602 },
  { name: "الكوثر", startPage: 602 },
  { name: "الكافرون", startPage: 603 },
  { name: "النصر", startPage: 603 },
  { name: "المسد", startPage: 603 },
  { name: "الإخلاص", startPage: 604 },
  { name: "الفلق", startPage: 604 },
  { name: "الناس", startPage: 604 }
];

const juzStarts = [
  { juz: 1, startPage: 1 },
  { juz: 2, startPage: 22 },
  { juz: 3, startPage: 42 },
  { juz: 4, startPage: 62 },
  { juz: 5, startPage: 82 },
  { juz: 6, startPage: 102 },
  { juz: 7, startPage: 121 },
  { juz: 8, startPage: 142 },
  { juz: 9, startPage: 162 },
  { juz: 10, startPage: 182 },
  { juz: 11, startPage: 201 },
  { juz: 12, startPage: 222 },
  { juz: 13, startPage: 242 },
  { juz: 14, startPage: 262 },
  { juz: 15, startPage: 282 },
  { juz: 16, startPage: 302 },
  { juz: 17, startPage: 322 },
  { juz: 18, startPage: 342 },
  { juz: 19, startPage: 362 },
  { juz: 20, startPage: 382 },
  { juz: 21, startPage: 402 },
  { juz: 22, startPage: 422 },
  { juz: 23, startPage: 442 },
  { juz: 24, startPage: 462 },
  { juz: 25, startPage: 482 },
  { juz: 26, startPage: 502 },
  { juz: 27, startPage: 522 },
  { juz: 28, startPage: 542 },
  { juz: 29, startPage: 562 },
  { juz: 30, startPage: 582 }
];

export const getSurahNameForPage = (pageNumber) => {
  const exactStarts = surahs.filter(s => s.startPage === pageNumber);
  if (exactStarts.length > 0) {
    return exactStarts.map(s => s.name).join(' / ');
  }
  let activeSurah = surahs[0];
  for (let i = 0; i < surahs.length; i++) {
    if (surahs[i].startPage <= pageNumber) {
      activeSurah = surahs[i];
    } else {
      break;
    }
  }
  return activeSurphName(activeSurah);
};

function activeSurphName(surah) {
  return surah ? surah.name : 'البقرة';
}

export const getJuzForPage = (pageNumber) => {
  let activeJuz = 1;
  for (let i = 0; i < juzStarts.length; i++) {
    if (juzStarts[i].startPage <= pageNumber) {
      activeJuz = juzStarts[i].juz;
    } else {
      break;
    }
  }
  return activeJuz;
};
