'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
type Customer = {
  name: string;
  kind: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
};
export default function CustomerViewPage({ customerId }: { customerId: string }) {
  const [row, setRow] = useState<Customer | null>(null);
  useEffect(() => {
    void fetch(`/api/customers/${customerId}`, { cache: 'no-store' }).then(async (r) =>
      r.ok ? setRow(await r.json()) : notFound()
    );
  }, [customerId]);
  if (!row) return <div className='bg-muted h-40 animate-pulse rounded-xl' />;
  return (
    <div className='space-y-6 p-4 md:p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>{row.name}</h1>
        <p className='text-muted-foreground mt-1 capitalize'>{row.kind}</p>
      </div>
      <div className='grid gap-4 rounded-xl border p-6 sm:grid-cols-2'>
        <Field label='Email' value={row.email} />
        <Field label='Phone' value={row.phone} />
        <Field label='Address' value={row.address} />
        <Field label='Next action' value={row.nextAction} />
        <Field label='Next action date' value={row.nextActionAt} />
      </div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className='text-muted-foreground text-sm'>{label}</div>
      <div className='mt-1 font-medium'>{value || '—'}</div>
    </div>
  );
}
