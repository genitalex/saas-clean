import PageContainer from '@/components/layout/page-container';
import { CalendarPage } from '@/features/calendar/components/calendar-page';

export const metadata = { title: 'Calendar' };

export default function CalendarRoute() {
  return (
    <PageContainer
      pageTitle='Calendar'
      pageDescription='Organiza reuniones y próximos pasos del equipo.'
    >
      <CalendarPage />
    </PageContainer>
  );
}
