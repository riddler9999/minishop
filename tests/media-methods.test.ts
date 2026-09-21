import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy permits only GET and HEAD',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/req\.method !== 'GET' && req\.method !== 'HEAD'/); });
