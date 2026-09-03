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
import { CustomerLifecycleActions } from './customer-lifecycle-actions';

type Customer = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  archived: boolean;
  owner: { id: string; name: string } | null;
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
  const [contact, setContact] = useState({
    email: '',
    phone: '',
    address: '',
    website: '',
    nextAction: '',
    nextActionAt: ''
  });
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

  useEffect(() => {
    if (!customer) return;
    setContact({
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      website: customer.website ?? '',
      nextAction: customer.nextAction ?? '',
      nextActionAt: customer.nextActionAt ? customer.nextActionAt.slice(0, 10) : ''
    });
  }, [customer]);

  const saveContact = async (patch: Partial<typeof contact>) => {
    if (!customer) return;
    const next = { ...contact, ...patch };
    setContact(next);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: customer.kind, name: customer.name, ...next })
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
          website: customer.website || '',
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

  const createFollowUp = async (type: 'task' | 'event') => {
    if (!customer) return;

    try {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      if (type === 'task') {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Seguimiento · ${customer.name}`,
            description: customer.nextAction || 'Seguimiento del cliente',
            dueAt: start.toISOString(),
            customerId: customer.id,
            priority: 'medium'
          })
        });
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
        toast.success('Tarea de seguimiento creada');
      } else {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Seguimiento · ${customer.name}`,
            description: customer.nextAction || 'Seguimiento del cliente',
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            customerId: customer.id,
            status: 'planned'
          })
        });
        await queryClient.invalidateQueries({ queryKey: eventKeys.all });
        toast.success('Evento de seguimiento creado');
      }

      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el seguimiento.');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side='right'
          className='w-full gap-0 overflow-hidden border-l border-border/50 bg-muted/[0.18] p-0 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] sm:max-w-xl'
        >
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
              <SheetHeader className='shrink-0 border-b border-border/50 bg-background/95 p-5 pb-4 sm:p-6 sm:pb-5'>
                <div className='flex items-start gap-4'>
                  <span className='bg-primary/10 text-primary ring-primary/10 flex size-14 shrink-0 items-center justify-center rounded-[20px] text-base font-semibold ring-4'>
                    {customer.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <SheetTitle className='sr-only'>Inspector del cliente</SheetTitle>
                    <Input
                      defaultValue={customer.name}
                      key={customer.id + customer.name}
                      onBlur={(event) => void saveName(event.target.value)}
                      aria-label='Nombre del cliente'
                      className='h-10 border-transparent bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none transition-[background-color,padding] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:border-transparent focus-visible:bg-muted/35 focus-visible:px-2 focus-visible:ring-0'
                    />
                    <SheetDescription className='mt-1.5 flex items-center gap-2 text-sm'>
                      {customer.kind === 'person' ? 'Persona' : 'Empresa'}
                      <Badge variant={customer.archived ? 'destructive' : 'secondary'}>
                        {customer.archived ? 'Archivado' : 'Activo'}
                      </Badge>
                    </SheetDescription>
                  </div>
                </div>
                <div className='mt-5 space-y-3 border-t border-border/50 pt-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Button
                      size='sm'
                      onClick={() => setEventDialogOpen(true)}
                      className='rounded-xl px-3.5 shadow-[0_6px_16px_-8px_rgba(15,23,42,0.45)]'
                    >
                      <Icons.calendar data-icon='inline-start' /> Nuevo evento
                    </Button>
                    <AddNoteDialog customerId={customer.id} />
                    <NewTaskDialog customerId={customer.id} />
                    <Button size='sm' variant='outline' onClick={() => void createFollowUp('task')}>
                      <Icons.check data-icon='inline-start' /> Seguimiento
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => void createFollowUp('event')}
                    >
                      <Icons.calendar data-icon='inline-start' /> Reunión
                    </Button>
                    <CustomerLifecycleActions
                      customerId={customer.id}
                      archived={customer.archived}
                      onCompleted={(action) => {
                        if (action === 'deleted' || action === 'archived') onOpenChange(false);
                      }}
                    />
                  </div>
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/40 pt-3'>
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className='text-primary inline-flex items-center gap-1 px-2 text-sm hover:underline'
                      >
                        <Icons.phone className='size-4' /> Llamar
                      </a>
                    )}
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className='text-primary inline-flex items-center gap-1 px-2 text-sm hover:underline'
                      >
                        <Icons.send className='size-4' /> Email
                      </a>
                    )}
                    {customer.website && (
                      <a
                        href={customer.website}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary inline-flex items-center gap-1 px-2 text-sm hover:underline'
                      >
                        <Icons.externalLink className='size-4' /> Web
                      </a>
                    )}
                  </div>
                </div>
              </SheetHeader>
              <div className='min-h-0 flex-1 space-y-7 overflow-y-auto p-4 sm:p-6'>
                <section className='overflow-hidden rounded-[22px] border border-border/50 bg-background/80 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.5)]'>
                  <div className='border-b border-border/50 px-4 py-3'>
                    <p className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                      Resumen
                    </p>
                  </div>
                  <div className='grid grid-cols-2 gap-px bg-border/50'>
                    <EditableDetail
                      label='Correo'
                      value={contact.email}
                      placeholder='Sin correo'
                      onChange={(value) => setContact((current) => ({ ...current, email: value }))}
                      onBlur={(value) => void saveContact({ email: value })}
                      type='email'
                    />
                    <EditableDetail
                      label='Teléfono'
                      value={contact.phone}
                      placeholder='Sin teléfono'
                      onChange={(value) => setContact((current) => ({ ...current, phone: value }))}
                      onBlur={(value) => void saveContact({ phone: value })}
                    />
                    <Detail label='Responsable' value={customer.owner?.name || 'Sin asignar'} />
                    <EditableDetail
                      label='Próximo paso'
                      value={contact.nextAction}
                      placeholder='Sin definir'
                      onChange={(value) =>
                        setContact((current) => ({ ...current, nextAction: value }))
                      }
                      onBlur={(value) => void saveContact({ nextAction: value })}
                    />
                  </div>
                </section>
                <section className='space-y-3 rounded-[22px] border border-border/50 bg-background/65 p-4'>
                  <EditableDetail
                    label='Dirección'
                    value={contact.address}
                    placeholder='Sin dirección'
                    onChange={(value) => setContact((current) => ({ ...current, address: value }))}
                    onBlur={(value) => void saveContact({ address: value })}
                  />
                  <EditableDetail
                    label='Web'
                    value={contact.website}
                    placeholder='Sin web'
                    onChange={(value) => setContact((current) => ({ ...current, website: value }))}
                    onBlur={(value) => void saveContact({ website: value })}
                    type='url'
                  />
                  <div className='flex items-center gap-2'>
                    <Input
                      type='date'
                      aria-label='Fecha de próxima acción'
                      value={contact.nextActionAt}
                      onChange={(event) =>
                        setContact((current) => ({ ...current, nextActionAt: event.target.value }))
                      }
                      onBlur={() => void saveContact({ nextActionAt: contact.nextActionAt })}
                      className='h-9 max-w-44'
                    />
                  </div>
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
                        className='group flex items-center gap-3 rounded-2xl border border-border/50 bg-background/60 px-3.5 py-3.5 transition-[background-color,transform,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px hover:border-primary/20 hover:bg-background'
                      >
                        <Icons.calendar className='text-primary size-4' />
                        <span className='min-w-0 flex-1 truncate text-sm font-medium transition-colors group-hover:text-primary'>
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
                          className='group flex items-center gap-3 rounded-2xl border border-border/50 bg-background/60 px-3.5 py-3.5 transition-[background-color,transform,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px hover:border-primary/20 hover:bg-background'
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

function EditableDetail({
  label,
  value,
  placeholder,
  onChange,
  onBlur,
  type = 'text'
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  type?: string;
}) {
  return (
    <label className='bg-background p-3'>
      <span className='text-muted-foreground block text-[11px]'>{label}</span>
      <input
        type={type}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(event.target.value)}
        className='mt-1 w-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70'
      />
    </label>
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
