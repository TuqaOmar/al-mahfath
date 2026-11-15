# FEATURE_INVENTORY — المحفظ AI

> Phase 2: كل ما اكتُشف فعليًا في الكود (الفرع `fix/audit-2026-11-15`، commit `6194861`). الأعمدة «ملف» تشير لمكان التنفيذ.

## 1. المسارات (React Router)

| Route | الحماية | الشاشة |
|---|---|---|
| `/` | عام | `LandingPage` (Navbar، Hero، Features، Screens، FAQ، Footer) + `AuthModal` + على الجوال `MobileWelcomeView` |
| `/wizard` | `ProtectedRoute requireWizard=false` | `OnboardingWizard` (أسلوب التعلم، الأجزاء المحفوظة، الهدف، الصورة، الانضمام لحلقة) |
| `/dashboard` | `ProtectedRoute requireWizard=true` | `Dashboard` — كل التبويبات أدناه |

## 2. التبويبات داخل `/dashboard` حسب الدور (`src/lib/navigation.js` + `Dashboard.jsx`)

| ID | الطالب | المعلمة | المشرف | المكوّن |
|---|---|---|---|---|
| FEAT-S01 `home` | ✓ | | | لوحة الطالب: الورد، التقدم، التذكير |
| FEAT-S02 `quran-map` | ✓ | | | `QuranMapPage` (خريطة 604 صفحة + لوحة تفاصيل) |
| FEAT-S03 `daily-session` / `mushaf` | ✓ | ✓ | | `QuranInteractiveView` + `MushafPage` + التسميع (`useRecitationRecorder`) |
| FEAT-S04 `five-fortresses` | ✓ | | | `FiveFortressesPlan` / `SimplifiedFortressPlan` |
| FEAT-S05 `analytics` | ✓ | | | `AnalyticsView` + `VisualProgressTracker` |
| FEAT-S06 `my-plan` | ✓ | | | `MyPlanManager` |
| FEAT-S07 `ai-assistant` | ✓ | | | `AiAssistant` |
| FEAT-S08 `similarities` | ✓ | ✓ | | `SimilaritiesView` |
| FEAT-S09 `mind-maps` | ✓ | ✓ | | `MindMapsView` |
| FEAT-S10 `community` | ✓ (حسب إعداد المشرف) | | | `Community` |
| FEAT-S11 `achievements` | ✓ (حسب إعداد المشرف) | | | `AchievementsView` |
| FEAT-T01 `teacher-dashboard` | | ✓ | | `TeacherDashboard` |
| FEAT-T02 `teacher-students` | | ✓ | | `TeacherStudentsView` + `TeacherStudentProfileModal` (مراجعة، ملاحظات) |
| FEAT-T03 `teacher-groups` | | ✓ | | `TeacherGroupsView` |
| FEAT-T04 `teacher-reports` | | ✓ | | `TeacherReportsView` |
| FEAT-A01 `admin-dashboard` | | | ✓ | `AdminDashboard` (تبويبات داخلية: performance، distribution، users، teachers، groups، analytics، community، badges، experience) |
| FEAT-A02 `admin-users` / `admin-teachers` / `admin-groups` / `admin-analytics` | | | ✓ | نفس `AdminDashboard` بتبويب مختلف |
| FEAT-A03 `admin-distribution` | | | ✓ (من داخل اللوحة) | `AdminDistributionView` |
| FEAT-A04 `admin-performance` | | | ✓ (من داخل اللوحة) | `AdminPerformanceDashboard` |
| FEAT-A05 `admin-community` | | | ✓ (من داخل اللوحة) | `AdminCommunityView` |
| FEAT-A06 `admin-badges` / `admin-experience` | | | ✓ (من داخل اللوحة) | `AdminExperienceSettings` |
| FEAT-A07 `admin-tajweed` | | | ✓ (قيد التطوير) | `TajweedLab` |

## 3. ميزات مشتركة / عامة

