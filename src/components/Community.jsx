import { nextDeclaredPage } from '../lib/memorization';
import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  MessageSquare,
  EyeOff,
  Send,
  Heart,
  MessageCircle,
  Flame,
  CheckCircle2,
  AlertCircle,
  Pin,
  Pencil,
  Trash2,
  Share2,
  Users,
  Crown,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/api';
import { getSurahNameForPage, getJuzForPage } from '../utils/quranData';

const CATEGORIES = ['تثبيت وتدبر', 'متشابهات', 'تجويد', 'نصيحة للحفاظ', 'إنجاز الحصون'];
const MAX_POST_LENGTH = 4000;

const isErrorMessage = text => typeof text === 'string' && text.startsWith('تعذر');

// "منذ 5 دقائق" for recent posts, a date for older ones.
const formatPostTime = value => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return date.toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Avatar = ({ name, photo, anonymous, size = 40 }) => {
  const base = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
    fontSize: Math.round(size * 0.42)
  };
  if (anonymous) {
    return <div aria-hidden="true" style={{ ...base, background: 'var(--glass-border)', color: 'var(--text-secondary)' }}><EyeOff size={Math.round(size * 0.45)} /></div>;
  }
  if (photo) {
    return <img src={photo} alt="" style={{ ...base, objectFit: 'cover', background: 'var(--bg-color)' }} />;
  }
  return <div aria-hidden="true" style={{ ...base, background: 'var(--primary-light)', color: 'var(--primary)' }}>{(name || 'ح').trim().charAt(0)}</div>;
};

const iconButton = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  padding: '6px',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12.5px',
  fontWeight: 700
};

const card = {
  borderRadius: '18px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-soft)'
};

