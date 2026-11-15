# TEST_CASES — المحفظ AI

> Prod=al-mahfath.vercel.app (main) · Br=fix/audit-2026-11-15 6194861
> الحالات: PASS / FAIL / BLOCKED / NOT TESTED. «Br» = اختبار على كود الفرع في بيئة Claude (Node)، «Prod» = الموقع المنشور (قراءة فقط، بدون حسابات).

**المجموع: 87** — PASS 54 · FAIL 18 · BLOCKED 15 · NOT TESTED 0


## AUTH

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-AUTH-01 | Auth | نموذج تسجيل الدخول يظهر ويحتوي الحقول الصحيحة | Prod · Mobile 360 · EN | زائر | افتح / ← «I have an account» | حقول Email/Password مطلوبة مع autocomplete صحيح | Email(type=email, required, autocomplete=email) + Password(current-password, required) + Google | PASS | screenshots/authentication/TC-AUTH-01_signin_modal_360_en.jpg |
| TC-AUTH-02 | Auth | نموذج إنشاء حساب | Prod · Mobile 360 · EN | زائر | «Create an Account now» | اسم/بريد/كلمة مرور مع قواعد كلمة المرور | الحقول موجودة؛ لا حد أدنى لكلمة المرور في الواجهة (123 مقبولة قبل الإرسال) ولا تأكيد كلمة مرور | FAIL (BUG-010) | screenshots/authentication/TC-AUTH-02_signup_modal_360_en.jpg |
| TC-AUTH-03 | Auth | تحقق الحقول الفارغة والبريد غير الصحيح (بدون إرسال) | Prod · Mobile 360 | زائر | checkValidity على الحقول | منع الإرسال برسالة | فارغ: «Please fill out this field» · abc: «include an @» | PASS | evidence/browser-checks.md#auth |
| TC-AUTH-04 | Auth | استعادة كلمة المرور | Prod + Br (كود) | زائر | ابحث عن رابط «نسيت كلمة المرور» في النموذج وفي الكود | رابط ومسار sendPasswordResetEmail | لا رابط في الواجهة ولا sendPasswordResetEmail في src/ | FAIL (BUG-002) | screenshots/authentication/TC-AUTH-01_signin_modal_360_en.jpg |
| TC-AUTH-05 | Auth | الدخول إلى /dashboard بدون جلسة | Prod | زائر | افتح /dashboard مباشرة | تحويل إلى / | تحويل إلى / | PASS | evidence/browser-checks.md#routes |
| TC-AUTH-06 | Auth | الدخول إلى /wizard بدون جلسة | Prod | زائر | افتح /wizard | تحويل إلى / | تحويل إلى / | PASS | evidence/browser-checks.md#routes |
| TC-AUTH-07 | Auth/Security | تزوير ma7fath_user (admin) في localStorage | Prod | زائر | ضع مستخدمًا مزيفًا بدور admin ثم افتح /dashboard | لا وصول؛ مسح القيمة | مُسحت القيمة وتم التحويل إلى / | PASS | evidence/browser-checks.md#routes |
| TC-AUTH-08 | Auth | تسجيل/دخول/خروج حقيقي، Google، انتهاء الجلسة، حساب معطل | — | الكل | — | — | يحتاج حسابات تجريبية؛ ممنوع على Firebase الحقيقي | BLOCKED | — |
| TC-AUTH-09 | Roles | عزل الأدوار عبر الواجهة (طالب لا يرى المعلمة/المشرف) وتبديل الدور | — | الكل | — | — | يحتاج حسابات | BLOCKED | — |
| TC-AUTH-10 | Roles/API | صلاحيات الأدوار في الخادم (منطق) | Br · Node | — | tests/security.test.js | الطالب بلا صلاحيات معلمة/مشرف؛ المعلمة على طلابها فقط | 9/9 ناجحة (منطق accessControl/teacherScope) | PASS | evidence/unit-tests.txt |

