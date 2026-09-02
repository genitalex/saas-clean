'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { getTasks, taskKeys } from '../queries';
import { updateTask } from '../queries';
import type { Task, TaskPriority, TaskStatus } from '../types';
import NewTaskDialog from '@/features/kanban/components/new-task-dialog';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'En curso',
  waiting: 'Esperando',
  done: 'Hecho'
};

const priorityLabels: Record<TaskPriority, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };

export function TaskListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [selected, setSelected] = useState<Task | null>(null);
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null);
  const {
    data: tasks = [],
    isPending,
    isError
  } = useQuery({
    queryKey: taskKeys.list({ search, status: status || undefined }),
    queryFn: () => getTasks({ search, status: status || undefined })
  });
  const filteredTasks = priority ? tasks.filter((task) => task.priority === priority) : tasks;

  useEffect(() => {
    const syncDeepLink = () =>
      setDeepLinkId(new URLSearchParams(window.location.search).get('task'));
    syncDeepLink();
    window.addEventListener('popstate', syncDeepLink);
    return () => window.removeEventListener('popstate', syncDeepLink);
  }, []);

  useEffect(() => {
    if (deepLinkId && tasks.length > 0) {
      setSelected(tasks.find((task) => task.id === deepLinkId) ?? null);
    }
  }, [deepLinkId, tasks]);

  const openTask = (task: Task) => {
    setSelected(task);
    window.history.replaceState(null, '', `/dashboard/tasks?task=${task.id}`);
  };

  const closeTask = () => {
    setSelected(null);
    window.history.replaceState(null, '', '/dashboard/tasks');
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center'>
        <Input
          className='md:max-w-sm'
          placeholder='Buscar tareas...'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className='flex flex-wrap gap-2'>
          <select
            aria-label='Filtrar por estado'
            className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus | '')}
          >
            <option value=''>Todos los estados</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label='Filtrar por prioridad'
            className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority | '')}
          >
            <option value=''>Todas las prioridades</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isPending ? (
        <div className='bg-muted h-48 animate-pulse rounded-xl' />
      ) : isError ? (
        <p className='text-destructive text-sm'>No se pudieron cargar las tareas.</p>
      ) : (
        <div className='overflow-hidden rounded-[26px] border border-border/60 bg-card/45'>
          <div className='flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5'>
            <div>
              <p className='text-sm font-semibold'>Trabajo</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Selecciona una tarea para abrir su contexto.
              </p>
            </div>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {filteredTasks.length} tareas
            </span>
          </div>
          <div>
            {filteredTasks.map((task) => (
              <button
                key={task.id}
                type='button'
                className='hover:bg-muted/40 flex w-full items-center gap-3 border-b p-4 text-left last:border-0'
                onClick={() => openTask(task)}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : task.status === 'waiting' ? 'bg-amber-500' : 'bg-muted-foreground/40'}`}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-medium'>{task.title}</span>
                  <span className='text-muted-foreground mt-1 block text-xs'>
                    {task.customer?.name ?? 'Sin cliente'}
                    {task.dueAt ? ` · ${new Date(task.dueAt).toLocaleDateString()}` : ''}
                  </span>
                </span>
                <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                  {priorityLabels[task.priority]}
                </Badge>
                <span className='text-muted-foreground hidden text-xs sm:block'>
                  {statusLabels[task.status]}
                </span>
              </button>
            ))}
            {filteredTasks.length === 0 && (
              <div className='text-muted-foreground p-14 text-center text-sm'>
                No hay tareas con estos filtros.
              </div>
            )}
          </div>
        </div>
      )}
      <TaskInspector
        task={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && closeTask()}
        onTaskUpdated={(task) => setSelected(task)}
        queryClient={queryClient}
      />
    </div>
  );
}

function TaskInspector({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  queryClient
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: Task) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [title, setTitle] = useState('');

  useEffect(() => setTitle(task?.title ?? ''), [task]);

  if (!task) return null;

  const save = async (patch: Parameters<typeof updateTask>[1]) => {
    try {
      const updated = await updateTask(task.id, patch);
      onTaskUpdated(updated);
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Tarea actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la tarea.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-0 overflow-y-auto p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-b border-border/60 p-5 pb-4'>
          <div className='flex items-start gap-3'>
            <button
              type='button'
              aria-label={task.status === 'done' ? 'Reabrir tarea' : 'Completar tarea'}
              onClick={() => void save({ status: task.status === 'done' ? 'todo' : 'done' })}
              className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border ${task.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
            >
              {task.status === 'done' && <Icons.check className='size-3.5' />}
            </button>
            <div className='min-w-0 flex-1'>
              <SheetTitle className='sr-only'>Inspector de tarea</SheetTitle>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim() && title.trim() !== task.title)
                    void save({ title: title.trim() });
                }}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
                aria-label='Título de la tarea'
                className='h-9 border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-border focus-visible:bg-muted/30 focus-visible:px-2'
              />
              <SheetDescription className='mt-1'>Contexto de ejecución</SheetDescription>
            </div>
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            {(Object.keys(statusLabels) as TaskStatus[]).map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => void save({ status: value })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${task.status === value ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}
              >
                {statusLabels[value]}
              </button>
            ))}
          </div>
        </SheetHeader>
        <div className='space-y-6 p-5'>
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold'>Contexto</h3>
            <div className='grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60'>
              <Detail label='Prioridad' value={priorityLabels[task.priority]} />
              <Detail
                label='Fecha'
                value={task.dueAt ? new Date(task.dueAt).toLocaleDateString('es-ES') : 'Sin fecha'}
              />
              <Detail label='Cliente' value={task.customer?.name ?? 'Trabajo interno'} />
              <Detail label='Responsable' value={task.assignee?.name ?? 'Sin asignar'} />
            </div>
            {task.customer && (
              <Link
                href={`/dashboard/customers/${task.customer.id}`}
                className='flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-3 text-sm hover:bg-muted/40'
              >
                <Icons.user className='text-primary size-4' />
                <span className='min-w-0 flex-1 truncate'>{task.customer.name}</span>
                <Icons.chevronRight className='text-muted-foreground size-4' />
              </Link>
            )}
            {task.event && (
              <a
                href={`/dashboard/calendar?event=${task.event.id}`}
                className='flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-3 text-sm hover:bg-muted/40'
              >
                <Icons.calendar className='text-primary size-4' />
                <span className='min-w-0 flex-1 truncate'>{task.event.title}</span>
                <Icons.chevronRight className='text-muted-foreground size-4' />
              </a>
            )}
          </section>
          <Separator />
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold'>Siguiente decisión</h3>
            <div className='flex flex-wrap gap-2'>
              {(Object.keys(priorityLabels) as TaskPriority[]).map((value) => (
                <Button
                  key={value}
                  variant={task.priority === value ? 'secondary' : 'outline'}
                  size='sm'
                  onClick={() => void save({ priority: value })}
                >
                  {priorityLabels[value]}
                </Button>
              ))}
            </div>
          </section>
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Descripción</h3>
            <p className='text-muted-foreground text-sm leading-6'>
              {task.description || 'Sin descripción todavía.'}
            </p>
          </section>
          <div className='bg-muted/30 rounded-2xl p-4 text-sm'>
            <p className='font-medium'>La tarea vive dentro de tu flujo</p>
            <p className='text-muted-foreground mt-1 leading-5'>
              Puedes abrir el cliente o el evento relacionado sin perder esta selección.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-background p-3'>
      <p className='text-muted-foreground text-[11px]'>{label}</p>
      <p className='mt-1 truncate text-sm font-medium'>{value}</p>
    </div>
  );
}

export function TasksHeaderAction({ initialOpen = false }: { initialOpen?: boolean }) {
  return <NewTaskDialog initialOpen={initialOpen} />;
}
