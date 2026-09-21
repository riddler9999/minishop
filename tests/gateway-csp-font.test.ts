import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP fonts are self or data only',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/font-src 'self' data:/));
