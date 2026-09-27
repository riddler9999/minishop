import {useEffect, useMemo, useState} from 'react';
import type {Product} from '@/domain/product';
import type {StoreDesignDocument, StoreSection, StoreSectionType, StoreTemplateName} from '@/domain/storeDesign';
import {AddSectionPanel} from './AddSectionPanel';
import {Inspector} from './Inspector';
import {MobileEditorPanels} from './MobileEditorPanels';
import {PreviewCanvas} from './PreviewCanvas';
import {SectionTree} from './SectionTree';
import {SAVE_DELAY, applyLocalEdit, createEditorState, debounceSaveIntent, persistEditorState, publishSavedDraft, reconcileSaveResult, type EditorState} from './editorState';
import {addSection, removeSection, reorderSection, replaceSection, setSectionEnabled} from './sectionOperations';

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
  const [mobilePanel, setMobilePanel] = useState<'tree' | 'inspector' | null>(null);

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
  const selectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    if (mobilePanel === 'tree') setMobilePanel(null);
  };
  const selectPreviewSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    if (window.matchMedia('(max-width: 1023px)').matches) setMobilePanel('inspector');
  };
  const updateDocument = (document: StoreDesignDocument) => setEditor((current) => applyLocalEdit(current, document));

  useEffect(() => {
    if (!sections.some((section) => section.id === selectedSectionId)) setSelectedSectionId(sections[0]?.id ?? null);
  }, [sections, selectedSectionId]);

  const edit = (document: StoreDesignDocument) => updateDocument(document);
  const add = (type: StoreSectionType) => {
    const result = addSection(editor.document, template, type);
    edit(result.document);
    setSelectedSectionId(result.section.id);
  };
  const remove = (sectionId: string) => {
    const index = sections.findIndex((section) => section.id === sectionId);
    const document = removeSection(editor.document, template, sectionId);
    edit(document);
    if (document !== editor.document) setSelectedSectionId(document.templates[template].sections[Math.max(0, index - 1)]?.id ?? null);
  };
  const changeSection = (section: StoreSection) => edit(replaceSection(editor.document, template, section));
  const treePanel = <><SectionTree sections={sections} selectedSectionId={selectedSectionId} blocked={editor.blocked} onSelect={selectSection} onMove={(sectionId, direction) => edit(reorderSection(editor.document, template, sectionId, direction))} onToggle={(sectionId, enabled) => edit(setSectionEnabled(editor.document, template, sectionId, enabled))} onRemove={remove} /><AddSectionPanel template={template} blocked={editor.blocked} onAdd={add} /></>;
  const inspectorPanel = <Inspector section={selected} products={products} categories={categories} blocked={editor.blocked} onChange={changeSection} />;

  return (
    <div className="min-h-[720px] w-full max-w-full overflow-hidden rounded-2xl border border-cream-200 bg-white" data-store-builder="three-pane">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {(['home', 'collection', 'product'] as const).map((value) => <button key={value} onClick={() => setTemplate(value)} className="rounded-lg border px-3 py-1.5 text-sm">{value}</button>)}
          <button type="button" onClick={() => setViewport((v) => v === 'desktop' ? 'mobile' : 'desktop')} className="hidden rounded-lg border px-3 py-1.5 text-sm lg:inline-flex">{viewport} preview</button>
          <button type="button" aria-haspopup="dialog" aria-expanded={mobilePanel === 'tree'} aria-controls="store-builder-section-drawer" onClick={() => setMobilePanel('tree')} className="shrink-0 rounded-lg border px-3 py-1.5 text-sm lg:hidden">ကဏ္ဍများ</button>
          <button type="button" aria-haspopup="dialog" aria-expanded={mobilePanel === 'inspector'} aria-controls="store-builder-inspector-sheet" onClick={() => setMobilePanel('inspector')} className="shrink-0 rounded-lg border px-3 py-1.5 text-sm lg:hidden">ပြင်ဆင်ရန်</button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="shrink-0" data-save-status={editor.status}>{editor.status === 'saving' ? 'သိမ်းနေသည်…' : editor.status === 'saved' ? 'သိမ်းပြီး' : editor.status === 'retry' ? 'ပြန်သိမ်းရန်' : editor.status === 'conflict' ? 'မူကွဲတိုက်ဆိုင်မှု' : 'မသိမ်းရသေး'}</span>
          {editor.status === 'retry' && <button type="button" onClick={() => runSave(editor)} className="rounded-lg border px-3 py-2 font-semibold">ပြန်သိမ်းမည်</button>}
          <button type="button" disabled={editor.status !== 'saved' || editor.blocked} onClick={() => void publishSavedDraft(editor, publishDraft)} className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40">ထုတ်ပြမည်</button>
        </div>
      </div>

      {editor.status === 'conflict' && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>ဒီမူကြမ်းကို တခြားနေရာက ပြင်ထားပါတယ်။ ဆက်မပြင်ခင် နောက်ဆုံးမူကို ပြန်ဖတ်ပါ။</span>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold">ပြန်ဖတ်မည်</button>
        </div>
      )}

      <div className="grid min-h-[660px] min-w-0 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px]" data-layout="three-pane">
        <aside className="hidden border-r border-cream-200 p-3 lg:block" aria-label="Section tree">
          <p className="mb-2 text-xs font-bold text-ink-soft">ကဏ္ဍများ</p>
          {treePanel}
        </aside>
        <main className="order-first min-w-0 max-w-full lg:order-none" data-mobile-preview-first><PreviewCanvas document={editor.document} template={template} products={products} categories={categories} viewport={viewport} selectedSectionId={selectedSectionId} onSectionSelect={selectPreviewSection} /></main>
        <aside className="hidden border-l border-cream-200 p-4 lg:block" aria-label="Inspector">
          <p className="mb-3 text-xs font-bold text-ink-soft">ပြင်ဆင်ရန်</p>
          {inspectorPanel}
        </aside>
      </div>
      <MobileEditorPanels active={mobilePanel} onClose={() => setMobilePanel(null)} tree={treePanel} inspector={inspectorPanel} />
    </div>
  );
}
