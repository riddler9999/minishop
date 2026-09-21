import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog gateway preserves promotion filter',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/featured === 'true'.*is_promotion/s));
