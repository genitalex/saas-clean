'use client';

import { Badge } from '@/components/ui/badge';
import { KanbanItem } from '@/components/ui/kanban';
import type { Task } from '@/features/tasks/types';

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: Task;
}

export function TaskCard({ task, ...props }: TaskCardProps) {
  return (
    <KanbanItem
      key={task.id}
      value={task.id}
      {...props}
      render={
        <div className='bg-card rounded-lg border border-border/70 p-3 shadow-none transition-colors hover:bg-muted/30' />
      }
    >
      <div className='flex flex-col gap-2'>
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
            className='pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize'
          >
            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
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
      </div>
    </KanbanItem>
  );
}
