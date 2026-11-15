# SECURITY_AUDIT — المحفظ AI

> 2026-11-15 · بدون أي اختبار هجومي على Production: طلبات قراءة/رفض فقط بدون حسابات، والباقي مراجعة كود واختبارات وحدة.

## النتيجة المختصرة
| ID | البند | النتيجة | الدليل |
|---|---|---|---|
| SEC-A | API Authentication: كل مسارات البيانات ترفض الطلب بدون توكن أو بتوكن غير صالح | ✅ PASS (10 مسارات على Prod → 401) | TC-API-01/02 |
| SEC-B | API Authorization (منطق الأدوار وعزل المعلمات) | ✅ PASS على مستوى المنطق (9 اختبارات) · ⛔ BLOCKED ديناميكيًا | TC-AUTH-10 |
| SEC-C | IDOR على `/api/user/:uid` | ✅ PASS (كود: 403 لغير المالك/المشرف) | server/index.js:85 |
| SEC-D | Firestore Rules | ✅ لا قاعدة مفتوحة؛ المجتمع والمجموعات للكتابة عبر الخادم فقط · ⛔ اختبار المحاكي BLOCKED | firestore.rules |
| SEC-E | XSS | ✅ لا `dangerouslySetInnerHTML` ولا `innerHTML` في `src/`؛ React يهرب النصوص | static |
| SEC-F | Injection | ✅ لا SQL؛ Firestore بمعاملات؛ مدخلات المنشور/التعليق محدودة الطول (4000/1500) | community.js:16 |
| SEC-G | Rate limiting | ✅ على `/api/ai/chat` و`/api/ai/recitation-check` (الفرع) · ⚠️ لا حد على النشر/التعليق | TC-API-07 |
| SEC-H | تزوير الجلسة في localStorage | ✅ PASS (يُمسح ويُحوَّل) | TC-AUTH-07 |
| SEC-I | خصوصية المنشور المخفي | ❌ BUG-003 (High) | community.js:28 |
| SEC-J | كشف إعدادات الخادم | ❌ BUG-016 (Low) | TC-SEC-04 |
| SEC-K | تخزين الأسرار | ✅ لا مفاتيح خادم في المستودع الحالي؛ مفتاح Firebase Web عام بطبيعته · ❌ SEC-01 تاريخ git | TC-SEC-02 |
| SEC-L | حماية التسجيلات الصوتية | ✅ الصوت لا يُخزَّن؛ تُحفظ النتيجة والنص فقط | TC-REC-27 |
| SEC-M | أكواد الحلقات | ✅ 48-bit عشوائية؛ البحث العام لا يكشف قائمة الطلاب | TC-TCH-03 |
| SEC-N | مفتاح Gemini الشخصي | ⚠️ يُحفظ نصًا في localStorage ويُرسل للخادم بكل طلب (تصميم موثّق) | AiAssistant.jsx |
| SEC-O | CORS | ⚠️ `cors()` مفتوح؛ الخطر محدود لأن الحماية بـ Bearer وليس كوكيز | server/index.js |
| SEC-P | بيانات لطرف ثالث | ❌ BUG-014 (أسماء لـ dicebear) | AdminDistributionView.jsx:475 |
| SEC-Q | انتهاء الجلسة/حساب معطل/استعادة كلمة المرور | ❌ BUG-002 · ⛔ الباقي BLOCKED | TC-AUTH-04/08 |

## SEC-01 — بيانات شخصية في تاريخ git (High، إجراء من المالكة)
`server/db.json` و`server/safar_data.json` حُذفا من الملفات الحالية في PR #16، لكنهما ما زالا في commits سابقة لمستودع **عام**: إيميلات، اسم، `passwordHash` و`salt` لحساب أدمن قديم، ورسائل محادثة. **المطلوب:** جعل المستودع Private، أو مسح التاريخ (`git filter-repo`) مع force push، وتغيير كلمة سر أي حساب حقيقي مرتبط.

## ما لم يُختبر أمنيًا (BLOCKED)
محاولات وصول طالب لمسارات المعلمة/المشرف بتوكن حقيقي، وصول معلمة لطلاب معلمة أخرى، Firestore Rules على المحاكي، انتهاء الجلسة، الحساب المعطل، رفع ملفات خبيثة للصورة. كلها مغطاة بالكود والاختبارات الموجودة (`tests/firebase-emulator.test.js`, `tests/firebase-browser.test.js`) ويجب تشغيلها محليًا: `npm run test:emulator:browser`.
