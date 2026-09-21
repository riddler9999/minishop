import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway exposes architecture version one',()=>{ const s=fs.readFileSync('api/storefront-config.ts','utf8'); assert.match(s,/version: 1/); });
