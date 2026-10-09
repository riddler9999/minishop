import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, ChevronDown, Monitor, Smartphone, Sparkles, Undo2, Redo2, X} from 'lucide-react';
import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreTemplateName} from '@/domain/storeDesign';
import {PreviewCanvas} from './PreviewCanvas';
import {AiChatPanel} from './AiChatPanel';
import {
  SAVE_DELAY, applyLocalEdit, createEditorState, createDocumentHistory,
  pushHistory, undoHistory, redoHistory, debounceSaveIntent,
  persistEditorState, publishSavedDraft, reconcileSaveResult,
  type EditorState, type DocumentHistoryState,
} from './editorState';
import {
  createInitialConversation, appendUserMessage, appendAssistantProposal, setProposalApplicationStatus,
  type AiConversation,
} from '@/domain/aiConversation';
import type {AiProposal} from '@/domain/aiGateway';
import {adminApi} from '@/data/dataSource';
import type {AiProviderId} from '@/domain/aiProvider';
import {validateAndExecuteAiCommands} from '@/domain/storeDesign/aiCommands';

type Props = {
  initialDocument: StoreDesignDocument;
  initialRevision: number;
  products: Product[];
  categories: string[];
  shopName: string;
  saveDraft: (input: {expectedRevision: number; document: StoreDesignDocument}) => Promise<{revision: number; document: StoreDesignDocument}>;
  publishDraft: (input: {expectedDraftRevision: number}) => Promise<unknown>;
};

