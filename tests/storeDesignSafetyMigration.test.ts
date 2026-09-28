import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const migrationPath = new URL('../supabase/migrations/0028_store_design_schema_revision_safety.sql', import.meta.url);

describe('Task 7 Store Design schema and revision safety migration contract', () => {
  it('uses a forward-only hardening migration and keeps historical 0024 untouched', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /begin;/i);
    assert.match(sql, /create or replace function store_design_private\.is_store_design_document_valid/i);
    assert.doesNotMatch(sql, /alter\s+table\s+public\.store_designs\s+drop/i);
  });

  it('accepts only an explicit TRUE validator result and bounds document shape and size', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /is_store_design_document_valid\([^)]*\)\s+is not true/i);
    assert.match(sql, /octet_length\(p_document::text\)\s*<=\s*262144/i);
    assert.match(sql, /jsonb_array_length\(p_document\s*#>\s*'\{templates,home,sections\}'\)\s*<=\s*50/i);
    assert.match(sql, /jsonb_array_length\(p_document\s*#>\s*'\{templates,collection,sections\}'\)\s*<=\s*50/i);
    assert.match(sql, /jsonb_array_length\(p_document\s*#>\s*'\{templates,product,sections\}'\)\s*<=\s*50/i);
  });

  it('rejects missing, null, zero, negative, and stale expected revisions with null-safe comparison', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /p_expected_revision\s+is null\s+or\s+p_expected_revision\s*<\s*1/i);
    assert.match(sql, /p_expected_draft_revision\s+is null\s+or\s+p_expected_draft_revision\s*<\s*1/i);
    assert.match(sql, /v_design\.draft_revision\s+is distinct from\s+p_expected_revision/i);
    assert.match(sql, /v_design\.draft_revision\s+is distinct from\s+p_expected_draft_revision/i);
  });

  it('makes rollback revision-aware so retries cannot toggle Published state twice', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /rollback_store_design_published_internal\(\s*p_expected_published_revision bigint\s*\)/i);
    assert.match(sql, /public\.rollback_store_design_published\(\s*p_expected_published_revision bigint\s*\)/i);
    assert.match(sql, /v_design\.published_revision\s+is distinct from\s+p_expected_published_revision/i);
  });
});
