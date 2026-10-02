# حصر العضويات والطلبات القديمة محليًا

تاريخ الحصر: 2026-10-02، توقيت عمّان. أُنتج التقرير من ملفات مساحة العمل فقط بأداة `scripts/auditLegacyMemberships.mjs`؛ لا اتصال بـFirebase أو Auth أو Firestore، ولا تنفيذ ترحيل أو تعديل ملفات البيانات. معرفات التقرير SHA-256 مختصرة ومتسقة للمقارنة؛ لم تُعرض أسماء أو عناوين بريد أو هواتف أو مفاتيح أو كلمات مرور.

## النطاق والنسخ الاحتياطية

| المصدر | التصنيف | حالة القراءة / القوائم | SHA-256 |
|---|---|---|---|
| `server/db.json` | أساسي محلي | users: 3؛ سجلات مؤشرات عضوية: 0 | d474671ce57395993c6c16f937b35a485d80f87e2254372c11feaf8459dc4a86 |
| `server/safar_data.json` | أساسي محلي | groups: 3، teachers: 3، students: 25، independentUsers: 3، enrollmentRequests: 3؛ سجلات مؤشرات عضوية: 25 | 30ac0aad7f218fdf46cf3258ce40b48a37374103261279379cb408569a6448e2 |
| `server/db.backup.json` | نسخة احتياطية؛ خارج الإجماليات | users: 3؛ سجلات مؤشرات عضوية: 0؛ مختلف عن الأصل بايتًا | 8b17faf14eb42cf7e632a0e2da5531f22889ee2a284314af80d8ff7e29743e90 |
| `server/safar_data.backup.json` | نسخة احتياطية؛ خارج الإجماليات | JSON غير صالح عند الموضع 45350؛ مختلف عن الأصل بايتًا | 785e2650d2365bd7b7087ef88ae7be5bef48c54526f831b8fe079cf3db8d8ce5 |

## إجماليات المصادر الأساسية

- 33 هوية محلية مميزة من 34 سجل حساب؛ التكرار بين db وSafar يُحسب مرة واحدة بالـuid، ولا تدخل backups في الإجمالي. الحقول ليست دليل وجود حساب Firebase Auth.
- 3 حلقات، و3 معرفات معلم محلية، و25 عضوية قديمة مرشحة للمراجعة قبل أي نقل، و3 طلبات قديمة.
- 31 هوية تطابق literals في كود seed، و1 هوية بصيغة الإنشاء المحلي student/teacher + رقم. هذه مؤشرات مصدر تجريبي/محلي، وليست إثباتًا لغيابها من Auth.
- سجلات بلا حقل uid: 0؛ سجلات تحمل firebaseUid/authUid/firebaseAuthUid صراحة: 0. جميع هويات Auth غير متحقق منها؛ يلزم ربط مُراجع بالـuid الفعلي قبل النقل.
- تعارضات groupId/teacherId/isSafarMember بين نسخ الحساب الأساسية: 0. غياب الحقل في أحد المصدرين لا يُعامل كتعارض.
- معرفات حلقات مكررة: 0؛ رموز دعوة مكررة بعد trim/uppercase: 0. لا تُعرض الرموز في التقرير.
- أصحاب طلبات pending محلية متعددة بعد ربط الهوية الممكن: 0. لا يثبت هذا عدم وجود تكرار عند غياب uid في الطلب.

## الحلقات والعدادات

| الحلقة | المعلم | الطلاب ذوو groupId في المصادر الأساسية | membersCount القديم | الحالة قبل النقل |
|---|---|---|---|---|
| group-3327ce16eefa | uid-2080a5f81f1b | 25 | 25 | studentsCount الجديد غير موجود؛ عدّاد المعلم لا يطابق سجلات عضوياته المحلية؛ المعلم seed محلي؛ يلزم ربط Auth |
| group-0ba8fa8b3dba | uid-a5b662571241 | 0 | 18 | العداد لا يطابق السجلات؛ يلزم إعادة حساب بعد مراجعة الهوية؛ studentsCount الجديد غير موجود؛ عدّاد المعلم لا يطابق سجلات عضوياته المحلية؛ المعلم seed محلي؛ يلزم ربط Auth |
| group-5df93cb4f68c | uid-ec881e63814a | 0 | 15 | العداد لا يطابق السجلات؛ يلزم إعادة حساب بعد مراجعة الهوية؛ studentsCount الجديد غير موجود؛ عدّاد المعلم لا يطابق سجلات عضوياته المحلية؛ المعلم seed محلي؛ يلزم ربط Auth |

## العضويات المرشحة للمراجعة

هذه قائمة حصر، وليست قائمة معتمدة للترحيل. تُراجع هويات seed والحسابات المحلية أولًا، ثم يُحدد أي منها يمثل بيانات حقيقية. تتطلب كل عضوية مقبولة كتابة memberships وربط users وإعادة حساب عدّاد الحلقة في تنفيذ منفصل مصرح به؛ لم تُنفّذ أي كتابة هنا.

