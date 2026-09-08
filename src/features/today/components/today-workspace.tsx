'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { Icons } from '@/components/icons';
import { WidgetWorkspace, type WidgetDefinition } from '@/components/layout/widget-workspace';
import { cn } from '@/lib/utils';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { eventKeys, getEvents } from '@/features/calendar/queries';
import { activityKeys, getActivities } from '@/features/activities/queries';
import type { GlobalActivity } from '@/features/activities/types';
import { AttentionItems } from '@/features/automations/components/attention-items';
import { QuickCapture } from './quick-capture';

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
  const activities = (activityQuery.data ?? []).slice(0, 5);
  const customers = customersQuery.data ?? [];
  const staleCustomers = customers
    .filter(
      (customer) => customer.nextActionAt && new Date(customer.nextActionAt) < addDays(today, -7)
    )
    .slice(0, 4);

  const widgets: WidgetDefinition[] = [
    {
      id: 'capture',
      title: 'Captura rápida',
      icon: Icons.add,
      defaultSize: 4,
      mobileSize: 2,
      content: <QuickCapture />
    },
    {
      id: 'agenda',
      title: 'Agenda',
      icon: Icons.calendar,
      defaultSize: 8,
      mobileSize: 2,
      content: (
        <div className='grid grid-cols-7 gap-1.5 sm:gap-2'>
          {weekDays.map((day) => {
            const selected = isSameDay(day, today);
            const dayEvents = events.filter((event) => isSameDay(new Date(event.startAt), day));
            const dayKey = format(day, 'yyyy-MM-dd');
            return (
              <Link
                key={dayKey}
                href={`/dashboard/calendar?date=${dayKey}&view=day`}
                aria-label={`Ver ${format(day, 'EEEE d MMMM', { locale: es })}`}
                className={cn(
                  'group flex min-w-0 flex-col items-center rounded-xl px-1 py-2 text-center transition-colors hover:bg-muted/55 sm:px-2',
                  selected && 'bg-primary/8'
                )}
              >
                <span className='text-muted-foreground text-[10px] font-semibold uppercase'>
                  {format(day, 'EEE', { locale: es })}
                </span>
                <span
                  className={cn(
                    'mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                    selected && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <span className='mt-2 flex h-2 gap-1'>
                  {dayEvents.slice(0, 3).map((event) => (
                    <i
                      key={event.id}
                      className='size-1.5 rounded-full bg-primary'
                      title={event.title}
                    />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
      )
    },
    {
      id: 'tasks',
      title: 'Tareas',
      icon: Icons.check,
      defaultSize: 6,
      mobileSize: 2,
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
    {
      id: 'attention',
      title: 'Atención',
      icon: Icons.warning,
      defaultSize: 6,
      mobileSize: 2,
      content: <AttentionItems compact />
    },
    {
      id: 'activity',
      title: 'Actividad',
      icon: Icons.pulse,
      defaultSize: 6,
      mobileSize: 2,
      content: <ActivityList activities={activities} loading={activityQuery.isLoading} />
    },
    {
      id: 'customers',
      title: 'Clientes',
      icon: Icons.user,
      defaultSize: 6,
      mobileSize: 2,
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
