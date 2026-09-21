import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {FONT_PAIRINGS, FONT_PAIRING_IDS, DEFAULT_FONT_PAIRING, isFontPairingId} from '../src/domain/fontPairing.ts';

describe('fontPairing registry', () => {
  it('FONT_PAIRING_IDS matches the registry keys exactly', () => {
    assert.deepEqual(FONT_PAIRING_IDS.sort(), Object.keys(FONT_PAIRINGS).sort());
  });

  it('the default pairing id is a real entry', () => {
    assert.ok(DEFAULT_FONT_PAIRING in FONT_PAIRINGS);
  });

  it('every pairing keeps the Myanmar fallback ahead of any generic fallback', () => {
    for (const id of FONT_PAIRING_IDS) {
      const pairing = FONT_PAIRINGS[id];
      assert.ok(pairing.display.includes('Pyidaungsu'), `${id}.display missing Myanmar fallback`);
      assert.ok(pairing.body.includes('Pyidaungsu'), `${id}.body missing Myanmar fallback`);
    }
  });

  it('isFontPairingId accepts only known ids', () => {
    for (const id of FONT_PAIRING_IDS) assert.equal(isFontPairingId(id), true);
    for (const bad of ['luxury', '', 123, null, undefined, {}, []]) {
      assert.equal(isFontPairingId(bad as unknown), false);
    }
  });
});
