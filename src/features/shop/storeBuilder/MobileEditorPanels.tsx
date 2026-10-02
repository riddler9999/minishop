import type {ReactNode} from 'react';
import {X} from 'lucide-react';
import {useModalA11y} from '@/shared/hooks/useModalA11y';

type PanelProps = {children: ReactNode; onClose: () => void};

function SectionDrawer({children, onClose}: PanelProps) {
  const panelRef = useModalA11y<HTMLElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 lg:hidden" data-mobile-section-drawer>
      <button type="button" aria-label="Close section navigation" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <aside id="store-builder-section-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-label="Section navigation" tabIndex={-1} className="absolute inset-y-0 left-0 w-[min(86vw,340px)] max-w-full overflow-x-hidden overflow-y-auto bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Sections</h2><button type="button" aria-label="Close section navigation" onClick={onClose} className="rounded-lg border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"><X className="h-4 w-4" /></button></div>
        {children}
      </aside>
    </div>
  );
}

function InspectorSheet({children, onClose}: PanelProps) {
  const panelRef = useModalA11y<HTMLElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 lg:hidden" data-mobile-inspector-sheet>
      <button type="button" aria-label="Close inspector" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <aside id="store-builder-inspector-sheet" ref={panelRef} role="dialog" aria-modal="true" aria-label="Inspector" tabIndex={-1} className="absolute inset-x-0 bottom-0 max-h-[82dvh] max-w-full overflow-x-hidden overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Inspector</h2><button type="button" aria-label="Close inspector" onClick={onClose} className="rounded-lg border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"><X className="h-4 w-4" /></button></div>
        {children}
      </aside>
    </div>
  );
}

type Props = {active: 'tree' | 'inspector' | null; onClose: () => void; tree: ReactNode; inspector: ReactNode};

export function MobileEditorPanels({active, onClose, tree, inspector}: Props) {
  if (active === 'tree') return <SectionDrawer onClose={onClose}>{tree}</SectionDrawer>;
  if (active === 'inspector') return <InspectorSheet onClose={onClose}>{inspector}</InspectorSheet>;
  return null;
}
