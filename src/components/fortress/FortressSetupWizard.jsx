import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { BookOpen, Target, RotateCcw, Book, Bell, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationManager } from '../../utils/NotificationManager';
import { saveFortressPlanToFirestore } from '../../lib/fortressService';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 'new', title: 'الحفظ الجديد', icon: Target, desc: 'من أين ستبدأ حفظك الجديد؟' },
  { id: 'near', title: 'المراجعة القريبة', icon: RotateCcw, desc: 'ما هي الصفحات أو الأجزاء التي حفظتها حديثاً وتريد تثبيتها؟' },
  { id: 'far', title: 'المراجعة الكبرى', icon: BookOpen, desc: 'ما هي الأجزاء القديمة التي تريد مجدولتها للمراجعة؟' },
  { id: 'reading', title: 'الختمة (القراءة)', icon: Book, desc: 'ورد التلاوة اليومي المستمر.' },
  { id: 'notifications', title: 'الإشعارات والتنبيهات', icon: Bell, desc: 'دعنا نذكرك بأورادك في وقتها.' }
];

export const FortressSetupWizard = ({ onComplete }) => {
  const { user, applyConfirmedUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    newMemorization: { startSura: 'البقرة', startAyah: '1', dailyTarget: 'صفحة واحدة' },
    nearRevision: { recentParts: '' },
    farRevision: { oldParts: '', dailyTarget: 'نصف جزء' },
    reading: { startPart: 'الجزء الأول', dailyTarget: 'جزء واحد' },
    notifications: { enabled: false, reminderTimes: ['05:00'] }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleNext = async () => {
    if (currentStep === STEPS.length - 1) {
      await handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationManager.requestPermission(user?.uid);
    if (granted) {
      setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, enabled: true } }));
      notificationManager.sendLocalNotification('مُنح إذن إشعارات المتصفح', {
        body: 'إعدادات الخطة والتذكير لم تُحفظ بعد.'
      });
    } else {
      alert('لم نتمكن من تفعيل الإشعارات. يرجى التأكد من إعدادات المتصفح.');
    }
  };

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const fortressPlan = {
        ...formData,
        setupDate: new Date().toISOString(),
        isActive: true
      };

      const result = await saveFortressPlanToFirestore(user?.uid, fortressPlan);
      if (result.user) applyConfirmedUser(result);

      if (formData.notifications.enabled) {
        notificationManager.scheduleNotification('تجربة محلية لتذكير الحصون الخمسة 🏰', {
          body: 'هذا اختبار مؤقت على هذا الجهاز، وليس إشعار Push أو جدولة يومية.'
        }, 5000);
      }

      if (onComplete) onComplete();
      else navigate('/dashboard');
      
    } catch (error) {
      console.error('Error saving fortress plan:', error);
      setSaveError(error.message || 'حدث خطأ أثناء حفظ الخطة؛ لم يتغير السجل السابق.');
    }
    setIsSaving(false);
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', direction: 'rtl' }}>
      <Card style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        {saveError && <div role="alert" data-testid="fortress-setup-error">{saveError}</div>}
        
        {/* Progress */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {STEPS.map((step, idx) => (
            <div 
              key={step.id} 
              style={{ 
                flex: 1, 
                height: '6px', 
                borderRadius: '3px', 
                background: idx <= currentStep ? 'var(--primary)' : 'var(--glass-border)',
                transition: 'background 0.3s ease'
              }} 
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StepIcon size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>{STEPS[currentStep].title}</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{STEPS[currentStep].desc}</p>
              </div>
            </div>

            {/* --- Step 1: New Memorization --- */}
            {currentStep === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>من أي سورة ستبدأ الحفظ الجديد؟</label>
                  <input 
                    type="text" 
                    value={formData.newMemorization.startSura}
                    onChange={(e) => setFormData(prev => ({ ...prev, newMemorization: { ...prev.newMemorization, startSura: e.target.value } }))}
                    style={inputStyle}
                    placeholder="مثال: سورة البقرة"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>مقدار الحفظ اليومي:</label>
                  <select 
                    value={formData.newMemorization.dailyTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, newMemorization: { ...prev.newMemorization, dailyTarget: e.target.value } }))}
                    style={inputStyle}
                  >
                    <option>نصف وجه</option>
                    <option>وجه واحد</option>
                    <option>وجهان</option>
                  </select>
                </div>
              </div>
            )}

            {/* --- Step 2: Near Revision --- */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>ما هي الأجزاء/السور التي حفظتها في آخر شهر؟ (المعاهدة)</label>
                  <textarea 
                    value={formData.nearRevision.recentParts}
                    onChange={(e) => setFormData(prev => ({ ...prev, nearRevision: { ...prev.nearRevision, recentParts: e.target.value } }))}
                    style={{ ...inputStyle, minHeight: '100px' }}
                    placeholder="مثال: الجزء 29 والجزء 30. (هذه الأجزاء ستتم مراجعتها بشكل مكثف يومياً أو يوم بعد يوم)."
                  />
                </div>
              </div>
            )}

            {/* --- Step 3: Far Revision --- */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>الأجزاء القديمة التي استقر حفظك لها (المراجعة الكبرى):</label>
                  <textarea 
                    value={formData.farRevision.oldParts}
                    onChange={(e) => setFormData(prev => ({ ...prev, farRevision: { ...prev.farRevision, oldParts: e.target.value } }))}
                    style={{ ...inputStyle, minHeight: '80px' }}
                    placeholder="مثال: من الجزء 1 إلى الجزء 10"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>كم ستراجع منها يومياً؟</label>
                  <select 
                    value={formData.farRevision.dailyTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, farRevision: { ...prev.farRevision, dailyTarget: e.target.value } }))}
                    style={inputStyle}
                  >
                    <option>ربع حزب</option>
                    <option>نصف حزب</option>
                    <option>حزب كامل</option>
                    <option>نصف جزء</option>
                    <option>جزء كامل</option>
                  </select>
                </div>
              </div>
            )}

            {/* --- Step 4: Reading --- */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>من أين ستبدأ ختمة التلاوة؟</label>
                  <input 
                    type="text" 
                    value={formData.reading.startPart}
                    onChange={(e) => setFormData(prev => ({ ...prev, reading: { ...prev.reading, startPart: e.target.value } }))}
                    style={inputStyle}
                    placeholder="مثال: الجزء الأول (الفاتحة والبقرة)"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>مقدار التلاوة اليومي (الحصن الأول):</label>
                  <select 
                    value={formData.reading.dailyTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, reading: { ...prev.reading, dailyTarget: e.target.value } }))}
                    style={inputStyle}
                  >
                    <option>نصف جزء</option>
                    <option>جزء واحد (ينصح به)</option>
                    <option>جزآن</option>
                  </select>
                </div>
              </div>
            )}

            {/* --- Step 5: Notifications --- */}
            {currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', width: '100%' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>تفعيل التنبيهات 🔔</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                    نظام الحصون الخمسة يعتمد على الاستمرارية. سنرسل لك إشعاراً واحداً في الوقت الذي تحدده لتذكيرك بإنجاز حصونك اليومية.
                  </p>
                  
                  {!formData.notifications.enabled ? (
                    <button 
                      onClick={handleEnableNotifications}
                      style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      تفعيل الإشعارات الآن
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      <CheckCircle2 size={20} />
                      <span>تم تفعيل الإشعارات بنجاح!</span>
                    </div>
                  )}
                </div>

                {formData.notifications.enabled && (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>أوقات التذكير المفضلة:</label>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, reminderTimes: [...prev.notifications.reminderTimes, '16:00'] } }))}
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        + إضافة وقت
                      </button>
                    </div>
                    {formData.notifications.reminderTimes.map((time, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input 
                          type="time" 
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...formData.notifications.reminderTimes];
                            newTimes[index] = e.target.value;
                            setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, reminderTimes: newTimes } }));
                          }}
                          style={{...inputStyle, flex: 1}}
                        />
                        {formData.notifications.reminderTimes.length > 1 && (
                          <button 
                            onClick={() => {
                              const newTimes = formData.notifications.reminderTimes.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, notifications: { ...prev.notifications, reminderTimes: newTimes } }));
                            }}
                            style={{ background: 'transparent', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button 
            onClick={handleBack} 
            disabled={currentStep === 0}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--glass-border)', 
              background: 'transparent', 
              color: currentStep === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: currentStep === 0 ? 0.5 : 1
            }}
          >
            <ChevronRight size={16} /> السابق
          </button>

          <button 
            onClick={handleNext} 
            disabled={isSaving}
            style={{ 
              padding: '10px 24px', 
              borderRadius: '8px', 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              fontWeight: 'bold',
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            {currentStep === STEPS.length - 1 ? (isSaving ? 'جاري الحفظ...' : 'حفظ وبدء الحصون') : 'التالي'}
            {currentStep !== STEPS.length - 1 && <ChevronLeft size={16} />}
          </button>
        </div>

      </Card>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--bg-color)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none'
};
