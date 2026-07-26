import React, { useState } from 'react';
import { CustomLetterhead } from '../types';
import {
  X,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Sparkles,
  Building,
  Sliders,
  Layers,
  FileText,
  Eye,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customLetterhead: CustomLetterhead;
  onSave: (letterhead: CustomLetterhead) => void;
}

export const DEFAULT_LETTERHEAD: CustomLetterhead = {
  useCustom: false,
  templateImageBase64: undefined,
  templateFileName: undefined,
  topPaddingPx: 140,
  bottomPaddingPx: 90,
  sidePaddingPx: 48,
  refPrefix: 'EDV/GP-',
  orgName: 'EDUVISION GHANA',
  department: 'Directorate of Global Partnerships & Institutional Relations',
  contactInfo: 'Accra, Ghana | eduvisiongh.org | partnerships@eduvisiongh.org',
  sealText: 'Official Seal / Sign',
};

export const LetterheadCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customLetterhead,
  onSave,
}) => {
  const [formData, setFormData] = useState<CustomLetterhead>(customLetterhead);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        useCustom: true,
        templateImageBase64: base64,
        templateFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      templateImageBase64: undefined,
      templateFileName: undefined,
    }));
  };

  const handleResetToDefault = () => {
    setFormData(DEFAULT_LETTERHEAD);
  };

  const handleSave = () => {
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 relative max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Pre-Designed Blank Letterhead Template</h2>
              <p className="text-xs text-slate-400">
                Upload your complete blank letterhead design sheet. The proposal text will be automatically overlayed and duplicated across all pages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Custom vs Default */}
        <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 shrink-0">
          <div>
            <span className="text-sm font-bold text-white block">Use Uploaded Blank Letterhead Template</span>
            <span className="text-xs text-slate-400">
              When enabled, your pre-designed blank sheet acts as the background for every generated proposal page
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, useCustom: !prev.useCustom }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              formData.useCustom ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                formData.useCustom ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Modal Body with 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1">
          
          {/* Left Column: File Upload & Padding Controls */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* File Uploader */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Blank Letterhead Image File</span>
                </label>
                {formData.templateImageBase64 && (
                  <button
                    type="button"
                    onClick={handleRemoveTemplate}
                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    Remove Template
                  </button>
                )}
              </div>

              {formData.templateImageBase64 ? (
                <div className="p-3 bg-white rounded-lg border border-slate-700 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={formData.templateImageBase64}
                      alt="Blank Letterhead Background"
                      className="h-16 w-12 object-cover border border-slate-300 rounded shadow-sm shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {formData.templateFileName || 'Blank_Letterhead_Template.png'}
                      </p>
                      <p className="text-[10px] text-slate-500">Active Page Background Template</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTemplateUpload}
                    className="hidden"
                    id="custom-letterhead-template-input"
                  />
                  <label
                    htmlFor="custom-letterhead-template-input"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-800/50 rounded-xl cursor-pointer transition text-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Upload Your Designed Blank Letterhead File
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Select a PNG, JPG, or SVG blank paper template
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 italic bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      The entire image will be duplicated as the background sheet for all document pages
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Layout Text Margin Offsets */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Text Margin & Position Offsets
                </span>
              </div>

              <div className="space-y-3">
                {/* Top Padding */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                    <span>Top Text Start Margin (Offset from top header)</span>
                    <span className="font-mono font-bold text-amber-400">{formData.topPaddingPx || 140}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="5"
                    value={formData.topPaddingPx || 140}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, topPaddingPx: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Adjust so proposal text begins right below your pre-designed top header graphic
                  </span>
                </div>

                {/* Bottom Padding */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                    <span>Bottom Footer Margin</span>
                    <span className="font-mono font-bold text-amber-400">{formData.bottomPaddingPx || 80}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={formData.bottomPaddingPx || 80}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bottomPaddingPx: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Ensures text ends above your bottom footer graphic
                  </span>
                </div>

                {/* Side Margin */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                    <span>Side Margin Padding</span>
                    <span className="font-mono font-bold text-amber-400">{formData.sidePaddingPx || 48}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="100"
                    step="4"
                    value={formData.sidePaddingPx || 48}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sidePaddingPx: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Optional Prefix */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Reference Code Prefix</label>
              <input
                type="text"
                value={formData.refPrefix || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, refPrefix: e.target.value }))}
                placeholder="e.g. EDV/GP- or MOE/REF-"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

          </div>

          {/* Right Column: Interactive Live Sheet Overlay Preview */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-400" />
                <span>Live Page Sheet Preview</span>
              </span>
              <span className="text-[11px] text-slate-400 normal-case font-normal">
                Text overlayed on template
              </span>
            </div>

            {/* Simulated A4 Paper Viewport */}
            <div className="flex-1 min-h-[380px] max-h-[480px] bg-slate-950 rounded-xl border border-slate-800 p-4 flex items-center justify-center overflow-auto">
              <div className="w-[280px] h-[396px] bg-white rounded shadow-2xl relative overflow-hidden text-slate-900 font-serif text-[9px] leading-relaxed select-none">
                
                {/* Background Letterhead Template */}
                {formData.templateImageBase64 ? (
                  <img
                    src={formData.templateImageBase64}
                    alt="Blank Template Preview"
                    className="absolute inset-0 w-full h-full object-fill z-0"
                  />
                ) : (
                  <div className="absolute inset-x-0 top-0 p-3 border-b border-black z-0 font-serif">
                    <p className="font-bold uppercase text-[10px] text-black">
                      {formData.orgName || 'EDUVISION GHANA'}
                    </p>
                    <p className="text-[7px] text-slate-600 font-sans uppercase font-bold">
                      {formData.department || 'Directorate of Global Partnerships'}
                    </p>
                  </div>
                )}

                {/* Overlay Text Layer */}
                <div
                  className="relative z-10 h-full flex flex-col justify-between"
                  style={{
                    paddingTop: `${(formData.topPaddingPx || 140) * 0.38}px`,
                    paddingBottom: `${(formData.bottomPaddingPx || 80) * 0.38}px`,
                    paddingLeft: `${(formData.sidePaddingPx || 48) * 0.38}px`,
                    paddingRight: `${(formData.sidePaddingPx || 48) * 0.38}px`,
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[7px] font-sans font-semibold text-slate-700 border-b border-slate-200 pb-1">
                      <span>REF: {(formData.refPrefix || 'EDV/GP-')}2026/07</span>
                      <span>DATE: 26 July 2026</span>
                    </div>

                    <p className="font-bold text-[10px] text-black font-sans uppercase">
                      MEMORANDUM OF UNDERSTANDING & PARTNERSHIP PROPOSAL
                    </p>

                    <p className="text-[8px] text-slate-800">
                      <strong>Target Institution:</strong> Ministry of Education / International Partner
                    </p>

                    <p className="text-[7.5px] text-slate-700 leading-normal">
                      1. EXECUTIVE SUMMARY: Eduvision Ghana presents this strategic partnership proposal to deploy digital learning infrastructure across high-density regional secondary hubs...
                    </p>

                    <p className="text-[7.5px] text-slate-700 leading-normal">
                      2. STRATEGIC FRAMEWORK: Aligning with sustainable development goals, this initiative optimizes teacher capacity building and open-source curriculum distribution...
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between text-[7px] font-sans text-slate-500">
                    <span>Page 1 of 2 (Template Duplicated across all pages)</span>
                    <span>Eduvision Ghana</span>
                  </div>
                </div>

              </div>
            </div>
            <span className="text-[10px] text-slate-400 text-center block">
              Multi-Page Guarantee: When a proposal spans multiple pages, this exact template image is duplicated for every page.
            </span>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Template Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Blank Letterhead Template</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
