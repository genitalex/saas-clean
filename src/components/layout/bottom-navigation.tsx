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
  const visible = useScrollDirection();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const primaryItems = isMobile ? mobileNavItems : desktopNavItems;
  const primaryUrls = new Set(primaryItems.map((item) => item.url));

  React.useEffect(() => {
    setMoreOpen(false);
    setCreateOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        aria-label='Primary navigation'
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 sm:px-4 transition-transform duration-300 ease-out will-change-transform',
          visible || moreOpen || createOpen ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className='mb-2 w-max max-w-[calc(100vw-20px)] rounded-[22px] border border-border/60 bg-background/78 p-1.5 shadow-[0_22px_70px_-36px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:mb-4 md:mb-5'>
          <div className='grid grid-cols-7 gap-0.5 md:hidden'>
            {primaryItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    'flex min-w-0 min-h-[56px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[20px] shrink-0' />
                  <span className='truncate text-[10px] font-medium leading-none'>
                    {item.title}
                  </span>
                </Link>
              );
            })}
            <button
              type='button'
              aria-expanded={createOpen}
              onClick={() => {
                setMoreOpen(false);
                setCreateOpen((v) => !v);
              }}
              className={cn(
                'flex min-w-0 min-h-[56px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2',
                createOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full',
                  createOpen ? 'bg-primary-foreground/15' : 'bg-primary text-primary-foreground'
                )}
              >
                <Icons.add className='size-4' />
              </span>
              <span className='text-[10px] font-medium leading-none'>Nuevo</span>
            </button>
            <button
              type='button'
              aria-expanded={moreOpen}
              onClick={() => {
                setCreateOpen(false);
                setMoreOpen(true);
              }}
              className={cn(
                'flex min-w-0 min-h-[56px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2',
                moreOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/70'
              )}
            >
              <Icons.moreHorizontal className='size-[20px]' />
              <span className='text-[10px] font-medium leading-none'>Más</span>
            </button>
          </div>
          <div className='hidden items-stretch justify-center gap-1 md:flex'>
            {primaryItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    'flex items-center gap-1.5 rounded-[16px] px-3.5 py-2.5 text-sm font-medium',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[18px] shrink-0' />
                  <span className='whitespace-nowrap'>{item.title}</span>
                </Link>
              );
            })}
            <div className='mx-1 my-2 w-px bg-border/60' />
            <button
              type='button'
              aria-expanded={createOpen}
              onClick={() => {
                setMoreOpen(false);
                setCreateOpen((v) => !v);
              }}
              className={cn(
                'flex items-center gap-2 rounded-[16px] px-3.5 py-2.5 text-sm font-medium',
                createOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full',
                  createOpen ? 'bg-primary-foreground/15' : 'bg-primary text-primary-foreground'
                )}
              >
                <Icons.add className='size-4' />
              </span>
              Nuevo
            </button>
            <button
              type='button'
              aria-expanded={moreOpen}
              onClick={() => {
                setCreateOpen(false);
                setMoreOpen(true);
              }}
              className='flex items-center gap-2 rounded-[16px] px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            >
              <Icons.moreHorizontal className='size-[18px]' />
              Más
            </button>
          </div>
        </div>
      </nav>
      {createOpen && <QuickCreate onClose={() => setCreateOpen(false)} />}
      {moreOpen && (
        <MoreSheet
          pathname={pathname}
          isMobile={isMobile}
          onClose={() => setMoreOpen(false)}
          primaryUrls={primaryUrls}
        />
      )}
    </>
  );
}

function QuickCreate({ onClose }: { onClose: () => void }) {
  const items = [
    ['Nueva tarea', '/dashboard/tasks'],
    ['Nuevo evento', '/dashboard/calendar'],
    ['Nuevo cliente', '/dashboard/customers'],
    ['Nueva oportunidad', '/dashboard/opportunities'],
    ['Nota rápida', '/dashboard/customers'],
    ['Presupuesto', '/dashboard/quotes']
  ];
  return (
    <div
      className='fixed inset-0 z-40 flex items-end justify-center bg-black/8 p-3 backdrop-blur-[2px]'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] w-full max-w-lg rounded-[24px] border border-border/60 bg-background/94 p-3 shadow-[0_26px_80px_-36px_rgba(0,0,0,0.5)] backdrop-blur-2xl'>
        <p className='text-muted-foreground px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]'>
          Crear rápidamente
        </p>
        <div className='grid grid-cols-2 gap-1.5'>
          {items.map(([label, href]) => (
            <Link
              key={href + label}
              href={href}
              onClick={onClose}
              className='rounded-2xl px-3.5 py-3 text-sm font-medium hover:bg-muted/60'
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoreSheet({
  pathname,
  isMobile,
  onClose,
  primaryUrls
}: {
  pathname: string;
  isMobile: boolean;
  onClose: () => void;
  primaryUrls: Set<string>;
}) {
  const primary = isMobile ? mobileNavItems : desktopNavItems;
  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/10 p-3 backdrop-blur-[2px]'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] max-h-[min(76dvh,680px)] w-full max-w-2xl overflow-hidden rounded-[28px] border border-border/60 bg-background/95 shadow-[0_30px_90px_-38px_rgba(0,0,0,0.5)] backdrop-blur-2xl'>
        <div className='flex items-center justify-between border-b border-border/60 px-5 py-4'>
          <div>
            <h2 className='text-lg font-semibold'>Más</h2>
            <p className='text-muted-foreground mt-0.5 text-xs'>Herramientas del espacio.</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='bg-muted/70 flex size-9 items-center justify-center rounded-full'
          >
            <Icons.close className='size-4' />
          </button>
        </div>
        <div className='min-h-0 overflow-y-auto px-4 py-4'>
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !primaryUrls.has(item.url));
            if (!items.length) return null;
            return (
              <section key={group.label} className='mb-5 last:mb-0'>
                <p className='text-muted-foreground px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]'>
                  {group.label}
                </p>
                <div className='grid gap-1 sm:grid-cols-2'>
                  {items.map((item) => {
                    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                    const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={onClose}
                        className={cn(
                          'flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium hover:bg-muted/60',
                          active && 'bg-primary/10 text-primary'
                        )}
                      >
                        <span className='bg-muted/70 flex size-9 items-center justify-center rounded-xl'>
                          <Icon className='size-4.5' />
                        </span>
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
