import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway README documents checkout and order migration',()=>{ const s=fs.readFileSync('api/README.md','utf8'); assert.match(s,/checkout configuration/); assert.match(s,/order placement/); assert.match(s,/order lookup/); });
