import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway environment helper exposes anon key only',()=>{ const s=fs.readFileSync('api/_env.ts','utf8'); assert.match(s,/ANON_KEY/); assert.doesNotMatch(s,/SERVICE/); });
