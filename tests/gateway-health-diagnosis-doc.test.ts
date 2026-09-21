import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health docs distinguish backend from client network path',()=>assert.match(fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'),/distinguishes origin\/backend failure from a client network path problem/));
