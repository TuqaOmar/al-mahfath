import { declaredPages, nextDeclaredPage } from '../lib/memorization';
import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Compass,
  Shield,
  BookOpen,
  Share2,
  ArrowRight,
  Pin,
  Cloud,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/api';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';

export const Community = ({ setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = useState('posts'); // 'posts' | 'leaderboard'
  const { user, activeRole } = useAuth();

  const currentPage = nextDeclaredPage(user);
  const currentSurah = getSurahNameForPage(currentPage);
  const currentJuz = getJuzForPage(currentPage);
  const fortressesToday = user?.preferences?.fortressesToday || {};
  const doneFortressesCount = Object.values(fortressesToday).filter(Boolean).length;

  // New Post Form State
  const [postText, setPostText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('تثبيت وتدبر');
  const [dbStatus, setDbStatus] = useState('connected'); // 'connected' | 'syncing'
  const [postFeedback, setPostFeedback] = useState(null);

  // Comment input state per post
  const [commentInputs, setCommentInputs] = useState({});

  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const formatPostTime = value => {
    const date = new Date(value || '');
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ar-JO');
  };

  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const res = await fetchWithAuth('/api/community/posts');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'تعذر تحميل المنشورات');
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setPostFeedback(null);
      } catch (err) {
        setPosts([]);
        setPostFeedback(err.message || 'تعذر تحميل المنشورات');
      }
    };
    loadFromApi();
  }, [user?.uid]);

  // Leaderboard: loaded each time the tab opens so XP/streak are current.
  const [leaderboard, setLeaderboard] = useState({ status: 'idle', leaders: [], me: null });
  useEffect(() => {
    if (activeSubTab !== 'leaderboard' || !user?.uid) return undefined;
    let cancelled = false;
    setLeaderboard(prev => ({ ...prev, status: 'loading' }));
    (async () => {
      try {
        const res = await fetchWithAuth('/api/community/leaderboard');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        if (!cancelled) setLeaderboard({ status: 'ready', leaders: data.leaders || [], me: data.me || null });
      } catch {
        if (!cancelled) setLeaderboard({ status: 'error', leaders: [], me: null });
      }
    })();
    return () => { cancelled = true; };
  }, [activeSubTab, user?.uid]);

  // Handle Post Submission to Database
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    setDbStatus('syncing');
    const postPayload = {
      isAnonymous,
      category: selectedCategory,
      content: postText.trim()
    };
    try {
      const res = await fetchWithAuth('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر نشر المشاركة');
      setPosts(prev => [data.post, ...prev]);
      setPostText('');
      setIsAnonymous(false);
      setPostFeedback('تم نشر المشاركة وحفظها في Firestore');
    } catch (error) {
      setPostFeedback(error.message || 'تعذر نشر المشاركة');
    } finally {
      setDbStatus('connected');
    }
  };

  const handleDeletePost = async (post) => {
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر حذف المنشور');
      setPosts(prev => prev.filter(item => item.id !== post.id));
      setPostFeedback('تم حذف المنشور');
    } catch (error) {
      setPostFeedback(error.message || 'تعذر حذف المنشور');
    }
  };

  const handleUpdatePost = async (post) => {
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingText, category: post.category })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر تعديل المنشور');
      setPosts(prev => prev.map(item => item.id === post.id ? data.post : item));
      setEditingPostId(null);
      setEditingText('');
      setPostFeedback('تم تعديل المنشور');
    } catch (error) { setPostFeedback(error.message || 'تعذر تعديل المنشور'); }
  };

  // Toggle Like API & Firestore
  const handleToggleLike = async (post) => {
    const postId = post.id;
    try {
      const res = await fetchWithAuth(`/api/community/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر تحديث الإعجاب');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes, isLiked: data.liked } : p));
    } catch (error) { setPostFeedback(error.message || 'تعذر تحديث الإعجاب'); }
  };

  // Add Comment/Answer API & Firestore
  const handleAddAnswer = async (post) => {
    const postId = post.id;
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setDbStatus('syncing');
    try {
      const res = await fetchWithAuth(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر إضافة التعليق');
      setPosts(prev => prev.map(p => p.id === postId ? data.post : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) { setPostFeedback(error.message || 'تعذر إضافة التعليق'); }
    finally { setDbStatus('connected'); }
  };

  const handleShareMilestone = async () => {
    setDbStatus('syncing');
    const defaultShareText = `🌿 بفضل الله وتوفيقه، وصلت في خطة الحفظ إلى الصفحة ${currentPage} من سورة ${currentSurah} (الجزء ${currentJuz}).\n🏰 أنجزت اليوم ${doneFortressesCount} من أصل 5 حصون في نظام الحصون الخمسة! نسأل الله العظيم الثبات والبركة لجميع الإخوة الحفاظ 🤲✨`;
    
    const postPayload = {
      isAnonymous: false,
      category: 'إنجاز الحصون',
      content: defaultShareText
    };

    try {
      const res = await fetchWithAuth('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر نشر الإنجاز');
      setPosts(prev => [data.post, ...prev]);
      setPostFeedback('تم نشر الإنجاز');
    } catch (error) { setPostFeedback(error.message || 'تعذر نشر الإنجاز'); }
    finally { setDbStatus('connected'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 🌟 User Milestone & Five-Fortresses Status Banner */}
      <div style={{
        padding: '24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
        color: 'white',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  مجتمع حفاظ القرآن الكريم 👥
                </h2>
                <span style={{ fontSize: '11px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cloud size={13} />
                  مربوط بقاعدة البيانات و Firestore
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#94A3B8' }}>
                أنت الآن عند: <strong style={{ color: '#34D399' }}>الصفحة {currentPage}</strong> من <strong style={{ color: '#34D399' }}>سورة {currentSurah}</strong> (الجزء {currentJuz}) — أتممت {declaredPages(user).length} صفحة مصرّح بها ذاتيًا، وليست حفظًا معتمدًا.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleShareMilestone}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Share2 size={16} />
              مشاركة إنجازي في المجتمع 🚀
            </button>

            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('five-fortresses')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Shield size={16} />
                خطة الحصون الخمسة
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Mini 3-point Fortress Progress Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} color="#38BDF8" />
            <div style={{ fontSize: '12.5px' }}>
              <span style={{ color: '#94A3B8', display: 'block' }}>ورد قراءة اليوم (نظراً):</span>
              <strong style={{ color: 'white' }}>الجزء {currentJuz} بالحدر</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="#34D399" />
            <div style={{ fontSize: '12.5px' }}>
              <span style={{ color: '#94A3B8', display: 'block' }}>إنجاز الحصون الخمسة اليوم:</span>
              <strong style={{ color: '#34D399' }}>{doneFortressesCount} من أصل 5 مكتملة</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={18} color="#FBBF24" />
            <div style={{ fontSize: '12.5px' }}>
              <span style={{ color: '#94A3B8', display: 'block' }}>المراجعة القريبة اليومية:</span>
              <strong style={{ color: 'white' }}>ص {Math.max(1, currentPage - 20)} إلى {Math.max(1, currentPage - 1)}</strong>
            </div>
          </div>
        </div>
      </div>

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
          حوارات وتدبر الحفاظ 💬
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
              شارِك تدبراً، فائدة، أو استفساراً في تثبيت القرآن
            </h3>

            {postFeedback && (
              <div role="status" data-testid="community-feedback" style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: postFeedback.startsWith('تعذر') ? 'rgba(239,68,68,0.12)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${postFeedback.startsWith('تعذر') ? '#EF4444' : '#10B981'}`,
                color: postFeedback.startsWith('تعذر') ? '#B91C1C' : '#047857',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={20} color="#10B981" />
                <span>{postFeedback}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost}>
              <textarea
                aria-label="نص المنشور الجديد"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="اكتب تجربتك في الحفظ، سؤالاً عن المتشابهات، أو تدبراً يشد الهمم..."
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['تثبيت وتدبر', 'متشابهات', 'تجويد', 'نصيحة للحفاظ'].map((cat) => (
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
            {posts.length === 0 && <div data-testid="community-empty" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد منشورات حقيقية بعد.</div>}
            {posts.map((post) => (
              <div 
                key={post.id}
                data-testid={`community-post-${post.id}`}
                style={{
                  padding: '26px',
                  borderRadius: '20px',
                  background: post.isPinned ? 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(16, 185, 129, 0.04) 100%)' : 'var(--bg-surface)',
                  border: post.isPinned ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                  boxShadow: post.isPinned ? '0 8px 24px rgba(16, 185, 129, 0.12)' : 'var(--shadow-soft)',
                  position: 'relative'
                }}
              >
                {/* Pinned Tag */}
                {post.isPinned && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '14px',
                    border: '1px solid var(--primary)'
                  }}>
                    <Pin size={14} />
                    منشور تفاعلي موحّد — شاركنا رحلتك وتحدياتك القرآنية
                  </div>
                )}

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
                    ) : post.avatar ? (
                      <img 
                        src={post.avatar} 
                        alt={post.author}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          border: '2px solid var(--primary)',
                          background: 'var(--bg-color)'
                        }}
                      />
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
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                          {post.author}
                        </h4>
                        {post.isAnonymous && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 'bold' }}>
                            مخفي
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatPostTime(post.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>#{post.category}</span>
                    {(post.authorId === user?.uid || (activeRole === 'admin' && post.canEdit)) && <>
                      <button type="button" aria-label="تعديل المنشور" onClick={() => { setEditingPostId(post.id); setEditingText(post.content); }}>تعديل</button>
                      <button type="button" aria-label="حذف المنشور" onClick={() => handleDeletePost(post)}>حذف</button>
                    </>}
                  </div>
                </div>

                {/* Content */}
                {editingPostId === post.id ? <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input aria-label="نص تعديل المنشور" value={editingText} onChange={event => setEditingText(event.target.value)} style={{ flex: 1, padding: '10px' }} />
                  <button type="button" onClick={() => handleUpdatePost(post)}>حفظ التعديل</button>
                  <button type="button" onClick={() => setEditingPostId(null)}>إلغاء</button>
                </div> : <div style={{
                  fontSize: '15.5px', 
                  color: 'var(--text-primary)', 
                  lineHeight: 1.8, 
                  margin: '0 0 16px 0', 
                  whiteSpace: 'pre-line' 
                }}>
                  {post.content}
                </div>}

                {/* Action Buttons (Likes & Answers) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    aria-label={`إعجاب بالمنشور ${post.id}`}
                    onClick={() => handleToggleLike(post)}
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
                    <span>{post.likes || 0} إعجاب وتأييد</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '14px' }}>
                    <MessageCircle size={18} />
                    <span>{(post.answers || []).length} مشاركة ورد</span>
                  </div>
                </div>

                {/* Answers / Comments Section */}
                {(post.answers || []).length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      مشاركات وتجارب الإخوة الحفاظ:
                    </h5>
                    {post.answers.map((ans) => (
                      <div key={ans.id} style={{ padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', fontSize: '14.5px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                          {ans.author}:
                        </span>
                        <span style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {ans.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Answer Input */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAnswer(post)}
                    placeholder="اكتب تجربتك، إجابتك، أو دعاءك..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    aria-label={`إرسال تعليق على المنشور ${post.id}`}
                    onClick={() => handleAddAnswer(post)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={14} style={{ transform: 'rotate(180deg)' }} />
                    إرسال
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
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>أعلى الحفاظ في نقاط الخبرة (XP)، مع عدد أيام صحبة القرآن المتتالية.</p>

          {leaderboard.status === 'loading' && leaderboard.leaders.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>جاري تحميل الترتيب...</p>
          )}
          {leaderboard.status === 'error' && (
            <p style={{ color: '#EF4444', margin: 0 }}>تعذر تحميل الترتيب، حاول مرة أخرى لاحقًا.</p>
          )}
          {leaderboard.status === 'ready' && leaderboard.leaders.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>لا يوجد حفاظ في الترتيب بعد — كن أول من يجمع النقاط!</p>
          )}

          <div data-testid="community-leaderboard" style={{ display: 'grid', gap: '16px' }}>
            {[
              ...leaderboard.leaders,
              // The viewer's own row when outside the top list (rank unknown, shown as "—").
              ...(leaderboard.me && !leaderboard.leaders.some(entry => entry.isMe) && leaderboard.leaders.length > 0 ? [leaderboard.me] : [])
            ].map((entry) => ({
              rank: entry.rank,
              name: entry.name,
              points: `${entry.xp.toLocaleString('en-US')} XP`,
              streak: `${entry.streak} يوم`,
              avatar: entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.name)}`,
              isUser: entry.isMe
            })).map((member) => (
              <div
                key={member.isUser ? 'me' : member.rank}
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
                  <span style={{ fontSize: '18px', fontWeight: 'bold', width: '28px', color: member.rank && member.rank <= 3 ? 'var(--primary)' : 'var(--text-secondary)' }}>{member.rank ? `#${member.rank}` : '—'}</span>
                  <img src={member.avatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-surface)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{member.name} {member.isUser && '(أنت)'}</h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>صحبة القرآن: {member.streak} 📖</span>
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

export default Community;
