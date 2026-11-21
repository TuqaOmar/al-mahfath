import React from 'react';
import { RefreshCw, Home } from 'lucide-react';

export class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('App captured interface issue:', error?.message || error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

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
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-surface, #ffffff)',
            padding: '36px 28px',
            borderRadius: '24px',
            border: '1px solid var(--glass-border, rgba(15, 23, 42, 0.08))',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              حدث تنبيه في عرض الصفحة
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              لا تقلق، بياناتك ومحفوظك في أمان تام بإذن الله. يمكنك استئناف التصفح والتسميع فوراً بالضغط على الزر أدناه:
            </p>

            {this.state.error?.message && (
              <div style={{
                marginBottom: '20px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '12px',
                color: '#dc2626',
                textAlign: 'right',
                direction: 'ltr',
                fontFamily: 'monospace'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--primary, #10B981)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px var(--primary-glow)'
                }}
              >
                <RefreshCw size={16} /> متابعة واستئناف التصفح ✨
              </button>
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
                  border: '1px solid var(--glass-border, #cbd5e1)',
                  background: 'transparent',
                  color: 'var(--text-primary, #0f172a)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} /> لوحة التحكم الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = SafeBoundary;
export default SafeBoundary;