export const Community = () => {
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
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [isPosting, setIsPosting] = useState(false);
  const [postFeedback, setPostFeedback] = useState(null);
  const composerRef = useRef(null);

  const [commentInputs, setCommentInputs] = useState({});
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Success messages fade out on their own; errors stay until the next action.
  useEffect(() => {
    if (!postFeedback || isErrorMessage(postFeedback)) return undefined;
    const timer = setTimeout(() => setPostFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [postFeedback]);

  useEffect(() => {
    const loadFromApi = async () => {
      setPostsLoading(true);
      try {
        const res = await fetchWithAuth('/api/community/posts');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'تعذر تحميل المنشورات');
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setPostFeedback(null);
      } catch (err) {
        setPosts([]);
        setPostFeedback(err.message || 'تعذر تحميل المنشورات');
      } finally {
        setPostsLoading(false);
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim() || isPosting) return;

    setIsPosting(true);
    try {
      const res = await fetchWithAuth('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAnonymous, category: selectedCategory, content: postText.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر نشر المشاركة');
      setPosts(prev => [data.post, ...prev]);
      setPostText('');
      setIsAnonymous(false);
      setSelectedCategory(CATEGORIES[0]);
      setCategoryFilter('all');
      setPostFeedback('تم نشر مشاركتك');
    } catch (error) {
      setPostFeedback(error.message || 'تعذر نشر المشاركة');
    } finally {
      setIsPosting(false);
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
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleUpdatePost = async (post) => {
    if (!editingText.trim()) return;
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

  const handleToggleLike = async (post) => {
    const postId = post.id;
    try {
      const res = await fetchWithAuth(`/api/community/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر تحديث الإعجاب');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes, isLiked: data.liked } : p));
    } catch (error) { setPostFeedback(error.message || 'تعذر تحديث الإعجاب'); }
  };

  const handleAddAnswer = async (post) => {
    const postId = post.id;
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

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
  };

  const handleDeleteAnswer = async (post, answer) => {
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}/comments/${answer.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر حذف التعليق');
      setPosts(prev => prev.map(p => p.id === post.id ? data.post : p));
    } catch (error) { setPostFeedback(error.message || 'تعذر حذف التعليق'); }
  };

  // Prefill the composer instead of posting straight away, so the user can review and edit it.
  const handleShareMilestone = () => {
    setActiveSubTab('posts');
    setPostText(`🌿 بفضل الله وتوفيقه، وصلت في خطة الحفظ إلى الصفحة ${currentPage} من سورة ${currentSurah} (الجزء ${currentJuz}).\n🏰 أنجزت اليوم ${doneFortressesCount} من أصل 5 حصون. نسأل الله الثبات والبركة لجميع الحفاظ 🤲`);
    setSelectedCategory('إنجاز الحصون');
    setIsAnonymous(false);
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      composerRef.current?.focus();
    });
  };

  const visiblePosts = categoryFilter === 'all' ? posts : posts.filter(post => post.category === categoryFilter);
  const feedbackIsError = isErrorMessage(postFeedback);

  const tabButton = (id, Icon, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={activeSubTab === id}
      onClick={() => setActiveSubTab(id)}
      style={{
        flex: 1,
        padding: '10px 16px',
        borderRadius: '11px',
        border: 'none',
        background: activeSubTab === id ? 'var(--primary)' : 'transparent',
        color: activeSubTab === id ? 'white' : 'var(--text-secondary)',
        fontWeight: 800,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        transition: 'background 0.2s ease, color 0.2s ease'
      }}
    >
      <Icon size={17} />
      {label}
    </button>
  );

  const chip = (active) => ({
    padding: '6px 13px',
    borderRadius: '999px',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    background: active ? 'var(--primary-light)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-secondary)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--glass-border)'}`
  });

  const leaderboardRows = leaderboard.leaders;
  const podium = leaderboardRows.slice(0, 3);
  const restRows = [
    ...leaderboardRows.slice(3),
    // The viewer's own row when outside the top list (rank unknown, shown as "—").
    ...(leaderboard.me && !leaderboardRows.some(entry => entry.isMe) && leaderboardRows.length > 0 ? [leaderboard.me] : [])
  ];
  const medalColors = ['#D4A017', '#94A3B8', '#B87333'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>مجتمع الحفّاظ</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>تبادلوا الفوائد والتدبر، واسألوا عن المتشابهات والتجويد.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleShareMilestone}
          style={{ padding: '9px 16px', borderRadius: '11px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}
        >
          <Share2 size={15} />
          شارك إنجازك
        </button>
      </div>

      {/* Sub Tab Switcher */}
      <div role="tablist" aria-label="أقسام المجتمع" style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '5px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
        {tabButton('posts', MessageSquare, 'المنشورات')}
        {tabButton('leaderboard', Trophy, 'لوحة الالتزام')}
      </div>

      {postFeedback && (
        <div role={feedbackIsError ? 'alert' : 'status'} data-testid="community-feedback" style={{
          padding: '11px 14px',
          borderRadius: '12px',
          background: feedbackIsError ? 'rgba(239,68,68,0.1)' : 'var(--primary-light)',
          border: `1px solid ${feedbackIsError ? '#EF4444' : 'var(--primary)'}`,
          color: feedbackIsError ? '#DC2626' : 'var(--primary)',
          fontWeight: 700,
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {feedbackIsError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ flex: 1 }}>{postFeedback}</span>
          <button type="button" aria-label="إغلاق الرسالة" onClick={() => setPostFeedback(null)} style={{ ...iconButton, color: 'inherit', padding: '2px' }}><X size={16} /></button>
        </div>
      )}

      {/* 1. POSTS */}
      {activeSubTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Composer */}
          <form onSubmit={handleCreatePost} style={{ ...card, padding: '16px' }}>
            <textarea
              ref={composerRef}
              aria-label="نص المنشور الجديد"
              value={postText}
              maxLength={MAX_POST_LENGTH}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="شارك فائدة، تدبراً، أو سؤالاً عن الحفظ والمتشابهات..."
              rows={postText ? 5 : 2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                lineHeight: 1.7,
                outline: 'none',
                resize: 'vertical'
              }}
            />

            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }} role="group" aria-label="تصنيف المنشور">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} style={chip(selectedCategory === cat)}>
                  #{cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: '17px', height: '17px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <EyeOff size={15} />
                انشر بدون اسمي
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {postText.length > MAX_POST_LENGTH * 0.8 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{postText.length}/{MAX_POST_LENGTH}</span>
                )}
                <button
                  type="submit"
                  disabled={!postText.trim() || isPosting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '11px',
                    background: 'var(--primary)',
                    opacity: postText.trim() && !isPosting ? 1 : 0.45,
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: postText.trim() && !isPosting ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={15} style={{ transform: 'scaleX(-1)' }} />
                  {isPosting ? 'جاري النشر...' : 'نشر المشاركة'}
                </button>
              </div>
            </div>
          </form>

          {/* Category filter */}
          {posts.length > 0 && (
            <div role="group" aria-label="تصفية المنشورات" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button type="button" aria-pressed={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} style={chip(categoryFilter === 'all')}>الكل ({posts.length})</button>
              {CATEGORIES.filter(cat => posts.some(post => post.category === cat)).map(cat => (
                <button key={cat} type="button" aria-pressed={categoryFilter === cat} onClick={() => setCategoryFilter(cat)} style={chip(categoryFilter === cat)}>#{cat}</button>
              ))}
            </div>
          )}

          {/* Posts Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {postsLoading && posts.length === 0 && (
              <div style={{ ...card, padding: '28px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل المنشورات...</div>
            )}
            {!postsLoading && posts.length === 0 && (
              <div data-testid="community-empty" style={{ ...card, padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={30} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>لا توجد مشاركات بعد</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>كن أول من يشارك فائدة أو تدبراً.</div>
              </div>
            )}
            {posts.length > 0 && visiblePosts.length === 0 && (
              <div style={{ ...card, padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد منشورات في هذا التصنيف.</div>
            )}

            {visiblePosts.map((post) => {
              const canManage = post.authorId === user?.uid || (activeRole === 'admin' && post.canEdit);
              const answers = post.answers || [];
              return (
                <article
                  key={post.id}
                  data-testid={`community-post-${post.id}`}
                  style={{
                    ...card,
                    padding: '16px 18px',
                    border: post.isPinned ? '1.5px solid var(--primary)' : card.border
                  }}
                >
                  {post.isPinned && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>
                      <Pin size={13} /> منشور مثبّت
                    </div>
                  )}

                  {/* Author row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Avatar name={post.author} photo={post.avatar} anonymous={post.isAnonymous} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.isAnonymous ? 'عضو مجهول' : post.author}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>{formatPostTime(post.createdAt)}</span>
                          <span aria-hidden="true">·</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{post.category}</span>
                        </div>
                      </div>
                    </div>

                    {canManage && editingPostId !== post.id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        {confirmDeleteId === post.id ? (
                          <>
                            <button type="button" aria-label="تأكيد حذف المنشور" onClick={() => handleDeletePost(post)} style={{ ...iconButton, color: '#DC2626', background: 'rgba(239,68,68,0.1)' }}>
                              <Trash2 size={15} /> تأكيد الحذف
                            </button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} style={iconButton}>تراجع</button>
                          </>
                        ) : (
                          <>
                            <button type="button" aria-label="تعديل المنشور" title="تعديل" onClick={() => { setEditingPostId(post.id); setEditingText(post.content); setConfirmDeleteId(null); }} style={iconButton}>
                              <Pencil size={16} />
                            </button>
                            <button type="button" aria-label="حذف المنشور" title="حذف" onClick={() => setConfirmDeleteId(post.id)} style={iconButton}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {editingPostId === post.id ? (
                    <div style={{ marginTop: '12px' }}>
                      <textarea
                        aria-label="نص تعديل المنشور"
                        value={editingText}
                        maxLength={MAX_POST_LENGTH}
                        onChange={event => setEditingText(event.target.value)}
                        rows={4}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14.5px', lineHeight: 1.7, outline: 'none', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button type="button" onClick={() => handleUpdatePost(post)} disabled={!editingText.trim()} style={{ padding: '7px 16px', borderRadius: '9px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>حفظ التعديل</button>
                        <button type="button" onClick={() => setEditingPostId(null)} style={{ padding: '7px 16px', borderRadius: '9px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.85, margin: '12px 0 0', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                      {post.content}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                      type="button"
                      aria-label={`إعجاب بالمنشور ${post.id}`}
                      aria-pressed={Boolean(post.isLiked)}
                      onClick={() => handleToggleLike(post)}
                      style={{ ...iconButton, fontSize: '13px', color: post.isLiked ? '#E11D48' : 'var(--text-secondary)' }}
                    >
                      <Heart size={17} fill={post.isLiked ? '#E11D48' : 'none'} />
                      <span>{post.likes || 0}</span>
                    </button>
                    <span style={{ ...iconButton, cursor: 'default', fontSize: '13px' }}>
                      <MessageCircle size={17} />
                      <span>{answers.length} {answers.length === 1 ? 'تعليق' : 'تعليقات'}</span>
                    </span>
                  </div>

                  {/* Comments */}
                  {answers.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {answers.map((ans) => (
                        <div key={ans.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <Avatar name={ans.author} photo={ans.avatar} size={30} />
                          <div style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: '12px', background: 'var(--bg-color)', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '13px' }}>{ans.author}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{formatPostTime(ans.createdAt)}</span>
                                {ans.canDelete && (
                                  <button type="button" aria-label="حذف التعليق" title="حذف التعليق" onClick={() => handleDeleteAnswer(post, ans)} style={{ ...iconButton, padding: '2px' }}>
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, overflowWrap: 'anywhere' }}>{ans.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAnswer(post)}
                      placeholder="اكتب تجربتك، إجابتك، أو دعاءك..."
                      aria-label="نص التعليق"
                      style={{ flex: 1, minWidth: 0, padding: '9px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '13.5px' }}
                    />
                    <button
                      type="button"
                      aria-label={`إرسال تعليق على المنشور ${post.id}`}
                      onClick={() => handleAddAnswer(post)}
                      disabled={!(commentInputs[post.id] || '').trim()}
                      style={{
                        width: '38px', height: '38px', flexShrink: 0, borderRadius: '50%', border: 'none',
                        background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: (commentInputs[post.id] || '').trim() ? 'pointer' : 'not-allowed',
                        opacity: (commentInputs[post.id] || '').trim() ? 1 : 0.45
                      }}
                    >
                      <Send size={15} style={{ transform: 'scaleX(-1)' }} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. LEADERBOARD */}
      {activeSubTab === 'leaderboard' && (
        <div style={{ ...card, padding: '18px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>لوحة الالتزام</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>الأعلى في نقاط الخبرة (XP)، مع أيام صحبة القرآن المتتالية.</p>

          {leaderboard.status === 'loading' && leaderboardRows.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>جاري تحميل الترتيب...</p>
          )}
          {leaderboard.status === 'error' && (
            <p role="alert" style={{ color: '#DC2626', margin: 0 }}>تعذر تحميل الترتيب، حاول مرة أخرى لاحقًا.</p>
          )}
          {leaderboard.status === 'ready' && leaderboardRows.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>لا يوجد حفاظ في الترتيب بعد — كن أول من يجمع النقاط!</p>
          )}

          <div data-testid="community-leaderboard" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top three */}
            {podium.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${podium.length}, minmax(0, 1fr))`, gap: '10px' }}>
                {podium.map((entry, index) => (
                  <div key={entry.rank} style={{
                    padding: '14px 8px',
                    borderRadius: '14px',
                    textAlign: 'center',
                    background: entry.isMe ? 'var(--primary-light)' : 'var(--bg-color)',
                    border: `1.5px solid ${entry.isMe ? 'var(--primary)' : medalColors[index]}`
                  }}>
                    <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto 8px' }}>
                      <Avatar name={entry.name} photo={entry.photoURL} size={index === 0 ? 56 : 48} />
                      <span style={{ position: 'absolute', bottom: '-4px', insetInlineEnd: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: medalColors[index], color: 'white', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-surface)' }}>
                        {index === 0 ? <Crown size={12} /> : entry.rank}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                      {entry.name}{entry.isMe && ' (أنت)'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{entry.xp.toLocaleString('en-US')} XP</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Flame size={12} color="#F59E0B" /> {entry.streak} يوم
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Everyone else */}
            {restRows.map((entry) => (
              <div
                key={entry.isMe ? 'me' : entry.rank}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: entry.isMe ? 'var(--primary-light)' : 'var(--bg-color)',
                  border: `1px solid ${entry.isMe ? 'var(--primary)' : 'transparent'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)' }}>{entry.rank || '—'}</span>
                <Avatar name={entry.name} photo={entry.photoURL} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}{entry.isMe && ' (أنت)'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}><Flame size={12} color="#F59E0B" /> {entry.streak} يوم</div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{entry.xp.toLocaleString('en-US')} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Community;
