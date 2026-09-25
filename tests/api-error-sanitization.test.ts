import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {mapDbError} from '../src/domain/dbError.ts';

describe('privileged API error sanitization', () => {
  it('does not expose unknown database details to callers', () => {
    const raw = 'duplicate key value violates unique constraint "shops_slug_key"';
    const safe = mapDbError(raw, 'Action failed');
    assert.equal(safe, 'Action failed');
    assert.doesNotMatch(safe, /shops_slug_key|duplicate key/i);
  });

  it('preserves known typed domain errors as safe messages', () => {
    assert.equal(
      mapDbError('duplicate_payment', 'Action failed'),
      'ဤငွေပေးချေမှုကို ထည့်သွင်းပြီးဖြစ်ပါသည်။',
    );
  });
});
