import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFileSync} from 'node:fs';

const loginSource = readFileSync(new URL('../src/features/auth/pages/Login.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

describe('animated auth surface contract', () => {
  it('uses a dedicated animated gradient border shell without replacing auth behavior', () => {
    assert.match(loginSource, /auth-gradient-shell/);
    assert.match(loginSource, /auth-gradient-card/);
    assert.match(loginSource, /signIn\(email, password\)/);
    assert.match(loginSource, /signUp\(email, password, from\)/);
    assert.match(loginSource, /signInWithGoogle\(from\)/);
    assert.match(loginSource, /verifyEmailOtp\(email, code\)/);
    assert.match(loginSource, /resendSignupCode\(email\)/);
  });

  it('implements the rotating conic-gradient border and reduced-motion fallback', () => {
    assert.match(cssSource, /\.auth-gradient-shell/);
    assert.match(cssSource, /conic-gradient/);
    assert.match(cssSource, /@keyframes auth-gradient-spin/);
    assert.match(cssSource, /prefers-reduced-motion:\s*reduce/);
  });
});
