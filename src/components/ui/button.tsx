import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'accent'
    | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2251FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] select-none touch-manipulation cursor-pointer';

    const variants: Record<string, string> = {
      default:
        'bg-[#2251FF]/30 backdrop-blur-xl hover:bg-[#2251FF]/45 text-white border border-[#2251FF]/50 hover:border-[#2251FF] shadow-[0_4px_20px_rgba(34,81,255,0.25)] hover:shadow-[0_0_25px_rgba(34,81,255,0.45)]',
      destructive:
        'bg-red-500/20 backdrop-blur-xl hover:bg-red-500/35 text-red-100 border border-red-500/40 hover:border-red-400 shadow-[0_4px_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]',
      accent:
        'bg-amber-500/20 backdrop-blur-xl hover:bg-amber-500/35 text-amber-100 border border-amber-500/40 hover:border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
      success:
        'bg-emerald-500/20 backdrop-blur-xl hover:bg-emerald-500/35 text-emerald-100 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      outline:
        'bg-white/5 backdrop-blur-xl hover:bg-white/12 text-slate-100 border border-white/15 hover:border-[#2251FF]/50 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(34,81,255,0.2)]',
      secondary:
        'bg-[#0D2E78]/40 backdrop-blur-xl hover:bg-[#0D2E78]/65 text-[#F8FAFC] border border-[#1E40AF]/50 hover:border-[#2251FF]/60 shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
      ghost:
        'bg-transparent hover:bg-white/10 text-slate-200 hover:text-white border border-transparent hover:border-white/10 backdrop-blur-md',
      link: 'text-[#60A5FA] underline-offset-4 hover:underline p-0 h-auto font-normal border border-transparent',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2 min-h-[44px]',
      sm: 'h-8 px-3 text-xs min-h-[36px]',
      lg: 'h-12 px-6 text-base min-h-[48px]',
      icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
