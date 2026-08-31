'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { desktopNavItems, mobileNavItems, navGroups } from '@/config/nav-config';
import { useIsMobile } from '@/hooks/use-mobile';

const MOBILE_PRIMARY_COUNT = 4;

export function BottomNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const visible = useScrollDirection();
  const isMobile = useIsMobile();
  const mobilePrimaryItems = mobileNavItems.slice(0, MOBILE_PRIMARY_COUNT);

  const primaryUrls = isMobile
    ? mobilePrimaryItems.map((item) => item.url)
    : desktopNavItems.map((item) => item.url);

  const moreIsActive = pathname.startsWith('/dashboard/') && !primaryUrls.includes(pathname);

  return (
    <>
      <nav
        aria-label='Primary navigation'
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 sm:px-3',
          'transition-transform duration-300 ease-out will-change-transform',
          'motion-reduce:transition-none',
          visible || moreOpen ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className='mb-2 w-full rounded-[24px] border border-border/60 bg-background/85 p-1.5 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mb-4 md:mb-5 md:w-auto md:max-w-[min(96vw,1180px)]'>
          <div className='grid grid-cols-5 gap-1 md:hidden'>
            {mobilePrimaryItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);

              return (
                <Link
                  key={item.url}
                  href={item.url}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex min-w-0 min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-2 transition-all duration-200 active:scale-[0.97]',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[22px] shrink-0 transition-transform duration-200 group-hover:scale-105' />
                  <span className='max-w-full truncate px-0.5 text-[11px] font-medium leading-tight'>
                    {item.title}
                  </span>
                </Link>
              );
            })}

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
              <Icons.moreHorizontal className='size-[22px] shrink-0 transition-transform duration-200 group-hover:scale-105' />
              <span className='text-[11px] font-medium leading-tight'>Más</span>
            </button>
          </div>

          <div className='hidden items-stretch justify-center gap-1 md:flex'>
            {desktopNavItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const active = pathname === item.url || pathname.startsWith(`${item.url}/`);

              return (
                <Link
                  key={item.url}
                  href={item.url}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex min-w-[86px] items-center justify-center gap-2 rounded-[18px] px-4 py-2.5 transition-all duration-200 active:scale-[0.98]',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className='size-[19px] shrink-0 transition-transform duration-200 group-hover:scale-105' />
                  <span className='whitespace-nowrap text-sm font-medium'>{item.title}</span>
                </Link>
              );
            })}

            <div className='mx-1 my-2 w-px bg-border/60' aria-hidden='true' />

            <button
              type='button'
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-label='Abrir más secciones'
              className={cn(
                'group flex min-w-[92px] items-center justify-center gap-2 rounded-[18px] px-4 py-2.5 transition-all duration-200 active:scale-[0.98]',
                moreIsActive || moreOpen
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <Icons.moreHorizontal className='size-[19px] shrink-0 transition-transform duration-200 group-hover:scale-105' />
              <span className='whitespace-nowrap text-sm font-medium'>Más</span>
            </button>
          </div>
        </div>
      </nav>

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        pathname={pathname}
        isMobile={isMobile}
        mobilePrimaryItems={mobilePrimaryItems}
      />
    </>
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

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/12 p-3 backdrop-blur-[2px] md:items-end md:p-0'
      role='presentation'
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-label='Más secciones'
        className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] flex w-full max-w-3xl max-h-[min(78dvh,720px)] flex-col overflow-hidden rounded-[28px] border border-border/60 bg-background/95 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:mb-[calc(var(--mobile-nav-height,72px)+1rem)] md:max-w-[760px] md:rounded-[30px]'
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
            className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95'
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
