import React from 'react';
import { ModelVersion } from '../types';
import { Sparkles, History, BookOpen, Layers } from 'lucide-react';

interface Props {
  selectedModel: ModelVersion;
  onModelChange: (model: ModelVersion) => void;
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  savedCount: number;
}

export const Header: React.FC<Props> = ({
  selectedModel,
  onModelChange,
  onOpenPresets,
  onOpenHistory,
  savedCount,
}) => {
  return (
    <header className="bg-[#0A2540] text-white shadow-md border-b border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-xl shadow-inner">
              🤝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Eduvision Partnerships Engine
                </h1>
                <span className="text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full tracking-wider uppercase">
                  Ghana AI Executive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Executive Proposal Drafter & Diplomatic Communications Manager | eduvisiongh.org
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Model Selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 mr-1.5" />
              <span className="text-slate-400 mr-2 font-medium">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value as ModelVersion)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="gemini-3.5-flash" className="bg-slate-900 text-white">
                  Gemini 3.5 Flash (General & Search Grounding)
                </option>
                <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-white">
                  Gemini 3.1 Pro (Complex Reasoning, High Thinking & Vision)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-white">
                  Gemini 3.1 Flash-Lite (Fast Micro-Tasks)
                </option>
              </select>
            </div>

            {/* Quick Presets Button */}
            <button
              onClick={onOpenPresets}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Sample Scenarios</span>
            </button>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition cursor-pointer relative"
            >
              <History className="w-3.5 h-3.5" />
              <span>Saved Vault</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white text-[#0A2540] font-bold text-[10px] rounded-full">
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
