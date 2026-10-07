import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Search, Trash2, Heart } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'مؤخرًا' : date.toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });
};

const dangerButton = { padding: '6px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' };

// Community posts publish immediately; this view lets the admin review and remove posts or comments.
export const AdminCommunityView = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/community/posts');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر تحميل المنشورات');
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل المنشورات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deletePost = async post => {
    if (!window.confirm('حذف هذا المنشور مع كل تعليقاته؟')) return;
    setBusyId(post.id);
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر حذف المنشور');
      setPosts(previous => previous.filter(item => item.id !== post.id));
    } catch (err) {
      setError(err.message || 'تعذر حذف المنشور');
    } finally {
      setBusyId(null);
    }
  };

  const deleteComment = async (post, comment) => {
    if (!window.confirm('حذف هذا التعليق؟')) return;
    setBusyId(comment.id);
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}/comments/${comment.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر حذف التعليق');
      setPosts(previous => previous.map(item => item.id === post.id ? data.post : item));
    } catch (err) {
      setError(err.message || 'تعذر حذف التعليق');
    } finally {
      setBusyId(null);
    }
  };

  const term = query.trim();
  const visiblePosts = term
    ? posts.filter(post => [post.content, post.author, post.category].some(value => String(value || '').includes(term)))
    : posts;
  const totalComments = posts.reduce((sum, post) => sum + (post.answers?.length || 0), 0);
  const totalLikes = posts.reduce((sum, post) => sum + Number(post.likes || 0), 0);

  return (
    <div data-testid="admin-community-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '24px', borderRadius: '22px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              إدارة المنتدى والمجتمع القرآني
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              راجع منشورات المجتمع وتعليقاتها، واحذف المحتوى المخالف لضمان بيئة آمنة للمشتركين.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} /> تحديث
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>المنشورات: <strong>{posts.length}</strong></span>
          <span>التعليقات: <strong>{totalComments}</strong></span>
          <span>الإعجابات: <strong>{totalLikes}</strong></span>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث في نص المنشور أو اسم الكاتب أو التصنيف" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
        </div>

        {error && <div role="alert" style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل المنشورات...</div>
          ) : visiblePosts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>{term ? 'لا توجد نتائج مطابقة.' : 'لا توجد منشورات في المجتمع بعد.'}</p>
            </div>
          ) : visiblePosts.map(post => (
            <div key={post.id} data-testid={`admin-post-${post.id}`} style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                    {(post.author || 'م')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{post.author || 'مستخدم'}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {formatDate(post.createdAt)} • {post.category || 'تدبر'} • <Heart size={11} style={{ verticalAlign: 'middle' }} /> {post.likes || 0}
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{post.content}</p>
                  </div>
                </div>
                <button disabled={busyId === post.id} onClick={() => deletePost(post)} style={dangerButton}>
                  <Trash2 size={14} /> حذف
                </button>
              </div>
              {post.answers?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingInlineStart: '52px' }}>
                  {post.answers.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere' }}><strong>{comment.author || 'مستخدم'}:</strong> {comment.text}</span>
                      <button disabled={busyId === comment.id} onClick={() => deleteComment(post, comment)} style={{ ...dangerButton, padding: '4px 8px', flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
