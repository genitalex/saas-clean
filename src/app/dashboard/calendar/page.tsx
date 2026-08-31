import { CalendarPageWrapper } from '@/features/calendar/components/calendar-page-wrapper';

export const metadata = { title: 'Calendar' };

export default function CalendarRoute() {
  // LayoutContent handles stripping the shell on mobile.
  // CalendarPageWrapper handles conditional PageContainer wrapping.
  return <CalendarPageWrapper />;
}
