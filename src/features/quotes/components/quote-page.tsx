'use client';

import { useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

function money(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

type Line = { id: string; description: string; quantity: number; price: number };

export default function QuotePage() {
  const [client, setClient] = useState('');
  const [lineItems, setLineItems] = useState<Line[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
  ]);
  const total = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [lineItems]
  );

  const update = (id: string, field: keyof Line, value: string) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'quantity' || field === 'price' ? Number(value) : value }
          : item
      )
    );
  };
  const add = () => {
    if (lineItems.length < 4)
      setLineItems((items) => [
        ...items,
        { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
      ]);
  };

  return (
    <PageContainer
      pageTitle='Crear presupuesto'
      pageDescription='Un presupuesto sencillo, rápido de compartir y fácil de entender.'
    >
      <div className='grid gap-5 lg:grid-cols-[0.9fr_1.1fr]'>
        <section className='rounded-[var(--radius-xl)] border border-border/70 bg-card p-5 sm:p-6'>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>Datos</p>
          <h2 className='mt-1 text-lg font-semibold'>Cliente y conceptos</h2>
          <div className='mt-4 flex flex-col gap-3'>
            <Input
              placeholder='Nombre del cliente'
              value={client}
              onChange={(event) => setClient(event.target.value)}
            />
            {lineItems.map((item) => (
              <div
                key={item.id}
                className='grid gap-2 rounded-2xl border border-border/50 bg-background/45 p-3 sm:grid-cols-[1fr_80px_110px]'
              >
                <Input
                  placeholder='Concepto'
                  value={item.description}
                  onChange={(event) => update(item.id, 'description', event.target.value)}
                />
                <Input
                  type='number'
                  min='1'
                  value={item.quantity}
                  onChange={(event) => update(item.id, 'quantity', event.target.value)}
                />
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='Precio'
                  value={item.price}
                  onChange={(event) => update(item.id, 'price', event.target.value)}
                />
              </div>
            ))}
            <Button variant='outline' onClick={add} disabled={lineItems.length >= 4}>
              <Icons.add />
              Añadir concepto
            </Button>
          </div>
        </section>
        <section
          id='quote-print'
          className='rounded-[var(--radius-xl)] border border-border/70 bg-background p-6 print:rounded-none print:border-0 print:bg-white print:p-0'
        >
          <div className='flex items-start justify-between gap-4 border-b border-border/60 pb-5'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em]'>Presupuesto</p>
              <h2 className='mt-1 text-2xl font-semibold tracking-tight'>Tu propuesta</h2>
              <p className='text-muted-foreground mt-1 text-sm'>{client || 'Nombre del cliente'}</p>
            </div>
            <span className='text-muted-foreground text-sm'>
              {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>
          <div className='mt-5 flex flex-col'>
            {lineItems.map((item) => (
              <div
                key={item.id}
                className='flex items-center justify-between gap-4 border-b border-border/50 py-3 text-sm'
              >
                <span>{item.description || 'Concepto sin nombre'}</span>
                <span className='tabular-nums'>{money(item.quantity * item.price)}</span>
              </div>
            ))}
            <div className='mt-5 flex items-center justify-between text-lg font-semibold'>
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
          <div className='mt-7 flex flex-wrap gap-2 print:hidden'>
            <Button onClick={() => window.print()}>
              <Icons.post />
              Guardar / imprimir PDF
            </Button>
            <Button
              variant='outline'
              onClick={() =>
                window.open(
                  'https://wa.me/?text=' +
                    encodeURIComponent(
                      `Hola ${client || ''}, te adjunto el presupuesto por un total de ${money(total)}.`
                    ),
                  '_blank'
                )
              }
            >
              WhatsApp
            </Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
