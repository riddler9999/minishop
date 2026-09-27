import {ChevronDown, ChevronUp, Eye, EyeOff, Trash2} from 'lucide-react';
import {getSectionDefinition, type StoreSection} from '@/domain/storeDesign';

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
    <div className="space-y-1">
      {sections.map((section, index) => {
        const definition = getSectionDefinition(section.type);
        const selected = section.id === selectedSectionId;
        return (
          <div key={section.id} className={`rounded-xl border p-2 ${selected ? 'border-brand-400 bg-brand-50' : 'border-cream-200 bg-white'}`}>
            <button type="button" onClick={() => onSelect(section.id)} className="block w-full truncate px-1 py-1 text-left text-sm font-semibold">
              {definition.label}
            </button>
            <div className="mt-1 flex gap-1">
              <button type="button" aria-label={`Move ${definition.label} up`} disabled={blocked || index === 0} onClick={() => onMove(section.id, -1)} className="rounded-md border p-1 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" aria-label={`Move ${definition.label} down`} disabled={blocked || index === sections.length - 1} onClick={() => onMove(section.id, 1)} className="rounded-md border p-1 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              {definition.hideable && (
                <button type="button" aria-label={`${section.enabled ? 'Hide' : 'Show'} ${definition.label}`} disabled={blocked} onClick={() => onToggle(section.id, !section.enabled)} className="rounded-md border p-1 disabled:opacity-30">
                  {section.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              )}
              {definition.removable && (
                <button type="button" aria-label={`Remove ${definition.label}`} disabled={blocked} onClick={() => onRemove(section.id)} className="ml-auto rounded-md border border-red-200 p-1 text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
