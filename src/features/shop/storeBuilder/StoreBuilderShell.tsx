import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Check, ChevronDown, Layers3, Monitor, SlidersHorizontal, Smartphone} from 'lucide-react';
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
  shopName: string;
  saveDraft: (input: {expectedRevision: number; document: StoreDesignDocument}) => Promise<{revision: number; document: StoreDesignDocument}>;
  publishDraft: (input: {expectedDraftRevision: number}) => Promise<unknown>;
};

export function StoreBuilderShell({initialDocument, initialRevision, products, categories, shopName, saveDraft, publishDraft}: Props) {
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
  const saveLabel = editor.status === 'saving' ? 'သိမ်းနေသည်…' : editor.status === 'saved' ? 'သိမ်းပြီး' : editor.status === 'retry' ? 'ပြန်သိမ်းရန်' : editor.status === 'conflict' ? 'မူကွဲတိုက်ဆိုင်မှု' : 'မသိမ်းရသေး';

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-hidden bg-[#f6f6f7] text-slate-900" data-store-builder="three-pane">
      <header className="z-20 flex min-h-[64px] flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-5 lg:flex-nowrap">
        <Link to="/admin/online-store/themes" onClick={(event) => { if (editor.status !== 'saved' && !window.confirm('မူကြမ်း မသိမ်းပြီးသေးပါ။ ပြန်သွားမလား။')) event.preventDefault(); }} aria-label="Theme များသို့ ပြန်သွားမည်" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="truncate text-sm font-bold leading-tight">ဆိုင်ဒီဇိုင်း ပြင်ဆင်ရန်</p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">Store Builder · မူကြမ်း</p>
        </div>
        <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
          <label className="relative min-w-0 flex-1 sm:max-w-[220px] sm:flex-none">
            <span className="sr-only">ပြင်ဆင်မည့် စာမျက်နှာ</span>
            <select value={template} onChange={(event) => { setTemplate(event.target.value as StoreTemplateName); setMobilePanel(null); }} className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700">
              <option value="home">ပင်မစာမျက်နှာ</option><option value="collection">စုစည်းမှုစာမျက်နှာ</option><option value="product">ပစ္စည်းစာမျက်နှာ</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
          </label>
          <div className="hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 lg:flex" role="group" aria-label="အစမ်းမြင်ကွင်း အရွယ်အစား">
            <button type="button" aria-label="ကွန်ပျူတာ မြင်ကွင်း" aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')} className={`grid h-8 w-9 place-items-center rounded-md ${viewport === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Monitor className="h-4 w-4" /></button>
            <button type="button" aria-label="ဖုန်း မြင်ကွင်း" aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')} className={`grid h-8 w-9 place-items-center rounded-md ${viewport === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Smartphone className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:inline-flex" role="status" data-save-status={editor.status}><Check className="h-3.5 w-3.5" />{saveLabel}</span>
          {editor.status === 'retry' && <button type="button" onClick={() => runSave(editor)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">ပြန်သိမ်းမည်</button>}
          <button type="button" disabled={editor.status !== 'saved' || editor.blocked} onClick={() => void publishSavedDraft(editor, publishDraft)} className="min-h-10 shrink-0 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm">ထုတ်ပြမည်</button>
        </div>
      </header>

      {editor.status === 'conflict' && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>ဒီမူကြမ်းကို တခြားနေရာက ပြင်ထားပါတယ်။ ဆက်မပြင်ခင် နောက်ဆုံးမူကို ပြန်ဖတ်ပါ။</span>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold">ပြန်ဖတ်မည်</button>
        </div>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 lg:h-[calc(100dvh-64px)] lg:grid-cols-[240px_minmax(0,1fr)_280px]" data-layout="three-pane">
        <aside className="hidden overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block" aria-label="Section tree">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">စာမျက်နှာ ဖွဲ့စည်းပုံ</p>
          {treePanel}
        </aside>
        <main className="order-first min-w-0 max-w-full lg:order-none" data-mobile-preview-first><PreviewCanvas document={editor.document} template={template} products={products} categories={categories} shopName={shopName} viewport={viewport} selectedSectionId={selectedSectionId} onSectionSelect={selectPreviewSection} /></main>
        <aside className="hidden overflow-y-auto border-l border-slate-200 bg-white p-5 lg:block" aria-label="Inspector">
          <p className="mb-4 border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-wide text-slate-500">ကဏ္ဍ အပြင်အဆင်</p>
          {inspectorPanel}
        </aside>
      </div>
      <nav aria-label="Store Builder tools" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] lg:hidden">
        <button type="button" aria-haspopup="dialog" aria-expanded={mobilePanel === 'tree'} aria-controls="store-builder-section-drawer" onClick={() => setMobilePanel('tree')} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold"><Layers3 className="h-4 w-4" />ကဏ္ဍများ</button>
        <button type="button" aria-haspopup="dialog" aria-expanded={mobilePanel === 'inspector'} aria-controls="store-builder-inspector-sheet" onClick={() => setMobilePanel('inspector')} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white"><SlidersHorizontal className="h-4 w-4" />ပြင်ဆင်ရန်</button>
      </nav>
      <MobileEditorPanels active={mobilePanel} onClose={() => setMobilePanel(null)} tree={treePanel} inspector={inspectorPanel} />
    </div>
  );
}
