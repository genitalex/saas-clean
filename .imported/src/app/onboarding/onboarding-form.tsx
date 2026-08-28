'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function OnboardingForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError('');
    const r = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await r.json().catch(() => ({}));
    setPending(false);
    if (!r.ok) {
      setError(data.error || 'Could not create workspace');
      return;
    }
    router.push('/dashboard/overview');
    router.refresh();
  }
  return (
    <main className='bg-muted/30 flex min-h-screen items-center justify-center p-6'>
      <div className='bg-background w-full max-w-lg rounded-2xl border p-8 shadow-sm'>
        <h1 className='text-2xl font-semibold'>Create your workspace</h1>
        <p className='text-muted-foreground mt-2'>
          This is where your team and customer data will live.
        </p>
        <form onSubmit={submit} className='mt-8 space-y-4'>
          <input
            aria-label='Workspace name'
            className='border-input h-11 w-full rounded-md border px-3'
            placeholder='Workspace name'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className='text-destructive text-sm'>{error}</p>}
          <button
            disabled={pending}
            className='bg-primary text-primary-foreground h-11 w-full rounded-md font-medium disabled:opacity-60'
          >
            {pending ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
      </div>
    </main>
  );
}
