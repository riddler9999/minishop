import {Plus} from 'lucide-react';
import type {StoreSectionType, StoreTemplateName} from '@/domain/storeDesign';
import {SECTION_LABELS} from './sectionCopy';
import {eligibleSectionTypes} from './sectionOperations';

type Props = {template: StoreTemplateName; blocked: boolean; onAdd: (type: StoreSectionType) => void};

export function AddSectionPanel({template, blocked, onAdd}: Props) {
  const types = eligibleSectionTypes(template);
  return (
    <details className="mt-5 border-t border-slate-200 pt-4">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Plus className="h-4 w-4" />ကဏ္ဍထည့်မည်</summary>
      <div className="mt-2 grid max-h-64 gap-1 overflow-y-auto">
        {types.map((type) => (
          <button key={type} type="button" disabled={blocked} onClick={() => onAdd(type)} className="rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40">
            {SECTION_LABELS[type]}
          </button>
        ))}
      </div>
    </details>
  );
}
