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
const notesItem = navGroups[1].items.find((item) => item.title === 'Notes')!;
const quotesItem = navGroups[1].items.find((item) => item.title === 'Quotes')!;

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

  const mobileLeftItems = resolvedDesktopItems.slice(0, 3);
  const mobileRightItems = [resolvedDesktopItems[3], opportunitiesItem].filter(Boolean);
  const desktopLeftItems = resolvedDesktopItems.slice(0, 4);
  const desktopRightItems = [opportunitiesItem, notesItem, quotesItem].filter(Boolean);
  const primaryUrls = new Set([...mobileNavItems.map((item) => item.url), opportunitiesItem.url]);

  React.useEffect(() => {
    setMoreOpen(false);
    setCreateOpen(false);
  }, [pathname]);

  type NavItem = (typeof navGroups)[number]['items'][number];

  const renderNavItem = (item: NavItem) => {
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
            ? 'bg-primary/10 text-primary md:bg-transparent'
            : 'text-muted-foreground hover:text-foreground',
          'focus-visible:ring-2 focus-visible:ring-primary/30'
        )}
      >
        <span className='pointer-events-none absolute -top-10 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/50 bg-popover px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100'>
          {label}
        </span>
        <span className='flex size-11 origin-bottom items-center justify-center rounded-[12px] transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-2 group-hover:scale-[1.2] group-focus-visible:-translate-y-2 group-focus-visible:scale-[1.2]'>
          <ColoredNavIcon title={item.title} />
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
        <div className='relative mx-auto mb-0 w-full rounded-none border border-x-0 border-b-0 border-border/70 bg-background/68 px-3 py-2 shadow-[0_14px_42px_rgb(23_32_25_/_0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/58 sm:w-full md:mb-5 md:w-fit md:max-w-[calc(100vw-32px)] md:rounded-[20px] md:border md:px-4 md:py-1'>
          <div className='flex min-h-[58px] w-full items-center justify-center gap-4 md:w-auto md:gap-5 md:min-h-[48px]'>
            <div className='flex flex-1 items-center justify-around gap-2 md:hidden'>
              {mobileLeftItems.map((item) => renderNavItem(item))}
            </div>
            <div className='hidden items-center justify-start gap-5 md:flex'>
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
                'group relative z-10 flex size-12 shrink-0 items-center justify-center rounded-[15px] border border-primary/30 bg-primary text-primary-foreground shadow-[0_8px_22px_rgb(23_32_25_/_0.16)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgb(23_32_25_/_0.2)] active:scale-[0.96] md:size-[50px]',
                createOpen && 'bg-primary/90'
              )}
            >
              <span className='relative block size-6'>
                <Icons.add
                  className={cn(
                    'absolute inset-0 m-auto transition-all duration-200 ease-out',
                    createOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
                    'size-[25px] md:size-[26px]'
                  )}
                />
                <Icons.close
                  className={cn(
                    'absolute inset-0 m-auto transition-all duration-200 ease-out',
                    createOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
                    'size-[25px] md:size-[26px]'
                  )}
                />
              </span>
              <span className='sr-only'>Nuevo</span>
            </button>

            <div className='flex flex-1 items-center justify-around gap-2 md:hidden'>
              {mobileRightItems.map((item) => renderNavItem(item))}
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
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className='pointer-events-none absolute -top-10 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/50 bg-popover px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100'>
                  Más
                </span>
                <span className='flex size-11 origin-bottom items-center justify-center rounded-[12px] transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-2 group-hover:scale-[1.2] group-focus-visible:-translate-y-2 group-focus-visible:scale-[1.2]'>
                  <Icons.moreHorizontal className='size-[24px]' strokeWidth={2.15} />
                </span>
                <span className='sr-only'>Más</span>
              </button>
            </div>

            <div className='hidden items-center justify-start gap-5 md:flex'>
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
                    ? 'bg-primary/10 text-primary md:bg-transparent'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className='pointer-events-none absolute -top-10 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/50 bg-popover px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100'>
                  Más
                </span>
                <span className='flex size-11 origin-bottom items-center justify-center rounded-[12px] transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-2 group-hover:scale-[1.2] group-focus-visible:-translate-y-2 group-focus-visible:scale-[1.2]'>
                  <Icons.moreHorizontal className='size-[24px]' strokeWidth={2.15} />
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

