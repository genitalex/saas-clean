'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { Button } from '@/components/ui/button';
import { getTasks, taskKeys, updateTaskStatus } from '@/features/tasks/queries';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';
import { toast } from 'sonner';

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];
const COLUMN_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'En curso',
  waiting: 'Esperando',
  done: 'Hecho'
};

function toColumns(tasks: Task[]): Record<TaskStatus, Task[]> {
  return COLUMN_ORDER.reduce(
    (columns, status) => {
      columns[status] = tasks.filter((task) => task.status === status);
      return columns;
    },
    {} as Record<TaskStatus, Task[]>
  );
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks()
  });
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>('todo');
  const containerRef = useRef<HTMLDivElement>(null);
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );
  const columns = toColumns(tasks);

  const handleValueChange = async (nextColumns: Record<string, Task[]>) => {
    const previousTasks = tasks;
    const nextTasks = Object.values(nextColumns).flat();
    const movedTask = nextTasks.find(
      (task) => previousTasks.find((item) => item.id === task.id)?.status !== task.status
    );
    if (!movedTask) return;
    const nextStatus = (Object.entries(nextColumns).find(([, items]) =>
      items.some((task) => task.id === movedTask.id)
    )?.[0] ?? movedTask.status) as TaskStatus;
    queryClient.setQueryData<Task[]>(
      taskKeys.list(),
      previousTasks.map((task) =>
        task.id === movedTask.id ? { ...task, status: nextStatus } : task
      )
    );
    try {
      await updateTaskStatus(movedTask.id, nextStatus);
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    } catch {
      queryClient.setQueryData(taskKeys.list(), previousTasks);
      toast.error('No se pudo actualizar el estado de la tarea.');
    }
  };

  if (isLoading)
    return (
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {COLUMN_ORDER.map((column) => (
          <div key={column} className='h-48 rounded-xl border bg-muted/20' />
        ))}
      </div>
    );

  return (
    <div ref={containerRef} className='min-w-0'>
      <div
        className='mb-4 flex min-h-12 gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1 md:hidden'
        role='tablist'
        aria-label='Columnas del tablero'
      >
        {COLUMN_ORDER.map((status) => (
          <Button
            key={status}
            type='button'
            size='sm'
            variant={mobileColumn === status ? 'secondary' : 'ghost'}
            className='min-h-10 shrink-0 flex-1 px-3'
            role='tab'
            aria-selected={mobileColumn === status}
            tabIndex={0}
            onClick={() => setMobileColumn(status)}
          >
            {COLUMN_LABELS[status]}{' '}
            <span className='text-muted-foreground ml-1 text-xs'>{columns[status].length}</span>
          </Button>
        ))}
      </div>
      <Kanban
        value={columns}
        onValueChange={(value) => void handleValueChange(value)}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll={false}
      >
        <div className='hidden w-full overflow-x-auto pb-4 md:block'>
          <KanbanBoardPrimitive className='grid min-w-[860px] grid-cols-4 items-start gap-3 lg:gap-4'>
            {Object.entries(columns).map(([columnValue, columnTasks]) => (
              <TaskColumn key={columnValue} value={columnValue} tasks={columnTasks} />
            ))}
          </KanbanBoardPrimitive>
        </div>
        <div className='md:hidden'>
          <KanbanBoardPrimitive className='grid grid-cols-1 items-start'>
            <TaskColumn value={mobileColumn} tasks={columns[mobileColumn]} />
          </KanbanBoardPrimitive>
        </div>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const columnValue = String(value) as TaskStatus;
              return <TaskColumn value={columnValue} tasks={columns[columnValue] ?? []} />;
            }
            const task = Object.values(columns)
              .flat()
              .find((item) => item.id === value);
            return task ? <TaskCard task={task} /> : null;
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
