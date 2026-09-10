'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock3, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
};

function parseValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;
  return { date, time: `${hour}:${minute}` };
}

function formatDateValue(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0')
    )
    .join('-');
}

function combine(date: Date, time: string) {
  return `${formatDateValue(date)}T${time}`;
}

function buildTimeOptions() {
  return Array.from({ length: 25 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });
}

const timeOptions = buildTimeOptions();

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Elegir fecha y hora',
  className,
  'aria-label': ariaLabel = 'Elegir fecha y hora'
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseValue(value);
  const selected = parsed?.date;
  const time = parsed?.time ?? '09:00';

  const selectDate = (date: Date | undefined) => {
    if (!date) return;
    onChange(combine(date, time));
  };

  const selectTime = (nextTime: string) => {
    const baseDate = selected ?? new Date();
    onChange(combine(baseDate, nextTime));
  };

  const setExactTime = (nextTime: string) => {
    if (!/^\d{2}:\d{2}$/.test(nextTime)) return;
    const [hour, minute] = nextTime.split(':').map(Number);
    if (hour > 23 || minute > 59) return;
    const baseDate = selected ?? new Date();
    onChange(combine(baseDate, nextTime));
  };

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
              !parsed && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <CalendarDays className='size-3.5 shrink-0 text-muted-foreground' />
        <span className='min-w-0 truncate'>
          {parsed ? (
            <>
              {format(selected!, 'd MMM yyyy', { locale: es })}
              <span className='mx-1 text-muted-foreground/55'>·</span>
              {time}
            </>
          ) : (
            placeholder
          )}
        </span>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        sideOffset={7}
        className='w-[430px] max-w-[calc(100vw-24px)] rounded-[16px] border-border/70 bg-popover p-2 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.42)] ring-0'
      >
        <div className='grid grid-cols-[1fr_150px] gap-1.5'>
          <div className='rounded-[12px] bg-background/70 p-1'>
            <Calendar
              mode='single'
              locale={es}
              selected={selected}
              onSelect={selectDate}
              defaultMonth={selected}
              className='p-1 [--cell-size:--spacing(7)]'
            />
          </div>

          <div className='flex min-h-0 flex-col rounded-[12px] bg-muted/35 p-2'>
            <div className='mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground'>
              <Clock3 className='size-3.5' />
              Hora
            </div>

            <div className='grid max-h-[235px] grid-cols-2 gap-1 overflow-y-auto pr-0.5'>
              {timeOptions.map((option) => {
                const active = option === time;
                return (
                  <button
                    key={option}
                    type='button'
                    onClick={() => selectTime(option)}
                    className={cn(
                      'h-8 rounded-[8px] px-2 text-xs font-medium tabular-nums transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-background'
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className='mt-2 border-t border-border/60 pt-2'>
              <label
                className='px-1 text-[11px] font-medium text-muted-foreground'
                htmlFor='exact-time'
              >
                Hora exacta
              </label>
              <Input
                id='exact-time'
                type='time'
                step='60'
                value={time}
                onChange={(event) => setExactTime(event.target.value)}
                className='mt-1 h-8 rounded-[8px] bg-background px-2 text-xs shadow-none [color-scheme:light]'
              />
            </div>
          </div>
        </div>

        <div className='mt-1.5 flex items-center justify-between border-t border-border/60 px-1 pt-1.5'>
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 rounded-[8px] px-2 text-xs'
              onClick={() => onChange(combine(new Date(), time))}
            >
              Hoy
            </Button>
            {value && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-7 rounded-[8px] px-2 text-xs text-muted-foreground'
                onClick={() => onChange('')}
              >
                <X className='mr-1 size-3' />
                Borrar
              </Button>
            )}
          </div>
          <Button
            type='button'
            size='sm'
            className='h-7 rounded-[8px] px-3 text-xs'
            onClick={() => setOpen(false)}
          >
            Listo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
