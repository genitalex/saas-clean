'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { createEvent, deleteEvent, eventKeys, updateEvent } from '../queries';
import { eventPayloadSchema } from '../schemas/event';
import type { Event, CustomerOption, UserOption } from '../types';

type Category = {
  id: string;
  name: string;
  color: string;
};

type EventDialogProps = {
  open: boolean;
  event?: Event | null;
  initialDate?: Date;
  initialCustomerId?: string;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  onCategoriesChange?: (categories: Category[]) => void;
  onOpenCategorySettings?: () => void;
};

function toInputValue(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function formatPreview(value: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatPreviewDate(value: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
}

function localDatePart(value: string) {
  return value.split('T')[0] ?? '';
}

function localTimePart(value: string) {
  return value.split('T')[1]?.slice(0, 5) ?? '09:00';
}

function withLocalDateTime(datePart: string, timePart: string) {
  if (!datePart) return '';
  return toInputValue(new Date(`${datePart}T${timePart}`));
}

const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2020, index, 1))
);

function DateSegmentControl({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [yearText, monthText, dayText] = value.split('-');
  const selectedYear = Number(yearText) || new Date().getFullYear();
  const selectedMonth = Number(monthText) || 1;
  const selectedDay = Number(dayText) || 1;
  const [activeSegment, setActiveSegment] = useState<'day' | 'month' | 'year' | null>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const years = Array.from({ length: 21 }, (_, index) => selectedYear - 10 + index);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!controlRef.current?.contains(event.target as Node)) setActiveSegment(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveSegment(null);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function selectDatePart(part: 'day' | 'month' | 'year', nextValue: number) {
    const nextYear = part === 'year' ? nextValue : selectedYear;
    const nextMonth = part === 'month' ? nextValue : selectedMonth;
    const nextDay = Math.min(
      part === 'day' ? nextValue : selectedDay,
      new Date(nextYear, nextMonth, 0).getDate()
    );
    onChange(
      `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`
    );
    setActiveSegment(null);
  }

  const segments = [
    { key: 'day' as const, text: String(selectedDay), options: days },
    {
      key: 'month' as const,
      text: monthNames[selectedMonth - 1] ?? monthNames[0],
      options: monthNames.map((_, index) => index + 1)
    },
    { key: 'year' as const, text: String(selectedYear), options: years }
  ];

  return (
    <div ref={controlRef} className='relative' aria-label={label}>
      <div className='flex min-h-10 items-center gap-0.5 rounded-full border border-border/50 bg-muted/45 p-0.5'>
        {segments.map((segment) => {
          const isActive = activeSegment === segment.key;
          return (
            <button
              key={segment.key}
              type='button'
              aria-label={`Cambiar ${segment.key === 'day' ? 'día' : segment.key === 'month' ? 'mes' : 'año'}`}
              aria-expanded={isActive}
              aria-haspopup='listbox'
              onClick={() => setActiveSegment(isActive ? null : segment.key)}
              className={cn(
                'min-h-9 min-w-0 flex-1 rounded-full border border-transparent px-2 text-center text-sm font-medium capitalize transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 active:scale-[0.99] sm:px-3',
                isActive
                  ? 'border-border/45 bg-background text-foreground'
                  : 'text-muted-foreground hover:bg-background/55 hover:text-foreground'
              )}
            >
              {segment.text}
            </button>
          );
        })}
      </div>

      {activeSegment && (
        <div
          role='listbox'
          aria-label={`Opciones de ${activeSegment}`}
          className='absolute inset-x-0 top-[calc(100%+0.45rem)] z-30 max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-background p-1'
        >
          {segments
            .find((segment) => segment.key === activeSegment)
            ?.options.map((option) => {
              const text = activeSegment === 'month' ? monthNames[option - 1] : String(option);
              const selected =
                (activeSegment === 'day' && option === selectedDay) ||
                (activeSegment === 'month' && option === selectedMonth) ||
                (activeSegment === 'year' && option === selectedYear);
              return (
                <button
                  key={option}
                  type='button'
                  role='option'
                  aria-selected={selected}
                  onClick={() => selectDatePart(activeSegment, option)}
                  className={cn(
                    'flex min-h-9 w-full items-center rounded-lg border border-transparent px-3 text-left text-sm capitalize transition-colors duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30',
                    selected
                      ? 'border-border/40 bg-muted/55 font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'
                  )}
                >
                  {text}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

function clampTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const total = Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 9 * 60;
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

function TimeWheel({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const safeValue = clampTime(value);
  const [hourText, minuteText] = safeValue.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const minuteIndex = minute;
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = Array.from({ length: 60 }, (_, index) => index);

  const select = (nextHour: number, nextMinute: number) =>
    onChange(`${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);

  return (
    <div
      className='relative overflow-hidden rounded-xl border border-border/55 bg-muted/20 px-1.5 py-1'
      aria-label={label}
    >
      <div className='pointer-events-none absolute inset-x-2 top-1/2 z-10 h-10 -translate-y-1/2 rounded-lg border border-primary/20 bg-primary/[0.045]' />
      <div className='pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-background/95 to-transparent' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-t from-background/95 to-transparent' />
      <div className='relative z-0 flex h-[134px] items-center justify-center gap-1 sm:h-[122px]'>
        <WheelColumn
          ariaLabel='Hora'
          values={hours.map((item) => String(item).padStart(2, '0'))}
          selectedIndex={hour}
          onSelect={(index) => select(index, minute)}
        />
        <span className='z-10 -mx-0.5 text-lg font-semibold'>:</span>
        <WheelColumn
          ariaLabel='Minutos'
          values={minutes.map((item) => String(item).padStart(2, '0'))}
          selectedIndex={minuteIndex}
          onSelect={(index) => select(hour, minutes[index] ?? 0)}
        />
      </div>
    </div>
  );
}

function WheelColumn({
  values,
  selectedIndex,
  onSelect,
  ariaLabel
}: {
  values: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);
  const itemHeight = 34;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    programmaticScrollRef.current = true;
    element.scrollTo({ top: selectedIndex * itemHeight, behavior: 'auto' });

    const frame = window.requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedIndex]);

  return (
    <div
      ref={ref}
      role='listbox'
      aria-label={ariaLabel}
      className='no-scrollbar h-[118px] w-[72px] snap-y snap-mandatory overflow-y-auto overscroll-contain py-[42px] text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      onScroll={(event) => {
        if (programmaticScrollRef.current) return;

        const nextIndex = Math.max(
          0,
          Math.min(values.length - 1, Math.round(event.currentTarget.scrollTop / itemHeight))
        );
        if (nextIndex !== selectedIndex) onSelect(nextIndex);
      }}
    >
      {values.map((item, index) => (
        <button
          key={item}
          type='button'
          role='option'
          aria-selected={index === selectedIndex}
          onClick={() => {
            onSelect(index);
            ref.current?.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
          }}
          className={cn(
            'flex h-[34px] w-full snap-center items-center justify-center rounded-lg text-lg tabular-nums transition-all',
            index === selectedIndex
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground/45 scale-90'
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function formatPreviewTime(value: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function EventDialog({
  open,
  event,
  initialDate,
  initialCustomerId,
  onOpenChange,
  categories = [],
  onOpenCategorySettings
}: EventDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pending, setPending] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'event-options'],
    queryFn: async () => {
      const response = await fetch('/api/customers', {
        cache: 'no-store'
      });

      if (!response.ok) {
        return [];
      }

      return (await response.json()) as CustomerOption[];
    },
    enabled: open
  });

  const { data: members = [] } = useQuery({
    queryKey: ['organization-members', 'event-options'],
    queryFn: async () => {
      const response = await fetch('/api/organization-members', {
        cache: 'no-store'
      });

      if (!response.ok) {
        return [];
      }

      return (await response.json()) as UserOption[];
    },
    enabled: open
  });

  useEffect(() => {
    if (!open) return;

    const start = event?.startAt ? new Date(event.startAt) : (initialDate ?? new Date());

    const end = event?.endAt ? new Date(event.endAt) : new Date(start.getTime() + 60 * 60 * 1000);

    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setStartAt(toInputValue(start));
    setEndAt(toInputValue(end));
    setAllDay(event?.allDay ?? false);
    setLocation(event?.location ?? '');
    setCustomerId(event?.customerId ?? initialCustomerId ?? '');
    setAssigneeId(event?.assigneeId ?? '');
    try {
      const saved = window.localStorage.getItem('calendar-event-categories');
      const mapping = saved ? (JSON.parse(saved) as Record<string, string>) : {};
      setCategoryId(event ? (mapping[event.id] ?? '') : '');
    } catch {
      try {
        const stored = window.localStorage.getItem('calendar-event-categories');
        const mapping = stored ? (JSON.parse(stored) as Record<string, string>) : {};
        setCategoryId(event?.id ? (mapping[event.id] ?? '') : '');
      } catch {
        setCategoryId('');
      }
    }
  }, [event, initialCustomerId, initialDate, open]);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    const parsed = eventPayloadSchema.safeParse({
      title,
      description: description || null,
      startAt,
      endAt,
      allDay,
      location: location || null,
      customerId: customerId || null,
      assigneeId: assigneeId || null
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos del evento.');
      return;
    }

    setPending(true);

    try {
      const payload = {
        ...parsed.data,
        startAt: parsed.data.startAt.toISOString(),
        endAt: parsed.data.endAt.toISOString()
      };

      let savedEvent: Event;
      if (event) {
        savedEvent = await updateEvent(event.id, payload);
      } else {
        savedEvent = await createEvent(payload);
      }

      try {
        const stored = window.localStorage.getItem('calendar-event-categories');
        const mapping = stored ? (JSON.parse(stored) as Record<string, string>) : {};
        if (categoryId) mapping[savedEvent.id] = categoryId;
        else delete mapping[savedEvent.id];
        window.localStorage.setItem('calendar-event-categories', JSON.stringify(mapping));
      } catch {
        /* visual category preference is optional */
      }

      await queryClient.invalidateQueries({
        queryKey: eventKeys.all
      });

      toast.success(event ? 'Evento actualizado' : 'Evento creado');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el evento.');
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!event) return;

    setPending(true);

    try {
      await deleteEvent(event.id);
      try {
        const stored = window.localStorage.getItem('calendar-event-categories');
        const mapping = stored ? (JSON.parse(stored) as Record<string, string>) : {};
        delete mapping[event.id];
        window.localStorage.setItem('calendar-event-categories', JSON.stringify(mapping));
      } catch {
        /* visual category preference is optional */
      }

      await queryClient.invalidateQueries({
        queryKey: eventKeys.all
      });

      toast.success('Evento eliminado');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el evento.');
    } finally {
      setPending(false);
    }
  }

  const startPreview = formatPreview(startAt);
  const endPreview = formatPreview(endAt);
  const previewDate = formatPreviewDate(startAt);
  const startTime = formatPreviewTime(startAt);
  const endTime = formatPreviewTime(endAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid w-[calc(100%-1rem)] max-w-[800px] max-h-[calc(100dvh-1rem)] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[16px] border border-border/60 bg-background p-0 shadow-[0_24px_64px_-34px_rgba(15,23,42,0.38)] sm:w-[calc(100%-2rem)] sm:max-h-[calc(100dvh-3rem)]'>
        <DialogHeader className='border-b border-border/50 bg-background px-5 pb-4 pt-4 pr-12 sm:px-6 sm:pb-5 sm:pt-5'>
          <div className='flex items-start gap-3'>
            <div className='bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl'>
              {event ? <Icons.calendar className='size-5' /> : <Icons.add className='size-5' />}
            </div>

            <div className='min-w-0'>
              <DialogTitle className='text-lg tracking-tight sm:text-xl'>
                {event ? 'Editar evento' : 'Nuevo evento'}
              </DialogTitle>

              <DialogDescription className='mt-0.5 max-w-[52ch] text-xs leading-4.5 sm:text-sm'>
                {event
                  ? 'Actualiza los detalles de este evento.'
                  : 'Añade una actividad a la agenda del equipo.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id='event-form'
          className='min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6'
          onSubmit={handleSubmit}
        >
          <div className='space-y-6 sm:space-y-7'>
            <section className='space-y-3'>
              <div>
                <div className='text-sm font-semibold tracking-tight'>Título</div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  Dale un nombre claro a lo que vas a crear.
                </div>
              </div>

              <label htmlFor='event-title' className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Título</span>
                <Input
                  id='event-title'
                  value={title}
                  onChange={(inputEvent) => setTitle(inputEvent.target.value)}
                  required
                  maxLength={200}
                  placeholder='¿Qué vas a hacer?'
                  className='h-11 rounded-xl px-4 text-[16px] sm:h-10'
                />
              </label>
            </section>

            <section className='space-y-3'>
              <div>
                <div className='text-sm font-semibold tracking-tight'>Cuándo</div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  Define cuándo empieza y termina.
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                {[
                  { key: 'start', label: 'Inicio', value: startAt },
                  { key: 'end', label: 'Fin', value: endAt }
                ].map((item) => {
                  const isStart = item.key === 'start';
                  const dateValue = localDatePart(item.value);
                  const timeValue = localTimePart(item.value);
                  return (
                    <div key={item.key} className='min-w-0 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>{item.label}</span>
                        <span className='text-muted-foreground text-xs tabular-nums'>
                          {timeValue}
                        </span>
                      </div>
                      <DateSegmentControl
                        label={`${item.label} fecha`}
                        value={dateValue}
                        onChange={(nextDate) => {
                          const next = withLocalDateTime(nextDate, timeValue);
                          if (isStart) setStartAt(next);
                          else setEndAt(next);
                        }}
                      />
                      <TimeWheel
                        label={`${item.label} hora`}
                        value={timeValue}
                        onChange={(nextTime) => {
                          const next = withLocalDateTime(dateValue, nextTime);
                          if (isStart) {
                            setStartAt(next);
                            const nextDate = new Date(next);
                            const currentEnd = new Date(endAt);
                            if (currentEnd <= nextDate) {
                              setEndAt(toInputValue(new Date(nextDate.getTime() + 60 * 60 * 1000)));
                            }
                          } else {
                            const nextDate = new Date(next);
                            const currentStart = new Date(startAt);
                            if (nextDate > currentStart) setEndAt(next);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <label
                htmlFor='event-all-day'
                className='bg-muted/25 flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-border/60 px-4 py-2.5'
              >
                <div>
                  <div className='text-sm font-medium'>Todo el día</div>
                  <div className='text-muted-foreground text-xs'>Sin una hora concreta.</div>
                </div>

                <Checkbox
                  id='event-all-day'
                  aria-label='Todo el día'
                  checked={allDay}
                  onCheckedChange={(checked) => setAllDay(checked === true)}
                />
              </label>

              {(startPreview || endPreview) && (
                <div className='flex flex-wrap items-end justify-between gap-3 border-t border-border/50 pt-4'>
                  <div className='min-w-0'>
                    <div className='text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                      Resumen
                    </div>
                    <div className='mt-1 truncate text-sm font-medium capitalize'>
                      {previewDate}
                    </div>
                  </div>
                  {startTime && endTime && (
                    <div className='text-muted-foreground shrink-0 text-sm tabular-nums'>
                      {startTime} – {endTime}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className='space-y-3'>
              <div>
                <div className='text-sm font-semibold tracking-tight'>Contexto</div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  Organiza el evento sin añadir ruido.
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='flex min-w-0 flex-col gap-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <span className='text-sm font-medium'>Categoría</span>
                  </div>
                  <div className='flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/25 px-2.5 py-1.5 sm:min-h-10'>
                    {categories.slice(0, 8).map((category) => (
                      <button
                        key={category.id}
                        type='button'
                        aria-label={`Usar categoría ${category.name}`}
                        aria-pressed={categoryId === category.id}
                        onClick={() =>
                          setCategoryId((current) => (current === category.id ? '' : category.id))
                        }
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]',
                          categoryId === category.id
                            ? 'border border-border/55 bg-foreground/8'
                            : 'border border-transparent hover:bg-foreground/6 hover:scale-[1.02]'
                        )}
                      >
                        <span
                          className='size-3.5 rounded-full ring-1 ring-inset ring-foreground/10'
                          style={{ backgroundColor: category.color }}
                        />
                      </button>
                    ))}
                    <button
                      type='button'
                      onClick={onOpenCategorySettings}
                      className='border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed transition-colors'
                      aria-label='Añadir o configurar una categoría'
                    >
                      <Icons.add className='size-4' />
                    </button>
                  </div>
                </div>
                <label htmlFor='event-customer' className='flex min-w-0 flex-col gap-2'>
                  <span className='text-sm font-medium'>
                    Cliente <span className='text-muted-foreground font-normal'>(opcional)</span>
                  </span>

                  <NativeSelect
                    id='event-customer'
                    value={customerId}
                    onChange={(inputEvent) => setCustomerId(inputEvent.target.value)}
                  >
                    <NativeSelectOption value=''>Sin cliente</NativeSelectOption>
                    {customers.map((customer) => (
                      <NativeSelectOption key={customer.id} value={customer.id}>
                        {customer.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
              </div>

              <label htmlFor='event-assignee' className='flex min-w-0 flex-col gap-2'>
                <span className='text-sm font-medium'>
                  Responsable <span className='text-muted-foreground font-normal'>(opcional)</span>
                </span>

                <NativeSelect
                  id='event-assignee'
                  value={assigneeId}
                  onChange={(inputEvent) => setAssigneeId(inputEvent.target.value)}
                >
                  <NativeSelectOption value=''>Sin responsable</NativeSelectOption>
                  {members.map((member) => (
                    <NativeSelectOption key={member.id} value={member.id}>
                      {member.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
            </section>

            <section className='space-y-3'>
              <div>
                <div className='text-sm font-semibold tracking-tight'>Opcional</div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  Añade un poco más de contexto si lo necesitas.
                </div>
              </div>

              <label htmlFor='event-location' className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Ubicación</span>
                <div className='flex gap-2'>
                  <Input
                    id='event-location'
                    value={location}
                    onChange={(inputEvent) => setLocation(inputEvent.target.value)}
                    maxLength={500}
                    placeholder='Dirección, lugar o enlace…'
                    className='h-11 min-w-0 flex-1 rounded-xl px-4 text-[16px] sm:h-10 sm:text-sm'
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || ' ')}`}
                    target='_blank'
                    rel='noreferrer'
                    aria-disabled={!location}
                    onClick={(clickEvent) => {
                      if (!location.trim()) clickEvent.preventDefault();
                    }}
                    className={cn(
                      'inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 text-sm font-medium transition-colors sm:h-10',
                      location.trim() ? 'hover:bg-accent/50' : 'pointer-events-none opacity-40'
                    )}
                  >
                    <Icons.externalLink className='size-4' />
                    <span className='hidden sm:inline'>Maps</span>
                  </a>
                </div>
                {location.trim() && (
                  <span className='text-muted-foreground text-xs'>
                    Se abrirá esta ubicación en Google Maps.
                  </span>
                )}
              </label>

              <label htmlFor='event-description' className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Notas</span>
                <Textarea
                  id='event-description'
                  value={description}
                  onChange={(inputEvent) => setDescription(inputEvent.target.value)}
                  maxLength={5000}
                  placeholder='Añade cualquier detalle que quieras recordar…'
                  className='min-h-24 rounded-xl px-4 py-3 text-[16px] sm:text-sm'
                />
              </label>

              {event?.customer && (
                <Link
                  className='text-primary inline-flex text-xs underline-offset-4 hover:underline'
                  href={`/dashboard/customers/${event.customer.id}`}
                >
                  Abrir cliente: {event.customer.name}
                </Link>
              )}
            </section>
          </div>
        </form>

        <DialogFooter className='!mx-0 !mb-0 rounded-b-[15px] border-t border-border/50 bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-4'>
          <div className='flex w-full items-center gap-2'>
            {event && (
              <Button
                variant='ghost'
                type='button'
                onClick={() => void handleDelete()}
                disabled={pending}
                className='h-10 shrink-0 rounded-xl px-4 text-destructive hover:bg-destructive/10 hover:text-destructive'
              >
                Eliminar
              </Button>
            )}

            <Button
              type='submit'
              form='event-form'
              disabled={pending}
              className='h-11 flex-1 rounded-xl px-5 text-[15px] font-semibold shadow-none'
            >
              {pending ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
