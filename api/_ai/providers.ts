import type {AiProviderId} from '../../src/domain/aiProvider.js';

export type ProviderRequest = {
  provider: AiProviderId;
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  media?: {id: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; dataBase64: string}[];
  timeoutMs?: number;
};

export type ProviderResponse = {text: string; model: string};
type FetchLike = typeof fetch;

export class ProviderGatewayError extends Error {
  readonly code: 'INVALID_CREDENTIAL' | 'TIMEOUT' | 'PROVIDER_UNAVAILABLE' | 'MALFORMED_RESPONSE';

  constructor(
    code: 'INVALID_CREDENTIAL' | 'TIMEOUT' | 'PROVIDER_UNAVAILABLE' | 'MALFORMED_RESPONSE',
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

function safeProviderError(status: number): ProviderGatewayError {
  if (status === 401 || status === 403) {
    return new ProviderGatewayError('INVALID_CREDENTIAL', 'The provider rejected this credential.');
  }
  return new ProviderGatewayError('PROVIDER_UNAVAILABLE', 'The AI provider is temporarily unavailable.');
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1_000, 2_000);
  return Math.min(200 * (2 ** attempt), 2_000);
}

async function requestJson(fetchImpl: FetchLike, url: string, init: RequestInit, timeoutMs: number): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {...init, signal: controller.signal});
      if (response.ok) return await response.json();
      const transient = response.status === 429 || response.status >= 500;
      if (!transient || attempt === 2) throw safeProviderError(response.status);
      await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
    } catch (error) {
      if (error instanceof ProviderGatewayError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderGatewayError('TIMEOUT', 'The AI provider request timed out.');
      }
      if (attempt === 2) {
        throw new ProviderGatewayError('PROVIDER_UNAVAILABLE', 'The AI provider request failed.');
      }
      await new Promise((resolve) => setTimeout(resolve, Math.min(200 * (2 ** attempt), 2_000)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new ProviderGatewayError('PROVIDER_UNAVAILABLE', 'The AI provider request failed.');
}

export async function callProvider(
  request: ProviderRequest,
  fetchImpl: FetchLike = fetch,
): Promise<ProviderResponse> {
  const timeoutMs = Math.min(Math.max(request.timeoutMs ?? 20_000, 1_000), 30_000);
  if (request.provider === 'gemini') {
    const data = await requestJson(
      fetchImpl,
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(request.apiKey)}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          systemInstruction: {parts: [{text: request.system}]},
          contents: [{role: 'user', parts: [
            {text: request.prompt},
            ...(request.media ?? []).flatMap((media) => [
              {text: `Tenant mediaId: ${media.id}`},
              {inlineData: {mimeType: media.mimeType, data: media.dataBase64}},
            ]),
          ]}],
          generationConfig: {responseMimeType: 'application/json', temperature: 0.2},
        }),
      },
      timeoutMs,
    );
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new ProviderGatewayError('MALFORMED_RESPONSE', 'The AI provider returned an invalid response.');
    return {text, model: request.model};
  }

  if (request.provider === 'openai') {
    const data = await requestJson(fetchImpl, 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${request.apiKey}`},
      body: JSON.stringify({
        model: request.model,
        temperature: 0.2,
        response_format: {type: 'json_object'},
        messages: [
          {role: 'system', content: request.system},
          {role: 'user', content: request.media?.length ? [
            {type: 'text', text: request.prompt},
            ...request.media.flatMap((media) => [
              {type: 'text', text: `Tenant mediaId: ${media.id}`},
              {type: 'image_url', image_url: {url: `data:${media.mimeType};base64,${media.dataBase64}`}},
            ]),
          ] : request.prompt},
        ],
      }),
    }, timeoutMs);
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') throw new ProviderGatewayError('MALFORMED_RESPONSE', 'The AI provider returned an invalid response.');
    return {text, model: request.model};
  }

  if (request.provider === 'anthropic') {
    const data = await requestJson(fetchImpl, 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: 2048,
        temperature: 0.2,
        system: request.system,
        messages: [{role: 'user', content: request.media?.length ? [
          {type: 'text', text: request.prompt},
          ...request.media.flatMap((media) => [
            {type: 'text', text: `Tenant mediaId: ${media.id}`},
            {type: 'image', source: {type: 'base64', media_type: media.mimeType, data: media.dataBase64}},
          ]),
        ] : request.prompt}],
      }),
    }, timeoutMs);
    const text = data?.content?.find((part: any) => part?.type === 'text')?.text;
    if (typeof text !== 'string') throw new ProviderGatewayError('MALFORMED_RESPONSE', 'The AI provider returned an invalid response.');
    return {text, model: request.model};
  }

  throw new ProviderGatewayError('PROVIDER_UNAVAILABLE', 'Unsupported AI provider.');
}

export async function testProviderConnection(
  request: Omit<ProviderRequest, 'system' | 'prompt'>,
  fetchImpl: FetchLike = fetch,
): Promise<ProviderResponse> {
  return callProvider({
    ...request,
    timeoutMs: 10_000,
    system: 'Return JSON only.',
    prompt: 'Return exactly {"ok":true}.',
  }, fetchImpl);
}
