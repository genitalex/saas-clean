'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/features/tasks/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onOpenTask?: (task: Task) => void;
  suppressClickRef?: React.MutableRefObject<boolean>;
  presentationOnly?: boolean;
}

function TaskCardContent({ task }: { task: Task }) {
  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <div className='flex min-w-0 items-start justify-between gap-2'>
        <span className='min-w-0 flex-1 line-clamp-2 text-sm font-medium'>{task.title}</span>
        <Badge
          variant={
            task.priority === 'high'
              ? 'destructive'
              : task.priority === 'medium'
                ? 'default'
                : 'secondary'
          }
          className='pointer-events-none shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] capitalize'
        >
          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
        </Badge>
      </div>
      <div className='text-muted-foreground flex min-w-0 items-center justify-between gap-2 text-xs'>
        <div className='flex min-w-0 items-center gap-1.5'>
          {task.customer && <span className='truncate'>{task.customer.name}</span>}
          {task.assignee && <span className='truncate'>{task.assignee.name}</span>}
        </div>
        {task.dueAt && (
          <time
            className={cn(
              'shrink-0 text-[10px] tabular-nums',
              new Date(task.dueAt) < new Date() && task.status !== 'done' && 'text-destructive'
            )}
          >
            {new Date(task.dueAt).toLocaleDateString('es-ES')}
          </time>
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  onOpenTask,
  suppressClickRef,
  presentationOnly = false
}: TaskCardProps) {
  if (presentationOnly) {
    return (
      <div className='bg-card w-full rounded-lg border border-border/70 p-3 shadow-xl'>
        <TaskCardContent task={task} />
      </div>
    );
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', taskId: task.id, status: task.status }
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!suppressClickRef?.current) onOpenTask?.(task);
      }}
      className={cn(
        'bg-card w-full cursor-grab touch-none rounded-lg border border-border/70 p-3 text-left shadow-none transition-shadow hover:bg-muted/30 hover:shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-0'
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      <TaskCardContent task={task} />
    </div>
  );
}
