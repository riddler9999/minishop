import type {StoreDesignDocument, StoreDesignLifecycle} from '../../../domain/storeDesign/index.ts';
import {normalizeStoreDesign} from '../../../domain/storeDesign/index.ts';

type RpcResult = Promise<{data: unknown; error: unknown}>;

export interface StoreDesignRpcClient {
  rpc(fn: string, args?: Record<string, unknown>): RpcResult;
}

export class StoreDesignConflictError extends Error {
  readonly code = 'STORE_DESIGN_CONFLICT';
  constructor(message = 'Store Design changed elsewhere. Reload or recover before saving again.') {
    super(message);
    this.name = 'StoreDesignConflictError';
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as {message?: unknown}).message ?? 'Store Design request failed');
  }
  return String(error ?? 'Store Design request failed');
}

function throwRpcError(error: unknown): never {
  const message = errorMessage(error);
  if (message.includes('store_design_conflict')) throw new StoreDesignConflictError();
  throw new Error(message);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Store Design response');
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid Store Design ${field}`);
  return n;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function mapLifecycle(data: unknown): StoreDesignLifecycle {
  const row = asRecord(data);
  return {
    draft: normalizeStoreDesign(row.draft_document),
    published: normalizeStoreDesign(row.published_document),
    previousPublished: row.previous_published_document == null
      ? null
      : normalizeStoreDesign(row.previous_published_document),
    draftRevision: asNumber(row.draft_revision, 'draft revision'),
    publishedRevision: asNumber(row.published_revision, 'published revision'),
    updatedAt: asNullableString(row.updated_at),
    publishedAt: asNullableString(row.published_at),
  };
}

export function createStoreDesignLifecycleAdapter(client: StoreDesignRpcClient) {
  return {
    async loadOwnStoreDesign(): Promise<StoreDesignLifecycle> {
      const {data, error} = await client.rpc('load_own_store_design');
      if (error) throwRpcError(error);
      return mapLifecycle(data);
    },

    async saveDraft(input: {expectedRevision: number; document: StoreDesignDocument}) {
      const {data, error} = await client.rpc('save_store_design_draft', {
        p_expected_revision: input.expectedRevision,
        p_document: input.document as unknown as Record<string, unknown>,
      });
      if (error) throwRpcError(error);
      const row = asRecord(data);
      return {
        revision: asNumber(row.revision, 'draft revision'),
        document: normalizeStoreDesign(row.document),
      };
    },

    async publishDraft(input: {expectedDraftRevision: number}): Promise<StoreDesignLifecycle> {
      const {data, error} = await client.rpc('publish_store_design_draft', {
        p_expected_draft_revision: input.expectedDraftRevision,
      });
      if (error) throwRpcError(error);
      return mapLifecycle(data);
    },

    async rollbackPublished(): Promise<StoreDesignLifecycle> {
      const {data, error} = await client.rpc('rollback_store_design_published');
      if (error) throwRpcError(error);
      return mapLifecycle(data);
    },
  };
}
