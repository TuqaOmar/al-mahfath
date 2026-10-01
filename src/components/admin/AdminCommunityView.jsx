import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const AdminCommunityView = ({ posts, handleApprovePost, handleRejectPost }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '24px', borderRadius: '22px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              إدارة المنتدى والمجتمع القرآني
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              راجع المنشورات الجديدة، وافق عليها، أو قم بحذف المحتوى المخالف لضمان بيئة آمنة للمشتركين.
            </p>
          </div>
          <button style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> موافقة على الكل
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.filter(p => p.status !== 'approved').length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>لا توجد منشورات قيد المراجعة حالياً.</p>
            </div>
          ) : (
            posts.filter(p => p.status !== 'approved').map((post) => (
              <div key={post.id} style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                    {(post.authorName || 'م')[0]}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{post.authorName || 'مستخدم مجهول'}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('ar-SA') : 'مؤخراً'} • قيد المراجعة
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                      "{post.content || post.text || 'لا يوجد نص محدد'}"
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => handleApprovePost(post.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>موافقة ونشر</button>
                  <button onClick={() => handleRejectPost(post.id)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>رفض وحذف</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
