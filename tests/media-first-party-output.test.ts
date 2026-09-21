import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPartyMediaUrl} from '../src/features/catalog/api/mappers.ts';

test('Supabase storage URL becomes relative first-party URL',()=>{ const u=firstPartyMediaUrl('https://a.supabase.co/storage/v1/object/public/shop-logos/s/logo.webp'); assert.equal(u,'/api/storefront/shop-logos/s/logo.webp'); assert.ok(u?.startsWith('/')); });
