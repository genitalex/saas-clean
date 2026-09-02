'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import PageContainer from '@/components/layout/page-container';
import { CalendarPage } from './calendar-page';

export function CalendarPageWrapper({
  initialDate,
  initialView,
  initialEventId,
  initialCreate
}: {
  initialDate?: string;
  initialView?: 'month' | 'week' | 'day' | 'agenda';
  initialEventId?: string;
  initialCreate?: boolean;
}) {
  const isMobile = useIsMobile();

  const calendar = (
    <CalendarPage
      initialDate={initialDate}
      initialView={initialView}
      initialEventId={initialEventId}
      initialCreate={initialCreate}
    />
  );

  if (isMobile) {
    return calendar;
  }

  return <PageContainer>{calendar}</PageContainer>;
}
