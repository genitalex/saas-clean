'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import { getEvents, eventKeys } from '@/features/calendar/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
} as const;

function normalizeStatus(value: string | undefined) {
  if (value === 'done') return 'done';
  if (value === 'in_progress') return 'in_progress';
  if (value === 'waiting') return 'waiting';
  return 'todo';
}

export default function TeamWorkPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    staleTime: 30_000
  });

  const { data: events = [] } = useQuery({
    queryKey: eventKeys.list({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }),
    queryFn: () =>
      getEvents({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }),
    staleTime: 30_000
  });

  const members = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; tasks: typeof tasks; events: typeof events }
    >();
    for (const task of tasks) {
      const assignee = task.assignee ?? { id: 'unassigned', name: 'Sin asignar' };
      const current = map.get(assignee.id) ?? {
        id: assignee.id,
        name: assignee.name,
        tasks: [],
        events: []
      };
      current.tasks.push(task);
      map.set(assignee.id, current);
    }

    for (const event of events) {
      const assignee = event.assignee ?? { id: 'unassigned', name: 'Sin asignar' };
      const current = map.get(assignee.id) ?? {
        id: assignee.id,
        name: assignee.name,
        tasks: [],
        events: []
      };
      current.events.push(event);
      map.set(assignee.id, current);
    }

    return Array.from(map.values())
      .map((member) => {
        const activeTasks = member.tasks.filter((task) => task.status !== 'done');
        const overdue = activeTasks.filter(
          (task) => task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'done'
        ).length;
        const today = activeTasks.filter((task) =>
          task.dueAt ? new Date(task.dueAt).toDateString() === new Date().toDateString() : false
        ).length;
        const blocked = activeTasks.filter((task) => task.status === 'waiting').length;
        return {
          ...member,
          taskCount: activeTasks.length,
          overdue,
          today,
          blocked,
          urgentCount: activeTasks.filter((task) => task.priority === 'high').length
        };
      })
      .sort((a, b) => b.taskCount - a.taskCount || a.name.localeCompare(b.name));
  }, [tasks, events]);

  const activeMember = useMemo(
    () => members.find((member) => member.id === selectedMember) ?? members[0] ?? null,
    [members, selectedMember]
  );

  const memberTasks = useMemo(() => {
    if (!activeMember) return [];
    return activeMember.tasks.filter((task) => task.status !== 'done');
  }, [activeMember]);

  const summary = activeMember
    ? `${activeMember.taskCount} tareas · ${activeMember.today} hoy${activeMember.overdue ? ` · ${activeMember.overdue} vencida` : ''}`
    : 'Sin trabajo';

  return (
    <div className='space-y-5'>
      <div className='grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]'>
        <div className='rounded-[24px] border border-border/60 bg-card/60 p-4 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Equipo
              </p>
              <h2 className='mt-1 text-lg font-semibold'>Carga de trabajo</h2>
            </div>
          </div>

          <div className='space-y-2'>
            {members.length === 0 ? (
              <p className='text-muted-foreground text-sm'>Todavía no hay trabajo asignado.</p>
            ) : (
              members.map((member) => {
                const selected = member.id === activeMember?.id;
                return (
                  <button
                    key={member.id}
                    type='button'
                    onClick={() => setSelectedMember(member.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors',
                      selected
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/60 bg-background/50 hover:bg-muted/30'
                    )}
                  >
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{member.name}</span>
                        {member.urgentCount > 0 && (
                          <Badge variant='destructive' className='h-5 px-1.5 text-[10px]'>
                            {member.urgentCount} urg.
                          </Badge>
                        )}
                      </div>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {member.taskCount} tareas · {member.today} hoy
                        {member.overdue ? ` · ${member.overdue} vencida` : ''}
                      </p>
                    </div>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      {member.blocked > 0 && (
                        <span className='text-xs'>
                          {member.blocked} pendiente{member.blocked > 1 ? 's' : ''}
                        </span>
                      )}
                      <Icons.chevronRight className='size-4' />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className='rounded-[24px] border border-border/60 bg-card/60 p-4 shadow-sm'>
          {activeMember ? (
            <>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                    Contexto
                  </p>
                  <h2 className='mt-1 text-lg font-semibold'>{activeMember.name}</h2>
                </div>
                <Link
                  href={`/dashboard/tasks?assigneeId=${activeMember.id}`}
                  className='text-sm text-primary'
                >
                  Ver trabajo
                </Link>
              </div>

              <div className='mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground'>
                <span className='rounded-full border border-border/60 bg-background/60 px-2.5 py-1'>
                  {summary}
                </span>
                {activeMember.overdue > 0 && (
                  <span className='rounded-full border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 text-amber-700 dark:text-amber-300'>
                    {activeMember.overdue} vencida{activeMember.overdue > 1 ? 's' : ''}
                  </span>
                )}
                {activeMember.blocked > 0 && (
                  <span className='rounded-full border border-blue-500/30 bg-blue-500/5 px-2.5 py-1 text-blue-700 dark:text-blue-300'>
                    {activeMember.blocked} pendiente{activeMember.blocked > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className='space-y-2'>
                {memberTasks.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>
                    No hay tareas pendientes para esta persona.
                  </p>
                ) : (
                  memberTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3'
                    >
                      <span
                        className={cn(
                          'size-2.5 rounded-full',
                          normalizeStatus(task.status) === 'done' && 'bg-emerald-500',
                          normalizeStatus(task.status) === 'in_progress' && 'bg-blue-500',
                          normalizeStatus(task.status) === 'waiting' && 'bg-amber-500',
                          normalizeStatus(task.status) === 'todo' && 'bg-muted-foreground/60'
                        )}
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium'>{task.title}</div>
                        <div className='text-muted-foreground mt-0.5 text-xs'>
                          {task.customer?.name ?? 'Trabajo interno'}
                          {task.dueAt
                            ? ` · ${new Date(task.dueAt).toLocaleDateString('es-ES')}`
                            : ''}
                        </div>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className='text-muted-foreground text-sm'>
              Selecciona una persona para ver su contexto.
            </div>
          )}
        </div>
      </div>

      <div className='rounded-[24px] border border-border/60 bg-card/60 p-4 shadow-sm'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
              Señales
            </p>
            <h3 className='mt-1 text-lg font-semibold'>Carga y contexto</h3>
          </div>
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          {members.map((member) => (
            <div
              key={member.id}
              className='rounded-2xl border border-border/60 bg-background/60 p-3'
            >
              <p className='font-medium'>{member.name}</p>
              <p className='text-muted-foreground mt-2 text-sm'>
                {member.taskCount} tareas · {member.today} hoy
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {member.overdue > 0 ? `${member.overdue} vencidas` : 'Sin tareas vencidas'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
