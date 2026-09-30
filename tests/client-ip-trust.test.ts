import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {forwardedClientIp} from '../server/_client-ip.ts';

describe('storefront client IP trust boundary', () => {
  it('prefers the platform-controlled socket peer over caller supplied forwarding headers', () => {
    const req = {
      socket: {remoteAddress: '203.0.113.10'},
      headers: {'x-forwarded-for': '198.51.100.99, 203.0.113.50'},
    };
    assert.equal(forwardedClientIp(req), '203.0.113.10');
  });

  it('uses only the first normalized forwarded address when the runtime has no socket peer', () => {
    const req = {
      socket: {},
      headers: {'x-forwarded-for': '198.51.100.20, 203.0.113.50'},
    };
    assert.equal(forwardedClientIp(req), '198.51.100.20');
  });

  it('fails closed to one shared unknown key when no platform identity is available', () => {
    assert.equal(forwardedClientIp({socket: {}, headers: {}}), 'unknown');
  });
});
