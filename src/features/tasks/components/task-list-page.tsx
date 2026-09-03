'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import {
  addTaskDependency,
  createTask,
  deleteTask,
  getTaskWorkspace,
  getTasks,
  removeTaskDependency,
  taskKeys,
  updateTask
} from '../queries';
import { createEvent, getEvent, getEvents, updateEvent } from '@/features/calendar/queries';
import {
  createSavedView,
  deleteSavedView,
  getSavedViews,
  updateSavedView
} from '@/features/saved-views/queries';
import type { SavedView } from '@/features/saved-views/types';
import { useSession } from '@/lib/auth-client';
import type { Task, TaskPriority, TaskRecurrence, TaskStatus } from '../types';
import NewTaskDialog from '@/features/kanban/components/new-task-dialog';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'En curso',
  waiting: 'Esperando',
  done: 'Hecho'
};

const priorityLabels: Record<TaskPriority, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };

export function TaskListPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [selected, setSelected] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [bulkDate, setBulkDate] = useState('');
  const [bulkPlanOpen, setBulkPlanOpen] = useState(false);
  const [bulkPlanStart, setBulkPlanStart] = useState('');
  const [bulkPlanDuration, setBulkPlanDuration] = useState('30');
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null);

  const {
    data: tasks = [],
    isPending,
    isError
  } = useQuery({
    queryKey: taskKeys.list({
      search,
      status: status || undefined,
      priority: priority || undefined,
      assigneeId: assigneeId || undefined
    }),
    queryFn: () =>
      getTasks({
        search,
        status: status || undefined,
        priority: priority || undefined,
        assigneeId: assigneeId || undefined
      })
  });

  const { data: savedViews = [] } = useQuery({
    queryKey: ['saved-views', 'tasks'],
    queryFn: () => getSavedViews('tasks')
  });

  const { data: assignees = [] } = useQuery({
    queryKey: ['task-assignee-options'],
    queryFn: async () => {
      const response = await fetch('/api/users?limit=20', { cache: 'no-store' });
      if (!response.ok) return [] as Array<{ id: string; name: string }>;
      const payload = (await response.json()) as { users?: Array<{ id: string; name: string }> };
      return payload.users ?? [];
    },
    staleTime: 60_000
  });

  const filteredTasks = tasks.filter((task) => {
    if (priority && task.priority !== priority) return false;
    if (assigneeId && task.assigneeId !== assigneeId) return false;
    return true;
  });
  const selectedTasks = tasks.filter((task) => selectedIds.includes(task.id));
  const allVisibleSelected =
    filteredTasks.length > 0 && filteredTasks.every((task) => selectedIds.includes(task.id));
  const someVisibleSelected = filteredTasks.some((task) => selectedIds.includes(task.id));

  const recommendedViews = [
    {
      name: 'Mis tareas',
      filters: { assigneeId: session?.user?.id || '' }
    },
    {
      name: 'Hoy',
      filters: { status: 'todo' as const }
    },
    {
      name: 'Pendientes',
      filters: { status: 'todo' as const }
    },
    {
      name: 'Urgentes',
      filters: { status: 'todo' as const, priority: 'high' as const }
    },
    {
      name: 'Esta semana',
      filters: { status: 'todo' as const, assigneeId: session?.user?.id || '' }
    }
  ];

  const applyFilters = (next: { status?: string; priority?: string; assigneeId?: string }) => {
    setStatus((next.status as TaskStatus | '') || '');
    setPriority((next.priority as TaskPriority | '') || '');
    setAssigneeId(next.assigneeId || '');
  };

  const saveCurrentView = async () => {
    const name = window.prompt('Nombre de la vista');
    if (!name || !name.trim()) return;

    try {
      await createSavedView({
        entity: 'tasks',
        name: name.trim(),
        filters: {
          status: status || undefined,
          priority: priority || undefined,
          assigneeId: assigneeId || undefined,
          search: search || undefined
        },
        sortBy: 'createdAt',
        groupBy: 'status'
      });
      await queryClient.invalidateQueries({ queryKey: ['saved-views'] });
      toast.success('Vista guardada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la vista.');
    }
  };

  const updateViewFavorite = async (view: SavedView, favorite: boolean) => {
    try {
      await updateSavedView(view.id, { favorite });
      await queryClient.invalidateQueries({ queryKey: ['saved-views'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la vista.');
    }
  };

  const renameView = async (view: SavedView) => {
    const nextName = window.prompt('Renombrar vista', view.name);
    if (!nextName || !nextName.trim()) return;
    try {
      await updateSavedView(view.id, { name: nextName.trim() });
      await queryClient.invalidateQueries({ queryKey: ['saved-views'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo renombrar la vista.');
    }
  };

  const deleteView = async (view: SavedView) => {
    try {
      await deleteSavedView(view.id);
      await queryClient.invalidateQueries({ queryKey: ['saved-views'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la vista.');
    }
  };

  const openSavedView = (view: SavedView) => {
    applyFilters({
      status: view.filters.status,
      priority: view.filters.priority,
      assigneeId: view.filters.assigneeId
    });
    setSearch(view.filters.search || '');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStatus((params.get('status') as TaskStatus | null) || '');
    setPriority((params.get('priority') as TaskPriority | null) || '');
    setAssigneeId(params.get('assigneeId') || '');
    setSearch(params.get('search') || '');

    const syncDeepLink = () =>
      setDeepLinkId(new URLSearchParams(window.location.search).get('task'));
    syncDeepLink();
    window.addEventListener('popstate', syncDeepLink);
    return () => window.removeEventListener('popstate', syncDeepLink);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (assigneeId) params.set('assigneeId', assigneeId);
    if (search) params.set('search', search);
    const next = params.toString();
    const current = window.location.search.replace(/^\?/, '');
    if (next !== current) {
      const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}`;
      window.history.replaceState(null, '', nextUrl);
    }
  }, [status, priority, assigneeId, search]);

  useEffect(() => {
    if (deepLinkId && tasks.length > 0) {
      setSelected(tasks.find((task) => task.id === deepLinkId) ?? null);
    }
  }, [deepLinkId, tasks]);

  const openTask = (task: Task) => {
    setSelected(task);
    window.history.replaceState(null, '', `/dashboard/tasks?task=${task.id}`);
  };

  const closeTask = () => {
    setSelected(null);
    window.history.replaceState(null, '', '/dashboard/tasks');
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredTasks.some((task) => task.id === id))
      );
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredTasks.forEach((task) => next.add(task.id));
      return [...next];
    });
  };

  const bulkUpdate = async (patch: Parameters<typeof updateTask>[1]) => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(selectedIds.map((taskId) => updateTask(taskId, patch)));
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      setSelectedIds([]);
      toast.success(selectedIds.length > 1 ? 'Tareas actualizadas' : 'Tarea actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el lote.');
    }
  };

  const bulkSchedule = async (when: 'today' | 'tomorrow' | 'nextWeek') => {
    const reference = new Date();
    const base = new Date(reference);
    const next = new Date(base);

    if (when === 'today') {
      next.setHours(9, 0, 0, 0);
    } else if (when === 'tomorrow') {
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
    }

    await bulkUpdate({ dueAt: next.toISOString() });
  };

  const bulkPlan = async () => {
    if (!bulkPlanStart || selectedTasks.length === 0) return;
    const start = new Date(bulkPlanStart);
    const duration = Number(bulkPlanDuration) * 60 * 1000;
    if (Number.isNaN(start.getTime()) || !Number.isFinite(duration)) return;

    try {
      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayEvents = await getEvents({
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString()
      });
      const selectedEventIds = new Set(
        selectedTasks.flatMap((task) => (task.event ? [task.event.id] : []))
      );
      const hasConflict = dayEvents.some((event) => {
        if (selectedEventIds.has(event.id)) return false;
        const eventStart = new Date(event.startAt).getTime();
        const eventEnd = new Date(event.endAt).getTime();
        return selectedTasks.some((_, index) => {
          const taskStart = start.getTime() + index * duration;
          return taskStart < eventEnd && taskStart + duration > eventStart;
        });
      });
      if (hasConflict) {
        const continuePlanning = window.confirm(
          'Ya tienes una reunión a esta hora. ¿Quieres colocar las tareas de todos modos?'
        );
        if (!continuePlanning) return;
      }

      for (const [index, task] of selectedTasks.entries()) {
        const taskStart = new Date(start.getTime() + index * duration);
        const taskEnd = new Date(taskStart.getTime() + duration);
        if (task.event) {
          await updateEvent(task.event.id, {
            startAt: taskStart.toISOString(),
            endAt: taskEnd.toISOString()
          });
        } else {
          const created = await createEvent({
            title: task.title,
            description: task.description ?? undefined,
            startAt: taskStart.toISOString(),
            endAt: taskEnd.toISOString(),
            customerId: task.customerId,
            assigneeId: task.assigneeId,
            status: 'planned'
          });
          await updateTask(task.id, { eventId: created.id, dueAt: taskStart.toISOString() });
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['events'] })
      ]);
      setSelectedIds([]);
      setBulkPlanOpen(false);
      toast.success(`${selectedTasks.length} tareas colocadas en calendario`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo planificar el lote.');
    }
  };

  const bulkAssign = async () => {
    if (!bulkAssigneeId) return;
    await bulkUpdate({ assigneeId: bulkAssigneeId });
    setBulkAssigneeId('');
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Eliminar ${selectedIds.length} tarea${selectedIds.length > 1 ? 's' : ''}?`
    );
    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((taskId) => deleteTask(taskId)));
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      setSelectedIds([]);
      toast.success(
        selectedIds.length > 1 ? `${selectedIds.length} tareas eliminadas` : 'Tarea eliminada'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el lote.');
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center'>
        <Input
          className='md:max-w-sm'
          placeholder='Buscar tareas...'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className='flex flex-wrap gap-2'>
          <NativeSelect
            aria-label='Filtrar por responsable'
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <NativeSelectOption value=''>Todos los responsables</NativeSelectOption>
            {assignees.map((assignee) => (
              <NativeSelectOption key={assignee.id} value={assignee.id}>
                {assignee.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label='Filtrar por estado'
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus | '')}
          >
            <NativeSelectOption value=''>Todos los estados</NativeSelectOption>
            {Object.entries(statusLabels).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label='Filtrar por prioridad'
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority | '')}
          >
            <NativeSelectOption value=''>Todas las prioridades</NativeSelectOption>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className='flex flex-col gap-3 rounded-[20px] border border-border/60 bg-card/40 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-[11px] font-medium uppercase tracking-[0.16em] text-primary'>
            Vistas
          </span>
          <Button variant='outline' size='sm' onClick={() => void saveCurrentView()}>
            Guardar vista
          </Button>
          {recommendedViews.map((view) => (
            <Button
              key={view.name}
              variant='ghost'
              size='sm'
              onClick={() => applyFilters(view.filters)}
            >
              {view.name}
            </Button>
          ))}
        </div>
        <div className='flex flex-wrap gap-2'>
          {(savedViews ?? []).map((view) => (
            <div
              key={view.id}
              className='flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2 py-1 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.02)]'
            >
              <button type='button' className='font-medium' onClick={() => openSavedView(view)}>
                {view.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button
                    type='button'
                    aria-label={`Más opciones para ${view.name}`}
                    className='p-1 text-muted-foreground hover:text-foreground'
                  >
                    <Icons.chevronDown className='size-3.5' />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onSelect={() => renameView(view)}>Renombrar</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => updateViewFavorite(view, !view.favorite)}>
                    {view.favorite ? 'Quitar favorito' : 'Marcar favorito'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant='destructive' onSelect={() => deleteView(view)}>
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className='sticky top-3 z-10 rounded-[20px] border border-primary/20 bg-background/90 p-3 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.3)]'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium'>
                {selectedIds.length} tarea{selectedIds.length > 1 ? 's' : ''} seleccionada
                {selectedIds.length > 1 ? 's' : ''}
              </span>
              <button
                type='button'
                className='text-muted-foreground text-xs underline-offset-2 hover:underline'
                onClick={() => setSelectedIds([])}
              >
                Limpiar
              </button>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Button variant='outline' size='sm' onClick={() => void bulkSchedule('today')}>
                Hoy
              </Button>
              <Button variant='outline' size='sm' onClick={() => void bulkSchedule('tomorrow')}>
                Mañana
              </Button>
              <Button variant='outline' size='sm' onClick={() => void bulkSchedule('nextWeek')}>
                Próxima semana
              </Button>
              <Button
                variant={bulkPlanOpen ? 'secondary' : 'outline'}
                size='sm'
                onClick={() => setBulkPlanOpen((open) => !open)}
              >
                Planificar
              </Button>
              <Input
                type='datetime-local'
                value={bulkDate}
                onChange={(event) => setBulkDate(event.target.value)}
                className='h-9 w-44 rounded-lg'
                aria-label='Elegir fecha para tareas seleccionadas'
              />
              {bulkDate && (
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    void bulkUpdate({ dueAt: new Date(bulkDate).toISOString() });
                    setBulkDate('');
                  }}
                >
                  Guardar fecha
                </Button>
              )}
              <NativeSelect
                aria-label='Asignar a'
                value={bulkAssigneeId}
                onChange={(event) => setBulkAssigneeId(event.target.value)}
              >
                <NativeSelectOption value=''>Asignar a…</NativeSelectOption>
                {assignees.map((assignee) => (
                  <NativeSelectOption key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {bulkAssigneeId && (
                <Button variant='secondary' size='sm' onClick={() => void bulkAssign()}>
                  Asignar
                </Button>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => void bulkUpdate({ priority: 'high' })}
              >
                Alta
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => void bulkUpdate({ priority: 'medium' })}
              >
                Media
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => void bulkUpdate({ priority: 'low' })}
              >
                Baja
              </Button>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => void bulkUpdate({ status: 'done' })}
              >
                Completar
              </Button>
              <Button variant='destructive' size='sm' onClick={() => void bulkDelete()}>
                Eliminar
              </Button>
            </div>
            {bulkPlanOpen && (
              <div className='flex flex-wrap items-center gap-2 border-t border-border/50 pt-3'>
                <Input
                  type='datetime-local'
                  value={bulkPlanStart}
                  onChange={(event) => setBulkPlanStart(event.target.value)}
                  aria-label='Inicio del plan de tareas'
                  className='h-9 w-48 rounded-lg'
                />
                <NativeSelect
                  value={bulkPlanDuration}
                  onChange={(event) => setBulkPlanDuration(event.target.value)}
                  aria-label='Duración de cada tarea'
                >
                  <NativeSelectOption value='15'>15 min</NativeSelectOption>
                  <NativeSelectOption value='30'>30 min</NativeSelectOption>
                  <NativeSelectOption value='45'>45 min</NativeSelectOption>
                  <NativeSelectOption value='60'>1 h</NativeSelectOption>
                  <NativeSelectOption value='120'>2 h</NativeSelectOption>
                </NativeSelect>
                <Button variant='secondary' size='sm' onClick={() => void bulkPlan()}>
                  Colocar consecutivamente
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isPending ? (
        <div className='bg-muted h-48 animate-pulse rounded-xl' />
      ) : isError ? (
        <p className='text-destructive text-sm'>No se pudieron cargar las tareas.</p>
      ) : (
        <div className='overflow-hidden border-y border-border/60 bg-card/30'>
          <div className='flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5'>
            <div className='flex items-center gap-3'>
              <Checkbox
                aria-label='Seleccionar todas las tareas visibles'
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onCheckedChange={() => toggleSelectAll()}
              />
              <div>
                <p className='text-sm font-semibold'>Trabajo</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  Selecciona tareas para actuar con contexto.
                </p>
              </div>
            </div>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {filteredTasks.length} tareas
            </span>
          </div>
          <div>
            {filteredTasks.map((task) => {
              const isSelected = selectedIds.includes(task.id);

              return (
                <div
                  key={task.id}
                  className={`flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-0 ${isSelected ? 'bg-primary/[0.03]' : 'hover:bg-muted/30'}`}
                >
                  <Checkbox
                    aria-label={`Seleccionar ${task.title}`}
                    checked={isSelected}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                  />
                  <button
                    type='button'
                    aria-label={`Abrir tarea ${task.title}`}
                    className='flex min-w-0 flex-1 items-center gap-3 text-left'
                    onClick={() => openTask(task)}
                  >
                    <span
                      className={`mt-0.5 size-2.5 shrink-0 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : task.status === 'waiting' ? 'bg-amber-500' : 'bg-muted-foreground/40'}`}
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-medium'>{task.title}</span>
                      <span className='text-muted-foreground mt-1 block text-xs'>
                        {task.customer?.name ?? 'Sin cliente'}
                        {task.dueAt ? ` · ${new Date(task.dueAt).toLocaleDateString('es-ES')}` : ''}
                      </span>
                    </span>
                    <div className='flex items-center gap-2'>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                        {priorityLabels[task.priority]}
                      </Badge>
                      <span className='text-muted-foreground hidden text-[11px] uppercase tracking-[0.12em] sm:block'>
                        {statusLabels[task.status]}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className='text-muted-foreground p-14 text-center text-sm'>
                No hay tareas con estos filtros.
              </div>
            )}
          </div>
        </div>
      )}
      <TaskInspector
        task={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && closeTask()}
        onTaskUpdated={(task) => setSelected(task)}
        queryClient={queryClient}
      />
    </div>
  );
}

function TaskInspector({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  queryClient
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: Task) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [title, setTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [waitingOn, setWaitingOn] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrence | ''>('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const workspaceQuery = useQuery({
    queryKey: taskKeys.workspace(task?.id ?? ''),
    queryFn: () => getTaskWorkspace(task!.id),
    enabled: Boolean(task),
    staleTime: 10_000
  });
  const allTasksQuery = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    enabled: Boolean(task),
    staleTime: 20_000
  });

  useEffect(() => {
    setTitle(task?.title ?? '');
    setWaitingOn(task?.waitingOn ?? '');
    setRecurrenceRule(task?.recurrenceRule ?? '');
  }, [task]);

  if (!task) return null;

  const save = async (patch: Parameters<typeof updateTask>[1]) => {
    try {
      const updated = await updateTask(task.id, patch);
      onTaskUpdated(updated);
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Tarea actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la tarea.');
    }
  };

  const rescheduleTask = async (next: Date) => {
    try {
      if (task.event) {
        const linkedEvent = await getEvent(task.event.id);
        const duration = Math.max(
          15 * 60 * 1000,
          new Date(linkedEvent.endAt).getTime() - new Date(linkedEvent.startAt).getTime()
        );
        await updateEvent(task.event.id, {
          startAt: next.toISOString(),
          endAt: new Date(next.getTime() + duration).toISOString()
        });
        onTaskUpdated({ ...task, dueAt: next });
        await queryClient.invalidateQueries({ queryKey: ['events'] });
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
        toast.success('Trabajo reprogramado');
      } else {
        await save({ dueAt: next.toISOString() });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo reprogramar la tarea.');
    }
  };

  const scheduleTask = async (when: 'later' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek') => {
    const base = new Date(task.dueAt ?? new Date());
    const next = new Date(base);

    if (when === 'later') {
      next.setTime(Math.max(Date.now() + 30 * 60 * 1000, next.getTime() + 30 * 60 * 1000));
    } else if (when === 'today') {
      next.setHours(9, 0, 0, 0);
    } else if (when === 'tomorrow') {
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
    } else if (when === 'thisWeek') {
      next.setDate(next.getDate() + (next.getDay() === 0 ? 1 : 0));
      next.setHours(9, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
    }

    await rescheduleTask(next);
  };

  const scheduleOnDate = async () => {
    if (!scheduleDate) return;
    const selectedDate = new Date(`${scheduleDate}T09:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return;
    await rescheduleTask(selectedDate);
    setScheduleDate('');
  };

  const planInCalendar = async () => {
    const anchor = task.dueAt ? new Date(task.dueAt) : new Date();
    const start = new Date(anchor);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      if (task.event) {
        await updateEvent(task.event.id, {
          startAt: start.toISOString(),
          endAt: end.toISOString()
        });
      } else {
        const created = await createEvent({
          title: task.title,
          description: task.description ?? undefined,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          customerId: task.customerId,
          assigneeId: task.assigneeId,
          status: 'planned'
        });
        await save({ eventId: created.id, dueAt: start.toISOString() });
      }
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Tarea planificada en calendario');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo planificar en calendario.');
    }
  };

  const addSubtask = async () => {
    const titleValue = subtaskTitle.trim();
    if (!titleValue) return;
    try {
      await createTask({ title: titleValue, parentTaskId: task.id, customerId: task.customerId });
      setSubtaskTitle('');
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Subtarea añadida');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo añadir la subtarea.');
    }
  };

  const createFollowUp = async () => {
    if (!followUpDate) return;
    try {
      await createTask({
        title: `Seguimiento: ${task.title}`,
        description: `Continuar con: ${task.title}`,
        dueAt: new Date(`${followUpDate}T09:00:00`).toISOString(),
        customerId: task.customerId,
        assigneeId: task.assigneeId,
        followUpForTaskId: task.id
      });
      setFollowUpDate('');
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Seguimiento creado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el seguimiento.');
    }
  };

  const workspace = workspaceQuery.data;
  const completedSubtasks =
    workspace?.subtasks.filter((subtask) => subtask.status === 'done').length ?? 0;
  const dependencyCandidates = (allTasksQuery.data ?? []).filter(
    (candidate) =>
      candidate.id !== task.id &&
      candidate.status !== 'done' &&
      !workspace?.blockedBy.some((blocked) => blocked.id === candidate.id)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-0 overflow-hidden p-0 sm:max-w-md'>
        <SheetHeader className='shrink-0 border-b border-border/60 p-5 pb-4'>
          <div className='flex items-start gap-3'>
            <button
              type='button'
              aria-label={task.status === 'done' ? 'Reabrir tarea' : 'Completar tarea'}
              onClick={() => void save({ status: task.status === 'done' ? 'todo' : 'done' })}
              className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border ${task.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
            >
              {task.status === 'done' && <Icons.check className='size-3.5' />}
            </button>
            <div className='min-w-0 flex-1'>
              <SheetTitle className='sr-only'>Inspector de tarea</SheetTitle>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim() && title.trim() !== task.title)
                    void save({ title: title.trim() });
                }}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
                aria-label='Título de la tarea'
                className='h-9 border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-border focus-visible:bg-muted/30 focus-visible:px-2'
              />
              <SheetDescription className='mt-1'>Contexto de ejecución</SheetDescription>
            </div>
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            {(Object.keys(statusLabels) as TaskStatus[]).map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => void save({ status: value })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${task.status === value ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}
              >
                {statusLabels[value]}
              </button>
            ))}
          </div>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-6 overflow-y-auto p-5'>
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold'>Contexto</h3>
            <div className='grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60'>
              <Detail label='Prioridad' value={priorityLabels[task.priority]} />
              <Detail
                label='Fecha'
                value={task.dueAt ? new Date(task.dueAt).toLocaleDateString('es-ES') : 'Sin fecha'}
              />
              <Detail label='Cliente' value={task.customer?.name ?? 'Trabajo interno'} />
              <Detail label='Responsable' value={task.assignee?.name ?? 'Sin asignar'} />
            </div>
            <div className='space-y-2 rounded-2xl border border-border/60 p-3'>
              <label htmlFor='task-waiting-on' className='text-muted-foreground text-xs'>
                Esperando a
              </label>
              <Input
                id='task-waiting-on'
                placeholder='Persona, respuesta o condición'
                value={waitingOn}
                onChange={(event) => setWaitingOn(event.target.value)}
                onBlur={() => void save({ waitingOn: waitingOn.trim() || null })}
              />
            </div>
            {task.customer && (
              <Link
                href={`/dashboard/customers/${task.customer.id}`}
                className='flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-3 text-sm hover:bg-muted/40'
              >
                <Icons.user className='text-primary size-4' />
                <span className='min-w-0 flex-1 truncate'>{task.customer.name}</span>
                <Icons.chevronRight className='text-muted-foreground size-4' />
              </Link>
            )}
            {task.event && (
              <a
                href={`/dashboard/calendar?event=${task.event.id}`}
                className='flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-3 text-sm hover:bg-muted/40'
              >
                <Icons.calendar className='text-primary size-4' />
                <span className='min-w-0 flex-1 truncate'>{task.event.title}</span>
                <Icons.chevronRight className='text-muted-foreground size-4' />
              </a>
            )}
            {workspace?.blockedBy.length ? (
              <div className='rounded-2xl border border-amber-300/40 bg-amber-50/50 p-3 dark:border-amber-400/20 dark:bg-amber-400/5'>
                <p className='text-xs font-medium'>Bloqueada por</p>
                {workspace.blockedBy.map((blockingTask) => (
                  <div key={blockingTask.id} className='mt-2 flex items-center gap-2 text-sm'>
                    <Link
                      href={`/dashboard/tasks?task=${blockingTask.id}`}
                      className='flex min-w-0 flex-1 items-center gap-2 hover:underline'
                    >
                      <Icons.lock className='size-3.5 shrink-0 text-amber-600' />
                      <span className='truncate'>{blockingTask.title}</span>
                    </Link>
                    <button
                      type='button'
                      aria-label={`Eliminar bloqueo de ${blockingTask.title}`}
                      className='text-muted-foreground hover:text-foreground'
                      onClick={() =>
                        void removeTaskDependency(task.id, blockingTask.id)
                          .then(() =>
                            queryClient.invalidateQueries({ queryKey: taskKeys.workspace(task.id) })
                          )
                          .catch((error: unknown) =>
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : 'No se pudo eliminar el bloqueo.'
                            )
                          )
                      }
                    >
                      <Icons.close className='size-3.5' />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className='flex flex-wrap items-center gap-2'>
              <NativeSelect
                aria-label='Añadir tarea bloqueante'
                defaultValue=''
                onChange={(event) => {
                  if (!event.target.value) return;
                  void addTaskDependency(task.id, event.target.value)
                    .then(() => {
                      void queryClient.invalidateQueries({ queryKey: taskKeys.workspace(task.id) });
                    })
                    .catch((error: unknown) =>
                      toast.error(
                        error instanceof Error ? error.message : 'No se pudo añadir el bloqueo.'
                      )
                    );
                  event.currentTarget.value = '';
                }}
              >
                <NativeSelectOption value=''>Añadir bloqueo...</NativeSelectOption>
                {dependencyCandidates.map((candidate) => (
                  <NativeSelectOption key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </section>
          <Separator />
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold'>Historial</h3>
            <div className='space-y-3'>
              {workspace?.history.map((entry) => (
                <div key={entry.id} className='flex gap-3 text-xs'>
                  <time className='text-muted-foreground w-12 shrink-0 tabular-nums'>
                    {new Date(entry.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                  <div className='min-w-0'>
                    <p>{entry.message}</p>
                    {entry.actor && (
                      <p className='text-muted-foreground mt-0.5'>{entry.actor.name}</p>
                    )}
                  </div>
                </div>
              ))}
              {workspace && workspace.history.length === 0 && (
                <p className='text-muted-foreground text-xs'>Todavía no hay cambios registrados.</p>
              )}
            </div>
          </section>
          <Separator />
          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold'>Checklist</h3>
              {workspace?.subtasks.length ? (
                <span className='text-muted-foreground text-xs'>
                  {completedSubtasks}/{workspace.subtasks.length}
                </span>
              ) : null}
            </div>
            <div className='space-y-1'>
              {workspace?.subtasks.map((subtask) => (
                <div key={subtask.id} className='flex items-center gap-2 rounded-lg px-1 py-1'>
                  <button
                    type='button'
                    aria-label={
                      subtask.status === 'done' ? 'Reabrir subtarea' : 'Completar subtarea'
                    }
                    onClick={() =>
                      void updateTask(subtask.id, {
                        status: subtask.status === 'done' ? 'todo' : 'done'
                      }).then(() =>
                        queryClient.invalidateQueries({ queryKey: taskKeys.workspace(task.id) })
                      )
                    }
                    className='flex size-5 shrink-0 items-center justify-center rounded-full border border-border'
                  >
                    {subtask.status === 'done' && <Icons.check className='size-3' />}
                  </button>
                  <Input
                    defaultValue={subtask.title}
                    aria-label={`Título de ${subtask.title}`}
                    className='h-8 border-transparent bg-transparent px-1 shadow-none focus-visible:border-border'
                    onBlur={(event) =>
                      event.target.value.trim() !== subtask.title &&
                      void updateTask(subtask.id, { title: event.target.value.trim() }).then(() =>
                        queryClient.invalidateQueries({ queryKey: taskKeys.workspace(task.id) })
                      )
                    }
                  />
                </div>
              ))}
              <div className='flex items-center gap-2'>
                <Icons.add className='text-muted-foreground size-4' />
                <Input
                  value={subtaskTitle}
                  onChange={(event) => setSubtaskTitle(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && void addSubtask()}
                  placeholder='Añadir subtarea'
                  className='h-8 border-transparent bg-transparent px-1 shadow-none'
                />
              </div>
            </div>
          </section>
          <Separator />
          <section className='space-y-3'>
            <h3 className='text-sm font-semibold'>Siguiente decisión</h3>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' size='sm' onClick={() => void scheduleTask('later')}>
                Más tarde
              </Button>
              <Button variant='outline' size='sm' onClick={() => void scheduleTask('today')}>
                Hoy
              </Button>
              <Button variant='outline' size='sm' onClick={() => void scheduleTask('tomorrow')}>
                Mañana
              </Button>
              <Button variant='outline' size='sm' onClick={() => void scheduleTask('nextWeek')}>
                Próxima semana
              </Button>
              <Button variant='outline' size='sm' onClick={() => void scheduleTask('thisWeek')}>
                Esta semana
              </Button>
              <Button variant='secondary' size='sm' onClick={() => void planInCalendar()}>
                Planificar en calendario
              </Button>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Input
                type='date'
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                aria-label='Elegir fecha de la tarea'
                className='h-9 w-40 rounded-xl'
              />
              {scheduleDate && (
                <Button variant='outline' size='sm' onClick={() => void scheduleOnDate()}>
                  Elegir fecha
                </Button>
              )}
            </div>
            {task.status === 'waiting' && (
              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void save({ status: 'todo', waitingOn: null })}
                >
                  Ya no estoy esperando
                </Button>
                <Input
                  type='date'
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  aria-label='Fecha del seguimiento'
                  className='h-9 w-40 rounded-xl'
                />
                {followUpDate && (
                  <Button variant='secondary' size='sm' onClick={() => void createFollowUp()}>
                    Crear seguimiento
                  </Button>
                )}
              </div>
            )}
            <div className='flex flex-wrap gap-2'>
              {(Object.keys(priorityLabels) as TaskPriority[]).map((value) => (
                <Button
                  key={value}
                  variant={task.priority === value ? 'secondary' : 'outline'}
                  size='sm'
                  onClick={() => void save({ priority: value })}
                >
                  {priorityLabels[value]}
                </Button>
              ))}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <NativeSelect
                aria-label='Repetición de la tarea'
                value={recurrenceRule}
                onChange={(event) => {
                  const value = event.target.value as TaskRecurrence | '';
                  setRecurrenceRule(value);
                  void save({ recurrenceRule: value || null });
                }}
              >
                <NativeSelectOption value=''>Sin repetición</NativeSelectOption>
                <NativeSelectOption value='daily'>Cada día</NativeSelectOption>
                <NativeSelectOption value='weekly'>Cada semana</NativeSelectOption>
                <NativeSelectOption value='monthly'>Cada mes</NativeSelectOption>
              </NativeSelect>
              <span className='text-muted-foreground text-xs'>
                Se crea la próxima al completar.
              </span>
            </div>
          </section>
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Descripción</h3>
            <p className='text-muted-foreground text-sm leading-6'>
              {task.description || 'Sin descripción todavía.'}
            </p>
          </section>
          <div className='bg-muted/30 rounded-2xl p-4 text-sm'>
            <p className='font-medium'>La tarea vive dentro de tu flujo</p>
            <p className='text-muted-foreground mt-1 leading-5'>
              Puedes abrir el cliente o el evento relacionado sin perder esta selección.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-background p-3'>
      <p className='text-muted-foreground text-[11px]'>{label}</p>
      <p className='mt-1 truncate text-sm font-medium'>{value}</p>
    </div>
  );
}

export function TasksHeaderAction({ initialOpen = false }: { initialOpen?: boolean }) {
  return <NewTaskDialog initialOpen={initialOpen} />;
}
