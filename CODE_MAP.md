# CODE_MAP — خريطة كود محفظ AI

> مولّدة آليًا (AST) + شرح يدوي. اقرأ هذا الملف **قبل** فتح الكود: يكفي غالبًا لمعرفة أين تعدّل.
> الأسهم حقيقية من الكود (imports / re_exports / calls_api). آخر تحديث: 2026-10-06. إن تغيّر الكود كثيرًا أعد توليدها.

## ملخص المعمارية
- **العميل**: React 19 + Vite في `src/`. الدخول `src/main.jsx` → `App.jsx` → صفحات/تبويبات. الحالة عبر Contexts (`AuthContext`, `LanguageContext`, `ThemeContext`, `NotificationContext`).
- **الخادم**: Express 5 في `server/index.js` (منفذ 3000؛ Vite middleware في التطوير؛ Vercel عبر `api/index.js`). كل `/api` محمي بـ `server/middleware/auth.js` (Firebase ID token).
- **البيانات**: Firebase Auth/Firestore/Storage/FCM. بعض المسارات القديمة ما زالت على `server/database.js` (JSON محلي) — انظر قسم العيوب.
- **الذكاء**: Gemini (`@google/genai`) + HuggingFace Whisper للتسميع.

## العيوب المكتشفة
### 🐞 خلل (8)
- `server/index.js` — PUT/DELETE /api/admin/user/:uid و GET /api/quran/pages و/portfolio تستخدم database.js القديم (ملف db.json)، بينما المستخدمون الحقيقيون في Firestore — تعديل/حذف مستخدم من هنا لا يؤثر على حسابه الحقيقي.
- `src/components/Community.jsx` — لوحة 'التنافس' بيانات وهمية مكتوبة في الكود (3 أسماء ثابتة + المستخدم الحالي بـ 2,450 XP و14 يومًا ثابتة) — لا تعكس أي بيانات حقيقية.
- `src/components/FiveFortressesPlan.jsx` — يعرّف getSurahNameForPage وgetJuzForPage محليًا بقيم تقريبية (الصفحات 305–582 كلها 'عموم السور المتوسطة'، والجزء = ceil(page/20)) بدل utils/quranData — اسم السورة والجزء خاطئان في هذا التبويب.
- `src/components/admin/AdminDashboard.jsx` — تبويب 'إدارة المنتدى' يعرض منشورين وهميين ثابتين وأزراره لا تفعل شيئًا.
- `src/components/onboarding/JoinGroupModal.jsx` — زر 'المتابعة كحافظ مستقل' يستدعي leave فورًا بلا تأكيد — عضو في حلقة يفتح 'إدارة العضوية' ثم يختاره يخرج من حلقته.
- `src/components/teacher/TeacherStudentsView.jsx` — نموذج الإضافة يجعل البريد 'اختياريًا'، لكن الخادم يتطلب حسابًا مسجلًا (studentUid أو بريد مطابق) — الإضافة بالاسم فقط تفشل دائمًا بـ 'معرف الطالب مطلوب'. حقلا 'عدد الأجزاء' و'الورد' يُرسلان ويتجاهلهما الخادم.
- `src/lib/firebase.js` — requestFcmToken ترسل POST إلى /api/notifications/register-token، لكن هذا المسار غير معرّف في الخادم (routes/community.js فيه فقط GET/PATCH/DELETE للإشعارات) — الخطأ يُبتلع بصمت، فالخادم لا يعرف التوكن أبدًا.
- `src/pages/OnboardingWizard.jsx` — رفع الصورة يكتب في avatars/{uid}_{time} لكن storage.rules تسمح فقط بـ avatars/{uid}/{file} — الرفع يُرفض دائمًا ويظهر alert 'فشل رفع الصورة' (UserProfileModal يستخدم المسار الصحيح).

### ⧉ تكرار (3)
- `server/recitationEngine.js` — في المسار الأول (Gemini مباشر) الدقة يقررها النموذج نفسه لا الخوارزمية — النتيجة قد تختلف عن تلوين الكلمات المحسوب.
- `src/components/MyPlanManager.jsx` — تغيير الأجزاء المحفوظة هنا يحدّث selectedJuzList فقط ولا يحدّث studentDeclaredPages (التي يحسبها المعالج) — الصفحة الحالية والخريطة لا تتغير.
- `src/context/AuthContext.jsx` — إنشاء مستند المستخدم الافتراضي مكرر مرتين (signup، loadAuthenticatedProfile) — أي تعديل على الحقول الافتراضية يجب تكراره، وإلا ترفضه قاعدة isSafeInitialUser.

### ☠ ميت (14)
- `server/db.js` — صفر مستوردين في كل المشروع (بما فيه الاختبارات والسكربتات).
- `server/safarEcosystem.js` — صفر مستوردين (يُذكر اسمه نصيًا فقط في DocumentationModal). 83KB يمكن حذفها مع safar_data*.json.
- `src/components/AdminPanel.jsx` — Dashboard يستورده لكن case 'admin-panel' الذي يعرضه يأتي بعد case 'admin-panel' آخر في نفس switch — غير قابل للوصول.
- `src/components/AudioWaveVisualizer.jsx` — النتيجة Math.random — يجب ألا يُعاد استخدامه كما هو.
- `src/components/ErrorBoundary.jsx` — صفر مستوردين في الكود؛ SafeBoundary.jsx نفسه يصدّر ErrorBoundary أيضًا، فهذا الملف زائد مرتين.
- `src/components/QuranAudioPlayer.jsx` — قائمة القراء وروابط الصوت منسوخة حرفيًا في QuranInteractiveView.
- `src/components/admin/AdminBadgesView.jsx` — 
- `src/components/admin/AdminCommunityView.jsx` — 
- `src/components/fortress/FortressSetupWizard.jsx` — 
- `src/components/quranMap/QuranMapSurahCard.jsx` — 
- `src/components/quranMap/QuranSurahAyahsModal.jsx` — لو أعيد تفعيلها: تستدعي stopAndAnalyze بلا userId فلا تُحفظ المحاولة في الخادم، و'تحديد السورة كمحفوظة' يضع recitationScore=98 وتكرار 40 وهميين.
- `src/counter.ts` — 
- `src/main.ts` — يمكن حذفه مع counter.ts وstyle.css وassets/typescript.svg وvite.svg وhero.png.
- `src/utils/quranAiEngine.js` — صفر مستوردين؛ حل محله /api/ai/chat في الخادم.

## خريطة طلبات API (عميل → ملف الخادم)
- `src/components/AiAssistant.jsx` → `server/index.js`
- `src/components/AnalyticsView.jsx` → `server/routes/groups.js`
- `src/components/Community.jsx` → `server/routes/community.js`
- `src/components/FiveFortressesPlan.jsx` → `server/index.js`
- `src/components/QuranInteractiveView.jsx` → `server/index.js`
- `src/components/SimilaritiesView.jsx` → `server/index.js`
- `src/components/admin/AdminDashboard.jsx` → `server/routes/groups.js`
- `src/components/admin/AdminDistributionView.jsx` → `server/routes/groups.js`
- `src/components/admin/AdminPerformanceDashboard.jsx` → `server/routes/groups.js`
- `src/components/admin/AdminPerformanceDashboard.jsx` → `server/index.js`
- `src/components/onboarding/JoinGroupModal.jsx` → `server/routes/groups.js`
- `src/components/quranMap/QuranSurahAyahsModal.jsx` → `server/index.js`
- `src/components/teacher/TeacherGroupsView.jsx` → `server/routes/groups.js`
- `src/components/teacher/TeacherReportsView.jsx` → `server/routes/groups.js`
- `src/components/teacher/TeacherStudentProfileModal.jsx` → `server/routes/groups.js`
- `src/components/teacher/TeacherStudentsView.jsx` → `server/routes/groups.js`
- `src/context/NotificationContext.jsx` → `server/routes/community.js`
- `src/hooks/useRecitationRecorder.js` → `server/index.js`
- `src/lib/firebase.js` → `server/routes/community.js`
- `src/lib/fortressService.js` → `server/index.js`
- `src/lib/learningProfileService.js` → `server/index.js`
- `src/pages/OnboardingWizard.jsx` → `server/routes/groups.js`

## طبقة: مشترك (Cross-cutting)
_سياقات، Firebase، api، ترجمة، عناصر UI عامة — يستخدمها الجميع_

### `src/components/ErrorBoundary.jsx` **[☠ ميت]**
- **يفعل:** سطر واحد يعيد تصدير SafeBoundary باسم ErrorBoundary.
- **لماذا:** توافق مع اسم قديم.
- **إن تعطّل:** لا شيء — لا أحد يستورده.
- **انتبه:** صفر مستوردين في الكود؛ SafeBoundary.jsx نفسه يصدّر ErrorBoundary أيضًا، فهذا الملف زائد مرتين.
- **يستخدم:** SafeBoundary.jsx

### `src/components/SafeBoundary.jsx`
- **يفعل:** يلتقط أي خطأ عرض في الشجرة ويعرض بطاقة عربية مطمئنة مع نص الخطأ وزرين: استئناف (يصفّر الحالة) أو الذهاب إلى /dashboard.
- **لماذا:** في React الخطأ غير الملتقط يفرّغ الشاشة كلها؛ هذا يمنع الشاشة البيضاء.
- **متى:** يلف التطبيق كله في main.jsx، ويُستخدم أيضًا داخل Dashboard حول التبويبات.
- **إن تعطّل:** أي خطأ عرض = شاشة بيضاء.
- **انتبه:** زر الاستئناف يعيد عرض نفس الشجرة، فإن كان الخطأ ثابتًا سيظهر مجددًا فورًا.
- **يستخدمه:** ErrorBoundary.jsx, main.jsx, Dashboard.jsx

### `src/components/ThemeToggle.jsx`
- **يفعل:** زر تبديل الثيم بحركة framer-motion، touchTarget يكبّره لـ 44px على الجوال.
- **لماذا:** إمكانية الوصول (حجم لمس 44px).
- **متى:** في الهيدر.
- **إن تعطّل:** لا تبديل للثيم.
- **يستخدم:** ThemeContext.jsx, LanguageContext.jsx
- **يستخدمه:** LandingNavbar.jsx, Dashboard.jsx

### `src/components/ui/Button.jsx`
- **يفعل:** زر بأصناف btn-{variant} مع أيقونة اختيارية وحركة hover/tap.
- **لماذا:** توحيد شكل الأزرار.
- **إن تعطّل:** الأزرار التي تستخدمه تختفي.
- **يستخدمه:** FortressSetupWizard.jsx, OnboardingWizard.jsx

### `src/components/ui/Card.jsx`
- **يفعل:** div بصنف glass-card يرتفع 5px عند المرور (يمكن تعطيله بـ hover=false).
- **لماذا:** بطاقة زجاجية موحدة.
- **إن تعطّل:** البطاقات التي تستخدمه تختفي.
- **يستخدمه:** AnalyticsView.jsx, MindMapsView.jsx, SimilaritiesView.jsx, VisualProgressTracker.jsx, FortressSetupWizard.jsx, Dashboard.jsx, OnboardingWizard.jsx

### `src/components/ui/Logo.jsx`
- **يفعل:** شعار SVG (شكل كتاب/قلب بتدرج أخضر وذهبي) يُرسم بحركة framer-motion، مع نص اختياري.
- **لماذا:** هوية بصرية موحدة.
- **متى:** في نافذة الدخول، المعالج، وشريط وتذييل الصفحة التعريفية.
- **إن تعطّل:** يختفي الشعار.
- **يستخدمه:** AuthModal.jsx, LandingFooter.jsx, LandingNavbar.jsx, OnboardingWizard.jsx

### `src/context/AuthContext.jsx` **[⧉ تكرار]**
- **يفعل:** يستمع لـ onAuthStateChanged ويحمّل users/{uid} من Firestore (أو ينشئ مستندًا افتراضيًا إن لم يوجد)، مع منع تحميلين متزامنين لنفس المستخدم. يوفر: user، activeRole/availableRoles/setActiveRole (الدور النشط محفوظ في localStorage لكل مستخدم)، login/signup (Firebase Auth بريد+كلمة مرور، رسائل خطأ عربية)، loginWithGoogle (ينتظر loadAuthenticatedProfile ويرجع الملف الكامل حتى يكون user في السياق قبل التنقل)، logout، deleteAccount، updateUserData (يسمح فقط بـ name/photoURL/preferences/favorites/fortressPlan/hasCompletedWizard ويرفض حقول الحفظ)، applyConfirmedUser (يقبل ملفًا فقط إن كان persisted ولنفس المستخدم)، refreshUserData (من الخادم مباشرة getDocFromServer، يرفض الكاش والكتابات المعلقة)، hasRole.
- **لماذا:** قائمة الحقول المسموحة تطابق firestore.rules (isSafeProfileUpdate) حتى لا تُرفض الكتابة. الحماية من السباق (التحقق أن auth.currentUser لم يتغير قبل setUser) تمنع ظهور بيانات مستخدم سابق بعد تبديل الحساب.
- **متى:** يغلف التطبيق كله؛ لا يعرض أي شيء حتى ينتهي loading الأول. كل شاشة تقرأ user منه.
- **إن تعطّل:** التطبيق كله — 50+ ملفًا يستخدم useAuth.
- **انتبه:** إنشاء مستند المستخدم الافتراضي مكرر مرتين (signup، loadAuthenticatedProfile) — أي تعديل على الحقول الافتراضية يجب تكراره، وإلا ترفضه قاعدة isSafeInitialUser. | hasRole('teacher') يرجع true للمشرف، لكن grantedRoles لا يعطيه دور المعلم في مبدّل الأدوار. | deleteAccount يحذف حساب Auth فقط — مستند users/{uid} وبياناته الفرعية تبقى يتيمة. عند auth/requires-recent-login يعيد التحقق بنافذة جوجل لمستخدمي Google ثم يحذف؛ مستخدم البريد يُطلب منه الخروج والدخول من جديد. Dashboard لا ينتقل لـ / إلا عند النجاح. | signup لا يضبط activeRole (يبقى من الحالة السابقة). | login يستدعي loadAuthenticatedProfile بينما onAuthStateChanged يستدعيها أيضًا — منع التكرار عبر profileLoadsRef.
- **يستخدم:** firebase.js
- **يستخدمه:** AiAssistant.jsx, AuthModal.jsx, BottomNavBar.jsx, Community.jsx, FiveFortressesPlan.jsx, FiveFortressesVisualMap.jsx, LearningStyleProfiler.jsx, MindMapsView.jsx, MyPlanManager.jsx, ProtectedRoute.jsx, QuickSettingsMenu.jsx, QuranInteractiveView.jsx, QuranMapPage.jsx, Sidebar.jsx, SimplifiedFortressPlan.jsx, UserProfileModal.jsx, FortressSetupWizard.jsx, LandingFooter.jsx, LandingHero.jsx, LandingNavbar.jsx, JoinGroupModal.jsx, QuranSurahAyahsModal.jsx, TeacherDashboard.jsx, TeacherGroupsView.jsx, TeacherReportsView.jsx, TeacherStudentProfileModal.jsx, TeacherStudentsView.jsx, NotificationContext.jsx, useRecitationRecorder.js, main.jsx, Dashboard.jsx, LandingPage.jsx, OnboardingWizard.jsx

### `src/context/LanguageContext.jsx`
- **يفعل:** يحفظ اللغة (ar افتراضيًا) في localStorage مفتاح ma7fath_lang، ويضبط dir/lang على <html> (الخط من CSS: --font-body/--font-heading = IBM Plex Sans Arabic، و--font-quran = Noto Naskh Arabic للآيات والأحاديث)، ويوفر t(key) من قواميس i18n/ar وen.
- **لماذا:** التطبيق ثنائي اللغة وعربي أولًا؛ اتجاه RTL يجب أن يُضبط على مستوى المستند لا المكوّن.
- **متى:** عند الإقلاع وعند كل تغيير لغة.
- **إن تعطّل:** useLanguage ترمي خطأ خارج المزوّد → تنهار أي شاشة تستخدمه.
- **انتبه:** معظم المكوّنات تكتب نصوصها العربية مباشرة ولا تستخدم t()، فتغيير اللغة لا يترجم كل شيء.
- **يستخدم:** ar.js, en.js
- **يستخدمه:** AudioWaveVisualizer.jsx, AuthModal.jsx, BottomNavBar.jsx, CelebrationOverlay.jsx, DocumentationModal.jsx, FiveFortressesPlan.jsx, FiveFortressesVisualMap.jsx, FloatingAiButton.jsx, JuzMultiSelector.jsx, LearningStyleProfiler.jsx, MindMapsView.jsx, MoreToolsModal.jsx, MyPlanManager.jsx, NotificationCenter.jsx, PresentationModal.jsx, PullToRefresh.jsx, QuickSettingsMenu.jsx, QuranAudioPlayer.jsx, QuranInteractiveView.jsx, QuranMapPage.jsx, ReviewReminderAlert.jsx, Sidebar.jsx, ThemeToggle.jsx, UserProfileModal.jsx, AdminDashboard.jsx, AdminDistributionView.jsx, AdminPerformanceDashboard.jsx, LandingFAQ.jsx, LandingFeatures.jsx, LandingFooter.jsx, LandingHero.jsx, LandingNavbar.jsx, LandingScreens.jsx, JoinGroupModal.jsx, TeacherDashboard.jsx, TeacherGroupsView.jsx, TeacherReportsView.jsx, TeacherStudentProfileModal.jsx, TeacherStudentsView.jsx, main.jsx, Dashboard.jsx, OnboardingWizard.jsx

