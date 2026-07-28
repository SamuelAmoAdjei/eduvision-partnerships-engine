import React from 'react';
import { ModelVersion } from '../types';
import { Sparkles, History, Layers, Building2, ShieldCheck, User, CheckCircle2 } from 'lucide-react';
import { AuthUser } from './SignInPage';

interface Props {
  selectedModel: ModelVersion;
  onModelChange: (model: ModelVersion) => void;
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  authUser: AuthUser | null;
  savedCount: number;
}

export const Header: React.FC<Props> = ({
  selectedModel,
  onModelChange,
  onOpenPresets,
  onOpenHistory,
  onOpenAuth,
  authUser,
  savedCount,
}) => {
  return (
    <header className="bg-[#18123A] text-white shadow-xl border-b border-[#2D255F] print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF5722] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Eduvision Partnerships Engine
                </h1>
                <span className="text-[10px] font-bold bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/40 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                  Ghana AI Executive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Executive Proposal Drafter, Diplomatic Communications & AI Inbox Manager | eduvisiongh.org
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Model Selector */}
            <div className="flex items-center bg-[#231C4C] border border-[#372E6F] rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5722] mr-1.5 shrink-0" />
              <span className="text-slate-400 mr-2 font-medium">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value as ModelVersion)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
              >
                <option value="gemini-3.5-flash" className="bg-[#18123A] text-white">
                  Gemini 3.5 Flash (General & Search Grounding)
                </option>
                <option value="gemini-3.1-pro-preview" className="bg-[#18123A] text-white">
                  Gemini 3.1 Pro (Complex Reasoning & High Thinking)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-[#18123A] text-white">
                  Gemini 3.1 Flash-Lite (Fast Micro-Tasks)
                </option>
              </select>
            </div>

            {/* Google OAuth Status Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                authUser
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                  : 'bg-[#FF5722]/20 text-[#FF5722] border-[#FF5722]/40 hover:bg-[#FF5722]/30'
              }`}
              title="Manage Google OAuth Authorization & Account"
            >
              {authUser ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline font-mono text-[11px]">{authUser.email}</span>
                  <span className="sm:hidden">OAuth Active</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>Sign In / OAuth</span>
                </>
              )}
            </button>

            {/* Quick Presets Button */}
            <button
              onClick={onOpenPresets}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#231C4C] hover:bg-[#2D255F] text-slate-200 border border-[#372E6F] transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#FF5722]" />
              <span className="hidden lg:inline">Sample Scenarios</span>
            </button>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FF5722] hover:bg-[#E04818] text-white shadow-lg shadow-orange-500/20 transition cursor-pointer relative"
            >
              <History className="w-3.5 h-3.5" />
              <span>Vault</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white text-[#18123A] font-extrabold text-[10px] rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};


