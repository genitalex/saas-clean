import * as React from 'react';

import { cn } from '@/lib/utils';
import { IconSelector } from '@tabler/icons-react';

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
};

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        className
      )}
      data-slot='native-select-wrapper'
      data-size={size}
    >
      <select
        data-slot='native-select'
        data-size={size}
        className='h-10 w-full min-w-0 appearance-none rounded-[10px] border border-input/80 bg-background/80 py-1 pr-9 pl-3 text-sm shadow-none transition-[background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground hover:border-foreground/25 hover:bg-accent/20 focus-visible:border-ring/70 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15 data-[size=sm]:h-8 data-[size=sm]:rounded-[9px] data-[size=sm]:py-0.5'
        {...props}
      />
      <IconSelector
        className='pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none'
        aria-hidden='true'
        data-slot='native-select-icon'
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot='native-select-option'
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot='native-select-optgroup'
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
