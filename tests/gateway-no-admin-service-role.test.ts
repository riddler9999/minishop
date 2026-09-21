import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('frontend client explicitly forbids service role key',()=>assert.match(fs.readFileSync('src/core/supabase/client.ts','utf8'),/Never put the service_role key in frontend code/));
