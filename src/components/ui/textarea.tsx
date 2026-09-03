import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'flex field-sizing-content min-h-20 w-full rounded-[10px] border border-input bg-input/45 px-3 py-2.5 text-base shadow-none transition-[background-color,border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none placeholder:text-muted-foreground focus-visible:border-ring/60 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
