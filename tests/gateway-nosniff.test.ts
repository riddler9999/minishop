import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deployment preserves nosniff',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/X-Content-Type-Options.*nosniff/));
