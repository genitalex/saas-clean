'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function parseDateValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateValue(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0')
    )
    .join('-');
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Elegir fecha',
  className,
  'aria-label': ariaLabel = 'Elegir fecha'
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn(
              'h-9 justify-start gap-2 rounded-[10px] border-border/60 bg-background px-3 text-left font-normal shadow-none hover:bg-muted/55',
              !selected && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <Icons.calendar className='size-3.5 shrink-0 text-muted-foreground' />
        <span className='truncate'>
          {selected ? format(selected, 'd MMM yyyy', { locale: es }) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        sideOffset={6}
        className='w-auto rounded-[14px] border-border/70 bg-popover p-1.5 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.42)] ring-0'
      >
        <Calendar
          mode='single'
          locale={es}
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDateValue(date));
            setOpen(false);
          }}
          defaultMonth={selected}
          className='p-1.5 [--cell-size:--spacing(7)]'
        />
      </PopoverContent>
    </Popover>
  );
}
