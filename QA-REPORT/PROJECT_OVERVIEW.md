# PROJECT_OVERVIEW — المحفظ AI

> Phase 1: Project Discovery & Architecture Audit · 2026-11-15 · الفرع المفحوص: `fix/audit-2026-11-15` (commit `6194861`) — نفس نسخة معاينة Vercel.

## 1. الهيكل العام

```
Browser / PWA / Capacitor (Android, iOS)
        │  React 19 + Vite (src/)  — عربي RTL / إنجليزي LTR
        │  Firebase Web SDK: Auth (بريد+كلمة مرور، Google) · Firestore (قراءة مباشرة محمية بالقواعد) · Storage (الصور) · FCM
        ▼
Express 5 (server/index.js)  ←  Vercel Serverless (api/index.js)
        │  requireAuth = Firebase ID token (firebase-admin) · requireAdmin · rateLimit
        ├── server/routes/groups.js      (الحلقات، المعلمة، المشرف)
        ├── server/routes/community.js   (المجتمع، الإشعارات)
        ├── server/recitationEngine.js   (مقارنة التلاوة + Gemini + Whisper)
        ├── server/firestore*.js, accountDeletion.js, privateUserData.js …
        ▼
Firestore (Admin SDK) · Gemini API · Hugging Face Whisper · server/data/quran-uthmani.json (النص المرجعي)
```

| الطبقة | الملفات | ملاحظات |
|---|---|---|
| Routes (React Router) | `src/App.jsx` | 3 مسارات فقط: `/` (عام)، `/wizard` و`/dashboard` (محميان بـ `ProtectedRoute`). كل الشاشات الداخلية **تبويبات** داخل `/dashboard` وليست URLs. |
| التنقل حسب الدور | `src/lib/navigation.js` | قوائم منفصلة للطالب (11 تبويب)، المعلمة (7)، المشرف (6 + تبويبات داخلية). |
| الحالة | `src/context/*` | Auth، Language، Theme، Notification. |
| الخادم | `server/` | 67 Endpoint (انظر FEATURE_INVENTORY). |
| البيانات | Firestore + Storage | انظر قسم المجموعات. |
| النص القرآني | `server/data/quran-uthmani.json` | مصدر AlQuran Cloud «quran-uthmani»: 114 سورة، 6236 آية، 604 صفحة (تحققت آليًا). |
| PWA | `public/manifest.json`, `public/sw.js`, `index.html` | Service Worker: Network-first مع cache fallback، لا يخزّن `/api`. |
| الجوال | `capacitor.config.ts`, `android/`, `ios/` | |

## 2. عدد العناصر المكتشفة

| العنصر | العدد |
|---|---|
| ملفات المصدر في `src/` | 96 (منها 67 مكوّن JSX) |
| تبويبات Dashboard (switch cases) | 28 |
| API Endpoints | 67 (منها 13 متوقفة عمدًا بـ 410) |
| طلبات API من الواجهة | 61 |
| مجموعات Firestore الرئيسية | 6 (users, community_posts, app_config, groups, memberships, enrollmentRequests) + 8 مجموعات فرعية تحت `users/{uid}` + comments/likes تحت المنشور |
| أدوار | 3 (user/طالب، teacher، admin) + حساب متعدد الأدوار |

## 3. بيئة الفحص وحدودها (مهم لقراءة النتائج)

| البند | الحالة |
|---|---|
| تثبيت الحزم (`npm install`) في بيئة Claude | **غير متاح** — لا وصول لسجل npm. |
| Firebase Emulator | **غير متاح** هنا (يحتاج الحزم + Java)، ولا يوجد shell على جهاز المستخدمة. |
| بيانات Production | **ممنوع لمسها** حسب شروط الفحص، والمعاينة على Vercel موصولة بنفس مشروع Firebase الحقيقي ← لا حسابات تجريبية ولا كتابة. |
| معاينة Vercel | محمية بتسجيل دخول Vercel (Vercel Authentication). |
| المتاح فعلًا | قراءة الكود كاملًا، تشغيل اختبارات Node للمنطق النقي (مع استبدال firebase-admin/express بـ stubs)، بناء esbuild، فحوصات ثابتة، وتصفح الصفحات العامة في المتصفح المدمج بتطبيق Claude إذا فُتحت المعاينة. |

النتيجة: كل ما يحتاج تسجيل دخول (طالب/معلمة/مشرف) أو Firebase حقيقي أو ميكروفون حقيقي يُسجَّل **BLOCKED** مع السبب، ولا تُخترع نتائج.

## 4. نتائج معمارية لافتة (من الاكتشاف)

1. الشاشات الداخلية ليست في الـ URL ← لا يمكن مشاركة رابط لتبويب، والرجوع بالمتصفح لا ينقل بين التبويبات (useBackHandler يعالج جزءًا).
2. `ProtectedRoute` يقرأ `ma7fath_user` من localStorage كحل احتياطي أثناء التحميل؛ `AuthContext` يمسحه عند عدم وجود جلسة، والخادم لا يثق به (كل `/api` بالتوكن). الخطر واجهة فقط.
3. القراءة المباشرة من Firestore في الواجهة (مثل `users/{uid}/ayah_progress`) محكومة بـ `firestore.rules`؛ والكتابة الحساسة عبر الخادم.
4. وظائف Vercel بلا ffmpeg ← مسار Whisper يرسل الصوت الخام (صار آمنًا بعد إصلاح 15/11).
