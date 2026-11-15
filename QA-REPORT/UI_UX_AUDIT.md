# UI_UX_AUDIT — المحفظ AI

> الصفحات العامة فقط على `al-mahfath.vercel.app` (Production). شاشات Dashboard كلها تحتاج دخولًا ← **BLOCKED**. الفحص بقياسات DOM آلية + لقطات حقيقية من المتصفح المدمج.

## 1. Responsive (الصفحة الرئيسية، عربي)
| العرض | تجاوز أفقي | عناصر خارج الشاشة | نص مقصوص | تداخل | لقطة |
|---|---|---|---|---|---|
| 1920 | لا | 0 | 0 | — | — |
| 1440 | لا | 0 | 0 | — | `screenshots/authentication/TC-UI-01_landing_1440_ar.jpg` |
| 1280 | لا | 0 | 0 | — | — |
| 768 | لا | 0 | 0 | — | `screenshots/mobile/TC-UI-04_landing_768_ar.jpg` |
| 390 | لا | 0 | 0 | — | `screenshots/mobile/TC-UI-05_landing_390_ar.jpg` |
| 375 | لا | 0 | — | — | — |
| 360 | لا | 0 | — | 0 في الهيدر | `screenshots/mobile/TC-UI-07_landing_360_ar.jpg` |

ملاحظة: لقطات العروض الكبيرة (1440) تُظهر جزء النافذة المرئي من المتصفح المدمج؛ القياس الآلي هو المرجع للعرض الكامل.

## 2. العربي/الإنجليزي
- ✅ التبديل يغيّر `dir` و`lang` فورًا ويحفظ الاختيار.
- ❌ BUG-008: زر ونافذة «تثبيت التطبيق» عربية في الوضع الإنجليزي (مُصلح في الفرع).
- ❌ BUG-015: عنوان التبويب يبقى عربيًا.
- ℹ️ بوابتا المعلمة والمشرف عربية في معظمها (معروف، CODE_MAP).

## 3. جودة الواجهة
| البند | النتيجة |
|---|---|
| Forms Validation (الدخول/التسجيل) | ✅ required + type=email · ❌ BUG-010 لا حد لكلمة المرور |
| Confirmation/Modals | ⚠️ نافذة الدخول تفتح والتركيز على زر الإرسال · ❌ BUG-007 دليل التثبيت |
| Empty/Error states | ❌ BUG-005 صفحة بيضاء للمسار غير الموجود · Dashboard: BLOCKED |
| Keyboard | ✅ مؤشر تركيز ظاهر (`screenshots/authentication/TC-A11Y-02_keyboard_focus_visible_360_en.png`) |
| Contrast | ❌ BUG-006: 2.54:1 على الأزرار الخضراء |
| Touch targets | ❌ BUG-011: 32–36px |
| أسماء العناصر/alt/العناوين | ✅ 0 بلا اسم، 0 صور بلا alt، h1 واحد وتسلسل عناوين منطقي |
| Loading/Toast/Success/Hover/Scrolling داخل التطبيق | ⛔ BLOCKED |

## 4. لقطات المشاكل
- `screenshots/errors/TC-I18N-01_landing_360_en_install_button_arabic.jpg`
- `screenshots/errors/TC-PWA-02_install_guide_en_mode_arabic_no_esc.jpg`
- `screenshots/errors/TC-NAV-03_unknown_route_blank_page_360.jpg`
- `screenshots/authentication/TC-AUTH-01_signin_modal_360_en.jpg` (لا رابط «نسيت كلمة المرور»)
- `screenshots/authentication/TC-AUTH-02_signup_modal_360_en.jpg`

مجلدات `student/ teacher/ admin/ quran/ recitation/ ai-assistant/ community/` فارغة: كل شاشاتها خلف تسجيل الدخول (BLOCKED).
