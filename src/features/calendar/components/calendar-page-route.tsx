'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import PageContainer from '@/components/layout/page-container';
import { CalendarPage } from './calendar-page';

/**
 * Mobile calendar is a dedicated full-screen application surface.
 * Desktop calendar uses the normal PageContainer dashboard layout.
 *
 * This component handles the conditional rendering based on viewport.
 */
export function CalendarPageRoute() {
  const isMobile = useIsMobile();

  // On mobile: Calendar fills the available screen space edge-to-edge
  // No PageContainer padding/margins - it's its own application surface
  if (isMobile) {
    return <CalendarPage />;
  }

  // On desktop: Calendar is a normal dashboard page with PageContainer layout
  return (
    <PageContainer>
      <CalendarPage />
    </PageContainer>
  );
}
