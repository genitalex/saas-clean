'use client';

import { Badge } from '@/components/ui/badge';
import { KanbanItem } from '@/components/ui/kanban';
import { Icons } from '@/components/icons';
import type { Task } from '@/features/tasks/types';

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: Task;
  onOpen?: (task: Task) => void;
}

function priorityLabel(priority: Task['priority']) {
  return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
}

export function TaskCard({ task, onOpen, ...props }: TaskCardProps) {
  return (
    <KanbanItem
      key={task.id}
      value={task.id}
      {...props}
      render={
        <div className='bg-card rounded-xl border border-border/70 p-3.5 shadow-none transition-all hover:bg-muted/30 hover:shadow-sm' />
      }
    >
      <button
        type='button'
        className='flex w-full min-w-0 flex-col gap-2.5 text-left outline-none'
        onClick={(event) => {
          event.stopPropagation();
          onOpen?.(task);
        }}
        aria-label={`Ver detalles de ${task.title}`}
      >
        <div className='flex min-w-0 items-start justify-between gap-2'>
          <span className='min-w-0 line-clamp-2 text-sm font-medium leading-5'>{task.title}</span>
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
        <div className='text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
          {task.customer && (
            <span className='inline-flex min-w-0 items-center gap-1'>
              <Icons.user className='size-3.5 shrink-0' />
              <span className='truncate'>{task.customer.name}</span>
            </span>
          )}
          {task.assignee && (
            <span className='inline-flex min-w-0 items-center gap-1'>
              <Icons.profile className='size-3.5 shrink-0' />
              <span className='truncate'>{task.assignee.name}</span>
            </span>
          )}
          {task.dueAt && (
            <time
              className={
                new Date(task.dueAt) < new Date() && task.status !== 'done'
                  ? 'text-destructive ml-auto text-[10px] tabular-nums'
                  : 'ml-auto text-[10px] tabular-nums'
              }
            >
              {new Date(task.dueAt).toLocaleDateString('es-ES')}
            </time>
          )}
        </div>
      </button>
    </KanbanItem>
  );
}
