'use client';

import { useCallback, useEffect, useState } from 'react';
import { CustomerInspector } from './customer-inspector';

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
        <button
          type='button'
          onClick={() => setShowArchived((value) => !value)}
          className='text-primary text-sm hover:underline'
        >
          {showArchived ? 'Ver clientes activos' : 'Ver archivados'}
        </button>
      </div>
      <div className='overflow-visible rounded-2xl border border-border/60 bg-card/45'>
        <div className='hidden grid-cols-[2fr_1fr_2fr_auto] gap-4 border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid'>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Contexto</span>
          <span />
        </div>
        {rows.map((customer) => (
          <button
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
