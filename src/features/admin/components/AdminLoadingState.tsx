import {Loader2} from 'lucide-react';
import {cx} from '@/shared/lib/format';

export default function AdminLoadingState({
  message = 'Loading…',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx('flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center', className)}>
      <Loader2 className="h-7 w-7 animate-spin text-[#35B99D]" />
      <p className="text-sm font-medium text-[#66706C]">{message}</p>
    </div>
  );
}
