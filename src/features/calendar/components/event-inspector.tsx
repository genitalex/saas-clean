'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { activityKeys, createActivity } from '@/features/activities/queries';
import { createTask, updateTask } from '@/features/tasks/queries';
import { taskKeys } from '@/features/tasks/queries';
import { createEvent, deleteEvent, eventKeys, getEventWorkspace, updateEvent } from '../queries';
import type { Event } from '../types';

const MIN_WIDTH = 400;
const MAX_WIDTH = 760;
const DEFAULT_WIDTH = 500;

type EventInspectorProps = {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditFull: (event: Event) => void;
  onCreateAt: (date: Date) => void;
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(value);
}

function statusLabel(status: Event['status']) {
  return {
    planned: 'Planeado',
    in_progress: 'En curso',
    done: 'Completado',
    cancelled: 'Cancelado'
  }[status];
}

function statusClass(status: Event['status']) {
  return {
    planned: 'border-border bg-muted/40 text-muted-foreground',
    in_progress: 'border-primary/25 bg-primary/8 text-primary',
    done: 'border-border bg-muted/25 text-muted-foreground',
    cancelled: 'border-destructive/20 bg-destructive/5 text-destructive'
  }[status];
}

export function EventInspector({
  event,
  open,
  onOpenChange,
  onEditFull,
  onCreateAt
}: EventInspectorProps) {
  const queryClient = useQueryClient();
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const stored = Number(window.sessionStorage.getItem('event-inspector-width'));
    return Number.isFinite(stored)
      ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, stored))
      : DEFAULT_WIDTH;
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);
  const widthRef = useRef(DEFAULT_WIDTH);

  const workspaceQuery = useQuery({
    queryKey: event ? [...eventKeys.detail(event.id), 'workspace'] : ['events', 'empty'],
    queryFn: () => getEventWorkspace(event!.id),
    enabled: open && !!event,
    staleTime: 15_000
  });

  const currentEvent = workspaceQuery.data?.event ?? event;
  const relatedTasks = workspaceQuery.data?.tasks ?? [];
  const relatedActivities = workspaceQuery.data?.activities ?? [];
  const completion = useMemo(() => {
    if (relatedTasks.length === 0) return 0;
    return Math.round(
      (relatedTasks.filter((task) => task.status === 'done').length / relatedTasks.length) * 100
    );
  }, [relatedTasks]);

  useEffect(() => {
    if (!currentEvent) return;
    setTitle(currentEvent.title);
    setDescription(currentEvent.description ?? '');
    setLocation(currentEvent.location ?? '');
    setUrl(currentEvent.url ?? '');
  }, [currentEvent]);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  if (!event || !currentEvent) return null;

  const savePatch = async (field: string, patch: Parameters<typeof updateEvent>[1]) => {
    setSavingField(field);
    try {
      await updateEvent(currentEvent.id, patch);
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      await queryClient.invalidateQueries({
        queryKey: [...eventKeys.detail(currentEvent.id), 'workspace']
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el cambio.');
    } finally {
      setSavingField(null);
    }
  };

  const resizeStart = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    pointerEvent.preventDefault();
    const startX = pointerEvent.clientX;
    const startWidth = width;

    const move = (eventMove: PointerEvent) => {
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth + startX - eventMove.clientX)
      );
      widthRef.current = nextWidth;
      setWidth(nextWidth);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.sessionStorage.setItem('event-inspector-width', String(widthRef.current));
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const toggleTask = async (taskId: string, nextStatus: 'todo' | 'done') => {
    try {
      await updateTask(taskId, { status: nextStatus });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      await queryClient.invalidateQueries({
        queryKey: [...eventKeys.detail(currentEvent.id), 'workspace']
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la tarea.');
    }
  };

  const handleTask = async () => {
    try {
      await createTask({
        title: `Preparar: ${currentEvent.title}`,
        customerId: currentEvent.customerId,
        eventId: currentEvent.id,
        assigneeId: currentEvent.assigneeId,
        dueAt: new Date(currentEvent.endAt).toISOString(),
        priority: 'medium'
      });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      await queryClient.invalidateQueries({
        queryKey: [...eventKeys.detail(currentEvent.id), 'workspace']
      });
      toast.success('Tarea vinculada al evento');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la tarea.');
    }
  };

  const handleFollowUp = async () => {
    try {
      const start = new Date(currentEvent.startAt);
      start.setDate(start.getDate() + 1);
      const duration =
        new Date(currentEvent.endAt).getTime() - new Date(currentEvent.startAt).getTime();
      await createEvent({
        title: `Seguimiento · ${currentEvent.title}`,
        description: currentEvent.description,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + duration).toISOString(),
        allDay: currentEvent.allDay,
        location: currentEvent.location,
        url: currentEvent.url,
        customerId: currentEvent.customerId,
        assigneeId: currentEvent.assigneeId,
        color: currentEvent.color,
        reminderMinutes: currentEvent.reminderMinutes
      });
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Seguimiento creado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el seguimiento.');
    }
  };

  const handleDuplicate = async () => {
    try {
      const start = new Date(currentEvent.startAt);
      start.setDate(start.getDate() + 1);
      const duration =
        new Date(currentEvent.endAt).getTime() - new Date(currentEvent.startAt).getTime();
      await createEvent({
        title: currentEvent.title,
        description: currentEvent.description,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + duration).toISOString(),
        allDay: currentEvent.allDay,
        location: currentEvent.location,
        url: currentEvent.url,
        customerId: currentEvent.customerId,
        assigneeId: currentEvent.assigneeId,
        color: currentEvent.color,
        reminderMinutes: currentEvent.reminderMinutes,
        status: 'planned'
      });
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Evento duplicado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo duplicar el evento.');
    }
  };

  const handleNote = async () => {
    if (!note.trim() || !currentEvent.customerId) return;
    try {
      await createActivity(currentEvent.customerId, {
        type: 'note',
        title: `Nota · ${currentEvent.title}`,
        content: note.trim(),
        eventId: currentEvent.id
      });
      setNote('');
      await queryClient.invalidateQueries({
        queryKey: [...eventKeys.detail(currentEvent.id), 'workspace']
      });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Nota añadida');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo añadir la nota.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(currentEvent.id);
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      onOpenChange(false);
      toast.success('Evento eliminado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el evento.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        showCloseButton={false}
        style={{ ['--event-inspector-width' as string]: `${width}px` }}
        className='w-[var(--event-inspector-width)] max-w-[calc(100vw-0.5rem)] gap-0 overflow-hidden border-l bg-background p-0 shadow-none backdrop-blur-none sm:max-w-[var(--event-inspector-width)]'
      >
        <div
          onPointerDown={resizeStart}
          className='absolute left-0 top-0 z-40 hidden h-full w-1.5 cursor-col-resize md:block hover:bg-primary/25'
          aria-label='Redimensionar panel'
        />

        <SheetHeader className='shrink-0 border-b border-border/70 p-4 pb-3 sm:p-5 sm:pb-4'>
          <div className='flex items-start gap-3 pr-1'>
            <span
              className='mt-1 size-3 shrink-0 rounded-full'
              style={{ backgroundColor: currentEvent.color || 'var(--color-primary)' }}
            />
            <div className='min-w-0 flex-1'>
              <SheetTitle className='sr-only'>Inspector del evento</SheetTitle>
              <Input
                value={title}
                onChange={(eventChange) => setTitle(eventChange.target.value)}
                onBlur={() => {
                  if (title.trim() && title.trim() !== currentEvent.title) {
                    void savePatch('title', { title: title.trim() });
                  }
                }}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === 'Enter') keyEvent.currentTarget.blur();
                }}
                className='h-9 rounded-lg border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-border focus-visible:bg-muted/30 focus-visible:px-2'
                aria-label='Título del evento'
              />
              <SheetDescription className='mt-1 capitalize'>
                {formatDateTime(new Date(currentEvent.startAt))}
              </SheetDescription>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => onEditFull(currentEvent)}
                aria-label='Editar evento'
              >
                <Icons.edit className='size-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => onOpenChange(false)}
                aria-label='Cerrar inspector'
              >
                <Icons.close className='size-4' />
              </Button>
            </div>
          </div>

          <div className='mt-3 flex flex-wrap gap-2'>
            {(['planned', 'in_progress', 'done', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                type='button'
                disabled={savingField === 'status'}
                onClick={() => void savePatch('status', { status })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  statusClass(status),
                  currentEvent.status === status && 'ring-2 ring-primary/20'
                )}
              >
                {statusLabel(status)}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5'>
          <div className='space-y-6'>
            {workspaceQuery.isError && (
              <div className='flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm'>
                <span className='text-destructive'>No se pudo cargar el contexto del evento.</span>
                <Button variant='outline' size='sm' onClick={() => void workspaceQuery.refetch()}>
                  Reintentar
                </Button>
              </div>
            )}
            <section className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-sm font-semibold'>Cuándo</h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    La agenda es editable desde aquí.
                  </p>
                </div>
                <Button variant='ghost' size='sm' onClick={() => onEditFull(currentEvent)}>
                  Editar
                </Button>
              </div>
              <div className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70'>
                <div className='bg-background p-3'>
                  <span className='text-muted-foreground text-[11px]'>Inicio</span>
                  <button
                    type='button'
                    onClick={() => onEditFull(currentEvent)}
                    className='mt-1 block text-sm font-medium hover:underline'
                  >
                    {formatTime(new Date(currentEvent.startAt))}
                  </button>
                </div>
                <div className='bg-background p-3'>
                  <span className='text-muted-foreground text-[11px]'>Fin</span>
                  <button
                    type='button'
                    onClick={() => onEditFull(currentEvent)}
                    className='mt-1 block text-sm font-medium hover:underline'
                  >
                    {formatTime(new Date(currentEvent.endAt))}
                  </button>
                </div>
              </div>
            </section>

            <section className='space-y-3'>
              <h3 className='text-sm font-semibold'>Contexto de trabajo</h3>
              <div className='grid gap-2'>
                {currentEvent.customer ? (
                  <Link
                    href={`/dashboard/customers/${currentEvent.customer.id}`}
                    className='flex items-center gap-3 rounded-xl border border-border/70 px-3 py-3 hover:bg-muted/35'
                  >
                    <span className='bg-muted flex size-8 items-center justify-center rounded-full text-xs font-semibold'>
                      {currentEvent.customer.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='text-muted-foreground block text-[11px]'>Cliente</span>
                      <span className='block truncate text-sm font-medium'>
                        {currentEvent.customer.name}
                      </span>
                    </span>
                    <Icons.chevronRight className='text-muted-foreground size-4' />
                  </Link>
                ) : (
                  <div className='text-muted-foreground rounded-xl border border-dashed border-border p-3 text-sm'>
                    Sin cliente asociado.
                  </div>
                )}
                <div className='grid grid-cols-2 gap-2'>
                  <div className='rounded-xl border border-border/70 px-3 py-3'>
                    <span className='text-muted-foreground block text-[11px]'>Responsable</span>
                    <span className='mt-1 block truncate text-sm font-medium'>
                      {currentEvent.assignee?.name ?? 'Sin asignar'}
                    </span>
                  </div>
                  <div className='rounded-xl border border-border/70 px-3 py-3'>
                    <span className='text-muted-foreground block text-[11px]'>Duración</span>
                    <span className='mt-1 block text-sm font-medium'>
                      {Math.max(
                        1,
                        Math.round(
                          (new Date(currentEvent.endAt).getTime() -
                            new Date(currentEvent.startAt).getTime()) /
                            60000
                        )
                      )}{' '}
                      min
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-sm font-semibold'>Trabajo vinculado</h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    Convierte la cita en pasos ejecutables.
                  </p>
                </div>
                <span className='text-muted-foreground text-xs tabular-nums'>{completion}%</span>
              </div>
              {relatedTasks.length > 0 ? (
                <div className='space-y-1.5'>
                  {relatedTasks.map((task) => (
                    <div
                      key={task.id}
                      className='flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5'
                    >
                      <button
                        type='button'
                        onClick={() =>
                          void toggleTask(task.id, task.status === 'done' ? 'todo' : 'done')
                        }
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-md border',
                          task.status === 'done' &&
                            'border-primary bg-primary text-primary-foreground'
                        )}
                        aria-label={
                          task.status === 'done'
                            ? `Reabrir ${task.title}`
                            : `Completar ${task.title}`
                        }
                      >
                        {task.status === 'done' && <Icons.check className='size-3.5' />}
                      </button>
                      <Link
                        href={`/dashboard/my-work?mode=list&task=${task.id}`}
                        className={cn(
                          'min-w-0 flex-1 truncate text-sm hover:underline',
                          task.status === 'done' && 'text-muted-foreground line-through'
                        )}
                      >
                        {task.title}
                      </Link>
                      <span className='text-muted-foreground text-[11px]'>{task.priority}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-muted-foreground rounded-xl border border-dashed border-border p-3 text-sm'>
                  Todavía no hay trabajo vinculado.
                </div>
              )}
              <Button variant='outline' className='w-full' onClick={() => void handleTask()}>
                <Icons.check data-icon='inline-start' /> Crear tarea vinculada
              </Button>
            </section>

            <Separator />

            <section className='space-y-3'>
              <div>
                <h3 className='text-sm font-semibold'>Notas del evento</h3>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  Contexto que se conserva junto al trabajo.
                </p>
              </div>
              <Textarea
                value={description}
                onChange={(eventChange) => setDescription(eventChange.target.value)}
                onBlur={() => {
                  if (description !== (currentEvent.description ?? '')) {
                    void savePatch('description', { description: description || null });
                  }
                }}
                placeholder='Añade contexto…'
                className='min-h-28 resize-y rounded-xl'
              />
            </section>

            <section className='space-y-3'>
              <h3 className='text-sm font-semibold'>Ubicación y enlace</h3>
              <Input
                value={location}
                onChange={(eventChange) => setLocation(eventChange.target.value)}
                onBlur={() => {
                  if (location !== (currentEvent.location ?? ''))
                    void savePatch('location', { location: location || null });
                }}
                placeholder='Dirección o lugar'
                className='rounded-xl'
              />
              <div className='flex gap-2'>
                <Input
                  value={url}
                  onChange={(eventChange) => setUrl(eventChange.target.value)}
                  onBlur={() => {
                    if (url !== (currentEvent.url ?? ''))
                      void savePatch('url', { url: url || null });
                  }}
                  placeholder='https://meet…'
                  className='rounded-xl'
                />
                {url && (
                  <a
                    href={url}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted/40'
                  >
                    <Icons.externalLink className='size-4' />
                  </a>
                )}
              </div>
              {location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary inline-flex text-xs hover:underline'
                >
                  Abrir en Maps
                </a>
              )}
            </section>

            {currentEvent.customerId && (
              <section className='space-y-3'>
                <div>
                  <h3 className='text-sm font-semibold'>Actividad del evento</h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    Todo lo ocurrido queda en contexto.
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Textarea
                    value={note}
                    onChange={(eventChange) => setNote(eventChange.target.value)}
                    placeholder='Escribir una nota…'
                    className='min-h-20 rounded-xl'
                  />
                  <Button
                    size='icon'
                    className='mt-auto shrink-0'
                    onClick={() => void handleNote()}
                    disabled={!note.trim()}
                    aria-label='Guardar nota'
                  >
                    <Icons.send className='size-4' />
                  </Button>
                </div>
                {relatedActivities.length > 0 ? (
                  <div className='space-y-2'>
                    {relatedActivities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className='rounded-xl bg-muted/30 px-3 py-2.5'>
                        <div className='flex items-center justify-between gap-2'>
                          <span className='text-sm font-medium'>{activity.title}</span>
                          <span className='text-muted-foreground text-[11px]'>
                            {new Date(activity.createdAt).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {activity.content && (
                          <p className='text-muted-foreground mt-1 text-xs leading-5'>
                            {activity.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            )}
          </div>
        </div>

        <SheetFooter className='shrink-0 border-t border-border/70 bg-background p-3 sm:p-4'>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            <Button variant='outline' className='rounded-xl' onClick={() => void handleFollowUp()}>
              Seguimiento
            </Button>
            <Button variant='outline' className='rounded-xl' onClick={() => void handleDuplicate()}>
              Duplicar
            </Button>
            <Button
              variant='outline'
              className='rounded-xl'
              onClick={() => onCreateAt(new Date(currentEvent.endAt))}
            >
              <Icons.add />
              <span className='hidden lg:inline'>Después</span>
            </Button>
            <Button
              variant='destructive'
              className='rounded-xl'
              onClick={() => void handleDelete()}
            >
              <Icons.trash />
              <span className='hidden lg:inline'>Eliminar</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