function ColoredNavIcon({ title, compact = false }: { title: string; compact?: boolean }) {
  const gradientId = React.useId().replace(/:/g, '');
  const size = compact ? 20 : 25;

  const palette: Record<string, [string, string]> = {
    Today: ['#3b82f6', '#8b5cf6'],
    Work: ['#6366f1', '#a855f7'],
    Calendar: ['#06b6d4', '#3b82f6'],
    Customers: ['#f97316', '#ec4899'],
    Opportunities: ['#ec4899', '#f43f5e'],
    Notifications: ['#ef4444', '#f97316'],
    Notes: ['#8b5cf6', '#6366f1'],
    Quotes: ['#6366f1', '#3b82f6'],
    Templates: ['#f59e0b', '#ef4444'],
    Goals: ['#10b981', '#06b6d4'],
    Documents: ['#14b8a6', '#3b82f6'],
    Team: ['#3b82f6', '#06b6d4'],
    Automations: ['#f97316', '#ef4444'],
    Integrations: ['#06b6d4', '#14b8a6'],
    Users: ['#3b82f6', '#6366f1'],
    Workspaces: ['#a855f7', '#ec4899'],
    Settings: ['#64748b', '#94a3b8']
  };
  const [from, to] = palette[title] ?? ['#64748b', '#94a3b8'];
  const stroke = `url(#nav-gradient-${gradientId})`;
  const fill = `url(#nav-gradient-${gradientId})`;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true
  } as const;

  const outline = {
    stroke,
    strokeWidth: compact ? 1.9 : 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  const icon = (() => {
    switch (title) {
      case 'Today':
        return (
          <>
            <path d='M12 3v8l5 3' {...outline} />
            <circle cx='12' cy='12' r='8.5' {...outline} />
          </>
        );
      case 'Work':
        return (
          <>
            <path d='M6.5 12.5 10 16l7.5-8' {...outline} />
            <circle cx='12' cy='12' r='9' {...outline} />
          </>
        );
      case 'Calendar':
        return (
          <>
            <rect x='3.5' y='5' width='17' height='15' rx='3' {...outline} />
            <path d='M7 3.5v4M17 3.5v4M3.5 9h17' {...outline} />
            <path d='M8 13h2M13 13h3M8 16h2M13 16h3' {...outline} />
          </>
        );
      case 'Customers':
      case 'Team':
      case 'Users':
        return (
          <>
            <circle cx='9' cy='8' r='3' {...outline} />
            <path d='M3.5 19c.7-3.1 2.6-4.8 5.5-4.8s4.8 1.7 5.5 4.8' {...outline} />
            <path d='M16 6.3a2.8 2.8 0 1 1 0 5.4M16 14c2.3.2 3.8 1.8 4.5 4' {...outline} />
          </>
        );
      case 'Opportunities':
      case 'Goals':
        return (
          <>
            <path d='M4 17.5 9 12l3 3 7.5-8' {...outline} />
            <path d='M15 7h4.5v4.5' {...outline} />
            <path d='M4 20h16' {...outline} />
          </>
        );
      case 'Notifications':
        return (
          <>
            <path d='M6.5 10a5.5 5.5 0 1 1 11 0v3.5l1.5 2H5l1.5-2Z' {...outline} />
            <path d='M10 19h4' {...outline} />
          </>
        );
      case 'Notes':
      case 'Quotes':
      case 'Templates':
        return (
          <>
            <path d='M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20Z' {...outline} />
            <path d='M14 3.5V8h4M9 12h6M9 15.5h6' {...outline} />
          </>
        );
      case 'Documents':
        return (
          <>
            <path d='M5.5 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5Z' {...outline} />
            <path d='M14.5 3.5V8h4M8.5 12h6M8.5 15.5h4' {...outline} />
          </>
        );
      case 'Automations':
        return <path d='m13 2-8 12h6l-1 8 8-12h-6Z' fill={fill} />;
      case 'Integrations':
        return (
          <>
            <path d='M8 6v4a4 4 0 0 0 4 4h4' {...outline} />
            <path d='M16 10V6M16 6h-4M16 6l3 3' {...outline} />
            <circle cx='8' cy='6' r='2.2' fill={fill} />
            <circle cx='16' cy='18' r='2.2' fill={fill} />
          </>
        );
      case 'Workspaces':
        return (
          <>
            <path d='M4 7.5 7 4h5l2.5 3.5' {...outline} />
            <path d='M4 7.5h15.5L18 20H5Z' {...outline} />
            <path d='M9 7.5v3.2a3 3 0 0 0 3 3h2.2' {...outline} />
          </>
        );
      case 'Settings':
        return (
          <>
            <path
              d='M12 3.8 13.3 5.5l2.1-.2.7 2 1.9.9-.7 2 1.3 1.6-1.3 1.7.7 2-1.9.9-.7 2-2.1-.2L12 20.1l-1.3-1.6-2.1.2-.7-2-1.9-.9.7-2-1.3-1.7 1.3-1.6-.7-2 1.9-.9.7-2 2.1.2Z'
              {...outline}
            />
            <circle cx='12' cy='12' r='2.7' {...outline} />
          </>
        );
      default:
        return (
          <>
            <circle cx='12' cy='12' r='8.5' {...outline} />
            <path d='M12 8v8M8 12h8' {...outline} />
          </>
        );
    }
  })();

  return (
    <svg {...common}>
      <defs>
        <linearGradient
          id={`nav-gradient-${gradientId}`}
          x1='3'
          y1='4'
          x2='21'
          y2='20'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0' stopColor={from} />
          <stop offset='1' stopColor={to} />
        </linearGradient>
      </defs>
      {icon}
    </svg>
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
  const excludedTitles = isMobile
    ? new Set(['Notifications'])
    : new Set(['Notifications', 'Notes', 'Quotes']);

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
            const items = group.items.filter(
              (item) => !primaryUrls.has(item.url) && !excludedTitles.has(item.title)
            );
            if (!items.length) return null;

            return (
              <section key={group.label} className='mb-5 last:mb-0'>
                <p className='text-muted-foreground px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]'>
                  {group.label}
                </p>
                <div className='grid gap-1 sm:grid-cols-2'>
                  {items.map((item) => {
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
                          <ColoredNavIcon title={item.title} compact />
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