## STU

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-STU-01 | الحصون الخمسة | إنشاء/إنجاز/حفظ الخطة، Refresh، تغيير اليوم | — | طالب | — | — | يحتاج حساب طالب | BLOCKED | — |
| TC-STU-02 | الحصون الخمسة | حساب السلسلة (streak) عبر منتصف الليل بتوقيت عمّان | Br · Node | — | اختبار وحدة | نفس اليوم ثابت، اليوم التالي +1، فجوة = 1 | ناجح | PASS | evidence/unit-tests.txt |
| TC-STU-03 | المصحف | سلامة النص: 604 صفحة، 6236 آية، الفاتحة كما في المصدر | Br · Node | — | TC-REC-22 | مطابقة المصدر | 6236 آية؛ الفاتحة مطابقة | PASS | evidence/recitation-accuracy.txt |
| TC-STU-04 | المصحف | نص صفحات الإنتاج يطابق المصدر المضمَّن (عينة 20 صفحة) | Prod API | زائر | GET /api/quran/reference/page/:n ثم SHA-256 | تطابق | 20/20 متطابقة | PASS | evidence/quran-text-integrity.txt |
| TC-STU-05 | المصحف | صفحات غير موجودة | Prod API | زائر | page/0, 605, abc; surah/115 | 400 برسالة واضحة | 400 «رقم الصفحة غير صالح» / «رقم السورة غير صالح» | PASS | evidence/browser-checks.md#api |
| TC-STU-06 | المصحف | التنقل والبحث والتكبير وعرض الصفحة على الجوال، المتشابهات، الخرائط الذهنية | — | طالب | — | — | الشاشات داخل /dashboard تحتاج دخولًا | BLOCKED | — |
| TC-STU-07 | المعلم الذكي | الأسئلة، السياق، الفشل، الـ Fallback | — | طالب | — | — | يحتاج دخولًا + Gemini | BLOCKED | — |
| TC-STU-08 | المعلم الذكي | إعداد Gemini على الإنتاج | Prod API | زائر | GET /api/ai/recitation-status | hasGemini=true | hasGemini=false, hasToken=false | FAIL (BUG-001) | evidence/browser-checks.md#api |
| TC-STU-09 | التحليلات والأوسمة | عرض التحليلات بالعربي والإنجليزي (مكوّن) | Br · Node SSR | — | renderToStaticMarkup بالعربي/الإنجليزي | لا نص عربي في الوضع الإنجليزي | VisualProgressTracker: 0 كلمة عربية بالإنجليزي | PASS | evidence/browser-checks.md#i18n |
| TC-STU-10 | التحليلات والأوسمة | فتح الأوسمة، عدم الاحتساب مرتين، بيانات من جهاز آخر | — | طالب | — | — | يحتاج دخولًا | BLOCKED | — |
| TC-STU-11 | المجتمع | إنشاء/تعديل/حذف/تعليق/إعجاب/لوحة الالتزام | — | طالب | — | — | يحتاج دخولًا | BLOCKED | — |
| TC-STU-12 | المجتمع | إخفاء هوية صاحب المنشور «المخفي» | Br (كود) | — | مراجعة serializePost في server/routes/community.js | لا يُرسل authorId للمنشور المخفي | يُرسل ...data كاملًا بما فيه authorId لكل المشاهدين | FAIL (BUG-003) | server/routes/community.js:28-39 |
| TC-STU-13 | الملف الشخصي/حذف الحساب | حذف كل بيانات الحساب (منطق الخادم) | Br · Node | — | tests/account-deletion.test.js (Firestore وهمي) | حذف البيانات وحساب Auth، إبقاء بيانات الآخرين | 2/2 ناجحة | PASS | evidence/unit-tests.txt |

