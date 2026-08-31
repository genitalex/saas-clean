'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { authClient } from '@/lib/auth-client';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { desktopNavItems, mobileNavItems, navGroups } from '@/config/nav-config';
import { useIsMobile } from '@/hooks/use-mobile';

export function BottomNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const visible = useScrollDirection();
  const isMobile = useIsMobile();

  return (
    <>
      <nav
        aria-label='Primary navigation'
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-3',
          'transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none',
          visible || moreOpen ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className='mb-4 w-full max-w-5xl rounded-[28px] border border-border/50 bg-background/80 p-1.5 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.35)] backdrop-blur-xl md:mb-6 md:w-auto md:min-w-[760px]'>
          <div className='flex items-stretch justify-between gap-1 md:justify-center'>
            <div className='flex min-w-0 flex-1 items-stretch gap-1 md:flex-none'>
              {desktopNavItems.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                const active = pathname === item.url;
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      'group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 py-2.5 text-[11px] font-medium transition-all duration-200 md:min-w-[82px] md:flex-none md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm',
                      !mobileNavItems.some((mobileItem) => mobileItem.url === item.url) && 'hidden md:flex',
                      active
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    <Icon className='size-5 shrink-0 transition-transform duration-200 group-hover:scale-105 md:size-[19px]' />
                    <span className='truncate'>{item.title}</span>
                  </Link>
                );
              })}
            </div>
            <div className='hidden w-px self-stretch bg-border/60 md:block' />
            <button
              type='button'
              onClick={() => setMoreOpen(true)}
              className={cn(
                'group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 py-2.5 text-[11px] font-medium transition-all duration-200 md:min-w-[88px] md:flex-none md:flex-row md:gap-2 md:px-4 md:py-2.5 md:text-sm',
                pathname.startsWith('/dashboard/') && !desktopNavItems.some((item) => pathname === item.url)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
              aria-label='Abrir más secciones'
            >
              <Icons.moreHorizontal className='size-5 shrink-0 transition-transform duration-200 group-hover:scale-105' />
              <span>Más</span>
            </button>
          </div>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} pathname={pathname} isMobile={isMobile} />
    </>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  pathname,
  isMobile
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  isMobile: boolean;
}) {
  const { data: session } = authClient.useSession();
  const primaryUrls = new Set((isMobile ? mobileNavItems : desktopNavItems).map((item) => item.url));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='bottom'
        className='max-h-[82dvh] rounded-t-[28px] border-t border-border/60 bg-background/92 p-0 backdrop-blur-2xl md:left-1/2 md:w-[720px] md:-translate-x-1/2 md:rounded-[28px] md:border'
      >
        <SheetHeader className='border-b px-5 pb-4 pt-5 text-left'>
          <div className='flex items-center justify-between'>
            <div>
              <SheetTitle className='text-xl tracking-tight'>Más secciones</SheetTitle>
              <SheetDescription className='mt-1'>Todo lo demás que puedes hacer en tu espacio de trabajo.</SheetDescription>
            </div>
            <div className='bg-muted flex size-10 items-center justify-center rounded-full text-sm font-semibold'>
              {(session?.user.name ?? 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </SheetHeader>
        <div className='overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 md:px-5'>
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !primaryUrls.has(item.url));
            if (!items.length) return null;
            return (
              <section key={group.label} className='mb-5'>
                <div className='px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>{group.label}</div>
                <div className='grid gap-1 md:grid-cols-2'>
                  {items.map((item) => {
                    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                    const active = pathname === item.url;
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors',
                          active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'
                        )}
                      >
                        <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/70'>
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
            <div className='px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>Cuenta</div>
            <Link href='/dashboard/profile' onClick={() => onOpenChange(false)} className='flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium hover:bg-muted/70'>
              <span className='flex size-9 items-center justify-center rounded-xl bg-muted/70'><Icons.profile className='size-5' /></span>
              Perfil
            </Link>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
