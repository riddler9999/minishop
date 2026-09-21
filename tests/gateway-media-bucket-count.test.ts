import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy allowlist contains exactly two buckets',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); const m=s.match(/new Set\(\[([^\]]+)\]\)/); assert.ok(m); assert.equal((m![1].match(/'/g)||[]).length/2,2); });
