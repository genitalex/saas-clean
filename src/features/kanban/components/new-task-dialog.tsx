'use client';

import { useState } from 'react';
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
import { createTask, taskKeys } from '@/features/tasks/queries';
import { taskPayloadSchema } from '@/features/tasks/schemas/task';
import type { CustomerOption, TaskPriority } from '@/features/tasks/types';
import { authClient } from '@/lib/auth-client';

export default function NewTaskDialog({ customerId }: { customerId?: string } = {}) {
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
      <DialogTrigger render={<Button variant='secondary' size='sm' />}>+ Nueva tarea</DialogTrigger>
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
              <select
                className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
              >
                <option value='low'>Baja</option>
                <option value='medium'>Media</option>
                <option value='high'>Alta</option>
              </select>
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
            <select
              className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
            >
              <option value=''>Sin cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className='flex flex-col gap-1.5 text-sm'>
            <span className='text-muted-foreground'>Responsable (opcional)</span>
            <select
              className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value=''>Sin responsable</option>
              {session?.user.id && (
                <option value={session.user.id}>{session.user.name} (tú)</option>
              )}
            </select>
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
