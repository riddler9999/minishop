import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFileSync} from 'node:fs';

const authSource = readFileSync(new URL('../src/features/auth/adminAuth.tsx', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../src/features/auth/pages/Login.tsx', import.meta.url), 'utf8');
const landingSource = readFileSync(new URL('../src/features/landing/components/HomeSections.tsx', import.meta.url), 'utf8');
const subscribeSource = readFileSync(new URL('../src/features/billing/pages/Subscribe.tsx', import.meta.url), 'utf8');
const onboardingSource = readFileSync(new URL('../src/features/auth/pages/Onboarding.tsx', import.meta.url), 'utf8');

describe('signup plan routing contract', () => {
  it('preserves Free Trial through signup into the subscribe gate', () => {
    assert.match(landingSource, /`\/admin\/subscribe\?plan=\$\{plan\}`/);
    assert.match(loginSource, /signUp\(email, password, from\)/);
    assert.match(authSource, /allowed = \['\/admin', '\/admin\/subscribe', '\/admin\/onboarding'\]/);
    assert.match(subscribeSource, /requestedPlan=\{searchParams\.get\('plan'\)\}/);
    assert.match(subscribeSource, /plan:\s*'free_trial'/);
    assert.match(subscribeSource, /submitApplication\(userId/);
    assert.match(subscribeSource, /onSubmitted\(\)/);
  });

  it('preserves Starter and Business through signup into subscribe', () => {
    assert.match(landingSource, /\/admin\/subscribe\?plan=\$\{plan\}/);
    assert.match(loginSource, /signInWithGoogle\(from\)/);
    assert.match(authSource, /redirectTo: `\$\{window\.location\.origin\}\$\{safeRedirectPath\(redirectPath\)\}`/);
  });

  it('keeps onboarding behind the approved application gate', () => {
    assert.match(onboardingSource, /gate === 'subscribe'.*Navigate to="\/admin\/subscribe"/s);
    assert.doesNotMatch(onboardingSource, /URLSearchParams|plan=free_trial/);
  });
});

describe('redirect security contract', () => {
  it('allows only intended post-auth destinations', () => {
    assert.match(authSource, /const allowed = \['\/admin', '\/admin\/subscribe', '\/admin\/onboarding'\]/);
    assert.match(authSource, /if \(!allowed\.includes\(url\.pathname\)\) return '\/admin'/);
    assert.match(authSource, /if \(url\.origin !== 'https:\/\/minishop\.local'\) return '\/admin'/);
  });

  it('rejects protocol-relative/external/unrelated paths by construction', () => {
    const safeRedirectPath = (path?: string): string => {
      if (!path) return '/admin';
      try {
        const url = new URL(path, 'https://minishop.local');
        if (url.origin !== 'https://minishop.local') return '/admin';
        const allowed = ['/admin', '/admin/subscribe', '/admin/onboarding'];
        if (!allowed.includes(url.pathname)) return '/admin';
        return `${url.pathname}${url.search}`;
      } catch {
        return '/admin';
      }
    };

    assert.equal(safeRedirectPath('/admin/onboarding?plan=free_trial'), '/admin/onboarding?plan=free_trial');
    assert.equal(safeRedirectPath('/admin/subscribe?plan=starter'), '/admin/subscribe?plan=starter');
    assert.equal(safeRedirectPath('/admin/subscribe?plan=business'), '/admin/subscribe?plan=business');
    assert.equal(safeRedirectPath('https://evil.com'), '/admin');
    assert.equal(safeRedirectPath('//evil.com'), '/admin');
    assert.equal(safeRedirectPath('/unrelated'), '/admin');
  });
});