## TCH

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-TCH-01 | المعلمة | إنشاء/تعديل/حذف حلقة، كود الانضمام، الطلاب، المراجعة، الملاحظات، التقارير، الفلاتر | — | معلمة | — | — | يحتاج حسابات + بيانات تجريبية | BLOCKED | — |
| TC-TCH-02 | المعلمة | كود حلقة خاطئ/فارغ (عام) | Prod API | زائر | GET /api/groups/lookup?code=NOTACODE و بدون code | 404 / 400 | 404 «لم يتم العثور…» / 400 «رمز الحلقة غير صالح» | PASS | evidence/browser-checks.md#api |
| TC-TCH-03 | المعلمة | كود الحلقة غير قابل للتخمين | Br (كود) | — | server/firestoreGroups.js:60 | عشوائي آمن | randomBytes(6) = 12 رمز hex (48 bit) | PASS | server/firestoreGroups.js:60 |

## ADM

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-ADM-01 | المشرف | إدارة المستخدمين/الأدوار/المعلمات/التوزيع/المنتدى/الأوسمة/الظهور | — | مشرف | — | — | يحتاج حساب مشرف | BLOCKED | — |
| TC-ADM-02 | المشرف | طلبات الانتساب تصل لشاشة التوزيع | Br (كود) | طالب→مشرف | تتبع POST /api/safar/enrollment-request | واجهة طالب ترسل الطلب | لا مستدعٍ في الواجهة؛ الطابور لا يمتلئ من التطبيق | FAIL (BUG-004) | evidence/static-checks.txt |

## API

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-API-01 | API | كل Endpoints البيانات تتطلب توكن (بدون Authorization) | Prod API | زائر | 10 مسارات محمية | 401 | 401 للجميع | PASS | evidence/browser-checks.md#api |
| TC-API-02 | API | توكن غير صالح | Prod API | زائر | Bearer invalid | 401 | 401 «Invalid or expired token» | PASS | evidence/browser-checks.md#api |
| TC-API-03 | API | مسارات متوقفة ترجع 410 | Prod API | زائر | POST /api/auth/login, GET /api/quran/pages | 410 | 410 | PASS | evidence/browser-checks.md#api |
| TC-API-04 | API | مسار API غير موجود | Prod API | زائر | GET /api/does-not-exist | 404 JSON | 404 بصفحة HTML من Express | FAIL (BUG-013) | evidence/browser-checks.md#api |
| TC-API-05 | API | تطابق طلبات الواجهة مع مسارات الخادم | Br · static | — | qa/routes.py | لا طلب بلا مسار | 61/61 لها مسار | PASS | evidence/static-checks.txt |
| TC-API-06 | API | مسارات بلا مستدعٍ | Br · static | — | مقارنة | لا تكرار | enroll-student مكرر لـ add-student؛ safar/enrollment-request بلا واجهة | FAIL (BUG-004) | evidence/static-checks.txt |
| TC-API-07 | API | حد الطلبات (rate limit) | Br · Node | — | tests/rate-limit.test.js | 429 بعد الحد مع Retry-After، فصل المستخدمين | ناجح | PASS | evidence/unit-tests.txt |
| TC-API-08 | API | طلب تسميع مكرر بنفس sessionId | Br (كود) | — | savePracticeAttempt | لا تكرار؛ 409 لمدخل مختلف | fingerprint + transaction | PASS | server/firestoreRecitation.js:135-137 |
| TC-API-09 | API | اختبارات HTTP الكاملة للخادم (api-security.test.js) وFirestore Rules على المحاكي | — | — | npm run test:security / test:emulator | — | express/firebase-admin/Emulator غير متاحة هنا | BLOCKED | evidence/unit-tests.txt |

