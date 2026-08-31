'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { authClient } from '@/lib/auth-client';
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
  const { data: session } = authClient.useSession();
  const primaryItems = isMobile ? mobilePrimaryItems : desktopNavItems;
  const primaryUrls = new Set(primaryItems.map((item) => item.url));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='bottom'
        className='max-h-[min(82dvh,760px)] rounded-t-[28px] border-t border-border/60 bg-background/92 p-0 backdrop-blur-2xl md:inset-x-auto md:bottom-24 md:left-1/2 md:right-auto md:w-[min(760px,calc(100vw-48px))] md:-translate-x-1/2 md:rounded-[28px] md:border'
      >
        <SheetHeader className='border-b px-5 pb-4 pt-5 text-left'>
          <div className='flex items-center justify-between gap-4'>
            <div className='min-w-0'>
              <SheetTitle className='text-xl tracking-tight'>Más secciones</SheetTitle>
              <SheetDescription className='mt-1'>
                Accesos secundarios de tu espacio de trabajo.
              </SheetDescription>
            </div>
            <div className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
              {(session?.user.name ?? 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </SheetHeader>

        <div className='overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:px-5'>
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !primaryUrls.has(item.url));

            if (!items.length) return null;

            return (
              <section key={group.label} className='mb-5 last:mb-0'>
                <div className='px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                  {group.label}
                </div>

                <div className='grid gap-1 md:grid-cols-2'>
                  {items.map((item) => {
                    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                    const active = pathname === item.url || pathname.startsWith(`${item.url}/`);

                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={() => onOpenChange(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[52px] items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all active:scale-[0.99]',
                          active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl',
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
            <div className='px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
              Cuenta
            </div>

            <Link
              href='/dashboard/profile'
              onClick={() => onOpenChange(false)}
              aria-current={pathname.startsWith('/dashboard/profile') ? 'page' : undefined}
              className={cn(
                'flex min-h-[52px] items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all',
                pathname.startsWith('/dashboard/profile')
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/70'
              )}
            >
              <span className='bg-muted/70 flex size-9 shrink-0 items-center justify-center rounded-xl'>
                <Icons.profile className='size-5' />
              </span>
              Perfil
            </Link>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
