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
        className="absolute inset-0 bg-[var(--admin-sidebar)]/55"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] flex-col bg-[var(--admin-sidebar)] p-4 text-white shadow-2xl outline-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black tracking-wide">MiniShop</p>
            <p className="text-xs text-[var(--admin-sidebar-muted)]">Seller Admin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-11 w-11 place-items-center rounded-xl text-[var(--admin-sidebar-muted)] transition hover:bg-[var(--admin-sidebar-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]">
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
