import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className = '', label, error, helperText, children, id, ...props },
    ref
  ) => {
    const selectId =
      id ||
      (label
        ? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
        : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          style={{
            colorScheme: 'dark',
            backgroundColor: '#071524',
            color: '#f8fafc',
            ...props.style,
          }}
          className={`w-full rounded-lg border border-white/20 bg-[#071524] px-3 py-2 text-sm text-white min-h-[44px] transition-colors focus:border-[#38BDF8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/30 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#071524] [&>option]:text-[#f8fafc] [&>optgroup]:bg-[#071524] [&>optgroup]:text-[#f8fafc] ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
