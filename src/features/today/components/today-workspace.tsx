'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, endOfDay, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { Icons } from '@/components/icons';
import {
  todayWorkspaceStorageKey,
  WidgetWorkspace,
  type WidgetDefinition
} from '@/components/layout/widget-workspace';
import { cn } from '@/lib/utils';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { eventKeys, getEvents } from '@/features/calendar/queries';
import type { Event } from '@/features/calendar/types';
import { activityKeys, getActivities } from '@/features/activities/queries';
import type { GlobalActivity } from '@/features/activities/types';
import { getAttentionItemsQueryOptions } from '@/features/automations/api/queries';
import { AttentionItems } from '@/features/automations/components/attention-items';
import { WeatherIndicator } from '@/features/weather/components/weather-indicator';
import { QuickCapture } from './quick-capture';
import { QuickActions, WeeklyAgenda } from './today-widget-content';

const surfaceLink =
  'flex min-w-0 items-center gap-3 rounded-xl bg-background/45 px-3 py-2.5 transition-colors hover:bg-muted/55';

type TodayPeriod = 'morning' | 'afternoon' | 'night';

interface TodayAmbient {
  period: TodayPeriod;
  image: string;
  greeting: string;
}

const TODAY_AMBIENTS: Record<TodayPeriod, TodayAmbient> = {
  morning: {
    period: 'morning',
    image: '/images/today/mañana.webp',
    greeting: 'Buenos días'
  },
  afternoon: {
    period: 'afternoon',
    image: '/images/today/tarde.webp',
    greeting: 'Buenas tardes'
  },
  night: {
    period: 'night',
    image: '/images/today/noche.webp',
    greeting: 'Buenas noches'
  }
};

function getTodayPeriod(now: Date): TodayPeriod {
  const hour = now.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'afternoon';
  return 'night';
}

export function getTodayAmbient(now: Date): TodayAmbient {
  return TODAY_AMBIENTS[getTodayPeriod(now)];
}

function taskNeedsAttention(task: Task, now: Date) {
  return (
    task.status !== 'done' &&
    (task.priority === 'high' ||
      task.status === 'waiting' ||
      Boolean(task.dueAt && new Date(task.dueAt) < now))
  );
}

