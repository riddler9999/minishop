import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media endpoint constructs upstream from configured base only',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.doesNotMatch(s,/req\.query\?.*(url|host|origin)/i); assert.match(s,/fetch\(`\$\{base\}\/storage/); });
