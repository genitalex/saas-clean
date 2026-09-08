'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createEvent, eventKeys, getEvent, updateEvent } from '@/features/calendar/queries';
import type { Event } from '@/features/calendar/types';
import { activityKeys } from '@/features/activities/queries';
import { taskKeys, updateTask } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';

const solidSurface = 'rounded-xl ring-1 ring-border/55 bg-card';
const softButton = 'transition-colors duration-200 hover:bg-muted/55';

type TodayPlanItem =
  | { type: 'task'; task: Task; at: Date }
  | { type: 'event'; event: Event; at: Date };

export function QuickActions() {
  const actions = [
    {
      href: '/dashboard/my-work?mode=list&create=1',
      icon: Icons.check,
      label: 'Nueva tarea',
      hint: 'Organiza trabajo'
    },
    {
      href: '/dashboard/calendar?create=1',
      icon: Icons.calendar,
      label: 'Nuevo evento',
      hint: 'Reserva tiempo'
    },
    {
      href: '/dashboard/customers?create=1',
      icon: Icons.user,
      label: 'Nuevo cliente',
      hint: 'Añade contexto'
    },
    {
      href: '/dashboard/opportunities?create=1',
      icon: Icons.opportunities,
      label: 'Nueva oportunidad',
      hint: 'Haz crecer el negocio'
    },
    {
      href: '/dashboard/quotes',
      icon: Icons.post,
      label: 'Nuevo presupuesto',
      hint: 'Prepara una propuesta'
    },
    { href: '/dashboard/notes', icon: Icons.post, label: 'Nota rápida', hint: 'Guarda una idea' }
  ];

  return (
    <div
      className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'
      aria-label='Acciones rápidas'
    >
      {actions.map(({ href, icon: Icon, label, hint }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            solidSurface,
            'group flex min-w-0 items-center gap-2 px-2.5 py-2.5',
            softButton
          )}
        >
          <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105'>
            <Icon className='size-3.5' />
          </span>
          <span className='min-w-0'>
            <span className='block truncate text-sm font-medium'>{label}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function WeeklyAgenda({
  today,
  events,
  tasks,
  now
}: {
  today: Date;
  events: Event[];
  tasks: Task[];
  now: Date;
}) {
  const queryClient = useQueryClient();
  const agendaRef = useRef<HTMLDivElement>(null);
  const [windowStart, setWindowStart] = useState(() => today);
  const pendingScrollAdjustment = useRef(0);
  const shiftingWindow = useRef(false);
  const dragState = useRef<{ x: number; scrollLeft: number } | null>(null);
  const agendaDays = useMemo(
    () => Array.from({ length: 61 }, (_, index) => addDays(windowStart, index)),
    [windowStart]
  );
  useEffect(() => {
    const adjustment = pendingScrollAdjustment.current;
    const container = agendaRef.current;
    if (adjustment === 0 || !container) return;
    window.requestAnimationFrame(() => {
      container.scrollLeft += adjustment;
      pendingScrollAdjustment.current = 0;
      shiftingWindow.current = false;
    });
  }, [windowStart]);
  function handleAgendaScroll(event: React.UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    if (shiftingWindow.current || container.scrollWidth <= container.clientWidth) return;
    const firstCard = container.querySelector<HTMLElement>('[data-day]');
    if (!firstCard) return;
    const cardStep = firstCard.offsetWidth + 8;
    const shift = cardStep * 30;
    if (container.scrollLeft < shift * 0.35) {
      shiftingWindow.current = true;
      pendingScrollAdjustment.current = shift;
      setWindowStart((current) => addDays(current, -30));
    } else if (
      container.scrollLeft + container.clientWidth >
      container.scrollWidth - shift * 0.35
    ) {
      shiftingWindow.current = true;
      pendingScrollAdjustment.current = -shift;
      setWindowStart((current) => addDays(current, 30));
    }
  }
  function handleAgendaPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') {
      dragState.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }
  function handleAgendaPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    event.preventDefault();
    event.currentTarget.scrollLeft =
      dragState.current.scrollLeft - (event.clientX - dragState.current.x);
  }
  function shiftAgenda(days: number) {
    const container = agendaRef.current;
    if (!container) return;
    const firstCard = container.querySelector<HTMLElement>('[data-day]');
    const step = (firstCard?.offsetWidth ?? 180) + 8;
    container.scrollBy({ left: step * days, behavior: 'smooth' });
  }
  const linkedEventIds = new Set(tasks.flatMap((task) => (task.eventId ? [task.eventId] : [])));
  const todayPlan = [
    ...tasks
      .filter(
        (task) => task.status !== 'done' && task.dueAt && isSameDay(new Date(task.dueAt), today)
      )
      .map((task) => ({ type: 'task' as const, task, at: new Date(task.dueAt!) })),
    ...events
      .filter((event) => isSameDay(new Date(event.startAt), today) && !linkedEventIds.has(event.id))
      .map((event) => ({ type: 'event' as const, event, at: new Date(event.startAt) }))
  ].toSorted((left, right) => left.at.getTime() - right.at.getTime());
  const upcomingEvents = events
    .filter((event) => new Date(event.endAt) >= now)
    .toSorted(
      (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
    );

  return (
    <div>
      <div className='relative -mx-1 px-1 py-2'>
        <button
          type='button'
          aria-label='Días anteriores'
          onClick={() => shiftAgenda(-1)}
          className='absolute top-1/2 left-0 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-sm ring-1 ring-border/70 hover:bg-muted hover:text-foreground sm:flex'
        >
          <Icons.chevronLeft className='size-4' />
        </button>
        <div
          ref={agendaRef}
          onScroll={handleAgendaScroll}
          onWheel={(event) => event.preventDefault()}
          onPointerDown={handleAgendaPointerDown}
          onPointerMove={handleAgendaPointerMove}
          onPointerUp={() => {
            dragState.current = null;
          }}
          onPointerCancel={() => {
            dragState.current = null;
          }}
          className='scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pt-3 pb-3 touch-pan-x cursor-grab select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden'
        >
          {agendaDays.map((day) => {
            const selected = isSameDay(day, today);
            const dayEvents = events
              .filter((event) => isSameDay(new Date(event.startAt), day))
              .slice(0, 4);
            const dayKey = format(day, 'yyyy-MM-dd');
            return (
              <Link
                key={dayKey}
                data-day={dayKey}
                href={`/dashboard/calendar?date=${dayKey}&view=day`}
                aria-label={`Ver ${format(day, 'EEEE d MMMM', { locale: es })}`}
                className={cn(
                  'group flex min-h-28 min-w-0 shrink-0 flex-[0_0_31%] snap-start flex-col rounded-xl p-2 text-center ring-1 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/45 sm:min-h-33 sm:flex-[0_0_180px] sm:p-3',
                  selected ? 'bg-primary/8 ring-primary/20' : 'bg-background/35 ring-border/45'
                )}
              >
                <span className='text-muted-foreground block w-full text-[10px] font-semibold uppercase tracking-wide'>
                  {format(day, 'EEE', { locale: es })}
                </span>
                <span
                  className={cn(
                    'mt-1 flex size-8 shrink-0 items-center justify-center self-center rounded-full text-sm font-semibold',
                    selected ? 'bg-primary text-primary-foreground' : 'group-hover:bg-muted/70'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <span className='mt-2 flex flex-1 flex-col items-start gap-1 overflow-hidden text-left'>
                  {dayEvents.map((event) => (
                    <span
                      key={event.id}
                      className='flex w-full min-w-0 items-center gap-1 text-[10px] leading-4'
                    >
                      <i
                        className='size-1.5 shrink-0 rounded-full bg-primary'
                        title={event.title}
                      />
                      <span className='truncate'>{event.title}</span>
                    </span>
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
        <button
          type='button'
          aria-label='Días siguientes'
          onClick={() => shiftAgenda(1)}
          className='absolute top-1/2 right-0 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-sm ring-1 ring-border/70 hover:bg-muted hover:text-foreground sm:flex'
        >
          <Icons.chevronRight className='size-4' />
        </button>
      </div>

      <div className='mt-4 rounded-xl bg-primary/4 p-3 ring-1 ring-primary/12 sm:p-4'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-sm font-semibold'>Plan de hoy</p>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {todayPlan.length} {todayPlan.length === 1 ? 'elemento' : 'elementos'}
          </span>
        </div>
        <div className='mt-2 divide-y divide-border/45'>
          {todayPlan.slice(0, 3).map((item) => (
            <TodayPlanRow
              key={`${item.type}-${item.type === 'task' ? item.task.id : item.event.id}`}
              item={item}
              queryClient={queryClient}
            />
          ))}
          {todayPlan.length === 0 && (
            <p className='text-muted-foreground py-3 text-sm'>
              No hay trabajo planificado para hoy.
            </p>
          )}
        </div>
      </div>

      <div className='mt-4 grid gap-2 sm:grid-cols-2'>
        {upcomingEvents.slice(0, 2).map((event) => (
          <Link
            key={event.id}
            href={`/dashboard/calendar?event=${event.id}&date=${format(new Date(event.startAt), 'yyyy-MM-dd')}`}
            className={cn(
              'flex min-w-0 items-center gap-3 rounded-xl bg-background/45 px-3.5 py-3 ring-1 ring-border/45',
              softButton
            )}
          >
            <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary'>
              <Icons.calendar className='size-4' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-medium'>{event.title}</span>
              <span className='text-muted-foreground mt-0.5 block text-xs'>
                {format(
                  new Date(event.startAt),
                  event.allDay ? "EEE d · 'Todo el día'" : 'EEE d · HH:mm',
                  { locale: es }
                )}
              </span>
            </span>
          </Link>
        ))}
        {upcomingEvents.length === 0 && (
          <p className='text-muted-foreground text-sm'>No hay reuniones próximas.</p>
        )}
      </div>
    </div>
  );
}

function TodayPlanRow({
  item,
  queryClient
}: {
  item: TodayPlanItem;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [pending, setPending] = useState(false);
  const isTask = item.type === 'task';
  const title = isTask ? item.task.title : item.event.title;
  const customerName = isTask ? item.task.customer?.name : item.event.customer?.name;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: eventKeys.all }),
      queryClient.invalidateQueries({ queryKey: activityKeys.all })
    ]);
  }

  async function complete() {
    setPending(true);
    try {
      if (isTask) await updateTask(item.task.id, { status: 'done' });
      else await updateEvent(item.event.id, { status: 'done' });
      await refresh();
      toast.success(isTask ? 'Tarea completada' : 'Evento completado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar.');
    } finally {
      setPending(false);
    }
  }

  async function postpone() {
    setPending(true);
    try {
      const nextStart = addDays(item.at, 1);
      if (isTask && item.task.eventId) {
        const linkedEvent = await getEvent(item.task.eventId);
        const duration = Math.max(
          15 * 60 * 1000,
          new Date(linkedEvent.endAt).getTime() - new Date(linkedEvent.startAt).getTime()
        );
        await updateEvent(linkedEvent.id, {
          startAt: nextStart.toISOString(),
          endAt: new Date(nextStart.getTime() + duration).toISOString()
        });
      } else if (isTask) {
        await updateTask(item.task.id, { dueAt: nextStart.toISOString() });
      } else {
        const duration = Math.max(
          15 * 60 * 1000,
          new Date(item.event.endAt).getTime() - new Date(item.event.startAt).getTime()
        );
        await updateEvent(item.event.id, {
          startAt: nextStart.toISOString(),
          endAt: new Date(nextStart.getTime() + duration).toISOString()
        });
      }
      await refresh();
      toast.success('Pasado a mañana');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo posponer.');
    } finally {
      setPending(false);
    }
  }

  async function plan() {
    if (!isTask || item.task.eventId) return;
    setPending(true);
    try {
      const start = new Date(item.at);
      const created = await createEvent({
        title: item.task.title,
        description: item.task.description ?? undefined,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        customerId: item.task.customerId,
        assigneeId: item.task.assigneeId,
        status: 'planned'
      });
      await updateTask(item.task.id, { eventId: created.id, dueAt: start.toISOString() });
      await refresh();
      toast.success('Tarea planificada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo planificar.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className='flex flex-wrap items-center gap-2 py-3'>
      <Link
        href={
          isTask
            ? `/dashboard/tasks?task=${item.task.id}`
            : `/dashboard/calendar?event=${item.event.id}`
        }
        className='flex min-w-0 flex-1 items-center gap-3'
      >
        <span className='text-muted-foreground w-12 shrink-0 text-xs font-semibold tabular-nums'>
          {format(item.at, 'HH:mm')}
        </span>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg',
            isTask ? 'bg-primary/10 text-primary' : 'bg-background/70 text-muted-foreground'
          )}
        >
          {isTask ? <Icons.check className='size-3.5' /> : <Icons.calendar className='size-3.5' />}
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-medium'>{title}</span>
          <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
            {isTask ? 'Tarea planificada' : 'Evento'}
            {customerName ? ` · ${customerName}` : ''}
          </span>
        </span>
      </Link>
      <div className='flex shrink-0 items-center gap-1'>
        <Button variant='ghost' size='sm' disabled={pending} onClick={() => void complete()}>
          Hecho
        </Button>
        <Button variant='ghost' size='sm' disabled={pending} onClick={() => void postpone()}>
          Mañana
        </Button>
        {isTask && !item.task.eventId && (
          <Button variant='ghost' size='sm' disabled={pending} onClick={() => void plan()}>
            Planificar
          </Button>
        )}
      </div>
    </div>
  );
}
