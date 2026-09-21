import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order creation does not opt into public caching',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/sendJson\(res, 200, \{order: data\}\)/); assert.doesNotMatch(s,/\{order: data\}, true/); });