export function StoreBuilderShell({initialDocument, initialRevision, products, categories, shopName, saveDraft, publishDraft}: Props) {
  const [editor, setEditor] = useState<EditorState>(() => createEditorState(initialDocument, initialRevision));
  const [history, setHistory] = useState<DocumentHistoryState>(() => createDocumentHistory(initialDocument));
  const [template, setTemplate] = useState<StoreTemplateName>('home');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [conversation, setConversation] = useState<AiConversation>(() => createInitialConversation('shop_active'));
  const documentRevision = useRef(crypto.randomUUID());
  const requestInFlight = useRef(false);

  const runSave = (snapshot: EditorState) => {
    if (snapshot.blocked || snapshot.status === 'conflict') return;
    setEditor((current) => current === snapshot ? {...current, status: 'saving', error: null} : current);
    void persistEditorState(snapshot, saveDraft).then((result) => {
      setEditor((current) => reconcileSaveResult(current, snapshot, result));
    });
  };

  useEffect(() => {
    if (editor.status !== 'dirty' || editor.blocked) return;
    return debounceSaveIntent(() => runSave(editor), SAVE_DELAY);
  }, [editor, saveDraft]);

  const updateDocument = (doc: StoreDesignDocument) => {
    documentRevision.current = crypto.randomUUID();
    setHistory((prev) => pushHistory(prev, doc));
    setEditor((current) => applyLocalEdit(current, doc));
  };

  const handleUndo = () => {
    const {history: next, doc} = undoHistory(history);
    if (doc) {
      documentRevision.current = crypto.randomUUID();
      setHistory(next);
      setEditor((current) => applyLocalEdit(current, doc));
    }
  };
  const handleRedo = () => {
    const {history: next, doc} = redoHistory(history);
    if (doc) {
      documentRevision.current = crypto.randomUUID();
      setHistory(next);
      setEditor((current) => applyLocalEdit(current, doc));
    }
  };

  const handleApplyProposal = (proposal: AiProposal) => {
    if (proposal.baseRevision !== documentRevision.current) {
      throw new Error('The draft changed since the AI suggestion. Please generate a new suggestion.');
    }
    const result = validateAndExecuteAiCommands(editor.document, proposal.commands, {
      mediaById: proposal.trustedMedia,
    });
    if (!result.ok || result.appliedCommandsCount === 0) {
      throw new Error(result.errors.map((error) => error.message).join('; ') || 'AI did not produce an applicable change.');
    }
    updateDocument(result.doc);
    setConversation((current) => setProposalApplicationStatus(current, proposal.id, 'applied'));
  };

  const handleSendMessage = async (prompt: string, media: {id: string; url: string}[]) => {
    if (requestInFlight.current) throw new Error('Please wait until the previous AI request finishes.');
    requestInFlight.current = true;
    try {
      const baseRevision = documentRevision.current;
      const {conversation: updated} = appendUserMessage(conversation, prompt, media.map((item) => item.url));
      setConversation(updated);
      const credentials = await adminApi.listAiCredentials();
      const provider = credentials.credentials.find((item) => item.configured)?.provider as AiProviderId | undefined;
      if (!provider) throw new Error('Configure an AI provider in AI Settings first.');
      const {proposal} = await adminApi.generateAiStoreProposal({
        provider,
        message: prompt,
        currentDoc: editor.document,
        mediaIds: media.map((item) => item.id),
        baseRevision,
      });
      const {conversation: next} = appendAssistantProposal(updated, proposal);
      // Apply safe, validated edits immediately. Destructive edits remain
      // proposals and require an explicit confirmation in the chat.
      if (!proposal.isDestructive) {
        if (baseRevision !== documentRevision.current) {
          throw new Error('The draft changed while AI was working. Please retry.');
        }
        const result = validateAndExecuteAiCommands(editor.document, proposal.commands, {
          mediaById: proposal.trustedMedia,
        });
        if (!result.ok || result.appliedCommandsCount === 0) {
          throw new Error(result.errors.map((error) => error.message).join('; ') || 'AI did not produce an applicable change.');
        }
        updateDocument(result.doc);
        setConversation(setProposalApplicationStatus(next, proposal.id, 'applied'));
      } else {
        setConversation(next);
      }
    } finally {
      requestInFlight.current = false;
    }
  };

  const saveLabel = editor.status === 'saving' ? 'Saving…'
    : editor.status === 'saved' ? 'Saved'
    : editor.status === 'retry' ? 'Retry save'
    : editor.status === 'conflict' ? 'Conflict detected' : 'Unsaved changes';

  const chat = (
    <AiChatPanel
      conversation={conversation}
      disabled={editor.blocked}
      onSendMessage={handleSendMessage}
      onApplyProposal={handleApplyProposal}
      onUndoLastEdit={handleUndo}
      canUndo={history.past.length > 0}
    />
  );

  return (
    <div className="store-builder-workspace flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]" data-store-builder="ai-chat-preview" data-editor-fullscreen>
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 sm:px-5" aria-label="Store Builder toolbar">
        <Link to="/admin/online-store/themes" aria-label="Back to Store Themes" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg hover:bg-[var(--admin-primary-soft)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold"><Sparkles className="h-4 w-4" /> AI Store Builder</p>
          <p className="text-xs text-[var(--admin-muted)]" role="status" data-save-status={editor.status}>{saveLabel}</p>
        </div>
        <label className="relative order-3 w-full sm:order-none sm:w-auto">
          <span className="sr-only">Pages</span>
          <select aria-label="Pages" value={template} onChange={(event) => setTemplate(event.target.value as StoreTemplateName)} className="h-11 w-full appearance-none rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] py-2 pl-3 pr-9 text-sm sm:w-44">
            <option value="home">Home page</option>
            <option value="collection">Collection page</option>
            <option value="product">Product page</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4" />
        </label>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Undo" disabled={history.past.length === 0} onClick={handleUndo} className="grid h-10 w-10 place-items-center rounded-lg disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
          <button type="button" aria-label="Redo" disabled={history.future.length === 0} onClick={handleRedo} className="grid h-10 w-10 place-items-center rounded-lg disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
        </div>
        <div className="hidden items-center rounded-lg border border-[var(--admin-border)] sm:flex" aria-label="Preview viewport">
          <button type="button" aria-label="Desktop" aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')} className="grid h-10 w-10 place-items-center"><Monitor className="h-4 w-4" /></button>
          <button type="button" aria-label="Mobile" aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')} className="grid h-10 w-10 place-items-center"><Smartphone className="h-4 w-4" /></button>
        </div>
        {editor.status === 'retry' && <button type="button" onClick={() => runSave(editor)} className="rounded-lg border px-3 py-2 text-sm">Retry</button>}
        <button type="button" disabled={editor.status !== 'saved' || editor.blocked} onClick={() => void publishSavedDraft(editor, publishDraft)} className="min-h-11 rounded-lg bg-[var(--admin-primary)] px-4 text-sm font-bold disabled:opacity-40">Publish</button>
      </header>

      {editor.status === 'conflict' && <div role="alert" className="flex items-center justify-between gap-2 bg-red-50 p-3 text-sm text-red-800">
        <span>Another session changed this draft. Reload before continuing.</span>
        <button type="button" onClick={() => window.location.reload()} className="rounded border px-3 py-2">Reload</button>
      </div>}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]" data-layout="ai-chat-preview">
        <aside className="hidden min-h-0 overflow-hidden border-r border-[var(--admin-border)] lg:block" aria-label="AI Store Assistant">
          {chat}
        </aside>
        <main className="min-h-0 min-w-0 overflow-auto pb-20 lg:pb-0" data-mobile-preview-first>
          <PreviewCanvas
            document={editor.document}
            template={template}
            products={products}
            categories={categories}
            shopName={shopName}
            viewport={viewport}
            selectedSectionId={null}
            onSectionSelect={() => {}}
          />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <button type="button" onClick={() => setMobileChatOpen(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--admin-primary)] font-bold">
          <Sparkles className="h-5 w-5" /> Ask AI to edit your store
        </button>
      </div>
      {mobileChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40 lg:hidden" role="dialog" aria-modal="true" aria-label="AI Store Assistant">
          <button type="button" aria-label="Close AI chat" onClick={() => setMobileChatOpen(false)} className="min-h-12 self-end px-5 text-white"><X className="h-6 w-6" /></button>
          <div className="min-h-0 flex-1 overflow-hidden rounded-t-2xl bg-white">{chat}</div>
        </div>
      )}
    </div>
  );
}
