'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

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

function statusLabel(status: TaskStatus) {
  return status === 'todo'
    ? 'Todo'
    : status === 'in_progress'
      ? 'En curso'
      : status === 'waiting'
        ? 'Esperando'
        : 'Hecho';
}

function TaskDetailsDialog({
  task,
  open,
  onOpenChange
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[calc(100%-1rem)] max-w-xl rounded-3xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>{task.title}</DialogTitle>
          <DialogDescription>Detalles de la tarea.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-3'>
          <div className='grid gap-3 sm:grid-cols-2'>
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
              <div className='rounded-2xl border p-3'>
                <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                  Cliente
                </div>
                <div className='mt-1 truncate text-sm font-medium'>{task.customer.name}</div>
              </div>
            )}
            {task.assignee && (
              <div className='rounded-2xl border p-3'>
                <div className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                  Responsable
                </div>
                <div className='mt-1 truncate text-sm font-medium'>{task.assignee.name}</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks()
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );
  const columns = useMemo(() => toColumns(tasks), [tasks]);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
        orientation={isMobile ? 'vertical' : 'horizontal'}
      >
        <div className='relative w-full overflow-visible'>
          <KanbanBoardPrimitive
            className={
              isMobile
                ? 'grid w-full min-w-0 grid-cols-1 items-start gap-4'
                : 'grid min-w-[860px] grid-cols-4 items-start gap-3 lg:gap-4'
            }
          >
            {Object.entries(columns).map(([columnValue, columnTasks]) => (
              <TaskColumn
                key={columnValue}
                value={columnValue}
                tasks={columnTasks}
                onOpenTask={setSelectedTask}
              />
            ))}
          </KanbanBoardPrimitive>

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
                <Icons.close className='size-4' />
              </Button>
            </div>
          )}
        </div>

        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const columnValue = String(value) as TaskStatus;
              return (
                <TaskColumn
                  value={columnValue}
                  tasks={columns[columnValue] ?? []}
                  onOpenTask={setSelectedTask}
                />
              );
            }
            const task = Object.values(columns)
              .flat()
              .find((item) => item.id === value);
            return task ? <TaskCard task={task} onOpen={setSelectedTask} /> : null;
          }}
        </KanbanOverlay>
      </Kanban>

      <TaskDetailsDialog
        task={selectedTask}
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}
