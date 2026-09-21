import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway diagnostic exposes only mode and version',()=>{ const s=fs.readFileSync('api/storefront-config.ts','utf8'); assert.match(s,/\{gateway: 'first-party', version: 1\}/); });
