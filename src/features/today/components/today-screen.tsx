'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, startOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useSession } from '@/lib/auth-client';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import { getEvents, eventKeys } from '@/features/calendar/queries';
import type { Task } from '@/features/tasks/types';
import type { Event } from '@/features/calendar/types';

type Role = 'owner' | 'manager' | 'member';

function priorityLabel(priority: Task['priority']) {
  if (priority === 'high') return 'Alta';
  if (priority === 'medium') return 'Media';
  return 'Baja';
}

function priorityRank(priority: Task['priority']) {
  return priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
}

function taskIsDueToday(task: Task, today: Date) {
  return task.dueAt ? isSameDay(new Date(task.dueAt), today) : false;
}

function taskIsOverdue(task: Task, today: Date) {
  return Boolean(task.dueAt && new Date(task.dueAt) < today && task.status !== 'done');
}

function eventTimeLabel(event: Event) {
  if (event.allDay) return 'Todo el día';
  return `${format(new Date(event.startAt), 'HH:mm')}–${format(new Date(event.endAt), 'HH:mm')}`;
}

export function TodayScreen({ role }: { role: Role }) {
  const { data: session } = useSession();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    retry: 2,
    refetchOnWindowFocus: false
  });

  const weekRange = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return { start, end: endOfWeek(now, { weekStartsOn: 1 }) };
  }, [now]);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: eventKeys.list({
      startDate: weekRange.start.toISOString(),
      endDate: weekRange.end.toISOString()
    }),
    queryFn: () =>
      getEvents({
        startDate: weekRange.start.toISOString(),
        endDate: weekRange.end.toISOString()
      }),
    retry: 2,
    refetchOnWindowFocus: false
  });

  const userId = session?.user?.id;
  const isManager = role === 'owner' || role === 'manager';

  const myTasks = useMemo(
    () => (userId ? tasks.filter((task) => task.assigneeId === userId || !task.assigneeId) : tasks),
    [tasks, userId]
  );

  const todayTasks = useMemo(
    () =>
      myTasks
        .filter((task) => task.status !== 'done')
        .filter((task) => taskIsDueToday(task, now) || !task.dueAt)
        .toSorted(
          (a, b) =>
            priorityRank(b.priority) - priorityRank(a.priority) ||
            new Date(a.dueAt ?? '2999-01-01').getTime() -
              new Date(b.dueAt ?? '2999-01-01').getTime()
        )
        .slice(0, 6),
    [myTasks, now]
  );

  const overdue = useMemo(() => myTasks.filter((task) => taskIsOverdue(task, now)), [myTasks, now]);

  const waiting = useMemo(
    () => myTasks.filter((task) => task.status === 'waiting').slice(0, 4),
    [myTasks]
  );

  const todayEvents = useMemo(
    () =>
      events
        .filter((event) => isSameDay(new Date(event.startAt), now))
        .toSorted((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [events, now]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.endAt) >= now)
        .toSorted((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 5),
    [events, now]
  );

  const deadlines = useMemo(
    () =>
      myTasks
        .filter((task) => task.status !== 'done' && task.dueAt)
        .toSorted((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
        .slice(0, 5),
    [myTasks]
  );

  const attentionCount = overdue.length + waiting.length;
  const firstName = session?.user?.name?.split(' ')[0] ?? 'ahí';

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekRange.start, index));

  return (
    <main className='flex min-w-0 flex-1 flex-col gap-8 pb-24 sm:gap-10 md:pb-12'>
      <header className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-sm'>Hoy</p>
          <h1 className='mt-1 text-balance text-4xl font-semibold tracking-tight sm:text-5xl'>
            Buenos días, {firstName}.
          </h1>
          <p className='text-muted-foreground mt-2 text-lg'>
            {attentionCount === 0
              ? 'Todo bajo control.'
              : `${attentionCount} ${attentionCount === 1 ? 'cosa necesita' : 'cosas necesitan'} tu atención.`}
          </p>
        </div>

        <div className='flex flex-col items-start gap-1 lg:items-end'>
          <div className='text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl'>
            {format(now, 'HH:mm')}
          </div>
          <div className='text-muted-foreground text-sm capitalize'>
            {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </div>
        </div>
      </header>

      <section className='flex flex-wrap gap-2'>
        <Link
          href='/dashboard/tasks'
          className='bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition-transform hover:-translate-y-px active:scale-[0.98]'
        >
          <Icons.add className='size-4' />
          Nueva tarea
        </Link>
        <Link
          href='/dashboard/calendar'
          className='bg-card inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border/70 px-4 text-sm font-medium transition-colors hover:bg-muted/50'
        >
          <Icons.calendar className='size-4' />
          Nuevo evento
        </Link>
        <Link
          href='/dashboard/customers'
          className='bg-card inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border/70 px-4 text-sm font-medium transition-colors hover:bg-muted/50'
        >
          <Icons.teams className='size-4' />
          Nuevo cliente
        </Link>
      </section>

      <section className='grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]'>
        <div className='min-w-0 rounded-[28px] border border-border/60 bg-card/70 p-5 sm:p-6'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Mi trabajo
              </p>
              <h2 className='mt-1 text-xl font-semibold tracking-tight'>Para hoy</h2>
            </div>
            <Link
              href='/dashboard/tasks'
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              Ver todo
            </Link>
          </div>

          <div className='mt-5 divide-y divide-border/60'>
            {tasksLoading ? (
              <div className='py-8 text-sm text-muted-foreground'>Cargando tareas…</div>
            ) : todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <Link
                  key={task.id}
                  href='/dashboard/tasks'
                  className='flex items-center gap-3 py-4 transition-colors hover:bg-muted/20'
                >
                  <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/70'>
                    <Icons.check className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>{task.title}</span>
                    <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
                      {task.customer?.name ?? 'Trabajo interno'}
                      {task.dueAt ? ` · ${format(new Date(task.dueAt), 'HH:mm')}` : ''}
                    </span>
                  </span>
                  <Badge variant='secondary' className='shrink-0'>
                    {priorityLabel(task.priority)}
                  </Badge>
                </Link>
              ))
            ) : (
              <div className='py-8 text-sm text-muted-foreground'>
                No tienes tareas para hoy. Buen momento para avanzar.
              </div>
            )}
          </div>
        </div>

        <div className='rounded-[28px] border border-border/60 bg-card/70 p-5 sm:p-6'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Agenda
              </p>
              <h2 className='mt-1 text-xl font-semibold tracking-tight'>Lo siguiente</h2>
            </div>
            <Link
              href='/dashboard/calendar'
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              Calendario
            </Link>
          </div>

          <div className='mt-5 space-y-3'>
            {eventsLoading ? (
              <div className='py-8 text-sm text-muted-foreground'>Cargando agenda…</div>
            ) : todayEvents.length > 0 ? (
              todayEvents.slice(0, 4).map((event) => (
                <Link
                  key={event.id}
                  href='/dashboard/calendar'
                  className='flex items-start gap-3 rounded-2xl bg-muted/35 px-3.5 py-3 transition-colors hover:bg-muted/55'
                >
                  <span className='mt-1 flex size-2.5 shrink-0 rounded-full bg-primary' />
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-medium'>{event.title}</span>
                    <span className='text-muted-foreground mt-0.5 block text-xs'>
                      {eventTimeLabel(event)}
                      {event.customer ? ` · ${event.customer.name}` : ''}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <div className='py-8 text-sm text-muted-foreground'>No hay reuniones hoy.</div>
            )}
          </div>
        </div>
      </section>

      <section className='rounded-[28px] border border-border/60 bg-card/55 p-5 sm:p-6'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
              Esta semana
            </p>
            <h2 className='mt-1 text-xl font-semibold tracking-tight'>Una mirada rápida</h2>
          </div>
          <span className='text-muted-foreground text-xs'>
            {format(weekRange.start, 'd MMM', { locale: es })}–
            {format(weekRange.end, 'd MMM', { locale: es })}
          </span>
        </div>

        <div className='mt-5 grid grid-cols-7 gap-1.5 sm:gap-2'>
          {weekDays.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(new Date(event.startAt), day));
            const dayTasks = myTasks.filter(
              (task) => taskIsDueToday(task, day) && task.status !== 'done'
            );
            const current = isSameDay(day, now);
            return (
              <Link
                key={day.toISOString()}
                href='/dashboard/calendar'
                className={[
                  'min-w-0 rounded-2xl border px-2 py-3 text-center transition-all hover:-translate-y-px hover:bg-muted/40',
                  current ? 'border-primary/30 bg-primary/8' : 'border-border/60 bg-background/55'
                ].join(' ')}
              >
                <span className='text-muted-foreground block text-[10px] font-semibold uppercase'>
                  {format(day, 'EEE', { locale: es }).slice(0, 3)}
                </span>
                <span
                  className={
                    current
                      ? 'text-primary mt-1 block text-lg font-semibold'
                      : 'mt-1 block text-lg font-semibold'
                  }
                >
                  {format(day, 'd')}
                </span>
                <span className='mt-2 flex min-h-4 items-center justify-center gap-1'>
                  {dayEvents.length > 0 && <span className='size-1.5 rounded-full bg-primary' />}
                  {dayTasks.length > 0 && (
                    <span className='size-1.5 rounded-full bg-muted-foreground/60' />
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className='grid gap-5 lg:grid-cols-2'>
        <div className='rounded-[28px] border border-border/60 bg-card/65 p-5 sm:p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Necesita atención
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>Lo que conviene no dejar pasar.</p>
            </div>
            <Badge variant={attentionCount > 0 ? 'default' : 'secondary'}>{attentionCount}</Badge>
          </div>

          <div className='mt-5 space-y-2'>
            {overdue.slice(0, 3).map((task) => (
              <Link
                key={task.id}
                href='/dashboard/tasks'
                className='flex items-center gap-3 rounded-2xl bg-destructive/5 px-3.5 py-3 text-sm transition-colors hover:bg-destructive/10'
              >
                <span className='size-2 shrink-0 rounded-full bg-destructive' />
                <span className='min-w-0 flex-1 truncate'>{task.title}</span>
                <span className='text-xs text-destructive'>Vencida</span>
              </Link>
            ))}
            {waiting.slice(0, 3).map((task) => (
              <Link
                key={task.id}
                href='/dashboard/tasks'
                className='flex items-center gap-3 rounded-2xl bg-muted/35 px-3.5 py-3 text-sm transition-colors hover:bg-muted/55'
              >
                <span className='size-2 shrink-0 rounded-full bg-muted-foreground/60' />
                <span className='min-w-0 flex-1 truncate'>{task.title}</span>
                <span className='text-muted-foreground text-xs'>Esperando</span>
              </Link>
            ))}
            {attentionCount === 0 && (
              <div className='flex items-center gap-3 rounded-2xl bg-primary/7 px-3.5 py-4 text-sm'>
                <Icons.check className='size-4 text-primary' />
                Nada urgente. Sigue así.
              </div>
            )}
          </div>
        </div>

        <div className='rounded-[28px] border border-border/60 bg-card/65 p-5 sm:p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Próximamente
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>Tus siguientes compromisos.</p>
            </div>
            <Link
              href='/dashboard/calendar'
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              Ver agenda
            </Link>
          </div>

          <div className='mt-5 space-y-2'>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href='/dashboard/calendar'
                  className='flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors hover:bg-muted/40'
                >
                  <div className='min-w-14'>
                    <span className='block text-xs font-semibold tabular-nums'>
                      {format(new Date(event.startAt), 'HH:mm')}
                    </span>
                    <span className='text-muted-foreground block text-[11px] capitalize'>
                      {format(new Date(event.startAt), 'EEE d', { locale: es })}
                    </span>
                  </div>
                  <span className='size-2 shrink-0 rounded-full bg-primary/70' />
                  <span className='min-w-0 flex-1 truncate text-sm font-medium'>{event.title}</span>
                </Link>
              ))
            ) : (
              <div className='py-6 text-sm text-muted-foreground'>
                No hay eventos próximos en esta semana.
              </div>
            )}
          </div>
        </div>
      </section>

      {isManager && (
        <section className='rounded-[28px] border border-border/60 bg-card/65 p-5 sm:p-6'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Equipo
              </p>
              <h2 className='mt-1 text-xl font-semibold tracking-tight'>
                {tasks.filter((task) => task.status !== 'done').length}{' '}
                {tasks.filter((task) => task.status !== 'done').length === 1
                  ? 'tarea necesita'
                  : 'tareas necesitan'}{' '}
                atención
              </h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                Sin quitarte de tu propio trabajo.
              </p>
            </div>
            <Link
              href='/dashboard/team'
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              Ver equipo
            </Link>
          </div>

          <div className='mt-5 flex flex-wrap gap-2'>
            {tasks
              .filter(
                (task) =>
                  task.status !== 'done' && (task.priority === 'high' || task.status === 'waiting')
              )
              .slice(0, 5)
              .map((task) => (
                <Link
                  key={task.id}
                  href='/dashboard/tasks'
                  className='bg-muted/45 rounded-2xl px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/65'
                >
                  {task.title}
                  <span className='text-muted-foreground ml-2 text-xs'>
                    {task.assignee?.name ?? 'Sin asignar'}
                  </span>
                </Link>
              ))}
            {tasks.filter(
              (task) =>
                task.status !== 'done' && (task.priority === 'high' || task.status === 'waiting')
            ).length === 0 && (
              <div className='bg-primary/7 flex items-center gap-2 rounded-2xl px-3.5 py-3 text-sm'>
                <Icons.check className='size-4 text-primary' />
                El equipo va bien.
              </div>
            )}
          </div>
        </section>
      )}

      <footer className='flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5'>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <span className='bg-primary/15 flex size-8 items-center justify-center rounded-full'>
            <Icons.info className='size-4 text-primary' />
          </span>
          Entra, entiende tu día y ponte con lo que importa.
        </div>
        <div className='flex flex-wrap gap-2'>
          <Link
            href='/dashboard/profile'
            className='text-muted-foreground text-xs hover:text-foreground'
          >
            Pausa / Desconectar
          </Link>
          <Link
            href='/dashboard/tasks'
            className='text-muted-foreground text-xs hover:text-foreground'
          >
            Modo foco
          </Link>
          <Link
            href='/dashboard/weekly-review'
            className='text-muted-foreground text-xs hover:text-foreground'
          >
            Cierre del día
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default TodayScreen;
