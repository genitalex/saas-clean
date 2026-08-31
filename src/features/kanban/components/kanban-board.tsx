'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDroppable } from '@dnd-kit/core';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { deleteTask, getTasks, taskKeys, updateTaskStatus } from '@/features/tasks/queries';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { cn } from '@/lib/utils';

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];
const KANBAN_TRASH_ID = 'kanban-trash';
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
  const {
    data: tasks = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    retry: 4,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 3000),
    refetchOnWindowFocus: false,
    refetchOnMount: 'always'
  });

  const initialColumns = useMemo(() => toColumns(tasks), [tasks]);
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>(initialColumns);
  const columnsRef = useRef(columns);
  const tasksRef = useRef(tasks);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const draggingTaskRef = useRef<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isTrashOver, setIsTrashOver] = useState(false);
  const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);
  const { setNodeRef: setTrashNodeRef } = useDroppable({
    id: KANBAN_TRASH_ID,
    data: { type: 'trash' }
  });

  useEffect(() => {
    tasksRef.current = tasks;
    setColumns((current) => {
      const currentIds = Object.values(current)
        .flat()
        .map((task) => task.id)
        .sort()
        .join(',');
      const nextIds = tasks
        .map((task) => task.id)
        .sort()
        .join(',');
      if (currentIds !== nextIds) {
        const next = toColumns(tasks);
        columnsRef.current = next;
        return next;
      }
      return current;
    });
  }, [tasks]);

  const handleValueChange = useCallback((nextColumns: Record<string, Task[]>) => {
    if (nextColumns[KANBAN_TRASH_ID]?.length) return;
    const normalized = {
      todo: nextColumns.todo ?? [],
      in_progress: nextColumns.in_progress ?? [],
      waiting: nextColumns.waiting ?? [],
      done: nextColumns.done ?? []
    } as Record<TaskStatus, Task[]>;
    columnsRef.current = normalized;
    setColumns(normalized);
  }, []);

  const handleDragStart = useCallback(
    (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragStart']>>[0]) => {
      const task = tasksRef.current.find((item) => item.id === String(event.active.id));
      draggingTaskRef.current = task ?? null;
      setDraggingTask(task ?? null);
      setIsTrashOver(false);
      const node = event.active.node.current;
      const width = node?.getBoundingClientRect().width ?? null;
      setDragOverlayWidth(width);
    },
    []
  );

  const handleDragOver = useCallback(
    (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragOver']>>[0]) => {
      setIsTrashOver(String(event.over?.id ?? '') === KANBAN_TRASH_ID);
    },
    []
  );

  const handleDragCancel = useCallback(() => {
    draggingTaskRef.current = null;
    setDraggingTask(null);
    setIsTrashOver(false);
    setDragOverlayWidth(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: Parameters<NonNullable<React.ComponentProps<typeof Kanban>['onDragEnd']>>[0]) => {
      const draggedTask = draggingTaskRef.current;
      draggingTaskRef.current = null;
      setDraggingTask(null);
      setIsTrashOver(false);
      setDragOverlayWidth(null);

      if (!draggedTask) return;

      if (String(event.over?.id ?? '') === 'kanban-trash') {
        setDeleteCandidate(draggedTask);
        return;
      }

      const currentColumns = columnsRef.current;
      const nextStatus = COLUMN_ORDER.find((status) =>
        currentColumns[status].some((task) => task.id === draggedTask.id)
      );
      if (!nextStatus || nextStatus === draggedTask.status) return;

      const previousTasks = tasksRef.current;
      try {
        await updateTaskStatus(draggedTask.id, nextStatus);
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
        toast.success(`Tarea movida a ${COLUMN_LABELS[nextStatus].toLowerCase()}`);
      } catch {
        const restored = toColumns(previousTasks);
        columnsRef.current = restored;
        setColumns(restored);
        toast.error('No se pudo mover la tarea.');
      }
    },
    [queryClient]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    const previousTasks = tasksRef.current;
    const optimistic = Object.fromEntries(
      COLUMN_ORDER.map((status) => [
        status,
        columnsRef.current[status].filter((task) => task.id !== deleteCandidate.id)
      ])
    ) as Record<TaskStatus, Task[]>;
    columnsRef.current = optimistic;
    setColumns(optimistic);

    try {
      await deleteTask(deleteCandidate.id);
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Tarea eliminada');
      setDeleteCandidate(null);
    } catch {
      const restored = toColumns(previousTasks);
      columnsRef.current = restored;
      setColumns(restored);
      toast.error('No se pudo eliminar la tarea.');
    } finally {
      setDeleting(false);
    }
  }, [deleteCandidate, queryClient]);

  if (isError && tasks.length === 0)
    return (
      <div className='rounded-2xl border border-border/60 bg-muted/20 p-6 text-center'>
        <p className='text-sm font-medium'>No se pudo cargar el Kanban.</p>
        <p className='text-muted-foreground mt-1 text-xs'>Reintentando conexión…</p>
      </div>
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
    <div className='min-w-0'>
      <Kanban
        value={columns}
        onValueChange={handleValueChange}
        getItemValue={(item) => item.id}
        autoScroll
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className='hidden w-full overflow-x-auto pb-6 md:block'>
          <KanbanBoardPrimitive className='grid w-full grid-cols-4 items-start gap-4'>
            {COLUMN_ORDER.map((status) => (
              <TaskColumn
                key={status}
                value={status}
                tasks={columns[status]}
                onOpenTask={setSelectedTask}
              />
            ))}
          </KanbanBoardPrimitive>
        </div>

        <div className='grid w-full grid-cols-1 gap-4 md:hidden'>
          <KanbanBoardPrimitive className='grid w-full grid-cols-1 items-start gap-4'>
            {COLUMN_ORDER.map((status) => (
              <TaskColumn
                key={status}
                value={status}
                tasks={columns[status]}
                onOpenTask={setSelectedTask}
              />
            ))}
          </KanbanBoardPrimitive>
        </div>

        <div
          ref={setTrashNodeRef}
          className={cn(
            'fixed bottom-5 left-1/2 z-[90] flex h-16 w-[min(92vw,320px)] -translate-x-1/2 items-center gap-3 rounded-2xl border-2 px-4 shadow-xl backdrop-blur-xl transition-all duration-200',
            draggingTask ? 'opacity-100' : 'pointer-events-none invisible opacity-0',
            isTrashOver
              ? 'scale-[1.03] border-destructive bg-destructive text-destructive-foreground'
              : 'border-destructive/55 bg-destructive/10 text-destructive'
          )}
          aria-label='Papelera: suelta aquí para eliminar'
        >
          <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15'>
            <Icons.trash className='size-5' />
          </span>
          <div className='min-w-0'>
            <div className='text-sm font-semibold'>
              {isTrashOver ? 'Suelta para eliminar' : 'Papelera'}
            </div>
            <div
              className={cn(
                'truncate text-xs',
                isTrashOver ? 'text-destructive-foreground/75' : 'text-destructive/70'
              )}
            >
              {isTrashOver
                ? `Eliminar “${draggingTask?.title ?? ''}”`
                : 'Arrastra la tarea aquí para borrarla'}
            </div>
          </div>
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
            return task ? (
              <TaskCard
                task={task}
                onOpenTask={setSelectedTask}
                presentationOnly
                overlayWidth={dragOverlayWidth ?? undefined}
              />
            ) : null;
          }}
        </KanbanOverlay>
      </Kanban>

      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className='w-[calc(100%-2rem)] max-w-lg rounded-[28px]'>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>Detalles de la tarea</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='rounded-2xl border bg-muted/20 p-4'>
              <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>
                Estado
              </p>
              <p className='mt-1 text-sm font-medium'>
                {selectedTask ? COLUMN_LABELS[selectedTask.status] : ''}
              </p>
            </div>
            {selectedTask?.description && (
              <div className='rounded-2xl border bg-muted/20 p-4'>
                <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>
                  Descripción
                </p>
                <p className='mt-1 whitespace-pre-wrap text-sm leading-6'>
                  {selectedTask.description}
                </p>
              </div>
            )}
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-2xl border bg-muted/20 p-4'>
                <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>
                  Prioridad
                </p>
                <p className='mt-1 text-sm font-medium capitalize'>
                  {selectedTask?.priority === 'high'
                    ? 'Alta'
                    : selectedTask?.priority === 'medium'
                      ? 'Media'
                      : 'Baja'}
                </p>
              </div>
              <div className='rounded-2xl border bg-muted/20 p-4'>
                <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>
                  Fecha límite
                </p>
                <p className='mt-1 text-sm font-medium'>
                  {selectedTask?.dueAt
                    ? new Date(selectedTask.dueAt).toLocaleString('es-ES')
                    : 'Sin fecha'}
                </p>
              </div>
            </div>
            <div className='text-muted-foreground text-xs'>
              {selectedTask?.customer ? `Cliente: ${selectedTask.customer.name}` : 'Sin cliente'}
              {selectedTask?.assignee ? ` · Responsable: ${selectedTask.assignee.name}` : ''}
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='secondary' onClick={() => setSelectedTask(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && !deleting && setDeleteCandidate(null)}
      >
        <DialogContent className='w-[calc(100%-2rem)] max-w-md rounded-[28px]'>
          <DialogHeader>
            <DialogTitle>¿Eliminar tarea?</DialogTitle>
            <DialogDescription>
              Vas a eliminar “{deleteCandidate?.title}”. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-2'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setDeleteCandidate(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? 'Eliminando…' : 'Eliminar tarea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
