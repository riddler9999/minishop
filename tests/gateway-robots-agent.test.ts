import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('robots policy targets all user agents',()=>assert.match(fs.readFileSync('public/robots.txt','utf8'),/User-agent: \*/));
