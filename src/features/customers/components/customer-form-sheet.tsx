'use client';
import { useState } from 'react';
import { toast } from 'sonner';
export default function CustomerFormSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'person' | 'company'>('person');
  const [pending, setPending] = useState(false);
  async function create() {
    setPending(true);
    const r = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        name,
        email: '',
        phone: '',
        address: '',
        nextAction: '',
        nextActionAt: ''
      })
    });
    const d = await r.json().catch(() => ({}));
    setPending(false);
    if (!r.ok) {
      toast.error(d.error || 'Could not create customer');
      return;
    }
    toast.success('Customer created');
    setName('');
    setOpen(false);
    window.dispatchEvent(new CustomEvent('customers:refresh'));
  }
  return (
    <>
      {!open ? (
        <button
          className='bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium'
          onClick={() => setOpen(true)}
        >
          Add customer
        </button>
      ) : (
        <div className='border-border bg-background fixed inset-x-4 top-20 z-50 mx-auto max-w-md rounded-xl border p-5 shadow-xl'>
          <h2 className='text-lg font-semibold'>New customer</h2>
          <div className='mt-4 space-y-3'>
            <select
              className='h-10 w-full rounded-md border px-3'
              value={kind}
              onChange={(e) => setKind(e.target.value as 'person' | 'company')}
            >
              <option value='person'>Person</option>
              <option value='company'>Company</option>
            </select>
            <input
              className='h-10 w-full rounded-md border px-3'
              placeholder='Name'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='mt-5 flex justify-end gap-2'>
            <button className='rounded-md border px-4 py-2 text-sm' onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              disabled={!name.trim() || pending}
              className='bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-60'
              onClick={() => void create()}
            >
              {pending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
