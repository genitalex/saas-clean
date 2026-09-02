import PageContainer from '@/components/layout/page-container';
import ActivityFeed from '@/features/activities/components/activity-feed';

export const metadata = { title: 'Dashboard: Actividad' };

export default function Page() {
  return (
    <PageContainer
      pageTitle='Actividad'
      pageDescription='La memoria viva de los cambios importantes en tu espacio de trabajo.'
    >
      <ActivityFeed />
    </PageContainer>
  );
}
