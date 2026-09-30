import test from 'node:test';
import assert from 'node:assert/strict';
import {PUBLIC_READ_CACHE, PUBLIC_MEDIA_CACHE} from '../api/_cache.ts';

test('read cache supports stale-while-revalidate', () => assert.match(PUBLIC_READ_CACHE, /stale-while-revalidate/));
test('media cache is longer than read cache', () => assert.match(PUBLIC_MEDIA_CACHE, /s-maxage=86400/));