| ID | الميزة | الملفات |
|---|---|---|
| FEAT-C01 | تسجيل حساب / دخول بريد وكلمة مرور / Google (redirect على الجوال) / خروج / حذف الحساب | `AuthModal`, `AuthContext`, `QuickSettingsMenu`, `DELETE /api/user/me` |
| FEAT-C02 | الملف الشخصي وتغيير الصورة (Storage ≤ 2MB) | `UserProfileModal` |
| FEAT-C03 | تبديل اللغة عربي/إنجليزي (RTL/LTR) | `LanguageContext`, `src/i18n/*` |
| FEAT-C04 | الوضع الليلي | `ThemeContext`, `ThemeToggle` |
| FEAT-C05 | تبديل الدور للحساب متعدد الأدوار | `RoleSwitcherMenu` |
| FEAT-C06 | الإشعارات داخل التطبيق + Push (FCM) + تذكير المراجعة اليومي | `NotificationContext`, `NotificationCenter`, `ReviewReminderAlert` |
| FEAT-C07 | تثبيت PWA وإرشادات iOS/Android | `PWAInstallButton`, `usePWAInstall`, `public/sw.js`, `manifest.json` |
| FEAT-C08 | تحديث نسخة التطبيق (Capacitor) | `AppUpdatePrompt` |
| FEAT-C09 | السحب للتحديث على الجوال | `PullToRefresh` |
| FEAT-C10 | التوثيق والعرض التقديمي داخل التطبيق | `DocumentationModal`, `PresentationModal` |
| FEAT-C11 | الانضمام لحلقة بكود | `JoinGroupModal`, `GET /api/groups/lookup`, `POST /api/groups/join` |
| FEAT-C12 | ملف أسلوب التعلم | `LearningStyleProfiler` |
| FEAT-C13 | ذكر ما بعد التلاوة | `PostSessionDhikr` |
| FEAT-C14 | مختبر التجويد ومخارج الحروف | `TajweedLab`, `ArticulationDiagram` |

## 4. مجموعات Firestore وStorage (`firestore.rules`, `storage.rules`)

| المسار | القراءة | الكتابة |
|---|---|---|
| `users/{uid}` | المالك، المشرف، المعلمة المسندة حاليًا | إنشاء آمن للمالك، تحديث حقول محددة، حذف للمشرف فقط |
| `users/{uid}/notifications` | المالك | الخادم فقط |
| `users/{uid}/teacher_notes` | المالك/المشرف/المعلمة الحالية | الخادم فقط |
| `users/{uid}/ayah_progress` | المالك/المشرف/المعلمة الحالية | المالك (مع userId مطابق) |
| `users/{uid}/private_ai_chat`, `five_fortresses_plans` | المالك | الخادم فقط |
| `users/{uid}/recitation_sessions`, `recitation_stats`, `page_progress` | حسب القاعدة العامة للمجموعات الفرعية | الخادم فقط |
| `community_posts/{id}` (+ `comments`, `likes`) | الخادم فقط (`false`) | الخادم فقط |
| `app_config/{id}` | أي مستخدم مسجل | المشرف |
| `groups/{id}` | أي مستخدم مسجل | الخادم فقط |
| `memberships/{uid}` | المالك/المشرف/المعلمة الحالية | الخادم فقط |
| `enrollmentRequests/{id}` | المشرف/صاحب الطلب | الخادم فقط |
| Storage `avatars/{uid}/*` | أي مستخدم مسجل | المالك (صورة ≤ 2MB) |

## 5. واجهات API (كل الـ Endpoints)

