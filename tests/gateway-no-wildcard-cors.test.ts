import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('API sources contain no wildcard origin header',()=>{ for(const f of fs.readdirSync('api',{recursive:true}).filter(x=>typeof x==='string'&&x.endsWith('.ts'))){ const s=fs.readFileSync(`api/${f}`,'utf8'); assert.doesNotMatch(s,/Access-Control-Allow-Origin/); } });
