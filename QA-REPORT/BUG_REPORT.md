# BUG_REPORT — المحفظ AI

> 2026-11-15 · Severity = أثر المشكلة · Priority = متى تُصلح (P1 فورًا، P2 قبل الإطلاق، P3 لاحقًا).
> «Prod» = `al-mahfath.vercel.app` (الفرع main) · «Br» = `fix/audit-2026-11-15`. لم يُصلح أي Bug في هذه المرحلة (بانتظار الموافقة).

| ID | العنوان | Severity | Priority | المنصة | الدور | الميزة | الدليل |
|---|---|---|---|---|---|---|---|
| BUG-001 | الإنتاج بلا مفتاح Gemini ولا Hugging Face | **High** | P1 | Prod | الكل | التسميع + المعلم الذكي | TC-STU-08 |
| BUG-002 | لا توجد استعادة كلمة المرور | **High** | P1 | الكل | طالب/معلمة/مشرف | Auth | TC-AUTH-04 |
| BUG-003 | المنشور «المخفي الهوية» يكشف معرّف صاحبه | **High** | P1 | Prod+Br | طالب | المجتمع | TC-STU-12 |
| BUG-004 | طلب الانتساب بلا واجهة، وطابور المشرف لا يمتلئ | Medium | P2 | Prod+Br | طالب/مشرف | التوزيع | TC-ADM-02, TC-API-06 |
| BUG-005 | رابط غير موجود يعرض صفحة بيضاء | Medium | P2 | الكل | الكل | Navigation | TC-NAV-03 |
| BUG-006 | تباين الأزرار الخضراء 2.54:1 | Medium | P2 | الكل | الكل | UI/A11y | TC-A11Y-01 |
| BUG-007 | نافذة دليل التثبيت: Esc لا يغلق والتركيز خارجها | Medium | P3 | Prod+Br | زائر | PWA/A11y | TC-PWA-02 |
| BUG-008 | نصوص التثبيت عربية في الوضع الإنجليزي | Low | P3 | Prod (مُصلح في Br) | زائر | i18n | TC-I18N-01 |
| BUG-009 | رسالة «حذف أداة التعريف» لكلمة مختلفة تمامًا | Low | P3 | Prod+Br | طالب | التسميع | TC-REC-12b |
| BUG-010 | التسجيل بلا حد أدنى لكلمة المرور أو تأكيدها في الواجهة | Low | P3 | الكل | زائر | Auth | TC-AUTH-02 |
| BUG-011 | أهداف لمس أصغر من 44px على الجوال | Low | P3 | Mobile | زائر | UI | TC-UI-MOB-TAP |
| BUG-012 | حزمة JS واحدة 2.9MB وبلا تخزين طويل للأصول | Low | P3 | Prod | الكل | الأداء | TC-PERF-02 |
| BUG-013 | `/api/*` غير موجود يرجع HTML لا JSON | Low | P3 | Prod+Br | — | API | TC-API-04 |
| BUG-014 | أسماء الطلاب تُرسل لخدمة خارجية (dicebear) | Low | P3 | Prod+Br | مشرف | الخصوصية | كود |
| BUG-015 | عنوان الصفحة لا يُترجم | Low | P3 | الكل | الكل | i18n | TC-I18N-02 |
| BUG-016 | `/api/ai/recitation-status` العام يكشف إعدادات الخادم | Low | P3 | Prod+Br | — | Security | TC-SEC-04 |
| BUG-017 | الـ Service Worker يخزّن كل مسار زاره المستخدم | Low | P3 | Prod+Br | الكل | PWA | TC-PWA-03 |


---

### BUG-001 — الإنتاج بلا مفتاح Gemini ولا Hugging Face
- **Platform:** Production (Vercel، مشروع al-mahfath) · **Role:** الكل · **Feature:** التسميع الصوتي + المعلم الذكي
- **Severity:** High · **Priority:** P1
- **Steps:** 1) افتح `https://al-mahfath.vercel.app/api/ai/recitation-status`.
- **Expected:** `hasGemini: true` (وإن أمكن `hasToken: true`).
- **Actual:** `{"hasToken":false,"hasGemini":false,…}`.
- **Impact (من الكود):** المعلم الذكي يرد دائمًا من القوالب الداخلية (إلا لمن أدخل مفتاحه الشخصي)؛ تقييم التسجيل الصوتي على الخادم لا يجد Gemini، ويجرّب Whisper بدون توكن ← غالبًا «تعذر تحويل الصوت إلى نص»، ويبقى فقط مسار نص Web Speech من المتصفح.
- **Screenshot:** — (دليل API في `evidence/browser-checks.md#api`).
- **Root cause:** متغيرات `GEMINI_API_KEY` و`HUGGINGFACE_TOKEN` غير مضبوطة في بيئة Production على Vercel.
- **Suggested fix:** إضافتها في Vercel → Settings → Environment Variables (Production وPreview) ثم Redeploy، وإعادة TC-STU-08.

