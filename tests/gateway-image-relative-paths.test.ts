import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPartyMediaUrl} from '../src/features/catalog/api/mappers.ts';

test('both public media buckets map to relative gateway paths',()=>{ for(const b of ['product-images','shop-logos']) assert.ok(firstPartyMediaUrl(`https://x.supabase.co/storage/v1/object/public/${b}/a.webp`)?.startsWith('/api/storefront/')); });
