'use client';

import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import AppSidebar from './app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import Header from './header';
import { ModeExperiences } from '@/features/modes/components/mode-experiences';
import { InfobarProvider } from '@/components/ui/infobar';
import { InfoSidebar } from './info-sidebar';

interface LayoutContentProps {
  children: React.ReactNode;
}

/**
 * Conditional layout shell for dashboard routes.
 *
 * On mobile + calendar route: renders a minimal shell that lets the
 * Calendar own the full screen without generic dashboard chrome.
 *
 * All other cases: renders the full dashboard shell with sidebar,
 * header, mode experiences, etc.
 *
 * This is the correct place to handle mobile calendar as a dedicated
 * application surface, not a dashboard page inside generic chrome.
 */
export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isCalendarRoute = pathname === '/dashboard/calendar';

  /**
   * Mobile calendar: dedicate the full screen to Calendar.
   * No generic header, no sidebars, no dashboard chrome.
   * Calendar provides its own headers and navigation.
   * The MobileBottomNav is still rendered at the dashboard layout level.
   */
  if (isMobile && isCalendarRoute) {
    return <div className='flex flex-1 flex-col min-h-0 w-full'>{children}</div>;
  }

  /**
   * Desktop calendar or any other dashboard page:
   * render the full dashboard shell.
   */
  return (
    <>
      <AppSidebar />
      <SidebarInset
        id='main-content'
        tabIndex={-1}
        className='min-w-0 scroll-mt-16 pb-[calc(var(--mobile-nav-height,80px)+env(safe-area-inset-bottom))] md:pb-0'
      >
        <Header />
        <ModeExperiences />
        <InfobarProvider defaultOpen={false}>
          {children}
          <InfoSidebar side='right' />
        </InfobarProvider>
      </SidebarInset>
    </>
  );
}
