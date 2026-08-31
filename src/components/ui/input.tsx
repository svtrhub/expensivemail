import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId =
      id ||
      (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-200 dark:text-slate-200"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className="absolute left-3 text-slate-300 dark:text-slate-400 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-md px-3.5 py-2 text-sm text-white dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-300 min-h-[44px] transition-[border-color,box-shadow] focus-visible:border-[#2251FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2251FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#051C2C] disabled:cursor-not-allowed disabled:opacity-50 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${error ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-3 text-slate-300 dark:text-slate-400"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            className="text-xs text-red-400 dark:text-red-400 font-medium"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-300 dark:text-slate-300">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
