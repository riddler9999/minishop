import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy enables long edge caching',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/s-maxage=86400/); });
