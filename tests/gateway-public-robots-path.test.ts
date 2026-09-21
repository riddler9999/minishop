import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public robots file exists',()=>assert.equal(fs.existsSync('public/robots.txt'),true));