export function TodayWorkspace({ userId, userName }: { userId: string; userName: string }) {
  const [now, setNow] = useState(() => new Date());
  const ambient = getTodayAmbient(now);
  const [activeAmbient, setActiveAmbient] = useState(ambient);
  const [previousAmbient, setPreviousAmbient] = useState<TodayAmbient | null>(null);
  const [ambientVisible, setAmbientVisible] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextNow = new Date();
      const nextAmbient = getTodayAmbient(nextNow);
      setNow(nextNow);

      if (nextAmbient.period !== activeAmbient.period) {
        setPreviousAmbient(activeAmbient);
        setActiveAmbient(nextAmbient);
        setAmbientVisible(false);

        window.requestAnimationFrame(() => setAmbientVisible(true));
        window.setTimeout(() => setPreviousAmbient(null), 900);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeAmbient]);

  const today = startOfDay(now);
  const agendaStart = addDays(today, -365);
  const agendaEnd = addDays(today, 366);
  const tasksQuery = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    staleTime: 20_000
  });
  const eventsQuery = useQuery({
    queryKey: eventKeys.list({
      startDate: agendaStart.toISOString(),
      endDate: agendaEnd.toISOString()
    }),
    queryFn: () =>
      getEvents({ startDate: agendaStart.toISOString(), endDate: agendaEnd.toISOString() }),
    staleTime: 20_000
  });
  const activityQuery = useQuery({
    queryKey: activityKeys.global(),
    queryFn: getActivities,
    staleTime: 20_000
  });
  const attentionQuery = useQuery({
    ...getAttentionItemsQueryOptions('active'),
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
        nextAction: string | null;
        nextActionAt: string | null;
      }>;
    },
    staleTime: 30_000
  });

  const tasks = tasksQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const activities = (activityQuery.data ?? []).slice(0, 4);
  const attentionItems = attentionQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const staleCustomers = customers
    .filter(
      (customer) => customer.nextActionAt && new Date(customer.nextActionAt) < addDays(today, -7)
    )
    .slice(0, 3);

  const widgets: WidgetDefinition[] = [
    {
      id: 'capture',
      title: 'Captura rápida',
      icon: Icons.add,
      kind: 'widget',
      defaultSize: 4,
      mobileSize: 2,
      allowedSizes: [4, 6, 8],
      mobileAllowedSizes: [2],
      defaultHeight: 3,
      mobileDefaultHeight: 2,
      minHeight: 3,
      maxHeight: 3,
      mobileMinHeight: 2,
      mobileMaxHeight: 2,
      content: <QuickCapture />
    },
    {
      id: 'quick-actions',
      title: 'Acciones rápidas',
      icon: Icons.sparkles,
      kind: 'widget',
      defaultSize: 12,
      mobileSize: 2,
      allowedSizes: [8, 12],
      mobileAllowedSizes: [2],
      defaultHeight: 3,
      mobileDefaultHeight: 5,
      minHeight: 3,
      maxHeight: 5,
      mobileMinHeight: 5,
      mobileMaxHeight: 5,
      content: <QuickActions />
    },
    {
      id: 'agenda',
      title: 'Agenda',
      icon: Icons.calendar,
      kind: 'view',
      source: 'calendar',
      defaultSize: 12,
      mobileSize: 2,
      allowedSizes: [8, 12],
      mobileAllowedSizes: [2],
      defaultHeight: 6,
      minHeight: 6,
      maxHeight: 6,
      content: <WeeklyAgenda today={today} events={events} tasks={tasks} now={now} />
    },
    {
      id: 'completion-rate',
      title: 'Carga de hoy',
      icon: Icons.check,
      defaultSize: 6,
      mobileSize: 2,
      allowedSizes: [4, 6, 8],
      mobileAllowedSizes: [2],
      defaultHeight: 3,
      mobileDefaultHeight: 3,
      minHeight: 3,
      maxHeight: 3,
      mobileMinHeight: 3,
      mobileMaxHeight: 3,
      content: <TodayLoadWidget today={today} now={now} tasks={tasks} events={events} />
    },
    {
      id: 'activity-rhythm',
      title: 'Actividad reciente',
      icon: Icons.pulse,
      defaultSize: 6,
      mobileSize: 2,
      allowedSizes: [4, 6, 8],
      mobileAllowedSizes: [2],
      defaultHeight: 3,
      mobileDefaultHeight: 3,
      minHeight: 3,
      maxHeight: 3,
      mobileMinHeight: 3,
      mobileMaxHeight: 3,
      content: <ActivityRhythmWidget today={today} tasks={tasks} events={events} />
    },
    {
      id: 'tasks',
      title: 'Tareas',
      icon: Icons.check,
      defaultSize: 6,
      mobileSize: 2,
      allowedSizes: [4, 6, 8],
      mobileAllowedSizes: [2],
      defaultHeight: 3,
      minHeight: 2,
      maxHeight: 3,
      content: (
        <div className='flex h-full min-h-0 flex-col'>
          <div className='min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-none'>
            {[...tasks]
              .sort(
                (left, right) => Number(left.status === 'done') - Number(right.status === 'done')
              )
              .slice(0, 6)
              .map((task) => {
                const completed = task.status === 'done' || Boolean(task.completedAt);
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/my-work?mode=list&task=${task.id}`}
                    className={cn(surfaceLink, completed && 'opacity-75')}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg',
                        completed
                          ? 'bg-muted text-muted-foreground'
                          : taskNeedsAttention(task, now)
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted/70'
                      )}
                    >
                      <Icons.check className='size-3.5' />
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-sm font-medium',
                        completed && 'text-muted-foreground'
                      )}
                    >
                      <span className={completed ? 'line-through' : undefined}>{task.title}</span>
                    </span>
                    {task.dueAt && (
                      <span
                        className={cn(
                          'shrink-0 text-[11px]',
                          completed ? 'text-muted-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {format(new Date(task.dueAt), 'd MMM', { locale: es })}
                      </span>
                    )}
                  </Link>
                );
              })}
            {tasks.length === 0 && (
              <p className='text-muted-foreground py-5 text-sm'>Sin tareas.</p>
            )}
          </div>
          <Link
            href='/dashboard/my-work?mode=list'
            className='text-muted-foreground shrink-0 px-1 pt-2 text-xs hover:text-foreground'
          >
            Ver todas las tareas
          </Link>
        </div>
      )
    },
    ...(attentionItems.length > 0
      ? ([
          {
            id: 'attention',
            title: 'Atención',
            icon: Icons.warning,
            defaultSize: 6,
            mobileSize: 2,
            allowedSizes: [4, 6],
            mobileAllowedSizes: [2],
            defaultHeight: 2,
            minHeight: 2,
            maxHeight: 3,
            content: <AttentionItems compact />
          }
        ] as WidgetDefinition[])
      : []),
    {
      id: 'activity',
      title: 'Actividad',
      icon: Icons.pulse,
      defaultSize: 6,
      mobileSize: 2,
      allowedSizes: [4, 6, 8],
      mobileAllowedSizes: [2],
      defaultHeight: 4,
      minHeight: 4,
      maxHeight: 4,
      content: <ActivityList activities={activities} loading={activityQuery.isLoading} />
    },
    {
      id: 'customers',
      title: 'Clientes',
      icon: Icons.user,
      defaultSize: 6,
      mobileSize: 2,
      allowedSizes: [4, 6, 8],
      mobileAllowedSizes: [2],
      defaultHeight: 2,
      minHeight: 2,
      maxHeight: 3,
      content: (
        <div className='space-y-1'>
          {staleCustomers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className={surfaceLink}
            >
              <span className='bg-primary/8 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg'>
                <Icons.phone className='size-3.5' />
              </span>
              <span className='min-w-0 flex-1 truncate text-sm font-medium'>{customer.name}</span>
              <Icons.chevronRight className='text-muted-foreground size-4' />
            </Link>
          ))}
          {staleCustomers.length === 0 && (
            <p className='text-muted-foreground py-5 text-sm'>Sin seguimientos pendientes.</p>
          )}
          <Link
            href='/dashboard/customers'
            className='text-muted-foreground block px-1 pt-2 text-xs hover:text-foreground'
          >
            Ver clientes
          </Link>
        </div>
      )
    }
  ];

  return (
    <main className='mx-auto flex w-full max-w-(--page-max-width) min-w-0 flex-1 flex-col gap-4 px-(--page-padding) pt-5 pb-10 sm:gap-5 sm:pt-7'>
      <header className='relative isolate flex min-h-44 flex-col justify-between gap-5 overflow-hidden rounded-xl px-5 py-5 text-white sm:min-h-48 sm:flex-row sm:items-start sm:px-7 sm:py-7'>
        <div className='absolute inset-0 -z-10 overflow-hidden bg-muted' aria-hidden='true'>
          {previousAmbient && (
            <div
              className={cn(
                'absolute inset-0 bg-cover bg-center transition-opacity duration-900 ease-[cubic-bezier(0.32,0.72,0,1)]',
                ambientVisible ? 'opacity-0' : 'opacity-100'
              )}
              style={{ backgroundImage: `url("${previousAmbient.image}")` }}
            />
          )}
          <div
            className={cn(
              'absolute inset-0 bg-cover bg-center transition-opacity duration-900 ease-[cubic-bezier(0.32,0.72,0,1)]',
              ambientVisible ? 'opacity-100' : 'opacity-0'
            )}
            style={{ backgroundImage: `url("${activeAmbient.image}")` }}
          />
          <div className='absolute inset-0 bg-black/18' />
        </div>

        <div className='flex min-w-0 flex-col gap-4 lg:justify-center'>
          <div className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-white/80' />
            <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85'>
              Hoy
            </p>
          </div>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight sm:text-3xl'>
            {ambient.greeting}, {userName}
          </h1>
        </div>
        <div className='flex flex-col items-start gap-3 self-start text-white sm:self-end sm:pb-1 lg:mt-8 lg:items-end lg:self-start'>
          <div className='flex items-center gap-3 text-sm text-white/90 sm:text-base'>
            <span className='inline-flex items-center gap-2'>
              <Icons.calendar className='size-4' style={{ color: 'white' }} />
              <span className='capitalize'>{format(now, 'EEEE d MMMM', { locale: es })}</span>
            </span>
            <span className='text-white/45'>·</span>
            <time className='font-semibold tabular-nums tracking-tight text-white'>
              {format(now, 'HH:mm')}
            </time>
          </div>
          <WeatherIndicator userId={userId} />
        </div>
      </header>
      <WidgetWorkspace widgets={widgets} storageKey={todayWorkspaceStorageKey(userId)} />
    </main>
  );
}

function TodayLoadWidget({
  today,
  now,
  tasks,
  events
}: {
  today: Date;
  now: Date;
  tasks: Task[];
  events: Event[];
}) {
  const tomorrow = addDays(today, 1);
  const todayTasks = tasks.filter((task) => task.dueAt && isSameDay(new Date(task.dueAt), today));
  const todayEvents = events.filter((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return start < tomorrow && end > today;
  });

  const total = todayTasks.length + todayEvents.length;
  const completedTasks = todayTasks.filter(
    (task) =>
      task.status === 'done' || (task.completedAt && isSameDay(new Date(task.completedAt), today))
  ).length;
  const completedEvents = todayEvents.filter((event) => event.status === 'done').length;
  const completed = completedTasks + completedEvents;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const taskShare = total > 0 ? Math.round((todayTasks.length / total) * 100) : 0;
  const eventShare = total > 0 ? 100 - taskShare : 0;
  const remaining = Math.max(0, total - completed);
  const todayDateKey = format(today, 'yyyy-MM-dd');
  const visibleEvents = [...todayEvents]
    .toSorted((left, right) => {
      const leftDone = left.status === 'done';
      const rightDone = right.status === 'done';
      if (leftDone !== rightDone) return Number(leftDone) - Number(rightDone);
      return new Date(left.startAt).getTime() - new Date(right.startAt).getTime();
    })
    .slice(0, 2);

  return (
    <div className='flex h-full min-w-0 flex-col'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='text-2xl font-semibold tabular-nums tracking-tight'>{total}</p>
          <p className='text-muted-foreground mt-0.5 text-xs'>compromisos de hoy</p>
        </div>
        <div className='text-right'>
          <p className='text-xl font-semibold tabular-nums tracking-tight'>{completionRate}%</p>
          <p className='text-muted-foreground mt-0.5 text-[11px]'>completado</p>
        </div>
      </div>

      <div className='mt-4'>
        <div className='bg-muted/70 flex h-2 overflow-hidden rounded-full'>
          <span className='bg-primary/85 h-full' style={{ width: `${taskShare}%` }} />
          <span className='bg-primary/35 h-full' style={{ width: `${eventShare}%` }} />
        </div>
        <div className='text-muted-foreground mt-2.5 flex items-center justify-between gap-2 text-[11px]'>
          <Link
            href='/dashboard/my-work?mode=list'
            className='inline-flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground'
            aria-label={`Ver ${todayTasks.length} tareas de hoy`}
          >
            <span className='bg-primary/85 size-1.5 shrink-0 rounded-full' />
            {todayTasks.length} tareas
          </Link>
          <Link
            href={`/dashboard/calendar?date=${todayDateKey}&view=day`}
            className='inline-flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground'
            aria-label={`Ver ${todayEvents.length} eventos de hoy`}
          >
            <span className='bg-primary/35 size-1.5 shrink-0 rounded-full' />
            {todayEvents.length} eventos
          </Link>
          <span className='shrink-0 rounded-md px-1 py-0.5 tabular-nums'>
            {remaining} {remaining === 1 ? 'pendiente' : 'pendientes'}
          </span>
        </div>
      </div>

      {visibleEvents.length > 0 && (
        <div className='mt-3 space-y-1'>
          {visibleEvents.map((event) => {
            const resolved = event.status === 'done';
            return (
              <Link
                key={event.id}
                href={`/dashboard/calendar?event=${event.id}&date=${todayDateKey}&view=day`}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted/55',
                  resolved && 'text-muted-foreground/70'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md',
                    resolved ? 'bg-muted text-muted-foreground' : 'bg-primary/8 text-primary'
                  )}
                >
                  {resolved ? (
                    <Icons.check className='size-3' />
                  ) : (
                    <Icons.calendar className='size-3' />
                  )}
                </span>
                <span className='min-w-0 flex-1 truncate'>
                  <span className={cn('block truncate font-medium', resolved && 'line-through')}>
                    {event.title}
                  </span>
                  <span className='text-muted-foreground block truncate text-[10px]'>
                    {event.allDay ? 'Todo el día' : format(new Date(event.startAt), 'HH:mm')}
                    {resolved ? ' · Resuelto' : ' · Pendiente'}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivityRhythmWidget({
  today,
  tasks,
  events
}: {
  today: Date;
  tasks: Task[];
  events: Event[];
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const getDayBreakdown = (day: Date) => {
    const nextDay = addDays(day, 1);
    const taskCount = tasks.filter((task) => {
      const created = new Date(task.createdAt);
      return created >= day && created < nextDay;
    }).length;
    const eventCount = events.filter((event) => {
      const created = new Date(event.createdAt);
      return created >= day && created < nextDay;
    }).length;
    return { taskCount, eventCount, total: taskCount + eventCount };
  };

  const days = Array.from({ length: 7 }, (_, index) => subDays(today, 6 - index));
  const last7 = days.map((day) => getDayBreakdown(day));
  const previous7 = Array.from({ length: 7 }, (_, index) =>
    getDayBreakdown(subDays(today, 13 - index))
  );
  const currentTotal = last7.reduce((sum, value) => sum + value.total, 0);
  const previousTotal = previous7.reduce((sum, value) => sum + value.total, 0);
  const delta =
    previousTotal === 0
      ? currentTotal > 0
        ? 100
        : 0
      : Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  const max = Math.max(1, ...last7.map((value) => value.total));
  const todayCount = last7[last7.length - 1].total;
  const currentAverage = currentTotal / 7;
  const previousAverage = previousTotal / 7;
  const selected = selectedDay === null ? null : last7[selectedDay];
  const selectedDate = selectedDay === null ? null : days[selectedDay];

  return (
    <div className='flex h-full min-w-0 flex-col justify-between'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='text-2xl font-semibold tabular-nums tracking-tight'>{currentTotal}</p>
          <p className='text-muted-foreground mt-0.5 text-xs'>elementos creados · últimos 7 días</p>
        </div>
        <div className='text-right'>
          <p
            className={cn(
              'text-xl font-semibold tabular-nums tracking-tight',
              delta > 0 ? 'text-primary' : delta < 0 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {delta > 0 ? '+' : ''}
            {delta}%
          </p>
          <p className='text-muted-foreground mt-0.5 text-[11px]'>vs. 7 días anteriores</p>
        </div>
      </div>

      <div className='mt-3'>
        <div className='flex h-16 items-end gap-1.5' aria-label='Actividad de los últimos 7 días'>
          {last7.map((value, index) => {
            const height = value.total === 0 ? 8 : Math.max(14, (value.total / max) * 100);
            const isToday = index === last7.length - 1;
            const isSelected = selectedDay === index;
            const dayLabel = format(days[index], 'EEEE d MMMM', { locale: es });
            return (
              <div
                key={`${index}-${value.total}`}
                className='group relative min-w-0 flex-1 self-stretch'
              >
                <button
                  type='button'
                  onClick={() => setSelectedDay(isSelected ? null : index)}
                  className='absolute inset-x-0 bottom-0 flex h-full items-end rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
                  aria-label={`${dayLabel}: ${value.total} elementos, ${value.taskCount} tareas y ${value.eventCount} eventos`}
                >
                  <span
                    className={cn(
                      'block w-full rounded-[5px] transition-[height,background-color,opacity] duration-300',
                      isSelected
                        ? 'bg-primary opacity-100'
                        : isToday
                          ? 'bg-primary'
                          : 'bg-primary/25 group-hover:bg-primary/45'
                    )}
                    style={{ height: `${height}%` }}
                  />
                </button>
                <span className='pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-48 -translate-x-1/2 rounded-lg border border-border/60 bg-popover px-2.5 py-2 text-[10px] leading-tight text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100'>
                  <strong className='block font-semibold'>{dayLabel}</strong>
                  <span className='text-muted-foreground mt-0.5 block'>
                    {value.total} {value.total === 1 ? 'elemento' : 'elementos'} · {value.taskCount}{' '}
                    tareas · {value.eventCount} eventos
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className='text-muted-foreground mt-2.5 flex items-center justify-between text-[10px] tabular-nums'>
          <span>Hace 6 días</span>
          <span>Hoy · {todayCount}</span>
        </div>

        {selected && selectedDate && (
          <div className='mt-2 rounded-lg border border-border/55 bg-muted/25 px-2.5 py-2 text-[10px]'>
            <div className='flex items-center justify-between gap-3'>
              <span className='font-medium capitalize'>
                {format(selectedDate, 'EEEE d MMMM', { locale: es })}
              </span>
              <span className='text-muted-foreground tabular-nums'>
                {selected.total} {selected.total === 1 ? 'elemento' : 'elementos'}
              </span>
            </div>
            <div className='text-muted-foreground mt-0.5 flex gap-3'>
              <span>{selected.taskCount} tareas</span>
              <span>{selected.eventCount} eventos</span>
            </div>
          </div>
        )}
      </div>

      <div className='text-muted-foreground mt-2 grid grid-cols-2 gap-3 text-[11px]'>
        <span>
          Media actual{' '}
          <strong className='text-foreground tabular-nums'>{currentAverage.toFixed(1)}</strong>/día
        </span>
        <span className='text-right'>
          Anterior{' '}
          <strong className='text-foreground tabular-nums'>{previousAverage.toFixed(1)}</strong>/día
        </span>
      </div>
    </div>
  );
}

function ActivityList({ activities, loading }: { activities: GlobalActivity[]; loading: boolean }) {
  if (loading) return <div className='h-16 animate-pulse rounded-xl bg-muted/45' />;
  if (activities.length === 0)
    return <p className='text-muted-foreground py-5 text-sm'>Sin actividad reciente.</p>;
  return (
    <div className='space-y-1'>
      {activities.map((activity) => (
        <Link
          key={activity.id}
          href={`/dashboard/customers/${activity.customer.id}`}
          className={surfaceLink}
        >
          <span className='bg-primary/8 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg'>
            <Icons.clock className='size-3.5' />
          </span>
          <span className='min-w-0 flex-1 truncate text-sm font-medium'>{activity.title}</span>
          <span className='text-muted-foreground max-w-24 truncate text-[11px]'>
            {activity.customer.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
