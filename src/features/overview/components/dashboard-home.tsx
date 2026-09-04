'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { GreetingHeader } from './greeting-header';
import { TodaySummary } from './today-summary';
import { RecentActivity } from './recent-activity';
import {
  PauseButton,
  StartFocusButton,
  EndOfDayButton
} from '@/features/modes/components/mode-experiences';

const quickLinks = [
  { label: 'Clientes', href: '/dashboard/customers', icon: Icons.user },
  { label: 'Tareas', href: '/dashboard/tasks', icon: Icons.check },
  { label: 'Agenda', href: '/dashboard/calendar', icon: Icons.calendar }
];

const isOverdue = (task: Task) => (task.dueAt && new Date(task.dueAt) < new Date() ? 1 : 0);

function nextTask(tasks: Task[]) {
  return tasks
    .filter((task) => task.status !== 'done')
    .toSorted((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 } as Record<string, number>;
      return (
        isOverdue(b) - isOverdue(a) ||
        (priority[b.priority] ?? 0) - (priority[a.priority] ?? 0) ||
        new Date(a.dueAt ?? '2999-01-01').getTime() - new Date(b.dueAt ?? '2999-01-01').getTime()
      );
    })[0];
}

export function DashboardHome() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks()
  });
  const focusTask = useMemo(() => nextTask(tasks), [tasks]);
  const attention = tasks
    .filter(
      (task) => task.status !== 'done' && (task.priority === 'high' || task.status === 'waiting')
    )
    .slice(0, 3);

  return (
    <main className='mx-auto flex min-w-0 w-full max-w-[var(--page-max-width)] flex-1 flex-col gap-[var(--section-gap)] px-[var(--page-padding)] pt-5 pb-12 sm:pt-7'>
      <GreetingHeader />

      <section aria-labelledby='next-heading' className='flex min-w-0 flex-col gap-4'>
        <p
          id='next-heading'
          className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'
        >
          Lo siguiente
        </p>
        <div className='flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between'>
          <div className='min-w-0'>
            <h1 className='text-balance text-3xl font-semibold tracking-tight sm:text-5xl'>
              {focusTask?.title ?? (isLoading ? 'Preparando tu día' : 'Todo despejado')}
            </h1>
            <p className='text-muted-foreground mt-3 text-base leading-7'>
              {focusTask
                ? `${focusTask.customer?.name ?? 'Trabajo interno'} · ${focusTask.priority === 'high' ? 'Prioridad alta' : 'Siguiente paso'}${focusTask.dueAt ? ` · ${new Date(focusTask.dueAt).toLocaleDateString('es-ES')}` : ''}`
                : 'No hay tareas pendientes. Buen momento para avanzar.'}
            </p>
          </div>
          {focusTask ? (
            <StartFocusButton
              taskId={focusTask.id}
              title={focusTask.title}
              customer={focusTask.customer?.name ?? undefined}
              dueTime='Hoy'
              priority={focusTask.priority}
            />
          ) : (
            <Button
              nativeButton={false}
              render={<Link href='/dashboard/tasks' aria-label='Ver tareas' />}
            >
              Ver tareas
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby='attention-heading' className='flex flex-col gap-4 border-t pt-8'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p id='attention-heading' className='text-xs font-semibold tracking-[0.2em] uppercase'>
              Necesita atención
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>Lo que conviene no dejar pasar.</p>
          </div>
          <Badge variant='secondary'>{attention.length}</Badge>
        </div>
        <div className='flex flex-col divide-y rounded-xl border bg-card/40'>
          {attention.length > 0 ? (
            attention.map((task) => (
              <Link
                key={task.id}
                href='/dashboard/tasks'
                className='flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40'
              >
                <span className='min-w-0 truncate text-sm font-medium'>{task.title}</span>
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {task.status === 'waiting' ? 'Esperando' : 'Prioridad alta'}
                </span>
              </Link>
            ))
          ) : (
            <p className='text-muted-foreground px-4 py-4 text-sm'>Nada urgente por ahora.</p>
          )}
        </div>
      </section>

      <section aria-labelledby='today-heading' className='flex flex-col gap-4 border-t pt-8'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <p id='today-heading' className='text-xs font-semibold tracking-[0.2em] uppercase'>
              Hoy
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>Tu día, sin ruido.</p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            nativeButton={false}
            render={<Link href='/dashboard/calendar' aria-label='Ver mi día' />}
          >
            Ver mi día <Icons.chevronRight data-icon='inline-end' />
          </Button>
        </div>
        <TodaySummary />
      </section>

      <section className='grid min-w-0 gap-8 border-t pt-8 lg:grid-cols-[0.8fr_1.2fr]'>
        <div className='flex flex-col gap-4'>
          <div>
            <p className='text-xs font-semibold tracking-[0.2em] uppercase'>Business Pulse</p>
            <p className='text-muted-foreground mt-1 text-sm'>Contexto para decidir mejor.</p>
          </div>
          <div className='flex flex-wrap gap-x-8 gap-y-3 text-sm'>
            <span>
              <strong className='text-xl'>
                {tasks.filter((task) => task.status !== 'done').length}
              </strong>
              <span className='text-muted-foreground ml-2'>pendientes</span>
            </span>
            <span>
              <strong className='text-xl'>
                {tasks.filter((task) => task.status === 'done').length}
              </strong>
              <span className='text-muted-foreground ml-2'>completadas</span>
            </span>
          </div>
          <div className='flex flex-wrap gap-2 pt-2'>
            <PauseButton />
            <EndOfDayButton />
          </div>
        </div>
        <RecentActivity />
      </section>

      <nav
        aria-label='Accesos rápidos'
        className='flex max-w-full gap-2 overflow-x-auto border-t pt-6'
      >
        {quickLinks.map(({ label, href, icon: Icon }) => (
          <Button
            key={href}
            variant='ghost'
            size='sm'
            className='shrink-0'
            nativeButton={false}
            render={<Link href={href} aria-label={label} />}
          >
            <Icon data-icon='inline-start' />
            {label}
          </Button>
        ))}
      </nav>
    </main>
  );
}

export default DashboardHome;
