'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { getTasks, taskKeys, updateTaskStatus } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { useModeStore } from '../store';

function pickTask(tasks: Task[]) {
  return [...tasks]
    .filter((task) => task.status !== 'done')
    .toSorted((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 } as Record<string, number>;
      return (
        (priority[b.priority] ?? 0) - (priority[a.priority] ?? 0) ||
        new Date(a.dueAt ?? '2999-01-01').getTime() - new Date(b.dueAt ?? '2999-01-01').getTime()
      );
    })[0];
}

export function ModeExperiences() {
  const activeMode = useModeStore((state) => state.activeMode);
  if (!activeMode) return null;
  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
      <ModeContent />
    </div>
  );
}

function ModeContent() {
  const mode = useModeStore((state) => state.activeMode);
  if (mode === 'focus') return <FocusMode />;
  if (mode === 'pause') return <PauseMode />;
  return <EndOfDay />;
}

function ModeChrome({
  children,
  eyebrow,
  title,
  description
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const clearMode = useModeStore((state) => state.clearMode);
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-6 sm:px-10 sm:py-10'>
      <header className='flex items-center justify-between'>
        <Link href='/dashboard/overview' className='flex items-center gap-2 text-sm font-semibold'>
          <span className='grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground'>
            <Icons.logo />
          </span>
          comando
        </Link>
        <Button variant='ghost' size='sm' onClick={clearMode}>
          Salir
        </Button>
      </header>
      <div className='flex flex-1 flex-col justify-center gap-8 py-12'>
        <div className='flex flex-col gap-3'>
          <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
            {eyebrow}
          </p>
          <h1 className='text-balance text-3xl font-semibold tracking-tight sm:text-5xl'>
            {title}
          </h1>
          <p className='text-muted-foreground max-w-xl text-base leading-7'>{description}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

function FocusMode() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks()
  });
  const task = pickTask(tasks);
  const clearMode = useModeStore((state) => state.clearMode);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: 'in_progress' | 'done') => updateTaskStatus(task!.id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    }
  });
  const complete = async () => {
    if (!task) return;
    await mutation.mutateAsync('done');
    setCompleted(true);
  };
  return (
    <ModeChrome
      eyebrow='Focus'
      title={
        completed
          ? 'Perfecto. Una menos.'
          : (task?.title ?? (isLoading ? 'Preparando tu siguiente paso…' : 'Todo despejado'))
      }
      description={
        completed
          ? 'El siguiente movimiento queda listo cuando quieras.'
          : 'Una sola tarea, sin ruido. Avanza con el siguiente movimiento que hace progresar el negocio.'
      }
    >
      <Card className='border-primary/20 shadow-none sm:p-2'>
        <CardHeader>
          <div className='flex items-center justify-between gap-3'>
            <CardDescription>
              {task?.customer?.name ?? 'Trabajo interno'}
              {task?.dueAt ? ` · ${new Date(task.dueAt).toLocaleDateString('es-ES')}` : ''}
            </CardDescription>
            {task && (
              <Badge variant='secondary'>{task.priority === 'high' ? 'Alta' : task.priority}</Badge>
            )}
          </div>
          <CardTitle className='flex items-center gap-2'>
            {completed ? <Icons.check /> : <Icons.sparkles />}
            {completed ? 'Completado' : started ? 'En progreso' : 'Listo para empezar'}
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-5'>
          <Progress value={completed ? 100 : started ? 48 : 0} />
          <div className='flex flex-wrap gap-3'>
            {!completed && task && (
              <Button
                onClick={() => {
                  setStarted(true);
                  void mutation.mutateAsync('in_progress');
                }}
                disabled={mutation.isPending}
              >
                {started ? 'En progreso' : 'Empezar'}
              </Button>
            )}
            {started && !completed && (
              <Button
                variant='outline'
                onClick={() => void complete()}
                disabled={mutation.isPending}
              >
                Marcar como hecha
              </Button>
            )}
            {completed && <Button onClick={clearMode}>Siguiente</Button>}
            {!task && <Button onClick={clearMode}>Volver al centro</Button>}
          </div>
        </CardContent>
      </Card>
    </ModeChrome>
  );
}

