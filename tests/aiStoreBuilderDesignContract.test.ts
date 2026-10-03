import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const design = fs.readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8');
const plan = fs.readFileSync(new URL('../docs/superpowers/plans/2026-10-03-minishop-admin-v3-ai-store-builder-implementation.md', import.meta.url), 'utf8');

describe('AI Store Builder Task 1 design contract', () => {
  it('makes English the canonical admin and editor chrome language', () => {
    assert.match(design, /Admin and Store Builder chrome use English only/i);
    assert.doesNotMatch(design, /Seller copy defaults to natural Burmese/i);
    assert.doesNotMatch(design, /seller\/admin copy defaults to Burmese/i);
  });

  it('keeps buyer storefront localization independent from admin/editor language', () => {
    assert.match(design, /Buyer storefront localization remains independent/i);
  });

  it('makes the approved AI-first builder direction authoritative', () => {
    assert.match(design, /AI-first Store Builder/i);
    assert.match(design, /AI conversation \+ preview/i);
    assert.match(design, /AI never publishes automatically/i);
  });

  it('aligns durable contract with the approved Admin V3 plan', () => {
    assert.ok(plan.includes('**Admin language:** English only'));
    assert.match(plan, /AI changes Draft only\. AI cannot Publish automatically/i);
  });
});
