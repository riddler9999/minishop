import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP restricts scripts to self',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/script-src 'self'/));
