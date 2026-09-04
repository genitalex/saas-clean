'use client';

import { useCallback, useEffect, useState } from 'react';
import { CustomerInspector } from './customer-inspector';
import { Input } from '@/components/ui/input';

type Customer = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  nextAction: string | null;
};

export default function CustomerListing() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(
      `/api/customers?search=${encodeURIComponent(q)}&archived=${showArchived}`,
      { cache: 'no-store' }
    );
    if (r.ok) setRows(await r.json());
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

    if (!deepLinkId) {
      setSelectedId(null);
    }
  }, [deepLinkId, rows]);

  const openCustomer = (customer: Customer) => {
    setSelectedId(customer.id);
    const params = new URLSearchParams(window.location.search);
    params.set('customer', customer.id);
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    );
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

  return (
    <div
      data-design-id='customers.page'
      data-design-component='Customers'
      className='mx-auto w-full max-w-[var(--page-max-width)] space-y-6 px-[var(--page-padding)] pt-5 pb-10 md:pt-7'
    >
      <div className='flex flex-wrap items-center gap-3'>
        <Input
          data-design-id='customers.search'
          data-design-component='Search'
          aria-label='Buscar clientes'
          className='w-full max-w-sm'
          placeholder='Buscar clientes…'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className='text-muted-foreground text-xs'>{rows.length} clientes</span>
        <button
          type='button'
          onClick={() => setShowArchived((value) => !value)}
          className='text-primary text-sm hover:underline'
        >
          {showArchived ? 'Ver clientes activos' : 'Ver archivados'}
        </button>
      </div>
      <div
        data-design-id='customers.table'
        data-design-component='CustomerTable'
        className='overflow-visible rounded-[var(--radius-xl)] border border-border/70 bg-card'
      >
        <div className='hidden grid-cols-[2fr_1fr_2fr_auto] gap-4 border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid'>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Contexto</span>
          <span />
        </div>
        {rows.map((customer) => (
          <button
            data-design-id='customers.row'
            data-design-component='CustomerRow'
            key={customer.id}
            type='button'
            onClick={() => openCustomer(customer)}
            className='grid w-full gap-2 border-b border-border/60 px-4 py-4 text-left transition-colors hover:bg-muted/35 last:border-0 md:grid-cols-[2fr_1fr_2fr_auto] md:items-center md:gap-4'
          >
            <span className='min-w-0 font-medium'>{customer.name}</span>
            <span className='text-muted-foreground text-xs'>
              {customer.kind === 'person' ? 'Persona' : 'Empresa'}
            </span>
            <span className='text-muted-foreground min-w-0 truncate text-sm'>
              {customer.email || customer.phone || customer.website || 'Sin contacto'}
              {customer.nextAction ? ` · ${customer.nextAction}` : ''}
            </span>
            <span className='text-primary text-xs'>Abrir contexto</span>
          </button>
        ))}
        {rows.length === 0 && (
          <div className='text-muted-foreground p-10 text-center text-sm'>
            {showArchived ? 'No hay clientes archivados.' : 'No hay clientes todavía.'}
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
