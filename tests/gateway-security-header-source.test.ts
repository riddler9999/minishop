import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('API security helper sets nosniff no-referrer and deny framing',()=>{ const s=fs.readFileSync('api/_security.ts','utf8'); for(const k of ['nosniff','no-referrer','DENY']) assert.match(s,new RegExp(k)); });
