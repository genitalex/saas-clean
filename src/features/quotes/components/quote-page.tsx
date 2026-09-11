'use client';

import { useEffect, useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { SignaturePad } from './signature-pad';

const QUOTE_SETTINGS_KEY = 'saas-clean-quote-settings-v1';

type Line = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

type QuoteSettings = {
  issuer: {
    businessName: string;
    legalName: string;
    taxId: string;
    address: string;
    postalCode: string;
    city: string;
    email: string;
    phone: string;
  };
  logoDataUrl: string;
};

const DEFAULT_SETTINGS: QuoteSettings = {
  issuer: {
    businessName: '',
    legalName: '',
    taxId: '',
    address: '',
    postalCode: '',
    city: '',
    email: '',
    phone: ''
  },
  logoDataUrl: ''
};

function money(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(value);
}

function newLine(): Line {
  return { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 };
}

function readQuoteSettings(): QuoteSettings {
  try {
    const saved = localStorage.getItem(QUOTE_SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<QuoteSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      issuer: {
        ...DEFAULT_SETTINGS.issuer,
        ...(parsed.issuer ?? {})
      }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function QuotePage() {
  const [client, setClient] = useState('');
  const [clientLegalName, setClientLegalName] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [quoteNumber, setQuoteNumber] = useState(
    `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [taxRate, setTaxRate] = useState(21);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<Line[]>([newLine()]);
  const [issuer, setIssuer] = useState<QuoteSettings['issuer']>(DEFAULT_SETTINGS.issuer);
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [logoError, setLogoError] = useState('');
  const [issuerSaved, setIssuerSaved] = useState(false);
  const [issuerOpen, setIssuerOpen] = useState(false);
  const [signatureIssuer, setSignatureIssuer] = useState('');

  useEffect(() => {
    const saved = readQuoteSettings();
    setIssuer(saved.issuer);
    setLogoDataUrl(saved.logoDataUrl);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(QUOTE_SETTINGS_KEY, JSON.stringify({ issuer, logoDataUrl }));
      setIssuerSaved(true);
      const timeout = window.setTimeout(() => setIssuerSaved(false), 1200);
      return () => window.clearTimeout(timeout);
    } catch {
      return undefined;
    }
  }, [issuer, logoDataUrl]);

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

  const handleLogo = (file: File | undefined) => {
    if (!file) return;
    setLogoError('');

    if (!file.type.startsWith('image/')) {
      setLogoError('Sube una imagen PNG, JPG, WEBP o SVG.');
      return;
    }

    if (file.size > 1_500_000) {
      setLogoError('El logo debe pesar menos de 1,5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      if (file.type === 'image/svg+xml') {
        setLogoDataUrl(result);
        return;
      }

      const image = new Image();
      image.onload = () => {
        const maxWidth = 520;
        const maxHeight = 240;
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setLogoDataUrl(canvas.toDataURL('image/png', 0.92));
      };
      image.src = result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <PageContainer
      pageTitle='Presupuestos'
      pageDescription='Crea una propuesta clara, calcula el importe y compártela en segundos.'
    >
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]'>
        <section className='overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-card print:hidden'>
          <div className='border-b border-border/60 px-5 py-5 sm:px-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                  Editor
                </p>
                <h2 className='mt-1 text-xl font-semibold tracking-tight'>Datos del documento</h2>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Personaliza el contenido que verá el cliente.
                </p>
              </div>
              <span className='rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary'>
                BORRADOR
              </span>
            </div>
          </div>

          <div className='space-y-5 p-5 sm:p-6'>
            <div className='rounded-[16px] border border-border/60 bg-background/45 p-4'>
              <button
                type='button'
                className='flex w-full items-center justify-between gap-3 text-left'
                onClick={() => setIssuerOpen((value) => !value)}
              >
                <span>
                  <span className='block text-sm font-semibold'>Tus datos fiscales</span>
                  <span className='text-muted-foreground mt-0.5 block text-xs'>
                    Se guardan automáticamente para futuros presupuestos.
                  </span>
                </span>
                <span className='flex items-center gap-2'>
                  {issuerSaved && (
                    <span className='text-[10px] font-medium text-primary'>Guardado</span>
                  )}
                  <Icons.chevronDown
                    className={`size-4 text-muted-foreground transition-transform ${
                      issuerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </span>
              </button>

              {issuerOpen && (
                <>
                  <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                    <Input
                      placeholder='Nombre comercial'
                      value={issuer.businessName}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, businessName: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='Razón social'
                      value={issuer.legalName}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, legalName: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='NIF / CIF'
                      value={issuer.taxId}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, taxId: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='Dirección'
                      value={issuer.address}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='Código postal'
                      value={issuer.postalCode}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, postalCode: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='Ciudad'
                      value={issuer.city}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, city: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='Email'
                      type='email'
                      value={issuer.email}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                    <Input
                      placeholder='Teléfono'
                      value={issuer.phone}
                      onChange={(event) =>
                        setIssuer((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </div>

                  <div className='mt-3 flex flex-wrap items-center gap-3'>
                    <label className='inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-input/80 bg-background px-3 py-2 text-xs font-medium hover:bg-muted/40'>
                      <Icons.upload className='size-3.5' />
                      {logoDataUrl ? 'Cambiar logo' : 'Subir logo'}
                      <input
                        type='file'
                        accept='image/png,image/jpeg,image/webp,image/svg+xml'
                        className='sr-only'
                        onChange={(event) => handleLogo(event.target.files?.[0])}
                      />
                    </label>
                    {logoDataUrl ? (
                      <div className='flex h-10 max-w-[180px] items-center rounded-[8px] border border-border/60 bg-white px-2'>
                        <img
                          src={logoDataUrl}
                          alt='Logo'
                          className='max-h-8 max-w-[165px] object-contain'
                        />
                      </div>
                    ) : null}
                    {logoError ? (
                      <span className='text-xs text-destructive'>{logoError}</span>
                    ) : null}
                  </div>
                  <p className='text-muted-foreground mt-2 text-[10px]'>
                    El logo se redimensiona y queda guardado para los siguientes documentos.
                  </p>
                </>
              )}
            </div>

            <div className='rounded-[16px] border border-border/60 bg-background/45 p-4'>
              <div>
                <p className='text-sm font-semibold'>Datos del cliente</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  Persona o empresa que recibe el documento.
                </p>
              </div>
              <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                <Input
                  placeholder='Nombre / empresa'
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                />
                <Input
                  placeholder='Razón social (opcional)'
                  value={clientLegalName}
                  onChange={(event) => setClientLegalName(event.target.value)}
                />
                <Input
                  placeholder='NIF / CIF'
                  value={clientTaxId}
                  onChange={(event) => setClientTaxId(event.target.value)}
                />
                <Input
                  placeholder='Email'
                  type='email'
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                />
                <Input
                  placeholder='Dirección'
                  value={clientAddress}
                  onChange={(event) => setClientAddress(event.target.value)}
                />
                <div className='grid grid-cols-2 gap-3'>
                  <Input
                    placeholder='C.P.'
                    value={clientPostalCode}
                    onChange={(event) => setClientPostalCode(event.target.value)}
                  />
                  <Input
                    placeholder='Ciudad'
                    value={clientCity}
                    onChange={(event) => setClientCity(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='space-y-1.5 text-sm'>
                <span className='text-muted-foreground'>Nº documento</span>
                <Input
                  value={quoteNumber}
                  onChange={(event) => setQuoteNumber(event.target.value)}
                />
              </label>
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

            <div className='grid gap-3 sm:grid-cols-2'>
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
          className='quote-print-target overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-background shadow-[0_16px_38px_-30px_rgba(15,23,42,0.5)] print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none'
        >
          <div className='border-b border-border/60 bg-card/55 px-6 py-5 sm:px-7 print:bg-white'>
            <div className='flex items-start justify-between gap-5'>
              <div className='flex min-w-0 items-center gap-5'>
                {logoDataUrl ? (
                  <div className='flex h-[92px] w-[150px] shrink-0 items-center justify-start'>
                    <img
                      src={logoDataUrl}
                      alt={issuer.businessName || 'Logo'}
                      className='max-h-[84px] max-w-[145px] object-contain object-left'
                    />
                  </div>
                ) : null}
                <div className='min-w-0'>
                  <p className='text-primary mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]'>
                    {issuer.businessName || issuer.legalName || 'Tu empresa'}
                  </p>
                  <h2 className='text-2xl font-semibold tracking-[-0.03em]'>Presupuesto</h2>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {client || 'Nombre del cliente'}
                  </p>
                </div>
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
            <div className='grid gap-6 border-b border-border/50 pb-5 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em]'>
                  Emisor
                </p>
                <p className='mt-1 text-sm font-semibold'>
                  {issuer.businessName || issuer.legalName || 'Tu empresa'}
                </p>
                {issuer.legalName && issuer.legalName !== issuer.businessName ? (
                  <p className='mt-0.5 text-xs'>{issuer.legalName}</p>
                ) : null}
                <p className='text-muted-foreground mt-1 whitespace-pre-line text-xs'>
                  {[
                    issuer.taxId,
                    issuer.address,
                    [issuer.postalCode, issuer.city].filter(Boolean).join(' ')
                  ]
                    .filter(Boolean)
                    .join('\n') || 'Añade tus datos fiscales'}
                </p>
                {issuer.email || issuer.phone ? (
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {[issuer.email, issuer.phone].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
              </div>

              <div>
                <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em]'>
                  Cliente
                </p>
                <p className='mt-1 text-sm font-semibold'>{client || 'Nombre del cliente'}</p>
                {clientLegalName && clientLegalName !== client ? (
                  <p className='mt-0.5 text-xs'>{clientLegalName}</p>
                ) : null}
                <p className='text-muted-foreground mt-1 whitespace-pre-line text-xs'>
                  {[
                    clientTaxId,
                    clientAddress,
                    [clientPostalCode, clientCity].filter(Boolean).join(' ')
                  ]
                    .filter(Boolean)
                    .join('\n') || 'Añade los datos fiscales del cliente'}
                </p>
                {clientEmail ? (
                  <p className='text-muted-foreground mt-1 text-xs'>{clientEmail}</p>
                ) : null}
              </div>
            </div>

            <div className='mb-6 mt-5 overflow-hidden rounded-[12px] border border-border/60'>
              <div className='grid grid-cols-[minmax(0,1fr)_68px_100px] gap-3 bg-muted/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground print:bg-[#f5f5f5]'>
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
                    <span className='min-w-0'>{item.description || 'Concepto sin nombre'}</span>
                    <span className='text-right tabular-nums'>{item.quantity}</span>
                    <span className='text-right tabular-nums'>
                      {money(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='ml-auto w-full max-w-[290px] space-y-2 text-sm'>
              <div className='flex justify-between gap-4 text-muted-foreground'>
                <span>Subtotal</span>
                <span className='tabular-nums'>{money(subtotal)}</span>
              </div>
              {discountAmount > 0 ? (
                <div className='flex justify-between gap-4 text-muted-foreground'>
                  <span>Descuento</span>
                  <span className='tabular-nums'>−{money(discountAmount)}</span>
                </div>
              ) : null}
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

            <div className='mt-8 border-t border-border/50 pt-6'>
              <div className='print:hidden'>
                <SignaturePad
                  value={signatureIssuer}
                  onChange={setSignatureIssuer}
                  label='Firma del emisor'
                />
              </div>
              {signatureIssuer ? (
                <div className='hidden print:block'>
                  <p className='text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]'>
                    Firma
                  </p>
                  <div className='h-[74px] w-[230px] border-b border-dashed border-border/70'>
                    <img
                      src={signatureIssuer}
                      alt='Firma'
                      className='h-full w-full object-contain object-bottom'
                    />
                  </div>
                </div>
              ) : null}
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
