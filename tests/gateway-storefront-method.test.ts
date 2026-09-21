import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('storefront catalog gateway is GET only',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/if \(req\.method !== 'GET'\)/));
