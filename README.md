# al-mahfath — محفظ AI

📖 منصة تفاعلية لمساعدة حفّاظ القرآن على تخطيط حفظهم ومراجعته وتسميعه بالذكاء الاصطناعي.
An AI-powered platform that helps Quran memorizers plan, review and recite.

- **الواجهة:** React 19 + Vite (`src/`)، عربي/إنجليزي، PWA، وتطبيق جوال عبر Capacitor (`android/`, `ios/`).
- **الخادم:** Express 5 (`server/index.js`)، ويُنشر على Vercel عبر `api/index.js`.
- **البيانات:** Firebase Auth + Firestore + Storage + FCM.
- **الذكاء الاصطناعي:** Gemini (المساعد وتقييم التسميع) وWhisper عبر Hugging Face كبديل.

> قبل تعديل الكود اقرأ [`CODE_MAP.md`](./CODE_MAP.md) (خريطة الملفات والمشاكل المعروفة) و[`AGENTS.md`](./AGENTS.md).

## التشغيل محليًا

```bash
npm install
cp .env.example .env      # ثم املئي القيم أدناه
npm run dev               # http://localhost:3000 (الخادم + Vite)
```

### متغيرات البيئة

| المتغير | مطلوب؟ | الاستخدام |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` أو `GOOGLE_APPLICATION_CREDENTIALS` | نعم للخادم | صلاحيات Firebase Admin (التحقق من الدخول، Firestore، حذف الحسابات). **لا ترفعي ملف المفتاح للمستودع.** |
| `GEMINI_API_KEY` | اختياري | المساعد الذكي وتقييم التسميع. بدونه يرد المساعد من المحرك الداخلي ويظهر تنبيه بذلك. |
| `HUGGINGFACE_TOKEN` | اختياري | تحويل الصوت إلى نص عبر Whisper عند فشل Gemini (يحتاج `ffmpeg` على الخادم لأفضل نتيجة). |
| `FIRESTORE_DATABASE_ID` | اختياري | قاعدة Firestore غير الافتراضية. |
| `VITE_IOS_APP_STORE_ID` | اختياري | رسالة التحديث داخل تطبيق iOS. |

## الأوامر

| الأمر | ماذا يفعل |
|---|---|
| `npm run dev` / `npm start` | تشغيل الخادم والواجهة |
| `npm run build` | بناء الواجهة إلى `dist/` |
| `npm run test:engine` | اختبارات محرك التسميع (604 صفحة، الفاتحة، المقطعات، ffmpeg) — بدون إنترنت |
| `npm run test:security` | اختبارات الصلاحيات والأمان |
| `npm run test:emulator` / `test:emulator:browser` | اختبارات Firebase Emulator و Chrome (لا تلمس الإنتاج) — انظري [`tests/EMULATOR.md`](./tests/EMULATOR.md) |
| `npm run cap:sync` / `cap:android` / `cap:ios` | مزامنة وفتح تطبيقات الجوال |

## ملاحظات النشر

- مسارات الذكاء الاصطناعي عليها حدّ طلبات لكل مستخدم (`server/middleware/rateLimit.js`).
- حذف الحساب يتم من الخادم (`DELETE /api/user/me`) ويحذف كل بيانات المستخدم ثم حساب الدخول.
- بعد أي تعديل على الواجهة لتطبيق الجوال: `npm run cap:sync`.
