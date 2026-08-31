'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { KanbanItem } from '@/components/ui/kanban';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { Task } from '@/features/tasks/types';

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: Task;
}

function priorityLabel(priority: Task['priority']) {
  return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
}

function statusLabel(status: Task['status']) {
  return status === 'todo'
    ? 'Todo'
    : status === 'in_progress'
      ? 'En curso'
      : status === 'waiting'
        ? 'Esperando'
        : 'Hecho';
}

export function TaskCard({ task, ...props }: TaskCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <KanbanItem
        key={task.id}
        value={task.id}
        {...props}
        render={
          <div className='bg-card rounded-lg border border-border/70 p-3 shadow-none transition-all hover:bg-muted/30 hover:shadow-sm' />
        }
      >
        <button
          type='button'
          className='flex w-full flex-col gap-2 text-left outline-none'
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          aria-label={`Ver detalles de ${task.title}`}
        >
          <div className='flex items-center justify-between gap-2'>
            <span className='line-clamp-2 text-sm font-medium'>{task.title}</span>
            <Badge
              variant={
                task.priority === 'high'
                  ? 'destructive'
                  : task.priority === 'medium'
                    ? 'default'
                    : 'secondary'
              }
              className='pointer-events-none h-5 shrink-0 rounded-sm px-1.5 text-[11px] capitalize'
            >
              {priorityLabel(task.priority)}
            </Badge>
          </div>
          <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs'>
            <div className='flex min-w-0 items-center gap-1'>
              {task.customer && <span className='truncate'>{task.customer.name}</span>}
              {task.assignee && <span className='truncate'>{task.assignee.name}</span>}
            </div>
            {task.dueAt && (
              <time
                className={
                  new Date(task.dueAt) < new Date() && task.status !== 'done'
                    ? 'text-destructive text-[10px] tabular-nums'
                    : 'text-[10px] tabular-nums'
                }
              >
                {new Date(task.dueAt).toLocaleDateString()}
              </time>
            )}
          </div>
        </button>
      </KanbanItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='w-[calc(100%-1rem)] max-w-xl rounded-3xl'>
          <DialogHeader>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <DialogTitle className='text-xl'>{task.title}</DialogTitle>
                <DialogDescription className='mt-1'>Detalles de la tarea.</DialogDescription>
              </div>
              <Badge
                variant={
                  task.priority === 'high'
                    ? 'destructive'
                    : task.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                }
              >
                {priorityLabel(task.priority)}
              </Badge>
            </div>
          </DialogHeader>

          <div className='grid gap-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-2xl border bg-muted/30 p-3'>
                <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                  Estado
                </div>
                <div className='mt-1 text-sm font-medium'>{statusLabel(task.status)}</div>
              </div>
              <div className='rounded-2xl border bg-muted/30 p-3'>
                <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                  Vencimiento
                </div>
                <div className='mt-1 text-sm font-medium'>
                  {task.dueAt ? new Date(task.dueAt).toLocaleString('es-ES') : 'Sin fecha'}
                </div>
              </div>
            </div>

            {task.description && (
              <div className='rounded-2xl border p-4'>
                <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                  Descripción
                </div>
                <p className='mt-2 whitespace-pre-wrap text-sm leading-6'>{task.description}</p>
              </div>
            )}

            <div className='grid gap-3 sm:grid-cols-2'>
              {task.customer && (
                <div className='flex items-center gap-3 rounded-2xl border p-3'>
                  <span className='bg-muted flex size-9 items-center justify-center rounded-xl'>
                    <Icons.user className='size-4' />
                  </span>
                  <div className='min-w-0'>
                    <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                      Cliente
                    </div>
                    <div className='truncate text-sm font-medium'>{task.customer.name}</div>
                  </div>
                </div>
              )}
              {task.assignee && (
                <div className='flex items-center gap-3 rounded-2xl border p-3'>
                  <span className='bg-muted flex size-9 items-center justify-center rounded-xl'>
                    <Icons.profile className='size-4' />
                  </span>
                  <div className='min-w-0'>
                    <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                      Responsable
                    </div>
                    <div className='truncate text-sm font-medium'>{task.assignee.name}</div>
                  </div>
                </div>
              )}
            </div>

            <Button type='button' variant='outline' className='mt-1' onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
