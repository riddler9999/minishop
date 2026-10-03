import type {ComponentType} from 'react';

export default function AdminStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{className?: string}>;
}) {
  return (
    <div className="rounded-xl border border-[#E1E7E3] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#66706C]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-[#1F2421]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[#66706C]">{detail}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F4F7F5] text-[#1F2421]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
