import type {ButtonHTMLAttributes, ReactNode} from 'react';
import {cx} from '@/shared/lib/format';

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'mint' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-[#1F2421] text-white hover:bg-[#303a35] focus-visible:ring-[#1F2421]',
  mint: 'bg-[#35B99D] text-[#1F2421] font-bold hover:bg-[#29957F] focus-visible:ring-[#35B99D]',
  secondary: 'border border-[#E1E7E3] bg-white text-[#1F2421] hover:bg-[#F4F7F5] focus-visible:ring-[#35B99D]',
  ghost: 'bg-transparent text-[#66706C] hover:bg-[#F4F7F5] hover:text-[#1F2421] focus-visible:ring-[#35B99D]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
};

const sizeClasses = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-lg',
  md: 'min-h-11 px-4 py-2.5 text-sm rounded-xl',
  lg: 'min-h-12 px-5 py-3 text-base rounded-xl',
};

export default function AdminButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: AdminButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}>
      {children}
    </button>
  );
}
