import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway docs state anon key and RLS boundary',()=>{ const s=fs.readFileSync('api/README.md','utf8'); assert.match(s,/public anon key/); assert.match(s,/existing RLS/); });
