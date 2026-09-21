import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('tenant resolver preserves per-slug in-memory cache',()=>{ const s=fs.readFileSync('src/features/tenancy/shopResolver.ts','utf8'); assert.match(s,/cachedShop/); assert.match(s,/cachedShop\?\.slug === slug/); });
