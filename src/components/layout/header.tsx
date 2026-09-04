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
import { GlassSurface } from '@/components/ui/glass-surface';

export default function Header() {
  const { query } = useKBar();
  const headerRef = React.useRef<HTMLElement>(null);
  useShellMetric(headerRef, '--app-header-height');

  return (
    <GlassSurface
      as='header'
      ref={headerRef}
      material='regular'
      refractive
      refractionStrength={0.16}
      className='bg-background/95 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 px-3 shadow-[inset_0_-1px_0_rgba(15,23,42,0.04)] sm:px-5'
    >
      <div className='flex min-w-0 items-center gap-2'>
        <Breadcrumbs />
      </div>

      <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
        <button
          type='button'
          aria-label='Abrir búsqueda'
          onClick={query.toggle}
          className='text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-xl md:hidden'
        >
          <Icons.search className='size-4' />
        </button>
        <div className='hidden md:flex'>
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
    </GlassSurface>
  );
}