function PauseMode() {
  const { pauseTimeRemaining, setPauseTimeRemaining, clearMode } = useModeStore();
  useEffect(() => {
    if (pauseTimeRemaining <= 0) return;
    const timer = window.setInterval(
      () => setPauseTimeRemaining(Math.max(0, pauseTimeRemaining - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [pauseTimeRemaining, setPauseTimeRemaining]);
  const time = useMemo(
    () =>
      `${Math.floor(pauseTimeRemaining / 60)
        .toString()
        .padStart(2, '0')}:${(pauseTimeRemaining % 60).toString().padStart(2, '0')}`,
    [pauseTimeRemaining]
  );
  return (
    <ModeChrome
      eyebrow='Pausa'
      title='Respira.'
      description='Aléjate un momento. Volvemos cuando estés listo.'
    >
      <Card>
        <CardContent className='flex flex-col items-center gap-6 py-12 text-center'>
          <div className='relative grid size-48 place-items-center rounded-full border border-primary/20 bg-primary/[0.04] motion-safe:animate-pulse sm:size-56'>
            <span className='text-5xl font-semibold tabular-nums tracking-tight'>{time}</span>
          </div>
          <Separator />
          <p className='text-muted-foreground text-sm'>
            {pauseTimeRemaining === 0
              ? 'Listo. Volvemos cuando quieras.'
              : 'Tu espacio queda en pausa.'}
          </p>
          <Button variant='outline' onClick={clearMode}>
            Volver al trabajo
          </Button>
        </CardContent>
      </Card>
    </ModeChrome>
  );
}

function EndOfDay() {
  const clearMode = useModeStore((state) => state.clearMode);
  const { data: tasks = [] } = useQuery({ queryKey: taskKeys.list(), queryFn: () => getTasks() });
  const completed = tasks.filter((task) => task.status === 'done').length;
  const pending = tasks.filter((task) => task.status !== 'done').length;
  return (
    <ModeChrome
      eyebrow='Cierre del día'
      title='Buen trabajo, Alex.'
      description='Una mirada breve para dejar mañana más claro.'
    >
      <Card>
        <CardHeader>
          <CardTitle>Cierre del día</CardTitle>
          <CardDescription>Lo importante queda visible.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-xl bg-muted/50 p-4'>
              <p className='text-2xl font-semibold'>{completed}</p>
              <p className='text-muted-foreground text-sm'>Completadas</p>
            </div>
            <div className='rounded-xl bg-muted/50 p-4'>
              <p className='text-2xl font-semibold'>{pending}</p>
              <p className='text-muted-foreground text-sm'>Pendientes</p>
            </div>
          </div>
          <Button className='mt-2' onClick={clearMode}>
            Cerrar el día
          </Button>
        </CardContent>
      </Card>
    </ModeChrome>
  );
}

export function StartFocusButton({
  taskId,
  title,
  customer,
  dueTime,
  priority
}: {
  taskId?: string;
  title?: string;
  customer?: string;
  dueTime?: string;
  priority?: string;
}) {
  const setFocusMode = useModeStore((state) => state.setFocusMode);
  return (
    <Button
      size='sm'
      onClick={() =>
        setFocusMode(
          taskId ?? 'priority',
          title ?? 'Preparar el siguiente paso',
          customer ?? 'Trabajo interno',
          dueTime ?? 'Hoy',
          priority ?? 'medium'
        )
      }
    >
      <Icons.sparkles data-icon='inline-start' />
      Empezar foco
    </Button>
  );
}

export function PauseButton() {
  const setPauseMode = useModeStore((state) => state.setPauseMode);
  return (
    <Button variant='outline' size='sm' onClick={() => setPauseMode(60)}>
      <Icons.clock data-icon='inline-start' />
      Pausa 1 min
    </Button>
  );
}
export function EndOfDayButton() {
  const setEndOfDayMode = useModeStore((state) => state.setEndOfDayMode);
  return (
    <Button variant='ghost' size='sm' onClick={setEndOfDayMode}>
      Cerrar el día
    </Button>
  );
}
