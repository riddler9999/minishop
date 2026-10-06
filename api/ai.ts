import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {sendJson} from './_http.js';
import {authenticateSeller} from './_mcp/auth.js';
import {McpError} from './_mcp/errors.js';
import {encryptCredential, decryptCredential} from './_ai/crypto.js';
import {callProvider, ProviderGatewayError, testProviderConnection} from './_ai/providers.js';
import {parseProviderProposal} from './_ai/schema.js';
import {AI_PROVIDERS, maskApiKey, supportsCapability, type AiProviderId} from '../src/domain/aiProvider.js';
import {validateAndExecuteAiCommands} from '../src/domain/storeDesign/aiCommands.js';
import {
  MAX_MEDIA_BYTE_SIZE,
  isAllowedMimeType,
  validateMediaFileHeader,
} from '../src/domain/storeMedia.js';

const PROVIDERS = new Set<AiProviderId>(['gemini', 'openai', 'anthropic']);

function providerId(value: unknown): AiProviderId | null {
  return typeof value === 'string' && PROVIDERS.has(value as AiProviderId) ? value as AiProviderId : null;
}

function serviceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('AI backend is not configured.');
  return createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
}

function encryptionSecret(): string {
  const secret = process.env.AI_CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) throw new Error('AI credential encryption is not configured.');
  return secret;
}

function safeCredential(row: any) {
  return {
    provider: row.provider,
    configured: true,
    maskedKey: row.key_masked,
    updatedAt: row.updated_at,
    lastTestedAt: row.last_tested_at,
    lastTestOk: row.last_test_ok,
  };
}

function safeError(error: unknown): {status: number; code: string; message: string} {
  if (error instanceof ProviderGatewayError) {
    return {status: error.code === 'INVALID_CREDENTIAL' ? 400 : 502, code: error.code, message: error.message};
  }
  if (error instanceof McpError) return {status: error.status, code: error.code, message: error.message};
  return {status: 500, code: 'AI_REQUEST_FAILED', message: 'The AI request could not be completed.'};
}

async function credentialFor(admin: any, shopId: string, provider: AiProviderId) {
  const {data, error} = await admin
    .from('ai_provider_credentials')
    .select('provider,encrypted_credential,key_masked,updated_at,last_tested_at,last_test_ok')
    .eq('shop_id', shopId)
    .eq('provider', provider)
    .maybeSingle();
  if (error || !data) throw new ProviderGatewayError('INVALID_CREDENTIAL', 'No saved credential is configured for this provider.');
  return data;
}

function proposalSystemPrompt(allowedMediaIds: string[]): string {
  return [
    'You are MiniShop Store Builder. Return one JSON object with summary and commands only.',
    'Never publish, access a database, invent URLs, remove or disable product-info/product-gallery, hide prices, or disable Buy Now.',
    'Allowed command types: update_section, add_section, remove_section, move_section, set_section_enabled, set_theme, set_global_settings, attach_media.',
    'attach_media must use one of these tenant-approved mediaId values:',
    JSON.stringify(allowedMediaIds),
  ].join('\n');
}

