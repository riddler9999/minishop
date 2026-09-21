import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deploy checklist verifies gateway marker',()=>assert.match(fs.readFileSync('api/DEPLOY_CHECKLIST.md','utf8'),/storefront-config/));
