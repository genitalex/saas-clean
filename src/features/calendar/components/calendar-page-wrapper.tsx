'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import PageContainer from '@/components/layout/page-container';
import { CalendarPage } from './calendar-page';

export function CalendarPageWrapper({
  initialDate,
  initialView
}: {
  initialDate?: string;
  initialView?: 'month' | 'week' | 'day';
}) {
  const isMobile = useIsMobile();

  const calendar = <CalendarPage initialDate={initialDate} initialView={initialView} />;

  if (isMobile) {
    return calendar;
  }

  return <PageContainer>{calendar}</PageContainer>;
}
