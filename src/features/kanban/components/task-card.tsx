'use client';

import { Badge } from '@/components/ui/badge';
import { KanbanItem } from '@/components/ui/kanban';
import type { Task } from '@/features/tasks/types';

interface TaskCardProps extends Omit<
  React.ComponentProps<typeof KanbanItem>,
  'value' | 'children'
> {
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
        <button
          type='button'
          className='bg-card flex w-full cursor-grab flex-col gap-2 rounded-lg border border-border/70 p-3 text-left shadow-none outline-none transition-all hover:bg-muted/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.(task);
          }}
          aria-label={`Ver detalles de ${task.title}`}
        />
      }
    >
      <div className='flex items-start justify-between gap-2'>
        <span className='line-clamp-2 min-w-0 text-sm font-medium'>{task.title}</span>
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
      <div className='text-muted-foreground flex min-w-0 items-center justify-between gap-2 text-xs'>
        <div className='flex min-w-0 items-center gap-1'>
          {task.customer && <span className='truncate'>{task.customer.name}</span>}
          {task.assignee && <span className='truncate'>{task.assignee.name}</span>}
        </div>
        {task.dueAt && (
          <time
            className={
              new Date(task.dueAt) < new Date() && task.status !== 'done'
                ? 'text-destructive shrink-0 text-[10px] tabular-nums'
                : 'shrink-0 text-[10px] tabular-nums'
            }
          >
            {new Date(task.dueAt).toLocaleDateString()}
          </time>
        )}
      </div>
    </KanbanItem>
  );
}
