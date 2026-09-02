'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { getTasks, taskKeys } from '@/features/tasks/queries';
import { getEvents, eventKeys } from '@/features/calendar/queries';
import { activityKeys, getCustomerActivities } from '@/features/activities/queries';
import type { Activity } from '@/features/activities/types';
import { AddNoteDialog } from '@/features/activities/components/add-note-dialog';
import NewTaskDialog from '@/features/kanban/components/new-task-dialog';
import { EventDialog } from '@/features/calendar/components/event-dialog';

type Customer = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  archived: boolean;
};

export function CustomerInspector({
  customerId,
  open,
  onOpenChange
}: {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const customerQuery = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el cliente.');
      return (await response.json()) as Customer;
    },
    enabled: open && Boolean(customerId)
  });
  const tasksQuery = useQuery({
    queryKey: taskKeys.list({ customerId: customerId ?? undefined }),
    queryFn: () => getTasks({ customerId: customerId! }),
    enabled: open && Boolean(customerId)
  });
  const eventsQuery = useQuery({
    queryKey: eventKeys.list({ customerId: customerId ?? undefined }),
    queryFn: () => getEvents({ customerId: customerId! }),
    enabled: open && Boolean(customerId)
  });
  const activitiesQuery = useQuery({
    queryKey: activityKeys.customer(customerId ?? ''),
    queryFn: () => getCustomerActivities(customerId!),
    enabled: open && Boolean(customerId)
  });
  const customer = customerQuery.data;
  const tasks = tasksQuery.data ?? [];
  const events = (eventsQuery.data ?? []).filter((event) => new Date(event.endAt) >= new Date());

  const saveName = async (name: string) => {
    if (!customer || !name.trim() || name.trim() === customer.name) return;
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: customer.kind,
          name: name.trim(),
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          nextAction: customer.nextAction || '',
          nextActionAt: customer.nextActionAt ? customer.nextActionAt.slice(0, 10) : ''
        })
      });
      if (!response.ok) throw new Error('No se pudo actualizar el cliente.');
      await queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Cliente actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el cliente.');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side='right' className='w-full gap-0 overflow-y-auto p-0 sm:max-w-[500px]'>
          {customerQuery.isPending ? (
            <div className='space-y-4 p-5'>
              <div className='bg-muted h-8 w-2/3 animate-pulse rounded' />
              <div className='bg-muted h-24 animate-pulse rounded-2xl' />
              <div className='bg-muted h-32 animate-pulse rounded-2xl' />
            </div>
          ) : customerQuery.isError || !customer ? (
            <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-center'>
              <p className='text-destructive text-sm'>No se pudo cargar el contexto.</p>
              <Button variant='outline' size='sm' onClick={() => void customerQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <SheetHeader className='border-b border-border/60 p-5 pb-4'>
                <div className='flex items-start gap-3'>
                  <span className='bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold'>
                    {customer.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <SheetTitle className='sr-only'>Inspector del cliente</SheetTitle>
                    <Input
                      defaultValue={customer.name}
                      key={customer.id + customer.name}
                      onBlur={(event) => void saveName(event.target.value)}
                      aria-label='Nombre del cliente'
                      className='h-9 border-transparent bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:border-border focus-visible:bg-muted/30 focus-visible:px-2'
                    />
                    <SheetDescription className='mt-1 flex items-center gap-2'>
                      {customer.kind === 'person' ? 'Persona' : 'Empresa'}
                      <Badge variant={customer.archived ? 'destructive' : 'secondary'}>
                        {customer.archived ? 'Archivado' : 'Activo'}
                      </Badge>
                    </SheetDescription>
                  </div>
                </div>
                <div className='flex flex-wrap gap-2 pt-2'>
                  <AddNoteDialog customerId={customer.id} />
                  <NewTaskDialog customerId={customer.id} />
                  <Button size='sm' onClick={() => setEventDialogOpen(true)}>
                    <Icons.calendar data-icon='inline-start' /> Evento
                  </Button>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className='text-primary inline-flex items-center gap-1 px-2 text-sm hover:underline'
                    >
                      <Icons.phone className='size-4' /> Llamar
                    </a>
                  )}
                </div>
              </SheetHeader>
              <div className='space-y-6 p-5'>
                <section className='grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60'>
                  <Detail label='Correo' value={customer.email || 'Sin correo'} />
                  <Detail label='Teléfono' value={customer.phone || 'Sin teléfono'} />
                  <Detail label='Responsable' value='Espacio actual' />
                  <Detail label='Próximo paso' value={customer.nextAction || 'Sin definir'} />
                </section>
                <section className='space-y-3'>
                  <SectionTitle title='Próximos eventos' href='/dashboard/calendar' />
                  {eventsQuery.isPending ? (
                    <LoadingLine />
                  ) : events.length === 0 ? (
                    <Empty text='No hay eventos próximos.' />
                  ) : (
                    events.slice(0, 4).map((event) => (
                      <Link
                        key={event.id}
                        href={`/dashboard/calendar?event=${event.id}`}
                        className='flex items-center gap-3 rounded-2xl border border-border/50 px-3 py-3 hover:bg-muted/40'
                      >
                        <Icons.calendar className='text-primary size-4' />
                        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                          {event.title}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {format(new Date(event.startAt), 'd MMM · HH:mm', { locale: es })}
                        </span>
                      </Link>
                    ))
                  )}
                </section>
                <Separator />
                <section className='space-y-3'>
                  <SectionTitle title='Tareas abiertas' href='/dashboard/tasks' />
                  {tasksQuery.isPending ? (
                    <LoadingLine />
                  ) : (
                    tasks
                      .filter((task) => task.status !== 'done')
                      .slice(0, 5)
                      .map((task) => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks?task=${task.id}`}
                          className='flex items-center gap-3 rounded-2xl border border-border/50 px-3 py-3 hover:bg-muted/40'
                        >
                          <span className='bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full'>
                            <Icons.check className='size-4' />
                          </span>
                          <span className='min-w-0 flex-1 truncate text-sm'>{task.title}</span>
                          <span className='text-muted-foreground text-xs'>{task.priority}</span>
                        </Link>
                      ))
                  )}
                  {!tasksQuery.isPending &&
                    tasks.filter((task) => task.status !== 'done').length === 0 && (
                      <Empty text='No hay tareas pendientes.' />
                    )}
                </section>
                <Separator />
                <section className='space-y-3'>
                  <SectionTitle title='Actividad' href='/dashboard/activity' />
                  {activitiesQuery.isPending ? (
                    <LoadingLine />
                  ) : (
                    <div className='space-y-4'>
                      {(activitiesQuery.data ?? []).slice(0, 6).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                  {!activitiesQuery.isPending && activitiesQuery.data?.length === 0 && (
                    <Empty text='Todavía no hay actividad.' />
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {customer && (
        <EventDialog
          open={eventDialogOpen}
          initialCustomerId={customer.id}
          onOpenChange={setEventDialogOpen}
        />
      )}
    </>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className='flex items-center justify-between'>
      <h3 className='text-sm font-semibold'>{title}</h3>
      <Link className='text-primary text-xs hover:underline' href={href}>
        Ver todo
      </Link>
    </div>
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

function ActivityItem({ activity }: { activity: Activity }) {
  const date = new Date(activity.createdAt);
  const day = isToday(date)
    ? 'Hoy'
    : isYesterday(date)
      ? 'Ayer'
      : format(date, 'd MMM', { locale: es });
  return (
    <div className='flex gap-3'>
      <span className='bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full'>
        <Icons.pulse className='size-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <div className='flex items-baseline justify-between gap-2'>
          <p className='truncate text-sm font-medium'>{activity.title}</p>
          <time className='text-muted-foreground shrink-0 text-xs'>
            {day} · {format(date, 'HH:mm')}
          </time>
        </div>
        {activity.content && (
          <p className='text-muted-foreground mt-1 text-sm'>{activity.content}</p>
        )}
      </div>
    </div>
  );
}

function LoadingLine() {
  return <div className='bg-muted h-14 animate-pulse rounded-2xl' />;
}

function Empty({ text }: { text: string }) {
  return <p className='text-muted-foreground text-sm'>{text}</p>;
}
