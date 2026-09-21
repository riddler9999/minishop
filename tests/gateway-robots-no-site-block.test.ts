import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('robots does not disallow the storefront root',()=>{ const s=fs.readFileSync('public/robots.txt','utf8'); assert.doesNotMatch(s,/Disallow: \/\s*$/m); assert.match(s,/Disallow: \/api\//); });
