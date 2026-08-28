'use client';

import { useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { getTasks, taskKeys, updateTaskStatus } from '@/features/tasks/queries';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';
import { toast } from 'sonner';

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];

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
  const { data: tasks = [] } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks()
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory function, stable after mount
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );

  const columns = toColumns(tasks);

  const handleValueChange = async (nextColumns: Record<string, Task[]>) => {
    const previousTasks = tasks;
    const nextTasks = Object.values(nextColumns).flat();
    const movedTask = nextTasks.find((task) => {
      const previousTask = previousTasks.find((item) => item.id === task.id);
      return previousTask && previousTask.status !== task.status;
    });
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

  return (
    <div ref={containerRef} className='min-w-0'>
      <Kanban
        value={columns}
        onValueChange={(value) => void handleValueChange(value)}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll={false}
      >
        <div className='w-full overflow-x-auto rounded-md pb-4'>
          <KanbanBoardPrimitive className='flex flex-col items-start gap-4 md:flex-row'>
            {Object.entries(columns).map(([columnValue, tasks]) => (
              <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
            ))}
          </KanbanBoardPrimitive>
        </div>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const columnValue = String(value) as TaskStatus;
              const tasks = columns[columnValue] ?? [];
              return <TaskColumn value={columnValue} tasks={tasks} />;
            }

            const task = Object.values(columns)
              .flat()
              .find((task) => task.id === value);

            if (!task) return null;
            return <TaskCard task={task} />;
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
