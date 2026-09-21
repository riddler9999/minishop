import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP upgrades insecure requests',()=>assert.match(fs.readFileSync('vercel.json','utf8'),/upgrade-insecure-requests/));
