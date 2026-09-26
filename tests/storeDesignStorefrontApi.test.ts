import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {loadBuyerStoreDesign} from '../api/_store-design.ts';

describe('Published-only buyer Store Design read path', () => {
  it('returns Published and does not touch legacy theme when lifecycle data exists', async () => {
    const published = {schemaVersion: 1, themeId: 'dark-modern'};
    let legacyReads = 0;

    const result = await loadBuyerStoreDesign({
      loadPublished: async () => ({data: {document: published}, error: null}),
      loadLegacyTheme: async () => {
        legacyReads += 1;
        return {data: {theme: {presetId: 'minimal'}}, error: null};
      },
    });

    assert.deepEqual(result, published);
    assert.equal(legacyReads, 0);
  });

  it('falls back to legacy theme only when the lifecycle RPC succeeds without a document', async () => {
    const legacy = {presetId: 'fashion'};
    let legacyReads = 0;

    const result = await loadBuyerStoreDesign({
      loadPublished: async () => ({data: null, error: null}),
      loadLegacyTheme: async () => {
        legacyReads += 1;
        return {data: {theme: legacy}, error: null};
      },
    });

    assert.deepEqual(result, legacy);
    assert.equal(legacyReads, 1);
  });

  it('does not silently fall back when the Published RPC fails', async () => {
    let legacyReads = 0;

    await assert.rejects(
      loadBuyerStoreDesign({
        loadPublished: async () => ({data: null, error: {message: 'database unavailable'}}),
        loadLegacyTheme: async () => {
          legacyReads += 1;
          return {data: {theme: {presetId: 'fashion'}}, error: null};
        },
      }),
      /Published Store Design unavailable/,
    );

    assert.equal(legacyReads, 0);
  });

  it('preserves the existing fail-safe default path when the legacy fallback query fails', async () => {
    const result = await loadBuyerStoreDesign({
      loadPublished: async () => ({data: null, error: null}),
      loadLegacyTheme: async () => ({data: null, error: {message: 'legacy column unavailable'}}),
    });

    assert.equal(result, null);
  });
});
