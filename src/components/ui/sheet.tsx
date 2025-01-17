import * as React from 'react';
import { cn } from '@/lib/utils';

interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
}

interface SheetTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ className, open, onOpenChange, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed inset-0 z-50',
        className
      )}
      data-state={open ? 'open' : 'closed'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange?.(false);
        }
      }}
      {...props}
    />
  )
);
Sheet.displayName = 'Sheet';

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed inset-y-0 z-50 h-full w-3/4 max-w-sm border-r bg-background p-6 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        {
          'right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right': side === 'right',
          'left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left': side === 'left',
          'bottom-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom': side === 'bottom',
          'top-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top': side === 'top',
        },
        'sm:max-w-sm',
        className
      )}
      {...props}
    />
  )
);
SheetContent.displayName = 'SheetContent';

const SheetTrigger = React.forwardRef<HTMLDivElement, SheetTriggerProps>(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild) {
      return (
        <div ref={ref} {...props}>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SheetTrigger.displayName = 'SheetTrigger';

const SheetHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2', className)}
    {...props}
  />
));
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary',
      className
    )}
    {...props}
  />
));
SheetClose.displayName = 'SheetClose';

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
};