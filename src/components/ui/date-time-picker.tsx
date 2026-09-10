'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

function parseDateTimeValue(value: string) {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, year, month, day, hours, minutes] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes)
  );

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateTimeValue(date: Date, hours: number, minutes: number) {
  return (
    [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((part, index) =>
        index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0')
      )
      .join('-') + `T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  );
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Elegir fecha y hora',
  className,
  'aria-label': ariaLabel = 'Elegir fecha y hora'
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateTimeValue(value);
  const [hours, setHours] = React.useState(selected?.getHours() ?? 9);
  const [minutes, setMinutes] = React.useState(selected?.getMinutes() ?? 0);

  React.useEffect(() => {
    if (!selected) return;
    setHours(selected.getHours());
    setMinutes(selected.getMinutes());
  }, [value]);

  const updateTime = (nextHours: number, nextMinutes: number) => {
    if (!selected) return;
    onChange(formatDateTimeValue(selected, nextHours, nextMinutes));
  };

  const displayValue = selected
    ? `${format(selected, 'd MMM yyyy', { locale: es })} · ${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn(
              'h-9 w-full justify-start gap-2 rounded-[10px] border-border/60 bg-background px-3 text-left font-normal shadow-none hover:bg-muted/55',
              !selected && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <Icons.calendar className='size-3.5 shrink-0 text-muted-foreground' />
        <span className='truncate'>{displayValue}</span>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        sideOffset={6}
        className='w-auto rounded-[14px] border-border/70 bg-popover p-2 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.42)] ring-0'
      >
        <Calendar
          mode='single'
          locale={es}
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            const nextHours = selected?.getHours() ?? hours;
            const nextMinutes = selected?.getMinutes() ?? minutes;
            onChange(formatDateTimeValue(date, nextHours, nextMinutes));
          }}
          defaultMonth={selected ?? new Date()}
          className='mx-auto p-1 [--cell-size:--spacing(7)]'
        />

        <div className='my-1 h-px bg-border/60' />

        <div className='flex items-center gap-2 px-1 pt-1'>
          <span className='mr-auto text-xs font-medium text-muted-foreground'>Hora</span>

          <NativeSelect
            aria-label='Hora'
            size='sm'
            value={hours}
            onChange={(event) => {
              const nextHours = Number(event.target.value);
              setHours(nextHours);
              updateTime(nextHours, minutes);
            }}
            disabled={!selected}
            className='w-[68px]'
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <NativeSelectOption key={hour} value={hour}>
                {String(hour).padStart(2, '0')}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <span className='text-muted-foreground'>:</span>

          <NativeSelect
            aria-label='Minutos'
            size='sm'
            value={minutes}
            onChange={(event) => {
              const nextMinutes = Number(event.target.value);
              setMinutes(nextMinutes);
              updateTime(hours, nextMinutes);
            }}
            disabled={!selected}
            className='w-[68px]'
          >
            {Array.from({ length: 60 }, (_, minute) => (
              <NativeSelectOption key={minute} value={minute}>
                {String(minute).padStart(2, '0')}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className='mt-2 flex items-center justify-between px-1 pb-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-xs text-muted-foreground hover:text-foreground'
            onClick={() => onChange('')}
          >
            Borrar
          </Button>

          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-xs'
            onClick={() => {
              const today = new Date();
              const nextHours = selected?.getHours() ?? hours;
              const nextMinutes = selected?.getMinutes() ?? minutes;
              setHours(nextHours);
              setMinutes(nextMinutes);
              onChange(formatDateTimeValue(today, nextHours, nextMinutes));
            }}
          >
            Hoy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
