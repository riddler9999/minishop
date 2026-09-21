import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy converts upstream bytes to Buffer',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/Buffer\.from\(await upstream\.arrayBuffer\(\)\)/));
