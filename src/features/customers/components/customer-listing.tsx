'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getCustomerActivities } from '@/features/activities/queries';
import type { Activity } from '@/features/activities/types';

type Customer = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  email: string | null;
  phone: string | null;
};

type ContextState = { loading: boolean; activities: Activity[]; customer: Customer | null };

export default function CustomerListing() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState('');
  const [contextId, setContextId] = useState<string | null>(null);
  const [context, setContext] = useState<ContextState>({
    loading: false,
    activities: [],
    customer: null
  });

  const load = useCallback(async () => {
    const r = await fetch(`/api/customers?search=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (r.ok) setRows(await r.json());
  }, [q]);

  useEffect(() => {
    void load();
    const fn = () => void load();
    window.addEventListener('customers:refresh', fn);
    return () => window.removeEventListener('customers:refresh', fn);
  }, [load]);

  const openContext = async (customer: Customer) => {
    if (contextId === customer.id) {
      setContextId(null);
      return;
    }
    setContextId(customer.id);
    setContext({ loading: true, activities: [], customer });
    try {
      setContext({
        loading: false,
        activities: await getCustomerActivities(customer.id),
        customer
      });
    } catch {
      setContext({ loading: false, activities: [], customer });
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <input
          aria-label='Buscar clientes'
          className='h-10 w-full max-w-sm rounded-2xl border border-border/60 bg-background/60 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20'
          placeholder='Buscar clientes…'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className='text-muted-foreground text-xs'>{rows.length} clientes</span>
      </div>
      <div className='overflow-visible rounded-[24px] border border-border/60 bg-card/45 backdrop-blur-xl'>
        <div className='hidden grid-cols-[2fr_1fr_2fr_auto] gap-4 border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid'>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Contacto</span>
          <span />
        </div>
        {rows.map((customer) => (
          <div key={customer.id} className='relative border-b border-border/60 last:border-0'>
            <div className='grid gap-2 px-4 py-4 md:grid-cols-[2fr_1fr_2fr_auto] md:items-center md:gap-4'>
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className='min-w-0 font-medium hover:text-primary'
              >
                {customer.name}
              </Link>
              <span className='text-muted-foreground text-xs'>
                {customer.kind === 'person' ? 'Persona' : 'Empresa'}
              </span>
              <div className='flex min-w-0 items-center gap-3 text-sm'>
                <span className='text-muted-foreground truncate'>
                  {customer.email || customer.phone || '—'}
                </span>
                {customer.phone && (
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => void openContext(customer)}
                    className='shrink-0 rounded-xl'
                    aria-label={`Llamar a ${customer.name}`}
                  >
                    <Icons.phone className='size-4' />
                  </Button>
                )}
              </div>
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className='text-muted-foreground text-xs hover:text-foreground'
              >
                Abrir
              </Link>
            </div>
            {contextId === customer.id && <CustomerContextCard context={context} />}
          </div>
        ))}
        {rows.length === 0 && (
          <div className='text-muted-foreground p-10 text-center text-sm'>
            No hay clientes todavía.
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerContextCard({ context }: { context: ContextState }) {
  const latestNote = context.activities.find((activity) => activity.type === 'note');
  const latestEmail = context.activities.find((activity) => activity.type === 'email');
  return (
    <aside className='absolute inset-x-3 top-[calc(100%-4px)] z-30 rounded-[22px] border border-border/60 bg-background/96 p-4 shadow-[0_24px_70px_-32px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:left-auto md:right-4 md:w-[360px]'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.18em]'>
            Contexto rápido
          </p>
          <p className='mt-1 font-semibold'>{context.customer?.name}</p>
        </div>
        {context.customer?.phone && (
          <a
            href={`tel:${context.customer.phone}`}
            className='bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full'
          >
            <Icons.phone className='size-4' />
          </a>
        )}
      </div>
      {context.loading ? (
        <div className='mt-4 space-y-2'>
          <div className='bg-muted h-4 w-3/4 animate-pulse rounded' />
          <div className='bg-muted h-4 w-full animate-pulse rounded' />
        </div>
      ) : (
        <div className='mt-4 space-y-3 text-sm'>
          <div className='rounded-2xl bg-muted/40 p-3'>
            <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.15em]'>
              Última nota
            </p>
            <p className='mt-1 leading-5'>{latestNote?.content ?? 'No hay notas todavía.'}</p>
          </div>
          <div className='rounded-2xl bg-muted/40 p-3'>
            <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.15em]'>
              Último correo
            </p>
            <p className='mt-1 leading-5'>
              {latestEmail?.content ?? latestEmail?.title ?? 'No hay correos registrados.'}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
