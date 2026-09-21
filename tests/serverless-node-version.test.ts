import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('project requires Node 22+',()=>{ const p=JSON.parse(fs.readFileSync('package.json','utf8')); assert.equal(p.engines.node, '>=22'); });
