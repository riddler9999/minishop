import {X} from 'lucide-react';
import AdminNav from './AdminNav';
import {useModalA11y} from '@/shared/hooks/useModalA11y';

export default function AdminMobileNav({open, onClose}: {open: boolean; onClose: () => void}) {
  const panelRef = useModalA11y<HTMLDivElement>(onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-slate-950/55"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] flex-col bg-slate-950 p-4 text-white shadow-2xl outline-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black tracking-wide">MiniShop</p>
            <p className="text-xs text-slate-400">Seller Admin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
