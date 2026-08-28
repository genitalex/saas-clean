'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getTasks, taskKeys } from '../queries';
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [selected, setSelected] = useState<Task | null>(null);
  const {
    data: tasks = [],
    isPending,
    isError
  } = useQuery({
    queryKey: taskKeys.list({ search, status: status || undefined }),
    queryFn: () => getTasks({ search, status: status || undefined })
  });
  const filteredTasks = priority ? tasks.filter((task) => task.priority === priority) : tasks;

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
        <Card>
          <CardContent className='p-0'>
            {filteredTasks.map((task) => (
              <button
                key={task.id}
                type='button'
                className='hover:bg-muted/40 flex w-full items-center gap-3 border-b p-4 text-left last:border-0'
                onClick={() => setSelected(task)}
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
              <div className='text-muted-foreground p-10 text-center text-sm'>
                No hay tareas con estos filtros.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{selected.description || 'Sin descripción'}</DialogDescription>
              </DialogHeader>
              <div className='grid gap-3 text-sm sm:grid-cols-2'>
                <Detail label='Estado' value={statusLabels[selected.status]} />
                <Detail label='Prioridad' value={priorityLabels[selected.priority]} />
                <Detail label='Cliente' value={selected.customer?.name ?? 'Sin cliente'} />
                <Detail label='Responsable' value={selected.assignee?.name ?? 'Sin responsable'} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 font-medium'>{value}</p>
    </div>
  );
}

export function TasksHeaderAction() {
  return <NewTaskDialog />;
}
