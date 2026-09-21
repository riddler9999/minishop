import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP disables object embedding',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/object-src 'none'/));