## REC

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-REC-10 | التسميع (المحرك) | كلمة ناقصة | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | missing_word | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-11 | التسميع (المحرك) | كلمة زائدة | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | extra_word | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-12 | التسميع (المحرك) | استبدال كلمة في موضعها | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | word_error | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-13 | التسميع (المحرك) | ترتيب خاطئ | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | <100% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-14 | التسميع (المحرك) | تكرار كلمة | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | 90–99% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-15 | التسميع (المحرك) | خطأ حركة إعراب (نص مشكول) | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | diacritic_error | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-16 | التسميع (المحرك) | نص بلا تشكيل لا يُعاقب | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | ≥95% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-17 | التسميع (المحرك) | توقف في منتصف الآية | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | <70% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-18 | التسميع (المحرك) | قراءة آية أخرى | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | <30% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-19 | التسميع (المحرك) | آيتان متتاليتان | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | ≥95% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-20 | التسميع (المحرك) | اختلاف إملائي مقبول | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | ≥95% | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-21 | التسميع (المحرك) | الدرجة دائمًا 0..100 | Br · Node | — | QA-REPORT/automation/recitation-accuracy.qa.test.js | بلا NaN | كما هو متوقع | PASS | evidence/recitation-accuracy.txt |
| TC-REC-12b | التسميع (المحرك) | رسالة الخطأ عند استبدال كلمة تبدأ بـ «ال» | Br · Node | — | «الحمد»→«شكرا» | word_error «كلمة مختلفة» | grammar_error «حذف أداة التعريف» | FAIL (BUG-009) | evidence/recitation-accuracy.txt |
| TC-REC-23 | التسميع (المحرك) | كل الـ604 صفحة: قراءة صحيحة ≥99% وبلا تشكيل ≥90% | Br · Node | — | tests/recitation-engine.test.js | — | ناجح | PASS | evidence/unit-tests.txt |
| TC-REC-24 | التسميع (المحرك) | تخطي البسملة في الفاتحة | Br · Node | — | tests/recitation-engine.test.js | <100% | ناجح بعد إصلاح 15/11 | PASS | evidence/unit-tests.txt |
| TC-REC-25 | التسميع | غياب ffmpeg لا يُسقط الخادم | Br · Node | — | tests/recitation-engine.test.js | رفض الـ Promise | ناجح | PASS | evidence/unit-tests.txt |
| TC-REC-26 | التسميع (واجهة/صوت) | الميكروفون (سماح/رفض)، صوت منخفض/ضوضاء، إيقاف/إلغاء، انقطاع، ملفات غير مدعومة، Gemini→Whisper، فشل الخدمتين، حفظ المحاولات ومراجعتها | — | طالب | — | — | يحتاج دخولًا وميكروفونًا وGemini | BLOCKED | — |
| TC-REC-27 | التسميع | عدم تخزين الصوت الخام | Br (كود) | — | savePracticeAttempt | لا audioBase64 في Firestore | الجلسة تحفظ النتائج والنص فقط | PASS | server/firestoreRecitation.js:142-152 |

## UI

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-UI-1920 | UI/Responsive | الصفحة الرئيسية 1920px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص | PASS | evidence/browser-checks.md#responsive |
| TC-UI-1440 | UI/Responsive | الصفحة الرئيسية 1440px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص | PASS | screenshots/authentication/TC-UI-01_landing_1440_ar.jpg |
| TC-UI-1280 | UI/Responsive | الصفحة الرئيسية 1280px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص | PASS | evidence/browser-checks.md#responsive |
| TC-UI-768 | UI/Responsive | الصفحة الرئيسية 768px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص | PASS | screenshots/mobile/TC-UI-04_landing_768_ar.jpg |
| TC-UI-390 | UI/Responsive | الصفحة الرئيسية 390px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص | PASS | screenshots/mobile/TC-UI-05_landing_390_ar.jpg |
| TC-UI-375 | UI/Responsive | الصفحة الرئيسية 375px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص | PASS | evidence/browser-checks.md#responsive |
| TC-UI-360 | UI/Responsive | الصفحة الرئيسية 360px | Prod | زائر | resize + فحص DOM (تجاوز أفقي، قص، تداخل) | لا تجاوز ولا قص | scrollWidth = viewport، 0 عناصر خارج الشاشة، 0 قص، 0 تداخل بالهيدر | PASS | screenshots/mobile/TC-UI-07_landing_360_ar.jpg |
| TC-UI-MOB-TAP | UI/Accessibility | حجم أهداف اللمس على الجوال (≥44px) | Prod · 390/768 | زائر | قياس الأزرار | ≥44×44 | روابط القائمة 36px ارتفاعًا، الشعار 32px | FAIL (BUG-011) | evidence/browser-checks.md#responsive |

