'use client';

import React from 'react';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { NotificationCenter } from '@/features/automations/components/notification-center';
import { UserNav } from './user-nav';
import { useShellMetric } from '@/hooks/use-shell-metric';
import { useKBar } from 'kbar';
import { Icons } from '@/components/icons';

export default function Header() {
  const { query } = useKBar();
  const headerRef = React.useRef<HTMLDivElement>(null);
  useShellMetric(headerRef, '--app-header-height');

  return (
    <div ref={headerRef} className='sticky top-0 z-20 h-14 border-b border-border/60 bg-background'>
      <header className='relative grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-4'>
        <div className='hidden min-w-0 items-center gap-2 md:flex'>
          <Breadcrumbs />
        </div>

        <div className='flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 md:col-start-2'>
          <button
            type='button'
            aria-label='Abrir búsqueda'
            onClick={query.toggle}
            className='text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 w-[min(7.5rem,42vw)] shrink-0 items-center justify-start gap-1.5 rounded-[11px] border border-border/70 bg-background px-3 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors md:hidden'
          >
            <Icons.search className='size-3.5 shrink-0' />
            <span>Buscar</span>
          </button>

          <div className='hidden md:flex'>
            <SearchInput />
          </div>

          <div className='hidden sm:flex'>
            <ThemeModeToggle />
            <ThemeSelector />
          </div>

          <Separator orientation='vertical' className='mx-0.5 hidden h-5 sm:block' />

          <NotificationCenter />
        </div>

        <div className='col-start-2 row-start-1 ml-auto md:col-start-3'>
          <UserNav />
        </div>
      </header>
    </div>
  );
}
