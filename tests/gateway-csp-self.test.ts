import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP default source remains self',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/default-src 'self'/));
