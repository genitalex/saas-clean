'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import PageContainer from '@/components/layout/page-container';
import { CalendarPage } from './calendar-page';

/**
 * Conditional wrapper for calendar page based on viewport size.
 *
 * Mobile: Renders CalendarPage directly without PageContainer, allowing it
 * to fill the full screen space. LayoutContent (at the dashboard layout level)
 * ensures the generic shell (Header, sidebars, etc.) is also stripped.
 *
 * Desktop: Renders CalendarPage wrapped in PageContainer for proper
 * dashboard page layout with standard padding and spacing.
 */
export function CalendarPageWrapper() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <CalendarPage />;
  }

  return (
    <PageContainer>
      <CalendarPage />
    </PageContainer>
  );
}
