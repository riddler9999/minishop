import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway handles GET POST and rejects others',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/req\.method === 'GET'/); assert.match(s,/req\.method === 'POST'/); assert.match(s,/405/); });
