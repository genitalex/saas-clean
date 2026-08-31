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
import { Icons } from '@/components/icons';
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

function clampTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const total = Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 9 * 60;
  const snapped = Math.max(0, Math.min(23 * 60 + 45, Math.round(total / 15) * 15));
  return `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;
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
  const minuteIndex = Math.round(minute / 15);
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = [0, 15, 30, 45];

  const select = (nextHour: number, nextMinute: number) =>
    onChange(`${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);

  return (
    <div
      className='relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20 px-2 py-1.5'
      aria-label={label}
    >
      <div className='pointer-events-none absolute inset-x-2 top-1/2 z-10 h-10 -translate-y-1/2 rounded-xl border border-primary/25 bg-primary/[0.06]' />
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
  const itemHeight = 34;

  useEffect(() => {
    ref.current?.scrollTo({ top: selectedIndex * itemHeight, behavior: 'smooth' });
  }, [selectedIndex]);

  return (
    <div
      ref={ref}
      role='listbox'
      aria-label={ariaLabel}
      className='no-scrollbar h-[118px] w-[72px] snap-y snap-mandatory overflow-y-auto overscroll-contain py-[42px] text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      onScroll={(event) => {
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
  categories = []
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
        throw new Error('Could not load customers');
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
        throw new Error('Could not load members');
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
    setCategoryId('');
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

      if (event) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
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
  const startTime = formatPreviewTime(startAt);
  const endTime = formatPreviewTime(endAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid w-[calc(100%-1rem)] max-w-[680px] max-h-[calc(100dvh-1rem)] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border border-border/60 bg-background/95 p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:w-[calc(100%-2rem)] sm:max-h-[calc(100dvh-3rem)]'>
        <DialogHeader className='border-b border-border/60 px-5 pb-5 pt-5 pr-12 sm:px-6 sm:pb-6 sm:pt-6'>
          <div className='flex items-start gap-3'>
            <div className='bg-primary/10 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl'>
              {event ? <Icons.calendar className='size-5' /> : <Icons.add className='size-5' />}
            </div>

            <div className='min-w-0'>
              <DialogTitle className='text-xl tracking-tight sm:text-2xl'>
                {event ? 'Editar evento' : 'Nuevo evento'}
              </DialogTitle>

              <DialogDescription className='mt-1 max-w-[52ch] text-sm leading-5 sm:text-[15px]'>
                {event
                  ? 'Actualiza los detalles de este evento.'
                  : 'Añade una actividad a la agenda del equipo.'}
              </DialogDescription>
            </div>
          </div>

          {(startPreview || endPreview) && (
            <div className='bg-muted/45 mt-4 rounded-2xl border border-border/50 px-3.5 py-3'>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                    Cuándo
                  </div>
                  <div className='mt-1 truncate text-sm font-medium capitalize'>{startPreview}</div>
                </div>

                {startTime && endTime && (
                  <div className='text-muted-foreground shrink-0 text-sm tabular-nums'>
                    {startTime} – {endTime}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <form
          id='event-form'
          className='min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6'
          onSubmit={handleSubmit}
        >
          <div className='space-y-7'>
            <section className='space-y-3'>
              <div>
                <div className='text-sm font-semibold tracking-tight'>Detalles</div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  Lo esencial para identificar la actividad.
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
                  className='h-12 rounded-2xl px-4 text-[16px] sm:h-11'
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
                      <Input
                        aria-label={`${item.label} fecha`}
                        type='date'
                        value={dateValue}
                        onChange={(inputEvent) => {
                          const next = withLocalDateTime(inputEvent.target.value, timeValue);
                          if (isStart) setStartAt(next);
                          else setEndAt(next);
                        }}
                        required
                        className='h-11 rounded-2xl bg-muted/25 px-4 text-sm'
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
                className='bg-muted/25 flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border border-border/60 px-4 py-3'
              >
                <div>
                  <div className='text-sm font-medium'>Todo el día</div>
                  <div className='text-muted-foreground text-xs'>Sin una hora concreta.</div>
                </div>

                <input
                  id='event-all-day'
                  aria-label='Todo el día'
                  type='checkbox'
                  checked={allDay}
                  onChange={(inputEvent) => setAllDay(inputEvent.target.checked)}
                  className='size-5 accent-[--color-primary]'
                />
              </label>
            </section>

            <section className='space-y-3'>
              <div>
                <div className='text-sm font-semibold tracking-tight'>Contexto</div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  Organiza el evento sin añadir ruido.
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <label htmlFor='event-category' className='flex min-w-0 flex-col gap-2'>
                  <span className='text-sm font-medium'>Categoría</span>

                  <div className='relative'>
                    <select
                      id='event-category'
                      className='h-12 w-full appearance-none rounded-2xl border border-border/60 bg-muted/25 px-4 pr-10 text-[16px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-11 sm:text-sm'
                      value={categoryId}
                      onChange={(inputEvent) => setCategoryId(inputEvent.target.value)}
                    >
                      <option value=''>Sin categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Icons.chevronDown className='text-muted-foreground pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2' />
                  </div>
                </label>

                <label htmlFor='event-customer' className='flex min-w-0 flex-col gap-2'>
                  <span className='text-sm font-medium'>
                    Cliente <span className='text-muted-foreground font-normal'>(opcional)</span>
                  </span>

                  <div className='relative'>
                    <select
                      id='event-customer'
                      className='h-12 w-full appearance-none rounded-2xl border border-border/60 bg-muted/25 px-4 pr-10 text-[16px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-11 sm:text-sm'
                      value={customerId}
                      onChange={(inputEvent) => setCustomerId(inputEvent.target.value)}
                    >
                      <option value=''>Sin cliente</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    <Icons.chevronDown className='text-muted-foreground pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2' />
                  </div>
                </label>
              </div>

              <label htmlFor='event-assignee' className='flex min-w-0 flex-col gap-2'>
                <span className='text-sm font-medium'>
                  Responsable <span className='text-muted-foreground font-normal'>(opcional)</span>
                </span>

                <div className='relative'>
                  <select
                    id='event-assignee'
                    className='h-12 w-full appearance-none rounded-2xl border border-border/60 bg-muted/25 px-4 pr-10 text-[16px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-11 sm:text-sm'
                    value={assigneeId}
                    onChange={(inputEvent) => setAssigneeId(inputEvent.target.value)}
                  >
                    <option value=''>Sin responsable</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <Icons.chevronDown className='text-muted-foreground pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2' />
                </div>
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
                <Input
                  id='event-location'
                  value={location}
                  onChange={(inputEvent) => setLocation(inputEvent.target.value)}
                  maxLength={500}
                  placeholder='Lugar, enlace o videollamada'
                  className='h-12 rounded-2xl px-4 text-[16px] sm:h-11 sm:text-sm'
                />
              </label>

              <label htmlFor='event-description' className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Notas</span>
                <Textarea
                  id='event-description'
                  value={description}
                  onChange={(inputEvent) => setDescription(inputEvent.target.value)}
                  maxLength={5000}
                  placeholder='Añade cualquier detalle que quieras recordar…'
                  className='min-h-28 rounded-2xl px-4 py-3 text-[16px] sm:text-sm'
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

        <DialogFooter className='!mx-0 !mb-0 border-t border-border/60 bg-background/92 px-5 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6 sm:py-4 sm:pb-4'>
          <div className='flex w-full items-center gap-2'>
            {event && (
              <Button
                variant='ghost'
                type='button'
                onClick={() => void handleDelete()}
                disabled={pending}
                className='h-11 shrink-0 rounded-2xl px-4 text-destructive hover:bg-destructive/10 hover:text-destructive'
              >
                Eliminar
              </Button>
            )}

            <Button
              type='submit'
              form='event-form'
              disabled={pending}
              className='h-12 flex-1 rounded-2xl px-5 text-[15px] font-semibold shadow-sm'
            >
              {pending ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
