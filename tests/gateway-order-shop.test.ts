import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps sanitized tenant slug',()=>{const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/slug = clean\(b\.slug/); assert.match(s,/p_shop_slug: slug/);});