## I18N

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-I18N-01 | RTL/LTR | التحويل للإنجليزية | Prod · 360 | زائر | زر English | dir=ltr, lang=en، لا نص عربي | dir/lang صحيحان؛ بقي «تثبيت التطبيق على جهازك» | FAIL (BUG-008 — مُصلح في الفرع) | screenshots/errors/TC-I18N-01_landing_360_en_install_button_arabic.jpg |
| TC-I18N-02 | RTL/LTR | عنوان الصفحة (document.title) بالإنجليزية | Prod | زائر | تبديل اللغة | عنوان إنجليزي | يبقى عربيًا | FAIL (BUG-015) | evidence/browser-checks.md#i18n |
| TC-I18N-03 | RTL/LTR | مكونات الطالب المترجمة (SSR) | Br · Node | — | render ar/en لـ 3 مكونات | عربي/إنجليزي صحيح | 6/6 | PASS | evidence/browser-checks.md#i18n |

## A11Y

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-A11Y-01 | Accessibility | تباين الأزرار الخضراء | Prod | زائر | حساب نسبة التباين | ≥4.5:1 | 2.54:1 (أبيض على أخضر) | FAIL (BUG-006) | evidence/browser-checks.md#a11y |
| TC-A11Y-02 | Accessibility | مؤشر التركيز بلوحة المفاتيح | Prod · 360 | زائر | Tab ×4 | إطار تركيز ظاهر | إطار ظاهر (outline افتراضي) | PASS | screenshots/authentication/TC-A11Y-02_keyboard_focus_visible_360_en.png |
| TC-A11Y-03 | Accessibility | أسماء الأزرار والصور alt والعناوين | Prod · 1440 | زائر | فحص DOM | لا عناصر بلا اسم | 0 بلا اسم، 0 صور بلا alt، h1 واحد | PASS | evidence/browser-checks.md#a11y |

## NAV

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-NAV-03 | Navigation | رابط غير موجود | Prod | زائر | /no-such-page | صفحة 404 أو تحويل | صفحة بيضاء فارغة | FAIL (BUG-005) | screenshots/errors/TC-NAV-03_unknown_route_blank_page_360.jpg |

## UI

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-UI-DASH | UI | كل شاشات Dashboard (Loading/Empty/Error states، النوافذ، الجداول) | — | الكل | — | — | تحتاج دخولًا | BLOCKED | — |

## PWA

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-PWA-01 | PWA | manifest + Service Worker | Prod | زائر | قراءة manifest وتسجيل SW | standalone، أيقونات 192/512/maskable، SW فعّال | كلها موجودة؛ SW activated ويتحكم بالصفحة | PASS | evidence/browser-checks.md#pwa |
| TC-PWA-02 | PWA | دليل التثبيت على أندرويد | Prod · 360 (Android UA) | زائر | «تثبيت التطبيق» | نافذة بلغة الواجهة؛ Esc يغلق؛ التركيز داخلها | بالعربي في الوضع الإنجليزي؛ Esc لا يغلق؛ التركيز خارجها | FAIL (BUG-007, BUG-008) | screenshots/errors/TC-PWA-02_install_guide_en_mode_arabic_no_esc.jpg |
| TC-PWA-03 | PWA | ما يخزنه الـ Service Worker | Prod | زائر | caches.keys/keys() | الأصول فقط | يخزّن كل مسار زاره المستخدم (/no-such-page، /dashboard) و/__/auth/iframe | FAIL (BUG-017) | evidence/browser-checks.md#pwa |
| TC-PWA-04 | PWA | Offline، التثبيت الفعلي، Splash، iOS Safari، Android Chrome الحقيقي، ميكروفون الهاتف، تحديث النسخة | — | — | — | — | يحتاج أجهزة حقيقية / تحكم بالشبكة | BLOCKED | — |

