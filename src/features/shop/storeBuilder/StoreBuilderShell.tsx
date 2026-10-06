import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Layers3,
  Monitor,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Undo2,
  Redo2,
  Bot,
} from 'lucide-react';
import type {Product} from '@/domain/product';
import type {
  StoreDesignDocument,
  StoreSection,
  StoreSectionType,
  StoreTemplateName,
} from '@/domain/storeDesign';
import {AddSectionPanel} from './AddSectionPanel';
import {Inspector} from './Inspector';
import {MobileEditorPanels} from './MobileEditorPanels';
import {PreviewCanvas} from './PreviewCanvas';
import {SectionTree} from './SectionTree';
import {AiChatPanel} from './AiChatPanel';
import {
  SAVE_DELAY,
  applyLocalEdit,
  createEditorState,
  createDocumentHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  debounceSaveIntent,
  persistEditorState,
  publishSavedDraft,
  reconcileSaveResult,
  type EditorState,
  type DocumentHistoryState,
} from './editorState';
import {
  addSection,
  removeSection,
  reorderSection,
  replaceSection,
  setSectionEnabled,
} from './sectionOperations';
import {
  createInitialConversation,
  appendUserMessage,
  appendAssistantProposal,
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
  saveDraft: (input: {
    expectedRevision: number;
    document: StoreDesignDocument;
  }) => Promise<{revision: number; document: StoreDesignDocument}>;
  publishDraft: (input: {expectedDraftRevision: number}) => Promise<unknown>;
};

