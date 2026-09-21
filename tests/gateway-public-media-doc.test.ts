import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('architecture documents first-party media gateway',()=>{ const s=fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'); assert.match(s,/product images and shop logos use the Vercel first-party gateway/); });
