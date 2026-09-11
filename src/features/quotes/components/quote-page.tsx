'use client';

import { useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

function money(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(value);
}

type Line = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

function newLine(): Line {
  return { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 };
}

function getDefaultValidUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().slice(0, 10);
}

export default function QuotePage() {
  const [client, setClient] = useState('');
  const [quoteNumber, setQuoteNumber] = useState(
    `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [validUntil, setValidUntil] = useState(getDefaultValidUntil);
  const [taxRate, setTaxRate] = useState(21);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<Line[]>([newLine()]);

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.price),
        0
      ),
    [lineItems]
  );
  const discountAmount = Math.min(subtotal, Math.max(0, discount));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (Math.max(0, taxRate) / 100);
  const total = taxable + taxAmount;

  const update = (id: string, field: keyof Line, value: string) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'quantity' || field === 'price' ? Math.max(0, Number(value)) : value
            }
          : item
      )
    );
  };

  const add = () => {
    if (lineItems.length < 8) setLineItems((items) => [...items, newLine()]);
  };

  const remove = (id: string) => {
    setLineItems((items) => {
      if (items.length === 1) return items;
      return items.filter((item) => item.id !== id);
    });
  };

  return (
    <PageContainer
      pageTitle='Presupuestos'
      pageDescription='Crea una propuesta clara, calcula el importe y compártela en segundos.'
    >
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]'>
        <section className='overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-card'>
          <div className='border-b border-border/60 px-5 py-5 sm:px-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                  Editor
                </p>
                <h2 className='mt-1 text-xl font-semibold tracking-tight'>Datos del presupuesto</h2>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Prepara la propuesta antes de enviarla.
                </p>
              </div>
              <span className='rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary'>
                BORRADOR
              </span>
            </div>
          </div>

          <div className='space-y-5 p-5 sm:p-6'>
            <div className='grid gap-3 sm:grid-cols-[1.4fr_0.8fr_0.9fr]'>
              <label className='space-y-1.5 text-sm'>
                <span className='text-muted-foreground'>Cliente</span>
                <Input
                  placeholder='Nombre del cliente'
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                />
              </label>
              <label className='space-y-1.5 text-sm'>
                <span className='text-muted-foreground'>Nº presupuesto</span>
                <Input
                  value={quoteNumber}
                  onChange={(event) => setQuoteNumber(event.target.value)}
                />
              </label>
              <label className='space-y-1.5 text-sm'>
                <span className='text-muted-foreground'>Válido hasta</span>
                <Input
                  type='date'
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                />
              </label>
            </div>

            <div className='rounded-[16px] border border-border/60 bg-background/45'>
              <div className='flex items-center justify-between border-b border-border/50 px-4 py-3'>
                <div>
                  <p className='text-sm font-semibold'>Conceptos</p>
                  <p className='text-muted-foreground text-xs'>
                    Añade productos o servicios y sus importes.
                  </p>
                </div>
                <Button variant='outline' size='sm' onClick={add} disabled={lineItems.length >= 8}>
                  <Icons.add className='size-3.5' />
                  Añadir
                </Button>
              </div>

              <div className='space-y-2 p-3'>
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className='grid gap-2 rounded-[12px] border border-border/50 bg-background p-2 sm:grid-cols-[minmax(0,1fr)_82px_120px_34px]'
                  >
                    <Input
                      placeholder={`Concepto ${index + 1}`}
                      value={item.description}
                      onChange={(event) => update(item.id, 'description', event.target.value)}
                    />
                    <Input
                      aria-label='Cantidad'
                      type='number'
                      min='0'
                      step='1'
                      value={item.quantity}
                      onChange={(event) => update(item.id, 'quantity', event.target.value)}
                    />
                    <Input
                      aria-label='Precio unitario'
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='Precio'
                      value={item.price}
                      onChange={(event) => update(item.id, 'price', event.target.value)}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => remove(item.id)}
                      disabled={lineItems.length === 1}
                      className='h-8 w-8 px-0 text-muted-foreground hover:text-destructive'
                      aria-label='Eliminar concepto'
                    >
                      <Icons.trash className='size-3.5' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <label className='space-y-1.5 text-sm'>
                <span className='text-muted-foreground'>IVA</span>
                <Input
                  type='number'
                  min='0'
                  step='1'
                  value={taxRate}
                  onChange={(event) => setTaxRate(Number(event.target.value))}
                />
              </label>
              <label className='space-y-1.5 text-sm'>
                <span className='text-muted-foreground'>Descuento (€)</span>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={discount}
                  onChange={(event) => setDiscount(Number(event.target.value))}
                />
              </label>
              <div className='rounded-[12px] border border-primary/15 bg-primary/6 px-3 py-2.5'>
                <p className='text-muted-foreground text-xs'>Total estimado</p>
                <p className='mt-1 text-lg font-semibold tabular-nums'>{money(total)}</p>
              </div>
            </div>

            <label className='block space-y-1.5 text-sm'>
              <span className='text-muted-foreground'>Notas para el cliente</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder='Condiciones, plazos, información adicional...'
                rows={4}
                className='flex w-full resize-none rounded-[10px] border border-input/80 bg-background/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring/70 focus-visible:ring-2 focus-visible:ring-ring/25'
              />
            </label>
          </div>
        </section>

        <section
          id='quote-print'
          className='overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-background shadow-[0_16px_38px_-30px_rgba(15,23,42,0.5)] print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none'
        >
          <div className='border-b border-border/60 bg-card/55 px-6 py-5 sm:px-7'>
            <div className='flex items-start justify-between gap-5'>
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <span className='size-2 rounded-full bg-primary' />
                  <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                    Propuesta
                  </p>
                </div>
                <h2 className='text-2xl font-semibold tracking-[-0.03em]'>Presupuesto</h2>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {client || 'Nombre del cliente'}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-muted-foreground text-[10px] font-medium uppercase tracking-[0.16em]'>
                  Nº
                </p>
                <p className='mt-1 text-sm font-semibold tabular-nums'>{quoteNumber || '—'}</p>
              </div>
            </div>
          </div>

          <div className='p-6 sm:p-7'>
            <div className='mb-6 flex flex-wrap gap-x-8 gap-y-2 text-xs'>
              <div>
                <p className='text-muted-foreground'>Fecha</p>
                <p className='mt-0.5 font-medium'>{new Date().toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Válido hasta</p>
                <p className='mt-0.5 font-medium'>
                  {validUntil
                    ? new Date(`${validUntil}T00:00:00`).toLocaleDateString('es-ES')
                    : '—'}
                </p>
              </div>
            </div>

            <div className='overflow-hidden rounded-[12px] border border-border/60'>
              <div className='grid grid-cols-[minmax(0,1fr)_68px_100px] gap-3 bg-muted/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
                <span>Concepto</span>
                <span className='text-right'>Ud.</span>
                <span className='text-right'>Importe</span>
              </div>
              <div className='divide-y divide-border/50'>
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className='grid grid-cols-[minmax(0,1fr)_68px_100px] gap-3 px-3 py-3 text-sm'
                  >
                    <span className='min-w-0 truncate'>
                      {item.description || 'Concepto sin nombre'}
                    </span>
                    <span className='text-right tabular-nums'>{item.quantity}</span>
                    <span className='text-right tabular-nums'>
                      {money(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='ml-auto mt-5 w-full max-w-[290px] space-y-2 text-sm'>
              <div className='flex justify-between gap-4 text-muted-foreground'>
                <span>Subtotal</span>
                <span className='tabular-nums'>{money(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className='flex justify-between gap-4 text-muted-foreground'>
                  <span>Descuento</span>
                  <span className='tabular-nums'>−{money(discountAmount)}</span>
                </div>
              )}
              <div className='flex justify-between gap-4 text-muted-foreground'>
                <span>IVA ({taxRate}%)</span>
                <span className='tabular-nums'>{money(taxAmount)}</span>
              </div>
              <div className='mt-3 flex justify-between gap-4 border-t border-border/60 pt-3 text-base font-semibold'>
                <span>Total</span>
                <span className='tabular-nums'>{money(total)}</span>
              </div>
            </div>

            <div className='mt-7 border-t border-border/50 pt-5'>
              <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em]'>
                Notas
              </p>
              <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80'>
                {notes || 'Gracias por confiar en nosotros.'}
              </p>
            </div>

            <div className='mt-7 flex flex-wrap gap-2 print:hidden'>
              <Button size='sm' onClick={() => window.print()}>
                <Icons.post className='size-3.5' />
                Imprimir / PDF
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  window.open(
                    'https://wa.me/?text=' +
                      encodeURIComponent(
                        `Hola ${client || ''}, te adjunto el presupuesto ${quoteNumber || ''} por un total de ${money(total)}.`
                      ),
                    '_blank'
                  )
                }
              >
                Compartir por WhatsApp
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
