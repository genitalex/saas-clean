'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { desktopNavItems, mobileNavItems, navGroups } from '@/config/nav-config';
import { useIsMobile } from '@/hooks/use-mobile';
import { LiquidGlassSurface } from '@/components/ui/liquid-glass';

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
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 sm:px-4',
          'transition-transform duration-300 ease-out will-change-transform',
          visible || moreOpen || createOpen ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <LiquidGlassSurface
          as='div'
          className='glass-nav mb-2 w-full max-w-[980px] rounded-[24px] p-1.5 sm:mb-4 md:mb-5'
        >
          <div className='grid grid-cols-7 gap-0.5 md:hidden'>
            {primaryItems.slice(0, 5).map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    'group flex min-w-0 min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[20px] shrink-0 transition-transform group-hover:scale-105' />
                  <span className='max-w-full truncate text-[10px] font-medium leading-none'>
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
                setCreateOpen((value) => !value);
              }}
              className={cn(
                'flex min-w-0 min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2 transition',
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
                'flex min-w-0 min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2 transition',
                moreOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/70'
              )}
            >
              <Icons.moreHorizontal className='size-[20px]' />
              <span className='text-[10px] font-medium leading-none'>Más</span>
            </button>
          </div>

          <div className='hidden grid-cols-10 gap-0.5 md:grid'>
            {primaryItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    'group flex min-w-0 min-h-[50px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2 transition-all duration-200',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[18px] shrink-0 transition-transform group-hover:scale-105' />
                  <span className='max-w-full truncate text-[10px] font-medium leading-none'>
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
                setCreateOpen((value) => !value);
              }}
              className={cn(
                'flex min-w-0 min-h-[50px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2 transition',
                createOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span
                className={cn(
                  'flex size-6.5 items-center justify-center rounded-full',
                  createOpen ? 'bg-primary-foreground/15' : 'bg-primary text-primary-foreground'
                )}
              >
                <Icons.add className='size-3.5' />
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
                'flex min-w-0 min-h-[50px] flex-col items-center justify-center gap-1 rounded-[17px] px-1.5 py-2 transition',
                moreOpen
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <Icons.moreHorizontal className='size-[18px]' />
              <span className='text-[10px] font-medium leading-none'>Más</span>
            </button>
          </div>
        </LiquidGlassSurface>
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
    ['Nota rápida', '/dashboard/notes'],
    ['Presupuesto', '/dashboard/quotes']
  ];
  return (
    <div
      className='fixed inset-0 z-40 flex items-end justify-center bg-black/8 p-3 backdrop-blur-[2px]'
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <div className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] w-full max-w-lg rounded-[24px] border border-border/60 bg-background/94 p-3 shadow-none backdrop-blur-2xl'>
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
  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/12 p-3 supports-backdrop-filter:backdrop-blur-[2px]'
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] max-h-[min(76dvh,680px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_18px_48px_-24px_rgba(15,23,42,0.3)]'>
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
