import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP has no Google font origins',()=>assert.doesNotMatch(fs.readFileSync('vercel.json','utf8'),/fonts\.googleapis|fonts\.gstatic/));
