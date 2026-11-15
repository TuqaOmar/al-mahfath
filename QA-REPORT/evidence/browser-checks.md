# Browser evidence — 2026-11-15 (Asia/Amman ~23:00)

المتصفح: المتصفح المدمج في تطبيق Claude على جهاز المستخدمة (Chromium). الموقع: `https://al-mahfath.vercel.app` (Production، كود الفرع main). كل الطلبات قراءة فقط، بدون تسجيل دخول، بدون إنشاء بيانات. القيم أدناه منسوخة من مخرجات أدوات المتصفح كما ظهرت.

> معاينة الفرع (`al-mahfath-74fwhau5k-…vercel.app`) محمية بـ Vercel Authentication وظهرت صفحة «Log in to Vercel» → لم تُفحص.

## api
| الطلب | الحالة | الزمن ms | الرد (مختصر) |
|---|---|---|---|
| GET /api/health | 200 | 2046 (بارد) | {"status":"ok",…} |
| GET /api/ai/recitation-status | 200 | 2048 | {"hasToken":false,"hasGemini":false,"models":["tarteel-ai/whisper-base-ar-quran","openai/whisper-large-v3-turbo","gemini-2.5-flash-asr"],…} |
| GET /api/quran/reference/page/1 | 200 | 309 | source AlQuran Cloud quran-uthmani |
| GET /api/quran/reference/page/604 | 200 | 238 | |
| GET /api/quran/reference/page/0 · 605 · abc | 400 ×3 | 272–309 | «رقم الصفحة غير صالح» |
| GET /api/quran/reference/surah/115 | 400 | 201 | «رقم السورة غير صالح» |
| GET /api/user/someone, /api/teacher/t1/students, /api/admin/users, /api/community/posts, /api/notifications, /api/recitation/history, /api/ai/chat, /api/student/analytics (بدون توكن) | 401 ×8 | 203–313 | «Missing or invalid Authorization header» |
| GET /api/user/someone · /api/admin/users (Bearer invalid) | 401 ×2 | 199–210 | «Invalid or expired token» |
| GET /api/groups/lookup?code=NOTACODE | 404 | 946 | «لم يتم العثور على حلقة بهذا الرمز» |
| GET /api/groups/lookup | 400 | 214 | «رمز الحلقة غير صالح» |
| POST /api/auth/login | 410 | 301 | «Use Firebase Authentication» |
| GET /api/quran/pages | 410 | 206 | |
| GET /api/does-not-exist | 404 | 306 | `<!DOCTYPE html>… <pre>Cannot GET …` (HTML وليس JSON) |

## routes
- `/dashboard` بدون جلسة ← `/` · `/wizard` ← `/`.
- ضبط `localStorage.ma7fath_user = {role:'admin', roles:{admin:true,…}}` ثم `/dashboard` ← `/` و`forgedStillThere:false`.
- `/no-such-page` ← `#root` بلا أبناء، نص الصفحة فارغ (صفحة بيضاء).

## auth
- Sign-in: `input[type=email][required][autocomplete=email]`، `input[type=password][required][autocomplete=current-password]`؛ checkValidity فارغ = false «Please fill out this field»؛ «abc» = false «Please include an '@'…». لا رابط «نسيت كلمة المرور».
- Sign-up: الاسم (required، autocomplete فارغ)، البريد، كلمة المرور (`minLength=-1`)؛ القيمة «123» صالحة في الواجهة.

## responsive
| العرض | scrollWidth | عناصر خارج الشاشة | نصوص مقصوصة | ملاحظات |
|---|---|---|---|---|
| 1920 | 1914 = vw | 0 | 0 | |
| 1440 | 1434 = vw | 0 | 0 | h1 واحد، 0 عناصر بلا اسم، 0 صور بلا alt |
| 1280 | 1274 = vw | 0 | 0 | |
| 768 | 762 = vw | 0 | 0 | أهداف < 44px: روابط القائمة 36px ارتفاعًا، الشعار 165×32، زر الوضع 36×44 |
| 390 (Android UA) | 390 = vw | 0 | 0 | نفس أهداف اللمس الصغيرة |
| 375 | 375 = vw | 0 | — | |
| 360 | 360 = vw | 0 | — | 0 تداخل في الهيدر |

## i18n
- بعد «English»: `dir=ltr`, `lang=en`, `ma7fath_lang=en`؛ العناصر النصية العربية المتبقية: «العربية» (مقصود) و«تثبيت التطبيق على جهازك».
- `document.title` بقي «المحفظ الإلكتروني | احفظ القرآن بذكاء».
- نافذة دليل التثبيت في الوضع الإنجليزي: «تثبيت التطبيق على أندرويد…» بالعربي و`direction: rtl`.
- (الفرع، Node SSR) VisualProgressTracker/PostSessionDhikr/MobileWelcomeView: عربي ✓، إنجليزي: 0 / 5 (نص الذكر نفسه، مقصود) / 0 كلمات عربية.

## a11y
- نسبة تباين النص الأبيض على الأزرار الخضراء («Get Started»، «Start free»، «تثبيت التطبيق…»، أرقام الحصون): **2.54:1** (المطلوب 4.5:1).
- Tab ×4 ← `:focus-visible` true، outline ظاهر.
- نافذة دليل التثبيت: `focusInDialog:false` بعد الفتح، و`Escape` لم يغلقها (`dialogAfterEsc:true`).

## pwa
- manifest: name «المحفظ الإلكتروني الذكي»، short_name «المحفظ»، display standalone، start_url /، lang ar، dir rtl، icons 192 any / 512 any / 512 maskable.
- SW: registered، active=activated، controlling=true، cache `almahfath-cache-v1`.
- المسارات المخزنة تشمل: `/wizard`, `/no-such-page`, `/dashboard`, `/__/auth/iframe`, `/__/auth/iframe.js`, الصور، JS/CSS.

## perf
- Navigation (مخزّن جزئيًا): TTFB 709ms، DOMContentLoaded 1175ms، load 1177ms؛ CLS 0؛ DOM 256 عنصرًا؛ JS heap 11MB.
- `/assets/index-CjUYAf1U.js`: 2,908,832 bytes (غير مضغوط)، `content-encoding: br`، `cache-control: public, max-age=0, must-revalidate`. ملف JS واحد للتطبيق كله.
- 20 صفحة مصحف متتالية من API: 5364ms.