## SEC

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-SEC-01 | Security | XSS: لا dangerouslySetInnerHTML/innerHTML في الواجهة | Br · static | — | grep | 0 | 0 | PASS | evidence/static-checks.txt |
| TC-SEC-02 | Security | أسرار في المستودع | Br · static | — | grep للمفاتيح وملفات الخدمة | لا أسرار | لا أسرار في الملفات الحالية؛ مفتاح Firebase Web عام بطبيعته؛ PII قديمة في تاريخ git | FAIL (SEC-01) | SECURITY_AUDIT.md |
| TC-SEC-03 | Security | قواعد Firestore | Br · static | — | مراجعة firestore.rules | لا قراءة/كتابة مفتوحة | لا قاعدة مفتوحة؛ المجتمع عبر الخادم فقط | PASS | firestore.rules |
| TC-SEC-04 | Security | كشف إعدادات الخادم للعامة | Prod API | زائر | GET /api/ai/recitation-status | لا تفاصيل داخلية | يكشف hasGemini/hasToken والنماذج | FAIL (BUG-016) | evidence/browser-checks.md#api |
| TC-SEC-05 | Security | IDOR على /api/user/:uid | Br (كود) | — | server/index.js:85-91 | 403 لغير المالك/المشرف | 403 | PASS | server/index.js:85 |
| TC-SEC-06 | Security | IDOR/Injection/Rules ديناميكيًا بحسابات متعددة | — | — | — | — | يحتاج حسابات/محاكي | BLOCKED | — |

## PERF

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-PERF-01 | Performance | تحميل الصفحة الرئيسية | Prod · desktop (مخزّن) | زائر | Navigation Timing | — | TTFB 709ms · DCL 1175ms · CLS 0 · DOM 256 عنصر · heap 11MB | PASS (قياس) | evidence/browser-checks.md#perf |
| TC-PERF-02 | Performance | حجم الحزمة والتخزين المؤقت | Prod | زائر | HEAD للأصول | تقسيم الكود + cache طويل للأصول ذات الهاش | JS واحد 2.9MB (br) · max-age=0 | FAIL (BUG-012) | evidence/browser-checks.md#perf |
| TC-PERF-03 | Performance | زمن استجابة API | Prod | زائر | قياس fetch | — | بارد ~2.0s (health)، دافئ 200–310ms، 20 صفحة مصحف 5.4s (~268ms/صفحة) | PASS (قياس) | evidence/browser-checks.md#perf |
| TC-PERF-04 | Performance | أداء Dashboard، AI، رفع الصوت، أجهزة ضعيفة، بيانات كبيرة | — | — | — | — | يحتاج دخولًا/أجهزة | BLOCKED | — |

## REG

| ID | الميزة | العنوان | المنصة | الدور | الخطوات | المتوقع | الفعلي | النتيجة | الدليل |
|---|---|---|---|---|---|---|---|---|---|
| TC-REG-01 | Regression | بناء الواجهة والخادم وVercel | Br | — | esbuild + Vercel | بلا أخطاء | esbuild بلا أخطاء؛ بناء Vercel للمشروعين success | PASS | evidence/static-checks.txt |
| TC-REG-02 | Regression | لا متغيرات غير معرّفة في 19 ملفًا معدّلًا | Br | — | tsc --checkJs (TS2304) | 0 | 0 | PASS | — |
