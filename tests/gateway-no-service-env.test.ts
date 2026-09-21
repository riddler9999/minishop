import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('server env helper cannot load service credentials',()=>assert.doesNotMatch(fs.readFileSync('api/_env.ts','utf8'),/SERVICE|SECRET/i));
