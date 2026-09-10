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
      <header className='relative flex h-14 min-w-0 items-center gap-2 px-3 sm:px-5 md:gap-4'>
        <div className='hidden min-w-0 flex-1 items-center gap-2 md:flex'>
          <Breadcrumbs />
        </div>

        <div className='flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2'>
          <button
            type='button'
            aria-label='Abrir búsqueda'
            onClick={query.toggle}
            className='text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 min-w-0 flex-1 max-w-[170px] items-center gap-1.5 rounded-[10px] border border-border/70 bg-background px-2.5 text-xs font-medium transition-colors md:hidden'
          >
            <Icons.search className='size-3.5 shrink-0' />
            <span className='truncate'>Buscar</span>
          </button>

          <div className='hidden md:flex'>
            <SearchInput />
          </div>

          <div className='hidden md:flex items-center gap-2'>
            <ThemeModeToggle />
            <ThemeSelector />
          </div>

          <Separator orientation='vertical' className='mx-0.5 hidden h-5 sm:block md:hidden' />

          <NotificationCenter />
          <UserNav />
        </div>
      </header>
    </div>
  );
}
