import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy encodes every storage path segment',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/parts\.map\(\(p: string\) => encodeURIComponent\(p\)\)/); });
