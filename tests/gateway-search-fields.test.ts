import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog search covers name category and color',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); for(const f of ['name.ilike','category.ilike','color.ilike']) assert.match(s,new RegExp(f.replace('.','\\.'))); });
