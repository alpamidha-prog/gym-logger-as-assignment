'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <RefreshCw size={28} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>
          <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--btn-shadow)',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
