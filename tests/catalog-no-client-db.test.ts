import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer catalog contains no direct database calls',()=>{ const s=fs.readFileSync('src/features/catalog/api/storefront.ts','utf8'); assert.doesNotMatch(s,/\.from\(|\.rpc\(/); });
