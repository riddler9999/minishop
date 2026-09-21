import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('serverless API uses bundler module resolution',()=>{ const c=JSON.parse(fs.readFileSync('api/tsconfig.json','utf8')); assert.equal(c.compilerOptions.moduleResolution,'Bundler'); });
