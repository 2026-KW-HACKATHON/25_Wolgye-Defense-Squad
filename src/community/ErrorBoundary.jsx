import React from 'react';

export default class ErrorBoundary extends React.Component {
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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '24px 20px',
            margin: '20px auto',
            maxWidth: '480px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #fecdd3',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: '#9f1239' }}>
            화면을 표시하는 도중 일시적인 문제가 발생했어요
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            콘텐츠 표시 중 오류가 발생하여 안전하게 보호 조치했습니다.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              className="button dark"
              onClick={this.handleReset}
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
            >
              다시 시도하기
            </button>
            <button
              type="button"
              className="button outline"
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
