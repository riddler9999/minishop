import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('serverless API has strict TypeScript config',()=>{ const c=JSON.parse(fs.readFileSync('api/tsconfig.json','utf8')); assert.equal(c.compilerOptions.strict,true); assert.equal(c.compilerOptions.target,'ES2022'); });
