'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { getTasks, taskKeys, updateTaskStatus, deleteTask } from '@/features/tasks/queries';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';

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

function priorityLabel(priority: Task['priority']) {
  return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
}

function statusLabel(status: Task['status']) {
  return status === 'todo'
    ? 'Todo'
    : status === 'in_progress'
      ? 'En curso'
      : status === 'waiting'
        ? 'Esperando'
        : 'Hecho';
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks()
  });
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>(() => toColumns(tasks));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const originalStatusRef = useRef<Record<string, TaskStatus>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );
  const { setNodeRef: setTrashNodeRef, isOver: isTrashOver } = useDroppable({
    id: 'kanban-trash',
    data: { type: 'trash' }
  });

  useEffect(() => {
    setColumns(toColumns(tasks));
  }, [tasks]);

  const effectiveColumns = columns;

  const handleValueChange = useCallback((nextColumns: Record<string, Task[]>) => {
    setColumns(nextColumns as Record<TaskStatus, Task[]>);
  }, []);

  const handleDragStart = useCallback(
    (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragStart']>>[0]) => {
      const flat = Object.values(effectiveColumns).flat();
      const task = flat.find((item) => item.id === event.active.id);
      if (!task) return;
      originalStatusRef.current[task.id] = task.status;
      setDraggingTask(task);
    },
    [effectiveColumns]
  );

  const handleDragCancel = useCallback(() => {
    setDraggingTask(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragEnd']>>[0]) => {
      const taskId = String(event.active.id);
      const wasTrash = String(event.over?.id ?? '') === 'kanban-trash';
      setDraggingTask(null);

      if (wasTrash) {
        event.activatorEvent.preventDefault();
        const previousTasks = tasks;
        const task = previousTasks.find((item) => item.id === taskId);
        if (!task) return;
        setColumns((current) => {
          const next = { ...current };
          for (const status of COLUMN_ORDER)
            next[status] = current[status].filter((item) => item.id !== taskId);
          return next;
        });
        try {
          await deleteTask(taskId);
          await queryClient.invalidateQueries({ queryKey: taskKeys.all });
          toast.success('Tarea eliminada');
        } catch {
          setColumns(toColumns(previousTasks));
          toast.error('No se pudo eliminar la tarea.');
        }
        return;
      }

      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      const nextStatus = COLUMN_ORDER.find((status) =>
        columns[status].some((item) => item.id === taskId)
      );
      const previousStatus = originalStatusRef.current[taskId];
      delete originalStatusRef.current[taskId];

      if (!nextStatus || nextStatus === previousStatus) return;

      try {
        await updateTaskStatus(taskId, nextStatus);
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      } catch {
        setColumns(toColumns(tasks));
        toast.error('No se pudo actualizar el estado de la tarea.');
      }
    },
    [columns, queryClient, tasks]
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
        value={effectiveColumns}
        onValueChange={handleValueChange}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll
        orientation='vertical'
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className='relative'>
          <div className='w-full overflow-visible pb-4'>
            <KanbanBoardPrimitive className='grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-4 md:gap-3 lg:gap-4'>
              {Object.entries(effectiveColumns).map(([columnValue, columnTasks]) => (
                <TaskColumn
                  key={columnValue}
                  value={columnValue}
                  tasks={columnTasks}
                  onOpenTask={setSelectedTask}
                />
              ))}
            </KanbanBoardPrimitive>
          </div>

          {draggingTask && (
            <div
              ref={setTrashNodeRef}
              className={[
                'fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex min-h-16 items-center gap-3 rounded-2xl border px-4 shadow-2xl backdrop-blur-2xl transition-all md:inset-x-1/2 md:bottom-8 md:w-[320px] md:-translate-x-1/2',
                isTrashOver
                  ? 'scale-[1.03] border-destructive bg-destructive/15 text-destructive'
                  : 'border-border/70 bg-background/95 text-muted-foreground'
              ].join(' ')}
              aria-label='Soltar para eliminar la tarea'
            >
              <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10'>
                <Icons.trash className='size-5' />
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-semibold'>
                  {isTrashOver ? 'Suelta para eliminar' : 'Arrastra aquí para eliminar'}
                </p>
                <p className='text-xs opacity-75'>{draggingTask.title}</p>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='ml-auto rounded-xl'
                onClick={handleDragCancel}
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
              return (
                <TaskColumn
                  value={columnValue}
                  tasks={effectiveColumns[columnValue] ?? []}
                  onOpenTask={setSelectedTask}
                />
              );
            }
            const task = Object.values(effectiveColumns)
              .flat()
              .find((item) => item.id === value);
            return task ? <TaskCard task={task} /> : null;
          }}
        </KanbanOverlay>
      </Kanban>

      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => !open && setSelectedTask(null)}>
        {selectedTask && (
          <DialogContent className='w-[calc(100%-1rem)] max-w-xl rounded-3xl sm:w-full'>
            <DialogHeader>
              <div className='flex items-start justify-between gap-4 pr-6'>
                <div className='min-w-0'>
                  <DialogTitle className='text-xl leading-6'>{selectedTask.title}</DialogTitle>
                  <DialogDescription className='mt-1'>Información de la tarea.</DialogDescription>
                </div>
                <span className='shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary'>
                  {statusLabel(selectedTask.status)}
                </span>
              </div>
            </DialogHeader>

            <div className='grid gap-3 overflow-y-auto py-1'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-2xl border bg-muted/30 p-3'>
                  <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                    Prioridad
                  </p>
                  <p className='mt-1 text-sm font-medium'>{priorityLabel(selectedTask.priority)}</p>
                </div>
                <div className='rounded-2xl border bg-muted/30 p-3'>
                  <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                    Vencimiento
                  </p>
                  <p className='mt-1 text-sm font-medium'>
                    {selectedTask.dueAt
                      ? new Date(selectedTask.dueAt).toLocaleString('es-ES')
                      : 'Sin fecha'}
                  </p>
                </div>
              </div>

              {selectedTask.description && (
                <div className='rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                    Descripción
                  </p>
                  <p className='mt-2 whitespace-pre-wrap text-sm leading-6'>
                    {selectedTask.description}
                  </p>
                </div>
              )}

              <div className='grid gap-3 sm:grid-cols-2'>
                {selectedTask.customer && (
                  <div className='flex min-w-0 items-center gap-3 rounded-2xl border p-3'>
                    <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl'>
                      <Icons.user className='size-4' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                        Cliente
                      </p>
                      <p className='truncate text-sm font-medium'>{selectedTask.customer.name}</p>
                    </div>
                  </div>
                )}
                {selectedTask.assignee && (
                  <div className='flex min-w-0 items-center gap-3 rounded-2xl border p-3'>
                    <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl'>
                      <Icons.profile className='size-4' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider'>
                        Responsable
                      </p>
                      <p className='truncate text-sm font-medium'>{selectedTask.assignee.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
