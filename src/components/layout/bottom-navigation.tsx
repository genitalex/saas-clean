'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { desktopNavItems, mobileNavItems, navGroups } from '@/config/nav-config';
import { useIsMobile } from '@/hooks/use-mobile';

export function BottomNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const visible = useScrollDirection();
  const isMobile = useIsMobile();
  const primaryItems = isMobile ? mobileNavItems : desktopNavItems;
  const primaryUrls = primaryItems.map((item) => item.url);
  const moreIsActive =
    pathname.startsWith('/dashboard/') &&
    !primaryUrls.some((url) => pathname === url || pathname.startsWith(`${url}/`));

  return (
    <>
      <nav
        aria-label='Primary navigation'
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 sm:px-3',
          'transition-transform duration-300 ease-out will-change-transform',
          'motion-reduce:transition-none',
          visible || moreOpen || quickOpen ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className='mb-2 w-full max-w-[1180px] rounded-[24px] border border-border/60 bg-background/85 p-1.5 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:mb-4'>
          <div className='grid grid-cols-7 gap-1'>
            {primaryItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    'group flex min-w-0 min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 transition-all duration-200',
                    'active:scale-[0.97]',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[21px] shrink-0 transition-transform group-hover:scale-105' />
                  <span className='max-w-full truncate px-0.5 text-[10px] font-medium leading-tight sm:text-[11px]'>
                    {item.title === 'Customers'
                      ? 'Clientes'
                      : item.title === 'Calendar'
                        ? 'Calendario'
                        : item.title === 'Tasks'
                          ? 'Tareas'
                          : item.title}
                  </span>
                </Link>
              );
            })}

            <button
              type='button'
              onClick={() => setQuickOpen(true)}
              aria-expanded={quickOpen}
              aria-label='Crear algo nuevo'
              className='group flex min-w-0 min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground active:scale-[0.97]'
            >
              <span className='flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105'>
                <Icons.add className='size-[18px]' />
              </span>
              <span className='text-[10px] font-medium leading-tight sm:text-[11px]'>Nuevo</span>
            </button>

            <button
              type='button'
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-label='Abrir más secciones'
              className={cn(
                'group flex min-w-0 min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 transition-all duration-200 active:scale-[0.97]',
                moreIsActive || moreOpen
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <Icons.moreHorizontal className='size-[21px] shrink-0 transition-transform group-hover:scale-105' />
              <span className='text-[10px] font-medium leading-tight sm:text-[11px]'>Más</span>
            </button>
          </div>
        </div>
      </nav>

      <QuickCreate open={quickOpen} onOpenChange={setQuickOpen} />
      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        pathname={pathname}
        isMobile={isMobile}
        mobilePrimaryItems={mobileNavItems}
      />
    </>
  );
}

function QuickCreate({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;
  const actions = [
    ['Nueva tarea', '/dashboard/tasks', Icons.check],
    ['Nuevo evento', '/dashboard/calendar', Icons.calendar],
    ['Nuevo cliente', '/dashboard/customers', Icons.teams],
    ['Nueva oportunidad', '/dashboard/opportunities', Icons.opportunities]
  ] as const;

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/12 p-3 backdrop-blur-[2px]'
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <section className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] w-full max-w-md rounded-[28px] border border-border/60 bg-background/95 p-4 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-2xl'>
        <div className='mb-3 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>Crear</h2>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Empieza por lo que necesites ahora.
            </p>
          </div>
          <button
            type='button'
            aria-label='Cerrar'
            onClick={() => onOpenChange(false)}
            className='flex size-9 items-center justify-center rounded-full bg-muted/70'
          >
            <Icons.close className='size-4' />
          </button>
        </div>
        <div className='grid grid-cols-2 gap-2'>
          {actions.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => onOpenChange(false)}
              className='flex min-h-16 items-center gap-3 rounded-2xl border border-border/60 bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted/50'
            >
              <span className='flex size-10 items-center justify-center rounded-xl bg-muted/70'>
                <Icon className='size-5' />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  pathname,
  isMobile,
  mobilePrimaryItems
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  isMobile: boolean;
  mobilePrimaryItems: typeof mobileNavItems;
}) {
  const primaryItems = isMobile ? mobilePrimaryItems : desktopNavItems;
  const primaryUrls = new Set(primaryItems.map((item) => item.url));

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/12 p-3 backdrop-blur-[2px]'
      role='presentation'
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-label='Más secciones'
        className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] flex w-full max-w-3xl max-h-[min(78dvh,720px)] flex-col overflow-hidden rounded-[28px] border border-border/60 bg-background/95 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-2xl'
      >
        <div className='flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5 py-4 md:px-6 md:py-5'>
          <div className='min-w-0'>
            <h2 className='truncate text-lg font-semibold tracking-tight md:text-xl'>
              Más secciones
            </h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              Accesos secundarios de tu espacio de trabajo.
            </p>
          </div>
          <button
            type='button'
            onClick={() => onOpenChange(false)}
            aria-label='Cerrar'
            className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground'
          >
            <Icons.close className='size-5' />
          </button>
        </div>

        <div className='min-h-0 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5'>
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !primaryUrls.has(item.url));
            if (!items.length) return null;
            return (
              <section key={group.label} className='mb-6 last:mb-0'>
                <div className='px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                  {group.label}
                </div>
                <div className='grid gap-1.5 sm:grid-cols-2'>
                  {items.map((item) => {
                    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                    const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'flex min-h-[56px] items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all active:scale-[0.99]',
                          active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            active ? 'bg-primary/10' : 'bg-muted/70'
                          )}
                        >
                          <Icon className='size-5' />
                        </span>
                        <span className='truncate'>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <section>
            <div className='px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
              Cuenta
            </div>
            <Link
              href='/dashboard/profile'
              onClick={() => onOpenChange(false)}
              className={cn(
                'flex min-h-[56px] items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all',
                pathname.startsWith('/dashboard/profile')
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/70'
              )}
            >
              <span className='bg-muted/70 flex size-10 shrink-0 items-center justify-center rounded-xl'>
                <Icons.profile className='size-5' />
              </span>
              Perfil
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}
