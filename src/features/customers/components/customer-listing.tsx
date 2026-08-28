'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Customer = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  email: string | null;
  phone: string | null;
};
export default function CustomerListing() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState('');
  async function load() {
    const r = await fetch(`/api/customers?search=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (r.ok) setRows(await r.json());
  }
  useEffect(() => {
    void load();
    const fn = () => void load();
    window.addEventListener('customers:refresh', fn);
    return () => window.removeEventListener('customers:refresh', fn);
  }, [q]);
  return (
    <div className='space-y-4'>
      <input
        className='h-10 w-full max-w-sm rounded-md border px-3'
        placeholder='Search customers…'
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className='overflow-hidden rounded-xl border'>
        <div className='grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 border-b px-4 py-3 text-sm font-medium'>
          <span>Name</span>
          <span>Type</span>
          <span>Contact</span>
          <span></span>
        </div>
        {rows.map((r) => (
          <Link
            href={`/dashboard/customers/${r.id}`}
            key={r.id}
            className='grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 border-b px-4 py-4 text-sm last:border-0 hover:bg-muted/40'
          >
            <span className='font-medium'>{r.name}</span>
            <span className='capitalize'>{r.kind}</span>
            <span className='text-muted-foreground'>{r.email || r.phone || '—'}</span>
            <span className='text-muted-foreground'>View</span>
          </Link>
        ))}
        {rows.length === 0 && (
          <div className='text-muted-foreground p-8 text-center text-sm'>No customers yet.</div>
        )}
      </div>
    </div>
  );
}
