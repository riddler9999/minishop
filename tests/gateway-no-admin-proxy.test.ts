import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('anonymous gateway has no admin endpoint',()=>{ const files=fs.readdirSync('api',{recursive:true}).map(String); assert.equal(files.some(f=>/admin/i.test(f)),false); });