| الحساب | مصدر السجل | الحلقة | المعلم | isSafarMember | نقاط المراجعة |
|---|---|---|---|---|---|
| uid-cc5cf0d3ecb9 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | هوية مولّدة محليًا؛ uid Auth غير متحقق |
| uid-7f6f295bf4d8 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-53c0638794f6 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-0a2fa9ab95a7 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-d9396090d303 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-505fd84ee9a4 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-17209ac2911d | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-128cabf63570 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-0f402146f4e2 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-5b3b69192b47 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-e03898295dad | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-f633ba59bd56 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-2fb5eea559e7 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-d4e724b813a8 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-335ebd752a94 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-90ef993dd444 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-ecbbab508b9f | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-8b3c2ef09221 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-310be4fde560 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-201c2cdc3cfa | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-b2896fe8c1f2 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-eaccd8878cfa | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-f523fc426866 | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-13bdd62e4abd | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |
| uid-ca5716420a3c | `server/safar_data.json:students` | group-3327ce16eefa | uid-2080a5f81f1b | true | مطابق seed؛ uid Auth غير متحقق |

## الطلبات القديمة

| الطلب | الحالة | الحساب المرتبط محليًا | الإجراء المطلوب قبل نقل |
|---|---|---|---|
| request-dfe7be6cee3b | pending | غير موجود | بلا uid أو مطابقة بريد محلية؛ هوية Auth مطلوبة |
| request-0b86aaba6f39 | pending | غير موجود | بلا uid أو مطابقة بريد محلية؛ هوية Auth مطلوبة |
| request-22eae5b93f9b | pending | غير موجود | بلا uid أو مطابقة بريد محلية؛ هوية Auth مطلوبة |

## قيود التنفيذ الحالي؛ ليست متطلبات نهائية

- `memberships/{uid}` يسمح بوثيقة عضوية نشطة واحدة لكل مستخدم. `setMembership` يستبدل العضوية عند النقل ويحذفها عند الخروج؛ لا يمثل عضويات متوازية أو سجل انتقالات. هذه خاصية المخطط الحالي فقط؛ لم يُعتمد أن المنتج يجب أن يمنع تعدد الحلقات نهائيًا.
- `enrollmentRequests/{uid}` يسمح بوثيقة طلب واحدة لكل مستخدم. `submitRequest` يعيد الطلب pending السابق دون إنشاء طلب آخر أو تحديث حقوله. بعد approved، أو أي حالة غير pending، يستخدم `tx.set(ref, data)` دون merge؛ لذلك يستبدل الطلب السابق وحقول approvedBy/approvedAt/groupId/teacherId ولا يحتفظ بسجل تاريخ. هذا قيد حالي يحتاج قرار منتج وحفظ تاريخ قبل أي نقل قد يحتوي عدة طلبات للمستخدم نفسه.
- قبول الطلب وتغيير العضوية في معاملة واحدة يمنع تكرار العدّاد، لكنه لا يضيف سجلًا تاريخيًا للطلبات أو العضويات. لا يُستنتج من نجاح اختبارات المعاملة قبول القيود كمتطلبات نهائية.

## حدود الحصر وخطة مراجعة النقل

- لم تُقرأ Firestore الإنتاج أو Auth الإنتاج. لا يمكن من هذه الملفات تحديد عدد عضويات users القديمة الموجودة فقط في Firestore، أو الوثائق التي نُقلت سابقًا، أو التعارضات مع الحالة الإنتاجية. لا يدّعي التقرير أن القائمة تشمل كل الإنتاج.
- النسخ الاحتياطية غير مضافة إلى عدد العضويات أو الطلبات. النسخة غير الصالحة لا تُصلح ولا تُسترجع تلقائيًا؛ تحتاج مراجعة مستقلة قبل اعتماد أي سجل منها. اختلاف البايتات وحده لا يثبت وجود عضويات إضافية.
- سكربت `scripts/migrateToFirestore.js` الحالي لا ينشئ memberships أو enrollmentRequests ولا يضبط عدّادات العضوية. لم يُشغّل حتى بوضع dry-run؛ لا يُستخدم كحل نقل للرحلة الموحدة دون تعديل ومراجعة مستقلة.
- الخطوة اللاحقة عند التصريح بنقل: تحديد الحقيقي مقابل seed، تقديم خريطة مُراجعة local uid → Firebase Auth uid، حسم تعدد العضويات وتاريخ الطلبات، ثم مقارنة نسخة إنتاج مقروءة بصلاحيات مضبوطة وإنشاء خطة dry-run واضحة قبل أي كتابة. لا تتضمن هذه المتابعة تنفيذ تلك الخطوة.

## إعادة الحصر والتحقق من عدم تعديل البيانات

```powershell
node scripts/auditLegacyMemberships.mjs
node scripts/auditLegacyMemberships.mjs --output reports/legacy-memberships.md
```

الأمر الأول يطبع تقريرًا منقحًا فقط؛ الثاني يكتب ملف التقرير داخل مساحة العمل. تُقارن SHA-256 لجميع المصادر بعد القراءة، ويُرفض النجاح إذا تغيّر أي مصدر أثناء الحصر. لا تُحمّل env أو credentials، ولا تُجرى اتصالات شبكة.

