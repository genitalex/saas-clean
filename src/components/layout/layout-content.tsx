'use client';

import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import Header from './header';
import { ModeExperiences } from '@/features/modes/components/mode-experiences';
import { InfobarProvider } from '@/components/ui/infobar';
import { InfoSidebar } from './info-sidebar';
import { cn } from '@/lib/utils';

interface LayoutContentProps {
  children: React.ReactNode;
}

/**
 * Unified layout shell for dashboard routes.
 *
 * No more sidebar. Navigation is unified bottom nav for both desktop and mobile.
 *
 * On mobile + calendar route: renders a minimal shell that lets the
 * Calendar own the full screen without generic dashboard chrome.
 *
 * All other cases: renders the full dashboard shell with header,
 * mode experiences, etc., and includes padding for the bottom nav.
 */
export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isCalendarRoute = pathname === '/dashboard/calendar';

  /**
   * Mobile calendar: dedicate the full screen to Calendar.
   * No generic header, no sidebars, no dashboard chrome.
   * Calendar provides its own headers and navigation.
   * The BottomNavigation is still rendered at the dashboard layout level.
   */
  if (isMobile && isCalendarRoute) {
    return (
      <main
        id='main-content'
        tabIndex={-1}
        className='flex min-h-0 flex-1 min-w-0 flex-col pb-[calc(var(--mobile-nav-height,72px)+env(safe-area-inset-bottom))]'
      >
        {children}
      </main>
    );
  }

  /**
   * All other pages: render the clean dashboard shell.
   * Desktop and mobile share the same structure, just with responsive padding.
   */
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className={cn(
        'flex-1 min-w-0 scroll-mt-16',
        // Padding for bottom nav + safe area inset on mobile
        'pb-[calc(var(--mobile-nav-height,72px)+env(safe-area-inset-bottom))] md:pb-6'
      )}
    >
      <Header />
      <ModeExperiences />
      <InfobarProvider defaultOpen={false}>
        {children}
        <InfoSidebar side='right' />
      </InfobarProvider>
    </main>
  );
}
