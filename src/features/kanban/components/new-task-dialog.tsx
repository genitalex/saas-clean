'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { createTask, taskKeys } from '@/features/tasks/queries';
import { activityKeys } from '@/features/activities/queries';
import { taskPayloadSchema } from '@/features/tasks/schemas/task';
import type { CustomerOption, TaskPriority } from '@/features/tasks/types';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export default function NewTaskDialog({
  customerId,
  eventId,
  initialOpen = false,
  triggerClassName,
  triggerIcon
}: {
  customerId?: string;
  eventId?: string;
  initialOpen?: boolean;
  triggerClassName?: string;
  triggerIcon?: ReactNode;
} = {}) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueAt, setDueAt] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? '');
  const [assigneeId, setAssigneeId] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'task-options'],
    queryFn: async () => {
      const response = await fetch('/api/customers', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load customers');
      return (await response.json()) as CustomerOption[];
    },
    enabled: open
  });

  function reset() {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueAt('');
    setSelectedCustomerId(customerId ?? '');
    setAssigneeId('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = taskPayloadSchema.safeParse({
      title,
      description: description || null,
      priority,
      dueAt: dueAt || null,
      customerId: selectedCustomerId || null,
      eventId: eventId || null,
      assigneeId: assigneeId || null
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos de la tarea.');
      return;
    }
    setPending(true);
    try {
      await createTask(parsed.data);
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Tarea creada');
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la tarea.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant='secondary' size='sm' className={cn('shadow-none', triggerClassName)} />
        }
      >
        {triggerIcon}+ Nueva tarea
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>Añade una tarea para el equipo.</DialogDescription>
        </DialogHeader>
        <form id='task-form' className='flex flex-col gap-4 py-2' onSubmit={handleSubmit}>
          <Input
            placeholder='Título de la tarea'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
          />
          <Textarea
            placeholder='Descripción (opcional)'
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
          />
          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='flex flex-col gap-1.5 text-sm'>
              <span className='text-muted-foreground'>Prioridad</span>
              <NativeSelect
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
              >
                <NativeSelectOption value='low'>Baja</NativeSelectOption>
                <NativeSelectOption value='medium'>Media</NativeSelectOption>
                <NativeSelectOption value='high'>Alta</NativeSelectOption>
              </NativeSelect>
            </label>
            <label htmlFor='task-due-at' className='flex flex-col gap-1.5 text-sm'>
              <span className='text-muted-foreground'>Fecha límite</span>
              <Input
                id='task-due-at'
                type='datetime-local'
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </label>
          </div>
          <label className='flex flex-col gap-1.5 text-sm'>
            <span className='text-muted-foreground'>Cliente (opcional)</span>
            <NativeSelect
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
            >
              <NativeSelectOption value=''>Sin cliente</NativeSelectOption>
              {customers.map((customer) => (
                <NativeSelectOption key={customer.id} value={customer.id}>
                  {customer.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className='flex flex-col gap-1.5 text-sm'>
            <span className='text-muted-foreground'>Responsable (opcional)</span>
            <NativeSelect
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <NativeSelectOption value=''>Sin responsable</NativeSelectOption>
              {session?.user.id && (
                <NativeSelectOption value={session.user.id}>
                  {session.user.name} (tú)
                </NativeSelectOption>
              )}
            </NativeSelect>
          </label>
        </form>
        <DialogFooter>
          <Button type='submit' size='sm' form='task-form' disabled={pending}>
            {pending ? 'Creando...' : 'Crear tarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
