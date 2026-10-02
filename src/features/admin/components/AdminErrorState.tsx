import {AlertTriangle} from 'lucide-react';

export default function AdminErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div>
          <h2 className="text-sm font-semibold text-rose-900">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-rose-800">{description}</p> : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
