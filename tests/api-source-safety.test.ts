import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const file of fs.readdirSync('api', {recursive:true}).filter((x) => typeof x === 'string' && x.endsWith('.ts'))) {
  test(`api/${file} does not reference service role`, () => {
    const source = fs.readFileSync(`api/${file}`, 'utf8');
    assert.doesNotMatch(source, /service[_-]?role/i);
  });
}