export function StoreBuilderShell({
  initialDocument,
  initialRevision,
  products,
  categories,
  shopName,
  saveDraft,
  publishDraft,
}: Props) {
  const [editor, setEditor] = useState<EditorState>(() =>
    createEditorState(initialDocument, initialRevision)
  );
  const [history, setHistory] = useState<DocumentHistoryState>(() =>
    createDocumentHistory(initialDocument)
  );
  const [template, setTemplate] = useState<StoreTemplateName>('home');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [leftTab, setLeftTab] = useState<'ai' | 'sections'>('ai');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialDocument.templates.home.sections[0]?.id ?? null
  );
  const [mobilePanel, setMobilePanel] = useState<'ai' | 'tree' | 'inspector' | null>(null);

  const [conversation, setConversation] = useState<AiConversation>(() =>
    createInitialConversation('shop_active')
  );

  const runSave = (snapshot: EditorState) => {
    if (snapshot.blocked || snapshot.status === 'conflict') return;
    setEditor((current) =>
      current === snapshot ? {...current, status: 'saving', error: null} : current
    );
    void persistEditorState(snapshot, saveDraft).then((result) => {
      setEditor((current) => reconcileSaveResult(current, snapshot, result));
    });
  };

  useEffect(() => {
    if (editor.status !== 'dirty' || editor.blocked) return;
    return debounceSaveIntent(() => runSave(editor), SAVE_DELAY);
  }, [editor, saveDraft]);

  const sections = editor.document.templates[template].sections;
  const selected = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId]
  );

  const updateDocument = (nextDoc: StoreDesignDocument) => {
    setHistory((prev) => pushHistory(prev, nextDoc));
    setEditor((current) => applyLocalEdit(current, nextDoc));
  };

  const handleUndo = () => {
    const {history: nextHistory, doc} = undoHistory(history);
    if (doc) {
      setHistory(nextHistory);
      setEditor((current) => applyLocalEdit(current, doc));
    }
  };

  const handleRedo = () => {
    const {history: nextHistory, doc} = redoHistory(history);
    if (doc) {
      setHistory(nextHistory);
      setEditor((current) => applyLocalEdit(current, doc));
    }
  };

  const handleSendMessage = async (prompt: string, media: {id: string; url: string}[]) => {
    const {conversation: updatedConv} = appendUserMessage(conversation, prompt, media.map((item) => item.url));
    setConversation(updatedConv);

    const credentials = await adminApi.listAiCredentials();
    const provider = credentials.credentials.find((item) => item.configured)?.provider as AiProviderId | undefined;
    if (!provider) throw new Error('Configure an AI provider in AI Settings first.');
    const {proposal} = await adminApi.generateAiStoreProposal({
      provider,
      message: prompt,
      currentDoc: editor.document,
      mediaIds: media.map((item) => item.id),
    });

    const {conversation: finalConv} = appendAssistantProposal(updatedConv, proposal);
    setConversation(finalConv);

  };

  const handleApplyProposal = (proposal: AiProposal) => {
    const result = validateAndExecuteAiCommands(editor.document, proposal.commands, {
      mediaById: proposal.trustedMedia,
    });
    if (result.ok === true) {
      updateDocument(result.doc);
    }
  };

  const selectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    if (mobilePanel === 'tree') setMobilePanel(null);
  };

  const selectPreviewSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    if (window.matchMedia('(max-width: 1023px)').matches) setMobilePanel('inspector');
  };

  useEffect(() => {
    if (!sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(sections[0]?.id ?? null);
    }
  }, [sections, selectedSectionId]);

  const add = (type: StoreSectionType) => {
    const result = addSection(editor.document, template, type);
    updateDocument(result.document);
    setSelectedSectionId(result.section.id);
  };

  const remove = (sectionId: string) => {
    const index = sections.findIndex((section) => section.id === sectionId);
    const document = removeSection(editor.document, template, sectionId);
    updateDocument(document);
    if (document !== editor.document) {
      setSelectedSectionId(
        document.templates[template].sections[Math.max(0, index - 1)]?.id ?? null
      );
    }
  };

  const changeSection = (section: StoreSection) =>
    updateDocument(replaceSection(editor.document, template, section));

  const treePanel = <><SectionTree sections={sections} selectedSectionId={selectedSectionId} blocked={editor.blocked} onSelect={selectSection} onMove={(sectionId, direction) => updateDocument(reorderSection(editor.document, template, sectionId, direction))} onToggle={(sectionId, enabled) => updateDocument(setSectionEnabled(editor.document, template, sectionId, enabled))} onRemove={remove} /><AddSectionPanel template={template} blocked={editor.blocked} onAdd={add} /></>;

  const inspectorPanel = <Inspector section={selected} products={products} categories={categories} blocked={editor.blocked} onChange={changeSection} />;

  const saveLabel =
    editor.status === 'saving'
      ? 'Saving…'
      : editor.status === 'saved'
      ? 'Saved'
      : editor.status === 'retry'
      ? 'Retry save'
      : editor.status === 'conflict'
      ? 'Conflict detected'
      : 'Unsaved changes';

  return (
    <div
      className="store-builder-workspace flex min-h-dvh w-full max-w-full flex-col overflow-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]"
      data-store-builder="three-pane"
      data-editor-fullscreen>
      {/* Top Toolbar */}
      <header
        className="z-20 flex min-h-[64px] flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 sm:px-5 lg:flex-nowrap"
        aria-label="Store Builder toolbar">
        <Link
          to="/admin/online-store/themes"
          onClick={(event) => {
            if (
              editor.status !== 'saved' &&
              !window.confirm('Unsaved changes will be lost. Go back?')
            )
              event.preventDefault();
          }}
          aria-label="Back to Store Themes"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[var(--admin-text)] transition hover:bg-[var(--admin-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="truncate text-sm font-bold leading-tight flex items-center gap-1.5">
            AI Store Builder
            <span className="rounded-md bg-[var(--admin-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-primary-hover)] uppercase tracking-wide">
              V3
            </span>
          </p>
          <p
            className="mt-0.5 text-xs font-medium text-[var(--admin-muted)]"
            role="status"
            data-save-status={editor.status}>
            {saveLabel}
          </p>
        </div>

        {/* Page Switcher & Viewport Controls */}
        <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
          <label className="relative min-w-0 flex-1 sm:max-w-[220px] sm:flex-none">
            <span className="sr-only">Pages</span>
            <select
              aria-label="Pages"
              value={template}
              onChange={(event) => {
                setTemplate(event.target.value as StoreTemplateName);
                setMobilePanel(null);
              }}
              className="h-11 w-full appearance-none rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] py-2 pl-3 pr-9 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]">
              <option value="home">Home page</option>
              <option value="collection">Collection page</option>
              <option value="product">Product page</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[var(--admin-muted)]" />
          </label>

          {/* Undo / Redo controls */}
          <div className="flex items-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-0.5">
            <button
              type="button"
              aria-label="Undo"
              disabled={history.past.length === 0}
              onClick={handleUndo}
              className="grid h-10 w-10 place-items-center rounded-md text-[var(--admin-text)] hover:bg-[var(--admin-surface)] disabled:opacity-30">
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Redo"
              disabled={history.future.length === 0}
              onClick={handleRedo}
              className="grid h-10 w-10 place-items-center rounded-md text-[var(--admin-text)] hover:bg-[var(--admin-surface)] disabled:opacity-30">
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div
            className="hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-0.5 lg:flex"
            role="group"
            aria-label="Preview viewport">
            <button
              type="button"
              aria-label="Desktop"
              aria-pressed={viewport === 'desktop'}
              onClick={() => setViewport('desktop')}
              className={`grid h-10 w-10 place-items-center rounded-md ${
                viewport === 'desktop'
                  ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              }`}>
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Mobile"
              aria-pressed={viewport === 'mobile'}
              onClick={() => setViewport('mobile')}
              className={`grid h-10 w-10 place-items-center rounded-md ${
                viewport === 'mobile'
                  ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              }`}>
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="hidden items-center gap-1.5 text-xs font-medium text-[var(--admin-muted)] sm:inline-flex"
            aria-live="polite">
            {editor.status === 'saved' && <Check className="h-3.5 w-3.5 text-emerald-700" />}
            {saveLabel}
          </span>
          {editor.status === 'retry' && (
            <button
              type="button"
              aria-label="ပြန်သိမ်းမည်"
              onClick={() => runSave(editor)}
              className="min-h-11 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]">
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobilePanel(null)}
            className="hidden min-h-11 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-semibold sm:inline-flex">
            Preview
          </button>
          <button
            type="button"
            disabled={editor.status !== 'saved' || editor.blocked}
            onClick={() => void publishSavedDraft(editor, publishDraft)}
            className="min-h-11 shrink-0 rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-bold text-[var(--admin-text)] transition hover:bg-[var(--admin-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)] disabled:cursor-not-allowed disabled:opacity-40">
            Publish
          </button>
        </div>
      </header>

      {editor.status === 'conflict' && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert">
          <span>Another session changed this draft. Reload before continuing.</span>
          <button
            type="button"
            aria-label="ပြန်ဖတ်မည်"
            onClick={() => window.location.reload()}
            className="min-h-11 rounded-lg border border-red-300 px-3 py-1.5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
            Reload
          </button>
        </div>
      )}

      {/* Main 3-Pane Desktop Workspace */}
      <div
        className="grid min-h-0 min-w-0 flex-1 grid-cols-1 lg:h-[calc(100dvh-64px)] lg:grid-cols-[240px_minmax(0,1fr)_300px]"
        data-layout="ai-first">
        {/* Left Rail: AI Chat / Sections Switcher */}
        <aside
          className="hidden flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] lg:flex"
          aria-label="AI Assistant and Sections">
          <div className="flex border-b border-[var(--admin-border)] bg-[var(--admin-canvas)] p-1">
            <button
              type="button"
              onClick={() => setLeftTab('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
                leftTab === 'ai'
                  ? 'bg-white text-[var(--admin-text)] shadow-xs'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              }`}>
              <Sparkles className="h-3.5 w-3.5 text-[var(--admin-primary-hover)]" />
              AI Assistant
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('sections')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
                leftTab === 'sections'
                  ? 'bg-white text-[var(--admin-text)] shadow-xs'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              }`}>
              <Layers3 className="h-3.5 w-3.5 text-[var(--admin-muted)]" />
              Sections
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {leftTab === 'ai' ? (
              <AiChatPanel
                conversation={conversation}
                disabled={editor.blocked}
                onSendMessage={handleSendMessage}
                onApplyProposal={handleApplyProposal}
                onUndoLastEdit={handleUndo}
                canUndo={history.past.length > 0}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4">{treePanel}</div>
            )}
          </div>
        </aside>

        {/* Center Canvas: Live Storefront Renderer */}
        <main
          className="order-first min-w-0 max-w-full lg:order-none"
          data-mobile-preview-first>
          <PreviewCanvas
            document={editor.document}
            template={template}
            products={products}
            categories={categories}
            shopName={shopName}
            viewport={viewport}
            selectedSectionId={selectedSectionId}
            onSectionSelect={selectPreviewSection}
          />
        </main>

        {/* Right Rail: Quick Inspector */}
        <aside
          className="hidden overflow-y-auto border-l border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 lg:block"
          aria-label="Inspector">
          <p className="mb-4 border-b border-[var(--admin-border)] pb-3 text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]">
            Inspector
          </p>
          {inspectorPanel}
        </aside>
      </div>

      {/* Mobile Toolbar */}
      <nav
        aria-label="Store Builder mobile tools"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(31,22,51,0.08)] lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel('ai')}
          className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-[var(--admin-primary-soft)] text-xs font-bold text-[var(--admin-primary-hover)]">
          <Bot className="h-4 w-4" />
          AI Chat
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('tree')}
          className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] text-xs font-semibold">
          <Layers3 className="h-4 w-4" />
          Sections
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('inspector')}
          className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-[var(--admin-primary)] text-xs font-semibold text-[var(--admin-text)]">
          <SlidersHorizontal className="h-4 w-4" />
          Inspector
        </button>
      </nav>

      {/* Mobile Drawer Sheets */}
      <MobileEditorPanels
        active={mobilePanel === 'ai' ? 'tree' : (mobilePanel as 'tree' | 'inspector' | null)}
        onClose={() => setMobilePanel(null)}
        tree={
          mobilePanel === 'ai' ? (
            <div className="h-[75dvh]">
              <AiChatPanel
                conversation={conversation}
                disabled={editor.blocked}
                onSendMessage={handleSendMessage}
                onApplyProposal={handleApplyProposal}
                onUndoLastEdit={handleUndo}
                canUndo={history.past.length > 0}
              />
            </div>
          ) : (
            treePanel
          )
        }
        inspector={inspectorPanel}
      />
    </div>
  );
}
