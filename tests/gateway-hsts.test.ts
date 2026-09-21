import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deployment preserves HSTS',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/Strict-Transport-Security/));
