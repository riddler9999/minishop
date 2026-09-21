import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('tenant resolver URL-encodes slug',()=>assert.match(fs.readFileSync('src/features/tenancy/shopResolver.ts','utf8'),/encodeURIComponent\(slug\)/));
