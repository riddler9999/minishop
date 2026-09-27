import {getSectionDefinition, type StoreSectionType, type StoreTemplateName} from '@/domain/storeDesign';
import {eligibleSectionTypes} from './sectionOperations';

type Props = {template: StoreTemplateName; blocked: boolean; onAdd: (type: StoreSectionType) => void};

export function AddSectionPanel({template, blocked, onAdd}: Props) {
  const types = eligibleSectionTypes(template);
  return (
    <details className="mt-4 rounded-xl border border-cream-200 p-2">
      <summary className="cursor-pointer px-1 py-1 text-sm font-bold">Add section</summary>
      <div className="mt-2 grid gap-1">
        {types.map((type) => (
          <button key={type} type="button" disabled={blocked} onClick={() => onAdd(type)} className="rounded-lg px-2 py-2 text-left text-sm hover:bg-cream-100 disabled:opacity-40">
            {getSectionDefinition(type).label}
          </button>
        ))}
      </div>
    </details>
  );
}
