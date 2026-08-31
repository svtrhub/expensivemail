import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 select-none';

  const variants: Record<string, string> = {
    default:
      'border-[#2251FF]/30 bg-[#2251FF]/15 text-[#60A5FA] dark:bg-[#2251FF]/20 dark:text-[#93C5FD]',
    secondary:
      'border-[#1E3A5F] bg-slate-100 text-slate-800 dark:bg-[#163354] dark:text-[#E2E8F0]',
    destructive:
      'border-red-800/40 bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
    outline:
      'border-slate-300 dark:border-[#1E3A5F] text-slate-700 dark:text-[#E2E8F0]',
    success:
      'border-emerald-800/40 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    warning:
      'border-amber-800/40 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    info: 'border-sky-800/40 bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
