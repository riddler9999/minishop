import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('SPA fallback excludes built assets',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/api\/\|assets\//));