### `src/context/NotificationContext.jsx`
- **يفعل:** يجمع ثلاثة أشياء: (1) إشعارات الخادم (/api/notifications: جلب، مقروء، حذف) مدموجة مع إشعارات محلية (تذكير/إنجاز) معلّمة بـ source. (2) تذكير المراجعة اليومي: إعدادات في localStorage (ma7fath_daily_reminder، الافتراضي 20:30)، فحص كل 20 ثانية، تأجيل، نغمة Web Audio، إشعار نظام عبر Service Worker، ونافذة تنبيه داخلية. (3) الاحتفالات والـ toast والصوت (notifyAndCelebrate، triggerCelebration بنغمة arpeggio).
- **لماذا:** مكان واحد لكل ما 'ينبّه' المستخدم، لأن التذكير والاحتفال والإشعار يتشاركون إعداد الصوت.
- **متى:** يُحمَّل بعد AuthProvider؛ يجلب إشعارات الخادم عند تغير المستخدم؛ مؤقت التذكير يعمل طالما التطبيق مفتوح.
- **إن تعطّل:** NotificationCenter وReviewReminderAlert وCelebrationOverlay وDashboard وكل من يستدعي notifyAndCelebrate.
- **انتبه:** التذكير يعمل فقط والتطبيق مفتوح (setInterval في المتصفح) — لا يوجد جدولة من الخادم. | lastTriggeredDate يُحسب بتاريخ UTC بينما وقت التذكير بالتوقيت المحلي. | markAllAsRead وclearAll يستدعيان الخادم حتى لو كانت كل الإشعارات محلية. | الإشعارات المحلية تضيع عند تحديث الصفحة.
- **يستخدم:** AuthContext.jsx, api.js, community.js
- **يستخدمه:** CelebrationOverlay.jsx, FiveFortressesVisualMap.jsx, MindMapsView.jsx, NotificationCenter.jsx, QuranMapPage.jsx, ReviewReminderAlert.jsx, SimplifiedFortressPlan.jsx, QuranSurahAyahsModal.jsx, main.jsx, Dashboard.jsx

### `src/context/ThemeContext.jsx`
- **يفعل:** isDark من localStorage('theme') أو تفضيل النظام، ويضيف/يزيل class 'dark' على body.
- **لماذا:** الثيم الليلي الزمردي مطبق عبر CSS variables مرتبطة بـ body.dark.
- **متى:** عند الإقلاع وعند الضغط على ThemeToggle.
- **إن تعطّل:** الثيم يعلق على وضع واحد.
- **يستخدمه:** ThemeToggle.jsx, main.jsx, Dashboard.jsx

### `src/i18n/ar.js`
- **يفعل:** مفاتيح النصوص العربية للصفحة التعريفية والتنقل (nav_*, hero_*, stats_*, showcase_*...).
- **لماذا:** مصدر t() في LanguageContext.
- **إن تعطّل:** تظهر المفاتيح بدل النصوص.
- **انتبه:** يغطي أساسًا الصفحة التعريفية؛ معظم اللوحة نصوصها مكتوبة مباشرة في المكونات.
- **يستخدمه:** LanguageContext.jsx

### `src/i18n/en.js`
- **يفعل:** نفس مفاتيح ar.js بالإنجليزية.
- **لماذا:** دعم اللغة الإنجليزية.
- **إن تعطّل:** تظهر المفاتيح عند اختيار الإنجليزية.
- **يستخدمه:** LanguageContext.jsx

### `src/lib/api.js`
- **يفعل:** fetchWithAuth(url, options): تأخذ ID Token من auth.currentUser وتضيفه كـ Authorization: Bearer، وتحوّل body الكائن إلى JSON تلقائيًا، ثم ترجع Response الخام (لا تفحص res.ok ولا تحلل JSON).
- **لماذا:** هي الباب الوحيد الموحّد لكل طلبات /api المحمية؛ الخادم (middleware/auth.js) يرفض أي طلب بلا توكن. بدونها كل مكوّن سيكرر منطق التوكن.
- **متى:** تُستدعى عند كل طلب محمي للخادم. إن لم يكن هناك مستخدم مسجل ترمي خطأ فورًا قبل الإرسال.
- **إن تعطّل:** كل استدعاءات calls_api في الخريطة (~20 ملفًا) تتوقف.
- **انتبه:** ترمي استثناء (لا ترجع Response) إذا لم يكن المستخدم مسجلًا — يجب لفّها بـ try/catch. | تُعدّل options.body في مكانها (mutation) عند تحويله لـ JSON. | بعض الطلبات تستخدم fetch العادي بدلها عمدًا (lookup، quran/reference) لأنها عامة.
- **يستخدم:** firebase.js
- **يستخدمه:** AiAssistant.jsx, AnalyticsView.jsx, Community.jsx, FiveFortressesPlan.jsx, QuranInteractiveView.jsx, QuranMapPage.jsx, SimilaritiesView.jsx, AdminDashboard.jsx, AdminDistributionView.jsx, AdminPerformanceDashboard.jsx, JoinGroupModal.jsx, TeacherDashboard.jsx, TeacherGroupsView.jsx, TeacherReportsView.jsx, TeacherStudentProfileModal.jsx, TeacherStudentsView.jsx, NotificationContext.jsx, useRecitationRecorder.js, fortressService.js, learningProfileService.js, OnboardingWizard.jsx

