import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ShieldAlert, Trash2, Sparkles, Compass, Shield, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';

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
  text: 'السلام عليكم ورحمة الله وبركاته! 🌿\n\nأنا معلمك الذكي في "محفظ AI". يمكنني مساعدتك في:\n\n**🏰 خطة الحصون الخمسة اليومية** — تحديد أورادك وأوقاتها بالضبط\n**📖 حفظ القرآن وتثبيته** — طريقة التكرار والتحضير الثلاثي\n**🔗 المتشابهات اللفظية** — ربط الآيات المتشابهة\n**📚 أحكام التجويد والوقف** — شرح المخارج والأحكام\n\nاضغط على أي زر سريع بالأسفل أو اسألني مباشرة!',
  sender: 'ai',
};

export const AiAssistant = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const currentPage = (user?.memorizedPagesCount || 0) + 1;
  const currentSurah = getSurahNameForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);

  const userContext = {
    name: user?.name || 'حافظ القرآن',
    currentPage,
    currentSurah,
    currentJuz,
    memorizedPagesCount: user?.memorizedPagesCount || 0,
    fortressesToday: user?.preferences?.fortressesToday || {},
    dailyTarget: user?.preferences?.dailyTarget || 'صفحة واحدة يومياً'
  };

  // Fetch AI chat history from backend on mount or user change
  useEffect(() => {
    fetch(`/api/ai/chat?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history && data.history.length > 0) {
          setMessages(data.history);
        } else {
          setMessages([WELCOME_MSG]);
        }
      })
      .catch(e => {
        console.log('Backend not available, using local mode:', e.message);
      });
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (customText = null) => {
    const userText = (customText || input).trim();
    if (!userText || isTyping) return;

    const userMsg = { id: Date.now(), text: userText, sender: 'user', userId };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, userId, userContext })
      });
      const data = await res.json();
      if (data.success && data.history) {
        setMessages(data.history);
      } else if (data.success && data.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'ai', userId }]);
      }
    } catch (e) {
      console.log('Server offline, using fallback');
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: `أهلاً بك يا ${user?.name || 'حبيب'}! أنت الآن في الصفحة ${currentPage} من سورة ${currentSurah} (الجزء ${currentJuz}). أنصحك اليوم بالتركيز على قراءة الجزء ${currentJuz} نظراً، والتحضير الليلي لصفحة ${currentPage + 1} ومراجعة الصفحات من ${Math.max(1, currentPage - 20)} إلى ${Math.max(1, currentPage - 1)}.`,
          sender: 'ai',
          userId
        }]);
      }, 800);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch(`/api/ai/chat?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
    } catch (e) {
      console.log('Could not clear server history');
    }
    setMessages([WELCOME_MSG]);
  };

  const quickPrompts = [
    { label: '🏰 خطتي الدقيقة في الحصون الخمسة لليوم', query: `أعطني خطتي اليومية الدقيقة بنظام الحصون الخمسة بناءً على موقعي الحالي في الصفحة ${currentPage} من سورة ${currentSurah}` },
    { label: '🎯 ما هو ورد المراجعة القريبة والبعيدة؟', query: `ما هو ورد المراجعة القريبة والمراجعة البعيدة المطلوب مني اليوم بدقة؟` },
    { label: '🌙 كيف أطبق التحضير الليلي الليلة؟', query: `كيف أطبق التحضير الليلي لصفحة الغد (${currentPage + 1}) بطريقة صحيحة قبل النوم؟` },
    { label: '💡 نصيحة تثبيت لسورة ' + currentSurah, query: `أعطني نصائح عملية وضوابط متشابهات لتثبيت سورة ${currentSurah}` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '600px' }}>
      
      {/* Current Position Badge */}
      <div style={{
        padding: '12px 18px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1px solid var(--primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} color="var(--primary)" />
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
            موقعك المعتمد في الخطة: الصفحة {currentPage} من سورة {currentSurah} (الجزء {currentJuz})
          </span>
        </div>
        <span style={{ fontSize: '12px', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '20px', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid var(--glass-border)' }}>
          {user?.memorizedPagesCount || 0} صفحة محفوظة
        </span>
      </div>

      {/* Chat Messages Window */}
      <div style={{
        flex: 1,
        minHeight: '400px',
        maxHeight: '520px',
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
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: isAi ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--primary-light)',
                color: isAi ? 'white' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
                lineHeight: 1.7,
                fontSize: '14.5px',
                boxShadow: isAi ? 'var(--shadow-soft)' : '0 4px 14px rgba(16, 185, 129, 0.25)'
              }}>
                {renderText(m.text)}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} />
            </div>
            <div style={{ padding: '12px 20px', borderRadius: '0 16px 16px 16px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={16} className="animate-spin" color="var(--primary)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>المعلم الذكي يُفصّل خطتك وإجابتك...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
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

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="اسأل المعلم الذكي عن خطتك، أو متى تراجع، أو تفسير آية..."
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
            padding: '14px 22px',
            borderRadius: '14px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isTyping || !input.trim() ? 0.6 : 1,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
          }}
        >
          <Send size={16} />
          إرسال
        </button>

        <button
          type="button"
          onClick={handleClearChat}
          title="مسح المحادثة"
          style={{
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
