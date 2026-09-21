import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Vercel still builds Vite to dist',()=>{ const c=JSON.parse(fs.readFileSync('vercel.json','utf8')); assert.equal(c.buildCommand,'vite build'); assert.equal(c.outputDirectory,'dist'); });
