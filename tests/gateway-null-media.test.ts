import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPartyMediaUrl} from '../src/features/catalog/api/mappers.ts';

test('null media remains null',()=>assert.equal(firstPartyMediaUrl(null),null));
