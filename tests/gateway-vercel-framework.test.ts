import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Vercel framework remains explicit null for Vite config',()=>assert.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).framework,null));