export default async function handler(req: any, res: any) {
  try {
    const {context} = await authenticateSeller(req);
    const admin = serviceClient();

    if (req.method === 'GET') {
      const {data, error} = await admin
        .from('ai_provider_credentials')
        .select('provider,key_masked,updated_at,last_tested_at,last_test_ok')
        .eq('shop_id', context.shopId);
      if (error) throw error;
      const byProvider = new Map((data || []).map((row: any) => [row.provider, safeCredential(row)]));
      return sendJson(res, 200, {
        credentials: [...PROVIDERS].map((id) => byProvider.get(id) || {provider: id, configured: false}),
      });
    }

    if (req.method !== 'POST') return sendJson(res, 405, {error: 'Method not allowed'});
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || '');
    const provider = providerId(body.provider);

    if (action === 'save-credential') {
      if (!provider || typeof body.apiKey !== 'string' || body.apiKey.trim().length < 8 || body.apiKey.length > 500) {
        return sendJson(res, 400, {error: 'Invalid credential'});
      }
      const raw = body.apiKey.trim();
      const row = {
        shop_id: context.shopId,
        provider,
        encrypted_credential: encryptCredential(raw, encryptionSecret()),
        key_masked: maskApiKey(raw),
        credential_metadata: {model: AI_PROVIDERS[provider].defaultModel},
        updated_at: new Date().toISOString(),
      };
      const {data, error} = await admin.from('ai_provider_credentials')
        .upsert(row, {onConflict: 'shop_id,provider'})
        .select('provider,key_masked,updated_at,last_tested_at,last_test_ok')
        .single();
      if (error) throw error;
      return sendJson(res, 200, {credential: safeCredential(data)});
    }

    if (action === 'remove-credential') {
      if (!provider) return sendJson(res, 400, {error: 'Invalid provider'});
      const {error} = await admin.from('ai_provider_credentials')
        .delete().eq('shop_id', context.shopId).eq('provider', provider);
      if (error) throw error;
      return sendJson(res, 200, {ok: true});
    }

    if (action === 'test-connection') {
      if (!provider) return sendJson(res, 400, {error: 'Invalid provider'});
      const row = await credentialFor(admin, context.shopId, provider);
      const apiKey = decryptCredential(row.encrypted_credential, encryptionSecret());
      const model = AI_PROVIDERS[provider].defaultModel;
      const testedAt = new Date().toISOString();
      try {
        await testProviderConnection({provider, apiKey, model});
        await admin.from('ai_provider_credentials').update({last_tested_at: testedAt, last_test_ok: true})
          .eq('shop_id', context.shopId).eq('provider', provider);
      } catch (connectionError) {
        await admin.from('ai_provider_credentials').update({last_tested_at: testedAt, last_test_ok: false})
          .eq('shop_id', context.shopId).eq('provider', provider);
        throw connectionError;
      }
      return sendJson(res, 200, {ok: true, provider, model, testedAt});
    }

    if (action === 'register-media') {
      const storagePath = typeof body.storagePath === 'string' ? body.storagePath : '';
      if (!storagePath.startsWith(`${context.shopId}/media/`) || storagePath.length > 500) {
        return sendJson(res, 400, {error: 'Invalid media path'});
      }
      const download = await admin.storage.from('product-images').download(storagePath);
      if (download.error || !download.data) return sendJson(res, 400, {error: 'Media could not be verified'});
      if (download.data.size <= 0 || download.data.size > MAX_MEDIA_BYTE_SIZE) return sendJson(res, 413, {error: 'Media is too large'});
      const bytes = new Uint8Array(await download.data.arrayBuffer());
      const detected = validateMediaFileHeader(bytes);
      if (!detected || !isAllowedMimeType(detected) || (download.data.type && download.data.type !== detected)) {
        return sendJson(res, 415, {error: 'Unsupported media type'});
      }
      const mediaId = randomUUID();
      const {data, error} = await admin.from('store_media').insert({
        id: mediaId,
        shop_id: context.shopId,
        storage_path: storagePath,
        mime_type: detected,
        byte_size: download.data.size,
        storefront_authorized: true,
      }).select('id,storage_path,mime_type,byte_size,created_at').single();
      if (error) throw error;
      return sendJson(res, 200, {media: {
        id: data.id,
        storagePath: data.storage_path,
        mimeType: data.mime_type,
        byteSize: data.byte_size,
        createdAt: data.created_at,
        url: `/api/storefront/product-images/${data.storage_path}`,
      }});
    }

    if (action === 'generate-proposal') {
      if (!provider || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 2_000) {
        return sendJson(res, 400, {error: 'Invalid proposal request'});
      }
      if (!body.currentDoc || typeof body.currentDoc !== 'object') return sendJson(res, 400, {error: 'Invalid Store Design document'});
      const requestedMediaIds = Array.isArray(body.mediaIds)
        ? [...new Set(body.mediaIds.filter((value: unknown) => typeof value === 'string'))].slice(0, 8)
        : [];
      let mediaRows: any[] = [];
      if (requestedMediaIds.length) {
        const result = await admin.from('store_media')
          .select('id,storage_path,mime_type,byte_size')
          .eq('shop_id', context.shopId)
          .eq('storefront_authorized', true)
          .in('id', requestedMediaIds);
        if (result.error) throw result.error;
        mediaRows = result.data || [];
        if (mediaRows.length !== requestedMediaIds.length) return sendJson(res, 403, {error: 'Media is not authorized for this shop'});
      }
      const row = await credentialFor(admin, context.shopId, provider);
      const apiKey = decryptCredential(row.encrypted_credential, encryptionSecret());
      const model = AI_PROVIDERS[provider].defaultModel;
      if (!supportsCapability(provider, 'structured_output', model) ||
          (requestedMediaIds.length > 0 && !supportsCapability(provider, 'vision', model))) {
        return sendJson(res, 400, {error: 'This provider model does not support the requested Store Builder capability'});
      }
      const providerResult = await callProvider({
        provider,
        apiKey,
        model,
        system: proposalSystemPrompt(requestedMediaIds),
        prompt: JSON.stringify({request: body.message.trim(), currentDocument: body.currentDoc}),
      });
      const parsed = parseProviderProposal(providerResult.text);
      const mediaById = Object.fromEntries(mediaRows.map((media) => [
        String(media.id),
        `/api/storefront/product-images/${media.storage_path}`,
      ]));
      const validation = validateAndExecuteAiCommands(body.currentDoc, parsed.commands as any, {mediaById});
      if (!validation.ok) return sendJson(res, 422, {error: 'AI proposal failed Store Design validation', details: validation.errors});
      return sendJson(res, 200, {
        proposal: {
          id: randomUUID(),
          userPrompt: body.message.trim(),
          summary: parsed.summary,
          commands: parsed.commands,
          createdAt: new Date().toISOString(),
          isDestructive: parsed.commands.some((command) => command.type === 'remove_section'),
          trustedMedia: mediaById,
        },
      });
    }

    return sendJson(res, 400, {error: 'Invalid action'});
  } catch (error) {
    const safe = safeError(error);
    return sendJson(res, safe.status, {code: safe.code, error: safe.message});
  }
}
