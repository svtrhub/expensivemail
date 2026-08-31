import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  doubleBezel?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', doubleBezel = false, children, ...props }, ref) => {
    if (doubleBezel) {
      return (
        <div
          ref={ref}
          className={`glass-card rounded-2xl p-1 transition-all duration-200 hover:border-[#6FE0FF]/60 ${className}`}
          {...props}
        >
          {/* Inner Scrim & Content Box */}
          <div className="rounded-[calc(1rem-0.25rem)] bg-[rgba(6,12,24,0.48)] p-5 shadow-[inset_0_1px_0_rgba(163,226,255,0.18)] text-[#EAF4FF] h-full relative z-10">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`glass-card rounded-2xl transition-all duration-200 hover:border-[#6FE0FF]/60 hover:shadow-[0_0_25px_rgba(111,224,255,0.2)] text-[#EAF4FF] ${className}`}
        {...props}
      >
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-5 ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', children, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight text-[#EAF4FF] ${className}`}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', children, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-slate-200 dark:text-slate-200 ${className}`}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={`p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-5 pt-0 ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';
