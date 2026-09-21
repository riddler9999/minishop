import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('HTML has no external stylesheet link',()=>{ const s=fs.readFileSync('index.html','utf8'); assert.doesNotMatch(s,/<link[^>]+href="https:\/\//); });
