import { CalendarPageWrapper } from '@/features/calendar/components/calendar-page-wrapper';

export const metadata = { title: 'Calendar' };

type CalendarRouteProps = {
  searchParams: Promise<{
    date?: string;
    view?: string;
  }>;
};

export default async function CalendarRoute({ searchParams }: CalendarRouteProps) {
  const params = await searchParams;
  const view =
    params.view === 'day' ||
    params.view === 'agenda' ||
    params.view === 'week' ||
    params.view === 'month'
      ? params.view
      : undefined;

  return <CalendarPageWrapper initialDate={params.date} initialView={view} />;
}
