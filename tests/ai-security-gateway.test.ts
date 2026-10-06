import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';
import {decryptCredential, encryptCredential} from '../api/_ai/crypto.ts';
import {callProvider, ProviderGatewayError} from '../api/_ai/providers.ts';
import {parseProviderProposal} from '../api/_ai/schema.ts';

const encryptionKey = Buffer.alloc(32, 7).toString('base64');

describe('AI BYOK security boundary', () => {
  it('encrypts credentials with authenticated encryption and never stores plaintext', () => {
    const raw = 'sk-secret-value-that-must-not-leak';
    const encrypted = encryptCredential(raw, encryptionKey);
    assert.notEqual(encrypted, raw);
    assert.equal(encrypted.includes(raw), false);
    assert.equal(decryptCredential(encrypted, encryptionKey), raw);
    const parts = encrypted.split(':');
    parts[2] = `${parts[2]!.slice(0, 2)}${parts[2]![2] === 'A' ? 'B' : 'A'}${parts[2]!.slice(3)}`;
    assert.throws(() => decryptCredential(parts.join('.'), encryptionKey));
  });

  it('keeps raw credentials out of browser persistence and API responses', async () => {
    const settings = await readFile('src/features/admin/pages/AiSettings.tsx', 'utf8');
    const api = await readFile('api/ai.ts', 'utf8');
    assert.doesNotMatch(settings, /localStorage|sessionStorage/);
    assert.doesNotMatch(api, /sendJson\([^\n]+encrypted_credential/);
    assert.match(api, /key_masked/);
  });
});

describe('normalized AI provider gateway', () => {
  it('selects Gemini, OpenAI and Anthropic adapters', async () => {
    const seen: string[] = [];
    const fetchMock = (async (url: string | URL | Request) => {
      const value = String(url);
      seen.push(value);
      if (value.includes('googleapis')) return new Response(JSON.stringify({candidates: [{content: {parts: [{text: '{"summary":"ok","commands":[]}' }]}}]}));
      if (value.includes('openai')) return new Response(JSON.stringify({choices: [{message: {content: '{"summary":"ok","commands":[]}'}}]}));
      return new Response(JSON.stringify({content: [{type: 'text', text: '{"summary":"ok","commands":[]}'}]}));
    }) as typeof fetch;

    for (const provider of ['gemini', 'openai', 'anthropic'] as const) {
      const result = await callProvider({provider, apiKey: 'private-key', model: 'model', system: 'system', prompt: 'prompt'}, fetchMock);
      assert.match(result.text, /summary/);
    }
    assert.equal(seen.length, 3);
  });

  it('normalizes invalid credentials without returning the secret', async () => {
    const fetchMock = (async () => new Response(JSON.stringify({error: 'private-key'}), {status: 401})) as typeof fetch;
    await assert.rejects(
      () => callProvider({provider: 'openai', apiKey: 'private-key', model: 'model', system: 'system', prompt: 'prompt'}, fetchMock),
      (error: unknown) => error instanceof ProviderGatewayError &&
        error.code === 'INVALID_CREDENTIAL' && !error.message.includes('private-key'),
    );
  });

  it('normalizes provider timeouts without returning the secret', async () => {
    const fetchMock = (async () => {
      throw new DOMException('private-key', 'AbortError');
    }) as typeof fetch;
    await assert.rejects(
      () => callProvider({provider: 'openai', apiKey: 'private-key', model: 'model', system: 'system', prompt: 'prompt'}, fetchMock),
      (error: unknown) => error instanceof ProviderGatewayError &&
        error.code === 'TIMEOUT' && !error.message.includes('private-key'),
    );
  });

  it('rejects malformed or out-of-contract structured output', () => {
    assert.throws(() => parseProviderProposal('not json'));
    assert.throws(() => parseProviderProposal(JSON.stringify({summary: 'bad', commands: [{type: 'run_sql'}]})));
    const parsed = parseProviderProposal(JSON.stringify({
      summary: 'Change theme',
      commands: [{type: 'set_theme', themeId: 'soft-elegant'}],
    }));
    assert.equal(parsed.commands[0]?.type, 'set_theme');
  });
});
