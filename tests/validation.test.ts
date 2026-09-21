import test from 'node:test';
import assert from 'node:assert/strict';
import {clean, positiveInt} from '../api/_validation.ts';

test('clean trims and bounds public input', () => assert.equal(clean('  abc  ', 2), 'ab'));
test('positiveInt clamps public pagination', () => {
  assert.equal(positiveInt('500', 10, 100), 100);
  assert.equal(positiveInt('bad', 10, 100), 10);
});
