import React, { useState } from 'react';
import { ModelVersion, ProposalFormData, SavedProposal, GroundingSource, UploadedImageInfo, CustomLetterhead } from '../types';
import { BannedWordBadge } from './BannedWordBadge';
import { LetterheadPreview } from './LetterheadPreview';
import { PdfVerificationOverlay } from './PdfVerificationOverlay';
import { LetterheadCustomizerModal, DEFAULT_LETTERHEAD } from './LetterheadCustomizerModal';
import { ApiErrorInfo } from './ApiErrorBanner';
import { downloadProposalDocx } from '../utils/docxExport';
import {
  FileText,
  Upload,
  Send,
  Loader2,
  Download,
  Copy,
  Check,
  Save,
  Mail,
  Eye,
  Edit3,
  Sparkles,
  HelpCircle,
  FileCheck,
  Printer,
  FileCheck2,
  Minimize2,
  X,
  Brain,
  Globe,
  Camera,
  Zap,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  Building,
} from 'lucide-react';
import mammoth from 'mammoth';

interface Props {
  selectedModel: ModelVersion;
  onSaveProposal: (proposal: SavedProposal) => void;
  onTransferToEmail: (proposalText: string) => void;
  initialDraft?: string;
  onApiError?: (error: ApiErrorInfo) => void;
}

