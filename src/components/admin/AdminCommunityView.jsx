import React, { useEffect, useState } from 'react';
import { MessageSquare, MessageCircle, RefreshCw, Search, Trash2, Heart, EyeOff, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'مؤخرًا' : date.toLocaleString('ar-JO', { dateStyle: 'medium', timeStyle: 'short' });
};

const card = { borderRadius: '18px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' };
const chip = active => ({
  padding: '6px 13px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  background: active ? 'var(--primary-light)' : 'transparent',
  color: active ? 'var(--primary)' : 'var(--text-secondary)',
  border: `1px solid ${active ? 'var(--primary)' : 'var(--glass-border)'}`
});
const ghostDanger = { padding: '6px 10px', borderRadius: '8px', background: 'transparent', color: '#DC2626', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' };
const solidDanger = { ...ghostDanger, background: '#DC2626', color: 'white', border: '1px solid #DC2626' };
const ghost = { ...ghostDanger, color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' };

// Two-step delete: first click arms it, second confirms. Avoids browser confirm() dialogs.
const DeleteControl = ({ armed, busy, onArm, onConfirm, onCancel, label, small }) => armed ? (
  <span style={{ display: 'inline-flex', gap: '6px', flexShrink: 0 }}>
    <button type="button" disabled={busy} onClick={onConfirm} style={solidDanger}>{busy ? 'جاري الحذف...' : 'تأكيد الحذف'}</button>
    <button type="button" disabled={busy} onClick={onCancel} style={ghost}>تراجع</button>
  </span>
) : (
  <button type="button" aria-label={label} title={label} onClick={onArm} style={{ ...ghostDanger, ...(small ? { padding: '4px 6px', border: 'none' } : {}), flexShrink: 0 }}>
    <Trash2 size={small ? 13 : 14} />{!small && ' حذف'}
  </button>
);

// Community posts publish immediately; this view lets the admin review and remove posts or comments.
export const AdminCommunityView = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest'); // 'newest' | 'engagement'
  const [armedId, setArmedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [openComments, setOpenComments] = useState({});

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

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const deletePost = async post => {
    setBusyId(post.id);
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر حذف المنشور');
      setPosts(previous => previous.filter(item => item.id !== post.id));
      setNotice('تم حذف المنشور وتعليقاته.');
    } catch (err) {
      setError(err.message || 'تعذر حذف المنشور');
    } finally {
      setBusyId(null);
      setArmedId(null);
    }
  };

  const deleteComment = async (post, comment) => {
    setBusyId(comment.id);
    try {
      const res = await fetchWithAuth(`/api/community/posts/${post.id}/comments/${comment.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'تعذر حذف التعليق');
      setPosts(previous => previous.map(item => item.id === post.id ? data.post : item));
      setNotice('تم حذف التعليق.');
    } catch (err) {
      setError(err.message || 'تعذر حذف التعليق');
    } finally {
      setBusyId(null);
      setArmedId(null);
    }
  };

  const term = query.trim();
  const categories = [...new Set(posts.map(post => post.category).filter(Boolean))];
  const engagement = post => Number(post.likes || 0) + (post.answers?.length || 0) * 2;
  const visiblePosts = posts
    .filter(post => category === 'all' || post.category === category)
    .filter(post => !term || [post.content, post.author, post.category, ...(post.answers || []).map(a => a.text)]
      .some(value => String(value || '').includes(term)))
    .sort((a, b) => sort === 'engagement'
      ? engagement(b) - engagement(a)
      : new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const totalComments = posts.reduce((sum, post) => sum + (post.answers?.length || 0), 0);
  const totalLikes = posts.reduce((sum, post) => sum + Number(post.likes || 0), 0);
  const weekAgo = Date.now() - 7 * 86400000;
  const postsThisWeek = posts.filter(post => new Date(post.createdAt || 0).getTime() >= weekAgo).length;

  const stats = [
    ['المنشورات', posts.length, MessageSquare],
    ['هذا الأسبوع', postsThisWeek, RefreshCw],
    ['التعليقات', totalComments, MessageCircle],
    ['الإعجابات', totalLikes, Heart]
  ];

  return (
    <div data-testid="admin-community-view" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ ...card, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>إدارة المنتدى</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            المنشورات تُنشر فورًا؛ راجعها هنا واحذف المخالف منها أو من تعليقاتها.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} style={{ padding: '8px 14px', borderRadius: '10px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        {stats.map(([label, value, Icon]) => (
          <div key={label} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', insetInlineStart: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input value={query} onChange={event => setQuery(event.target.value)} aria-label="بحث في المنشورات" placeholder="ابحث في النص أو الكاتب أو التعليقات" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }} />
            {query && (
              <button type="button" aria-label="مسح البحث" onClick={() => setQuery('')} style={{ position: 'absolute', insetInlineEnd: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
            )}
          </div>
          <select aria-label="ترتيب المنشورات" value={sort} onChange={event => setSort(event.target.value)} style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
            <option value="newest">الأحدث أولًا</option>
            <option value="engagement">الأكثر تفاعلًا</option>
          </select>
        </div>
        {categories.length > 0 && (
          <div role="group" aria-label="تصفية حسب التصنيف" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')} style={chip(category === 'all')}>الكل</button>
            {categories.map(item => (
              <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} style={chip(category === item)}>#{item}</button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div role="alert" style={{ padding: '11px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#DC2626', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {error}
          <button type="button" aria-label="إغلاق" onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
        </div>
      )}
      {notice && (
        <div role="status" style={{ padding: '11px 14px', borderRadius: '12px', background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '13px', fontWeight: 700 }}>{notice}</div>
      )}

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && posts.length === 0 ? (
          <div style={{ ...card, padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل المنشورات...</div>
        ) : visiblePosts.length === 0 ? (
          <div style={{ ...card, padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ margin: 0 }}>{term || category !== 'all' ? 'لا توجد نتائج مطابقة.' : 'لا توجد منشورات في المجتمع بعد.'}</p>
          </div>
        ) : visiblePosts.map(post => {
          const comments = post.answers || [];
          const open = openComments[post.id];
          return (
            <article key={post.id} data-testid={`admin-post-${post.id}`} style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', minWidth: 0, alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '50%', background: post.isAnonymous ? 'var(--glass-border)' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: post.isAnonymous ? 'var(--text-secondary)' : 'var(--primary)', fontWeight: 800 }}>
                    {post.isAnonymous ? <EyeOff size={16} /> : (post.author || 'م')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{post.isAnonymous ? 'منشور بدون اسم' : (post.author || 'مستخدم')}</strong>
                      {post.category && <span style={{ padding: '2px 8px', borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11.5px', fontWeight: 700 }}>#{post.category}</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <DeleteControl
                  label="حذف المنشور"
                  armed={armedId === post.id}
                  busy={busyId === post.id}
                  onArm={() => setArmedId(post.id)}
                  onCancel={() => setArmedId(null)}
                  onConfirm={() => deletePost(post)}
                />
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{post.content}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12.5px', color: 'var(--text-secondary)', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Heart size={14} /> {post.likes || 0}</span>
                {comments.length > 0 ? (
                  <button type="button" aria-expanded={Boolean(open)} onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    <MessageCircle size={14} /> {open ? 'إخفاء التعليقات' : `عرض التعليقات (${comments.length})`} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14} /> لا تعليقات</span>
                )}
              </div>

              {open && comments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-color)', fontSize: '13px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12.5px' }}>{comment.author || 'مستخدم'} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '11.5px' }}>· {formatDate(comment.createdAt)}</span></div>
                        <div style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere', lineHeight: 1.6 }}>{comment.text}</div>
                      </div>
                      <DeleteControl
                        small
                        label="حذف التعليق"
                        armed={armedId === comment.id}
                        busy={busyId === comment.id}
                        onArm={() => setArmedId(comment.id)}
                        onCancel={() => setArmedId(null)}
                        onConfirm={() => deleteComment(post, comment)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
