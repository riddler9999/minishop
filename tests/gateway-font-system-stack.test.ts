import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSS keeps Myanmar and system font fallbacks',()=>{ const s=fs.readFileSync('src/index.css','utf8'); assert.match(s,/Noto Sans Myanmar/); assert.match(s,/Myanmar Text/); assert.match(s,/system-ui/); });
