import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy checks an explicit bucket allowlist',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/ALLOWED_BUCKETS\.has\(bucket\)/); });
