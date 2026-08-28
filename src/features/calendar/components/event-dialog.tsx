'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createEvent, deleteEvent, eventKeys, updateEvent } from '../queries';
import { eventPayloadSchema } from '../schemas/event';
import type { Event, CustomerOption, UserOption } from '../types';

type Category = { id: string; name: string; color: string };

type EventDialogProps = {
  open: boolean;
  event?: Event | null;
  initialDate?: Date;
  initialCustomerId?: string;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  onCategoriesChange?: (categories: Category[]) => void;
};

function toInputValue(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

export function EventDialog({
  open,
  event,
  initialDate,
  initialCustomerId,
  onOpenChange,
  categories = [],
  onCategoriesChange
}: EventDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pending, setPending] = useState(false);
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'event-options'],
    queryFn: async () => {
      const response = await fetch('/api/customers', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load customers');
      return (await response.json()) as CustomerOption[];
    },
    enabled: open
  });
  const { data: members = [] } = useQuery({
    queryKey: ['organization-members', 'event-options'],
    queryFn: async () => {
      const response = await fetch('/api/organization-members', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load members');
      return (await response.json()) as UserOption[];
    },
    enabled: open
  });

  useEffect(() => {
    if (!open) return;
    const start = event?.startAt ? new Date(event.startAt) : (initialDate ?? new Date());
    const end = event?.endAt ? new Date(event.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setStartAt(toInputValue(start));
    setEndAt(toInputValue(end));
    setAllDay(event?.allDay ?? false);
    setLocation(event?.location ?? '');
    setCustomerId(event?.customerId ?? initialCustomerId ?? '');
    setAssigneeId(event?.assigneeId ?? '');
    setCategoryId('');
  }, [event, initialCustomerId, initialDate, open]);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const parsed = eventPayloadSchema.safeParse({
      title,
      description: description || null,
      startAt,
      endAt,
      allDay,
      location: location || null,
      customerId: customerId || null,
      assigneeId: assigneeId || null
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos del evento.');
      return;
    }
    setPending(true);
    try {
      const payload = {
        ...parsed.data,
        startAt: parsed.data.startAt.toISOString(),
        endAt: parsed.data.endAt.toISOString()
      };
      if (event) await updateEvent(event.id, payload);
      else await createEvent(payload);
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success(event ? 'Evento actualizado' : 'Evento creado');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el evento.');
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setPending(true);
    try {
      await deleteEvent(event.id);
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Evento eliminado');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el evento.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid max-h-[calc(100dvh-1rem)] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-4 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg'>
        <DialogHeader className='shrink-0 pr-8'>
          <DialogTitle>{event ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
          <DialogDescription>
            {event
              ? 'Actualiza los detalles de este evento.'
              : 'Añade una actividad a la agenda del equipo.'}
          </DialogDescription>
        </DialogHeader>
        <form
          id='event-form'
          className='min-h-0 overflow-y-auto overscroll-contain py-2 pr-1'
          onSubmit={handleSubmit}
        >
          <div className='flex flex-col gap-4'>
            <label htmlFor='event-title' className='flex flex-col gap-1.5 text-sm'>
              <span className='text-muted-foreground'>Título</span>
              <Input
                id='event-title'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={200}
              />
            </label>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label htmlFor='event-start' className='flex flex-col gap-1.5 text-sm'>
                <span className='text-muted-foreground'>Inicio</span>
                <Input
                  id='event-start'
                  type='datetime-local'
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  required
                />
              </label>
              <label htmlFor='event-end' className='flex flex-col gap-1.5 text-sm'>
                <span className='text-muted-foreground'>Fin</span>
                <Input
                  id='event-end'
                  type='datetime-local'
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  required
                />
              </label>
            </div>
            <label htmlFor='event-all-day' className='flex items-center gap-2 text-sm'>
              <input
                id='event-all-day'
                aria-label='Todo el día'
                type='checkbox'
                checked={allDay}
                onChange={(event) => setAllDay(event.target.checked)}
              />{' '}
              Todo el día
            </label>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label htmlFor='event-category' className='flex flex-col gap-1.5 text-sm'>
                <span className='text-muted-foreground'>Categoría</span>
                <select
                  id='event-category'
                  className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value=''>Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor='event-customer' className='flex flex-col gap-1.5 text-sm'>
                <span className='text-muted-foreground'>Cliente (opcional)</span>
                <select
                  id='event-customer'
                  className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  <option value=''>Sin cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor='event-assignee' className='flex flex-col gap-1.5 text-sm'>
                <span className='text-muted-foreground'>Responsable (opcional)</span>
                <select
                  id='event-assignee'
                  className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  <option value=''>Sin responsable</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label htmlFor='event-location' className='flex flex-col gap-1.5 text-sm'>
              <span className='text-muted-foreground'>Ubicación (opcional)</span>
              <Input
                id='event-location'
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={500}
              />
            </label>
            <label htmlFor='event-description' className='flex flex-col gap-1.5 text-sm'>
              <span className='text-muted-foreground'>Notas</span>
              <Textarea
                id='event-description'
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
              />
            </label>
            {event?.customer && (
              <Link
                className='text-primary text-xs underline-offset-4 hover:underline'
                href={`/dashboard/customers/${event.customer.id}`}
              >
                Abrir cliente: {event.customer.name}
              </Link>
            )}
          </div>
        </form>
        <DialogFooter className='shrink-0 sm:justify-between'>
          {event ? (
            <Button
              variant='destructive'
              size='sm'
              type='button'
              onClick={() => void handleDelete()}
              disabled={pending}
            >
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <Button type='submit' size='sm' form='event-form' disabled={pending}>
            {pending ? 'Guardando...' : event ? 'Guardar cambios' : 'Crear evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
