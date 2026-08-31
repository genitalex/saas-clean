'use client';

import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfileViewPage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  if (isPending) return <div className='bg-muted m-4 h-64 animate-pulse rounded-xl' />;
  if (!session) return <p className='text-destructive p-6'>Unable to load your profile.</p>;

  async function saveProfile() {
    if (!session) return;
    setSaving(true);
    const result = await authClient.updateUser({ name: name.trim() || session.user.name });
    setSaving(false);
    if (result.error) toast.error(result.error.message || 'Could not update profile');
    else toast.success('Profile updated');
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Profile</h1>
        <p className='text-muted-foreground mt-1'>
          Manage your personal information and account security.
        </p>
      </div>
      <section className='rounded-xl border p-6'>
        <h2 className='font-medium'>Personal information</h2>
        <div className='mt-5 grid gap-4 sm:grid-cols-2'>
          <label className='grid gap-2 text-sm'>
            <span>Name</span>
            <input
              aria-label='Name'
              className='border-input bg-background h-10 rounded-md border px-3'
              defaultValue={session.user.name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className='grid gap-2 text-sm'>
            <span>Email</span>
            <input
              aria-label='Email'
              className='border-input bg-muted h-10 rounded-md border px-3'
              value={session.user.email}
              readOnly
            />
          </label>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className='bg-primary text-primary-foreground mt-5 h-10 rounded-md px-4 text-sm font-medium disabled:opacity-60'
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </section>
      <section className='rounded-xl border p-6'>
        <h2 className='font-medium'>Security</h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          Password changes can be added here without coupling the dashboard to an external identity
          provider.
        </p>
      </section>
    </div>
  );
}