| # | Method | Endpoint | الحماية | الملف |
|---|---|---|---|---|
| API-01 | POST | `/api/admin/create-teacher` | requireAuth, requireAdmin | `server/routes/groups.js:134` |
| API-02 | POST | `/api/admin/distribute-student` | requireAuth, requireAdmin | `server/routes/groups.js:309` |
| API-03 | GET | `/api/admin/enrollment-requests` | requireAuth, requireAdmin | `server/routes/groups.js:316` |
| API-04 | POST | `/api/admin/enrollment-requests/approve` | requireAuth, requireAdmin | `server/routes/groups.js:320` |
| API-05 | POST | `/api/admin/groups/create` | requireAuth, requireAdmin | `server/routes/groups.js:49` |
| API-06 | GET | `/api/admin/memorization-performance` | requireAuth, requireAdmin | `server/index.js:520` |
| API-07 | GET | `/api/admin/overview` | requireAuth, requireAdmin | `server/routes/groups.js:90` |
| API-08 | GET | `/api/admin/safar-users` | requireAuth, requireAdmin | `server/routes/groups.js:81` |
| API-09 | DELETE | `/api/admin/user/:uid` | requireAuth+requireAdmin (mount) — 410 | `server/index.js (loop)` |
| API-10 | PUT | `/api/admin/user/:uid` | requireAuth+requireAdmin (mount) — 410 | `server/index.js (loop)` |
| API-11 | GET | `/api/admin/users` | requireAuth, requireAdmin | `server/routes/groups.js:52` |
| API-12 | DELETE | `/api/ai/chat` | requireAuth | `server/index.js:234` |
| API-13 | GET | `/api/ai/chat` | requireAuth | `server/index.js:225` |
| API-14 | POST | `/api/ai/chat` | requireAuth, rateLimit | `server/index.js:292` |
| API-15 | POST | `/api/ai/recitation-check` | optionalAuth, rateLimit | `server/index.js:367` |
| API-16 | GET | `/api/ai/recitation-status` | عام (public) | `server/index.js:507` |
| API-17 | POST | `/api/auth/admin` | عام — يرجع 410 | `server/index.js (loop)` |
| API-18 | POST | `/api/auth/demo` | عام — يرجع 410 | `server/index.js (loop)` |
| API-19 | POST | `/api/auth/google` | عام — يرجع 410 | `server/index.js (loop)` |
| API-20 | POST | `/api/auth/login` | عام — يرجع 410 | `server/index.js (loop)` |
| API-21 | POST | `/api/auth/signup` | عام — يرجع 410 | `server/index.js (loop)` |
| API-22 | GET | `/api/community/leaderboard` | requireAuth | `server/routes/community.js:50` |
| API-23 | GET | `/api/community/posts` | requireAuth | `server/routes/community.js:42` |
| API-24 | POST | `/api/community/posts` | requireAuth | `server/routes/community.js:73` |
| API-25 | DELETE | `/api/community/posts/:id` | requireAuth | `server/routes/community.js:102` |
| API-26 | PUT | `/api/community/posts/:id` | requireAuth | `server/routes/community.js:91` |
| API-27 | POST | `/api/community/posts/:id/comments` | requireAuth | `server/routes/community.js:148` |
| API-28 | DELETE | `/api/community/posts/:id/comments/:commentId` | requireAuth | `server/routes/community.js:175` |
| API-29 | POST | `/api/community/posts/:id/like` | requireAuth | `server/routes/community.js:121` |
| API-30 | GET | `/api/groups` | requireAuth | `server/routes/groups.js:30` |
| API-31 | POST | `/api/groups/join` | requireAuth | `server/routes/groups.js:42` |
| API-32 | POST | `/api/groups/leave` | requireAuth | `server/routes/groups.js:46` |
| API-33 | GET | `/api/groups/lookup` | عام (public) | `server/routes/groups.js:36` |
| API-34 | GET | `/api/health` | عام (public) | `server/index.js:42` |
| API-35 | DELETE | `/api/notifications` | requireAuth | `server/routes/community.js:223` |
| API-36 | GET | `/api/notifications` | requireAuth | `server/routes/community.js:189` |
| API-37 | DELETE | `/api/notifications/:id` | requireAuth | `server/routes/community.js:215` |
| API-38 | PATCH | `/api/notifications/:id/read` | requireAuth | `server/routes/community.js:199` |
| API-39 | POST | `/api/notifications/read-all` | requireAuth | `server/routes/community.js:207` |
| API-40 | POST | `/api/notifications/register-token` | requireAuth | `server/routes/community.js:194` |
| API-41 | GET | `/api/quran/pages` | عام (public) | `server/index.js:212` |
| API-42 | POST | `/api/quran/pages/:pageNumber/review` | requireAuth | `server/index.js:216` |
| API-43 | GET | `/api/quran/reference/page/:pageNumber` | عام (public) | `server/index.js:47` |
| API-44 | GET | `/api/quran/reference/surah/:surahNumber` | عام (public) | `server/index.js:55` |
| API-45 | GET | `/api/recitation/history` | requireAuth | `server/index.js:483` |
| API-46 | GET | `/api/recitation/page-stats/:pageNumber` | requireAuth | `server/index.js:495` |
| API-47 | POST | `/api/recitation/save` | requireAuth | `server/index.js:458` |
| API-48 | POST | `/api/recitation/sessions/:sessionId/submit` | requireAuth | `server/index.js:473` |
| API-49 | POST | `/api/safar/enrollment-request` | requireAuth | `server/routes/groups.js:313` |
| API-50 | GET | `/api/student/analytics` | requireAuth | `server/routes/groups.js:251` |
| API-51 | POST | `/api/teacher/:teacherId/add-student` | requireAuth | `server/routes/groups.js (loop)` |
| API-52 | GET | `/api/teacher/:teacherId/available-students` | requireAuth | `server/routes/groups.js:290` |
| API-53 | GET | `/api/teacher/:teacherId/dashboard` | requireAuth | `server/routes/groups.js:221` |
| API-54 | POST | `/api/teacher/:teacherId/enroll-student` | requireAuth | `server/routes/groups.js (loop)` |
| API-55 | GET | `/api/teacher/:teacherId/reports` | requireAuth | `server/routes/groups.js:201` |
| API-56 | GET | `/api/teacher/:teacherId/student/:studentId` | requireAuth | `server/routes/groups.js:147` |
| API-57 | POST | `/api/teacher/:teacherId/student/:studentId/notes` | requireAuth | `server/routes/groups.js:184` |
| API-58 | PATCH | `/api/teacher/:teacherId/student/:studentId/sessions/:sessionId/review` | requireAuth | `server/routes/groups.js:178` |
| API-59 | GET | `/api/teacher/:teacherId/students` | requireAuth | `server/routes/groups.js:143` |
| API-60 | GET | `/api/user/:uid` | requireAuth | `server/index.js:85` |
| API-61 | PUT | `/api/user/:uid` | requireAuth | `server/index.js:113` |
| API-62 | ALL | `/api/user/:uid/portfolio` | requireAuth — يرجع 410 | `server/index.js (loop)` |
| API-63 | ALL | `/api/user/:uid/portfolio/ayah` | requireAuth — يرجع 410 | `server/index.js (loop)` |
| API-64 | ALL | `/api/user/:uid/portfolio/bulk-surah` | requireAuth — يرجع 410 | `server/index.js (loop)` |
| API-65 | POST | `/api/user/fortress-plan` | requireAuth | `server/index.js:155` |
| API-66 | GET | `/api/user/fortress-plan/:uid` | requireAuth | `server/index.js:168` |
| API-67 | DELETE | `/api/user/me` | requireAuth | `server/index.js:144` |

