import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Trash2, 
  Sparkles, 
  Compass, 
  Key, 
  Settings, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Volume2, 
  Shield, 
  AlertCircle, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';
import { generateQuranAiResponse } from '../utils/quranAiEngine';

// Markdown renderer for bold, code, and line breaks
const renderText = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part === '\n') return <br key={i} />;
    return <span key={i}>{part}</span>;
  });
};

const WELCOME_MSG = {
  id: 'welcome',
  text: 'السلام عليكم ورحمة الله وبركاته! 🌿\n\nأنا **معلمك القرآني الذكي** في "محفظ AI". أنا متصل ومدرك لموقعك الدقيق في المصحف ونمط حفظك الدماغي.\n\nيمكنني مساعدتك في:\n\n**🏰 خطة الحصون الخمسة اليومية** — حساب أورادك وأوقاتها بدقة لليوم\n**📖 حفظ القرآن وإتقان التكرار** — قاعدة الـ 20 والـ 40 لتثبيت الآيات كالفاتحة\n**🔗 ضبط المتشابهات اللفظية** — الربط الموضوعي وفك تشابه الفواصل\n**🎧 استغلال نمط حفظك** — توجيهات خاصة لذاكرتك (السمعية أو البصرية)\n**📚 أحكام التجويد ومخارج الحروف** — تلاوة الورد بالحدر المتقن دون إسقاط للأحكام\n\nاختر أي سؤال سريع بالأسفل أو اسألني أي سؤال مباشرة!',
  sender: 'ai',
};

