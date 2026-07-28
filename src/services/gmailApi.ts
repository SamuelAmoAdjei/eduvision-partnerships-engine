import { InboxThread, InboxMessage } from '../types';

/**
 * Service to handle Google Gmail REST API operations
 * Uses stored OAuth access tokens from localStorage or proxies through the backend server.
 */

export function getGmailAccessToken(): string | null {
  return localStorage.getItem('eduvision_gmail_access_token');
}

export async function fetchGmailThreads(query?: string): Promise<{
  threads: InboxThread[];
  isLiveGmail: boolean;
  message: string;
}> {
  const token = getGmailAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `/api/inbox/fetch-threads?email=${encodeURIComponent((query || '').trim())}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch email threads (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    threads: data.threads || [],
    isLiveGmail: !!data.isLiveGmail,
    message: data.message || 'Threads loaded successfully'
  };
}

export async function createGmailDraft(
  recipientEmail: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<{ success: boolean; draftId?: string; message?: string }> {
  const token = getGmailAccessToken();

  const response = await fetch('/api/gmail/create-native-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipientEmail,
      subject,
      body,
      threadId,
      accessToken: token || undefined
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Draft creation failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    success: true,
    draftId: data.draftId || data.id,
    message: data.message || 'Draft created successfully in Gmail'
  };
}

export async function searchRecipientThreads(query: string): Promise<InboxThread[]> {
  const result = await fetchGmailThreads(query);
  return result.threads;
}
