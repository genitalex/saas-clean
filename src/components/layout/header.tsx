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
    <div
      ref={headerRef}
      data-glass-header-shell
      className='sticky top-0 z-20 h-14 border-b border-border/60 bg-background/95 supports-backdrop-filter:backdrop-blur-sm'
    >
      <header
        data-design-id='shell.header'
        data-design-component='Header'
        data-design-source='src/components/layout/header.tsx'
        data-glass-header
        className='relative flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-5'
      >
        <div className='flex min-w-0 items-center gap-2'>
          <Breadcrumbs />
        </div>

        <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
          <button
            type='button'
            aria-label='Abrir búsqueda'
            onClick={query.toggle}
            className='text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-[10px] transition-colors md:hidden'
          >
            <Icons.search className='size-4' />
          </button>

          <div
            data-design-id='header.search'
            data-design-component='Search'
            className='hidden md:flex'
          >
            <SearchInput />
          </div>

          <ThemeModeToggle />

          <div className='hidden sm:block'>
            <ThemeSelector />
          </div>

          <Separator orientation='vertical' className='mx-0.5 hidden h-5 sm:block' />

          <NotificationCenter />
          <UserNav />
        </div>
      </header>
    </div>
  );
}