### `src/lib/firebase.js` **[🐞 خلل]**
- **يفعل:** تهيئ تطبيق Firebase مرة واحدة (على al-mahfath.vercel.app يصبح authDomain هو نفس النطاق، وvercel.json يمرّر /__/auth/* إلى firebaseapp.com) وتصدّر auth وdb (Firestore) وstorage وgoogleProvider. تربط المحاكيات المحلية إذا اختار firebaseEmulatorConfig ذلك. توفر requestFcmToken (طلب إذن الإشعارات، أخذ توكن FCM، حفظه في localStorage وفي users/{uid}.fcmToken، وإرساله للخادم) وonForegroundMessage. تجري testConnection عند التحميل.
- **لماذا:** نقطة الاتصال الوحيدة بـ Firebase لكل الواجهة؛ الإعدادات تأتي من firebase-applet-config.json في الجذر.
- **متى:** تُنفَّذ عند تحميل أول ملف يستوردها (AuthContext عبر main.jsx) قبل ظهور أي شاشة.
- **إن تعطّل:** AuthContext وكل من يقرأ Firestore مباشرة (لوحات المعلم والمشرف، الخدمات) ينكسرون.
- **انتبه:** requestFcmToken ترسل POST إلى /api/notifications/register-token، لكن هذا المسار غير معرّف في الخادم (routes/community.js فيه فقط GET/PATCH/DELETE للإشعارات) — الخطأ يُبتلع بصمت، فالخادم لا يعرف التوكن أبدًا. | مفتاح VAPID مكتوب داخل الكود. | مهلة إعادة محاولة Storage مضبوطة على 30 ثانية (الافتراضي 10 دقائق كان يعلّق نافذة رفع الصورة). | كل نطاق في SAME_SITE_AUTH_HOSTS يجب إضافة https://<host>/__/auth/handler له في Authorized redirect URIs لعميل Google OAuth، وإلا يفشل الدخول بجوجل بخطأ redirect_uri_mismatch.
- **يستخدم:** firebaseEmulatorConfig.js, community.js
- **يستخدمه:** AuthModal.jsx, FiveFortressesPlan.jsx, UserProfileModal.jsx, AdminDashboard.jsx, AuthContext.jsx, api.js, fortressService.js, learningProfileService.js, portfolioService.js, uiConfiguration.js, OnboardingWizard.jsx, NotificationManager.js

### `src/lib/firebaseEmulatorConfig.js`
- **يفعل:** resolveFirebaseTarget: ترجع إعدادات الإنتاج دائمًا ما لم يكن VITE_MA7FATH_EMULATOR=1، وعندها تشترط وضع emulator + DEV + مضيف محلي وإلا ترمي خطأ، وترجع إعدادات مشروع demo.
- **لماذا:** حاجز أمان: يمنع أي بناء إنتاجي من الاتصال بالمحاكي بالخطأ، ويمنع اختبارات المحاكي من لمس قاعدة الإنتاج (يقابله server/emulatorSafety.js).
- **متى:** مرة واحدة عند تحميل firebase.js.
- **إن تعطّل:** إما أن يتصل الإنتاج بمحاكي غير موجود، أو تكتب الاختبارات في بيانات حقيقية.
- **يستخدمه:** firebase.js

### `src/lib/navigation.js`
- **يفعل:** getNavigation(role, lang, configuration) يرجع { sections, primary }: أقسام القائمة حسب الدور (admin/teacher/طالب) بعناوين عربية/إنجليزية وأيقونات lucide، وprimary = المعرّفات الأربعة المثبتة في الشريط السفلي. للطالب يطبّق ظهور وترتيب المجتمع والأوسمة من uiConfiguration. isNavItemActive يعامل admin-panel كـ admin-dashboard وmushaf كـ daily-session.
- **لماذا:** مصدر واحد للتنقل بدل ثلاث قوائم مكررة — إضافة تبويب = تعديل هذا الملف فقط.
- **متى:** عند كل عرض لـ Sidebar وBottomNavBar وMoreToolsModal.
- **إن تعطّل:** كل التنقل على سطح المكتب والجوال.
- **انتبه:** تبويب جديد يجب أن يكون له case في switch داخل Dashboard وإلا يظهر 'قيد التفعيل'.
- **يستخدمه:** Sidebar.jsx, BottomNavBar.jsx, MoreToolsModal.jsx

### `src/utils/platform.js`
- **يفعل:** isNativeMobile (Capacitor أصلي)، isStandalonePWA (مثبت كتطبيق)، isMobileEnvironment (أيهما)، getPlatform.
- **لماذا:** التطبيق يُنشر كويب وكتطبيق Android/iOS عبر Capacitor وكـ PWA؛ هذه الدوال تقرر أي واجهة تظهر (مثلًا تخطي صفحة الهبوط على الجوال).
- **متى:** عند العرض في LandingPage وDashboard وغيرها لاختيار التخطيط.
- **إن تعطّل:** يظهر مسار الويب داخل التطبيق الأصلي.
- **يستخدمه:** AuthModal.jsx, LandingPage.jsx

## طبقة: الهيكل والصفحات
_نقطة الدخول، التوجيه، الصفحات، التنقل، النوافذ العامة_

### `src/App.jsx`
- **يفعل:** ثلاثة مسارات فقط: / (LandingPage عام)، /wizard (OnboardingWizard، محمي ويشترط عدم إكمال المعالج)، /dashboard (Dashboard، محمي ويشترط إكمال المعالج).
- **لماذا:** كل التنقل الداخلي يحدث داخل Dashboard عبر تبويبات (state) لا عبر مسارات URL.
- **متى:** عند كل تغيير مسار.
- **إن تعطّل:** لا تنقل بين الصفحات الثلاث.
- **انتبه:** لا يوجد مسار 404 ولا مسارات للتبويبات — تحديث الصفحة يعيدك للتبويب الافتراضي.
- **يستخدم:** LandingPage.jsx, Dashboard.jsx, OnboardingWizard.jsx, ProtectedRoute.jsx
- **يستخدمه:** main.jsx

### `src/components/AuthModal.jsx`
- **يفعل:** تسجيل دخول/إنشاء حساب بالبريد عبر useAuth، أو Google بـ signInWithPopup على كل الأجهزة (redirect فقط إن حُظرت النافذة: auth/popup-blocked). بعد النجاح يوجّه لـ /dashboard أو /wizard حسب isAccountReady.
- **لماذا:** signInWithRedirect لا يعمل على Safari وChrome في الجوال: authDomain هو firebaseapp.com والتطبيق على Vercel، فالمتصفح يحجب التخزين عبر المواقع ويعود المستخدم للصفحة دون دخول. لذلك popup حتى على الجوال.
- **متى:** عند نقر 'تسجيل الدخول/ابدأ' في الصفحة التعريفية.
- **إن تعطّل:** لا يمكن الدخول.
- **انتبه:** لا ترجع إلى redirect للجوال — يكسر الدخول بجوجل هناك. رسالة الخطأ تعرض رمز Firebase (مثل auth/popup-closed-by-user) للتشخيص. | isAccountReady نسخة من منطق ProtectedRoute.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, firebase.js, Logo.jsx, platform.js
- **يستخدمه:** LandingPage.jsx

### `src/components/BottomNavBar.jsx`
- **يفعل:** شريط سفلي ثابت بالتبويبات الأربعة primary من navigation.js حسب الدور النشط + زر 'المزيد' (يفتح MoreToolsModal). اهتزاز خفيف عند النقر.
- **لماذا:** نمط تنقل التطبيقات على الجوال بدل الدرج.
- **متى:** عندما يكون عرض الشاشة ≤ 768px.
- **إن تعطّل:** تنقل الجوال.
- **انتبه:** زر 'المزيد' يبدو نشطًا لأي تبويب غير موجود في الشريط.
- **يستخدم:** LanguageContext.jsx, AuthContext.jsx, uiConfiguration.js, navigation.js
- **يستخدمه:** Dashboard.jsx

### `src/components/DocumentationModal.jsx`
- **يفعل:** دليل داخل التطبيق بتسعة أقسام قابلة للبحث: الرؤية، الحصون الخمسة، محرك الذكاء وGemini، أنماط الحفظ، خريطة المصحف، التسميع والقراء، المعمارية، مرجع REST API، التجاوب. زر طباعة وإغلاق بـ Escape.
- **لماذا:** توثيق للمستخدمين والمطورين ولعرض المشروع.
- **متى:** من تذييل الصفحة التعريفية، ومن 'المزيد' في اللوحة.
- **إن تعطّل:** لا توثيق (لا يؤثر على الوظائف).
- **انتبه:** المحتوى التقني قديم: يذكر SQLite3 (database.sqlite) وsafarEcosystem و/api/quran/pages كمسارات أساسية، بينما البيانات الحقيقية الآن في Firestore — لا تعتمد عليه كمرجع للمعمارية.
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** Dashboard.jsx, LandingPage.jsx

### `src/components/FloatingAiButton.jsx`
- **يفعل:** زر 'المعلم الذكي' فوق الشريط السفلي (أعلى في صفحة التسميع)، يفتح AiAssistant في ورقة سفلية ويقفل تمرير الصفحة. يستمع لحدث window 'open-ai-teacher' لفتحه من أي مكان.
- **لماذا:** الوصول للمساعد من أي تبويب بنقرة.
- **متى:** على الجوال، ما عدا تبويب ai-assistant.
- **إن تعطّل:** لا مساعد عائم.
- **انتبه:** المستمع لحدث 'open-ai-teacher' لا يُطلقه أي ملف في المشروع (كود ميت داخل المكوّن).
- **يستخدم:** LanguageContext.jsx, AiAssistant.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/MoreToolsModal.jsx`
- **يفعل:** يعرض أقسام getNavigation للدور النشط بعد حذف التبويبات الأربعة الموجودة في الشريط السفلي؛ النقر يضبط activeTab ويُغلق.
- **لماذا:** ما لا يتسع في الشريط السفلي.
- **متى:** عند نقر 'المزيد' على الجوال.
- **إن تعطّل:** لا وصول لهذه الأدوات على الجوال.
- **يستخدم:** LanguageContext.jsx, AuthContext.jsx, uiConfiguration.js, navigation.js
- **يستخدمه:** Dashboard.jsx

### `src/components/PWAInstallButton.jsx`
- **يفعل:** لا يظهر إن كان التطبيق مثبتًا. على Chromium: زر يستدعي prompt التثبيت. على iOS: زر يفتح دليل 'مشاركة ← إضافة للشاشة الرئيسية'.
- **لماذا:** Safari لا يدعم التثبيت البرمجي.
- **متى:** أسفل الـ Sidebar.
- **إن تعطّل:** لا زر تثبيت.
- **يستخدم:** usePWAInstall.js
- **يستخدمه:** Sidebar.jsx

### `src/components/PresentationModal.jsx`
- **يفعل:** عرض تقديمي من 8 شرائح (المنصة، أزمة التفلت، أتمتة الحصون، سير العمل، الأدوات، التحفيز، المعمارية، الرؤية) مع تنقل بالأسهم، ملء الشاشة، ملاحظات المتحدث، نسخ النص، وطباعة.
- **لماذا:** عرض المشروع (pitch deck) من داخل التطبيق.
- **متى:** من قائمة 'المزيد' (presentation).
- **إن تعطّل:** لا عرض (لا يؤثر على الوظائف).
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/ProtectedRoute.jsx`
- **يفعل:** ينتظر loading، ثم إن لم يوجد مستخدم (في السياق أو احتياطًا في localStorage ma7fath_user) يحوّل لـ '/'. يعتبر المعالج مكتملًا إن كان hasCompletedWizard صحيحًا (true/1/'true') أو التفضيلات غير فارغة أو المستخدم معلم/مشرف. requireWizard=true ← يحوّل غير المكتمل لـ /wizard، وfalse ← يحوّل المكتمل لـ /dashboard.
- **لماذا:** الاحتياط من localStorage يمنع ارتدادًا للصفحة الرئيسية في لحظة تحديث الحالة بعد الدخول.
- **متى:** عند كل دخول لـ /wizard أو /dashboard.
- **إن تعطّل:** إما وصول بلا تسجيل أو حلقة تحويل.
- **انتبه:** منطق 'هل أكمل المعالج' مكرر حرفيًا في AuthModal.isAccountReady. | أي كتابة في preferences قبل إكمال المعالج تجعله يُعتبر مكتملًا.
- **يستخدم:** AuthContext.jsx
- **يستخدمه:** App.jsx

### `src/components/PullToRefresh.jsx`
- **يفعل:** سحب للأسفل (عتبة 65px، أقصى 110، تخميد ×0.46) يستدعي onRefresh ويتوقع {success:true} وإلا يعرض خطأ وزر إعادة. يتجاهل السحب الأفقي.
- **لماذا:** إحساس التطبيق الأصلي على الجوال.
- **متى:** في Dashboard على الجوال.
- **إن تعطّل:** لا تحديث بالسحب.
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/QuickSettingsMenu.jsx`
- **يفعل:** تحديث ملف الحساب (يبتلع الخطأ لأن Dashboard يعرضه)، تبديل الصوت، تبديل اللغة، الملف الشخصي، تسجيل الخروج. يغلق عند النقر خارجه.
- **لماذا:** تجميع أزرار الهيدر على الشاشات الضيقة (لابتوب وجوال).
- **متى:** على الجوال وعلى الشاشات < 1340px.
- **إن تعطّل:** لا وصول لهذه الخيارات على الشاشات الصغيرة.
- **يستخدم:** LanguageContext.jsx, AuthContext.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/Sidebar.jsx`
- **يفعل:** قائمة جانبية تعرض sections من getNavigation للدور النشط (المشرف، المعلم، الطالب — المجتمع والأوسمة حسب uiConfiguration). زر تثبيت PWA وبطاقة المستخدم وتسجيل الخروج. يعيد الطالب للرئيسية إن أخفى المشرف القسم المفتوح.
- **لماذا:** التنقل الأساسي على سطح المكتب؛ على الجوال يصبح درجًا منزلقًا مع خلفية معتمة.
- **متى:** دائمًا داخل Dashboard.
- **إن تعطّل:** لا تنقل على سطح المكتب.
- **انتبه:** تبويبات admin-distribution/performance/experience غير موجودة هنا (تُفتح من داخل AdminDashboard).
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, PWAInstallButton.jsx, uiConfiguration.js, navigation.js
- **يستخدمه:** Dashboard.jsx

### `src/components/UserProfileModal.jsx`
- **يفعل:** تعديل الاسم ورفع صورة (jpeg/png/webp/gif ≤ 2MB) إلى Storage avatars/{uid}/، ثم حفظ الرابط عبر updateUserData؛ يحذف الملف المرفوع إن فشل الحفظ. يعرض المستوى والـ streak.
- **لماذا:** الحدود تطابق storage.rules (2MB، image/*).
- **متى:** من الهيدر أو الشريط السفلي.
- **إن تعطّل:** لا تعديل للملف.
- **انتبه:** يتطلب تفعيل Firebase Storage في المشروع — حتى 2026-10-07 الحاوية gen-lang-client-0651186360.firebasestorage.app ترد 404 فكل رفع يفشل. مهلة الرفع 30 ثانية (firebase.js) ورسالة الخطأ تعرض رمز Firebase. | خانة 'الحصون' تعرض 5 ثابتة دائمًا. | الصور القديمة لا تُحذف عند رفع جديدة.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, firebase.js
- **يستخدمه:** Dashboard.jsx

### `src/components/mobile/MobileWelcomeView.jsx`
- **يفعل:** شعار، ميزتان (الحصون الخمسة، التسميع الذكي)، زر 'ابدأ' (signup) وزر 'لدي حساب' (login).
- **لماذا:** تطبيق مثبت لا يحتاج صفحة تسويقية طويلة.
- **متى:** LandingPage على الجوال بلا تسجيل.
- **إن تعطّل:** لا دخول من الجوال.
- **يستخدمه:** LandingPage.jsx

### `src/components/onboarding/JoinGroupModal.jsx` **[🐞 خلل]**
- **يفعل:** prompt ← enter_code ← confirm_group ← success. يبحث بالرمز عبر /api/groups/lookup (عام)، ينضم عبر /api/groups/join، أو 'المتابعة كحافظ مستقل' عبر /api/groups/leave، ثم refreshUserData.
- **لماذا:** الانضمام لحلقة اختياري؛ يمكن البقاء مستقلًا.
- **متى:** من بطاقة الحلقة في رئيسية الطالب.
- **إن تعطّل:** لا انضمام من اللوحة (المعالج له منطقه الخاص).
- **انتبه:** زر 'المتابعة كحافظ مستقل' يستدعي leave فورًا بلا تأكيد — عضو في حلقة يفتح 'إدارة العضوية' ثم يختاره يخرج من حلقته. | يعرض membersCount وteacherAvatar لكن الخادم لا يرجعهما في lookup — يظهر 'undefined طالبة' وصورة افتراضية. | منطق lookup/join مكرر في OnboardingWizard.
- **يستخدم:** AuthContext.jsx, api.js, LanguageContext.jsx, groups.js
- **يستخدمه:** Dashboard.jsx

### `src/counter.ts` **[☠ ميت]**
- **يفعل:** setupCounter لعداد نقرات — يستخدمه main.ts فقط.
- **لماذا:** لا سبب حالي.
- **إن تعطّل:** لا شيء.
- **يستخدمه:** main.ts

### `src/hooks/usePWAInstall.js`
- **يفعل:** يلتقط حدث beforeinstallprompt، ويكشف هل التطبيق مثبت (standalone) وهل الجهاز iOS، ويوفر install().
- **لماذا:** iOS لا يدعم beforeinstallprompt فيحتاج تعليمات يدوية؛ لذلك isIOS.
- **متى:** عند تحميل أي مكوّن يعرض زر التثبيت.
- **إن تعطّل:** زر التثبيت لا يظهر.
- **يستخدمه:** PWAInstallButton.jsx

### `src/main.jsx`
- **يفعل:** يركّب React داخل #root بترتيب المزوّدات: SafeBoundary ← Auth ← Language ← Theme ← Notification ← App، ويستورد index.css.
- **لماذا:** ترتيب المزودات مهم: NotificationContext يحتاج useAuth، وAuth يحجب العرض حتى يُحمَّل المستخدم.
- **متى:** مرة واحدة عند فتح الصفحة.
- **إن تعطّل:** التطبيق كله لا يعمل.
- **انتبه:** AuthProvider خارج LanguageProvider، فلا يستطيع استخدام الترجمة.
- **يستخدم:** App.jsx, ThemeContext.jsx, AuthContext.jsx, LanguageContext.jsx, NotificationContext.jsx, SafeBoundary.jsx

### `src/main.ts` **[☠ ميت]**
- **يفعل:** صفحة 'Get started' من قالب Vite+TypeScript الافتراضي تكتب في #app.
- **لماذا:** لا سبب حالي — من إنشاء المشروع.
- **إن تعطّل:** لا شيء.
- **انتبه:** يمكن حذفه مع counter.ts وstyle.css وassets/typescript.svg وvite.svg وhero.png.
- **يستخدم:** counter.ts

### `src/pages/Dashboard.jsx`
- **يفعل:** الحاوية المركزية بعد الدخول. activeTab (حالة، لا URL) يختار المحتوى: للطالب home (بطاقة الحلقة، ورد اليوم، الصفحات المصرّح بها، الـ streak، الحصون الخمسة بنقرة، روابط سريعة، حديث متغير كل 6 ثوانٍ)، quran-map، daily-session (المصحف التفاعلي + أذكار)، my-plan، five-fortresses، ai-assistant، community، achievements (شارات من uiConfiguration)، analytics، mind-maps، similarities؛ للمعلم teacher-*؛ للمشرف admin-*. يدير الهيدر (اسم، streak، مبدّل الأدوار، تحديث الحساب، لغة، صوت، إشعارات، ثيم، قائمة الحساب، حذف الحساب)، Sidebar وBottomNavBar وكل النوافذ (الملف، العرض، التوثيق، الحلقة، ملف الطالب، التذكير، الاحتفال).
- **لماذا:** تبديل التبويب الافتراضي حسب الدور النشط عند تغيّر المستخدم أو الدور. تعليم الحصن من الرئيسية يقرأ الخطة المحفوظة أولًا ثم يعدّل علامة واحدة (لا يستبدل الخطة).
- **متى:** طوال جلسة المستخدم بعد المعالج.
- **إن تعطّل:** كل شيء بعد تسجيل الدخول.
- **انتبه:** case 'admin-panel' مكرر في switch؛ الثاني (AdminPanel) لا يُصل إليه أبدًا. | التبويبات ليست في الـ URL — تحديث الصفحة يعيد للتبويب الافتراضي ولا يمكن مشاركة رابط لتبويب. | selectedQuranPage يبدأ بـ 2 لا بالصفحة الحالية للمستخدم. | بطاقة 'ثبات الحفظ' تعرض 'غير متاح' دائمًا (الخادم لا يوفّر memoryScore). | بعض الواردات غير مستخدمة (ThemeProvider، motion، VisualProgressTracker). | ~1200 سطر بأنماط inline — أكبر ملف في الهيكل.
- **يستخدم:** memorization.js, Card.jsx, Sidebar.jsx, ThemeContext.jsx, ThemeToggle.jsx, AuthContext.jsx, PullToRefresh.jsx, LanguageContext.jsx, AiAssistant.jsx, Community.jsx, QuranMapPage.jsx, PostSessionDhikr.jsx, AnalyticsView.jsx, VisualProgressTracker.jsx, QuranInteractiveView.jsx, SafeBoundary.jsx, LearningStyleProfiler.jsx, MyPlanManager.jsx, FiveFortressesPlan.jsx, quranData.js, NotificationCenter.jsx, NotificationContext.jsx, ReviewReminderAlert.jsx, CelebrationOverlay.jsx, AdminPanel.jsx, BottomNavBar.jsx, MoreToolsModal.jsx, UserProfileModal.jsx, PresentationModal.jsx, DocumentationModal.jsx, FloatingAiButton.jsx, QuickSettingsMenu.jsx, SimilaritiesView.jsx, MindMapsView.jsx, JoinGroupModal.jsx, TeacherDashboard.jsx, TeacherStudentsView.jsx, TeacherStudentProfileModal.jsx, TeacherGroupsView.jsx, TeacherReportsView.jsx, AdminDashboard.jsx, uiConfiguration.js, fortressService.js
- **يستخدمه:** App.jsx

### `src/pages/LandingPage.jsx`
- **يفعل:** يحوّل المستخدم المسجل لـ /dashboard. على الجوال/PWA بلا تسجيل يعرض MobileWelcomeView المختصرة؛ وعلى الويب صفحة بسيطة من 5 مكوّنات (Navbar، Hero، Features، FAQ، Footer) مع نوافذ التوثيق وتسجيل الدخول.
- **لماذا:** فصل تجربة التطبيق المثبت (دخول مباشر) عن موقع التعريف.
- **متى:** عند فتح الجذر.
- **إن تعطّل:** لا صفحة رئيسية.
- **يستخدم:** AuthContext.jsx, AuthModal.jsx, LandingNavbar.jsx, LandingHero.jsx, LandingFeatures.jsx, LandingScreens.jsx, LandingFAQ.jsx, LandingFooter.jsx, DocumentationModal.jsx, MobileWelcomeView.jsx, platform.js
- **يستخدمه:** App.jsx

### `src/pages/OnboardingWizard.jsx` **[🐞 خلل]**
- **يفعل:** 5 خطوات: (1) الاسم والصورة واختيار المسار: رمز حلقة (تحقق عبر /api/groups/lookup) أو حافظ مستقل؛ (2) اختبار النمط التعليمي (learningQuizData) أو اختيار يدوي؛ (3) الدافع؛ (4) وحدة التتبع (صفحات/أجزاء/سور)، الأجزاء المحفوظة مسبقًا (JuzMultiSelector)، معدل المراجعة، والخطة آليًا أو يدويًا؛ (5) شاشة 'تحليل' ثم ملخص. عند الإنهاء: يحوّل الأجزاء المختارة إلى قائمة صفحات studentDeclaredPages، ويحفظ name/photoURL/preferences/hasCompletedWizard=true عبر updateUserData، ثم ينضم للحلقة عبر /api/groups/join إن تحقق الرمز، ثم /dashboard.
- **لماذا:** قاعدة isSafeOnboardingUpdate في Firestore تسمح بقلب hasCompletedWizard من false إلى true مرة واحدة فقط مع حقول الملف — لذلك كل شيء يُحفظ في كتابة واحدة. الانضمام للحلقة لاحقًا عبر الخادم لأن العضويات ممنوعة على العميل.
- **متى:** مرة واحدة لكل مستخدم جديد، يفرضها ProtectedRoute.
- **إن تعطّل:** المستخدم الجديد عالق — لا يصل للوحة أبدًا.
- **انتبه:** رفع الصورة يكتب في avatars/{uid}_{time} لكن storage.rules تسمح فقط بـ avatars/{uid}/{file} — الرفع يُرفض دائمًا ويظهر alert 'فشل رفع الصورة' (UserProfileModal يستخدم المسار الصحيح). | handleComplete يرمي أخطاء بلا try/catch وhandleNext لا ينتظره — إن فشل الحفظ أو الانضمام لا يرى المستخدم أي رسالة ويبقى الزر بلا استجابة. | الأجزاء الافتراضية [1, 30] = 40 صفحة مصرّح بها إن لم يغيّرها المستخدم. | خطوة 'التحليل بالذكاء الاصطناعي' مجرد مؤقت 2.5 ثانية. | منطق lookup/join مكرر مع JoinGroupModal.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, Button.jsx, Card.jsx, Logo.jsx, JuzMultiSelector.jsx, quranData.js, learningQuizData.js, firebase.js, api.js, groups.js
- **يستخدمه:** App.jsx

## طبقة: الصفحة التعريفية
_أقسام Landing للزوار — صفحة واحدة بسيطة: Navbar ← Hero ← المميزات ← جولة بالصور ← الحصون ← الأسئلة ← CTA وتذييل. التنسيق في أصناف lp-* داخل index.css._

### `src/components/landing/LandingFAQ.jsx`
- **يفعل:** خمسة أسئلة (مجاني؟ كيف يعمل التسميع؟ هل أحتاج حلقة؟ هل يُحفظ تقدمي؟ الأجهزة) بعناصر <details> الأصلية، الأول مفتوح.
- **لماذا:** <details> يعمل بلوحة المفاتيح وقارئ الشاشة دون JavaScript أو framer-motion. الإجابات تصف ما يفعله التطبيق فعلًا (التسميع تدريب لا اعتماد، ولا XP).
- **متى:** القسم #faq.
- **إن تعطّل:** قسم فارغ.
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** LandingPage.jsx

### `src/components/landing/LandingFeatures.jsx`
- **يفعل:** قسمان: #features (3 بطاقات: التسميع الصوتي، الحصون الخمسة، الحلقة والمعلمة) و#method (خطوات الحصون الخمسة مرقمة مع نسبة المنهجية لد. سعيد أبو العلا حمزة).
- **لماذا:** يختصر ما كان موزعًا على Showcase وMethodology وFeatures القديمة.
- **متى:** بعد Hero.
- **إن تعطّل:** قسمان فارغان؛ روابط Navbar لـ #features و#method لا تجد هدفًا.
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** LandingPage.jsx

### `src/components/landing/LandingFooter.jsx`
- **يفعل:** شريط دعوة أخضر داكن ('ابدأ وردك اليوم' → signup، أو لوحة الحفظ للمسجل)، ثم سطر سفلي: الشعار، إهداء وسنة، زر 'دليل المنصة' (onOpenDocs).
- **لماذا:** يدمج CTA القديم والتذييل في مكوّن واحد.
- **متى:** أسفل الصفحة.
- **إن تعطّل:** لا تذييل ولا دعوة ختامية.
- **يستخدم:** Logo.jsx, LanguageContext.jsx, AuthContext.jsx
- **يستخدمه:** LandingPage.jsx

### `src/components/landing/LandingHero.jsx`
- **يفعل:** إهداء قصير، العنوان، وصف بجملة واحدة، زران ('ابدأ مجانًا' → signup، 'لدي حساب' → login؛ أو 'متابعة لوحة الحفظ' للمسجل)، ثلاث نقاط (مجاني، الجوال والكمبيوتر، لغتان)، وصورة /quran_holy_book.jpg.
- **لماذا:** الانطباع الأول وزر التحويل الأساسي، بلا أرقام أو شارات مختلقة.
- **متى:** أول قسم (#top).
- **إن تعطّل:** قسم فارغ.
- **انتبه:** اختبار المتصفح (tests/firebase-browser.test.js) يضغط زر 'ابدأ مجانًا' بالاسم الحرفي — غيّر الاختبار إن غيّرت النص.
- **يستخدم:** LanguageContext.jsx, AuthContext.jsx
- **يستخدمه:** LandingPage.jsx

### `src/components/landing/LandingScreens.jsx`
- **يفعل:** قسم #screens 'جولة في المنصة': 5 تبويبات (التسميع، خريطة المصحف، الخرائط الذهنية، الحصون الخمسة، لوحة المعلمة) تعرض صورة واحدة كبيرة مع تعليق: voice_recitation_preview.png، quran_map_preview.png، mind_maps_preview.png، five_fortresses_preview.png، admin_analytics_preview.png من public/.
- **لماذا:** يُبقي لقطات المنصة ظاهرة بعد حذف LandingShowcase. صورة واحدة في كل مرة (مع loading=lazy) حتى لا تُحمَّل ~3MB دفعة واحدة.
- **متى:** يُمرَّر كـ children إلى LandingFeatures فيظهر بين المميزات والحصون.
- **إن تعطّل:** تختفي لقطات المنصة من الصفحة التعريفية.
- **انتبه:** الصور في public/ مطلوبة — لا تحذفها؛ هذا المكوّن هو المستخدم الوحيد لها.
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** LandingPage.jsx

### `src/components/landing/LandingNavbar.jsx`
- **يفعل:** الشعار (رابط #top)، 3 روابط أقسام (المميزات، الحصون الخمسة، الأسئلة)، تبديل اللغة (#landing-language-toggle) والثيم، وزر 'ابدأ الآن' (signup) أو 'لوحة الحفظ' و'خروج' للمسجل. على الجوال تظهر الروابط في .nav-links-mobile.
- **لماذا:** مدخل الزائر لكل الإجراءات.
- **متى:** أعلى الصفحة، ثابت عند التمرير.
- **إن تعطّل:** لا تنقل في الصفحة التعريفية.
- **انتبه:** الاختبارات تعتمد على نص 'ابدأ الآن' و#landing-language-toggle وعدد روابط .nav-links-mobile (3). لا تضف زرًا باسم 'تسجيل الدخول' هنا — يتعارض مع زر الإرسال في AuthModal داخل الاختبار.
- **يستخدم:** Logo.jsx, ThemeToggle.jsx, LanguageContext.jsx, AuthContext.jsx
- **يستخدمه:** LandingPage.jsx


## طبقة: ميزات الحافظ
_المصحف والتسميع، الحصون الخمسة، الخريطة، المتشابهات، المساعد، المجتمع_

### `src/components/AiAssistant.jsx`
- **يفعل:** يحمّل سجل المحادثة من GET /api/ai/chat عند تغير المستخدم، يرسل الرسائل إلى POST /api/ai/chat مع userContext (الصفحة/السورة/الجزء من التصريح الذاتي، النمط، الحصون اليوم، الهدف) ومهلة 12 ثانية، يمسح عبر DELETE. 6 أسئلة جاهزة حسب موقع المستخدم. نافذة لإدخال مفتاح Gemini شخصي يُحفظ في localStorage ويُرسل للخادم مع كل رسالة. يعرض Markdown بسيط (**عريض** وأسطر).
- **لماذا:** الخادم هو المرجع للسجل (تعليق: لا يُعرض كاش حساب آخر). المفتاح الشخصي يسمح بـ Gemini حقيقي إن لم يكن للخادم مفتاح؛ وإلا يرد الخادم بقوالب جاهزة.
- **متى:** عند فتح تبويب المساعد أو الزر العائم.
- **إن تعطّل:** لا مساعد.
- **انتبه:** مفتاح Gemini الشخصي يُرسل للخادم في جسم كل طلب ويبقى في localStorage نصًا صريحًا. | عند فشل الإرسال تُستعاد الرسائل السابقة ويعود النص لمربع الإدخال.
- **يستخدم:** memorization.js, api.js, AuthContext.jsx, quranData.js, server/index.js
- **يستخدمه:** FloatingAiButton.jsx, Dashboard.jsx

### `src/components/AnalyticsView.jsx`
- **يفعل:** تجلب /api/student/analytics وتعرض 6 مؤشرات (آيات مسجلة ذاتيًا، محاولات آخر 7 أيام، متوسط الدقة، 'صفحات معتمدة: غير متاح'، الـ streak، بانتظار مراجعة المعلم) ثم VisualProgressTracker.
- **لماذا:** فصل صريح بين ثلاثة مقاييس مستقلة: التصريح الذاتي، التدريب، مراجعة المعلم — ولا شيء منها 'حفظ معتمد'.
- **متى:** تبويب 'تحليلاتي'.
- **إن تعطّل:** التبويب يعرض خطأ.
- **يستخدم:** api.js, Card.jsx, VisualProgressTracker.jsx, groups.js
- **يستخدمه:** Dashboard.jsx

### `src/components/AudioWaveVisualizer.jsx` **[☠ ميت]**
- **يفعل:** يرسم موجة الصوت من الميكروفون (Web Audio) أو موجة متحركة مزيفة إن رُفض الإذن، ثم بعد 1.8 ثانية يعرض 'نتيجة' عشوائية بين 88% و98% مع نصوص تجويد ثابتة.
- **لماذا:** نموذج عرض أولي قبل وجود محرك تسميع حقيقي.
- **إن تعطّل:** لا شيء.
- **انتبه:** النتيجة Math.random — يجب ألا يُعاد استخدامه كما هو.
- **يستخدم:** LanguageContext.jsx

### `src/components/CelebrationOverlay.jsx`
- **يفعل:** تظهر عندما يضبط NotificationContext قيمة activeCelebration: قصاصات ملونة متحركة (canvas)، أيقونة حسب النوع (ورد/خريطة ذهنية/شارة)، العنوان والرسالة، 'مكافأة الخبرة' (+XP)، آية ﴿وفي ذلك فليتنافس المتنافسون﴾، وزر مشاركة ينسخ نصًا للحافظة.
- **لماذا:** تحفيز عاطفي عند الإنجاز.
- **متى:** بعد notifyAndCelebrate/triggerCelebration (إتمام محور خريطة ذهنية، آية، إلخ) أو النقر على إشعار إنجاز.
- **إن تعطّل:** لا احتفال (لا يؤثر على البيانات).
- **انتبه:** يعرض '+XP' لكن لا شيء يُضاف فعليًا للحساب — الخادم يرفض منح XP (rewardedXp=0) والعميل لا يستطيع كتابة xp.
- **يستخدم:** NotificationContext.jsx, LanguageContext.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/Community.jsx` **[🐞 خلل]**
- **يفعل:** تبويبان: (1) المنشورات: نشر (فئات: تثبيت وتدبر، متشابهات، تجويد، نصيحة؛ مع إخفاء الهوية)، تعديل/حذف للمالك أو المشرف، إعجاب، تعليق — كله عبر /api/community/*؛ زر 'مشاركة إنجازي' ينشر نصًا تلقائيًا بالصفحة والحصون. (2) 'الالتزام والتنافس'.
- **لماذا:** المجتمع للتحفيز وتبادل الفوائد بين الحفاظ.
- **متى:** تبويب المجتمع (إن لم يخفه المشرف).
- **إن تعطّل:** المجتمع فارغ.
- **انتبه:** لوحة 'التنافس' بيانات وهمية مكتوبة في الكود (3 أسماء ثابتة + المستخدم الحالي بـ 2,450 XP و14 يومًا ثابتة) — لا تعكس أي بيانات حقيقية. | شارة 'مربوط بقاعدة البيانات' ثابتة لا تعكس حالة الاتصال.
- **يستخدم:** memorization.js, AuthContext.jsx, api.js, quranData.js, community.js
- **يستخدمه:** Dashboard.jsx

### `src/components/FiveFortressesPlan.jsx` **[🐞 خلل]**
- **يفعل:** تبويب 'الحصون الخمسة' بستة أقسام: خريطة الحصون البصرية (FiveFortressesVisualMap)، الخطة المبسطة (SimplifiedFortressPlan)، خطة اليوم التفصيلية (بطاقات الحصون مع خطوات وقاعدة ذهبية وزر 'تحديد كمنجز' + توليد خطة بالمساعد وحفظها في aiPlanText)، معمل التكرار (عداد محلي 20/20/40/15 مع مؤقت)، الدليل والمنهجية، وتخصيص الخطة (5 تفضيلات تُحفظ عبر PUT /api/user/:uid). يقرأ الخطة المحفوظة عند كل تغيير تبويب.
- **لماذا:** المنهجية الكاملة للحصون الخمسة (د. سعيد أبو العلا حمزة) في مكان واحد؛ كل تعليم إنجاز يمر عبر saveFortressPlanToFirestore ليبقى متطابقًا مع رئيسية اللوحة.
- **متى:** تبويب five-fortresses أو من روابط اللوحة والمجتمع.
- **إن تعطّل:** لا خطة حصون.
- **انتبه:** يعرّف getSurahNameForPage وgetJuzForPage محليًا بقيم تقريبية (الصفحات 305–582 كلها 'عموم السور المتوسطة'، والجزء = ceil(page/20)) بدل utils/quranData — اسم السورة والجزء خاطئان في هذا التبويب. | يمرر للأبناء onNavigateToQuran → setActiveTab('quran-interactive') وهذا التبويب غير موجود في Dashboard — يظهر 'قسم quran-interactive قيد التفعيل'. | توليد الخطة بالمساعد يمر عبر /api/ai/chat فيُضاف لسجل المحادثة. | منطق تعليم الحصن وحفظه مكرر في هذا الملف وفي VisualMap وSimplified وDashboard.
- **يستخدم:** memorization.js, AuthContext.jsx, LanguageContext.jsx, api.js, firebase.js, SimplifiedFortressPlan.jsx, FiveFortressesVisualMap.jsx, fortressService.js, server/index.js
- **يستخدمه:** Dashboard.jsx

### `src/components/FiveFortressesVisualMap.jsx`
- **يفعل:** يحسب نقطة البداية (بعد أعلى صفحة مصرّح بها)، ويحمّل الخطة المحفوظة. شريط 30 جزءًا ملوّنًا (الحالي/الماضي/الختمة)، اختيار الجزء والصفحة يحفظ الخطة فورًا بعد إعادة توليدها. 5 'محطات' لكل حصن: الحصن 1 مع مشغّل سورة كاملة من mp3quran.net (الحصري/العفاسي/الدوسري)، الحصن 2 التحضير الثلاثي، الحصن 3 عداد تكرار بنغمة ونقلة للتسميع الصوتي، الحصن 4 صفحات المراجعة القريبة، الحصن 5 جدول المراجعة البعيدة.
- **لماذا:** تعليق المؤلف: القراءة الفاشلة لا تتحول أبدًا لحفظ مؤكد؛ الإنجاز يُطبّق فقط بعد التزام الخطة في الخادم.
- **متى:** التبويب الافتراضي داخل الحصون الخمسة.
- **إن تعطّل:** التبويب الافتراضي للحصون فارغ.
- **انتبه:** حقل رقم الصفحة يحفظ الخطة مع كل ضغطة مفتاح (onChange) — كتابة '125' ترسل ثلاث عمليات حفظ (1، 12، 125) والأولى فقط تمر لأن saveInFlight يتجاهل الباقي. | روابط الصوت تعتمد على اسم السورة النصي للعثور على رقمها.
- **يستخدم:** memorization.js, AuthContext.jsx, LanguageContext.jsx, NotificationContext.jsx, quranData.js, fortressService.js
- **يستخدمه:** FiveFortressesPlan.jsx

### `src/components/JuzMultiSelector.jsx`
- **يفعل:** شبكة 30 جزءًا قابلة للتحديد المتعدد مع أسماء الأجزاء، واختيارات سريعة (عمّ، عمّ وتبارك، أول 5، الجزء 1 و30، الكل، لا شيء)، وملخص '~ عدد × 20 صفحة'.
- **لماذا:** المحفوظ غالبًا أجزاء متفرقة غير متتالية.
- **متى:** في المعالج وMyPlanManager.
- **إن تعطّل:** لا يمكن تحديد المحفوظ المسبق.
- **انتبه:** عند قيمة غير صالحة يرجع افتراضيًا [1, 30]. | عدد الصفحات تقريبي (×20).
- **يستخدم:** LanguageContext.jsx
- **يستخدمه:** MyPlanManager.jsx, OnboardingWizard.jsx

### `src/components/LearningStyleProfiler.jsx`
- **يفعل:** يعرض النمط المحفوظ ونسبه (أو 'غير متاح')، وزر 'إعادة تشخيص النمط' يفتح الاختبار سؤالًا سؤالًا؛ عند آخر إجابة يحسب الملف ويحفظه عبر saveLearningProfile ثم applyConfirmedUser، مع زر إعادة محاولة إن فشل.
- **لماذا:** تعليق المؤلف: النسب تأتي فقط من نتيجة محفوظة — لا قيم افتراضية مختلقة.
- **متى:** داخل MyPlanManager.
- **إن تعطّل:** لا إعادة للاختبار.
- **انتبه:** قسم 'كيف تكيّف المنصة تجربتك' يصف ميزات (اختبارات سحب الكلمات، المسبحة) غير موجودة فعليًا.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, learningQuizData.js, learningProfileService.js
- **يستخدمه:** MyPlanManager.jsx, Dashboard.jsx

### `src/components/MindMapsView.jsx`
- **يفعل:** خرائط ذهنية لـ114 سورة من quranMindMapsData: بحث (مع تطبيع عربي)، فلترة مكية/مدنية/مفضلة/جزء، وصول سريع لسور شائعة، بطاقة السورة (المقصد الكلي، مفتاح الربط الذهني، المحاور المتسلسلة بنطاق الآيات والنقاط والتلميح)، تعليم كل محور 'مستوعب' مع احتفال، مفضلة السور (favorites في الملف)، وزر 'تسميع في المصحف' لصفحة بداية السورة.
- **لماذا:** الفهم الموضوعي يساعد الحفظ (المصدر: المختصر في التفسير).
- **متى:** تبويب mind-maps.
- **إن تعطّل:** لا خرائط ذهنية.
- **انتبه:** تقدم المحاور محفوظ في localStorage فقط (ma7fath_{uid}_completed_mindmap_nodes) — يضيع على جهاز آخر. | المفضلة مشتركة في نفس مصفوفة favorites مع صفحات المصحف (type: surah/page). | عدد مكية (86) ومدنية (28) مكتوبان ثابتين.
- **يستخدم:** Card.jsx, AuthContext.jsx, NotificationContext.jsx, LanguageContext.jsx, quranMindMapsData.js
- **يستخدمه:** Dashboard.jsx

### `src/components/MyPlanManager.jsx` **[⧉ تكرار]**
- **يفعل:** تعديل إعدادات الخطة المحفوظة في preferences: وحدة التتبع (صفحات/أجزاء/سور)، الأجزاء المحفوظة سابقًا (JuzMultiSelector) أو نص السور، معدل المراجعة القديمة، وضع الخطة (آلي بمعدل يومي أو يدوي بمستهدفين نصيين)، ثم LearningStyleProfiler أسفلها. الحفظ عبر updateUserData (Firestore مباشرة).
- **لماذا:** تعديل ما اختير في المعالج لاحقًا.
- **متى:** تبويب my-plan ('تعديل الخطة' من الرئيسية).
- **إن تعطّل:** لا تعديل للخطة بعد المعالج.
- **انتبه:** تغيير الأجزاء المحفوظة هنا يحدّث selectedJuzList فقط ولا يحدّث studentDeclaredPages (التي يحسبها المعالج) — الصفحة الحالية والخريطة لا تتغير. | dailyTarget وoldReviewDailyTarget تُعدَّل أيضًا من 'تخصيص الخطة' داخل FiveFortressesPlan (عبر الخادم) — شاشتان لنفس الإعداد. | وضع 'الذكاء الاصطناعي' مجرد تسمية — لا يستدعي أي ذكاء اصطناعي.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, LearningStyleProfiler.jsx, JuzMultiSelector.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/NotificationCenter.jsx`
- **يفعل:** جرس بعدد غير المقروء يحدّث من الخادم عند الفتح. تبويبات: الكل، التذكير اليومي (تفعيل، وقت مع أوقات جاهزة: الفجر/الضحى/العصر/العشاء/قبل النوم، التركيز، الصوت، إذن المتصفح، زر تجربة)، الإنجازات، غير المقروء. النقر على إنجاز يعيد الاحتفال؛ على تذكير يعيد التنبيه. يعرض أيضًا الـ toast العام للتطبيق.
- **لماذا:** واجهة NotificationContext كلها في مكان واحد.
- **متى:** في الهيدر دائمًا.
- **إن تعطّل:** لا إشعارات ولا إعداد تذكير ولا toast.
- **انتبه:** الـ toast العام للتطبيق كله يُرسم هنا — إن لم يُعرض NotificationCenter لا تظهر رسائل showToast. | يستخدم className بأسلوب Tailwind (fixed inset-x-2.5 ...) بينما Tailwind غير مثبت في package.json.
- **يستخدم:** NotificationContext.jsx, LanguageContext.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/PostSessionDhikr.jsx`
- **يفعل:** مسبحة بعد التلاوة: 4 أذكار (استغفار 33، تسبيح 33، صلاة على النبي ﷺ 10، دعاء ختم الورد 1) بعدّاد لكل ذكر وعلامة إكمال.
- **لماذا:** ختام جلسة التلاوة بالذكر.
- **متى:** أسفل صفحة المصحف التفاعلي.
- **إن تعطّل:** تختفي المسبحة.
- **انتبه:** العدّاد لا يُحفظ ويُصفّر بتغيير الصفحة.
- **يستخدمه:** Dashboard.jsx

### `src/components/QuranAudioPlayer.jsx` **[☠ ميت]**
- **يفعل:** مشغّل آيات لسورة بين startAyah وendAyah، 7 قراء، تكرار 1/3/5/10/∞.
- **لماذا:** سبق دمج المشغّل داخل QuranInteractiveView.
- **إن تعطّل:** لا شيء.
- **انتبه:** قائمة القراء وروابط الصوت منسوخة حرفيًا في QuranInteractiveView. | يبني رابط cdn.islamic.network برقم الآية داخل السورة بدل الرقم العام — كان سيشغّل آية خاطئة لغير الفاتحة.
- **يستخدم:** LanguageContext.jsx

### `src/components/QuranInteractiveView.jsx`
- **يفعل:** المصحف التفاعلي: يجلب آيات الصفحة من /api/quran/reference/page/:n (نفس النص العثماني المستخدم في التصحيح) مع كاش داخلي. تنقل بالسورة/الجزء/رقم الصفحة/الأسهم/روابط سريعة. مشغّل صوت لكل آية من 7 قراء (cdn.islamic.network، والدوسري من everyayah.com) مع تكرار 1/3/5/∞ وانتقال تلقائي للآية التالية. التفسير الميسر لكل آية من api.alquran.cloud. المفضلة (favorites عبر updateUserData). مساحة التسميع: صفحة كاملة أو آية، صوتي أو كتابي، إخفاء النص للتسميع غيبًا، ثم عرض النتيجة: الدقة، تقرير الأخطاء (المنطوق مقابل الصواب ونصيحة)، تلوين كل كلمة، تفصيل دقة كل آية، وزر 'إرسال الجلسة للمعلم'. بطاقة إحصاءات الصفحة وسجل المحاولات من /api/recitation/*.
- **لماذا:** التسميع يرسل userId فيصبح autoSave=true فيحفظ الخادم المحاولة (idempotent بـ sessionId). أمثلة جاهزة للصفحة 2 (صحيحة وبخطأ 'للمتقون') لعرض كشف اللحن الجلي.
- **متى:** تبويب daily-session/mushaf، أو من الخريطة والخرائط الذهنية والمتشابهات عبر onSelectPageForRecitation.
- **إن تعطّل:** الميزة الأساسية للتطبيق تتوقف.
- **انتبه:** الآيات المعلّمة 'تم التسميع' يدويًا (recitedAyahs) محلية فقط وتضيع عند التنقل. | شارة دقة كل آية تُبنى من السجل بمفتاح ayahNumber — محاولات الصفحة الكاملة لها ayahNumber=null فلا تظهر على الآيات. | يعتمد على 3 خدمات خارجية (التفسير والصوت) بلا بديل عند تعطلها. | activeAyahNum يبدأ بـ 8 قبل تحميل الصفحة.
- **يستخدم:** LanguageContext.jsx, AuthContext.jsx, useRecitationRecorder.js, api.js, quranData.js, server/index.js
- **يستخدمه:** Dashboard.jsx

### `src/components/QuranMapPage.jsx`
- **يفعل:** شبكة 604 مربعًا ملونًا حسب التصريح الذاتي (أخضر مصرّح، أصفر مراجعة، أحمر حرج، رمادي غير محفوظ) من preferences.studentDeclaredPages وstudentDeclaredPageStatuses. بحث بالرقم أو السورة، فلترة بالحالة والجزء، تعليم جزء كامل، 'تعديل التصريح' بعدد صفحات (أول N صفحة)، لوحة تفاصيل للصفحة مع تغيير حالتها وزر الانتقال للمصحف/التسميع. محرر 'تقدم الآيات' يكتب آية واحدة في ayah_progress عبر portfolioService. مؤشرات: صفحات، أجزاء كاملة، نسبة الختم.
- **لماذا:** الخريطة تصريح ذاتي للتخطيط لا اعتماد — كل نص فيها يؤكد ذلك. الحفظ أولًا ثم تحديث العرض (لا تحديث متفائل).
- **متى:** تبويب quran-map.
- **إن تعطّل:** لا خريطة ولا طريقة لتعديل الصفحات المحفوظة بعد المعالج.
- **انتبه:** لا تقرأ نتائج التسميع (page_progress) — الألوان لا تتغير بالتسميع. | كل حفظ يرسل كائن preferences كاملًا (updateDoc يستبدل الحقل) — تعديل متزامن من تبويب آخر قد يُفقد. | لا تستورد quranMap/QuranSurahAyahsModal ولا QuranMapSurahCard (بقيا يتيمين).
- **يستخدم:** memorization.js, quranData.js, AuthContext.jsx, NotificationContext.jsx, LanguageContext.jsx, api.js, portfolioService.js
- **يستخدمه:** Dashboard.jsx

### `src/components/ReviewReminderAlert.jsx`
- **يفعل:** تظهر عند activeReminderAlert: العنوان، الموعد، التركيز، الرسالة، وثلاثة أزرار: بدء المراجعة (يفتح تبويب الحصون)، تأجيل 15 دقيقة، إغلاق فقط (مع toast يوضح أنه لم يُحفظ شيء).
- **لماذا:** تحويل التذكير مباشرة إلى فعل.
- **متى:** عند حلول وقت التذكير اليومي أو انتهاء التأجيل أو زر التجربة.
- **إن تعطّل:** التذكير يرن بلا نافذة.
- **يستخدم:** NotificationContext.jsx, LanguageContext.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/SimilaritiesView.jsx`
- **يفعل:** مرشد المتشابهات: يعرض MUTASHABIHAT_DATA مع بحث مطبّع عربيًا في العنوان/القاعدة/الآيات/الكلمة المميزة، فلترة بنوع القاعدة والسورة، إشارات مرجعية، نسخ البطاقة، وزر لفتح صفحة الآية في المصحف. زر 'استخراج متشابهات بالذكاء الاصطناعي' يرسل طلبًا لـ /api/ai/chat يطلب JSON ويضيف النتائج للقائمة.
- **لماذا:** ضبط المتشابهات اللفظية من أكبر صعوبات الحافظ.
- **متى:** تبويب similarities.
- **إن تعطّل:** لا مرشد متشابهات.
- **انتبه:** المتشابهات المولّدة بالذكاء الاصطناعي (بما فيها نص الآيات) تُحفظ في localStorage وتُعرض بجانب البيانات الموثقة بشارة صغيرة فقط — نص الآية من نموذج لغوي قد يكون غير دقيق. | إن لم يكن للخادم مفتاح Gemini يرجع ردًا قالبيًا بلا JSON فلا يُضاف شيء. | كل طلب توليد يُحفظ في سجل محادثة المساعد. | الإشارات المرجعية في localStorage فقط وبمفتاح غير مرتبط بالمستخدم (almahfath_mutashabihat_bookmarks).
- **يستخدم:** api.js, Card.jsx, mutashabihatData.js, server/index.js
- **يستخدمه:** Dashboard.jsx

### `src/components/SimplifiedFortressPlan.jsx`
- **يفعل:** نسخة مختصرة: اختيار الجزء (يعيد توليد الخطة من بداية الجزء ويحفظها)، 5 بطاقات بزر 'تحديد كمكتمل' لكل حصن، شريط تفعيل التذكير اليومي وتجربته، وزر 'استشر المعلم الذكي'. يستمع لتغييرات الخطة الحية عبر subscribeToFortressPlan.
- **لماذا:** واجهة سريعة لمن لا يريد التفاصيل، متزامنة لحظيًا مع الأجهزة الأخرى.
- **متى:** تبويب 'الخطة اليومية المبسطة'.
- **إن تعطّل:** التبويب المبسط فارغ.
- **انتبه:** onAskAi يستقبل نص سؤال جاهز لكن الأب يتجاهله ويكتفي بفتح تبويب المساعد. | اختيار الجزء يعيد الصفحة لبداية الجزء دائمًا.
- **يستخدم:** memorization.js, AuthContext.jsx, NotificationContext.jsx, fortressService.js, quranData.js
- **يستخدمه:** FiveFortressesPlan.jsx

### `src/components/VisualProgressTracker.jsx`
- **يفعل:** أعمدة محاولات التدريب لآخر 7 أيام (بتوقيت عمّان) من analytics.practice.dailyPractice، مع عدد الآيات المصرّح بها ومراجعات المعلم.
- **لماذا:** عرض صادق: محاولات تدريب لا صفحات حفظ معتمدة.
- **متى:** داخل AnalyticsView.
- **إن تعطّل:** الرسم يختفي.
- **يستخدم:** Card.jsx
- **يستخدمه:** AnalyticsView.jsx, Dashboard.jsx

### `src/components/fortress/FortressSetupWizard.jsx` **[☠ ميت]**
- **يفعل:** إعداد خطة الحصون نصيًا (سورة البداية، المراجعة القريبة والبعيدة، الختمة، أوقات التذكير) ثم saveFortressPlanToFirestore وإشعار تجريبي محلي بعد 5 ثوانٍ.
- **لماذا:** بديل قديم لإعداد الخطة؛ حل محله OnboardingWizard وMyPlanManager وFiveFortressesPlan.
- **إن تعطّل:** لا شيء.
- **يستخدم:** Card.jsx, Button.jsx, AuthContext.jsx, NotificationManager.js, fortressService.js

### `src/components/quranMap/QuranMapSurahCard.jsx` **[☠ ميت]**
- **يفعل:** بطاقة سورة: الرقم والاسم ونوعها والجزء، نسبة الآيات المحفوظة من المحفظة عبر getSurahMemorizationStats، حالة ملونة، وتكرارات ودرجة.
- **لماذا:** جزء من خريطة السور القديمة مع QuranSurahAyahsModal.
- **إن تعطّل:** لا شيء.
- **يستخدم:** portfolioService.js

### `src/components/quranMap/QuranSurahAyahsModal.jsx` **[☠ ميت]**
- **يفعل:** تعرض آيات سورة من /api/quran/reference/surah/:n مع حالة كل آية من المحفظة (محفوظة/قيد الحفظ/مراجعة/غير محفوظة)، عدّاد تكرار 40×، ملاحظات، تفسير ميسر، استماع للعفاسي، تسميع آية بالصوت يحدّث حالة الآية حسب الدقة (≥85 محفوظة، ≥65 قيد الحفظ)، وزر 'تحديد كامل السورة كمحفوظة'. تعتمد على onUpdateAyah/onBulkUpdateSurah من الأب.
- **لماذا:** نسخة سابقة من خريطة المصحف كانت مبنية على السور والآيات (محفظة الآيات) قبل أن تصبح QuranMapPage شبكة 604 صفحة.
- **إن تعطّل:** لا شيء.
- **انتبه:** لو أعيد تفعيلها: تستدعي stopAndAnalyze بلا userId فلا تُحفظ المحاولة في الخادم، و'تحديد السورة كمحفوظة' يضع recitationScore=98 وتكرار 40 وهميين.
- **يستخدم:** useRecitationRecorder.js, portfolioService.js, AuthContext.jsx, NotificationContext.jsx, server/index.js

### `src/hooks/useRecitationRecorder.js`
- **يفعل:** startRecording: يولّد sessionId (UUID)، يشغّل Web Speech Recognition بالعربية (ar-SA) للنص الحي، ويسجّل الصوت بـ MediaRecorder (webm/opus أو mp4). stopAndAnalyze: يوقف، يحوّل الصوت إلى base64، ويرسل لـ /api/ai/recitation-check (مع fetchWithAuth وautoSave إن مُرّر userId، وإلا fetch عادي بلا حفظ). evaluateTextRecitation: نفس الشيء لنص مكتوب، ويعيد استخدام نفس sessionId لنفس المدخل (لمنع التكرار). submitCurrentResultForReview → /api/recitation/sessions/:id/submit. saveCurrentResult → /api/recitation/save (تأكيد فقط). بعد كل حفظ: refreshUserData (لتحديث الـ streak).
- **لماذا:** الصوت + النص الحي معًا: إن فشل رفع الصوت أو كان قصيرًا (< 200 بايت) يُستخدم نص التعرف الصوتي بديلًا. sessionId الثابت يجعل إعادة الإرسال آمنة.
- **متى:** عند ضغط 'ابدأ التسميع' و'إيقاف وفحص' أو 'فحص التسميع الكتابي'.
- **إن تعطّل:** التسميع في المصحف (ونافذة السورة الميتة).
- **انتبه:** يكتب كاش ma7fath_{uid}_quran_page_reviews في localStorage بعد كل حفظ، لكن لا يوجد أي ملف يقرأه (كتابة ميتة) — خريطة المصحف لا تعكس نتائج التسميع. | saveCurrentResult لا يستخدمه أي مكوّن. | منطق تحديث الكاش مكرر 3 مرات داخل الملف. | Web Speech Recognition غير مدعوم في Firefox وبعض متصفحات iOS — يعتمد حينها على الصوت فقط.
- **يستخدم:** api.js, AuthContext.jsx, server/index.js
- **يستخدمه:** QuranInteractiveView.jsx, QuranSurahAyahsModal.jsx

## طبقة: المعلم والمشرف
_لوحات المعلم والإدارة_

### `src/components/AdminPanel.jsx` **[☠ ميت]**
- **يفعل:** يعرض AdminDashboard ويمرر onSwitchToHome كـ onNavigateTab.
- **لماذا:** اسم قديم للوحة المشرف.
- **إن تعطّل:** لا شيء.
- **انتبه:** Dashboard يستورده لكن case 'admin-panel' الذي يعرضه يأتي بعد case 'admin-panel' آخر في نفس switch — غير قابل للوصول.
- **يستخدم:** AdminDashboard.jsx
- **يستخدمه:** Dashboard.jsx

### `src/components/admin/AdminBadgesView.jsx` **[☠ ميت]**
- **يفعل:** قائمة أوسمة مع أزرار 'إنشاء وسام' و'تعديل الشروط' و'منح لطالب' بلا أي معالجات.
- **لماذا:** واجهة أولية حل محلها AdminExperienceSettings.
- **إن تعطّل:** لا شيء.

### `src/components/admin/AdminCommunityView.jsx` **[☠ ميت]**
- **يفعل:** قائمة منشورات بانتظار الموافقة مع أزرار موافقة/رفض تستدعي معالجات من الأب.
- **لماذا:** نظام إشراف على المجتمع لم يكتمل — منشورات المجتمع الحالية تُنشر فورًا بلا موافقة.
- **إن تعطّل:** لا شيء.

### `src/components/admin/AdminDashboard.jsx` **[🐞 خلل]**
- **يفعل:** عشرة تبويبات: لوحة القيادة (إحصاءات /api/admin/overview)، تحليلات الحفظ (AdminPerformanceDashboard)، التوزيع (AdminDistributionView)، المستخدمون/المعلمات (بحث وفلاتر، ترقية/إلغاء مشرف بكتابة Firestore مباشرة، تعيين/إلغاء معلم عبر /api/admin/assign|remove-teacher)، المجموعات، التحليلات، المنتدى، الأوسمة/الظهور (AdminExperienceSettings).
- **لماذا:** دور المعلم يمر عبر الخادم (لأنه يتحقق من ملكية الحلقات)، بينما دور المشرف يُكتب مباشرة (قواعد Firestore تسمح للمشرف).
- **متى:** التبويب الافتراضي للدور 'مشرف'.
- **إن تعطّل:** لا إدارة.
- **انتبه:** تبويب 'إدارة المنتدى' يعرض منشورين وهميين ثابتين وأزراره لا تفعل شيئًا. | تبويب 'التحليلات والنمو' نص فقط بلا بيانات. | فلترا 'نشطون/غير نشطين' بلا تنفيذ؛ وحالة كل مستخدم تظهر 'خامل' لأن حقل status غير موجود. | كل حرف في البحث يعيد 3 طلبات للخادم والفلترة تتم محليًا. | يمكن للمشرف إزالة صلاحية الإدارة عن نفسه أو عن آخر مشرف بلا تحذير.
- **يستخدم:** memorization.js, LanguageContext.jsx, AdminPerformanceDashboard.jsx, AdminDistributionView.jsx, firebase.js, api.js, AdminExperienceSettings.jsx, groups.js
- **يستخدمه:** AdminPanel.jsx, Dashboard.jsx

### `src/components/admin/AdminDistributionView.jsx`
- **يفعل:** إنشاء حلقة (/api/admin/groups/create)، قائمة طلبات الانتساب مع 'توزيع' (/api/admin/enrollment-requests/approve)، وقائمة كل المستخدمين غير المشرفين مع 'نقل' لحلقة (/api/admin/distribute-student) في نافذة اختيار الحلقة والمعلمة.
- **لماذا:** المشرف يتحكم بتوزيع الطلاب على الحلقات؛ الخادم يضمن عضوية واحدة وعدادات صحيحة.
- **متى:** تبويب admin-distribution.
- **إن تعطّل:** لا توزيع للطلاب ولا إنشاء حلقات.
- **انتبه:** لا يوجد في الواجهة الحالية أي مكان يرسل طلب انتساب (/api/safar/enrollment-request) — قائمة الطلبات ستبقى فارغة إلا من بيانات قديمة. | قائمة 'الطالبات' تشمل المعلمين أيضًا (تستثني المشرفين فقط).
- **يستخدم:** memorization.js, LanguageContext.jsx, api.js, groups.js
- **يستخدمه:** AdminDashboard.jsx

### `src/components/admin/AdminExperienceSettings.jsx`
- **يفعل:** يحمّل uiConfiguration ويسمح بتعديل ظهور وترتيب قسمي المجتمع والأوسمة، وتفعيل/عنوان/وصف/ترتيب كل شارة من الست، ثم saveUiConfiguration.
- **لماذا:** تحكم المشرف بالواجهة لكل المستخدمين دون نشر جديد.
- **متى:** تبويب admin-badges أو admin-experience.
- **إن تعطّل:** لا تحكم بالظهور.
- **انتبه:** لا يمكن إضافة شارة جديدة — الست ثابتة في defaultUiConfiguration وشروط فتحها مكتوبة في Dashboard.
- **يستخدم:** uiConfiguration.js
- **يستخدمه:** AdminDashboard.jsx

### `src/components/admin/AdminPerformanceDashboard.jsx`
- **يفعل:** يجلب /api/admin/memorization-performance ويتحقق من شكل الرد، ثم يعرض 11 مؤشرًا (المتعلمون، طلاب المجموعات، المستقلون، المعلمون، الجلسات الكلية والأسبوعية، متوسط المطابقة، المجموعات، سجلات الآيات...) وسجل كل مجموعة، وحاسبة افتراضية (طلاب × صفحات يومية → مدة الختم).
- **لماذا:** أي قيمة غير رقمية تُعرض 'غير متاح' بدل 0 حتى لا يُظن أنها صفر حقيقي.
- **متى:** تبويب admin-performance.
- **إن تعطّل:** لا تقرير أداء.
- **يستخدم:** LanguageContext.jsx, api.js, groups.js, server/index.js
- **يستخدمه:** AdminDashboard.jsx

### `src/components/teacher/TeacherDashboard.jsx`
- **يفعل:** يجلب /api/teacher/:uid/dashboard ويعرض: ملخص الحلقات، 6 مؤشرات (الطلاب النشطون، من تدرب آخر 7 أيام، نسبة النشاط، محاولات الأسبوع، مراجعات معلقة، بحاجة لمتابعة)، قائمة 'بحاجة لمتابعة' (تفتح ملف الطالب)، وآخر 8 نشاطات. يتحدث تلقائيًا كل 30 ثانية.
- **لماذا:** كل رقم معرّف صراحة تحت البطاقة (مثل: 'عضويات status=active') لتجنب مؤشرات مضللة. requestVersion يمنع ظهور رد قديم بعد طلب أحدث.
- **متى:** التبويب الافتراضي للدور النشط 'معلم'.
- **إن تعطّل:** المعلم بلا لوحة.
- **انتبه:** 'بحاجة لمتابعة' يشمل فقط من له نشاط سابق ثم توقف — الطالب الذي لم يتدرب أبدًا لا يظهر.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, useTeacherRefresh.js, api.js
- **يستخدمه:** Dashboard.jsx

### `src/components/teacher/TeacherGroupsView.jsx`
- **يفعل:** يجلب /api/groups?teacherId ويعرض بطاقة لكل حلقة: الاسم، المعلمة، الوصف، رمز الدعوة مع نسخ، إحصاءات، وزر 'عرض طالبات الحلقة'.
- **لماذا:** المعلم يوزّع رمز الدعوة على طالباته.
- **متى:** تبويب teacher-groups.
- **إن تعطّل:** المعلم لا يرى رموز الدعوة.
- **انتبه:** المعلم لا يستطيع إنشاء حلقة من هنا — الإنشاء للمشرف فقط.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, useTeacherRefresh.js, api.js, groups.js
- **يستخدمه:** Dashboard.jsx

### `src/components/teacher/TeacherReportsView.jsx`
- **يفعل:** يجلب /api/teacher/:uid/reports ويعرض الإجماليات (طلاب، جلسات، معلقة، مقبولة، مرفوضة، ملاحظات) وسطرًا لكل طالب مع متوسط التطابق.
- **لماذا:** متابعة المعلم لأداء حلقته بأرقام Firestore الفعلية.
- **متى:** تبويب teacher-reports.
- **إن تعطّل:** لا تقارير.
- **يستخدم:** AuthContext.jsx, LanguageContext.jsx, useTeacherRefresh.js, api.js, groups.js
- **يستخدمه:** Dashboard.jsx

### `src/components/teacher/TeacherStudentProfileModal.jsx`
- **يفعل:** يجلب /api/teacher/:uid/student/:id: الخطة (الوحدة، النمط، الهدف)، تقدم الآيات المسجل، آخر 10 محاولات بأزرار 'قبول/رفض' للمعلقة، وإرسال ملاحظة للطالب (تُنشئ إشعارًا). تبويبا 'المراجعة' و'الالتزام' يقولان صراحة 'غير متاح بعد'.
- **لماذا:** المعلم يراجع جلسات التدريب المرسلة له؛ القبول لا يعتمد الحفظ ولا يمنح XP.
- **متى:** عند النقر على طالب من اللوحة أو القائمة.
- **إن تعطّل:** لا مراجعة للجلسات ولا ملاحظات.
- **انتبه:** أي فشل في المراجعة أو الملاحظة يمسح بيانات الطالب من النافذة ويعرض خطأ تحميل. | المشرف (admin) يرى أزرار القبول/الرفض لكن الخادم يرفضها (403) — المراجعة للمعلم المعيّن فقط. | نسبة إنجاز الهدف وتاريخ الانضمام والهدف الحالي لا يرسلها الخادم فتظهر '—' دائمًا.
- **يستخدم:** memorization.js, LanguageContext.jsx, AuthContext.jsx, useTeacherRefresh.js, api.js, groups.js
- **يستخدمه:** Dashboard.jsx

### `src/components/teacher/TeacherStudentsView.jsx` **[🐞 خلل]**
- **يفعل:** يجلب طلاب المعلم (/api/teacher/:uid/students مع بحث وفلتر وترتيب) ورمز الحلقة (/api/groups?teacherId)، يعرض بطاقات الطلاب (تفتح الملف)، ونسخ رمز الدعوة، ونافذة 'إضافة طالبة' (/api/teacher/:uid/add-student).
- **لماذا:** المعلم يرى فقط من له عضوية نشطة في حلقاته (الخادم يفرض ذلك).
- **متى:** تبويب teacher-students، أو من 'عرض طالبات الحلقة'.
- **إن تعطّل:** لا قائمة طلاب.
- **انتبه:** نموذج الإضافة يجعل البريد 'اختياريًا'، لكن الخادم يتطلب حسابًا مسجلًا (studentUid أو بريد مطابق) — الإضافة بالاسم فقط تفشل دائمًا بـ 'معرف الطالب مطلوب'. حقلا 'عدد الأجزاء' و'الورد' يُرسلان ويتجاهلهما الخادم. | فلاتر 'متميزات/بحاجة لمتابعة/منقطعات' تعتمد على حقل status في ملف الطالب الذي لا يكتبه أي جزء من الكود (الافتراضي active) — تبقى فارغة. | كل حرف في البحث يعيد طلبين للخادم. | إن لم تكن للمعلمة حلقة (الإنشاء للمشرف فقط) يعرض رسالة بدل رمز فارغ ويعطّل زر النسخ (data-testid=teacher-no-group-code).
- **يستخدم:** memorization.js, AuthContext.jsx, LanguageContext.jsx, useTeacherRefresh.js, api.js, groups.js
- **يستخدمه:** Dashboard.jsx

### `src/hooks/useTeacherRefresh.js`
- **يفعل:** يستدعي load() فورًا، وعند العودة للتبويب، وكل 30 ثانية ما دام التبويب ظاهرًا.
- **لماذا:** تعليق المؤلف: إعادة فحص صلاحيات الخادم باستمرار — إن نُقل طالب أو أُزيل دور المعلم تختفي البيانات القديمة. التحديث ليس تفويضًا.
- **متى:** طوال فتح شاشات المعلم.
- **إن تعطّل:** بيانات قديمة قد تبقى ظاهرة بعد سحب الصلاحية.
- **انتبه:** load يجب أن يكون مستقرًا (useCallback) وإلا يُعاد تسجيل المؤقت مع كل render.
- **يستخدمه:** TeacherDashboard.jsx, TeacherGroupsView.jsx, TeacherReportsView.jsx, TeacherStudentProfileModal.jsx, TeacherStudentsView.jsx

## طبقة: خدمات وبيانات العميل
_lib/*Service، محرك الذكاء، بيانات القرآن_

### `src/data/mutashabihatData.js`
- **يفعل:** RULE_CATEGORIES (قواعد الضبط: الترتيب الهجائي، اسم السورة، زيادة المبنى، السياق، البلاغي...) وMUTASHABIHAT_DATA (أزواج آيات متشابهة بالسورة والآية والصفحة والكلمة المميزة والقاعدة الذهبية والمصدر)، normalizeArabicText، getSurahListInDataset.
- **لماذا:** محتوى ميزة المتشابهات، مأخوذ من كتب التوجيه (درة التنزيل، البرهان للكرماني، الضبط بالتقعيد).
- **متى:** عند فتح تبويب المتشابهات.
- **إن تعطّل:** SimilaritiesView فارغ.
- **يستخدمه:** SimilaritiesView.jsx

### `src/lib/fortressService.js`
- **يفعل:** generateFiveFortressesPlan(juz, page, target): يبني محليًا خطة الحصون الخمسة (الختمة = قراءة الجزء، التحضير الثلاثي لصفحة اليوم والغد، الحفظ الجديد 20×/40×، المراجعة القريبة = آخر 20 صفحة، البعيدة = الأجزاء السابقة بالتدوير). أدوات الإنجاز اليومي (fortressDay بتوقيت عمّان، تطبيع المفاتيح النصية↔الرقمية 1..5). saveFortressPlanToFirestore وgetFortressPlanFromFirestore عبر /api/user/fortress-plan (404 ← مسودة مولّدة محليًا). subscribeToFortressPlan يستمع لـ users/{uid}/five_fortresses_plans/current متجاهلًا الكاش والكتابات المعلقة.
- **لماذا:** قواعد Firestore تمنع العميل من كتابة الخطة مباشرة (write: false) لأن الخطة وحالة اللوحة يجب أن تُحفظا معًا في الخادم؛ القراءة الحية مسموحة للمالك. كل دالة تتحقق أن المستخدم لم يتغير أثناء الطلب.
- **متى:** عند فتح خطة الحصون أو لوحة اليوم، وعند تعليم حصن كمنجز.
- **إن تعطّل:** FiveFortressesPlan وSimplifiedFortressPlan وFortressSetupWizard وDashboard وMyPlanManager.
- **انتبه:** المفاتيح النصية (khatmah...) والرقمية (1..5) كلاهما مستخدم؛ normalizeFortressCompletion يقبل الاثنين — لا تضف شكلًا ثالثًا. | منطق 'يوم عمّان' مكرر هنا وفي server/quranActivityStreak.js.
- **يستخدم:** firebase.js, api.js, quranData.js, server/index.js
- **يستخدمه:** FiveFortressesPlan.jsx, FiveFortressesVisualMap.jsx, SimplifiedFortressPlan.jsx, FortressSetupWizard.jsx, Dashboard.jsx

### `src/lib/learningProfileService.js`
- **يفعل:** saveLearningProfile: يرسل PUT /api/user/{uid} بـ preferences.learningProfile وlearningStyle كـ patch، ثم يتحقق أن الرد يحتوي نفس القيم بالضبط (مقارنة JSON مرتبة المفاتيح).
- **لماذا:** تأكيد أن الحفظ وصل فعلًا للخادم قبل إظهار النجاح — نمط 'persisted: true' المتبع في كل المشروع.
- **متى:** عند إنهاء اختبار النمط التعليمي.
- **إن تعطّل:** LearningStyleProfiler وOnboardingWizard لا يحفظان النمط.
- **يستخدم:** firebase.js, api.js, server/index.js
- **يستخدمه:** LearningStyleProfiler.jsx

### `src/lib/memorization.js`
- **يفعل:** declaredPages(user): يقرأ preferences.studentDeclaredPages وينظفها (أعداد صحيحة 1..604 بلا تكرار، مرتبة). nextDeclaredPage: أول صفحة غير مصرّح بها.
- **لماذا:** تعليق المؤلف: التصريح الذاتي مدخل للتخطيط فقط وليس شهادة معلم. يحل محل memorizedPagesCount الذي صار الخادم يرجعه null.
- **متى:** عند حساب 'أين وصلت' في اللوحة والمساعد والخطة.
- **إن تعطّل:** الصفحة الحالية تعود 1 في كل مكان.
- **يستخدمه:** AiAssistant.jsx, Community.jsx, FiveFortressesPlan.jsx, FiveFortressesVisualMap.jsx, QuranMapPage.jsx, SimplifiedFortressPlan.jsx, AdminDashboard.jsx, AdminDistributionView.jsx, TeacherStudentProfileModal.jsx, TeacherStudentsView.jsx, Dashboard.jsx

### `src/lib/portfolioService.js`
- **يفعل:** محفظة الآيات: كل آية مستند users/{uid}/ayah_progress/{سورة_آية} بحالة (unmemorized/learning/review/memorized) وتكرار ودرجة. fetchUserPortfolio (Firestore ثم كاش ma7fath_portfolio_{uid} عند الفشل)، saveAyahToPortfolio، saveBulkPortfolio (دفعات 300)، subscribeToUserPortfolio، getSurahMemorizationStats وgetGlobalPortfolioStats (نسبة من 6236 آية، صفحات ≈ آيات/10.3).
- **لماذا:** الكتابة المباشرة من العميل مسموحة هنا بقواعد Firestore صارمة على الحقول، لأنها تصريح ذاتي لا يحتاج تحققًا من الخادم.
- **متى:** عند فتح خريطة المصحف ونافذة السورة وتعليم آيات/سور كمحفوظة.
- **إن تعطّل:** QuranMapPage وQuranSurahAyahsModal وQuranMapSurahCard.
- **انتبه:** subscribeToUserPortfolio لا يستدعي onUpdate إذا كانت المحفظة فارغة — حذف آخر آية لا يظهر حتى إعادة التحميل. | generateInitialPortfolioFromPages ترجع {} دائمًا (محفوظة للتوافق فقط). | الخادم ما زال فيه مسارات /api/user/:uid/portfolio على ملف JSON — مسار مختلف تمامًا لا تستخدمه الواجهة. | يستورد utils/quranSurahsList.json (غير ممثل في الخريطة لأنه JSON).
- **يستخدم:** firebase.js
- **يستخدمه:** QuranMapPage.jsx, QuranMapSurahCard.jsx, QuranSurahAyahsModal.jsx

### `src/lib/uiConfiguration.js`
- **يفعل:** defaultUiConfiguration: ظهور/ترتيب قسمي المجتمع والإنجازات و6 شارات. useUiConfiguration يستمع لـ app_config/navigation ويدمجها مع الافتراضي. saveUiConfiguration يكتبها (القواعد: المشرف فقط).
- **لماذا:** يسمح للمشرف بإخفاء أقسام أو شارات لكل المستخدمين فورًا دون نشر جديد.
- **متى:** عند تحميل اللوحة (قراءة حية)، وعند الحفظ من إعدادات المشرف.
- **إن تعطّل:** يرجع للافتراضي (كل شيء ظاهر).
- **يستخدم:** firebase.js
- **يستخدمه:** Sidebar.jsx, BottomNavBar.jsx, MoreToolsModal.jsx, AdminExperienceSettings.jsx, Dashboard.jsx

### `src/utils/NotificationManager.js`
- **يفعل:** طلب إذن الإشعارات ثم requestFcmToken، إرسال إشعار محلي عبر Service Worker أو Notification، scheduleNotification بـ setTimeout، والاستماع لرسائل FCM أثناء فتح التطبيق.
- **لماذا:** واجهة موحدة للإشعارات في المتصفح/PWA.
- **متى:** عند تفعيل الإشعارات من الإعدادات، وعند تذكيرات المراجعة.
- **إن تعطّل:** لا إشعارات نظام.
- **انتبه:** scheduleNotification يعمل فقط ما دام التبويب مفتوحًا (تعليق المؤلف). | أيقونة الإشعار /vite.svg — أيقونة قالب Vite لا شعار التطبيق. | يُنشأ عند الاستيراد ويقرأ window مباشرة.
- **يستخدم:** firebase.js
- **يستخدمه:** FortressSetupWizard.jsx

### `src/utils/learningQuizData.js`
- **يفعل:** أسئلة اختبار النمط التعليمي (عربي/إنجليزي) بأوزان لأربعة أنماط (سمعي، بصري، حركي، تحليلي)، وcalculateLearningProfile: يجمع الأوزان ويحسب النسب والنمط الغالب (فرق ≤1 بين الأول والثاني = مختلط) مع توصية.
- **لماذا:** تخصيص النصائح حسب طريقة الحافظ في التذكر.
- **متى:** عند إنهاء الاختبار.
- **إن تعطّل:** LearningStyleProfiler والمعالج.
- **يستخدمه:** LearningStyleProfiler.jsx, OnboardingWizard.jsx

### `src/utils/quranAiEngine.js` **[☠ ميت]**
- **يفعل:** generateQuranAiResponse: إن وُجد مفتاح (من context أو localStorage ma7fath_gemini_api_key أو VITE_GEMINI_API_KEY) يستدعي Gemini مباشرة من المتصفح، وإلا يرد بقوالب حسب الكلمات (تحية، سورة من 8 سور، خطة، تكرار، متشابهات، تجويد، نسيان، صلاة، نمط).
- **لماذا:** كان محرك المساعد في الواجهة قبل نقل الدردشة إلى /api/ai/chat.
- **إن تعطّل:** لا شيء.
- **انتبه:** القوالب نفسها تقريبًا موجودة في getSmartFallbackResponse داخل server/index.js.

### `src/utils/quranData.js`
- **يفعل:** surahs (اسم وصفحة بداية لـ114 سورة بمصحف المدينة)، juzStarts، getSurahNameForPage (يدمج الأسماء إن بدأت أكثر من سورة في الصفحة)، getJuzForPage، getPageRangeForJuz، getJuzStartPage.
- **لماذا:** تحويلات صفحة↔سورة↔جزء في الواجهة دون طلب للخادم.
- **متى:** عند بناء الخطة وعرض الموقع الحالي.
- **إن تعطّل:** الخطة واللوحة تعرض أسماء خاطئة.
- **انتبه:** بيانات السور مكررة أيضًا في utils/quranSurahsList.json وserver/data/quran-uthmani.json.
- **يستخدمه:** AiAssistant.jsx, Community.jsx, FiveFortressesVisualMap.jsx, QuranInteractiveView.jsx, QuranMapPage.jsx, SimplifiedFortressPlan.jsx, fortressService.js, Dashboard.jsx, OnboardingWizard.jsx

### `src/utils/quranMindMapsData.js`
- **يفعل:** getSurahMindMap(رقم أو اسم): يطابق الاسم بعد تطبيع عربي ويرجع سجل السورة من data/quran114MindMaps.json (1MB). getAllSurahsList للقوائم. MIND_MAPS_SOURCE_INFO للمصادر (المختصر في التفسير وأطلس السور).
- **لماذا:** فصل بيانات الخرائط الذهنية الضخمة عن مكوّن العرض.
- **متى:** عند فتح الخرائط الذهنية أو نافذة السورة.
- **إن تعطّل:** MindMapsView وأجزاء من خريطة المصحف.
- **انتبه:** إن لم يُعثر على السورة يرجع الفاتحة بصمت. | دالة normalizeArabic مكررة بصيغ مختلفة في mutashabihatData وserver/recitationEngine.
- **يستخدمه:** MindMapsView.jsx

## طبقة: الخادم: المداخل والحماية
_Express index، routes، middleware، صلاحيات_

### `server/accessControl.js`
- **يفعل:** hasRole (role أو roles map)، isAdmin، isTeacher، canActAsTeacher (المشرف أو المعلم نفسه)، teacherOwnsGroup، isActiveTeacherMembership (فحص صارم: العضوية نشطة، groupId نظيف بلا '/'، المجموعة نشطة، ومعلمها الحالي = teacherId في العضوية والطلب)، teacherCanAccessStudent.
- **لماذا:** مصدر الحقيقة الوحيد لقواعد الوصول في الخادم؛ الفحص الصارم يمنع معلمًا سابقًا من رؤية طالب انتقل لحلقة أخرى.
- **متى:** داخل كل middleware ومسار يحتاج قرار صلاحية.
- **إن تعطّل:** إما تسريب بيانات طلاب أو منع المعلمين من طلابهم.
- **انتبه:** على عكس hasRole في AuthContext (الواجهة)، هنا admin لا يعني teacher تلقائيًا — لكن canActAsTeacher تسمح للمشرف.
- **يستخدمه:** firestoreGroups.js, firestoreRecitation.js, auth.js, community.js, groups.js, teacherScope.js

### `server/emulatorSafety.js`
- **يفعل:** validateEmulatorEnvironment: إن وُجد أي متغير محاكي، يشترط NODE_ENV=test وMA7FATH_EMULATOR_TEST=1 ومشروع demo-* ومضيفين loopback، وإلا يرمي.
- **لماذا:** يمنع تشغيل الخادم على المحاكي بالخطأ أو تشغيل الاختبارات على مشروع حقيقي (نظير firebaseEmulatorConfig في الواجهة).
- **متى:** مرة عند تحميل middleware/auth.js.
- **إن تعطّل:** خطر كتابة بيانات اختبار في الإنتاج.
- **يستخدمه:** auth.js

### `server/index.js` **[🐞 خلل]**
- **يفعل:** يعرّف مسارات: الصحة، نص المصحف (/api/quran/reference/page|surah — عامة)، الملف الشخصي (/api/user/:uid GET/PUT)، خطة الحصون (/api/user/fortress-plan)، محفظة الآيات القديمة (/api/user/:uid/portfolio — تخزين JSON)، المساعد (/api/ai/chat GET/POST/DELETE مع Gemini وردود احتياطية مكتوبة يدويًا)، التسميع (/api/ai/recitation-check، /api/recitation/*)، تقرير الأداء للمشرف. يركّب routes/groups وroutes/community تحت /api. في التطوير يشغّل Vite كـ middleware (npm run dev = node server/index.js)، وفي الإنتاج يخدم dist/.
- **لماذا:** خادم واحد يخدم الواجهة والـ API معًا. كل ما يتطلب ثقة (حساب دقة التسميع، نص المصحف المرجعي، الكتابة في Firestore بصلاحيات Admin) يحدث هنا لا في المتصفح.
- **متى:** يعمل طوال الوقت؛ كل طلب /api يمر عبر logger ثم requireAuth حسب المسار.
- **إن تعطّل:** كل حواف calls_api (22 حافة) تنقطع.
- **انتبه:** PUT/DELETE /api/admin/user/:uid و GET /api/quran/pages و/portfolio تستخدم database.js القديم (ملف db.json)، بينما المستخدمون الحقيقيون في Firestore — تعديل/حذف مستخدم من هنا لا يؤثر على حسابه الحقيقي. | POST /api/ai/chat يقبل apiKey من جسم الطلب ويفضّله على مفتاح الخادم. | /api/ai/recitation-check يقبل token لـ HuggingFace من العميل. | قائمة نماذج Gemini مكررة هنا وفي recitationEngine.js. | review القديم (/api/quran/pages/:n/review) يرجع 410 عمدًا. | Vite يُحمَّل بـ import() داخل startServer فقط (devDependency) — استيراده في أعلى الملف أسقط دالة Vercel كلها (FUNCTION_INVOCATION_FAILED لكل /api). | package.json يثبّت jwks-rsa على ^3 عبر overrides: الإصدار 4 (اعتماد firebase-admin) يعمل require() لـ jose 6 (ESM فقط) ومحمّل Vercel لا يدعمه فيسقط الخادم بـ ERR_REQUIRE_ESM — لا تحذف الـ override. | على Vercel يجب ضبط FIREBASE_SERVICE_ACCOUNT_JSON، وإلا تفشل كل قراءات Firestore في الخادم (503).
- **يستخدم:** database.js, recitationEngine.js, firestoreRecitation.js, quranReference.js, auth.js, groups.js, community.js, privateUserData.js, fortressPlanPersistence.js
- **يستخدمه:** api/index.js, AiAssistant.jsx, FiveFortressesPlan.jsx, QuranInteractiveView.jsx, SimilaritiesView.jsx, AdminPerformanceDashboard.jsx, QuranSurahAyahsModal.jsx, useRecitationRecorder.js, fortressService.js, learningProfileService.js

### `server/middleware/auth.js`
- **يفعل:** يهيئ firebase-admin (حساب خدمة من FIREBASE_SERVICE_ACCOUNT_JSON أو GOOGLE_APPLICATION_CREDENTIALS أو المحاكي) ويصدّر db (Firestore Admin). requireAuth: يتحقق من Bearer ID token، ثم يقرأ users/{uid} ويضع req.user = التوكن + role/roles/profile (403 إن لم يوجد ملف، 503 إن فشلت القراءة). optionalAuth، requireAdmin (يستخدم accessControl.isAdmin).
- **لماذا:** الصلاحيات تُقرأ من مستند المستخدم في Firestore وليس من التوكن (لا custom claims)، فتغيير الدور يسري فورًا.
- **متى:** عند تحميل الخادم (تهيئة)، ثم قبل كل مسار محمي.
- **إن تعطّل:** كل ملفات الخادم التي تستورد db منه (11 ملفًا) وكل المسارات المحمية.
- **انتبه:** بدون بيانات اعتماد يطبع تحذيرًا فقط ويستمر — يبدو الخادم شغالًا لكن كل التحقق يفشل. | كل طلب محمي = قراءة Firestore إضافية لملف المستخدم.
- **يستخدم:** accessControl.js, emulatorSafety.js
- **يستخدمه:** firestoreGroups.js, firestoreRecitation.js, fortressPlanPersistence.js, server/index.js, privateUserData.js, community.js, groups.js, teacherScope.js

### `server/privateUserData.js`
- **يفعل:** ownsRequestedIdentity: يرفض (403) أي طلب يحمل uid/userId في params/query/body لا يطابق المستخدم الموثّق. chatRef/planRef: مسارا users/{uid}/private_ai_chat/current وfive_fortresses_plans/current. appendChat: يضيف زوج رسالة/رد داخل transaction ويحتفظ بآخر 100.
- **لماذا:** الهوية تأتي من التوكن فقط؛ الحقول القديمة التي يرسلها العميل مسموحة فقط إن طابقت، لمنع قراءة بيانات مستخدم آخر.
- **متى:** في مسارات الدردشة وخطة الحصون.
- **إن تعطّل:** الدردشة وخطة الحصون لا تُحفظ أو تتسرب.
- **يستخدم:** auth.js
- **يستخدمه:** fortressPlanPersistence.js, server/index.js

### `server/routes/community.js`
- **يفعل:** منشورات المجتمع في Firestore (community_posts): قائمة آخر 100، إنشاء (مع إخفاء الهوية)، تعديل/حذف للمالك أو المشرف (الحذف يمسح التعليقات والإعجابات والإشعارات المرتبطة)، إعجاب toggle، تعليق. وإشعارات المستخدم: قائمة، تعليم كمقروء، الكل كمقروء، حذف واحد/الكل. الإعجاب والتعليق ينشئان إشعارًا لصاحب المنشور داخل transaction.
- **لماذا:** الكتابة تمر عبر الخادم (Admin SDK) لا من العميل مباشرة لضمان عدّاد الإعجابات والتعليقات وإنشاء الإشعار ذريًا.
- **متى:** عند فتح تبويب المجتمع ومركز الإشعارات، وعند كل تفاعل.
- **إن تعطّل:** Community.jsx وNotificationContext (وبالتالي NotificationCenter وجرس الإشعارات).
- **انتبه:** لا يوجد مسار POST /notifications/register-token رغم أن firebase.js يستدعيه. | serializePost يقرأ كل التعليقات + إعجاب المشاهد لكل منشور (حتى 100 منشور × 2 قراءة) في كل تحميل.
- **يستخدم:** auth.js, accessControl.js
- **يستخدمه:** server/index.js, Community.jsx, NotificationContext.jsx, firebase.js

### `server/routes/groups.js`
- **يفعل:** مسارات الحلقات والمعلم والمشرف وتحليلات الطالب: /groups (قائمة/lookup عام/join/leave)، /admin/* (إنشاء حلقة، users، safar-users، overview بإحصاءات الأسبوع بتوقيت عمّان، assign/remove-teacher، create-teacher لحساب موجود فقط، distribute-student، enrollment-requests)، /teacher/:teacherId/* (students، student/:id مع إحصاءات وتقدم، مراجعة جلسة، ملاحظات + إشعار للطالب، reports، dashboard، enroll/add-student)، /student/analytics، /safar/enrollment-request.
- **لماذا:** استبدل منطق safarEcosystem.js (JSON وهمي) بمنطق Firestore حقيقي عبر firestoreGroups.js. كل مسار محمي بـ requireAuth + requireAdmin أو teacherScope (canActAsTeacher).
- **متى:** عند فتح لوحات المعلم/المشرف، الانضمام لحلقة من المعالج أو JoinGroupModal، وفتح شاشة التحليلات.
- **إن تعطّل:** TeacherDashboard وTeacherStudents/Groups/Reports وAdminDashboard وAdminDistributionView وJoinGroupModal وOnboardingWizard (خطوة الحلقة) وAnalyticsView.
- **انتبه:** مراجعة الجلسة وكتابة الملاحظات تشترط أن يكون المستخدم هو المعلم نفسه — المشرف (admin) لا يستطيع رغم أن teacherScope يسمح له بالقراءة. | /teacher/:id/dashboard و/reports تقرأ كل جلسات كل طالب بلا ترقيم — بطيء مع كثرة البيانات. | GET /groups/lookup عام بلا مصادقة (مقصود: يعرض بيانات الحلقة فقط).
- **يستخدم:** auth.js, accessControl.js, firestoreRecitation.js, quranActivityStreak.js, firestoreGroups.js, teacherScope.js
- **يستخدمه:** server/index.js, AnalyticsView.jsx, AdminDashboard.jsx, AdminDistributionView.jsx, AdminPerformanceDashboard.jsx, JoinGroupModal.jsx, TeacherGroupsView.jsx, TeacherReportsView.jsx, TeacherStudentProfileModal.jsx, TeacherStudentsView.jsx, OnboardingWizard.jsx

### `server/teacherScope.js`
- **يفعل:** requireTeacherStudent: يقرأ memberships/{studentId} ثم groups/{groupId} ويرمي 403 إن لم يكن الطالب عضوًا نشطًا في حلقة يملكها هذا المعلم حاليًا. activeTeacherMembers: كل الأعضاء النشطين لمعلم (اختياريًا لحلقة واحدة).
- **لماذا:** تعليق المؤلف: العضوية والمالك الحالي للحلقة هما المرجع؛ مؤشرات الملف الشخصي (teacherId في users) أو معرّف المعلم في جلسات قديمة لا تمنح وصولًا أبدًا.
- **متى:** قبل عرض ملف طالب للمعلم، مراجعة جلسة، إضافة ملاحظة، التقارير، ونقل طالب.
- **إن تعطّل:** المعلم يرى طلابًا ليسوا له أو لا يرى طلابه.
- **يستخدم:** auth.js, accessControl.js
- **يستخدمه:** firestoreGroups.js, firestoreRecitation.js, groups.js

## طبقة: الخادم: المنطق والتخزين
_safarEcosystem، database، Firestore، محرك التسميع_

### `server/database.js`
- **يفعل:** يحمّل db.json ويزرع بيانات (مستخدم admin_123/admin123 وdemo_user_123/demo123 بكلمات مرور PBKDF2، 49 صفحة وهمية لخريطة المصحف، منشور مجتمع ثابت) ثم يحفظ. runQuery/getRow/allRows تطابق نص SQL بالـ includes/startsWith وتنفذ على مصفوفات. ويوفر محفظة الآيات (getUserPortfolio/saveAyahToPortfolio/bulkSaveSurahToPortfolio) وsaveRecitationSession القديمة (تمنح XP).
- **لماذا:** بقايا مرحلة ما قبل Firestore (كانت SQLite ثم JSON). ما زالت مستخدمة من index.js لمسارات المشرف القديمة و/api/quran/pages ومحفظة الآيات.
- **متى:** يُنفَّذ seedDb عند تحميل الخادم — يكتب db.json في كل إقلاع.
- **إن تعطّل:** مسارات index.js القديمة فقط.
- **انتبه:** يعيد كتابة community_posts في الذاكرة في كل إقلاع (لكن المجتمع الحقيقي صار في Firestore). | حسابات بكلمات مرور ثابتة مزروعة (المصادقة القديمة معطلة بـ 410، فلا يمكن استخدامها حاليًا). | على Vercel الكتابة على القرص لا تدوم. | saveRecitationSession/getRecitationHistory/getPageRecitationStats لا يستوردها أحد (حل محلها firestoreRecitation).
- **يستخدم:** recitationStats.js
- **يستخدمه:** server/index.js

### `server/db.js` **[☠ ميت]**
- **يفعل:** getDb/saveDb لقراءة وكتابة server/db.json.
- **لماذا:** نسخة أقدم من database.js.
- **إن تعطّل:** لا شيء.
- **انتبه:** صفر مستوردين في كل المشروع (بما فيه الاختبارات والسكربتات).

### `server/firestoreGroups.js`
- **يفعل:** GroupError، publicUser (يحذف كلمات المرور ويُصفّر حقول الحفظ المعتمد)، listUsers، listGroups (عدد الطلاب يُحسب من العضويات لا من العدّاد المخزن)، findGroup بالرمز، createFirestoreGroup (رمز عشوائي + groupInvites)، setMembership (العملية المركزية: عضوية واحدة نشطة لكل طالب، تحدّث مؤشرات المستخدم وعدّادات الحلقتين وحالة الطلب في transaction واحدة، مع فحص السعة وصلاحية الفاعل)، submitRequest، listRequests، changeTeacherRole (يمنع إزالة الدور إن كان يملك حلقات)، teacherStudents (بحث/فلترة/ترتيب).
- **لماذا:** يضمن الاتساق: لا يمكن أن يكون الطالب في حلقتين، ولا أن يختلف العدّاد عن الواقع بعد نقل.
- **متى:** عند الانضمام/المغادرة/النقل/القبول/إنشاء حلقة/تعيين معلم.
- **إن تعطّل:** كل عمليات الحلقات في routes/groups.js.
- **انتبه:** memorizedPages وtotalJuz وmemoryScore تُرجع null دائمًا عمدًا ('unavailable_no_page_approval_workflow') — أي واجهة تعرضها ستُظهر فراغًا أو 0. | في sort: الخيار 'memorization' يرتّب بالاسم فعليًا.
- **يستخدم:** auth.js, teacherScope.js, accessControl.js
- **يستخدمه:** groups.js

### `server/firestoreRecitation.js`
- **يفعل:** preparePracticeRequest: يتحقق من sessionId والحدود، يأخذ النص المرجعي من quranReference (لا من العميل) ويحسب fingerprint. findPracticeAttempt/savePracticeAttempt: حفظ المحاولة مرة واحدة لكل sessionId (نفس المعرف بمدخل مختلف = 409)، مع تحديث recitation_stats/summary وpage_progress/{page} والـ streak. confirmPracticeAttempt، submitPracticeForReview (يرسلها لمعلم الحلقة الحالي)، reviewPracticeSession (قبول/رفض من المعلم)، readPracticeHistory/Stats/PageStats، practicePerformanceReport للمشرف.
- **لماذا:** التسميع 'تدريب' وليس اعتمادًا: rewardedXp=0 دائمًا وحالة الآيات تُستبدل بـ 'practice'. التكرار الآمن (idempotency) يمنع احتساب نفس المحاولة مرتين عند إعادة الإرسال.
- **متى:** بعد كل تسميع محفوظ (autoSave)، وعند فتح سجل/إحصاءات الصفحة، وعند إرسال/مراجعة جلسة.
- **إن تعطّل:** حفظ التسميع وتاريخه ومراجعة المعلم وتقرير الأداء.
- **انتبه:** readPracticeHistory يقرأ كل الجلسات ثم يفلتر في الذاكرة (تعليق المؤلف: يجب إضافة ترقيم/فهارس قبل الإنتاج الواسع). | readPracticePageStats يحسب من السجل ثم يستبدل بالقيم المخزنة في page_progress إن وُجدت.
- **يستخدم:** teacherScope.js, auth.js, accessControl.js, recitationStats.js, quranReference.js, quranActivityStreak.js
- **يستخدمه:** server/index.js, groups.js

### `server/fortressPlanPersistence.js`
- **يفعل:** profilePreferences (يقبل JSON نصي قديم)، confirmedProfile (ينظف الملف ويصفّر حقول الحفظ)، persistProfilePatch (دمج التفضيلات لا استبدالها)، persistFortressPlan: يحفظ الخطة في five_fortresses_plans/current ويُسقط حالة الإنجاز اليومية في users.preferences.fortressesToday بمفاتيح 1..5، ويصفّر الإنجاز إذا تغيّر اليوم بتوقيت عمّان.
- **لماذا:** الخطة وحالة اللوحة يجب أن تُحفظا معًا وإلا تختلف اللوحة عن الخطة. تعليق المؤلف: هذه قائمة شخصية — لا اعتماد معلم ولا XP.
- **متى:** عند حفظ الخطة أو تعليم حصن كمنجز، وعند تحديث الملف الشخصي (PUT /api/user/:uid).
- **إن تعطّل:** خطة الحصون وتحديث الملف الشخصي من المعالج.
- **يستخدم:** auth.js, privateUserData.js, quranActivityStreak.js
- **يستخدمه:** server/index.js

### `server/quranActivityStreak.js`
- **يفعل:** ammanDateKey (YYYY-MM-DD بتوقيت Asia/Amman)، nextQuranActivityStreak (+1 إن كان النشاط السابق أمس، يبقى إن كان اليوم، وإلا يعود 1)، activityNow (يسمح بتثبيت الوقت في الاختبارات عبر MA7FATH_TEST_NOW).
- **لماذا:** اليوم يُحسب بتوقيت عمّان لا UTC حتى لا ينكسر الـ streak بعد منتصف الليل UTC (الثالثة فجرًا بتوقيت عمّان).
- **متى:** عند حفظ كل محاولة تسميع، وفي إحصاءات المشرف والتحليلات وخطة الحصون.
- **إن تعطّل:** الـ streak يُحسب خطأ أو يُصفّر.
- **يستخدمه:** firestoreRecitation.js, fortressPlanPersistence.js, groups.js

### `server/quranReference.js`
- **يفعل:** يحمّل server/data/quran-uthmani.json (1.7MB) ويتحقق أنه 114 سورة و6236 آية وإلا يرمي عند الإقلاع. quranPageReference(page)، quranSurahReference(n)، trustedQuranReference: يبني النص المتوقع للمقارنة من رقم السورة/الآية/الصفحة ويتحقق من تطابقها.
- **لماذا:** تعليق في index.js: العرض والتسميع يستخدمان نفس النص العثماني الثابت — النص المرجعي لا يُقبل من العميل أبدًا حتى لا يُزوَّر.
- **متى:** عند الإقلاع (تحميل)، وعند عرض صفحة/سورة، وعند كل فحص تسميع.
- **إن تعطّل:** الخادم لا يقلع أصلًا إن كان الملف ناقصًا؛ لا عرض للآيات ولا تسميع.
- **يستخدمه:** firestoreRecitation.js, server/index.js

### `server/recitationEngine.js` **[⧉ تكرار]**
- **يفعل:** تنظيف وتطبيع النص القرآني (إزالة التشكيل، توحيد الألف، ٱ، ألف خنجرية، الحروف المقطعة المنطوقة 'ألف لام ميم'←'الم'). compareRecitation وcomparePageRecitation: محاذاة كلمات بخوارزمية LCS ثم تصنيف كل كلمة (صحيح، لحن جلي ون/ين وان/ين، ال التعريف، الضمائر، حروف العطف، تشكيل، ناقصة، زائدة) ودقة = (الكلمات − العقوبات)/الكلمات. analyzeRecitation للصوت: (1) Gemini يستمع ويقيّم مباشرة، (2) وإلا Gemini يفرّغ، (3) وإلا ffmpeg→WAV ثم HuggingFace Whisper (tarteel-ai أولًا)، ثم المقارنة.
- **لماذا:** قلب ميزة التسميع: كشف اللحن الجلي (المؤمنون/المؤمنين) لا مجرد تطابق نصي. البسملة لا تُحتسب ناقصة إن لم يقرأها. العقوبات: كلمة خاطئة/ناقصة/لحن = 1، تشكيل = 0.4، زيادة = 0.3.
- **متى:** عند كل طلب /api/ai/recitation-check (صوت أو نص).
- **إن تعطّل:** التسميع كله.
- **انتبه:** في المسار الأول (Gemini مباشر) الدقة يقررها النموذج نفسه لا الخوارزمية — النتيجة قد تختلف عن تلوين الكلمات المحسوب. | عتبات التقييم (95/85/70) مكررة 3 مرات: getRatingColor وcompareRecitation وcomparePageRecitation. | convertTo16kHzWav يحتاج ffmpeg مثبتًا؛ إن غاب يُرسل الصوت الخام. | مهلة HuggingFace 6 ثوانٍ لكل نموذج.
- **يستخدمه:** server/index.js

### `server/recitationStats.js`
- **يفعل:** calculatePageRecitationStats: من قائمة جلسات، يحسب لمستخدم وصفحة: عدد المحاولات، المتوسط، الأفضل، آخر وقت، آخر 10.
- **لماذا:** منطق مشترك بين database.js القديم وfirestoreRecitation.
- **متى:** عند قراءة إحصاءات صفحة.
- **إن تعطّل:** إحصاءات الصفحة.
- **انتبه:** lastRecitedAt = أول عنصر؛ يفترض أن القائمة مرتبة تنازليًا مسبقًا.
- **يستخدمه:** database.js, firestoreRecitation.js

### `server/safarEcosystem.js` **[☠ ميت]**
- **يفعل:** ~1200 سطر بيانات بذرية وهمية (3 حلقات 'سفر'، معلمات، عشرات الطلاب بإحصاءات مختلقة، طلبات انضمام) تُحفظ في safar_data.json، ودوال للحلقات والمعلم والمشرف (getGroups، joinGroupByCode، getTeacherDashboard، assignTeacherRole، ...). قرأت المحمّل والدوال الرئيسية؛ الباقي بيانات.
- **لماذا:** النسخة الأولى من نظام الحلقات قبل نقله إلى Firestore. استُبدل بالكامل بـ firestoreGroups.js + routes/groups.js.
- **إن تعطّل:** لا شيء.
- **انتبه:** صفر مستوردين (يُذكر اسمه نصيًا فقط في DocumentationModal). 83KB يمكن حذفها مع safar_data*.json.

## طبقة: النشر و Service Workers
_Vercel، PWA، إشعارات الخلفية_

### `api/index.js`
- **يفعل:** يعيد تصدير تطبيق Express من server/index.js.
- **لماذا:** Vercel يشغّل الخادم كدالة من مجلد api/ (انظر vercel.json).
- **متى:** عند كل طلب /api على Vercel.
- **إن تعطّل:** كل الخادم على Vercel يتوقف.
- **انتبه:** server/index.js يحفظ بيانات في ملفات JSON محلية (db.json، safar_data.json)؛ نظام ملفات Vercel مؤقت/للقراءة، فهذه البيانات لا تبقى هناك.
- **يستخدم:** server/index.js

### `public/firebase-messaging-sw.js`
- **يفعل:** يحمّل Firebase compat 10.8.0 من gstatic، يهيئ إعدادات المشروع (مكتوبة داخله)، ويعرض الرسائل الواردة في الخلفية كإشعار مع النقر لفتح /dashboard.
- **لماذا:** المسار الافتراضي الذي يبحث عنه Firebase Messaging لإشعارات الخلفية.
- **متى:** فقط إن سجّله Firebase تلقائيًا (عندما لا يُمرَّر serviceWorkerRegistration).
- **إن تعطّل:** لا شيء غالبًا.
- **انتبه:** على الأرجح لا يُستخدم: requestFcmToken تمرّر تسجيل sw.js صراحة. | لا يوجد في الخادم أي كود يرسل رسائل FCM (لا messaging.send) — الإشعارات الخلفية لن تصل أصلًا إلى أن يُضاف مُرسل. | إصدار Firebase هنا (10.8) مختلف عن الحزمة في package.json (12.x).

### `public/sw.js`
- **يفعل:** يُسجَّل من index.html. عند التثبيت يخزّن الصفحة الرئيسية والأيقونات؛ يحذف الكاش القديم عند التفعيل؛ لكل طلب GET غير /api: الشبكة أولًا ثم الكاش (والتنقل يرجع index.html دون اتصال). يستقبل push ويعرض إشعارًا عربيًا بزري 'فتح المصحف' و'لاحقًا'، والنقر يركّز نافذة مفتوحة أو يفتح /dashboard.
- **لماذا:** تثبيت التطبيق كـ PWA وعمله الأساسي دون اتصال، واستقبال إشعارات الخلفية.
- **متى:** عند أول زيارة (تسجيل) ثم مع كل طلب.
- **إن تعطّل:** لا تثبيت PWA ولا عمل دون اتصال.
- **انتبه:** اسم الكاش ثابت 'almahfath-cache-v1' — لا يتغير مع النشر، لكن استراتيجية الشبكة أولًا تقلل خطر الملفات القديمة. | هذا هو الـ SW الذي تستخدمه requestFcmToken (navigator.serviceWorker.ready)، لا firebase-messaging-sw.js.