المجموع: 67

### Endpoints بلا مستدعٍ في الواجهة

| Endpoint | التقييم |
|---|---|
| `GET /api/health`, `GET /api/ai/recitation-status` | تشغيلية (مراقبة) — مقبول |
| `POST /api/auth/*` (5) , `GET /api/quran/pages`, `POST /api/quran/pages/:n/review`, portfolio (3), `PUT/DELETE /api/admin/user/:uid` | متوقفة عمدًا (410) — مرشحة للحذف لاحقًا |
| `GET /api/quran/reference/surah/:n` | عامة وغير مستخدمة من الواجهة — مقبول (قراءة نص عام) |
| `POST /api/safar/enrollment-request` | **لا مستدعٍ** — لا توجد واجهة يقدّم منها الطالب «طلب انتساب»، بينما شاشة المشرف «توزيع الطالبات والانتساب» تعرض وتعتمد هذه الطلبات (BUG-MED، انظر BUG_REPORT) |
| `POST /api/teacher/:id/enroll-student` | لا مستدعٍ (الواجهة تستخدم `add-student`) — تكرار |

## 6. خدمات خارجية

| الخدمة | الاستخدام | عند الفشل |
|---|---|---|
| Gemini (`GEMINI_MODELS`) | المساعد، تقييم التلاوة المباشر، التفريغ | المساعد: رد داخلي + `fallback:true`؛ التسميع: Whisper |
| Hugging Face Whisper (`WHISPER_MODELS`) | تفريغ الصوت | خطأ «تعذر تحويل الصوت» |
| Web Speech API (المتصفح) | تفريغ مباشر أثناء التسجيل | يعتمد على الصوت فقط |
| Firebase Auth/Firestore/Storage/FCM | كل البيانات | 503 من الخادم |
| quran.com / Tafsir APIs (الواجهة) | التفسير | رسائل خطأ شبكة متوقعة |
