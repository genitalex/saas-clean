'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getTasks, taskKeys, updateTask } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { QuickCapture } from '@/features/today/components/quick-capture';

function nextDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export function InboxPage() {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    staleTime: 20_000
  });
  const tasks = (tasksQuery.data ?? []).filter(
    (task) => task.status !== 'done' && !task.dueAt && !task.eventId
  );
  const waiting = (tasksQuery.data ?? []).filter((task) => task.status === 'waiting');
  const overdue = (tasksQuery.data ?? []).filter(
    (task) => task.status !== 'done' && task.dueAt && new Date(task.dueAt) < new Date()
  );

  const schedule = async (task: Task, days: number) => {
    try {
      await updateTask(task.id, { dueAt: nextDate(days) });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success(days === 0 ? 'Añadida a hoy' : 'Añadida a mañana');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo organizar la tarea.');
    }
  };

  return (
    <main className='mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 py-2'>
      <header>
        <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>Entrada</p>
        <h1 className='mt-1 text-2xl font-semibold tracking-tight'>Inbox</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Trabajo capturado que todavía no tiene lugar.
        </p>
      </header>

      <QuickCapture />

      <section className='rounded-2xl border border-border/55 bg-card/45 p-5 sm:p-6'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold'>Por organizar</h2>
            <p className='text-muted-foreground mt-1 text-xs'>
              Decide sólo cuándo entra en tu jornada.
            </p>
          </div>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {tasks.length + waiting.length + overdue.length}
          </span>
        </div>
        <div className='mt-4 divide-y divide-border/50'>
          {tasks.map((task) => (
            <div key={task.id} className='flex flex-wrap items-center gap-3 py-3'>
              <span className='bg-primary/[0.08] text-primary flex size-8 shrink-0 items-center justify-center rounded-full'>
                <Icons.check className='size-4' />
              </span>
              <Link href={`/dashboard/tasks?task=${task.id}`} className='min-w-0 flex-1'>
                <span className='block truncate text-sm font-medium'>{task.title}</span>
                <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
                  {task.customer?.name ?? 'Sin cliente'}
                </span>
              </Link>
              <div className='flex shrink-0 gap-1'>
                <Button variant='ghost' size='sm' onClick={() => void schedule(task, 0)}>
                  Hoy
                </Button>
                <Button variant='ghost' size='sm' onClick={() => void schedule(task, 1)}>
                  Mañana
                </Button>
              </div>
            </div>
          ))}
          {waiting.map((task) => (
            <AttentionTask
              key={task.id}
              task={task}
              label={task.waitingOn ? `Esperando a ${task.waitingOn}` : 'Esperando respuesta'}
            />
          ))}
          {overdue.map((task) => (
            <AttentionTask key={task.id} task={task} label='Seguimiento vencido' />
          ))}
          {!tasksQuery.isPending && tasks.length + waiting.length + overdue.length === 0 && (
            <p className='text-muted-foreground py-8 text-center text-sm'>Inbox despejado.</p>
          )}
          {tasksQuery.isPending && <div className='bg-muted/50 h-14 animate-pulse rounded-xl' />}
        </div>
      </section>
    </main>
  );
}

function AttentionTask({ task, label }: { task: Task; label: string }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const schedule = async () => {
    setPending(true);
    try {
      await updateTask(task.id, { dueAt: nextDate(0) });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Seguimiento añadido a hoy');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo organizar la tarea.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-3 py-3'>
      <span className='bg-primary/[0.08] text-primary flex size-8 shrink-0 items-center justify-center rounded-full'>
        <Icons.warning className='size-4' />
      </span>
      <Link href={`/dashboard/tasks?task=${task.id}`} className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium'>{task.title}</span>
        <span className='text-muted-foreground mt-0.5 block truncate text-xs'>{label}</span>
      </Link>
      <Button variant='ghost' size='sm' disabled={pending} onClick={() => void schedule()}>
        Hoy
      </Button>
    </div>
  );
}
