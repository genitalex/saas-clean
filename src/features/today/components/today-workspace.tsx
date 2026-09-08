'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { Icons } from '@/components/icons';
import { WidgetWorkspace, type WidgetDefinition } from '@/components/layout/widget-workspace';
import { cn } from '@/lib/utils';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { eventKeys, getEvents } from '@/features/calendar/queries';
import { activityKeys, getActivities } from '@/features/activities/queries';
import type { GlobalActivity } from '@/features/activities/types';
import { getAttentionItemsQueryOptions } from '@/features/automations/api/queries';
import { AttentionItems } from '@/features/automations/components/attention-items';
import { QuickCapture } from './quick-capture';
import { QuickActions, WeeklyAgenda } from './today-widget-content';

const surfaceLink =
  'flex min-w-0 items-center gap-3 rounded-xl bg-background/45 px-3 py-2.5 transition-colors hover:bg-muted/55';

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
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
      minHeight: 3,
      maxHeight: 3,
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
      minHeight: 3,
      maxHeight: 3,
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

  const greeting =
    now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <main className='mx-auto flex w-full max-w-(--page-max-width) min-w-0 flex-1 flex-col gap-4 px-(--page-padding) pt-5 pb-10 sm:gap-5 sm:pt-7'>
      <header className='flex items-end justify-between gap-4'>
        <div>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>Hoy</p>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight sm:text-3xl'>
            {greeting}, {userName}
          </h1>
        </div>
        <time className='text-muted-foreground text-sm tabular-nums'>
          {format(now, 'EEE d MMM · HH:mm', { locale: es })}
        </time>
      </header>
      <WidgetWorkspace widgets={widgets} storageKey={`today-workspace:${userId}`} />
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
