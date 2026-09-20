import {useEffect, useRef} from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared a11y wiring for the admin console's modal/drawer overlays (product
 * modal, order detail drawer, mobile nav drawer): traps Tab inside the panel,
 * closes on Escape, moves focus in on mount and back to the trigger on
 * unmount. Runs once per mount — deliberately ignores `onClose` identity
 * changes so a parent re-render (e.g. an unrelated state update) never
 * re-steals focus from whatever the user is doing inside the open panel.
 * Attach the returned ref to the dialog panel itself, not the fixed overlay
 * that also contains the backdrop's close button.
 */
export function useModalA11y<T extends HTMLElement>(onClose: () => void) {
  const panelRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? panel).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // A panel can stay mounted but be hidden by a responsive class (e.g.
      // the mobile nav drawer's `lg:hidden` after the viewport widens past
      // that breakpoint while it's still open). Trapping Tab for an invisible
      // panel would swallow every Tab press without being able to focus
      // anything inside it, freezing keyboard navigation — so stand down.
      if (panel.offsetParent === null) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // The previously focused control can drop out of the tabbable set
      // mid-interaction (e.g. a Save/Delete button disabling itself while a
      // request is in flight), which browsers resolve by moving focus to
      // <body> — outside the panel, so Tab would otherwise escape the trap.
      if (!active || !panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  return panelRef;
}
