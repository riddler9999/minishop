import {useEffect, useMemo, useState} from 'react';
import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreTemplateName} from '@/domain/storeDesign';
import {PreviewCanvas} from './PreviewCanvas';
import {SAVE_DELAY, applyLocalEdit, createEditorState, debounceSaveIntent, persistEditorState, publishSavedDraft, reconcileSaveResult, type EditorState} from './editorState';

type Props = {
  initialDocument: StoreDesignDocument;
  initialRevision: number;
  products: Product[];
  categories: string[];
  saveDraft: (input: {expectedRevision: number; document: StoreDesignDocument}) => Promise<{revision: number; document: StoreDesignDocument}>;
  publishDraft: (input: {expectedDraftRevision: number}) => Promise<unknown>;
};

export function StoreBuilderShell({initialDocument, initialRevision, products, categories, saveDraft, publishDraft}: Props) {
  const [editor, setEditor] = useState<EditorState>(() => createEditorState(initialDocument, initialRevision));
  const [template, setTemplate] = useState<StoreTemplateName>('home');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialDocument.templates.home.sections[0]?.id ?? null);

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

  const sections = editor.document.templates[template].sections;
  const selected = useMemo(() => sections.find((section) => section.id === selectedSectionId) ?? null, [sections, selectedSectionId]);
  const updateDocument = (document: StoreDesignDocument) => setEditor((current) => applyLocalEdit(current, document));

  const toggleSelected = () => {
    if (!selected) return;
    updateDocument({...editor.document, templates: {...editor.document.templates, [template]: {sections: sections.map((section) => section.id === selected.id ? {...section, enabled: !section.enabled} : section)}}});
  };

  return (
    <div className="min-h-[720px] overflow-hidden rounded-2xl border border-cream-200 bg-white" data-store-builder="three-pane">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {(['home', 'collection', 'product'] as const).map((value) => <button key={value} onClick={() => setTemplate(value)} className="rounded-lg border px-3 py-1.5 text-sm">{value}</button>)}
          <button onClick={() => setViewport((v) => v === 'desktop' ? 'mobile' : 'desktop')} className="rounded-lg border px-3 py-1.5 text-sm">{viewport} preview</button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span data-save-status={editor.status}>{editor.status === 'saving' ? 'Saving…' : editor.status === 'saved' ? 'Saved' : editor.status === 'retry' ? 'Retry' : editor.status === 'conflict' ? 'Conflict' : 'Unsaved'}</span>
          {editor.status === 'retry' && <button onClick={() => runSave(editor)} className="rounded-lg border px-3 py-2 font-semibold">Retry save</button>}
          <button disabled={editor.status !== 'saved' || editor.blocked} onClick={() => void publishSavedDraft(editor, publishDraft)} className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40">Publish</button>
        </div>
      </div>

      {editor.status === 'conflict' && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>Draft changed elsewhere. Reload before editing or saving again.</span>
          <button onClick={() => window.location.reload()} className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold">Reload</button>
        </div>
      )}

      <div className="grid min-h-[660px] grid-cols-[240px_minmax(0,1fr)_280px]" data-layout="three-pane">
        <aside className="border-r border-cream-200 p-3" aria-label="Section tree">
          <p className="mb-2 text-xs font-bold uppercase text-ink-soft">Sections</p>
          <div className="space-y-1">{sections.map((section) => <button key={section.id} onClick={() => setSelectedSectionId(section.id)} className="block w-full rounded-lg border px-3 py-2 text-left text-sm">{section.type}</button>)}</div>
        </aside>
        <main className="min-w-0"><PreviewCanvas document={editor.document} template={template} products={products} categories={categories} viewport={viewport} /></main>
        <aside className="border-l border-cream-200 p-4" aria-label="Inspector">
          <p className="mb-3 text-xs font-bold uppercase text-ink-soft">Inspector</p>
          {selected ? <><p className="text-sm font-semibold">{selected.type}</p><button onClick={toggleSelected} disabled={editor.blocked} className="mt-3 rounded-lg border px-3 py-2 text-sm">{selected.enabled ? 'Hide section' : 'Show section'}</button></> : <p className="text-sm text-ink-soft">Select a section from the tree or preview.</p>}
        </aside>
      </div>
    </div>
  );
}
