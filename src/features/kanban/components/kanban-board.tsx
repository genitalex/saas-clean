'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDroppable } from '@dnd-kit/core';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getTasks, taskKeys, updateTaskStatus, deleteTask } from '@/features/tasks/queries';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );
  const columns = toColumns(tasks);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const { setNodeRef: setTrashNodeRef, isOver: isTrashOver } = useDroppable({
    id: 'kanban-trash',
    data: { type: 'trash' }
  });

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

  const handleDragStart = useCallback(
    (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragStart']>>[0]) => {
      const task = tasks.find((item) => item.id === event.active.id);
      setDraggingTask(task ?? null);
    },
    [tasks]
  );

  const handleDragCancel = useCallback(() => setDraggingTask(null), []);

  const handleDragEnd = useCallback(
    async (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragEnd']>>[0]) => {
      setDraggingTask(null);
      if (String(event.over?.id ?? '') !== 'kanban-trash' || !event.active.id) return;

      const taskId = String(event.active.id);
      const previousTasks = tasks;
      queryClient.setQueryData<Task[]>(
        taskKeys.list(),
        previousTasks.filter((task) => task.id !== taskId)
      );
      try {
        await deleteTask(taskId);
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
        toast.success('Tarea eliminada');
      } catch {
        queryClient.setQueryData(taskKeys.list(), previousTasks);
        toast.error('No se pudo eliminar la tarea.');
      }
    },
    [queryClient, tasks]
  );

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
      <Kanban
        value={columns}
        onValueChange={(value) => void handleValueChange(value)}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className='relative'>
          <div className='w-full overflow-x-auto pb-4'>
            <KanbanBoardPrimitive className='grid min-w-[860px] grid-cols-4 items-start gap-3 lg:gap-4 md:min-w-[860px] md:grid-cols-4'>
              {Object.entries(columns).map(([columnValue, columnTasks]) => (
                <TaskColumn key={columnValue} value={columnValue} tasks={columnTasks} />
              ))}
            </KanbanBoardPrimitive>
          </div>

          <div className='md:hidden'>
            <KanbanBoardPrimitive className='grid min-w-0 grid-cols-1 items-start gap-4'>
              {Object.entries(columns).map(([columnValue, columnTasks]) => (
                <TaskColumn key={columnValue} value={columnValue} tasks={columnTasks} />
              ))}
            </KanbanBoardPrimitive>
          </div>

          {draggingTask && (
            <div
              ref={setTrashNodeRef}
              className={`fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex min-h-16 items-center justify-center gap-2 rounded-2xl border px-5 shadow-2xl backdrop-blur-xl transition-all md:inset-x-1/2 md:bottom-10 md:w-[300px] md:-translate-x-1/2 ${
                isTrashOver
                  ? 'border-destructive bg-destructive/15 text-destructive scale-[1.03]'
                  : 'border-border/70 bg-background/95 text-muted-foreground'
              }`}
              aria-label='Soltar para eliminar la tarea'
            >
              <Icons.trash className='size-5' />
              <span className='text-sm font-semibold'>
                {isTrashOver ? 'Suelta para eliminar' : 'Arrastra aquí para eliminar'}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='ml-auto rounded-xl'
                onClick={() => setDraggingTask(null)}
                aria-label='Cancelar arrastre'
              >
                <Icons.x className='size-4' />
              </Button>
            </div>
          )}
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
