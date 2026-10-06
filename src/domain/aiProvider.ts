export type AiProviderId = 'gemini' | 'openai' | 'anthropic';

export type AiCapability = 'text' | 'structured_output' | 'tool_calling' | 'vision';

export interface AiModelInfo {
  id: string;
  name: string;
  capabilities: AiCapability[];
  maxInputTokens?: number;
}

export interface AiProviderDescriptor {
  id: AiProviderId;
  name: string;
  defaultModel: string;
  models: AiModelInfo[];
}

export const AI_PROVIDERS: Record<AiProviderId, AiProviderDescriptor> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        capabilities: ['text', 'structured_output', 'tool_calling', 'vision'],
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        capabilities: ['text', 'structured_output', 'tool_calling', 'vision'],
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        capabilities: ['text', 'structured_output', 'tool_calling', 'vision'],
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        capabilities: ['text', 'structured_output', 'tool_calling', 'vision'],
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet',
    models: [
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        capabilities: ['text', 'structured_output', 'tool_calling', 'vision'],
      },
    ],
  },
};

export interface AiProviderCredential {
  id: string;
  shopId: string;
  provider: AiProviderId;
  encryptedKey: string;
  keyMasked: string;
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiConnectionTestResult {
  ok: boolean;
  provider: AiProviderId;
  model: string;
  message?: string;
  testedAt: string;
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••' + key.slice(-2);
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export function getProviderCapabilities(providerId: AiProviderId, modelId?: string): AiCapability[] {
  const provider = AI_PROVIDERS[providerId];
  if (!provider) return [];
  const model = provider.models.find((m) => m.id === (modelId || provider.defaultModel));
  return model ? model.capabilities : [];
}

export function supportsCapability(providerId: AiProviderId, capability: AiCapability, modelId?: string): boolean {
  return getProviderCapabilities(providerId, modelId).includes(capability);
}
