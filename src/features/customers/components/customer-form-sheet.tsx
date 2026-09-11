'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createActivity } from '@/features/activities/queries';

export default function CustomerFormSheet({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'person' | 'company'>('person');
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  async function create() {
    setPending(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name,
          email,
          phone,
          address,
          website,
          nextAction,
          nextActionAt
        })
      });
      const customer = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok || !customer.id) {
        toast.error(customer.error || 'No se pudo crear el cliente');
        return;
      }
      if (notes.trim()) {
        await createActivity(customer.id, {
          type: 'note',
          title: 'Nota añadida',
          content: notes.trim()
        });
      }
      toast.success('Cliente creado');
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setWebsite('');
      setNotes('');
      setNextAction('');
      setNextActionAt('');
      setOpen(false);
      window.dispatchEvent(new CustomEvent('customers:refresh'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el cliente');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!initialOpen && (
        <Button variant='secondary' size='sm' className='shadow-none' onClick={() => setOpen(true)}>
          Nuevo cliente
        </Button>
      )}
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border-border/70 bg-popover sm:max-w-xl sm:p-6'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold tracking-tight'>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <div className='mt-3 space-y-4'>
          <div className='grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]'>
            <NativeSelect
              aria-label='Tipo de cliente'
              value={kind}
              onChange={(e) => setKind(e.target.value as 'person' | 'company')}
            >
              <NativeSelectOption value='person'>Persona</NativeSelectOption>
              <NativeSelectOption value='company'>Empresa</NativeSelectOption>
            </NativeSelect>
            <Input
              aria-label='Nombre del cliente'
              placeholder='Nombre del cliente'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <Input
              aria-label='Email'
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              aria-label='Teléfono'
              placeholder='Teléfono'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <Input
              aria-label='Dirección'
              placeholder='Dirección'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              aria-label='Sitio web'
              type='url'
              placeholder='https://sitio.com'
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <Textarea
            aria-label='Notas'
            placeholder='Notas del cliente (opcional)'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className='min-h-24 resize-none'
          />

          <div className='rounded-xl border border-border/55 bg-muted/20 p-3.5'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold'>Próximo paso</p>
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  Qué quieres hacer a continuación.
                </p>
              </div>
            </div>
            <div className='mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]'>
              <Input
                aria-label='Próximo paso'
                placeholder='Ej. Llamar para confirmar'
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />
              <DatePicker
                value={nextActionAt}
                onChange={setNextActionAt}
                aria-label='Fecha del próximo paso'
                className='w-full'
              />
            </div>
          </div>
        </div>
        <div className='mt-5 flex justify-end gap-2'>
          <Button variant='ghost' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={!name.trim() || pending} onClick={() => void create()}>
            {pending ? 'Creando…' : 'Crear cliente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
