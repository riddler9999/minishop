import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway README mentions Supabase-hosted images',()=>assert.match(fs.readFileSync('api/README.md','utf8'),/Supabase-hosted image URLs/));
