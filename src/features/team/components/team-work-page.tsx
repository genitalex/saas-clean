'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import { getEvents, eventKeys } from '@/features/calendar/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' } as const;

type TeamMember = { id: string; name: string; email: string; role: string };
type Invitation = { id: string; email: string; expiresAt: string; createdAt: string };

function normalizeStatus(value: string | undefined) {
  if (value === 'done') return 'done';
  if (value === 'in_progress') return 'in_progress';
  if (value === 'waiting') return 'waiting';
  return 'todo';
}

function messageForInviteError(code: string) {
  if (code === 'ALREADY_A_MEMBER') return 'Esa persona ya forma parte del equipo.';
  if (code === 'SEAT_LIMIT_REACHED') return 'No quedan plazas disponibles en este espacio.';
  if (code === 'INVALID_EMAIL') return 'Introduce un email válido.';
  return 'No se ha podido crear la invitación.';
}

export default function TeamWorkPage({ seatLimit }: { organizationId: string; seatLimit: number }) {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [invitePending, setInvitePending] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: members = [] } = useQuery<TeamMember[]>({
    queryKey: ['organization-members'],
    queryFn: async () => {
      const response = await fetch('/api/organization-members');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'MEMBERS_REQUEST_FAILED');
      return data;
    },
    staleTime: 30_000
  });

  const { data: invitations = [] } = useQuery<Invitation[]>({
    queryKey: ['organization-invitations'],
    queryFn: async () => {
      const response = await fetch('/api/organization-invitations');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'INVITATIONS_REQUEST_FAILED');
      return data;
    },
    staleTime: 30_000
  });

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

  const membersWithWork = useMemo(() => {
    const map = new Map<
      string,
      { member: TeamMember; tasks: typeof tasks; events: typeof events }
    >();
    for (const member of members) map.set(member.id, { member, tasks: [], events: [] });

    for (const task of tasks) {
      if (task.assignee?.id && map.has(task.assignee.id))
        map.get(task.assignee.id)!.tasks.push(task);
    }
    for (const event of events) {
      if (event.assignee?.id && map.has(event.assignee.id))
        map.get(event.assignee.id)!.events.push(event);
    }

    return Array.from(map.values())
      .map(({ member, tasks, events }) => {
        const activeTasks = tasks.filter((task) => task.status !== 'done');
        const overdue = activeTasks.filter(
          (task) => task.dueAt && new Date(task.dueAt) < new Date()
        ).length;
        const today = activeTasks.filter((task) =>
          task.dueAt ? new Date(task.dueAt).toDateString() === new Date().toDateString() : false
        ).length;
        const blocked = activeTasks.filter((task) => task.status === 'waiting').length;
        return {
          ...member,
          tasks,
          events,
          taskCount: activeTasks.length,
          overdue,
          today,
          blocked,
          urgentCount: activeTasks.filter((task) => task.priority === 'high').length
        };
      })
      .sort((a, b) => b.taskCount - a.taskCount || a.member.name.localeCompare(b.member.name));
  }, [members, tasks, events]);

  const activeMember = useMemo(
    () =>
      membersWithWork.find((item) => item.member.id === selectedMember) ??
      membersWithWork[0] ??
      null,
    [membersWithWork, selectedMember]
  );

  async function invite() {
    setInvitePending(true);
    setInviteError('');
    setInviteUrl('');
    setCopied(false);
    try {
      const response = await fetch('/api/organization-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setInviteError(messageForInviteError(data.error));
        return;
      }
      setEmail('');
      setInviteUrl(data.inviteUrl);
      await queryClient.invalidateQueries({ queryKey: ['organization-invitations'] });
    } catch {
      setInviteError('No se ha podido crear la invitación.');
    } finally {
      setInvitePending(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  const usedSeats = members.length + invitations.length;
  const activeTasks = activeMember?.tasks.filter((task) => task.status !== 'done') ?? [];

  return (
    <div className='space-y-5'>
      <div className='rounded-[22px] border border-border/60 bg-card/60 p-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-primary'>
              Equipo
            </p>
            <h2 className='mt-1 text-base font-semibold'>Invitar a una persona</h2>
            <p className='text-muted-foreground mt-1 max-w-xl text-sm'>
              Comparte un enlace de acceso. La invitación reserva una plaza durante 7 días.
            </p>
          </div>
          <div className='text-sm text-muted-foreground'>
            {usedSeats}/{seatLimit} plazas ocupadas o reservadas
          </div>
        </div>
        <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
          <Input
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setInviteError('');
            }}
            placeholder='nombre@empresa.com'
            type='email'
            className='h-11 rounded-xl'
          />
          <Button
            onClick={() => void invite()}
            disabled={invitePending || !email.trim()}
            className='h-11 shrink-0'
          >
            {invitePending ? 'Creando…' : 'Crear invitación'}
          </Button>
        </div>
        {inviteError && <p className='text-destructive mt-2 text-sm'>{inviteError}</p>}
        {inviteUrl && (
          <div className='mt-3 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center'>
            <Input readOnly value={inviteUrl} className='h-10 bg-background' />
            <Button variant='outline' onClick={() => void copyInvite()} className='shrink-0'>
              {copied ? 'Copiado' : 'Copiar enlace'}
            </Button>
          </div>
        )}
      </div>

      <div className='rounded-[22px] border border-border/60 bg-card/60 p-3'>
        <div className='mb-3 flex items-center justify-between px-1'>
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-primary'>
              Personas
            </p>
            <h2 className='mt-1 text-base font-semibold'>Carga de trabajo</h2>
          </div>
          <span className='text-xs text-muted-foreground'>{members.length} miembros</span>
        </div>

        {membersWithWork.length === 0 ? (
          <p className='text-muted-foreground px-1 py-6 text-sm'>
            Todavía no hay más personas en este espacio.
          </p>
        ) : (
          <div className='grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]'>
            <div className='space-y-1.5'>
              {membersWithWork.map((item) => {
                const selected = item.member.id === activeMember?.member.id;
                return (
                  <button
                    key={item.member.id}
                    type='button'
                    onClick={() => setSelectedMember(item.member.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 rounded-xl border px-3 py-3 text-left transition-all',
                      selected
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/60 bg-background/40 hover:bg-muted/30'
                    )}
                  >
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{item.member.name}</span>
                        {item.member.role === 'owner' && (
                          <Badge variant='secondary' className='h-5 px-1.5 text-[10px]'>
                            Propietario
                          </Badge>
                        )}
                      </div>
                      <p className='text-muted-foreground mt-1 truncate text-xs'>
                        {item.member.email}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {item.taskCount} tareas · {item.events.length} eventos
                      </p>
                    </div>
                    <Icons.chevronRight className='size-4 shrink-0 text-muted-foreground' />
                  </button>
                );
              })}
            </div>

            <div className='rounded-[18px] border border-border/60 bg-background/40 p-4'>
              {activeMember ? (
                <>
                  <div className='mb-3 flex items-center justify-between gap-3'>
                    <div>
                      <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-primary'>
                        Contexto
                      </p>
                      <h3 className='mt-1 font-semibold'>{activeMember.member.name}</h3>
                    </div>
                    <Link
                      href={`/dashboard/tasks?assigneeId=${activeMember.member.id}`}
                      className='text-sm text-primary'
                    >
                      Ver trabajo
                    </Link>
                  </div>
                  <div className='mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground'>
                    <span className='rounded-full border border-border/60 bg-background px-2.5 py-1'>
                      {activeMember.taskCount} tareas · {activeMember.today} hoy
                    </span>
                    {activeMember.overdue > 0 && (
                      <span className='rounded-full border border-border bg-muted px-2.5 py-1'>
                        {activeMember.overdue} vencida{activeMember.overdue > 1 ? 's' : ''}
                      </span>
                    )}
                    {activeMember.blocked > 0 && (
                      <span className='rounded-full border border-primary/30 bg-accent px-2.5 py-1'>
                        {activeMember.blocked} pendientes
                      </span>
                    )}
                  </div>
                  {activeTasks.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>
                      No hay tareas pendientes para esta persona.
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {activeTasks.slice(0, 8).map((task) => (
                        <div
                          key={task.id}
                          className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3'
                        >
                          <span
                            className={cn(
                              'size-2.5 rounded-full',
                              normalizeStatus(task.status) === 'done' && 'bg-primary',
                              normalizeStatus(task.status) === 'in_progress' &&
                                'bg-accent-foreground',
                              normalizeStatus(task.status) === 'waiting' && 'bg-muted-foreground',
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
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Selecciona una persona para ver su trabajo.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className='rounded-[22px] border border-border/60 bg-card/60 p-5'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-primary'>
                Pendientes
              </p>
              <h2 className='mt-1 text-base font-semibold'>Invitaciones</h2>
            </div>
            <span className='text-xs text-muted-foreground'>{invitations.length}</span>
          </div>
          <div className='mt-3 space-y-2'>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className='flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between'
              >
                <div>
                  <p className='text-sm font-medium'>{invitation.email}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    Invitación pendiente · vence el{' '}
                    {new Date(invitation.expiresAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <Badge variant='outline'>Pendiente</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
