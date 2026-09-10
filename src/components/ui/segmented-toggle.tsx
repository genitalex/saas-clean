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
  'translate-x-[calc(100%+0.125rem)]',
  'translate-x-[calc(200%+0.25rem)]',
  'translate-x-[calc(300%+0.375rem)]',
  'translate-x-[calc(400%+0.5rem)]'
];

function widthClass(count: number) {
  if (count <= 2) return 'w-[calc((100%-0.375rem)/2)]';
  if (count === 3) return 'w-[calc((100%-0.5rem)/3)]';
  if (count === 4) return 'w-[calc((100%-0.625rem)/4)]';
  return 'w-[calc((100%-0.75rem)/5)]';
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
        'relative inline-grid w-fit gap-0.5 rounded-[10px] bg-muted/80 p-0.5 text-xs font-medium select-none',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.5)]',
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
          'pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-[8px] bg-card',
          'shadow-[0_1px_4px_rgba(0,0,0,0.09),0_1px_1px_rgba(0,0,0,0.04)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          widthClass(count),
          offsetClasses[Math.min(activeIndex, count - 1)]
        )}
      />

      {options.slice(0, 5).map((option) => (
        <button
          key={option}
          type='button'
          role='tab'
          aria-selected={activeValue === option}
          tabIndex={activeValue === option ? 0 : -1}
          onClick={() => select(option)}
          className={cn(
            'relative z-10 min-w-16 cursor-pointer rounded-[8px] px-2.5 py-1.5 text-center text-xs whitespace-nowrap',
            'transition-colors duration-200 motion-reduce:transition-none outline-none',
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
