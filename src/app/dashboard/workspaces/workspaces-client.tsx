'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

type Membership = {
  organization: { id: string; name: string; slug: string };
  membership: { role: string };
};

export default function WorkspacesClient() {
  const { data: session } = authClient.useSession();
  const [items, setItems] = useState<Membership[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    const r = await fetch('/api/organizations', { cache: 'no-store' });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }
  useEffect(() => {
    if (session) void load();
  }, [session]);
  async function create() {
    setCreating(true);
    const r = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const d = await r.json().catch(() => ({}));
    setCreating(false);
    if (!r.ok) {
      toast.error(d.error || 'Could not create workspace');
      return;
    }
    setName('');
    await authClient.getSession();
    await load();
    toast.success('Workspace created');
  }
  if (loading) return <div className='bg-muted h-40 animate-pulse rounded-xl' />;
  return (
    <div className='space-y-6'>
      <div className='grid gap-3'>
        {items.map((i) => (
          <div
            key={i.organization.id}
            className='flex items-center justify-between rounded-xl border p-4'
          >
            <div>
              <div className='font-medium'>{i.organization.name}</div>
              <div className='text-muted-foreground text-sm capitalize'>{i.membership.role}</div>
            </div>
            {i.organization.id === session?.session.activeOrganizationId && (
              <span className='text-muted-foreground text-sm'>Active</span>
            )}
          </div>
        ))}
      </div>
      <div className='rounded-xl border p-4'>
        <div className='font-medium'>Create another workspace</div>
        <div className='mt-3 flex gap-2'>
          <input
            className='border-input h-10 flex-1 rounded-md border px-3'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Workspace name'
          />
          <button
            disabled={!name.trim() || creating}
            onClick={() => void create()}
            className='bg-primary text-primary-foreground rounded-md px-4 disabled:opacity-60'
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
