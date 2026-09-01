'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { getEvents, eventKeys } from '@/features/calendar/queries';
import type { Event } from '@/features/calendar/types';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function priorityLabel(priority: Task['priority']) {
  if (priority === 'high') return 'Alta';
  if (priority === 'low') return 'Baja';
  return 'Media';
}

function taskNeedsAttention(task: Task, now: Date) {
  return (
    task.status !== 'done' &&
    (task.priority === 'high' ||
      task.status === 'waiting' ||
      (task.dueAt ? new Date(task.dueAt) < now : false))
  );
}

export function TodayPage({
  role,
  userName
}: {
  role: 'owner' | 'manager' | 'member';
  userName: string;
}) {
  const now = useClock();
  const today = startOfDay(now);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
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

  const tasks = tasksQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const ownAttention = useMemo(
    () => tasks.filter((task) => taskNeedsAttention(task, now)),
    [tasks, now]
  );
  const dueToday = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== 'done' && task.dueAt && isSameDay(new Date(task.dueAt), today)
      ),
    [tasks, today]
  );
  const todayEvents = useMemo(
    () => events.filter((event) => isSameDay(new Date(event.startAt), today)),
    [events, today]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );
  const waitingTasks = tasks.filter((task) => task.status === 'waiting' && task.status !== 'done');
  const staleFollowUps = customers
    .filter(
      (customer) => customer.nextActionAt && new Date(customer.nextActionAt) < addDays(today, -7)
    )
    .sort(
      (a, b) => new Date(a.nextActionAt ?? 0).getTime() - new Date(b.nextActionAt ?? 0).getTime()
    )
    .slice(0, 3);

  const attentionCount = ownAttention.length + waitingTasks.length;
  const greeting =
    now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <main className='mx-auto flex w-full max-w-[1180px] min-w-0 flex-1 flex-col gap-8 pb-10 sm:gap-10 lg:gap-12'>
      <header className='flex flex-col gap-6 border-b border-border/60 pb-7 sm:flex-row sm:items-end sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-primary mb-2 text-xs font-semibold uppercase tracking-[0.22em]'>Hoy</p>
          <h1 className='text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-6xl'>
            {greeting}, {userName}.
          </h1>
          <p className='text-muted-foreground mt-2 text-lg'>
            {attentionCount > 0
              ? `${attentionCount} cosas necesitan tu atención.`
              : 'Todo bajo control.'}
          </p>
        </div>
        <div className='shrink-0 text-left sm:text-right'>
          <time className='block text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl'>
            {format(now, 'HH:mm')}
          </time>
          <span className='text-muted-foreground mt-1 block text-sm capitalize'>
            {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </span>
        </div>
      </header>

      <div className='flex flex-wrap gap-2'>
        <Button asChild>
          <Link href='/dashboard/tasks'>
            <Icons.add data-icon='inline-start' />
            Nueva tarea
          </Link>
        </Button>
        <Button variant='outline' asChild>
          <Link href='/dashboard/calendar'>
            <Icons.calendar data-icon='inline-start' />
            Nuevo evento
          </Link>
        </Button>
        <Button variant='outline' asChild>
          <Link href='/dashboard/customers'>
            <Icons.user data-icon='inline-start' />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      <section className='grid gap-5 lg:grid-cols-[1.35fr_0.65fr]'>
        <section
          className='rounded-[28px] border border-border/60 bg-card/75 p-5 shadow-[0_18px_45px_-34px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6'
          aria-labelledby='work-today'
        >
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                Mi trabajo
              </p>
              <h2 id='work-today' className='mt-1 text-xl font-semibold tracking-tight'>
                Para hoy
              </h2>
            </div>
            <Link
              href='/dashboard/tasks'
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              Ver todo
            </Link>
          </div>
          <div className='mt-5 flex flex-col divide-y divide-border/60'>
            {tasks
              .filter((task) => task.status !== 'done')
              .slice(0, 6)
              .map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks?task=${task.id}`}
                  className='flex items-center gap-3 py-3.5 transition-colors hover:bg-muted/30'
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border bg-background/70',
                      taskNeedsAttention(task, now) && 'border-primary/30 bg-primary/5'
                    )}
                  >
                    <Icons.check className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>{task.title}</span>
                    <span className='text-muted-foreground mt-0.5 block text-xs'>
                      {task.customer?.name ?? 'Trabajo interno'} · {priorityLabel(task.priority)}
                    </span>
                  </span>
                  <span className='text-muted-foreground shrink-0 text-xs'>
                    {task.dueAt
                      ? format(new Date(task.dueAt), 'd MMM', { locale: es })
                      : 'Sin fecha'}
                  </span>
                </Link>
              ))}
            {tasks.filter((task) => task.status !== 'done').length === 0 && (
              <div className='text-muted-foreground py-8 text-center text-sm'>
                No hay tareas pendientes.
              </div>
            )}
          </div>
        </section>

        <section
          className='rounded-[28px] border border-border/60 bg-background/45 p-5 backdrop-blur-xl sm:p-6'
          aria-labelledby='attention-now'
        >
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                Atención
              </p>
              <h2 id='attention-now' className='mt-1 text-xl font-semibold tracking-tight'>
                Lo que no conviene dejar pasar
              </h2>
            </div>
            <span className='bg-muted flex size-8 items-center justify-center rounded-full text-xs font-semibold'>
              {attentionCount}
            </span>
          </div>
          <div className='mt-5 flex flex-col gap-2'>
            {ownAttention.slice(0, 3).map((task) => (
              <Link
                key={task.id}
                href='/dashboard/tasks'
                className='rounded-2xl border border-border/50 bg-card/70 px-4 py-3 transition-colors hover:bg-card'
              >
                <p className='truncate text-sm font-medium'>{task.title}</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {task.status === 'waiting'
                    ? 'Esperando respuesta'
                    : task.dueAt && new Date(task.dueAt) < now
                      ? 'Vencida'
                      : 'Prioridad alta'}
                </p>
              </Link>
            ))}
            {ownAttention.length === 0 && (
              <p className='text-muted-foreground py-5 text-sm'>Nada urgente por ahora.</p>
            )}
          </div>
        </section>
      </section>

      <section
        className='rounded-[28px] border border-border/60 bg-card/55 p-5 backdrop-blur-xl sm:p-6'
        aria-labelledby='week-ahead'
      >
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
              Agenda
            </p>
            <h2 id='week-ahead' className='mt-1 text-xl font-semibold tracking-tight'>
              Esta semana
            </h2>
          </div>
          <Link
            href='/dashboard/calendar'
            className='text-muted-foreground text-sm hover:text-foreground'
          >
            Calendario
          </Link>
        </div>
        <div className='mt-5 grid grid-cols-7 gap-1.5 overflow-x-auto sm:gap-2'>
          {weekDays.map((day) => {
            const selected = isSameDay(day, today);
            const dayEvents = events
              .filter((event) => isSameDay(new Date(event.startAt), day))
              .slice(0, 3);
            return (
              <Link
                key={day.toISOString()}
                href='/dashboard/calendar'
                className={cn(
                  'min-w-0 rounded-2xl border p-2.5 text-center transition-colors hover:bg-muted/40 sm:p-3',
                  selected
                    ? 'border-primary/30 bg-primary/[0.06]'
                    : 'border-border/50 bg-background/40'
                )}
              >
                <span className='text-muted-foreground block text-[10px] font-medium uppercase'>
                  {format(day, 'EEE', { locale: es })}
                </span>
                <span
                  className={cn(
                    'mx-auto mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                    selected && 'bg-primary text-primary-foreground'
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
        <div className='mt-5 flex flex-col divide-y divide-border/60'>
          {events
            .filter((event) => new Date(event.endAt) >= today)
            .slice(0, 4)
            .map((event: Event) => (
              <Link
                key={event.id}
                href='/dashboard/calendar'
                className='flex items-center gap-3 py-3.5'
              >
                <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold'>
                  {format(new Date(event.startAt), 'd')}
                </span>
                <span className='min-w-0 flex-1 truncate text-sm font-medium'>{event.title}</span>
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {event.allDay ? 'Todo el día' : format(new Date(event.startAt), 'HH:mm')}
                </span>
              </Link>
            ))}
          {todayEvents.length === 0 && (
            <p className='text-muted-foreground py-4 text-sm'>No hay reuniones hoy.</p>
          )}
        </div>
      </section>

      <section className='grid gap-5 lg:grid-cols-3'>
        <section
          className='rounded-[28px] border border-border/60 bg-background/45 p-5 backdrop-blur-xl'
          aria-labelledby='follow-up-heading'
        >
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                Seguimiento
              </p>
              <h2 id='follow-up-heading' className='mt-1 text-lg font-semibold'>
                No dejes enfriar oportunidades
              </h2>
            </div>
            <Icons.clock className='text-muted-foreground size-5' />
          </div>
          <div className='mt-4 flex flex-col gap-2'>
            {staleFollowUps.length ? (
              staleFollowUps.map((customer) => (
                <a
                  key={customer.id}
                  href={`tel:${customer.phone ?? ''}`}
                  className='flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 px-3.5 py-3'
                >
                  <span className='min-w-0'>
                    <strong className='block truncate text-sm'>{customer.name}</strong>
                    <span className='text-muted-foreground text-xs'>
                      Más de 7 días sin seguimiento
                    </span>
                  </span>
                  <Icons.phone className='text-primary size-4 shrink-0' />
                </a>
              ))
            ) : (
              <p className='text-muted-foreground text-sm'>No hay seguimientos caducados.</p>
            )}
          </div>
        </section>

        <section
          className='rounded-[28px] border border-border/60 bg-background/45 p-5 backdrop-blur-xl'
          aria-labelledby='tools-heading'
        >
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                Herramientas
              </p>
              <h2 id='tools-heading' className='mt-1 text-lg font-semibold'>
                Copia, pega y avanza
              </h2>
            </div>
            <Icons.sparkles className='text-muted-foreground size-5' />
          </div>
          <div className='mt-4 grid gap-2'>
            <Link
              href='/dashboard/templates'
              className='rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-card'
            >
              Plantillas de texto rápidas
            </Link>
            <Link
              href='/dashboard/quotes'
              className='rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-card'
            >
              Crear presupuesto
            </Link>
          </div>
        </section>

        <section
          className='rounded-[28px] border border-border/60 bg-background/45 p-5 backdrop-blur-xl'
          aria-labelledby='team-layer-heading'
        >
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                Equipo
              </p>
              <h2 id='team-layer-heading' className='mt-1 text-lg font-semibold'>
                {role === 'member' ? 'Tu jornada' : 'Tu equipo, sin perder tu foco'}
              </h2>
            </div>
            <Icons.teams className='text-muted-foreground size-5' />
          </div>
          {role === 'member' ? (
            <p className='text-muted-foreground mt-4 text-sm leading-6'>
              Aquí ves tu trabajo y tus próximos pasos. El resto de la organización permanece fuera
              de tu vista.
            </p>
          ) : (
            <div className='mt-4 space-y-2'>
              <Link
                href='/dashboard/team'
                className='flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm font-medium'
              >
                <span>Revisar equipo</span>
                <Icons.chevronRight className='size-4' />
              </Link>
              <p className='text-muted-foreground px-1 text-xs'>
                Además de esto, sigues viendo tu propio trabajo arriba.
              </p>
            </div>
          )}
        </section>
      </section>

      <section className='flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5'>
        <p className='text-muted-foreground text-sm'>Un momento para trabajar con calma.</p>
        <div className='flex gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/dashboard/calendar'>Ver agenda</Link>
          </Button>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/dashboard/tasks'>Ver tareas</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
