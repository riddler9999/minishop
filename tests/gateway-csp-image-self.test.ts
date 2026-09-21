import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP img-src includes self for first-party media',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/img-src 'self'/));
