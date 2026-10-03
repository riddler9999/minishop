import {useEffect, useState} from 'react';
import {X} from 'lucide-react';
import AdminNav from './AdminNav';
import {useModalA11y} from '@/shared/hooks/useModalA11y';
import {cx} from '@/shared/lib/format';

interface AdminMobileNavProps {
  open: boolean;
  onClose: () => void;
}

function AdminMobileNavDrawer({
  onClose,
  animating,
}: {
  onClose: () => void;
  animating: boolean;
}) {
  const panelRef = useModalA11y<HTMLDivElement>(onClose);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className={cx(
          'absolute inset-0 bg-black/60 transition-opacity duration-200 ease-out motion-reduce:transition-none',
          animating ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        id="admin-mobile-nav"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        tabIndex={-1}
        className={cx(
          'absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] flex-col bg-[var(--admin-sidebar)] p-4 text-white shadow-2xl outline-none transition-transform duration-200 ease-out motion-reduce:transition-none',
          animating ? 'translate-x-0' : '-translate-x-full',
        )}>
        <div className="mb-4 flex items-center justify-between border-b border-[var(--admin-sidebar-hover)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--admin-primary)] font-black text-sm text-[#1F2421]">
              m
            </span>
            <div>
              <p className="text-sm font-black tracking-wide">MiniShop</p>
              <p className="text-xs text-[var(--admin-sidebar-muted)]">Seller Admin</p>
            </div>
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

export default function AdminMobileNav({open, onClose}: AdminMobileNavProps) {
  const [rendered, setRendered] = useState(open);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => {
        setAnimating(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setAnimating(false);
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const timer = setTimeout(
        () => {
          setRendered(false);
        },
        prefersReducedMotion ? 0 : 200,
      );
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!rendered && !open) return null;

  return <AdminMobileNavDrawer onClose={onClose} animating={animating} />;
}
