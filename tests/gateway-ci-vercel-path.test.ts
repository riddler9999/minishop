import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('network CI watches Vercel routing config',()=>assert.match(fs.readFileSync('.github/workflows/network-resilience.yml','utf8'),/'vercel\.json'/));