export const AiAssistant = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Gemini API Key Modal & State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('ma7fath_gemini_api_key') || '') : '';
  });
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState('');

  const currentPage = (user?.memorizedPagesCount || 0) + 1;
  const currentSurah = getSurahNameForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);
  const learningStyle = user?.preferences?.learningStyle || 'سمعي بصري (مختلط)';

  const userContext = {
    name: user?.name || 'حافظ القرآن',
    currentPage,
    currentSurah,
    currentJuz,
    memorizedPagesCount: user?.memorizedPagesCount || 0,
    learningStyle,
    fortressesToday: user?.preferences?.fortressesToday || {},
    dailyTarget: user?.preferences?.dailyTarget || 'صفحة واحدة يومياً',
    apiKey
  };

  // Load chat history from backend or localStorage
  useEffect(() => {
    const localKey = `ma7fath_chat_history_${userId}`;
    const localSaved = localStorage.getItem(localKey);
    let initialLoaded = false;

    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          initialLoaded = true;
        }
      } catch (e) {}
    }

    fetch(`/api/ai/chat?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history && data.history.length > 0) {
          setMessages(data.history);
          localStorage.setItem(localKey, JSON.stringify(data.history));
        } else if (!initialLoaded) {
          setMessages([WELCOME_MSG]);
        }
      })
      .catch(e => {
        console.log('Backend sync offline, loaded from local storage.');
        if (!initialLoaded) {
          setMessages([WELCOME_MSG]);
        }
      });
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('ma7fath_gemini_api_key', trimmed);
      setKeySaveMessage('تم حفظ وتفعيل مفتاح Gemini بنجاح! ✨');
    } else {
      localStorage.removeItem('ma7fath_gemini_api_key');
      setKeySaveMessage('تم إزالة المفتاح والاعتماد على محرك محفظ AI الداخلي.');
    }
    setTimeout(() => {
      setKeySaveMessage('');
      setShowKeyModal(false);
    }, 1500);
  };

  const handleSend = async (customText = null) => {
    const userText = (customText || input).trim();
    if (!userText || isTyping) return;

    const userMsg = { id: Date.now(), text: userText, sender: 'user', userId };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    const localKey = `ma7fath_chat_history_${userId}`;
    localStorage.setItem(localKey, JSON.stringify(updatedMessages));

    let aiReplyText = '';

    // Attempt 1: Call Backend with client key support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText, 
          userId, 
          userContext,
          apiKey: apiKey || undefined
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.reply && data.reply.trim()) {
        aiReplyText = data.reply.trim();
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.log('Server unreachable or timeout, generating dynamic response locally:', fetchErr.message);
    }

    // Attempt 2: If server didn't respond or returned empty, use Advanced Quran AI Engine
    if (!aiReplyText) {
      try {
        aiReplyText = await generateQuranAiResponse(userText, userContext);
      } catch (engineErr) {
        console.error('Local Quran AI Engine error:', engineErr);
        aiReplyText = `🌿 بارك الله فيك يا ${userContext.name}! بالنسبة لسؤالك، وأنت في الصفحة ${currentPage} من سورة ${currentSurah}، استمر في ورد الحصون الخمسة مع التكرار المتقن، وستجد ثمرة التثبيت سريعاً بإذن الله.`;
      }
    }

    const aiMsg = { id: Date.now() + 1, text: aiReplyText, sender: 'ai', userId };
    const finalMessages = [...updatedMessages, aiMsg];
    setMessages(finalMessages);
    localStorage.setItem(localKey, JSON.stringify(finalMessages));
    setIsTyping(false);
  };

  const handleClearChat = async () => {
    const localKey = `ma7fath_chat_history_${userId}`;
    localStorage.removeItem(localKey);
    try {
      await fetch(`/api/ai/chat?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
    } catch (e) {}
    setMessages([WELCOME_MSG]);
  };

  const quickPrompts = [
    { 
      label: '🏰 خطتي الدقيقة في الحصون الخمسة لليوم', 
      query: `أعطني خطتي اليومية الدقيقة بنظام الحصون الخمسة بناءً على موقعي الحالي في الصفحة ${currentPage} من سورة ${currentSurah} ونمطي (${learningStyle})` 
    },
    { 
      label: `🎧 كيف أستغل نمطي (${learningStyle}) في الحفظ؟`, 
      query: `بما أن نمط حفظي هو (${learningStyle})، كيف أستغله بأقصى فاعلية في تثبيت الصفحة ${currentPage} من سورة ${currentSurah}؟` 
    },
    { 
      label: `🔍 ضوابط ومتشابهات سورة ${currentSurah}`, 
      query: `أعطني أهم ضوابط المتشابهات ومحاور سورة ${currentSurah} لتثبيتها وعدم الخلط بين آياتها.` 
    },
    { 
      label: `🔁 سر التكرار الـ 20 والـ 40 لصفحة ${currentPage}`, 
      query: `اشرح لي بالتفصيل كيف أطبق قاعدة التكرار 20 مرة للآية و40 مرة للصفحة ${currentPage} لإتقانها كالفاتحة.` 
    },
    { 
      label: '🌿 علاج النسيان وتفلت الحفظ', 
      query: `أعاني أحياناً من تفلت الحفظ ونسيان الآيات السابقة، ما هو العلاج العملي وفق منهجية الحصون الخمسة؟` 
    },
    { 
      label: '✨ تنبيهات تجويدية لقراءة الحدر', 
      query: `كيف أقرأ ورد الاستماع والمراجعة بالحدر السريع في 20 دقيقة مع المحافظة التامة على أحكام التجويد ومخارج الحروف؟` 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '620px', position: 'relative' }}>
      
      {/* Top Header Controls Bar */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1px solid var(--primary-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* User Quran Location & Learning Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--primary)" />
            <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              الصفحة {currentPage} • سورة {currentSurah} (الجزء {currentJuz})
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <Volume2 size={13} color="var(--primary)" />
            <span>نمط الدماغ: <strong style={{ color: 'var(--primary)' }}>{learningStyle}</strong></span>
          </div>
        </div>

        {/* Right Side: AI Engine Key & Clear Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* AI Status / Key Toggle Button */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: apiKey ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
              border: `1px solid ${apiKey ? 'var(--primary)' : 'var(--glass-border)'}`,
              color: apiKey ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="إعدادات مفتاح Gemini AI الذكي"
          >
            <Key size={13} color={apiKey ? 'var(--primary)' : 'var(--text-secondary)'} />
            <span>{apiKey ? '🟢 Gemini Live مفعل' : '⚡ محرك ذكي داخلي'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            title="مسح المحادثة بالكامل"
            style={{
              padding: '7px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Chat Messages Window */}
      <div style={{
        flex: 1,
        minHeight: '260px',
        maxHeight: 'clamp(280px, 46vh, 480px)',
        overflowY: 'auto',
        padding: '20px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((m, idx) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id || idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isAi ? 'row' : 'row-reverse'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: isAi ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--primary-light)',
                color: isAi ? 'white' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isAi ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none'
              }}>
                {isAi ? <Bot size={20} /> : <User size={20} />}
              </div>

              <div style={{
                maxWidth: '85%',
                padding: '16px 20px',
                borderRadius: isAi ? '0px 20px 20px 20px' : '20px 0px 20px 20px',
                background: isAi ? 'var(--bg-color)' : 'var(--primary)',
                color: isAi ? 'var(--text-primary)' : 'white',
                border: isAi ? '1px solid var(--glass-border)' : 'none',
                lineHeight: 1.8,
                fontSize: '14.5px',
                boxShadow: isAi ? 'var(--shadow-soft)' : '0 4px 14px rgba(16, 185, 129, 0.25)',
                wordBreak: 'break-word'
              }}>
                {renderText(m.text)}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} />
            </div>
            <div style={{ padding: '12px 20px', borderRadius: '0 16px 16px 16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={16} className="animate-spin" color="var(--primary)" />
              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>المعلم القرآني الذكي يُفصّل إجابتك الآن...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Interactive Prompt Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'thin'
      }}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(qp.query)}
            disabled={isTyping}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: isTyping ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={13} color="var(--primary)" />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="اسأل المعلم الذكي عن خطتك، المتشابهات، جدول التكرار، أو أي استفسار..."
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '14.5px',
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isTyping || !input.trim()}
          style={{
            padding: '14px 24px',
            borderRadius: '14px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14.5px',
            cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isTyping || !input.trim() ? 0.6 : 1,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={16} />
          إرسال
        </button>
      </div>

      {/* GEMINI API KEY CONFIGURATION MODAL */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--primary-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative'
          }}>
            {/* Close Modal */}
            <button
              onClick={() => setShowKeyModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Key size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  إعدادات الذكاء الاصطناعي (Gemini AI)
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  احصل على إجابات غير محدودة ومتطورة مباشرة من Google AI
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
              يتميز تطبيق "محفظ AI" بمحرك قرآني داخلي ذكي مدمج يعمل تلقائياً. إذا أردت تفعيل قدرات نموذج <strong>Gemini 2.5 Flash</strong> الكاملة والإجابات المباشرة، يمكنك إدخال مفتاحك المجاني من Google:
            </p>

            {/* Input with Show/Hide toggle */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input
                type={showKeySecret ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="ألصق مفتاح Gemini هنا (AIzaSy...)"
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowKeySecret(!showKeySecret)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showKeySecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Free key link */}
            <div style={{ marginBottom: '20px' }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <ExternalLink size={13} />
                اضغط هنا للحصول على مفتاح Gemini مجاني فوراً من Google AI Studio
              </a>
            </div>

            {keySaveMessage && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {keySaveMessage}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setKeyInput('');
                  localStorage.removeItem('ma7fath_gemini_api_key');
                  setApiKey('');
                  setKeySaveMessage('تم مسح المفتاح بنجاح.');
                  setTimeout(() => setKeySaveMessage(''), 1500);
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                مسح المفتاح
              </button>

              <button
                type="button"
                onClick={handleSaveApiKey}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Check size={16} />
                حفظ المفتاح وتفعيله
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AiAssistant;
