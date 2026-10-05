import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/storefront/[...path].ts';
import {MAX_PUBLIC_MEDIA_BYTES, allowedPublicImageContentType, isPublicMediaLengthAllowed} from '../api/_public-media.ts';

test('public media guards reject non-images and oversized declared files', () => {
  assert.equal(allowedPublicImageContentType('image/webp'), 'image/webp');
  assert.equal(allowedPublicImageContentType('image/svg+xml'), null);
  assert.equal(allowedPublicImageContentType('text/html'), null);
  assert.equal(isPublicMediaLengthAllowed(String(MAX_PUBLIC_MEDIA_BYTES)), true);
  assert.equal(isPublicMediaLengthAllowed(String(MAX_PUBLIC_MEDIA_BYTES + 1)), false);
});

test('fallback media endpoint rejects an oversized response before buffering it', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  let buffered = false;
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    headers: new Headers({'content-type': 'image/webp', 'content-length': String(MAX_PUBLIC_MEDIA_BYTES + 1)}),
    async arrayBuffer() { buffered = true; return new ArrayBuffer(0); },
  })) as typeof fetch;
  const res: any = {
    statusCode: 200,
    setHeader() {},
    status(code: number) { this.statusCode = code; return this; },
    end() { return this; },
    send() { return this; },
  };
  try {
    await handler({method: 'GET', query: {path: ['product-images', 'shop', 'large.webp']}}, res);
    assert.equal(res.statusCode, 413);
    assert.equal(buffered, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
  }
});
