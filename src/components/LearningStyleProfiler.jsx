import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Eye, 
  Volume2, 
  Fingerprint, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  Sliders,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { learningQuizQuestions, calculateLearningProfile } from '../utils/learningQuizData';

export const LearningStyleProfiler = () => {
  const { user, updateUserData } = useAuth();
  const { lang, isRTL } = useLanguage();

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [successToast, setSuccessToast] = useState('');

  // Current profile from user preferences or calculated fallback
  const userProfile = user?.preferences?.learningProfile;
  const userStyle = user?.preferences?.learningStyle || (lang === 'ar' ? 'سمعي بصري (مختلط)' : 'Audio-Visual (Mixed)');

  const percentages = userProfile?.percentages || {
    auditory: userStyle.includes('سمعي') || userStyle.includes('صوتي') ? 70 : 30,
    visual: userStyle.includes('بصري') || userStyle.includes('مرئي') ? 75 : 35,
    kinesthetic: userStyle.includes('حركي') || userStyle.includes('كتابي') ? 60 : 20,
    analytical: userStyle.includes('تحليلي') ? 65 : 25
  };

  const getDominantIcon = () => {
    if (userStyle.includes('صوتي') || userStyle.includes('سمعي')) return Volume2;
    if (userStyle.includes('مرئي') || userStyle.includes('بصري')) return Eye;
    if (userStyle.includes('حركي') || userStyle.includes('كتابي')) return Fingerprint;
    if (userStyle.includes('تحليلي')) return BookOpen;
    return Sparkles;
  };

  const DominantIcon = getDominantIcon();

  const handleStartQuiz = () => {
    setQuizAnswers({});
    setCurrentQuestionIdx(0);
    setShowQuizModal(true);
  };

  const handleAnswerQuestion = async (qId, optionId) => {
    const updated = { ...quizAnswers, [qId]: optionId };
    setQuizAnswers(updated);

    if (currentQuestionIdx < learningQuizQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Completed
      const profile = calculateLearningProfile(updated);
      const newStyle = lang === 'ar' ? profile.styleLabelAr : profile.styleLabelEn;

      await updateUserData({
        preferences: {
          ...(user?.preferences || {}),
          learningStyle: newStyle,
          learningProfile: profile
        }
      });

      if (user?.uid) {
        try {
          await fetch(`/api/user/${user.uid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              preferences: {
                ...(user?.preferences || {}),
                learningStyle: newStyle,
                learningProfile: profile
              }
            })
          });
        } catch (e) {
          console.error('Failed to sync updated learning style:', e);
        }
      }

      setShowQuizModal(false);
      setSuccessToast(isRTL ? `تم تحديث نمطك بنجاح إلى: ${newStyle} ✨` : `Learning style updated to ${newStyle}! ✨`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  const currentQ = learningQuizQuestions[currentQuestionIdx];

  return (
    <div style={{
      padding: '28px',
      borderRadius: '24px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-soft)',
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative'
    }}>
      
      {/* Toast */}
      {successToast && (
        <div style={{
          position: 'absolute',
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10B981',
          color: 'white',
          padding: '8px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10
        }}>
          <CheckCircle2 size={16} />
          {successToast}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
              {isRTL ? 'تحليل نمط الحفظ الذكي (صوتي / مرئي / مختلط)' : 'Smart Learning Style Profiler'}
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isRTL ? 'الآلية الذهنية الأنسب لك لتثبيت القرآن دون نسيان' : 'Your optimal mental pathway for solid Quran retention'}
            </span>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid var(--primary)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RotateCcw size={14} />
          <span>{isRTL ? 'إعادة تشخيص النمط 🧠' : 'Retake Diagnostic 🧠'}</span>
        </button>
      </div>

      {/* Dominant Style Card */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1.5px solid var(--primary)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DominantIcon size={26} />
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
            🎯 النمط المعتمد حالياً في محفظتك:
          </span>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{userStyle}</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {userProfile?.recommendationAr || (isRTL 
              ? 'تتكامل أدوات المنصة معك لتقديم أفضل تجربة مخصصة تجمع بين الاستماع الصوتي والتتبع البصري.' 
              : 'Platform tools adapt dynamically to your cognitive memorization profile.')}
          </p>
        </div>
      </div>

      {/* Percentages Meter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🎧 سمعي (صوتي):</span>
            <strong style={{ color: 'var(--primary)' }}>{percentages.auditory}%</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentages.auditory}%`, height: '100%', background: '#10B981' }} />
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>👁️ بصري (مرئي):</span>
            <strong style={{ color: 'var(--primary)' }}>{percentages.visual}%</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentages.visual}%`, height: '100%', background: '#3B82F6' }} />
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>✍️ حركي وكتابي:</span>
            <strong style={{ color: 'var(--primary)' }}>{percentages.kinesthetic}%</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentages.kinesthetic}%`, height: '100%', background: '#8B5CF6' }} />
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>📖 تحليلي وتدبري:</span>
            <strong style={{ color: 'var(--primary)' }}>{percentages.analytical}%</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentages.analytical}%`, height: '100%', background: '#F59E0B' }} />
          </div>
        </div>
      </div>

      {/* How the platform customizes the experience */}
      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
        ⚙️ كيف تكيّف المنصة تجربتك بناءً على نمطك؟
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#10B981', display: 'block', marginBottom: '4px' }}>🎧 للنمط الصوتي (السمعي):</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            تفعيل مشغل القارئ التلقائي، جلسات التسميع الصوتي المباشر، وتكرار الحدر.
          </span>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#3B82F6', display: 'block', marginBottom: '4px' }}>👁️ للنمط المرئي (البصري):</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            إبراز مواضع الآيات في صفحة المصحف، خريطة القرآن التفاعلية، والخرائط الذهنية.
          </span>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#8B5CF6', display: 'block', marginBottom: '4px' }}>✍️ للنمط الحركي والكتابي:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            تفعيل عداد التكرار باللمس والمسبحة، واختبارات سحب الكلمات وإكمال الفراغات.
          </span>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#F59E0B', display: 'block', marginBottom: '4px' }}>📖 للنمط التحليلي والتدبري:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            عرض شجرة المتشابهات اللفظية، أسباب النزول، ولطائف التفسير قبل الحفظ.
          </span>
        </div>
      </div>

      {/* Retake Diagnostic Modal */}
      {showQuizModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {isRTL ? `السؤال ${currentQuestionIdx + 1} من ${learningQuizQuestions.length}` : `Question ${currentQuestionIdx + 1} of ${learningQuizQuestions.length}`}
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                  {isRTL ? 'إعادة تشخيص نمط الحفظ 🧠' : 'Retake Learning Diagnostic'}
                </h3>
              </div>
              <button 
                onClick={() => setShowQuizModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Question Progress Bar */}
            <div style={{ height: '4px', width: '100%', background: 'var(--glass-border)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${((currentQuestionIdx + 1) / learningQuizQuestions.length) * 100}%`, 
                  background: 'var(--primary)', 
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>

            {/* Question Title */}
            <h4 style={{ fontSize: '15.5px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? currentQ.titleAr : currentQ.titleEn}
            </h4>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.options.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleAnswerQuestion(currentQ.id, opt.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'var(--bg-color)';
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {isRTL ? opt.textAr : opt.textEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
