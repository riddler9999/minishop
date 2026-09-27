import type {StoreDesignDocument} from '../../../domain/storeDesign/index.ts';

export const SAVE_DELAY = 700;
export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'retry' | 'conflict';

export type EditorState = {
  document: StoreDesignDocument;
  status: SaveStatus;
  expectedRevision: number;
  savedRevision: number;
  lastSavedRevision: number;
  blocked: boolean;
  error: string | null;
};

export type SaveDraft = (input: {expectedRevision: number; document: StoreDesignDocument}) => Promise<{revision: number; document: StoreDesignDocument}>;
export type PublishDraft = (input: {expectedDraftRevision: number}) => Promise<unknown>;

export function createEditorState(document: StoreDesignDocument, revision: number): EditorState {
  return {document, status: 'saved', expectedRevision: revision, savedRevision: revision, lastSavedRevision: revision, blocked: false, error: null};
}

export function applyLocalEdit(state: EditorState, document: StoreDesignDocument): EditorState {
  if (state.blocked) return {...state, document};
  return {...state, document, status: 'dirty', error: null};
}

export async function persistEditorState(state: EditorState, saveDraft: SaveDraft): Promise<EditorState> {
  if (state.blocked || state.status === 'conflict') return state;
  const saving = {...state, status: 'saving' as const, error: null};
  try {
    const saved = await saveDraft({expectedRevision: saving.expectedRevision, document: saving.document});
    return {...saving, document: saved.document, status: 'saved', expectedRevision: saved.revision, savedRevision: saved.revision, lastSavedRevision: saved.revision};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('STORE_DESIGN_CONFLICT') || message.includes('store_design_conflict') || (error && typeof error === 'object' && 'code' in error && error.code === 'STORE_DESIGN_CONFLICT')) {
      return {...saving, status: 'conflict', blocked: true, error: message};
    }
    return {...saving, status: 'retry', error: message};
  }
}

export function canPublish(state: EditorState) {
  return !state.blocked && state.status === 'saved' && state.savedRevision === state.lastSavedRevision;
}

export async function publishSavedDraft(state: EditorState, publishDraft: PublishDraft) {
  if (!canPublish(state)) throw new Error('Save the latest Draft before publishing.');
  return publishDraft({expectedDraftRevision: state.lastSavedRevision});
}

export function debounceSaveIntent(callback: () => void, delay = SAVE_DELAY) {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
}
