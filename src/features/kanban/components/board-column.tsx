'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { TaskCard } from './task-card';

const COLUMN_TITLES: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'En curso',
  waiting: 'Esperando',
  done: 'Hecho'
};

interface TaskColumnProps {
  value: TaskStatus;
  tasks: Task[];
  onOpenTask?: (task: Task) => void;
  suppressClickRef?: React.MutableRefObject<boolean>;
}

export function TaskColumn({ value, tasks, onOpenTask, suppressClickRef }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: value,
    data: { type: 'column', status: value }
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'min-w-0 rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors',
        isOver && 'border-primary/40 bg-primary/[0.035]'
      )}
    >
      <div className='mb-3 flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold'>{COLUMN_TITLES[value]}</span>
          <Badge variant='secondary' className='rounded-sm'>
            {tasks.length}
          </Badge>
        </div>
        <span className='text-muted-foreground text-[11px]'>Arrastra aquí</span>
      </div>

      <div className='min-h-24 space-y-2'>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              suppressClickRef={suppressClickRef}
            />
          ))
        ) : (
          <div className='text-muted-foreground flex min-h-20 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs'>
            Sin tareas
          </div>
        )}
      </div>
    </section>
  );
}
