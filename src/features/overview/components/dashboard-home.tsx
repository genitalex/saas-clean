'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { GreetingHeader } from './greeting-header';
import { TodaySummary } from './today-summary';
import { AttentionPanel } from './attention-panel';
import { RecentActivity } from './recent-activity';
import { KanbanPreview } from './kanban-preview';
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

function nextTask(tasks: Task[]) {
  return [...tasks]
    .filter((task) => task.status !== 'done')
    .sort((a, b) => {
      const overdue = (task: Task) => (task.dueAt && new Date(task.dueAt) < new Date() ? 1 : 0);
      const priority = { high: 3, medium: 2, low: 1 } as Record<string, number>;
      return (
        overdue(b) - overdue(a) ||
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
  const openTasks = tasks.filter((task) => task.status !== 'done');

  return (
    <main className='flex min-w-0 flex-1 flex-col gap-6 pb-10'>
      <GreetingHeader />
      <div className='flex flex-wrap items-center gap-2'>
        <StartFocusButton
          taskId={focusTask?.id}
          title={focusTask?.title}
          customer={focusTask?.customer?.name}
          dueTime={
            focusTask?.dueAt
              ? new Date(focusTask.dueAt).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Hoy'
          }
          priority={focusTask?.priority}
        />
        <PauseButton />
        <EndOfDayButton />
        <nav
          aria-label='Accesos rápidos'
          className='ml-auto flex max-w-full gap-2 overflow-x-auto pb-1'
        >
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              variant='ghost'
              size='sm'
              className='shrink-0'
              nativeButton={false}
              render={<Link href={href} />}
            >
              <Icon data-icon='inline-start' />
              {label}
            </Button>
          ))}
        </nav>
      </div>

      <section
        aria-labelledby='next-heading'
        className='grid min-w-0 gap-4 lg:grid-cols-[1.35fr_0.65fr]'
      >
        <Card className='overflow-hidden border-primary/20 bg-primary/[0.035] shadow-sm'>
          <CardHeader className='gap-3'>
            <div className='flex items-center justify-between gap-3'>
              <p
                id='next-heading'
                className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'
              >
                Lo siguiente
              </p>
              <Badge variant='secondary'>
                {isLoading ? 'Cargando' : focusTask ? 'Prioridad actual' : 'Despejado'}
              </Badge>
            </div>
            <CardTitle className='text-balance text-2xl tracking-tight sm:text-3xl'>
              {focusTask?.title ?? 'Todo despejado'}
            </CardTitle>
            <CardDescription>
              {focusTask
                ? `${focusTask.customer?.name ?? 'Trabajo interno'} · ${focusTask.priority === 'high' ? 'Prioridad alta' : 'En curso'}${focusTask.dueAt ? ` · ${new Date(focusTask.dueAt).toLocaleDateString('es-ES')}` : ''}`
                : 'No hay tareas pendientes. Buen momento para avanzar.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            {focusTask ? (
              <StartFocusButton
                taskId={focusTask.id}
                title={focusTask.title}
                customer={focusTask.customer?.name ?? undefined}
                dueTime={focusTask.dueAt ? 'Hoy' : 'Sin fecha'}
                priority={focusTask.priority}
              />
            ) : (
              <Button nativeButton={false} render={<Link href='/dashboard/tasks' />}>
                Ver tareas
              </Button>
            )}
            <Button variant='ghost' nativeButton={false} render={<Link href='/dashboard/kanban' />}>
              Abrir tablero <Icons.chevronRight data-icon='inline-end' />
            </Button>
          </CardContent>
        </Card>
        <AttentionPanel />
      </section>

      <TodaySummary />
      <section className='grid min-w-0 gap-4 lg:grid-cols-[1fr_1fr]'>
        <Card className='min-w-0 border-border/70 shadow-none'>
          <CardHeader className='flex-row items-start justify-between gap-3'>
            <div>
              <CardTitle className='text-base'>Business Pulse</CardTitle>
              <CardDescription>Una lectura rápida del ritmo.</CardDescription>
            </div>
            <Icons.moreHorizontal className='text-muted-foreground' />
          </CardHeader>
          <CardContent className='grid grid-cols-3 gap-3'>
            <div>
              <p className='text-2xl font-semibold'>{openTasks.length}</p>
              <p className='text-muted-foreground text-xs'>Pendientes</p>
            </div>
            <div>
              <p className='text-2xl font-semibold'>
                {tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length}
              </p>
              <p className='text-muted-foreground text-xs'>Prioridad alta</p>
            </div>
            <div>
              <p className='text-2xl font-semibold'>
                {tasks.filter((task) => task.status === 'done').length}
              </p>
              <p className='text-muted-foreground text-xs'>Completadas</p>
            </div>
          </CardContent>
        </Card>
        <RecentActivity />
      </section>
      <Card className='min-w-0 overflow-hidden border-border/70 shadow-none'>
        <CardHeader className='flex-row items-center justify-between gap-3'>
          <div>
            <CardTitle className='text-base'>Ritmo del equipo</CardTitle>
            <CardDescription>El trabajo visible, sin ruido.</CardDescription>
          </div>
          <Button
            variant='ghost'
            size='sm'
            nativeButton={false}
            render={<Link href='/dashboard/kanban' />}
          >
            Ver tablero <Icons.chevronRight data-icon='inline-end' />
          </Button>
        </CardHeader>
        <CardContent className='p-0'>
          <KanbanPreview />
        </CardContent>
      </Card>
    </main>
  );
}

export default DashboardHome;
