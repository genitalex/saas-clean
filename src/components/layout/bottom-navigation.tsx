'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { desktopNavItems, mobileNavItems, navGroups } from '@/config/nav-config';
import { useIsMobile } from '@/hooks/use-mobile';

const activityItem = navGroups[1].items.find((item) => item.url === '/dashboard/activity');

export function BottomNavigation() {
  const pathname = usePathname();
  const visible = useScrollDirection();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const mobileLeftItems = desktopNavItems.slice(0, 3);
  const mobileRightItems = [desktopNavItems[3], ...(activityItem ? [activityItem] : [])];
  const desktopLeftItems = desktopNavItems.slice(0, 3);
  const desktopRightItems = [desktopNavItems[3], ...(activityItem ? [activityItem] : [])];
  const primaryUrls = new Set([
    ...mobileNavItems.map((item) => item.url),
    ...(!activityItem ? [] : [activityItem.url])
  ]);

  React.useEffect(() => {
    setMoreOpen(false);
    setCreateOpen(false);
  }, [pathname]);

  type NavItem = (typeof navGroups)[number]['items'][number];

  const renderNavItem = (item: NavItem, mobile = false) => {
    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
    const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
    return (
      <Link
        key={item.url}
        href={item.url}
        className={cn(
          'group flex min-w-0 items-center justify-center rounded-[10px] transition-colors',
          mobile ? 'h-[54px] w-full max-w-10 p-0' : 'min-h-[50px] flex-col gap-1 px-2 py-2',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
        )}
      >
        <Icon className={cn('shrink-0', mobile ? 'size-[20px]' : 'size-[18px]')} />
        {!mobile && (
          <span className='max-w-full truncate text-[10px] font-medium leading-none'>
            {item.title === 'Today'
              ? 'Hoy'
              : item.title === 'Work'
                ? 'Trabajo'
                : item.title === 'Calendar'
                  ? 'Calendario'
                  : item.title === 'Customers'
                    ? 'Clientes'
                    : item.title}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label='Primary navigation'
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-0 md:px-4',
          'transition-transform duration-300 ease-out will-change-transform',
          visible || moreOpen || createOpen ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className='relative mb-0 w-full max-w-[980px] rounded-none border border-x-0 border-b-0 border-border/70 bg-card px-1 pt-1 pb-0 shadow-[0_-6px_20px_rgb(23_32_25_/_0.07)] md:rounded-[var(--radius-xl)] md:border md:px-1 md:py-1 md:shadow-md md:mb-5'>
          <div className='relative min-h-[60px] md:min-h-[54px]'>
            <div className='mx-auto grid h-[60px] w-[calc(100%-24px)] max-w-[360px] grid-cols-[repeat(3,minmax(0,1fr))_56px_repeat(3,minmax(0,1fr))] items-center gap-2 md:hidden'>
              {mobileLeftItems.map((item) => (
                <div
                  key={`mobile-${item.url}`}
                  className='flex h-[54px] w-full shrink-0 items-center justify-center'
                >
                  {renderNavItem(item, true)}
                </div>
              ))}

              <button
                type='button'
                aria-expanded={createOpen}
                aria-label={createOpen ? 'Cerrar crear' : 'Nuevo'}
                onClick={() => {
                  setMoreOpen(false);
                  setCreateOpen((value) => !value);
                }}
                className={cn(
                  'group z-10 flex h-[54px] w-[56px] shrink-0 items-center justify-center self-center rounded-[12px] border-[3px] border-card bg-primary text-primary-foreground shadow-[0_7px_18px_rgb(23_32_25_/_0.14)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgb(23_32_25_/_0.18)] active:scale-[0.96]',
                  createOpen && 'bg-[#49674F]'
                )}
              >
                <span className='relative block size-[38px]'>
                  <span
                    className={cn(
                      'absolute inset-0 m-auto flex items-center justify-center transition-all duration-200 ease-out',
                      createOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                    )}
                  >
                    <Icons.add className='size-[29px]' />
                  </span>
                  <span
                    className={cn(
                      'absolute inset-0 m-auto flex items-center justify-center transition-all duration-200 ease-out',
                      createOpen ? 'rotate-0 scale-110 opacity-100' : '-rotate-90 scale-0 opacity-0'
                    )}
                  >
                    <Icons.close className='size-[29px]' />
                  </span>
                </span>
                <span className='sr-only'>Nuevo</span>
              </button>

              {mobileRightItems.map((item) => (
                <div
                  key={`mobile-${item.url}`}
                  className='flex h-[54px] w-full shrink-0 items-center justify-center'
                >
                  {renderNavItem(item, true)}
                </div>
              ))}

              <button
                type='button'
                aria-expanded={moreOpen}
                onClick={() => {
                  setCreateOpen(false);
                  setMoreOpen(true);
                }}
                className={cn(
                  'flex h-[54px] w-full max-w-10 items-center justify-center rounded-[10px] p-0 transition-colors',
                  moreOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icons.moreHorizontal className='size-[20px]' />
                <span className='sr-only'>Más</span>
              </button>
            </div>

            <div className='hidden h-full w-full grid-cols-7 items-stretch gap-0 md:grid'>
              {desktopLeftItems.map((item) => renderNavItem(item))}
              <button
                type='button'
                aria-expanded={createOpen}
                aria-label={createOpen ? 'Cerrar crear' : 'Nuevo'}
                onClick={() => {
                  setMoreOpen(false);
                  setCreateOpen((value) => !value);
                }}
                className={cn(
                  'group z-10 flex self-center items-center justify-center justify-self-center rounded-[13px] border-[3px] border-card bg-primary text-primary-foreground shadow-[0_7px_18px_rgb(23_32_25_/_0.14)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgb(23_32_25_/_0.18)] active:scale-[0.96]',
                  'h-[50px] w-[70px]',
                  createOpen && 'bg-[#49674F]'
                )}
              >
                <span className='relative block size-6'>
                  <Icons.add
                    className={cn(
                      'absolute inset-0 m-auto transition-all duration-200 ease-out',
                      createOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
                      'size-[22px]'
                    )}
                  />
                  <Icons.close
                    className={cn(
                      'absolute inset-0 m-auto transition-all duration-200 ease-out',
                      createOpen
                        ? 'rotate-0 scale-100 opacity-100'
                        : '-rotate-90 scale-0 opacity-0',
                      'size-[22px]'
                    )}
                  />
                </span>
                <span className='sr-only'>Nuevo</span>
              </button>
              {desktopRightItems.map((item) => renderNavItem(item))}
              <button
                type='button'
                aria-expanded={moreOpen}
                onClick={() => {
                  setCreateOpen(false);
                  setMoreOpen(true);
                }}
                className={cn(
                  'flex min-w-0 min-h-[50px] flex-col items-center justify-center gap-1 rounded-[10px] px-2 py-2 transition-colors',
                  moreOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icons.moreHorizontal className='size-[18px]' />
                <span className='text-[10px] font-medium leading-none'>Más</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {createOpen && <QuickCreate onClose={() => setCreateOpen(false)} isMobile={isMobile} />}
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

function QuickCreate({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const items = [
    {
      label: 'Nueva tarea',
      description: 'Organiza trabajo pendiente',
      href: '/dashboard/tasks',
      icon: Icons.check
    },
    {
      label: 'Nuevo evento',
      description: 'Reserva un espacio en tu calendario',
      href: '/dashboard/calendar',
      icon: Icons.calendar
    },
    {
      label: 'Nuevo cliente',
      description: 'Añade una relación al equipo',
      href: '/dashboard/customers',
      icon: Icons.teams
    },
    {
      label: 'Nueva oportunidad',
      description: 'Convierte una posibilidad en trabajo',
      href: '/dashboard/opportunities',
      icon: Icons.opportunities
    },
    {
      label: 'Nota rápida',
      description: 'Captura algo antes de olvidarlo',
      href: '/dashboard/notes',
      icon: Icons.page
    },
    {
      label: 'Presupuesto',
      description: 'Prepara una nueva propuesta',
      href: '/dashboard/quotes',
      icon: Icons.post
    }
  ];

  return (
    <div
      className='fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 p-3'
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section className='mb-[calc(var(--mobile-nav-height,72px)+0.85rem)] w-full max-w-2xl overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-popover shadow-lg'>
        <div className='border-b border-border/50 px-5 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]'>
                Crear
              </p>
              <h2 className='mt-1 text-lg font-semibold tracking-tight'>¿Qué quieres hacer?</h2>
            </div>
            <button
              type='button'
              onClick={onClose}
              aria-label='Cerrar crear'
              className='bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors'
            >
              <Icons.close className='size-4' />
            </button>
          </div>
        </div>
        <div className={cn('grid gap-1.5 p-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          {items.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={href + label}
              href={href}
              onClick={onClose}
              className='group flex min-h-[68px] items-center gap-3 rounded-[12px] px-3.5 py-3 transition-colors hover:bg-accent'
            >
              <span className='bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors'>
                <Icon className='size-4' />
              </span>
              <span className='min-w-0'>
                <span className='block text-sm font-medium'>{label}</span>
                <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
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
      className='fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-3'
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section className='mb-[calc(var(--mobile-nav-height,72px)+0.75rem)] flex h-[min(78dvh,680px)] max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-popover p-0 shadow-lg sm:mb-4 md:mb-5'>
        <div className='flex items-center justify-between border-b border-border/50 px-5 py-4'>
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

        <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
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
                          'flex min-h-12 items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium hover:bg-muted/60',
                          active && 'bg-primary/10 text-primary'
                        )}
                      >
                        <span className='bg-muted/70 flex size-9 items-center justify-center rounded-[10px]'>
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
