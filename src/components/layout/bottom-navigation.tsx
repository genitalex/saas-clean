'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { desktopNavItems, mobileNavItems, navGroups } from '@/config/nav-config';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { useIsMobile } from '@/hooks/use-mobile';

const opportunitiesItem = desktopNavItems[4];

export function BottomNavigation() {
  const pathname = usePathname();
  const visible = useScrollDirection();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const filteredGroups = useFilteredNavGroups(navGroups);
  const visibleNavItems = filteredGroups[0]?.items ?? [];
  const resolvedDesktopItems =
    visibleNavItems.length >= 5
      ? visibleNavItems.slice(0, 5)
      : [
          desktopNavItems[0],
          desktopNavItems[1],
          desktopNavItems[2],
          desktopNavItems[3],
          desktopNavItems[4]
        ];
  const desktopLeftItems = resolvedDesktopItems.slice(0, 3);
  const desktopRightItems = [resolvedDesktopItems[3], opportunitiesItem].filter(Boolean);
  const primaryUrls = new Set([...mobileNavItems.map((item) => item.url), opportunitiesItem.url]);

  React.useEffect(() => {
    setMoreOpen(false);
    setCreateOpen(false);
  }, [pathname]);

  type NavItem = (typeof navGroups)[number]['items'][number];

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
    const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
    const label =
      item.title === 'Today'
        ? 'Hoy'
        : item.title === 'Work'
          ? 'Trabajo'
          : item.title === 'Calendar'
            ? 'Calendario'
            : item.title === 'Customers'
              ? 'Clientes'
              : item.title;

    return (
      <Link
        key={item.url}
        href={item.url}
        aria-label={label}
        className={cn(
          'group relative flex size-11 shrink-0 items-center justify-center rounded-xl outline-none transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          'focus-visible:ring-2 focus-visible:ring-primary/30'
        )}
      >
        <span className='pointer-events-none absolute -top-10 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/50 bg-popover px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100'>
          {label}
        </span>
        <span className='flex size-9 origin-bottom items-center justify-center rounded-[10px] transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:scale-125 group-focus-visible:-translate-y-1.5 group-focus-visible:scale-125'>
          <Icon className='size-[19px]' />
        </span>
        {active && (
          <span
            aria-hidden
            className='absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary'
          />
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
        <div className='relative mx-auto mb-0 w-[calc(100%-20px)] max-w-[650px] rounded-[20px] border border-border/70 bg-background/72 p-1.5 shadow-[0_14px_42px_rgb(23_32_25_/_0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/62 md:mb-5 md:p-2'>
          <div className='flex min-h-[56px] items-center justify-center gap-1 md:gap-1.5'>
            <div className='flex min-w-0 flex-1 items-center justify-evenly gap-1 md:gap-1.5'>
              {desktopLeftItems.map((item) => renderNavItem(item))}
            </div>

            <button
              type='button'
              aria-expanded={createOpen}
              aria-label={createOpen ? 'Cerrar crear' : 'Nuevo'}
              onClick={() => {
                setMoreOpen(false);
                setCreateOpen((value) => !value);
              }}
              className={cn(
                'group relative z-10 flex size-12 shrink-0 items-center justify-center rounded-[15px] border border-primary/30 bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(23_32_25_/_0.16)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgb(23_32_25_/_0.2)] active:scale-[0.96] md:size-[52px]',
                createOpen && 'bg-primary/90'
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
                    createOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
                    'size-[22px]'
                  )}
                />
              </span>
              <span className='sr-only'>Nuevo</span>
            </button>

            <div className='flex min-w-0 flex-1 items-center justify-evenly gap-1 md:gap-1.5'>
              {desktopRightItems.map((item) => renderNavItem(item))}
              <button
                type='button'
                aria-expanded={moreOpen}
                aria-label='Más'
                onClick={() => {
                  setCreateOpen(false);
                  setMoreOpen(true);
                }}
                className={cn(
                  'group relative flex size-11 shrink-0 items-center justify-center rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30',
                  moreOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <span className='pointer-events-none absolute -top-10 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/50 bg-popover px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100'>
                  Más
                </span>
                <span className='flex size-9 origin-bottom items-center justify-center rounded-[10px] transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-125 group-focus-visible:-translate-y-1.5 group-focus-visible:scale-125'>
                  <Icons.moreHorizontal className='size-[20px]' />
                </span>
                <span className='sr-only'>Más</span>
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
          filteredGroups={filteredGroups}
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
      href: '/dashboard/my-work?mode=list&create=1',
      icon: Icons.check
    },
    {
      label: 'Nuevo evento',
      description: 'Reserva un espacio en tu calendario',
      href: '/dashboard/calendar?create=1',
      icon: Icons.calendar
    },
    {
      label: 'Nuevo cliente',
      description: 'Añade una relación al equipo',
      href: '/dashboard/customers?create=1',
      icon: Icons.teams
    },
    {
      label: 'Nueva oportunidad',
      description: 'Convierte una posibilidad en trabajo',
      href: '/dashboard/opportunities?create=1',
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
  primaryUrls,
  filteredGroups
}: {
  pathname: string;
  isMobile: boolean;
  onClose: () => void;
  primaryUrls: Set<string>;
  filteredGroups: typeof navGroups;
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
          {filteredGroups.map((group) => {
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
