import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {getYangonAnalyticsWindow, yangonDayKey} from '../src/features/admin/lib/analyticsTime.ts';

describe('admin analytics Yangon calendar boundaries', () => {
  it('uses Yangon midnight even when the instant is still the previous UTC day', () => {
    const now = new Date('2026-09-20T18:00:00.000Z'); // Sep 21 00:30 in Yangon
    const window = getYangonAnalyticsWindow(now);

    assert.equal(window.todayStart.toISOString(), '2026-09-20T17:30:00.000Z');
    assert.equal(window.currentStart.toISOString(), '2026-09-14T17:30:00.000Z');
    assert.equal(window.previousStart.toISOString(), '2026-09-07T17:30:00.000Z');
    assert.equal(window.previousEnd.toISOString(), '2026-09-14T17:30:00.000Z');
  });

  it('assigns UTC timestamps to the correct Yangon business day', () => {
    assert.equal(yangonDayKey(new Date('2026-09-20T17:29:59.999Z')), '2026-09-20');
    assert.equal(yangonDayKey(new Date('2026-09-20T17:30:00.000Z')), '2026-09-21');
  });
});
