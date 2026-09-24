import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Vercel API runtime imports do not retain TypeScript extensions', () => {
  const files = fs
    .readdirSync('api', {recursive: true})
    .filter((file) => typeof file === 'string' && file.endsWith('.ts') && !file.endsWith('.d.ts'));

  const offenders: string[] = [];
  for (const file of files) {
    const source = fs.readFileSync(`api/${file}`, 'utf8');
    if (/from\s+['"]\.{1,2}\/[^'"]+\.ts['"]/.test(source)) offenders.push(String(file));
  }

  assert.deepEqual(offenders, []);
});
