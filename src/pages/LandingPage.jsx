import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Shield, BrainCircuit, Users, BookOpen, Clock, Activity, CheckCircle, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, loginWithTestAccount, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [activeShowcase, setActiveShowcase] = useState('quran-map');
  const navigate = useNavigate();

  const openAuthModal = (mode = 'login') => {
    if (user) {
      navigate('/dashboard');
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
    }
  };

  const handleTestAccountAction = async () => {
    await loginWithTestAccount();
    navigate('/dashboard');
  };

  return (
    <div className="landing-page" style={{ position: 'relative', zIndex: 1 }}>
      
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, width: '100%', zIndex: 100, padding: '16px 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container flex-between">
          <Logo size={42} />
          <div className="nav-links flex-center" style={{ gap: '32px' }}>
            <a href="#features" style={{ color: 'var(--text-secondary)', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>المميزات</a>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>كيف نعمل</a>
            <button onClick={toggleTheme} style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', borderRadius: '8px' }}>
                  لوحة القيادة
                </Button>
                <Button variant="outline" onClick={logout} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #EF4444', color: '#EF4444' }}>
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="outline" onClick={() => openAuthModal('login')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  تسجيل الدخول
                </Button>
                <Button variant="primary" onClick={() => openAuthModal('signup')} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                  إنشاء حساب مجاناً
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal Component */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />

      {/* Hero Section */}
      <section className="hero" style={{ padding: '80px 0', background: 'var(--bg-color)', overflow: 'hidden' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            
            {/* Hero Text */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
                تطبيق الحفظ الرائد عالمياً
              </div>
              
              <h1 style={{ fontSize: '56px', lineHeight: 1.2, marginBottom: '20px', color: 'var(--text-primary)' }}>
                احفظ القرآن بطريقة <br/>
                <span className="text-gradient">تتصل بعقلك.</span>
              </h1>

              {/* Spiritual Dedication Quote Box */}
              <div style={{
                padding: '14px 20px',
                borderRadius: '16px',
                background: 'var(--primary-light)',
                borderRight: '4px solid var(--primary)',
                marginBottom: '28px',
                maxWidth: '520px'
              }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'serif' }}>
                  « مَا كَانَ لِلَّهِ يَبْقَى وَمَا كَانَ لِغَيْرِهِ يَنْدَثِرُ ، اللَّهُمَّ تَقَبَّلْ » 🌿
                </p>
              </div>
              
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '520px', lineHeight: 1.6 }}>
                يستخدم محفظ الكتروني الذكاء الاصطناعي لمساعدتك على التواصل مع القرآن، بناء خطة حفظ شخصية، واكتشاف أخطائك أثناء التلاوة.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {user ? (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button variant="primary" onClick={() => navigate('/dashboard')} icon={ArrowLeft} style={{ padding: '16px 28px', fontSize: '16px', borderRadius: '12px' }}>
                      الذهاب للوحة القيادة
                    </Button>
                    <Button variant="outline" onClick={logout} style={{ padding: '16px 24px', fontSize: '16px', borderRadius: '12px', border: '1px solid #EF4444', color: '#EF4444' }}>
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="primary" onClick={() => openAuthModal('signup')} icon={ArrowLeft} style={{ padding: '16px 28px', fontSize: '16px', borderRadius: '12px' }}>
                      إنشاء حساب جديد 🚀
                    </Button>
                    <Button variant="outline" onClick={() => openAuthModal('login')} style={{ padding: '16px 28px', fontSize: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      تسجيل الدخول
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={handleTestAccountAction} style={{ padding: '16px 28px', fontSize: '16px', borderRadius: '12px', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                  ⚡ دخول سريع بالحساب التجريبي
                </Button>
              </div>
            </motion.div>

            {/* Mockup Preview with Holy Quran Image and AI overlays */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ position: 'relative' }}
            >
              {/* Main Quran Card */}
              <div className="glass-card" style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                <img 
                  src="/quran_holy_book.jpg" 
                  alt="مصحف شريف ذكي" 
                  style={{ width: '100%', height: 'auto', borderRadius: '18px', display: 'block', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} 
                />
                
                {/* Floating AI Stat 1: Memory Score */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    background: 'rgba(10, 14, 26, 0.75)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '12px 18px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <BrainCircuit size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>مؤشر الذاكرة الذكي</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold' }}>94% <span style={{ fontSize: '11px', color: '#10B981' }}>ممتاز</span></span>
                  </div>
                </motion.div>

                {/* Floating AI Stat 2: Daily Progress */}
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    background: 'rgba(10, 14, 26, 0.75)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '12px 18px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>إنجاز خطة اليوم</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold' }}>75% مكتمل</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section style={{ padding: '60px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div className="grid-cols-4" style={{ textAlign: 'center' }}>
            {[
              { label: 'طالب وطالبة', value: '+50,000' },
              { label: 'صفحة محفوظة', value: '+2M' },
              { label: 'اختبارات منجزة', value: '+500K' },
              { label: 'نسبة التزام', value: '94%' }
            ].map((stat, i) => (
              <div key={i}>
                <h2 style={{ fontSize: '40px', color: 'var(--primary)', marginBottom: '8px' }}>{stat.value}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Screenshots Showcase Gallery */}
      <section id="showcase" style={{ padding: '100px 0', background: 'var(--bg-color)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
              📸 تجربة واقعية وحقيقية
            </div>
            <h2 style={{ fontSize: '40px', marginBottom: '16px', color: 'var(--text-primary)' }}>
              شاهد تطبيق <span className="text-gradient">محفظ AI</span> في العمل
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
              نأخذك في جولة سريعة داخل صفحات التطبيق الحقيقية لتشاهد الواجهات المصممة لتسهيل رحلة الحفظ.
            </p>
          </div>

          {/* Gallery Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
            {[
              { id: 'quran-map', label: '🗺️ خريطة المصحف التفاعلية', img: '/quran_map_preview.png' },
              { id: 'recitation', label: '🗣️ التسميع ومقياس الحفظ', img: '/voice_recitation_preview.png' },
              { id: 'mind-maps', label: '🌲 الخرائط الذهنية الموضوعية', img: '/mind_maps_preview.png' },
              { id: 'fortresses', label: '📊 الحصون الخمسة والتحفيز', img: '/five_fortresses_preview.png' },
              { id: 'admin', label: '⚙️ لوحة الإدارة والتحليلات', img: '/admin_analytics_preview.png' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveShowcase(tab.id)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: activeShowcase === tab.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: activeShowcase === tab.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                  color: activeShowcase === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Screenshot Display Frame */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '1000px',
              padding: '12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: 'var(--bg-color)', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                aspectRatio: '16/9'
              }}>
                {[
                  { id: 'quran-map', img: '/quran_map_preview.png', alt: 'خريطة المصحف التفاعلية' },
                  { id: 'recitation', img: '/voice_recitation_preview.png', alt: 'لوحة التسميع ومقياس الحفظ' },
                  { id: 'mind-maps', img: '/mind_maps_preview.png', alt: 'الخرائط الذهنية الموضوعية' },
                  { id: 'fortresses', img: '/five_fortresses_preview.png', alt: 'منظومة الحصون الخمسة والتحفيز' },
                  { id: 'admin', img: '/admin_analytics_preview.png', alt: 'لوحة الإدارة والتحليلات' }
                ].map((item) => (
                  <motion.img
                    key={item.id}
                    src={item.img}
                    alt={item.alt}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: activeShowcase === item.id ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: activeShowcase === item.id ? 'block' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '100px 0', background: 'var(--bg-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', marginBottom: '16px', color: 'var(--text-primary)' }}>لماذا <span className="text-gradient">محفظ الكتروني؟</span></h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              أدوات متطورة ومدعومة بالذكاء الاصطناعي تجعل رحلة حفظك للقرآن أكثر متعة وفعالية وتخصيصاً.
            </p>
          </div>

          <div className="grid-cols-3">
            {[
              { icon: BrainCircuit, title: 'خطة ذكية', desc: 'يقوم الذكاء الاصطناعي بتصميم خطة حفظ ومراجعة تناسب وقتك وقدراتك بدقة.' },
              { icon: Shield, title: 'حصون الحفظ', desc: 'نظام المراجعة المتباعدة (Spaced Repetition) لضمان عدم النسيان أبداً.' },
              { icon: Clock, title: 'مراجعة تلقائية', desc: 'جدولة ذكية للمراجعات اليومية بناءً على أدائك في الاختبارات السابقة.' },
              { icon: BookOpen, title: 'المتشابهات', desc: 'كشف المتشابهات وتوضيح الفروق بينها لتجنب الخلط أثناء الحفظ.' },
              { icon: Activity, title: 'تحليل الصوت', desc: 'استمع لتلاوتك وسيقوم النظام بتصحيح الأخطاء اللفظية بدقة عالية.' },
              { icon: Users, title: 'مجتمع الحفاظ', desc: 'شارك إنجازاتك، اطرح أسئلتك، وكن جزءاً من مجتمع يحفزك دائماً.' }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card style={{ textAlign: 'center', height: '100%' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <feature.icon size={32} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--text-primary)' }}>{feature.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ padding: '40px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ fontSize: '18px', fontFamily: 'serif', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>
            « مَا كَانَ لِلَّهِ يَبْقَى وَمَا كَانَ لِغَيْرِهِ يَنْدَثِرُ ، اللَّهُمَّ تَقَبَّلْ » 🌿
          </p>
          <div className="flex-between" style={{ width: '100%', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>محفظ الكتروني 🚀</div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>© {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
