import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('server gateways disable session persistence and refresh',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts','api/health.ts']){ const s=fs.readFileSync(f,'utf8'); assert.match(s,/persistSession: false/); assert.match(s,/autoRefreshToken: false/); } });
