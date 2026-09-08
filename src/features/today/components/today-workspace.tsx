'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, startOfDay, startOfWeek } from 'date-fns';
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
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
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
      content: (
        <WeeklyAgenda weekDays={weekDays} today={today} events={events} tasks={tasks} now={now} />
      )
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
        <div className='space-y-1'>
          {tasks
            .filter((task) => task.status !== 'done')
            .slice(0, 6)
            .map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/my-work?mode=list&task=${task.id}`}
                className={surfaceLink}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg',
                    taskNeedsAttention(task, now) ? 'bg-primary/10 text-primary' : 'bg-muted/70'
                  )}
                >
                  <Icons.check className='size-3.5' />
                </span>
                <span className='min-w-0 flex-1 truncate text-sm font-medium'>{task.title}</span>
                {task.dueAt && (
                  <span className='text-muted-foreground shrink-0 text-[11px]'>
                    {format(new Date(task.dueAt), 'd MMM', { locale: es })}
                  </span>
                )}
              </Link>
            ))}
          {tasks.filter((task) => task.status !== 'done').length === 0 && (
            <p className='text-muted-foreground py-5 text-sm'>Todo despejado.</p>
          )}
          <Link
            href='/dashboard/my-work?mode=list'
            className='text-muted-foreground block px-1 pt-2 text-xs hover:text-foreground'
          >
            Ver tareas
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

        <div className='flex min-w-0 flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-white/80' />
            <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85'>
              Hoy
            </p>
          </div>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight sm:text-3xl'>
            {ambient.greeting}, {userName}
          </h1>
          <div className='flex items-center gap-3 text-sm text-white/85'>
            <span className='inline-flex items-center gap-2'>
              <Icons.calendar className='size-3.5 text-white/75' />
              <span className='capitalize'>{format(now, 'EEEE d MMMM', { locale: es })}</span>
            </span>
            <span className='text-white/45'>·</span>
            <time className='font-semibold tabular-nums tracking-tight text-white'>
              {format(now, 'HH:mm')}
            </time>
          </div>
        </div>
        <div className='self-start sm:self-end sm:pb-1'>
          <WeatherIndicator userId={userId} />
        </div>
      </header>
      <WidgetWorkspace widgets={widgets} storageKey={todayWorkspaceStorageKey(userId)} />
    </main>
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
