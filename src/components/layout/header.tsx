'use client';

import React from 'react';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { UserNav } from './user-nav';
import { useShellMetric } from '@/hooks/use-shell-metric';

export default function Header() {
  const headerRef = React.useRef<HTMLElement>(null);
  useShellMetric(headerRef, '--app-header-height');

  return (
    <header
      ref={headerRef}
      className='bg-background/85 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 backdrop-blur-md sm:px-4'
    >
      <div className='flex min-w-0 items-center gap-2'>
        <Breadcrumbs />
      </div>

      <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
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
    </header>
  );
}
