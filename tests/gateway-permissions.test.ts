import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deployment keeps camera microphone and geolocation disabled',()=>{ const s=fs.readFileSync('vercel.json','utf8'); for(const k of ['camera=()','microphone=()','geolocation=()']) assert.ok(s.includes(k)); });
