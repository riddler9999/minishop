import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP denies frame ancestors',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/frame-ancestors 'none'/));
