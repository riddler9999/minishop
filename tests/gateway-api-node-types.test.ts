import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('serverless API TypeScript includes Node types',()=>{ const c=JSON.parse(fs.readFileSync('api/tsconfig.json','utf8')); assert.deepEqual(c.compilerOptions.types,['node']); });
