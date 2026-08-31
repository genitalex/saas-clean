'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KanbanColumn, KanbanColumnHandle } from '@/components/ui/kanban';
import type { Task } from '@/features/tasks/types';
import { TaskCard } from './task-card';

const COLUMN_TITLES: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'En curso',
  waiting: 'Esperando',
  done: 'Hecho'
};

interface TaskColumnProps extends Omit<React.ComponentProps<typeof KanbanColumn>, 'children'> {
  tasks: Task[];
  onOpenTask?: (task: Task) => void;
}

export function TaskColumn({ value, tasks, onOpenTask, ...props }: TaskColumnProps) {
  return (
    <KanbanColumn
      value={value}
      className='w-full min-w-0 shrink-0 rounded-2xl border border-border/70 bg-muted/20 p-3 md:min-h-48'
      {...props}
    >
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-sm font-semibold'>{COLUMN_TITLES[value] ?? value}</span>
          <Badge variant='secondary' className='pointer-events-none shrink-0 rounded-sm'>
            {tasks.length}
          </Badge>
        </div>
        <KanbanColumnHandle render={<Button variant='ghost' size='icon' />}>
          <Icons.gripVertical className='h-4 w-4' />
        </KanbanColumnHandle>
      </div>
      <div className='flex min-h-24 flex-col gap-2.5 p-0.5'>
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} asHandle onOpen={onOpenTask} />)
        ) : (
          <div className='text-muted-foreground rounded-xl border border-dashed p-5 text-center text-xs'>
            Arrastra aquí una tarea
          </div>
        )}
      </div>
    </KanbanColumn>
  );
}
