# AUTOMATION_REPORT — المحفظ AI

## البيئة
- Node v22، بلا وصول لسجل npm → `firebase-admin`, `express`, `dotenv`, `cors`, `@google/genai` غير مثبتة. لتشغيل الاختبارات النقية استُخدم loader يستبدل هذه الحزم بـ stubs فارغة (`node --import stub.mjs`) — لا يغيّر منطق المشروع.
- الأدوات: `node:test`، esbuild (بناء/استيراد)، TypeScript `--checkJs` (متغيرات غير معرّفة)، react-dom/server (عرض مكونات)، والمتصفح المدمج (Chromium) للإنتاج.

## النتائج
| المجموعة | الملف | النتيجة | الدليل |
|---|---|---|---|
| محرك التسميع (604 صفحة، الفاتحة، المقطعات، ffmpeg …) | `tests/recitation-engine.test.js` | 17/17 PASS | `evidence/unit-tests.txt` |
| حذف الحساب (Firestore وهمي) | `tests/account-deletion.test.js` | 2/2 PASS | |
| حد الطلبات | `tests/rate-limit.test.js` | 1/1 PASS | |
| الصلاحيات والقواعد (منطق) | `tests/security.test.js` | 9/9 PASS | |
| أمان المحاكي (منطق) | `tests/emulator-safety.test.js` | 2/3 PASS · 1 BLOCKED (يشغّل الخادم الحقيقي في عملية منفصلة بلا الحزم) | |
| HTTP للخادم | `tests/api-security.test.js` | BLOCKED (يحتاج express) | |
| **دقة التسميع (جديد في هذا الفحص)** | `QA-REPORT/automation/recitation-accuracy.qa.test.js` | 13/14 PASS · **1 FAIL = BUG-009** | `evidence/recitation-accuracy.txt` |
| فحوصات ثابتة (بناء، ملفات بلا استخدام، تطابق API) | qa scripts | PASS (+ BUG-004) | `evidence/static-checks.txt` |
| تكامل نص المصحف بين الإنتاج والمصدر | sha256 لـ 20 صفحة | 20/20 | `evidence/quran-text-integrity.txt` |
| Firebase Emulator + Chrome (`test:emulator`, `test:emulator:browser`) | موجودة في المشروع | **BLOCKED** هنا | — |

## إعادة التشغيل محليًا
```bash
npm install
npm run test:engine
node --test QA-REPORT/automation/recitation-accuracy.qa.test.js
npm run test:security
npm run test:emulator:browser   # يحتاج Java + Firebase CLI؛ لا يلمس الإنتاج
```
