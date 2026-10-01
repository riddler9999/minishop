import type {ReactNode} from 'react';
import {cx} from '@/shared/lib/format';

const toneClasses = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-violet-50 text-violet-700',
} as const;

export default function AdminStatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', toneClasses[tone])}>{children}</span>;
}
