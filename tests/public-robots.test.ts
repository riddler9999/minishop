import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('robots disallows API crawling', () => assert.match(fs.readFileSync('public/robots.txt','utf8'), /Disallow: \/api\//));
