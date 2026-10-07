import React from 'react';
import { Mic, ShieldCheck, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LandingFeatures = ({ children }) => {
  const { isRTL } = useLanguage();

  const features = isRTL ? [
    { icon: Mic, title: 'تسميع صوتي يكشف الخطأ', text: 'اقرأ الآية أو الصفحة، فيقارن التطبيق تلاوتك بالنص العثماني كلمة بكلمة ويلوّن مواضع الخطأ.' },
    { icon: ShieldCheck, title: 'خطة الحصون الخمسة', text: 'ورد يومي يوزّع وقتك بين القراءة والتحضير والحفظ الجديد والمراجعة القريبة والبعيدة.' },
    { icon: Users, title: 'حلقتك ومعلمتك', text: 'انضم لحلقة برمز دعوة، وأرسل جلسات التسميع لمعلمتك لتراجعها وتكتب لك ملاحظاتها.' }
  ] : [
    { icon: Mic, title: 'Recitation that catches mistakes', text: 'Recite an ayah or a page; the app compares it word by word with the Uthmani text and highlights errors.' },
    { icon: ShieldCheck, title: 'The Five Fortresses plan', text: 'A daily routine split between reading, preparation, new memorization, and near and far review.' },
    { icon: Users, title: 'Your circle and teacher', text: 'Join a circle with an invite code and send recitation sessions to your teacher for review and notes.' }
  ];

  const steps = isRTL ? [
    { title: 'القراءة', text: 'جزء يومي نظرًا من المصحف' },
    { title: 'التحضير', text: 'سماع صفحة الغد وفهمها' },
    { title: 'الحفظ الجديد', text: 'تكرار متقن لصفحة اليوم' },
    { title: 'المراجعة القريبة', text: 'آخر ٢٠ صفحة حفظتها' },
    { title: 'المراجعة البعيدة', text: 'المحفوظ القديم بالتدوير' }
  ] : [
    { title: 'Reading', text: 'A daily portion from the Mushaf' },
    { title: 'Preparation', text: "Listen to tomorrow's page" },
    { title: 'New memorization', text: "Repeat today's page" },
    { title: 'Near review', text: 'Your last 20 pages' },
    { title: 'Far review', text: 'Older pages in rotation' }
  ];

  return (
    <>
      <section id="features" className="lp-section">
        <div className="container">
          <h2 className="lp-heading">{isRTL ? 'كل ما تحتاجه لحفظ متقن' : 'Everything you need to memorize well'}</h2>
          <div className="lp-cards">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="lp-card">
                <span className="lp-card__icon"><Icon size={22} /></span>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {children}

      <section id="method" className="lp-section lp-section--tinted">
        <div className="container">
          <h2 className="lp-heading">{isRTL ? 'الحصون الخمسة في يومك' : 'The Five Fortresses in your day'}</h2>
          <p className="lp-subheading">
            {isRTL ? 'منهجية د. سعيد أبو العلا حمزة لتثبيت الحفظ ومنع التفلّت.' : 'The method of Dr. Saeed Abu Al-Ala Hamza for lasting memorization.'}
          </p>
          <ol className="lp-steps">
            {steps.map((step, index) => (
              <li key={step.title} className="lp-step">
                <span className="lp-step__number">{(index + 1).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</span>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{step.title}</strong>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
};
