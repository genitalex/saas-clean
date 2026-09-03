'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTasks, taskKeys, updateTask } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import {
  createEvent,
  getEvent,
  getEvents,
  eventKeys,
  updateEvent
} from '@/features/calendar/queries';
import type { Event } from '@/features/calendar/types';
import { getActivities, activityKeys } from '@/features/activities/queries';
import type { GlobalActivity } from '@/features/activities/types';
import { QuickCapture } from './quick-capture';
import { toast } from 'sonner';

type TodayPlanItem =
  | { type: 'task'; task: Task; at: Date }
  | { type: 'event'; event: Event; at: Date };

const glass =
  'rounded-[26px] border border-border/55 bg-card/60 shadow-[0_18px_55px_-38px_rgba(0,0,0,0.42)] backdrop-blur-xl';
const softButton =
  'transition-all duration-200 hover:-translate-y-px hover:border-primary/20 hover:bg-card/80 active:translate-y-0';

function priorityLabel(priority: Task['priority']) {
  if (priority === 'high') return 'Alta';
  if (priority === 'low') return 'Baja';
  return 'Media';
}

function priorityTone(priority: Task['priority']) {
  if (priority === 'high')
    return 'border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200';
  if (priority === 'low') return 'border-border/60 bg-muted/50 text-muted-foreground';
  return 'border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200';
}

function taskNeedsAttention(task: Task, now: Date) {
  return (
    task.status !== 'done' &&
    (task.priority === 'high' ||
      task.status === 'waiting' ||
      Boolean(task.dueAt && new Date(task.dueAt) < now))
  );
}

