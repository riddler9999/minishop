import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPartyMediaUrl} from '../src/features/catalog/api/mappers.ts';

test('non-Supabase media remains unchanged',()=>assert.equal(firstPartyMediaUrl('https://cdn.example.com/a.webp'),'https://cdn.example.com/a.webp'));
