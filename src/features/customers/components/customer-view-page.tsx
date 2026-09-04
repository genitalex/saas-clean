'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTasks, taskKeys, updateTask } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';
import { getEvents, eventKeys } from '@/features/calendar/queries';
import type { Event } from '@/features/calendar/types';
import { activityKeys, getCustomerActivities } from '@/features/activities/queries';
import type { Activity } from '@/features/activities/types';
import { AddNoteDialog } from '@/features/activities/components/add-note-dialog';
import NewTaskDialog from '@/features/kanban/components/new-task-dialog';
import { EventDialog } from '@/features/calendar/components/event-dialog';
import { useState } from 'react';
import { CustomerLifecycleActions } from './customer-lifecycle-actions';

type Customer = {
  id: string;
  name: string;
  kind: 'person' | 'company';
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  archived: boolean;
};

export default function CustomerViewPage({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const customerQuery = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`, { cache: 'no-store' });
      if (response.status === 404) notFound();
      if (!response.ok) throw new Error('Customer request failed');
      return (await response.json()) as Customer;
    }
  });
  const tasksQuery = useQuery({
    queryKey: taskKeys.list({ customerId }),
    queryFn: () => getTasks({ customerId })
  });
  const eventsQuery = useQuery({
    queryKey: eventKeys.list({ customerId }),
    queryFn: () => getEvents({ customerId })
  });
  const activitiesQuery = useQuery({
    queryKey: activityKeys.customer(customerId),
    queryFn: () => getCustomerActivities(customerId)
  });

  if (customerQuery.isPending)
    return <div className='bg-muted m-4 h-64 animate-pulse rounded-xl md:m-6' />;
  if (customerQuery.isError || !customerQuery.data)
    return <p className='text-destructive p-6 text-sm'>No se pudo cargar el cliente.</p>;
  const customer = customerQuery.data;
  const tasks = tasksQuery.data ?? [];
  const upcomingEvents = (eventsQuery.data ?? []).filter(
    (event) => new Date(event.endAt) >= new Date()
  );

  async function completeTask(task: Task) {
    try {
      await updateTask(task.id, { status: 'done' });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.customer(customerId) });
      toast.success('Tarea completada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la tarea.');
    }
  }

  return (
    <div className='flex flex-col gap-6 py-2'>
      <header className='flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='bg-secondary text-secondary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
            {customer.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-2xl font-semibold'>{customer.name}</h1>
              <Badge variant='outline'>{customer.archived ? 'Archivado' : 'Activo'}</Badge>
            </div>
            <p className='text-muted-foreground mt-1 capitalize'>
              {customer.kind === 'person' ? 'Persona' : 'Empresa'}
            </p>
            <div className='text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
              {customer.email && (
                <a className='text-primary hover:underline' href={`mailto:${customer.email}`}>
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a className='text-primary hover:underline' href={`tel:${customer.phone}`}>
                  {customer.phone}
                </a>
              )}
              {customer.website && (
                <a
                  className='text-primary hover:underline'
                  href={customer.website}
                  target='_blank'
                  rel='noreferrer'
                >
                  Web
                </a>
              )}
            </div>
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <CustomerLifecycleActions
            customerId={customer.id}
            archived={customer.archived}
            onCompleted={(action) => {
              if (action === 'deleted') window.location.href = '/dashboard/customers';
            }}
          />
          <Button
            variant='outline'
            size='sm'
            type='button'
            disabled
            title='Edición disponible próximamente'
          >
            Editar
          </Button>
          <AddNoteDialog customerId={customerId} />
          <NewTaskDialog customerId={customerId} />
          <Button
            variant='outline'
            size='sm'
            type='button'
            onClick={() => setEventDialogOpen(true)}
          >
            <Icons.add data-icon='inline-start' /> Evento
          </Button>
        </div>
      </header>

      {customer.nextAction && (
        <Card className='border-primary/20 bg-primary/[0.03]'>
          <CardContent className='flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>Próximo paso</p>
              <p className='mt-1 font-medium'>{customer.nextAction}</p>
            </div>
            {customer.nextActionAt && (
              <time className='text-muted-foreground text-sm'>
                {new Date(customer.nextActionAt).toLocaleDateString()}
              </time>
            )}
          </CardContent>
        </Card>
      )}

      {(customer.address || customer.website) && (
        <div className='flex flex-wrap gap-x-5 gap-y-2 border-y border-border/60 py-3 text-sm'>
          {customer.address && <span className='text-muted-foreground'>{customer.address}</span>}
          {customer.website && (
            <a
              className='text-primary hover:underline'
              href={customer.website}
              target='_blank'
              rel='noreferrer'
            >
              {customer.website}
            </a>
          )}
        </div>
      )}

      <div className='grid gap-4 lg:grid-cols-[1.15fr_0.85fr]'>
        <ActivityTimeline
          activities={activitiesQuery.data ?? []}
          loading={activitiesQuery.isPending}
        />
        <div className='flex flex-col gap-4'>
          <TasksSection tasks={tasks} loading={tasksQuery.isPending} onComplete={completeTask} />
          <EventsSection events={upcomingEvents} loading={eventsQuery.isPending} />
        </div>
      </div>
      <EventDialog
        open={eventDialogOpen}
        initialCustomerId={customerId}
        onOpenChange={setEventDialogOpen}
      />
    </div>
  );
}

function ActivityTimeline({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  return (
    <Card className='border-0 bg-card/35 shadow-none'>
      <CardHeader className='border-b'>
        <CardTitle className='text-base'>Actividad</CardTitle>
      </CardHeader>
      <CardContent className='pt-5'>
        {loading ? (
          <div className='bg-muted h-32 animate-pulse rounded-lg' />
        ) : activities.length === 0 ? (
          <EmptyState
            title='Aún no hay actividad'
            text='Las notas y acciones sobre este cliente aparecerán aquí.'
          />
        ) : (
          <div className='flex flex-col gap-5'>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const date = new Date(activity.createdAt);
  const day = isToday(date)
    ? 'Hoy'
    : isYesterday(date)
      ? 'Ayer'
      : format(date, 'd MMM', { locale: es });
  const icon =
    activity.type === 'note' ? (
      <Icons.edit />
    ) : activity.type === 'system' ? (
      <Icons.sparkles />
    ) : activity.type === 'call' ? (
      <Icons.phone />
    ) : activity.type === 'email' ? (
      <Icons.send />
    ) : (
      <Icons.check />
    );
  return (
    <div className='flex gap-3'>
      <span className='bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full'>
        {icon}
      </span>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <p className='text-sm font-medium'>{activity.title}</p>
          <time className='text-muted-foreground text-xs'>
            {day} · {format(date, 'HH:mm')}
          </time>
        </div>
        {activity.content && (
          <p className='text-muted-foreground mt-1 text-sm'>{activity.content}</p>
        )}
        {activity.user && (
          <p className='text-muted-foreground mt-1 text-xs'>{activity.user.name}</p>
        )}
      </div>
    </div>
  );
}

function TasksSection({
  tasks,
  loading,
  onComplete
}: {
  tasks: Task[];
  loading: boolean;
  onComplete: (task: Task) => void;
}) {
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between border-b'>
        <CardTitle className='text-base'>Tareas</CardTitle>
        <Link className='text-primary text-xs hover:underline' href='/dashboard/my-work?mode=list'>
          Ver tareas
        </Link>
      </CardHeader>
      <CardContent className='pt-3'>
        {loading ? (
          <div className='bg-muted h-24 animate-pulse rounded-lg' />
        ) : tasks.length === 0 ? (
          <EmptyState title='No hay tareas pendientes' />
        ) : (
          <div className='flex flex-col'>
            {tasks.map((task) => (
              <div key={task.id} className='flex items-center gap-3 border-b py-3 last:border-0'>
                <button
                  type='button'
                  aria-label={`Completar ${task.title}`}
                  className='border-input hover:border-primary flex size-4 shrink-0 items-center justify-center rounded border'
                  onClick={() => void onComplete(task)}
                >
                  {task.status === 'done' && <Icons.check />}
                </button>
                <Link
                  href={`/dashboard/my-work?mode=list&task=${task.id}`}
                  className={`min-w-0 flex-1 truncate text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}
                >
                  {task.title}
                </Link>
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Sin fecha'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventsSection({ events, loading }: { events: Event[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between border-b'>
        <CardTitle className='text-base'>Próximos eventos</CardTitle>
        <Link className='text-primary text-xs hover:underline' href='/dashboard/calendar'>
          Ver calendario
        </Link>
      </CardHeader>
      <CardContent className='pt-3'>
        {loading ? (
          <div className='bg-muted h-24 animate-pulse rounded-lg' />
        ) : events.length === 0 ? (
          <EmptyState title='No hay próximos eventos' />
        ) : (
          <div className='flex flex-col'>
            {events.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                href='/dashboard/calendar'
                className='flex items-center gap-3 border-b py-3 last:border-0'
              >
                <span className='bg-primary/10 text-primary flex size-9 shrink-0 flex-col items-center justify-center rounded-md text-[10px] font-semibold'>
                  <span>{format(new Date(event.startAt), 'd')}</span>
                  <span>{format(new Date(event.startAt), 'MMM', { locale: es })}</span>
                </span>
                <span className='min-w-0 flex-1 truncate text-sm font-medium'>{event.title}</span>
                <span className='text-muted-foreground text-xs'>
                  {event.allDay ? 'Todo el día' : format(new Date(event.startAt), 'HH:mm')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className='text-muted-foreground py-5 text-center text-sm'>
      <p className='font-medium text-foreground'>{title}</p>
      {text && <p className='mt-1'>{text}</p>}
    </div>
  );
}
