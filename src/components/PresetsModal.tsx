import React from 'react';
import { PRESET_SCENARIOS } from '../data/presets';
import { PresetScenario } from '../types';
import { Layers, X, ArrowRight, Building, Landmark, Globe } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
}

export const PresetsModal: React.FC<Props> = ({ isOpen, onClose, onSelectPreset }) => {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ministry & Gov':
        return <Landmark className="w-4 h-4 text-amber-500" />;
      case 'Corporate Partner':
        return <Building className="w-4 h-4 text-teal-500" />;
      default:
        return <Globe className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-[#18123A] text-white">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#FF5722]" />
            <h3 className="text-base font-bold text-white">Eduvision Partnership Presets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#2A2352] text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600">
            Select a realistic executive partnership scenario to pre-fill the Eduvision Drafter with context and directives:
          </p>

          <div className="space-y-3">
            {PRESET_SCENARIOS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="group p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition shadow-sm hover:shadow-md hover:border-[#FF5722]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(preset.category)}
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {preset.category}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#FF5722] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Load Scenario <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0A2540] transition">
                  {preset.title}
                </h4>

                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  <span className="font-semibold text-slate-800">Target:</span> {preset.targetOrg}
                </p>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                  "{preset.customInstructions}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
