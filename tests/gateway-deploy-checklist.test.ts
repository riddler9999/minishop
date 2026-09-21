import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deploy checklist covers catalog media checkout lookup and admin',()=>{ const s=fs.readFileSync('api/DEPLOY_CHECKLIST.md','utf8'); for(const k of ['products','product images','checkout','test order','order lookup','seller login']) assert.match(s,new RegExp(k,'i')); });
