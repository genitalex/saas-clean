'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';

import { cn } from '@/lib/utils';
import { IconCheck, IconMinus } from '@tabler/icons-react';

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'group/checkbox peer relative flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border border-input/90 bg-background transition-[background-color,border-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-foreground/35 focus-visible:border-ring/70 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className='grid place-content-center text-current transition-transform duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] [&>svg]:size-3'
      >
        <IconCheck className='group-data-[indeterminate=true]/checkbox:hidden' />
        <IconMinus className='hidden group-data-[indeterminate=true]/checkbox:block' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
