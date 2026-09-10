'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export type SegmentedToggleProps = Readonly<
  {
    options: readonly string[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  } & Omit<ComponentPropsWithoutRef<'div'>, 'children'>
>;

const offsetClasses = [
  'translate-x-0',
  'translate-x-[calc(100%+0.25rem)]',
  'translate-x-[calc(200%+0.5rem)]',
  'translate-x-[calc(300%+0.75rem)]',
  'translate-x-[calc(400%+1rem)]'
];

function widthClass(count: number) {
  if (count <= 2) return 'w-[calc((100%-0.75rem)/2)]';
  if (count === 3) return 'w-[calc((100%-1rem)/3)]';
  if (count === 4) return 'w-[calc((100%-1.25rem)/4)]';
  return 'w-[calc((100%-1.5rem)/5)]';
}

export function SegmentedToggle({
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: SegmentedToggleProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0] ?? '');
  const activeValue = value ?? internalValue;
  const activeIndex = Math.max(0, options.indexOf(activeValue));
  const count = Math.max(1, Math.min(options.length, 5));

  const select = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div
      role='tablist'
      aria-label='Selector'
      className={cn(
        'relative inline-grid w-fit gap-1 rounded-xl bg-muted/80 p-1 text-sm font-medium select-none',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,0.07),inset_0_0_0_1px_rgba(255,255,255,0.5)]',
        count === 2
          ? 'grid-cols-2'
          : count === 3
            ? 'grid-cols-3'
            : count === 4
              ? 'grid-cols-4'
              : 'grid-cols-5',
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-card',
          'shadow-[0_2px_5px_rgba(0,0,0,0.10),0_1px_1px_rgba(0,0,0,0.05)]',
          'transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          widthClass(count),
          offsetClasses[Math.min(activeIndex, count - 1)]
        )}
      />

      {options.slice(0, 5).map((option, index) => (
        <button
          key={option}
          type='button'
          role='tab'
          aria-selected={activeValue === option}
          tabIndex={activeValue === option ? 0 : -1}
          onClick={() => select(option)}
          className={cn(
            'relative z-10 min-w-20 cursor-pointer rounded-lg px-3.5 py-2 text-center whitespace-nowrap',
            'transition-colors duration-300 motion-reduce:transition-none outline-none',
            activeValue === option
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
