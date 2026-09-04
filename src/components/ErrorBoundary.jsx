import React from 'react';
import { RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color, #f8fafc)',
          color: 'var(--text-primary, #0f172a)',
          padding: '24px',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
          direction: 'rtl',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'var(--bg-surface, #ffffff)',
            padding: '36px 28px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border, rgba(15, 23, 42, 0.08))',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              حدث خطأ غير متوقع في العرض
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              لا تقلق، بياناتك وحفظك بأمان بإذن الله. يمكنك تحديث الصفحة أو العودة إلى الواجهة الرئيسية للمتابعة.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--primary, #059669)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> تحديث ومتابعة
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border, #cbd5e1)',
                  background: 'transparent',
                  color: 'var(--text-primary, #0f172a)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} /> الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
