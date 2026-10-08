import {requireSupabase} from '@/core/supabase/client';
import type {AiCredentialMetadata, AiProviderId} from '@/domain/aiProvider';
import type {AiProposal} from '@/domain/aiGateway';
import type {StoreDesignDocument} from '@/domain/storeDesign';
import type {StoreMedia} from '@/domain/storeMedia';

async function aiRequest<T>(body?: unknown, method = 'POST'): Promise<T> {
  const supabase = requireSupabase();
  const {data: {session}} = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Authentication is required.');
  const response = await fetch('/api/ai', {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? {'Content-Type': 'application/json'} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'AI request failed.');
  return payload as T;
}

export const shopAiApi = {
  async listAiCredentials(): Promise<{credentials: AiCredentialMetadata[]}> {
    return aiRequest(undefined, 'GET');
  },
  async saveAiCredential(provider: AiProviderId, apiKey: string): Promise<{credential: AiCredentialMetadata}> {
    return aiRequest({action: 'save-credential', provider, apiKey});
  },
  async removeAiCredential(provider: AiProviderId): Promise<{ok: true}> {
    return aiRequest({action: 'remove-credential', provider});
  },
  async testAiConnection(provider: AiProviderId): Promise<{ok: true; provider: AiProviderId; model: string; testedAt: string}> {
    return aiRequest({action: 'test-connection', provider});
  },
  async registerStoreMedia(storagePath: string): Promise<{media: StoreMedia}> {
    return aiRequest({action: 'register-media', storagePath});
  },
  async generateAiStoreProposal(input: {
    provider: AiProviderId;
    message: string;
    currentDoc: StoreDesignDocument;
    mediaIds: string[];
    baseRevision: string;
  }): Promise<{proposal: AiProposal}> {
    return aiRequest({action: 'generate-proposal', ...input});
  },
};
