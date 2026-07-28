import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ShieldAlert, Trash2 } from 'lucide-react';

// Simple markdown renderer for bold and line breaks
const renderText = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part === '\n') return <br key={i} />;
    return <span key={i}>{part}</span>;
  });
};

const WELCOME_MSG = {
  id: 'welcome',
  text: 'السلام عليكم ورحمة الله وبركاته! 🌿\n\nأنا معلمك الذكي في "محفظ AI". يمكنني مساعدتك في:\n\n**📖 حفظ القرآن ومراجعته** — خطط ونصائح علمية\n**🔗 المتشابهات اللفظية** — ربط الآيات المتشابهة\n**📚 أحكام التجويد** — شرح المخارج والأحكام\n**🌟 فضائل السور** — من القرآن والسنة الصحيحة\n**💊 علاج النسيان** — أسباب وحلول التثبيت\n\nاسألني عن أي شيء يتعلق بحفظ كتاب الله!',
  sender: 'ai',
};

const AiAssistant = () => {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch AI chat history from backend on mount
  useEffect(() => {
    fetch('/api/ai/chat')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history && data.history.length > 0) {
          setMessages(data.history);
        }
        // If no history, keep welcome message
      })
      .catch(e => {
        console.log('Backend not available, using local mode:', e.message);
        // Keep welcome message - will work in smart fallback mode
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg = { id: Date.now(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      if (data.success && data.history) {
        setMessages(data.history);
      } else if (data.success && data.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'ai' }]);
      }
    } catch (e) {
      // Local smart fallback when server is offline
      console.log('Server offline, using local Islamic knowledge engine');
      setTimeout(() => {
        const aiResponse = getLocalFallback(userText);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: aiResponse,
          sender: 'ai'
        }]);
      }, 800);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch('/api/ai/chat', { method: 'DELETE' });
    } catch (e) {
      console.log('Could not clear server history');
    }
    setMessages([WELCOME_MSG]);
  };

  // Local fallback with basic Islamic knowledge
  const getLocalFallback = (msg) => {
    const m = msg.toLowerCase();
    if (/سلام|مرحب|أهل|هلا/.test(m)) {
      return 'وعليكم السلام ورحمة الله وبركاته! 🌿 أهلاً بك في "محفظ AI". كيف أساعدك في رحلة حفظ القرآن اليوم؟';
    }
    if (/طريقة|أسلوب|كيف أحفظ|خطة/.test(m)) {
      return '**أفضل خطة للحفظ - نظام الحصون الخمسة:**\n\n1. **الورد اليومي** - قراءة جزء نظراً\n2. **التحضير** - قراءة الصفحة 10 مرات قبل الحفظ\n3. **الحفظ الجديد** - صفحة يومياً مع 20-40 تكرار\n4. **المراجعة القريبة** - مراجعة أسبوعية للجديد\n5. **التثبيت البعيد** - مراجعة شهرية للقديم';
    }
    if (/متشابه|تشابه/.test(m)) {
      return '**لحل المتشابهات:**\n\n1. افهم **محور السورة** - الربط بالمعنى أقوى من الصوت\n2. انتبه لـ**السياق** قبل وبعد الآية\n3. ضع **علامة** في مصحفك عند موضع التشابه\n\n**كتب مفيدة:** درة التنزيل للإسكافي، والبرهان في متشابه القرآن للكرماني';
    }
    if (/نسيان|أنسى|تثبيت/.test(m)) {
      return 'قال ﷺ: **"تعاهدوا هذا القرآن، فوالذي نفس محمد بيده، لهو أشد تفلتاً من الإبل في عقلها"** [متفق عليه]\n\n**العلاج:**\n1. استمر ولا تنقطع\n2. كثّر التكرار الصوتي بصوت عالٍ\n3. اقرأ ما حفظت في الصلاة\n4. تجنب المعاصي (قال الشافعي: شكوت إلى وكيعٍ...)';
    }
    if (/تاريخ|اليوم|وقت|ساعة/.test(m)) {
      const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return `📅 **تاريخ اليوم:** ${today}\n\nوفقك الله وجعل يومك عامراً بذكر الله وتلاوة كتاب العزيز! 🌿`;
    }
    if (/فتوى|حرام|حلال/.test(m)) {
      return '⚠️ أنا متخصص في **الحفظ والتدبر** فقط، وليس الإفتاء الشرعي.\n\nللفتاوى الشرعية، يرجى الرجوع لـ:\n- **دار الإفتاء المصرية** dar-alifta.org\n- **إسلام ويب** islamweb.net';
    }
    const defaults = [
      'قال ﷺ: **"خيركم من تعلّم القرآن وعلّمه"** [رواه البخاري] 🌿\n\nهل تريد مساعدة في حفظ أو تجويد أو مراجعة؟',
      'ثبّت الله حفظك! تذكر: **قليل مستمر خير من كثير منقطع**.\n\nكيف تسير خطتك اليوم؟ أخبرني بما تحفظ وسأساعدك.',
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '480px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
      
      {/* Chat Header */}
      <div style={{ padding: '14px 16px', background: 'var(--primary-light)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--primary)' }}>المعلم الذكي للقرآن والتدبر</h3>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>مدعوم بالقرآن والسنة ومصادر موثوقة</p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          title="مسح المحادثة"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Disclaimer Sub-banner */}
      <div style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.08)', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldAlert size={14} style={{ flexShrink: 0 }} />
        <span>مخصص للحفظ والتدبر وتوجيه التعلم — وليس للإفتاء الشرعي.</span>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-color)' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '12px', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender === 'user' ? 'var(--primary)' : 'var(--primary-light)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.sender === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--primary)" />}
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-surface)',
              color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
              border: msg.sender === 'ai' ? '1px solid var(--glass-border)' : 'none',
              fontSize: '14px',
              lineHeight: 1.7,
              borderTopRightRadius: msg.sender === 'user' ? 0 : '14px',
              borderTopLeftRadius: msg.sender === 'ai' ? 0 : '14px',
              direction: 'rtl',
              textAlign: 'right',
              whiteSpace: 'pre-wrap'
            }}>
              {renderText(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="var(--primary)" />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              المعلم يكتب الإجابة...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: '14px', background: 'var(--bg-surface)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="اسأل عن الحفظ أو التجويد أو المتشابهات..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px', direction: 'rtl' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          style={{ width: '42px', height: '42px', borderRadius: '50%', background: input.trim() && !isTyping ? 'var(--primary)' : 'var(--glass-border)', color: 'white', border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
        >
          <Send size={18} style={{ transform: 'rotate(180deg)', marginRight: '2px' }} />
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
