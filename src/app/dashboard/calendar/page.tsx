import PageContainer from '@/components/layout/page-container';
import { CalendarPage } from '@/features/calendar/components/calendar-page';

export const metadata = { title: 'Calendar' };

export default function CalendarRoute() {
  // No pageTitle/pageDescription here on purpose: CalendarPage renders its
  // own bespoke header (desktop title + nav, and a dedicated full-screen
  // header on mobile) so the generic page heading doesn't duplicate it or
  // eat into the "opened the calendar app" feel on small screens.
  return (
    <PageContainer>
      <CalendarPage />
    </PageContainer>
  );
}
