'use client';

import * as React from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { deleteTask, getTasks, taskKeys, updateTaskStatus } from '@/features/tasks/queries';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';

const COLUMN_ORDER: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];
const TRASH_ID = 'kanban-trash';
const COLUMN_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'En curso',
  waiting: 'Esperando',
  done: 'Hecho'
};

type Columns = Record<TaskStatus, Task[]>;

function toColumns(tasks: Task[]): Columns {
  return COLUMN_ORDER.reduce((result, status) => {
    result[status] = tasks.filter((task) => task.status === status);
    return result;
  }, {} as Columns);
}

function findTaskColumn(columns: Columns, taskId: string) {
  return COLUMN_ORDER.find((status) => columns[status].some((task) => task.id === taskId)) ?? null;
}

function findTask(columns: Columns, taskId: string) {
  for (const status of COLUMN_ORDER) {
    const task = columns[status].find((item) => item.id === taskId);
    if (task) return task;
  }
  return null;
}

function isTaskId(columns: Columns, id: string) {
  return Boolean(findTask(columns, id));
}

function TrashDropZone({ active, over }: { active: boolean; over: boolean }) {
  const { setNodeRef } = useDroppable({
    id: TRASH_ID,
    data: { type: 'trash' }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'fixed bottom-5 left-1/2 z-[120] flex min-h-16 w-[min(92vw,340px)] -translate-x-1/2 items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-150',
        active ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        over
          ? 'scale-[1.03] border-destructive bg-destructive text-destructive-foreground'
          : 'border-destructive/60 bg-background/95 text-destructive'
      )}
      aria-label='Papelera: suelta aquí para eliminar'
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          over ? 'bg-white/15' : 'bg-destructive/10'
        )}
      >
        <span className='text-base'>⌫</span>
      </span>
      <div className='min-w-0'>
        <p className='text-sm font-semibold'>{over ? 'Suelta para eliminar' : 'Papelera'}</p>
        <p
          className={cn(
            'truncate text-xs',
            over ? 'text-destructive-foreground/75' : 'text-destructive/70'
          )}
        >
          {over ? 'Se pedirá confirmación antes de borrar' : 'Arrastra una tarea aquí'}
        </p>
      </div>
    </div>
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
    refetchOnWindowFocus: false
  });

  const [columns, setColumns] = React.useState<Columns>(() => toColumns(tasks));
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [deleteCandidate, setDeleteCandidate] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const tasksRef = React.useRef(tasks);
  const columnsRef = React.useRef(columns);
  const suppressClickRef = React.useRef(false);

  React.useEffect(() => {
    tasksRef.current = tasks;
    const next = toColumns(tasks);
    columnsRef.current = next;
    setColumns(next);
  }, [tasks]);

  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const task = findTask(columnsRef.current, String(event.active.id));
    setActiveTask(task);
    setOverId(String(event.active.id));
    suppressClickRef.current = false;
  }, []);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const over = event.over;
    setOverId(over ? String(over.id) : null);
    if (!over || String(over.id) === TRASH_ID) return;

    const current = columnsRef.current;
    const activeColumn = findTaskColumn(current, activeId);
    if (!activeColumn) return;

    let overColumn: TaskStatus | null = null;
    const overIdValue = String(over.id);
    if (COLUMN_ORDER.includes(overIdValue as TaskStatus)) {
      overColumn = overIdValue as TaskStatus;
    } else {
      overColumn = findTaskColumn(current, overIdValue);
    }
    if (!overColumn) return;

    if (activeColumn === overColumn) {
      const activeIndex = current[activeColumn].findIndex((task) => task.id === activeId);
      const overIndex = current[overColumn].findIndex((task) => task.id === overIdValue);
      if (activeIndex === -1) return;
      if (overIndex >= 0 && activeIndex !== overIndex) {
        const next = {
          ...current,
          [activeColumn]: arrayMove(current[activeColumn], activeIndex, overIndex)
        };
        columnsRef.current = next;
        setColumns(next);
        suppressClickRef.current = true;
      }
      return;
    }

    const activeIndex = current[activeColumn].findIndex((task) => task.id === activeId);
    if (activeIndex === -1) return;
    const moving = current[activeColumn][activeIndex];
    if (!moving) return;
    const movedTask = { ...moving, status: overColumn };
    const next = {
      ...current,
      [activeColumn]: current[activeColumn].filter((task) => task.id !== activeId),
      [overColumn]: [...current[overColumn], movedTask]
    };
    columnsRef.current = next;
    setColumns(next);
    setActiveTask(movedTask);
    suppressClickRef.current = true;
  }, []);

  const handleDragCancel = React.useCallback(() => {
    setActiveTask(null);
    setOverId(null);
    columnsRef.current = toColumns(tasksRef.current);
    setColumns(columnsRef.current);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const over = event.over;
      const finalColumns = columnsRef.current;
      const dragged = findTask(finalColumns, activeId);
      const targetId = over ? String(over.id) : null;

      setActiveTask(null);
      setOverId(null);
      window.setTimeout(() => {
        suppressClickRef.current = Boolean(over);
      }, 0);

      if (!dragged || !targetId) {
        const restored = toColumns(tasksRef.current);
        columnsRef.current = restored;
        setColumns(restored);
        return;
      }

      if (targetId === TRASH_ID) {
        setDeleteCandidate(dragged);
        return;
      }

      let targetColumn: TaskStatus | null = null;
      if (COLUMN_ORDER.includes(targetId as TaskStatus)) {
        targetColumn = targetId as TaskStatus;
      } else {
        targetColumn = findTaskColumn(finalColumns, targetId);
      }
      if (!targetColumn) return;

      const sourceColumn = findTaskColumn(finalColumns, activeId);
      if (!sourceColumn) return;

      if (targetColumn !== dragged.status) {
        try {
          await updateTaskStatus(activeId, targetColumn);
          await queryClient.invalidateQueries({ queryKey: taskKeys.all });
          toast.success(`Tarea movida a ${COLUMN_LABELS[targetColumn].toLowerCase()}`);
        } catch {
          const restored = toColumns(tasksRef.current);
          columnsRef.current = restored;
          setColumns(restored);
          toast.error('No se pudo mover la tarea.');
        }
      }
    },
    [queryClient]
  );

  const confirmDelete = React.useCallback(async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    const snapshot = tasksRef.current;
    try {
      await deleteTask(deleteCandidate.id);
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Tarea eliminada');
      setDeleteCandidate(null);
    } catch {
      const restored = toColumns(snapshot);
      columnsRef.current = restored;
      setColumns(restored);
      toast.error('No se pudo eliminar la tarea.');
    } finally {
      setDeleting(false);
    }
  }, [deleteCandidate, queryClient]);

  if (isError && tasks.length === 0) {
    return (
      <div className='rounded-2xl border border-border/60 bg-muted/20 p-6 text-center'>
        <p className='text-sm font-medium'>No se pudo cargar el Kanban.</p>
        <p className='text-muted-foreground mt-1 text-xs'>Reintentando conexión…</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        {COLUMN_ORDER.map((status) => (
          <div key={status} className='h-48 rounded-xl border bg-muted/20' />
        ))}
      </div>
    );
  }

  const activeTarget = overId === TRASH_ID;

  return (
    <div className='min-w-0'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className='grid w-full grid-cols-1 gap-4 md:grid-cols-4'>
          {COLUMN_ORDER.map((status) => (
            <TaskColumn
              key={status}
              value={status}
              tasks={columns[status]}
              onOpenTask={setSelectedTask}
              suppressClickRef={suppressClickRef}
            />
          ))}
        </div>

        <TrashDropZone active={Boolean(activeTask)} over={activeTarget} />

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} presentationOnly /> : null}
        </DragOverlay>
      </DndContext>

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
