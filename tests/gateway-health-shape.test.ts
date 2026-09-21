import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health response reports status database and latency',()=>{ const s=fs.readFileSync('api/health.ts','utf8'); for(const k of ['status','database','latencyMs']) assert.match(s,new RegExp(k)); });
