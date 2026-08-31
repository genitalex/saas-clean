import { CalendarPageRoute } from '@/features/calendar/components/calendar-page-route';

export const metadata = { title: 'Calendar' };

export default function CalendarRoute() {
  // On mobile: Calendar becomes its own full-screen application surface
  // On desktop: Calendar is contained within the PageContainer
  // The CalendarPageRoute component handles this conditional layout
  return <CalendarPageRoute />;
}
