import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('HTML contains no external preconnect',()=>assert.doesNotMatch(fs.readFileSync('index.html','utf8'),/rel="preconnect"/));
