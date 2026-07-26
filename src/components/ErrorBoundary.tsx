import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React UI Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected UI rendering error occurred in the Eduvision Partnerships Engine.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-left text-[11px] font-mono text-red-300 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
