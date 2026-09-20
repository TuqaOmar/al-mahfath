import React from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  Sparkles,
  Users,
  Mic,
  Award
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherReportsView = () => {
  const { lang, isRTL } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
          {lang === 'ar' ? 'التقارير التحليلية والأداء' : 'Analytics & Performance Reports'}
        </h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          {lang === 'ar' 
            ? 'مؤشرات دقيقة لأداء الحلقة والتحسن التراكمي في دقة التلاوة والتسميع' 
            : 'Detailed performance indicators and recitation accuracy trends'}
        </p>
      </div>

      {/* Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>إجمالي أوجه الحفظ المنجزة هذا الشهر</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)', margin: '6px 0' }}>468 وجهاً</div>
          <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>↑ زيادة 18% مقارنة بالشهر السابق</span>
        </div>

        <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>متوسط دقة التسميع الصوتي</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', margin: '6px 0' }}>94.6%</div>
          <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>تحليل عبر 312 جلسة تسميع ذكية</span>
        </div>

        <div style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>معدل التثبيت والمراجعة (الحصن البعيد)</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#3B82F6', margin: '6px 0' }}>88.2%</div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>التزام بمراجعة المحفوظ القديم</span>
        </div>
      </div>

      {/* Common Hesitation Heatmap / Topic Analysis */}
      <div style={{ padding: '24px', borderRadius: '22px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
          أبرز مواضع المتشابهات والتردد المشتركة في الحلقة
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          اكتشف الذكاء الاصطناعي أكثر الآيات التي تكرر فيها التردد لدى أكثر من 8 طالبات:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { ayah: '«قُلْ أَطِيعُوا اللَّهَ وَالرَّسُولَ فَإِنْ تَوَلَّوْا...»', surah: 'آل عمران 32', count: '11 طالبة', tip: 'التفريق بينها وبين موضع سورة النور «وَأَطِيعُوا الرَّسُولَ»' },
            { ayah: '«خَالِدِينَ فِيهَا أَبَدًا» في آل عمران مقابل البقرة', surah: 'آل عمران 88', count: '9 طالبات', tip: 'عدم وجود لفظ (أبداً) في مواضع سورة البقرة' },
            { ayah: '«وَسَارِعُوا إِلَى مَغْفِرَةٍ مِنْ رَبِّكُمْ»', surah: 'آل عمران 133', count: '8 طالبات', tip: 'ضبط حرف الواو مقارنة بموضع الحديد «سَابِقُوا» بدون واو' }
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', fontFamily: 'serif' }}>{item.ayah}</strong>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{item.surah} • نصيحة الضبط: {item.tip}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                تردد لدى {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
