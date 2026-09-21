import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('network CI watches API and buyer modules',()=>{ const s=fs.readFileSync('.github/workflows/network-resilience.yml','utf8'); assert.match(s,/'api\/\*\*'/); assert.match(s,/'src\/features\/catalog\/\*\*'/); assert.match(s,/'src\/features\/tenancy\/\*\*'/); });
