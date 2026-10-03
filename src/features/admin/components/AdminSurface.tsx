import type {ReactNode} from 'react';
import {cx} from '@/shared/lib/format';

export default function AdminSurface({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cx('rounded-xl border border-[#E1E7E3] bg-white p-4 shadow-sm sm:p-5', className)}>
      {children}
    </section>
  );
}