export function TodayPage({
  role,
  userName,
  initialNow
}: {
  role: 'owner' | 'manager' | 'member';
  userName: string;
  initialNow: string;
}) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const today = startOfDay(now);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekEnd = addDays(weekStart, 7);

  const tasksQuery = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    staleTime: 20_000
  });
  const eventsQuery = useQuery({
    queryKey: eventKeys.list({
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString()
    }),
    queryFn: () =>
      getEvents({ startDate: weekStart.toISOString(), endDate: weekEnd.toISOString() }),
    staleTime: 20_000
  });
  const customersQuery = useQuery({
    queryKey: ['today-customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar los clientes');
      return (await response.json()) as Array<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        nextAction: string | null;
        nextActionAt: string | null;
        updatedAt: string;
      }>;
    },
    staleTime: 30_000
  });
  const activityQuery = useQuery({
    queryKey: activityKeys.global(),
    queryFn: getActivities,
    staleTime: 20_000
  });

  const tasks = tasksQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const recentActivity = (activityQuery.data ?? []).slice(0, 4);

  const attention = tasks.filter((task) => taskNeedsAttention(task, now));
  const dueToday = tasks.filter(
    (task) => task.status !== 'done' && task.dueAt && isSameDay(new Date(task.dueAt), today)
  );
  const upcomingEvents = events
    .filter((event) => new Date(event.endAt) >= now)
    .toSorted((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
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
  ].toSorted((a, b) => a.at.getTime() - b.at.getTime());
  const staleFollowUps = customers
    .filter(
      (customer) => customer.nextActionAt && new Date(customer.nextActionAt) < addDays(today, -7)
    )
    .toSorted(
      (a, b) => new Date(a.nextActionAt ?? 0).getTime() - new Date(b.nextActionAt ?? 0).getTime()
    )
    .slice(0, 3);

  const greeting =
    now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const attentionCount = attention.length;

  return (
    <main className='mx-auto flex w-full max-w-[1080px] min-w-0 flex-1 flex-col gap-6 pb-10 pt-4 sm:gap-8 sm:pt-5'>
      <section className='rounded-2xl border border-border/60 bg-card/45 p-5 sm:p-7 lg:p-8'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='min-w-0'>
            <div className='mb-2 flex items-center gap-2'>
              <span className='size-1.5 rounded-full bg-primary' />
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.22em]'>
                Hoy
              </p>
            </div>
            <h1 className='max-w-[760px] text-balance text-xl font-semibold tracking-[-0.03em] sm:text-2xl lg:text-3xl'>
              {greeting}, {userName}.
            </h1>
            <p className='text-muted-foreground mt-2 text-base sm:text-lg'>
              {attentionCount > 0
                ? `${attentionCount} ${attentionCount === 1 ? 'cosa necesita' : 'cosas necesitan'} tu atención.`
                : 'Todo bajo control.'}
            </p>
          </div>

          <div className='flex shrink-0 items-center justify-between gap-6 rounded-xl border border-border/50 bg-background/50 px-4 py-3 lg:min-w-[220px]'>
            <div>
              <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]'>
                Ahora
              </p>
              <time className='mt-1 block text-3xl font-semibold tracking-tight tabular-nums'>
                {format(now, 'HH:mm')}
              </time>
            </div>
            <div className='text-right'>
              <p className='text-muted-foreground text-xs capitalize'>
                {format(now, 'EEEE', { locale: es })}
              </p>
              <p className='mt-0.5 text-sm font-medium tabular-nums'>
                {format(now, "d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <QuickCapture />

      <section
        className='grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5'
        aria-label='Acciones rápidas'
      >
        <QuickAction
          href='/dashboard/tasks'
          icon={Icons.check}
          label='Nueva tarea'
          hint='Organiza trabajo'
        />
        <QuickAction
          href='/dashboard/calendar'
          icon={Icons.calendar}
          label='Nuevo evento'
          hint='Reserva tiempo'
        />
        <QuickAction
          href='/dashboard/customers'
          icon={Icons.user}
          label='Nuevo cliente'
          hint='Añade contexto'
        />
        <QuickAction
          href='/dashboard/opportunities'
          icon={Icons.opportunities}
          label='Nueva oportunidad'
          hint='Haz crecer el negocio'
        />
        <QuickAction
          href='/dashboard/notes'
          icon={Icons.post}
          label='Nota rápida'
          hint='Guarda una idea'
        />
      </section>

      <section className='grid gap-4 lg:grid-cols-[1.4fr_0.8fr]'>
        <section className={cn(glass, 'p-5 sm:p-6')} aria-labelledby='work-today'>
          <SectionHeader
            eyebrow='Mi trabajo'
            title='Para hoy'
            href='/dashboard/tasks'
            action='Ver tareas'
          />
          <div className='mt-4 divide-y divide-border/50'>
            {tasks
              .filter((task) => task.status !== 'done')
              .slice(0, 6)
              .map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks?task=${task.id}`}
                  className='flex min-w-0 items-center gap-3 py-3 transition-colors hover:bg-muted/25'
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border',
                      taskNeedsAttention(task, now)
                        ? 'border-primary/30 bg-primary/[0.06]'
                        : 'border-border/60 bg-background/60'
                    )}
                  >
                    <Icons.check className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>{task.title}</span>
                    <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
                      {task.customer?.name ?? 'Trabajo interno'}
                      {task.dueAt
                        ? ` · ${format(new Date(task.dueAt), 'd MMM', { locale: es })}`
                        : ''}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold',
                      priorityTone(task.priority)
                    )}
                  >
                    {priorityLabel(task.priority)}
                  </span>
                </Link>
              ))}
            {tasks.filter((task) => task.status !== 'done').length === 0 && (
              <div className='py-8 text-center'>
                <p className='text-sm font-medium'>Todo despejado.</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Buen momento para avanzar sin ruido.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          className={cn(glass, 'bg-primary/[0.025] p-5 sm:p-6')}
          aria-labelledby='attention-now'
        >
          <SectionHeader eyebrow='Atención' title='Lo que no conviene dejar pasar' />
          <div className='mt-4 space-y-2'>
            {attention.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks?task=${task.id}`}
                className={cn(
                  'block rounded-2xl border border-border/45 bg-background/45 p-3.5',
                  softButton
                )}
              >
                <div className='flex items-start gap-3'>
                  <span className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary'>
                    <Icons.warning className='size-3.5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{task.title}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {task.status === 'waiting'
                        ? 'Esperando respuesta'
                        : task.dueAt && new Date(task.dueAt) < now
                          ? 'Vencida'
                          : 'Prioridad alta'}
                    </p>
                  </div>
                  <Icons.chevronRight className='text-muted-foreground mt-1 size-4 shrink-0' />
                </div>
              </Link>
            ))}
            {attention.length === 0 && (
              <p className='text-muted-foreground py-6 text-sm'>Nada urgente por ahora.</p>
            )}
          </div>
        </section>
      </section>

      <section className={cn(glass, 'p-5 sm:p-6')} aria-labelledby='week-ahead'>
        <SectionHeader
          eyebrow='Agenda'
          title='Esta semana'
          href='/dashboard/calendar'
          action='Calendario'
        />
        <div className='mt-5 grid grid-cols-7 gap-1.5 sm:gap-2'>
          {weekDays.map((day) => {
            const selected = isSameDay(day, today);
            const dayEvents = events
              .filter((event) => isSameDay(new Date(event.startAt), day))
              .slice(0, 3);
            const dayKey = format(day, 'yyyy-MM-dd');
            return (
              <Link
                key={dayKey}
                href={`/dashboard/calendar?date=${dayKey}&view=day`}
                aria-label={`Ver ${format(day, 'EEEE d MMMM', { locale: es })}`}
                className={cn(
                  'group min-w-0 rounded-2xl border p-2 text-center transition-all duration-200 hover:-translate-y-px hover:bg-card/80 sm:p-3',
                  selected
                    ? 'border-primary/25 bg-primary/[0.06] shadow-sm'
                    : 'border-border/45 bg-background/35'
                )}
              >
                <span className='text-muted-foreground block text-[10px] font-semibold uppercase tracking-wide'>
                  {format(day, 'EEE', { locale: es })}
                </span>
                <span
                  className={cn(
                    'mx-auto mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                    selected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'group-hover:bg-muted/70'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <span className='mt-2 flex h-3 items-center justify-center gap-1'>
                  {dayEvents.map((event) => (
                    <i
                      key={event.id}
                      className='bg-primary size-1.5 rounded-full'
                      title={event.title}
                    />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
        <div className='mt-5 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-sm font-semibold'>Plan de hoy</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>Trabajo y bloques en orden.</p>
            </div>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {todayPlan.length} {todayPlan.length === 1 ? 'elemento' : 'elementos'}
            </span>
          </div>
          <div className='mt-3 divide-y divide-border/45'>
            {todayPlan.slice(0, 6).map((item) => {
              const isTask = item.type === 'task';
              const title = isTask ? item.task.title : item.event.title;
              const customerName = isTask ? item.task.customer?.name : item.event.customer?.name;
              return (
                <div
                  key={`${item.type}-${isTask ? item.task.id : item.event.id}`}
                  className='flex flex-wrap items-center gap-3 py-3 transition-colors hover:bg-background/35'
                >
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
                        isTask
                          ? 'bg-primary/[0.10] text-primary'
                          : 'bg-background/70 text-muted-foreground'
                      )}
                    >
                      {isTask ? (
                        <Icons.check className='size-3.5' />
                      ) : (
                        <Icons.calendar className='size-3.5' />
                      )}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-medium'>{title}</span>
                      <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
                        {isTask ? 'Tarea planificada' : 'Evento'}
                        {customerName ? ` · ${customerName}` : ''}
                      </span>
                    </span>
                    <Icons.chevronRight className='text-muted-foreground size-4 shrink-0' />
                  </Link>
                  <TodayPlanActions item={item} queryClient={queryClient} />
                </div>
              );
            })}
            {todayPlan.length === 0 && (
              <p className='text-muted-foreground py-3 text-sm'>
                No hay trabajo planificado para hoy.
              </p>
            )}
          </div>
        </div>
        <div className='mt-5 grid gap-2 sm:grid-cols-2'>
          {upcomingEvents.slice(0, 4).map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/calendar?event=${event.id}&date=${format(new Date(event.startAt), 'yyyy-MM-dd')}`}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border/45 bg-background/35 px-3.5 py-3',
                softButton
              )}
            >
              <span className='bg-primary/[0.08] text-primary flex size-9 shrink-0 items-center justify-center rounded-xl'>
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
      </section>

      <section className={cn(glass, 'p-5 sm:p-6')} aria-labelledby='recent-activity'>
        <SectionHeader
          eyebrow='Memoria'
          title='Lo que ha ocurrido'
          href='/dashboard/activity'
          action='Ver actividad'
        />
        <div className='mt-4 grid gap-2 sm:grid-cols-2'>
          {recentActivity.map((activity) => (
            <ActivityPreview key={activity.id} activity={activity} />
          ))}
          {!activityQuery.isLoading && recentActivity.length === 0 && (
            <p className='text-muted-foreground text-sm'>Todavía no hay actividad reciente.</p>
          )}
          {activityQuery.isLoading && <ActivityPreviewLoading />}
        </div>
      </section>

      <section className='grid gap-4 lg:grid-cols-3'>
        <section className={cn(glass, 'p-5')} aria-labelledby='deadlines-heading'>
          <SectionHeader eyebrow='Prioridades' title='Lo que vence hoy' />
          <div className='mt-4 space-y-2'>
            {dueToday.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks?task=${task.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-border/45 bg-background/35 px-3.5 py-3',
                  softButton
                )}
              >
                <span className='bg-amber-500/10 text-amber-600 flex size-8 items-center justify-center rounded-full dark:text-amber-300'>
                  <Icons.clock className='size-4' />
                </span>
                <span className='min-w-0 flex-1 truncate text-sm'>{task.title}</span>
              </Link>
            ))}
            {dueToday.length === 0 && (
              <p className='text-muted-foreground text-sm'>Nada vence hoy.</p>
            )}
          </div>
        </section>

        <section className={cn(glass, 'p-5')} aria-labelledby='followup-heading'>
          <SectionHeader
            eyebrow='Seguimiento'
            title='No dejes enfriar oportunidades'
            href='/dashboard/customers'
            action='Clientes'
          />
          <div className='mt-4 space-y-2'>
            {staleFollowUps.map((customer) => (
              <a
                key={customer.id}
                href={
                  customer.phone ? `tel:${customer.phone}` : `/dashboard/customers/${customer.id}`
                }
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-border/45 bg-background/35 px-3.5 py-3',
                  softButton
                )}
              >
                <span className='bg-primary/[0.08] text-primary flex size-8 items-center justify-center rounded-full'>
                  <Icons.phone className='size-4' />
                </span>
                <span className='min-w-0 flex-1'>
                  <strong className='block truncate text-sm'>{customer.name}</strong>
                  <span className='text-muted-foreground text-xs'>
                    Más de 7 días sin seguimiento
                  </span>
                </span>
              </a>
            ))}
            {staleFollowUps.length === 0 && (
              <p className='text-muted-foreground text-sm'>No hay seguimientos caducados.</p>
            )}
          </div>
        </section>

        <section className={cn(glass, 'p-5')} aria-labelledby='team-heading'>
          <SectionHeader
            eyebrow='Equipo'
            title={role === 'member' ? 'Tu espacio de trabajo' : 'Tu equipo, sin perder tu foco'}
          />
          {role === 'member' ? (
            <div className='mt-4 rounded-2xl border border-border/45 bg-background/35 p-4'>
              <p className='text-sm leading-6'>
                Tu espacio muestra únicamente lo que necesitas para sacar adelante tu trabajo.
              </p>
            </div>
          ) : (
            <div className='mt-4 space-y-2'>
              <Link
                href='/dashboard/team'
                className={cn(
                  'flex items-center justify-between rounded-2xl border border-border/45 bg-background/35 px-3.5 py-3 text-sm font-medium',
                  softButton
                )}
              >
                <span>Revisar el equipo</span>
                <Icons.chevronRight className='size-4 text-muted-foreground' />
              </Link>
              <p className='text-muted-foreground px-1 text-xs leading-5'>
                Puedes revisar al equipo sin perder de vista tu propio trabajo.
              </p>
            </div>
          )}
        </section>
      </section>

      <footer className='flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5'>
        <p className='text-muted-foreground text-xs'>
          Trabaja con calma. El sistema se ocupa del ruido.
        </p>
        <div className='flex items-center gap-1'>
          <Link
            href='/dashboard/templates'
            className='text-muted-foreground rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-muted/60 hover:text-foreground'
          >
            Plantillas
          </Link>
          <Link
            href='/dashboard/quotes'
            className='text-muted-foreground rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-muted/60 hover:text-foreground'
          >
            Presupuestos
          </Link>
        </div>
      </footer>
    </main>
  );
}

function ActivityPreview({ activity }: { activity: GlobalActivity }) {
  return (
    <Link
      href={`/dashboard/customers/${activity.customer.id}`}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-2xl border border-border/45 bg-background/35 px-3.5 py-3',
        softButton
      )}
    >
      <span className='bg-primary/[0.08] text-primary flex size-8 shrink-0 items-center justify-center rounded-full'>
        <Icons.clock className='size-4' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium'>{activity.title}</span>
        <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
          {activity.customer.name}
          {activity.user?.name ? ` · ${activity.user.name}` : ''}
        </span>
      </span>
    </Link>
  );
}

function ActivityPreviewLoading() {
  return <div className='bg-muted/50 h-14 animate-pulse rounded-2xl sm:col-span-2' />;
}

function TodayPlanActions({
  item,
  queryClient
}: {
  item: TodayPlanItem;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [pending, setPending] = useState(false);
  const isTask = item.type === 'task';

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: eventKeys.all }),
      queryClient.invalidateQueries({ queryKey: activityKeys.all })
    ]);
  };

  const complete = async () => {
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
  };

  const postpone = async () => {
    setPending(true);
    try {
      const nextStart = new Date(item.at);
      nextStart.setDate(nextStart.getDate() + 1);
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
  };

  const plan = async () => {
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
  };

  return (
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
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  hint
}: {
  href: string;
  icon: typeof Icons.check;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className={cn(glass, 'group flex min-w-0 items-center gap-3 px-3.5 py-3', softButton)}
    >
      <span className='bg-primary/[0.08] text-primary flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105'>
        <Icon className='size-4.5' />
      </span>
      <span className='min-w-0'>
        <span className='block truncate text-sm font-medium'>{label}</span>
        <span className='text-muted-foreground block truncate text-[10px]'>{hint}</span>
      </span>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  action
}: {
  eyebrow: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <div className='min-w-0'>
        <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
          {eyebrow}
        </p>
        <h2 className='mt-1 text-lg font-semibold tracking-tight sm:text-xl'>{title}</h2>
      </div>
      {href && action && (
        <Link
          href={href}
          className='text-muted-foreground shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-muted/60 hover:text-foreground'
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function DayFocusView({
  date,
  today,
  tasks,
  events,
  onBackHref
}: {
  date: Date;
  today: Date;
  tasks: Task[];
  events: Event[];
  onBackHref: string;
}) {
  const dayEvents = events
    .filter((event) => isSameDay(new Date(event.startAt), date))
    .toSorted((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const dayTasks = tasks
    .filter((task) => task.dueAt && isSameDay(new Date(task.dueAt), date) && task.status !== 'done')
    .slice(0, 8);

  return (
    <main className='mx-auto flex w-full max-w-[960px] min-w-0 flex-1 flex-col gap-6 pb-10'>
      <header className='flex items-center gap-3'>
        <Link
          href={onBackHref}
          className='flex size-10 items-center justify-center rounded-xl border border-border/55 bg-background/60 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground'
        >
          <Icons.chevronLeft className='size-5' />
        </Link>
        <div className='min-w-0'>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
            Hoy · Día
          </p>
          <h1 className='truncate text-2xl font-semibold tracking-tight capitalize'>
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h1>
        </div>
        {isSameDay(date, today) && (
          <span className='ml-auto rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary'>
            Hoy
          </span>
        )}
      </header>

      <section className={cn(glass, 'p-5 sm:p-6')}>
        <SectionHeader
          eyebrow='Agenda'
          title={`${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`}
        />
        <div className='mt-5 space-y-2'>
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className='flex items-center gap-3 rounded-2xl border border-border/45 bg-background/35 px-4 py-3'
            >
              <span className='text-muted-foreground w-14 shrink-0 text-xs font-semibold tabular-nums'>
                {event.allDay ? 'Todo el día' : format(new Date(event.startAt), 'HH:mm')}
              </span>
              <span className='h-8 w-1 shrink-0 rounded-full bg-primary' />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{event.title}</p>
                {event.location && (
                  <p className='text-muted-foreground mt-0.5 truncate text-xs'>{event.location}</p>
                )}
              </div>
            </div>
          ))}
          {dayEvents.length === 0 && (
            <p className='text-muted-foreground py-5 text-sm'>No hay eventos para este día.</p>
          )}
        </div>
      </section>

      <section className={cn(glass, 'p-5 sm:p-6')}>
        <SectionHeader
          eyebrow='Trabajo'
          title={`${dayTasks.length} ${dayTasks.length === 1 ? 'tarea con fecha' : 'tareas con fecha'}`}
          href='/dashboard/tasks'
          action='Ver tareas'
        />
        <div className='mt-5 divide-y divide-border/50'>
          {dayTasks.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/tasks?task=${task.id}`}
              className='flex items-center gap-3 py-3'
            >
              <span className='flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60'>
                <Icons.check className='size-4' />
              </span>
              <span className='min-w-0 flex-1 truncate text-sm font-medium'>{task.title}</span>
              <span
                className={cn(
                  'rounded-full border px-2 py-1 text-[10px] font-semibold',
                  priorityTone(task.priority)
                )}
              >
                {priorityLabel(task.priority)}
              </span>
            </Link>
          ))}
          {dayTasks.length === 0 && (
            <p className='text-muted-foreground py-5 text-sm'>
              No hay tareas con deadline para este día.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
