import React, { useState, useEffect } from 'react';
import { ModelVersion, SavedProposal, SavedEmail, PresetScenario } from './types';
import { Header } from './components/Header';
import { ProposalDrafter } from './components/ProposalDrafter';
import { EmailManager } from './components/EmailManager';
import { AiInboxManager } from './components/AiInboxManager';
import { SignInPage, AuthUser } from './components/SignInPage';
import { PresetsModal } from './components/PresetsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ApiErrorBanner, ApiErrorInfo } from './components/ApiErrorBanner';
import { FileText, Mail, Inbox, Shield, Globe, User } from 'lucide-react';

export default function App() {
  const [selectedModel, setSelectedModel] = useState<ModelVersion>('gemini-3.5-flash');
  const [activeTab, setActiveTab] = useState<'proposal' | 'email' | 'inbox' | 'auth'>('proposal');

  // Authenticated Executive User State (defaults to null if not authenticated)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('eduvision_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (authUser) {
      localStorage.setItem('eduvision_auth_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('eduvision_auth_user');
    }
  }, [authUser]);

  // Global API Error Notification Banner State
  const [globalApiError, setGlobalApiError] = useState<ApiErrorInfo | null>(null);

  // Modal & Drawer State
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Vault Persistent State
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>(() => {
    const saved = localStorage.getItem('eduvision_proposals');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedEmails, setSavedEmails] = useState<SavedEmail[]>(() => {
    const saved = localStorage.getItem('eduvision_emails');
    return saved ? JSON.parse(saved) : [];
  });

  // Inter-tab draft handoff
  const [proposalRefForEmail, setProposalRefForEmail] = useState<string>('');
  const [initialProposalDraft, setInitialProposalDraft] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('eduvision_proposals', JSON.stringify(savedProposals));
  }, [savedProposals]);

  useEffect(() => {
    localStorage.setItem('eduvision_emails', JSON.stringify(savedEmails));
  }, [savedEmails]);

  // Handlers
  const handleSaveProposal = (proposal: SavedProposal) => {
    setSavedProposals((prev) => [proposal, ...prev]);
  };

  const handleSaveEmail = (email: SavedEmail) => {
    setSavedEmails((prev) => [email, ...prev]);
  };

  const handleDeleteProposal = (id: string) => {
    setSavedProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteEmail = (id: string) => {
    setSavedEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const handleTransferToEmail = (proposalText: string) => {
    setProposalRefForEmail(proposalText);
    setActiveTab('email');
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setInitialProposalDraft('');
    setActiveTab('proposal');
  };

  return (
    <div className="min-h-screen bg-[#F4F5FA] text-slate-900 font-sans flex flex-col justify-between selection:bg-[#FF5722] selection:text-white">
      <div>
        {/* Header */}
        <Header
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOpenPresets={() => setIsPresetsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAuth={() => setActiveTab('auth')}
          authUser={authUser}
          savedCount={savedProposals.length + savedEmails.length}
        />

        {/* Main Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Global Gemini API Error Notification Banner */}
          <ApiErrorBanner
            error={globalApiError}
            onDismiss={() => setGlobalApiError(null)}
          />

          {/* Mandatory Auth Gate: Require Google OAuth permissions before accessing any workspace features */}
          {!authUser ? (
            <div className="py-4">
              <SignInPage
                user={null}
                onSignIn={(u) => {
                  setAuthUser(u);
                  setActiveTab('proposal');
                }}
                onSignOut={() => setAuthUser(null)}
                onContinueToWorkspace={() => setActiveTab('proposal')}
              />
            </div>
          ) : (
            <>
              {/* Main Navigation Tabs */}
              <div className="flex border border-slate-200/80 mb-8 bg-white p-1.5 rounded-2xl shadow-sm max-w-3xl mx-auto print:hidden">
                <button
                  onClick={() => setActiveTab('proposal')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'proposal'
                      ? 'bg-[#18123A] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className={`w-4 h-4 ${activeTab === 'proposal' ? 'text-[#FF5722]' : 'text-slate-500'}`} />
                  <span>Proposal Drafter</span>
                </button>

                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'email'
                      ? 'bg-[#18123A] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Mail className={`w-4 h-4 ${activeTab === 'email' ? 'text-[#FF5722]' : 'text-slate-500'}`} />
                  <span>Diplomatic Email</span>
                </button>

                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                    activeTab === 'inbox'
                      ? 'bg-[#18123A] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Inbox className={`w-4 h-4 ${activeTab === 'inbox' ? 'text-[#FF5722]' : 'text-slate-500'}`} />
                  <span>AI Inbox & Threads</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF5722] absolute top-2 right-2" />
                </button>

                <button
                  onClick={() => setActiveTab('auth')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'auth'
                      ? 'bg-[#18123A] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className={`w-4 h-4 ${activeTab === 'auth' ? 'text-[#FF5722]' : 'text-slate-500'}`} />
                  <span>Account & OAuth</span>
                </button>
              </div>

              {/* Tab Views */}
              {activeTab === 'proposal' ? (
                <ProposalDrafter
                  selectedModel={selectedModel}
                  onSaveProposal={handleSaveProposal}
                  onTransferToEmail={handleTransferToEmail}
                  initialDraft={initialProposalDraft}
                  onApiError={(err) => setGlobalApiError(err)}
                />
              ) : activeTab === 'email' ? (
                <EmailManager
                  selectedModel={selectedModel}
                  onSaveEmail={handleSaveEmail}
                  autoRefProposalText={proposalRefForEmail}
                  onApiError={(err) => setGlobalApiError(err)}
                />
              ) : activeTab === 'inbox' ? (
                <AiInboxManager
                  selectedModel={selectedModel}
                  onSaveEmail={handleSaveEmail}
                  onApiError={(err) => setGlobalApiError(err)}
                  onTransferToEmailManager={(text) => {
                    setProposalRefForEmail(text);
                    setActiveTab('email');
                  }}
                />
              ) : (
                <SignInPage
                  user={authUser}
                  onSignIn={(u) => {
                    setAuthUser(u);
                    setActiveTab('proposal');
                  }}
                  onSignOut={() => setAuthUser(null)}
                  onContinueToWorkspace={() => setActiveTab('proposal')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#18123A]">Eduvision Ghana</span>
            <span>•</span>
            <span>Directorate of Global Partnerships & Institutional Engagement</span>
            <span>•</span>
            <a
              href="https://eduvisiongh.org"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF5722] hover:underline flex items-center gap-1 font-semibold"
            >
              <Globe className="w-3 h-3" /> eduvisiongh.org
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> B&W Letterhead Print Compliant
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Powered by Gemini AI (Server Proxy)</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        proposals={savedProposals}
        emails={savedEmails}
        onDeleteProposal={handleDeleteProposal}
        onDeleteEmail={handleDeleteEmail}
        onLoadProposal={(item) => {
          setInitialProposalDraft(item.content);
          setActiveTab('proposal');
        }}
        onLoadEmail={(item) => {
          setActiveTab('email');
        }}
      />
    </div>
  );
}
