import React, { useState } from 'react';
import { 
  Trophy, 
  MessageSquare, 
  EyeOff, 
  Send, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  UserCheck, 
  Flame, 
  Tag, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Community = () => {
  const [activeSubTab, setActiveSubTab] = useState('posts'); // 'posts' | 'leaderboard'
  const { user } = useAuth();

  // New Post Form State
  const [postText, setPostText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('تدبر');

  // Comment input state per post
  const [commentInputs, setCommentInputs] = useState({});

  // Real Posts State
  const [posts, setPosts] = useState([]);

  // Fetch posts from Express API on mount
  React.useEffect(() => {
    fetch('/api/community/posts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.posts) {
          setPosts(data.posts);
        }
      })
  }, []);

  // Handle Post Submission to API
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const postPayload = {
      author: isAnonymous ? 'هوية مخفية' : (user?.name || 'أحمد محمد'),
      avatar: isAnonymous ? null : (user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'),
      isAnonymous: isAnonymous,
      category: selectedCategory,
      content: postText.trim()
    };

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }

    setPostText('');
    setIsAnonymous(false);
  };

  // Toggle Like API
  const handleToggleLike = async (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    try {
      await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
    } catch (e) {
      console.log(e);
    }
  };

  // Add Comment/Answer API
  const handleAddAnswer = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/community/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: user?.name || 'أحمد محمد', text: text.trim() })
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts(posts.map(p => p.id === postId ? data.post : p));
      }
    } catch (e) {
      console.log(e);
    }

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub Tab Switcher */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        background: 'var(--bg-surface)', 
        padding: '6px', 
        borderRadius: '16px', 
        border: '1px solid var(--glass-border)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveSubTab('posts')}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            background: activeSubTab === 'posts' ? 'var(--primary)' : 'transparent',
            color: activeSubTab === 'posts' ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageSquare size={18} />
          قسم الأسئلة والتدبر (البوستات)
        </button>

        <button
          onClick={() => setActiveSubTab('leaderboard')}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            background: activeSubTab === 'leaderboard' ? 'var(--primary)' : 'transparent',
            color: activeSubTab === 'leaderboard' ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Trophy size={18} />
          قسم الالتزام والتنافس
        </button>
      </div>

      {/* Sub Tab Content: 1. POSTS & REFLECTIONS */}
      {activeSubTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Create Post Card */}
          <div style={{ 
            padding: '24px', 
            borderRadius: '20px', 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--primary)" />
              شارِك تدبراً أو اسأل سؤالاً حول الحفظ والمتشابهات
            </h3>

            <form onSubmit={handleCreatePost}>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="اكتب فكرة، فائدة تدبرية، أو استفساراً في الحفظ والتجويد..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
              />

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Categories & Anonymous Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Category Pills */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['تدبر', 'متشابهات', 'تجويد', 'نصيحة'].map((cat) => (
                      <span
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          background: selectedCategory === cat ? 'var(--primary-light)' : 'var(--bg-color)',
                          color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                          border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--glass-border)'}`
                        }}
                      >
                        #{cat}
                      </span>
                    ))}
                  </div>

                  {/* Anonymous Switch Toggle */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer', 
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isAnonymous ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-color)',
                    border: `1px solid ${isAnonymous ? '#EF4444' : 'var(--glass-border)'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={isAnonymous} 
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <EyeOff size={16} color={isAnonymous ? '#EF4444' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: isAnonymous ? '#EF4444' : 'var(--text-secondary)' }}>
                      {isAnonymous ? 'نشر بهوية مخفية 🎭' : 'إظهار الهوية'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!postText.trim()}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    background: postText.trim() ? 'var(--primary)' : 'var(--glass-border)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: postText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={16} style={{ transform: 'rotate(180deg)' }} />
                  نشر المشاركة
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post) => (
              <div 
                key={post.id}
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                {/* Author Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {post.isAnonymous ? (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#334155',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        🎭
                      </div>
                    ) : (
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        border: '1px solid var(--primary)'
                      }}>
                        {post.author ? post.author.charAt(0) : 'ح'}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                          {post.author}
                        </h4>
                        {post.isAnonymous && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 'bold' }}>
                            مخفي
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{post.timeAgo}</span>
                    </div>
                  </div>

                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>
                    #{post.category}
                  </span>
                </div>

                {/* Content */}
                <p style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.7, margin: '0 0 16px 0' }}>
                  {post.content}
                </p>

                {/* Action Buttons (Likes & Answers) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: post.isLiked ? '#EF4444' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} color={post.isLiked ? '#EF4444' : 'currentColor'} />
                    <span>{post.likes} إعجاب</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '14px' }}>
                    <MessageCircle size={18} />
                    <span>{post.answers.length} إجابة وتدبر</span>
                  </div>
                </div>

                {/* Answers / Comments Section */}
                {post.answers.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {post.answers.map((ans) => (
                      <div key={ans.id} style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', fontSize: '14px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                          {ans.author}:
                        </span>
                        <span style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {ans.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Answer Input */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAnswer(post.id)}
                    placeholder="اكتب إجابة أو مشاركة..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => handleAddAnswer(post.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    رد
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Sub Tab Content: 2. LEADERBOARD & COMMITMENT */}
      {activeSubTab === 'leaderboard' && (
        <div style={{ 
          padding: '32px', 
          borderRadius: '20px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>🏆 قسم الالتزام وتنافس الحفاظ</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>تدرج الحفاظ حسب الأيام المتتالية (Streak) ومؤشر الإتقان اليومي.</p>

          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { rank: 1, name: 'عبد الرحمن السالم', points: '14,250 XP', streak: '120 يوم', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdelrahman' },
              { rank: 2, name: 'فاطمة الزهراء', points: '12,800 XP', streak: '95 يوم', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima' },
              { rank: 3, name: 'عمر الفاروق', points: '11,400 XP', streak: '80 يوم', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar' },
              { rank: 4, name: user?.name || 'أحمد محمد', points: '2,450 XP', streak: '14 يوم', avatar: user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad', isUser: true },
            ].map((member) => (
              <div 
                key={member.rank} 
                style={{ 
                  padding: '16px 24px', 
                  borderRadius: '16px', 
                  background: member.isUser ? 'var(--primary-light)' : 'var(--bg-color)', 
                  border: `1px solid ${member.isUser ? 'var(--primary)' : 'var(--glass-border)'}`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', width: '28px', color: member.rank <= 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>#{member.rank}</span>
                  <img src={member.avatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-surface)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{member.name} {member.isUser && '(أنت)'}</h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>الاستمرار: {member.streak} 🔥</span>
                  </div>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{member.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