export const ProposalDrafter: React.FC<Props> = ({
  selectedModel,
  onSaveProposal,
  onTransferToEmail,
  initialDraft = '',
  onApiError,
}) => {
  const [formData, setFormData] = useState<ProposalFormData>({
    targetOrg: '',
    baseContext: '',
    customInstructions: '',
    modelVersion: selectedModel,
    useThinkingMode: true,
    useSearchGrounding: true,
  });

  const [proposalDraft, setProposalDraft] = useState<string>(initialDraft);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Gemini 3 Intelligence States
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [thinkingActive, setThinkingActive] = useState<boolean>(false);

  // Multimodal Image Understanding States (gemini-3.1-pro-preview)
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInfo | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string>('');
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);

  // Fast Micro-Task States (gemini-3.1-flash-lite)
  const [fastTaskLoading, setFastTaskLoading] = useState<boolean>(false);
  const [fastTaskResult, setFastTaskResult] = useState<{ type: string; content: string } | null>(null);

  // Overlay & Print View States
  const [isPdfOverlayOpen, setIsPdfOverlayOpen] = useState<boolean>(false);
  const [isPrintViewActive, setIsPrintViewActive] = useState<boolean>(false);

  // Custom Letterhead State
  const [customLetterhead, setCustomLetterhead] = useState<CustomLetterhead>(() => {
    const saved = localStorage.getItem('eduvision_custom_letterhead');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_LETTERHEAD;
  });
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);

  const handleSaveLetterhead = (letterhead: CustomLetterhead) => {
    setCustomLetterhead(letterhead);
    localStorage.setItem('eduvision_custom_letterhead', JSON.stringify(letterhead));
  };

  // File upload state & text extraction
  const [uploadingBase, setUploadingBase] = useState<boolean>(false);
  const [uploadedBaseName, setUploadedBaseName] = useState<string | null>(null);

  const handleBaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBase(true);
    setUploadedBaseName(file.name);

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setFormData((prev) => ({
          ...prev,
          baseContext: prev.baseContext
            ? `${prev.baseContext}\n\n[Extracted from ${file.name}]:\n${result.value}`
            : `[Extracted from ${file.name}]:\n${result.value}`,
        }));
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setFormData((prev) => ({
          ...prev,
          baseContext: prev.baseContext
            ? `${prev.baseContext}\n\n[Extracted from ${file.name}]:\n${text}`
            : `[Extracted from ${file.name}]:\n${text}`,
        }));
      } else {
        // Fallback for PDF or other formats
        setFormData((prev) => ({
          ...prev,
          baseContext: prev.baseContext
            ? `${prev.baseContext}\n\n[Uploaded Document Reference: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`
            : `[Uploaded Document Reference: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`,
        }));
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
    } finally {
      setUploadingBase(false);
    }
  };

  // Image File Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage({
        base64,
        mimeType: file.type || 'image/jpeg',
        fileName: file.name,
      });
      setImageAnalysis('');
    };
    reader.readAsDataURL(file);
  };

  const reportApiError = (err: any, fallbackMessage: string, retryFn?: () => void) => {
    const message = err?.message || fallbackMessage;
    setErrorMessage(message);

    if (onApiError) {
      const isKey = message.toLowerCase().includes('key') || message.toLowerCase().includes('missing');
      const isQuota = message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota') || message.includes('429');

      onApiError({
        title: 'Proposal Generation API Request Failed',
        message,
        actionableHint: isKey
          ? 'Check that process.env.GEMINI_API_KEY is configured in your server environment settings.'
          : isQuota
          ? 'API rate limit or quota reached. Please wait a few seconds and click Retry.'
          : 'Check network connectivity and verify target organization details.',
        onRetry: retryFn,
      });
    }
  };

  // Run Image Understanding with gemini-3.1-pro-preview
  const handleAnalyzeImage = async () => {
    if (!uploadedImage) return;

    setAnalyzingImage(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImage.base64,
          mimeType: uploadedImage.mimeType,
          targetOrg: formData.targetOrg,
          prompt: `Analyze this document/photo scan in detail for our partnership proposal with ${formData.targetOrg || 'the target partner'}.`,
        }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Server returned an invalid response (${response.status} ${response.statusText}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Image analysis request failed (${response.status})`);
      }

      setImageAnalysis(data.analysis);
    } catch (err: any) {
      reportApiError(err, 'Image analysis request failed.', () => handleAnalyzeImage());
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Append Image Analysis to Proposal Context
  const handleAttachAnalysisToContext = () => {
    if (!imageAnalysis) return;
    setFormData((prev) => ({
      ...prev,
      baseContext: prev.baseContext
        ? `${prev.baseContext}\n\n[IMAGE/SCAN ANALYSIS (${uploadedImage?.fileName || 'Image'})]:\n${imageAnalysis}`
        : `[IMAGE/SCAN ANALYSIS (${uploadedImage?.fileName || 'Image'})]:\n${imageAnalysis}`,
    }));
  };

  // Run Fast Micro-Tasks with gemini-3.1-flash-lite
  const handleFastTask = async (action: 'summarize' | 'inspect_buzzwords' | 'generate_subject_lines') => {
    if (!proposalDraft) return;

    setFastTaskLoading(true);
    try {
      const response = await fetch('/api/fast-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: proposalDraft,
          targetOrg: formData.targetOrg,
        }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Server returned invalid response (${response.status} ${response.statusText}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Fast assistant request failed (${response.status})`);
      }

      setFastTaskResult({
        type: action,
        content: data.result,
      });
    } catch (err: any) {
      reportApiError(err, 'Fast assistant task failed.', () => handleFastTask(action));
    } finally {
      setFastTaskLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.targetOrg.trim()) {
      setErrorMessage('Please enter a target organization (e.g. Ministry of Education or Partner name).');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setGroundingSources([]);

    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetOrg: formData.targetOrg,
          baseContext: formData.baseContext,
          customInstructions: formData.customInstructions,
          modelChoice: selectedModel,
          useThinkingMode: formData.useThinkingMode,
          useSearchGrounding: formData.useSearchGrounding,
          uploadedImage: uploadedImage ? uploadedImage : undefined,
        }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Server returned invalid response (${response.status} ${response.statusText}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate proposal (${response.status})`);
      }

      setProposalDraft(data.proposal);
      setThinkingActive(!!data.thinkingEnabled);
      if (data.groundingSources && Array.isArray(data.groundingSources)) {
        setGroundingSources(data.groundingSources);
      }
      setViewMode('editor');
    } catch (err: any) {
      reportApiError(err, 'An error occurred while communicating with Gemini API.', () => handleGenerate());
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVault = () => {
    if (!proposalDraft) return;

    const savedItem: SavedProposal = {
      id: Date.now().toString(),
      targetOrg: formData.targetOrg || 'Unnamed Target',
      content: proposalDraft,
      customInstructions: formData.customInstructions,
      createdAt: new Date().toISOString(),
      modelVersion: selectedModel,
      groundingSources,
      thinkingEnabled: thinkingActive,
    };

    onSaveProposal(savedItem);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDocxDownload = async () => {
    await downloadProposalDocx(formData.targetOrg || 'Eduvision_Partner', proposalDraft, customLetterhead);
  };

  return (
    <div className="space-y-6">
      {/* Input Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-slate-100 rounded-lg text-[#0A2540]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A2540]">Draft Official Partnership Proposal</h2>
              <p className="text-xs text-slate-500">
                Data-backed, executive business proposal formatted for official letterhead
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              Agent 1: Executive Drafter
            </span>

            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-sm transition cursor-pointer"
            >
              <Building className="w-4 h-4 text-amber-600" />
              <span>{customLetterhead.useCustom ? 'Custom Letterhead Active' : 'Upload Custom Letterhead'}</span>
              {customLetterhead.useCustom && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-start justify-between shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-red-950">Generation Error</p>
                <p className="leading-relaxed text-red-800">{errorMessage}</p>
                <p className="text-[11px] text-red-700/90 italic">
                  Troubleshooting: Ensure GEMINI_API_KEY is configured in server environment settings, check your target input details, or retry shortly.
                </p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 p-1 font-bold rounded hover:bg-red-100 transition cursor-pointer shrink-0"
              title="Dismiss Error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Gemini Intelligence Feature Controls Bar */}
        <div className="mb-6 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold tracking-wide">Gemini AI Intelligence Settings:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* High Thinking Mode Toggle */}
            <button
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  useThinkingMode: !prev.useThinkingMode,
                  modelVersion: !prev.useThinkingMode ? 'gemini-3.1-pro-preview' : prev.modelVersion,
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                formData.useThinkingMode
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/50 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Activates ThinkingLevel.HIGH on gemini-3.1-pro-preview for deep reasoning"
            >
              <Brain className={`w-3.5 h-3.5 ${formData.useThinkingMode ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>High Thinking Mode (3.1 Pro)</span>
              {formData.useThinkingMode && (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Google Search Grounding Toggle */}
            <button
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  useSearchGrounding: !prev.useSearchGrounding,
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                formData.useSearchGrounding
                  ? 'bg-teal-950/80 text-teal-200 border-teal-500/50 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Queries Google Search in real-time for live news & partner mandates"
            >
              <Globe className={`w-3.5 h-3.5 ${formData.useSearchGrounding ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>Google Search Grounding (3.5 Flash)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Target Org & File Context */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Organization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.targetOrg}
                onChange={(e) => setFormData({ ...formData, targetOrg: e.target.value })}
                placeholder="e.g., Ministry of Education / Corporate Partner / Mastercard Foundation"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540] focus:outline-none transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Base Document / Context Data
                </label>
                {uploadedBaseName && (
                  <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> {uploadedBaseName}
                  </span>
                )}
              </div>
              
              <div className="relative mb-2">
                <input
                  type="file"
                  onChange={handleBaseFileUpload}
                  accept=".docx,.pdf,.txt"
                  className="hidden"
                  id="base-file-upload"
                />
                <label
                  htmlFor="base-file-upload"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-dashed border-slate-300 cursor-pointer transition"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{uploadingBase ? 'Processing Document...' : 'Upload Base Context/Proposal (.docx, .pdf, .txt)'}</span>
                </label>
              </div>

              <textarea
                value={formData.baseContext}
                onChange={(e) => setFormData({ ...formData, baseContext: e.target.value })}
                rows={4}
                placeholder="Paste past proposal text, project metrics, baseline statistics, or regional data..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540] focus:outline-none transition font-mono"
              />
            </div>

            {/* Multimodal Photo/Document Image Upload & Analysis Widget */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Photo & Document Scan Analyzer (Gemini 3.1 Pro Vision)</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  Multimodal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-analyzer-upload"
                />
                <label
                  htmlFor="image-analyzer-upload"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>{uploadedImage ? uploadedImage.fileName : 'Upload Photo / RFP Scan'}</span>
                </label>

                {uploadedImage && (
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={analyzingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition cursor-pointer disabled:opacity-60"
                  >
                    {analyzingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    )}
                    <span>Analyze Image</span>
                  </button>
                )}
              </div>

              {/* Image Preview & Extracted Insights */}
              {uploadedImage && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3 bg-white p-2 rounded border border-slate-200">
                    <img
                      src={uploadedImage.base64}
                      alt="Uploaded Scan"
                      className="w-12 h-12 object-cover rounded border border-slate-300"
                    />
                    <div className="text-xs text-slate-600 truncate flex-1">
                      <p className="font-semibold text-slate-800">{uploadedImage.fileName}</p>
                      <p className="text-[11px] text-slate-500">Ready for Gemini 3.1 Pro visual analysis</p>
                    </div>
                  </div>

                  {imageAnalysis && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900">Extracted Visual Intelligence:</span>
                        <button
                          onClick={handleAttachAnalysisToContext}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded border border-indigo-300 transition cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Attach to Context</span>
                        </button>
                      </div>
                      <div className="text-slate-800 font-sans text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {imageAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Directives & Key Intent */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Key Intent & Directives
              </label>
              <textarea
                value={formData.customInstructions}
                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                rows={7}
                placeholder="e.g., Focus on STEM expansion in Western Region, 50/50 cost matching co-funding model, requesting official accreditation for teacher modules..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540] focus:outline-none transition"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#0A2540] hover:bg-[#00A896] rounded-lg shadow-md transition cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                    <span>
                      {formData.useThinkingMode
                        ? 'Reasoning Deeply (Gemini 3.1 Pro High Thinking)...'
                        : 'Drafting Executive Proposal...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    <span>Generate Proposal Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Output Area */}
      {proposalDraft && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-teal-500/20 rounded text-teal-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Proposal Draft: {formData.targetOrg || 'Executive Draft'}
                  </h3>
                  {thinkingActive && (
                    <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Brain className="w-3 h-3" /> High Thinking
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <BannedWordBadge text={proposalDraft} />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {proposalDraft.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Toggle & Actions */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-800 p-1 rounded-lg flex items-center space-x-1 border border-slate-700">
                <button
                  onClick={() => setViewMode('editor')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition ${
                    viewMode === 'editor' ? 'bg-[#00A896] text-white shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Draft</span>
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition ${
                    viewMode === 'preview' ? 'bg-[#00A896] text-white shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>B&W Letterhead</span>
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                title="Copy Text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleSaveToVault}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition relative"
                title="Save to Vault"
              >
                <Save className="w-4 h-4 text-teal-400" />
                {savedSuccess && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded shadow">
                    Saved!
                  </span>
                )}
              </button>

              {/* PDF Verification Overlay Trigger */}
              <button
                onClick={() => setIsPdfOverlayOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-300 bg-teal-950/80 hover:bg-teal-900 rounded-lg transition border border-teal-500/40 shadow cursor-pointer"
                title="Open interactive PDF formatting verification modal"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
                <span>PDF Overlay</span>
              </button>

              {/* Distraction-Free Print View Toggle */}
              <button
                onClick={() => setIsPrintViewActive(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 shadow cursor-pointer"
                title="Toggle distraction-free Print View simulating exact printed Eduvision letterhead"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print View</span>
              </button>

              <button
                onClick={handleDocxDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word (.docx)</span>
              </button>

              <button
                onClick={() => onTransferToEmail(proposalDraft)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow"
                title="Pass context to Email Manager"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Draft Email →</span>
              </button>
            </div>
          </div>

          {/* Fast AI Micro-Tasks Bar (gemini-3.1-flash-lite) */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Fast AI Micro-Tasks (Gemini 3.1 Flash-Lite):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleFastTask('summarize')}
                disabled={fastTaskLoading}
                className="px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-sm transition cursor-pointer"
              >
                ⚡ 3-Bullet Summary
              </button>
              <button
                onClick={() => handleFastTask('inspect_buzzwords')}
                disabled={fastTaskLoading}
                className="px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-sm transition cursor-pointer"
              >
                ⚡ Buzzword Inspector
              </button>
              <button
                onClick={() => handleFastTask('generate_subject_lines')}
                disabled={fastTaskLoading}
                className="px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-sm transition cursor-pointer"
              >
                ⚡ Fast Subject Lines
              </button>
            </div>
          </div>

          {/* Fast Assistant Micro-Task Output Box */}
          {fastTaskResult && (
            <div className="p-4 bg-amber-50/80 border-b border-amber-200 text-xs text-slate-900 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="capitalize">⚡ Fast Assistant Output ({fastTaskResult.type}):</span>
                <button
                  onClick={() => setFastTaskResult(null)}
                  className="text-amber-700 hover:text-amber-900 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed bg-white p-3 rounded border border-amber-200">
                {fastTaskResult.content}
              </div>
            </div>
          )}

          {/* Verified Google Search Grounding Sources Banner */}
          {groundingSources.length > 0 && (
            <div className="bg-teal-50 border-b border-teal-200 p-3 px-4 text-xs text-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>Verified Google Search Sources (Live Web Grounding):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 px-2.5 py-1 rounded-md transition shadow-sm"
                  >
                    <span>{source.title}</span>
                    <ExternalLink className="w-3 h-3 text-teal-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 bg-slate-50">
            {viewMode === 'editor' ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Review & Editable Document Draft (Simulated B&W Print Area)
                </label>
                <textarea
                  value={proposalDraft}
                  onChange={(e) => setProposalDraft(e.target.value)}
                  rows={20}
                  className="w-full p-6 text-sm font-serif bg-white text-slate-900 border border-slate-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0A2540] leading-relaxed font-normal"
                />
              </div>
            ) : (
              <LetterheadPreview
                targetOrg={formData.targetOrg}
                proposalContent={proposalDraft}
                customLetterhead={customLetterhead}
                onOpenPdfOverlay={() => setIsPdfOverlayOpen(true)}
                onTogglePrintView={() => setIsPrintViewActive(true)}
                onOpenCustomizer={() => setIsCustomizerOpen(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Custom Letterhead Settings & Upload Modal */}
      <LetterheadCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        customLetterhead={customLetterhead}
        onSave={handleSaveLetterhead}
      />

      {/* PDF Verification Modal Overlay */}
      <PdfVerificationOverlay
        isOpen={isPdfOverlayOpen}
        onClose={() => setIsPdfOverlayOpen(false)}
        targetOrg={formData.targetOrg}
        proposalContent={proposalDraft}
        customLetterhead={customLetterhead}
      />

      {/* Distraction-Free Full-Screen Print View */}
      {isPrintViewActive && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex flex-col print:p-0 print:bg-white animate-fade-in">
          {/* Top Floating Action Bar */}
          <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white px-6 py-3 shadow-xl flex items-center justify-between print:hidden">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Full-Screen Letterhead Print Simulation</h3>
                <p className="text-xs text-slate-400">
                  Exact print format view without UI chrome • Ready for PDF export
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 rounded-lg border border-amber-500/40 transition cursor-pointer"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Letterhead Settings</span>
              </button>

              <button
                onClick={() => setIsPdfOverlayOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-teal-300 bg-teal-950/80 hover:bg-teal-900 rounded-lg border border-teal-500/40 transition cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>PDF Margin Overlay</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#00A896] hover:bg-teal-500 rounded-lg shadow transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                onClick={() => setIsPrintViewActive(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Exit Print View</span>
              </button>
            </div>
          </div>

          {/* Centered Printed Sheet Viewport */}
          <div className="flex-1 p-6 md:p-12 overflow-y-auto flex justify-center bg-slate-950 print:p-0 print:bg-white">
            <div className="w-full max-w-4xl">
              <LetterheadPreview
                targetOrg={formData.targetOrg}
                proposalContent={proposalDraft}
                customLetterhead={customLetterhead}
                onOpenCustomizer={() => setIsCustomizerOpen(true)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
