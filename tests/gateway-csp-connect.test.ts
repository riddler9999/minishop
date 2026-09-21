import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP connect-src includes self for first-party API',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/connect-src 'self'/));
