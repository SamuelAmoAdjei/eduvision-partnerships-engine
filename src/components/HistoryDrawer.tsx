import React, { useState } from 'react';
import { SavedProposal, SavedEmail } from '../types';
import { History, X, Trash2, Copy, Check, FileText, Mail, Calendar, Download } from 'lucide-react';
import { downloadProposalDocx, downloadEmailDocx } from '../utils/docxExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposals: SavedProposal[];
  emails: SavedEmail[];
  onDeleteProposal: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  onLoadProposal: (proposal: SavedProposal) => void;
  onLoadEmail: (email: SavedEmail) => void;
}

export const HistoryDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  proposals,
  emails,
  onDeleteProposal,
  onDeleteEmail,
  onLoadProposal,
  onLoadEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'emails'>('proposals');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm print:hidden">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-5 bg-[#18123A] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-[#FF5722]" />
              <h3 className="text-base font-bold text-white">Saved Vault</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#2A2352] text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                activeTab === 'proposals'
                  ? 'border-[#0A2540] text-[#0A2540] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Proposals ({proposals.length})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                activeTab === 'emails'
                  ? 'border-[#0A2540] text-[#0A2540] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Email Drafts ({emails.length})
            </button>
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === 'proposals' ? (
              proposals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No saved proposals yet. Click "Save Draft" on any generated proposal.
                </div>
              ) : (
                proposals.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.targetOrg}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteProposal(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 font-serif bg-white p-2 rounded border border-slate-100">
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => {
                          onLoadProposal(item);
                          onClose();
                        }}
                        className="text-xs font-bold text-[#00A896] hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Load in Editor
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(item.id, item.content)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Copy"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => downloadProposalDocx(item.targetOrg, item.content)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Download Word Docx"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : emails.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No saved email drafts yet. Click "Save Draft" on any generated email.
              </div>
            ) : (
              emails.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.subject}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 text-teal-600" />
                        <span>{item.emailMode}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteEmail(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 font-sans bg-white p-2 rounded border border-slate-100">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => {
                        onLoadEmail(item);
                        onClose();
                      }}
                      className="text-xs font-bold text-[#00A896] hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" /> Load in Email Drafter
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(item.id, item.content)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title="Copy"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => downloadEmailDocx(item.subject, item.content)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title="Download Word Docx"
                      >
                        <Download className="w-3.5 h-3.5 text-teal-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
