import React, { useState, useEffect } from 'react';
import { ModelVersion, OutreachMode, SavedEmail, GroundingSource } from '../types';
import { BannedWordBadge } from './BannedWordBadge';
import { downloadEmailDocx } from '../utils/docxExport';
import { ApiErrorInfo } from './ApiErrorBanner';
import {
  Mail,
  Send,
  Loader2,
  Copy,
  Check,
  Save,
  Download,
  Sparkles,
  MessageSquare,
  FileText,
  AlertCircle,
  Clock,
  Brain,
  Globe,
  Zap,
  ExternalLink,
  X,
} from 'lucide-react';

interface Props {
  selectedModel: ModelVersion;
  onSaveEmail: (email: SavedEmail) => void;
  autoRefProposalText?: string;
  onApiError?: (error: ApiErrorInfo) => void;
}

export const EmailManager: React.FC<Props> = ({
  selectedModel,
  onSaveEmail,
  autoRefProposalText = '',
  onApiError,
}) => {
  const [emailMode, setEmailMode] = useState<OutreachMode>('Cold / Warm Outreach');
  const [threadInput, setThreadInput] = useState<string>('');
  const [userIntent, setUserIntent] = useState<string>('');
  const [proposalRef, setProposalRef] = useState<string>('');
  const [emailDraft, setEmailDraft] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Gemini 3 Feature States
  const [useThinkingMode, setUseThinkingMode] = useState<boolean>(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [thinkingActive, setThinkingActive] = useState<boolean>(false);

  // Fast Assistant Micro-Tasks (gemini-3.1-flash-lite)
  const [fastTaskLoading, setFastTaskLoading] = useState<boolean>(false);
  const [fastTaskResult, setFastTaskResult] = useState<{ type: string; content: string } | null>(null);

  useEffect(() => {
    if (autoRefProposalText) {
      setProposalRef(autoRefProposalText.slice(0, 1000));
    }
  }, [autoRefProposalText]);

  const reportApiError = (err: any, fallbackMessage: string, retryFn?: () => void) => {
    const message = err?.message || fallbackMessage;
    setErrorMessage(message);

    if (onApiError) {
      const isKey = message.toLowerCase().includes('key') || message.toLowerCase().includes('missing');
      const isQuota = message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota') || message.includes('429');

      onApiError({
        title: 'Diplomatic Email API Request Failed',
        message,
        actionableHint: isKey
          ? 'Check that process.env.GEMINI_API_KEY is configured in server environment settings.'
          : isQuota
          ? 'API rate limit or quota reached. Please wait a few seconds and click Retry.'
          : 'Ensure network connectivity is active and retry your request.',
        onRetry: retryFn,
      });
    }
  };

  const handleGenerateEmail = async () => {
    if (!userIntent.trim()) {
      setErrorMessage('Please specify your core response or objective.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setGroundingSources([]);

    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailMode,
          threadInput,
          userIntent,
          proposalRef,
          modelChoice: selectedModel,
          useThinkingMode,
          useSearchGrounding,
        }),
      });

      const responseText = await response.text();
      let data: any = null;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          // Response is non-JSON
        }
      }

      if (!response.ok) {
        const errorMsg = data?.error || (response.status === 500
          ? 'Server Configuration Error (HTTP 500). Please check that GEMINI_API_KEY environment variable is configured in your server or Vercel settings.'
          : `Failed to generate email (${response.status} ${response.statusText})`);
        throw new Error(errorMsg);
      }

      setEmailDraft(data.email);
      setThinkingActive(!!data.thinkingEnabled);
      if (data.groundingSources && Array.isArray(data.groundingSources)) {
        setGroundingSources(data.groundingSources);
      }
    } catch (err: any) {
      reportApiError(err, 'An error occurred while generating diplomatic response.', () => handleGenerateEmail());
    } finally {
      setLoading(false);
    }
  };

  // Run Fast Micro-Tasks with gemini-3.1-flash-lite
  const handleFastTask = async (action: 'polish_email' | 'generate_subject_lines') => {
    if (!emailDraft && action === 'polish_email') return;

    setFastTaskLoading(true);
    try {
      const response = await fetch('/api/fast-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: emailDraft || userIntent,
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

      if (action === 'polish_email') {
        setEmailDraft(data.result);
      } else {
        setFastTaskResult({
          type: 'Subject Line Ideas',
          content: data.result,
        });
      }
    } catch (err: any) {
      reportApiError(err, 'Fast assistant task failed.', () => handleFastTask(action));
    } finally {
      setFastTaskLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractSubject = (text: string): string => {
    const match = text.match(/Subject:\s*(.*)/i);
    return match ? match[1].trim() : 'Eduvision Partnership Alignment';
  };

  const handleSaveEmail = () => {
    if (!emailDraft) return;

    const savedItem: SavedEmail = {
      id: Date.now().toString(),
      emailMode,
      subject: extractSubject(emailDraft),
      content: emailDraft,
      userIntent,
      createdAt: new Date().toISOString(),
      modelVersion: selectedModel,
      groundingSources,
    };

    onSaveEmail(savedItem);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDocxDownload = async () => {
    await downloadEmailDocx(extractSubject(emailDraft), emailDraft);
  };

  const wordCount = emailDraft ? emailDraft.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-6">
      {/* Input Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-slate-100 rounded-lg text-[#0A2540]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A2540]">Diplomatic Outreach & Thread Manager</h2>
              <p className="text-xs text-slate-500">
                High-converting, zero-fluff institutional emails under 200 words
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
            Agent 2: Chief Communications Officer
          </span>
        </div>

        {errorMessage && (
          <div className="mb-5 p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-start justify-between shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-red-950">Generation Error</p>
                <p className="leading-relaxed text-red-800">{errorMessage}</p>
                <p className="text-[11px] text-red-700/90 italic">
                  Troubleshooting: Ensure GEMINI_API_KEY is configured in server environment settings, verify your core objective input, or retry shortly.
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

        {/* Gemini Intelligence Settings Bar */}
        <div className="mb-6 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold tracking-wide">Gemini AI Intelligence Settings:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => setUseThinkingMode(!useThinkingMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                useThinkingMode
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/50 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Activates ThinkingLevel.HIGH on gemini-3.1-pro-preview for complex diplomacy"
            >
              <Brain className={`w-3.5 h-3.5 ${useThinkingMode ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>High Thinking Mode (3.1 Pro)</span>
            </button>

            <button
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                useSearchGrounding
                  ? 'bg-teal-950/80 text-teal-200 border-teal-500/50 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Queries Google Search in real-time for partner background & live news"
            >
              <Globe className={`w-3.5 h-3.5 ${useSearchGrounding ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>Google Search Grounding (3.5 Flash)</span>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Outreach Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Outreach Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setEmailMode('Cold / Warm Outreach')}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                  emailMode === 'Cold / Warm Outreach'
                    ? 'bg-slate-900 border-slate-900 text-white shadow'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="emailMode"
                  checked={emailMode === 'Cold / Warm Outreach'}
                  onChange={() => {}}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  <Mail className={`w-4 h-4 ${emailMode === 'Cold / Warm Outreach' ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Cold / Warm Outreach</span>
                </div>
              </label>

              <label
                onClick={() => setEmailMode('Thread Reply & Negotiation')}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                  emailMode === 'Thread Reply & Negotiation'
                    ? 'bg-slate-900 border-slate-900 text-white shadow'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="emailMode"
                  checked={emailMode === 'Thread Reply & Negotiation'}
                  onChange={() => {}}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  <MessageSquare
                    className={`w-4 h-4 ${emailMode === 'Thread Reply & Negotiation' ? 'text-teal-400' : 'text-slate-500'}`}
                  />
                  <span className="text-xs font-bold">Thread Reply & Negotiation</span>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Thread Input */}
          {emailMode === 'Thread Reply & Negotiation' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Paste Incoming Email Thread Context
              </label>
              <textarea
                value={threadInput}
                onChange={(e) => setThreadInput(e.target.value)}
                rows={4}
                placeholder="Paste incoming message from partner, government official, or sponsor..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540] focus:outline-none transition font-sans"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Core Response Objective */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                User Objective & Core Response <span className="text-red-500">*</span>
              </label>
              <textarea
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                rows={5}
                placeholder="e.g., Thank them for the review, confirm our willingness to co-match 50% funding, and request a 20-minute alignment call next Tuesday at 10 AM GMT..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540] focus:outline-none transition"
              />
            </div>

            {/* Reference Proposal Summary */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reference Proposal Context (Auto-Linked)
                </label>
                {proposalRef && (
                  <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Linked from Agent 1
                  </span>
                )}
              </div>
              <textarea
                value={proposalRef}
                onChange={(e) => setProposalRef(e.target.value)}
                rows={5}
                placeholder="Proposal reference details, key metrics, budget points..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540] focus:outline-none transition font-sans"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateEmail}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#FF5722] hover:bg-[#E04818] rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Drafting Diplomatic Response...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Draft Email Response</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Draft Section */}
      {emailDraft && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-teal-500/20 rounded text-teal-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{extractSubject(emailDraft)}</h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <BannedWordBadge text={emailDraft} />
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      wordCount <= 220 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {wordCount} words {wordCount <= 220 ? '(Optimal Conciseness)' : '(Over 220 word target)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Email'}</span>
              </button>

              <button
                onClick={handleSaveEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition relative"
              >
                <Save className="w-3.5 h-3.5 text-teal-400" />
                <span>Save Draft</span>
                {savedSuccess && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded shadow">
                    Saved!
                  </span>
                )}
              </button>

              <button
                onClick={handleDocxDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word (.docx)</span>
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
                onClick={() => handleFastTask('polish_email')}
                disabled={fastTaskLoading}
                className="px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-sm transition cursor-pointer"
              >
                ⚡ Ultra-Concise Polish
              </button>
              <button
                onClick={() => handleFastTask('generate_subject_lines')}
                disabled={fastTaskLoading}
                className="px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-sm transition cursor-pointer"
              >
                ⚡ 3 Subject Line Options
              </button>
            </div>
          </div>

          {/* Fast Assistant Output Box */}
          {fastTaskResult && (
            <div className="p-4 bg-amber-50/80 border-b border-amber-200 text-xs text-slate-900 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>⚡ Fast Assistant Output ({fastTaskResult.type}):</span>
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

          {/* Grounding Sources Banner */}
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

          <div className="p-6 bg-slate-50">
            <textarea
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              rows={12}
              className="w-full p-5 text-sm font-sans bg-white text-slate-900 border border-slate-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0A2540] leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
};
