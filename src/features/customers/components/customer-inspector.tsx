'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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

    const currentValues: typeof contact = {
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      website: customer.website ?? '',
      nextAction: customer.nextAction ?? '',
      nextActionAt: customer.nextActionAt ? customer.nextActionAt.slice(0, 10) : ''
    };
    const hasChanges = Object.entries(patch).some(([key, value]) => {
      const field = key as keyof typeof currentValues;
      return String(value ?? '') !== String(currentValues[field] ?? '');
    });

    if (!hasChanges) {
      return;
    }

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='grid max-h-[calc(100dvh-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[24px] border-border/50 bg-background p-0 shadow-[0_28px_80px_-42px_rgba(23,32,25,0.42)] sm:max-w-225'>
          {customerQuery.isPending ? (
            <div className='space-y-4 p-5 sm:p-7'>
              <div className='flex items-center gap-4'>
                <div className='h-12 w-12 animate-pulse rounded-[16px] bg-muted' />
                <div className='space-y-2'>
                  <div className='h-6 w-56 animate-pulse rounded bg-muted' />
                  <div className='h-4 w-32 animate-pulse rounded bg-muted' />
                </div>
              </div>
              <div className='h-24 animate-pulse rounded-[18px] bg-muted' />
              <div className='h-48 animate-pulse rounded-[18px] bg-muted' />
            </div>
          ) : customerQuery.isError || !customer ? (
            <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-center'>
              <p className='text-sm text-destructive'>No se pudo cargar el contexto.</p>
              <Button variant='outline' size='sm' onClick={() => void customerQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className='shrink-0 border-b border-border/50 bg-background px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5'>
                <DialogTitle className='sr-only'>Cliente {customer.name}</DialogTitle>
                <DialogDescription className='sr-only'>
                  Contexto y acciones del cliente
                </DialogDescription>

                <div className='flex items-start gap-3 sm:gap-4'>
                  <div className='relative shrink-0'>
                    <span className='flex size-12 items-center justify-center rounded-[16px] bg-primary/[0.10] text-sm font-semibold text-primary ring-1 ring-primary/[0.12] sm:size-14 sm:rounded-[18px] sm:text-base'>
                      {customer.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background',
                        customer.archived ? 'bg-muted-foreground' : 'bg-primary'
                      )}
                    />
                  </div>

                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start gap-2 pr-8'>
                      <Input
                        defaultValue={customer.name}
                        key={customer.id + customer.name}
                        onBlur={(event) => void saveName(event.target.value)}
                        aria-label='Nombre del cliente'
                        className='h-9 min-w-0 border-transparent bg-transparent px-0 text-[1.25rem] font-semibold tracking-[-0.02em] shadow-none transition-[background-color,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:border-transparent focus-visible:bg-muted/40 focus-visible:px-2 focus-visible:ring-0 sm:h-10 sm:text-[1.55rem]'
                      />
                    </div>
                    <div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
                      <span>{customer.kind === 'person' ? 'Persona' : 'Empresa'}</span>
                      <span className='text-border'>·</span>
                      <Badge
                        variant='secondary'
                        className='h-6 rounded-full bg-muted/65 px-2.5 text-[11px] font-medium text-muted-foreground'
                      >
                        {customer.archived ? 'Archivado' : 'Activo'}
                      </Badge>
                      {customer.owner?.name ? (
                        <>
                          <span className='hidden text-border sm:inline'>·</span>
                          <span className='hidden sm:inline'>
                            Responsable {customer.owner.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className='mt-4 flex flex-wrap items-center gap-2'>
                  <div className='flex items-center rounded-[13px] border border-border/55 bg-background p-0.5 shadow-[0_1px_1px_rgba(23,32,25,0.02)]'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => setEventDialogOpen(true)}
                      className='group h-8 rounded-[10px] px-2.5 text-xs font-medium shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 active:scale-[0.98] sm:px-3'
                    >
                      <Icons.calendar className='size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px' />
                      <span className='sm:inline'>Nuevo evento</span>
                    </Button>
                    <AddNoteDialog
                      customerId={customer.id}
                      triggerClassName='h-8 rounded-[10px] px-2.5 text-xs font-medium shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 active:scale-[0.98] sm:px-3'
                      triggerIcon={<Icons.post className='size-3.5' />}
                    />
                    <NewTaskDialog
                      customerId={customer.id}
                      triggerClassName='h-8 rounded-[10px] px-2.5 text-xs font-medium shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 active:scale-[0.98] sm:px-3'
                      triggerIcon={<Icons.check className='size-3.5' />}
                    />
                  </div>

                  <div className='flex items-center rounded-[13px] border border-border/45 bg-muted/25 p-0.5'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => void createFollowUp('task')}
                      className='h-8 rounded-[10px] px-2.5 text-xs shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-background/85 active:scale-[0.98] sm:px-3'
                    >
                      <Icons.check className='size-3.5' /> <span>Seguimiento</span>
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => void createFollowUp('event')}
                      className='h-8 rounded-[10px] px-2.5 text-xs shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-background/85 active:scale-[0.98] sm:px-3'
                    >
                      <Icons.calendar className='size-3.5' /> <span>Reunión</span>
                    </Button>
                  </div>

                  <div className='ml-auto flex items-center gap-1 rounded-[13px] border border-border/45 bg-background p-0.5'>
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        aria-label='Llamar al cliente'
                        className='inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground transition-[background-color,transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 hover:text-foreground active:scale-[0.96]'
                      >
                        <Icons.phone className='size-3.5' />
                      </a>
                    )}
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        aria-label='Enviar email al cliente'
                        className='inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground transition-[background-color,transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 hover:text-foreground active:scale-[0.96]'
                      >
                        <Icons.send className='size-3.5' />
                      </a>
                    )}
                    {customer.website && (
                      <a
                        href={customer.website}
                        target='_blank'
                        rel='noreferrer'
                        aria-label='Abrir sitio web'
                        className='inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground transition-[background-color,transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 hover:text-foreground active:scale-[0.96]'
                      >
                        <Icons.externalLink className='size-3.5' />
                      </a>
                    )}
                    <CustomerLifecycleActions
                      customerId={customer.id}
                      archived={customer.archived}
                      triggerClassName='h-8 w-8 rounded-[10px] border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-muted/65 hover:text-foreground active:scale-[0.96]'
                      onCompleted={(action) => {
                        if (action === 'deleted' || action === 'archived') onOpenChange(false);
                      }}
                    />
                  </div>
                </div>
              </DialogHeader>

              <div className='min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5'>
                <div className='space-y-4'>
                  <section className='rounded-[18px] border border-border/45 bg-muted/[0.18] p-1'>
                    <div className='rounded-[15px] bg-background px-4 py-4 sm:px-5'>
                      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='min-w-0'>
                          <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                            Próximo paso
                          </p>
                          <div className='mt-2 flex min-w-0 items-center gap-2'>
                            <span className='flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.10] text-primary'>
                              <Icons.check className='size-4' />
                            </span>
                            <p className='min-w-0 truncate text-sm font-medium sm:text-base'>
                              {contact.nextAction || 'Sin definir'}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground sm:justify-end'>
                          <span className='hidden sm:inline'>Programado</span>
                          <span className='rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-foreground'>
                            {contact.nextActionAt
                              ? format(new Date(`${contact.nextActionAt}T00:00:00`), 'd MMM yyyy', {
                                  locale: es
                                })
                              : 'Sin fecha'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className='grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]'>
                    <section className='rounded-[18px] border border-border/45 bg-background'>
                      <div className='border-b border-border/40 px-4 py-3.5 sm:px-5'>
                        <div className='flex items-center justify-between gap-3'>
                          <div>
                            <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                              Contacto
                            </p>
                            <p className='mt-1 text-xs text-muted-foreground'>
                              Datos rápidos y editables
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className='divide-y divide-border/35'>
                        <EditableDetail
                          label='Correo'
                          value={contact.email}
                          placeholder='Sin correo'
                          onChange={(value) =>
                            setContact((current) => ({ ...current, email: value }))
                          }
                          onBlur={(value) => void saveContact({ email: value })}
                          type='email'
                          className='block bg-transparent px-4 py-3.5 sm:px-5'
                        />
                        <EditableDetail
                          label='Teléfono'
                          value={contact.phone}
                          placeholder='Sin teléfono'
                          onChange={(value) =>
                            setContact((current) => ({ ...current, phone: value }))
                          }
                          onBlur={(value) => void saveContact({ phone: value })}
                          className='block bg-transparent px-4 py-3.5 sm:px-5'
                        />
                        <EditableDetail
                          label='Dirección'
                          value={contact.address}
                          placeholder='Sin dirección'
                          onChange={(value) =>
                            setContact((current) => ({ ...current, address: value }))
                          }
                          onBlur={(value) => void saveContact({ address: value })}
                          className='block bg-transparent px-4 py-3.5 sm:px-5'
                        />
                        <EditableDetail
                          label='Sitio web'
                          value={contact.website}
                          placeholder='Sin sitio web'
                          onChange={(value) =>
                            setContact((current) => ({ ...current, website: value }))
                          }
                          onBlur={(value) => void saveContact({ website: value })}
                          type='url'
                          className='block bg-transparent px-4 py-3.5 sm:px-5'
                        />
                        <div className='px-4 py-3.5 sm:px-5'>
                          <span className='text-[11px] font-normal text-muted-foreground'>
                            Fecha del próximo paso
                          </span>
                          <CustomerDatePicker
                            value={contact.nextActionAt}
                            onChange={(value) => {
                              setContact((current) => ({ ...current, nextActionAt: value }));
                              void saveContact({ nextActionAt: value });
                            }}
                          />
                        </div>
                      </div>
                    </section>

                    <div className='space-y-4'>
                      <section className='rounded-[18px] border border-border/45 bg-background'>
                        <div className='border-b border-border/40 px-4 py-3.5 sm:px-5'>
                          <div className='flex items-center justify-between gap-3'>
                            <div>
                              <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                Actividad reciente
                              </p>
                              <p className='mt-1 text-xs text-muted-foreground'>
                                Qué ha pasado con este cliente
                              </p>
                            </div>
                            <Link
                              className='inline-flex h-8 items-center rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-[background-color,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/65 hover:text-foreground'
                              href='/dashboard/activity'
                            >
                              Ver todo
                            </Link>
                          </div>
                        </div>
                        <div className='px-4 py-4 sm:px-5'>
                          {activitiesQuery.isPending ? (
                            <LoadingLine />
                          ) : (activitiesQuery.data ?? []).length === 0 ? (
                            <Empty text='Todavía no hay actividad.' />
                          ) : (
                            <div className='space-y-4'>
                              {(activitiesQuery.data ?? []).slice(0, 5).map((activity) => (
                                <ActivityItem key={activity.id} activity={activity} />
                              ))}
                            </div>
                          )}
                        </div>
                      </section>

                      <section className='rounded-[18px] border border-border/45 bg-background'>
                        <div className='border-b border-border/40 px-4 py-3.5 sm:px-5'>
                          <div className='flex items-center justify-between gap-3'>
                            <div>
                              <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                Agenda
                              </p>
                              <p className='mt-1 text-xs text-muted-foreground'>
                                Próximos eventos y tareas
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className='grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-2'>
                          <div>
                            <div className='mb-2 flex items-center justify-between gap-2'>
                              <span className='text-xs font-medium'>Eventos</span>
                              <Link
                                className='text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground'
                                href='/dashboard/calendar'
                              >
                                Ver todo
                              </Link>
                            </div>
                            {eventsQuery.isPending ? (
                              <LoadingLine />
                            ) : events.length === 0 ? (
                              <Empty text='No hay eventos próximos.' />
                            ) : (
                              <div className='space-y-2'>
                                {events.slice(0, 3).map((event) => (
                                  <Link
                                    key={event.id}
                                    href={`/dashboard/calendar?event=${event.id}`}
                                    className='group flex items-center gap-2.5 rounded-[12px] border border-border/35 bg-muted/[0.14] px-3 py-2.5 transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px hover:border-border/60 hover:bg-muted/35'
                                  >
                                    <Icons.calendar className='size-3.5 shrink-0 text-primary' />
                                    <span className='min-w-0 flex-1 truncate text-xs font-medium group-hover:text-primary'>
                                      {event.title}
                                    </span>
                                    <span className='shrink-0 text-[11px] text-muted-foreground'>
                                      {format(new Date(event.startAt), 'd MMM · HH:mm', {
                                        locale: es
                                      })}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className='mb-2 flex items-center justify-between gap-2'>
                              <span className='text-xs font-medium'>Tareas abiertas</span>
                              <Link
                                className='text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground'
                                href='/dashboard/my-work?mode=list'
                              >
                                Ver todo
                              </Link>
                            </div>
                            {tasksQuery.isPending ? (
                              <LoadingLine />
                            ) : tasks.filter((task) => task.status !== 'done').length === 0 ? (
                              <Empty text='No hay tareas pendientes.' />
                            ) : (
                              <div className='space-y-2'>
                                {tasks
                                  .filter((task) => task.status !== 'done')
                                  .slice(0, 3)
                                  .map((task) => (
                                    <Link
                                      key={task.id}
                                      href={`/dashboard/my-work?mode=list&task=${task.id}`}
                                      className='group flex items-center gap-2.5 rounded-[12px] border border-border/35 bg-muted/[0.14] px-3 py-2.5 transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px hover:border-border/60 hover:bg-muted/35'
                                    >
                                      <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.10] text-primary'>
                                        <Icons.check className='size-3.5' />
                                      </span>
                                      <span className='min-w-0 flex-1 truncate text-xs font-medium'>
                                        {task.title}
                                      </span>
                                      <span className='shrink-0 text-[11px] text-muted-foreground'>
                                        {task.priority}
                                      </span>
                                    </Link>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>

              <div className='shrink-0 border-t border-border/50 bg-background px-4 py-3 sm:px-6'>
                <div className='flex items-center justify-between gap-3'>
                  <p className='hidden text-xs text-muted-foreground sm:block'>
                    Los cambios se guardan al salir de cada campo.
                  </p>
                  <div className='flex w-full items-center justify-center gap-2 sm:ml-auto sm:w-auto sm:justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setEventDialogOpen(true)}
                      className='h-9 rounded-full border-border/55 bg-background px-3.5 text-xs font-medium shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/60 active:scale-[0.98]'
                    >
                      <Icons.calendar className='size-3.5' />
                      <span>Planificar</span>
                    </Button>
                    <Button
                      type='button'
                      onClick={() => void createFollowUp('task')}
                      className='group h-9 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary/90 active:scale-[0.98]'
                    >
                      <span>Nuevo seguimiento</span>
                      <span className='flex size-5 items-center justify-center rounded-full bg-primary-foreground/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5'>
                        <Icons.arrowRight className='size-3' />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

function CustomerDatePicker({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            className='mt-1 h-9 w-full max-w-52 justify-start gap-2 rounded-[10px] border-border/40 bg-background px-3 text-left text-sm font-normal shadow-none hover:bg-muted/55'
          />
        }
      >
        <Icons.calendar className='size-3.5 text-muted-foreground' />
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? format(selected, 'd MMM yyyy', { locale: es }) : 'Elegir fecha'}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        sideOffset={6}
        className='w-auto rounded-[12px] border border-border/50 bg-popover p-1.5 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45)]'
      >
        <Calendar
          mode='single'
          locale={es}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            const next = `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            onChange(next);
          }}
          className='p-1 [--cell-size:--spacing(7)]'
        />
      </PopoverContent>
    </Popover>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className='flex items-center justify-between'>
      <h3 className='text-sm font-normal'>{title}</h3>
      <Link
        className='inline-flex h-8 items-center rounded-[10px] border border-border/50 bg-background px-2.5 text-xs font-normal text-foreground shadow-none transition-colors hover:bg-muted/60'
        href={href}
      >
        Ver todo
      </Link>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-background p-3'>
      <p className='text-muted-foreground text-[11px]'>{label}</p>
      <p className='mt-1 truncate text-sm font-normal'>{value}</p>
    </div>
  );
}

function EditableDetail({
  label,
  value,
  placeholder,
  onChange,
  onBlur,
  type = 'text',
  className
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className ?? 'bg-background p-3'}>
      <span className='text-muted-foreground block text-[11px] font-normal'>{label}</span>
      <input
        type={type}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(event.target.value)}
        className='mt-2 w-full min-w-0 bg-transparent text-[13px] font-normal leading-5 outline-none placeholder:text-muted-foreground/70'
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
          <p className='truncate text-sm font-normal'>{activity.title}</p>
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
