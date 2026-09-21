import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media endpoint uses only object/public route',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/object\/public/); assert.doesNotMatch(s,/object\/sign|object\/authenticated/); });
