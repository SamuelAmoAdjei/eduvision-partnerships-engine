import React from 'react';
import { AlertTriangle, RefreshCw, X, ShieldAlert, Key, Clock, WifiOff } from 'lucide-react';

export interface ApiErrorInfo {
  title: string;
  message: string;
  actionableHint?: string;
  onRetry?: () => void;
}

interface Props {
  error: ApiErrorInfo | null;
  onDismiss: () => void;
}

export const ApiErrorBanner: React.FC<Props> = ({ error, onDismiss }) => {
  if (!error) return null;

  const isKeyError = error.message.toLowerCase().includes('key') || error.message.toLowerCase().includes('missing');
  const isQuotaError = error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota') || error.message.includes('429');
  const isNetworkError = error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch');

  return (
    <div className="bg-red-900/90 border-y md:border border-red-500/50 text-white p-4 shadow-xl mb-6 rounded-none md:rounded-2xl backdrop-blur-md animate-fade-in relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 shrink-0 mt-0.5 md:mt-0">
            {isKeyError ? (
              <Key className="w-5 h-5 text-amber-300" />
            ) : isQuotaError ? (
              <Clock className="w-5 h-5 text-amber-300" />
            ) : isNetworkError ? (
              <WifiOff className="w-5 h-5 text-red-300" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-300" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">{error.title || 'Gemini API Request Error'}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-950 border border-red-700/60 text-red-200 rounded">
                Action Required
              </span>
            </div>

            <p className="text-xs text-red-100 leading-relaxed font-sans">{error.message}</p>

            {error.actionableHint && (
              <p className="text-[11px] text-amber-200/90 font-medium flex items-center gap-1.5 mt-1 pt-1 border-t border-red-800/60">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span><strong>Recommendation:</strong> {error.actionableHint}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          {error.onRetry && (
            <button
              onClick={() => {
                error.onRetry?.();
                onDismiss();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white text-red-950 hover:bg-red-100 rounded-lg shadow transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-red-800" />
              <span>Retry Request</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="p-1.5 text-red-300 hover:text-white bg-red-950/60 hover:bg-red-950 rounded-lg transition cursor-pointer"
            title="Dismiss Error Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
