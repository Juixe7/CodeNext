import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
          <div>
            <p className="font-semibold text-sm">{this.props.fallbackTitle || 'Something went wrong'}</p>
            <p className="text-xs text-base-content/50 mt-1">
              {this.props.fallbackMessage || 'This section encountered an error.'}
            </p>
          </div>
          <button
            className="btn btn-outline btn-xs gap-1"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
