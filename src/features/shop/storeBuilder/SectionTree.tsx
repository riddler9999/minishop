import {ChevronDown, ChevronUp, Eye, EyeOff, Trash2} from 'lucide-react';
import {getSectionDefinition, type StoreSection} from '@/domain/storeDesign';
import {SECTION_LABELS} from './sectionCopy';

type Props = {
  sections: StoreSection[];
  selectedSectionId: string | null;
  blocked: boolean;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, direction: -1 | 1) => void;
  onToggle: (sectionId: string, enabled: boolean) => void;
  onRemove: (sectionId: string) => void;
};

export function SectionTree({sections, selectedSectionId, blocked, onSelect, onMove, onToggle, onRemove}: Props) {
  return (
    <div className="space-y-1.5">
      {sections.map((section, index) => {
        const definition = getSectionDefinition(section.type);
        const label = SECTION_LABELS[section.type];
        const selected = section.id === selectedSectionId;
        return (
          <div key={section.id} className={`group rounded-lg border p-2 transition ${selected ? 'border-slate-900 bg-slate-100' : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
            <button type="button" onClick={() => onSelect(section.id)} aria-current={selected ? 'true' : undefined} className="flex min-h-8 w-full items-center gap-2 truncate px-1 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${section.enabled ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span className={`truncate ${section.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
            </button>
            <div className="mt-1 flex gap-1 pl-3">
              <button type="button" aria-label={`${label} အပေါ်ရွှေ့မည်`} disabled={blocked || index === 0} onClick={() => onMove(section.id, -1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" aria-label={`${label} အောက်ရွှေ့မည်`} disabled={blocked || index === sections.length - 1} onClick={() => onMove(section.id, 1)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              {definition.hideable && (
                <button type="button" aria-label={`${label} ${section.enabled ? 'ဖျောက်မည်' : 'ပြမည်'}`} disabled={blocked} onClick={() => onToggle(section.id, !section.enabled)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30">
                  {section.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              )}
              {definition.removable && (
                <button type="button" aria-label={`${label} ဖယ်ရှားမည်`} disabled={blocked} onClick={() => onRemove(section.id)} className="ml-auto grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
