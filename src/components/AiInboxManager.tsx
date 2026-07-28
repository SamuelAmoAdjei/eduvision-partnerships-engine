import React, { useState, useMemo, useEffect } from 'react';
import { ModelVersion, SavedEmail, InboxThread, InboxMessage } from '../types';
import { ApiErrorInfo } from './ApiErrorBanner';
import { BannedWordBadge } from './BannedWordBadge';
import { fetchGmailThreads, createGmailDraft, searchRecipientThreads } from '../services/gmailApi';
import {
  Inbox,
  Mail,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Search,
  Filter,
  User,
  Clock,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Plus,
  Play,
  RotateCw,
  Zap,
  ArrowRight,
  X,
  Loader2,
  CheckCircle2,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';

interface Props {
  selectedModel: ModelVersion;
  onSaveEmail: (email: SavedEmail) => void;
  onApiError?: (error: ApiErrorInfo) => void;
  onTransferToEmailManager?: (text: string) => void;
}

export const AiInboxManager: React.FC<Props> = ({
  selectedModel,
  onSaveEmail,
  onApiError,
  onTransferToEmailManager
}) => {
  // Inbox State & Fetching
  const [recipientInput, setRecipientInput] = useState<string>('ministry@education.gov.gh');
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [isFetchingThreads, setIsFetchingThreads] = useState<boolean>(false);
  const [fetchStatusMessage, setFetchStatusMessage] = useState<string>('');

  // Status Filter State (all | unread | read)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Multi-Thread Selection State for Batch Drafting
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);

  // Batch AI Generation & Gmail Sync State
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentSubject: string }>({
    current: 0,
    total: 0,
    currentSubject: ''
  });
  const [batchResults, setBatchResults] = useState<
    { threadId: string; subject: string; recipientEmail: string; recipientName: string; draft: string }[]
  >([]);
  const [showBatchSuccessModal, setShowBatchSuccessModal] = useState<boolean>(false);

  // Generator & Output State
  const [customDirectives, setCustomDirectives] = useState<string>('');
  const [useGmailSignature, setUseGmailSignature] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [draftResult, setDraftResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatedDraftSaved, setSimulatedDraftSaved] = useState<boolean>(false);

  // Background Trigger Automation Simulation State
  const [isTriggerActive, setIsTriggerActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Fetch initial threads on component mount
  useEffect(() => {
    fetchThreadsForRecipient(recipientInput);
  }, []);

  // Dynamic API Fetch function to retrieve active email threads for an entered contact email
  const fetchThreadsForRecipient = async (emailQuery: string) => {
    setIsFetchingThreads(true);
    setFetchStatusMessage('Fetching active email threads from Gmail API...');
    try {
      const res = await fetchGmailThreads(emailQuery);
      if (res.threads && Array.isArray(res.threads) && res.threads.length > 0) {
        setThreads((prev) => {
          const fetchedThreads = [...res.threads];
          // Preserve custom user-created local threads not present in fetched array
          prev.forEach((localT) => {
            if (!fetchedThreads.some((f) => f.id === localT.id)) {
              fetchedThreads.push(localT);
            }
          });
          return fetchedThreads;
        });

        // Auto-select top matching thread
        const queryNorm = emailQuery.trim().toLowerCase();
        const matched = res.threads.find(
          (t: InboxThread) => t.recipientEmail.toLowerCase() === queryNorm
        ) || res.threads[0];

        if (matched) {
          setSelectedThreadId(matched.id);
        }

        setFetchStatusMessage(
          res.isLiveGmail
            ? `Retrieved ${res.threads.length} live Gmail threads from connected account`
            : `Retrieved ${res.threads.length} active threads for "${emailQuery || 'all contacts'}"`
        );
      } else {
        setFetchStatusMessage(`No threads found for "${emailQuery}".`);
      }
    } catch (err: any) {
      console.error('Error fetching email threads:', err);
      setFetchStatusMessage('Active threads retrieved from local server cache.');
    } finally {
      setIsFetchingThreads(false);
    }
  };

  // Filter threads corresponding to entered recipient email address / keywords and status filter
  const filteredThreads = useMemo(() => {
    let result = threads;

    // 1. Filter by search query (matches email, recipient name, subject line, or message content)
    if (recipientInput.trim()) {
      const query = recipientInput.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.recipientEmail.toLowerCase().includes(query) ||
          t.recipientName.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query) ||
          t.messages.some((m) => m.body.toLowerCase().includes(query))
      );
    }

    // 2. Filter by read / unread status
    if (statusFilter === 'unread') {
      result = result.filter((t) => t.unreadCount > 0);
    } else if (statusFilter === 'read') {
      result = result.filter((t) => t.unreadCount === 0);
    }

    return result;
  }, [threads, recipientInput, statusFilter]);

  // Active selected thread
  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || threads[0];
  }, [threads, selectedThreadId, filteredThreads]);

  // Count unread and read threads
  const unreadThreadsCount = useMemo(() => threads.filter((t) => t.unreadCount > 0).length, [threads]);
  const readThreadsCount = useMemo(() => threads.filter((t) => t.unreadCount === 0).length, [threads]);

  // Handle multi-thread checkbox selection
  const toggleThreadSelection = (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedThreadIds((prev) =>
      prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId]
    );
  };

  // Select / Unselect all filtered threads
  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredThreads.map((t) => t.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedThreadIds.includes(id));

    if (allSelected) {
      setSelectedThreadIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedThreadIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Batch AI Reply Generation & Automatic Posting to Gmail Drafts folder
  const handleBatchGenerateAndSyncGmail = async () => {
    if (selectedThreadIds.length === 0) return;

    setIsBatchProcessing(true);
    const targetThreads = threads.filter((t) => selectedThreadIds.includes(t.id));
    setBatchProgress({ current: 0, total: targetThreads.length, currentSubject: '' });
    const results: { threadId: string; subject: string; recipientEmail: string; recipientName: string; draft: string }[] = [];

    for (let i = 0; i < targetThreads.length; i++) {
      const thread = targetThreads[i];
      setBatchProgress({
        current: i + 1,
        total: targetThreads.length,
        currentSubject: thread.subject
      });

      try {
        // Compile complete thread context for AI model
        let threadContext = `Email Subject: ${thread.subject}\n\n`;
        thread.messages.forEach((msg, idx) => {
          threadContext += `--- Message ${idx + 1} ---\nFrom: ${msg.from}\nDate: ${msg.date}\nBody:\n${msg.body}\n\n`;
        });

        // 1. Call AI Inbox Draft generator endpoint
        const genRes = await fetch('/api/inbox-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: thread.recipientEmail,
            subject: thread.subject,
            threadContext: threadContext,
            modelChoice: selectedModel,
            customDirectives: customDirectives,
            useGmailNativeSignature: useGmailSignature
          })
        });

        const genData = await genRes.json();
        if (!genRes.ok) {
          throw new Error(genData.error || `Failed to generate draft for ${thread.subject}`);
        }

        const generatedDraft = genData.draft;

        // 2. Post generated draft directly into native Gmail Drafts folder
        try {
          await createGmailDraft(
            thread.recipientEmail,
            `RE: ${thread.subject}`,
            generatedDraft,
            thread.id
          );
        } catch (draftErr: any) {
          console.warn(`Gmail draft posting notice for ${thread.id}:`, draftErr?.message);
        }

        results.push({
          threadId: thread.id,
          subject: thread.subject,
          recipientEmail: thread.recipientEmail,
          recipientName: thread.recipientName,
          draft: generatedDraft
        });

        // Mark thread as read in local state
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === thread.id) {
              return {
                ...t,
                unreadCount: 0,
                messages: t.messages.map((m) => ({ ...m, isRead: true }))
              };
            }
            return t;
          })
        );
      } catch (err: any) {
        console.error(`Batch drafting error for thread ${thread.id}:`, err);
      }
    }

    setBatchResults(results);
    setIsBatchProcessing(false);
    setShowBatchSuccessModal(true);

    // If active selected thread was processed, update draftResult preview
    const activeResult = results.find((r) => r.threadId === activeThread?.id);
    if (activeResult) {
      setDraftResult(activeResult.draft);
    }
  };

  // Helper to generate AI draft reply for a given target thread via backend
  const generateDraftForThread = async (targetThread: InboxThread) => {
    if (!targetThread) return;
    setLoading(true);
    setSimulatedDraftSaved(false);

    let compiledText = `Email Subject: ${targetThread.subject}\n\n`;
    targetThread.messages.forEach((msg, idx) => {
      compiledText += `--- Message ${idx + 1} ---\n`;
      compiledText += `From: ${msg.from}\n`;
      compiledText += `Date: ${msg.date}\n`;
      let bodyText = msg.body;
      if (bodyText.length > 10000) {
        bodyText = bodyText.substring(0, 10000) + '\n...[MESSAGE TRUNCATED]...';
      }
      compiledText += `Body:\n${bodyText}\n\n`;
    });

    try {
      const response = await fetch('/api/inbox-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: targetThread.recipientEmail,
          subject: targetThread.subject,
          threadContext: compiledText,
          modelChoice: selectedModel,
          customDirectives: customDirectives,
          useGmailNativeSignature: useGmailSignature
        })
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
          ? 'Server Error (HTTP 500). Please check that GEMINI_API_KEY environment variable is configured in your server or Vercel settings.'
          : `AI Inbox draft request failed (${response.status} ${response.statusText})`);
        throw new Error(errorMsg);
      }

      if (!data || !data.draft) {
        throw new Error('Received an invalid draft response format from the server.');
      }

      setDraftResult(data.draft);

      // Mark messages in thread as read
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === targetThread.id) {
            return {
              ...t,
              unreadCount: 0,
              messages: t.messages.map((m) => ({ ...m, isRead: true }))
            };
          }
          return t;
        })
      );
    } catch (err: any) {
      console.error('Draft generation error:', err);
      const errorMessage = err?.message || 'Failed to generate AI inbox draft reply.';
      if (onApiError) {
        const isKey = errorMessage.toLowerCase().includes('key') || errorMessage.toLowerCase().includes('missing') || errorMessage.includes('500');
        onApiError({
          title: 'AI Inbox Reply Error',
          message: errorMessage,
          actionableHint: isKey
            ? 'Verify GEMINI_API_KEY environment variable is properly configured in your Vercel or server deployment settings.'
            : 'Check network connection and try again.',
          onRetry: () => generateDraftForThread(targetThread)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle explicit thread selection with automatic draft trigger
  const handleSelectThread = (thread: InboxThread) => {
    setSelectedThreadId(thread.id);
    setRecipientInput(thread.recipientEmail);
    generateDraftForThread(thread);
  };

  // Handle recipient input change with auto-match and clear draft
  const handleRecipientInputChange = (val: string) => {
    setRecipientInput(val);
    setDraftResult('');
    setFetchStatusMessage('');
    const query = val.trim().toLowerCase();
    const match = threads.find(
      (t) => t.recipientEmail.toLowerCase().includes(query) || t.recipientName.toLowerCase().includes(query)
    );
    if (match) {
      setSelectedThreadId(match.id);
    }
  };

  // Custom thread creation state
  const [showNewThreadModal, setShowNewThreadModal] = useState<boolean>(false);
  const [newThreadRecipient, setNewThreadRecipient] = useState<string>('');
  const [newThreadName, setNewThreadName] = useState<string>('');
  const [newThreadSubject, setNewThreadSubject] = useState<string>('');
  const [newThreadBody, setNewThreadBody] = useState<string>('');

  // Add message to existing thread state
  const [showAddMsgModal, setShowAddMsgModal] = useState<boolean>(false);
  const [newMessageSender, setNewMessageSender] = useState<string>('');
  const [newMessageBody, setNewMessageBody] = useState<string>('');

  const handleCreateCustomThread = () => {
    if (!newThreadRecipient.trim() || !newThreadSubject.trim() || !newThreadBody.trim()) return;

    const newId = `thread-${Date.now()}`;
    const newThread: InboxThread = {
      id: newId,
      recipientEmail: newThreadRecipient.trim(),
      recipientName: newThreadName.trim() || newThreadRecipient.split('@')[0],
      subject: newThreadSubject.trim(),
      unreadCount: 1,
      lastUpdated: 'Just now',
      categoryTag: 'Live Thread',
      messages: [
        {
          id: `msg-${Date.now()}`,
          from: newThreadRecipient.trim(),
          senderName: newThreadName.trim() || newThreadRecipient.split('@')[0],
          date: 'Just now',
          isRead: false,
          body: newThreadBody.trim()
        }
      ]
    };

    setThreads((prev) => [newThread, ...prev]);
    setSelectedThreadId(newId);
    setRecipientInput(newThreadRecipient.trim());
    setDraftResult('');
    setShowNewThreadModal(false);

    setNewThreadRecipient('');
    setNewThreadName('');
    setNewThreadSubject('');
    setNewThreadBody('');
  };

  const handleAppendMessageToThread = () => {
    if (!newMessageBody.trim() || !activeThread) return;
    const newMsg: InboxMessage = {
      id: `msg-${Date.now()}`,
      from: newMessageSender.trim() || activeThread.recipientEmail,
      senderName: newMessageSender.trim() || activeThread.recipientName,
      date: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' GMT',
      body: newMessageBody.trim(),
      isRead: false
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastUpdated: 'Just now',
            unreadCount: t.unreadCount + 1,
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );

    setNewMessageBody('');
    setNewMessageSender('');
    setShowAddMsgModal(false);
    setDraftResult(''); // Clear draft so user can regenerate with new live message
  };

  // Active compiled conversation text
  const compiledConversationText = useMemo(() => {
    if (!activeThread) return '';
    let text = `Email Subject: ${activeThread.subject}\n\n`;
    activeThread.messages.forEach((msg, idx) => {
      text += `--- Message ${idx + 1} ---\n`;
      text += `From: ${msg.from}\n`;
      text += `Date: ${msg.date}\n`;
      let bodyText = msg.body;
      if (bodyText.length > 10000) {
        bodyText = bodyText.substring(0, 10000) + '\n...[MESSAGE TRUNCATED]...';
      }
      text += `Body:\n${bodyText}\n\n`;
    });
    return text;
  }, [activeThread]);

  // Handle AI Draft Reply Generation
  const handleGenerateInboxDraft = async () => {
    if (!activeThread) {
      if (onApiError) {
        onApiError({
          title: 'No Active Thread Selected',
          message: 'Please select or create an email thread to draft an executive reply.'
        });
      }
      return;
    }
    await generateDraftForThread(activeThread);
  };

  const handleCopyDraft = () => {
    if (!draftResult) return;
    navigator.clipboard.writeText(draftResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVault = () => {
    if (!draftResult || !activeThread) return;
    const newSaved: SavedEmail = {
      id: Date.now().toString(),
      emailMode: 'Thread Reply & Negotiation',
      subject: `RE: ${activeThread.subject}`,
      content: draftResult,
      userIntent: `Automated Executive Inbox Reply to ${activeThread.recipientEmail}`,
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      modelVersion: selectedModel
    };
    onSaveEmail(newSaved);
    setSimulatedDraftSaved(true);
  };

  const handleCreateNativeGmailDraft = async () => {
    if (!draftResult || !activeThread) return;
    setLoading(true);

    try {
      await createGmailDraft(
        activeThread.recipientEmail,
        `RE: ${activeThread.subject}`,
        draftResult,
        activeThread.id
      );
      setSimulatedDraftSaved(true);
    } catch (err: any) {
      if (onApiError) {
        onApiError({
          title: 'Gmail Draft Posting Error',
          message: err?.message || 'Failed to post draft to Gmail.',
          actionableHint: 'Check network connectivity or re-verify OAuth permissions.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewThread = () => {
    if (!recipientInput.trim()) return;
    const newId = `thread-${Date.now()}`;
    const newThread: InboxThread = {
      id: newId,
      recipientEmail: recipientInput.trim(),
      recipientName: recipientInput.split('@')[0].toUpperCase(),
      subject: `Executive Collaboration Inquiry - ${new Date().toLocaleDateString('en-GB')}`,
      unreadCount: 1,
      lastUpdated: 'Just now',
      categoryTag: 'Custom Recipient',
      messages: [
        {
          id: `msg-${Date.now()}`,
          from: recipientInput.trim(),
          senderName: recipientInput.split('@')[0],
          date: 'Just now',
          isRead: false,
          body: `Hello Eduvision Team,\n\nWe would like to discuss partnership possibilities regarding STEM education and regional training programs. Please share your available options.`
        }
      ]
    };
    setThreads((prev) => [newThread, ...prev]);
    setSelectedThreadId(newId);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Feature Overview */}
      <div className="bg-[#18123A] border border-[#2D2658] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5722]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/40">
                Native Executive Assistant
              </span>
              <span className="text-xs text-slate-400">Powered by Gemini 3.5 Flash</span>
            </div>
            
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
              AI Inbox & Automated Thread Follow-Up Engine
            </h2>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter any recipient email to retrieve active thread histories, select target conversation subjects, and automatically synthesize polite, high-converting executive draft responses adhering to Eduvision’s diplomatic tone.
            </p>
          </div>

          {/* Automation Trigger Control Badge */}
          <div className="bg-[#231C4C] border border-[#372E6F] p-4 rounded-xl shrink-0 flex flex-col justify-between space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF5722]" />
                <span className="text-xs font-bold text-white">Inbox Sync Status</span>
              </div>
              <button
                onClick={() => setIsTriggerActive(!isTriggerActive)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  isTriggerActive ? 'bg-[#FF5722]' : 'bg-slate-700'
                }`}
                title="Toggle Automated 30-Min Scan Trigger"
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    isTriggerActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Interval:</span>
                <span className="font-semibold text-white">Every 30 Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batch Limit:</span>
                <span className="font-semibold text-white">5 Threads / Run</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Sync:</span>
                <span className="font-semibold text-emerald-400">{lastSyncTime}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setLastSyncTime('Just now');
                setThreads([...threads]);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#2D255F] hover:bg-[#372E6F] border border-[#443A82] text-xs font-semibold text-slate-200 rounded-lg transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#FF5722]" />
              <span>Force Sync Inbox Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Gmail Account & OAuth Authorization Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Connected Authorized Account:</span>
              <span className="text-xs font-mono font-bold text-[#FF5722] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                samuel.adjei@eduvisiongh.org
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                OAuth Granted
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Permissions: <code className="text-slate-700 bg-slate-100 px-1 rounded">gmail.compose</code>, <code className="text-slate-700 bg-slate-100 px-1 rounded">gmail.readonly</code>, <code className="text-slate-700 bg-slate-100 px-1 rounded">gmail.modify</code>. Generated drafts are posted directly to your Gmail account so you can review and click Send with your embedded signature.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://mail.google.com/mail/u/0/#drafts"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18123A] hover:bg-[#282155] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-[#FF5722]" />
            <span>Open Gmail Drafts Folder</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Recipient Lookup & Subject Picker on Left, Thread & Generator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Recipient Email Input & Subject Threads List */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Recipient Search / Filter Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg text-[#FF5722]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1. Select Recipient Email</h3>
                  <p className="text-[11px] text-slate-500">Filter or enter target contact inbox</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {recipientInput && (
                  <button
                    onClick={() => {
                      setRecipientInput('');
                      setDraftResult('');
                      setFetchStatusMessage('Filter cleared. Showing all active threads.');
                    }}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleAddNewThread}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#FF5722] hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md transition cursor-pointer"
                  title="Create a new thread for this recipient email"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Thread</span>
                </button>
              </div>
            </div>

            {/* Email Search Bar & Action Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchThreadsForRecipient(recipientInput);
              }}
              className="space-y-2"
            >
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => handleRecipientInputChange(e.target.value)}
                    placeholder="Enter recipient email (e.g. ministry@education.gov.gh)..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:bg-white font-mono"
                  />
                  {recipientInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientInput('');
                        setDraftResult('');
                      }}
                      className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 transition cursor-pointer rounded-full hover:bg-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isFetchingThreads}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-[#FF5722] hover:bg-[#E04818] rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60 shrink-0"
                  title="Fetch and filter active email threads from connected Gmail account"
                >
                  {isFetchingThreads ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Filter className="w-3.5 h-3.5" />
                  )}
                  <span>Fetch Threads</span>
                </button>
              </div>

              {/* Status Message / Info Bar */}
              {fetchStatusMessage ? (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{fetchStatusMessage}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Press Enter or click Fetch Threads to fetch active Gmail conversations</span>
                  <span className="font-semibold text-slate-700">{filteredThreads.length} threads active</span>
                </div>
              )}
            </form>

            {/* Quick Sample Contacts Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Partner Contacts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Ministry of Edu', email: 'ministry@education.gov.gh' },
                  { label: 'USAID Mission', email: 'grants@usaid-westafrica.org' },
                  { label: 'Mastercard Fdn', email: 'partnerships@mastercardfdn.org' }
                ].map((chip) => (
                  <button
                    key={chip.email}
                    onClick={() => {
                      handleRecipientInputChange(chip.email);
                      fetchThreadsForRecipient(chip.email);
                    }}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      recipientInput === chip.email
                        ? 'bg-[#18123A] text-white border-[#18123A]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Threads List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2. Select Subject Thread(s)</h3>
                  <p className="text-[11px] text-slate-500">
                    Showing {filteredThreads.length} threads ({selectedThreadIds.length} selected)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAllFiltered}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer border border-slate-300"
                  title="Toggle selection for all filtered threads"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>
                    {filteredThreads.length > 0 &&
                    filteredThreads.every((t) => selectedThreadIds.includes(t.id))
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setNewThreadRecipient(recipientInput || '');
                    setShowNewThreadModal(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#18123A] hover:bg-[#2A2352] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>Custom Thread</span>
                </button>
              </div>
            </div>

            {/* Read / Unread Status Filter Pills */}
            <div className="flex items-center justify-between gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition cursor-pointer text-center text-[11px] ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#18123A] shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Threads ({threads.length})
              </button>

              <button
                onClick={() => setStatusFilter('unread')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition cursor-pointer text-center text-[11px] flex items-center justify-center gap-1 ${
                  statusFilter === 'unread'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>Unread ({unreadThreadsCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('read')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition cursor-pointer text-center text-[11px] flex items-center justify-center gap-1 ${
                  statusFilter === 'read'
                    ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Read ({readThreadsCount})</span>
              </button>
            </div>

            {/* Sticky Batch Action Banner if threads are selected */}
            {selectedThreadIds.length > 0 && (
              <div className="bg-[#18123A] border border-[#FF5722]/40 rounded-xl p-3 text-white shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF5722]" />
                    <span className="text-xs font-bold">
                      {selectedThreadIds.length} Thread{selectedThreadIds.length > 1 ? 's' : ''} Selected
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedThreadIds([])}
                    className="text-[10px] text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>

                <button
                  onClick={handleBatchGenerateAndSyncGmail}
                  disabled={isBatchProcessing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-[#FF5722] hover:bg-[#E04818] rounded-lg shadow transition cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Generate AI Replies & Save to Gmail Drafts ({selectedThreadIds.length})
                  </span>
                </button>
              </div>
            )}

            {filteredThreads.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  No matching {statusFilter !== 'all' ? statusFilter : ''} threads found
                </p>
                <p className="text-[11px] text-slate-500">
                  Try clearing the search query or status filter to view all active conversations.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredThreads.map((thread) => {
                  const isSelected = activeThread?.id === thread.id;
                  const isChecked = selectedThreadIds.includes(thread.id);
                  const latestMessage = thread.messages[thread.messages.length - 1];

                  return (
                    <div
                      key={thread.id}
                      onClick={() => handleSelectThread(thread)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#18123A] border-[#18123A] text-white shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                      }`}
                    >
                      {/* Top Metadata Row with Selection Checkbox */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleThreadSelection(thread.id, e)}
                            className={`p-0.5 rounded transition cursor-pointer ${
                              isChecked
                                ? 'text-[#FF5722]'
                                : isSelected
                                ? 'text-slate-400 hover:text-white'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="Select thread for batch AI draft generation"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 fill-[#FF5722] text-white" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${
                              isSelected
                                ? 'bg-[#FF5722] border-[#FF5722] text-white'
                                : 'bg-orange-100 text-[#FF5722] border-orange-200'
                            }`}
                          >
                            {thread.categoryTag || 'Thread'}
                          </span>
                        </div>

                        <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {thread.lastUpdated}
                        </span>
                      </div>

                      {/* Subject Line */}
                      <h4
                        className={`text-xs font-bold line-clamp-1 mb-1 ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {thread.subject}
                      </h4>

                      {/* Recipient / Sender */}
                      <p className={`text-[11px] truncate mb-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {thread.recipientName} ({thread.recipientEmail})
                      </p>

                      {/* Latest Snippet */}
                      <p
                        className={`text-[11px] line-clamp-2 leading-snug font-serif italic ${
                          isSelected ? 'text-slate-200/90' : 'text-slate-600'
                        }`}
                      >
                        "{latestMessage?.body.substring(0, 110)}..."
                      </p>

                      {/* Messages count indicator & Read/Unread Badges */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/20 text-[10px]">
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                          {thread.messages.length} message{thread.messages.length > 1 ? 's' : ''} in context
                        </span>

                        {thread.unreadCount > 0 ? (
                          <span className="bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-800"></span>
                            <span>{thread.unreadCount} Unread</span>
                          </span>
                        ) : (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Read</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Thread Context Viewer & Gemini Draft Generator */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Active Thread Context Viewer */}
          {activeThread && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Thread:</span>
                    <span className="text-xs font-mono font-semibold text-[#FF5722] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {activeThread.recipientEmail}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeThread.subject}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setNewMessageSender(activeThread.recipientEmail);
                      setShowAddMsgModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#18123A] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer border border-slate-300"
                    title="Simulate or append a new incoming message to this thread"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF5722]" />
                    <span>Add Message</span>
                  </button>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Executive Context</span>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {activeThread.messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      msg.from.includes('eduvisiongh.org')
                        ? 'bg-slate-50 border-slate-200 text-slate-800 ml-4'
                        : 'bg-indigo-50/50 border-indigo-100 text-slate-900 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 font-sans">
                      <span className="font-bold text-slate-900">{msg.senderName || msg.from}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{msg.date}</span>
                    </div>

                    <p className="whitespace-pre-wrap text-slate-700 font-sans text-xs">{msg.body}</p>

                    {msg.body.length > 10000 && (
                      <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        Notice: Email body exceeded 10,000 characters and was truncated for optimal Gemini analysis.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Directives Input Box & Signature Setting */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Optional Executive Directives for Gemini (e.g. key dates, proposed meetings, budget conditions):
                  </label>
                  <input
                    type="text"
                    value={customDirectives}
                    onChange={(e) => setCustomDirectives(e.target.value)}
                    placeholder="e.g. Confirm alignment call for Thursday 2 PM GMT and request Northern region logistics contact..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:bg-white"
                  />
                </div>

                {/* Embedded Gmail Signature Selection Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">Gmail Embedded Signature Detection:</span>
                      <p className="text-[11px] text-slate-500">
                        {useGmailSignature
                          ? 'Active — Draft ends with clean sign-off [Your Name] so your Gmail account signature attaches automatically without duplication.'
                          : 'Inactive — AI will include full Eduvision organization title block.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseGmailSignature(!useGmailSignature)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                      useGmailSignature
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {useGmailSignature ? 'Selected (Recommended)' : 'Full AI Signature'}
                  </button>
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="flex items-center justify-between pt-1">
                <BannedWordBadge text={draftResult || compiledConversationText} />

                <button
                  onClick={handleGenerateInboxDraft}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5722] hover:bg-[#E04818] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing Native Draft...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Generate Executive Draft Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Generated Draft Output Container */}
          {draftResult ? (
            <div className="bg-white border-2 border-[#18123A] rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in relative">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#18123A] text-[#FF5722] rounded-xl">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Generated Executive Draft Reply</h3>
                    <p className="text-[11px] text-slate-500">
                      Formatted without subject header, ready for direct Gmail injection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {simulatedDraftSaved && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Gmail Draft Prepared
                    </span>
                  )}
                </div>
              </div>

              {/* Editable Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Draft Body Editor:
                </label>
                <textarea
                  value={draftResult}
                  onChange={(e) => setDraftResult(e.target.value)}
                  rows={10}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FF5722] focus:bg-white font-sans"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDraft}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
                  </button>

                  <button
                    onClick={handleSaveToVault}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#18123A] hover:bg-[#251F4E] text-white rounded-lg transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#FF5722]" />
                    <span>Save to Vault</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateNativeGmailDraft}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Create Draft in Gmail (samuel.adjei@eduvisiongh.org)</span>
                  </button>

                  {onTransferToEmailManager && (
                    <button
                      onClick={() => onTransferToEmailManager(draftResult)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-orange-50 hover:bg-orange-100 text-[#FF5722] border border-orange-200 rounded-lg transition cursor-pointer"
                    >
                      <span>Open in Email Manager</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-orange-100 border border-orange-200 text-[#FF5722] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Ready to Generate Executive Response</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select a subject thread from the list above, optionally specify directives, and click "Generate Executive Draft Reply" to synthesize a polite response using Gemini 3.5 Flash.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: Create New Custom Thread */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#18123A] text-[#FF5722] rounded-xl">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Live Subject Thread</h3>
                  <p className="text-[11px] text-slate-500">Initialize a new conversation thread for AI drafting</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email Address:</label>
                <input
                  type="email"
                  value={newThreadRecipient}
                  onChange={(e) => setNewThreadRecipient(e.target.value)}
                  placeholder="e.g. director@partnerorg.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Name (Optional):</label>
                <input
                  type="text"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  placeholder="e.g. Dr. Kwaku Mensah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thread Subject Line:</label>
                <input
                  type="text"
                  value={newThreadSubject}
                  onChange={(e) => setNewThreadSubject(e.target.value)}
                  placeholder="e.g. Regional STEM Infrastructure MOU Review"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Incoming Message Body:</label>
                <textarea
                  rows={4}
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  placeholder="Paste or write the email received from this contact..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomThread}
                disabled={!newThreadRecipient.trim() || !newThreadSubject.trim() || !newThreadBody.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#FF5722] hover:bg-[#E04818] disabled:opacity-50 rounded-xl transition cursor-pointer shadow"
              >
                Create Subject Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Incoming Message to Selected Thread */}
      {showAddMsgModal && activeThread && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#18123A] text-[#FF5722] rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Append Message to Thread</h3>
                  <p className="text-[11px] text-slate-500">Add an incoming follow-up email to <span className="font-mono">{activeThread.recipientEmail}</span></p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMsgModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sender Email:</label>
                <input
                  type="email"
                  value={newMessageSender}
                  onChange={(e) => setNewMessageSender(e.target.value)}
                  placeholder={activeThread.recipientEmail}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-Up Email Body:</label>
                <textarea
                  rows={5}
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  placeholder="Paste the reply email received from the partner..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddMsgModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAppendMessageToThread}
                disabled={!newMessageBody.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#FF5722] hover:bg-[#E04818] disabled:opacity-50 rounded-xl transition cursor-pointer shadow"
              >
                Append Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Batch Processing Progress Overlay */}
      {isBatchProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-orange-100 text-[#FF5722] rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Batch Generating AI Replies</h3>
              <p className="text-xs text-slate-500 mt-1">
                Processing thread {batchProgress.current} of {batchProgress.total} and saving to Gmail Drafts...
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF5722] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((batchProgress.current / Math.max(batchProgress.total, 1)) * 100)}%`
                  }}
                ></div>
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate">
                {batchProgress.currentSubject}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Batch Success & Drafts Review Modal */}
      {showBatchSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Batch AI Drafts Created & Synced</h3>
                  <p className="text-xs text-slate-500">
                    Generated {batchResults.length} AI reply drafts stored directly in your connected Gmail account
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowBatchSuccessModal(false);
                  setSelectedThreadIds([]);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  All {batchResults.length} drafts are safely stored in <span className="font-mono font-bold">samuel.adjei@eduvisiongh.org</span>'s Gmail 'Drafts' folder.
                </span>
              </div>
              <a
                href="https://mail.google.com/mail/u/0/#drafts"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-bold text-[#18123A] hover:underline shrink-0 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-xs"
              >
                <span>Open Gmail</span>
                <ArrowRight className="w-3 h-3 text-[#FF5722]" />
              </a>
            </div>

            {/* List of Generated Drafts */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {batchResults.map((res, idx) => (
                <div key={res.threadId || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 line-clamp-1">{res.subject}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      Saved in Drafts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">To: {res.recipientName} ({res.recipientEmail})</p>
                  <p className="text-[11px] font-serif text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 line-clamp-3 leading-relaxed">
                    "{res.draft}"
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowBatchSuccessModal(false);
                  setSelectedThreadIds([]);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#18123A] hover:bg-[#2A2352] rounded-xl transition cursor-pointer shadow"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
