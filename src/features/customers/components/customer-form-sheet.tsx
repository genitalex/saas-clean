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
        toast.error(customer.error || 'Could not create customer');
        return;
      }
      if (notes.trim()) {
        await createActivity(customer.id, {
          type: 'note',
          title: 'Nota añadida',
          content: notes.trim()
        });
      }
      toast.success('Customer created');
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
      toast.error(error instanceof Error ? error.message : 'Could not create customer');
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!initialOpen && <Button onClick={() => setOpen(true)}>Add customer</Button>}
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:p-6'>
        <DialogHeader>
          <DialogTitle className='font-medium'>New customer</DialogTitle>
        </DialogHeader>
        <div className='mt-4 space-y-4'>
          <NativeSelect
            value={kind}
            onChange={(e) => setKind(e.target.value as 'person' | 'company')}
          >
            <NativeSelectOption value='person'>Person</NativeSelectOption>
            <NativeSelectOption value='company'>Company</NativeSelectOption>
          </NativeSelect>
          <Input
            aria-label='Customer name'
            placeholder='Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className='grid gap-3 sm:grid-cols-2'>
            <Input
              aria-label='Email'
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              aria-label='Phone'
              placeholder='Phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <details className='rounded-[12px] border border-border/40 px-3 py-2'>
            <summary className='cursor-pointer text-sm font-medium'>More information</summary>
            <div className='mt-3 space-y-3'>
              <Input
                aria-label='Address'
                placeholder='Address'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                aria-label='Website'
                type='url'
                placeholder='https://website.com'
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <Textarea
                aria-label='Notes'
                placeholder='Notes for this customer'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </details>
          <div className='rounded-[12px] border border-border/40 px-3 py-2'>
            <p className='text-sm font-medium'>Next action</p>
            <div className='mt-3 space-y-3'>
              <Input
                aria-label='Next action'
                placeholder='What needs to happen next?'
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />
              <DatePicker
                value={nextActionAt}
                onChange={setNextActionAt}
                aria-label='Next action date'
                className='w-full'
              />
            </div>
          </div>
        </div>
        <div className='mt-5 flex justify-end gap-2'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || pending} onClick={() => void create()}>
            {pending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
