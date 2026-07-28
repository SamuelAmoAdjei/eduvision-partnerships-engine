export interface CustomLetterhead {
  useCustom: boolean;
  templateImageBase64?: string; // Full pre-designed blank letterhead image file
  templateFileName?: string;
  topPaddingPx?: number; // Top text offset to avoid overlapping top header graphic
  bottomPaddingPx?: number; // Bottom text offset to avoid overlapping footer
  sidePaddingPx?: number; // Left & right side margins
  refPrefix?: string;
  orgName?: string;
  department?: string;
  contactInfo?: string;
  sealText?: string;
}

export type ModelVersion = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface UploadedImageInfo {
  base64: string;
  mimeType: string;
  fileName: string;
}

export interface ProposalFormData {
  targetOrg: string;
  baseContext: string;
  customInstructions: string;
  modelVersion: ModelVersion;
  useThinkingMode: boolean;
  useSearchGrounding: boolean;
  baseFileName?: string;
  letterheadFileName?: string;
  uploadedImage?: UploadedImageInfo;
}

export type OutreachMode = 'Cold / Warm Outreach' | 'Thread Reply & Negotiation';

export interface EmailFormData {
  emailMode: OutreachMode;
  threadInput: string;
  userIntent: string;
  proposalRef: string;
  modelVersion: ModelVersion;
  useThinkingMode: boolean;
  useSearchGrounding: boolean;
}

export interface SavedProposal {
  id: string;
  targetOrg: string;
  content: string;
  customInstructions: string;
  createdAt: string;
  modelVersion: string;
  groundingSources?: GroundingSource[];
  thinkingEnabled?: boolean;
}

export interface SavedEmail {
  id: string;
  emailMode: OutreachMode;
  subject: string;
  content: string;
  userIntent: string;
  createdAt: string;
  modelVersion: string;
  groundingSources?: GroundingSource[];
}

export interface PresetScenario {
  id: string;
  title: string;
  category: 'Ministry & Gov' | 'Corporate Partner' | 'Global Foundation / NGO';
  targetOrg: string;
  baseContext: string;
  customInstructions: string;
  sampleEmailIntent?: string;
}

export interface InboxMessage {
  id: string;
  from: string;
  senderName: string;
  date: string;
  body: string;
  isRead?: boolean;
}

export interface InboxThread {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  unreadCount: number;
  lastUpdated: string;
  messages: InboxMessage[];
  categoryTag?: string;
}

export interface InboxDraftResult {
  id: string;
  threadId: string;
  recipientEmail: string;
  subject: string;
  draftBody: string;
  generatedAt: string;
  modelUsed: string;
}
