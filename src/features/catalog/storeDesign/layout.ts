import type {ThemeLayoutStyle, ThemeVisualProfile} from '@/domain/theme';

export function heroLayoutClass(hero: ThemeVisualProfile['hero']): string {
  const layouts: Record<ThemeVisualProfile['hero'], string> = {
    split: 'hero-split grid items-center gap-8 md:grid-cols-2 md:gap-12',
    poster: 'hero-poster grid items-end gap-6 border-y-4 border-[var(--commerce-border)] md:grid-cols-[1.25fr_0.75fr] md:gap-8',
    centered: 'hero-centered flex flex-col items-center gap-8 text-center',
    utility: 'hero-utility grid items-center gap-5 border border-[var(--commerce-border)] md:grid-cols-[0.72fr_1.28fr]',
    glass: 'hero-glass relative grid items-end gap-8 overflow-hidden md:min-h-[520px] md:grid-cols-[0.9fr_1.1fr]',
  };
  return layouts[hero];
}

export function heroCopyClass(hero: ThemeVisualProfile['hero']): string {
  if (hero === 'centered') return 'mx-auto max-w-2xl';
  if (hero === 'glass') return 'relative z-10 max-w-xl bg-[var(--commerce-surface)]/90 p-6 backdrop-blur sm:p-8';
  if (hero === 'poster') return 'max-w-2xl py-8 sm:py-12';
  if (hero === 'utility') return 'max-w-xl p-5 sm:p-7';
  return 'max-w-xl';
}

export function heroMediaClass(hero: ThemeVisualProfile['hero']): string {
  if (hero === 'centered') return 'relative min-h-[280px] w-full max-w-4xl overflow-hidden bg-[var(--commerce-surface-soft)] sm:min-h-[420px]';
  if (hero === 'glass') return 'relative min-h-[320px] overflow-hidden bg-[var(--commerce-surface-soft)] md:absolute md:inset-0 md:min-h-0';
  if (hero === 'poster') return 'relative min-h-[360px] overflow-hidden bg-[var(--commerce-surface-soft)] sm:min-h-[480px]';
  if (hero === 'utility') return 'relative min-h-[260px] overflow-hidden bg-[var(--commerce-surface-soft)] sm:min-h-[340px]';
  return 'relative min-h-[320px] overflow-hidden bg-[var(--commerce-surface-soft)] sm:min-h-[420px]';
}

export function productDetailGridClass(layout: ThemeLayoutStyle): string {
  const layouts: Record<ThemeLayoutStyle, string> = {
    editorial: 'md:grid-cols-[1.15fr_0.85fr] md:gap-14',
    poster: 'md:grid-cols-[0.9fr_1.1fr] md:gap-10',
    boutique: 'md:grid-cols-2 md:gap-12',
    catalog: 'md:grid-cols-[0.8fr_1.2fr] md:gap-8',
    tech: 'md:grid-cols-[1.05fr_0.95fr] md:gap-12',
  };
  return layouts[layout];
}
