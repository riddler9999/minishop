import type {ReactNode} from 'react';
import {cx} from '@/shared/lib/format';

export default function AdminSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx('rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5', className)}>{children}</section>;
}