### BUG-002 — لا توجد استعادة كلمة المرور
- **Platform:** الكل · **Feature:** Auth · **Severity:** High · **Priority:** P1
- **Steps:** افتح / ← «لدي حساب».
- **Expected:** رابط «نسيت كلمة المرور؟» يرسل بريد استعادة.
- **Actual:** لا رابط؛ ولا استدعاء لـ `sendPasswordResetEmail` في `src/`.
- **Screenshot:** `screenshots/authentication/TC-AUTH-01_signin_modal_360_en.jpg`
- **Suggested fix:** رابط في `AuthModal` يستدعي `sendPasswordResetEmail(auth, email)` مع رسالة لا تكشف وجود البريد.

### BUG-003 — المنشور «المخفي الهوية» يكشف معرّف صاحبه
- **Platform:** Prod + Br (الكود نفسه) · **Role:** طالب · **Feature:** المجتمع · **Severity:** High (خصوصية) · **Priority:** P1
- **Steps (كود):** `POST /api/community/posts` مع `isAnonymous:true` يخزّن `authorId`؛ `GET /api/community/posts` يمرّ على `serializePost` الذي يعيد `{ id, ...data }` كاملًا.
- **Expected:** لا يصل `authorId` لغير صاحب المنشور والمشرف عندما يكون مخفيًا.
- **Actual:** كل مستخدم مسجّل يستلم `authorId` (UID) — ويمكن ربطه بتعليقات نفس الشخص التي تحمل اسمه و`authorId` نفسه.
- **Evidence:** `server/routes/community.js:28-39` و`:80-83`. التنفيذ الحي **BLOCKED** (يحتاج حسابات).
- **Suggested fix:** في `serializePost` احذف `authorId` (و`avatar`) عندما `isAnonymous` والمشاهد ليس المالك/المشرف؛ أبقِ `canEdit` كما هو.

### BUG-004 — طلب الانتساب بلا واجهة
- **Severity:** Medium · **Priority:** P2 · **Feature:** توزيع الطالبات والانتساب (المشرف)
- **Actual:** `POST /api/safar/enrollment-request` (server/routes/groups.js:313) لا يستدعيه أي ملف في `src/`، بينما `AdminDistributionView` يعرض ويعتمد `enrollmentRequests`. كذلك `POST /api/teacher/:id/enroll-student` مكرر لـ `add-student` بلا مستدعٍ.
- **Expected:** إما زر «طلب الانتساب» عند الطالب، أو إزالة الطابور والمسار.
- **Evidence:** `evidence/static-checks.txt`.

### BUG-005 — رابط غير موجود يعرض صفحة بيضاء
- **Severity:** Medium · **Priority:** P2
- **Steps:** افتح `/no-such-page`. **Actual:** `#root` فارغ. **Expected:** صفحة 404 أو تحويل إلى `/`.
- **Screenshot:** `screenshots/errors/TC-NAV-03_unknown_route_blank_page_360.jpg`
- **Root cause:** `src/App.jsx` بلا `<Route path="*">`. **Fix:** `<Route path="*" element={<Navigate to="/" replace />} />`.

