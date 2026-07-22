import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ShieldAlert } from 'lucide-react';

const AiAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch AI chat history from database on mount
  useEffect(() => {
    fetch('/api/ai/chat')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          setMessages(data.history);
        }
      })
      .catch(e => console.error('Failed to load chat history:', e));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      const data = await res.json();
      if (data.success && data.history) {
        setMessages(data.history);
      }
    } catch (e) {
      console.error('Failed to sync message with backend:', e);
      // Fallback local response simulation
      setTimeout(() => {
        let aiResponseText = 'بارك الله فيك ونفع بك! بناءً على جدولك وتوجيهات الحصون الخمسة، أنصحك بمراجعة سورة البقرة صفحة 12 وتلاوتها في صلاة النوافل اليوم لتثبيتها في قلبك. هل ترغب في بدء تمرين التسميع الآن؟';

        if (userMsg.text.includes('فتوى') || userMsg.text.includes('حرام') || userMsg.text.includes('حلال')) {
          aiResponseText = 'أيها الأخ المبارك، أنا هنا لإعانتك في الحفظ والتدبر وتثبيت التلاوة. بالنسبة للمسائل الفقهية والشرعية الشخصية، يُرجع فيها لأهل العلم والمفتين المعتمدين.';
        } else if (userMsg.text.includes('متشابهات') || userMsg.text.includes('تشابه')) {
          aiResponseText = 'في متشابهات الآيات: استحضر معنى السورة ومحورها العام، فإن التدبر في المعاني هو أعظم مفتاح لربط الآيات المتشابهة وعدم الخلط بينها.';
        }

        setMessages(prev => [...prev, {
          id: Date.now(),
          text: aiResponseText,
          sender: 'ai'
        }]);
      }, 1500);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '420px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
      
      {/* Chat Header */}
      <div style={{ padding: '14px 16px', background: 'var(--primary-light)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--primary)' }}>المعلم الذكي للقرآن والتدبر</h3>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>متصل • يُعينك على صحبة كتاب الله</p>
          </div>
        </div>
      </div>

      {/* Disclaimer Sub-banner */}
      <div style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.08)', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldAlert size={14} style={{ flexShrink: 0 }} />
        <span>مخصص للحفظ والتدبر وتوجيه التعلم (وليس للإفتاء الشرعي).</span>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-color)' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '12px', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender === 'user' ? 'var(--bg-surface)' : 'var(--primary-light)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.sender === 'user' ? <User size={16} color="var(--text-secondary)" /> : <Bot size={16} color="var(--primary)" />}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '14px', background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-surface)', color: msg.sender === 'user' ? 'white' : 'var(--text-primary)', border: msg.sender === 'ai' ? '1px solid var(--glass-border)' : 'none', fontSize: '14px', lineHeight: 1.6, borderTopRightRadius: msg.sender === 'user' ? 0 : '14px', borderTopLeftRadius: msg.sender === 'ai' ? 0 : '14px' }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="var(--primary)" />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
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
          placeholder="اسأل المعلم عن التثبيت والتدبر..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontSize: '14px' }}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          style={{ width: '42px', height: '42px', borderRadius: '50%', background: input.trim() && !isTyping ? 'var(--primary)' : 'var(--glass-border)', color: 'white', border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
        >
          <Send size={18} style={{ transform: 'rotate(180deg)', marginRight: '2px' }} />
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
