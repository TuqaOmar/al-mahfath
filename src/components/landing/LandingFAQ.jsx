import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingFAQ = () => {
  const { isRTL } = useLanguage();

  const faqs = isRTL ? [
    { q: 'هل التطبيق مجاني؟', a: 'نعم، المنصة متاحة مجانًا لوجه الله تعالى لكل من يحفظ كتاب الله.' },
    { q: 'كيف يعمل التسميع الصوتي؟', a: 'تسجّل تلاوتك، فيحوّلها التطبيق إلى نص ويقارنها بالنص العثماني كلمة بكلمة، ثم يعرض نسبة المطابقة ويلوّن الكلمات الصحيحة والخاطئة والناقصة. النتيجة تدريب يساعدك، ولا تغني عن التلقّي من معلمة.' },
    { q: 'هل أحتاج إلى حلقة أو معلمة؟', a: 'لا. يمكنك المتابعة كحافظ مستقل، والانضمام لحلقة برمز دعوة من معلمتك متى شئت.' },
    { q: 'هل يُحفظ تقدّمي؟', a: 'نعم، خطتك وسجل تسميعك محفوظان في حسابك، فتكمل من أي جهاز.' },
    { q: 'على أي الأجهزة يعمل؟', a: 'يعمل في المتصفح على الجوال والكمبيوتر، ويمكن تثبيته كتطبيق على الشاشة الرئيسية.' }
  ] : [
    { q: 'Is it free?', a: 'Yes. The platform is free for everyone memorizing the Book of Allah.' },
    { q: 'How does voice recitation work?', a: 'You record your recitation; the app transcribes it and compares it word by word with the Uthmani text, then shows a match score and highlights correct, wrong and missing words. It is practice support, not a replacement for a teacher.' },
    { q: 'Do I need a circle or a teacher?', a: 'No. You can memorize on your own and join a circle with an invite code whenever you like.' },
    { q: 'Is my progress saved?', a: 'Yes. Your plan and recitation history are stored in your account, so you can continue on any device.' },
    { q: 'Which devices does it support?', a: 'It runs in the browser on phones and computers, and can be installed to your home screen.' }
  ];

  return (
    <section id="faq" className="lp-section">
      <div className="container" style={{ maxWidth: '760px' }}>
        <h2 className="lp-heading">{isRTL ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>
        <div className="lp-faq">
          {faqs.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>
                <span>{item.q}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