### BUG-006 — تباين الأزرار الخضراء 2.54:1
- **Severity:** Medium (Accessibility) · **Priority:** P2
- **Actual:** نص أبيض على الأخضر الأساسي = 2.54:1 («ابدأ الآن»، «ابدأ مجانًا»، «تثبيت التطبيق»، أرقام الحصون). **Expected:** ≥ 4.5:1 (WCAG AA).
- **Fix:** تغميق الأخضر للأزرار (مثل #047857) أو نص داكن.

### BUG-007 — نافذة دليل التثبيت: Esc لا يغلق والتركيز خارجها
- **Severity:** Medium · **Priority:** P3 · **Platform:** Mobile (Android UA)
- **Actual:** بعد الفتح `focusInDialog:false`؛ Esc لا يغلق. الكود في الفرع (`PWAInstallButton.jsx`) لا يستخدم `useDialogDismiss` ولا ينقل التركيز.
- **Screenshot:** `screenshots/errors/TC-PWA-02_install_guide_en_mode_arabic_no_esc.jpg`
- **Fix:** `useDialogDismiss(Boolean(guide), () => setGuide(null))` + نقل التركيز لزر الإغلاق عند الفتح.

### BUG-008 — نصوص التثبيت عربية في الوضع الإنجليزي (Production فقط)
- **Severity:** Low · **Priority:** P3 · **Status:** مُصلح في `fix/audit-2026-11-15` (PR #16)، غير منشور بعد.
- **Screenshot:** `screenshots/errors/TC-I18N-01_landing_360_en_install_button_arabic.jpg`

### BUG-009 — رسالة «حذف أداة التعريف» لكلمة مختلفة تمامًا
- **Severity:** Low (الدرجة صحيحة، الرسالة مضللة) · **Priority:** P3
- **Steps:** `compareRecitation("ٱلْحَمْدُ لِلَّهِ…", "شكرا لله رب العالمين")`.
- **Expected:** `word_error` «كلمة مختلفة». **Actual:** `grammar_error` «حذف أداة التعريف (الـ): المتوقع [ٱلْحَمْدُ] ونطقت نكرة [شكرا]».
- **Evidence:** `evidence/recitation-accuracy.txt` (TC-REC-12b). **Root cause:** `checkWordPrecision` يكتفي بأن المتوقع يبدأ بـ«ال» والمنطوق لا. **Fix:** اشتراط تطابق الجذر بعد حذف «ال».

### BUG-010 — التسجيل بلا حد أدنى لكلمة المرور أو تأكيدها
- **Severity:** Low · **Priority:** P3 · **Actual:** `minLength=-1`، «123» صالحة حتى يرفضها Firebase بعد الإرسال. **Fix:** `minLength={6}` + تلميح + حقل تأكيد.

### BUG-011 — أهداف لمس أصغر من 44px
- **Severity:** Low · روابط القائمة 36px ارتفاعًا، الشعار 32px (390 و768). **Fix:** `min-height: 44px` لروابط الهيدر على الجوال.

### BUG-012 — حزمة JS واحدة 2.9MB وبلا تخزين طويل
- **Severity:** Low (أداء) · `index-*.js` = 2,908,832 bytes، `cache-control: max-age=0, must-revalidate`. **Fix:** `React.lazy` لتبويبات Dashboard والمشرف/المعلمة، و`vercel.json` headers: `/assets/(.*)` → `public, max-age=31536000, immutable`.

### BUG-013 — `/api/*` غير موجود يرجع HTML
- **Severity:** Low · **Fix:** `app.use('/api', (req, res) => res.status(404).json({ success:false, message:'Not found' }))` قبل الـ fallback.

### BUG-014 — أسماء الطلاب تُرسل لـ api.dicebear.com
- **Severity:** Low (خصوصية) · `AdminDistributionView.jsx:475` يضع `encodeURIComponent(st.name)` في رابط خارجي. **Fix:** أيقونة محلية بالحرف الأول.

### BUG-015 — عنوان الصفحة لا يُترجم
- **Severity:** Low · `document.title` ثابت في `index.html`. **Fix:** ضبط العنوان في `LanguageContext`.

### BUG-016 — `/api/ai/recitation-status` العام يكشف إعدادات الخادم
- **Severity:** Low · **Fix:** `requireAdmin` أو إزالة `hasGemini/hasToken`.

### BUG-017 — الـ Service Worker يخزّن كل مسار
- **Severity:** Low · المخزن يحتوي `/no-such-page`، `/dashboard`، `/__/auth/iframe`. **Fix:** تخزين الأصول ذات الهاش و`/index.html` فقط، واستثناء `/__/`.

## مخاطر غير مُختبرة (Not bugs until executed)
| ID | الخطر | لماذا لم يُختبر |
|---|---|---|
| RISK-01 | حد طلبات Vercel 4.5MB أقل من حد الكود للصوت (20MB base64) ← تسجيلات طويلة قد ترجع 413 برسالة غير واضحة | يحتاج دخولًا وتسجيلًا فعليًا |
| RISK-02 | دقة التسميع الحقيقية تعتمد على تفريغ Gemini/Whisper؛ التشكيل لا يأتي من Web Speech فأخطاء الحركات لا تُكتشف إلا بمسار Gemini المباشر | BUG-001 + لا ميكروفون |
| RISK-03 | بيانات شخصية قديمة في تاريخ git لمستودع عام | قرار المستخدمة (جعل المستودع Private / مسح التاريخ) |
