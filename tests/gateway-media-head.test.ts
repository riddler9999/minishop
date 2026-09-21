import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy supports HEAD without body',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/req\.method === 'HEAD'.*end\(\)/s));
