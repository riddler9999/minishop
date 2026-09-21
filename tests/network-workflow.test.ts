import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('network migration has CI coverage',()=>{ const s=fs.readFileSync('.github/workflows/network-resilience.yml','utf8'); assert.match(s,/npm run check/); assert.match(s,/node-version: 22/); });
