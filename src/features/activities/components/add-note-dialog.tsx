'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { createActivity, activityKeys } from '../queries';

export function AddNoteDialog({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    try {
      await createActivity(customerId, {
        type: 'note',
        title: 'Nota añadida',
        content: content.trim()
      });
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
      setContent('');
      setOpen(false);
      toast.success('Nota añadida');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo añadir la nota.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant='outline' size='sm' />}>+ Nota</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir nota</DialogTitle>
          <DialogDescription>Registra un detalle importante sobre este cliente.</DialogDescription>
        </DialogHeader>
        <form id='customer-note-form' onSubmit={handleSubmit} className='py-2'>
          <label htmlFor='customer-note' className='flex flex-col gap-1.5 text-sm'>
            <span className='text-muted-foreground'>Contenido</span>
            <Textarea
              id='customer-note'
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              maxLength={10000}
            />
          </label>
        </form>
        <DialogFooter>
          <Button type='submit' form='customer-note-form' disabled={pending || !content.trim()}>
            {pending ? 'Guardando...' : 'Guardar nota'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
