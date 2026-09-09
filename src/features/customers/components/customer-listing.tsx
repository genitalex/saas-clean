'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomerInspector } from './customer-inspector';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type Customer = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  archived?: boolean;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

function formatNextActionDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short'
  }).format(date);
}

export default function CustomerListing() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/customers?search=${encodeURIComponent(q)}&archived=${showArchived}`,
      { cache: 'no-store' }
    );
    if (response.ok) setRows(await response.json());
  }, [q, showArchived]);

  useEffect(() => {
    void load();
    const fn = () => void load();
    window.addEventListener('customers:refresh', fn);
    return () => window.removeEventListener('customers:refresh', fn);
  }, [load]);

  useEffect(() => {
    const syncDeepLink = () => {
      setDeepLinkId(new URLSearchParams(window.location.search).get('customer'));
    };
    syncDeepLink();
    window.addEventListener('popstate', syncDeepLink);
    return () => window.removeEventListener('popstate', syncDeepLink);
  }, []);

  useEffect(() => {
    if (deepLinkId && rows.length > 0) {
      const matchedCustomer = rows.find((customer) => customer.id === deepLinkId);
      setSelectedId(matchedCustomer?.id ?? null);
      return;
    }
    if (!deepLinkId) setSelectedId(null);
  }, [deepLinkId, rows]);

  const openCustomer = (customer: Customer) => {
    setSelectedId(customer.id);
    const params = new URLSearchParams(window.location.search);
    params.set('customer', customer.id);
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
  };

  const closeCustomer = () => {
    setSelectedId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('customer');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    );
  };

  const activeCountLabel = useMemo(
    () => `${rows.length} ${rows.length === 1 ? 'cliente' : 'clientes'}`,
    [rows.length]
  );

  return (
    <div className='w-full pb-10'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <div className='relative w-full max-w-xl'>
            <Icons.search className='text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2' />
            <Input
              aria-label='Buscar clientes'
              className='h-10 w-full rounded-xl border-border/70 bg-card pl-9 pr-3 shadow-none'
              placeholder='Buscar por nombre, email, teléfono o web…'
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <span className='text-muted-foreground hidden shrink-0 text-xs sm:inline'>
            {activeCountLabel}
          </span>
        </div>
        <button
          type='button'
          onClick={() => setShowArchived((value) => !value)}
          className='inline-flex h-9 w-fit items-center gap-2 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'
        >
          <Icons.archive className='size-4' />
          <span>{showArchived ? 'Ver activos' : 'Ver archivados'}</span>
        </button>
      </div>

      <div className='overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(23,32,25,0.03)]'>
        <div className='hidden grid-cols-[minmax(250px,1.5fr)_minmax(190px,1fr)_minmax(220px,1.1fr)_minmax(180px,0.9fr)_32px] items-center gap-4 border-b border-border/60 bg-muted/25 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:grid'>
          <span>Cliente</span>
          <span>Contacto</span>
          <span>Dirección / Web</span>
          <span>Próximo paso</span>
          <span />
        </div>

        {rows.map((customer) => {
          const nextDate = formatNextActionDate(customer.nextActionAt);
          return (
            <button
              key={customer.id}
              type='button'
              onClick={() => openCustomer(customer)}
              className='group grid w-full grid-cols-1 gap-3 border-b border-border/55 px-4 py-4 text-left transition-colors hover:bg-muted/20 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(250px,1.5fr)_minmax(190px,1fr)_minmax(220px,1.1fr)_minmax(180px,0.9fr)_32px] lg:items-center lg:gap-4 lg:px-5'
            >
              <span className='flex min-w-0 items-center gap-3'>
                <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-primary/10'>
                  {initials(customer.name)}
                </span>
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-semibold'>{customer.name}</span>
                  <span className='mt-0.5 block text-xs text-muted-foreground'>
                    {customer.kind === 'person' ? 'Persona' : 'Empresa'}
                  </span>
                </span>
              </span>

              <span className='flex min-w-0 flex-col gap-1 pl-13 text-sm lg:pl-0'>
                {customer.email ? <span className='truncate'>{customer.email}</span> : null}
                {customer.phone ? (
                  <span className='truncate text-xs text-muted-foreground'>{customer.phone}</span>
                ) : !customer.email ? (
                  <span className='text-xs text-muted-foreground'>Sin contacto</span>
                ) : null}
              </span>

              <span className='flex min-w-0 flex-col gap-1 pl-13 text-sm lg:pl-0'>
                <span className='truncate text-muted-foreground'>
                  {customer.address || 'Sin dirección'}
                </span>
                {customer.website ? (
                  <span className='truncate text-xs text-primary'>{customer.website}</span>
                ) : null}
              </span>

              <span className='flex min-w-0 items-center gap-2 pl-13 lg:pl-0'>
                {customer.nextAction ? (
                  <span className='min-w-0'>
                    <span className='block truncate text-sm font-medium'>
                      {customer.nextAction}
                    </span>
                    {nextDate ? (
                      <span className='mt-0.5 block text-xs text-muted-foreground'>{nextDate}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className='text-xs text-muted-foreground'>Sin próximo paso</span>
                )}
              </span>

              <span className='hidden justify-end text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 lg:flex'>
                <Icons.chevronRight className='size-4' />
              </span>
            </button>
          );
        })}

        {rows.length === 0 && (
          <div className='flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center'>
            <span className='bg-primary/8 text-primary flex size-11 items-center justify-center rounded-2xl'>
              <Icons.user className='size-5' />
            </span>
            <div>
              <p className='text-sm font-semibold text-foreground'>
                {showArchived ? 'No hay clientes archivados' : 'No hay clientes todavía'}
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {q
                  ? 'Prueba con otro término de búsqueda.'
                  : 'Añade tu primer cliente para empezar.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <CustomerInspector
        customerId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && closeCustomer()}
      />
    </div>
  );
}
